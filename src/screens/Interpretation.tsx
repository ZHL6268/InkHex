import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpenText, RotateCcw, ScrollText, SendHorizonal } from 'lucide-react';
import { PRIEST_AVATAR } from '../constants';
import { assetUrl } from '../lib/assets';
import { DivinationResult, Message } from '../types';

interface InterpretationProps {
  result: DivinationResult;
  messages: Message[];
  isReplying: boolean;
  aiEnabled: boolean;
  onSend: (question: string) => void;
  onRestart: () => void;
}

const backgroundVideo = assetUrl('assets/home-background.mp4');

export const Interpretation: React.FC<InterpretationProps> = ({ result, messages, isReplying, aiEnabled, onSend, onRestart }) => {
  const [bookOpen, setBookOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isReplying]);

  const suggestionList = useMemo(
    () => [
      '你更倾向我现在行动，还是先等等？',
      '这卦里最需要我注意的风险是什么？',
      '如果我补充一些现实情况，你再帮我细看一下。',
    ],
    [],
  );

  const submit = () => {
    if (!input.trim() || isReplying) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#141312]">
      <div className="absolute inset-0">
        <video autoPlay muted loop playsInline className="h-full w-full object-cover object-center">
          <source src={backgroundVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,15,0.24),rgba(14,14,15,0.18)_24%,rgba(14,14,15,0.48)_58%,rgba(14,14,15,0.84)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_22%,rgba(11,11,12,0.16)_60%,rgba(11,11,12,0.46)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-4 pb-5 pt-[max(env(safe-area-inset-top),20px)] text-white">
        <header className="flex items-center justify-between px-2 pt-1 text-[13px] font-medium tracking-[0.18em] text-white/92">
          <span>9:41</span>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-white/12 bg-black/14 px-3 py-1 text-[11px] tracking-[0.28em] text-white/78 backdrop-blur-md">
              解卦中
            </div>
            <div
              className={`rounded-full border px-3 py-1 text-[11px] tracking-[0.16em] backdrop-blur-md ${
                aiEnabled
                  ? 'border-emerald-300/28 bg-emerald-400/12 text-emerald-100'
                  : 'border-amber-300/24 bg-amber-400/12 text-amber-100'
              }`}
            >
              {aiEnabled ? 'Gemini AI' : '本地解卦'}
            </div>
          </div>
        </header>

        <div className="flex-1" />

        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative mb-5 rounded-[2rem] border border-white/7 bg-[linear-gradient(180deg,rgba(33,33,38,0.24),rgba(24,24,28,0.14))] p-4 shadow-[0_20px_64px_rgba(0,0,0,0.22)] backdrop-blur-[14px]"
        >
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_20%,transparent)]" />

          <div className="relative mb-5 flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full border border-white/12 bg-black/20 p-1">
              <img
                src={PRIEST_AVATAR}
                alt="道士"
                className="h-full w-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="text-sm tracking-[0.18em] text-white/92">守一道人</p>
              <p className="mt-1 text-xs tracking-[0.14em] text-white/58">这一卦，已经回到纸上。</p>
            </div>
          </div>

          <div ref={scrollRef} className="relative flex max-h-[40vh] min-h-[18rem] flex-col gap-3 overflow-y-auto pr-1">
            <div className="flex justify-start">
              <div className="max-w-[84%] rounded-[1.3rem] border border-[#d9be78]/20 bg-[linear-gradient(180deg,rgba(112,96,56,0.22),rgba(63,54,30,0.14))] px-4 py-3 text-white/92 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
                <p className="text-[15px] leading-7">{result.primary.plainMeaning}</p>
              </div>
            </div>

            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index === messages.length - 1 ? 0.08 : 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={[
                  'max-w-[84%] px-4 py-4 text-white/96 shadow-[0_12px_28px_rgba(0,0,0,0.2)]',
                  message.role === 'user'
                    ? 'rounded-[1.4rem] bg-[linear-gradient(180deg,rgba(132,149,180,0.5),rgba(92,110,138,0.52))]'
                    : index === 0
                      ? 'rounded-[1.4rem] border border-[#d9be78]/18 bg-[linear-gradient(180deg,rgba(112,96,56,0.2),rgba(63,54,30,0.14))]'
                      : 'rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(110,110,118,0.18),rgba(75,75,82,0.12))]',
                ].join(' ')}>
                  <p className="text-[15px] leading-7">{message.content}</p>
                </div>
              </motion.div>
            ))}

            {isReplying ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="max-w-[64%] rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(110,110,118,0.18),rgba(75,75,82,0.12))] px-4 py-3 text-white/72 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
                  <p className="text-[15px] leading-7">我再替你细看一层。</p>
                </div>
              </motion.div>
            ) : null}
          </div>
        </motion.section>

        <div className="mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {suggestionList.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="shrink-0 rounded-full border border-white/12 bg-black/18 px-4 py-2 text-[12px] tracking-[0.04em] text-white/82 backdrop-blur-md transition hover:bg-black/28"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <footer className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(40,40,44,0.72),rgba(25,25,29,0.62))] px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-[24px]">
          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={() => setBookOpen(true)}
              className="flex h-11 items-center justify-center gap-2 rounded-[1.2rem] bg-white/10 px-4 text-sm text-white/90 transition hover:bg-white/14"
            >
              <BookOpenText className="h-4 w-4" />
              查看《周易》原文
            </button>
            <button
              onClick={onRestart}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[1.2rem] bg-white text-sm text-[#181818] transition hover:bg-white/92"
            >
              <RotateCcw className="h-4 w-4" />
              再问一卦
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex min-h-[3.8rem] flex-1 items-center rounded-[1.2rem] bg-white px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    submit();
                  }
                }}
                rows={1}
                placeholder="你可以继续追问这卦，或补充更多情况"
                className="max-h-28 min-h-[2.4rem] flex-1 resize-none bg-transparent py-3 text-[15px] leading-7 text-[#181818] outline-none placeholder:text-[#868686]"
              />
              <button
                onClick={submit}
                disabled={isReplying || !input.trim()}
                className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#111216] text-white transition hover:bg-[#1c1d22] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="继续追问"
              >
                <SendHorizonal className="h-5 w-5" />
              </button>
            </div>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {bookOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/46 px-4 backdrop-blur-sm"
            onClick={() => setBookOpen(false)}
          >
            <motion.div
              initial={{ y: 24, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              onClick={(event) => event.stopPropagation()}
              className="book-modal relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-gold/20 bg-[linear-gradient(180deg,rgba(250,244,226,0.98),rgba(232,221,191,0.96))] shadow-[0_30px_120px_rgba(27,31,32,0.32)]"
            >
              <div className="book-scroll min-h-0 flex-1 overflow-y-auto">
                <div className="grid gap-0 md:grid-cols-2">
                  <div className="border-b border-ink-900/8 px-6 py-8 md:border-b-0 md:border-r">
                    <div className="mb-5 flex items-center gap-2 text-ink-500">
                      <ScrollText className="h-4 w-4" />
                      <p className="text-xs tracking-[0.28em]">卦名与卦辞</p>
                    </div>
                    <p className="font-headline text-3xl tracking-[0.24em] text-ink-900">{result.book.title}</p>
                    <p className="mt-6 text-base leading-8 text-ink-700">{result.book.judgment}</p>
                    <p className="mt-6 text-sm leading-7 text-ink-500">{result.book.plainLanguage}</p>
                  </div>

                  <div className="px-6 py-8">
                    <p className="text-xs tracking-[0.28em] text-ink-500">爻辞与今意</p>
                    <p className="mt-4 text-base leading-8 text-ink-700">{result.book.changingLine}</p>
                    <div className="mt-6 rounded-[1.2rem] border border-gold/18 bg-paper/55 px-4 py-4">
                      <p className="text-sm leading-7 text-ink-600">{result.book.relation}</p>
                    </div>
                    <div className="mt-6 rounded-[1.2rem] border border-ink-900/8 bg-paper/72 px-4 py-4">
                      <p className="text-xs tracking-[0.22em] text-ink-400">本卦提要</p>
                      <p className="mt-2 text-sm leading-7 text-ink-700">{result.primary.judgment}</p>
                      <p className="mt-2 text-sm leading-7 text-ink-500">{result.primary.image}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(250,244,226,0.92),transparent)]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-[linear-gradient(0deg,rgba(229,217,186,0.92),transparent)]" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
