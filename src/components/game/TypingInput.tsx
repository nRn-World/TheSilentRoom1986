import React, { useEffect } from 'react';
import type { GameState } from './types';

interface TypingInputProps {
  gameState: GameState;
  typedText: string;
  setTypedText: React.Dispatch<React.SetStateAction<string>>;
  typedTextRef: React.MutableRefObject<string>;
  chapter: any;
  triggerManifestation: (type: any) => void;
  triggerKeywordEffect: (effect: any) => void;
  playSound: (type: 'click' | 'bell' | 'backspace' | 'glitch' | 'siren' | 'thunder') => void;
  normalizeForMatch: (value: string) => string;
  KEYWORD_EFFECTS: any;
  KEYWORD_COOLDOWN_MS: number;
  keywordCooldownRef: React.MutableRefObject<any>;
  setKeystrokes: React.Dispatch<React.SetStateAction<number>>;
  setMistakes: React.Dispatch<React.SetStateAction<number>>;
}

const TypingInput = ({
  gameState,
  setTypedText,
  typedTextRef,
  chapter,
  triggerManifestation,
  triggerKeywordEffect,
  playSound,
  normalizeForMatch,
  KEYWORD_EFFECTS,
  KEYWORD_COOLDOWN_MS,
  keywordCooldownRef,
  setKeystrokes,
  setMistakes
}: TypingInputProps) => {
  // Typing Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      // Never capture shortcuts such as Ctrl+C / Cmd+R / Alt+Tab combos.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        playSound('backspace');
        typedTextRef.current = typedTextRef.current.slice(0, -1);
        setTypedText(typedTextRef.current);
        return;
      }

      if (e.key.length === 1) {
        // Stop Space from scrolling or re-activating a focused button.
        if (e.key === ' ') e.preventDefault();
        playSound('click');
        const char = e.key;
        const prev = typedTextRef.current;
        const next = prev + char;

        setKeystrokes(k => k + 1);
        if (char !== chapter.text[prev.length]) setMistakes(m => m + 1);

        typedTextRef.current = next;
        setTypedText(next);

        // All side effects stay OUTSIDE the state updaters: React StrictMode
        // double-invokes updaters in dev, which used to trigger every
        // manifestation and keyword effect twice.
        const normalized = normalizeForMatch(next);

        // Chapter-specific manifestation words
        for (const [word, type] of Object.entries(chapter.manifestationWords)) {
          if (normalized.endsWith(normalizeForMatch(word))) {
            triggerManifestation(type);
          }
        }

        // Global keyword effects (rain/water/blood/red/police etc.)
        for (const effect of Object.keys(KEYWORD_EFFECTS) as any[]) {
          const match = KEYWORD_EFFECTS[effect].some((word: string) =>
            normalized.endsWith(normalizeForMatch(word))
          );
          const now = Date.now();
          if (match && now - keywordCooldownRef.current[effect] > KEYWORD_COOLDOWN_MS) {
            keywordCooldownRef.current[effect] = now;
            triggerKeywordEffect(effect);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, chapter, triggerManifestation, triggerKeywordEffect, playSound, normalizeForMatch, KEYWORD_EFFECTS, KEYWORD_COOLDOWN_MS, keywordCooldownRef, typedTextRef, setTypedText, setKeystrokes, setMistakes]);

  return null; // This component only handles logic, no UI
};

export default TypingInput;
