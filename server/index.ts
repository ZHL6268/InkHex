import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  checkOpenAIHealth,
  generateFollowupInterpretation,
  generateInitialInterpretation,
  isOpenAIConfigured,
} from './openai';
import { DivinationResult, Message } from '../src/types';
import { summarizeAIError } from '../src/lib/aiInterpretation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const port = Number(process.env.PORT || 8787);

dotenv.config({ path: path.join(rootDir, '.env.local') });
dotenv.config({ path: path.join(rootDir, '.env') });

const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/api/ai/health', async (_req, res) => {
  if (!isOpenAIConfigured()) {
    res.status(503).json({ ok: false, message: '服务端未配置 OPENAI_API_KEY。' });
    return;
  }

  const result = await checkOpenAIHealth();
  res.status(result.ok ? 200 : 503).json(result);
});

app.post('/api/ai/interpret', async (req, res) => {
  const { kind, baseResult, conversation, followup } = req.body as {
    kind?: 'initial' | 'followup';
    baseResult?: DivinationResult;
    conversation?: Message[];
    followup?: string;
  };

  if (!isOpenAIConfigured()) {
    res.status(503).json({ ok: false, message: '服务端未配置 OPENAI_API_KEY。' });
    return;
  }

  if (!baseResult || (kind !== 'initial' && kind !== 'followup')) {
    res.status(400).json({ ok: false, message: '请求参数不完整。' });
    return;
  }

  try {
    const text = kind === 'followup'
      ? await generateFollowupInterpretation(baseResult, conversation || [], followup || '')
      : await generateInitialInterpretation(baseResult);

    if (!text) {
      res.status(502).json({ ok: false, message: 'OpenAI 没有返回可用内容。' });
      return;
    }

    res.json({ ok: true, text });
  } catch (error) {
    console.error('OpenAI API request failed:', error);
    res.status(502).json({ ok: false, message: summarizeAIError(error) });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`InkHex server listening on http://localhost:${port}`);
});
