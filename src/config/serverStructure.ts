import { 
  ChannelType, 
  PermissionFlagsBits,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  AutoModerationActionType
} from 'discord.js';

export interface RoleConfig {
  name: string;
  color: number;
  permissions: bigint[];
  hoist: boolean;
  mentionable: boolean;
  description?: string;
}

export interface PermissionOverwriteRule {
  roleName: string | '@everyone';
  allow?: bigint[];
  deny?: bigint[];
}

export interface ChannelConfig {
  name: string;
  type: ChannelType;
  topic?: string;
  rateLimitPerUser?: number; // slowmode en segundos
  userLimit?: number; // para canales de voz
  permissionOverwrites?: PermissionOverwriteRule[];
}

export interface CategoryConfig {
  name: string;
  permissionOverwrites?: PermissionOverwriteRule[];
  channels: ChannelConfig[];
}

export interface AutoModConfig {
  name: string;
  eventType: AutoModerationRuleEventType;
  triggerType: AutoModerationRuleTriggerType;
  triggerMetadata?: {
    keywordFilter?: string[];
    regexPatterns?: string[];
    mentionTotalLimit?: number;
  };
  actions: {
    type: AutoModerationActionType;
    metadata?: {
      durationSeconds?: number;
      customMessage?: string;
    };
  }[];
  enabled: boolean;
  reason: string;
}

// -------------------------------------------------------------
// 1. JERARQUÍA DE ROLES
// -------------------------------------------------------------
export const ROLES_CONFIG: RoleConfig[] = [
  {
    name: '👑 Fundador / Core Team',
    color: 0xE74C3C, // Rojo Carmesí
    permissions: [PermissionFlagsBits.Administrator],
    hoist: true,
    mentionable: true,
    description: 'Liderazgo y administración general de la comunidad'
  },
  {
    name: '🛡️ Moderador AI',
    color: 0x3498DB, // Azul Zafiro
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.ViewAuditLog,
      PermissionFlagsBits.ManageThreads,
      PermissionFlagsBits.MuteMembers,
      PermissionFlagsBits.DeafenMembers,
      PermissionFlagsBits.MoveMembers
    ],
    hoist: true,
    mentionable: true,
    description: 'Moderación técnica, resolución de conflictos y seguridad'
  },
  {
    name: '🔬 AI Researcher',
    color: 0x9B59B6, // Púrpura Amatista
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.AddReactions,
      PermissionFlagsBits.CreatePublicThreads,
      PermissionFlagsBits.SendMessagesInThreads,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak
    ],
    hoist: true,
    mentionable: true,
    description: 'Investigación en LLMs, modelos fundacionales, papers y ciencia de datos'
  },
  {
    name: '💻 AI Engineer / MLOps',
    color: 0x1ABC9C, // Turquesa Esmeralda
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.AddReactions,
      PermissionFlagsBits.CreatePublicThreads,
      PermissionFlagsBits.SendMessagesInThreads,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak
    ],
    hoist: true,
    mentionable: true,
    description: 'Ingeniería de software con IA, RAG, Fine-tuning, Despliegue y Arquitectura'
  },
  {
    name: '🛠️ Prompt Crafter / Builder',
    color: 0xF39C12, // Ámbar / Naranja
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.AddReactions,
      PermissionFlagsBits.CreatePublicThreads,
      PermissionFlagsBits.SendMessagesInThreads,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak
    ],
    hoist: true,
    mentionable: true,
    description: 'Creadores de aplicaciones con IA, Agentes, Automatizaciones y Prompting'
  },
  {
    name: '✅ Miembro Verificado',
    color: 0x2ECC71, // Verde
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.AddReactions,
      PermissionFlagsBits.CreatePublicThreads,
      PermissionFlagsBits.SendMessagesInThreads,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak
    ],
    hoist: false,
    mentionable: false,
    description: 'Miembros activos que han aceptado las normas'
  },
  {
    name: '🤖 Asistentes & Bots AI',
    color: 0x7289DA, // Discord Blurple
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.UseExternalEmojis
    ],
    hoist: false,
    mentionable: false,
    description: 'Bots de IA, integraciones y webhooks automatizados'
  },
  // --- ROLES DE AFILIACIÓN Y PERFIL ---
  {
    name: '🏛️ UNAL (Universidad Nacional)',
    color: 0x00A859, // Verde UNAL
    permissions: [],
    hoist: false,
    mentionable: true,
    description: 'Comunidad, estudiantes y egresados de la Universidad Nacional'
  },
  {
    name: '🎓 Estudiante Universitario',
    color: 0x3498DB,
    permissions: [],
    hoist: false,
    mentionable: false,
    description: 'Estudiantes de pregrado o posgrado'
  },
  {
    name: '💼 Profesional / Industria',
    color: 0x34495E,
    permissions: [],
    hoist: false,
    mentionable: false,
    description: 'Desarrolladores, científicos de datos y líderes técnicos en la industria'
  },
  {
    name: '🔬 Investigador Académico',
    color: 0x8E44AD,
    permissions: [],
    hoist: false,
    mentionable: false,
    description: 'Docentes, PhDs e investigadores de laboratorio'
  },
  // --- ROLES DE PAÍS / REGIÓN ---
  {
    name: '🇨🇴 Colombia',
    color: 0xF1C40F,
    permissions: [],
    hoist: false,
    mentionable: false,
    description: 'Miembros ubicados en Colombia'
  },
  {
    name: '🇲🇽 México',
    color: 0x27AE60,
    permissions: [],
    hoist: false,
    mentionable: false,
    description: 'Miembros ubicados en México'
  },
  {
    name: '🇦🇷 Argentina',
    color: 0x74B9FF,
    permissions: [],
    hoist: false,
    mentionable: false,
    description: 'Miembros ubicados en Argentina'
  },
  {
    name: '🇨🇱 Chile',
    color: 0xE74C3C,
    permissions: [],
    hoist: false,
    mentionable: false,
    description: 'Miembros ubicados en Chile'
  },
  {
    name: '🇪🇸 España',
    color: 0xE67E22,
    permissions: [],
    hoist: false,
    mentionable: false,
    description: 'Miembros ubicados en España'
  },
  {
    name: '🌎 Latam / Global',
    color: 0x16A085,
    permissions: [],
    hoist: false,
    mentionable: false,
    description: 'Miembros del resto de Latinoamérica o del mundo'
  },
  // --- ROLES DE IDENTIDAD Y PRONOMBRES ---
  {
    name: 'Él / He / Him',
    color: 0x95A5A6,
    permissions: [],
    hoist: false,
    mentionable: false,
    description: 'Pronombres Él / He / Him'
  },
  {
    name: 'Ella / She / Her',
    color: 0x95A5A6,
    permissions: [],
    hoist: false,
    mentionable: false,
    description: 'Pronombres Ella / She / Her'
  },
  {
    name: 'Elle / They / Them',
    color: 0x95A5A6,
    permissions: [],
    hoist: false,
    mentionable: false,
    description: 'Pronombres Elle / They / Them'
  }
];

export interface InteractiveRoleItem {
  customId: string;
  roleName: string;
  label: string;
  emoji: string;
  description?: string;
}

export const INTERACTIVE_PANELS = {
  techRoles: [
    {
      customId: 'btn_role_ai_researcher',
      roleName: '🔬 AI Researcher',
      label: 'AI Researcher',
      emoji: '🔬',
      description: 'Investigación en LLMs, modelos fundacionales y papers'
    },
    {
      customId: 'btn_role_ai_engineer',
      roleName: '💻 AI Engineer / MLOps',
      label: 'AI Engineer / MLOps',
      emoji: '💻',
      description: 'Ingeniería con IA, RAG, Fine-tuning y Despliegue'
    },
    {
      customId: 'btn_role_prompt_crafter',
      roleName: '🛠️ Prompt Crafter / Builder',
      label: 'Prompt Crafter / Builder',
      emoji: '🛠️',
      description: 'Creadores de apps con agentes, prompts y automatizaciones'
    }
  ],
  affiliationRoles: [
    {
      customId: 'select_affiliation',
      roleName: '🏛️ UNAL (Universidad Nacional)',
      label: 'UNAL (Universidad Nacional)',
      emoji: '🏛️',
      description: 'Comunidad UNAL (Estudiante, Docente o Egresado)'
    },
    {
      customId: 'select_affiliation',
      roleName: '🎓 Estudiante Universitario',
      label: 'Estudiante Universitario',
      emoji: '🎓',
      description: 'Estudiante de otra universidad'
    },
    {
      customId: 'select_affiliation',
      roleName: '💼 Profesional / Industria',
      label: 'Profesional / Industria',
      emoji: '💼',
      description: 'Trabajando en el sector tecnológico/IA'
    },
    {
      customId: 'select_affiliation',
      roleName: '🔬 Investigador Académico',
      label: 'Investigador Académico',
      emoji: '🔬',
      description: 'Investigador en centros científicos o universidades'
    }
  ],
  regionRoles: [
    {
      customId: 'select_region',
      roleName: '🇨🇴 Colombia',
      label: 'Colombia',
      emoji: '🇨🇴',
      description: 'Ubicado en Colombia'
    },
    {
      customId: 'select_region',
      roleName: '🇲🇽 México',
      label: 'México',
      emoji: '🇲🇽',
      description: 'Ubicado en México'
    },
    {
      customId: 'select_region',
      roleName: '🇦🇷 Argentina',
      label: 'Argentina',
      emoji: '🇦🇷',
      description: 'Ubicado en Argentina'
    },
    {
      customId: 'select_region',
      roleName: '🇨🇱 Chile',
      label: 'Chile',
      emoji: '🇨🇱',
      description: 'Ubicado en Chile'
    },
    {
      customId: 'select_region',
      roleName: '🇪🇸 España',
      label: 'España',
      emoji: '🇪🇸',
      description: 'Ubicado en España'
    },
    {
      customId: 'select_region',
      roleName: '🌎 Latam / Global',
      label: 'Resto de Latam / Global',
      emoji: '🌎',
      description: 'Otros países de Latinoamérica o el mundo'
    }
  ],
  pronounRoles: [
    {
      customId: 'btn_pr_he',
      roleName: 'Él / He / Him',
      label: 'Él / He / Him',
      emoji: '🔹'
    },
    {
      customId: 'btn_pr_she',
      roleName: 'Ella / She / Her',
      label: 'Ella / She / Her',
      emoji: '🔸'
    },
    {
      customId: 'btn_pr_they',
      roleName: 'Elle / They / Them',
      label: 'Elle / They / Them',
      emoji: '✨'
    }
  ]
};

// -------------------------------------------------------------
// 2. CATEGORÍAS Y CANALES
// -------------------------------------------------------------
export const CATEGORIES_CONFIG: CategoryConfig[] = [
  // --- 1. INFORMACIÓN & ONBOARDING ---
  {
    name: '📌 INFORMACIÓN & ONBOARDING',
    permissionOverwrites: [
      {
        roleName: '@everyone',
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory
        ],
        deny: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.CreatePublicThreads,
          PermissionFlagsBits.CreatePrivateThreads,
          PermissionFlagsBits.AddReactions
        ]
      },
      {
        roleName: '👑 Fundador / Core Team',
        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
      },
      {
        roleName: '🛡️ Moderador AI',
        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
      }
    ],
    channels: [
      {
        name: '📜┃reglas-y-normas',
        type: ChannelType.GuildText,
        topic: 'Normas y código de conducta de la comunidad AI. Canal de solo lectura.'
      },
      {
        name: '📢┃anuncios-oficiales',
        type: ChannelType.GuildAnnouncement,
        topic: 'Novedades, eventos, workshops y comunicados oficiales del Core Team.'
      },
      {
        name: '👋┃bienvenida-y-roles',
        type: ChannelType.GuildText,
        topic: 'Guía de inicio y selección de roles técnicos para personalizar tu experiencia.'
      },
      {
        name: '🔗┃recursos-y-links',
        type: ChannelType.GuildText,
        topic: 'Compendio curado de repositorios, papers, cursos, APIs y herramientas de IA.'
      }
    ]
  },

  // --- 2. COMUNIDAD & NETWORKING ---
  {
    name: '💬 COMUNIDAD & NETWORKING',
    permissionOverwrites: [
      {
        roleName: '@everyone',
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.AddReactions
        ]
      }
    ],
    channels: [
      {
        name: '💬┃general-ai',
        type: ChannelType.GuildText,
        topic: 'Conversación general sobre actualidad, debates y ecosistema de Inteligencia Artificial.',
        rateLimitPerUser: 5
      },
      {
        name: '🤝┃presentaciones',
        type: ChannelType.GuildText,
        topic: '¡Cuéntanos quién eres! Tu stack, tus proyectos en IA y qué estás construyendo.',
        rateLimitPerUser: 10
      },
      {
        name: '💼┃empleo-y-colabs',
        type: ChannelType.GuildText,
        topic: 'Ofertas de trabajo en IA/ML, búsqueda de cofundadores y proyectos colaborativos.',
        rateLimitPerUser: 30
      },
      {
        name: '☕┃cafe-y-offtopic',
        type: ChannelType.GuildText,
        topic: 'Espacio distendido para charlar sobre tecnología, ocio y vida cotidiana.',
        rateLimitPerUser: 5
      }
    ]
  },

  // --- 3. DISCUSIÓN TÉCNICA DE IA ---
  {
    name: '🧠 DISCUSIÓN TÉCNICA DE IA',
    permissionOverwrites: [
      {
        roleName: '@everyone',
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.CreatePublicThreads
        ]
      }
    ],
    channels: [
      {
        name: '🤖┃llms-y-agentes',
        type: ChannelType.GuildText,
        topic: 'Modelos de lenguaje (GPT-4o, Claude 3.5, Gemini, Llama 3, DeepSeek), Frameworks de agentes (LangGraph, CrewAI, AutoGen).',
        rateLimitPerUser: 5
      },
      {
        name: '👁️┃vision-y-multimodal',
        type: ChannelType.GuildText,
        topic: 'Generación de imágenes, video, audio y modelos multimodales (Flux, Stable Diffusion, Whisper, TTS, Vision).',
        rateLimitPerUser: 5
      },
      {
        name: '⚡┃rag-y-vector-dbs',
        type: ChannelType.GuildText,
        topic: 'Sistemas RAG, embeddings, rerankers, bases vectoriales (Chroma, Qdrant, Pinecone, Milvus, pgvector).',
        rateLimitPerUser: 5
      },
      {
        name: '🛠️┃fine-tuning-y-evals',
        type: ChannelType.GuildText,
        topic: 'LoRA, QLoRA, Axolotl, Unsloth, datasets sintéticos, benchmarks y evaluación de modelos.',
        rateLimitPerUser: 5
      },
      {
        name: '📚┃papers-y-investigacion',
        type: ChannelType.GuildForum, // Si no está habilitado Community, el aprovisionador fallbackeará a GuildText
        topic: 'Discusión y análisis de papers de arXiv, nuevas arquitecturas y avances científicos.'
      }
    ]
  },

  // --- 4. SHOWCASE & SOPORTE ---
  {
    name: '🚀 SHOWCASE & SOPORTE',
    permissionOverwrites: [
      {
        roleName: '@everyone',
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles
        ]
      }
    ],
    channels: [
      {
        name: '💡┃showcase-proyectos',
        type: ChannelType.GuildForum,
        topic: 'Muestra tus creaciones, demos, apps y agentes construidos con IA. ¡Recibe feedback de la comunidad!'
      },
      {
        name: '❓┃dudas-y-code-review',
        type: ChannelType.GuildForum,
        topic: 'Preguntas técnicas, bugs de código con librerías de IA (PyTorch, Transformers, LangChain, SDKs).'
      },
      {
        name: '🧪┃prompts-y-experimentos',
        type: ChannelType.GuildText,
        topic: 'Comparte tus mejores system prompts, técnicas de few-shot, reasoning chains y jailbreaks defensivos.',
        rateLimitPerUser: 5
      },
      {
        name: '🎫┃abrir-ticket',
        type: ChannelType.GuildText,
        topic: 'Canal oficial para solicitar tickets privados de soporte, mentoría técnica o consultas con el equipo.',
        permissionOverwrites: [
          {
            roleName: '@everyone',
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.ReadMessageHistory
            ],
            deny: [
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.CreatePublicThreads,
              PermissionFlagsBits.CreatePrivateThreads
            ]
          }
        ]
      }
    ]
  },

  // --- 5. CANALES DE VOZ & ESCENARIOS ---
  {
    name: '🔊 CANALES DE VOZ',
    permissionOverwrites: [
      {
        roleName: '@everyone',
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
          PermissionFlagsBits.UseVAD
        ]
      }
    ],
    channels: [
      {
        name: '🎙️┃Salón Principal',
        type: ChannelType.GuildVoice
      },
      {
        name: '🎧┃Coworking AI (Focus)',
        type: ChannelType.GuildVoice,
        userLimit: 25
      },
      {
        name: '🗣️┃Mesa Redonda 1',
        type: ChannelType.GuildVoice,
        userLimit: 10
      },
      {
        name: '🗣️┃Mesa Redonda 2',
        type: ChannelType.GuildVoice,
        userLimit: 10
      }
    ]
  },

  // --- 6. ADMINISTRACIÓN & SEGURIDAD (PRIVADO) ---
  {
    name: '🔒 ADMINISTRACIÓN & LOGS',
    permissionOverwrites: [
      {
        roleName: '@everyone',
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        roleName: '👑 Fundador / Core Team',
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages
        ]
      },
      {
        roleName: '🛡️ Moderador AI',
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages
        ]
      }
    ],
    channels: [
      {
        name: '📊┃logs-audit',
        type: ChannelType.GuildText,
        topic: 'Registro de auditoría, ingresos, expulsiones y eventos del servidor.'
      },
      {
        name: '💬┃staff-chat',
        type: ChannelType.GuildText,
        topic: 'Coordinación interna entre Administradores y Moderadores.'
      },
      {
        name: '🤖┃bot-debug',
        type: ChannelType.GuildText,
        topic: 'Canal de pruebas de comandos y logs de bots.'
      }
    ]
  }
];

// -------------------------------------------------------------
// 3. REGLAS DE AUTOMODERACIÓN (AUTOMOD)
// -------------------------------------------------------------
export const AUTOMOD_RULES_CONFIG: AutoModConfig[] = [
  {
    name: '[Seguridad] Bloqueo de API Keys (OpenAI, Anthropic, HF, Google, etc.)',
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.Keyword,
    triggerMetadata: {
      keywordFilter: [
        '*sk-proj-*',
        '*sk-ant-*',
        '*sk-*',
        '*hf_*',
        '*ghp_*',
        '*AIzaSy*',
        '*bearer *',
        '*xoxb-*',
        '*glpat-*'
      ]
    },
    actions: [
      {
        type: AutoModerationActionType.BlockMessage,
        metadata: {
          customMessage: '🔒 Mensaje bloqueado preventivamente: Detectamos una posible clave de API secreta (OpenAI, Anthropic, HuggingFace, etc.). Por tu seguridad, nunca compartas tokens o claves en público.'
        }
      }
    ],
    enabled: true,
    reason: 'Protección de claves de API y prevención de consumo no autorizado para la comunidad AI'
  },
  {
    name: '[Seguridad] Anti-Spam de Enlaces e Invitaciones No Autorizadas',
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.Keyword,
    triggerMetadata: {
      keywordFilter: [
        '*discord.gg/*',
        '*discord.com/invite/*',
        '*free-nitro*',
        '*airdrop*',
        '*crypto-claim*',
        '*t.me/*'
      ]
    },
    actions: [
      {
        type: AutoModerationActionType.BlockMessage,
        metadata: {
          customMessage: '⛔ Tu mensaje fue bloqueado por contener enlaces sospechosos, invitaciones externas o spam no permitido.'
        }
      },
      {
        type: AutoModerationActionType.Timeout,
        metadata: {
          durationSeconds: 300 // 5 minutos de aislamiento
        }
      }
    ],
    enabled: true,
    reason: 'Anti-Spam, anti-phishing y protección contra estafas cripto'
  },
  {
    name: '[Seguridad] Prevención de Menciones Masivas (Mention Spam)',
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.MentionSpam,
    triggerMetadata: {
      mentionTotalLimit: 4
    },
    actions: [
      {
        type: AutoModerationActionType.BlockMessage,
        metadata: {
          customMessage: '⛔ Mensaje bloqueado por exceso de menciones de usuarios.'
        }
      },
      {
        type: AutoModerationActionType.Timeout,
        metadata: {
          durationSeconds: 300
        }
      }
    ],
    enabled: true,
    reason: 'Prevención de ataques de raid y spam de menciones'
  }
];
