// src/components/TradeModal.jsx
import React, { useState } from 'react';
import { socketClient } from '../utils/api';
import { sounds } from '../utils/soundEffects';
import { Handshake, Building2, Check, X, ArrowRightLeft, Sparkles, Anchor, RefreshCw } from 'lucide-react';
import PlayerAvatar from './PlayerAvatar';

const RESOURCE_META = {
  wood: { name: 'Madera', icon: '🌲', color: '#22c55e', border: '#15803d', bg: 'rgba(34, 197, 94, 0.12)', glow: 'rgba(34, 197, 94, 0.35)' },
  brick: { name: 'Arcilla', icon: '🧱', color: '#f97316', border: '#c2410c', bg: 'rgba(249, 115, 22, 0.12)', glow: 'rgba(249, 115, 22, 0.35)' },
  sheep: { name: 'Lana', icon: '🐑', color: '#84cc16', border: '#65a30d', bg: 'rgba(132, 204, 22, 0.12)', glow: 'rgba(132, 204, 22, 0.35)' },
  wheat: { name: 'Trigo', icon: '🌾', color: '#eab308', border: '#a16207', bg: 'rgba(234, 179, 8, 0.12)', glow: 'rgba(234, 179, 8, 0.35)' },
  ore: { name: 'Mineral', icon: '⛰️', color: '#cbd5e1', border: '#64748b', bg: 'rgba(203, 213, 225, 0.12)', glow: 'rgba(203, 213, 225, 0.35)' }
};

const RESOURCES = Object.entries(RESOURCE_META).map(([id, meta]) => ({
  id,
  ...meta
}));

export default function TradeModal({
  isOpen,
  onClose,
  gameState,
  myPrivateState,
  currentUser
}) {
  const [tradeTab, setTradeTab] = useState('domestic'); // 'domestic' | 'bank'

  // Domestic Trade state
  const [give, setGive] = useState({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
  const [want, setWant] = useState({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });

  // Bank Trade state
  const [bankGive, setBankGive] = useState('wood');
  const [bankGet, setBankGet] = useState('brick');

  if (!isOpen) return null;

  const resources = myPrivateState?.resources || { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 };
  const isMyTurn = gameState.activePlayerId === currentUser?.id;
  const activeTrade = gameState.activeTrade;

  // Determinar mejor ratio para banca/puerto según los asentamientos en puertos
  const getBestRatio = (resource) => {
    let ratio = 4;
    if (!gameState?.board?.vertices) return ratio;
    for (const v of Object.values(gameState.board.vertices)) {
      if (v.building && v.building.playerId === currentUser?.id && v.port) {
        if (v.port.type === '2:1' && v.port.resource === resource) return 2;
        if (v.port.type === '3:1') ratio = Math.min(ratio, 3);
      }
    }
    return ratio;
  };

  const handleProposeDomestic = () => {
    sounds.playTrade();
    socketClient.send('propose_trade', { offer: give, request: want });
  };

  const handleRespondDomestic = (accept) => {
    sounds.playTrade();
    socketClient.send('respond_trade', { accept });
  };

  const handleConfirmDomestic = (partnerId) => {
    sounds.playTrade();
    socketClient.send('execute_trade', { partnerId });
    onClose();
  };

  const handleCancelDomestic = () => {
    socketClient.send('cancel_trade');
  };

  const handleBankTrade = () => {
    sounds.playTrade();
    socketClient.send('trade_bank', {
      giveResource: bankGive,
      getResource: bankGet
    });
  };

  const totalGive = Object.values(give).reduce((a, b) => a + b, 0);
  const totalWant = Object.values(want).reduce((a, b) => a + b, 0);

  const canProposeDomestic = isMyTurn && totalGive > 0 && totalWant > 0 && 
    Object.entries(give).every(([r, count]) => (resources[r] || 0) >= count);

  const requiredBankRatio = getBestRatio(bankGive);
  const canAffordBankTrade = (resources[bankGive] || 0) >= requiredBankRatio && bankGive !== bankGet;

  const resetDomestic = () => {
    setGive({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
    setWant({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content w-full max-w-2xl p-5 sm:p-6 relative select-none">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow">
              <Handshake size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-cinzel text-amber-400 tracking-wide">
                Mercado y Comercio
              </h2>
              <p className="text-[11px] text-zinc-400">
                Intercambia recursos con los colonos o a través de tus puertos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Pestañas de Comercio estilo Colonist */}
        <div className="flex gap-2 p-1 bg-black/60 rounded-xl border border-zinc-800/80 mb-5">
          <button
            onClick={() => setTradeTab('domestic')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
              tradeTab === 'domestic'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Handshake size={16} /> Con Otros Colonos
          </button>
          <button
            onClick={() => setTradeTab('bank')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
              tradeTab === 'bank'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Building2 size={16} /> Banca y Puertos Marítimos
          </button>
        </div>

        {/* TAB 1: COMERCIO CON JUGADORES */}
        {tradeTab === 'domestic' && (
          <div className="space-y-4">
            {/* Si ya hay un trato activo en la mesa */}
            {activeTrade ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-amber-500/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Propuesto por:</span>
                    <span className="text-sm font-bold text-amber-300 font-cinzel">
                      {gameState.players.find(p => p.id === activeTrade.fromPlayerId)?.username}
                    </span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    Trato en la mesa
                  </span>
                </div>

                {/* Resumen visual de la oferta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Entrega */}
                  <div className="bg-zinc-900/90 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block">
                      Entrega:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(activeTrade.offer)
                        .filter(([, c]) => c > 0)
                        .map(([r, c]) => {
                          const meta = RESOURCE_META[r];
                          return (
                            <span
                              key={r}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
                              style={{
                                backgroundColor: meta.bg,
                                borderColor: meta.border,
                                color: meta.color
                              }}
                            >
                              <span>{meta.icon}</span>
                              <span>{c}x {meta.name}</span>
                            </span>
                          );
                        })}
                    </div>
                  </div>

                  {/* Pide a cambio */}
                  <div className="bg-zinc-900/90 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">
                      Pide a cambio:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(activeTrade.request)
                        .filter(([, c]) => c > 0)
                        .map(([r, c]) => {
                          const meta = RESOURCE_META[r];
                          return (
                            <span
                              key={r}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
                              style={{
                                backgroundColor: meta.bg,
                                borderColor: meta.border,
                                color: meta.color
                              }}
                            >
                              <span>{meta.icon}</span>
                              <span>{c}x {meta.name}</span>
                            </span>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* SI YO SOY EL PROPONENTE */}
                {activeTrade.fromPlayerId === currentUser?.id ? (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs text-zinc-400 font-semibold block">
                      Respuestas de los colonos:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {gameState.players
                        .filter(p => p.id !== currentUser?.id)
                        .map(p => {
                          const resp = activeTrade.responses[p.id];
                          return (
                            <div
                              key={p.id}
                              className="flex items-center justify-between bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <PlayerAvatar
                                  isBot={p.isBot}
                                  isHost={p.isHost}
                                  color={p.color}
                                  size={24}
                                />
                                <span className="font-bold text-white">{p.username}</span>
                              </div>

                              {resp === 'accept' ? (
                                <button
                                  onClick={() => handleConfirmDomestic(p.id)}
                                  className="btn-action bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] py-1 px-3 shadow"
                                >
                                  ¡Aceptar e Intercambiar!
                                </button>
                              ) : resp === 'reject' ? (
                                <span className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                                  <X size={13} /> Rechazó
                                </span>
                              ) : (
                                <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                                  <span className="animate-spin text-amber-400">⏳</span> Pensando...
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    <button
                      onClick={handleCancelDomestic}
                      className="btn-secondary text-xs w-full py-2.5 mt-2 text-zinc-300 hover:text-white"
                    >
                      Cancelar Propuesta
                    </button>
                  </div>
                ) : (
                  // SI YO SOY UN RECEPTOR
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleRespondDomestic(true)}
                      className="btn-primary flex-1 py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 rounded-xl"
                    >
                      <Check size={18} /> Aceptar Oferta
                    </button>
                    <button
                      onClick={() => handleRespondDomestic(false)}
                      className="btn-secondary flex-1 py-3 text-xs sm:text-sm font-bold text-red-300 hover:bg-red-950/40 rounded-xl"
                    >
                      <X size={18} /> Rechazar
                    </button>
                  </div>
                )}
              </div>
            ) : isMyTurn ? (
              // CONFIGURAR NUEVA PROPUESTA
              <div className="space-y-4">
                {/* 1. SECCIÓN OFRECES */}
                <div className="p-3 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>1. LO QUE ENTREGAS</span>
                      <span className="text-[10px] text-zinc-400 font-normal">
                        ({totalGive} cartas seleccionadas)
                      </span>
                    </label>
                    {totalGive > 0 && (
                      <button
                        onClick={() => setGive({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 })}
                        className="text-[10px] text-zinc-400 hover:text-red-400 font-semibold transition"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {RESOURCES.map((r) => {
                      const count = give[r.id];
                      const available = resources[r.id] || 0;
                      const isSelected = count > 0;

                      return (
                        <div
                          key={r.id}
                          className={`p-2 rounded-xl border flex flex-col justify-between items-center transition relative ${
                            isSelected
                              ? 'bg-zinc-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                              : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <div className="text-xl leading-none mb-1">{r.icon}</div>
                          <div className="text-[11px] font-bold text-zinc-200 truncate">{r.name}</div>
                          <div className="text-[9px] text-zinc-400 mb-1.5">Tienes: {available}</div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setGive({ ...give, [r.id]: Math.max(0, count - 1) })}
                              className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 flex items-center justify-center transition"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs font-black w-4 text-center text-white">
                              {count}
                            </span>
                            <button
                              type="button"
                              disabled={count >= available}
                              onClick={() => setGive({ ...give, [r.id]: count + 1 })}
                              className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-xs font-bold text-zinc-200 flex items-center justify-center transition"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Flecha divisoria de intercambio */}
                <div className="flex items-center justify-center">
                  <div className="bg-zinc-900 border border-zinc-700 px-4 py-1 rounded-full text-[11px] font-bold text-amber-400 flex items-center gap-2 shadow-inner">
                    <ArrowRightLeft size={13} />
                    <span>Ofreces {totalGive} ➔ Pides {totalWant}</span>
                  </div>
                </div>

                {/* 2. SECCIÓN PIDES */}
                <div className="p-3 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>2. LO QUE PIDES A CAMBIO</span>
                      <span className="text-[10px] text-zinc-400 font-normal">
                        ({totalWant} cartas deseadas)
                      </span>
                    </label>
                    {totalWant > 0 && (
                      <button
                        onClick={() => setWant({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 })}
                        className="text-[10px] text-zinc-400 hover:text-red-400 font-semibold transition"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {RESOURCES.map((r) => {
                      const count = want[r.id];
                      const isSelected = count > 0;

                      return (
                        <div
                          key={r.id}
                          className={`p-2 rounded-xl border flex flex-col justify-between items-center transition relative ${
                            isSelected
                              ? 'bg-zinc-900 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                              : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <div className="text-xl leading-none mb-1">{r.icon}</div>
                          <div className="text-[11px] font-bold text-zinc-200 truncate">{r.name}</div>
                          <div className="text-[9px] text-zinc-500 mb-1.5">Pedir</div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setWant({ ...want, [r.id]: Math.max(0, count - 1) })}
                              className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 flex items-center justify-center transition"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs font-black w-4 text-center text-white">
                              {count}
                            </span>
                            <button
                              type="button"
                              onClick={() => setWant({ ...want, [r.id]: count + 1 })}
                              className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 flex items-center justify-center transition"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Botón de Enviar Trato */}
                <button
                  onClick={handleProposeDomestic}
                  disabled={!canProposeDomestic}
                  className="btn-primary w-full py-3 text-sm font-black shadow-xl disabled:opacity-40 flex items-center justify-center gap-2 rounded-xl"
                >
                  <Handshake size={18} />
                  <span>Proponer Trato a Todos los Colonos ({totalGive} ➔ {totalWant})</span>
                </button>
              </div>
            ) : (
              <div className="text-center text-zinc-400 py-10 text-xs bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                Solo el jugador activo ({gameState.players[gameState.currentTurnIndex]?.username}) puede iniciar una propuesta de comercio en su turno.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BANCA Y PUERTOS MARÍTIMOS (Diseño con Tarjetas Visuales Colonist) */}
        {tradeTab === 'bank' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* COLUMNA 1: LO QUE ENTREGAS */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    <Anchor size={14} className="text-amber-400" />
                    <span>1. Elige lo que entregas</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    Ratio: {requiredBankRatio}:1
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {RESOURCES.map((r) => {
                    const ratio = getBestRatio(r.id);
                    const stock = resources[r.id] || 0;
                    const canAffordThis = stock >= ratio;
                    const isSelected = bankGive === r.id;

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setBankGive(r.id);
                          if (bankGet === r.id) {
                            const other = RESOURCES.find(x => x.id !== r.id);
                            if (other) setBankGet(other.id);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-500/40 shadow-md'
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{r.icon}</span>
                          <div>
                            <span className="font-bold text-xs text-white block">{r.name}</span>
                            <span className="text-[10px] text-zinc-400">
                              Tienes: <strong className={canAffordThis ? 'text-emerald-400' : 'text-zinc-500'}>{stock}</strong> en mano
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-lg border ${
                            ratio === 2
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                              : ratio === 3
                              ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}>
                            {ratio}:1 {ratio === 2 ? '🚢' : ratio === 3 ? '⚓' : '🏦'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* COLUMNA 2: LO QUE RECIBES */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={14} />
                    <span>2. Elige lo que recibes (1x)</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">1 unidad</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {RESOURCES.filter(r => r.id !== bankGive).map((r) => {
                    const isSelected = bankGet === r.id;

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setBankGet(r.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/40 shadow-md'
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{r.icon}</span>
                          <div>
                            <span className="font-bold text-xs text-white block">{r.name}</span>
                            <span className="text-[10px] text-zinc-400">
                              Tienes: {resources[r.id] || 0}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-zinc-950 font-black shadow">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Banner visual del intercambio */}
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">{RESOURCE_META[bankGive]?.icon}</span>
                <span className="font-bold text-white">
                  Entregas {requiredBankRatio}x {RESOURCE_META[bankGive]?.name}
                </span>
              </div>

              <ArrowRightLeft size={16} className="text-amber-400" />

              <div className="flex items-center gap-2">
                <span className="text-lg">{RESOURCE_META[bankGet]?.icon}</span>
                <span className="font-bold text-emerald-400">
                  Recibes 1x {RESOURCE_META[bankGet]?.name}
                </span>
              </div>
            </div>

            {/* Botón de Ejecutar Intercambio con la Banca */}
            <button
              onClick={handleBankTrade}
              disabled={!canAffordBankTrade || !isMyTurn}
              className="btn-primary w-full py-3.5 text-sm font-black shadow-xl disabled:opacity-35 flex items-center justify-center gap-2 rounded-xl"
            >
              <RefreshCw size={17} />
              <span>
                {canAffordBankTrade
                  ? `Comerciar: Entregar ${requiredBankRatio} ${RESOURCE_META[bankGive]?.name} por 1 ${RESOURCE_META[bankGet]?.name}`
                  : `Te faltan recursos (Necesitas ${requiredBankRatio} de ${RESOURCE_META[bankGive]?.name})`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
