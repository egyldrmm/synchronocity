
import React, { useState, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { StoryModal } from './components/StoryModal';
import { GameState, GameStats, StoryLog } from './types';
import { INITIAL_STATS, MAX_LEVEL } from './constants';
import { generateStoryLog } from './services/geminiService';
import { Heart, Zap, Gamepad2, Users, Flame, Server, Target, Info } from 'lucide-react';
import { sound } from './utils/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [storyLog, setStoryLog] = useState<StoryLog | null>(null);
  const [loadingLog, setLoadingLog] = useState(false);
  const [tutorialTimer, setTutorialTimer] = useState(5);
  const [retryCount, setRetryCount] = useState(0);

  // --- Handlers ---

  const startTutorial = () => {
    sound.startMusic(); // START MUSIC
    setStats(INITIAL_STATS);
    setGameState(GameState.TUTORIAL);
    setTutorialTimer(5);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === GameState.TUTORIAL) {
        interval = setInterval(() => {
            setTutorialTimer(prev => {
                if (prev <= 1) {
                    setGameState(GameState.PLAYING);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const handleGameOver = useCallback(async () => {
    sound.stopMusic(); // STOP MUSIC
    setGameState(current => {
       if (current === GameState.GAME_OVER) return current;
       return GameState.GAME_OVER;
    });
    
    setLoadingLog(true);
    const log = await generateStoryLog(stats.level, 0, stats.score, 'gameOver');
    setStoryLog(log);
    setLoadingLog(false);
  }, [stats.level, stats.score]);

  const handleLevelComplete = useCallback(async () => {
    setGameState(GameState.LEVEL_TRANSITION);
    setLoadingLog(true);
    
    // Check if next level is a boss level
    const nextLevel = stats.level + 1;
    const isBossNext = nextLevel % 5 === 0;

    const log = await generateStoryLog(
      stats.level, 
      stats.integrity, 
      stats.score, 
      isBossNext ? 'boss_intro' : 'complete'
    );
    setStoryLog(log);
    setLoadingLog(false);
  }, [stats.level, stats.integrity, stats.score]);

  const handleVictory = useCallback(async () => {
    sound.stopMusic(); // STOP MUSIC ON VICTORY (Or maybe change to victory theme later)
    setGameState(GameState.VICTORY);
    setLoadingLog(true);
    const log = await generateStoryLog(stats.level, stats.integrity, stats.score, 'victory');
    setStoryLog(log);
    setLoadingLog(false);
  }, [stats.level, stats.integrity, stats.score]);

  const nextLevel = () => {
    setStats(prev => ({
      ...prev,
      level: prev.level + 1,
      integrity: prev.maxIntegrity // Full Restore
    }));
    setGameState(GameState.PLAYING);
  };

  const handleRestart = () => {
      sound.startMusic(); // RESTART MUSIC
      if (gameState === GameState.VICTORY) {
          // Victory = Full Restart
          setStats(INITIAL_STATS);
      } else {
          // Game Over = Retry Current Level
          // Keep score and level, just restore health and give full charge for a fun comeback
          setStats(prev => ({
              ...prev,
              integrity: prev.maxIntegrity,
              resonanceCharge: 100, 
              combo: 0
          }));
      }
      setRetryCount(c => c + 1); // Force GameCanvas to remount and reset entities
      setGameState(GameState.PLAYING);
  }

  const updateScore = useCallback((points: number) => {
    setStats(prev => ({ ...prev, score: Math.floor(prev.score + points) }));
  }, []);

  const updateCombo = useCallback((combo: number) => {
    setStats(prev => ({ ...prev, combo, maxCombo: Math.max(prev.maxCombo, combo) }));
  }, []);

  const updateResonance = useCallback((amount: number) => {
    setStats(prev => ({ ...prev, resonanceCharge: Math.min(100, prev.resonanceCharge + amount) }));
  }, []);

  const useResonance = useCallback(() => {
    setStats(prev => ({ ...prev, resonanceCharge: 0 }));
  }, []);

  const takeDamage = useCallback((amount: number) => {
    setStats(prev => {
      // Heal if amount is negative, but cap at maxIntegrity
      let newIntegrity = prev.integrity - amount;
      if (amount < 0) newIntegrity = Math.min(prev.maxIntegrity, newIntegrity);
      
      if (newIntegrity <= 0) {
        // Defer to avoid render loop
        if (gameState !== GameState.GAME_OVER && gameState !== GameState.VICTORY) {
             setTimeout(() => handleGameOver(), 0);
        }
        return { ...prev, integrity: 0 };
      }
      return { ...prev, integrity: newIntegrity };
    });
  }, [handleGameOver, gameState]);

  // --- Renders ---

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-display select-none cursor-default">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none" />

      {/* Header / HUD */}
      <header className="relative z-10 w-full max-w-7xl mx-auto p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
            <Zap className="text-yellow-400 fill-yellow-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-red-400">
              SYNCHRONICITY
            </h1>
            <p className="text-xs text-slate-500 tracking-[0.3em] font-mono">SİNİRSEL BAĞ AKTİF</p>
          </div>
        </div>
        
        {gameState !== GameState.MENU && gameState !== GameState.TUTORIAL && (
          <div className="flex gap-12 items-center">
            
            {/* Combo Meter */}
            <div className={`flex flex-col items-end transition-opacity duration-300 ${stats.combo > 1 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-xs text-yellow-500 font-mono tracking-widest mb-1 animate-pulse">KOMBO</span>
              <span className="text-3xl font-black text-yellow-400 italic">x{stats.combo}</span>
            </div>

            {/* Level Progress */}
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 font-mono tracking-widest mb-1 flex items-center gap-1">
                 <Target className="w-3 h-3" /> ÇEKİRDEĞE MESAFE
              </span>
              <div className="text-white font-bold text-xl">
                Sv. {stats.level} <span className="text-slate-600">/ {MAX_LEVEL}</span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 font-mono tracking-widest mb-1">BÜTÜNLÜK</span>
              <div className="flex items-center gap-2">
                <div className="w-48 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
                  <div 
                    className={`h-full transition-all duration-300 ${stats.integrity < 30 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}
                    style={{ width: `${stats.integrity}%` }}
                  />
                </div>
                <Heart className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 font-mono tracking-widest mb-1">REZONANS</span>
              <div className="flex items-center gap-2">
                <div className="w-48 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
                  <div 
                    className={`h-full transition-all duration-300 ${stats.resonanceCharge >= 100 ? 'bg-white shadow-[0_0_10px_white]' : 'bg-purple-600'}`}
                    style={{ width: `${stats.resonanceCharge}%` }}
                  />
                </div>
                <Flame className={`w-4 h-4 ${stats.resonanceCharge >= 100 ? 'text-white animate-bounce' : 'text-purple-600'}`} />
              </div>
            </div>

          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center relative p-4">
        
        {/* TUTORIAL OVERLAY */}
        {gameState === GameState.TUTORIAL && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="max-w-4xl w-full p-12 bg-slate-900 border border-purple-500/30 rounded-3xl shadow-[0_0_100px_rgba(168,85,247,0.2)] text-center relative overflow-hidden">
                    {/* Animated Background Scanline */}
                    <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_0%,rgba(168,85,247,0.4)_50%,transparent_100%)] bg-[length:100%_4px]" />
                    
                    <h2 className="text-4xl font-black text-white mb-12 tracking-wider">SİSTEM BAŞLATILIYOR</h2>
                    
                    <div className="grid grid-cols-3 gap-8 mb-12">
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">1. BİRLİKTE HAREKET ET</h3>
                            <p className="text-sm text-gray-400">KIRMIZI (WASD) ve MAVİ (OKLAR)'yi kontrol et. Bağlı kal.</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                                <Flame className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">2. TOPLA & ŞARJ ET</h3>
                            <p className="text-sm text-gray-400">REZONANS EMMEK için düşmanları yok et.</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                             <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                <Zap className="w-8 h-8 text-yellow-400" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">3. PATLAT</h3>
                            <p className="text-sm text-gray-400">Bar dolduğunda, her şeyi yok etmek için <span className="text-yellow-300 font-bold">ÇEKİRDEKLERİ BİRLEŞTİR!</span></p>
                        </div>
                    </div>

                    <div className="text-6xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
                        {tutorialTimer}
                    </div>
                    <p className="text-sm text-gray-500 font-mono mt-2">OTOMATİK BAŞLATMA DEVREDE</p>
                    
                    <button 
                        onClick={() => setGameState(GameState.PLAYING)}
                        className="mt-8 text-sm text-white/50 hover:text-white underline underline-offset-4"
                    >
                        GEÇ
                    </button>
                </div>
            </div>
        )}

        {gameState === GameState.MENU && (
          <div className="text-center space-y-12 max-w-4xl relative z-20 animate-in fade-in zoom-in duration-700">
            <div className="space-y-6">
              <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tighter drop-shadow-2xl">
                SYNCHRONICITY
              </h1>
              <p className="text-2xl text-purple-400 font-light tracking-[0.5em] uppercase border-y border-white/5 py-4 inline-block">
                Eşli Arcade Hayatta Kalma
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 text-left bg-slate-900/50 p-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
              <div className="space-y-4 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4 text-red-400">
                  <span className="w-12 h-12 flex items-center justify-center bg-red-500/10 rounded-lg border border-red-500/20 font-bold text-xl group-hover:scale-110 transition-transform">W</span>
                  <div>
                    <span className="font-bold block text-lg">KIRMIZI ÇEKİRDEK</span>
                    <span className="text-xs text-red-400/50 font-mono">ALFA BİRİMİ</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Alfa Çekirdeğini yönet. WASD ile hareket et. Sen çapasın.
                </p>
              </div>

              <div className="space-y-4 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4 text-blue-400">
                  <span className="w-12 h-12 flex items-center justify-center bg-blue-500/10 rounded-lg border border-blue-500/20 font-bold text-xl group-hover:scale-110 transition-transform">↑</span>
                  <div>
                    <span className="font-bold block text-lg">MAVİ ÇEKİRDEK</span>
                    <span className="text-xs text-blue-400/50 font-mono">OMEGA BİRİMİ</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Omega Çekirdeğini yönet. OKLAR ile hareket et. Bağı güçlü tut.
                </p>
              </div>
              
              <div className="col-span-2 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                 <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20 flex items-center gap-4">
                    <Users className="w-8 h-8 text-purple-400" />
                    <div>
                      <h3 className="font-bold text-purple-200">BİRLİKTEN KUVVET DOĞAR</h3>
                      <p className="text-xs text-purple-400/70">Aranızdaki ışınla düşmanları biçin.</p>
                    </div>
                 </div>
                 <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20 flex items-center gap-4">
                    <Zap className="w-8 h-8 text-yellow-400" />
                    <div>
                      <h3 className="font-bold text-yellow-200">AŞIRI YÜK</h3>
                      <p className="text-xs text-yellow-400/70">Işını aşırı yüklemek için yakın durun (3x Hasar).</p>
                    </div>
                 </div>
              </div>
            </div>

            <button 
              onClick={startTutorial}
              className="group relative px-16 py-6 bg-white text-black font-black text-2xl tracking-widest hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] rounded-full overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-4">
                <Gamepad2 className="w-8 h-8" /> 
                BAŞLAT
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        )}

        {(gameState === GameState.PLAYING || gameState === GameState.LEVEL_TRANSITION || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
          <GameCanvas 
            key={`${stats.level}-${retryCount}`}
            onScoreUpdate={updateScore}
            onDamage={takeDamage}
            onResonanceUse={useResonance}
            onResonanceCharge={updateResonance}
            onGameOver={handleGameOver}
            onLevelComplete={handleLevelComplete}
            onVictory={handleVictory}
            onComboUpdate={updateCombo}
            level={stats.level}
            resonanceCharge={stats.resonanceCharge}
            isPaused={gameState !== GameState.PLAYING}
          />
        )}

        {/* Modals */}
        {(gameState === GameState.LEVEL_TRANSITION || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
          <StoryModal 
            log={storyLog} 
            isLoading={loadingLog} 
            onNext={gameState === GameState.GAME_OVER || gameState === GameState.VICTORY ? handleRestart : nextLevel} 
            isGameOver={gameState === GameState.GAME_OVER}
          />
        )}

      </main>

      <footer className="text-center p-6 text-slate-700 text-xs font-mono border-t border-white/5">
        <span className="opacity-50">GEMINI NARRATIVE ENGINE v2.5 // SYNCHRONICITY PROTOCOL // CONTEST BUILD</span>
      </footer>
    </div>
  );
}
