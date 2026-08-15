import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { Logger } from './utils/logger';
import { RolePanelService } from './services/rolePanelService';

dotenv.config();

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

async function main() {
  Logger.banner('ACTUALIZACIÓN DE PANELES INTERACTIVOS (MULTI-ROL)');

  if (!BOT_TOKEN || !GUILD_ID) {
    Logger.error('Faltan credenciales en el archivo .env');
    process.exit(1);
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once('ready', async () => {
    try {
      const guild = await client.guilds.fetch(GUILD_ID);
      if (guild) {
        await RolePanelService.postInteractiveRolePanels(guild, true);
        Logger.success('Paneles de bienvenida y roles actualizados con soporte multi-selección.');
      }
    } catch (err) {
      Logger.error('Error actualizando paneles:', err);
    } finally {
      client.destroy();
      process.exit(0);
    }
  });

  client.login(BOT_TOKEN);
}

main();
