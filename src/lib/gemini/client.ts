import 'server-only';
import { GoogleGenAI } from '@google/genai';

/**
 * Server-only Google Gemini AI Client.
 * Uses the modern @google/genai SDK.
 * Guaranteed to never leak or execute in browser bundles.
 */
let aiClientInstance: GoogleGenAI | null = null;

/**
 * Check if the Gemini API key is configured in the environment.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

/**
 * Get or initialize the singleton server-side Google GenAI client.
 * Throws a descriptive Error if GEMINI_API_KEY is missing.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is missing. Please configure it in .env.local to enable AI analysis.'
    );
  }

  if (!aiClientInstance) {
    aiClientInstance = new GoogleGenAI({ apiKey });
  }

  return aiClientInstance;
}

export const GEMINI_MODELS = {
  FAST: 'gemini-3.8-flash',
  REASONING: 'gemini-3.8-flash',
  VISION: 'gemini-3.8-flash',
  EMBEDDINGS: 'gemini-embedding-001',
} as const;

/**
 * Confirmed available models on the current project/key with verified quota,
 * vision support, and structured JSON output support.
 */
export const CONFIRMED_REASONING_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
] as const;

export const CONFIRMED_VISION_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
] as const;

export interface GenerateWithFallbackOptions {
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
}

/**
 * Generates content using confirmed models with automatic fallback if a model
 * encounters a transient quota exhaustion (429) or temporary server overload (503).
 * Logs the selected model server-side, and never exposes credentials or secrets.
 */
export async function generateContentWithModelFallback(
  ai: GoogleGenAI,
  contents: Parameters<GoogleGenAI['models']['generateContent']>[0]['contents'],
  options?: GenerateWithFallbackOptions,
  candidateModels: readonly string[] = CONFIRMED_REASONING_MODELS
): Promise<{ text: string; modelUsed: string; attempts: number }> {
  let lastError: unknown = null;
  let attempts = 0;

  for (const model of candidateModels) {
    attempts++;
    const startTime = Date.now();
    try {
      console.log(`[Gemini AI] Invoking model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: options?.systemInstruction,
          responseMimeType: options?.responseMimeType,
          temperature: options?.temperature,
        },
      });

      const latencyMs = Date.now() - startTime;
      console.log(`[Gemini AI] Model ${model} succeeded in ${latencyMs}ms`);
      return {
        text: response.text?.trim() || '',
        modelUsed: model,
        attempts,
      };
    } catch (err) {
      lastError = err;
      const latencyMs = Date.now() - startTime;
      const rawMsg = err instanceof Error ? err.message : String(err);
      // Strictly sanitize any accidental key or token leaks in logs and traces
      let sanitized = rawMsg
        .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
        .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]')
        .replace(/key=[a-zA-Z0-9._-]+/gi, 'key=[REDACTED]');

      const activeKey = process.env.GEMINI_API_KEY?.trim();
      if (activeKey && activeKey.length > 5) {
        sanitized = sanitized.replaceAll(activeKey, '[REDACTED_API_KEY]');
      }

      console.warn(
        `[Gemini AI] Model ${model} failed in ${latencyMs}ms (${sanitized.slice(0, 120)}...). Falling back to next confirmed model...`
      );
    }
  }

  // Ensure the thrown error message does not expose secrets
  if (lastError instanceof Error) {
    let sanitizedErrorMsg = lastError.message
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]')
      .replace(/key=[a-zA-Z0-9._-]+/gi, 'key=[REDACTED]');
    const activeKey = process.env.GEMINI_API_KEY?.trim();
    if (activeKey && activeKey.length > 5) {
      sanitizedErrorMsg = sanitizedErrorMsg.replaceAll(activeKey, '[REDACTED_API_KEY]');
    }
    lastError.message = sanitizedErrorMsg;
  }

  throw lastError;
}

