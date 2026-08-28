import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Crown, Skull, Heart, Zap, 
  Shield, Target, Clock
} from 'lucide-react';

interface BossSystemProps {
  gameState: 'narrative' | 'playing' | 'gameover' | 'victory' | 'upgrading' | 'inventory' | 'shop' | 'boss';
  setGameState: React.Dispatch<React.SetStateAction<'narrative' | 'playing' | 'gameover' | 'victory' | 'upgrading' | 'inventory' | 'shop' | 'boss'>>;
  chapterIndex: number;
  typedText: string;
  revolutionPoints: number;
  setRevolutionPoints: React.Dispatch<React.SetStateAction<number>>;
  t: any;
}

export interface Boss {
  id: string;
  name: string;
  title: string;
  health: number;
  maxHealth: number;
  phase: number;
  maxPhases: number;
  weaknesses: string[];
  attacks: BossAttack[];
  description: string;
}

export interface BossAttack {
  name: string;
  damage: number;
  type: 'physical' | 'magical' | 'special';
  cooldown: number;
}

interface BossEncounter {
  boss: Boss;
  isActive: boolean;
  timeRemaining: number;
}

const BOSSES: Boss[] = [
  {
    id: 'shadow-lord',
    name: 'The Shadow Lord',
    title: 'Master of Darkness',
    health: 500,
    maxHealth: 500,
    phase: 1,
    maxPhases: 3,
    weaknesses: ['light', 'fire'],
    attacks: [
      { name: 'Shadow Strike', damage: 50, type: 'physical', cooldown: 2000 },
      { name: 'Dark Void', damage: 80, type: 'magical', cooldown: 4000 },
      { name: 'Shadow Clone', damage: 30, type: 'special', cooldown: 6000 }
    ],
    description: 'A being of pure darkness that feeds on fear and doubt.'
  },
  {
    id: 'memory-keeper',
    name: 'The Memory Keeper',
    title: 'Guardian of Lost Memories',
    health: 600,
    maxHealth: 600,
    phase: 1,
    maxPhases: 4,
    weaknesses: ['void', 'echo'],
    attacks: [
      { name: 'Memory Wipe', damage: 40, type: 'magical', cooldown: 3000 },
      { name: 'Recall Blast', damage: 70, type: 'special', cooldown: 5000 },
      { name: 'Time Loop', damage: 0, type: 'special', cooldown: 8000 }
    ],
    description: 'An ancient entity that guards the boundary between past and present.'
  },
  {
    id: 'void-emperor',
    name: 'The Void Emperor',
    title: 'Ruler of the Empty Realm',
    health: 800,
    maxHealth: 800,
    phase: 1,
    maxPhases: 5,
    weaknesses: ['destiny', 'memory'],
    attacks: [
      { name: 'Void Pulse', damage: 60, type: 'magical', cooldown: 2500 },
      { name: 'Entropy Wave', damage: 100, type: 'special', cooldown: 7000 },
      { name: 'Existence Erase', damage: 150, type: 'special', cooldown: 10000 }
    ],
    description: 'The ruler of nothingness who seeks to unmake reality itself.'
  },
  {
    id: 'echo-titan',
    name: 'The Echo Titan',
    title: 'The Resonating Colossus',
    health: 700,
    maxHealth: 700,
    phase: 1,
    maxPhases: 4,
    weaknesses: ['shadow', 'destiny'],
    attacks: [
      { name: 'Sonic Boom', damage: 55, type: 'physical', cooldown: 2000 },
      { name: 'Resonance Break', damage: 90, type: 'magical', cooldown: 5000 },
      { name: 'Echo Chamber', damage: 0, type: 'special', cooldown: 7000 }
    ],
    description: 'A giant that amplifies sound to devastating effect.'
  },
  {
    id: 'destiny-weaver',
    name: 'The Destiny Weaver',
    title: 'The Fate Spinner',
    health: 900,
    maxHealth: 900,
    phase: 1,
    maxPhases: 6,
    weaknesses: ['shadow', 'void'],
    attacks: [
      { name: 'Fate Thread', damage: 45, type: 'magical', cooldown: 2000 },
      { name: 'Destiny Break', damage: 120, type: 'special', cooldown: 8000 },
      { name: 'Timeline Shift', damage: 0, type: 'special', cooldown: 12000 }
    ],
    description: 'The final boss who weaves the threads of destiny itself.'
  }
];

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BossSystem = ({
  gameState,
  setGameState,
  chapterIndex,
  typedText,
  revolutionPoints,
  setRevolutionPoints,
  t
}: BossSystemProps) => {
  const [currentBoss, setCurrentBoss] = useState<Boss | null>(null);
  const [bossEncounter, setBossEncounter] = useState<BossEncounter | null>(null);
  const [bossHealth, setBossHealth] = useState(0);
  const [bossPhase, setBossPhase] = useState(1);
  const [bossAttackCooldown, setBossAttackCooldown] = useState(0);
  const [playerDamage, setPlayerDamage] = useState(0);
  const [bossDefeated, setBossDefeated] = useState(false);

  // Get boss for current chapter
  useEffect(() => {
    if (chapterIndex >= 5) { // Bosses start at chapter 6 (index 5)
      const bossIndex = (chapterIndex - 5) % BOSSES.length;
      const boss = { ...BOSSES[bossIndex] };
      boss.phase = 1;
      setCurrentBoss(boss);
      setBossHealth(boss.health);
      setBossPhase(1);
      setBossDefeated(false);
    }
  }, [chapterIndex]);

  // Boss attack logic
  useEffect(() => {
    if (!bossEncounter || !bossEncounter.isActive || !currentBoss) return;

    const attackInterval = setInterval(() => {
      if (bossAttackCooldown <= 0) {
        // Boss attacks
        const attack = currentBoss.attacks[Math.floor(Math.random() * currentBoss.attacks.length)];
        // Apply attack effect based on type
        if (attack.type === 'physical') {
          // Physical attacks reduce player's typing speed
        } else if (attack.type === 'magical') {
          // Magical attacks can scramble text
        } else if (attack.type === 'special') {
          // Special attacks have unique effects
        }
        setBossAttackCooldown(attack.cooldown);
      } else {
        setBossAttackCooldown(prev => prev - 100);
      }
    }, 100);

    return () => clearInterval(attackInterval);
  }, [bossEncounter, bossAttackCooldown, currentBoss]);

  // Check for boss phase transitions
  useEffect(() => {
    if (!currentBoss) return;
    
    const healthPercentage = (bossHealth / currentBoss.maxHealth) * 100;
    const newPhase = Math.floor((100 - healthPercentage) / (100 / currentBoss.maxPhases)) + 1;
    
    if (newPhase > bossPhase && newPhase <= currentBoss.maxPhases) {
      setBossPhase(newPhase);
      // Phase transition effects
    }
  }, [bossHealth, currentBoss, bossPhase]);

  // Check for boss defeat
  useEffect(() => {
    if (bossHealth <= 0 && currentBoss && !bossDefeated) {
      setBossDefeated(true);
      setRevolutionPoints(prev => prev + 500); // Boss reward
      // Victory effects
    }
  }, [bossHealth, currentBoss, bossDefeated, setRevolutionPoints]);

  if (gameState === 'boss' && currentBoss) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/95 p-10 border border-red-500/30 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl mx-auto w-full"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-display uppercase italic text-red-500">{currentBoss.name}</h2>
            <p className="text-lg text-white/60">{currentBoss.title}</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white">Phase {bossPhase}/{currentBoss.maxPhases}</div>
            <div className="text-sm text-white/60">{revolutionPoints} Points</div>
          </div>
        </div>

        {/* Boss Health Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">Boss Health</span>
            <span className="text-red-500">{bossHealth}/{currentBoss.maxHealth}</span>
          </div>
          <div className="w-full h-6 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-600 to-red-400"
              initial={{ width: '100%' }}
              animate={{ width: `${(bossHealth / currentBoss.maxHealth) * 100}%` }}
              transition={{ type: "spring", stiffness: 50 }}
            />
          </div>
        </div>

        {/* Boss Description */}
        <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/80 italic">{currentBoss.description}</p>
        </div>

        {/* Boss Attacks */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {currentBoss.attacks.map((attack, index) => (
            <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
              <div className="text-sm font-bold text-white">{attack.name}</div>
              <div className="text-xs text-white/60 mt-1">{attack.damage} damage</div>
              <div className={cn(
                "text-xs mt-2",
                attack.type === 'physical' && "text-orange-400",
                attack.type === 'magical' && "text-blue-400",
                attack.type === 'special' && "text-purple-400"
              )}>
                {attack.type}
              </div>
            </div>
          ))}
        </div>

        {/* Weaknesses */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white/80 mb-4">Weaknesses</h3>
          <div className="flex gap-4">
            {currentBoss.weaknesses.map((weakness, index) => (
              <div key={index} className="px-4 py-2 bg-white/10 rounded-lg text-white/80">
                {weakness}
              </div>
            ))}
          </div>
        </div>

        {/* Boss Defeat Message */}
        {bossDefeated && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-green-950/50 border border-green-500/30 rounded-2xl text-center"
          >
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-400 mb-4">BOSS DEFEATED!</h3>
            <p className="text-white/80 mb-6">+500 Revolution Points</p>
            <button 
              onClick={() => setGameState('narrative')}
              className="px-8 py-4 bg-green-500 text-white font-bold uppercase tracking-widest rounded-lg hover:bg-white hover:text-green-500 transition-all"
            >
              Continue Investigation
            </button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  return null;
};

export default BossSystem;