import { assetUrl } from './assets';

export type SoundScene = 'silent' | 'calm' | 'ritual';

const BGM_SRC = assetUrl('assets/bgm-calm.mp3');
const COIN_SHAKE_SRC = assetUrl('assets/coin-shake.mp3');
const COIN_THROW_SRC = assetUrl('assets/coin-throw.mp3');

export function createSoundscapeController() {
  let bgm: HTMLAudioElement | null = null;
  let shakeLoop: HTMLAudioElement | null = null;
  let throwShot: HTMLAudioElement | null = null;
  let scene: SoundScene = 'silent';
  let unlocked = false;
  let enabled = true;
  let fadeTimer: number | null = null;
  let isShakeLoopPlaying = false;

  const ensureAudio = () => {
    if (!bgm) {
      bgm = new Audio(BGM_SRC);
      bgm.loop = true;
      bgm.preload = 'auto';
      bgm.volume = 0;
      bgm.crossOrigin = 'anonymous';
    }

    if (!shakeLoop) {
      shakeLoop = new Audio(COIN_SHAKE_SRC);
      shakeLoop.preload = 'auto';
      shakeLoop.loop = true;
      shakeLoop.volume = 0;
      shakeLoop.crossOrigin = 'anonymous';
    }

    if (!throwShot) {
      throwShot = new Audio(COIN_THROW_SRC);
      throwShot.preload = 'auto';
      throwShot.volume = 0.32;
      throwShot.crossOrigin = 'anonymous';
    }
  };

  const targetVolumeForScene = (nextScene: SoundScene) => {
    if (!enabled) return 0;
    if (nextScene === 'calm') return 0.28;
    if (nextScene === 'ritual') return 0.12;
    return 0;
  };

  const fadeBgmTo = (targetVolume: number) => {
    if (!bgm) return;

    if (fadeTimer) {
      window.clearInterval(fadeTimer);
      fadeTimer = null;
    }

    const startVolume = bgm.volume;
    const duration = 420;
    const startAt = performance.now();

    fadeTimer = window.setInterval(() => {
      if (!bgm) return;

      const progress = Math.min((performance.now() - startAt) / duration, 1);
      bgm.volume = startVolume + (targetVolume - startVolume) * progress;

      if (progress >= 1) {
        if (fadeTimer) {
          window.clearInterval(fadeTimer);
          fadeTimer = null;
        }

        if (targetVolume === 0) {
          bgm.pause();
        }
      }
    }, 16);
  };

  const applyScene = async (nextScene: SoundScene) => {
    scene = nextScene;
    if (!unlocked) return;

    ensureAudio();
    if (!bgm) return;

    const targetVolume = targetVolumeForScene(nextScene);

    if (targetVolume > 0) {
      try {
        await bgm.play();
      } catch {
        return;
      }
    }

    fadeBgmTo(targetVolume);
  };

  const unlock = async () => {
    ensureAudio();
    unlocked = true;

    if (bgm) {
      try {
        bgm.muted = false;
        await bgm.play();
        bgm.pause();
      } catch {
        return;
      }
    }

    await applyScene(scene);
  };

  const setEnabled = (nextEnabled: boolean) => {
    enabled = nextEnabled;
    void applyScene(scene);
    if (!enabled) {
      stopShakeLoop();
    }
  };

  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  };

  const startShakeLoop = async () => {
    if (!unlocked || !enabled || isShakeLoopPlaying) return;
    ensureAudio();
    if (!shakeLoop) return;

    shakeLoop.volume = 0.22;
    shakeLoop.currentTime = 0;
    isShakeLoopPlaying = true;
    void shakeLoop.play().catch(() => {
      isShakeLoopPlaying = false;
    });
    vibrate(10);
  };

  const stopShakeLoop = () => {
    if (!shakeLoop) return;

    shakeLoop.pause();
    shakeLoop.currentTime = 0;
    shakeLoop.volume = 0;
    isShakeLoopPlaying = false;
  };

  const playThrowImpact = () => {
    if (!unlocked || !enabled) return;
    ensureAudio();
    stopShakeLoop();
    if (throwShot) {
      throwShot.pause();
      throwShot.currentTime = 0;
      throwShot.volume = 0.34;
      void throwShot.play().catch(() => undefined);
    }
    vibrate([10, 24, 14]);
  };

  return {
    unlock,
    isEnabled: () => enabled,
    setEnabled,
    setScene: (nextScene: SoundScene) => {
      void applyScene(nextScene);
    },
    startShakeLoop,
    stopShakeLoop,
    playThrowImpact,
  };
}
