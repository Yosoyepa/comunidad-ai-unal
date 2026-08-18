# Guía de Despliegue en Bot-Hosting.net (Starter+)

Esta guía detalla el procedimiento para desplegar y mantener el bot de la **Comunidad AI UNAL** en la plataforma **Bot-Hosting.net** utilizando el plan **Starter+**.

---

## 📋 Especificaciones del Despliegue

- **Proveedor:** Bot-Hosting.net
- **Plan:** Starter+
- **Deployment Type:** Application
- **Source:** GitHub (`Yosoyepa/comunidad-ai-unal`)
- **Branch:** `main`
- **Runtime:** Node.js
- **Version:** `24`
- **Auto-Pull:** Activado (*Pull automatically at every restart*)
- **Startup Command:** `npm run deploy:start`

---

## ⚙️ Asignación de Recursos Recomendada (Starter+)

Para garantizar compilación rápida de TypeScript y estabilidad continua sin consumir todo el pool de recursos:

| Recurso | Asignación Bot | Pool Total Starter+ | Recursos Restantes para Otros Bots |
| :--- | :--- | :--- | :--- |
| **RAM** | `512 MB` | 2048 MB | 1536 MB |
| **CPU** | `25%` | 100% | 75% |
| **Storage** | `1024 MB` (1 GB) | 8192 MB (8 GB) | ~7 GB |
| **Slots** | `1` | 4 | 3 slots libres |

---

## 🔐 Variables de Entorno Requeridas

En el panel de **Variables / Secrets** de Bot-Hosting, configura las siguientes variables:

```dotenv
# ==========================================
# Discord (Obligatorio)
# ==========================================
NODE_ENV=production
DISCORD_BOT_TOKEN=<TOKEN_REAL_DEL_BOT>
DISCORD_GUILD_ID=1537936632114847847

# ==========================================
# Proveedores de IA (Enrutador A2A)
# ==========================================
GEMINI_API_KEY=<CLAVE_REAL_GOOGLE_AI_STUDIO>
GEMINI_MODEL=gemini-3.5-flash-lite
GROQ_API_KEY=<CLAVE_REAL_GROQ_CLOUD>
OPENROUTER_API_KEY=<CLAVE_REAL_OPENROUTER_OPCIONAL>

# ==========================================
# Red y Diagnóstico
# ==========================================
PORT=8000
```

> [!CAUTION]
> **Nunca** guardes valores reales en archivos versionados de Git (`.env` está ignorado en `.gitignore`).

---

## 🚀 Flujo de Ejecución en Arranque

Cuando Bot-Hosting inicia o reinicia el contenedor, ejecuta el script configurado:

```bash
npm run deploy:start
```

Este comando ejecuta la siguiente cadena:
1. `npm ci --include=dev`: Instala dependencias limpias y reproducibles.
2. `npm run build`: Compila TypeScript a JavaScript nativo en la carpeta `dist/`.
3. `npm start`: Arranca el bot en producción ejecutando `node dist/bot.js`.

---

## 🔄 Ciclo de Actualizaciones (CI/CD)

1. Realizas cambios y haces push a `main` en GitHub.
2. GitHub Actions (`.github/workflows/ci.yml`) compila y valida la integridad del código en Node 24.
3. En el dashboard de Bot-Hosting, pulsas **Restart**.
4. El contenedor hace `git pull` automático de `main`, ejecuta `npm run deploy:start` y se reconecta a Discord en segundos sin downtime prolongado.
