// src/components/LobbyBrowser.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Users, PlusCircle, Trophy, BookOpen, 
  Play, Shield, Clock, Compass, LogIn, LogOut,
  Sparkles, Layers, Crown, ArrowRight, CheckCircle2,
  MapPin, Flame
} from 'lucide-react';

export default function LobbyBrowser({ user, onOpenAuth, onLogout, onJoinRoom }) {
  const [rooms, setRooms] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'leaderboard' | 'rules'
  
  // Modal de Crear Sala
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');
  const [mapType, setMapType] = useState('classic'); // 'classic' (4p) | 'extended' (6p)
  const [targetPoints, setTargetPoints] = useState(10);
  const [turnTimeLimit, setTurnTimeLimit] = useState(60);
  const [creating, setCreating] = useState(false);

  // Unirse por código directo
  const [directCode, setDirectCode] = useState('');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await api.getRooms();
      setRooms(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaderboard(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchLeaderboard();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    setCreating(true);
    try {
      const res = await api.createRoom({
        title: roomTitle || `Isla de ${user.username}`,
        mapType,
        targetPoints: Number(targetPoints),
        turnTimeLimit: Number(turnTimeLimit),
        hostUser: user
      });
      setShowCreateModal(false);
      onJoinRoom(res.roomCode);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header con Emblema Dorado */}
      <header className="glass-panel p-5 sm:p-6 border-amber-500/25 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        {/* Resplandor de fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          {/* Emblema Hexagonal de Catán en SVG */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg border border-amber-300/40 shrink-0">
            <svg viewBox="0 0 100 100" className="w-9 h-9 fill-slate-950">
              <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" stroke="#fef08a" strokeWidth="6" />
              <path d="M50,22 L50,78 M35,38 L65,38 M30,52 L70,52 M35,66 L65,66" stroke="#fef08a" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-wider">
                COLONOS DE CATÁN
              </h1>
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                ONLINE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Juego de mesa multijugador en tiempo real • Mapas para 4 y hasta 6 Jugadores
            </p>
          </div>
        </div>

        {/* User Card o Botón de Ingreso */}
        <div className="flex items-center gap-3 relative z-10">
          {user ? (
            <div className="flex items-center gap-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-md">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-lg font-bold text-slate-950 border border-yellow-300 shadow">
                {user.avatar || '🧑‍🌾'}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                  <span>{user.username}</span>
                  {user.isGuest && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 rounded">Invitado</span>
                  )}
                </div>
                <div className="text-xs text-amber-400 font-semibold mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Trophy size={12} /> {user.stats?.gamesWon || 0} victorias
                  </span>
                  <span>•</span>
                  <span>{user.stats?.gamesPlayed || 0} jugadas</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition ml-1"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary shadow-lg">
              <LogIn size={18} /> Iniciar Sesión / Registro
            </button>
          )}
        </div>
      </header>

      {/* Barra de Navegación y Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Pestañas */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              activeTab === 'rooms'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass size={17} /> Salas de Juego
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy size={17} /> Salón de la Fama
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              activeTab === 'rules'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen size={17} /> Reglamento
          </button>
        </div>

        {/* Input de Código Directo y Botón Crear */}
        {activeTab === 'rooms' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
              <input
                type="text"
                maxLength={6}
                placeholder="CÓDIGO"
                value={directCode}
                onChange={(e) => setDirectCode(e.target.value.toUpperCase())}
                className="bg-transparent text-sm w-20 text-center font-mono font-bold tracking-widest text-amber-400 placeholder-slate-600 focus:outline-none"
              />
              <button
                disabled={!directCode.trim()}
                onClick={() => onJoinRoom(directCode.trim())}
                className="btn-action bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold px-3 py-1 text-xs"
              >
                Unirse
              </button>
            </div>

            <button
              onClick={() => {
                if (!user) onOpenAuth();
                else setShowCreateModal(true);
              }}
              className="btn-primary"
            >
              <PlusCircle size={18} /> Crear Partida
            </button>
          </div>
        )}
      </div>

      {/* 1. Vista de Salas Disponibles */}
      {activeTab === 'rooms' && (
        <div>
          {rooms.length === 0 ? (
            <div className="glass-panel p-12 text-center border-dashed border-slate-800 relative overflow-hidden">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-inner">
                <Compass size={36} className="text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 font-cinzel">
                No hay expediciones activas en este momento
              </h3>
              <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
                Zarpa hacia una nueva isla de Catán. Crea una sala pública o privada, invita amigos con el código de sala o entrena con bots inteligentes.
              </p>
              <button
                onClick={() => {
                  if (!user) onOpenAuth();
                  else setShowCreateModal(true);
                }}
                className="btn-primary py-3 px-8 text-base shadow-xl"
              >
                <PlusCircle size={20} /> Crear Primera Sala
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rooms.map((room) => (
                <div
                  key={room.roomCode}
                  className="glass-card p-5 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h4 className="font-bold text-lg text-white group-hover:text-amber-400 transition font-cinzel">
                          {room.title}
                        </h4>
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Crown size={12} className="text-amber-400" /> Anfitrión: <strong>{room.host}</strong>
                        </span>
                      </div>
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 shadow-inner">
                        {room.roomCode}
                      </span>
                    </div>

                    <div className="space-y-2.5 my-4 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Layers size={14} className="text-slate-500" /> Tablero:
                        </span>
                        <span
                          className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                            room.mapType === 'extended'
                              ? 'bg-purple-900/60 text-purple-300 border border-purple-600/40'
                              : 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/40'
                          }`}
                        >
                          {room.mapType === 'extended' ? 'Extensión (Hasta 6P)' : 'Clásico (Hasta 4P)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Users size={14} className="text-slate-500" /> Colonos:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                            <div
                              className="bg-amber-400 h-full rounded-full transition-all"
                              style={{ width: `${(room.playerCount / room.maxPlayers) * 100}%` }}
                            />
                          </div>
                          <span className="font-bold text-white">
                            {room.playerCount} / {room.maxPlayers}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Trophy size={14} className="text-slate-500" /> Objetivo:
                        </span>
                        <span className="font-bold text-amber-300">{room.targetPoints} Puntos</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-500" /> Límite Turno:
                        </span>
                        <span className="font-semibold text-slate-300">
                          {room.turnTimeLimit > 0 ? `${room.turnTimeLimit}s` : 'Sin límite'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onJoinRoom(room.roomCode)}
                    className="w-full btn-action bg-amber-500 text-slate-950 hover:bg-amber-400 justify-center font-bold py-2.5 text-xs shadow-md mt-2"
                  >
                    <Play size={15} fill="currentColor" /> Unirse a la Partida
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Salón de la Fama (Leaderboard) */}
      {activeTab === 'leaderboard' && (
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow">
              <Trophy size={26} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cinzel text-white">Salón de la Fama de Catán</h2>
              <p className="text-xs text-slate-400">Los colonos más exitosos clasificados por victorias y puntos de victoria</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Posición</th>
                  <th className="p-3.5">Colono</th>
                  <th className="p-3.5 text-center">Victorias</th>
                  <th className="p-3.5 text-center">Partidas</th>
                  <th className="p-3.5 text-center">Poblados</th>
                  <th className="p-3.5 text-center">Ciudades</th>
                  <th className="p-3.5 text-center">Gran Ruta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500 text-sm">
                      Aún no hay colonos con victorias registradas. ¡Sé el primero en conquistar la isla!
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 transition">
                      <td className="p-3.5 font-bold font-mono">
                        {idx === 0 ? (
                          <span className="text-yellow-400 font-extrabold flex items-center gap-1">🥇 1°</span>
                        ) : idx === 1 ? (
                          <span className="text-slate-300 font-extrabold flex items-center gap-1">🥈 2°</span>
                        ) : idx === 2 ? (
                          <span className="text-amber-600 font-extrabold flex items-center gap-1">🥉 3°</span>
                        ) : (
                          <span className="text-slate-500">{idx + 1}°</span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm shadow">
                          {item.avatar || '🧑‍🌾'}
                        </div>
                        <span>{item.username}</span>
                      </td>
                      <td className="p-3.5 text-center font-extrabold text-amber-300 text-base">
                        {item.stats?.gamesWon || 0}
                      </td>
                      <td className="p-3.5 text-center text-slate-300 font-semibold">
                        {item.stats?.gamesPlayed || 0}
                      </td>
                      <td className="p-3.5 text-center text-slate-400 font-mono">
                        {item.stats?.settlementsBuilt || 0}
                      </td>
                      <td className="p-3.5 text-center text-slate-400 font-mono">
                        {item.stats?.citiesBuilt || 0}
                      </td>
                      <td className="p-3.5 text-center text-slate-400 font-mono">
                        {item.stats?.longestRoadCount || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Reglamento Oficial de Catán */}
      {activeTab === 'rules' && (
        <div className="glass-panel p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          <div className="border-b border-slate-800 pb-4 flex items-center gap-3">
            <BookOpen size={28} className="text-amber-400" />
            <div>
              <h2 className="text-2xl font-bold font-cinzel text-amber-400">
                Compendio Oficial de Reglas
              </h2>
              <p className="text-xs text-slate-400">
                Guía completa de mecánicas, costes, dados, comercio y extensión para 5-6 jugadores
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2 font-cinzel">
                <Trophy size={18} /> 1. Meta y Puntos de Victoria (PV)
              </h3>
              <p className="text-xs text-slate-300">
                Gana el primer colono en alcanzar los <strong>10 Puntos de Victoria</strong> en su turno:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 pl-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span><strong>Poblado:</strong> 1 Punto de Victoria.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span><strong>Ciudad:</strong> 2 Puntos de Victoria (reemplaza un poblado).</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span><strong>Gran Ruta Comercial:</strong> 2 PV (camino continuo de al menos 5 aristas).</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span><strong>Mayor Ejército:</strong> 2 PV (al menos 3 Caballeros jugados).</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span><strong>Cartas de Desarrollo de PV:</strong> 1 PV secreto cada una.</span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-5 space-y-3">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2 font-cinzel">
                <Layers size={18} /> 2. Costos de Construcción
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="font-bold text-white">Carretera</span>
                  <span className="text-amber-400 font-mono font-semibold">1 Madera + 1 Arcilla</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="font-bold text-white">Poblado</span>
                  <span className="text-amber-400 font-mono font-semibold">1 Madera + 1 Arcilla + 1 Trigo + 1 Oveja</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="font-bold text-white">Ciudad (Mejora)</span>
                  <span className="text-amber-400 font-mono font-semibold">2 Trigo + 3 Mineral</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="font-bold text-white">Carta de Desarrollo</span>
                  <span className="text-amber-400 font-mono font-semibold">1 Oveja + 1 Trigo + 1 Mineral</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 space-y-3">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2 font-cinzel">
                <Shield size={18} /> 3. Tirada de 7 y El Ladrón
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cuando los dados suman 7, la isla entra en alerta:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300">
                <li>Todo jugador con <strong>más de 7 cartas</strong> en su mano debe descartar la mitad redondeada hacia abajo.</li>
                <li>El jugador activo reubica al Ladrón en cualquier otro hexágono de la isla, bloqueando su producción de recursos.</li>
                <li>Puede robar 1 recurso al azar de un oponente con asentamiento en ese hexágono.</li>
              </ul>
            </div>

            <div className="glass-card p-5 space-y-3">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2 font-cinzel">
                <Users size={18} /> 4. Extensión para 5 y 6 Jugadores
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                En el mapa expandido de 30 hexágonos, entra en juego la <strong>Fase Especial de Construcción</strong>:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300">
                <li>Al finalizar el turno del colono activo, todos los demás jugadores (en orden) tienen la posibilidad de construir carreteras, poblados o ciudades, y comprar cartas de desarrollo.</li>
                <li>Durante esta fase no se puede comerciar ni jugar cartas de desarrollo, manteniendo un ritmo ágil de partida.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear Nueva Sala */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content w-full max-w-lg p-6 sm:p-7 relative border-amber-500/30">
            <h2 className="text-2xl font-bold font-cinzel text-amber-400 mb-1">
              Nueva Expedición a Catán
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Elige el tamaño de la isla, los puntos de victoria y el ritmo del turno
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre de la Partida
                </label>
                <input
                  type="text"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  placeholder={`Expedición de ${user?.username || 'Colonos'}`}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Tipo de Tablero
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <div
                    onClick={() => setMapType('classic')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col items-center text-center ${
                      mapType === 'classic'
                        ? 'bg-amber-500/15 border-amber-400 shadow-lg ring-1 ring-amber-400'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mb-2 font-bold">
                      4P
                    </div>
                    <span className="font-bold text-sm text-white font-cinzel">Estándar Clásico</span>
                    <span className="text-xs text-emerald-400 font-semibold mt-0.5">3 a 4 Jugadores</span>
                    <span className="text-[11px] text-slate-400 mt-1">19 hexágonos • 9 puertos</span>
                  </div>

                  <div
                    onClick={() => setMapType('extended')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col items-center text-center ${
                      mapType === 'extended'
                        ? 'bg-amber-500/15 border-amber-400 shadow-lg ring-1 ring-amber-400'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl mb-2 font-bold">
                      6P
                    </div>
                    <span className="font-bold text-sm text-white font-cinzel">Extensión Oficial</span>
                    <span className="text-xs text-purple-400 font-semibold mt-0.5">Hasta 6 Jugadores</span>
                    <span className="text-[11px] text-slate-400 mt-1">30 hexágonos • Fase Especial</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Meta de Victoria
                  </label>
                  <select
                    value={targetPoints}
                    onChange={(e) => setTargetPoints(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value={10}>10 Puntos (Estándar)</option>
                    <option value={11}>11 Puntos (Medio)</option>
                    <option value={12}>12 Puntos (Épico)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tiempo por Turno
                  </label>
                  <select
                    value={turnTimeLimit}
                    onChange={(e) => setTurnTimeLimit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value={45}>45s (Dinámico)</option>
                    <option value={60}>60s (Recomendado)</option>
                    <option value={90}>90s (Relajado)</option>
                    <option value={0}>Sin límite</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary px-8"
                >
                  {creating ? 'Zarpando...' : 'Crear Sala'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
