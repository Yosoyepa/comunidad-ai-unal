import { Logger } from '../utils/logger';

interface RateLimitEntry {
  timestamps: number[];
}

export interface AIQueryResult {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
  fallbackChain: string[];
}

export class AIAssistantService {
  private static userRequests = new Map<string, RateLimitEntry>();
  private static MAX_REQUESTS = 3;
  private static WINDOW_MS = 5 * 60 * 1000; // 5 minutos

  /**
   * Valida y aplica el Rate Limiter por usuario para proteger las cuotas gratuitas.
   */
  public static checkRateLimit(userId: string): { allowed: boolean; waitSeconds?: number } {
    const now = Date.now();
    let entry = this.userRequests.get(userId);

    if (!entry) {
      entry = { timestamps: [] };
      this.userRequests.set(userId, entry);
    }

    // Filtrar timestamps dentro de la ventana de 5 min
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < this.WINDOW_MS);

    if (entry.timestamps.length >= this.MAX_REQUESTS) {
      const oldest = entry.timestamps[0];
      const waitSeconds = Math.ceil((this.WINDOW_MS - (now - oldest)) / 1000);
      return { allowed: false, waitSeconds };
    }

    entry.timestamps.push(now);
    return { allowed: true };
  }

  /**
   * Orquestador A2A (Agent-to-Agent) con Fallback en Cascada Multi-Proveedor:
   * 1. Google Gemini 2.0 Flash (Primario - 1,500 RPD / 15 RPM gratis)
   * 2. Groq Cloud Llama 3.3 70B (Secundario - Inferencia ultra-rápida LPU gratis)
   * 3. OpenRouter DeepSeek R1 / Llama 3 Free (Terciario - Modelos :free)
   * 4. Demo Fallback (Modo contingencia educativo si no hay claves)
   */
  public static async queryAIWithCascade(
    prompt: string, 
    systemInstruction?: string
  ): Promise<AIQueryResult> {
    const startTime = Date.now();
    const fallbackChain: string[] = [];

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    const defaultSystem = systemInstruction || 
      'Eres el asistente técnico de Inteligencia Artificial para la comunidad universitaria UNAL AI. Responde con rigor técnico, código limpio y explicaciones claras.';

    // -------------------------------------------------------------
    // NIVEL 1: GOOGLE GEMINI (Primario)
    // -------------------------------------------------------------
    if (geminiKey && !geminiKey.includes('tu_clave')) {
      try {
        Logger.info('[A2A Router] Intentando con Proveedor 1: Google Gemini 1.5 Flash...');
        const res = await this.queryGemini(prompt, defaultSystem, geminiKey);
        if (res) {
          fallbackChain.push('Gemini-1.5-Flash (Éxito)');
          return {
            text: res,
            provider: 'Google AI Studio',
            model: 'Gemini 1.5 Flash',
            latencyMs: Date.now() - startTime,
            fallbackChain
          };
        }
      } catch (err: any) {
        Logger.warn(`[A2A Router] Fallo en Gemini (${err?.message || 'Error'}). Activando fallback a Groq...`);
        fallbackChain.push(`Gemini (Fallo: ${err?.message || 'Error'})`);
      }
    } else {
      fallbackChain.push('Gemini (Sin API Key configurada)');
    }

    // -------------------------------------------------------------
    // NIVEL 2: GROQ CLOUD (Secundario / Fallback 1)
    // -------------------------------------------------------------
    if (groqKey && !groqKey.includes('tu_clave')) {
      try {
        Logger.info('[A2A Router] Intentando con Proveedor 2: Groq Cloud (Llama 3.3 70B)...');
        const res = await this.queryGroq(prompt, defaultSystem, groqKey);
        if (res) {
          fallbackChain.push('Groq-Llama-3.3-70B (Éxito)');
          return {
            text: res,
            provider: 'Groq Cloud',
            model: 'Llama 3.3 70B Versatile',
            latencyMs: Date.now() - startTime,
            fallbackChain
          };
        }
      } catch (err: any) {
        Logger.warn(`[A2A Router] Fallo en Groq (${err?.message || 'Error'}). Activando fallback a OpenRouter...`);
        fallbackChain.push(`Groq (Fallo: ${err?.message || 'Error'})`);
      }
    } else {
      fallbackChain.push('Groq (Sin API Key configurada)');
    }

    // -------------------------------------------------------------
    // NIVEL 3: OPENROUTER (Terciario / Fallback 2)
    // -------------------------------------------------------------
    if (openRouterKey && !openRouterKey.includes('tu_clave')) {
      try {
        Logger.info('[A2A Router] Intentando con Proveedor 3: OpenRouter (DeepSeek R1 :free)...');
        const res = await this.queryOpenRouter(prompt, defaultSystem, openRouterKey);
        if (res) {
          fallbackChain.push('OpenRouter-DeepSeek-R1 (Éxito)');
          return {
            text: res,
            provider: 'OpenRouter',
            model: 'DeepSeek R1 (Free)',
            latencyMs: Date.now() - startTime,
            fallbackChain
          };
        }
      } catch (err: any) {
        Logger.warn(`[A2A Router] Fallo en OpenRouter (${err?.message || 'Error'})...`);
        fallbackChain.push(`OpenRouter (Fallo: ${err?.message || 'Error'})`);
      }
    } else {
      fallbackChain.push('OpenRouter (Sin API Key configurada)');
    }

    // -------------------------------------------------------------
    // NIVEL 4: MODO DEMOSTRACIÓN / CONTINGENCIA
    // -------------------------------------------------------------
    fallbackChain.push('Fallback de Contingencia Educativa');
    const fallbackText = (
      `🧠 **Asistente de Inteligencia Artificial (Modo Contingencia)**\n\n` +
      `Tu consulta: *"${prompt.slice(0, 150)}..."*\n\n` +
      `> ℹ️ **Lógica de Fallback A2A Activa**: No se encontraron credenciales activas o todos los proveedores alcanzaron su rate limit momentáneo.\n` +
      `> Para habilitar respuestas con modelos reales en vivo, añade tus claves gratuitas en el archivo \`.env\`:\n` +
      `> • \`GEMINI_API_KEY="AIzaSy..."\` (Google AI Studio - 1,500 RPD gratis)\n` +
      `> • \`GROQ_API_KEY="gsk_..."\` (Groq Cloud - Inferencia en ms gratis)\n` +
      `> • \`OPENROUTER_API_KEY="sk-or-..."\` (OpenRouter Free Tier)`
    );

    return {
      text: fallbackText,
      provider: 'A2A Router (Demostración)',
      model: 'Simulador / Demo',
      latencyMs: Date.now() - startTime,
      fallbackChain
    };
  }

  private static async queryGemini(prompt: string, system: string, apiKey: string): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `[Contexto/Instrucción: ${system}]\n\n${prompt}` }] }],
          generationConfig: { maxOutputTokens: 1200, temperature: 0.7 }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${await response.text()}`);
      }

      const data: any = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private static async queryGroq(prompt: string, system: string, apiKey: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1200
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${await response.text()}`);
      }

      const data: any = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private static async queryOpenRouter(prompt: string, system: string, apiKey: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://unal.edu.co',
          'X-Title': 'UNAL AI Community Bot'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1:free',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${await response.text()}`);
      }

      const data: any = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
