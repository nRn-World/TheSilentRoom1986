import type { GameState } from './types';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Users, Wifi, WifiOff, Trophy, Send, X, Plus, LogIn
} from 'lucide-react';

type GameStateType = GameState;

interface MultiplayerSystemProps {
  gameState: GameStateType;
  setGameState: React.Dispatch<React.SetStateAction<GameStateType>>;
  t: any;
  lang: 'en' | 'sv' | 'tr';
}

interface Player {
  id: string;
  name: string;
  score: number;
  wpm: number;
  accuracy: number;
  isReady: boolean;
}

interface Room {
  id: string;
  name: string;
  host: string;
  players: Player[];
  maxPlayers: number;
  mode: 'coop' | 'versus' | 'race';
  status: 'waiting' | 'playing' | 'finished';
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LEADERBOARD_SEED: Player[] = [
  { id: 'lb1', name: 'TypingMaster', score: 5000, wpm: 120, accuracy: 99, isReady: true },
  { id: 'lb2', name: 'KeyWizard', score: 4500, wpm: 115, accuracy: 98, isReady: true },
  { id: 'lb3', name: 'SpeedDemon', score: 4000, wpm: 110, accuracy: 97, isReady: true },
  { id: 'lb4', name: 'NoirDetective', score: 3500, wpm: 105, accuracy: 96, isReady: true },
  { id: 'lb5', name: 'InkMaster', score: 3000, wpm: 98, accuracy: 95, isReady: true },
];

const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-1',
    name: 'Detective Lounge',
    host: 'Sherlock',
    players: [
      { id: '1', name: 'Sherlock', score: 1500, wpm: 85, accuracy: 98, isReady: true },
      { id: '2', name: 'Watson', score: 1200, wpm: 72, accuracy: 95, isReady: false },
    ],
    maxPlayers: 4,
    mode: 'coop',
    status: 'waiting',
  },
  {
    id: 'room-2',
    name: 'Noir Arena',
    host: 'Marlowe',
    players: [{ id: '3', name: 'Marlowe', score: 1800, wpm: 92, accuracy: 99, isReady: true }],
    maxPlayers: 2,
    mode: 'versus',
    status: 'waiting',
  },
  {
    id: 'room-3',
    name: 'Speed Race',
    host: 'Poirot',
    players: [
      { id: '4', name: 'Poirot', score: 2000, wpm: 90, accuracy: 97, isReady: true },
      { id: '5', name: 'Hastings', score: 1600, wpm: 78, accuracy: 94, isReady: true },
      { id: '6', name: 'Lemon', score: 1400, wpm: 74, accuracy: 93, isReady: false },
    ],
    maxPlayers: 4,
    mode: 'race',
    status: 'waiting',
  },
];

const MultiplayerSystem = ({
  gameState,
  setGameState,
  t,
  lang,
}: MultiplayerSystemProps) => {
  const [playerName, setPlayerName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<'coop' | 'versus' | 'race'>('coop');
  const [leaderboard] = useState<Player[]>(LEADERBOARD_SEED);
  const [activeTab, setActiveTab] = useState<'rooms' | 'leaderboard'>('rooms');
  const [isReady, setIsReady] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const lbl = {
    title: lang === 'sv' ? 'Flerspelarläge' : lang === 'tr' ? 'Çoklu Oyuncu' : 'Multiplayer',
    enterName: lang === 'sv' ? 'Ange ditt detektivnamn' : lang === 'tr' ? 'Dedektif adını gir' : 'Enter your detective name',
    namePlaceholder: lang === 'sv' ? 'Detektivnamn...' : lang === 'tr' ? 'Dedektif adı...' : 'Detective name...',
    connect: lang === 'sv' ? 'Anslut' : lang === 'tr' ? 'Bağlan' : 'Connect',
    rooms: lang === 'sv' ? 'Tillgängliga rum' : lang === 'tr' ? 'Mevcut Odalar' : 'Available Rooms',
    createRoom: lang === 'sv' ? 'Skapa rum' : lang === 'tr' ? 'Oda Oluştur' : 'Create Room',
    join: lang === 'sv' ? 'Gå med' : lang === 'tr' ? 'Katıl' : 'Join',
    full: lang === 'sv' ? 'Fullt' : lang === 'tr' ? 'Dolu' : 'Full',
    leaderboard: lang === 'sv' ? 'Topplista' : lang === 'tr' ? 'Liderlik Tablosu' : 'Leaderboard',
    chat: lang === 'sv' ? 'Chatt' : lang === 'tr' ? 'Sohbet' : 'Chat',
    chatPlaceholder: lang === 'sv' ? 'Skriv meddelande...' : lang === 'tr' ? 'Mesaj yaz...' : 'Type a message...',
    leave: lang === 'sv' ? 'Lämna rum' : lang === 'tr' ? 'Odadan Ayrıl' : 'Leave Room',
    startGame: lang === 'sv' ? 'Starta spel' : lang === 'tr' ? 'Oyunu Başlat' : 'Start Game',
    ready: lang === 'sv' ? 'Redo' : lang === 'tr' ? 'Hazır' : 'Ready',
    notReady: lang === 'sv' ? 'Inte redo' : lang === 'tr' ? 'Hazır Değil' : 'Not Ready',
    markReady: lang === 'sv' ? 'Markera redo' : lang === 'tr' ? 'Hazır İşaretle' : 'Mark Ready',
    connected: lang === 'sv' ? 'Ansluten' : lang === 'tr' ? 'Bağlı' : 'Connected',
    disconnected: lang === 'sv' ? 'Frånkopplad' : lang === 'tr' ? 'Bağlantı Kesildi' : 'Disconnected',
    mode: lang === 'sv' ? 'Läge' : lang === 'tr' ? 'Mod' : 'Mode',
    players: lang === 'sv' ? 'Spelare' : lang === 'tr' ? 'Oyuncular' : 'Players',
    points: lang === 'sv' ? 'Poäng' : lang === 'tr' ? 'Puan' : 'Points',
    host: lang === 'sv' ? 'Värd' : lang === 'tr' ? 'Ev Sahibi' : 'Host',
    simulatedNote: lang === 'sv' ? '⚠ Simulerat flerspelarläge – inga riktiga servrar krävs' : lang === 'tr' ? '⚠ Simüle edilmiş çok oyunculu – gerçek sunucu gerekmez' : '⚠ Simulated multiplayer – no real server required',
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Bot messages in chat
  useEffect(() => {
    if (!currentRoom) return;
    const bots = ['Sherlock', 'Watson', 'Marlowe'];
    const botMsgs = [
      'Ready when you are!',
      'Let\'s solve this case.',
      'The ink never lies...',
      'Fingers on the keys!',
      'Good luck detective!',
    ];
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        const bot = bots[Math.floor(Math.random() * bots.length)];
        const msg = botMsgs[Math.floor(Math.random() * botMsgs.length)];
        setChatMessages(prev => [...prev.slice(-30), {
          id: Date.now().toString(),
          sender: bot,
          content: msg,
          timestamp: Date.now(),
        }]);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [currentRoom]);

  const handleConnect = () => {
    if (!nameInput.trim()) return;
    setPlayerName(nameInput.trim());
    setIsConnected(true);
  };

  const createRoom = () => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: `${playerName}'s Room`,
      host: playerName,
      players: [{ id: Date.now().toString(), name: playerName, score: 0, wpm: 0, accuracy: 100, isReady: true }],
      maxPlayers: 4,
      mode: selectedMode,
      status: 'waiting',
    };
    setRooms(prev => [newRoom, ...prev]);
    setCurrentRoom(newRoom);
    setIsReady(true);
    setChatMessages([{
      id: 'sys-1',
      sender: '🔔 System',
      content: `${playerName} created the room.`,
      timestamp: Date.now(),
    }]);
  };

  const joinRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || room.players.length >= room.maxPlayers) return;
    const me: Player = { id: Date.now().toString(), name: playerName, score: 0, wpm: 0, accuracy: 100, isReady: false };
    const updated = { ...room, players: [...room.players, me] };
    setRooms(prev => prev.map(r => r.id === roomId ? updated : r));
    setCurrentRoom(updated);
    setIsReady(false);
    setChatMessages([{
      id: 'sys-2',
      sender: '🔔 System',
      content: `${playerName} joined the room.`,
      timestamp: Date.now(),
    }]);
  };

  const leaveRoom = () => {
    if (!currentRoom) return;
    const updated = { ...currentRoom, players: currentRoom.players.filter(p => p.name !== playerName) };
    setRooms(prev => prev.map(r => r.id === currentRoom.id ? updated : r));
    setCurrentRoom(null);
    setIsReady(false);
    setChatMessages([]);
  };

  const sendChat = () => {
    if (!chatInput.trim() || !currentRoom) return;
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: playerName,
      content: chatInput.trim(),
      timestamp: Date.now(),
    }]);
    setChatInput('');
  };

  const toggleReady = () => {
    if (!currentRoom) return;
    const newReady = !isReady;
    setIsReady(newReady);
    const updated = {
      ...currentRoom,
      players: currentRoom.players.map(p => p.name === playerName ? { ...p, isReady: newReady } : p),
    };
    setCurrentRoom(updated);
    setRooms(prev => prev.map(r => r.id === currentRoom.id ? updated : r));
  };

  const modeColor = (mode: string) => {
    if (mode === 'coop') return 'bg-green-500/20 text-green-400';
    if (mode === 'versus') return 'bg-red-500/20 text-red-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  if (gameState !== 'multiplayer') return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/95 p-6 border border-blue-500/30 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl mx-auto w-full"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-display uppercase italic text-blue-400">{lbl.title}</h2>
          <p className="text-xs text-white/30 mt-1">{lbl.simulatedNote}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn('flex items-center gap-2 text-sm', isConnected ? 'text-green-400' : 'text-red-400')}>
            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isConnected ? lbl.connected : lbl.disconnected}
          </div>
          <button
            onClick={() => setGameState('narrative')}
            className="px-3 py-2 bg-white/10 rounded font-bold text-xs uppercase hover:bg-white/20 transition-all"
          >
            {t.ui.return}
          </button>
        </div>
      </div>

      {/* Connect Screen */}
      {!isConnected ? (
        <div className="max-w-sm mx-auto text-center py-12">
          <Users className="w-16 h-16 text-blue-400 mx-auto mb-6 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-6">{lbl.enterName}</h3>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            placeholder={lbl.namePlaceholder}
            maxLength={20}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500 mb-4"
          />
          <button
            onClick={handleConnect}
            disabled={!nameInput.trim()}
            className="w-full px-8 py-3 bg-blue-500 text-white font-bold uppercase tracking-widest rounded-lg hover:bg-blue-400 transition-all disabled:opacity-30"
          >
            {lbl.connect}
          </button>
        </div>
      ) : !currentRoom ? (
        /* Room Browser */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {(['rooms', 'leaderboard'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-lg transition-all',
                    activeTab === tab ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  )}
                >
                  {tab === 'rooms' ? lbl.rooms : lbl.leaderboard}
                </button>
              ))}
            </div>

            {activeTab === 'rooms' ? (
              <>
                {/* Create Room */}
                <div className="flex gap-3 mb-4">
                  <select
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value as any)}
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="coop" className="bg-black">Co-op</option>
                    <option value="versus" className="bg-black">Versus</option>
                    <option value="race" className="bg-black">Race</option>
                  </select>
                  <button
                    onClick={createRoom}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-400 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    {lbl.createRoom}
                  </button>
                </div>

                {/* Room list */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {rooms.map(room => (
                    <div key={room.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/30 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-white">{room.name}</h4>
                          <p className="text-xs text-white/50">{lbl.host}: {room.host}</p>
                        </div>
                        <span className={cn('px-2 py-0.5 text-xs rounded font-bold uppercase', modeColor(room.mode))}>
                          {room.mode}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-white/50">
                          {room.players.length}/{room.maxPlayers} {lbl.players}
                        </div>
                        <button
                          onClick={() => joinRoom(room.id)}
                          disabled={room.players.length >= room.maxPlayers}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <LogIn className="w-3 h-3" />
                          {room.players.length >= room.maxPlayers ? lbl.full : lbl.join}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Leaderboard */
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {leaderboard.map((player, i) => (
                  <div key={player.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
                      i === 0 && 'bg-yellow-500 text-black',
                      i === 1 && 'bg-gray-400 text-black',
                      i === 2 && 'bg-orange-600 text-black',
                      i > 2 && 'bg-white/10 text-white/60'
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white text-sm">{player.name}</div>
                      <div className="text-xs text-white/50">{player.wpm} WPM · {player.accuracy}%</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-400">{player.score.toLocaleString()}</div>
                      <div className="text-xs text-white/40">{lbl.points}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side info */}
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-xs text-white/50 uppercase mb-1">{lang === 'sv' ? 'Inloggad som' : lang === 'tr' ? 'Giriş yapıldı' : 'Signed in as'}</div>
              <div className="font-bold text-white">{playerName}</div>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-white/60 leading-relaxed">
              {lang === 'sv'
                ? 'Skapa ett rum eller gå med i ett befintligt för att spela med andra detektiver.'
                : lang === 'tr'
                ? 'Diğer dedektiflerle oynamak için bir oda oluşturun veya mevcut bir odaya katılın.'
                : 'Create a room or join an existing one to play with other detectives.'}
            </div>
          </div>
        </div>
      ) : (
        /* In Room */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{currentRoom.name}</h3>
                <div className="flex gap-3 text-xs text-white/50 mt-1">
                  <span>{lbl.host}: {currentRoom.host}</span>
                  <span className={cn('px-2 py-0.5 rounded font-bold uppercase', modeColor(currentRoom.mode))}>{currentRoom.mode}</span>
                </div>
              </div>
              <button
                onClick={leaveRoom}
                className="flex items-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 text-sm font-bold rounded-lg hover:bg-red-500/30 transition-all"
              >
                <X className="w-4 h-4" /> {lbl.leave}
              </button>
            </div>

            {/* Players */}
            <div className="space-y-2 mb-4">
              {currentRoom.players.map(player => (
                <div key={player.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white text-sm">{player.name} {player.name === currentRoom.host && '👑'}</div>
                    <div className="text-xs text-white/40">{player.wpm} WPM</div>
                  </div>
                  <span className={cn(
                    'px-2 py-1 text-xs rounded font-bold',
                    player.isReady ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  )}>
                    {player.isReady ? lbl.ready : lbl.notReady}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={toggleReady}
                className={cn(
                  'flex-1 py-2 font-bold text-sm uppercase tracking-widest rounded-lg transition-all',
                  isReady ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                )}
              >
                {isReady ? lbl.notReady : lbl.markReady}
              </button>
              {currentRoom.host === playerName && (
                <button
                  onClick={() => {
                    setChatMessages(prev => [...prev, { id: 'start', sender: '🔔 System', content: 'Game starting in 3 seconds... (simulated)', timestamp: Date.now() }]);
                  }}
                  className="flex-1 py-2 bg-blue-500 text-white font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-blue-400 transition-all"
                >
                  {lbl.startGame}
                </button>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-white/60 uppercase mb-2">{lbl.chat}</h3>
            <div className="flex-1 h-52 bg-white/5 border border-white/10 rounded-xl p-3 overflow-y-auto space-y-2 mb-2">
              {chatMessages.length === 0 && (
                <div className="text-xs text-white/30 text-center pt-4">
                  {lang === 'sv' ? 'Inget meddelande ännu...' : lang === 'tr' ? 'Henüz mesaj yok...' : 'No messages yet...'}
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className="text-xs">
                  <span className={cn('font-bold', msg.sender === playerName ? 'text-[#f27d26]' : msg.sender.startsWith('🔔') ? 'text-white/40' : 'text-blue-400')}>
                    {msg.sender}:
                  </span>
                  <span className="text-white/80 ml-1">{msg.content}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder={lbl.chatPlaceholder}
                maxLength={100}
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={sendChat}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MultiplayerSystem;