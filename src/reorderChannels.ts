import { 
  Client, 
  GatewayIntentBits, 
  ChannelType, 
  CategoryChannel, 
  NonThreadGuildBasedChannel 
} from 'discord.js';
import * as dotenv from 'dotenv';
import { CATEGORIES_CONFIG } from './config/serverStructure';
import { Logger } from './utils/logger';

dotenv.config();

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!BOT_TOKEN || !GUILD_ID) {
  Logger.error('Faltan variables de entorno DISCORD_BOT_TOKEN o DISCORD_GUILD_ID.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

async function reorderServerHierarchy(): Promise<void> {
  try {
    const guild = await client.guilds.fetch(GUILD_ID!);
    Logger.info(`Reordenando jerarquía de categorías y canales en: ${guild.name}...`);

    const channels = await guild.channels.fetch();
    const channelList: NonThreadGuildBasedChannel[] = Array.from(channels.values()).filter(
      (c): c is NonThreadGuildBasedChannel => c !== null
    );

    // 1. ORDENAR CATEGORÍAS
    const categoryPositions: { channel: string; position: number }[] = [];

    for (let i = 0; i < CATEGORIES_CONFIG.length; i++) {
      const catConfig = CATEGORIES_CONFIG[i];
      const category = channelList.find(
        (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes(catConfig.name.toLowerCase().replace(/[^a-záéíóúñ]/g, ''))
      );

      if (category) {
        Logger.info(`Posicionando categoría [${i}]: "${category.name}"`);
        categoryPositions.push({
          channel: category.id,
          position: i
        });
      }
    }

    if (categoryPositions.length > 0) {
      await guild.channels.setPositions(categoryPositions);
      Logger.success('Categorías reordenadas en Discord con éxito.');
    }

    // 2. ORDENAR CANALES DENTRO DE CADA CATEGORÍA
    const refreshedChannels = await guild.channels.fetch();
    const updatedChannelList: NonThreadGuildBasedChannel[] = Array.from(refreshedChannels.values()).filter(
      (c): c is NonThreadGuildBasedChannel => c !== null
    );

    const channelPositions: { channel: string; position: number }[] = [];

    for (const catConfig of CATEGORIES_CONFIG) {
      const category = updatedChannelList.find(
        (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes(catConfig.name.toLowerCase().replace(/[^a-záéíóúñ]/g, ''))
      ) as CategoryChannel | undefined;

      if (!category) continue;

      for (let j = 0; j < catConfig.channels.length; j++) {
        const chanConfig = catConfig.channels[j];
        const channel = updatedChannelList.find(
          (c) => c.parentId === category.id && c.name.toLowerCase().includes(chanConfig.name.toLowerCase().replace(/[^a-záéíóúñ]/g, ''))
        );

        if (channel) {
          channelPositions.push({
            channel: channel.id,
            position: j
          });
        }
      }
    }

    if (channelPositions.length > 0) {
      await guild.channels.setPositions(channelPositions);
      Logger.success('Canales internos posicionados en orden jerárquico.');
    }

    Logger.success('═════════════════════════════════════════════════════════════');
    Logger.success('  ¡JERARQUÍA Y ORDEN DE CANALES CORREGIDOS CON ÉXITO!      ');
    Logger.success('  ╔══ Bienvenida ══╗ ahora está arriba de todo.            ');
    Logger.success('═════════════════════════════════════════════════════════════');

  } catch (error) {
    Logger.error('Error reordenando jerarquía:', error);
  } finally {
    client.destroy();
    process.exit(0);
  }
}

client.once('ready', async () => {
  Logger.info(`Conectado como ${client.user?.tag}`);
  await reorderServerHierarchy();
});

client.login(BOT_TOKEN);
