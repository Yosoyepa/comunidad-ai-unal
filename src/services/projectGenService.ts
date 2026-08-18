import { EmbedBuilder } from 'discord.js';
import { AIAssistantService } from './aiAssistantService';

export interface ProjectTemplate {
  title: string;
  area: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  summary: string;
  architecture: string;
  techStack: string[];
  datasets: string[];
  paperReference: string;
}

const CURATED_PROJECTS: ProjectTemplate[] = [
  {
    title: 'Asistente de Consulta Normativa UNAL con RAG Híbrido y Reranking',
    area: 'RAG & NLP',
    difficulty: 'Intermedio',
    summary: 'Sistema de recuperación semántica que permite consultar estatutos, reglamentos y acuerdos académicos de la Universidad Nacional con citas exactas de artículos.',
    architecture: 'Chunking jerárquico por artículos + Búsqueda Híbrida (BM25 + Qdrant HNSW) + Cross-Encoder Reranker + Generación con Llama 3 / Gemini.',
    techStack: ['Python', 'FastAPI', 'LangChain / LlamaIndex', 'Qdrant', 'HuggingFace Embeddings (bge-m3)'],
    datasets: ['Estatuto Estudiantil UNAL (Acuerdo 008)', 'Resoluciones de Rectoría en PDF'],
    paperReference: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al.)'
  },
  {
    title: 'Agente Autónomo de Code Review para Repositorios de Machine Learning',
    area: 'Agentes & LLMs',
    difficulty: 'Avanzado',
    summary: 'Agente multi-herramienta que analiza pull requests en GitHub, detecta fugas de memoria en PyTorch, audita métricas de entrenamiento y sugiere optimizaciones de CUDA.',
    architecture: 'Framework ReAct con reflexión + AST Parser de Python + Integración con GitHub API + LLM de razonamiento.',
    techStack: ['TypeScript / Python', 'LangGraph / CrewAI', 'Tree-Sitter', 'PyTorch Profiler', 'Docker'],
    datasets: ['Repositorios públicos de modelos en GitHub', 'CodeSearchNet'],
    paperReference: 'ReAct: Synergizing Reasoning and Acting in Language Models (Yao et al.)'
  },
  {
    title: 'Segmentación y Clasificación de Cultivos Agrícolas con Modelos de Visión y Satélite',
    area: 'Visión por Computadora',
    difficulty: 'Intermedio',
    summary: 'Pipeline de análisis de imágenes satelitales (Sentinel-2) para detección de estrés hídrico y segmentación de parcelas agrícolas en regiones colombianas.',
    architecture: 'Backbone con Segment Anything (SAM-2) + Clasificador de índices de vegetación (NDVI) + Inferencia en ONNX.',
    techStack: ['PyTorch', 'TorchGeo', 'Segment Anything (SAM)', 'Rasterio', 'Streamlit'],
    datasets: ['Sentinel-2 L2A (Copernicus Open Access)', 'EuroSAT / Agriculture-Vision'],
    paperReference: 'Segment Anything (Kirillov et al., Meta AI)'
  },
  {
    title: 'Micro-LLM Local Cuantizado para Dispositivos Edge y Robótica',
    area: 'MLOps & Edge AI',
    difficulty: 'Avanzado',
    summary: 'Optimización y fine-tuning con LoRA de un modelo de 1B/3B parámetros (ej: SmolLM / Llama 3.2 1B) cuantizado en GGUF/INT4 para correr en Raspberry Pi / Jetson Nano.',
    architecture: 'Fine-tuning LoRA con Unsloth + Cuantización GGUF/llama.cpp + Servidor de inferencia local C++.',
    techStack: ['Unsloth', 'llama.cpp', 'Ollama', 'PyTorch', 'C++ / Python'],
    datasets: ['OpenAssistant Conversations', 'Ultrachat'],
    paperReference: 'QLoRA: Efficient Finetuning of Quantized LLMs (Dettmers et al.)'
  }
];

export class ProjectGenService {
  /**
   * Genera una propuesta estructurada de proyecto de IA.
   */
  public static async generateProject(
    areaChoice?: string, 
    diffChoice?: string
  ): Promise<EmbedBuilder> {
    // Si no hay parámetros, seleccionar de los proyectos curados o invocar IA
    let project = CURATED_PROJECTS[Math.floor(Math.random() * CURATED_PROJECTS.length)];

    if (areaChoice || diffChoice) {
      const filtered = CURATED_PROJECTS.filter((p) => {
        const matchArea = areaChoice ? p.area.toLowerCase().includes(areaChoice.toLowerCase()) : true;
        const matchDiff = diffChoice ? p.difficulty.toLowerCase() === diffChoice.toLowerCase() : true;
        return matchArea && matchDiff;
      });
      if (filtered.length > 0) {
        project = filtered[0];
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`💡 Propuesta de Proyecto: ${project.title}`)
      .setDescription(project.summary)
      .setColor(0x3498DB)
      .addFields(
        { name: '🏷️ Área', value: project.area, inline: true },
        { name: '📊 Nivel de Dificultad', value: project.difficulty, inline: true },
        { name: '🏗️ Arquitectura Recomendada', value: project.architecture, inline: false },
        { name: '🛠️ Stack Tecnológico', value: project.techStack.map((t) => `\`${t}\``).join(', '), inline: false },
        { name: '📦 Datasets Sugeridos', value: project.datasets.join('\n• '), inline: true },
        { name: '📄 Paper de Referencia', value: project.paperReference, inline: false }
      )
      .setFooter({ text: 'Iniciativa de Proyectos & Hackathons • Comunidad UNAL AI' });

    return embed;
  }
}
