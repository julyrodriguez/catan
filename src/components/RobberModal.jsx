// src/components/RobberModal.jsx
import React, { useState } from 'react';
import { socketClient } from '../utils/api';
import { sounds } from '../utils/soundEffects';
import { ShieldAlert, Skull, UserCheck } from 'lucide-react';

const RESOURCES = [
  { id: 'wood', name: 'Madera', icon: '🌲' },
  { id: 'brick', name: 'Arcilla', icon: '🧱' },
  { id: 'sheep', name: 'Oveja', icon: '🐑' },
  { id: 'wheat', name: 'Trigo', icon: '🌾' },
  { id: 'ore', name: 'Mineral', icon: '⛰️' }
];

export default function RobberModal({
  gameState,
  myPrivateState,
  currentUser
}) {
  const isDiscarding = gameState.subphase === 'discard' && myPrivateState?.mustDiscard > 0;
  const isStealing = gameState.subphase === 'steal' && gameState.activePlayerId === currentUser?.id;

  const [discard, setDiscard] = useState({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });

  if (!isDiscarding && !isStealing) return null;

  const needed = myPrivateState?.mustDiscard || 0;
  const myResources = myPrivateState?.resources || {};
  const currentDiscardTotal = Object.values(discard).reduce((a, b) => a + b, 0);

  const handleConfirmDiscard = () => {
    sounds.playCardDraw();
    socketClient.send('discard_cards', { discard });
  };

  const handleSelectVictim = (victimId) => {
    sounds.playCardDraw();
    socketClient.send('steal_resource', { victimId });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content w-full max-w-md p-6 relative">
        {/* Caso 1: Descarte forzoso por 7 */}
        {isDiscarding && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 text-2xl flex items-center justify-center mx-auto mb-2 text-red-400">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-xl font-bold font-cinzel text-red-400">
                ¡El Ladrón te ha descubierto!
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Salió un 7 y tienes más de 7 cartas en mano. Debes descartar exactamente{' '}
                <strong className="text-amber-400 font-bold">{needed} cartas</strong> a la banca.
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2 my-4">
              {RESOURCES.map((r) => (
                <div key={r.id} className="bg-zinc-900/80 p-2 rounded-lg text-center border border-zinc-800">
                  <div className="text-xl">{r.icon}</div>
                  <div className="text-[10px] text-zinc-400 font-semibold">{r.name}</div>
                  <div className="text-[10px] text-zinc-500 mb-1">
                    Tiene: {myResources[r.id] || 0}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDiscard({ ...discard, [r.id]: Math.max(0, discard[r.id] - 1) })}
                      className="w-5 h-5 rounded bg-zinc-800 text-xs font-bold text-zinc-300"
                    >
                      -
                    </button>
                    <span className="font-mono text-sm font-bold w-4 text-red-400">{discard[r.id]}</span>
                    <button
                      type="button"
                      disabled={discard[r.id] >= (myResources[r.id] || 0) || currentDiscardTotal >= needed}
                      onClick={() => setDiscard({ ...discard, [r.id]: discard[r.id] + 1 })}
                      className="w-5 h-5 rounded bg-zinc-800 text-xs font-bold text-zinc-300 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center text-xs font-semibold">
              Descartadas:{' '}
              <span className={currentDiscardTotal === needed ? 'text-emerald-400' : 'text-red-400'}>
                {currentDiscardTotal} / {needed}
              </span>
            </div>

            <button
              onClick={handleConfirmDiscard}
              disabled={currentDiscardTotal !== needed}
              className="btn-primary w-full py-2.5 text-sm font-bold disabled:opacity-40"
            >
              Confirmar Descarte
            </button>
          </div>
        )}

        {/* Caso 2: Robar a un jugador */}
        {isStealing && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-2xl flex items-center justify-center mx-auto mb-2 text-amber-400">
                <Skull size={24} />
              </div>
              <h3 className="text-xl font-bold font-cinzel text-amber-400">
                Robo del Ladrón
              </h3>
              <p className="text-xs text-zinc-300 mt-1">
                Elige a uno de los colonos que tienen poblado o ciudad en este hexágono para robarle 1 recurso al azar:
              </p>
            </div>

            <div className="space-y-2 mt-4">
              {gameState.robberVictims.map((vId) => {
                const victim = gameState.players.find(p => p.id === vId);
                if (!victim) return null;

                return (
                  <button
                    key={vId}
                    onClick={() => handleSelectVictim(vId)}
                    className="w-full p-3 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 hover:border-amber-400 transition flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-lg border"
                        style={{ borderColor: victim.color, backgroundColor: '#09090d' }}
                      >
                        {victim.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white group-hover:text-amber-300 transition">
                          {victim.username}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {victim.resourceCount} cartas en mano
                        </div>
                      </div>
                    </div>

                    <span className="btn-action bg-amber-500/20 text-amber-300 text-xs py-1 px-3 border-amber-500/30 group-hover:bg-amber-500 group-hover:text-zinc-950 transition">
                      <UserCheck size={14} /> Robar
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
