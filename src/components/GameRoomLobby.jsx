// src/components/GameRoomLobby.jsx
import React, { useState } from 'react';
import { socketClient } from '../utils/api';
import { 
  Users, Bot, Play, CheckCircle, Clock, Shield, 
  Crown, ArrowLeft, Send, MessageSquare 
} from 'lucide-react';

const COLORS = [
  { id: '#EF4444', name: 'Rojo' },
  { id: '#3B82F6', name: 'Azul' },
  { id: '#F97316', name: 'Naranja' },
  { id: '#FFFFFF', name: 'Blanco' },
  { id: '#10B981', name: 'Verde' },
  { id: '#8B5CF6', name: 'Púrpura' }
];

export default function GameRoomLobby({ gameState, currentUser, onLeaveRoom }) {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  React.useEffect(() => {
    const unsub = socketClient.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg].slice(-40));
    });
    return unsub;
  }, []);

  const isHost = gameState.players.find(p => p.id === currentUser?.id)?.isHost;
  const myPlayer = gameState.players.find(p => p.id === currentUser?.id);
  const canStart = isHost && gameState.players.length >= 2;

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketClient.send('chat', { text: chatInput });
    setChatInput('');
  };

  const handleToggleReady = () => {
    socketClient.send('toggle_ready');
  };

  const handleSetColor = (color) => {
    socketClient.send('set_color', { color });
  };

  const handleAddBot = () => {
    socketClient.send('add_bot');
  };

  const handleStartGame = () => {
    socketClient.send('start_game');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between glass-panel p-4">
        <button
          onClick={onLeaveRoom}
          className="btn-secondary text-sm py-2 px-3"
        >
          <ArrowLeft size={16} /> Salir al Menú
        </button>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-amber-400">
            {gameState.title}
          </h2>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-400 mt-0.5">
            <span>
              Código de Sala:{' '}
              <strong className="text-amber-300 font-mono text-sm tracking-wider">
                {gameState.roomCode}
              </strong>
            </span>
            <span>•</span>
            <span className="capitalize">
              {gameState.mapType === 'extended' ? 'Extensión (Hasta 6P)' : 'Estándar (Hasta 4P)'}
            </span>
            <span>•</span>
            <span>{gameState.targetPoints} Puntos</span>
          </div>
        </div>

        <div className="w-24 text-right">
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
            {gameState.players.length} / {gameState.maxPlayers} Jugadores
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white font-cinzel flex items-center gap-2">
                <Users size={18} className="text-amber-400" /> Colonos en la Sala
              </h3>

              {isHost && gameState.players.length < gameState.maxPlayers && (
                <button
                  onClick={handleAddBot}
                  className="btn-action bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30 text-xs py-1 px-3"
                >
                  <Bot size={15} /> + Agregar Bot IA
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gameState.players.map((p, index) => {
                const isMe = p.id === currentUser?.id;
                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border transition flex items-center justify-between"
                    style={{
                      borderColor: p.color,
                      backgroundColor: `${p.color}15`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md border-2"
                        style={{
                          borderColor: p.color,
                          backgroundColor: '#0f172a'
                        }}
                      >
                        {p.avatar || (p.isBot ? '🤖' : '🧑‍🌾')}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span>{p.username}</span>
                          {p.isHost && <Crown size={14} className="text-amber-400" title="Anfitrión" />}
                          {p.isBot && <Bot size={14} className="text-slate-400" title="Bot" />}
                          {isMe && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                              Tú
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {p.isReady ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle size={12} /> Listo para zarpar
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock size={12} /> Esperando...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className="w-4 h-4 rounded-full border border-white/40 shadow-inner"
                      style={{ backgroundColor: p.color }}
                      title="Color del jugador"
                    />
                  </div>
                );
              })}

              {/* Empty Slots */}
              {Array.from({ length: gameState.maxPlayers - gameState.players.length }).map((_, i) => (
                <div
                  key={`empty_${i}`}
                  className="p-3.5 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 flex items-center justify-center text-slate-600 text-xs font-semibold"
                >
                  Slot disponible para colono
                </div>
              ))}
            </div>

            {/* My Controls: Color Picker & Ready */}
            {myPlayer && (
              <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Tu Color de Piezas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => {
                      const isTaken = gameState.players.some(
                        p => p.color === c.id && p.id !== myPlayer.id
                      );
                      const isSelected = myPlayer.color === c.id;
                      return (
                        <button
                          key={c.id}
                          disabled={isTaken}
                          onClick={() => handleSetColor(c.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                            isSelected
                              ? 'border-white ring-2 ring-amber-400 scale-105'
                              : isTaken
                              ? 'opacity-30 cursor-not-allowed border-slate-800'
                              : 'border-slate-700 hover:border-slate-500'
                          }`}
                          style={{
                            backgroundColor: isSelected ? c.id : '#1e293b',
                            color: isSelected && c.id === '#FFFFFF' ? '#000' : '#fff'
                          }}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: c.id }}
                          />
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleToggleReady}
                    className={`btn-action py-2.5 px-6 font-bold text-sm ${
                      myPlayer.isReady
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    <CheckCircle size={17} />
                    {myPlayer.isReady ? '¡Listo! (Cancelar)' : 'Confirmar Listo'}
                  </button>

                  {isHost && (
                    <button
                      disabled={!canStart}
                      onClick={handleStartGame}
                      className="btn-primary py-2.5 px-8 text-base shadow-lg"
                    >
                      <Play size={18} fill="currentColor" /> Comenzar Partida
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* In-Room Chat (1 col) */}
        <div className="glass-panel p-4 flex flex-col h-96">
          <h3 className="font-bold text-sm text-white font-cinzel mb-3 flex items-center gap-2 pb-2 border-b border-slate-800">
            <MessageSquare size={16} className="text-amber-400" /> Chat de la Sala
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 p-1 text-xs">
            {chatMessages.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                Saluda a tus compañeros de expedición
              </div>
            ) : (
              chatMessages.map((m) => (
                <div key={m.id} className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="font-bold text-amber-400 mr-1.5">{m.sender}:</span>
                  <span className="text-slate-200">{m.text}</span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button type="submit" className="btn-action bg-amber-500 text-slate-950 px-3 py-1.5">
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
