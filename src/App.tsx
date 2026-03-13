import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { Layout } from './components/Layout';
import { buildHexagramFromTosses } from './constants';
import { assetUrl } from './lib/assets';
import { DivinationResult, Message, Screen, TossRecord } from './types';
import { Startup } from './screens/Startup';
import { Home } from './screens/Home';
import { Divination } from './screens/Divination';
import { Interpretation } from './screens/Interpretation';

const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || __APP_GEMINI_API_KEY__ || '').trim();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const aiEnabled = Boolean(apiKey);
const ritualMark = assetUrl('assets/ritual-mark.png');

const initialMessages: Message[] = [
  {
    id: 'opening',
    role: 'priest',
    content: '你想问什么？',
  },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('startup');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [interpretationMessages, setInterpretationMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInterpretationReplying, setIsInterpretationReplying] = useState(false);
  const [isTransitioningToDivination, setIsTransitioningToDivination] = useState(false);

  useEffect(() => {
    if (screen === 'home' && messages.length === 0) {
      setMessages(initialMessages);
    }
  }, [messages.length, screen]);

  const handleAsk = (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question) return;

    const nextMessages: Message[] = [
      ...messages,
      { id: `user-${Date.now()}`, role: 'user', content: question },
    ];

    setMessages(nextMessages);

    if (question.length < 4) {
      setIsTransitioningToDivination(false);
      setMessages([
        ...nextMessages,
        {
          id: `hint-${Date.now()}`,
          role: 'priest',
          content: '你可以说得再具体一点。你最想问的是机会、结果，还是该不该行动？',
          mood: 'hint',
        },
      ]);
      return;
    }

    setTopic(question);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `transition-${Date.now()}`,
          role: 'priest',
          content: '我知道了。接下来专心想着这件事。',
          mood: 'ritual',
        },
      ]);
    }, 600);

    window.setTimeout(() => {
      setIsTransitioningToDivination(true);
    }, 1500);
  };

  const handleDivinationTransitionComplete = () => {
    setScreen('divination');
    setIsTransitioningToDivination(false);
  };

  const buildInitialInterpretationPrompt = (baseResult: DivinationResult) => `你是一位沉静温和、熟读《周易》的道士，请围绕这一次真实起出的卦，直接向面前的施主说出你的判断。

用户所问：${baseResult.topic}
本卦：${baseResult.primary.name}
本卦一句话：${baseResult.primary.plainMeaning}
本卦卦意：${baseResult.primary.judgment}
本卦意象：${baseResult.primary.image}
变卦：${baseResult.relating?.name ?? '无变卦'}
动爻：${baseResult.changingLines.length ? baseResult.changingLines.map((line) => `第${line}爻`).join('、') : '无'}
动爻判读依据：${baseResult.interpretationBasis}
取用卦辞：${baseResult.book.judgment}
取用爻辞：${baseResult.book.changingLine}
中文参考解说：${baseResult.book.plainLanguage}
结合此问的中文参考：${baseResult.book.relation}

要求：
1. 直接输出自然中文，不要 JSON，不要标题，不要编号
2. 先给一句判断，再顺着往下讲清楚当前处境、变化处、该怎么拿捏
3. 必须结合用户这个具体问题，不要泛泛而谈
4. 必须至少点到一次取用卦辞或取用爻辞的意思，再翻成白话
5. 如果这是“要不要、能不能、该不该”的问题，要给明确倾向，不要含糊
6. 口吻像真人当场解卦，克制、清楚、有温度，不要故作玄虚
7. 全中文输出，不要夹英文
8. 用 3 到 5 段短段落即可`;

  const buildFollowupPrompt = (baseResult: DivinationResult, conversation: Message[], followup: string) => `你是一位沉静温和、熟读《周易》的道士。现在用户已经起过卦，正在围绕同一卦继续追问。请你只基于这一次的卦象继续回答，不要另起新卦。

用户最初所问：${baseResult.topic}
本卦：${baseResult.primary.name}
本卦一句话：${baseResult.primary.plainMeaning}
本卦卦意：${baseResult.primary.judgment}
本卦意象：${baseResult.primary.image}
变卦：${baseResult.relating?.name ?? '无变卦'}
动爻：${baseResult.changingLines.length ? baseResult.changingLines.map((line) => `第${line}爻`).join('、') : '无'}
动爻判读依据：${baseResult.interpretationBasis}
取用卦辞：${baseResult.book.judgment}
取用爻辞：${baseResult.book.changingLine}
中文参考解说：${baseResult.book.plainLanguage}
结合此问的中文参考：${baseResult.book.relation}

此前对话：
${conversation.map((message) => `${message.role === 'user' ? '用户' : '道士'}：${message.content}`).join('\n')}

用户这次追问：${followup}

要求：
1. 直接输出自然中文，不要 JSON，不要标题，不要编号
2. 要把这次追问和前文连起来回答，像真人继续对话
3. 如果用户补充了新现实信息，要结合这些信息重新解释卦意落点
4. 不要脱离这次卦象乱说，不要像通用心理安慰
5. 如有必要，可以提醒“这是在同一卦里继续细看，不是重新起卦”
6. 全中文输出，不要夹英文`;

  const buildFallbackInterpretation = (baseResult: DivinationResult) =>
    [
      baseResult.quickTake,
      baseResult.summary,
      baseResult.interpretation,
      baseResult.changeInfo,
      baseResult.advice,
    ].join('\n\n');

  const handleDivinationComplete = async (tosses: TossRecord[]) => {
    setIsLoading(true);
    const baseResult = await buildHexagramFromTosses(topic || '此心所问', tosses);
    let firstReply = buildFallbackInterpretation(baseResult);

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: buildInitialInterpretationPrompt(baseResult),
        });
        firstReply = (response.text || '').trim() || firstReply;
      } catch (error) {
        console.error('AI interpretation failed:', error);
      }
    }

    setResult(baseResult);
    setInterpretationMessages([
      { id: `interp-user-${Date.now()}`, role: 'user', content: baseResult.topic },
      { id: `interp-priest-${Date.now() + 1}`, role: 'priest', content: firstReply },
    ]);
    setIsLoading(false);
    setScreen('interpretation');
  };

  const handleInterpretationFollowUp = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || !result || isInterpretationReplying) return;

    const nextMessages = [
      ...interpretationMessages,
      { id: `followup-user-${Date.now()}`, role: 'user' as const, content: question },
    ];

    setInterpretationMessages(nextMessages);
    setIsInterpretationReplying(true);

    let reply = `你这句问得更细了。若只看这一次的卦，${result.book.relation}`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: buildFollowupPrompt(result, nextMessages, question),
        });
        reply = (response.text || '').trim() || reply;
      } catch (error) {
        console.error('AI follow-up failed:', error);
      }
    }

    setInterpretationMessages((current) => [
      ...current,
      { id: `followup-priest-${Date.now()}`, role: 'priest', content: reply },
    ]);
    setIsInterpretationReplying(false);
  };

  const handleRestart = () => {
    setTopic('');
    setResult(null);
    setMessages(initialMessages);
    setInterpretationMessages([]);
    setIsInterpretationReplying(false);
    setIsTransitioningToDivination(false);
    setScreen('home');
  };

  const renderScreen = () => {
    if (isLoading) {
      return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#efeee7] px-6 py-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent_22%)]" />
          <div className="relative flex w-full max-w-md flex-col items-center text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 16, ease: 'linear', repeat: Infinity }}
              className="mb-8 w-full max-w-[15rem] sm:max-w-[17rem]"
            >
              <img src={ritualMark} alt="八卦图" className="w-full object-contain" />
            </motion.div>

            <p className="font-headline text-[1.9rem] tracking-[0.32em] text-ink-900">卦意回卷</p>
            <p className="ink-loading-copy mt-6 max-w-[18rem] text-[15px] leading-8 text-ink-500">
              道长正在依卦观势，为这一问整理可落下的话。
            </p>
          </div>
        </div>
      );
    }

    switch (screen) {
      case 'startup':
        return <Startup onComplete={() => setScreen('home')} />;
      case 'home':
        return (
          <Home
            messages={messages}
            onAsk={handleAsk}
            aiEnabled={aiEnabled}
            isTransitioningOut={isTransitioningToDivination}
            onTransitionComplete={handleDivinationTransitionComplete}
          />
        );
      case 'divination':
        return <Divination topic={topic} onComplete={handleDivinationComplete} onExit={handleRestart} />;
      case 'interpretation':
        return result ? (
          <Interpretation
            result={result}
            messages={interpretationMessages}
            isReplying={isInterpretationReplying}
            aiEnabled={aiEnabled}
            onSend={handleInterpretationFollowUp}
            onRestart={handleRestart}
          />
        ) : null;
      default:
        return (
          <Home
            messages={messages}
            onAsk={handleAsk}
            aiEnabled={aiEnabled}
            isTransitioningOut={isTransitioningToDivination}
            onTransitionComplete={handleDivinationTransitionComplete}
          />
        );
    }
  };

  return (
    <Layout immersive={screen === 'startup'}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${screen}-${isLoading ? 'loading' : 'ready'}`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="min-h-screen"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
