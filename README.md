# 🚀 Arquitectura y Aprovisionamiento Automatizado - Servidor Discord Comunidad AI

Este proyecto contiene la suite completa de aprovisionamiento, gobernanza, seguridad, asistente de IA multi-proveedor (A2A) y bot oficial para el servidor de Discord de la **Comunidad de Inteligencia Artificial (UNAL AI)**.

Construido con **Node.js 24**, **TypeScript** y el SDK oficial **discord.js v14** sobre la **API REST de Discord v10**.

---

## 📁 Estructura del Proyecto

```text
comunidad-ai-unal/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Integración Continua (Build y Typecheck en Node 24)
│       └── daily-arxiv-papers.yml    # Cron diario de difusión de papers de arXiv
├── docs/
│   └── deployment-bot-hosting.md     # Guía paso a paso para Bot-Hosting.net Starter+
├── src/
│   ├── commands/
│   │   └── slashCommands.ts          # Comandos Slash (/preguntar-ia, /resumir-paper, /hermes, etc.)
│   ├── config/
│   │   └── serverStructure.ts        # Definición de roles, categorías, canales, permisos y AutoMod
│   ├── cron/
│   │   └── arxivFeed.ts              # Scraper y difusor de papers de arXiv (Forum y Text)
│   ├── handlers/
│   │   ├── interactionHandler.ts     # Manejador interactivo de botones y menús multi-rol
│   │   └── ticketHandler.ts          # Sistema de tickets de soporte privados
│   ├── services/
│   │   ├── aiAssistantService.ts     # Enrutador A2A en cascada (Gemini -> Groq -> OpenRouter)
│   │   ├── hermesPointsService.ts    # Motor de sabiduría y puntos Hermes UNAL
│   │   ├── roleService.ts            # Sincronización idempotente de roles
│   │   ├── channelService.ts         # Aprovisionamiento jerárquico de canales
│   │   ├── autoModService.ts         # Reglas de filtrado de API keys y Anti-Spam
│   │   ├── rolePanelService.ts       # Despliegue de paneles interactivos de bienvenida
│   │   └── welcomeService.ts         # Publicación de guías y normativas
│   ├── utils/
│   │   └── logger.ts                 # Logger con códigos ANSI
│   ├── bot.ts                        # Punto de entrada principal del bot
│   ├── provision.ts                  # Orquestador de aprovisionamiento del servidor
│   ├── refreshPanels.ts              # Refresco de paneles interactivos
│   └── testConnection.ts             # Script de validación de conexión
├── .env.example                      # Plantilla de variables de entorno
├── package.json                      # Dependencias, engines (Node 24) y scripts de producción
└── tsconfig.json                     # Configuración del compilador TypeScript
```

---

## ⚡ Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run deploy:start` | **Comando de Producción**: Instala dependencias (`npm ci`), compila (`npm run build`) y arranca el bot (`node dist/bot.js`). |
| `npm start` | Inicia el bot en producción a partir de los archivos JavaScript compilados en `dist/`. |
| `npm run start:dev` | Inicia el bot en modo desarrollo con `ts-node`. |
| `npm run build` | Compila el código TypeScript a JavaScript en `./dist`. |
| `npm run feed:arxiv` | Consulta la API de arXiv y publica 3 papers recientes de IA en `#📚┃papers-y-investigacion`. |
| `npm run refresh:panels` | Limpia y republica los paneles interactivos de auto-asignación de roles en `#👋┃bienvenida-y-roles`. |
| `npm run provision` | Ejecuta el aprovisionamiento completo (Roles, Canales, AutoMod y Paneles). |
| `npm run test:connection` | Verifica la autenticación del bot, pertenencia al servidor y permisos de Administrador. |

---

## 🌐 Despliegue en Producción

### Bot-Hosting.net (Starter+)
Para desplegar este bot 24/7 en **Bot-Hosting.net** mediante integración continua con GitHub:
👉 Consulta la guía completa en [docs/deployment-bot-hosting.md](file:///home/jandradeu/Documentos/proyecto_comunidad_ai_discord/docs/deployment-bot-hosting.md).

---

## 🛡️ Características de Seguridad y Gobernanza

1. **Jerarquía de Permisos Zero Trust**:
   - Acceso restringido por defecto en categorías privadas (`🔒 ADMINISTRACIÓN & LOGS`).
   - Canales de solo lectura para `@everyone` en `#📜┃reglas-y-normas`, `#📢┃anuncios-oficiales`, `#👋┃bienvenida-y-roles`, `#🔗┃recursos-y-links` y `#🎫┃abrir-ticket`.
2. **AutoMod Especializado en IA**:
   - **Bloqueo de fuga de API Keys**: Detecta y bloquea cadenas con formato de OpenAI (`sk-proj-*`, `sk-*`), Anthropic (`sk-ant-*`), Hugging Face (`hf_*`), Google (`AIzaSy*`) y GitHub (`ghp_*`).
   - **Anti-Spam & Phishing**: Bloqueo de invitaciones externas a otros servidores y estafas cripto/airdrop.
   - **Anti-Raid / Mention Spam**: Bloqueo automático ante exceso de menciones en un solo mensaje.
3. **Idempotencia Completa**:
   - El aprovisionador sincroniza y actualiza la estructura sin duplicar canales ni roles existentes.
