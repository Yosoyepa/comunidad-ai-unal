import { Client, GatewayIntentBits, TextChannel, EmbedBuilder, ChannelType } from 'discord.js';
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
          summary: summary.length > 300 ? `${summary.slice(0, 297)}...` : summary,
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
   * Publica los papers obtenidos en el canal de papers de la comunidad.
   */
  public static async postPapersToDiscord(guildId: string, client: Client): Promise<void> {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) return;

    const channels = await guild.channels.fetch();
    const papersChannel = channels.find(
      (c) => c && c.name.includes('papers-y-investigacion') && (c.type === ChannelType.GuildText || c.type === ChannelType.GuildForum)
    );

    if (!papersChannel) {
      Logger.warn('No se encontró el canal #papers-y-investigacion.');
      return;
    }

    const papers = await this.fetchLatestAIPapers(3);
    if (papers.length === 0) {
      Logger.info('No se encontraron nuevos papers para publicar.');
      return;
    }

    Logger.info(`Publicando ${papers.length} papers en #${papersChannel.name}...`);

    for (const paper of papers) {
      const embed = new EmbedBuilder()
        .setTitle(`📄 [arXiv] ${paper.title}`)
        .setURL(paper.id)
        .setDescription(paper.summary)
        .setColor(0x9B59B6)
        .addFields(
          { name: '👥 Autores', value: paper.authors.join(', ') || 'Varios', inline: true },
          { name: '📅 Fecha', value: paper.published, inline: true },
          { name: '📥 Enlaces', value: `[Abstract](${paper.id}) • [Descargar PDF](${paper.pdfUrl})`, inline: false }
        )
        .setFooter({ text: 'arXiv AI Daily Feed • Comunidad UNAL AI' })
        .setTimestamp();

      if (papersChannel.type === ChannelType.GuildText) {
        await (papersChannel as TextChannel).send({ embeds: [embed] });
      }
    }

    Logger.success('Papers de arXiv publicados con éxito.');
  }
}

// Ejecución autónoma si se corre como script
if (require.main === module) {
  if (!BOT_TOKEN || !GUILD_ID) {
    Logger.error('Faltan credenciales en el archivo .env');
    process.exit(1);
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once('ready', async () => {
    Logger.info('Cliente listo para publicar feed de arXiv.');
    await ArxivFeedService.postPapersToDiscord(GUILD_ID, client);
    client.destroy();
    process.exit(0);
  });

  client.login(BOT_TOKEN);
}
