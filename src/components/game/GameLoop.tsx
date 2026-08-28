import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

import type { GameState } from './types';

interface Enemy {
  id: string;
  type: 'standard' | 'heavy' | 'censor' | 'infiltrator';
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  state: 'marching' | 'stunned' | 'retreating';
}

interface GameLoopProps {
  lang: 'en' | 'sv' | 'tr';
  chapterIndex: number;
  setTypedText: React.Dispatch<React.SetStateAction<string>>;
  typedTextRef: React.MutableRefObject<string>;
  manifestations: any[];
  setManifestations: React.Dispatch<React.SetStateAction<any[]>>;
  enemies: any[];
  setEnemies: React.Dispatch<React.SetStateAction<any[]>>;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  shake: number;
  setShake: React.Dispatch<React.SetStateAction<number>>;
  isHeavy: boolean;
  setIsHeavy: React.Dispatch<React.SetStateAction<boolean>>;
  isCold: boolean;
  setIsCold: React.Dispatch<React.SetStateAction<boolean>>;
  isHeat: boolean;
  setIsHeat: React.Dispatch<React.SetStateAction<boolean>>;
  isTangled: boolean;
  setIsTangled: React.Dispatch<React.SetStateAction<boolean>>;
  isGravity: boolean;
  setIsGravity: React.Dispatch<React.SetStateAction<boolean>>;
  isShielded: boolean;
  setIsShielded: React.Dispatch<React.SetStateAction<boolean>>;
  isTimeSlowed: boolean;
  setIsTimeSlowed: React.Dispatch<React.SetStateAction<boolean>>;
  isRaining: boolean;
  setIsRaining: React.Dispatch<React.SetStateAction<boolean>>;
  isWaterPulse: boolean;
  setIsWaterPulse: React.Dispatch<React.SetStateAction<boolean>>;
  isPoliceAlert: boolean;
  setIsPoliceAlert: React.Dispatch<React.SetStateAction<boolean>>;
  bloodFlash: boolean;
  setBloodFlash: React.Dispatch<React.SetStateAction<boolean>>;
  redFlash: boolean;
  setRedFlash: React.Dispatch<React.SetStateAction<boolean>>;
  stormFlash: boolean;
  setStormFlash: React.Dispatch<React.SetStateAction<boolean>>;
  darkFlash: boolean;
  setDarkFlash: React.Dispatch<React.SetStateAction<boolean>>;
  ghostFog: boolean;
  setGhostFog: React.Dispatch<React.SetStateAction<boolean>>;
  windRush: boolean;
  setWindRush: React.Dispatch<React.SetStateAction<boolean>>;
  revolutionPoints: number;
  setRevolutionPoints: React.Dispatch<React.SetStateAction<number>>;
  upgrades: any;
  setUpgrades: React.Dispatch<React.SetStateAction<any>>;
  chapter: any;
  level: number;
  rank: number;
  playSound: (type: 'click' | 'bell' | 'backspace' | 'glitch' | 'siren' | 'thunder') => void;
  triggerManifestation: (type: any) => void;
  triggerKeywordEffect: (effect: any) => void;
  startChapter: () => void;
  t: any;
  normalizeForMatch: (value: string) => string;
  KEYWORD_EFFECTS: any;
  KEYWORD_COOLDOWN_MS: number;
  audioCtxRef: React.MutableRefObject<any>;
  bgAudioRef: React.MutableRefObject<any>;
  enemiesRef: React.MutableRefObject<any>;
  keywordCooldownRef: React.MutableRefObject<any>;
}

export const GameLoop = ({
  chapterIndex,
  setTypedText,
  typedTextRef,
  setManifestations,
  setEnemies,
  gameState,
  setGameState,
  isHeavy,
  isTangled,
  isTimeSlowed,
  isShielded,
  setRevolutionPoints,
  upgrades,
  chapter,
  level,
  rank,
  playSound,
  enemiesRef
}: GameLoopProps) => {
  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    let ended = false;

    const interval = setInterval(() => {
      if (ended || gameState !== 'playing') return;

      setManifestations(prev => prev.filter(m => Date.now() - m.startTime < m.duration));

      // Derive the next enemy state from the latest snapshot (kept in a ref,
      // so this closure never goes stale and updaters stay pure — React
      // StrictMode double-invokes updaters, which previously deleted two
      // characters per censor tick and fired game over twice).
      const snapshot = enemiesRef.current;
      let deletedChars = 0;

      const moved = snapshot.map((e: Enemy) => {
        // Censor Effect: deletes typed text when close (only while marching)
        if (e.type === 'censor' && e.state === 'marching' && e.x > 78 && Math.random() < 0.04) {
          deletedChars++;
        }
        if (e.state === 'stunned') return e;
        if (e.state === 'retreating') return { ...e, x: Math.max(0, e.x - e.speed * 1.5) };
        let moveSpeed = e.speed;
        if (isTimeSlowed) moveSpeed *= 0.3;
        if (isTangled) moveSpeed *= 0.5;
        if (isHeavy) moveSpeed *= 0.88;
        return { ...e, x: e.x + moveSpeed };
      }).filter((e: Enemy) => e.health > 0);

      if (deletedChars > 0) {
        typedTextRef.current = typedTextRef.current.slice(0, -deletedChars);
        setTypedText(typedTextRef.current);
        playSound('glitch');
      }

      // Spawn enemies with progressive level/rank scaling
      const chapterFactor = 1 + (chapterIndex * 0.25);
      const rankFactor = 1 + ((rank - 1) * 0.1);
      const spawnRate = Math.min(0.09, 0.002 * chapterFactor * rankFactor * (1 - upgrades.soundProofing * 0.12));
      const maxEnemies = 6 + chapterIndex * 2 + Math.floor(rank / 2);
      if (moved.length < maxEnemies && Math.random() < spawnRate) {
        const typeRoll = Math.random();
        let type: Enemy['type'] = 'standard';
        let health = 60 + chapterIndex * 15 + rank * 5;
        let speed = 0.06 + chapterIndex * 0.015 + rank * 0.006 + Math.random() * 0.05;

        // Introduce enemy types progressively
        const activeCensors = moved.filter((e: Enemy) => e.type === 'censor').length;
        if (level >= 5 && typeRoll > 0.84 && activeCensors < 2) {
          type = 'censor';
          speed = 0.07 + (chapterIndex * 0.01);
          health = 100 + chapterIndex * 12 + rank * 8;
        } else if (level >= 3 && typeRoll > 0.66) {
          type = 'infiltrator';
          speed = 0.1 + chapterIndex * 0.015 + rank * 0.004;
        } else if (level >= 4 && typeRoll > 0.52) {
          type = 'heavy';
          health = 160 + chapterIndex * 18 + rank * 12;
          speed = 0.05 + chapterIndex * 0.008;
        }

        moved.push({
          id: Math.random().toString(36).slice(2, 11),
          type,
          x: 0,
          y: Math.random() * 60 + 20,
          health,
          maxHealth: health,
          speed,
          state: 'marching'
        });
      }

      if (!isShielded && moved.some((e: Enemy) => e.x > 85)) {
        ended = true;
        setEnemies(moved);
        setGameState('gameover');
        return;
      }

      setEnemies(moved);

      // Check for victory – only when the player has typed every character
      // and none are wrong. `ended` guards the points against double-awarding.
      const current = typedTextRef.current;
      if (current.length >= chapter.text.length) {
        const allCorrect = current.split('').every((ch, idx) => ch === chapter.text[idx]);
        if (allCorrect) {
          ended = true;
          setGameState('victory');
          setRevolutionPoints(prev => prev + (chapter.id * 120) + (rank * 20));
          playSound('bell');
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        }
      }
    }, 50);

    return () => clearInterval(interval);
    // typedText is intentionally NOT a dependency: the loop reads it from
    // typedTextRef, so the interval no longer restarts on every keystroke.
  }, [gameState, chapter, chapterIndex, level, rank, isHeavy, isTangled, isTimeSlowed, isShielded, upgrades.soundProofing, playSound, setManifestations, setEnemies, setGameState, setTypedText, setRevolutionPoints, typedTextRef, enemiesRef]);

  return null; // This component only handles logic, no UI
};

export default GameLoop;
