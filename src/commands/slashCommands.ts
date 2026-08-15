import { 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits
} from 'discord.js';
import { Logger } from '../utils/logger';
import { HermesPointsService } from '../services/hermesPointsService';
import { AIAssistantService } from '../services/aiAssistantService';
import { TicketHandler } from '../handlers/ticketHandler';

export const COMMANDS_DATA = [
  // 1. Preguntar a la IA
  new SlashCommandBuilder()
    .setName('preguntar-ia')
    .setDescription('Consulta dudas técnicas a un modelo de IA (LLMs, RAG, Visión, PyTorch, etc.)')
    .addStringOption((opt) =>
      opt.setName('pregunta')
        .setDescription('Tu duda o consulta técnica')
        .setRequired(true)
    ),

  // 2. Resumir Paper
  new SlashCommandBuilder()
    .setName('resumir-paper')
    .setDescription('Genera un resumen técnico de un paper o abstract de investigación')
    .addStringOption((opt) =>
      opt.setName('contenido')
        .setDescription('Texto del abstract, link de arXiv o temática del paper')
        .setRequired(true)
    ),

  // 3. Agradecer / Puntos Hermes UNAL
  new SlashCommandBuilder()
    .setName('agradecer')
    .setDescription('Otorga +1 Punto Hermes / 🦉 Búho de Sabiduría a un compañero por su ayuda')
    .addUserOption((opt) =>
      opt.setName('usuario')
        .setDescription('El miembro al que deseas agradecer')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('motivo')
        .setDescription('¿En qué te ayudó o qué aporte técnico realizó?')
        .setRequired(true)
    ),

  // 4. Perfil Hermes UNAL
  new SlashCommandBuilder()
    .setName('perfil-hermes')
    .setDescription('Consulta el rango académico y Puntos Hermes de un miembro')
    .addUserOption((opt) =>
      opt.setName('usuario')
        .setDescription('Miembro a consultar (opcional, por defecto tú)')
        .setRequired(false)
    ),

  // 5. Ranking Hermes UNAL
  new SlashCommandBuilder()
    .setName('ranking-hermes')
    .setDescription('Tabla de honor con los miembros más destacados de la academia'),

  // 6. Panel de Tickets (Admin)
  new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('[Admin] Despliega el panel de solicitud de tickets en el canal actual')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

export class SlashCommandHandler {
  /**
   * Registra los comandos slash en el servidor mediante la API REST de Discord.
   */
  public static async registerCommands(botToken: string, clientId: string, guildId: string): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(botToken);

    try {
      Logger.info('Registrando comandos Slash (/)...');
      const body = COMMANDS_DATA.map((cmd) => cmd.toJSON());

      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body }
      );

      Logger.success(`Se registraron ${COMMANDS_DATA.length} comandos Slash en el servidor.`);
    } catch (err) {
      Logger.error('Error registrando comandos Slash:', err);
    }
  }

  /**
   * Ejecuta el comando slash invocado por un usuario.
   */
  public static async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const { commandName } = interaction;

    try {
      // -----------------------------------------------------------
      // COMANDO: /preguntar-ia
      // -----------------------------------------------------------
      if (commandName === 'preguntar-ia') {
        const question = interaction.options.getString('pregunta', true);
        const rateLimit = AIAssistantService.checkRateLimit(interaction.user.id);

        if (!rateLimit.allowed) {
          await interaction.reply({
            content: `⏳ Has alcanzado el límite de consultas por usuario (máximo 3 cada 5 min). Por favor espera **${rateLimit.waitSeconds} segundos** para proteger la cuota de la comunidad.`,
            ephemeral: true
          });
          return;
        }

        await interaction.deferReply();
        const result = await AIAssistantService.queryAIWithCascade(
          question,
          'Eres un asistente de IA para una comunidad técnica de desarrolladores e investigadores de la UNAL. Sé claro, conciso y fundamenta tus respuestas con código o teoría sólida.'
        );

        const embed = new EmbedBuilder()
          .setTitle('🤖 Asistente de Inteligencia Artificial')
          .setDescription(`**Pregunta:** ${question}\n\n${result.text.slice(0, 4000)}`)
          .setColor(0x3498DB)
          .setFooter({ 
            text: `⚡ Proveedor: ${result.provider} (${result.model}) • ${result.latencyMs}ms • Solicitado por ${interaction.user.tag}` 
          })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // -----------------------------------------------------------
      // COMANDO: /resumir-paper
      // -----------------------------------------------------------
      if (commandName === 'resumir-paper') {
        const content = interaction.options.getString('contenido', true);
        const rateLimit = AIAssistantService.checkRateLimit(interaction.user.id);

        if (!rateLimit.allowed) {
          await interaction.reply({
            content: `⏳ Límite de consultas alcanzado. Espera **${rateLimit.waitSeconds} segundos**.`,
            ephemeral: true
          });
          return;
        }

        await interaction.deferReply();
        const prompt = `Por favor analiza y resume el siguiente paper o temática de IA:\n"${content}"\n\nEstructura tu respuesta en:\n1. 🎯 Objetivo Principal\n2. 🔬 Metodología / Arquitectura Clave\n3. 📊 Resultados / Hallazgos Principales\n4. 💡 Impacto y Aplicación Práctica`;
        const result = await AIAssistantService.queryAIWithCascade(prompt);

        const embed = new EmbedBuilder()
          .setTitle('📄 Resumen Técnico de Paper de IA')
          .setDescription(result.text.slice(0, 4000))
          .setColor(0x9B59B6)
          .setFooter({ 
            text: `⚡ ${result.provider} • ${result.latencyMs}ms • «Inter Aulas Academiæ Quære Verum»` 
          })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // -----------------------------------------------------------
      // COMANDO: /agradecer (Puntos Hermes UNAL)
      // -----------------------------------------------------------
      if (commandName === 'agradecer') {
        const targetUser = interaction.options.getUser('usuario', true);
        const reason = interaction.options.getString('motivo', true);

        const result = HermesPointsService.addPoints(interaction.user.id, targetUser.id, reason);

        if (!result.success) {
          await interaction.reply({ content: result.message, ephemeral: true });
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle('🦉 Reconocimiento Hermes de la Academia UNAL')
          .setDescription(
            `¡<@${interaction.user.id}> ha otorgado **+1 Punto Hermes / Búho de Sabiduría** a <@${targetUser.id}>!\n\n` +
            `**📜 Motivo:** *"${reason}"*\n\n` +
            `*«Inter Aulas Academiæ Quære Verum»* — Total acumulado: **${result.receiverPoints} Puntos Hermes**.`
          )
          .setColor(0x00A859) // Verde UNAL
          .setFooter({ text: 'Sistema de Reconocimiento y Sabiduría Hermes' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        return;
      }

      // -----------------------------------------------------------
      // COMANDO: /perfil-hermes
      // -----------------------------------------------------------
      if (commandName === 'perfil-hermes') {
        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const profile = HermesPointsService.getProfile(targetUser.id);

        const embed = new EmbedBuilder()
          .setTitle(`${profile.emoji} Perfil Académico Hermes - ${targetUser.username}`)
          .setDescription(`**Rango Académico:** \`${profile.rankTitle}\`\n\n*«Busca la verdad en las aulas de la Academia»*`)
          .setColor(0x00A859)
          .addFields(
            { name: '🦉 Búhos de Sabiduría (Puntos)', value: `**${profile.record.points}**`, inline: true },
            { name: '🤝 Reconocimientos Dados', value: `${profile.record.givenCount}`, inline: true },
            { name: '📥 Aportes Reconocidos', value: `${profile.record.receivedCount}`, inline: true }
          )
          .setFooter({ text: 'Universidad Nacional de Colombia • Comunidad AI' })
          .setTimestamp();

        if (profile.record.reasons.length > 0) {
          const recentReasons = profile.record.reasons.slice(-3).map((r) => `• *${r}*`).join('\n');
          embed.addFields({ name: '🌟 Aportes Recientes Destacados', value: recentReasons, inline: false });
        }

        await interaction.reply({ embeds: [embed] });
        return;
      }

      // -----------------------------------------------------------
      // COMANDO: /ranking-hermes
      // -----------------------------------------------------------
      if (commandName === 'ranking-hermes') {
        const topMembers = HermesPointsService.getLeaderboard(10);

        if (topMembers.length === 0) {
          await interaction.reply({
            content: '🦉 Aún no hay reconocimientos registrados en el Sistema Hermes. ¡Sé el primero en agradecer con `/agradecer`!',
            ephemeral: true
          });
          return;
        }

        const lines = topMembers.map((record, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**#${index + 1}**`;
          return `${medal} <@${record.userId}> — **${record.points}** Búhos de Sabiduría (${record.receivedCount} aportes)`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setTitle('🏆 Cuadro de Honor Hermes - Sabiduría y Aportes UNAL')
          .setDescription(`Los miembros más destacados por sus aportes y resolución de dudas técnicas en IA:\n\n${lines}`)
          .setColor(0xF1C40F)
          .setFooter({ text: 'Inter Aulas Academiæ Quære Verum' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        return;
      }

      // -----------------------------------------------------------
      // COMANDO: /ticket-panel
      // -----------------------------------------------------------
      if (commandName === 'ticket-panel') {
        if (interaction.channel && interaction.channel.isTextBased()) {
          await TicketHandler.postTicketPanel(interaction.channel as TextChannel);
          await interaction.reply({ content: '✅ Panel de tickets publicado.', ephemeral: true });
        }
        return;
      }

    } catch (cmdErr) {
      Logger.error(`Error ejecutando comando /${commandName}:`, cmdErr);
      if (interaction.isRepliable()) {
        if (interaction.deferred) {
          await interaction.editReply('❌ Ocurrió un error al procesar el comando.');
        } else if (!interaction.replied) {
          await interaction.reply({ content: '❌ Ocurrió un error al procesar el comando.', ephemeral: true });
        }
      }
    }
  }
}
