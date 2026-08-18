import { 
  Guild, 
  TextChannel, 
  EmbedBuilder, 
  ChannelType 
} from 'discord.js';
import { Logger } from '../utils/logger';
import { HERMES_TIERS } from './hermesPointsService';

export class CommandGuideService {
  /**
   * Publica o refresca la guía oficial visual de comandos y gobernanza en #comandos-y-guia.
   */
  public static async postCommandGuide(guild: Guild, forceRefresh = false): Promise<void> {
    const channels = await guild.channels.fetch();
    const guideChannel = channels.find(
      (c) => c && c.type === ChannelType.GuildText && c.name.includes('comandos-y-guia')
    ) as TextChannel | undefined;

    if (!guideChannel) {
      Logger.warn('No se encontró el canal #comandos-y-guia.');
      return;
    }

    if (forceRefresh) {
      try {
        const oldMessages = await guideChannel.messages.fetch({ limit: 10 });
        for (const [, msg] of oldMessages) {
          await msg.delete();
        }
      } catch (err) {
        Logger.warn('Error limpiando mensajes previos de guía:', err);
      }
    } else {
      const messages = await guideChannel.messages.fetch({ limit: 5 });
      if (messages.size > 0) {
        Logger.info(`El canal #${guideChannel.name} ya tiene contenido. Se omite duplicado.`);
        return;
      }
    }

    Logger.info(`Publicando compendio oficial de comandos en #${guideChannel.name}...`);

    // 1. EMBED: ASISTENTE DE IA Y ENRUTADOR A2A
    const aiEmbed = new EmbedBuilder()
      .setTitle('🧠 1. Asistente Técnico de IA & Enrutador Multi-Proveedor A2A')
      .setDescription(
        'El servidor cuenta con un enrutador inteligente de inferencia tolerante a fallos que conecta en cascada con **Google Gemini 3.5 Flash Lite**, **Groq Cloud (Llama 3.3 70B)** y **OpenRouter**.\n\n' +
        '### ⚡ Comandos Disponibles:'
      )
      .setColor(0x9B59B6)
      .addFields(
        {
          name: '🤖 `/preguntar-ia [pregunta]`',
          value: 'Realiza consultas técnicas sobre arquitecturas de modelos, debugging de código (PyTorch, Hugging Face, LangChain), RAG, fine-tuning y despliegue.'
        },
        {
          name: '📄 `/resumir-paper [contenido / tema]`',
          value: 'Genera un desglose estructurado de un paper de investigación (Objetivo, Metodología, Arquitectura, Resultados y Conclusiones).'
        },
        {
          name: '⚔️ `/duelo-ia [prompt]`',
          value: 'Ejecuta una comparativa lado a lado entre **Gemini 3.5 Flash Lite** y **Groq Llama 3.3 70B** en tiempo real con votación comunitaria.'
        },
        {
          name: '🛡️ Políticas de Uso & Rate Limits',
          value: '• **Máximo 3 peticiones cada 3 minutos por usuario** para garantizar acceso equitativo y proteger cuotas de inferencia.\n• Las respuestas a preguntas idénticas se sirven desde memoria en 0ms.'
        }
      );

    // 2. EMBED: SISTEMA DE REPUTACIÓN Y JERARQUÍA DE RANGOS
    const tierListText = HERMES_TIERS.map(
      (t) => `• **${t.badge} ${t.roleName}**: **${t.minPoints}+ pts** — *${t.description}*`
    ).join('\n');

    const hermesEmbed = new EmbedBuilder()
      .setTitle('⚡ 2. Sistema de Reputación & Progresión de Rangos AI')
      .setDescription(
        'Este mecanismo reconoce y premia la colaboración activa, la resolución de dudas en la comunidad y las victorias en retos técnicos de IA.\n\n' +
        '### 🏆 Escalera de Rangos (Auto-Promoción Automática de Roles):\n' +
        `${tierListText}\n\n` +
        '### 📜 Comandos de Reputación:'
      )
      .setColor(0x00A859)
      .addFields(
        {
          name: '🤝 `/agradecer [usuario] [motivo]`',
          value: 'Otorga **+5 Puntos Hermes** a un compañero que te haya ayudado a resolver una duda o compartido un recurso valioso.'
        },
        {
          name: '📊 `/perfil-hermes [usuario opcional]`',
          value: 'Consulta tu tarjeta académica, rango actual, puntos acumulados y progreso hacia el siguiente nivel.'
        },
        {
          name: '👑 `/ranking-hermes`',
          value: 'Muestra el Cuadro de Honor con los miembros más destacados y sabios de la comunidad.'
        }
      );

    // 3. EMBED: GAMIFICACIÓN, RETOS Y PROYECTOS
    const gamingEmbed = new EmbedBuilder()
      .setTitle('🎯 3. Gamificación, Retos & Generador de Proyectos')
      .setDescription('Participa en dinámicas interactivas para poner a prueba tus conocimientos y ganar puntos:')
      .setColor(0xF39C12)
      .addFields(
        {
          name: '🎲 `/trivia-ia`',
          value: 'Responde preguntas de opción múltiple con botones sobre Transformers, RAG, PyTorch y ML. Cada acierto otorga **+10 Puntos Hermes**.'
        },
        {
          name: '💡 `/generar-proyecto-ia [area] [dificultad]`',
          value: 'Genera ideas estructuradas de proyectos de investigación o hackathons con datasets, stack tecnológico y arquitectura recomendada.'
        },
        {
          name: '🏆 `/reto-semanal`',
          value: 'Consulta el reto activo de optimización de prompts o algoritmos publicado en `#🧪┃prompts-y-experimentos`.'
        },
        {
          name: '🎫 `/ticket-panel`',
          value: 'Solicita un canal de texto privado para resolver dudas directas con el equipo o solicitar mentoría técnica.'
        }
      )
      .setFooter({ text: 'Inter Aulas Academiæ Quære Verum • Comunidad AI UNAL' });

    await guideChannel.send({ embeds: [aiEmbed, hermesEmbed, gamingEmbed] });
    Logger.success(`Guía de comandos publicada con éxito en #${guideChannel.name}`);
  }
}
