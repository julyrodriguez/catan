// src/components/PlayerHUD.jsx
import React from 'react';
import { 
  Dices, Home, Castle, GitCommitHorizontal, 
  Sparkles, ArrowRight, Handshake, ShieldAlert,
  HelpCircle, Volume2, VolumeX
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

const COSTS = {
  road: { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  city: { wheat: 2, ore: 3 },
  devCard: { sheep: 1, wheat: 1, ore: 1 }
};

export default function PlayerHUD({
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
  onOpenDevCardModal
}) {
  const [muted, setMuted] = React.useState(false);

  const activePlayer = gameState.players[gameState.currentTurnIndex];
  const isMyTurn = activePlayer?.id === currentUser?.id;
  const isSetup = gameState.phase === 'setup_round_1' || gameState.phase === 'setup_round_2';
  const isSpecialBuild = gameState.phase === 'special_building';
  const resources = myPrivateState?.resources || { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 };
  const totalCards = Object.values(resources).reduce((a, b) => a + b, 0);

  const canAfford = (cost) => {
    for (const [res, count] of Object.entries(cost)) {
      if ((resources[res] || 0) < count) return false;
    }
    return true;
  };

  const handleToggleSound = () => {
    const isM = sounds.toggleMute();
    setMuted(isM);
  };

  const handleRoll = () => {
    sounds.playDiceRoll();
    onRollDice();
  };

  // Mensaje explicativo del estado
  const getPhaseInstruction = () => {
    if (isSetup) {
      if (gameState.subphase === 'settlement') {
        return isMyTurn
          ? '🎯 Haz clic en un vértice brillante para fundar tu poblado inicial.'
          : `Esperando que ${activePlayer?.username} coloque su poblado inicial...`;
      }
      if (gameState.subphase === 'road') {
        return isMyTurn
          ? '🛣️ Haz clic en una arista conectada para construir tu camino inicial.'
          : `Esperando que ${activePlayer?.username} coloque su camino...`;
      }
    }

    if (isSpecialBuild) {
      return '🔨 Fase Especial de Construcción (5-6P): Puedes construir con tus recursos o pasar.';
    }

    if (gameState.subphase === 'roll') {
      return isMyTurn
        ? '🎲 Es tu turno: ¡Tira los dados para producir recursos!'
        : `Turno de ${activePlayer?.username}: Tirando dados...`;
    }

    if (gameState.subphase === 'discard') {
      return '⚠️ ¡Salió un 7! Los jugadores con más de 7 cartas deben descartar la mitad.';
    }

    if (gameState.subphase === 'robber') {
      return isMyTurn
        ? '🥷 Mueve al Ladrón a un hexágono con recursos para bloquearlo.'
        : `${activePlayer?.username} está moviendo al Ladrón...`;
    }

    if (gameState.subphase === 'steal') {
      return isMyTurn
        ? '🥷 Selecciona una víctima adyacente para robar 1 recurso misterioso.'
        : `${activePlayer?.username} está eligiendo a quién robar...`;
    }

    return isMyTurn
      ? '✨ Fase de Comercio y Construcción: Construye, comercia o finaliza tu turno.'
      : `Turno de ${activePlayer?.username}`;
  };

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* 1. Barra Superior de Turno e Instrucciones */}
      <div className="w-full max-w-4xl glass-panel px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg border-amber-500/20">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-base border-2 shadow"
            style={{
              borderColor: activePlayer?.color || '#fff',
              backgroundColor: '#0f172a'
            }}
          >
            {activePlayer?.avatar || '🧑‍🌾'}
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-2">
              <span style={{ color: activePlayer?.color }}>{activePlayer?.username}</span>
              {isMyTurn && (
                <span className="bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded text-[10px]">
                  ¡TU TURNO!
                </span>
              )}
            </div>
            <div className="text-xs text-slate-300 font-medium">
              {getPhaseInstruction()}
            </div>
          </div>
        </div>

        {/* Dados y Mute */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <div className="die-cube text-base font-bold w-7 h-7">
              {gameState.dice[0]}
            </div>
            <div className="die-cube text-base font-bold w-7 h-7">
              {gameState.dice[1]}
            </div>
            <span className="text-xs font-bold text-amber-400 ml-1">
              = {gameState.lastRoll}
            </span>
          </div>

          <button
            onClick={handleToggleSound}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title={muted ? 'Activar sonido' : 'Silenciar'}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
        </div>
      </div>

      {/* 2. Botonera de Acciones de Juego */}
      <div className="w-full max-w-4xl glass-panel p-3 flex flex-wrap items-center justify-center gap-2">
        {/* Botón Tirar Dados */}
        {isMyTurn && gameState.subphase === 'roll' && !isSetup && (
          <button
            onClick={handleRoll}
            className="btn-primary py-2 px-5 text-sm font-bold shadow-lg animate-pulse"
          >
            <Dices size={18} /> Tirar Dados (2d6)
          </button>
        )}

        {/* Acciones de construcción (disponibles en trade_and_build o en fase especial de construcción) */}
        {((isMyTurn && gameState.subphase === 'trade_and_build') || isSpecialBuild) && (
          <>
            <button
              onClick={() => setBuildMode(buildMode === 'road' ? null : 'road')}
              disabled={!canAfford(COSTS.road)}
              className={`btn-action text-xs ${
                buildMode === 'road'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400'
                  : ''
              }`}
              title="Cuesta: 1 Madera + 1 Arcilla"
            >
              <GitCommitHorizontal size={16} /> Carretera
              <span className="text-[10px] opacity-70 ml-0.5">(1M, 1A)</span>
            </button>

            <button
              onClick={() => setBuildMode(buildMode === 'settlement' ? null : 'settlement')}
              disabled={!canAfford(COSTS.settlement)}
              className={`btn-action text-xs ${
                buildMode === 'settlement'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400'
                  : ''
              }`}
              title="Cuesta: 1 Madera + 1 Arcilla + 1 Trigo + 1 Oveja"
            >
              <Home size={16} /> Poblado (+1 PV)
              <span className="text-[10px] opacity-70 ml-0.5">(1M,1A,1T,1O)</span>
            </button>

            <button
              onClick={() => setBuildMode(buildMode === 'city' ? null : 'city')}
              disabled={!canAfford(COSTS.city)}
              className={`btn-action text-xs ${
                buildMode === 'city'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400'
                  : ''
              }`}
              title="Cuesta: 2 Trigo + 3 Mineral (Mejora un poblado)"
            >
              <Castle size={16} /> Ciudad (+1 PV)
              <span className="text-[10px] opacity-70 ml-0.5">(2T, 3Min)</span>
            </button>

            <button
              onClick={onBuyDevCard}
              disabled={!canAfford(COSTS.devCard) || gameState.devCardsRemaining === 0}
              className="btn-action text-xs"
              title="Cuesta: 1 Oveja + 1 Trigo + 1 Mineral"
            >
              <Sparkles size={16} className="text-purple-400" /> Carta de Desarrollo
              <span className="text-[10px] opacity-70 ml-0.5">({gameState.devCardsRemaining})</span>
            </button>

            {!isSpecialBuild && (
              <button
                onClick={onOpenTradeModal}
                className="btn-action text-xs text-amber-300 border-amber-500/40"
              >
                <Handshake size={16} /> Comerciar
              </button>
            )}

            <button
              onClick={onOpenDevCardModal}
              className="btn-action text-xs text-indigo-300"
            >
              📜 Mis Cartas ({myPrivateState?.devCards?.length || 0})
            </button>

            {isMyTurn && !isSpecialBuild && (
              <button
                onClick={onEndTurn}
                className="btn-action bg-red-950/70 hover:bg-red-900 text-red-200 border-red-800 text-xs font-bold ml-auto"
              >
                <ArrowRight size={16} /> Finalizar Turno
              </button>
            )}

            {isSpecialBuild && (
              <button
                onClick={onSkipSpecialBuild}
                className="btn-action bg-slate-800 hover:bg-slate-700 text-xs font-bold ml-auto"
              >
                Omitir Construcción Especial
              </button>
            )}
          </>
        )}
      </div>

      {/* 3. Mano de Recursos en la Parte Inferior */}
      <div className="w-full max-w-4xl glass-panel p-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tus Recursos:
          </span>
          {totalCards > 7 && (
            <span className="text-[11px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldAlert size={12} /> {totalCards} cartas (¡Peligro de 7!)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="res-badge-wood px-3 py-1.5 rounded-xl border flex items-center gap-2 font-bold text-xs shadow">
            <span>🌲 Madera</span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-sm">
              {resources.wood || 0}
            </span>
          </div>

          <div className="res-badge-brick px-3 py-1.5 rounded-xl border flex items-center gap-2 font-bold text-xs shadow">
            <span>🧱 Arcilla</span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-sm">
              {resources.brick || 0}
            </span>
          </div>

          <div className="res-badge-sheep px-3 py-1.5 rounded-xl border flex items-center gap-2 font-bold text-xs shadow">
            <span>🐑 Oveja</span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-sm">
              {resources.sheep || 0}
            </span>
          </div>

          <div className="res-badge-wheat px-3 py-1.5 rounded-xl border flex items-center gap-2 font-bold text-xs shadow">
            <span>🌾 Trigo</span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-sm">
              {resources.wheat || 0}
            </span>
          </div>

          <div className="res-badge-ore px-3 py-1.5 rounded-xl border flex items-center gap-2 font-bold text-xs shadow">
            <span>⛰️ Mineral</span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-sm">
              {resources.ore || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
