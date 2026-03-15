import OpenAI from 'openai';
import { DivinationResult, Message } from '../src/types';
import {
  buildFollowupPrompt,
  buildInitialInterpretationPrompt,
  FOLLOWUP_INTERPRETATION_CONFIG,
  INITIAL_INTERPRETATION_CONFIG,
  summarizeAIError,
} from '../src/lib/aiInterpretation';

function getApiKey() {
  return (process.env.OPENAI_API_KEY || '').trim();
}

function getModel() {
  return (process.env.OPENAI_MODEL || 'gpt-4.1').trim();
}

export function isOpenAIConfigured() {
  return Boolean(getApiKey());
}

function requireClient() {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY on server.');
  }

  return new OpenAI({ apiKey });
}

let healthCache:
  | {
      expiresAt: number;
      result: { ok: boolean; message: string };
    }
  | null = null;

async function requestText(input: string, instructions?: string, temperature = 0.8) {
  const client = requireClient();
  const response = await client.responses.create({
    model: getModel(),
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: input,
          },
        ],
      },
    ],
    instructions,
    temperature,
  });

  return (response.output_text || '').trim();
}

export async function checkOpenAIHealth(force = false) {
  if (!force && healthCache && healthCache.expiresAt > Date.now()) {
    return healthCache.result;
  }

  try {
    const text = await requestText('请只回复“已连接”。', undefined, 0);
    const result = text
      ? { ok: true, message: 'OpenAI 已连接。' }
      : { ok: false, message: 'OpenAI 没有返回可用内容。' };

    healthCache = {
      expiresAt: Date.now() + 60_000,
      result,
    };

    return result;
  } catch (error) {
    const result = { ok: false, message: summarizeAIError(error) };
    healthCache = {
      expiresAt: Date.now() + 15_000,
      result,
    };
    return result;
  }
}

export async function generateInitialInterpretation(baseResult: DivinationResult) {
  return requestText(
    buildInitialInterpretationPrompt(baseResult),
    INITIAL_INTERPRETATION_CONFIG.systemInstruction,
    INITIAL_INTERPRETATION_CONFIG.temperature,
  );
}

export async function generateFollowupInterpretation(baseResult: DivinationResult, conversation: Message[], followup: string) {
  return requestText(
    buildFollowupPrompt(baseResult, conversation, followup),
    FOLLOWUP_INTERPRETATION_CONFIG.systemInstruction,
    FOLLOWUP_INTERPRETATION_CONFIG.temperature,
  );
}
