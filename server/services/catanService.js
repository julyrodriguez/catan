// services/catanService.js
const { CatanGameInstance } = require('./catanEngine');
const CatanUser = require('../models/CatanUser');
const CatanGame = require('../models/CatanGame');

class CatanService {
  constructor() {
    this.rooms = new Map(); // roomCode -> CatanGameInstance
    this.playerRoomMap = new Map(); // playerId -> roomCode
  }

  createRoom({ title, mapType, targetPoints, turnTimeLimit, hostUser }) {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const game = new CatanGameInstance({
      roomCode,
      title: title || `Sala de ${hostUser.username}`,
      hostPlayer: {
        id: hostUser.id,
        username: hostUser.username,
        avatar: hostUser.avatar
      },
      mapType: mapType || 'classic',
      targetPoints: targetPoints ? Number(targetPoints) : 10,
      turnTimeLimit: turnTimeLimit !== undefined ? Number(turnTimeLimit) : 60
    });

    this.rooms.set(roomCode, game);
    this.playerRoomMap.set(hostUser.id, roomCode);
    return game;
  }

  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.toUpperCase()) || null;
  }

  listRooms() {
    const list = [];
    for (const game of this.rooms.values()) {
      list.push({
        id: game.id,
        roomCode: game.roomCode,
        title: game.title,
        mapType: game.mapType,
        maxPlayers: game.maxPlayers,
        playerCount: game.players.length,
        state: game.state,
        targetPoints: game.targetPoints,
        turnTimeLimit: game.turnTimeLimit,
        host: game.players.find(p => p.isHost)?.username || 'Desconocido'
      });
    }
    return list;
  }

  joinRoom(roomCode, user) {
    const game = this.getRoom(roomCode);
    if (!game) throw new Error('Sala no encontrada.');
    const existing = game.players.find(p => p.id === user.id);
    if (existing) {
      existing.connected = true;
      this.playerRoomMap.set(user.id, game.roomCode);
      return { game, player: existing, reconnected: true };
    }
    const player = game.addPlayer(user);
    this.playerRoomMap.set(user.id, game.roomCode);
    return { game, player, reconnected: false };
  }

  addBot(roomCode, hostUserId) {
    const game = this.getRoom(roomCode);
    if (!game) throw new Error('Sala no encontrada.');
    const host = game.players.find(p => p.id === hostUserId);
    if (!host || !host.isHost) throw new Error('Solo el anfitrión puede agregar bots.');

    const botNumber = game.players.filter(p => p.isBot).length + 1;
    const botAvatars = ['🤖', '🦾', '👾', '🕹️', '⚙️'];
    const botAvatar = botAvatars[(botNumber - 1) % botAvatars.length];
    const botUser = {
      id: `bot_${Math.random().toString(36).substring(2, 7)}`,
      username: `Bot ${botNumber}`,
      avatar: botAvatar,
      isBot: true
    };
    return game.addPlayer(botUser);
  }

  async saveFinishedGame(game) {
    if (!game || !game.winner) return;

    try {
      const durationSeconds = Math.round((Date.now() - (game.startedAtTime || Date.now())) / 1000);
      const gameDoc = new CatanGame({
        roomCode: game.roomCode,
        title: game.title,
        mapType: game.mapType,
        targetPoints: game.targetPoints,
        winner: {
          userId: game.winner.id,
          username: game.winner.username,
          color: game.winner.color,
          points: game.winner.points
        },
        players: game.players.map(p => ({
          userId: p.id,
          username: p.username,
          color: p.color,
          points: p.victoryPoints + p.secretVictoryPoints,
          isBot: p.isBot,
          settlements: p.settlementsCount,
          cities: p.citiesCount,
          roads: p.roadsCount,
          armySize: p.playedKnights,
          roadLength: p.longestRoadLength,
          hasLongestRoad: game.longestRoadHolder?.playerId === p.id,
          hasLargestArmy: game.largestArmyHolder?.playerId === p.id
        })),
        totalTurns: game.turnCount,
        durationSeconds
      });

      await gameDoc.save();

      // Actualizar estadísticas de usuarios registrados
      for (const p of game.players) {
        if (!p.isBot && !p.id.startsWith('guest_')) {
          const isWinner = p.id === game.winner.id;
          await CatanUser.findByIdAndUpdate(p.id, {
            $inc: {
              'stats.gamesPlayed': 1,
              'stats.gamesWon': isWinner ? 1 : 0,
              'stats.totalVictoryPoints': p.victoryPoints + p.secretVictoryPoints,
              'stats.settlementsBuilt': p.settlementsCount,
              'stats.citiesBuilt': p.citiesCount,
              'stats.roadsBuilt': p.roadsCount,
              'stats.longestRoadCount': game.longestRoadHolder?.playerId === p.id ? 1 : 0,
              'stats.largestArmyCount': game.largestArmyHolder?.playerId === p.id ? 1 : 0
            }
          }).catch(e => console.error('Error actualizando stats de usuario:', e));
        }
      }
    } catch (err) {
      console.error('Error al persistir partida finalizada de Catan:', err);
    }
  }
}

const catanService = new CatanService();
module.exports = catanService;
