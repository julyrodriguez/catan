// src/components/DevCardModal.jsx
import React, { useState } from 'react';
import { socketClient } from '../utils/api';
import { sounds } from '../utils/soundEffects';
import { Sparkles, Sword, Trophy, Compass, Coins, X } from 'lucide-react';

const RESOURCES = [
  { id: 'wood', name: 'Madera', icon: '🌲' },
  { id: 'brick', name: 'Arcilla', icon: '🧱' },
  { id: 'sheep', name: 'Oveja', icon: '🐑' },
  { id: 'wheat', name: 'Trigo', icon: '🌾' },
  { id: 'ore', name: 'Mineral', icon: '⛰️' }
];

const CARD_INFO = {
  knight: {
    name: 'Caballero',
    icon: <Sword size={20} className="text-red-400" />,
    desc: 'Mueve al ladrón a cualquier hexágono y roba 1 recurso a un rival. 3 o más caballeros otorgan el Gran Ejército (2 PV).'
  },
  victory_point: {
    name: 'Punto de Victoria',
    icon: <Trophy size={20} className="text-amber-400" />,
    desc: 'Otorga 1 Punto de Victoria secreto. Se revela automáticamente al alcanzar los 10 PV para ganar.'
  },
  road_building: {
    name: 'Construcción de Carreteras',
    icon: <Compass size={20} className="text-emerald-400" />,
    desc: 'Te permite colocar 2 carreteras inmediatamente sin costo de recursos.'
  },
  year_of_plenty: {
    name: 'Año de la Abundancia',
    icon: <Sparkles size={20} className="text-purple-400" />,
    desc: 'Toma 2 cartas de cualquier recurso directamente de la banca.'
  },
  monopoly: {
    name: 'Monopolio',
    icon: <Coins size={20} className="text-yellow-400" />,
    desc: 'Elige un tipo de recurso. Todos los demás jugadores deben entregarte todas las cartas de ese recurso que tengan en mano.'
  }
};

export default function DevCardModal({
  isOpen,
  onClose,
  gameState,
  myPrivateState,
  currentUser
}) {
  const [selectedCard, setSelectedCard] = useState(null);

  // Parámetros para cartas especiales
  const [monopolyResource, setMonopolyResource] = useState('wheat');
  const [yopR1, setYopR1] = useState('wheat');
  const [yopR2, setYopR2] = useState('ore');

  if (!isOpen) return null;

  const isMyTurn = gameState.activePlayerId === currentUser?.id;
  const devCards = myPrivateState?.devCards || [];
  const currentTurn = gameState.turnCount;

  const handlePlayCard = (cardType) => {
    let params = {};
    if (cardType === 'monopoly') {
      params = { resource: monopolyResource };
    } else if (cardType === 'year_of_plenty') {
      params = { r1: yopR1, r2: yopR2 };
    }

    sounds.playCardDraw();
    socketClient.send('play_dev_card', { cardType, params });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content w-full max-w-lg p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h2 className="text-xl font-bold font-cinzel text-amber-400 flex items-center gap-2">
            <Sparkles size={20} /> Cartas de Desarrollo
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {devCards.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-sm">
            <Sparkles size={32} className="mx-auto mb-2 text-zinc-600" />
            No tienes cartas de desarrollo en mano. Puedes comprar una en tu turno por 1 Oveja, 1 Trigo y 1 Mineral.
          </div>
        ) : (
          <div className="space-y-3">
            {devCards.map((card, idx) => {
              const info = CARD_INFO[card.type] || { name: card.type, desc: '', icon: null };
              const isBoughtThisTurn = card.turnBought >= currentTurn;
              const canPlay = isMyTurn && !isBoughtThisTurn && card.type !== 'victory_point';

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-zinc-700/80 bg-zinc-900/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 font-bold text-sm text-white">
                      {info.icon}
                      <span>{info.name}</span>
                    </div>

                    {isBoughtThisTurn && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
                        Comprada este turno
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{info.desc}</p>

                  {/* Configuración de Monopolio */}
                  {card.type === 'monopoly' && canPlay && (
                    <div className="flex items-center gap-2 pt-2 text-xs">
                      <span className="text-zinc-300">Recurso a monopolizar:</span>
                      <select
                        value={monopolyResource}
                        onChange={(e) => setMonopolyResource(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white font-semibold"
                      >
                        {RESOURCES.map(r => (
                          <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Configuración de Año de la Abundancia */}
                  {card.type === 'year_of_plenty' && canPlay && (
                    <div className="flex items-center gap-2 pt-2 text-xs">
                      <span className="text-zinc-300">Elige 2 recursos:</span>
                      <select
                        value={yopR1}
                        onChange={(e) => setYopR1(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white font-semibold"
                      >
                        {RESOURCES.map(r => (
                          <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                        ))}
                      </select>
                      <select
                        value={yopR2}
                        onChange={(e) => setYopR2(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white font-semibold"
                      >
                        {RESOURCES.map(r => (
                          <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {canPlay && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handlePlayCard(card.type)}
                        className="btn-action bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold text-xs py-1.5 px-4"
                      >
                        Jugar Carta
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
