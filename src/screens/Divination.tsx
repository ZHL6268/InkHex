import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Hand, RotateCcw } from 'lucide-react';
import { randomTossRecord } from '../constants';
import { assetUrl } from '../lib/assets';
import { TossRecord } from '../types';

interface DivinationProps {
  topic: string;
  onComplete: (tosses: TossRecord[]) => void;
  onExit: () => void;
  onShakeStateChange?: (active: boolean) => void;
  onThrowFeedback?: () => void;
}

type DivinationPhase = 'waiting' | 'primed' | 'casting' | 'revealed' | 'complete';
type MotionPermissionState = 'unsupported' | 'prompt' | 'granted' | 'denied';

const SHAKE_THRESHOLD = 16;
const SHAKE_STOP_DELAY = 320;
const idleImageSrc = assetUrl('assets/divination-idle.png');
const shakeVideoSrc = assetUrl('assets/divination-shake.mp4');
const throwVideoSrc = assetUrl('assets/divination-throw.mp4');

export const Divination: React.FC<DivinationProps> = ({ topic, onComplete, onExit, onShakeStateChange, onThrowFeedback }) => {
  const [tosses, setTosses] = useState<TossRecord[]>([]);
  const [phase, setPhase] = useState<DivinationPhase>('waiting');
  const [lastRecord, setLastRecord] = useState<TossRecord | null>(null);
  const [statusText, setStatusText] = useState('想着你的问题，先轻轻摇动手机。');
  const [showThrowVideo, setShowThrowVideo] = useState(false);
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const [isShakeVideoActive, setIsShakeVideoActive] = useState(false);
  const [hasPrimedThrow, setHasPrimedThrow] = useState(false);
  const [showDesktopHint] = useState(true);
  const [isDesktopShaking, setIsDesktopShaking] = useState(false);
  const [motionPermission, setMotionPermission] = useState<MotionPermissionState>('unsupported');

  const shakeVideoRef = useRef<HTMLVideoElement | null>(null);
  const throwVideoRef = useRef<HTMLVideoElement | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const overlayTimerRef = useRef<number | null>(null);
  const phaseRef = useRef<DivinationPhase>('waiting');
  const tossCountRef = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    tossCountRef.current = tosses.length;
  }, [tosses.length]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      setMotionPermission('unsupported');
      return;
    }

    const deviceMotion = DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    setMotionPermission(typeof deviceMotion.requestPermission === 'function' ? 'prompt' : 'granted');
  }, []);

  useEffect(() => {
    if (motionPermission !== 'granted') {
      return undefined;
    }

    const handleMotion = (event: DeviceMotionEvent) => {
      const { x = 0, y = 0, z = 0 } = event.accelerationIncludingGravity || {};
      const force = Math.abs(x) + Math.abs(y) + Math.abs(z);

      if (force <= SHAKE_THRESHOLD || phaseRef.current === 'casting' || phaseRef.current === 'complete') {
        return;
      }

      setShakeEnabled(true);
      setHasPrimedThrow(true);
      setPhase('primed');
      setStatusText('已经感到铜钱起势了，继续想着此问，然后轻点画面抛出这一爻。');
      playShakeVideo();
      onShakeStateChange?.(true);

      if (stopTimerRef.current) {
        window.clearTimeout(stopTimerRef.current);
      }

      stopTimerRef.current = window.setTimeout(() => {
        pauseShakeVideo();
      }, SHAKE_STOP_DELAY);
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [motionPermission]);

  useEffect(() => {
    if (tosses.length !== 6) return;

    setPhase('complete');
    setStatusText('六爻已成，正在收束卦意。');
    completeTimerRef.current = window.setTimeout(() => onComplete(tosses), 1800);

    return () => {
      if (completeTimerRef.current) {
        window.clearTimeout(completeTimerRef.current);
      }
    };
  }, [onComplete, tosses]);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) {
        window.clearTimeout(stopTimerRef.current);
      }
      if (completeTimerRef.current) {
        window.clearTimeout(completeTimerRef.current);
      }
      if (overlayTimerRef.current) {
        window.clearTimeout(overlayTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    onShakeStateChange?.(isShakeVideoActive && phase === 'primed');
  }, [isShakeVideoActive, onShakeStateChange, phase]);

  const playShakeVideo = () => {
    const video = shakeVideoRef.current;
    if (!video) return;

    video.muted = true;
    setIsShakeVideoActive(true);
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        setIsShakeVideoActive(false);
      });
    }
  };

  const pauseShakeVideo = () => {
    const video = shakeVideoRef.current;
    if (!video) return;
    video.pause();
    setIsShakeVideoActive(false);
    onShakeStateChange?.(false);
  };

  const requestMotionAccess = async () => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      setMotionPermission('unsupported');
      return;
    }

    const deviceMotion = DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof deviceMotion.requestPermission !== 'function') {
      setMotionPermission('granted');
      return;
    }

    try {
      const permission = await deviceMotion.requestPermission();
      if (permission === 'granted') {
        setMotionPermission('granted');
        setStatusText('体感已开启。现在轻轻摇动手机，让铜钱动起来。');
      } else {
        setMotionPermission('denied');
        setStatusText('未获得体感权限。你仍可轻点画面抛掷，或开启权限后再摇动。');
      }
    } catch {
      setMotionPermission('denied');
      setStatusText('体感权限没有开启成功。你仍可轻点画面抛掷，或重试开启。');
    }
  };

  const handleThrow = () => {
    if (phaseRef.current === 'casting' || phaseRef.current === 'complete' || tossCountRef.current >= 6) {
      return;
    }

    if (!hasPrimedThrow && !showDesktopHint) {
      setStatusText('先摇动手机，让铜钱动起来，再轻点画面抛出。');
      return;
    }

    if (!hasPrimedThrow && showDesktopHint) {
      setStatusText('电脑端请先按住画面模拟摇动，松开后再点击抛掷。');
      return;
    }

    pauseShakeVideo();
    setShowThrowVideo(true);
    setPhase('casting');
    setHasPrimedThrow(false);
    setIsShakeVideoActive(false);
    setStatusText('铜钱已出手，稍等它落定。');
    onShakeStateChange?.(false);
    onThrowFeedback?.();

    const throwVideo = throwVideoRef.current;
    if (throwVideo) {
      throwVideo.currentTime = 0;
      const playPromise = throwVideo.play();
      if (playPromise) {
        playPromise.catch(() => finalizeThrow());
      }
    } else {
      finalizeThrow();
    }
  };

  const startDesktopShake = () => {
    if (!showDesktopHint || phaseRef.current === 'casting' || phaseRef.current === 'complete' || tossCountRef.current >= 6) {
      return;
    }

    setShakeEnabled(true);
    setHasPrimedThrow(true);
    setIsDesktopShaking(true);
    setPhase('primed');
    setStatusText('已模拟摇动。松开后再次轻点画面，抛出这一爻。');
    playShakeVideo();
    onShakeStateChange?.(true);
  };

  const stopDesktopShake = () => {
    if (!showDesktopHint) return;
    setIsDesktopShaking(false);
    pauseShakeVideo();
  };

  const finalizeThrow = () => {
    if (phaseRef.current !== 'casting') return;

    const record = randomTossRecord();
    setLastRecord(record);
    setTosses((current) => [...current, record]);
    setShowThrowVideo(false);
    setPhase('revealed');
    setIsShakeVideoActive(false);
    onShakeStateChange?.(false);

    const nextCount = tossCountRef.current + 1;
    if (nextCount < 6) {
      setStatusText(`第${nextCount}爻已记下。继续摇动手机，准备下一次抛掷。`);
    } else {
      setStatusText('第六爻已定。卦象即将成形。');
    }

    if (overlayTimerRef.current) {
      window.clearTimeout(overlayTimerRef.current);
    }
    overlayTimerRef.current = window.setTimeout(() => {
      setLastRecord(null);
    }, 1800);

    window.setTimeout(() => {
      if (nextCount < 6) {
        setPhase('waiting');
      }
    }, 720);
  };

  const lineLabel = (record: TossRecord) => {
    if (record.value === 6) return '老阴';
    if (record.value === 7) return '少阳';
    if (record.value === 8) return '少阴';
    return '老阳';
  };

  const progressSummary = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, index) => {
        const label = 6 - index;
        const record = tosses[label - 1];
        return { label, record };
      }),
    [tosses],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0c0a] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,9,8,0.22),rgba(10,8,7,0.3)_36%,rgba(12,9,8,0.72)_100%)]" />

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-32 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.3),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-40 bg-[linear-gradient(to_top,rgba(0,0,0,0.52),transparent)]" />

        <div className="absolute left-4 right-4 top-5 z-40 flex items-start justify-between gap-4 md:left-6 md:right-6 md:top-6">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.35em] text-white/58">摇卦场景</p>
            <p className="mt-3 font-headline text-2xl tracking-[0.2em] text-white/96 md:text-3xl">
              {topic || '请守住心里要问的那件事'}
            </p>
            <p className="mt-3 text-sm leading-7 text-white/72">{statusText}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <button
              onClick={onExit}
              className="flex h-11 items-center gap-2 whitespace-nowrap rounded-[1.1rem] border border-white/14 bg-[linear-gradient(180deg,rgba(20,20,24,0.42),rgba(20,20,24,0.24))] px-4 py-2 text-[12px] tracking-[0.04em] text-white/82 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md transition hover:border-white/24 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              重新开始
            </button>

            {showDesktopHint ? (
              <button
                type="button"
                onMouseDown={startDesktopShake}
                onMouseUp={stopDesktopShake}
                onMouseLeave={stopDesktopShake}
                className={`h-10 whitespace-nowrap rounded-full border px-4 py-2 text-[11px] tracking-[0.12em] backdrop-blur-md transition ${
                  isDesktopShaking
                    ? 'border-[#f2d7ae]/40 bg-[#a76d3a]/28 text-[#fff1d4]'
                    : 'border-white/12 bg-black/18 text-white/76 hover:border-white/24 hover:text-white'
                }`}
              >
                {isDesktopShaking ? '模拟摇动中' : '按住模拟摇动'}
              </button>
            ) : null}

            {motionPermission === 'prompt' ? (
              <button
                type="button"
                onClick={requestMotionAccess}
                className="h-10 whitespace-nowrap rounded-full border border-[#f2d7ae]/26 bg-[#6c5431]/28 px-4 py-2 text-[11px] tracking-[0.12em] text-[#fff1d4] backdrop-blur-md transition hover:border-[#f2d7ae]/40 hover:bg-[#7b6138]/34"
              >
                开启体感摇卦
              </button>
            ) : null}
          </div>
        </div>

        <div className="relative flex min-h-screen flex-1">
          <section className="relative flex-1 overflow-hidden">
            <div
              onClick={handleThrow}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleThrow();
                }
              }}
              className="relative block h-screen w-full overflow-hidden bg-[#1b1410] text-left"
            >
              <img
                src={idleImageSrc}
                alt="摇卦桌案"
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300 ${
                  showThrowVideo || isShakeVideoActive ? 'opacity-0' : 'opacity-100'
                }`}
              />

              <video
                ref={shakeVideoRef}
                muted
                playsInline
                loop
                preload="auto"
                className={`absolute inset-0 h-full w-full scale-[1.02] object-cover object-center transition-opacity duration-200 ${
                  isShakeVideoActive && !showThrowVideo ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <source src={shakeVideoSrc} type="video/mp4" />
              </video>

              <AnimatePresence>
                {showThrowVideo ? (
                  <motion.video
                    ref={throwVideoRef}
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onEnded={finalizeThrow}
                    className="absolute inset-0 z-20 h-full w-full scale-[1.02] object-cover object-center"
                  >
                    <source src={throwVideoSrc} type="video/mp4" />
                  </motion.video>
                ) : null}
              </AnimatePresence>

              <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),transparent_24%,transparent_58%,rgba(0,0,0,0.42)_100%)]" />
              <div className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(circle_at_center,transparent_46%,rgba(0,0,0,0.16)_100%)]" />

              <div className="pointer-events-none absolute left-4 right-4 top-4 z-40 flex items-center justify-between">
                <div className="rounded-full border border-white/12 bg-black/18 px-3 py-1 text-xs tracking-[0.28em] text-white/76 backdrop-blur-md">
                  第 {Math.min(tosses.length + 1, 6)} 次
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center">
                <div className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.42),rgba(18,18,22,0.24))] px-4 py-3 text-center backdrop-blur-[16px]">
                  <div className="text-xs tracking-[0.16em] text-white/72">
                    {motionPermission === 'prompt'
                      ? '先点右上角开启体感摇卦。电脑预览仍可用模拟摇动。'
                      : showDesktopHint
                        ? '手机可直接摇动；电脑预览可先按住右上角按钮模拟摇动，松开后再点击画面抛掷'
                        : '先摇动，再轻点画面抛掷'}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <AnimatePresence>
          {lastRecord ? (
            <motion.aside
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              className="absolute left-1/2 top-1/2 z-40 w-[min(360px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(20,18,16,0.58),rgba(14,12,11,0.38))] px-5 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-[18px]"
            >
              <div className="flex items-center gap-2 text-sm tracking-[0.18em] text-[#f2d7ae]">
                <Hand className="h-4 w-4" />
                <span>刚刚落定</span>
              </div>
              <p className="mt-3 text-base leading-7 text-white/88">
                第{tosses.length}爻为{lineLabel(lastRecord)}
                {lastRecord.changing ? '，此爻有变。' : '，此爻不变。'}
              </p>

              <div className="mt-6">
                <p className="text-xs tracking-[0.3em] text-white/58">六爻进度</p>
                <div className="mt-4 space-y-3">
                  {progressSummary.map(({ label, record }) => (
                    <div key={label} className="rounded-[1.1rem] border border-white/8 bg-white/5 px-4 py-3">
                      <div className="mb-2 flex items-center justify-between text-xs tracking-[0.2em] text-white/56">
                        <span>第 {label} 爻</span>
                        <span>{record ? lineLabel(record) : '未定'}</span>
                      </div>
                      <LinePreview line={record?.line} changing={record?.changing} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

const LinePreview: React.FC<{ line?: 0 | 1; changing?: boolean }> = ({ line, changing }) => {
  if (line === undefined) {
    return <div className="h-3 rounded-full bg-white/10" />;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 items-center gap-2">
        {line === 1 ? (
          <div className="h-3 w-full rounded-full bg-white/88" />
        ) : (
          <>
            <div className="h-3 flex-1 rounded-full bg-white/88" />
            <div className="h-3 flex-1 rounded-full bg-white/88" />
          </>
        )}
      </div>
      {changing ? <span className="text-xs tracking-[0.2em] text-[#d79a67]">动</span> : null}
    </div>
  );
};
