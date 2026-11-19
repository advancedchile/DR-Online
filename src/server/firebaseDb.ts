import fs from 'node:fs';
import path from 'node:path';

export interface FirebaseConfig {
  databaseUrl: string;
  databaseSecret: string;
  projectId: string;
  apiKey: string;
}

function readEnvFileVars(): Record<string, string> {
  const out: Record<string, string> = {};
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    const full = path.resolve(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    try {
      const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
      for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq <= 0) continue;
        const key = line.slice(0, eq).trim();
        let val = line.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in out)) out[key] = val;
      }
    } catch {
      // ignore read errors
    }
  }
  return out;
}

export class FirebaseGameDb {
  private cfg: FirebaseConfig;
  private seededTables = false;

  constructor() {
    const fileEnv = readEnvFileVars();
    this.cfg = {
      databaseUrl: (process.env.FIREBASE_DATABASE_URL || fileEnv.FIREBASE_DATABASE_URL || '').replace(/\/+$/, ''),
      databaseSecret: process.env.FIREBASE_DATABASE_SECRET || fileEnv.FIREBASE_DATABASE_SECRET || '',
      projectId: process.env.FIREBASE_PROJECT_ID || fileEnv.FIREBASE_PROJECT_ID || '',
      apiKey: process.env.FIREBASE_API_KEY || fileEnv.FIREBASE_API_KEY || ''
    };
  }

  public isEnabled(): boolean {
    return Boolean(this.cfg.databaseUrl || this.cfg.projectId);
  }

  private rtdbUrl(subPath: string): string {
    const clean = subPath.replace(/^\/+/, '');
    const auth = this.cfg.databaseSecret ? `?auth=${encodeURIComponent(this.cfg.databaseSecret)}` : '';
    return `${this.cfg.databaseUrl}/${clean}.json${auth}`;
  }

  private firestoreDocUrl(collection: string, docId: string): string {
    const keyParam = this.cfg.apiKey ? `?key=${encodeURIComponent(this.cfg.apiKey)}` : '';
    return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      this.cfg.projectId
    )}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(docId)}${keyParam}`;
  }

  public async loadAllAccounts(): Promise<Record<string, any> | null> {
    if (!this.isEnabled()) return null;

    try {
      if (this.cfg.databaseUrl) {
        const res = await fetch(this.rtdbUrl('accounts'));
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') return data as Record<string, any>;
        }
      } else if (this.cfg.projectId) {
        const keyParam = this.cfg.apiKey ? `?key=${encodeURIComponent(this.cfg.apiKey)}` : '';
        const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
          this.cfg.projectId
        )}/databases/(default)/documents/accounts${keyParam}`;
        const res = await fetch(url);
        if (res.ok) {
          const data: any = await res.json();
          const out: Record<string, any> = {};
          for (const doc of data.documents || []) {
            const id = String(doc.name || '').split('/').pop() || '';
            const jsonStr = doc.fields?.payload?.stringValue;
            if (id && jsonStr) {
              out[id] = JSON.parse(jsonStr);
            }
          }
          return out;
        }
      }
    } catch (err) {
      console.warn('[FirebaseGameDb] Failed to load accounts from Firebase:', err);
    }
    return null;
  }

  public async saveAllAccounts(accountsObj: Record<string, any>): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      if (this.cfg.databaseUrl) {
        await fetch(this.rtdbUrl('accounts'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountsObj)
        });
      } else if (this.cfg.projectId) {
        await Promise.all(
          Object.entries(accountsObj).map(([id, acc]) =>
            fetch(this.firestoreDocUrl('accounts', id), {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fields: {
                  payload: { stringValue: JSON.stringify(acc) },
                  updatedAt: { integerValue: String(Date.now()) }
                }
              })
            })
          )
        );
      }
    } catch (err) {
      console.warn('[FirebaseGameDb] Failed to sync accounts to Firebase:', err);
    }
  }

  public async syncReferenceDatabaseOnce(sqlDb: Record<string, any>): Promise<void> {
    if (!this.isEnabled() || this.seededTables) return;
    this.seededTables = true;

    try {
      if (this.cfg.databaseUrl) {
        // Check if already seeded in Realtime Database
        const checkRes = await fetch(this.rtdbUrl('game_meta/seeded'));
        if (checkRes.ok && (await checkRes.json()) === true) return;

        await fetch(this.rtdbUrl('game_tables'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            npcTable: sqlDb.npcTable || {},
            mapInfoTable: sqlDb.mapInfoTable || {},
            abilityDivide: sqlDb.abilityDivide || {},
            lv2Exp: sqlDb.lv2Exp || []
          })
        });
        await fetch(this.rtdbUrl('game_meta/seeded'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: 'true'
        });
        console.log('[FirebaseGameDb] Synced Dragon Raja reference SQL tables to Firebase Realtime Database.');
      } else if (this.cfg.projectId) {
        for (const tableKey of ['mapInfoTable', 'abilityDivide', 'lv2Exp', 'npcTable']) {
          await fetch(this.firestoreDocUrl('game_tables', tableKey), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                payload: { stringValue: JSON.stringify(sqlDb[tableKey] || {}) },
                updatedAt: { integerValue: String(Date.now()) }
              }
            })
          });
        }
        console.log('[FirebaseGameDb] Synced Dragon Raja reference SQL tables to Cloud Firestore.');
      }
    } catch (err) {
      console.warn('[FirebaseGameDb] Failed to seed game reference tables to Firebase:', err);
    }
  }
}
