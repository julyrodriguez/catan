// src/components/VictoryModal.jsx
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/soundEffects';
import { Trophy, ArrowLeft, Award, Crown } from 'lucide-react';

export default function VictoryModal({ winner, onReturnToLobby }) {
  if (!winner) return null;

  useEffect(() => {
    sounds.playVictory();

    // Lanzar confeti festivo
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [winner]);

  return (
    <div className="modal-backdrop">
      <div className="modal-content w-full max-w-md p-8 text-center space-y-6 relative border-amber-500/40">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 text-4xl shadow-xl animate-bounce">
          🏆
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-1">
            ¡Victoria en Catán!
          </span>
          <h2 className="text-3xl font-extrabold font-cinzel text-white">
            {winner.username}
          </h2>
          <p className="text-slate-300 text-sm mt-2">
            Ha conquistado la isla alcanzando{' '}
            <strong className="text-amber-400 font-bold">{winner.points} Puntos de Victoria</strong>.
          </p>
        </div>

        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Gobernador Supremo:</span>
            <span className="font-bold text-white flex items-center gap-1">
              <Crown size={14} className="text-amber-400" /> {winner.username}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Puntos Totales:</span>
            <span className="font-bold text-amber-300">{winner.points} PV</span>
          </div>
        </div>

        <button
          onClick={onReturnToLobby}
          className="btn-primary w-full py-3 font-bold text-sm shadow-xl"
        >
          <ArrowLeft size={16} /> Volver a las Salas
        </button>
      </div>
    </div>
  );
}
