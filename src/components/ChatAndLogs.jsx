// src/components/ChatAndLogs.jsx
import React, { useState, useEffect, useRef } from 'react';
import { socketClient } from '../utils/api';
import { ScrollText, MessageSquare, Send } from 'lucide-react';

export default function ChatAndLogs({
  logs = [],
  currentUser
}) {
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'chat'
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsub = socketClient.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg].slice(-50));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, chatMessages, activeTab]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    socketClient.send('chat', { text: inputMsg });
    setInputMsg('');
  };

  return (
    <div className="glass-panel p-3 flex flex-col h-full w-full">
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 mb-2">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-1 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'logs'
              ? 'bg-amber-500 text-zinc-950 shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ScrollText size={14} /> Historial
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'chat'
              ? 'bg-amber-500 text-zinc-950 shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <MessageSquare size={14} /> Chat
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
        {activeTab === 'logs' ? (
          logs.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">Aún no hay eventos registrados</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="text-zinc-300 leading-snug py-0.5 border-b border-zinc-900/60 font-medium">
                {log.text}
              </div>
            ))
          )
        ) : (
          chatMessages.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">Envía un mensaje a la mesa</div>
          ) : (
            chatMessages.map((m) => (
              <div key={m.id} className="bg-zinc-900/60 p-1.5 rounded border border-zinc-800/80">
                <span className="font-bold text-amber-400 mr-1">{m.sender}:</span>
                <span className="text-zinc-200">{m.text}</span>
              </div>
            ))
          )
        )}
      </div>

      {activeTab === 'chat' && (
        <form onSubmit={handleSend} className="mt-2 flex gap-1.5 pt-2 border-t border-zinc-800">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Mensaje..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
          />
          <button type="submit" className="btn-action bg-amber-500 text-zinc-950 px-2.5 py-1">
            <Send size={13} />
          </button>
        </form>
      )}
    </div>
  );
}
