import dotenv from 'dotenv';
import { resolve } from 'path';
import axios, { AxiosResponse } from 'axios';

// Load .env from the correct location based on where this file is
// Config file is at: packages/server/src/config/llm.ts
// .env is at: packages/server/.env
const envPath = resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

export interface LLMProvider {
  /** Generate a completion. `prompt` is the user question plus rendered context; `system` is the fixed system instruction. */
  generate(prompt: string, system: string): Promise<string>;
}

export interface LLMConfig {
  provider: string;
  apiKey: string;
  model: string;
}

export function getLLMConfig(): LLMConfig {
  return {
    provider: process.env.LLM_PROVIDER || 'gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.LLM_MODEL || 'gemini-2.0-flash',
  };
}

// Typed provider errors carry statusCode so the shared errorHandler in
// middleware/error.ts maps them to the documented HTTP status contract.
export class LLMConfigError extends Error {
  statusCode = 503;
  constructor(message = 'El asistente de IA no está configurado: falta GEMINI_API_KEY en el entorno del servidor') {
    super(message);
    this.name = 'LLMConfigError';
  }
}

export class LLMRateLimitError extends Error {
  statusCode = 429;
  constructor(message = 'El proveedor de IA está temporalmente saturado. Intente nuevamente en unos minutos.') {
    super(message);
    this.name = 'LLMRateLimitError';
  }
}

export class LLMUpstreamError extends Error {
  statusCode = 502;
  constructor(message = 'El proveedor de IA no pudo procesar la consulta. Intente nuevamente más tarde.') {
    super(message);
    this.name = 'LLMUpstreamError';
  }
}

class GeminiProvider implements LLMProvider {
  constructor(private readonly config: LLMConfig) {}

  async generate(prompt: string, system: string): Promise<string> {
    let response: AxiosResponse;
    try {
      response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent`,
        {
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
        },
        { headers: { 'x-goog-api-key': this.config.apiKey } }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new LLMRateLimitError();
        }
        throw new LLMUpstreamError();
      }
      throw new LLMUpstreamError();
    }

    const candidates = response.data?.candidates as
      | Array<{ content?: { parts?: Array<{ text?: string }> } }>
      | undefined;
    const text = candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';

    if (!text.trim()) {
      throw new LLMUpstreamError('El proveedor de IA devolvió una respuesta vacía.');
    }
    return text;
  }
}

export function getProvider(): LLMProvider {
  const config = getLLMConfig();
  if (!config.apiKey) {
    throw new LLMConfigError();
  }
  if (config.provider === 'gemini') {
    return new GeminiProvider(config);
  }
  throw new LLMConfigError(`Proveedor de IA no soportado: ${config.provider}`);
}
