// src/components/DiceRollOverlay.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Flame, ShieldAlert, Sparkles, Wheat, Dices, X } from 'lucide-react';
import PlayerAvatar from './PlayerAvatar';
import { sounds } from '../utils/soundEffects';

// Cara de dado 3D grande con puntos grabados
function BigDiceCube({ value, isRolling, animationClass, restTilt = '0deg' }) {
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
    <div
      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-2 sm:p-2.5 grid grid-cols-3 grid-rows-3 select-none transition-all duration-300 ${
        isRolling ? animationClass : ''
      }`}
      style={{
        transform: isRolling ? undefined : `rotate(${restTilt}) scale(1.02)`,
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 40%, #cbd5e1 100%)',
        boxShadow: `
          0 18px 38px rgba(0, 0, 0, 0.7),
          0 6px 14px rgba(0, 0, 0, 0.45),
          inset 0 2px 4px rgba(255, 255, 255, 0.95),
          inset -2px -2px 6px rgba(0, 0, 0, 0.15)
        `,
        border: '2px solid #94a3b8'
      }}
    >
      {currentPips.map((pos, idx) => (
        <div
          key={idx}
          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full ${pos} self-center justify-self-center`}
          style={{
            background: 'radial-gradient(circle at 30% 30%, #334155, #0f172a)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8), 0 1px 1px rgba(255,255,255,0.4)'
          }}
        />
      ))}
    </div>
  );
}

export default function DiceRollOverlay({ gameState }) {
  const [visible, setVisible] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState([1, 1]);
  const [roller, setRoller] = useState(null);

  const lastRollCountRef = useRef(0);
  const rollIntervalRef = useRef(null);
  const dismissTimerRef = useRef(null);

  useEffect(() => {
    const currentRollCount = gameState?.rollCount || 0;
    if (currentRollCount > 0 && currentRollCount !== lastRollCountRef.current) {
      lastRollCountRef.current = currentRollCount;

      const targetDice = gameState.dice || [1, 1];
      const targetRoller = gameState.lastRoller || { username: 'Un colono' };

      setRoller(targetRoller);
      setVisible(true);
      setIsRolling(true);
      sounds.playDiceRoll();

      // Animación de rotación rápida de caras durante 700ms
      let counter = 0;
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = setInterval(() => {
        setDisplayDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ]);
        counter++;
        if (counter > 9) {
          clearInterval(rollIntervalRef.current);
          setDisplayDice(targetDice);
          setIsRolling(false);
        }
      }, 70);

      // Cerrar automáticamente después de 2.5s
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, 2500);
    }
  }, [gameState?.rollCount]);

  if (!visible) return null;

  const sum = displayDice[0] + displayDice[1];
  const isSeven = sum === 7;
  const isKeyNumber = sum === 6 || sum === 8;
  const isRare = sum === 2 || sum === 12;

  return (
    <div
      onClick={() => setVisible(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer animate-fadeIn select-none"
    >
      {/* Contenedor Flotante Centrado */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md p-6 sm:p-8 rounded-3xl border-2 shadow-2xl flex flex-col items-center gap-5 text-center transition-all transform ${
          isSeven
            ? 'bg-gradient-to-b from-red-950/95 via-zinc-950/95 to-zinc-950/95 border-red-500/80 shadow-red-600/30'
            : isKeyNumber
            ? 'bg-gradient-to-b from-amber-950/95 via-zinc-950/95 to-zinc-950/95 border-amber-400/80 shadow-amber-500/30'
            : 'bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-zinc-950/95 border-amber-500/40 shadow-amber-500/10'
        }`}
      >
        {/* Botón Cerrar */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
        >
          <X size={18} />
        </button>

        {/* Quién tiró los dados */}
        <div className="flex items-center gap-2.5">
          <PlayerAvatar
            isBot={roller?.isBot}
            color={roller?.color}
            size={30}
          />
          <div className="text-xs sm:text-sm font-bold text-slate-200">
            <span style={{ color: roller?.color || '#fbbf24' }}>{roller?.username}</span>
            <span className="text-slate-400 font-normal ml-1">lanzó los dados</span>
          </div>
        </div>

        {/* Los 2 Dados 3D en el Centro */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 my-1">
          <BigDiceCube
            value={displayDice[0]}
            isRolling={isRolling}
            animationClass="animate-dice-tumble-1"
            restTilt="-3deg"
          />
          <span className="text-3xl font-black font-cinzel text-amber-400/80">+</span>
          <BigDiceCube
            value={displayDice[1]}
            isRolling={isRolling}
            animationClass="animate-dice-tumble-2"
            restTilt="3deg"
          />
        </div>

        {/* Suma y Banner del Resultado */}
        <div className="space-y-1.5 w-full">
          <div className="inline-flex items-center gap-2 bg-slate-900/90 px-4 py-1.5 rounded-2xl border border-slate-700/80 shadow-inner">
            <span className="text-xs font-semibold text-slate-400">Total:</span>
            <span className="font-cinzel text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-wider">
              {displayDice[0]} + {displayDice[1]} = {sum}
            </span>
          </div>

          {/* Efectos y descripción según el número */}
          <div className="pt-2">
            {isSeven && (
              <div className="flex flex-col items-center gap-1">
                <span className="inline-flex items-center gap-1.5 bg-red-600/30 text-red-200 border border-red-500/60 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                  <ShieldAlert size={14} className="text-red-400" /> ¡El Ladrón Despierta!
                </span>
                <p className="text-xs text-red-300/90 max-w-xs mt-1">
                  Quienes tengan más de 7 cartas deben descartar la mitad. El lanzador reubica al ladrón y roba.
                </p>
              </div>
            )}

            {isKeyNumber && (
              <div className="flex flex-col items-center gap-1">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/25 text-amber-200 border border-amber-400/60 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                  <Flame size={14} className="text-amber-400" /> ¡Número Clave ({sum})!
                </span>
                <p className="text-xs text-amber-300/90 max-w-xs mt-1">
                  ¡Gran cosecha! Los hexágonos con ficha roja {sum} producen recursos para todos sus poblados y ciudades.
                </p>
              </div>
            )}

            {isRare && (
              <div className="flex flex-col items-center gap-1">
                <span className="inline-flex items-center gap-1.5 bg-purple-500/25 text-purple-200 border border-purple-400/60 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  <Sparkles size={14} className="text-purple-400" /> ¡Tirada Especial ({sum})!
                </span>
                <p className="text-xs text-purple-300/90 max-w-xs mt-1">
                  ¡Tirada con probabilidad 1 entre 36! Producción activa para quienes tengan posesiones allí.
                </p>
              </div>
            )}

            {!isSeven && !isKeyNumber && !isRare && (
              <div className="flex flex-col items-center gap-1">
                <span className="inline-flex items-center gap-1.5 bg-slate-800/80 text-amber-300 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                  <Wheat size={14} className="text-amber-400" /> Producción de Recursos: {sum}
                </span>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Los hexágonos con la ficha {sum} entregan materias primas a los colonos adyacentes.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          (Haz clic en cualquier lugar para continuar)
        </div>
      </div>
    </div>
  );
}
