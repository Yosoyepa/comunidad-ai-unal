import { 
  Guild, 
  Role, 
  ChannelType, 
  CategoryChannel, 
  NonThreadGuildBasedChannel,
  OverwriteResolvable,
  GuildChannelCreateOptions
} from 'discord.js';
import { CATEGORIES_CONFIG, PermissionOverwriteRule, ChannelConfig } from '../config/serverStructure';
import { Logger } from '../utils/logger';

export class ChannelService {
  /**
   * Transforma las reglas de permisos legibles en objetos OverwriteResolvable de discord.js.
   */
  private static resolvePermissionOverwrites(
    rules: PermissionOverwriteRule[] | undefined,
    guild: Guild,
    roleMap: Map<string, Role>
  ): OverwriteResolvable[] {
    if (!rules || rules.length === 0) return [];

    const overwrites: OverwriteResolvable[] = [];

    for (const rule of rules) {
      let targetId: string | null = null;

      if (rule.roleName === '@everyone') {
        targetId = guild.roles.everyone.id;
      } else {
        const role = roleMap.get(rule.roleName);
        if (role) {
          targetId = role.id;
        }
      }

      if (targetId) {
        overwrites.push({
          id: targetId,
          allow: rule.allow || [],
          deny: rule.deny || []
        });
      }
    }

    return overwrites;
  }

  /**
   * Limpia canales por defecto creados automáticamente por Discord en servidores nuevos (ej. "general").
   */
  public static async cleanDefaultChannels(guild: Guild): Promise<void> {
    Logger.info('Verificando y limpiando canales iniciales por defecto...');
    const channels = await guild.channels.fetch();

    for (const [, channel] of channels) {
      if (!channel) continue;
      // Si es un canal suelto sin categoría llamado 'general' o 'General'
      if ((channel.name.toLowerCase() === 'general') && !channel.parentId) {
        try {
          Logger.info(`Eliminando canal por defecto no estructurado: #${channel.name} (${channel.id})`);
          await channel.delete('Limpieza inicial de canales por defecto');
        } catch (err) {
          Logger.warn(`No se pudo eliminar el canal por defecto #${channel.name}:`, err);
        }
      }
    }
  }

  /**
   * Sincroniza y crea todas las categorías y canales de forma jerárquica e idempotente.
   */
  public static async provisionCategoriesAndChannels(
    guild: Guild, 
    roleMap: Map<string, Role>
  ): Promise<void> {
    Logger.info('Iniciando aprovisionamiento de categorías y canales...');

    const existingChannels = await guild.channels.fetch();
    const channelList: NonThreadGuildBasedChannel[] = Array.from(existingChannels.values()).filter(
      (c): c is NonThreadGuildBasedChannel => c !== null
    );

    for (const catConfig of CATEGORIES_CONFIG) {
      let category = channelList.find(
        (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === catConfig.name.toLowerCase()
      ) as CategoryChannel | undefined;

      const categoryOverwrites = this.resolvePermissionOverwrites(
        catConfig.permissionOverwrites, 
        guild, 
        roleMap
      );

      if (!category) {
        Logger.info(`Creando categoría: "${catConfig.name}"...`);
        try {
          category = await guild.channels.create({
            name: catConfig.name,
            type: ChannelType.GuildCategory,
            permissionOverwrites: categoryOverwrites,
            reason: 'Aprovisionamiento de arquitectura de servidor AI'
          });
          Logger.success(`Categoría creada: "${category.name}" (ID: ${category.id})`);
          channelList.push(category);
        } catch (err) {
          Logger.error(`Error creando la categoría "${catConfig.name}":`, err);
          continue;
        }
      } else {
        Logger.info(`Categoría existente: "${category.name}". Sincronizando permisos...`);
        try {
          if (categoryOverwrites.length > 0) {
            await category.permissionOverwrites.set(categoryOverwrites);
          }
        } catch (err) {
          Logger.warn(`No se pudieron sincronizar los permisos de la categoría "${category.name}":`, err);
        }
      }

      // Procesar canales dentro de esta categoría
      for (const chanConfig of catConfig.channels) {
        await this.provisionSingleChannel(guild, category, chanConfig, roleMap, channelList);
      }
    }
  }

  private static async provisionSingleChannel(
    guild: Guild,
    parentCategory: CategoryChannel,
    chanConfig: ChannelConfig,
    roleMap: Map<string, Role>,
    channelList: NonThreadGuildBasedChannel[]
  ): Promise<void> {
    const existingChan = channelList.find(
      (c) => c.parentId === parentCategory.id && c.name.toLowerCase() === chanConfig.name.toLowerCase()
    );

    if (existingChan) {
      Logger.info(`Canal existente: "${existingChan.name}" en "${parentCategory.name}".`);
      return;
    }

    Logger.info(`Creando canal: "${chanConfig.name}" dentro de "${parentCategory.name}"...`);

    const channelOverwrites = chanConfig.permissionOverwrites 
      ? this.resolvePermissionOverwrites(chanConfig.permissionOverwrites, guild, roleMap)
      : undefined;

    const targetType = chanConfig.type;
    const isVoice = targetType === ChannelType.GuildVoice;

    const createOptions: any = {
      name: chanConfig.name,
      type: targetType,
      parent: parentCategory.id,
      topic: isVoice ? undefined : chanConfig.topic,
      rateLimitPerUser: isVoice ? undefined : chanConfig.rateLimitPerUser,
      userLimit: chanConfig.userLimit,
      permissionOverwrites: channelOverwrites,
      reason: `Canal de comunidad AI: ${chanConfig.name}`
    };

    try {
      const created = await guild.channels.create(createOptions);
      Logger.success(`Canal creado: "${created.name}" (Tipo: ${ChannelType[created.type]})`);
      channelList.push(created);
    } catch (err: any) {
      // Manejo de fallback si el servidor no tiene habilitada la función Community para Canales de Foro o Anuncios
      if (targetType === ChannelType.GuildForum || targetType === ChannelType.GuildAnnouncement) {
        Logger.warn(
          `No se pudo crear el canal "${chanConfig.name}" como Foro/Anuncio (requiere Modo Comunidad en Discord). Creando como Canal de Texto estándar (GuildText)...`
        );
        try {
          const fallbackOptions: any = {
            ...createOptions,
            type: ChannelType.GuildText,
            topic: `[Modo Foro/Discusión] ${chanConfig.topic || ''}`
          };
          const fallbackCreated = await guild.channels.create(fallbackOptions);
          Logger.success(`Canal alternativo creado: "${fallbackCreated.name}" (GuildText)`);
          channelList.push(fallbackCreated);
        } catch (fallbackErr) {
          Logger.error(`Error al crear canal alternativo "${chanConfig.name}":`, fallbackErr);
        }
      } else {
        Logger.error(`Error al crear canal "${chanConfig.name}":`, err);
      }
    }
  }
}
