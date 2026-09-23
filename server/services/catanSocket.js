// services/catanSocket.js
const WebSocket = require('ws');
const catanService = require('./catanService');
const CatanUser = require('../models/CatanUser');

function initCatanWebSocket(server) {
  const wss = new WebSocket.Server({
    noServer: true,
    maxPayload: 1024 * 512
  });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/catan/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  // Mapa de sockets conectados: socket -> { playerId, roomCode }
  const socketClientMap = new Map();
  // Mapa de salas a sockets: roomCode -> Set<WebSocket>
  const roomSocketsMap = new Map();

  function broadcastToRoom(roomCode, type, payload) {
    const sockets = roomSocketsMap.get(roomCode);
    if (!sockets) return;
    const msg = JSON.stringify({ type, payload });
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }

  function syncRoom(game) {
    if (!game) return;
    const sockets = roomSocketsMap.get(game.roomCode);
    if (!sockets) return;

    const publicState = game.getPublicState();

    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        const client = socketClientMap.get(ws);
        const privateState = client ? game.getPlayerPrivateState(client.playerId) : null;
        ws.send(JSON.stringify({
          type: 'state_update',
          payload: {
            ...publicState,
            me: privateState
          }
        }));
      }
    }

    // Si terminó el juego, guardar en BD
    if (game.state === 'finished' && !game.persisted) {
      game.persisted = true;
      catanService.saveFinishedGame(game);
    }
  }

  // Ejecutor automático para bots
  function checkAndRunBot(game) {
    if (!game || game.state !== 'playing') return;

    // Si hay descartes pendientes y algún bot debe descartar
    if (game.subphase === 'discard') {
      const botToDiscard = game.players.find(p => p.isBot && game.pendingDiscards[p.id]);
      if (botToDiscard) {
        setTimeout(() => {
          game.runBotTurn(botToDiscard);
          syncRoom(game);
          checkAndRunBot(game);
        }, 600);
        return;
      }
    }

    const current = game.getCurrentPlayer();
    if (!current || !current.isBot) return;

    setTimeout(() => {
      if (game.state !== 'playing') return;
      const botCurrent = game.getCurrentPlayer();
      if (!botCurrent || !botCurrent.isBot) return;

      const result = game.runBotTurn(botCurrent);
      syncRoom(game);

      // Si el bot realizó una acción pero aún continúa en su turno, encadenar siguiente paso
      if (result && game.getCurrentPlayer()?.id === botCurrent.id && game.state === 'playing') {
        setTimeout(() => checkAndRunBot(game), 800);
      } else if (game.state === 'playing') {
        // Pasó a otro bot o jugador
        checkAndRunBot(game);
      }
    }, 1000);
  }

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        const { type, payload } = data;
        let client = socketClientMap.get(ws);

        if (type === 'join_room') {
          const { roomCode, user, token } = payload;
          let playerUser = user;

          // Validar token si se envió
          if (token) {
            const verified = CatanUser.verifyToken(token);
            if (verified) {
              const dbUser = await CatanUser.findById(verified.userId);
              if (dbUser) {
                playerUser = {
                  id: dbUser._id.toString(),
                  username: dbUser.username,
                  avatar: dbUser.avatar
                };
              }
            }
          }

          if (!playerUser) {
            playerUser = {};
          }
          if (!playerUser.id) {
            playerUser.id = `guest_${Math.random().toString(36).substring(2, 8)}`;
          }
          if (!playerUser.username) {
            playerUser.username = `Colono_${Math.floor(Math.random() * 900 + 100)}`;
          }
          if (!playerUser.avatar) {
            playerUser.avatar = '🧑‍🌾';
          }

          const { game, player } = catanService.joinRoom(roomCode, playerUser);

          // Registrar en mapas
          socketClientMap.set(ws, { playerId: player.id, roomCode: game.roomCode, username: player.username });
          if (!roomSocketsMap.has(game.roomCode)) {
            roomSocketsMap.set(game.roomCode, new Set());
          }
          roomSocketsMap.get(game.roomCode).add(ws);

          ws.send(JSON.stringify({
            type: 'joined_success',
            payload: {
              roomCode: game.roomCode,
              playerId: player.id,
              username: player.username,
              avatar: player.avatar,
              color: player.color,
              isHost: player.isHost
            }
          }));

          syncRoom(game);
          checkAndRunBot(game);
          return;
        }

        if (!client || !client.roomCode) {
          ws.send(JSON.stringify({ type: 'error', payload: 'No te has unido a ninguna sala.' }));
          return;
        }

        const game = catanService.getRoom(client.roomCode);
        if (!game) {
          ws.send(JSON.stringify({ type: 'error', payload: 'La sala ya no existe.' }));
          return;
        }

        const playerId = client.playerId;

        switch (type) {
          case 'set_color': {
            const player = game.players.find(p => p.id === playerId);
            if (player && game.state === 'lobby') {
              const colorInUse = game.players.some(p => p.id !== playerId && p.color === payload.color);
              if (!colorInUse) {
                player.color = payload.color;
                syncRoom(game);
              }
            }
            break;
          }

          case 'toggle_ready': {
            const player = game.players.find(p => p.id === playerId);
            if (player && game.state === 'lobby') {
              player.isReady = !player.isReady;
              syncRoom(game);
            }
            break;
          }

          case 'add_bot': {
            catanService.addBot(game.roomCode, playerId);
            syncRoom(game);
            break;
          }

          case 'remove_player': {
            const host = game.players.find(p => p.id === playerId);
            if (host?.isHost && payload.targetPlayerId) {
              game.removePlayer(payload.targetPlayerId);
              syncRoom(game);
            }
            break;
          }

          case 'start_game': {
            const host = game.players.find(p => p.id === playerId);
            if (!host?.isHost) throw new Error('Solo el anfitrión puede iniciar la partida.');
            game.startGame();
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'build_initial_settlement': {
            game.buildInitialSettlement(playerId, payload.vertexId);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'build_initial_road': {
            game.buildInitialRoad(playerId, payload.edgeId);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'roll_dice': {
            game.rollDice(playerId);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'discard_cards': {
            game.discardCards(playerId, payload.discard);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'move_robber': {
            game.moveRobber(playerId, payload.hexId);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'steal_resource': {
            game.stealResource(playerId, payload.victimId);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'build_road': {
            game.buildRoad(playerId, payload.edgeId, payload.isFree);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'build_settlement': {
            game.buildSettlement(playerId, payload.vertexId);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'build_city': {
            game.buildCity(playerId, payload.vertexId);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'buy_dev_card': {
            game.buyDevCard(playerId);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'play_dev_card': {
            game.playDevCard(playerId, payload.cardType, payload.params);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'trade_bank': {
            game.tradeWithBank(playerId, payload.giveResource, payload.getResource);
            syncRoom(game);
            break;
          }

          case 'propose_trade': {
            game.proposeTrade(playerId, payload.offer, payload.request);
            syncRoom(game);
            break;
          }

          case 'respond_trade': {
            game.respondToTrade(playerId, payload.accept);
            syncRoom(game);
            break;
          }

          case 'execute_trade': {
            game.executeTrade(playerId, payload.partnerId);
            syncRoom(game);
            break;
          }

          case 'cancel_trade': {
            game.cancelTrade(playerId);
            syncRoom(game);
            break;
          }

          case 'end_turn': {
            game.endTurn(playerId);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'skip_special_build': {
            game.skipSpecialBuilding(playerId);
            syncRoom(game);
            checkAndRunBot(game);
            break;
          }

          case 'chat': {
            if (payload.text && payload.text.trim()) {
              const text = payload.text.trim().substring(0, 200);
              const chatObj = {
                id: Math.random().toString(36).substring(2, 9),
                sender: client.username,
                text,
                timestamp: Date.now()
              };
              broadcastToRoom(game.roomCode, 'chat_message', chatObj);
            }
            break;
          }

          default:
            console.log(`[CatanSocket] Evento desconocido: ${type}`);
        }
      } catch (err) {
        ws.send(JSON.stringify({ type: 'action_error', payload: err.message }));
      }
    });

    ws.on('close', () => {
      const client = socketClientMap.get(ws);
      if (client) {
        const sockets = roomSocketsMap.get(client.roomCode);
        if (sockets) {
          sockets.delete(ws);
          if (sockets.size === 0) {
            // No borrar inmediatamente la sala para permitir reconexión
          }
        }
        const game = catanService.getRoom(client.roomCode);
        if (game) {
          const p = game.players.find(x => x.id === client.playerId);
          if (p) p.connected = false;
          syncRoom(game);
        }
        socketClientMap.delete(ws);
      }
    });
  });

  // Heartbeat ping interval
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Vigilante de límite de tiempo de turnos (para evitar que se cuelgue la partida si alguien se va)
  const turnTimerInterval = setInterval(() => {
    for (const game of catanService.rooms.values()) {
      if (game.state !== 'playing' || !game.turnDeadline) continue;
      if (Date.now() <= game.turnDeadline) continue;

      const cur = game.getCurrentPlayer();
      if (!cur) continue;

      try {
        if (game.phase === 'setup_round_1' || game.phase === 'setup_round_2') {
          if (game.subphase === 'settlement') {
            for (const [vId, v] of Object.entries(game.board.vertices)) {
              if (!v.building && !v.adjacentVertices.some(adj => game.board.vertices[adj]?.building)) {
                game.buildInitialSettlement(cur.id, vId);
                game.log(`⏱️ Tiempo agotado: Se fundó automáticamente el poblado de ${cur.username}.`, 'warning');
                break;
              }
            }
          } else if (game.subphase === 'road') {
            const v = game.board.vertices[game.lastBuiltSettlementVertexId];
            if (v) {
              const edge = v.adjacentEdges.find(eId => !game.board.edges[eId]?.road);
              if (edge) {
                game.buildInitialRoad(cur.id, edge);
                game.log(`⏱️ Tiempo agotado: Se colocó automáticamente la carretera de ${cur.username}.`, 'warning');
              }
            }
          }
        } else if (game.phase === 'special_building') {
          game.skipSpecialBuilding(cur.id);
          game.log(`⏱️ Tiempo agotado: Se omitió la fase especial de ${cur.username}.`, 'warning');
        } else if (game.subphase === 'roll') {
          game.rollDice(cur.id);
          game.log(`⏱️ Tiempo agotado: Se tiraron los dados automáticamente para ${cur.username}.`, 'warning');
        } else if (game.subphase === 'trade_and_build') {
          game.endTurn(cur.id);
          game.log(`⏱️ Tiempo agotado: Turno finalizado automáticamente para ${cur.username}.`, 'warning');
        } else if (game.subphase === 'discard') {
          for (const [pId, needed] of Object.entries(game.pendingDiscards)) {
            const p = game.players.find(x => x.id === pId);
            if (p) {
              const discard = { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 };
              let count = 0;
              for (const res of ['wood', 'brick', 'sheep', 'wheat', 'ore']) {
                while ((p.resources[res] || 0) > (discard[res] || 0) && count < needed) {
                  discard[res] = (discard[res] || 0) + 1;
                  count++;
                }
              }
              game.discardCards(p.id, discard);
              game.log(`⏱️ Tiempo agotado: ${p.username} descartó cartas automáticamente.`, 'warning');
            }
          }
        } else if (game.subphase === 'robber') {
          const targetHex = game.board.hexes.find(h => !h.hasRobber && h.resource !== 'desert') || game.board.hexes[0];
          game.moveRobber(cur.id, targetHex.id);
          game.log(`⏱️ Tiempo agotado: Se reubicó al ladrón automáticamente.`, 'warning');
        } else if (game.subphase === 'steal') {
          if (game.robberVictims.length > 0) {
            game.stealResource(cur.id, game.robberVictims[0]);
          } else {
            game.subphase = 'trade_and_build';
          }
        }

        syncRoom(game);
        checkAndRunBot(game);
      } catch (err) {
        console.error('Error en vigilancia de tiempo de turno:', err);
      }
    }
  }, 2500);

  wss.on('close', () => {
    clearInterval(pingInterval);
    clearInterval(turnTimerInterval);
  });

  console.log('🎲 [CatanSocket] WebSocket de Catan montado en /api/catan/ws');
  return wss;
}

module.exports = {
  initCatanWebSocket
};
