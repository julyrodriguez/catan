// src/components/ChatAndLogs.jsx
import React, { useState, useEffect, useRef } from 'react';
import { socketClient } from '../utils/api';
import { ScrollText, MessageSquare, Send, ChevronUp, ChevronDown } from 'lucide-react';

export default function ChatAndLogs({
  logs = [],
  currentUser
}) {
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'chat'
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [showAllChat, setShowAllChat] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsub = socketClient.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg].slice(-50));
      if (activeTab !== 'chat') {
        setHasUnreadChat(true);
      }
    });
    return unsub;
  }, [activeTab]);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      setHasUnreadChat(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, chatMessages, activeTab, showAllChat, showAllLogs]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    socketClient.send('chat', { text: inputMsg });
    setInputMsg('');
  };

  // Mostrar los últimos 5 mensajes/logs por defecto
  const displayedChat = showAllChat ? chatMessages : chatMessages.slice(-5);
  const displayedLogs = showAllLogs ? logs : logs.slice(-5);

  return (
    <div className="glass-panel p-2.5 sm:p-3 flex flex-col h-full w-full min-h-0 overflow-hidden select-none">
      {/* Selector de Pestañas */}
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 mb-2 shrink-0">
        <button
          type="button"
          onClick={() => handleSelectTab('logs')}
          className={`flex-1 py-1 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'logs'
              ? 'bg-amber-500 text-zinc-950 shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ScrollText size={14} /> Historial
        </button>
        <button
          type="button"
          onClick={() => handleSelectTab('chat')}
          className={`relative flex-1 py-1 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'chat'
              ? 'bg-amber-500 text-zinc-950 shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <MessageSquare size={14} /> Chat
          {hasUnreadChat && activeTab !== 'chat' && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute right-2 top-2" />
          )}
        </button>
      </div>

      {/* Contenedor con scroll propio acotado (no expande la pantalla) */}
      <div 
        ref={scrollRef} 
        className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1.5 text-xs select-text overscroll-contain"
      >
        {activeTab === 'logs' ? (
          logs.length === 0 ? (
            <div className="text-center text-zinc-500 py-6">Aún no hay eventos registrados</div>
          ) : (
            <>
              {logs.length > 5 && !showAllLogs && (
                <button
                  type="button"
                  onClick={() => setShowAllLogs(true)}
                  className="w-full text-center py-1 text-[10px] text-amber-400/80 hover:text-amber-300 font-semibold bg-zinc-900/60 hover:bg-zinc-800/80 rounded border border-amber-500/20 transition flex items-center justify-center gap-1 mb-1"
                >
                  <ChevronUp size={12} /> Ver historial anterior ({logs.length - 5})
                </button>
              )}
              {showAllLogs && logs.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllLogs(false)}
                  className="w-full text-center py-1 text-[10px] text-zinc-400 hover:text-zinc-200 font-semibold bg-zinc-900/60 hover:bg-zinc-800/80 rounded border border-zinc-700/40 transition flex items-center justify-center gap-1 mb-1"
                >
                  <ChevronDown size={12} /> Mostrar solo últimos 5
                </button>
              )}
              {displayedLogs.map((log) => (
                <div key={log.id} className="text-zinc-300 leading-snug py-1 border-b border-zinc-900/60 font-medium">
                  {log.text}
                </div>
              ))}
            </>
          )
        ) : (
          chatMessages.length === 0 ? (
            <div className="text-center text-zinc-500 py-6">Envía un mensaje a la mesa</div>
          ) : (
            <>
              {chatMessages.length > 5 && !showAllChat && (
                <button
                  type="button"
                  onClick={() => setShowAllChat(true)}
                  className="w-full text-center py-1 text-[10px] text-amber-400/80 hover:text-amber-300 font-semibold bg-zinc-900/60 hover:bg-zinc-800/80 rounded border border-amber-500/20 transition flex items-center justify-center gap-1 mb-1"
                >
                  <ChevronUp size={12} /> Ver mensajes anteriores ({chatMessages.length - 5})
                </button>
              )}
              {showAllChat && chatMessages.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllChat(false)}
                  className="w-full text-center py-1 text-[10px] text-zinc-400 hover:text-zinc-200 font-semibold bg-zinc-900/60 hover:bg-zinc-800/80 rounded border border-zinc-700/40 transition flex items-center justify-center gap-1 mb-1"
                >
                  <ChevronDown size={12} /> Mostrar solo últimos 5
                </button>
              )}
              {displayedChat.map((m) => (
                <div key={m.id} className="bg-zinc-900/70 p-1.5 rounded-lg border border-zinc-800/80 shadow-sm">
                  <span className="font-bold text-amber-400 mr-1.5">{m.sender}:</span>
                  <span className="text-zinc-200">{m.text}</span>
                </div>
              ))}
            </>
          )
        )}
      </div>

      {/* Input de Envío en Pestaña Chat (fijo abajo) */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSend} className="shrink-0 mt-2 flex gap-1.5 pt-2 border-t border-zinc-800">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Mensaje a la mesa..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 shadow-inner"
          />
          <button type="submit" className="btn-action bg-amber-500 text-zinc-950 px-2.5 py-1 rounded-lg">
            <Send size={13} />
          </button>
        </form>
      )}
    </div>
  );
}
