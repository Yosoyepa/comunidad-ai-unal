import { 
  Guild, 
  TextChannel, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  ChannelType
} from 'discord.js';
import { INTERACTIVE_PANELS } from '../config/serverStructure';
import { Logger } from '../utils/logger';

export class RolePanelService {
  /**
   * Publica o refresca los paneles interactivos de auto-asignación de roles en #bienvenida-y-roles.
   */
  public static async postInteractiveRolePanels(guild: Guild, forceRefresh = false): Promise<void> {
    Logger.info('Preparando paneles interactivos de selección de roles...');

    const channels = await guild.channels.fetch();
    const welcomeChannel = channels.find(
      (c) => c && c.type === ChannelType.GuildText && (c.name.includes('roles') || c.name.includes('bienvenida-y-roles'))
    ) as TextChannel | undefined;

    if (!welcomeChannel) {
      Logger.error('No se encontró el canal de roles para publicar los paneles.');
      return;
    }

    if (forceRefresh) {
      Logger.info(`Limpiando mensajes anteriores en #${welcomeChannel.name} para actualización de paneles...`);
      try {
        const oldMessages = await welcomeChannel.messages.fetch({ limit: 20 });
        for (const [, msg] of oldMessages) {
          await msg.delete();
        }
      } catch (err) {
        Logger.warn('Error al limpiar mensajes previos de bienvenida:', err);
      }
    }

    Logger.info(`Publicando paneles interactivos (con multi-selección) en #${welcomeChannel.name}...`);

    // -------------------------------------------------------------
    // PANEL 1: ESPECIALIDAD TÉCNICA EN IA (Botones interactivos)
    // -------------------------------------------------------------
    const techEmbed = new EmbedBuilder()
      .setTitle('🧠 1. Especialidad Técnica en Inteligencia Artificial')
      .setDescription('Haz clic en los botones de abajo para **asignarte o removerte** tus roles técnicos en IA. Puedes seleccionar más de uno:')
      .setColor(0x9B59B6)
      .addFields(
        {
          name: '🔬 AI Researcher',
          value: 'Enfoque en lectura/escritura de papers, arquitecturas de modelos, datasets y fundamentación matemática.',
          inline: false
        },
        {
          name: '💻 AI Engineer / MLOps',
          value: 'Enfoque en desarrollo de software con IA, RAG, pipelines de fine-tuning, inferencia local (vLLM/Ollama) y producción.',
          inline: false
        },
        {
          name: '🛠️ Prompt Crafter / Builder',
          value: 'Enfoque en construcción de agentes, diseño de system prompts avanzados, automatizaciones y apps basadas en LLMs.',
          inline: false
        }
      );

    const techButtonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_role:🔬 AI Researcher')
        .setLabel('AI Researcher')
        .setEmoji('🔬')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('btn_role:💻 AI Engineer / MLOps')
        .setLabel('AI Engineer')
        .setEmoji('💻')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('btn_role:🛠️ Prompt Crafter / Builder')
        .setLabel('Prompt Crafter')
        .setEmoji('🛠️')
        .setStyle(ButtonStyle.Secondary)
    );

    await welcomeChannel.send({
      embeds: [techEmbed],
      components: [techButtonsRow]
    });

    // -------------------------------------------------------------
    // PANEL 2: AFILIACIÓN & UNIVERSIDAD (Menú Desplegable Multi-Selección)
    // -------------------------------------------------------------
    const affilEmbed = new EmbedBuilder()
      .setTitle('🎓 2. Perfil, Afiliación y Universidad')
      .setDescription('Puedes seleccionar **una o varias** opciones que describan tu perfil actual (ej: Estudiante y Profesional a la vez):')
      .setColor(0x00A859);

    const affilSelect = new StringSelectMenuBuilder()
      .setCustomId('select_role:affiliation')
      .setPlaceholder('👉 Elige una o más opciones de afiliación / perfil...')
      .setMinValues(1)
      .setMaxValues(INTERACTIVE_PANELS.affiliationRoles.length)
      .addOptions(
        INTERACTIVE_PANELS.affiliationRoles.map((item) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(item.label)
            .setValue(item.roleName)
            .setDescription(item.description || item.label)
            .setEmoji(item.emoji)
        )
      );

    const affilRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(affilSelect);

    await welcomeChannel.send({
      embeds: [affilEmbed],
      components: [affilRow]
    });

    // -------------------------------------------------------------
    // PANEL 3: PAÍS / REGIÓN (Menú Desplegable)
    // -------------------------------------------------------------
    const regionEmbed = new EmbedBuilder()
      .setTitle('🌍 3. País y Región')
      .setDescription('Selecciona tu país o región para conectar con otros miembros y eventos locales:')
      .setColor(0xF1C40F);

    const regionSelect = new StringSelectMenuBuilder()
      .setCustomId('select_role:region')
      .setPlaceholder('👉 Elige tu país / región...')
      .setMinValues(1)
      .setMaxValues(INTERACTIVE_PANELS.regionRoles.length)
      .addOptions(
        INTERACTIVE_PANELS.regionRoles.map((item) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(item.label)
            .setValue(item.roleName)
            .setDescription(item.description || item.label)
            .setEmoji(item.emoji)
        )
      );

    const regionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(regionSelect);

    await welcomeChannel.send({
      embeds: [regionEmbed],
      components: [regionRow]
    });

    // -------------------------------------------------------------
    // PANEL 4: IDENTIDAD Y PRONOMBRES (Botones)
    // -------------------------------------------------------------
    const pronounEmbed = new EmbedBuilder()
      .setTitle('👤 4. Identidad y Pronombres')
      .setDescription('Elige cómo prefieres que se refieran a ti en la comunidad (opcional):')
      .setColor(0x95A5A6);

    const pronounButtonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_role:Él / He / Him')
        .setLabel('Él / He / Him')
        .setEmoji('🔹')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('btn_role:Ella / She / Her')
        .setLabel('Ella / She / Her')
        .setEmoji('🔸')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('btn_role:Elle / They / Them')
        .setLabel('Elle / They / Them')
        .setEmoji('✨')
        .setStyle(ButtonStyle.Secondary)
    );

    await welcomeChannel.send({
      embeds: [pronounEmbed],
      components: [pronounButtonsRow]
    });

    Logger.success('Paneles interactivos actualizados con éxito en #bienvenida-y-roles.');
  }
}
