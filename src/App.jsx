// src/App.jsx
import React, { useState, useEffect } from 'react';
import { authStorage, socketClient, api } from './utils/api';

import AuthModal from './components/AuthModal';
import LobbyBrowser from './components/LobbyBrowser';
import GameRoomLobby from './components/GameRoomLobby';
import CatanBoard from './components/CatanBoard';
import GameHeader from './components/GameHeader';
import PlayerDeck from './components/PlayerDeck';
import TradeModal from './components/TradeModal';
import RobberModal from './components/RobberModal';
import DevCardModal from './components/DevCardModal';
import SidebarPlayers from './components/SidebarPlayers';
import ChatAndLogs from './components/ChatAndLogs';
import VictoryModal from './components/VictoryModal';
import DiceRollOverlay from './components/DiceRollOverlay';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authStorage.getUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentRoomCode, setCurrentRoomCode] = useState(null);

  // Estado completo del juego recibido por WebSocket
  const [gameState, setGameState] = useState(null);
  const [myPrivateState, setMyPrivateState] = useState(null);

  // Modos de construcción interactiva en tablero ('road' | 'settlement' | 'city' | null)
  const [buildMode, setBuildMode] = useState(null);

  // Modales interactivos
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showDevCardModal, setShowDevCardModal] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Verificar sesión existente al cargar
  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      api.getMe()
        .then(u => {
          setCurrentUser(u);
          authStorage.setUser(u);
        })
        .catch(() => {
          authStorage.clearToken();
        });
    }
  }, []);

  // Suscripción al WebSocket de Catán
  useEffect(() => {
    const unsubUpdate = socketClient.on('state_update', (payload) => {
      setGameState(payload);
      if (payload.me) {
        setMyPrivateState(payload.me);
      }
    });

    const unsubError = socketClient.on('action_error', (err) => {
      setActionError(err);
      setTimeout(() => setActionError(null), 4000);
    });

    return () => {
      unsubUpdate();
      unsubError();
    };
  }, []);

  // Unirse a una sala
  const handleJoinRoom = (roomCode) => {
    setCurrentRoomCode(roomCode);
    socketClient.connect(() => {
      socketClient.joinRoom(roomCode, currentUser);
    });
  };

  const handleLeaveRoom = () => {
    socketClient.disconnect();
    setCurrentRoomCode(null);
    setGameState(null);
    setMyPrivateState(null);
    setBuildMode(null);
  };

  const handleLogout = () => {
    authStorage.clearToken();
    authStorage.clearUser();
    setCurrentUser(null);
  };

  // --- INTERACCIONES DEL TABLERO ---
  const handleSelectVertex = (vId) => {
    if (!gameState) return;

    if (gameState.phase === 'setup_round_1' || gameState.phase === 'setup_round_2') {
      socketClient.send('build_initial_settlement', { vertexId: vId });
      return;
    }

    if (buildMode === 'settlement') {
      socketClient.send('build_settlement', { vertexId: vId });
      setBuildMode(null);
    } else if (buildMode === 'city') {
      socketClient.send('build_city', { vertexId: vId });
      setBuildMode(null);
    }
  };

  const handleSelectEdge = (eId) => {
    if (!gameState) return;

    if (gameState.phase === 'setup_round_1' || gameState.phase === 'setup_round_2') {
      socketClient.send('build_initial_road', { edgeId: eId });
      return;
    }

    if (buildMode === 'road') {
      socketClient.send('build_road', { edgeId: eId });
      setBuildMode(null);
    }
  };

  const handleSelectHex = (hexId) => {
    if (gameState?.subphase === 'robber') {
      socketClient.send('move_robber', { hexId });
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-between select-none">
      {/* Alerta flotante de errores de acción */}
      {actionError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white font-semibold text-xs py-2 px-5 rounded-full shadow-2xl backdrop-blur border border-red-400 animate-bounce">
          ⚠️ {actionError}
        </div>
      )}

      {/* 1. Vista de Explorador de Salas (Fuera de partida) */}
      {!currentRoomCode && (
        <LobbyBrowser
          user={currentUser}
          onOpenAuth={() => setShowAuthModal(true)}
          onLogout={handleLogout}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {/* 2. Vista de Sala de Espera Pre-Juego */}
      {currentRoomCode && gameState && gameState.state === 'lobby' && (
        <GameRoomLobby
          gameState={gameState}
          currentUser={currentUser}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {/* 3. Vista Principal del Tablero en Juego */}
      {currentRoomCode && gameState && gameState.state !== 'lobby' && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden p-1 sm:p-2.5 justify-between">
          {/* Header Superior: Turno, Dados, Código de Sala y Utilidades */}
          <GameHeader
            gameState={gameState}
            currentUser={currentUser}
            onLeaveRoom={handleLeaveRoom}
          />

          {/* Área Central: Sidebar Izquierdo + Tablero SVG + Sidebar Derecho */}
          <div className="min-h-0 flex-1 flex items-center justify-between gap-2 sm:gap-3 my-1 overflow-hidden relative">
            {/* Sidebar Jugadores (Izquierda) */}
            <div className="hidden md:block shrink-0 h-full overflow-y-auto">
              <SidebarPlayers
                gameState={gameState}
                myPrivateState={myPrivateState}
                currentUser={currentUser}
              />
            </div>

            {/* Tablero Hexagonal (Centro con máximo espacio) */}
            <div className="flex-1 h-full flex items-center justify-center relative overflow-hidden">
              <CatanBoard
                board={gameState.board}
                activePlayerId={gameState.activePlayerId}
                currentUserId={currentUser?.id}
                phase={gameState.phase}
                subphase={gameState.subphase}
                buildMode={buildMode}
                onSelectVertex={handleSelectVertex}
                onSelectEdge={handleSelectEdge}
                onSelectHex={handleSelectHex}
              />
            </div>

            {/* Sidebar Derecho: Cartas de Recursos y Acciones ARRIBA + Chat e Historial ABAJO (Colonist style) */}
            <div className="hidden lg:flex flex-col shrink-0 h-full w-80 xl:w-88 gap-2 overflow-hidden justify-between">
              {/* Cartas de Recursos y Acciones */}
              <div className="shrink-0 overflow-y-auto max-h-[58vh]">
                <PlayerDeck
                  gameState={gameState}
                  myPrivateState={myPrivateState}
                  currentUser={currentUser}
                  buildMode={buildMode}
                  setBuildMode={setBuildMode}
                  onRollDice={() => socketClient.send('roll_dice')}
                  onBuyDevCard={() => socketClient.send('buy_dev_card')}
                  onEndTurn={() => socketClient.send('end_turn')}
                  onSkipSpecialBuild={() => socketClient.send('skip_special_build')}
                  onOpenTradeModal={() => setShowTradeModal(true)}
                  onOpenDevCardModal={() => setShowDevCardModal(true)}
                  sidebarMode={true}
                />
              </div>

              {/* Chat e Historial abajo ocupando el resto */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatAndLogs
                  logs={gameState.logs}
                  currentUser={currentUser}
                />
              </div>
            </div>
          </div>

          {/* En móviles y pantallas pequeñas (< lg), mostrar el PlayerDeck inferior */}
          <div className="lg:hidden shrink-0">
            <PlayerDeck
              gameState={gameState}
              myPrivateState={myPrivateState}
              currentUser={currentUser}
              buildMode={buildMode}
              setBuildMode={setBuildMode}
              onRollDice={() => socketClient.send('roll_dice')}
              onBuyDevCard={() => socketClient.send('buy_dev_card')}
              onEndTurn={() => socketClient.send('end_turn')}
              onSkipSpecialBuild={() => socketClient.send('skip_special_build')}
              onOpenTradeModal={() => setShowTradeModal(true)}
              onOpenDevCardModal={() => setShowDevCardModal(true)}
              sidebarMode={false}
            />
          </div>
        </div>
      )}

      {/* Modales y Diálogos */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(u) => setCurrentUser(u)}
      />

      {gameState && (
        <>
          <TradeModal
            isOpen={showTradeModal || Boolean(gameState.activeTrade)}
            onClose={() => setShowTradeModal(false)}
            gameState={gameState}
            myPrivateState={myPrivateState}
            currentUser={currentUser}
          />

          <RobberModal
            gameState={gameState}
            myPrivateState={myPrivateState}
            currentUser={currentUser}
          />

          <DevCardModal
            isOpen={showDevCardModal}
            onClose={() => setShowDevCardModal(false)}
            gameState={gameState}
            myPrivateState={myPrivateState}
            currentUser={currentUser}
          />

          <VictoryModal
            winner={gameState.winner}
            onReturnToLobby={handleLeaveRoom}
          />

          {/* Animación 3D de Tirada de Dados en el Centro de la Pantalla */}
          <DiceRollOverlay gameState={gameState} />
        </>
      )}
    </div>
  );
}
