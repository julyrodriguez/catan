// src/components/CatanBoard.jsx
import React, { useMemo } from 'react';
import { sounds } from '../utils/soundEffects';

const TERRAIN_CONFIG = {
  wood: {
    base: '#1b4332',
    stroke: '#2d6a4f',
    name: 'Bosque',
    label: 'Madera'
  },
  brick: {
    base: '#78290f',
    stroke: '#9d381e',
    name: 'Colina',
    label: 'Arcilla'
  },
  sheep: {
    base: '#386641',
    stroke: '#4f8059',
    name: 'Pasto',
    label: 'Oveja'
  },
  wheat: {
    base: '#a4711b',
    stroke: '#c98e29',
    name: 'Campo',
    label: 'Trigo'
  },
  ore: {
    base: '#374151',
    stroke: '#4b5563',
    name: 'Montaña',
    label: 'Mineral'
  },
  desert: {
    base: '#b0893a',
    stroke: '#cca14b',
    name: 'Desierto',
    label: 'Desierto'
  }
};

const PORT_CONFIG = {
  'any': { ratio: '3:1', label: '?', color: '#f59e0b' },
  'wood': { ratio: '2:1', label: 'Madera', color: '#74c69d' },
  'brick': { ratio: '2:1', label: 'Arcilla', color: '#f1948a' },
  'sheep': { ratio: '2:1', label: 'Oveja', color: '#a9dfbf' },
  'wheat': { ratio: '2:1', label: 'Trigo', color: '#f9e79f' },
  'ore': { ratio: '2:1', label: 'Mineral', color: '#e2e8f0' }
};

export default function CatanBoard({
  board,
  activePlayerId,
  currentUserId,
  phase,
  subphase,
  buildMode,
  onSelectVertex,
  onSelectEdge,
  onSelectHex
}) {
  if (!board || !board.hexes) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
        <span className="text-sm font-semibold tracking-wide">Construyendo el mapa de Catán...</span>
      </div>
    );
  }

  const isMyTurn = activePlayerId === currentUserId;

  // 1. Calcular ViewBox automático
  const viewBox = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (const h of board.hexes) {
      if (h.x - 75 < minX) minX = h.x - 75;
      if (h.x + 75 > maxX) maxX = h.x + 75;
      if (h.y - 75 < minY) minY = h.y - 75;
      if (h.y + 75 > maxY) maxY = h.y + 75;
    }

    const padding = 85;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    return `${minX - padding} ${minY - padding} ${width} ${height}`;
  }, [board]);

  // 2. Vértices legales
  const legalVertices = useMemo(() => {
    if (!isMyTurn) return new Set();
    const legal = new Set();

    if (phase === 'setup_round_1' || phase === 'setup_round_2') {
      if (subphase === 'settlement') {
        for (const [vId, v] of Object.entries(board.vertices)) {
          if (!v.building) {
            const hasNeighbor = v.adjacentVertices.some(
              adjId => board.vertices[adjId]?.building
            );
            if (!hasNeighbor) legal.add(vId);
          }
        }
      }
      return legal;
    }

    if (phase === 'main' || phase === 'special_building') {
      if (buildMode === 'settlement') {
        for (const [vId, v] of Object.entries(board.vertices)) {
          if (!v.building) {
            const hasDist = !v.adjacentVertices.some(adjId => board.vertices[adjId]?.building);
            const hasRoad = v.adjacentEdges.some(
              eId => board.edges[eId]?.road?.playerId === currentUserId
            );
            if (hasDist && hasRoad) legal.add(vId);
          }
        }
      } else if (buildMode === 'city') {
        for (const [vId, v] of Object.entries(board.vertices)) {
          if (v.building?.type === 'settlement' && v.building?.playerId === currentUserId) {
            legal.add(vId);
          }
        }
      }
    }

    return legal;
  }, [board, isMyTurn, phase, subphase, buildMode, currentUserId]);

  // 3. Aristas legales
  const legalEdges = useMemo(() => {
    if (!isMyTurn) return new Set();
    const legal = new Set();

    if ((phase === 'setup_round_1' || phase === 'setup_round_2') && subphase === 'road') {
      let myLastVertex = null;
      for (const [vId, v] of Object.entries(board.vertices)) {
        if (v.building && v.building.playerId === currentUserId) {
          const hasRoad = v.adjacentEdges.some(eId => board.edges[eId]?.road);
          if (!hasRoad) {
            myLastVertex = v;
            break;
          }
        }
      }

      if (myLastVertex) {
        for (const eId of myLastVertex.adjacentEdges) {
          if (!board.edges[eId]?.road) legal.add(eId);
        }
      }
      return legal;
    }

    if ((phase === 'main' || phase === 'special_building') && buildMode === 'road') {
      for (const [eId, edge] of Object.entries(board.edges)) {
        if (!edge.road) {
          const connectsToOwnBuilding = (vId) => {
            const v = board.vertices[vId];
            return v && v.building && v.building.playerId === currentUserId;
          };
          const connectsToOwnRoad = (vId) => {
            const v = board.vertices[vId];
            if (v.building && v.building.playerId !== currentUserId) return false;
            return v.adjacentEdges.some(
              adjE => adjE !== eId && board.edges[adjE]?.road?.playerId === currentUserId
            );
          };

          if (
            connectsToOwnBuilding(edge.v1) || connectsToOwnBuilding(edge.v2) ||
            connectsToOwnRoad(edge.v1) || connectsToOwnRoad(edge.v2)
          ) {
            legal.add(eId);
          }
        }
      }
    }

    return legal;
  }, [board, isMyTurn, phase, subphase, buildMode, currentUserId]);

  const isRobberSelectable = isMyTurn && subphase === 'robber';

  const handleVertexClick = (vId) => {
    if (legalVertices.has(vId)) {
      sounds.playBuild();
      onSelectVertex(vId);
    }
  };

  const handleEdgeClick = (eId) => {
    if (legalEdges.has(eId)) {
      sounds.playBuild();
      onSelectEdge(eId);
    }
  };

  const handleHexClick = (h) => {
    if (isRobberSelectable && !h.hasRobber) {
      sounds.playCardDraw();
      onSelectHex(h.id);
    }
  };

  return (
    <div className="board-container select-none">
      <svg
        viewBox={viewBox}
        className="board-svg drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Fondo oceánico con ondas y profundidad */}
          <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0c1b33" />
            <stop offset="60%" stopColor="#071120" />
            <stop offset="100%" stopColor="#030710" />
          </radialGradient>

          {/* Gradients de Terrenos con iluminación superior */}
          <linearGradient id="grad-wood" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d6a4f" />
            <stop offset="100%" stopColor="#143628" />
          </linearGradient>

          <linearGradient id="grad-brick" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b23a22" />
            <stop offset="100%" stopColor="#641e16" />
          </linearGradient>

          <linearGradient id="grad-sheep" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#588157" />
            <stop offset="100%" stopColor="#283618" />
          </linearGradient>

          <linearGradient id="grad-wheat" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cca14b" />
            <stop offset="100%" stopColor="#784d0b" />
          </linearGradient>

          <linearGradient id="grad-ore" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5c677d" />
            <stop offset="100%" stopColor="#272f3d" />
          </linearGradient>

          <linearGradient id="grad-desert" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4a373" />
            <stop offset="100%" stopColor="#8d633d" />
          </linearGradient>

          {/* Sombra de relieve para piezas */}
          <filter id="pieceShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="1" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.75" />
          </filter>

          {/* Sombra suave para fichas de números */}
          <filter id="chitShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* 1. Océano infinito */}
        <rect x="-3000" y="-3000" width="6000" height="6000" fill="url(#oceanGrad)" />

        {/* Ondas náuticas concéntricas decorativas */}
        <circle cx="0" cy="0" r="320" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="8 12" opacity="0.3" />
        <circle cx="0" cy="0" r="440" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="12 16" opacity="0.2" />

        {/* 2. Puertos Costeros */}
        {board.ports && board.ports.map((port) => {
          const v1 = board.vertices[port.v1];
          const v2 = board.vertices[port.v2];
          if (!v1 || !v2) return null;
          const midX = (v1.x + v2.x) / 2;
          const midY = (v1.y + v2.y) / 2;
          const angle = Math.atan2(midY, midX);
          const dockDist = 36;
          const dockX = midX + Math.cos(angle) * dockDist;
          const dockY = midY + Math.sin(angle) * dockDist;

          const pInfo = PORT_CONFIG[port.resource] || { ratio: '3:1', label: '?', color: '#f59e0b' };

          return (
            <g key={port.id} className="port-indicator select-none pointer-events-none">
              {/* Muelle de madera */}
              <line
                x1={v1.x} y1={v1.y}
                x2={dockX} y2={dockY}
                stroke="#b45309"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.85"
              />
              <line
                x1={v2.x} y1={v2.y}
                x2={dockX} y2={dockY}
                stroke="#b45309"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Plataforma del puerto */}
              <circle
                cx={dockX} cy={dockY} r="21"
                fill="#0f172a"
                stroke={pInfo.color}
                strokeWidth="2.5"
                filter="url(#chitShadow)"
              />
              <text
                x={dockX} y={dockY - 3}
                textAnchor="middle"
                fontSize="11"
                fontWeight="900"
                fill="#ffffff"
                fontFamily="sans-serif"
              >
                {pInfo.ratio}
              </text>
              <text
                x={dockX} y={dockY + 8}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="800"
                fill={pInfo.color}
                fontFamily="sans-serif"
                letterSpacing="0.05em"
              >
                {pInfo.label.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* 3. Hexágonos de Terreno */}
        {board.hexes.map((hex) => {
          const points = hex.vertices
            .map(vId => {
              const v = board.vertices[vId];
              return `${v.x},${v.y}`;
            })
            .join(' ');

          const isTarget = isRobberSelectable && !hex.hasRobber;
          const conf = TERRAIN_CONFIG[hex.resource] || TERRAIN_CONFIG.desert;

          return (
            <g
              key={hex.id}
              onClick={() => handleHexClick(hex)}
              className={isTarget ? 'hex-robber-target' : ''}
            >
              {/* Borde exterior del hexágono (tablero de madera gruesa) */}
              <polygon
                points={points}
                fill={`url(#grad-${hex.resource})`}
                className="hex-polygon"
                stroke={conf.stroke}
                strokeWidth="2.5"
              />

              {/* Borde interior sutil que da efecto de bisel 3D */}
              <polygon
                points={points}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1.5"
                transform={`scale(0.94) translate(${hex.x * 0.06}, ${hex.y * 0.06})`}
              />

              {/* Ilustración Vectorial del Terreno */}
              <g pointerEvents="none" opacity="0.45">
                {hex.resource === 'wood' && (
                  <g transform={`translate(${hex.x - 14}, ${hex.y - 24}) scale(0.9)`}>
                    <polygon points="15,0 5,18 25,18" fill="#52b788" />
                    <polygon points="15,8 3,24 27,24" fill="#40916c" />
                    <polygon points="15,14 1,30 29,30" fill="#2d6a4f" />
                    <rect x="13" y="30" width="4" height="6" fill="#78350f" />
                  </g>
                )}
                {hex.resource === 'brick' && (
                  <g transform={`translate(${hex.x - 14}, ${hex.y - 20}) scale(0.9)`}>
                    <rect x="2" y="2" width="12" height="6" rx="1" fill="#e76f51" />
                    <rect x="16" y="2" width="12" height="6" rx="1" fill="#f4a261" />
                    <rect x="8" y="10" width="14" height="6" rx="1" fill="#e76f51" />
                    <rect x="2" y="18" width="12" height="6" rx="1" fill="#f4a261" />
                    <rect x="16" y="18" width="12" height="6" rx="1" fill="#e76f51" />
                  </g>
                )}
                {hex.resource === 'sheep' && (
                  <g transform={`translate(${hex.x - 12}, ${hex.y - 18}) scale(0.85)`}>
                    <circle cx="14" cy="14" r="10" fill="#d8f3dc" />
                    <circle cx="9" cy="12" r="5" fill="#d8f3dc" />
                    <circle cx="19" cy="12" r="5" fill="#d8f3dc" />
                    <circle cx="6" cy="10" r="4" fill="#1b4332" />
                  </g>
                )}
                {hex.resource === 'wheat' && (
                  <g transform={`translate(${hex.x - 12}, ${hex.y - 24}) scale(0.85)`}>
                    <line x1="14" y1="36" x2="14" y2="4" stroke="#fefae0" strokeWidth="2.5" />
                    <ellipse cx="10" cy="12" rx="4" ry="2" fill="#ffe6a7" transform="rotate(-35 10 12)" />
                    <ellipse cx="18" cy="12" rx="4" ry="2" fill="#ffe6a7" transform="rotate(35 18 12)" />
                    <ellipse cx="10" cy="20" rx="4" ry="2" fill="#ffe6a7" transform="rotate(-35 10 20)" />
                    <ellipse cx="18" cy="20" rx="4" ry="2" fill="#ffe6a7" transform="rotate(35 18 20)" />
                  </g>
                )}
                {hex.resource === 'ore' && (
                  <g transform={`translate(${hex.x - 18}, ${hex.y - 20}) scale(0.9)`}>
                    <polygon points="18,0 4,28 32,28" fill="#4b5563" />
                    <polygon points="18,0 12,12 24,12" fill="#f1f5f9" />
                    <polygon points="28,8 18,28 38,28" fill="#374151" />
                    <polygon points="28,8 24,16 32,16" fill="#e2e8f0" />
                  </g>
                )}
                {hex.resource === 'desert' && (
                  <g transform={`translate(${hex.x - 15}, ${hex.y - 18}) scale(0.9)`}>
                    <path d="M0,24 Q15,8 30,24" fill="none" stroke="#fefae0" strokeWidth="2.5" />
                    <path d="M6,16 Q18,4 32,18" fill="none" stroke="#fefae0" strokeWidth="2" opacity="0.6" />
                  </g>
                )}
              </g>

              {/* Ficha de Número */}
              {hex.number && (
                <g pointerEvents="none" className="chit-group" filter="url(#chitShadow)">
                  <circle
                    cx={hex.x}
                    cy={hex.y + 4}
                    r="20"
                    className="chit-circle"
                  />
                  <circle
                    cx={hex.x}
                    cy={hex.y + 4}
                    r="17"
                    fill="none"
                    stroke="#d4a373"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                  <text
                    x={hex.x}
                    y={hex.y + 2}
                    className={`chit-text ${
                      hex.number === 6 || hex.number === 8 ? 'chit-text-red' : 'chit-text-black'
                    }`}
                    fontSize="17"
                  >
                    {hex.number}
                  </text>
                  {/* Puntos de probabilidad */}
                  <text
                    x={hex.x}
                    y={hex.y + 15}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill={hex.number === 6 || hex.number === 8 ? '#dc2626' : '#64748b'}
                    fontWeight="900"
                    letterSpacing="0.1em"
                  >
                    {'•'.repeat(hex.dots || 1)}
                  </text>
                </g>
              )}

              {/* El Ladrón */}
              {hex.hasRobber && (
                <g pointerEvents="none" className="robber-token" filter="url(#pieceShadow)">
                  <circle
                    cx={hex.x}
                    cy={hex.y}
                    r="25"
                    fill="#020617"
                    stroke="#ef4444"
                    strokeWidth="3.5"
                  />
                  {/* Capucha y silueta del bandido */}
                  <path
                    d={`M${hex.x - 14},${hex.y + 14} Q${hex.x},${hex.y - 18} ${hex.x + 14},${hex.y + 14} Z`}
                    fill="#1e293b"
                  />
                  {/* Ojos brillantes */}
                  <circle cx={hex.x - 4} cy={hex.y + 2} r="2" fill="#ef4444" />
                  <circle cx={hex.x + 4} cy={hex.y + 2} r="2" fill="#ef4444" />
                </g>
              )}
            </g>
          );
        })}

        {/* 4. Aristas (Carreteras) */}
        {Object.values(board.edges).map((edge) => {
          const v1 = board.vertices[edge.v1];
          const v2 = board.vertices[edge.v2];
          if (!v1 || !v2) return null;

          const isLegal = legalEdges.has(edge.id);
          const hasRoad = Boolean(edge.road);

          return (
            <g key={edge.id} onClick={() => handleEdgeClick(edge.id)}>
              {/* Carretera de madera construida */}
              {hasRoad && (
                <g filter="url(#pieceShadow)">
                  {/* Sombra base */}
                  <line
                    x1={v1.x} y1={v1.y}
                    x2={v2.x} y2={v2.y}
                    stroke="#000000"
                    strokeWidth="10"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                  {/* Viga de madera con color del jugador */}
                  <line
                    x1={v1.x} y1={v1.y}
                    x2={v2.x} y2={v2.y}
                    stroke={edge.road.color}
                    strokeWidth="8.5"
                    strokeLinecap="round"
                  />
                  {/* Línea de resalte superior */}
                  <line
                    x1={v1.x} y1={v1.y}
                    x2={v2.x} y2={v2.y}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </g>
              )}

              {/* Guía brillante para colocar camino legal */}
              {isLegal && (
                <line
                  x1={v1.x} y1={v1.y}
                  x2={v2.x} y2={v2.y}
                  className="edge-line edge-legal"
                />
              )}

              {/* Hitbox amplio y cómodo para clics */}
              <line
                x1={v1.x} y1={v1.y}
                x2={v2.x} y2={v2.y}
                stroke="transparent"
                strokeWidth="22"
                className="cursor-pointer"
              />
            </g>
          );
        })}

        {/* 5. Vértices (Poblados y Ciudades) */}
        {Object.values(board.vertices).map((vertex) => {
          const isLegal = legalVertices.has(vertex.id);
          const b = vertex.building;

          return (
            <g
              key={vertex.id}
              onClick={() => handleVertexClick(vertex.id)}
              className="vertex-node"
            >
              {/* Poblado: Cabaña de madera 3D */}
              {b && b.type === 'settlement' && (
                <g filter="url(#pieceShadow)">
                  {/* Pared frontal */}
                  <rect
                    x={vertex.x - 9}
                    y={vertex.y - 7}
                    width="18"
                    height="17"
                    fill={b.color}
                    stroke="#0f172a"
                    strokeWidth="2"
                    rx="1.5"
                  />
                  {/* Tejado a dos aguas */}
                  <polygon
                    points={`${vertex.x},${vertex.y - 20} ${vertex.x - 12},${vertex.y - 7} ${vertex.x + 12},${vertex.y - 7}`}
                    fill={b.color}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                  {/* Puerta y chimenea */}
                  <rect x={vertex.x - 3} y={vertex.y + 1} width="6" height="9" fill="#0f172a" rx="1" />
                  <rect x={vertex.x + 5} y={vertex.y - 18} width="3.5" height="7" fill="#0f172a" />
                </g>
              )}

              {/* Ciudad: Gran Fortaleza con murallas y dos torres */}
              {b && b.type === 'city' && (
                <g filter="url(#pieceShadow)">
                  {/* Muralla base */}
                  <rect
                    x={vertex.x - 15}
                    y={vertex.y - 7}
                    width="30"
                    height="19"
                    fill={b.color}
                    stroke="#0f172a"
                    strokeWidth="2"
                    rx="2"
                  />
                  {/* Torre izquierda con almenas */}
                  <polygon
                    points={`${vertex.x - 10},${vertex.y - 22} ${vertex.x - 17},${vertex.y - 7} ${vertex.x - 3},${vertex.y - 7}`}
                    fill={b.color}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                  {/* Torre derecha con almenas */}
                  <polygon
                    points={`${vertex.x + 10},${vertex.y - 22} ${vertex.x + 3},${vertex.y - 7} ${vertex.x + 17},${vertex.y - 7}`}
                    fill={b.color}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                  {/* Portón de la fortaleza */}
                  <path
                    d={`M${vertex.x - 5},${vertex.y + 12} L${vertex.x - 5},${vertex.y + 2} Q${vertex.x},${vertex.y - 3} ${vertex.x + 5},${vertex.y + 2} L${vertex.x + 5},${vertex.y + 12} Z`}
                    fill="#0f172a"
                  />
                </g>
              )}

              {/* Indicador de vértice legal con pulso dorado */}
              {isLegal && (
                <circle
                  cx={vertex.x}
                  cy={vertex.y}
                  r="10"
                  className="vertex-legal"
                />
              )}

              {/* Hitbox amplio */}
              <circle
                cx={vertex.x}
                cy={vertex.y}
                r="18"
                fill="transparent"
                className="cursor-pointer"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
