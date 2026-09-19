// src/components/AuthModal.jsx
import React, { useState } from 'react';
import { api, authStorage } from '../utils/api';
import { User, Mail, Lock, Sparkles, ShieldAlert, X, Compass } from 'lucide-react';

const AVATARS = ['🦁', '🦅', '🐺', '🦊', '🐉', '⚔️', '👑', '🧙‍♂️', '🌲', '🚢', '🌾', '🐎'];

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await api.register(username, email, password, selectedAvatar);
      } else {
        res = await api.login(username || email, password);
      }
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    const guestUser = {
      id: `guest_${Math.random().toString(36).substring(2, 8)}`,
      username: `Colono_${Math.floor(Math.random() * 900 + 100)}`,
      avatar: selectedAvatar,
      isGuest: true
    };
    authStorage.setUser(guestUser);
    onAuthSuccess(guestUser);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content w-full max-w-md p-6 sm:p-7 relative border-amber-500/30">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 text-3xl mb-3 shadow-lg border border-yellow-300/40">
            {selectedAvatar}
          </div>
          <h2 className="text-2xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-wide">
            {isRegister ? 'Registro de Colono' : 'Iniciar Sesión'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRegister ? 'Crea tu perfil para registrar victorias y participar en torneos' : 'Ingresa a tus partidas y compite por el Salón de la Fama'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              {isRegister ? 'Nombre de Colono' : 'Usuario o Correo'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegister ? 'Ej: Julian_Catán' : 'Tu usuario o correo'}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
              />
              <User size={16} className="absolute right-3.5 top-3 text-slate-500" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
                />
                <Mail size={16} className="absolute right-3.5 top-3 text-slate-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
              />
              <Lock size={16} className="absolute right-3.5 top-3 text-slate-500" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Escoge tu Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`h-11 text-xl rounded-xl border flex items-center justify-center transition ${
                      selectedAvatar === av
                        ? 'bg-amber-500/25 border-amber-400 scale-105 shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-sm font-bold shadow-xl mt-3"
          >
            {loading ? 'Procesando...' : isRegister ? 'Crear Cuenta y Zarpar' : 'Entrar a la Isla'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col gap-2.5 text-center text-xs">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-amber-400 hover:text-amber-300 font-bold transition"
          >
            {isRegister
              ? '¿Ya tienes cuenta? Inicia sesión aquí'
              : '¿No tienes cuenta? Regístrate en 10 segundos'}
          </button>

          <button
            type="button"
            onClick={handleGuest}
            className="text-slate-400 hover:text-slate-200 transition underline underline-offset-4 mt-0.5"
          >
            O entra rápidamente como Invitado
          </button>
        </div>
      </div>
    </div>
  );
}
