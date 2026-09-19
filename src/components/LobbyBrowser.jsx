// src/components/LobbyBrowser.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Users, PlusCircle, Trophy, BookOpen, RefreshCw, 
  Play, Shield, Clock, Award, Compass, LogIn, LogOut
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
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8 glass-panel p-4 sm:p-6 border-amber-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-2xl shadow-lg border border-yellow-300/40">
            🌾
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-cinzel text-amber-400 tracking-wide">
              Colonos de Catán
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Partidas multijugador en línea hasta 6 jugadores • Mapas 4P y 6P
            </p>
          </div>
        </div>

        {/* User Status */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2">
              <span className="text-2xl">{user.avatar || '🧑‍🌾'}</span>
              <div className="text-left">
                <div className="text-sm font-bold text-white leading-tight">{user.username}</div>
                <div className="text-xs text-amber-400">
                  {user.stats?.gamesWon || 0} victorias • {user.stats?.gamesPlayed || 0} jugadas
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition ml-2"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary">
              <LogIn size={18} /> Iniciar Sesión / Registro
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === 'rooms'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass size={17} /> Salas Disponibles
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy size={17} /> Clasificación
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === 'rules'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen size={17} /> Reglas del Juego
          </button>
        </div>

        {activeTab === 'rooms' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5">
              <input
                type="text"
                maxLength={6}
                placeholder="CÓDIGO"
                value={directCode}
                onChange={(e) => setDirectCode(e.target.value.toUpperCase())}
                className="bg-transparent text-sm w-20 text-center font-mono font-bold tracking-widest text-amber-400 focus:outline-none"
              />
              <button
                disabled={!directCode.trim()}
                onClick={() => onJoinRoom(directCode.trim())}
                className="btn-action bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold px-3 py-1"
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

      {/* Tab Content: Rooms */}
      {activeTab === 'rooms' && (
        <div>
          {rooms.length === 0 ? (
            <div className="glass-panel p-12 text-center border-dashed border-slate-700">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-3xl mx-auto mb-4 text-amber-400">
                🏝️
              </div>
              <h3 className="text-xl font-bold text-white mb-1 font-cinzel">No hay salas abiertas</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                Sé el primero en fundar una colonia. Crea una partida para jugar con amigos o agrega bots inteligentes para practicar.
              </p>
              <button
                onClick={() => {
                  if (!user) onOpenAuth();
                  else setShowCreateModal(true);
                }}
                className="btn-primary"
              >
                <PlusCircle size={18} /> Crear Sala Nueva
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.roomCode}
                  className="glass-panel p-5 hover:border-amber-500/40 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-lg text-white group-hover:text-amber-400 transition font-cinzel">
                          {room.title}
                        </h4>
                        <span className="text-xs text-slate-400">Anfitrión: {room.host}</span>
                      </div>
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-amber-400">
                        {room.roomCode}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Mapa:</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded ${
                            room.mapType === 'extended'
                              ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                              : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                          }`}
                        >
                          {room.mapType === 'extended'
                            ? 'Extensión (5-6 Jugadores)'
                            : 'Estándar (3-4 Jugadores)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Jugadores:</span>
                        <span className="font-bold text-white flex items-center gap-1">
                          <Users size={14} className="text-amber-400" /> {room.playerCount} /{' '}
                          {room.maxPlayers}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Meta:</span>
                        <span className="font-semibold text-amber-300">{room.targetPoints} Puntos</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Turno:</span>
                        <span className="font-semibold text-slate-300">
                          {room.turnTimeLimit > 0 ? `${room.turnTimeLimit}s` : 'Sin límite'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onJoinRoom(room.roomCode)}
                    className="w-full btn-action bg-amber-500 text-slate-950 hover:bg-amber-400 justify-center font-bold py-2.5"
                  >
                    <Play size={16} fill="currentColor" /> Unirse a la Partida
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trophy size={28} className="text-amber-400" />
            <div>
              <h2 className="text-xl font-bold font-cinzel text-white">Salón de la Fama de Catán</h2>
              <p className="text-xs text-slate-400">Los mejores colonos clasificados por victorias y puntos</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Colono</th>
                  <th className="p-3 text-center">Victorias</th>
                  <th className="p-3 text-center">Partidas</th>
                  <th className="p-3 text-center">Poblados</th>
                  <th className="p-3 text-center">Ciudades</th>
                  <th className="p-3 text-center">Rutas Largas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Aún no hay partidas registradas en el Salón de la Fama. ¡Gana la primera!
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-amber-400">
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`}
                      </td>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <span className="text-xl">{item.avatar || '🧑‍🌾'}</span>
                        <span>{item.username}</span>
                      </td>
                      <td className="p-3 text-center font-bold text-amber-300">
                        {item.stats?.gamesWon || 0}
                      </td>
                      <td className="p-3 text-center text-slate-300">
                        {item.stats?.gamesPlayed || 0}
                      </td>
                      <td className="p-3 text-center text-slate-400">
                        {item.stats?.settlementsBuilt || 0}
                      </td>
                      <td className="p-3 text-center text-slate-400">
                        {item.stats?.citiesBuilt || 0}
                      </td>
                      <td className="p-3 text-center text-slate-400">
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

      {/* Tab Content: Rules */}
      {activeTab === 'rules' && (
        <div className="glass-panel p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold font-cinzel text-amber-400 mb-1">
              Manual Completo de Reglas de Catán
            </h2>
            <p className="text-xs text-slate-400">
              Incluye las reglas base para 3-4 jugadores y la extensión oficial de 5-6 jugadores
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-cinzel">
                🌾 1. Objetivo y Victoria
              </h3>
              <p>
                El primer jugador en alcanzar <strong>10 Puntos de Victoria (PV)</strong> en su turno gana la partida.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Poblado:</strong> 1 Punto de Victoria.</li>
                <li><strong>Ciudad:</strong> 2 Puntos de Victoria.</li>
                <li><strong>Gran Ruta Comercial:</strong> 2 Puntos de Victoria (carretera continua de al menos 5 segmentos).</li>
                <li><strong>Mayor Ejército:</strong> 2 Puntos de Victoria (al menos 3 cartas de Caballero jugadas).</li>
                <li><strong>Cartas de Desarrollo de PV:</strong> 1 Punto secreto cada una (se revelan al ganar).</li>
              </ul>
            </div>

            <div className="glass-card p-4 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-cinzel">
                🏗️ 2. Costos de Construcción
              </h3>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-center justify-between p-1.5 bg-slate-800/60 rounded">
                  <span><strong>Carretera:</strong> 1 Madera + 1 Arcilla</span>
                  <span className="text-amber-400 font-mono">1M + 1A</span>
                </li>
                <li className="flex items-center justify-between p-1.5 bg-slate-800/60 rounded">
                  <span><strong>Poblado:</strong> 1 Madera + 1 Arcilla + 1 Trigo + 1 Oveja</span>
                  <span className="text-amber-400 font-mono">1M + 1A + 1T + 1O</span>
                </li>
                <li className="flex items-center justify-between p-1.5 bg-slate-800/60 rounded">
                  <span><strong>Ciudad:</strong> 2 Trigo + 3 Mineral (mejora un poblado)</span>
                  <span className="text-amber-400 font-mono">2T + 3Min</span>
                </li>
                <li className="flex items-center justify-between p-1.5 bg-slate-800/60 rounded">
                  <span><strong>Carta de Desarrollo:</strong> 1 Oveja + 1 Trigo + 1 Mineral</span>
                  <span className="text-amber-400 font-mono">1O + 1T + 1Min</span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-4 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-cinzel">
                🎲 3. Dados y el Ladrón (Número 7)
              </h3>
              <p className="text-xs">
                Si la tirada es distinta de 7, cada hexágono con ese número produce 1 recurso para cada poblado adyacente y 2 recursos para cada ciudad, salvo que el ladrón se encuentre sobre él.
              </p>
              <p className="text-xs">
                <strong>Al salir un 7:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Todo jugador con <strong>más de 7 cartas</strong> en mano debe descartar la mitad redondeada hacia abajo.</li>
                <li>El jugador activo mueve al Ladrón a cualquier otro hexágono, bloqueando su producción.</li>
                <li>Roba 1 recurso aleatorio de un oponente con un poblado o ciudad en ese hexágono.</li>
              </ul>
            </div>

            <div className="glass-card p-4 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-cinzel">
                👥 4. Extensión para 5-6 Jugadores
              </h3>
              <p className="text-xs">
                En el mapa de 5-6 jugadores (30 hexágonos), se aplica la <strong>Fase Especial de Construcción</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Entre turnos de jugadores regulares, <strong>todos los demás jugadores</strong> tienen la oportunidad de construir carreteras, poblados, ciudades o comprar cartas de desarrollo.</li>
                <li>Durante esta fase especial <strong>no se puede comerciar</strong> ni jugar cartas de desarrollo, solo construir con los recursos disponibles.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Sala */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold font-cinzel text-amber-400 mb-1">
              Configurar Nueva Partida
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Personaliza el mapa, la cantidad de colonos y la duración
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre de la Sala
                </label>
                <input
                  type="text"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  placeholder={`Isla de ${user?.username || 'Colonizadores'}`}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Tipo de Tablero y Capacidad
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setMapType('classic')}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col items-center text-center ${
                      mapType === 'classic'
                        ? 'bg-amber-500/20 border-amber-400 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl mb-1">🏝️</span>
                    <span className="font-bold text-sm text-white">Estándar Clásico</span>
                    <span className="text-xs text-amber-400 font-semibold mt-0.5">Hasta 4 Jugadores</span>
                    <span className="text-[11px] text-slate-400 mt-1">19 hexágonos • 9 puertos</span>
                  </div>

                  <div
                    onClick={() => setMapType('extended')}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col items-center text-center ${
                      mapType === 'extended'
                        ? 'bg-amber-500/20 border-amber-400 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl mb-1">🗺️</span>
                    <span className="font-bold text-sm text-white">Extensión 5-6</span>
                    <span className="text-xs text-purple-400 font-semibold mt-0.5">Hasta 6 Jugadores</span>
                    <span className="text-[11px] text-slate-400 mt-1">30 hexágonos • Fase Especial</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Meta de Victoria
                  </label>
                  <select
                    value={targetPoints}
                    onChange={(e) => setTargetPoints(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={10}>10 Puntos (Estándar)</option>
                    <option value={11}>11 Puntos (Medio)</option>
                    <option value={12}>12 Puntos (Largo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Temporizador de Turno
                  </label>
                  <select
                    value={turnTimeLimit}
                    onChange={(e) => setTurnTimeLimit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={45}>45 Segundos (Rápido)</option>
                    <option value={60}>60 Segundos (Normal)</option>
                    <option value={90}>90 Segundos (Tranquilo)</option>
                    <option value={0}>Sin Límite</option>
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
                  className="btn-primary px-6"
                >
                  {creating ? 'Creando...' : 'Crear Sala'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
