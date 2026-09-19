// src/components/SidebarPlayers.jsx
import React from 'react';
import { Trophy, Sword, Compass, Home, Castle, Sparkles, Layers } from 'lucide-react';

export default function SidebarPlayers({
  gameState,
  myPrivateState,
  currentUser
}) {
  return (
    <div className="glass-panel p-3.5 space-y-3 w-full max-w-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-cinzel">
          Colonos de la Isla
        </h3>
        <span className="text-[11px] font-bold text-amber-400">
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
              className={`p-3 rounded-xl border transition relative overflow-hidden ${
                isTurn
                  ? 'border-amber-400 ring-2 ring-amber-500/30 bg-slate-900/90 shadow-md'
                  : 'border-slate-800 bg-slate-900/50'
              }`}
            >
              {/* Barra lateral de color del jugador */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: player.color }}
              />

              <div className="pl-1.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{player.avatar || '🧑‍🌾'}</span>
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1">
                        <span>{player.username}</span>
                        {isMe && <span className="text-[10px] text-amber-400">(Tú)</span>}
                        {player.isBot && <span className="text-[10px] text-slate-400">🤖</span>}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {player.settlementsCount} pob. • {player.citiesCount} ciud. • {player.roadsCount} cam.
                      </div>
                    </div>
                  </div>

                  {/* Puntos de Victoria */}
                  <div className="text-right">
                    <span className="text-base font-extrabold text-amber-400 flex items-center gap-1 justify-end font-cinzel">
                      <Trophy size={14} /> {totalPoints}
                    </span>
                    <span className="text-[10px] text-slate-400">PV</span>
                  </div>
                </div>

                {/* Cartas en mano y Cartas de Desarrollo */}
                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                  <span className="flex items-center gap-1" title="Recursos en mano">
                    <Layers size={13} className="text-amber-400" /> {player.resourceCount} cartas
                  </span>
                  <span className="flex items-center gap-1" title="Cartas de desarrollo">
                    <Sparkles size={13} className="text-purple-400" /> {player.devCardsCount} des.
                  </span>
                </div>

                {/* Insignias de Gran Ruta Comercial y Mayor Ejército */}
                {(hasLongestRoad || hasLargestArmy) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {hasLongestRoad && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                        <Compass size={11} /> Gran Ruta (+2 PV)
                      </span>
                    )}
                    {hasLargestArmy && (
                      <span className="bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
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
