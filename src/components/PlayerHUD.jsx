// src/components/PlayerHUD.jsx
import React, { useState } from 'react';
import { 
  Home, Castle, GitCommitHorizontal, 
  Sparkles, ArrowRight, Handshake, ShieldAlert,
  Volume2, VolumeX, Dices, Trees, Boxes, Cloud, Wheat, Mountain
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

const COSTS = {
  road: { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  city: { wheat: 2, ore: 3 },
  devCard: { sheep: 1, wheat: 1, ore: 1 }
};

// Renderizar dados con puntos reales
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
    <div className="dice-cube-visual grid-cols-3 grid-rows-3">
      {currentPips.map((pos, idx) => (
        <div key={idx} className={`pip ${pos}`} />
      ))}
    </div>
  );
}

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
  const [muted, setMuted] = useState(false);

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

  const getPhaseInstruction = () => {
    if (isSetup) {
      if (gameState.subphase === 'settlement') {
        return isMyTurn
          ? '🎯 Haz clic en un vértice dorado del mapa para fundar tu poblado inicial.'
          : `Esperando a que ${activePlayer?.username} funde su poblado inicial...`;
      }
      if (gameState.subphase === 'road') {
        return isMyTurn
          ? '🛣️ Haz clic en una arista dorada adyacente para colocar tu camino.'
          : `Esperando a que ${activePlayer?.username} coloque su camino...`;
      }
    }

    if (isSpecialBuild) {
      return '🔨 Fase Especial de Construcción (5-6P): Puedes construir con tus recursos o pasar.';
    }

    if (gameState.subphase === 'roll') {
      return isMyTurn
        ? '🎲 Es tu turno: ¡Tira los dados para activar la producción de la isla!'
        : `Turno de ${activePlayer?.username}: Tirando dados...`;
    }

    if (gameState.subphase === 'discard') {
      return '⚠️ ¡Salió un 7! Quienes tengan más de 7 cartas deben descartar la mitad.';
    }

    if (gameState.subphase === 'robber') {
      return isMyTurn
        ? '🥷 Haz clic sobre un hexágono de recursos para colocar al Ladrón y bloquearlo.'
        : `${activePlayer?.username} está reubicando al Ladrón...`;
    }

    if (gameState.subphase === 'steal') {
      return isMyTurn
        ? '🥷 Elige a qué colono adyacente deseas robarle una carta misteriosa.'
        : `${activePlayer?.username} está eligiendo su víctima...`;
    }

    return isMyTurn
      ? '✨ Fase de Comercio y Construcción: ¡Expande tus dominios o comercia!'
      : `Turno de ${activePlayer?.username}`;
  };

  return (
    <div className="w-full flex flex-col items-center gap-2.5 z-20">
      {/* 1. Barra Superior con Indicador de Turno */}
      <div className="w-full max-w-5xl glass-panel px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl border-amber-500/20">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold shadow-md border-2"
            style={{
              borderColor: activePlayer?.color || '#fff',
              backgroundColor: '#0a0f1d'
            }}
          >
            {activePlayer?.avatar || '🧑‍🌾'}
          </div>

          <div>
            <div className="text-xs font-bold flex items-center gap-2">
              <span className="text-sm font-cinzel font-black tracking-wide" style={{ color: activePlayer?.color }}>
                {activePlayer?.username}
              </span>
              {isMyTurn && (
                <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] tracking-wider shadow">
                  ¡ES TU TURNO!
                </span>
              )}
            </div>
            <div className="text-xs text-slate-300 font-medium">
              {getPhaseInstruction()}
            </div>
          </div>
        </div>

        {/* Dados y Control de Sonido */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-inner">
            <DiceFace value={gameState.dice[0]} />
            <DiceFace value={gameState.dice[1]} />
            <span className="text-sm font-black font-mono text-amber-400 ml-1">
              = {gameState.lastRoll}
            </span>
          </div>

          <button
            onClick={handleToggleSound}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title={muted ? 'Activar sonido' : 'Silenciar'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* 2. Barra de Herramientas y Acciones */}
      <div className="w-full max-w-5xl glass-panel px-3 py-2 flex flex-wrap items-center justify-center gap-2">
        {/* Botón Tirar Dados */}
        {isMyTurn && gameState.subphase === 'roll' && !isSetup && (
          <button
            onClick={handleRoll}
            className="btn-primary py-2 px-6 text-sm font-extrabold shadow-xl animate-pulse"
          >
            <Dices size={18} /> Tirar Dados (2d6)
          </button>
        )}

        {/* Botones de Construcción y Comercio */}
        {((isMyTurn && gameState.subphase === 'trade_and_build') || isSpecialBuild) && (
          <>
            <button
              onClick={() => setBuildMode(buildMode === 'road' ? null : 'road')}
              disabled={!canAfford(COSTS.road)}
              className={`btn-action ${
                buildMode === 'road'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400 font-bold'
                  : ''
              }`}
            >
              <GitCommitHorizontal size={15} /> Carretera
              <span className="text-[10px] opacity-75 font-mono ml-0.5">(1M+1A)</span>
            </button>

            <button
              onClick={() => setBuildMode(buildMode === 'settlement' ? null : 'settlement')}
              disabled={!canAfford(COSTS.settlement)}
              className={`btn-action ${
                buildMode === 'settlement'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400 font-bold'
                  : ''
              }`}
            >
              <Home size={15} /> Poblado (+1 PV)
              <span className="text-[10px] opacity-75 font-mono ml-0.5">(1M+1A+1T+1O)</span>
            </button>

            <button
              onClick={() => setBuildMode(buildMode === 'city' ? null : 'city')}
              disabled={!canAfford(COSTS.city)}
              className={`btn-action ${
                buildMode === 'city'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400 font-bold'
                  : ''
              }`}
            >
              <Castle size={15} /> Ciudad (+1 PV)
              <span className="text-[10px] opacity-75 font-mono ml-0.5">(2T+3Min)</span>
            </button>

            <button
              onClick={onBuyDevCard}
              disabled={!canAfford(COSTS.devCard) || gameState.devCardsRemaining === 0}
              className="btn-action text-purple-300 border-purple-500/30 hover:border-purple-400"
            >
              <Sparkles size={15} className="text-purple-400" /> Carta Desarrollo
              <span className="text-[10px] opacity-75 font-mono ml-0.5">({gameState.devCardsRemaining})</span>
            </button>

            {!isSpecialBuild && (
              <button
                onClick={onOpenTradeModal}
                className="btn-action text-amber-300 border-amber-500/40 hover:border-amber-400"
              >
                <Handshake size={15} /> Comerciar
              </button>
            )}

            <button
              onClick={onOpenDevCardModal}
              className="btn-action text-indigo-300 border-indigo-500/30"
            >
              📜 Mis Cartas ({myPrivateState?.devCards?.length || 0})
            </button>

            {isMyTurn && !isSpecialBuild && (
              <button
                onClick={onEndTurn}
                className="btn-action bg-red-950/80 hover:bg-red-900 text-red-200 border-red-700/80 font-bold ml-auto"
              >
                <ArrowRight size={15} /> Pasar Turno
              </button>
            )}

            {isSpecialBuild && (
              <button
                onClick={onSkipSpecialBuild}
                className="btn-action bg-slate-800 hover:bg-slate-700 text-slate-300 ml-auto"
              >
                Omitir
              </button>
            )}
          </>
        )}
      </div>

      {/* 3. Mano de Cartas de Recursos (Estilo Cartas Físicas) */}
      <div className="w-full max-w-5xl glass-panel px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-cinzel">
            Tus Recursos ({totalCards}):
          </span>
          {totalCards > 7 && (
            <span className="text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <ShieldAlert size={12} /> ¡Peligro de 7!
            </span>
          )}
        </div>

        {/* Las 5 Cartas de Recursos */}
        <div className="flex items-center gap-2.5">
          {/* Madera */}
          <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-700/70 rounded-xl px-3 py-1.5 shadow-sm">
            <Trees size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-200">Madera</span>
            <span className="font-mono text-sm font-black bg-black/40 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-600/30">
              {resources.wood || 0}
            </span>
          </div>

          {/* Arcilla */}
          <div className="flex items-center gap-2 bg-red-950/80 border border-red-700/70 rounded-xl px-3 py-1.5 shadow-sm">
            <Boxes size={16} className="text-red-400" />
            <span className="text-xs font-bold text-red-200">Arcilla</span>
            <span className="font-mono text-sm font-black bg-black/40 text-red-300 px-2 py-0.5 rounded-lg border border-red-600/30">
              {resources.brick || 0}
            </span>
          </div>

          {/* Oveja */}
          <div className="flex items-center gap-2 bg-lime-950/80 border border-lime-700/70 rounded-xl px-3 py-1.5 shadow-sm">
            <Cloud size={16} className="text-lime-400" />
            <span className="text-xs font-bold text-lime-200">Oveja</span>
            <span className="font-mono text-sm font-black bg-black/40 text-lime-300 px-2 py-0.5 rounded-lg border border-lime-600/30">
              {resources.sheep || 0}
            </span>
          </div>

          {/* Trigo */}
          <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-700/70 rounded-xl px-3 py-1.5 shadow-sm">
            <Wheat size={16} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-200">Trigo</span>
            <span className="font-mono text-sm font-black bg-black/40 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-600/30">
              {resources.wheat || 0}
            </span>
          </div>

          {/* Mineral */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-600/70 rounded-xl px-3 py-1.5 shadow-sm">
            <Mountain size={16} className="text-slate-300" />
            <span className="text-xs font-bold text-slate-200">Mineral</span>
            <span className="font-mono text-sm font-black bg-black/40 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-500/30">
              {resources.ore || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
