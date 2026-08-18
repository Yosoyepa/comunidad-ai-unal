import { 
  Interaction, 
  GuildMember, 
  Role,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageActionRowComponent
} from 'discord.js';
import { Logger } from '../utils/logger';
import { INTERACTIVE_PANELS } from '../config/serverStructure';
import { TriviaService } from '../services/triviaService';

export class InteractionHandler {
  private static duelVoters = new Map<string, Set<string>>(); // messageId -> Set<userId>

  /**
   * Procesa todas las interacciones de botones y menús desplegables del servidor.
   */
  public static async handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.inGuild() || !interaction.guild) return;

    try {
      const member = interaction.member as GuildMember;
      if (!member) return;

      // -------------------------------------------------------------
      // 1. MANEJO DE BOTONES
      // -------------------------------------------------------------
      if (interaction.isButton()) {
        const customId = interaction.customId;

        // A. Botones de Trivia Técnica
        if (customId.startsWith('btn_trv:')) {
          const parts = customId.split(':');
          const sessionId = parts[1];
          const selectedIndex = parseInt(parts[2], 10);
          await TriviaService.handleAnswer(interaction, sessionId, selectedIndex);
          return;
        }

        // B. Botones de Votación en Duelo de Modelos
        if (customId.startsWith('btn_duel_vote:')) {
          const votedModel = customId.replace('btn_duel_vote:', ''); // 'gemini' | 'groq'
          const messageId = interaction.message.id;

          let voters = this.duelVoters.get(messageId);
          if (!voters) {
            voters = new Set<string>();
            this.duelVoters.set(messageId, voters);
          }

          if (voters.has(interaction.user.id)) {
            await interaction.reply({
              content: '⚠️ Ya has emitido tu voto en este duelo de modelos.',
              ephemeral: true
            });
            return;
          }

          voters.add(interaction.user.id);

          // Actualizar etiquetas de botones en el mensaje
          const currentComponents = interaction.message.components;
          if (currentComponents.length > 0) {
            const row = currentComponents[0] as any;
            const updatedButtons: ButtonBuilder[] = [];

            if (row && row.components) {
              for (const component of row.components) {
                if (component.type === 2) { // Button component
                  const btn = component as any;
                  let label = btn.label || '';
                  if (btn.customId === `btn_duel_vote:${votedModel}`) {
                    const match = label.match(/\((\d+)\)/);
                    const count = match ? parseInt(match[1], 10) + 1 : 1;
                    label = label.replace(/\(\d+\)/, `(${count})`);
                  }
                  updatedButtons.push(
                    new ButtonBuilder()
                      .setCustomId(btn.customId)
                      .setLabel(label)
                      .setEmoji(btn.emoji?.name || (btn.customId.includes('gemini') ? '🔵' : '🟠'))
                      .setStyle(btn.style)
                  );
                }
              }

              const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(updatedButtons);
              await interaction.update({ components: [newRow] });
            }
          } else {
            await interaction.reply({ content: '✅ ¡Voto registrado!', ephemeral: true });
          }
          return;
        }

        // C. Botones de Roles de Onboarding (Toggling individual)
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
          return;
        }
      }

      // -------------------------------------------------------------
      // 2. MANEJO DE MENÚS DESPLEGABLES MULTI-SELECCIÓN (Dropdowns)
      // -------------------------------------------------------------
      if (interaction.isStringSelectMenu()) {
        const customId = interaction.customId;

        if (customId.startsWith('select_role:')) {
          const selectedRoleNames = interaction.values; // Array con todas las opciones seleccionadas
          const roleType = customId.replace('select_role:', ''); // 'affiliation' | 'region'

          let categoryRoleNames: string[] = [];
          if (roleType === 'affiliation') {
            categoryRoleNames = INTERACTIVE_PANELS.affiliationRoles.map((r) => r.roleName);
          } else if (roleType === 'region') {
            categoryRoleNames = INTERACTIVE_PANELS.regionRoles.map((r) => r.roleName);
          }

          const rolesToAdd: Role[] = [];
          const rolesToRemove: Role[] = [];

          // Identificar roles a agregar dentro de los seleccionados
          for (const name of selectedRoleNames) {
            const role = interaction.guild.roles.cache.find(
              (r) => r.name.toLowerCase() === name.toLowerCase()
            );
            if (role && !member.roles.cache.has(role.id)) {
              rolesToAdd.push(role);
            }
          }

          // Identificar roles de esta categoría que fueron deseleccionados
          for (const catName of categoryRoleNames) {
            if (!selectedRoleNames.includes(catName)) {
              const role = interaction.guild.roles.cache.find(
                (r) => r.name.toLowerCase() === catName.toLowerCase()
              );
              if (role && member.roles.cache.has(role.id)) {
                rolesToRemove.push(role);
              }
            }
          }

          // Aplicar cambios
          if (rolesToAdd.length > 0) {
            await member.roles.add(rolesToAdd, 'Auto-asignación multi-rol vía menú interactivo');
          }
          if (rolesToRemove.length > 0) {
            await member.roles.remove(rolesToRemove, 'Remoción de roles deseleccionados');
          }

          const currentSelectedText = selectedRoleNames.map((r) => `• **${r}**`).join('\n');

          await interaction.reply({
            content: `✅ **¡Perfil actualizado exitosamente!**\nTus roles seleccionados en esta categoría ahora son:\n${currentSelectedText}`,
            ephemeral: true
          });

          Logger.info(`Roles (${roleType}) actualizados para ${member.user.tag}: ${selectedRoleNames.join(', ')}`);
        }
      }
    } catch (error) {
      Logger.error('Error procesando interacción:', error);
      if (interaction.isRepliable() && !interaction.replied) {
        await interaction.reply({
          content: '❌ Ocurrió un error al procesar tu selección. Por favor intenta de nuevo.',
          ephemeral: true
        });
      }
    }
  }
}
