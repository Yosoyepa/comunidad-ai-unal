import * as fs from 'fs';
import * as path from 'path';
import { GuildMember, Role } from 'discord.js';
import { Logger } from '../utils/logger';

export interface HermesRecord {
  userId: string;
  points: number;
  givenCount: number;
  receivedCount: number;
  lastGivenTimestamp?: number;
  reasons: string[];
}

export interface HermesTier {
  roleName: string;
  minPoints: number;
  badge: string;
  description: string;
}

export const HERMES_TIERS: HermesTier[] = [
  {
    roleName: '💎 AGI Pioneer',
    minPoints: 500,
    badge: '💎',
    description: 'Nivel 6 (Supremo): 500+ Puntos (Referente y líder técnico)'
  },
  {
    roleName: '🥇 SOTA Architect',
    minPoints: 300,
    badge: '🥇',
    description: 'Nivel 5: 300 a 499 Puntos (Arquitectura y mentoría avanzada)'
  },
  {
    roleName: '⚙️ Senior AI Engineer',
    minPoints: 160,
    badge: '⚙️',
    description: 'Nivel 4: 160 a 299 Puntos (Ingeniería avanzada y fine-tuning)'
  },
  {
    roleName: '💻 Fine-Tuned Developer',
    minPoints: 80,
    badge: '💻',
    description: 'Nivel 3: 80 a 159 Puntos (Desarrollador con aplicaciones funcionales)'
  },
  {
    roleName: '⚡ Few-Shot Builder',
    minPoints: 30,
    badge: '⚡',
    description: 'Nivel 2: 30 a 79 Puntos (Constructor activo en crecimiento)'
  },
  {
    roleName: '🥉 Prompt Apprentice',
    minPoints: 0,
    badge: '🥉',
    description: 'Nivel 1 (Inicial): 0 a 29 Puntos (Explorando la comunidad)'
  }
];

export class HermesPointsService {
  private static dbPath = path.join(process.cwd(), 'data', 'hermes.json');
  private static cooldownMs = 30 * 60 * 1000; // 30 minutos de cooldown para agradecer

  private static ensureDataDir(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify({}, null, 2), 'utf-8');
    }
  }

  private static loadData(): Record<string, HermesRecord> {
    this.ensureDataDir();
    try {
      const raw = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      Logger.error('Error leyendo la base de datos Hermes:', e);
      return {};
    }
  }

  private static saveData(data: Record<string, HermesRecord>): void {
    this.ensureDataDir();
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      Logger.error('Error guardando en la base de datos Hermes:', e);
    }
  }

  /**
   * Determina el tier correspondiente según los puntos acumulados.
   */
  public static getTierForPoints(points: number): HermesTier {
    for (const tier of HERMES_TIERS) {
      if (points >= tier.minPoints) {
        return tier;
      }
    }
    return HERMES_TIERS[HERMES_TIERS.length - 1];
  }

  /**
   * Sincroniza y auto-promueve el rol de prestigio Hermes en Discord.
   */
  public static async syncPrestigeRole(member: GuildMember, points: number): Promise<{ upgraded: boolean; newTier?: HermesTier }> {
    try {
      const targetTier = this.getTierForPoints(points);
      const tierRoleNames = HERMES_TIERS.map((t) => t.roleName.toLowerCase());

      const currentTierRole = member.roles.cache.find((r) =>
        tierRoleNames.includes(r.name.toLowerCase())
      );

      const targetRole = member.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === targetTier.roleName.toLowerCase()
      );

      if (!targetRole) return { upgraded: false };

      if (!currentTierRole || currentTierRole.id !== targetRole.id) {
        // Remover otros roles de prestigio
        const rolesToRemove = member.roles.cache.filter((r) =>
          tierRoleNames.includes(r.name.toLowerCase()) && r.id !== targetRole.id
        );
        for (const [, r] of rolesToRemove) {
          await member.roles.remove(r, 'Actualización de Rango Hermes');
        }

        await member.roles.add(targetRole, `Promoción de Rango Hermes: ${targetTier.roleName}`);
        Logger.success(`Usuario ${member.user.tag} promovido al rol de prestigio ${targetRole.name}`);
        return { upgraded: true, newTier: targetTier };
      }

      return { upgraded: false };
    } catch (err) {
      Logger.warn(`No se pudo sincronizar rol de prestigio Hermes para ${member.user.tag}:`, err);
      return { upgraded: false };
    }
  }

  /**
   * Otorga puntos directamente a un usuario (por trivia, retos o aportes).
   */
  public static async awardDirectPoints(
    userId: string, 
    amount: number, 
    reason: string, 
    member?: GuildMember
  ): Promise<{ newPoints: number; upgraded: boolean; newTier?: HermesTier }> {
    const data = this.loadData();
    const record: HermesRecord = data[userId] || {
      userId,
      points: 0,
      givenCount: 0,
      receivedCount: 0,
      reasons: []
    };

    record.points += amount;
    record.receivedCount += 1;
    record.reasons.push(reason.slice(0, 150));
    data[userId] = record;
    this.saveData(data);

    let upgradeResult: { upgraded: boolean; newTier?: HermesTier } = { upgraded: false };
    if (member) {
      upgradeResult = await this.syncPrestigeRole(member, record.points);
    }

    return { newPoints: record.points, upgraded: upgradeResult.upgraded, newTier: upgradeResult.newTier };
  }

  /**
   * Otorga Puntos Hermes de un usuario a otro con cooldown y validación de auto-reconocimiento.
   */
  public static async addPoints(
    giverId: string, 
    receiverId: string, 
    reason: string,
    receiverMember?: GuildMember
  ): Promise<{ success: boolean; message: string; receiverPoints?: number; upgraded?: boolean; newTier?: HermesTier }> {
    if (giverId === receiverId) {
      return { 
        success: false, 
        message: '🦉 ¡Un mochuelo no puede otorgarse sabiduría a sí mismo! Reconoce los aportes de tus compañeros.' 
      };
    }

    const data = this.loadData();
    const now = Date.now();

    const giverRecord: HermesRecord = data[giverId] || {
      userId: giverId,
      points: 0,
      givenCount: 0,
      receivedCount: 0,
      reasons: []
    };

    if (giverRecord.lastGivenTimestamp && (now - giverRecord.lastGivenTimestamp) < this.cooldownMs) {
      const remainingMin = Math.ceil((this.cooldownMs - (now - giverRecord.lastGivenTimestamp)) / 60000);
      return {
        success: false,
        message: `⏳ Debes esperar **${remainingMin} minutos** antes de otorgar otro reconocimiento Hermes.`
      };
    }

    const receiverRecord: HermesRecord = data[receiverId] || {
      userId: receiverId,
      points: 0,
      givenCount: 0,
      receivedCount: 0,
      reasons: []
    };

    receiverRecord.points += 5; // Cada agradecimiento suma +5 Puntos Hermes
    receiverRecord.receivedCount += 1;
    receiverRecord.reasons.push(reason.slice(0, 150));

    giverRecord.givenCount += 1;
    giverRecord.lastGivenTimestamp = now;

    data[giverId] = giverRecord;
    data[receiverId] = receiverRecord;
    this.saveData(data);

    let upgradeResult: { upgraded: boolean; newTier?: HermesTier } = { upgraded: false };
    if (receiverMember) {
      upgradeResult = await this.syncPrestigeRole(receiverMember, receiverRecord.points);
    }

    return {
      success: true,
      message: `🏛️ **¡Reconocimiento Hermes Otorgado!** Has concedido **+5 Puntos Hermes de Sabiduría** a <@${receiverId}> por: *"${reason}"*.`,
      receiverPoints: receiverRecord.points,
      upgraded: upgradeResult.upgraded,
      newTier: upgradeResult.newTier
    };
  }

  /**
   * Retorna el perfil y rango académico UNAL del usuario.
   */
  public static getProfile(userId: string): { record: HermesRecord; tier: HermesTier; nextTier?: HermesTier; pointsToNext: number } {
    const data = this.loadData();
    const record: HermesRecord = data[userId] || {
      userId,
      points: 0,
      givenCount: 0,
      receivedCount: 0,
      reasons: []
    };

    const currentTier = this.getTierForPoints(record.points);
    const tierIndex = HERMES_TIERS.findIndex((t) => t.roleName === currentTier.roleName);
    const nextTier = tierIndex > 0 ? HERMES_TIERS[tierIndex - 1] : undefined;
    const pointsToNext = nextTier ? Math.max(0, nextTier.minPoints - record.points) : 0;

    return { record, tier: currentTier, nextTier, pointsToNext };
  }

  /**
   * Retorna el leaderboard ordenado por Puntos Hermes.
   */
  public static getLeaderboard(limit = 10): Array<{ record: HermesRecord; tier: HermesTier }> {
    const data = this.loadData();
    return Object.values(data)
      .sort((a, b) => b.points - a.points)
      .slice(0, limit)
      .map((record) => ({
        record,
        tier: this.getTierForPoints(record.points)
      }));
  }
}
