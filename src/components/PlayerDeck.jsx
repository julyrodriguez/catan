// src/components/PlayerDeck.jsx
import React from 'react';
import { 
  Home, Castle, GitCommitHorizontal, 
  Sparkles, ArrowRight, Handshake, ShieldAlert,
  Dices, Trees, Boxes, Cloud, Wheat, Mountain,
  X, Check, AlertTriangle, Clock, MapPin, Hammer
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

const COSTS = {
  road: { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  city: { wheat: 2, ore: 3 },
  devCard: { sheep: 1, wheat: 1, ore: 1 }
};

const RESOURCE_META = {
  wood: { name: 'Madera', icon: Trees, colorClass: 'card-wood', textClass: 'text-emerald-300', countClass: 'text-emerald-300' },
  brick: { name: 'Arcilla', icon: Boxes, colorClass: 'card-brick', textClass: 'text-red-300', countClass: 'text-red-300' },
  sheep: { name: 'Lana', icon: Cloud, colorClass: 'card-sheep', textClass: 'text-lime-300', countClass: 'text-lime-300' },
  wheat: { name: 'Trigo', icon: Wheat, colorClass: 'card-wheat', textClass: 'text-amber-300', countClass: 'text-amber-300' },
  ore: { name: 'Mineral', icon: Mountain, colorClass: 'card-ore', textClass: 'text-slate-200', countClass: 'text-slate-100' }
};

export default function PlayerDeck({
  gameState,
  myPrivateState,
  currentUser,
  buildMode,
  setBuildMode,
  onRollDice,
  onBuyDevCard,
  onEndTurn,
  onSkipSpecialBuild,
  onOpenTradeModal,
  onOpenDevCardModal,
  sidebarMode = false
}) {
  const activePlayer = gameState.players.find(p => p.id === gameState.activePlayerId) || 
                       gameState.players[gameState.currentTurnIndex];
  const isMyTurn = gameState.activePlayerId === currentUser?.id;
  const isSetup = gameState.phase === 'setup_round_1' || gameState.phase === 'setup_round_2';
  const isSpecialBuild = gameState.phase === 'special_building';
  const isSpecialBuildTurn = isSpecialBuild && isMyTurn;
  const isTradeAndBuild = isMyTurn && gameState.subphase === 'trade_and_build';
  const isRollPhase = isMyTurn && gameState.subphase === 'roll' && !isSetup;
  const canBuildNow = isTradeAndBuild || isSpecialBuildTurn;

  const resources = myPrivateState?.resources || { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 };
  const totalCards = Object.values(resources).reduce((a, b) => a + b, 0);

  const canAfford = (cost) => {
    for (const [res, count] of Object.entries(cost)) {
      if ((resources[res] || 0) < count) return false;
    }
    return true;
  };

  const getMissingText = (cost) => {
    const missing = [];
    for (const [res, count] of Object.entries(cost)) {
      const diff = count - (resources[res] || 0);
      if (diff > 0) {
        missing.push(`${diff} ${RESOURCE_META[res]?.name || res}`);
      }
    }
    return missing.length > 0 ? `Falta: ${missing.join(', ')}` : null;
  };

  const handleRoll = () => {
    sounds.playDiceRoll();
    onRollDice();
  };

  // VISTA EN SIDEBAR DERECHO (Arriba del chat/historial estilo Colonist)
  if (sidebarMode) {
    return (
      <div className="w-full flex flex-col gap-2 select-none">
        {/* Alerta Flotante si hay Modo de Construcción Activo */}
        {buildMode && (
          <div className="glass-panel px-3 py-2 flex items-center justify-between gap-2 bg-amber-950/95 border border-amber-400 shadow-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200">
              <Hammer size={15} className="text-amber-400 shrink-0 animate-bounce" />
              <span className="truncate">
                {buildMode === 'road' && 'Coloca Carretera en arista dorada'}
                {buildMode === 'settlement' && 'Coloca Poblado en vértice (+1 PV)'}
                {buildMode === 'city' && 'Mejora Poblado a Ciudad (+1 PV)'}
              </span>
            </div>
            <button
              onClick={() => setBuildMode(null)}
              className="text-[10px] font-black bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded-lg shadow transition shrink-0"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Panel de Cartas de Recursos */}
        <div className="glass-panel p-3 flex flex-col gap-2.5 shadow-xl border-zinc-800">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
            <span className="font-cinzel text-xs font-black tracking-wider text-amber-400 uppercase">
              Tus Recursos ({totalCards})
            </span>
            {totalCards > 7 && (
              <span className="text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <ShieldAlert size={11} /> ¡Peligro de 7!
              </span>
            )}
          </div>

          {/* Fila de las 5 Cartas de Recursos */}
          <div className="grid grid-cols-5 gap-1.5">
            {Object.entries(RESOURCE_META).map(([key, meta]) => {
              const count = resources[key] || 0;
              const Icon = meta.icon;
              const hasCards = count > 0;

              return (
                <div
                  key={key}
                  className={`relative flex flex-col justify-between items-center h-[72px] rounded-xl border p-1 transition-all select-none shadow-sm ${meta.colorClass} ${
                    hasCards
                      ? 'shadow-md -translate-y-0.5 brightness-110 opacity-100 ring-2 ring-amber-400/50'
                      : 'opacity-65 brightness-90'
                  }`}
                  title={`${meta.name}: ${count} en mano`}
                >
                  <div className="flex items-center justify-center gap-0.5 w-full leading-none">
                    <Icon size={12} className={meta.textClass} />
                    <span className="text-[9px] font-bold truncate">{meta.name}</span>
                  </div>

                  <div className="my-auto opacity-20 pointer-events-none">
                    <Icon size={18} className={meta.textClass} />
                  </div>

                  <div className="w-full flex justify-center">
                    <span className={`text-xs font-mono font-black px-1.5 py-0.2 rounded border leading-none ${
                      hasCards
                        ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow font-extrabold'
                        : 'bg-black/60 text-zinc-300 border-zinc-700'
                    }`}>
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Acciones y Construcción */}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            {/* Mensajes de Turno / Botones Principales */}
            {isSetup && (
              isMyTurn ? (
                <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400 p-2 rounded-xl text-xs text-amber-200 font-semibold">
                  <MapPin size={18} className="text-amber-400 shrink-0 animate-bounce" />
                  <div className="leading-tight">
                    <span className="font-black text-amber-300 block">¡TU TURNO DE FUNDAR!</span>
                    <span className="text-[10px]">
                      {gameState.subphase === 'settlement' ? 'Elige un círculo dorado para tu Poblado' : 'Elige un camino dorado para tu Carretera'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 p-2 rounded-xl text-xs text-zinc-300">
                  <span className="animate-spin text-amber-400">⏳</span>
                  <span className="text-[11px]">Esperando a {activePlayer?.username}...</span>
                </div>
              )
            )}

            {isRollPhase && (
              <button
                onClick={handleRoll}
                className="btn-primary w-full py-2.5 text-xs font-black shadow-lg animate-pulse flex items-center justify-center gap-2 rounded-xl"
              >
                <Dices size={16} />
                <span>🎲 TIRAR DADOS (2d6)</span>
              </button>
            )}

            {!isMyTurn && !isSetup && !isSpecialBuild && (
              <div className="flex items-center gap-2 text-xs text-zinc-400 py-1.5 px-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="animate-spin text-amber-400">⏳</span>
                <span className="text-[11px] truncate">Turno de <strong>{activePlayer?.username}</strong></span>
              </div>
            )}

            {isSpecialBuild && (
              isMyTurn ? (
                <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-400 p-2 rounded-xl text-xs text-purple-200 font-semibold">
                  <Hammer size={18} className="text-purple-400 shrink-0 animate-bounce" />
                  <div className="leading-tight">
                    <span className="font-black text-purple-300 block">🔨 ¡TU FASE ESPECIAL (5-6P)!</span>
                    <span className="text-[10px]">Puedes construir o comprar cartas antes de pasar.</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 p-2 rounded-xl text-xs text-zinc-300">
                  <span className="animate-spin text-purple-400">⏳</span>
                  <span className="text-[11px] truncate">Fase Especial: Turno de <strong>{activePlayer?.username}</strong></span>
                </div>
              )
            )}

            {/* Grid 2x2 de Construcción */}
            {!isSetup && (
              <div className="grid grid-cols-2 gap-1.5">
                {/* Carretera */}
                {(() => {
                  const affordable = canAfford(COSTS.road);
                  const isSelected = buildMode === 'road';
                  const active = canBuildNow;
                  return (
                    <button
                      onClick={() => active && setBuildMode(isSelected ? null : 'road')}
                      disabled={!active || (!affordable && !isSelected)}
                      className={`btn-action flex-col items-center py-1.5 px-2 text-center rounded-xl transition ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 ring-2 ring-amber-400 font-bold'
                          : active && affordable
                          ? 'border-emerald-500/70 hover:border-emerald-400 bg-emerald-950/40 text-emerald-100'
                          : 'opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-[11px]">
                        <GitCommitHorizontal size={12} /> Carretera
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-mono mt-0.5">
                        <span>🌲1</span>
                        <span>🧱1</span>
                      </div>
                    </button>
                  );
                })()}

                {/* Poblado */}
                {(() => {
                  const affordable = canAfford(COSTS.settlement);
                  const isSelected = buildMode === 'settlement';
                  const active = canBuildNow;
                  return (
                    <button
                      onClick={() => active && setBuildMode(isSelected ? null : 'settlement')}
                      disabled={!active || (!affordable && !isSelected)}
                      className={`btn-action flex-col items-center py-1.5 px-2 text-center rounded-xl transition ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 ring-2 ring-amber-400 font-bold'
                          : active && affordable
                          ? 'border-emerald-500/70 hover:border-emerald-400 bg-emerald-950/40 text-emerald-100'
                          : 'opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-[11px]">
                        <Home size={12} /> Poblado <span className="text-amber-400 text-[9px]">+1PV</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-mono mt-0.5">
                        <span>🌲🧱🐑🌾</span>
                      </div>
                    </button>
                  );
                })()}

                {/* Ciudad */}
                {(() => {
                  const affordable = canAfford(COSTS.city);
                  const isSelected = buildMode === 'city';
                  const active = canBuildNow;
                  return (
                    <button
                      onClick={() => active && setBuildMode(isSelected ? null : 'city')}
                      disabled={!active || (!affordable && !isSelected)}
                      className={`btn-action flex-col items-center py-1.5 px-2 text-center rounded-xl transition ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 ring-2 ring-amber-400 font-bold'
                          : active && affordable
                          ? 'border-emerald-500/70 hover:border-emerald-400 bg-emerald-950/40 text-emerald-100'
                          : 'opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-[11px]">
                        <Castle size={12} /> Ciudad <span className="text-amber-400 text-[9px]">+1PV</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-amber-200 font-mono font-bold mt-0.5">
                        <span>🌾2 ⛰️3</span>
                      </div>
                    </button>
                  );
                })()}

                {/* Desarrollo */}
                {(() => {
                  const affordable = canAfford(COSTS.devCard);
                  const available = gameState.devCardsRemaining > 0;
                  const active = canBuildNow;
                  return (
                    <button
                      onClick={() => active && onBuyDevCard()}
                      disabled={!active || !affordable || !available}
                      className={`btn-action flex-col items-center py-1.5 px-2 text-center rounded-xl transition ${
                        active && affordable && available
                          ? 'border-purple-500/70 hover:border-purple-400 bg-purple-950/40 text-purple-100'
                          : 'opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-[11px] text-purple-300">
                        <Sparkles size={12} /> Desarrollo
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-purple-200 font-mono mt-0.5">
                        <span>🐑1 🌾1 ⛰️1</span>
                      </div>
                    </button>
                  );
                })()}
              </div>
            )}

            {/* Fila de Utilidades: Comercio, Mano y Terminar Turno */}
            {(!isSetup && (!isRollPhase || !isMyTurn)) && (
              <div className="flex items-center gap-1.5 pt-1">
                {!isSpecialBuild && (
                  <button
                    onClick={onOpenTradeModal}
                    className="btn-action flex-1 py-1.5 px-2 text-amber-300 border-amber-500/40 hover:border-amber-400 bg-amber-950/30 rounded-xl text-xs font-bold justify-center"
                    title="Comerciar con el Banco o Colonos"
                  >
                    <Handshake size={14} />
                    <span>Comercio</span>
                  </button>
                )}

                <button
                  onClick={onOpenDevCardModal}
                  className="btn-action flex-1 py-1.5 px-2 text-indigo-300 border-indigo-500/30 hover:border-indigo-400 bg-indigo-950/30 rounded-xl text-xs font-bold justify-center"
                  title="Ver cartas de desarrollo en mano"
                >
                  📜 <span>Mano</span> ({myPrivateState?.devCards?.length || 0})
                </button>

                {isMyTurn && !isSpecialBuild && (
                  <button
                    onClick={onEndTurn}
                    disabled={!isTradeAndBuild}
                    className={`btn-action flex-1 py-1.5 px-2 rounded-xl font-black justify-center shadow ${
                      isTradeAndBuild
                        ? 'bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-red-100 border-red-500/70 hover:from-red-900'
                        : 'opacity-35'
                    }`}
                  >
                    <span>Pasar</span>
                    <ArrowRight size={13} />
                  </button>
                )}

                {isSpecialBuildTurn && (
                  <button
                    onClick={onSkipSpecialBuild}
                    className="btn-action bg-purple-900 hover:bg-purple-800 text-purple-100 py-1.5 px-3 rounded-xl ml-auto font-bold text-xs border border-purple-500/70 shadow"
                  >
                    Omitir / Pasar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-1.5 shrink-0 z-20 select-none">
      {/* 1. Alerta Flotante si hay Modo de Construcción Activo */}
      {buildMode && (
        <div className="glass-panel px-4 py-1.5 flex items-center justify-between gap-3 bg-amber-950/90 border-2 border-amber-400 shadow-2xl">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-200">
            <Hammer size={18} className="text-amber-400 shrink-0 animate-bounce" />
            <span>
              {buildMode === 'road' && 'Modo Carretera activo: Haz clic en una arista dorada del tablero.'}
              {buildMode === 'settlement' && 'Modo Poblado activo: Haz clic en un vértice dorado del mapa (+1 PV).'}
              {buildMode === 'city' && 'Modo Ciudad activo: Haz clic en uno de tus poblados para mejorarlo (+1 PV adic.).'}
            </span>
          </div>

          <button
            onClick={() => setBuildMode(null)}
            className="flex items-center gap-1 text-xs font-black bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-xl shadow transition"
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      )}

      {/* 2. Deck Principal: Cartas de Recursos (Izquierda) + Acciones y Costos (Derecha) */}
      <div className="w-full glass-panel p-2 sm:p-2.5 flex flex-col lg:flex-row items-center justify-between gap-2 sm:gap-4 shadow-2xl border-zinc-800">
        
        {/* SECCIÓN RECURSOS / MINERALES: Cartas Físicas */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <span className="font-cinzel text-xs font-black tracking-wider text-amber-400 uppercase">
              Tus Recursos ({totalCards}):
            </span>
            {totalCards > 7 && (
              <span className="text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <ShieldAlert size={11} /> ¡Peligro de 7!
              </span>
            )}
          </div>

          {/* Fila de las 5 Cartas Físicas */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 max-w-full">
            {Object.entries(RESOURCE_META).map(([key, meta]) => {
              const count = resources[key] || 0;
              const Icon = meta.icon;
              const hasCards = count > 0;

              return (
                <div
                  key={key}
                  className={`relative flex flex-col justify-between items-center w-[60px] sm:w-[72px] h-[72px] sm:h-[84px] rounded-xl border-2 p-1.5 transition-all select-none shadow-md ${meta.colorClass} ${
                    hasCards
                      ? 'shadow-lg -translate-y-1 brightness-110 opacity-100 ring-2 ring-amber-400/50'
                      : 'opacity-70 brightness-90 hover:opacity-90'
                  }`}
                  title={`${meta.name}: ${count} en mano`}
                >
                  {/* Nombre e Icono */}
                  <div className="flex items-center justify-center gap-1 w-full leading-none">
                    <Icon size={13} className={meta.textClass} />
                    <span className="text-[10px] font-bold truncate">
                      {meta.name}
                    </span>
                  </div>

                  {/* Icono central de gran tamaño translúcido */}
                  <div className="my-auto opacity-20 pointer-events-none">
                    <Icon size={22} className={meta.textClass} />
                  </div>

                  {/* Cantidad en Insignia */}
                  <div className="w-full flex justify-center">
                    <span className={`text-xs sm:text-sm font-mono font-black px-2 py-0.2 rounded-md border leading-none shadow-inner ${
                      hasCards
                        ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md font-extrabold'
                        : 'bg-black/60 text-zinc-300 border-zinc-700'
                    }`}>
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN ACCIONES Y CONSTRUCCIÓN ("Las Cosas") */}
        <div className="w-full lg:flex-1 flex items-center justify-center lg:justify-end gap-2 flex-wrap">
          
          {/* FASE PREPARACIÓN (SETUP) */}
          {isSetup && (
            isMyTurn ? (
              <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/20 via-amber-600/30 to-amber-500/20 border-2 border-amber-400 py-2 px-5 rounded-2xl shadow-lg">
                <MapPin size={22} className="text-amber-400 shrink-0 animate-bounce" />
                <div>
                  <div className="text-xs font-black text-amber-300 font-cinzel tracking-wider">
                    ¡TU TURNO DE FUNDAR!
                  </div>
                  <div className="text-[11px] text-amber-100 font-medium">
                    {gameState.subphase === 'settlement' 
                      ? 'Haz clic en un círculo dorado del mapa para fundar tu Poblado (+1 PV).'
                      : 'Haz clic en un camino dorado adyacente para trazar tu Carretera.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-zinc-900/80 border border-zinc-800 py-2 px-4 rounded-xl text-zinc-300">
                <span className="animate-spin text-amber-400">⏳</span>
                <div className="text-xs">
                  <span className="font-bold text-zinc-200">Ronda Inicial:</span> Esperando a que <strong>{activePlayer?.username}</strong> coloque su {gameState.subphase === 'settlement' ? 'poblado' : 'carretera'}...
                </div>
              </div>
            )
          )}

          {/* BOTÓN TIRAR DADOS (Cuando toca tirar) */}
          {isRollPhase && (
            <button
              onClick={handleRoll}
              className="btn-primary py-2.5 px-7 text-sm sm:text-base font-extrabold shadow-2xl animate-pulse flex items-center gap-2 rounded-2xl"
            >
              <Dices size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
              <span>🎲 TIRAR DADOS (2d6)</span>
            </button>
          )}

          {/* MENSAJE DE ESPERA CUANDO OTRO JUGADOR ESTÁ EN SU TURNO NORMAL */}
          {!isMyTurn && !isSetup && !isSpecialBuild && (
            <div className="flex items-center gap-2 text-xs text-zinc-300 py-2 px-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
              <span className="animate-spin text-amber-400">⏳</span>
              <span>Turno de <strong>{activePlayer?.username}</strong> ({gameState.subphase === 'roll' ? 'Tirando dados...' : 'Construyendo / Comerciando...'})</span>
            </div>
          )}

          {isSpecialBuild && (
            isMyTurn ? (
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-purple-950/70 via-purple-900/80 to-purple-950/70 border-2 border-purple-400 py-2 px-4 rounded-2xl shadow-lg">
                <Hammer size={20} className="text-purple-300 shrink-0 animate-bounce" />
                <div>
                  <div className="text-xs font-black text-purple-200 font-cinzel tracking-wider">
                    🔨 ¡TU TURNO EN FASE ESPECIAL (5-6P)!
                  </div>
                  <div className="text-[11px] text-purple-100 font-medium">
                    Puedes construir carreteras, poblados, ciudades o comprar cartas antes de pasar.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-zinc-300 py-2 px-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                <span className="animate-spin text-purple-400">⏳</span>
                <span>Fase Especial (5-6P): Turno de <strong>{activePlayer?.username}</strong>...</span>
              </div>
            )
          )}

          {/* PANEL DE CONSTRUCCIÓN: Carretera, Poblado, Ciudad, Carta Desarrollo */}
          {(!isSetup && (!isRollPhase || !isMyTurn)) && (
            <>
              {/* Carretera */}
              {(() => {
                const affordable = canAfford(COSTS.road);
                const isSelected = buildMode === 'road';
                const missing = getMissingText(COSTS.road);
                const active = canBuildNow;

                return (
                  <button
                    onClick={() => active && setBuildMode(isSelected ? null : 'road')}
                    disabled={!active || (!affordable && !isSelected)}
                    title={missing || 'Carretera (1 Madera + 1 Arcilla)'}
                    className={`btn-action flex-col items-center py-1 px-2 text-center min-w-[72px] sm:min-w-[80px] rounded-xl transition ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 ring-2 ring-amber-400 font-bold'
                        : active && affordable
                        ? 'border-emerald-500/70 hover:border-emerald-400 bg-emerald-950/40 text-emerald-100 shadow'
                        : 'opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-[11px]">
                      <GitCommitHorizontal size={13} /> Carretera
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-zinc-300 font-mono mt-0.5">
                      <span>🌲1</span>
                      <span>🧱1</span>
                    </div>
                  </button>
                );
              })()}

              {/* Poblado */}
              {(() => {
                const affordable = canAfford(COSTS.settlement);
                const isSelected = buildMode === 'settlement';
                const missing = getMissingText(COSTS.settlement);
                const active = canBuildNow;

                return (
                  <button
                    onClick={() => active && setBuildMode(isSelected ? null : 'settlement')}
                    disabled={!active || (!affordable && !isSelected)}
                    title={missing || 'Poblado (1 Madera + 1 Arcilla + 1 Lana + 1 Trigo)'}
                    className={`btn-action flex-col items-center py-1 px-2 text-center min-w-[76px] sm:min-w-[86px] rounded-xl transition ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 ring-2 ring-amber-400 font-bold'
                        : active && affordable
                        ? 'border-emerald-500/70 hover:border-emerald-400 bg-emerald-950/40 text-emerald-100 shadow'
                        : 'opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-[11px]">
                      <Home size={13} /> Poblado <span className="text-amber-400 text-[9px]">+1PV</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-zinc-300 font-mono mt-0.5">
                      <span>🌲1</span>
                      <span>🧱1</span>
                      <span>🐑1</span>
                      <span>🌾1</span>
                    </div>
                  </button>
                );
              })()}

              {/* Ciudad (¡Clarísimo destaque de los 3 Minerales!) */}
              {(() => {
                const affordable = canAfford(COSTS.city);
                const isSelected = buildMode === 'city';
                const missing = getMissingText(COSTS.city);
                const active = canBuildNow;

                return (
                  <button
                    onClick={() => active && setBuildMode(isSelected ? null : 'city')}
                    disabled={!active || (!affordable && !isSelected)}
                    title={missing || 'Ciudad (2 Trigo + 3 Minerales)'}
                    className={`btn-action flex-col items-center py-1 px-2 text-center min-w-[76px] sm:min-w-[86px] rounded-xl transition ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 ring-2 ring-amber-400 font-bold'
                        : active && affordable
                        ? 'border-emerald-500/70 hover:border-emerald-400 bg-emerald-950/40 text-emerald-100 shadow'
                        : 'opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-[11px]">
                      <Castle size={13} /> Ciudad <span className="text-amber-400 text-[9px]">+1PV</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-amber-200 font-mono font-bold mt-0.5">
                      <span>🌾2</span>
                      <span className="bg-zinc-800 px-1 rounded border border-zinc-600 text-zinc-100">⛰️3 Min</span>
                    </div>
                  </button>
                );
              })()}

              {/* Carta de Desarrollo */}
              {(() => {
                const affordable = canAfford(COSTS.devCard);
                const available = gameState.devCardsRemaining > 0;
                const missing = getMissingText(COSTS.devCard);
                const active = canBuildNow;

                return (
                  <button
                    onClick={() => active && onBuyDevCard()}
                    disabled={!active || !affordable || !available}
                    title={!available ? 'Mazo agotado' : missing || 'Comprar Carta de Desarrollo'}
                    className={`btn-action flex-col items-center py-1 px-2 text-center min-w-[74px] sm:min-w-[82px] rounded-xl transition ${
                      active && affordable && available
                        ? 'border-purple-500/70 hover:border-purple-400 bg-purple-950/40 text-purple-100 shadow'
                        : 'opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-[11px] text-purple-300">
                      <Sparkles size={13} /> Desarrollo
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-purple-200 font-mono mt-0.5">
                      <span>🐑1</span>
                      <span>🌾1</span>
                      <span>⛰️1</span>
                    </div>
                  </button>
                );
              })()}

              {/* Comerciar */}
              {!isSpecialBuild && (
                <button
                  onClick={onOpenTradeModal}
                  className="btn-action py-2 px-2.5 text-amber-300 border-amber-500/40 hover:border-amber-400 bg-amber-950/30 rounded-xl"
                  title="Comerciar con el Banco, Puertos 2:1/3:1 o con otros jugadores"
                >
                  <Handshake size={15} />
                  <span className="font-bold text-xs hidden sm:inline">Comercio</span>
                </button>
              )}

              {/* Mis Cartas */}
              <button
                onClick={onOpenDevCardModal}
                className="btn-action py-2 px-2.5 text-indigo-300 border-indigo-500/30 hover:border-indigo-400 bg-indigo-950/30 rounded-xl"
                title="Ver tus cartas de desarrollo"
              >
                📜 <span className="font-bold text-xs hidden sm:inline">Mano</span> ({myPrivateState?.devCards?.length || 0})
              </button>

              {/* Terminar Turno */}
              {isMyTurn && !isSpecialBuild && (
                <button
                  onClick={onEndTurn}
                  disabled={!isTradeAndBuild}
                  className={`btn-action py-2 px-3.5 rounded-xl font-black shadow-lg ml-auto flex items-center gap-1 ${
                    isTradeAndBuild
                      ? 'bg-gradient-to-r from-red-950 via-red-900 to-red-950 hover:from-red-900 hover:to-red-800 text-red-100 border-red-500/70'
                      : 'opacity-35'
                  }`}
                >
                  <span>Pasar</span>
                  <ArrowRight size={14} />
                </button>
              )}

              {/* Omitir Fase Especial */}
              {isSpecialBuildTurn && (
                <button
                  onClick={onSkipSpecialBuild}
                  className="btn-action bg-purple-900 hover:bg-purple-800 text-purple-100 py-2 px-3.5 rounded-xl ml-auto font-bold border border-purple-500/70 shadow"
                >
                  Omitir / Pasar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
