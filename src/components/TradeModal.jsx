// src/components/TradeModal.jsx
import React, { useState } from 'react';
import { socketClient } from '../utils/api';
import { sounds } from '../utils/soundEffects';
import { Handshake, Building2, Check, X, ArrowRightLeft } from 'lucide-react';

const RESOURCES = [
  { id: 'wood', name: 'Madera', icon: '🌲' },
  { id: 'brick', name: 'Arcilla', icon: '🧱' },
  { id: 'sheep', name: 'Oveja', icon: '🐑' },
  { id: 'wheat', name: 'Trigo', icon: '🌾' },
  { id: 'ore', name: 'Mineral', icon: '⛰️' }
];

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

  // Determinar mejor ratio para banca/puerto
  const getBestRatio = (resource) => {
    let ratio = 4;
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

  const requiredBankRatio = getBestRatio(bankGive);
  const canAffordBankTrade = (resources[bankGive] || 0) >= requiredBankRatio && bankGive !== bankGet;

  return (
    <div className="modal-backdrop">
      <div className="modal-content w-full max-w-xl p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
          <h2 className="text-xl font-bold font-cinzel text-amber-400 flex items-center gap-2">
            <Handshake size={22} /> Mercado y Comercio
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pestañas de Comercio */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTradeTab('domestic')}
            className={`flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 border transition ${
              tradeTab === 'domestic'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Handshake size={15} /> Con Otros Colonos
          </button>
          <button
            onClick={() => setTradeTab('bank')}
            className={`flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 border transition ${
              tradeTab === 'bank'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building2 size={15} /> Banca y Puertos
          </button>
        </div>

        {/* Tab 1: Comercio Doméstico */}
        {tradeTab === 'domestic' && (
          <div className="space-y-5">
            {/* Si ya hay un trato activo en la mesa */}
            {activeTrade ? (
              <div className="glass-card p-4 border-amber-500/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Trato propuesto por:</span>
                  <span className="text-xs font-bold text-amber-300">
                    {gameState.players.find(p => p.id === activeTrade.fromPlayerId)?.username}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="block text-slate-400 font-semibold mb-1">Ofrece:</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(activeTrade.offer)
                        .filter(([, c]) => c > 0)
                        .map(([r, c]) => (
                          <span key={r} className="bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded font-bold">
                            {c} {r}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="block text-slate-400 font-semibold mb-1">A cambio de:</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(activeTrade.request)
                        .filter(([, c]) => c > 0)
                        .map(([r, c]) => (
                          <span key={r} className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded font-bold">
                            {c} {r}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Si yo soy el proponente */}
                {activeTrade.fromPlayerId === currentUser?.id ? (
                  <div className="space-y-3">
                    <span className="text-xs text-slate-400 block font-semibold">
                      Respuestas de otros jugadores:
                    </span>
                    <div className="space-y-2">
                      {gameState.players
                        .filter(p => p.id !== currentUser?.id)
                        .map(p => {
                          const resp = activeTrade.responses[p.id];
                          return (
                            <div key={p.id} className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg text-xs">
                              <span className="font-bold text-white">{p.username}</span>
                              {resp === 'accept' ? (
                                <button
                                  onClick={() => handleConfirmDomestic(p.id)}
                                  className="btn-action bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] py-1 px-3"
                                >
                                  ¡Aceptar e Intercambiar!
                                </button>
                              ) : resp === 'reject' ? (
                                <span className="text-red-400 font-semibold">Rechazó</span>
                              ) : (
                                <span className="text-slate-500">Esperando respuesta...</span>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    <button
                      onClick={handleCancelDomestic}
                      className="btn-secondary text-xs w-full py-2 mt-2"
                    >
                      Cancelar Propuesta
                    </button>
                  </div>
                ) : (
                  // Si yo soy un receptor del trato
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRespondDomestic(true)}
                      className="btn-primary flex-1 py-2.5 text-xs font-bold"
                    >
                      <Check size={16} /> Aceptar Oferta
                    </button>
                    <button
                      onClick={() => handleRespondDomestic(false)}
                      className="btn-secondary flex-1 py-2.5 text-xs font-bold text-red-300 hover:bg-red-900/40"
                    >
                      <X size={16} /> Rechazar
                    </button>
                  </div>
                )}
              </div>
            ) : isMyTurn ? (
              // Configurar nueva propuesta
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    1. ¿Qué ofreces entregar?
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {RESOURCES.map((r) => (
                      <div key={r.id} className="bg-slate-900/80 p-2 rounded-lg text-center border border-slate-800">
                        <div className="text-xl">{r.icon}</div>
                        <div className="text-[11px] text-slate-300 font-semibold">{r.name}</div>
                        <div className="text-[10px] text-slate-500 mb-1">Tienes: {resources[r.id] || 0}</div>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setGive({ ...give, [r.id]: Math.max(0, give[r.id] - 1) })}
                            className="w-5 h-5 rounded bg-slate-800 text-xs font-bold text-slate-300"
                          >
                            -
                          </button>
                          <span className="font-mono text-sm font-bold w-4">{give[r.id]}</span>
                          <button
                            type="button"
                            disabled={give[r.id] >= (resources[r.id] || 0)}
                            onClick={() => setGive({ ...give, [r.id]: give[r.id] + 1 })}
                            className="w-5 h-5 rounded bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                    2. ¿Qué deseas recibir?
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {RESOURCES.map((r) => (
                      <div key={r.id} className="bg-slate-900/80 p-2 rounded-lg text-center border border-slate-800">
                        <div className="text-xl">{r.icon}</div>
                        <div className="text-[11px] text-slate-300 font-semibold">{r.name}</div>
                        <div className="flex items-center justify-center gap-1 mt-3">
                          <button
                            type="button"
                            onClick={() => setWant({ ...want, [r.id]: Math.max(0, want[r.id] - 1) })}
                            className="w-5 h-5 rounded bg-slate-800 text-xs font-bold text-slate-300"
                          >
                            -
                          </button>
                          <span className="font-mono text-sm font-bold w-4">{want[r.id]}</span>
                          <button
                            type="button"
                            onClick={() => setWant({ ...want, [r.id]: want[r.id] + 1 })}
                            className="w-5 h-5 rounded bg-slate-800 text-xs font-bold text-slate-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleProposeDomestic}
                  className="btn-primary w-full py-3 text-sm font-bold shadow-lg"
                >
                  <ArrowRightLeft size={16} /> Enviar Propuesta a Todos los Jugadores
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8 text-xs">
                Solo el jugador activo ({gameState.players[gameState.currentTurnIndex]?.username}) puede iniciar una propuesta de comercio en su turno.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Banca y Puertos */}
        {tradeTab === 'bank' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Entregas ({requiredBankRatio}:1)
                </label>
                <select
                  value={bankGive}
                  onChange={(e) => setBankGive(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-semibold"
                >
                  {RESOURCES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.icon} {r.name} (Ratio: {getBestRatio(r.id)}:1) • Tienes: {resources[r.id] || 0}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-amber-400 block">
                  Necesitas {requiredBankRatio} de {bankGive} por cada recurso que recibas.
                </span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Recibes (1 unidad)
                </label>
                <select
                  value={bankGet}
                  onChange={(e) => setBankGet(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-semibold"
                >
                  {RESOURCES.filter(r => r.id !== bankGive).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.icon} {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleBankTrade}
              disabled={!canAffordBankTrade || !isMyTurn}
              className="btn-primary w-full py-3 text-sm font-bold shadow-lg disabled:opacity-40"
            >
              Intercambiar con la Banca / Puerto ({requiredBankRatio} {bankGive} ➔ 1 {bankGet})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
