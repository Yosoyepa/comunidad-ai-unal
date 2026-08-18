import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as http from 'http';
import * as dotenv from 'dotenv';
import { Logger } from './utils/logger';
import { InteractionHandler } from './handlers/interactionHandler';
import { SlashCommandHandler } from './commands/slashCommands';
import { TicketHandler } from './handlers/ticketHandler';

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

// Auto-asignación de rol de miembro al ingresar (Onboarding)
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    Logger.info(`Nuevo miembro ingresó al servidor: ${member.user.tag}`);
    const verifiedRole = member.guild.roles.cache.find(
      (r) => r.name.toLowerCase() === '✅ miembro verificado'
    );
    if (verifiedRole) {
      await member.roles.add(verifiedRole, 'Asignación automática de rol base al ingresar');
      Logger.success(`Rol ${verifiedRole.name} asignado automáticamente a ${member.user.tag}`);
    }
  } catch (err) {
    Logger.warn(`No se pudo auto-asignar rol al nuevo miembro ${member.user.tag}:`, err);
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
