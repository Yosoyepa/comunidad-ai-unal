import { Guild, TextChannel, EmbedBuilder, ChannelType } from 'discord.js';
import { Logger } from '../utils/logger';
import { TicketHandler } from '../handlers/ticketHandler';

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
          .setTitle('📜 Código de Conducta y Normas de la Comunidad AI')
          .setDescription('¡Bienvenido/a a la comunidad de Inteligencia Artificial! Nuestro objetivo es fomentar la investigación, el desarrollo ético y la colaboración técnica en torno a la IA. Para garantizar un ambiente constructivo, te pedimos respetar las siguientes normas:')
          .setColor(0x3498DB)
          .addFields(
            {
              name: '1. 🔒 Seguridad Absoluta de Credenciales y Claves de API',
              value: 'Queda estrictamente prohibido compartir **API Keys** (OpenAI, Anthropic, HuggingFace, etc.), tokens de acceso o contraseñas. Disponemos de filtros automáticos de seguridad, pero eres responsable de tus claves.'
            },
            {
              name: '2. 🤝 Respeto, Diversidad y Colaboración Técnica',
              value: 'Trata a todos los miembros con respeto. Se incentiva el debate técnico constructivo, la crítica de código fundamentada y la resolución colaborativa de problemas.'
            },
            {
              name: '3. 🧠 Uso Ético y Responsable de la IA',
              value: 'No está permitido compartir, promover o solicitar contenido malicioso (malware con IA, jailbreaks destructivos, deepfakes no consentidos o generación de spam).'
            },
            {
              name: '4. 🚫 Cero Tolerancia al Spam y Auto-Promoción Desmedida',
              value: 'No hagas spam de enlaces de invitación a otros servidores o esquemas cripto. Comparte tus proyectos y demos en el canal dedicado **#showcase-proyectos**.'
            },
            {
              name: '5. 📂 Canales Temáticos Adecuados',
              value: 'Publica cada tema en su canal correspondiente (LLMs, Visión, RAG, Fine-tuning, Empleo). Mantén los hilos ordenados.'
            }
          )
          .setFooter({ text: 'Comunidad AI • Seguridad y Conocimiento Compartido' })
          .setTimestamp();

        await rulesChannel.send({ embeds: [rulesEmbed] });
        Logger.success(`Reglamento publicado en #${rulesChannel.name}`);
      } else {
        Logger.info(`El canal #${rulesChannel.name} ya contiene mensajes. Se omite duplicado.`);
      }
    }

    // 2. BIENVENIDA Y ROLES
    const welcomeChannel = channels.find(
      (c) => c && c.type === ChannelType.GuildText && c.name.includes('bienvenida-y-roles')
    ) as TextChannel | undefined;

    if (welcomeChannel) {
      const messages = await welcomeChannel.messages.fetch({ limit: 5 });
      if (messages.size === 0) {
        Logger.info(`Publicando guía de bienvenida y roles en #${welcomeChannel.name}...`);

        const welcomeEmbed = new EmbedBuilder()
          .setTitle('👋 ¡Bienvenido/a al Hub de Inteligencia Artificial!')
          .setDescription('Este servidor reúne a investigadores, ingenieros de software, diseñadores de prompts y entusiastas del ecosistema de IA. Personaliza tu perfil asignándote los roles que mejor definen tu enfoque técnico:')
          .setColor(0x2ECC71)
          .addFields(
            {
              name: '🔬 AI Researcher / Scientist',
              value: 'Para quienes investigan arquitecturas de modelos, papers de arXiv, modelos fundacionales y matemáticas del aprendizaje profundo.'
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
  }
}
