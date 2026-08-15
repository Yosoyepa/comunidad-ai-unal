import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { Logger } from './utils/logger';
import { RoleService } from './services/roleService';
import { ChannelService } from './services/channelService';
import { AutoModService } from './services/autoModService';
import { WelcomeService } from './services/welcomeService';
import { RolePanelService } from './services/rolePanelService';

dotenv.config();

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const cleanDefaultsFlag = process.argv.includes('--clean-defaults');

async function main() {
  Logger.banner(
    'APROVISIONAMIENTO DEL SERVIDOR DISCORD - COMUNIDAD AI',
    'Construcción automatizada, jerarquía de roles, canales especializados y gobernanza'
  );

  if (!BOT_TOKEN || !GUILD_ID) {
    Logger.error('Faltan variables en el archivo .env (DISCORD_BOT_TOKEN o DISCORD_GUILD_ID).');
    process.exit(1);
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.AutoModerationConfiguration,
      GatewayIntentBits.AutoModerationExecution
    ]
  });

  try {
    // -------------------------------------------------------------
    // PASO 1: CONEXIÓN Y FETCH DEL SERVIDOR
    // -------------------------------------------------------------
    Logger.step(1, 5, 'Autenticación con la API de Discord');
    await client.login(BOT_TOKEN);
    Logger.success(`Autenticado exitosamente como: ${client.user?.tag}`);

    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) {
      Logger.error(`No se encontró el servidor con ID: ${GUILD_ID}`);
      process.exit(1);
    }
    
    // Obtener detalles completos del servidor
    const fullGuild = await guild.fetch();
    Logger.success(`Servidor objetivo: "${fullGuild.name}" (ID: ${fullGuild.id})`);

    // -------------------------------------------------------------
    // PASO 2: LIMPIEZA INICIAL OPCIONAL
    // -------------------------------------------------------------
    if (cleanDefaultsFlag) {
      Logger.step(2, 5, 'Limpieza de Canales por Defecto');
      await ChannelService.cleanDefaultChannels(fullGuild);
    } else {
      Logger.info('Omitiendo limpieza de canales por defecto. (Usa --clean-defaults para eliminarlos automáticamente).');
    }

    // -------------------------------------------------------------
    // PASO 3: APROVISIONAMIENTO DE ROLES
    // -------------------------------------------------------------
    Logger.step(3, 5, 'Aprovisionamiento y Sincronización de Roles');
    const roleMap = await RoleService.provisionRoles(fullGuild);
    Logger.success(`Roles procesados: ${roleMap.size} roles listos.`);

    // -------------------------------------------------------------
    // PASO 4: APROVISIONAMIENTO DE CATEGORÍAS Y CANALES
    // -------------------------------------------------------------
    Logger.step(4, 5, 'Aprovisionamiento de Categorías y Canales');
    await ChannelService.provisionCategoriesAndChannels(fullGuild, roleMap);
    Logger.success('Estructura de canales y categorías completada.');

    // -------------------------------------------------------------
    // PASO 5: APROVISIONAMIENTO DE REGLAS DE AUTOMOD
    // -------------------------------------------------------------
    Logger.step(5, 5, 'Configuración de Reglas de AutoMod (Seguridad & Anti-Spam)');
    await AutoModService.provisionAutoModRules(fullGuild);
    Logger.success('Reglas de AutoMod desplegadas exitosamente.');

    // -------------------------------------------------------------
    // PASO EXTRA: CONTENIDO INFORMATIVO Y PANELES INTERACTIVOS
    // -------------------------------------------------------------
    Logger.info('Publicando contenido inicial en canales de bienvenida y recursos...');
    await WelcomeService.setupInformationChannels(fullGuild);
    await RolePanelService.postInteractiveRolePanels(fullGuild);

    // -------------------------------------------------------------
    // RESUMEN FINAL
    // -------------------------------------------------------------
    console.log('\n');
    Logger.banner('¡APROVISIONAMIENTO COMPLETADO EXITOSAMENTE!', 'El servidor de la Comunidad AI está listo y asegurado.');

  } catch (error) {
    Logger.error('Ocurrió un error crítico durante el aprovisionamiento:', error);
  } finally {
    client.destroy();
    Logger.info('Sesión cerrada. Proceso finalizado.');
  }
}

main();
