// src/components/AuthModal.jsx
import React, { useState } from 'react';
import { api, authStorage } from '../utils/api';
import { User, Mail, Lock, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

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
      <div className="modal-content w-full max-w-md p-6 relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-3xl mb-3 shadow-inner">
            {selectedAvatar}
          </div>
          <h2 className="text-2xl font-bold font-cinzel text-amber-400">
            {isRegister ? 'Registro de Colono' : 'Iniciar Sesión'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isRegister ? 'Crea tu cuenta para guardar estadísticas y jugar' : 'Accede a tus partidas y clasificación'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
            <ShieldAlert size={18} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {isRegister ? 'Nombre de Usuario' : 'Usuario o Correo'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegister ? 'Ej: JulianCatan' : 'Tu usuario o email'}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              <User size={16} className="absolute right-3 top-3 text-slate-500" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
                <Mail size={16} className="absolute right-3 top-3 text-slate-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              <Lock size={16} className="absolute right-3 top-3 text-slate-500" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Elige tu Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`h-10 text-xl rounded-lg border flex items-center justify-center transition ${
                      selectedAvatar === av
                        ? 'bg-amber-500/30 border-amber-400 scale-105'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
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
            className="w-full btn-primary py-3 text-base mt-2"
          >
            {loading ? 'Procesando...' : isRegister ? 'Crear Cuenta' : 'Entrar a Catán'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-amber-400 hover:text-amber-300 font-medium transition"
          >
            {isRegister
              ? '¿Ya tienes cuenta? Inicia sesión aquí'
              : '¿No tienes cuenta? Regístrate aquí'}
          </button>

          <button
            type="button"
            onClick={handleGuest}
            className="text-xs text-slate-400 hover:text-slate-200 transition underline underline-offset-4 mt-1"
          >
            Continuar como Invitado rápido
          </button>
        </div>
      </div>
    </div>
  );
}
