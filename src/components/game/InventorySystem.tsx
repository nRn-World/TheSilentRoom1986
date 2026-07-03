import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Package, ShoppingBag, Sword, Shield, 
  Gem, Zap, X, Check
} from 'lucide-react';

interface InventorySystemProps {
  gameState: 'narrative' | 'playing' | 'gameover' | 'victory' | 'upgrading' | 'inventory' | 'shop';
  setGameState: React.Dispatch<React.SetStateAction<'narrative' | 'playing' | 'gameover' | 'victory' | 'upgrading' | 'inventory' | 'shop'>>;
  revolutionPoints: number;
  setRevolutionPoints: React.Dispatch<React.SetStateAction<number>>;
  t: any;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable';
  description: string;
  effect: string;
  price: number;
  equipped: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const SHOP_ITEMS: Item[] = [
  {
    id: 'noir-coat',
    name: 'Noir Detective Coat',
    type: 'armor',
    description: 'Ökar alla statistik med 10%',
    effect: '+10% all stats',
    price: 500,
    equipped: false,
    rarity: 'rare'
  },
  {
    id: 'typewriter-amp',
    name: 'Typewriter Amplifier',
    type: 'weapon',
    description: 'Förbättrar typing-effektivitet med 20%',
    effect: '+20% typing power',
    price: 750,
    equipped: false,
    rarity: 'epic'
  },
  {
    id: 'shadow-cloak',
    name: 'Shadow Cloak',
    type: 'accessory',
    description: 'Gör osynlig i 3 sekunder vid fara',
    effect: 'Auto stealth',
    price: 1000,
    equipped: false,
    rarity: 'legendary'
  },
  {
    id: 'memory-crystal',
    name: 'Memory Crystal',
    type: 'consumable',
    description: 'Återställer 50% health',
    effect: 'Restore 50% HP',
    price: 200,
    equipped: false,
    rarity: 'common'
  },
  {
    id: 'void-gem',
    name: 'Void Gem',
    type: 'accessory',
    description: 'Kraftfull men riskabel effekt',
    effect: '+30% damage, -10% defense',
    price: 1200,
    equipped: false,
    rarity: 'legendary'
  },
  {
    id: 'echo-whistle',
    name: 'Echo Whistle',
    type: 'weapon',
    description: 'Förbättrar alla echo-manifestationer',
    effect: '+25% echo power',
    price: 600,
    equipped: false,
    rarity: 'rare'
  }
];

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const InventorySystem = ({
  gameState,
  setGameState,
  revolutionPoints,
  setRevolutionPoints,
  t
}: InventorySystemProps) => {
  const [inventory, setInventory] = useState<Item[]>([]);
  const [equippedItems, setEquippedItems] = useState<Record<string, Item>>({});

  const buyItem = (item: Item) => {
    if (revolutionPoints >= item.price && !inventory.find(i => i.id === item.id)) {
      setRevolutionPoints(prev => prev - item.price);
      setInventory(prev => [...prev, { ...item }]);
    }
  };

  const equipItem = (item: Item) => {
    if (item.type === 'consumable') {
      // Consumables are used immediately
      setInventory(prev => prev.filter(i => i.id !== item.id));
      return;
    }
    
    // Unequip current item of same type
    if (equippedItems[item.type]) {
      setInventory(prev => [...prev, equippedItems[item.type]]);
    }
    
    // Equip new item
    setEquippedItems(prev => ({ ...prev, [item.type]: item }));
    setInventory(prev => prev.filter(i => i.id !== item.id));
  };

  const unequipItem = (item: Item) => {
    setEquippedItems(prev => {
      const newEquipped = { ...prev };
      delete newEquipped[item.type];
      return newEquipped;
    });
    setInventory(prev => [...prev, { ...item, equipped: false }]);
  };

  if (gameState === 'inventory') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/95 p-10 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl mx-auto w-full"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-display uppercase italic text-[#f27d26]">{t.ui.inventory}</h2>
          <div className="text-xl font-bold">{t.ui.points}: {revolutionPoints}</div>
        </div>

        {/* Equipped Items */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-white/80">Equipped</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['weapon', 'armor', 'accessory'].map(type => {
              const item = equippedItems[type];
              return (
                <div key={type} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="text-xs uppercase text-white/50 mb-2">{type}</div>
                  {item ? (
                    <div>
                      <div className="font-bold text-[#f27d26]">{item.name}</div>
                      <div className="text-xs text-white/60 mt-1">{item.effect}</div>
                      <button 
                        onClick={() => unequipItem(item)}
                        className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30"
                      >
                        {t.ui.unequip}
                      </button>
                    </div>
                  ) : (
                    <div className="text-white/30 text-sm">Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inventory */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-white/80">Inventory ({inventory.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inventory.map(item => (
              <div key={item.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">{item.name}</div>
                  <div className="text-xs text-white/60 mt-1">{item.description}</div>
                </div>
                <button 
                  onClick={() => equipItem(item)}
                  className="px-4 py-2 bg-[#f27d26] text-black text-sm font-bold rounded hover:bg-white transition-colors"
                >
                  {item.type === 'consumable' ? 'Use' : t.ui.equip}
                </button>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setGameState('narrative')}
          className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-lg hover:bg-[#f27d26] transition-all"
        >
          {t.ui.return}
        </button>
      </motion.div>
    );
  }

  if (gameState === 'shop') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/95 p-10 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl mx-auto w-full"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-display uppercase italic text-[#f27d26]">{t.ui.shop}</h2>
          <div className="text-xl font-bold">{t.ui.points}: {revolutionPoints}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SHOP_ITEMS.map(item => (
            <div key={item.id} className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-bold text-white text-lg">{item.name}</div>
                  <div className="text-xs text-white/50 uppercase">{item.type}</div>
                </div>
                <div className={cn(
                  "px-2 py-1 text-xs rounded",
                  item.rarity === 'common' && "bg-gray-500/20 text-gray-400",
                  item.rarity === 'rare' && "bg-blue-500/20 text-blue-400",
                  item.rarity === 'epic' && "bg-purple-500/20 text-purple-400",
                  item.rarity === 'legendary' && "bg-yellow-500/20 text-yellow-400"
                )}>
                  {item.rarity}
                </div>
              </div>
              <p className="text-sm text-white/70 mb-4">{item.description}</p>
              <div className="text-sm text-[#f27d26] mb-4">{item.effect}</div>
              <button 
                onClick={() => buyItem(item)}
                disabled={revolutionPoints < item.price || inventory.some(i => i.id === item.id)}
                className="w-full py-2 bg-white/10 rounded font-bold text-sm hover:bg-[#f27d26] hover:text-black disabled:opacity-30 transition-all"
              >
                {inventory.some(i => i.id === item.id) ? 'Owned' : `${t.ui.buy} (${item.price})`}
              </button>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setGameState('narrative')}
          className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-lg hover:bg-[#f27d26] transition-all mt-8"
        >
          {t.ui.return}
        </button>
      </motion.div>
    );
  }

  return null;
};

export default InventorySystem;