import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

export interface HermesRecord {
  userId: string;
  points: number;
  givenCount: number;
  receivedCount: number;
  lastGivenTimestamp?: number;
  reasons: string[];
}

export class HermesPointsService {
  private static dbPath = path.join(process.cwd(), 'data', 'hermes.json');
  private static cooldownMs = 60 * 60 * 1000; // 1 hora de cooldown por usuario

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
   * Otorga Puntos Hermes (+1 Búho de Sabiduría) de un usuario a otro.
   */
  public static addPoints(
    giverId: string, 
    receiverId: string, 
    reason: string
  ): { success: boolean; message: string; receiverPoints?: number } {
    if (giverId === receiverId) {
      return { 
        success: false, 
        message: '🦉 ¡Un mochuelo no puede otorgarse sabiduría a sí mismo! Agradece a otros compañeros de la academia.' 
      };
    }

    const data = this.loadData();
    const now = Date.now();

    // Validar cooldown del dador
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

    // Actualizar receptor
    const receiverRecord: HermesRecord = data[receiverId] || {
      userId: receiverId,
      points: 0,
      givenCount: 0,
      receivedCount: 0,
      reasons: []
    };

    receiverRecord.points += 1;
    receiverRecord.receivedCount += 1;
    receiverRecord.reasons.push(reason.slice(0, 150));

    // Actualizar dador
    giverRecord.givenCount += 1;
    giverRecord.lastGivenTimestamp = now;

    data[giverId] = giverRecord;
    data[receiverId] = receiverRecord;

    this.saveData(data);

    Logger.info(`Punto Hermes otorgado de ${giverId} a ${receiverId}. Motivo: ${reason}`);

    return {
      success: true,
      message: `🏛️ **¡Reconocimiento Hermes Otorgado!** Has otorgado **+1 Búho de Sabiduría (Punto Hermes)** por su aporte a la academia.`,
      receiverPoints: receiverRecord.points
    };
  }

  /**
   * Retorna el perfil y rango académico UNAL del usuario.
   */
  public static getProfile(userId: string): { record: HermesRecord; rankTitle: string; emoji: string } {
    const data = this.loadData();
    const record: HermesRecord = data[userId] || {
      userId,
      points: 0,
      givenCount: 0,
      receivedCount: 0,
      reasons: []
    };

    let rankTitle = 'Mochuelo Novato (Iniciando en la Academia)';
    let emoji = '🐣';

    if (record.points >= 25) {
      rankTitle = 'Catedrático Emérito UNAL (Sabiduría Suprema)';
      emoji = '👑';
    } else if (record.points >= 15) {
      rankTitle = 'Sabio de la Academia UNAL (Investigador Senior)';
      emoji = '🏛️';
    } else if (record.points >= 8) {
      rankTitle = 'Búho Investigador Hermes';
      emoji = '🦉';
    } else if (record.points >= 3) {
      rankTitle = 'Mochuelo Aplicado (Aportante Activo)';
      emoji = '📚';
    }

    return { record, rankTitle, emoji };
  }

  /**
   * Retorna el leaderboard ordenado por Puntos Hermes.
   */
  public static getLeaderboard(limit = 10): HermesRecord[] {
    const data = this.loadData();
    return Object.values(data)
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }
}
