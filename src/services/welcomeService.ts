import { Guild, TextChannel, EmbedBuilder, ChannelType } from 'discord.js';
import { Logger } from '../utils/logger';
import { TicketHandler } from '../handlers/ticketHandler';
import { CommandGuideService } from './commandGuideService';

export class WelcomeService {
  /**
   * Publica contenido inicial formateado con Embeds en canales clave informativos si están vacíos.
   */
  public static async setupInformationChannels(guild: Guild): Promise<void> {
    Logger.info('Verificando y publicando contenido de bienvenida y normativas...');

    const channels = await guild.channels.fetch();

    // 1. REGLAS Y NORMAS
    const rulesChannel = channels.find(
      (c) => c && c.type === ChannelType.GuildText && c.name.includes('reglas-y-normas')
    ) as TextChannel | undefined;

    if (rulesChannel) {
      const messages = await rulesChannel.messages.fetch({ limit: 5 });
      if (messages.size === 0) {
        Logger.info(`Publicando reglamento oficial en #${rulesChannel.name}...`);

        const rulesEmbed = new EmbedBuilder()
          .setTitle('📜 Código de Conducta y Normas de la Comunidad')
          .setDescription('Bienvenido a la comunidad de Inteligencia Artificial. Para mantener un ambiente riguroso, colaborativo y respetuoso, todos los miembros deben seguir estas normas:')
          .setColor(0x00A859) // Verde UNAL
          .addFields(
            {
              name: '1. Respeto y Rigor Académico',
              value: 'Trata a todos los miembros con cortesía. Fomentamos el debate técnico constructivo, la argumentación con fuentes y la colaboración abierta.'
            },
            {
              name: '2. Seguridad y Privacidad de Credenciales',
              value: 'Está estrictamente prohibido compartir **API Keys** (OpenAI, Anthropic, Hugging Face, etc.), tokens o credenciales privadas. Nuestro sistema AutoMod bloqueará automáticamente mensajes que contengan claves.'
            },
            {
              name: '3. Calidad de Contenido y Cero Spam',
              value: 'Utiliza los canales temáticos correspondientes. Prohibido el spam, publicidad no solicitada, enlaces de referidos o estafas cripto/airdrops.'
            },
            {
              name: '4. Uso Ético de la Inteligencia Artificial',
              value: 'Promovemos el desarrollo responsable de IA. No se permite compartir exploits maliciosos, deepfakes no consentidos o contenido que viole leyes aplicables.'
            },
            {
              name: '5. Canales de Ayuda y Preguntas Técnicas',
              value: 'Antes de preguntar, describe claramente tu problema, incluye el código relevante formateado en bloques de Markdown y detalla qué has intentado.'
            }
          )
          .setFooter({ text: 'Inter Aulas Academiæ Quære Verum • Universidad Nacional de Colombia' })
          .setTimestamp();

        await rulesChannel.send({ embeds: [rulesEmbed] });
        Logger.success(`Reglas publicadas en #${rulesChannel.name}`);
      } else {
        Logger.info(`El canal #${rulesChannel.name} ya contiene mensajes. Se omite duplicado.`);
      }
    }

    // 2. BIENVENIDA Y ROLES (GUÍA GENERAL)
    const welcomeChannel = channels.find(
      (c) => c && c.type === ChannelType.GuildText && c.name.includes('bienvenida-y-roles')
    ) as TextChannel | undefined;

    if (welcomeChannel) {
      const messages = await welcomeChannel.messages.fetch({ limit: 5 });
      if (messages.size === 0) {
        Logger.info(`Publicando guía de bienvenida en #${welcomeChannel.name}...`);

        const welcomeEmbed = new EmbedBuilder()
          .setTitle('👋 ¡Bienvenido a la Comunidad AI!')
          .setDescription(
            'Somos un espacio colaborativo para estudiantes, investigadores, ingenieros y creadores apasionados por la Inteligencia Artificial y la Ciencia de Datos.\n\n' +
            '### 🎯 ¿Cuál es tu enfoque?'
          )
          .setColor(0x3498DB)
          .addFields(
            {
              name: '🔬 AI Researcher',
              value: 'Para quienes exploran arquitecturas de redes, papers, fundamentos teóricos, matemáticas del deep learning y experimentación.'
            },
            {
              name: '💻 AI Engineer / MLOps',
              value: 'Para desarrolladores que implementan RAG, Fine-tuning, pipelines de datos, optimización con vLLM/Ollama y despliegues en producción.'
            },
            {
              name: '🛠️ Prompt Crafter / Builder',
              value: 'Para creadores de aplicaciones con agentes, workflows automatizados, optimización de system prompts y productos basados en IA.'
            }
          )
          .addFields({
            name: '🚀 ¿Cómo empezar?',
            value: '1. Preséntate en el canal **#🤝┃presentaciones** contando tus intereses o proyectos actuales.\n2. Únete a las discusiones en **#🤖┃llms-y-agentes** o consulta dudas en **#❓┃dudas-y-code-review**.\n3. Comparte tus demos en **#💡┃showcase-proyectos**.'
          })
          .setFooter({ text: 'Explora, construye y comparte con la comunidad' });

        await welcomeChannel.send({ embeds: [welcomeEmbed] });
        Logger.success(`Guía de bienvenida publicada en #${welcomeChannel.name}`);
      } else {
        Logger.info(`El canal #${welcomeChannel.name} ya contiene mensajes. Se omite duplicado.`);
      }
    }

    // 3. RECURSOS Y ENLACES
    const resourcesChannel = channels.find(
      (c) => c && c.type === ChannelType.GuildText && c.name.includes('recursos-y-links')
    ) as TextChannel | undefined;

    if (resourcesChannel) {
      const messages = await resourcesChannel.messages.fetch({ limit: 5 });
      if (messages.size === 0) {
        Logger.info(`Publicando compendio de recursos en #${resourcesChannel.name}...`);

        const resourcesEmbed = new EmbedBuilder()
          .setTitle('🔗 Compendio Esencial de Recursos de IA')
          .setDescription('Colección de herramientas, documentación y repositorios clave recomendados por la comunidad:')
          .setColor(0xF39C12)
          .addFields(
            {
              name: '📚 Documentación y APIs Fundamentales',
              value: '• [OpenAI Platform Docs](https://platform.openai.com/docs)\n• [Anthropic Claude Docs](https://docs.anthropic.com)\n• [Google AI Studio / Gemini](https://ai.google.dev/)\n• [Hugging Face Hub](https://huggingface.co/)'
            },
            {
              name: '🛠️ Frameworks y Agentes',
              value: '• [LangChain / LangGraph](https://www.langchain.com/)\n• [LlamaIndex](https://www.llamaindex.ai/)\n• [CrewAI](https://www.crewai.com/)\n• [Microsoft AutoGen](https://microsoft.github.io/autogen/)'
            },
            {
              name: '⚡ Inferencia Local y Fine-Tuning',
              value: '• [Ollama](https://ollama.com/)\n• [vLLM](https://docs.vllm.ai/)\n• [Unsloth](https://github.com/unslothai/unsloth)\n• [Axolotl](https://github.com/OpenAccess-AI-Collective/axolotl)'
            },
            {
              name: '🔬 Investigación y Papers',
              value: '• [Papers With Code](https://paperswithcode.com/)\n• [arXiv Sanity](https://arxiv-sanity-lite.com/)\n• [Hugging Face Daily Papers](https://huggingface.co/papers)'
            }
          )
          .setFooter({ text: 'Recursos actualizados periódicamente por la comunidad' });

        await resourcesChannel.send({ embeds: [resourcesEmbed] });
        Logger.success(`Recursos publicados en #${resourcesChannel.name}`);
      } else {
        Logger.info(`El canal #${resourcesChannel.name} ya contiene mensajes. Se omite duplicado.`);
      }
    }

    // 4. ABRIR TICKET
    const ticketChannel = channels.find(
      (c) => c && c.type === ChannelType.GuildText && c.name.includes('abrir-ticket')
    ) as TextChannel | undefined;

    if (ticketChannel) {
      const messages = await ticketChannel.messages.fetch({ limit: 5 });
      if (messages.size === 0) {
        Logger.info(`Publicando panel de tickets en #${ticketChannel.name}...`);
        await TicketHandler.postTicketPanel(ticketChannel);
      } else {
        Logger.info(`El canal #${ticketChannel.name} ya contiene mensajes. Se omite duplicado.`);
      }
    }

    // 5. COMPENDIO OFICIAL DE COMANDOS Y GUÍA
    await CommandGuideService.postCommandGuide(guild);
  }
}
