// src/components/GameHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, VolumeX, LogOut, Copy, Check, 
  Sparkles, Crown, ShieldAlert, AlertCircle, Play
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import PlayerAvatar from './PlayerAvatar';

// Renderizar cara de dado con puntos reales
function DiceFace({ value }) {
  const pips = {
    1: ['col-start-2 row-start-2'],
    2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
    3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
    4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    5: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    6: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3']
  };

  const currentPips = pips[value] || pips[1];

  return (
    <div className="dice-cube-visual grid-cols-3 grid-rows-3 select-none">
      {currentPips.map((pos, idx) => (
        <div key={idx} className={`pip ${pos}`} />
      ))}
    </div>
  );
}

export default function GameHeader({ gameState, currentUser, onLeaveRoom }) {
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const prevTurnRef = useRef(false);

  const activePlayer = gameState.players.find(p => p.id === gameState.activePlayerId) || 
                       gameState.players[gameState.currentTurnIndex];
  const isMyTurn = gameState.activePlayerId === currentUser?.id;
  const isSetup = gameState.phase === 'setup_round_1' || gameState.phase === 'setup_round_2';
  const isSpecialBuild = gameState.phase === 'special_building';

  // Sonido de alerta cuando empieza tu turno
  useEffect(() => {
    if (isMyTurn && !prevTurnRef.current) {
      sounds.playTurnAlert();
    }
    prevTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  const handleToggleSound = () => {
    const isM = sounds.toggleMute();
    setMuted(isM);
  };

  const handleCopyCode = () => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const url = `${origin}${path}?room=${gameState.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTurnMessage = () => {
    if (isSetup) {
      if (gameState.subphase === 'settlement') {
        return isMyTurn
          ? '📍 Haz clic en un círculo dorado del mapa para fundar tu Poblado inicial'
          : `Esperando a que ${activePlayer?.username} funde su poblado inicial...`;
      }
      if (gameState.subphase === 'road') {
        return isMyTurn
          ? '🛣️ Haz clic en un camino dorado adyacente para trazar tu Carretera'
          : `Esperando a que ${activePlayer?.username} coloque su carretera...`;
      }
    }

    if (isSpecialBuild) {
      return isMyTurn
        ? '🔨 Fase Especial (5-6P): Puedes construir libremente o pasar'
        : `Fase Especial de Construcción (${activePlayer?.username})`;
    }

    if (gameState.subphase === 'roll') {
      return isMyTurn
        ? '🎲 ¡Tira los dados! Presiona el botón para cosechar recursos en la isla'
        : `Turno de ${activePlayer?.username}: Tirando dados...`;
    }

    if (gameState.subphase === 'discard') {
      return '⚠️ ¡Salió un 7! Quienes tengan más de 7 cartas deben descartar la mitad';
    }

    if (gameState.subphase === 'robber') {
      return isMyTurn
        ? '🥷 Mueve al Ladrón a un hexágono para bloquear su producción'
        : `${activePlayer?.username} está reubicando al Ladrón...`;
    }

    if (gameState.subphase === 'steal') {
      return isMyTurn
        ? '🥷 Elige a qué colono adyacente deseas robarle un recurso al azar'
        : `${activePlayer?.username} está eligiendo su víctima...`;
    }

    return isMyTurn
      ? '✨ Fase Principal: Construye carreteras, poblados, ciudades o comercia'
      : `Turno de ${activePlayer?.username}: Tomando decisiones...`;
  };

  return (
    <header className="w-full glass-panel px-3 sm:px-5 py-2 flex items-center justify-between gap-2 sm:gap-4 shadow-xl border-amber-500/20 shrink-0 select-none">
      {/* 1. Lado Izquierdo: Título de Isla y Código de Sala */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 font-cinzel font-black text-amber-400 text-sm tracking-wide">
          <span>{gameState.title || 'Isla de Catán'}</span>
        </div>

        <button
          onClick={handleCopyCode}
          title="Copiar código de sala"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-amber-400/60 text-xs text-amber-300 font-mono font-bold transition shadow-inner"
        >
          <span>{gameState.roomCode}</span>
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="opacity-60" />}
        </button>

        <span className="hidden md:inline-block text-[11px] font-bold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-lg border border-zinc-700">
          Meta: {gameState.targetPoints} PV
        </span>
      </div>

      {/* 2. Centro: Indicador Prominente de Turno */}
      <div className="flex-1 max-w-xl mx-auto flex items-center justify-center">
        <div
          className={`w-full py-1.5 px-3 rounded-2xl flex items-center justify-center gap-2 sm:gap-3 transition-all ${
            isMyTurn
              ? 'bg-gradient-to-r from-emerald-950/90 via-zinc-950 to-emerald-950/90 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
              : 'bg-zinc-900/80 border border-zinc-800'
          }`}
        >
          {/* Avatar del Jugador Activo con icono vectorial */}
          <PlayerAvatar
            isBot={activePlayer?.isBot}
            isHost={activePlayer?.isHost}
            color={activePlayer?.color}
            size={28}
          />

          <div className="text-center truncate">
            <div className="flex items-center justify-center gap-2">
              <span
                className="font-cinzel font-black text-xs sm:text-sm tracking-wide"
                style={{ color: activePlayer?.color || '#fbbf24' }}
              >
                {activePlayer?.username}
              </span>

              {isMyTurn ? (
                <span className="bg-gradient-to-r from-emerald-400 to-amber-300 text-zinc-950 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase shadow flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-ping" />
                  ¡Es tu turno!
                </span>
              ) : (
                <span className="text-[10px] text-zinc-400 font-medium">
                  (En juego)
                </span>
              )}
            </div>

            <p className="text-[11px] text-zinc-200 font-medium truncate hidden xs:block">
              {getTurnMessage()}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Lado Derecho: Dados 3D, Sonido y Salir */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dados y Resultado */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 px-2.5 py-1 rounded-xl border border-zinc-700/80 shadow-inner">
          <DiceFace value={gameState.dice[0]} />
          <DiceFace value={gameState.dice[1]} />
          <div className="text-xs font-black font-mono text-amber-400 ml-1">
            = {gameState.lastRoll}
          </div>
        </div>

        {/* Control de Audio */}
        <button
          onClick={handleToggleSound}
          className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          title={muted ? 'Activar sonido' : 'Silenciar'}
        >
          {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        {/* Salir de la partida */}
        <button
          onClick={onLeaveRoom}
          className="p-1.5 text-zinc-400 hover:text-red-400 rounded-xl hover:bg-red-950/40 transition"
          title="Abandonar partida"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
