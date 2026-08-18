import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ButtonInteraction, 
  GuildMember 
} from 'discord.js';
import { HermesPointsService } from './hermesPointsService';
import { Logger } from '../utils/logger';

export interface TriviaQuestion {
  id: string;
  category: 'LLMs & Transformers' | 'RAG & Vector DBs' | 'ML Fundamentals' | 'PyTorch & Code' | 'Historia & Ética';
  difficulty: 'Iniciación' | 'Intermedio' | 'Avanzado';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTION_BANK: TriviaQuestion[] = [
  {
    id: 'trv_01',
    category: 'LLMs & Transformers',
    difficulty: 'Intermedio',
    question: '¿Cuál es la complejidad temporal y espacial estándar de la auto-atención (Self-Attention) tradicional de Transformers respecto a la longitud de secuencia N?',
    options: [
      'O(N)',
      'O(N log N)',
      'O(N²)',
      'O(2ᴺ)'
    ],
    correctIndex: 2,
    explanation: 'La auto-atención convencional calcula una matriz de atención de tamaño N x N (Q · K^T), lo que escala cuadráticamente O(N²) en tiempo y memoria.'
  },
  {
    id: 'trv_02',
    category: 'RAG & Vector DBs',
    difficulty: 'Intermedio',
    question: 'En un pipeline RAG moderno, ¿qué técnica combina búsqueda léxica (BM25) con búsqueda semántica vectorial densa?',
    options: [
      'Quantization INT4',
      'Hybrid Search (Búsqueda Híbrida) + Reranking',
      'Rotary Positional Embedding (RoPE)',
      'Direct Preference Optimization (DPO)'
    ],
    correctIndex: 1,
    explanation: 'La Búsqueda Híbrida une la precisión de palabras clave exactas (BM25) con embeddings densos, seguida por un modelo Cross-Encoder (Reranker).'
  },
  {
    id: 'trv_03',
    category: 'ML Fundamentals',
    difficulty: 'Iniciación',
    question: '¿Qué problema matemático ayuda a mitigar principalmente el algoritmo de optimización Adam (Adaptive Moment Estimation)?',
    options: [
      'Overfitting por exceso de parámetros',
      'Tasas de aprendizaje fijas e inadecuadas mediante medias móviles de gradientes',
      'Falta de datos de entrenamiento etiquetados',
      'Cuellos de botella de ancho de banda en GPU'
    ],
    correctIndex: 1,
    explanation: 'Adam combina los beneficios de AdaGrad y RMSProp manteniendo promedios móviles exponenciales de los gradientes (primer momento) y sus cuadrados (segundo momento).'
  },
  {
    id: 'trv_04',
    category: 'LLMs & Transformers',
    difficulty: 'Avanzado',
    question: '¿En qué se diferencia LoRA (Low-Rank Adaptation) del Fine-Tuning completo convencional?',
    options: [
      'LoRA congela los pesos base e inserta matrices descomponibles de bajo rango A y B (W = W₀ + B·A)',
      'LoRA duplica la memoria de video requerida para el optimizador AdamW',
      'LoRA solo funciona en modelos de visión por computadora como ResNet',
      'LoRA recalcula todos los pesos de la red sin usar matrices de bajo rango'
    ],
    correctIndex: 0,
    explanation: 'LoRA congela el modelo original y solo entrena dos matrices de rango r muy pequeño (B y A), reduciendo el consumo de VRAM de entrenamiento hasta en un 80%.'
  },
  {
    id: 'trv_05',
    category: 'PyTorch & Code',
    difficulty: 'Intermedio',
    question: 'En PyTorch, ¿para qué se utiliza el bloque de contexto `with torch.no_grad():` durante la inferencia?',
    options: [
      'Para compilar el modelo a C++ en tiempo de ejecución',
      'Para desactivar el cálculo y almacenamiento del grafo de gradientes autograd, ahorrando memoria y acelerando el paso forward',
      'Para reiniciar las capas de Dropout y BatchNorm a cero',
      'Para forzar el entrenamiento en la CPU en lugar de la GPU'
    ],
    correctIndex: 1,
    explanation: '`torch.no_grad()` desactiva el rastreo de autograd, reduciendo drásticamente el uso de memoria RAM/VRAM en evaluaciones.'
  },
  {
    id: 'trv_06',
    category: 'LLMs & Transformers',
    difficulty: 'Iniciación',
    question: '¿Qué paper fundacional publicado por investigadores de Google en 2017 introdujo la arquitectura Transformer?',
    options: [
      'Deep Residual Learning for Image Recognition',
      'Attention Is All You Need',
      'Generative Adversarial Nets',
      'Mastering the Game of Go without Human Knowledge'
    ],
    correctIndex: 1,
    explanation: '"Attention Is All You Need" (Vaswani et al., 2017) introdujo los Transformers basados puramente en mecanismos de auto-atención.'
  },
  {
    id: 'trv_07',
    category: 'RAG & Vector DBs',
    difficulty: 'Avanzado',
    question: '¿Qué ventaja principal ofrece HNSW (Hierarchical Navigable Small World) en motores de bases de datos vectoriales?',
    options: [
      'Búsqueda aproximada de vecinos más cercanos (ANN) con complejidad logarítmica O(log N) y alta precisión',
      'Compresión de texto sin pérdida a un 90%',
      'Cifrado homomórfico automático de embeddings',
      'Ejecución nativa de modelos en navegadores web'
    ],
    correctIndex: 0,
    explanation: 'HNSW crea grafos jerárquicos multicapa que permiten navegar de forma ultra-rápida en espacio vectorial con complejidad O(log N).'
  }
];

interface ActiveTriviaSession {
  questionId: string;
  userId: string;
  expiresAt: number;
}

export class TriviaService {
  private static activeSessions = new Map<string, ActiveTriviaSession>();
  private static cooldowns = new Map<string, number>();
  private static COOLDOWN_MS = 2 * 60 * 1000; // 2 minutos entre trivias por usuario

  /**
   * Genera una nueva trivia interactiva con botones.
   */
  public static createTrivia(userId: string): { 
    allowed: boolean; 
    waitSeconds?: number; 
    embed?: EmbedBuilder; 
    row?: ActionRowBuilder<ButtonBuilder>;
    sessionId?: string;
  } {
    const now = Date.now();
    const lastAttempt = this.cooldowns.get(userId) || 0;

    if (now - lastAttempt < this.COOLDOWN_MS) {
      const waitSeconds = Math.ceil((this.COOLDOWN_MS - (now - lastAttempt)) / 1000);
      return { allowed: false, waitSeconds };
    }

    // Seleccionar pregunta aleatoria
    const randomIndex = Math.floor(Math.random() * QUESTION_BANK.length);
    const q = QUESTION_BANK[randomIndex];
    const sessionId = `trv_${now}_${userId.slice(-4)}`;

    this.activeSessions.set(sessionId, {
      questionId: q.id,
      userId,
      expiresAt: now + 45000 // 45 segundos para responder
    });

    this.cooldowns.set(userId, now);

    const embed = new EmbedBuilder()
      .setTitle(`🎲 Desafío Académico de IA: ${q.category}`)
      .setDescription(`**${q.question}**\n\n` +
        `**A)** ${q.options[0]}\n` +
        `**B)** ${q.options[1]}\n` +
        `**C)** ${q.options[2]}\n` +
        `**D)** ${q.options[3]}`
      )
      .setColor(0x3498DB)
      .addFields(
        { name: '📊 Dificultad', value: q.difficulty, inline: true },
        { name: '🏆 Recompensa', value: '+10 Puntos Hermes', inline: true },
        { name: '⏱️ Tiempo', value: '45 segundos', inline: true }
      )
      .setFooter({ text: 'Selecciona una de las opciones abajo para validar tu respuesta' });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`btn_trv:${sessionId}:0`).setLabel('A').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`btn_trv:${sessionId}:1`).setLabel('B').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`btn_trv:${sessionId}:2`).setLabel('C').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`btn_trv:${sessionId}:3`).setLabel('D').setStyle(ButtonStyle.Primary)
    );

    return { allowed: true, embed, row, sessionId };
  }

  /**
   * Procesa la respuesta de un usuario a una trivia activa.
   */
  public static async handleAnswer(
    interaction: ButtonInteraction, 
    sessionId: string, 
    selectedIndex: number
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      await interaction.reply({
        content: '⏳ Esta sesión de trivia ya expiró o ya fue respondida.',
        ephemeral: true
      });
      return;
    }

    if (session.userId !== interaction.user.id) {
      await interaction.reply({
        content: '⚠️ Solo el miembro que inició esta trivia puede responderla.',
        ephemeral: true
      });
      return;
    }

    this.activeSessions.delete(sessionId);
    const q = QUESTION_BANK.find((item) => item.id === session.questionId);
    if (!q) return;

    const isCorrect = selectedIndex === q.correctIndex;
    const member = interaction.member as GuildMember;

    if (isCorrect) {
      const awardResult = await HermesPointsService.awardDirectPoints(
        interaction.user.id,
        10,
        `Respuesta correcta en Trivia de IA (${q.category})`,
        member
      );

      let promotionText = '';
      if (awardResult.upgraded && awardResult.newTier) {
        promotionText = `\n\n🎉 **¡HAS SUBIDO DE RANGO!**\nAhora eres **${awardResult.newTier.badge} ${awardResult.newTier.roleName}** en el servidor.`;
      }

      const winEmbed = new EmbedBuilder()
        .setTitle('✅ ¡Respuesta Correcta!')
        .setDescription(`¡Excelente razonamiento, <@${interaction.user.id}>!\n\n` +
          `**Opción correcta:** ${String.fromCharCode(65 + q.correctIndex)}) ${q.options[q.correctIndex]}\n\n` +
          `📖 **Fundamento:** *${q.explanation}*\n\n` +
          `🦉 **Recompensa:** Has ganado **+10 Puntos Hermes** (Total actual: **${awardResult.newPoints} pts**).${promotionText}`
        )
        .setColor(0x2ECC71)
        .setFooter({ text: 'Inter Aulas Academiæ Quære Verum • UNAL AI' });

      await interaction.update({
        embeds: [winEmbed],
        components: []
      });
    } else {
      const failEmbed = new EmbedBuilder()
        .setTitle('❌ Respuesta Incorrecta')
        .setDescription(`Tu selección: **${String.fromCharCode(65 + selectedIndex)}) ${q.options[selectedIndex]}**\n\n` +
          `**La respuesta correcta era:** ${String.fromCharCode(65 + q.correctIndex)}) ${q.options[q.correctIndex]}\n\n` +
          `📖 **Explicación técnica:** *${q.explanation}*\n\n` +
          `💡 *¡Sigue explorando e investigando en los canales técnicos para tu próximo intento!*`
        )
        .setColor(0xE74C3C)
        .setFooter({ text: 'Puedes volver a intentar otra trivia en 2 minutos' });

      await interaction.update({
        embeds: [failEmbed],
        components: []
      });
    }
  }
}
