import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, BellOff } from 'lucide-react';
import { Layout } from './components/Layout';
import { buildHexagramFromTosses } from './constants';
import { assetUrl } from './lib/assets';
import { buildUnavailableInterpretation } from './lib/aiInterpretation';
import { createSoundscapeController } from './lib/soundscape';
import { DivinationResult, Message, Screen, TossRecord } from './types';
import { Startup } from './screens/Startup';
import { Home } from './screens/Home';
import { Divination } from './screens/Divination';
import { Interpretation } from './screens/Interpretation';

const ritualMark = assetUrl('assets/ritual-mark.png');

type AIStatus = 'checking' | 'ready' | 'unavailable';

const initialMessages: Message[] = [
  {
    id: 'opening',
    role: 'priest',
    content: '你想问什么？',
  },
];

async function requestAIHealth(signal?: AbortSignal): Promise<AIStatus> {
  try {
    const response = await fetch('/api/ai/health', { signal });
    if (!response.ok) {
      return 'unavailable';
    }

    const data = await response.json();
    return data.ok ? 'ready' : 'unavailable';
  } catch (error) {
    console.error('AI health check failed:', error);
    return 'unavailable';
  }
}

async function ensureAIReady(currentStatus: AIStatus): Promise<AIStatus> {
  if (currentStatus === 'ready') {
    return 'ready';
  }

  return requestAIHealth();
}

async function requestAIInterpretation(body: {
  kind: 'initial' | 'followup';
  baseResult: DivinationResult;
  conversation?: Message[];
  followup?: string;
}) {
  const response = await fetch('/api/ai/interpret', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok || !data.text) {
    throw new Error(data.message || `AI request failed with status ${response.status}`);
  }

  return data.text as string;
}

export default function App() {
  const soundscapeRef = useRef<ReturnType<typeof createSoundscapeController> | null>(null);
  if (!soundscapeRef.current) {
    soundscapeRef.current = createSoundscapeController();
  }
  const [screen, setScreen] = useState<Screen>('startup');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [interpretationMessages, setInterpretationMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInterpretationReplying, setIsInterpretationReplying] = useState(false);
  const [isTransitioningToDivination, setIsTransitioningToDivination] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus>('checking');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (screen === 'home' && messages.length === 0) {
      setMessages(initialMessages);
    }
  }, [messages.length, screen]);

  useEffect(() => {
    const controller = new AbortController();

    requestAIHealth(controller.signal).then((status) => {
      if (!controller.signal.aborted) {
        setAiStatus(status);
      }
    });

    const timer = window.setInterval(() => {
      requestAIHealth(controller.signal).then((status) => {
        if (!controller.signal.aborted) {
          setAiStatus(status);
        }
      });
    }, 45000);

    return () => {
      window.clearInterval(timer);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      soundscapeRef.current?.unlock().catch(() => undefined);
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('mousedown', unlockAudio);
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('mousedown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    const scene = screen === 'divination'
      ? 'ritual'
      : screen === 'home' || screen === 'interpretation'
        ? 'calm'
        : 'silent';

    soundscapeRef.current?.setScene(scene);
    if (screen !== 'divination') {
      soundscapeRef.current?.stopShakeLoop();
    }
  }, [screen]);

  useEffect(() => {
    soundscapeRef.current?.setEnabled(soundEnabled);
    if (!soundEnabled) {
      soundscapeRef.current?.stopShakeLoop();
    }
  }, [soundEnabled]);

  const handleSoundToggle = async () => {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);
    soundscapeRef.current?.setEnabled(nextEnabled);
    if (nextEnabled) {
      await soundscapeRef.current?.unlock();
    }
  };

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

  const handleDivinationComplete = async (tosses: TossRecord[]) => {
    setIsLoading(true);
    const baseResult = await buildHexagramFromTosses(topic || '此心所问', tosses);
    let firstReply = '此刻道长正在静心观势。';
    const nextAIStatus = await ensureAIReady(aiStatus);
    setAiStatus(nextAIStatus);

    if (nextAIStatus === 'ready') {
      try {
        firstReply = await requestAIInterpretation({
          kind: 'initial',
          baseResult,
        });
      } catch (error) {
        console.error('AI interpretation failed:', error);
        const recoveredStatus = await requestAIHealth();
        setAiStatus(recoveredStatus);
        firstReply = buildUnavailableInterpretation(error);
      }
    } else {
      firstReply = '今日问卦的人太多，道长眼下暂不能继续开口解这一卦。请稍后再来。';
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

    let reply = '道长正在收束这一卦的气息。';
    const nextAIStatus = await ensureAIReady(aiStatus);
    setAiStatus(nextAIStatus);

    if (nextAIStatus === 'ready') {
      try {
        reply = await requestAIInterpretation({
          kind: 'followup',
          baseResult: result,
          conversation: nextMessages,
          followup: question,
        });
      } catch (error) {
        console.error('AI follow-up failed:', error);
        const recoveredStatus = await requestAIHealth();
        setAiStatus(recoveredStatus);
        reply = buildUnavailableInterpretation(error);
      }
    } else {
      reply = '这一卦今日已经问得太满，道长眼下不再续断。请过一段时间再回来细问。';
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
            aiEnabled={aiStatus === 'ready'}
            isTransitioningOut={isTransitioningToDivination}
            onTransitionComplete={handleDivinationTransitionComplete}
          />
        );
      case 'divination':
        return (
          <Divination
            topic={topic}
            onComplete={handleDivinationComplete}
            onExit={handleRestart}
            onShakeStateChange={(active) => {
              if (active) {
                void soundscapeRef.current?.startShakeLoop();
              } else {
                soundscapeRef.current?.stopShakeLoop();
              }
            }}
            onThrowFeedback={() => soundscapeRef.current?.playThrowImpact()}
          />
        );
      case 'interpretation':
        return result ? (
          <Interpretation
            result={result}
            messages={interpretationMessages}
            isReplying={isInterpretationReplying}
            aiEnabled={aiStatus === 'ready'}
            onSend={handleInterpretationFollowUp}
            onRestart={handleRestart}
          />
        ) : null;
      default:
        return (
          <Home
            messages={messages}
            onAsk={handleAsk}
            aiEnabled={aiStatus === 'ready'}
            isTransitioningOut={isTransitioningToDivination}
            onTransitionComplete={handleDivinationTransitionComplete}
          />
        );
    }
  };

  return (
    <Layout immersive={screen === 'startup'}>
      <div className="fixed right-4 top-4 z-[120] flex items-center gap-2">
        <button
          type="button"
          onClick={handleSoundToggle}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/42 text-white/88 shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur-md transition hover:bg-black/56"
          aria-label={soundEnabled ? '关闭声音' : '开启声音'}
          title={soundEnabled ? '关闭声音' : '开启声音'}
        >
          {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </button>
      </div>
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
