// src/components/PlayerAvatar.jsx
import React from 'react';
import { Bot, User, Crown, Shield, Sword } from 'lucide-react';

export default function PlayerAvatar({ 
  avatar, 
  isBot = false, 
  isHost = false, 
  color = '#f59e0b', 
  size = 32, 
  className = '' 
}) {
  const iconSize = Math.max(13, Math.round(size * 0.55));

  const renderIcon = () => {
    if (isBot) {
      return <Bot size={iconSize} className="text-cyan-300" />;
    }
    if (isHost) {
      return <Crown size={iconSize} className="text-amber-400" />;
    }
    return <User size={iconSize} className="text-slate-200" />;
  };

  return (
    <div
      className={`rounded-xl flex items-center justify-center shadow-md shrink-0 border select-none transition ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderColor: color || '#f59e0b',
        backgroundColor: '#0a0f1d'
      }}
      title={isBot ? 'Bot' : (isHost ? 'Anfitrión' : 'Colono')}
    >
      {renderIcon()}
    </div>
  );
}
