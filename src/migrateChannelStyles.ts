import { 
  Client, 
  GatewayIntentBits, 
  ChannelType, 
  CategoryChannel, 
  TextChannel, 
  NonThreadGuildBasedChannel,
  PermissionFlagsBits
} from 'discord.js';
import * as dotenv from 'dotenv';
import { CATEGORIES_CONFIG, ROLES_CONFIG } from './config/serverStructure';
import { RoleService } from './services/roleService';
import { WelcomeService } from './services/welcomeService';
import { RolePanelService } from './services/rolePanelService';
import { CommandGuideService } from './services/commandGuideService';
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
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

// Mapeo semántico para renombrar canales existentes sin perder historial
const CHANNEL_RENAMES: Record<string, string> = {
  // Canales de información
  'reglas-y-normas': '📜・normas',
  'normas': '📜・normas',
  'anuncios-oficiales': '📢・anuncios',
  'anuncios': '📢・anuncios',
  'bienvenida-y-roles': '👋・roles-y-perfil',
  'roles-y-perfil': '👋・roles-y-perfil',
  'comandos-y-guia': '📖・comandos-y-guia',
  'recursos-y-links': '🔗・recursos-ai',
  'recursos-ai': '🔗・recursos-ai',
  // Comunidad
  'general-ai': '💬・chat-general',
  'chat-general': '💬・chat-general',
  'presentaciones': '🤝・presentaciones',
  'empleo-y-colabs': '💼・empleo-y-colabs',
  'cafe-y-offtopic': '☕・cafe-y-offtopic',
  // Discusión Técnica
  'llms-y-agentes': '🤖・llms-y-agentes',
  'vision-y-multimodal': '👁️・vision-y-multimodal',
  'rag-y-vector-dbs': '⚡・rag-y-vector-dbs',
  'fine-tuning-y-evals': '🛠️・fine-tuning-y-evals',
  'papers-y-investigacion': '📚・papers-y-investigacion',
  // Showcase & Soporte
  'showcase-proyectos': '💡・showcase-proyectos',
  'dudas-y-code-review': '❓・dudas-y-code-review',
  'prompts-y-experimentos': '🧪・prompts-y-experimentos',
  'abrir-ticket': '🎫・abrir-ticket',
  // Voz
  'salón principal': '🎙️・Salón Principal',
  'coworking ai (focus)': '🎧・Coworking AI (Focus)',
  'mesa redonda 1': '🗣️・Mesa Redonda 1',
  'mesa redonda 2': '🗣️・Mesa Redonda 2',
  // Admin
  'logs-audit': '📊・logs-audit',
  'staff-chat': '💬・staff-chat',
  'bot-debug': '🤖・bot-debug'
};

const CATEGORY_RENAMES: Record<string, string> = {
  'bienvenida': '╔══ Bienvenida ══╗',
  'información & onboarding': '╔══ Importante ══╗',
  'importante': '╔══ Importante ══╗',
  'comunidad & networking': '╔══ Comunidad ══╗',
  'comunidad': '╔══ Comunidad ══╗',
  'discusión técnica de ia': '╔══ Discusión Técnica ══╗',
  'discusión técnica': '╔══ Discusión Técnica ══╗',
  'showcase & soporte': '╔══ Showcase & Soporte ══╗',
  'canales de voz': '╔══ Canales de Voz ══╗',
  'administración & logs': '╔══ Administración ══╗',
  'administración': '╔══ Administración ══╗'
};

async function migrateAesthetics(): Promise<void> {
  try {
    const guild = await client.guilds.fetch(GUILD_ID!);
    Logger.info(`Iniciando migración estética para el servidor: ${guild.name}`);

    // 1. Sincronizar roles
    const roleMap = await RoleService.provisionRoles(guild);

    // 2. Renombrar categorías existentes
    const channels = await guild.channels.fetch();
    const channelList: NonThreadGuildBasedChannel[] = Array.from(channels.values()).filter(
      (c): c is NonThreadGuildBasedChannel => c !== null
    );

    // Renombrar categorías
    for (const channel of channelList) {
      if (channel.type === ChannelType.GuildCategory) {
        const cleanName = channel.name.toLowerCase().replace(/[^a-záéíóúñ0-9 &]/gi, '').trim();
        for (const [key, targetName] of Object.entries(CATEGORY_RENAMES)) {
          if (cleanName.includes(key) && channel.name !== targetName) {
            Logger.info(`Renombrando categoría: "${channel.name}" -> "${targetName}"`);
            await channel.setName(targetName);
            break;
          }
        }
      }
    }

    // 3. Renombrar canales existentes
    for (const channel of channelList) {
      if (channel.type !== ChannelType.GuildCategory) {
        const cleanName = channel.name.toLowerCase().replace(/[^a-záéíóúñ0-9 -]/gi, '').trim();
        for (const [key, targetName] of Object.entries(CHANNEL_RENAMES)) {
          if ((cleanName === key || cleanName.includes(key)) && channel.name !== targetName) {
            Logger.info(`Renombrando canal: "${channel.name}" -> "${targetName}"`);
            try {
              await channel.setName(targetName);
            } catch (err) {
              Logger.warn(`No se pudo renombrar canal "${channel.name}":`, err);
            }
            break;
          }
        }
      }
    }

    // 4. Asegurar que exista la categoría "╭── 📩 Bienvenida ──╮" y el canal "📩・bienvenida"
    const refreshedChannels = await guild.channels.fetch();
    let welcomeCategory = refreshedChannels.find(
      (c) => c && c.type === ChannelType.GuildCategory && c.name.includes('Bienvenida')
    ) as CategoryChannel | undefined;

    if (!welcomeCategory) {
      Logger.info('Creando categoría "╔══ Bienvenida ══╗"...');
      welcomeCategory = await guild.channels.create({
        name: '╔══ Bienvenida ══╗',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [
              PermissionFlagsBits.SendMessages, 
              PermissionFlagsBits.CreatePublicThreads, 
              PermissionFlagsBits.CreatePrivateThreads,
              PermissionFlagsBits.AddReactions
            ]
          }
        ]
      });
    }

    // Canal 📩・bienvenida
    let welcomeFeedChannel = refreshedChannels.find(
      (c) => c && c.type === ChannelType.GuildText && c.name.includes('bienvenida') && !c.name.includes('roles')
    ) as TextChannel | undefined;

    if (!welcomeFeedChannel) {
      Logger.info('Creando canal "📩・bienvenida"...');
      welcomeFeedChannel = await guild.channels.create({
        name: '📩・bienvenida',
        type: ChannelType.GuildText,
        parent: welcomeCategory.id,
        topic: 'Canal oficial de llegadas y bienvenida para cada nuevo miembro de la comunidad.'
      });
      Logger.success(`Canal creado: #${welcomeFeedChannel.name}`);
    } else if (welcomeFeedChannel.parentId !== welcomeCategory.id) {
      Logger.info(`Moviendo #${welcomeFeedChannel.name} a la categoría "${welcomeCategory.name}"...`);
      await welcomeFeedChannel.setParent(welcomeCategory.id);
    }

    // Mover 👋・roles-y-perfil a la categoría Bienvenida si está en otra
    const rolesChannel = refreshedChannels.find(
      (c) => c && c.type === ChannelType.GuildText && (c.name.includes('roles') || c.name.includes('perfil'))
    ) as TextChannel | undefined;

    if (rolesChannel && rolesChannel.parentId !== welcomeCategory.id) {
      Logger.info(`Moviendo #${rolesChannel.name} a la categoría "${welcomeCategory.name}"...`);
      await rolesChannel.setParent(welcomeCategory.id);
    }

    // 5. Refrescar Paneles en #roles-y-perfil y Guía en #comandos-y-guia
    await RolePanelService.postInteractiveRolePanels(guild, true);
    await CommandGuideService.postCommandGuide(guild, true);

    Logger.success('═════════════════════════════════════════════════════════════');
    Logger.success('  ¡MIGRACIÓN ESTÉTICA COMPLETADA CON ÉXITO!               ');
    Logger.success('  Todos los canales y categorías tienen el diseño visual. ');
    Logger.success('═════════════════════════════════════════════════════════════');

  } catch (error) {
    Logger.error('Error durante la migración estética:', error);
  } finally {
    client.destroy();
    process.exit(0);
  }
}

client.once('ready', async () => {
  Logger.info(`Conectado como ${client.user?.tag}`);
  await migrateAesthetics();
});

client.login(BOT_TOKEN);
