export interface PortalCharacter {
  name: string;
  level: number;
  className: string;
  mapName: string;
}

export interface PortalAccount {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  characters: PortalCharacter[];
}

export interface AuthActionResult {
  ok: boolean;
  error?: string;
  account?: PortalAccount;
  verificationSent?: boolean;
  email?: string;
  idToken?: string;
}

const DEFAULT_DB_URL = 'https://dr-online-fc60d-default-rtdb.firebaseio.com';
const CLASS_NAMES = ['Warrior', 'Thief', 'Archer', 'Wizard', 'Priest'];

function getDbUrl(): string {
  const envUrl = (import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined) || DEFAULT_DB_URL;
  return envUrl.replace(/\/+$/, '');
}

function getApiKey(): string {
  return ((import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || '').trim();
}

export function isFirebaseEmailAuthConfigured(): boolean {
  return Boolean(getApiKey());
}

function sanitizeKey(username: string): string {
  return username.trim().toLowerCase().replace(/[.#$\[\]\/]/g, '_');
}

function toPublicAccount(raw: any, fallbackEmail = '', verified = true): PortalAccount {
  const chars = Array.isArray(raw?.characters) ? raw.characters : [];
  return {
    id: raw?.id || '',
    email: raw?.email || fallbackEmail,
    emailVerified: Boolean(verified),
    createdAt: raw?.createdAt || '',
    characters: chars
      .filter((c: any) => Boolean(c && c.name))
      .map((c: any) => ({
        name: String(c.name),
        level: Number(c.level || 1),
        className: CLASS_NAMES[Number(c.cla || 0)] || 'Warrior',
        mapName: String(c.mapName || 'SCHOLIUM')
      }))
  };
}

async function fetchAccountRecord(username: string): Promise<any | null> {
  const key = sanitizeKey(username);
  const res = await fetch(`${getDbUrl()}/accounts/${encodeURIComponent(key)}.json`);
  if (!res.ok) return null;
  const data = await res.json();
  return data && typeof data === 'object' ? data : null;
}

async function findAccountByEmail(email: string): Promise<any | null> {
  const res = await fetch(`${getDbUrl()}/accounts.json`);
  if (!res.ok) return null;
  const all = await res.json();
  if (!all || typeof all !== 'object') return null;
  const target = email.trim().toLowerCase();
  for (const val of Object.values<any>(all)) {
    if (val && typeof val.email === 'string' && val.email.trim().toLowerCase() === target) {
      return val;
    }
  }
  return null;
}

async function saveAccountRecord(username: string, record: Record<string, unknown>): Promise<boolean> {
  const key = sanitizeKey(username);
  const res = await fetch(`${getDbUrl()}/accounts/${encodeURIComponent(key)}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  return res.ok;
}

async function patchAccountRecord(username: string, patch: Record<string, unknown>): Promise<void> {
  const key = sanitizeKey(username);
  await fetch(`${getDbUrl()}/accounts/${encodeURIComponent(key)}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  });
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sendVerificationEmail(idToken: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) return { ok: false, error: 'FIREBASE_API_KEY_MISSING' };

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'VERIFY_EMAIL',
        idToken
      })
    }
  );
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data?.error?.message || 'EMAIL_SEND_FAILED' };
  }
  return { ok: true };
}

export async function registerAccountWithEmail(params: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const username = params.username.trim();
  const email = params.email.trim();
  const password = params.password;

  if (!/^[a-zA-Z0-9_]{4,14}$/.test(username)) {
    return { ok: false, error: 'INVALID_USERNAME' };
  }
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'INVALID_EMAIL' };
  }
  if (password.length < 6 || password.length > 20) {
    return { ok: false, error: 'INVALID_PASSWORD' };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, error: 'FIREBASE_API_KEY_MISSING' };
  }

  try {
    const existing = await fetchAccountRecord(username);
    if (existing) {
      return { ok: false, error: 'USERNAME_EXISTS' };
    }

    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        })
      }
    );
    const signUpData = await signUpRes.json();
    if (!signUpRes.ok) {
      const code = String(signUpData?.error?.message || '');
      if (code.includes('EMAIL_EXISTS')) return { ok: false, error: 'EMAIL_EXISTS' };
      if (code.includes('INVALID_EMAIL')) return { ok: false, error: 'INVALID_EMAIL' };
      if (code.includes('WEAK_PASSWORD')) return { ok: false, error: 'INVALID_PASSWORD' };
      if (code.includes('OPERATION_NOT_ALLOWED')) return { ok: false, error: 'EMAIL_AUTH_DISABLED' };
      return { ok: false, error: code || 'REGISTER_FAILED' };
    }

    const idToken: string = signUpData.idToken;
    const uid: string = signUpData.localId;

    const verifyResult = await sendVerificationEmail(idToken);
    if (!verifyResult.ok) {
      return { ok: false, error: verifyResult.error || 'EMAIL_SEND_FAILED' };
    }

    const passwordHash = await sha256Hex(`dr-online:${password}`);

    // Nation is intentionally 0 here: the player chooses their nation in-game when creating a character.
    await saveAccountRecord(username, {
      id: username,
      email,
      uid,
      emailVerified: false,
      passwordHash,
      nation: 0,
      createdAt: new Date().toISOString(),
      characters: [null, null, null, null]
    });

    return {
      ok: true,
      verificationSent: true,
      email,
      idToken
    };
  } catch {
    return { ok: false, error: 'NETWORK_ERROR' };
  }
}

export async function loginAccountWithEmail(
  usernameOrEmailRaw: string,
  password: string
): Promise<AuthActionResult> {
  const input = usernameOrEmailRaw.trim();
  if (!input || !password) {
    return { ok: false, error: 'MISSING_CREDENTIALS' };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, error: 'FIREBASE_API_KEY_MISSING' };
  }

  try {
    let record: any | null = null;
    let email = input;

    if (!input.includes('@')) {
      record = await fetchAccountRecord(input);
      if (!record || !record.email) {
        return { ok: false, error: 'ACCOUNT_NOT_FOUND' };
      }
      email = String(record.email);
    }

    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        })
      }
    );
    const signInData = await signInRes.json();
    if (!signInRes.ok) {
      const code = String(signInData?.error?.message || '');
      if (
        code.includes('INVALID_PASSWORD') ||
        code.includes('INVALID_LOGIN_CREDENTIALS') ||
        code.includes('EMAIL_NOT_FOUND')
      ) {
        return { ok: false, error: 'WRONG_PASSWORD' };
      }
      if (code.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
        return { ok: false, error: 'TOO_MANY_ATTEMPTS' };
      }
      return { ok: false, error: code || 'WRONG_PASSWORD' };
    }

    const idToken: string = signInData.idToken;
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }
    );
    const lookupData = await lookupRes.json();
    const firebaseUser = lookupData?.users?.[0];
    const emailVerified = Boolean(firebaseUser?.emailVerified);

    if (!emailVerified) {
      return {
        ok: false,
        error: 'EMAIL_NOT_VERIFIED',
        email,
        idToken
      };
    }

    if (!record) {
      record = await findAccountByEmail(email);
    }

    if (record?.id) {
      if (!record.emailVerified) {
        await patchAccountRecord(record.id, { emailVerified: true });
      }
      return {
        ok: true,
        account: toPublicAccount(record, email, true)
      };
    }

    return {
      ok: true,
      account: {
        id: email.split('@')[0],
        email,
        emailVerified: true,
        createdAt: '',
        characters: []
      }
    };
  } catch {
    return { ok: false, error: 'NETWORK_ERROR' };
  }
}

export async function requestPasswordReset(emailRaw: string): Promise<{ ok: boolean; error?: string }> {
  const email = emailRaw.trim();
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'INVALID_EMAIL' };
  }
  const apiKey = getApiKey();
  if (!apiKey) return { ok: false, error: 'FIREBASE_API_KEY_MISSING' };

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email
        })
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.error?.message || 'RESET_FAILED' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'NETWORK_ERROR' };
  }
}

export async function updateAccountEmail(params: {
  accountId: string;
  currentEmail: string;
  currentPassword: string;
  newEmail: string;
}): Promise<{ ok: boolean; error?: string; verificationPending?: boolean; newEmail?: string }> {
  const newEmail = params.newEmail.trim();
  if (!newEmail || !newEmail.includes('@')) {
    return { ok: false, error: 'INVALID_EMAIL' };
  }
  if (!params.currentPassword) {
    return { ok: false, error: 'MISSING_CREDENTIALS' };
  }
  const apiKey = getApiKey();
  if (!apiKey) return { ok: false, error: 'FIREBASE_API_KEY_MISSING' };

  try {
    // Re-authenticate to get a fresh idToken
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: params.currentEmail,
          password: params.currentPassword,
          returnSecureToken: true
        })
      }
    );
    const signInData = await signInRes.json();
    if (!signInRes.ok) {
      return { ok: false, error: 'WRONG_PASSWORD' };
    }
    const idToken: string = signInData.idToken;

    // Try direct update first
    const updateRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          email: newEmail,
          returnSecureToken: true
        })
      }
    );
    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      const code = String(updateData?.error?.message || '');
      if (code.includes('EMAIL_EXISTS')) return { ok: false, error: 'EMAIL_EXISTS' };
      if (code.includes('INVALID_EMAIL')) return { ok: false, error: 'INVALID_EMAIL' };
      // Firebase projects with Email Enumeration Protection require VERIFY_AND_CHANGE_EMAIL
      if (code.includes('OPERATION_NOT_ALLOWED')) {
        const verifyChangeRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestType: 'VERIFY_AND_CHANGE_EMAIL',
              idToken,
              newEmail
            })
          }
        );
        const verifyChangeData = await verifyChangeRes.json();
        if (!verifyChangeRes.ok) {
          const vCode = String(verifyChangeData?.error?.message || '');
          if (vCode.includes('EMAIL_EXISTS')) return { ok: false, error: 'EMAIL_EXISTS' };
          return { ok: false, error: vCode || 'EMAIL_UPDATE_FAILED' };
        }
        await patchAccountRecord(params.accountId, { email: newEmail });
        return { ok: true, verificationPending: true, newEmail };
      }
      return { ok: false, error: code || 'EMAIL_UPDATE_FAILED' };
    }

    // Update succeeded directly: send verification link to the new email and update RTDB
    if (updateData.idToken) {
      await sendVerificationEmail(updateData.idToken).catch(() => {});
    }
    await patchAccountRecord(params.accountId, { email: newEmail });
    return { ok: true, verificationPending: false, newEmail };
  } catch {
    return { ok: false, error: 'NETWORK_ERROR' };
  }
}

export async function updateAccountPassword(params: {
  accountId: string;
  currentEmail: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!params.currentPassword) {
    return { ok: false, error: 'MISSING_CREDENTIALS' };
  }
  if (params.newPassword.length < 6 || params.newPassword.length > 20) {
    return { ok: false, error: 'INVALID_PASSWORD' };
  }
  const apiKey = getApiKey();
  if (!apiKey) return { ok: false, error: 'FIREBASE_API_KEY_MISSING' };

  try {
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: params.currentEmail,
          password: params.currentPassword,
          returnSecureToken: true
        })
      }
    );
    const signInData = await signInRes.json();
    if (!signInRes.ok) {
      return { ok: false, error: 'WRONG_PASSWORD' };
    }
    const idToken: string = signInData.idToken;

    const updateRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          password: params.newPassword,
          returnSecureToken: true
        })
      }
    );
    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      const code = String(updateData?.error?.message || '');
      if (code.includes('WEAK_PASSWORD')) return { ok: false, error: 'INVALID_PASSWORD' };
      return { ok: false, error: code || 'PASSWORD_UPDATE_FAILED' };
    }

    const passwordHash = await sha256Hex(`dr-online:${params.newPassword}`);
    await patchAccountRecord(params.accountId, { passwordHash });
    return { ok: true };
  } catch {
    return { ok: false, error: 'NETWORK_ERROR' };
  }
}
