import type { GameState } from './types';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Volume2, Monitor, Accessibility, Save } from 'lucide-react';

type GameStateType = GameState;

interface SettingsMenuProps {
  gameState: GameStateType;
  setGameState: React.Dispatch<React.SetStateAction<GameStateType>>;
  t: any;
  audioSettings: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
  };
  setAudioSettings: React.Dispatch<React.SetStateAction<{
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
  }>>;
  graphicsSettings: {
    particleIntensity: number;
    screenEffects: boolean;
    colorBlindMode: boolean;
  };
  setGraphicsSettings: React.Dispatch<React.SetStateAction<{
    particleIntensity: number;
    screenEffects: boolean;
    colorBlindMode: boolean;
  }>>;
  accessibilitySettings: {
    reducedMotion: boolean;
    highContrast: boolean;
  };
  setAccessibilitySettings: React.Dispatch<React.SetStateAction<{
    reducedMotion: boolean;
    highContrast: boolean;
  }>>;
  lang: 'en' | 'sv' | 'tr';
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SettingsMenu = ({
  gameState,
  setGameState,
  t,
  audioSettings,
  setAudioSettings,
  graphicsSettings,
  setGraphicsSettings,
  accessibilitySettings,
  setAccessibilitySettings,
  lang
}: SettingsMenuProps) => {
  const [saved, setSaved] = useState(false);

  if (gameState !== 'settings') return null;

  const labels = {
    title: lang === 'sv' ? 'Inställningar' : lang === 'tr' ? 'Ayarlar' : 'Settings',
    audio: lang === 'sv' ? 'Ljud' : lang === 'tr' ? 'Ses' : 'Audio',
    master: lang === 'sv' ? 'Master Volym' : lang === 'tr' ? 'Ana Ses' : 'Master Volume',
    music: lang === 'sv' ? 'Musikvolym' : lang === 'tr' ? 'Müzik Sesi' : 'Music Volume',
    sfx: lang === 'sv' ? 'Ljudeffekter' : lang === 'tr' ? 'Ses Efektleri' : 'Sound Effects',
    graphics: lang === 'sv' ? 'Grafik' : lang === 'tr' ? 'Grafik' : 'Graphics',
    particles: lang === 'sv' ? 'Partikelintensitet' : lang === 'tr' ? 'Partikül Yoğunluğu' : 'Particle Intensity',
    screenFx: lang === 'sv' ? 'Skärmeffekter & Skak' : lang === 'tr' ? 'Ekran Efektleri' : 'Screen Effects & Shake',
    colorBlind: lang === 'sv' ? 'Färgblindläge' : lang === 'tr' ? 'Renk Körlüğü Modu' : 'Color Blind Mode',
    accessibility: lang === 'sv' ? 'Tillgänglighet' : lang === 'tr' ? 'Erişilebilirlik' : 'Accessibility',
    reducedMotion: lang === 'sv' ? 'Minskad rörelse' : lang === 'tr' ? 'Azaltılmış Hareket' : 'Reduced Motion',
    highContrast: lang === 'sv' ? 'Hög kontrast' : lang === 'tr' ? 'Yüksek Kontrast' : 'High Contrast',
    save: lang === 'sv' ? 'Sparad!' : lang === 'tr' ? 'Kaydedildi!' : 'Saved!',
    saveBtn: lang === 'sv' ? 'Spara inställningar' : lang === 'tr' ? 'Kaydet' : 'Save Settings',
  };

  const handleSave = () => {
    try {
      localStorage.setItem('tsr_audio', JSON.stringify(audioSettings));
      localStorage.setItem('tsr_graphics', JSON.stringify(graphicsSettings));
      localStorage.setItem('tsr_accessibility', JSON.stringify(accessibilitySettings));
    } catch (_) {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const RangeRow = ({
    label,
    value,
    onChange,
    min = 0,
    max = 1,
    step = 0.05,
    displayPct = true,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    displayPct?: boolean;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="flex justify-between text-sm font-medium text-white/80">
        {label}
        <span className="text-[#f27d26] font-bold">
          {displayPct ? `${Math.round((value / max) * 100)}%` : `${Math.round(value * 100) / 100}x`}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#f27d26]"
      />
    </div>
  );

  const ToggleRow = ({
    id,
    label,
    checked,
    onChange,
  }: {
    id: string;
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-10 h-5 rounded-full transition-colors duration-300',
          checked ? 'bg-[#f27d26]' : 'bg-white/20'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300',
            checked && 'translate-x-5'
          )}
        />
      </div>
      <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{label}</span>
    </label>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/95 p-8 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl mx-auto w-full"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-display uppercase italic text-[#f27d26]">{labels.title}</h2>
        <button
          onClick={() => setGameState('narrative')}
          className="px-4 py-2 bg-white/10 rounded font-bold text-xs uppercase hover:bg-[#f27d26] hover:text-black transition-all"
        >
          {t.ui.return}
        </button>
      </div>

      <div className="space-y-8">
        {/* Audio */}
        <div>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-white">
            <Volume2 className="w-4 h-4 text-[#f27d26]" /> {labels.audio}
          </h3>
          <div className="space-y-4">
            <RangeRow
              label={labels.master}
              value={audioSettings.masterVolume}
              onChange={(v) => setAudioSettings(prev => ({ ...prev, masterVolume: v }))}
            />
            <RangeRow
              label={labels.music}
              value={audioSettings.musicVolume}
              onChange={(v) => setAudioSettings(prev => ({ ...prev, musicVolume: v }))}
            />
            <RangeRow
              label={labels.sfx}
              value={audioSettings.sfxVolume}
              onChange={(v) => setAudioSettings(prev => ({ ...prev, sfxVolume: v }))}
            />
          </div>
        </div>

        {/* Graphics */}
        <div>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-white">
            <Monitor className="w-4 h-4 text-[#f27d26]" /> {labels.graphics}
          </h3>
          <div className="space-y-4">
            <RangeRow
              label={labels.particles}
              value={graphicsSettings.particleIntensity}
              min={0.1}
              max={2}
              step={0.1}
              displayPct={false}
              onChange={(v) => setGraphicsSettings(prev => ({ ...prev, particleIntensity: v }))}
            />
            <ToggleRow
              id="screen-effects"
              label={labels.screenFx}
              checked={graphicsSettings.screenEffects}
              onChange={(v) => setGraphicsSettings(prev => ({ ...prev, screenEffects: v }))}
            />
            <ToggleRow
              id="color-blind"
              label={labels.colorBlind}
              checked={graphicsSettings.colorBlindMode}
              onChange={(v) => setGraphicsSettings(prev => ({ ...prev, colorBlindMode: v }))}
            />
          </div>
        </div>

        {/* Accessibility */}
        <div>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-white">
            <Accessibility className="w-4 h-4 text-[#f27d26]" /> {labels.accessibility}
          </h3>
          <div className="space-y-4">
            <ToggleRow
              id="reduced-motion"
              label={labels.reducedMotion}
              checked={accessibilitySettings.reducedMotion}
              onChange={(v) => setAccessibilitySettings(prev => ({ ...prev, reducedMotion: v }))}
            />
            <ToggleRow
              id="high-contrast"
              label={labels.highContrast}
              checked={accessibilitySettings.highContrast}
              onChange={(v) => setAccessibilitySettings(prev => ({ ...prev, highContrast: v }))}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className={cn(
          'w-full mt-8 py-3 font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all',
          saved
            ? 'bg-green-500 text-white'
            : 'bg-[#f27d26] text-black hover:bg-white'
        )}
      >
        <Save className="w-4 h-4" />
        {saved ? labels.save : labels.saveBtn}
      </button>
    </motion.div>
  );
};

export default SettingsMenu;