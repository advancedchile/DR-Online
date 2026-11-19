import { NationId, WorldEntity } from '../types/game';
import { createInitialMapEntities } from '../data/worldCatalog';

export type ClientPacket =
  | { type: 'CMD_MOVE'; x: number; z: number }
  | { type: 'CMD_ATTACK'; targetId: string }
  | { type: 'CMD_CAST_SPELL'; spellId: string; targetId?: string; x: number; z: number }
  | { type: 'CMD_COMBAT_SKILL'; skillId: string; targetId?: string }
  | { type: 'CMD_GATHER'; nodeId: string }
  | { type: 'CMD_WARP_MAP'; mapId: string; x: number; z: number }
  | { type: 'CMD_CHAT'; channel: string; text: string };

export interface IGameNetworkBridge {
  mode: 'local_sim' | 'online_ws';
  serverAddress: string;
  pingMs: number;
  connected: boolean;
  getMapEntities(mapId: string): WorldEntity[];
  setMapEntities(mapId: string, entities: WorldEntity[]): void;
  tickWorldAI(
    mapId: string,
    playerX: number,
    playerZ: number,
    onMonsterAttackPlayer: (monster: WorldEntity, damage: number) => void,
    onTamedAttackMonster: (pet: WorldEntity, target: WorldEntity, damage: number) => void,
    tameAutoAttack: boolean
  ): WorldEntity[];
}

export class LocalServerSimulator implements IGameNetworkBridge {
  public mode: 'local_sim' | 'online_ws' = 'local_sim';
  public serverAddress = '127.0.0.1:5000 (Local Emulated Server — Online Ready)';
  public pingMs = 4;
  public connected = true;

  private mapEntities: Map<string, WorldEntity[]> = new Map();
  private skbInitializedMaps: Set<string> = new Set();

  constructor() {
    this.mapEntities.set('RENES_C', createInitialMapEntities('RENES_C'));
  }

  public hasSkbEntities(mapId: string): boolean {
    return this.skbInitializedMaps.has(mapId.toUpperCase());
  }

  public registerSkbEntities(mapId: string, entities: WorldEntity[]): WorldEntity[] {
    const key = mapId.toUpperCase();
    if (!this.skbInitializedMaps.has(key) && entities.length > 0) {
      this.skbInitializedMaps.add(key);
      const baseEntities = createInitialMapEntities(mapId).filter(
        (e) => e.type === 'portal' || e.type === 'node' || e.type === 'npc'
      );
      this.mapEntities.set(mapId, [...baseEntities, ...entities]);
    }
    return this.getMapEntities(mapId);
  }

  public getMapEntities(mapId: string): WorldEntity[] {
    if (!this.mapEntities.has(mapId)) {
      this.mapEntities.set(mapId, createInitialMapEntities(mapId));
    }
    return this.mapEntities.get(mapId)!;
  }

  public setMapEntities(mapId: string, entities: WorldEntity[]): void {
    this.mapEntities.set(mapId, entities);
  }

  public tickWorldAI(
    mapId: string,
    playerX: number,
    playerZ: number,
    onMonsterAttackPlayer: (monster: WorldEntity, damage: number) => void,
    onTamedAttackMonster: (pet: WorldEntity, target: WorldEntity, damage: number) => void,
    tameAutoAttack: boolean
  ): WorldEntity[] {
    const now = Date.now();
    const list = this.getMapEntities(mapId);
    let mutated = false;

    const updated = list.map((ent) => {
      // Handle dead monster respawn
      if (ent.type === 'monster' && ent.hp <= 0) {
        if (ent.respawnAt && now >= ent.respawnAt) {
          mutated = true;
          return {
            ...ent,
            hp: ent.maxHp,
            respawnAt: undefined
          };
        }
        return ent;
      }

      // Handle gathering node regeneration
      if (ent.type === 'node' && (ent.nodeRemaining ?? 0) <= 0) {
        if (ent.respawnAt && now >= ent.respawnAt) {
          mutated = true;
          return {
            ...ent,
            nodeRemaining: 25,
            respawnAt: undefined
          };
        }
        return ent;
      }

      // Handle Tamed Pet AI following player & attacking nearby monsters
      if (ent.type === 'tamed' && ent.hp > 0) {
        const distToPlayer = Math.hypot(ent.x - playerX, ent.z - playerZ);
        let nx = ent.x;
        let nz = ent.z;
        if (distToPlayer > 3.2) {
          const angle = Math.atan2(playerZ - ent.z, playerX - ent.x);
          nx += Math.cos(angle) * 0.45;
          nz += Math.sin(angle) * 0.45;
          mutated = true;
        }
        if (tameAutoAttack) {
          const nearMob = list.find(
            (m) => m.type === 'monster' && m.hp > 0 && m.hostile && Math.hypot(m.x - nx, m.z - nz) < 4.5
          );
          if (nearMob && (!ent.attackAnimTime || now - ent.attackAnimTime > 1400)) {
            const dmg = Math.max(18, Math.floor(ent.level * 2.8 + Math.random() * 20));
            onTamedAttackMonster(ent, nearMob, dmg);
            mutated = true;
            return { ...ent, x: nx, z: nz, attackAnimTime: now };
          }
        }
        return mutated ? { ...ent, x: nx, z: nz } : ent;
      }

      // Handle Monster AI patrol & aggro
      const isStationaryDummyOrStone =
        ent.subType === 'guard_stone' ||
        ent.subType === 'spr_91' ||
        ent.subType === 'spr_92' ||
        ent.subType === 'spr_93' ||
        ent.subType === 'spr_94' ||
        ent.subType === 'spr_95' ||
        ent.subType === 'spr_96' ||
        ent.subType === 'spr_98' ||
        ent.subType === 'spr_99' ||
        ent.name.toLowerCase().includes('dummy') ||
        ent.name.toLowerCase().includes('sealstone');
      if (ent.type === 'monster' && ent.hp > 0 && !isStationaryDummyOrStone) {
        const distToPlayer = Math.hypot(ent.x - playerX, ent.z - playerZ);
        if (ent.hostile && distToPlayer <= 5.2 && distToPlayer > 1.35) {
          // Chase player
          const angle = Math.atan2(playerZ - ent.z, playerX - ent.x);
          const step = 0.24;
          mutated = true;
          return {
            ...ent,
            x: Math.max(10, Math.min(520, ent.x + Math.cos(angle) * step)),
            z: Math.max(10, Math.min(520, ent.z + Math.sin(angle) * step))
          };
        } else if (ent.hostile && distToPlayer <= 1.55) {
          // Attack player
          if (!ent.attackAnimTime || now - ent.attackAnimTime > 1650) {
            const rawDmg = Math.max(8, Math.floor(ent.level * 1.6 + Math.random() * 14));
            onMonsterAttackPlayer(ent, rawDmg);
            mutated = true;
            return {
              ...ent,
              attackAnimTime: now
            };
          }
        } else if (Math.random() < 0.08) {
          // Light idle wander
          const dx = (Math.random() - 0.5) * 0.45;
          const dz = (Math.random() - 0.5) * 0.45;
          mutated = true;
          return {
            ...ent,
            x: Math.max(10, Math.min(520, ent.x + dx)),
            z: Math.max(10, Math.min(520, ent.z + dz))
          };
        }
      }

      return ent;
    });

    if (mutated) {
      this.mapEntities.set(mapId, updated);
    }
    return updated;
  }

  public getNationColor(nation?: NationId): string {
    if (nation === 'Vyseus') return '#3b82f6';
    if (nation === 'Zypern') return '#ef4444';
    if (nation === 'Yllse') return '#f59e0b';
    return '#a8a29e';
  }
}

export const localServer = new LocalServerSimulator();
