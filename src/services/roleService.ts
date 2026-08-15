import { Guild, Role } from 'discord.js';
import { ROLES_CONFIG, RoleConfig } from '../config/serverStructure';
import { Logger } from '../utils/logger';

export class RoleService {
  /**
   * Sincroniza y aprovisiona los roles de manera idempotente en el servidor.
   * Retorna un mapa de Nombre de Rol -> Instancia de Role de discord.js.
   */
  public static async provisionRoles(guild: Guild): Promise<Map<string, Role>> {
    Logger.info('Iniciando sincronización idempotente de roles...');
    const roleMap = new Map<string, Role>();

    // Obtener roles actuales del servidor
    const existingRoles = await guild.roles.fetch();

    for (const roleDef of ROLES_CONFIG) {
      const existingRole = existingRoles.find(
        (r) => r.name.toLowerCase() === roleDef.name.toLowerCase()
      );

      if (existingRole) {
        Logger.info(`Rol existente encontrado: "${existingRole.name}" (ID: ${existingRole.id}). Actualizando configuración...`);
        try {
          const updatedRole = await existingRole.edit({
            color: roleDef.color,
            hoist: roleDef.hoist,
            mentionable: roleDef.mentionable,
            permissions: roleDef.permissions,
            reason: 'Actualización idempotente de roles del servidor'
          });
          roleMap.set(roleDef.name, updatedRole);
          Logger.success(`Rol actualizado: "${updatedRole.name}"`);
        } catch (err) {
          Logger.warn(`No se pudo actualizar el rol "${roleDef.name}" (posible limitación de jerarquía):`, err);
          roleMap.set(roleDef.name, existingRole);
        }
      } else {
        Logger.info(`Creando nuevo rol: "${roleDef.name}"...`);
        try {
          const newRole = await guild.roles.create({
            name: roleDef.name,
            color: roleDef.color,
            hoist: roleDef.hoist,
            mentionable: roleDef.mentionable,
            permissions: roleDef.permissions,
            reason: `Aprovisionamiento de comunidad AI: ${roleDef.description || 'Rol del sistema'}`
          });
          roleMap.set(roleDef.name, newRole);
          Logger.success(`Rol creado con éxito: "${newRole.name}" (ID: ${newRole.id})`);
        } catch (err) {
          Logger.error(`Error al crear el rol "${roleDef.name}":`, err);
        }
      }
    }

    return roleMap;
  }
}
