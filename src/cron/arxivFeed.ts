import { 
  Client, 
  GatewayIntentBits, 
  TextChannel, 
  ForumChannel, 
  EmbedBuilder, 
  ChannelType,
  Events 
} from 'discord.js';
import * as dotenv from 'dotenv';
import { Logger } from '../utils/logger';

dotenv.config();

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  pdfUrl: string;
}

export class ArxivFeedService {
  /**
   * Obtiene los papers más recientes de Inteligencia Artificial desde la API oficial de arXiv.
   */
  public static async fetchLatestAIPapers(limit = 3): Promise<ArxivPaper[]> {
    Logger.info('Consultando API pública de arXiv para papers recientes de IA...');
    const url = `http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.CL+OR+cat:cs.CV+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=${limit}`;

    try {
      const response = await fetch(url);
      const text = await response.text();

      // Parsear entradas básicas del XML Atom de arXiv
      const papers: ArxivPaper[] = [];
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let match;

      while ((match = entryRegex.exec(text)) !== null && papers.length < limit) {
        const entryXml = match[1];

        const idMatch = entryXml.match(/<id>(.*?)<\/id>/);
        const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
        const summaryMatch = entryXml.match(/<summary>([\s\S]*?)<\/summary>/);
        const publishedMatch = entryXml.match(/<published>(.*?)<\/published>/);

        const authors: string[] = [];
        const authorRegex = /<author>\s*<name>(.*?)<\/name>/g;
        let authMatch;
        while ((authMatch = authorRegex.exec(entryXml)) !== null) {
          authors.push(authMatch[1]);
        }

        const id = idMatch ? idMatch[1].trim() : '';
        const title = titleMatch ? titleMatch[1].replace(/\n/g, ' ').trim() : 'Sin título';
        const summary = summaryMatch ? summaryMatch[1].replace(/\n/g, ' ').trim() : 'Sin resumen';
        const published = publishedMatch ? publishedMatch[1].slice(0, 10) : new Date().toISOString().slice(0, 10);
        const pdfUrl = id.replace('abs', 'pdf');

        papers.push({
          id,
          title,
          summary: summary.length > 400 ? `${summary.slice(0, 397)}...` : summary,
          authors: authors.slice(0, 4),
          published,
          pdfUrl
        });
      }

      return papers;
    } catch (err) {
      Logger.error('Error obteniendo papers de arXiv:', err);
      return [];
    }
  }

  /**
   * Publica los papers obtenidos en el canal de papers de la comunidad (soporta canales de Texto y Canales de Foro).
   */
  public static async postPapersToDiscord(guildId: string, client: Client): Promise<void> {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      Logger.error(`No se encontró el servidor con ID ${guildId}`);
      return;
    }

    const channels = await guild.channels.fetch();
    const papersChannel = channels.find(
      (c) => c && c.name.includes('papers-y-investigacion')
    );

    if (!papersChannel) {
      Logger.warn('No se encontró el canal #papers-y-investigacion en el servidor.');
      return;
    }

    const papers = await this.fetchLatestAIPapers(3);
    if (papers.length === 0) {
      Logger.info('No se encontraron nuevos papers para publicar.');
      return;
    }

    Logger.info(`Publicando ${papers.length} papers en #${papersChannel.name} (Tipo: ${ChannelType[papersChannel.type]})...`);

    for (const paper of papers) {
      const embed = new EmbedBuilder()
        .setTitle(`📄 [arXiv] ${paper.title}`)
        .setURL(paper.id)
        .setDescription(paper.summary)
        .setColor(0x9B59B6)
        .addFields(
          { name: '👥 Autores', value: paper.authors.join(', ') || 'Varios autores', inline: true },
          { name: '📅 Publicado', value: paper.published, inline: true },
          { name: '📥 Enlaces Directos', value: `[Ver en arXiv](${paper.id}) • [Descargar PDF](${paper.pdfUrl})`, inline: false }
        )
        .setFooter({ text: 'arXiv AI Daily Feed • Universidad Nacional de Colombia (UNAL AI)' })
        .setTimestamp();

      try {
        if (papersChannel.type === ChannelType.GuildForum) {
          const forumChannel = papersChannel as ForumChannel;
          const tag = forumChannel.availableTags.find(
            (t) => t.name.toLowerCase().includes('arxiv') || t.name.toLowerCase().includes('paper')
          );
          await forumChannel.threads.create({
            name: `📄 ${paper.title.slice(0, 90)}`,
            message: { embeds: [embed] },
            appliedTags: tag ? [tag.id] : []
          });
          Logger.success(`Post de Foro creado para paper: "${paper.title.slice(0, 50)}..."`);
        } else if (
          papersChannel.type === ChannelType.GuildText || 
          papersChannel.type === ChannelType.GuildAnnouncement
        ) {
          await (papersChannel as TextChannel).send({ embeds: [embed] });
          Logger.success(`Mensaje enviado para paper: "${paper.title.slice(0, 50)}..."`);
        }
      } catch (postErr) {
        Logger.error(`Error publicando paper "${paper.title.slice(0, 40)}":`, postErr);
      }
    }

    Logger.success('Todos los papers de arXiv han sido publicados con éxito en Discord.');
  }
}

// Ejecución autónoma si se corre como script o cron job
if (require.main === module) {
  if (!BOT_TOKEN || !GUILD_ID) {
    Logger.error('Faltan credenciales en las variables de entorno (DISCORD_BOT_TOKEN o DISCORD_GUILD_ID).');
    process.exit(1);
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, async () => {
    Logger.info('Cliente conectado. Iniciando difusión de papers de arXiv...');
    try {
      await ArxivFeedService.postPapersToDiscord(GUILD_ID, client);
    } catch (err) {
      Logger.error('Fallo en el proceso de difusión de papers:', err);
    } finally {
      client.destroy();
      process.exit(0);
    }
  });

  client.login(BOT_TOKEN);
}
