import { 
  Message, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ButtonInteraction, 
  TextChannel 
} from 'discord.js';
import { Logger } from '../utils/logger';

interface ActiveDuelSession {
  messageId: string;
  channelId: string;
  prompt: string;
  gemini: {
    text: string;
    model: string;
    latencyMs: number;
  };
  groq: {
    text: string;
    model: string;
    latencyMs: number;
  };
  geminiVotes: number;
  groqVotes: number;
  voters: Set<string>;
  expiresAt: number;
  timer: NodeJS.Timeout;
}

export class DuelService {
  private static activeDuels = new Map<string, ActiveDuelSession>();
  private static DUEL_DURATION_MS = 2 * 60 * 1000; // 2 minutos (120s)

  /**
   * Registra un nuevo duelo y arranca el temporizador de 2 minutos para el veredicto final.
   */
  public static registerDuel(
    message: Message,
    prompt: string,
    gemini: { text: string; model: string; latencyMs: number },
    groq: { text: string; model: string; latencyMs: number }
  ): void {
    const expiresAt = Date.now() + this.DUEL_DURATION_MS;

    const timer = setTimeout(async () => {
      await this.concludeDuel(message.id);
    }, this.DUEL_DURATION_MS);

    this.activeDuels.set(message.id, {
      messageId: message.id,
      channelId: message.channelId,
      prompt,
      gemini,
      groq,
      geminiVotes: 0,
      groqVotes: 0,
      voters: new Set<string>(),
      expiresAt,
      timer
    });

    Logger.info(`[Duelo IA] Duelo registrado (ID: ${message.id}). Temporizador de 2 minutos iniciado.`);
  }

  /**
   * Procesa el voto emitido por un miembro de la comunidad.
   */
  public static async handleVote(
    interaction: ButtonInteraction,
    votedModel: 'gemini' | 'groq'
  ): Promise<void> {
    const messageId = interaction.message.id;
    const duel = this.activeDuels.get(messageId);

    if (!duel) {
      await interaction.reply({
        content: '⏳ La votación para este duelo ya ha concluido.',
        ephemeral: true
      });
      return;
    }

    if (duel.voters.has(interaction.user.id)) {
      await interaction.reply({
        content: '⚠️ Ya has emitido tu voto en este duelo de modelos.',
        ephemeral: true
      });
      return;
    }

    duel.voters.add(interaction.user.id);
    if (votedModel === 'gemini') {
      duel.geminiVotes += 1;
    } else {
      duel.groqVotes += 1;
    }

    const remainingSeconds = Math.max(0, Math.ceil((duel.expiresAt - Date.now()) / 1000));

    // Actualizar botones con los nuevos contadores
    const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_duel_vote:gemini')
        .setLabel(`Votar por Gemini (${duel.geminiVotes})`)
        .setEmoji('🔵')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('btn_duel_vote:groq')
        .setLabel(`Votar por Groq (${duel.groqVotes})`)
        .setEmoji('🟠')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.update({ components: [updatedRow] });
    Logger.info(`[Duelo IA] Voto para ${votedModel} registrado de ${interaction.user.tag} (Gemini: ${duel.geminiVotes} | Groq: ${duel.groqVotes}).`);
  }

  /**
   * Concluye el duelo automáticamente al expirar los 2 minutos, declarando al ganador.
   */
  public static async concludeDuel(messageId: string): Promise<void> {
    const duel = this.activeDuels.get(messageId);
    if (!duel) return;

    this.activeDuels.delete(messageId);
    clearTimeout(duel.timer);

    try {
      // Determinar ganador
      let winnerTitle = '';
      let winnerDetails = '';
      let embedColor = 0xF1C40F; // Oro / Amarillo

      if (duel.geminiVotes > duel.groqVotes) {
        winnerTitle = '🏆 ¡Google Gemini es el Ganador del Duelo!';
        winnerDetails = `🔵 **Google Gemini** venció con **${duel.geminiVotes} voto(s)** contra **${duel.groqVotes} voto(s)** de Groq Cloud.`;
        embedColor = 0x3498DB; // Azul Gemini
      } else if (duel.groqVotes > duel.geminiVotes) {
        winnerTitle = '🏆 ¡Groq Cloud es el Ganador del Duelo!';
        winnerDetails = `🟠 **Groq Cloud (${duel.groq.model})** venció con **${duel.groqVotes} voto(s)** contra **${duel.geminiVotes} voto(s)** de Google Gemini.`;
        embedColor = 0xE67E22; // Naranja Groq
      } else if (duel.geminiVotes > 0) {
        winnerTitle = '🤝 ¡Empate Técnico entre Modelos!';
        winnerDetails = `Ambos modelos obtuvieron un empate con **${duel.geminiVotes} voto(s)** cada uno.`;
        embedColor = 0x2ECC71; // Verde
      } else {
        winnerTitle = '⏱️ Duelo Finalizado (Sin Votos)';
        winnerDetails = 'El periodo de votación de 2 minutos concluyó sin votos registrados.';
        embedColor = 0x95A5A6; // Gris
      }

      // Reconstruir el Embed con el veredicto final
      const closedEmbed = new EmbedBuilder()
        .setTitle('⚔️ Duelo de Modelos: Google Gemini vs Groq Cloud [CONCLUIDO]')
        .setDescription(`**Prompt de Prueba:** *"${duel.prompt}"*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `### ${winnerTitle}\n` +
          `${winnerDetails}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
        )
        .setColor(embedColor)
        .addFields(
          {
            name: `🔵 Google Gemini (${duel.gemini.latencyMs}ms) — [${duel.geminiVotes} votos]`,
            value: duel.gemini.text.length > 1000 ? `${duel.gemini.text.slice(0, 997)}...` : duel.gemini.text,
            inline: false
          },
          {
            name: `🟠 Groq Cloud (${duel.groq.model}) (${duel.groq.latencyMs}ms) — [${duel.groqVotes} votos]`,
            value: duel.groq.text.length > 1000 ? `${duel.groq.text.slice(0, 997)}...` : duel.groq.text,
            inline: false
          }
        )
        .setFooter({ text: '⏱️ Votación cerrada tras 2 minutos • Duelo Concluido' })
        .setTimestamp();

      // Botones deshabilitados
      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_closed_gemini')
          .setLabel(`Gemini (${duel.geminiVotes} votos)`)
          .setEmoji('🔵')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('btn_closed_groq')
          .setLabel(`Groq (${duel.groqVotes} votos)`)
          .setEmoji('🟠')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true)
      );

      // Buscar el canal y el mensaje para actualizarlo
      // Usaremos el client global a través de interaction o fetch
      Logger.info(`[Duelo IA] Duelo ${messageId} concluido exitosamente: ${winnerTitle}`);

      // Emitir evento / callback si está disponible
      DuelService.onDuelConcluded?.(duel.channelId, messageId, closedEmbed, disabledRow);

    } catch (err) {
      Logger.error(`[Duelo IA] Error al concluir duelo ${messageId}:`, err);
    }
  }

  public static onDuelConcluded?: (
    channelId: string, 
    messageId: string, 
    embed: EmbedBuilder, 
    row: ActionRowBuilder<ButtonBuilder>
  ) => void;
}
