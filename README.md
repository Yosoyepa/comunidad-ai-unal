# 🚀 Arquitectura y Aprovisionamiento Automatizado - Servidor Discord Comunidad AI

Este proyecto contiene la suite completa de aprovisionamiento, gobernanza, seguridad y estructura automatizada para el servidor de Discord de la **Comunidad de Inteligencia Artificial**.

Construido con **Node.js**, **TypeScript** y el SDK oficial **discord.js v14** sobre la **API REST de Discord v10**.

---

## 📁 Estructura del Proyecto

```text
proyecto_comunidad_ai_discord/
├── src/
│   ├── config/
│   │   └── serverStructure.ts    # Definición de roles, categorías, canales, permisos y AutoMod
│   ├── services/
│   │   ├── roleService.ts        # Sincronización idempotente de roles
│   │   ├── channelService.ts     # Aprovisionamiento jerárquico de categorías y canales
│   │   ├── autoModService.ts     # Reglas de filtrado de API keys y Anti-Spam
│   │   └── welcomeService.ts     # Publicación de Embeds de bienvenida y recursos
│   ├── utils/
│   │   └── logger.ts             # Logger visual con códigos ANSI
│   ├── testConnection.ts         # Script de validación de conexión y permisos
│   └── provision.ts              # Orquestador principal de aprovisionamiento
├── .env.example                  # Plantilla de variables de entorno
├── package.json                  # Dependencias y scripts npm
└── tsconfig.json                 # Configuración de compilador TypeScript
```

---

## ⚡ Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run test:connection` | Verifica la autenticación del bot, pertenencia al servidor y permisos de Administrador. |
| `npm run provision` | Ejecuta el aprovisionamiento completo (Roles, Canales, AutoMod y Bienvenidas). |
| `npm run provision:clean` | Ejecuta el aprovisionamiento y elimina los canales por defecto creados por Discord. |
| `npm run build` | Compila el código TypeScript a JavaScript en `./dist`. |

---

## 🛡️ Características de Seguridad y Gobernanza

1. **Jerarquía de Permisos Zero Trust**:
   - Acceso restringido por defecto en categorías privadas (`🔒 ADMINISTRACIÓN & LOGS`).
   - Canales de solo lectura para `@everyone` en `#📜┃reglas-y-normas`, `#📢┃anuncios-oficiales`, `#👋┃bienvenida-y-roles` y `#🔗┃recursos-y-links`.
2. **AutoMod Especializado en IA**:
   - **Bloqueo de fuga de API Keys**: Detecta y bloquea cadenas con formato de OpenAI (`sk-proj-*`, `sk-*`), Anthropic (`sk-ant-*`), Hugging Face (`hf_*`), Google (`AIzaSy*`) y GitHub (`ghp_*`).
   - **Anti-Spam & Phishing**: Bloqueo de invitaciones externas a otros servidores y estafas cripto/airdrop.
   - **Anti-Raid / Mention Spam**: Bloqueo automático ante exceso de menciones en un solo mensaje.
3. **Idempotencia Completa**:
   - Si se ejecuta el aprovisionador múltiples veces, no duplica canales ni roles existentes, sino que los sincroniza.
