import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { Logger } from './utils/logger';

dotenv.config();

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

async function testConnection() {
  Logger.banner('PRUEBA DE CONEXIÓN - API DE DISCORD v10', 'Verificando credenciales, permisos y estado del bot');

  if (!BOT_TOKEN || BOT_TOKEN.includes('tu_token')) {
    Logger.error('DISCORD_BOT_TOKEN no está configurado en el archivo .env.');
    process.exit(1);
  }

  if (!GUILD_ID || GUILD_ID.includes('tu_guild_id')) {
    Logger.error('DISCORD_GUILD_ID no está configurado en el archivo .env.');
    process.exit(1);
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers
    ]
  });

  try {
    Logger.info('Autenticando con Discord Gateway...');
    await client.login(BOT_TOKEN);
    Logger.success(`Bot conectado correctamente como: ${client.user?.tag} (ID: ${client.user?.id})`);

    Logger.info(`Buscando servidor con ID: ${GUILD_ID}...`);
    const guild = await client.guilds.fetch(GUILD_ID);

    if (!guild) {
      Logger.error(`No se encontró el servidor con ID ${GUILD_ID}. ¿Está el bot dentro del servidor?`);
      process.exit(1);
    }

    Logger.success(`Servidor encontrado: "${guild.name}"`);
    Logger.info(`- Miembros totales: ${guild.memberCount}`);
    Logger.info(`- Roles existentes: ${guild.roles.cache.size}`);
    Logger.info(`- Canales existentes: ${guild.channels.cache.size}`);

    // Verificar permisos del bot en el servidor
    const botMember = await guild.members.fetchMe();
    const hasAdmin = botMember.permissions.has(PermissionFlagsBits.Administrator);
    const hasManageRoles = botMember.permissions.has(PermissionFlagsBits.ManageRoles);
    const hasManageChannels = botMember.permissions.has(PermissionFlagsBits.ManageChannels);
    const hasManageGuild = botMember.permissions.has(PermissionFlagsBits.ManageGuild);

    console.log('\n--- Estado de Permisos del Bot ---');
    console.log(`• Administrador (Recomendado): ${hasAdmin ? '✅ Sí' : '❌ No'}`);
    console.log(`• Gestionar Roles: ${hasManageRoles ? '✅ Sí' : '❌ No'}`);
    console.log(`• Gestionar Canales: ${hasManageChannels ? '✅ Sí' : '❌ No'}`);
    console.log(`• Gestionar Servidor: ${hasManageGuild ? '✅ Sí' : '❌ No'}`);
    console.log('----------------------------------\n');

    if (!hasAdmin && (!hasManageRoles || !hasManageChannels)) {
      Logger.warn('El bot no tiene permisos suficientes para crear roles o canales. Otórgale el rol de Administrador o permisos de Gestionar Canales/Roles.');
    } else {
      Logger.success('El bot tiene los permisos necesarios para el aprovisionamiento automatizado.');
    }

  } catch (error) {
    Logger.error('Error durante la prueba de conexión:', error);
  } finally {
    client.destroy();
    Logger.info('Conexión cerrada.');
  }
}

testConnection();
