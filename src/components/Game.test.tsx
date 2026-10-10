// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Game from './Game';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock AudioContext
class MockAudioContext {
  state = 'suspended';
  currentTime = 0;
  destination = {};
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
  }
}

describe('The Silent Room 1986 Game Logic & Translations', () => {
  beforeEach(() => {
    (window as any).AudioContext = MockAudioContext;
  });

  it('renders initial narrative UI in English', () => {
    render(<Game />);
    expect(screen.getByRole('heading', { name: /The Silent Room 1986/i })).toBeDefined();
  });

  it('switches languages properly and resets UI text', () => {
    render(<Game />);

    // Switch to Swedish
    const svButtons = screen.getAllByRole('button', { name: 'SV' });
    fireEvent.click(svButtons[0]);
    expect(screen.getByRole('heading', { name: /Undersök brottsplatsen/i })).toBeDefined();

    // Switch to Turkish
    const trButtons = screen.getAllByRole('button', { name: 'TR' });
    fireEvent.click(trButtons[0]);
    expect(screen.getByRole('heading', { name: /Olay yerini incele/i })).toBeDefined();
  });

  it('allows starting investigation and typing story text', () => {
    render(<Game />);

    const startBtns = screen.getAllByRole('button');
    const initBtn = startBtns.find(b => b.textContent?.includes('Start Investigation'));
    expect(initBtn).toBeDefined();
    if (initBtn) {
      fireEvent.click(initBtn);
    }

    // Type a character
    fireEvent.keyDown(window, { key: 'T' });
    const accuracyElements = screen.getAllByText(/100%/i);
    expect(accuracyElements.length).toBeGreaterThan(0);
  });
});
