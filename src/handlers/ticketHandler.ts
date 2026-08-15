import { 
  ButtonInteraction, 
  Guild, 
  TextChannel, 
  CategoryChannel, 
  ChannelType, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { Logger } from '../utils/logger';

export class TicketHandler {
  /**
   * Publica el panel principal para solicitar tickets de soporte y mentoría.
   */
  public static async postTicketPanel(channel: TextChannel): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Centro de Soporte y Mentoría Técnica en IA')
      .setDescription(
        '¿Tienes una duda técnica compleja, necesitas orientación con un proyecto de IA o deseas comunicarte en privado con los moderadores y mentores de la comunidad?\n\n' +
        'Haz clic en el botón de abajo para abrir un **canal privado temporal** atendido por el equipo.'
      )
      .setColor(0x3498DB)
      .addFields(
        {
          name: '📌 Temas de consulta',
          value: '• Dudas de arquitectura (RAG, Agentes, Fine-tuning, Despliegue)\n• Revisión de código y errores bloqueantes\n• Propuestas de proyectos y eventos para la comunidad\n• Reportes de conducta o moderación'
        }
      )
      .setFooter({ text: 'Sistema de Tickets • Comunidad AI UNAL' });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_open_ticket')
        .setLabel('Abrir Ticket de Consulta')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [embed], components: [row] });
    Logger.success(`Panel de tickets publicado en #${channel.name}`);
  }

  /**
   * Crea un nuevo canal privado de ticket para el usuario.
   */
  public static async handleOpenTicket(interaction: ButtonInteraction): Promise<void> {
    const guild = interaction.guild;
    const member = interaction.member;

    if (!guild || !member) return;

    await interaction.deferReply({ ephemeral: true });

    // Buscar o crear la categoría de Tickets
    let ticketCategory = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('tickets')
    ) as CategoryChannel | undefined;

    if (!ticketCategory) {
      ticketCategory = await guild.channels.create({
        name: '🎫 TICKETS ACTIVOS',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });
    }

    const sanitizedUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const channelName = `ticket-${sanitizedUsername}`;

    // Verificar si ya tiene un ticket abierto
    const existingTicket = guild.channels.cache.find(
      (c) => c.parentId === ticketCategory?.id && c.name === channelName
    );

    if (existingTicket) {
      await interaction.editReply({
        content: `⚠️ Ya tienes un ticket abierto en <#${existingTicket.id}>.`
      });
      return;
    }

    // Buscar roles de Staff/Mod
    const modRole = guild.roles.cache.find((r) => r.name.includes('Moderador'));
    const adminRole = guild.roles.cache.find((r) => r.name.includes('Fundador'));

    const permissionOverwrites: any[] = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      }
    ];

    if (modRole) {
      permissionOverwrites.push({
        id: modRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
      });
    }

    if (adminRole) {
      permissionOverwrites.push({
        id: adminRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
      });
    }

    // Crear canal de ticket
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: ticketCategory.id,
      topic: `Ticket privado de soporte para ${interaction.user.tag}`,
      permissionOverwrites
    });

    // Enviar mensaje de bienvenida dentro del ticket
    const ticketEmbed = new EmbedBuilder()
      .setTitle(`🎫 Ticket: ${interaction.user.username}`)
      .setDescription(
        `¡Hola <@${interaction.user.id}>! Gracias por comunicarte con el equipo de la comunidad AI.\n\n` +
        `Por favor describe tu consulta con el mayor detalle posible (código, logs o propuesta). Un moderador o mentor te responderá pronto.\n\n` +
        `Cuando tu consulta haya sido resuelta, haz clic en **Cerrar Ticket** abajo.`
      )
      .setColor(0x2ECC71)
      .setFooter({ text: 'Inter Aulas Academiæ Quære Verum • UNAL AI' })
      .setTimestamp();

    const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_close_ticket')
        .setLabel('Cerrar Ticket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [ticketEmbed],
      components: [closeRow]
    });

    await interaction.editReply({
      content: `✅ ¡Tu ticket ha sido creado con éxito! Ve a <#${ticketChannel.id}> para continuar.`
    });

    Logger.info(`Ticket creado: #${ticketChannel.name} para ${interaction.user.tag}`);
  }

  /**
   * Cierra y elimina el ticket tras una cuenta regresiva.
   */
  public static async handleCloseTicket(interaction: ButtonInteraction): Promise<void> {
    await interaction.reply({
      content: '🔒 Este ticket se cerrará y eliminará en **5 segundos**...'
    });

    setTimeout(async () => {
      try {
        if (interaction.channel && interaction.channel.isTextBased()) {
          await (interaction.channel as TextChannel).delete('Ticket cerrado por el usuario o staff');
          Logger.info(`Ticket eliminado.`);
        }
      } catch (err) {
        Logger.error('Error al eliminar el canal de ticket:', err);
      }
    }, 5000);
  }
}
