import { NextResponse } from 'next/server';
import { getGeminiClient, isGeminiConfigured, GEMINI_MODELS } from '@/lib/gemini';

export interface AiTestSuccessResponse {
  status: 'ok';
  configured: true;
  model: string;
  prompt: string;
  response: string;
  latencyMs: number;
  timestamp: string;
}

export interface AiTestUnconfiguredResponse {
  status: 'not_configured';
  configured: false;
  message: string;
  timestamp: string;
}

export interface AiTestErrorResponse {
  status: 'error';
  configured: boolean;
  message: string;
  timestamp: string;
}

export type AiTestResponse =
  | AiTestSuccessResponse
  | AiTestUnconfiguredResponse
  | AiTestErrorResponse;

const TEST_PROMPT = 'Respond with exactly the single word: OK';

async function handleAiTest(): Promise<NextResponse<AiTestResponse>> {
  const timestamp = new Date().toISOString();

  // 1. Verify environment configuration without exposing key
  if (!isGeminiConfigured()) {
    return NextResponse.json<AiTestUnconfiguredResponse>(
      {
        status: 'not_configured',
        configured: false,
        message:
          'GEMINI_API_KEY is not configured in .env.local. Add your key to enable live Gemini reasoning.',
        timestamp,
      },
      { status: 503 }
    );
  }

  // 2. Execute minimal deterministic test prompt server-side
  const startTime = Date.now();

  try {
    const ai = getGeminiClient();

    const result = await ai.models.generateContent({
      model: GEMINI_MODELS.FAST,
      contents: TEST_PROMPT,
    });

    const latencyMs = Date.now() - startTime;
    const responseText = result.text?.trim() ?? '';

    return NextResponse.json<AiTestSuccessResponse>({
      status: 'ok',
      configured: true,
      model: GEMINI_MODELS.FAST,
      prompt: TEST_PROMPT,
      response: responseText,
      latencyMs,
      timestamp,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown Gemini API error';

    // Sanitize any accidental sensitive leaks from error strings
    const sanitizedMessage = errorMessage.replace(
      /AIza[0-9A-Za-z-_]{35}/g,
      '[REDACTED_API_KEY]'
    );

    return NextResponse.json<AiTestErrorResponse>(
      {
        status: 'error',
        configured: true,
        message: `Gemini test invocation failed (${latencyMs}ms): ${sanitizedMessage}`,
        timestamp,
      },
      { status: 502 }
    );
  }
}

/**
 * GET /api/ai/test
 * Read-only health check for server-side Gemini connectivity.
 */
export async function GET() {
  return handleAiTest();
}

/**
 * POST /api/ai/test
 * Action-based test for server-side Gemini connectivity.
 */
export async function POST() {
  return handleAiTest();
}
