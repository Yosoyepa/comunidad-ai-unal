import { 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember
} from 'discord.js';
import { Logger } from '../utils/logger';
import { HermesPointsService } from '../services/hermesPointsService';
import { AIAssistantService } from '../services/aiAssistantService';
import { TicketHandler } from '../handlers/ticketHandler';
import { TriviaService } from '../services/triviaService';
import { ProjectGenService } from '../services/projectGenService';

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
    .setDescription('Genera un resumen técnico estructurado de un paper o abstract de investigación')
    .addStringOption((opt) =>
      opt.setName('contenido')
        .setDescription('Texto del abstract, link de arXiv o temática del paper')
        .setRequired(true)
    ),

  // 3. Duelo de Modelos de IA
  new SlashCommandBuilder()
    .setName('duelo-ia')
    .setDescription('⚔️ Arena de Modelos: Compara Gemini 3.5 Flash vs Groq Llama 3.3 en tiempo real')
    .addStringOption((opt) =>
      opt.setName('prompt')
        .setDescription('El prompt o problema a resolver por ambos modelos')
        .setRequired(true)
    ),

  // 4. Trivia de Inteligencia Artificial
  new SlashCommandBuilder()
    .setName('trivia-ia')
    .setDescription('🎲 Pon a prueba tus conocimientos en IA y gana Puntos Hermes de Sabiduría'),

  // 5. Generador de Proyectos de IA & Hackathons
  new SlashCommandBuilder()
    .setName('generar-proyecto-ia')
    .setDescription('💡 Genera una propuesta estructurada de investigación o hackathon de IA')
    .addStringOption((opt) =>
      opt.setName('area')
        .setDescription('Área temática (ej: RAG, Agentes, Visión, MLOps)')
        .setRequired(false)
        .addChoices(
          { name: 'RAG & NLP', value: 'RAG & NLP' },
          { name: 'Agentes & LLMs', value: 'Agentes & LLMs' },
          { name: 'Visión por Computadora', value: 'Visión por Computadora' },
          { name: 'MLOps & Edge AI', value: 'MLOps & Edge AI' }
        )
    )
    .addStringOption((opt) =>
      opt.setName('dificultad')
        .setDescription('Nivel de complejidad')
        .setRequired(false)
        .addChoices(
          { name: 'Principiante', value: 'Principiante' },
          { name: 'Intermedio', value: 'Intermedio' },
          { name: 'Avanzado', value: 'Avanzado' }
        )
    ),

  // 6. Reto Semanal Comunitario
  new SlashCommandBuilder()
    .setName('reto-semanal')
    .setDescription('🏆 Consulta el desafío activo de optimización de prompts y algoritmos'),

  // 7. Agradecer / Puntos Hermes UNAL
  new SlashCommandBuilder()
    .setName('agradecer')
    .setDescription('Otorga +5 Puntos Hermes / 🦉 Búhos de Sabiduría a un compañero por su ayuda')
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

  // 8. Perfil Hermes UNAL
  new SlashCommandBuilder()
    .setName('perfil-hermes')
    .setDescription('Consulta el rango académico y Puntos Hermes de un miembro')
    .addUserOption((opt) =>
      opt.setName('usuario')
        .setDescription('Miembro a consultar (opcional, por defecto tú)')
        .setRequired(false)
    ),

  // 9. Ranking Hermes UNAL
  new SlashCommandBuilder()
    .setName('ranking-hermes')
    .setDescription('Tabla de honor con los miembros más destacados y sabios de la academia'),

  // 10. Panel de Tickets (Admin)
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
            content: `⏳ Has alcanzado el límite de consultas por usuario (máximo 3 cada 3 min). Por favor espera **${rateLimit.waitSeconds} segundos** para proteger la cuota gratuita de la comunidad.`,
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
      // COMANDO: /duelo-ia (Arena de Modelos)
      // -----------------------------------------------------------
      if (commandName === 'duelo-ia') {
        const prompt = interaction.options.getString('prompt', true);
        const rateLimit = AIAssistantService.checkRateLimit(interaction.user.id);

        if (!rateLimit.allowed) {
          await interaction.reply({
            content: `⏳ Límite de consultas alcanzado. Espera **${rateLimit.waitSeconds} segundos**.`,
            ephemeral: true
          });
          return;
        }

        await interaction.deferReply();
        const duel = await AIAssistantService.queryDuel(prompt);

        if (duel.error || (!duel.gemini && !duel.groq)) {
          await interaction.editReply({
            content: `⚠️ No se pudo completar el duelo: ${duel.error || 'No hay proveedores de IA activos'}`
          });
          return;
        }

        const duelEmbed = new EmbedBuilder()
          .setTitle('⚔️ Duelo de Modelos: Gemini 3.5 Flash vs Groq Llama 3.3')
          .setDescription(`**Prompt de Prueba:** *"${prompt}"*`)
          .setColor(0xE67E22);

        if (duel.gemini) {
          duelEmbed.addFields({
            name: `🔵 Google Gemini (${duel.gemini.latencyMs}ms)`,
            value: duel.gemini.text.length > 1000 ? `${duel.gemini.text.slice(0, 997)}...` : duel.gemini.text,
            inline: false
          });
        }

        if (duel.groq) {
          duelEmbed.addFields({
            name: `🟠 Groq Cloud / Llama 3.3 70B (${duel.groq.latencyMs}ms)`,
            value: duel.groq.text.length > 1000 ? `${duel.groq.text.slice(0, 997)}...` : duel.groq.text,
            inline: false
          });
        }

        duelEmbed.setFooter({ text: 'Vota abajo por el modelo que ofreció la mejor respuesta' });

        const voteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_duel_vote:gemini')
            .setLabel('Votar por Gemini (0)')
            .setEmoji('🔵')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('btn_duel_vote:groq')
            .setLabel('Votar por Llama 3.3 (0)')
            .setEmoji('🟠')
            .setStyle(ButtonStyle.Success)
        );

        await interaction.editReply({
          embeds: [duelEmbed],
          components: [voteRow]
        });
        return;
      }

      // -----------------------------------------------------------
      // COMANDO: /trivia-ia
      // -----------------------------------------------------------
      if (commandName === 'trivia-ia') {
        const triviaResult = TriviaService.createTrivia(interaction.user.id);

        if (!triviaResult.allowed) {
          await interaction.reply({
            content: `⏳ Debes esperar **${triviaResult.waitSeconds} segundos** antes de solicitar otra trivia.`,
            ephemeral: true
          });
          return;
        }

        await interaction.reply({
          embeds: [triviaResult.embed!],
          components: [triviaResult.row!]
        });
        return;
      }

      // -----------------------------------------------------------
      // COMANDO: /generar-proyecto-ia
      // -----------------------------------------------------------
      if (commandName === 'generar-proyecto-ia') {
        const area = interaction.options.getString('area') || undefined;
        const dificultad = interaction.options.getString('dificultad') || undefined;

        await interaction.deferReply();
        const projectEmbed = await ProjectGenService.generateProject(area, dificultad);
        await interaction.editReply({ embeds: [projectEmbed] });
        return;
      }

      // -----------------------------------------------------------
      // COMANDO: /reto-semanal
      // -----------------------------------------------------------
      if (commandName === 'reto-semanal') {
        const challengeEmbed = new EmbedBuilder()
          .setTitle('🏆 Reto Semanal de IA #1: Optimización de Reasoning en RAG')
          .setDescription(
            '**Objetivo:** Diseña un pipeline o prompt estructurado que reduzca las alucinaciones en un sistema RAG cuando la base de datos contiene documentos contradictorios.\n\n' +
            '### 📋 Reglas de Participación:\n' +
            '1. Publica tu solución en el canal **#🧪┃prompts-y-experimentos** en un nuevo hilo.\n' +
            '2. Incluye el system prompt o snippet de código en Python.\n' +
            '3. Las 3 soluciones más votadas por la comunidad recibirán **+25 Puntos Hermes de Sabiduría** y mención en el cuadro de honor.'
          )
          .setColor(0xF1C40F)
          .addFields(
            { name: '📅 Fecha Límite', value: 'Domingo 23:59 (Hora Colombia)', inline: true },
            { name: '🎁 Recompensa', value: '+25 Puntos Hermes + Rol Sabio', inline: true }
          )
          .setFooter({ text: 'Iniciativa Comunitaria • Universidad Nacional de Colombia' });

        await interaction.reply({ embeds: [challengeEmbed] });
        return;
      }

      // -----------------------------------------------------------
      // COMANDO: /agradecer (Puntos Hermes UNAL)
      // -----------------------------------------------------------
      if (commandName === 'agradecer') {
        const targetUser = interaction.options.getUser('usuario', true);
        const reason = interaction.options.getString('motivo', true);
        const targetMember = interaction.options.getMember('usuario') as GuildMember | undefined;

        const result = await HermesPointsService.addPoints(
          interaction.user.id, 
          targetUser.id, 
          reason,
          targetMember
        );

        if (!result.success) {
          await interaction.reply({ content: result.message, ephemeral: true });
          return;
        }

        let promoText = '';
        if (result.upgraded && result.newTier) {
          promoText = `\n\n🎉 **¡PROMOCIÓN DE RANGO!** <@${targetUser.id}> ha ascendido al rango **${result.newTier.badge} ${result.newTier.roleName}**.`;
        }

        const embed = new EmbedBuilder()
          .setTitle('🦉 Reconocimiento Hermes de la Academia UNAL')
          .setDescription(
            `¡<@${interaction.user.id}> ha otorgado **+5 Puntos Hermes de Sabiduría** a <@${targetUser.id}>!\n\n` +
            `**📜 Motivo:** *"${reason}"*\n\n` +
            `*«Inter Aulas Academiæ Quære Verum»* — Total acumulado: **${result.receiverPoints} Puntos Hermes**.${promoText}`
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

        const nextTierText = profile.nextTier 
          ? `\n🎯 **Siguiente Rango:** ${profile.nextTier.badge} ${profile.nextTier.roleName} (Faltan **${profile.pointsToNext} pts**)`
          : '\n👑 **¡Has alcanzado el Máximo Rango de Sabiduría Hermes!**';

        const embed = new EmbedBuilder()
          .setTitle(`${profile.tier.badge} Perfil Académico Hermes - ${targetUser.username}`)
          .setDescription(`**Rango Académico:** \`${profile.tier.roleName}\`${nextTierText}\n\n*«Inter Aulas Academiæ Quære Verum»*`)
          .setColor(0x00A859)
          .addFields(
            { name: '🦉 Búhos de Sabiduría', value: `**${profile.record.points} pts**`, inline: true },
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
            content: '🦉 Aún no hay reconocimientos registrados en el Sistema Hermes. ¡Sé el primero en agradecer con `/agradecer` o participar en `/trivia-ia`!',
            ephemeral: true
          });
          return;
        }

        const lines = topMembers.map((item, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**#${index + 1}**`;
          return `${medal} <@${item.record.userId}> — **${item.record.points} pts** • \`${item.tier.roleName}\``;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setTitle('🏆 Cuadro de Honor Hermes - Sabiduría y Aportes UNAL')
          .setDescription(`Los miembros más destacados por sus aportes, victorias en trivias y resolución de dudas:\n\n${lines}`)
          .setColor(0xF1C40F)
          .setFooter({ text: 'Inter Aulas Academiæ Quære Verum • Cuadro de Honor' })
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
