import { Guild } from 'discord.js';
import { AUTOMOD_RULES_CONFIG } from '../config/serverStructure';
import { Logger } from '../utils/logger';

export class AutoModService {
  /**
   * Despliega y sincroniza las reglas de moderación automática (AutoMod) en el servidor.
   */
  public static async provisionAutoModRules(guild: Guild): Promise<void> {
    Logger.info('Iniciando aprovisionamiento de reglas de AutoMod...');

    try {
      const existingRules = await guild.autoModerationRules.fetch();

      for (const ruleConfig of AUTOMOD_RULES_CONFIG) {
        const existingRule = existingRules.find(
          (r) => r.name.toLowerCase() === ruleConfig.name.toLowerCase()
        );

        if (existingRule) {
          Logger.info(`Regla de AutoMod existente: "${existingRule.name}". Actualizando...`);
          try {
            await existingRule.edit({
              name: ruleConfig.name,
              eventType: ruleConfig.eventType,
              triggerMetadata: ruleConfig.triggerMetadata,
              actions: ruleConfig.actions,
              enabled: ruleConfig.enabled,
              reason: ruleConfig.reason
            });
            Logger.success(`Regla de AutoMod actualizada: "${ruleConfig.name}"`);
          } catch (editErr) {
            Logger.warn(`No se pudo actualizar la regla AutoMod "${ruleConfig.name}":`, editErr);
          }
        } else {
          Logger.info(`Creando regla de AutoMod: "${ruleConfig.name}"...`);
          try {
            const createdRule = await guild.autoModerationRules.create({
              name: ruleConfig.name,
              eventType: ruleConfig.eventType,
              triggerType: ruleConfig.triggerType,
              triggerMetadata: ruleConfig.triggerMetadata,
              actions: ruleConfig.actions,
              enabled: ruleConfig.enabled,
              reason: ruleConfig.reason
            });
            Logger.success(`Regla de AutoMod creada: "${createdRule.name}" (ID: ${createdRule.id})`);
          } catch (createErr) {
            Logger.error(`Error al crear la regla de AutoMod "${ruleConfig.name}":`, createErr);
          }
        }
      }
    } catch (fetchErr) {
      Logger.error('Error al obtener o configurar las reglas de AutoMod:', fetchErr);
    }
  }
}
