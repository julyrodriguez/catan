// src/components/SidebarPlayers.jsx
import React from 'react';
import { Trophy, Sword, Compass, Layers, Sparkles, Home, Castle, GitCommitHorizontal } from 'lucide-react';
import PlayerAvatar from './PlayerAvatar';

export default function SidebarPlayers({
  gameState,
  myPrivateState,
  currentUser
}) {
  return (
    <div className="glass-panel p-3.5 space-y-3 w-full max-w-xs shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 font-cinzel flex items-center gap-1.5">
          <Trophy size={14} /> Posiciones en la Isla
        </h3>
        <span className="text-[11px] font-extrabold text-zinc-400 font-mono">
          Meta: {gameState.targetPoints} PV
        </span>
      </div>

      <div className="space-y-2.5">
        {gameState.players.map((player) => {
          const isMe = player.id === currentUser?.id;
          const isTurn = gameState.activePlayerId === player.id;
          const secretPoints = isMe ? (myPrivateState?.secretVictoryPoints || 0) : 0;
          const totalPoints = player.victoryPoints + secretPoints;

          const hasLongestRoad = gameState.longestRoadHolder?.playerId === player.id;
          const hasLargestArmy = gameState.largestArmyHolder?.playerId === player.id;

          return (
            <div
              key={player.id}
              className={`p-3 rounded-2xl border transition relative overflow-hidden ${
                isTurn
                  ? 'border-amber-400 ring-2 ring-amber-500/30 bg-zinc-950/95 shadow-lg'
                  : 'border-zinc-800/90 bg-zinc-900/70 hover:border-zinc-700'
              }`}
            >
              {/* Barra lateral de color identificatoria */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: player.color }}
              />

              <div className="pl-1.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <PlayerAvatar
                      isBot={player.isBot}
                      isHost={player.isHost}
                      color={player.color}
                      size={32}
                    />

                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1.5 leading-tight">
                        <span>{player.username}</span>
                        {isMe && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 font-bold">
                            Tú
                          </span>
                        )}
                        {player.isBot && (
                          <span className="text-[9px] bg-cyan-950/60 text-cyan-300 px-1 rounded border border-cyan-800/40 font-bold">
                            BOT
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-0.5" title="Poblados fundados">
                          <Home size={10} className="text-zinc-400" /> {player.settlementsCount}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5" title="Ciudades mejoradas">
                          <Castle size={10} className="text-zinc-400" /> {player.citiesCount}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5" title="Carreteras construidas">
                          <GitCommitHorizontal size={11} className="text-zinc-400" /> {player.roadsCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Puntos de Victoria */}
                  <div className="text-right">
                    <div className="text-base font-black text-amber-400 font-cinzel flex items-center justify-end gap-1">
                      <Trophy size={14} /> {totalPoints}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase">Puntos</span>
                  </div>
                </div>

                {/* Cartas de Recursos y Cartas de Desarrollo */}
                <div className="flex items-center justify-between text-[11px] text-zinc-300 pt-1.5 border-t border-zinc-800/80">
                  <span className="flex items-center gap-1 font-semibold" title="Cartas de recursos en mano">
                    <Layers size={13} className="text-amber-400" /> {player.resourceCount} cartas
                  </span>
                  <span className="flex items-center gap-1 font-semibold" title="Cartas de desarrollo compradas">
                    <Sparkles size={13} className="text-purple-400" /> {player.devCardsCount} des.
                  </span>
                </div>

                {/* Insignias Especiales */}
                {(hasLongestRoad || hasLargestArmy) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {hasLongestRoad && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                        <Compass size={11} /> Gran Ruta (+2 PV)
                      </span>
                    )}
                    {hasLargestArmy && (
                      <span className="bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                        <Sword size={11} /> Mayor Ejército (+2 PV)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
