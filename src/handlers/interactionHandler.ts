import { Interaction, GuildMember, Role } from 'discord.js';
import { Logger } from '../utils/logger';
import { INTERACTIVE_PANELS } from '../config/serverStructure';

export class InteractionHandler {
  /**
   * Procesa las interacciones de botones y menús desplegables para auto-asignación de roles.
   */
  public static async handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.inGuild() || !interaction.guild) return;

    try {
      const member = interaction.member as GuildMember;
      if (!member) return;

      // -------------------------------------------------------------
      // 1. MANEJO DE BOTONES (Toggling de roles)
      // -------------------------------------------------------------
      if (interaction.isButton()) {
        const customId = interaction.customId;

        if (customId.startsWith('btn_role:')) {
          const roleName = customId.replace('btn_role:', '');
          const role = interaction.guild.roles.cache.find(
            (r) => r.name.toLowerCase() === roleName.toLowerCase()
          );

          if (!role) {
            await interaction.reply({
              content: `⚠️ No se encontró el rol \`${roleName}\` en el servidor. Contacta a un administrador.`,
              ephemeral: true
            });
            return;
          }

          const hasRole = member.roles.cache.has(role.id);

          if (hasRole) {
            await member.roles.remove(role, 'Auto-remoción de rol vía botón interactivo');
            await interaction.reply({
              content: `❌ **Rol removido:** Se ha retirado el rol **${role.name}** de tu perfil.`,
              ephemeral: true
            });
            Logger.info(`Rol ${role.name} removido a ${member.user.tag}`);
          } else {
            await member.roles.add(role, 'Auto-asignación de rol vía botón interactivo');
            await interaction.reply({
              content: `✅ **¡Rol asignado!** Ahora tienes el rol **${role.name}**.`,
              ephemeral: true
            });
            Logger.info(`Rol ${role.name} asignado a ${member.user.tag}`);
          }
        }
      }

      // -------------------------------------------------------------
      // 2. MANEJO DE MENÚS DESPLEGABLES (Dropdowns)
      // -------------------------------------------------------------
      if (interaction.isStringSelectMenu()) {
        const customId = interaction.customId;

        if (customId.startsWith('select_role:')) {
          const selectedRoleName = interaction.values[0];
          const roleType = customId.replace('select_role:', ''); // 'affiliation' | 'region'

          const targetRole = interaction.guild.roles.cache.find(
            (r) => r.name.toLowerCase() === selectedRoleName.toLowerCase()
          );

          if (!targetRole) {
            await interaction.reply({
              content: `⚠️ No se encontró el rol \`${selectedRoleName}\` en el servidor.`,
              ephemeral: true
            });
            return;
          }

          // Remover otros roles de la misma categoría para evitar duplicados (ej: varios países)
          let categoryRolesToRemove: string[] = [];
          if (roleType === 'region') {
            categoryRolesToRemove = INTERACTIVE_PANELS.regionRoles.map((r) => r.roleName);
          } else if (roleType === 'affiliation') {
            categoryRolesToRemove = INTERACTIVE_PANELS.affiliationRoles.map((r) => r.roleName);
          }

          const rolesToRemove = interaction.guild.roles.cache.filter((r) =>
            categoryRolesToRemove.includes(r.name) && r.id !== targetRole.id && member.roles.cache.has(r.id)
          );

          for (const [, roleToRemove] of rolesToRemove) {
            await member.roles.remove(roleToRemove, 'Reemplazo de rol de categoría');
          }

          // Asignar el rol seleccionado
          await member.roles.add(targetRole, 'Auto-asignación de rol vía menú desplegable');

          await interaction.reply({
            content: `✅ **¡Perfil actualizado!** Se ha configurado tu rol como **${targetRole.name}**.`,
            ephemeral: true
          });

          Logger.info(`Categoría ${roleType} actualizada para ${member.user.tag}: ${targetRole.name}`);
        }
      }
    } catch (error) {
      Logger.error('Error procesando interacción de rol:', error);
      if (interaction.isRepliable() && !interaction.replied) {
        await interaction.reply({
          content: '❌ Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.',
          ephemeral: true
        });
      }
    }
  }
}
