// services/catanEngine.js
// Motor de reglas completo para Colonos de Catán (3-4 jugadores estándar y 5-6 jugadores extensión)

const R = 60;
const SQRT3 = Math.sqrt(3);

const RESOURCE_TYPES = ['wood', 'brick', 'sheep', 'wheat', 'ore'];

const COSTS = {
  road: { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  city: { wheat: 2, ore: 3 },
  devCard: { sheep: 1, wheat: 1, ore: 1 }
};

// Layouts hexagonales en coordenadas axiales (q, r)
const LAYOUT_4P = [
  { r: -2, qStart: 0, count: 3 },
  { r: -1, qStart: -1, count: 4 },
  { r: 0, qStart: -2, count: 5 },
  { r: 1, qStart: -2, count: 4 },
  { r: 2, qStart: -2, count: 3 },
];

const LAYOUT_6P = [
  { r: -3, qStart: 1, count: 3 },
  { r: -2, qStart: 0, count: 4 },
  { r: -1, qStart: -1, count: 5 },
  { r: 0, qStart: -2, count: 6 },
  { r: 1, qStart: -2, count: 5 },
  { r: 2, qStart: -2, count: 4 },
  { r: 3, qStart: -2, count: 3 },
];

// Barajas y fichas oficiales
const TILES_4P = [
  ...Array(4).fill('wood'),
  ...Array(4).fill('wheat'),
  ...Array(4).fill('sheep'),
  ...Array(3).fill('brick'),
  ...Array(3).fill('ore'),
  'desert'
];

const TOKENS_4P = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

const TILES_6P = [
  ...Array(6).fill('wood'),
  ...Array(6).fill('wheat'),
  ...Array(6).fill('sheep'),
  ...Array(5).fill('brick'),
  ...Array(5).fill('ore'),
  'desert', 'desert'
];

const TOKENS_6P = [
  2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 
  8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12
];

const DEV_DECK_4P = [
  ...Array(14).fill('knight'),
  ...Array(5).fill('victory_point'),
  ...Array(2).fill('road_building'),
  ...Array(2).fill('year_of_plenty'),
  ...Array(2).fill('monopoly')
];

const DEV_DECK_6P = [
  ...Array(20).fill('knight'),
  ...Array(5).fill('victory_point'),
  ...Array(3).fill('road_building'),
  ...Array(3).fill('year_of_plenty'),
  ...Array(3).fill('monopoly')
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Probabilidad de cada dado para heurística de bots e info visual
const PROB_DOTS = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5,
  7: 0,
  8: 5, 9: 4, 10: 3, 11: 2, 12: 1
};

// Generador de geometría del tablero
function generateBoardGraph(mapType = 'classic') {
  const isExtended = mapType === 'extended';
  const layout = isExtended ? LAYOUT_6P : LAYOUT_4P;
  const tileBag = shuffle(isExtended ? TILES_6P : TILES_4P);
  const tokenBag = shuffle(isExtended ? TOKENS_6P : TOKENS_4P);

  const hexList = [];
  let tileIndex = 0;
  let tokenIndex = 0;

  for (const row of layout) {
    for (let i = 0; i < row.count; i++) {
      const q = row.qStart + i;
      const r = row.r;
      const resource = tileBag[tileIndex++];
      let token = null;
      if (resource !== 'desert') {
        token = tokenBag[tokenIndex++];
      }
      hexList.push({
        id: `h_${q}_${r}`,
        q,
        r,
        resource,
        number: token,
        dots: token ? PROB_DOTS[token] : 0,
        hasRobber: false
      });
    }
  }

  // Exactamente 1 ladrón en el juego: empieza en el primer desierto
  const firstDesert = hexList.find(h => h.resource === 'desert') || hexList[0];
  firstDesert.hasRobber = true;
  let robberHexId = firstDesert.id;

  const verticesMap = new Map();
  const edgesMap = new Map();

  function hexCenter(q, r) {
    const x = R * SQRT3 * (q + r / 2);
    const y = R * 1.5 * r;
    return { x, y };
  }

  function getVertexKey(x, y) {
    return `v_${Math.round(x * 10)}_${Math.round(y * 10)}`;
  }

  function getEdgeKey(v1, v2) {
    return v1 < v2 ? `e_${v1}__${v2}` : `e_${v2}__${v1}`;
  }

  const hexes = hexList.map(h => {
    const { x, y } = hexCenter(h.q, h.r);
    const hexVertices = [];

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 6) + (i * Math.PI / 3);
      const vx = x + R * Math.cos(angle);
      const vy = y + R * Math.sin(angle);
      const vKey = getVertexKey(vx, vy);

      if (!verticesMap.has(vKey)) {
        verticesMap.set(vKey, {
          id: vKey,
          x: Math.round(vx * 10) / 10,
          y: Math.round(vy * 10) / 10,
          hexes: [],
          adjacentVertices: [],
          adjacentEdges: [],
          building: null, // { type: 'settlement' | 'city', playerId, color }
          port: null
        });
      }
      const vObj = verticesMap.get(vKey);
      vObj.hexes.push(h.id);
      hexVertices.push(vKey);
    }

    const hexEdges = [];
    for (let i = 0; i < 6; i++) {
      const v1 = hexVertices[i];
      const v2 = hexVertices[(i + 1) % 6];
      const eKey = getEdgeKey(v1, v2);

      if (!edgesMap.has(eKey)) {
        edgesMap.set(eKey, {
          id: eKey,
          v1,
          v2,
          hexes: [],
          road: null // { playerId, color }
        });
      }
      const eObj = edgesMap.get(eKey);
      eObj.hexes.push(h.id);
      hexEdges.push(eKey);

      const v1Obj = verticesMap.get(v1);
      const v2Obj = verticesMap.get(v2);
      if (!v1Obj.adjacentVertices.includes(v2)) v1Obj.adjacentVertices.push(v2);
      if (!v2Obj.adjacentVertices.includes(v1)) v2Obj.adjacentVertices.push(v1);
      if (!v1Obj.adjacentEdges.includes(eKey)) v1Obj.adjacentEdges.push(eKey);
      if (!v2Obj.adjacentEdges.includes(eKey)) v2Obj.adjacentEdges.push(eKey);
    }

    return {
      id: h.id,
      q: h.q,
      r: h.r,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      resource: h.resource,
      number: h.number,
      dots: h.dots,
      vertices: hexVertices,
      edges: hexEdges
    };
  });

  // Identificar puertos en la costa (vértices que tocan 1 o 2 hexágonos)
  // Generar lista de puertos oficiales
  const coastalVertices = Array.from(verticesMap.values()).filter(v => v.hexes.length <= 2);
  const coastalEdges = Array.from(edgesMap.values()).filter(e => e.hexes.length === 1);

  const portsPool = isExtended ? [
    { type: '3:1', resource: 'any' },
    { type: '3:1', resource: 'any' },
    { type: '3:1', resource: 'any' },
    { type: '3:1', resource: 'any' },
    { type: '3:1', resource: 'any' },
    { type: '2:1', resource: 'wood' },
    { type: '2:1', resource: 'brick' },
    { type: '2:1', resource: 'sheep' },
    { type: '2:1', resource: 'wheat' },
    { type: '2:1', resource: 'ore' },
    { type: '2:1', resource: 'sheep' }
  ] : [
    { type: '3:1', resource: 'any' },
    { type: '3:1', resource: 'any' },
    { type: '3:1', resource: 'any' },
    { type: '3:1', resource: 'any' },
    { type: '2:1', resource: 'wood' },
    { type: '2:1', resource: 'brick' },
    { type: '2:1', resource: 'sheep' },
    { type: '2:1', resource: 'wheat' },
    { type: '2:1', resource: 'ore' }
  ];

  const shuffledPorts = shuffle(portsPool);
  // Distribuir puertos espaciados entre aristas costeras
  const step = Math.max(1, Math.floor(coastalEdges.length / shuffledPorts.length));
  const ports = [];

  for (let i = 0; i < shuffledPorts.length; i++) {
    const edgeIndex = (i * step) % coastalEdges.length;
    const edge = coastalEdges[edgeIndex];
    const portData = {
      id: `port_${i}`,
      type: shuffledPorts[i].type,
      resource: shuffledPorts[i].resource,
      edgeId: edge.id,
      v1: edge.v1,
      v2: edge.v2
    };
    ports.push(portData);
    verticesMap.get(edge.v1).port = portData;
    verticesMap.get(edge.v2).port = portData;
  }

  return {
    hexes,
    vertices: Object.fromEntries(verticesMap),
    edges: Object.fromEntries(edgesMap),
    ports,
    robberHexId
  };
}

class CatanGameInstance {
  constructor({ id, roomCode, title, hostPlayer, mapType = 'classic', targetPoints = 10, turnTimeLimit = 60 }) {
    this.id = id || Math.random().toString(36).substring(2, 9);
    this.roomCode = roomCode || this.id.toUpperCase();
    this.title = title || (hostPlayer?.username ? `Partida de ${hostPlayer.username}` : 'Partida de Catán');
    this.mapType = mapType; // 'classic' (max 4) | 'extended' (max 6)
    this.maxPlayers = mapType === 'extended' ? 6 : 4;
    this.targetPoints = targetPoints;
    this.turnTimeLimit = turnTimeLimit; // segundos por turno, 0 = sin límite

    this.state = 'lobby'; // 'lobby' | 'playing' | 'finished'
    this.phase = 'setup_round_1'; // 'setup_round_1' | 'setup_round_2' | 'main' | 'special_building'
    this.subphase = 'settlement'; // en setup: 'settlement' | 'road'. En main: 'roll' | 'discard' | 'robber' | 'steal' | 'trade_and_build'

    this.players = [];
    this.currentTurnIndex = 0;
    this.dice = [1, 1];
    this.lastRoll = 2;
    this.turnCount = 0;
    this.winner = null;

    this.board = null;
    this.devCardDeck = [];

    // Ladrón y descartes pendientes
    this.pendingDiscards = {}; // playerId -> cantidad a descartar
    this.robberVictims = []; // playerIds con poblado/ciudad en el nuevo hex del ladrón

    // Comercio doméstico activo
    this.activeTrade = null; // { fromPlayerId, offer: {}, request: {}, responses: { playerId: 'accept' | 'reject' | counterOffer } }

    // Fase especial de construcción (para 5-6 jugadores)
    this.specialBuildPlayerIndex = -1;
    this.specialBuildPlayerId = null;
    this.specialBuildQueue = [];

    // Estado del Gran Camino y Mayor Ejército
    this.longestRoadHolder = null; // { playerId, length }
    this.largestArmyHolder = null; // { playerId, count }

    // Historial de eventos y chat
    this.logs = [];
    this.messages = [];

    // Temporizador
    this.turnDeadline = null;

    if (hostPlayer) {
      this.addPlayer(hostPlayer, true);
    }
  }

  log(text, type = 'info') {
    this.logs.push({
      id: Math.random().toString(36).substring(2, 9),
      text,
      type,
      timestamp: Date.now()
    });
    if (this.logs.length > 200) this.logs.shift();
  }

  addPlayer(user, isHost = false) {
    if (this.state !== 'lobby') throw new Error('El juego ya ha comenzado.');
    if (this.players.length >= this.maxPlayers) throw new Error('La sala está llena.');
    if (this.players.find(p => p.id === user.id)) throw new Error('El jugador ya está en la sala.');

    const availableColors = ['#EF4444', '#3B82F6', '#F97316', '#FFFFFF', '#10B981', '#8B5CF6'];
    const usedColors = this.players.map(p => p.color);
    const color = availableColors.find(c => !usedColors.includes(c)) || '#9CA3AF';

    const player = {
      id: user.id,
      username: user.username,
      avatar: user.avatar || '🧑‍🌾',
      color,
      isHost,
      isReady: isHost, // Host listo por defecto
      isBot: Boolean(user.isBot),
      botDifficulty: user.botDifficulty || 'medium',
      connected: true,
      resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
      devCards: [], // { type, turnBought }
      playedDevCards: [],
      playedKnights: 0,
      settlementsCount: 0,
      citiesCount: 0,
      roadsCount: 0,
      longestRoadLength: 0,
      hasPlayedDevCardThisTurn: false,
      victoryPoints: 0, // Puntos públicos
      secretVictoryPoints: 0 // Suma de cartas PV
    };

    this.players.push(player);
    this.log(`${player.username} se unió a la sala.`);
    return player;
  }

  removePlayer(playerId) {
    const idx = this.players.findIndex(p => p.id === playerId);
    if (idx === -1) return;
    const removed = this.players[idx];
    this.players.splice(idx, 1);
    this.log(`${removed.username} abandonó la partida.`);

    if (removed.isHost && this.players.length > 0) {
      this.players[0].isHost = true;
      this.players[0].isReady = true;
      this.log(`${this.players[0].username} es el nuevo anfitrión.`);
    }
  }

  startGame() {
    if (this.players.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para comenzar.');
    }
    this.board = generateBoardGraph(this.mapType);
    this.devCardDeck = shuffle(this.mapType === 'extended' ? DEV_DECK_6P : DEV_DECK_4P);
    
    // Aleatorizar orden de turnos
    this.players = shuffle(this.players);
    this.currentTurnIndex = 0;
    this.state = 'playing';
    this.phase = 'setup_round_1';
    this.subphase = 'settlement';
    this.turnCount = 1;

    this.resetTurnTimer();
    this.log(`¡Comenzó la partida! Orden de turnos: ${this.players.map(p => p.username).join(' ➔ ')}`);
    this.log(`Fase inicial de colocación: Ronda 1. Turno de ${this.getCurrentPlayer().username}.`);
  }

  getCurrentPlayer() {
    if (this.phase === 'special_building' && this.specialBuildPlayerId) {
      return this.players.find(p => p.id === this.specialBuildPlayerId) || this.players[this.currentTurnIndex];
    }
    return this.players[this.currentTurnIndex];
  }

  resetTurnTimer() {
    if (this.turnTimeLimit > 0) {
      this.turnDeadline = Date.now() + this.turnTimeLimit * 1000;
    } else {
      this.turnDeadline = null;
    }
  }

  // --- COLOCACIÓN INICIAL ---
  buildInitialSettlement(playerId, vertexId) {
    if (this.phase !== 'setup_round_1' && this.phase !== 'setup_round_2') {
      throw new Error('No estás en la fase de colocación inicial.');
    }
    if (this.subphase !== 'settlement') {
      throw new Error('Ya colocaste el poblado; ahora debes colocar un camino.');
    }
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) throw new Error('No es tu turno.');

    const vertex = this.board.vertices[vertexId];
    if (!vertex) throw new Error('Vértice inválido.');
    if (vertex.building) throw new Error('Ese vértice ya está ocupado.');

    // Regla de distancia: ningún vértice adyacente puede tener un edificio
    for (const adjVId of vertex.adjacentVertices) {
      if (this.board.vertices[adjVId]?.building) {
        throw new Error('Regla de distancia: debe haber al menos 2 caminos de separación entre poblados.');
      }
    }

    vertex.building = { type: 'settlement', playerId: player.id, color: player.color };
    player.settlementsCount += 1;
    player.victoryPoints += 1;

    // En la segunda ronda, recibe 1 recurso por cada hex adyacente
    if (this.phase === 'setup_round_2') {
      for (const hexId of vertex.hexes) {
        const hex = this.board.hexes.find(h => h.id === hexId);
        if (hex && hex.resource !== 'desert' && RESOURCE_TYPES.includes(hex.resource)) {
          player.resources[hex.resource] += 1;
          this.log(`${player.username} recibió 1 de ${hex.resource} por su poblado inicial.`);
        }
      }
    }

    this.lastBuiltSettlementVertexId = vertexId;
    this.subphase = 'road';
    this.log(`${player.username} fundó un poblado inicial.`);
    return true;
  }

  buildInitialRoad(playerId, edgeId) {
    if (this.phase !== 'setup_round_1' && this.phase !== 'setup_round_2') {
      throw new Error('No estás en la fase de colocación inicial.');
    }
    if (this.subphase !== 'road') {
      throw new Error('Primero debes colocar un poblado.');
    }
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) throw new Error('No es tu turno.');

    const edge = this.board.edges[edgeId];
    if (!edge) throw new Error('Arista inválida.');
    if (edge.road) throw new Error('Ya hay un camino construido aquí.');

    // El camino debe tocar el poblado que se acaba de construir
    if (edge.v1 !== this.lastBuiltSettlementVertexId && edge.v2 !== this.lastBuiltSettlementVertexId) {
      throw new Error('El camino inicial debe conectarse directamente al poblado que acabas de construir.');
    }

    edge.road = { playerId: player.id, color: player.color };
    player.roadsCount += 1;
    this.log(`${player.username} construyó un camino inicial.`);

    // Avanzar turno en snake draft
    this.advanceSetupTurn();
    return true;
  }

  advanceSetupTurn() {
    this.subphase = 'settlement';
    this.lastBuiltSettlementVertexId = null;

    if (this.phase === 'setup_round_1') {
      if (this.currentTurnIndex < this.players.length - 1) {
        this.currentTurnIndex += 1;
      } else {
        // Fin de la ronda 1: empezamos la ronda 2 con el mismo último jugador
        this.phase = 'setup_round_2';
        this.log(`Fase inicial: Ronda 2 (orden inverso). Turno de ${this.getCurrentPlayer().username}.`);
      }
    } else if (this.phase === 'setup_round_2') {
      if (this.currentTurnIndex > 0) {
        this.currentTurnIndex -= 1;
      } else {
        // Fin de la fase de preparación: comienza la fase principal
        this.phase = 'main';
        this.subphase = 'roll';
        this.currentTurnIndex = 0;
        this.turnCount = 1;
        this.log(`¡Finalizó la preparación! Comienza el juego principal con el turno de ${this.getCurrentPlayer().username}.`);
      }
    }
    this.resetTurnTimer();
  }

  // --- TURNO REGULAR: TIRAR DADOS ---
  rollDice(playerId) {
    if (this.phase !== 'main' || this.subphase !== 'roll') {
      throw new Error('No es momento de tirar los dados.');
    }
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) throw new Error('No es tu turno.');

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;
    this.dice = [d1, d2];
    this.lastRoll = sum;
    this.rollCount = (this.rollCount || 0) + 1;
    this.lastRoller = { id: player.id, username: player.username, avatar: player.avatar, color: player.color };

    this.log(`🎲 ${player.username} tiró los dados: ${d1} + ${d2} = ${sum}`);

    if (sum === 7) {
      this.handleSevenRolled();
    } else {
      this.distributeResources(sum);
      this.subphase = 'trade_and_build';
    }
    return { dice: this.dice, sum };
  }

  distributeResources(rollNumber) {
    const producingHexes = this.board.hexes.filter(h => h.number === rollNumber && !h.hasRobber);
    const gains = {};

    for (const hex of producingHexes) {
      for (const vId of hex.vertices) {
        const vertex = this.board.vertices[vId];
        if (vertex.building) {
          const owner = this.players.find(p => p.id === vertex.building.playerId);
          if (owner) {
            const amount = vertex.building.type === 'city' ? 2 : 1;
            owner.resources[hex.resource] += amount;

            if (!gains[owner.username]) gains[owner.username] = {};
            gains[owner.username][hex.resource] = (gains[owner.username][hex.resource] || 0) + amount;
          }
        }
      }
    }

    const summaries = Object.entries(gains).map(([name, res]) => {
      const details = Object.entries(res).map(([r, a]) => `${a} de ${r}`).join(', ');
      return `${name} obtuvo ${details}`;
    });

    if (summaries.length > 0) {
      this.log(`🌾 Producción (${rollNumber}): ${summaries.join(' | ')}`);
    } else {
      this.log(`🌾 Producción (${rollNumber}): Ningún jugador obtuvo recursos.`);
    }
  }

  handleSevenRolled() {
    this.pendingDiscards = {};
    for (const p of this.players) {
      const totalCards = Object.values(p.resources).reduce((a, b) => a + b, 0);
      if (totalCards > 7) {
        const mustDiscard = Math.floor(totalCards / 2);
        this.pendingDiscards[p.id] = mustDiscard;
        this.log(`⚠️ ${p.username} tiene ${totalCards} cartas y debe descartar ${mustDiscard}.`);
      }
    }

    if (Object.keys(this.pendingDiscards).length > 0) {
      this.subphase = 'discard';
    } else {
      this.subphase = 'robber';
      this.log(`${this.getCurrentPlayer().username} debe mover al ladrón.`);
    }
  }

  discardCards(playerId, discardSelection) {
    if (this.subphase !== 'discard') throw new Error('No es momento de descartar cartas.');
    const needed = this.pendingDiscards[playerId];
    if (!needed) throw new Error('No tienes cartas pendientes por descartar.');

    const player = this.players.find(p => p.id === playerId);
    let totalDiscarding = 0;

    for (const [res, count] of Object.entries(discardSelection)) {
      if (count < 0) throw new Error('Cantidad inválida.');
      if ((player.resources[res] || 0) < count) {
        throw new Error(`No tienes suficiente ${res} para descartar.`);
      }
      totalDiscarding += count;
    }

    if (totalDiscarding !== needed) {
      throw new Error(`Debes descartar exactamente ${needed} cartas (seleccionaste ${totalDiscarding}).`);
    }

    for (const [res, count] of Object.entries(discardSelection)) {
      player.resources[res] -= count;
    }

    delete this.pendingDiscards[playerId];
    this.log(`${player.username} descartó ${needed} cartas.`);

    if (Object.keys(this.pendingDiscards).length === 0) {
      this.subphase = 'robber';
      this.log(`Todos han descartado. ${this.getCurrentPlayer().username} debe mover al ladrón.`);
    }
    return true;
  }

  moveRobber(playerId, targetHexId) {
    if (this.subphase !== 'robber') throw new Error('No estás en fase de mover al ladrón.');
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) throw new Error('No es tu turno.');

    const currentRobberHex = this.board.hexes.find(h => h.hasRobber);
    if (currentRobberHex && currentRobberHex.id === targetHexId) {
      throw new Error('Debes mover al ladrón a un hexágono diferente.');
    }

    const targetHex = this.board.hexes.find(h => h.id === targetHexId);
    if (!targetHex) throw new Error('Hexágono destino inválido.');

    if (currentRobberHex) currentRobberHex.hasRobber = false;
    targetHex.hasRobber = true;
    this.board.robberHexId = targetHexId;

    // Buscar posibles víctimas (jugadores adyacentes distintos al activo que tengan recursos)
    const victimIds = new Set();
    for (const vId of targetHex.vertices) {
      const vertex = this.board.vertices[vId];
      if (vertex.building && vertex.building.playerId !== player.id) {
        const vic = this.players.find(p => p.id === vertex.building.playerId);
        const cardCount = Object.values(vic.resources).reduce((a, b) => a + b, 0);
        if (cardCount > 0) {
          victimIds.add(vic.id);
        }
      }
    }

    this.robberVictims = Array.from(victimIds);

    if (this.robberVictims.length === 0) {
      this.log(`🥷 ${player.username} movió al ladrón pero no hay nadie a quien robar.`);
      this.subphase = 'trade_and_build';
    } else {
      this.subphase = 'steal';
      this.log(`🥷 ${player.username} movió al ladrón y debe elegir una víctima para robar.`);
    }
    return true;
  }

  stealResource(playerId, victimId) {
    if (this.subphase !== 'steal') throw new Error('No es momento de robar.');
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) throw new Error('No es tu turno.');

    if (!this.robberVictims.includes(victimId)) {
      throw new Error('La víctima seleccionada no es válida.');
    }

    const victim = this.players.find(p => p.id === victimId);
    const pool = [];
    for (const [res, count] of Object.entries(victim.resources)) {
      for (let i = 0; i < count; i++) pool.push(res);
    }

    if (pool.length === 0) {
      this.subphase = 'trade_and_build';
      return null;
    }

    const stolenResource = pool[Math.floor(Math.random() * pool.length)];
    victim.resources[stolenResource] -= 1;
    player.resources[stolenResource] += 1;

    this.log(`🥷 ${player.username} le robó 1 carta misteriosa a ${victim.username}.`);
    this.subphase = 'trade_and_build';
    return { stolenResource, victimName: victim.username };
  }

  // --- CONSTRUCCIÓN ---
  canAfford(player, cost) {
    for (const [res, count] of Object.entries(cost)) {
      if ((player.resources[res] || 0) < count) return false;
    }
    return true;
  }

  deductCost(player, cost) {
    for (const [res, count] of Object.entries(cost)) {
      player.resources[res] -= count;
    }
  }

  buildRoad(playerId, edgeId, isFree = false) {
    if (this.phase !== 'main' && this.phase !== 'special_building') throw new Error('No es momento de construir caminos.');
    const player = this.players.find(p => p.id === playerId);
    const isCurrent = this.getCurrentPlayer().id === playerId;

    if (!isCurrent) {
      throw new Error('No es tu turno.');
    }

    if (!isFree && !this.canAfford(player, COSTS.road)) {
      throw new Error('No tienes suficientes recursos para construir un camino (cuesta 1 madera, 1 arcilla).');
    }

    if (player.roadsCount >= 15) throw new Error('Ya has construido el máximo de 15 caminos.');

    const edge = this.board.edges[edgeId];
    if (!edge) throw new Error('Arista inválida.');
    if (edge.road) throw new Error('Ya hay un camino aquí.');

    // Conectividad de caminos: debe conectar con un camino o asentamiento/ciudad propio
    const connectsToOwnBuilding = (vId) => {
      const v = this.board.vertices[vId];
      return v && v.building && v.building.playerId === player.id;
    };

    const connectsToOwnRoad = (vId) => {
      const v = this.board.vertices[vId];
      // Si hay un edificio enemigo en este vértice, corta el paso del camino
      if (v.building && v.building.playerId !== player.id) return false;
      return v.adjacentEdges.some(eId => eId !== edgeId && this.board.edges[eId]?.road?.playerId === player.id);
    };

    const validConnection = connectsToOwnBuilding(edge.v1) || connectsToOwnBuilding(edge.v2) ||
      connectsToOwnRoad(edge.v1) || connectsToOwnRoad(edge.v2);

    if (!validConnection) {
      throw new Error('El camino debe estar conectado a una de tus carreteras o asentamientos.');
    }

    if (!isFree) this.deductCost(player, COSTS.road);
    edge.road = { playerId: player.id, color: player.color };
    player.roadsCount += 1;

    this.log(`🛣️ ${player.username} construyó un camino.`);
    this.updateLongestRoad();
    this.checkWinner();
    return true;
  }

  buildSettlement(playerId, vertexId) {
    if (this.phase !== 'main' && this.phase !== 'special_building') throw new Error('No es momento de construir.');
    const player = this.players.find(p => p.id === playerId);
    const isCurrent = this.getCurrentPlayer().id === playerId;

    if (!isCurrent) {
      throw new Error('No es tu turno.');
    }

    if (!this.canAfford(player, COSTS.settlement)) {
      throw new Error('No tienes recursos para un poblado (cuesta 1 madera, 1 arcilla, 1 trigo, 1 oveja).');
    }

    if (player.settlementsCount >= 5) throw new Error('Ya has construido el máximo de 5 poblados.');

    const vertex = this.board.vertices[vertexId];
    if (!vertex) throw new Error('Vértice inválido.');
    if (vertex.building) throw new Error('Ya hay una construcción en este vértice.');

    // Regla de distancia
    for (const adjVId of vertex.adjacentVertices) {
      if (this.board.vertices[adjVId]?.building) {
        throw new Error('Regla de distancia: los poblados deben estar separados por al menos 2 aristas.');
      }
    }

    // Debe conectar con al menos un camino propio
    const touchesOwnRoad = vertex.adjacentEdges.some(eId => this.board.edges[eId]?.road?.playerId === player.id);
    if (!touchesOwnRoad) {
      throw new Error('El poblado debe estar conectado a uno de tus caminos.');
    }

    this.deductCost(player, COSTS.settlement);
    vertex.building = { type: 'settlement', playerId: player.id, color: player.color };
    player.settlementsCount += 1;
    player.victoryPoints += 1;

    this.log(`🏠 ${player.username} fundó un poblado (+1 PV).`);
    this.updateLongestRoad();
    this.checkWinner();
    return true;
  }

  buildCity(playerId, vertexId) {
    if (this.phase !== 'main' && this.phase !== 'special_building') throw new Error('No es momento de construir.');
    const player = this.players.find(p => p.id === playerId);
    const isCurrent = this.getCurrentPlayer().id === playerId;

    if (!isCurrent) {
      throw new Error('No es tu turno.');
    }

    if (!this.canAfford(player, COSTS.city)) {
      throw new Error('No tienes recursos para una ciudad (cuesta 2 trigo, 3 mineral).');
    }

    if (player.citiesCount >= 4) throw new Error('Ya has construido el máximo de 4 ciudades.');

    const vertex = this.board.vertices[vertexId];
    if (!vertex) throw new Error('Vértice inválido.');
    if (!vertex.building || vertex.building.type !== 'settlement' || vertex.building.playerId !== player.id) {
      throw new Error('Solo puedes construir una ciudad mejorando uno de tus poblados existentes.');
    }

    this.deductCost(player, COSTS.city);
    vertex.building.type = 'city';
    player.settlementsCount -= 1; // Recupera el poblado a su reserva
    player.citiesCount += 1;
    player.victoryPoints += 1; // Poblado valía 1, ciudad vale 2 (diferencia +1)

    this.log(`🏰 ${player.username} mejoró su poblado a ciudad (+1 PV, produce el doble).`);
    this.checkWinner();
    return true;
  }

  buyDevCard(playerId) {
    if (this.phase !== 'main' && this.phase !== 'special_building') throw new Error('No es momento de comprar cartas de desarrollo.');
    const player = this.players.find(p => p.id === playerId);
    const isCurrent = this.getCurrentPlayer().id === playerId;

    if (!isCurrent) {
      throw new Error('No es tu turno.');
    }

    if (!this.canAfford(player, COSTS.devCard)) {
      throw new Error('No tienes recursos para una carta de desarrollo (1 oveja, 1 trigo, 1 mineral).');
    }

    if (this.devCardDeck.length === 0) {
      throw new Error('El mazo de cartas de desarrollo está vacío.');
    }

    this.deductCost(player, COSTS.devCard);
    const cardType = this.devCardDeck.pop();
    player.devCards.push({ type: cardType, turnBought: this.turnCount });

    if (cardType === 'victory_point') {
      player.secretVictoryPoints += 1;
    }

    this.log(`🃏 ${player.username} compró una carta de desarrollo.`);
    this.checkWinner();
    return cardType;
  }

  playDevCard(playerId, cardType, params = {}) {
    if (this.phase !== 'main') throw new Error('No puedes jugar cartas ahora.');
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) throw new Error('Solo puedes jugar cartas en tu turno.');

    if (player.hasPlayedDevCardThisTurn && cardType !== 'victory_point') {
      throw new Error('Solo puedes jugar una carta de desarrollo por turno.');
    }

    const cardIndex = player.devCards.findIndex(c => c.type === cardType && c.turnBought < this.turnCount);
    if (cardIndex === -1) {
      throw new Error('No tienes esa carta o fue comprada en este mismo turno.');
    }

    // Remover la carta de la mano
    player.devCards.splice(cardIndex, 1);
    player.playedDevCards.push(cardType);
    player.hasPlayedDevCardThisTurn = true;

    if (cardType === 'knight') {
      player.playedKnights += 1;
      this.log(`⚔️ ${player.username} jugó un Caballero.`);
      this.updateLargestArmy();
      this.subphase = 'robber';
    } else if (cardType === 'year_of_plenty') {
      // params.r1, params.r2
      const { r1, r2 } = params;
      if (!RESOURCE_TYPES.includes(r1) || !RESOURCE_TYPES.includes(r2)) {
        throw new Error('Recursos inválidos para Año de la Abundancia.');
      }
      player.resources[r1] += 1;
      player.resources[r2] += 1;
      this.log(`🎉 ${player.username} jugó Año de la Abundancia y tomó 1 ${r1} y 1 ${r2}.`);
    } else if (cardType === 'monopoly') {
      // params.resource
      const { resource } = params;
      if (!RESOURCE_TYPES.includes(resource)) throw new Error('Recurso inválido para Monopolio.');
      let totalClaimed = 0;
      for (const p of this.players) {
        if (p.id !== player.id) {
          const count = p.resources[resource] || 0;
          totalClaimed += count;
          p.resources[resource] = 0;
        }
      }
      player.resources[resource] += totalClaimed;
      this.log(`💰 ${player.username} jugó Monopolio sobre ${resource} y obtuvo ${totalClaimed} cartas.`);
    } else if (cardType === 'road_building') {
      // Le otorgamos 2 caminos gratis (params.edge1, params.edge2 opcionales)
      this.log(`🚧 ${player.username} jugó Construcción de Carreteras (coloca 2 caminos gratis).`);
      this.freeRoadsRemaining = 2;
    }

    this.checkWinner();
    return true;
  }

  // --- COMERCIO CON LA BANCA Y PUERTOS ---
  getPlayerBestRatio(playerId, resource) {
    const player = this.players.find(p => p.id === playerId);
    let bestRatio = 4; // Banca por defecto

    // Revisar los vértices donde el jugador tiene poblado o ciudad
    for (const vertex of Object.values(this.board.vertices)) {
      if (vertex.building && vertex.building.playerId === player.id && vertex.port) {
        if (vertex.port.type === '2:1' && vertex.port.resource === resource) {
          return 2;
        }
        if (vertex.port.type === '3:1') {
          bestRatio = Math.min(bestRatio, 3);
        }
      }
    }
    return bestRatio;
  }

  tradeWithBank(playerId, giveResource, getResource) {
    if (this.phase !== 'main' || this.subphase !== 'trade_and_build') {
      throw new Error('No es momento de comerciar.');
    }
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) throw new Error('No es tu turno.');

    if (!RESOURCE_TYPES.includes(giveResource) || !RESOURCE_TYPES.includes(getResource)) {
      throw new Error('Tipo de recurso inválido.');
    }
    if (giveResource === getResource) throw new Error('Debes intercambiar por un recurso diferente.');

    const requiredRatio = this.getPlayerBestRatio(playerId, giveResource);
    if ((player.resources[giveResource] || 0) < requiredRatio) {
      throw new Error(`Necesitas ${requiredRatio} de ${giveResource} para comerciar.`);
    }

    player.resources[giveResource] -= requiredRatio;
    player.resources[getResource] += 1;

    this.log(`⚖️ ${player.username} comerció ${requiredRatio} ${giveResource} por 1 ${getResource} con la banca/puerto.`);
    return true;
  }

  // --- COMERCIO DOMÉSTICO (ENTRE JUGADORES) ---
  proposeTrade(playerId, offer, request) {
    if (this.phase !== 'main' || this.subphase !== 'trade_and_build') {
      throw new Error('No es momento de comerciar.');
    }
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) throw new Error('Solo el jugador activo puede iniciar comercios.');

    for (const [res, count] of Object.entries(offer)) {
      if ((player.resources[res] || 0) < count) {
        throw new Error(`No tienes suficiente ${res} para ofrecer.`);
      }
    }

    this.activeTrade = {
      id: Math.random().toString(36).substring(2, 9),
      fromPlayerId: player.id,
      offer,
      request,
      responses: {}
    };

    const offerStr = Object.entries(offer).filter(([, c]) => c > 0).map(([r, c]) => `${c} ${r}`).join(', ');
    const reqStr = Object.entries(request).filter(([, c]) => c > 0).map(([r, c]) => `${c} ${r}`).join(', ');
    this.log(`🤝 ${player.username} propuso un comercio: Ofrece [${offerStr}] por [${reqStr}].`);
    return this.activeTrade;
  }

  respondToTrade(playerId, accept) {
    if (!this.activeTrade) throw new Error('No hay una propuesta de comercio activa.');
    const responder = this.players.find(p => p.id === playerId);
    if (!responder) throw new Error('Jugador inválido.');

    if (accept) {
      for (const [res, count] of Object.entries(this.activeTrade.request)) {
        if ((responder.resources[res] || 0) < count) {
          throw new Error(`No tienes suficiente ${res} para aceptar el intercambio.`);
        }
      }
      this.activeTrade.responses[playerId] = 'accept';
      this.log(`👍 ${responder.username} está dispuesto a aceptar el comercio.`);
    } else {
      this.activeTrade.responses[playerId] = 'reject';
    }
    return this.activeTrade;
  }

  executeTrade(playerId, targetPartnerId) {
    if (!this.activeTrade) throw new Error('No hay comercio activo.');
    const activePlayer = this.getCurrentPlayer();
    if (activePlayer.id !== playerId) throw new Error('Solo el jugador activo puede confirmar el trato.');

    const partner = this.players.find(p => p.id === targetPartnerId);
    if (!partner) throw new Error('Socio de comercio inválido.');

    // Verificar recursos de ambas partes
    for (const [res, count] of Object.entries(this.activeTrade.offer)) {
      if ((activePlayer.resources[res] || 0) < count) throw new Error(`El proponente no tiene suficiente ${res}.`);
    }
    for (const [res, count] of Object.entries(this.activeTrade.request)) {
      if ((partner.resources[res] || 0) < count) throw new Error(`${partner.username} no tiene suficiente ${res}.`);
    }

    // Transferir
    for (const [res, count] of Object.entries(this.activeTrade.offer)) {
      activePlayer.resources[res] -= count;
      partner.resources[res] += count;
    }
    for (const [res, count] of Object.entries(this.activeTrade.request)) {
      partner.resources[res] -= count;
      activePlayer.resources[res] += count;
    }

    this.log(`🎉 Comercio completado con éxito entre ${activePlayer.username} y ${partner.username}.`);
    this.activeTrade = null;
    return true;
  }

  cancelTrade(playerId) {
    if (this.activeTrade && this.activeTrade.fromPlayerId === playerId) {
      this.activeTrade = null;
      this.log('Comercio cancelado.');
    }
  }

  // --- CÁLCULO DE GRAN CAMINO (LONGEST ROAD) ---
  calculatePlayerLongestRoad(playerId) {
    const playerRoadEdges = Object.values(this.board.edges).filter(e => e.road?.playerId === playerId);
    if (playerRoadEdges.length < 5) return playerRoadEdges.length;

    let maxLength = 0;

    // Recorrido en profundidad DFS por aristas sin repetir arista
    const visitedEdges = new Set();

    const dfs = (currentVertexId, currentLength) => {
      maxLength = Math.max(maxLength, currentLength);
      const v = this.board.vertices[currentVertexId];
      if (!v) return;

      for (const eId of v.adjacentEdges) {
        if (!visitedEdges.has(eId)) {
          const edge = this.board.edges[eId];
          if (edge && edge.road?.playerId === playerId) {
            const nextVertexId = edge.v1 === currentVertexId ? edge.v2 : edge.v1;
            const nextVertex = this.board.vertices[nextVertexId];

            // Si hay un asentamiento enemigo, el camino no puede continuar más allá de ese vértice
            const blockedByEnemy = nextVertex.building && nextVertex.building.playerId !== playerId;

            visitedEdges.add(eId);
            if (!blockedByEnemy) {
              dfs(nextVertexId, currentLength + 1);
            } else {
              maxLength = Math.max(maxLength, currentLength + 1);
            }
            visitedEdges.delete(eId);
          }
        }
      }
    };

    // Probar desde cada vértice que toque una carretera del jugador
    const candidateVertices = new Set();
    for (const e of playerRoadEdges) {
      candidateVertices.add(e.v1);
      candidateVertices.add(e.v2);
    }

    for (const startVId of candidateVertices) {
      dfs(startVId, 0);
    }

    return maxLength;
  }

  updateLongestRoad() {
    let currentBest = this.longestRoadHolder ? this.longestRoadHolder.length : 4;
    let newHolderId = this.longestRoadHolder ? this.longestRoadHolder.playerId : null;

    for (const p of this.players) {
      const length = this.calculatePlayerLongestRoad(p.id);
      p.longestRoadLength = length;
      if (length > currentBest) {
        currentBest = length;
        newHolderId = p.id;
      }
    }

    if (newHolderId && (!this.longestRoadHolder || this.longestRoadHolder.playerId !== newHolderId)) {
      if (this.longestRoadHolder) {
        const oldHolder = this.players.find(p => p.id === this.longestRoadHolder.playerId);
        if (oldHolder) oldHolder.victoryPoints -= 2;
      }
      const newHolder = this.players.find(p => p.id === newHolderId);
      newHolder.victoryPoints += 2;
      this.longestRoadHolder = { playerId: newHolderId, length: currentBest };
      this.log(`🏆 ¡${newHolder.username} obtuvo la Gran Ruta Comercial (2 PV) con una longitud de ${currentBest}!`);
    }
  }

  updateLargestArmy() {
    let currentBest = this.largestArmyHolder ? this.largestArmyHolder.count : 2;
    let newHolderId = this.largestArmyHolder ? this.largestArmyHolder.playerId : null;

    for (const p of this.players) {
      if (p.playedKnights > currentBest) {
        currentBest = p.playedKnights;
        newHolderId = p.id;
      }
    }

    if (newHolderId && (!this.largestArmyHolder || this.largestArmyHolder.playerId !== newHolderId)) {
      if (this.largestArmyHolder) {
        const oldHolder = this.players.find(p => p.id === this.largestArmyHolder.playerId);
        if (oldHolder) oldHolder.victoryPoints -= 2;
      }
      const newHolder = this.players.find(p => p.id === newHolderId);
      newHolder.victoryPoints += 2;
      this.largestArmyHolder = { playerId: newHolderId, count: currentBest };
      this.log(`⚔️ ¡${newHolder.username} tomó el Mayor Ejército (2 PV) con ${currentBest} caballeros!`);
    }
  }

  // --- FINALIZAR TURNO Y FASE ESPECIAL DE 5-6 JUGADORES ---
  endTurn(playerId) {
    if (this.phase !== 'main' || (this.subphase !== 'trade_and_build' && this.subphase !== 'roll')) {
      throw new Error('No puedes pasar el turno ahora.');
    }
    const current = this.getCurrentPlayer();
    if (current.id !== playerId) throw new Error('No es tu turno.');

    current.hasPlayedDevCardThisTurn = false;
    this.activeTrade = null;

    // Regla de extensión para 5-6 jugadores: Fase especial de construcción
    if (this.mapType === 'extended' && this.players.length > 4) {
      this.phase = 'special_building';
      this.subphase = 'trade_and_build';
      this.specialBuildQueue = [];
      for (let i = 1; i < this.players.length; i++) {
        const nextIdx = (this.currentTurnIndex + i) % this.players.length;
        this.specialBuildQueue.push(this.players[nextIdx].id);
      }
      this.advanceSpecialBuilding();
      return;
    }

    this.passToNextPlayer();
  }

  advanceSpecialBuilding() {
    if (this.specialBuildQueue.length === 0) {
      this.specialBuildPlayerId = null;
      this.phase = 'main';
      this.passToNextPlayer();
      return;
    }
    this.specialBuildPlayerId = this.specialBuildQueue.shift();
    const player = this.players.find(p => p.id === this.specialBuildPlayerId);
    this.resetTurnTimer();
    this.log(`🔨 Fase Especial de Construcción: Turno para ${player.username} (solo construir/comprar o pasar).`);
  }

  skipSpecialBuilding(playerId) {
    if (this.phase !== 'special_building') throw new Error('No estás en fase especial de construcción.');
    if (this.specialBuildPlayerId && playerId && this.specialBuildPlayerId !== playerId) {
      throw new Error('No es tu turno en la fase especial.');
    }
    this.advanceSpecialBuilding();
  }

  passToNextPlayer() {
    this.specialBuildPlayerId = null;
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    this.subphase = 'roll';
    this.turnCount += 1;
    this.resetTurnTimer();

    const nextPlayer = this.getCurrentPlayer();
    this.log(`Turno ${this.turnCount}: Le toca a ${nextPlayer.username}.`);

    this.checkWinner();
  }

  checkWinner() {
    for (const p of this.players) {
      const totalPoints = p.victoryPoints + p.secretVictoryPoints;
      if (totalPoints >= this.targetPoints) {
        this.winner = {
          id: p.id,
          username: p.username,
          color: p.color,
          points: totalPoints
        };
        this.state = 'finished';
        this.log(`🏆 ¡¡${p.username} ha ganado la partida con ${totalPoints} puntos de victoria!! 🎉`);
        return this.winner;
      }
    }
    return null;
  }

  // --- BOT HEURISTICS ---
  runBotTurn(botPlayer) {
    if (this.state !== 'playing') return null;

    // 0. Descartes del bot si sacó 7 (aplica para cualquier bot pendiente de descarte)
    if (this.subphase === 'discard' && this.pendingDiscards[botPlayer.id]) {
      const needed = this.pendingDiscards[botPlayer.id];
      const discard = { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 };
      let count = 0;
      for (const res of RESOURCE_TYPES) {
        while (botPlayer.resources[res] > (discard[res] || 0) && count < needed) {
          discard[res] = (discard[res] || 0) + 1;
          count++;
        }
      }
      this.discardCards(botPlayer.id, discard);
      return { action: 'discard', discard };
    }

    const current = this.getCurrentPlayer();
    if (current.id !== botPlayer.id) return null;

    // 1. Fase de Setup
    if (this.phase === 'setup_round_1' || this.phase === 'setup_round_2') {
      if (this.subphase === 'settlement') {
        // Encontrar el mejor vértice no ocupado (mayor suma de dots de recursos)
        let bestVertexId = null;
        let bestScore = -1;

        for (const [vId, v] of Object.entries(this.board.vertices)) {
          if (!v.building) {
            const hasAdjacentBuilding = v.adjacentVertices.some(adj => this.board.vertices[adj]?.building);
            if (!hasAdjacentBuilding) {
              let score = 0;
              const resTypes = new Set();
              for (const hId of v.hexes) {
                const hex = this.board.hexes.find(h => h.id === hId);
                if (hex && hex.resource !== 'desert') {
                  score += hex.dots || 0;
                  resTypes.add(hex.resource);
                }
              }
              // Bono por diversidad de recursos
              score += resTypes.size * 2;
              if (score > bestScore) {
                bestScore = score;
                bestVertexId = vId;
              }
            }
          }
        }
        if (bestVertexId) {
          this.buildInitialSettlement(botPlayer.id, bestVertexId);
          return { action: 'build_initial_settlement', vertexId: bestVertexId };
        }
      } else if (this.subphase === 'road') {
        // Conectar a arista adyacente del poblado
        const vertex = this.board.vertices[this.lastBuiltSettlementVertexId];
        const validEdge = vertex.adjacentEdges.find(eId => !this.board.edges[eId]?.road);
        if (validEdge) {
          this.buildInitialRoad(botPlayer.id, validEdge);
          return { action: 'build_initial_road', edgeId: validEdge };
        }
      }
    }

    // 3. Mover al ladrón
    if (this.subphase === 'robber') {
      // Buscar hex con mayor puntaje del rival líder
      const targetHex = this.board.hexes.find(h => !h.hasRobber && h.resource !== 'desert') || this.board.hexes[0];
      this.moveRobber(botPlayer.id, targetHex.id);
      return { action: 'move_robber', hexId: targetHex.id };
    }

    // 4. Robar
    if (this.subphase === 'steal') {
      if (this.robberVictims.length > 0) {
        const victimId = this.robberVictims[0];
        this.stealResource(botPlayer.id, victimId);
        return { action: 'steal', victimId };
      }
    }

    // 5. Tirar dados
    if (this.phase === 'main' && this.subphase === 'roll') {
      return this.rollDice(botPlayer.id);
    }

    // 6. Fase principal de construcción y comercio
    if (this.phase === 'main' && this.subphase === 'trade_and_build') {
      // Intentar mejorar a ciudad
      if (this.canAfford(botPlayer, COSTS.city) && botPlayer.citiesCount < 4) {
        for (const [vId, v] of Object.entries(this.board.vertices)) {
          if (v.building?.type === 'settlement' && v.building?.playerId === botPlayer.id) {
            try {
              this.buildCity(botPlayer.id, vId);
              return { action: 'build_city', vertexId: vId };
            } catch (e) {}
          }
        }
      }

      // Intentar construir poblado
      if (this.canAfford(botPlayer, COSTS.settlement) && botPlayer.settlementsCount < 5) {
        for (const [vId, v] of Object.entries(this.board.vertices)) {
          if (!v.building) {
            const hasDist = !v.adjacentVertices.some(adj => this.board.vertices[adj]?.building);
            const hasRoad = v.adjacentEdges.some(eId => this.board.edges[eId]?.road?.playerId === botPlayer.id);
            if (hasDist && hasRoad) {
              try {
                this.buildSettlement(botPlayer.id, vId);
                return { action: 'build_settlement', vertexId: vId };
              } catch (e) {}
            }
          }
        }
      }

      // Intentar comprar carta de desarrollo
      if (this.canAfford(botPlayer, COSTS.devCard) && this.devCardDeck.length > 0) {
        try {
          this.buyDevCard(botPlayer.id);
          return { action: 'buy_dev_card' };
        } catch (e) {}
      }

      // Intentar construir camino
      if (this.canAfford(botPlayer, COSTS.road) && botPlayer.roadsCount < 15) {
        for (const [eId, edge] of Object.entries(this.board.edges)) {
          if (!edge.road) {
            const connectsToOwnBuilding = (vId) => {
              const v = this.board.vertices[vId];
              return v && v.building && v.building.playerId === botPlayer.id;
            };
            const connectsToOwnRoad = (vId) => {
              const v = this.board.vertices[vId];
              if (v.building && v.building.playerId !== botPlayer.id) return false;
              return v.adjacentEdges.some(adjE => adjE !== eId && this.board.edges[adjE]?.road?.playerId === botPlayer.id);
            };
            const connects = connectsToOwnBuilding(edge.v1) || connectsToOwnBuilding(edge.v2) ||
              connectsToOwnRoad(edge.v1) || connectsToOwnRoad(edge.v2);
            if (connects) {
              try {
                this.buildRoad(botPlayer.id, eId);
                return { action: 'build_road', edgeId: eId };
              } catch (e) {}
            }
          }
        }
      }

      // Finalizar turno
      this.endTurn(botPlayer.id);
      return { action: 'end_turn' };
    }

    // 7. Fase especial de construcción para 5-6 jugadores
    if (this.phase === 'special_building') {
      if (this.canAfford(botPlayer, COSTS.city) && botPlayer.citiesCount < 4) {
        for (const [vId, v] of Object.entries(this.board.vertices)) {
          if (v.building?.type === 'settlement' && v.building?.playerId === botPlayer.id) {
            try {
              this.buildCity(botPlayer.id, vId);
              return { action: 'build_city', vertexId: vId };
            } catch (e) {}
          }
        }
      }

      if (this.canAfford(botPlayer, COSTS.settlement) && botPlayer.settlementsCount < 5) {
        for (const [vId, v] of Object.entries(this.board.vertices)) {
          if (!v.building) {
            const hasDist = !v.adjacentVertices.some(adj => this.board.vertices[adj]?.building);
            const hasRoad = v.adjacentEdges.some(eId => this.board.edges[eId]?.road?.playerId === botPlayer.id);
            if (hasDist && hasRoad) {
              try {
                this.buildSettlement(botPlayer.id, vId);
                return { action: 'build_settlement', vertexId: vId };
              } catch (e) {}
            }
          }
        }
      }

      if (this.canAfford(botPlayer, COSTS.devCard) && this.devCardDeck.length > 0) {
        try {
          this.buyDevCard(botPlayer.id);
          return { action: 'buy_dev_card' };
        } catch (e) {}
      }

      if (this.canAfford(botPlayer, COSTS.road) && botPlayer.roadsCount < 15) {
        for (const [eId, edge] of Object.entries(this.board.edges)) {
          if (!edge.road) {
            const connectsToOwnBuilding = (vId) => {
              const v = this.board.vertices[vId];
              return v && v.building && v.building.playerId === botPlayer.id;
            };
            const connectsToOwnRoad = (vId) => {
              const v = this.board.vertices[vId];
              if (v.building && v.building.playerId !== botPlayer.id) return false;
              return v.adjacentEdges.some(adjE => adjE !== eId && this.board.edges[adjE]?.road?.playerId === botPlayer.id);
            };
            const connects = connectsToOwnBuilding(edge.v1) || connectsToOwnBuilding(edge.v2) ||
              connectsToOwnRoad(edge.v1) || connectsToOwnRoad(edge.v2);
            if (connects) {
              try {
                this.buildRoad(botPlayer.id, eId);
                return { action: 'build_road', edgeId: eId };
              } catch (e) {}
            }
          }
        }
      }

      this.skipSpecialBuilding(botPlayer.id);
      return { action: 'skip_special_build' };
    }

    return null;
  }

  // Estado público y privado para serializar por WebSocket
  getPublicState() {
    return {
      id: this.id,
      roomCode: this.roomCode,
      title: this.title,
      mapType: this.mapType,
      maxPlayers: this.maxPlayers,
      targetPoints: this.targetPoints,
      turnTimeLimit: this.turnTimeLimit,
      turnDeadline: this.turnDeadline,
      state: this.state,
      phase: this.phase,
      subphase: this.subphase,
      turnCount: this.turnCount,
      currentTurnIndex: this.currentTurnIndex,
      activePlayerId: this.getCurrentPlayer()?.id,
      dice: this.dice,
      lastRoll: this.lastRoll,
      rollCount: this.rollCount || 0,
      lastRoller: this.lastRoller || null,
      winner: this.winner,
      longestRoadHolder: this.longestRoadHolder,
      largestArmyHolder: this.largestArmyHolder,
      devCardsRemaining: this.devCardDeck.length,
      pendingDiscards: Object.keys(this.pendingDiscards),
      robberVictims: this.robberVictims,
      activeTrade: this.activeTrade,
      board: this.board,
      logs: this.logs.slice(-30),
      players: this.players.map(p => ({
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        color: p.color,
        isHost: p.isHost,
        isReady: p.isReady,
        isBot: p.isBot,
        connected: p.connected,
        resourceCount: Object.values(p.resources).reduce((a, b) => a + b, 0),
        devCardsCount: p.devCards.length,
        playedKnights: p.playedKnights,
        settlementsCount: p.settlementsCount,
        citiesCount: p.citiesCount,
        roadsCount: p.roadsCount,
        longestRoadLength: p.longestRoadLength,
        victoryPoints: p.victoryPoints
      }))
    };
  }

  // Estado con cartas secretas para el jugador correspondiente
  getPlayerPrivateState(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;
    return {
      resources: player.resources,
      devCards: player.devCards,
      secretVictoryPoints: player.secretVictoryPoints,
      mustDiscard: this.pendingDiscards[playerId] || 0
    };
  }
}

module.exports = {
  CatanGameInstance,
  RESOURCE_TYPES,
  COSTS,
  PROB_DOTS
};
