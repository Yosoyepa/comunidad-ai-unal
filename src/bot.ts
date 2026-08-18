import { Client, GatewayIntentBits, Events, ChannelType, TextChannel } from 'discord.js';
import * as http from 'http';
import * as dotenv from 'dotenv';
import { Logger } from './utils/logger';
import { InteractionHandler } from './handlers/interactionHandler';
import { SlashCommandHandler } from './commands/slashCommands';
import { TicketHandler } from './handlers/ticketHandler';
import { DuelService } from './services/duelService';

dotenv.config();

// Servidor HTTP ligero opcional para health checks y diagnóstico.
const PORT = process.env.PORT || 8000;
const healthServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    discord: client.isReady() ? 'ready' : 'connecting',
    service: 'UNAL AI Community Discord Bot',
    uptime: Math.floor(process.uptime())
  }));
});

healthServer.listen(PORT, () => {
  Logger.info(`Servidor de Health Check activo en el puerto ${PORT}`);
});

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!BOT_TOKEN) {
  Logger.error('DISCORD_BOT_TOKEN no está configurado en el archivo .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Configurar listener para actualizar duelos de IA automáticamente al expirar los 2 minutos
DuelService.onDuelConcluded = async (channelId, messageId, embed, row) => {
  try {
    const channel = await client.channels.fetch(channelId) as TextChannel | null;
    if (channel && channel.isTextBased()) {
      const msg = await channel.messages.fetch(messageId);
      if (msg) {
        await msg.edit({
          embeds: [embed],
          components: [row]
        });
        Logger.success(`[Duelo IA] Mensaje ${messageId} actualizado con el veredicto en #${channel.name}`);
      }
    }
  } catch (err) {
    Logger.error(`[Duelo IA] No se pudo editar mensaje de duelo ${messageId}:`, err);
  }
};

client.once(Events.ClientReady, async (readyClient) => {
  Logger.banner(
    'BOT DE LA COMUNIDAD AI UNAL EN LÍNEA',
    `Conectado como ${readyClient.user.tag} • Escuchando Slash Commands, Botones y Tickets`
  );

  // Registrar comandos Slash si tenemos GUILD_ID
  if (GUILD_ID) {
    await SlashCommandHandler.registerCommands(BOT_TOKEN, readyClient.user.id, GUILD_ID);
  }
});

// Manejador central de todas las interacciones de Discord
client.on(Events.InteractionCreate, async (interaction) => {
  // 1. Comandos Slash (/)
  if (interaction.isChatInputCommand()) {
    await SlashCommandHandler.handleCommand(interaction);
    return;
  }

  // 2. Botones de Tickets
  if (interaction.isButton()) {
    if (interaction.customId === 'btn_open_ticket') {
      await TicketHandler.handleOpenTicket(interaction);
      return;
    }
    if (interaction.customId === 'btn_close_ticket') {
      await TicketHandler.handleCloseTicket(interaction);
      return;
    }
  }

  // 3. Botones y Menús de Roles de Onboarding
  await InteractionHandler.handleInteraction(interaction);
});

// Auto-asignación de rol y mensaje de bienvenida en #📩・bienvenida al ingresar
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    Logger.info(`[ONBOARDING] Nuevo miembro ingresó al servidor: ${member.user.tag} (ID: ${member.id})`);

    // 1. Auto-asignar rol base
    const verifiedRole = member.guild.roles.cache.find(
      (r) => r.name.toLowerCase().includes('miembro verificado')
    );
    if (verifiedRole) {
      await member.roles.add(verifiedRole, 'Asignación automática de rol base al ingresar');
      Logger.success(`[ONBOARDING] Rol "${verifiedRole.name}" asignado automáticamente a ${member.user.tag}`);
    } else {
      Logger.warn('[ONBOARDING] No se encontró el rol "✅ Miembro Verificado" para auto-asignar.');
    }

    // 2. Enviar saludo de bienvenida en el canal oficial #📩・bienvenida
    const channels = await member.guild.channels.fetch();
    const welcomeChannel = channels.find(
      (c) => c && c.type === ChannelType.GuildText && c.name.toLowerCase().includes('bienvenida') && !c.name.toLowerCase().includes('roles')
    ) as TextChannel | undefined;

    if (welcomeChannel) {
      await welcomeChannel.send({
        content: `<@${member.id}> ¡Bienvenido al servidor de 🧠 **UNAL AI Hub** 🚀!`
      });
      Logger.success(`[ONBOARDING] Mensaje de bienvenida publicado para ${member.user.tag} en #${welcomeChannel.name}`);
    } else {
      Logger.warn('[ONBOARDING] No se encontró el canal de texto #bienvenida para publicar el saludo.');
    }
  } catch (err) {
    Logger.error(`[ONBOARDING] Error procesando ingreso de nuevo miembro ${member.user.tag}:`, err);
  }
});

// Cierre elegante
process.on('SIGINT', () => {
  Logger.info('Deteniendo bot...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  Logger.info('Deteniendo bot...');
  client.destroy();
  process.exit(0);
});

client.login(BOT_TOKEN);
