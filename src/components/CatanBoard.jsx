// src/components/CatanBoard.jsx
import React, { useMemo } from 'react';
import { sounds } from '../utils/soundEffects';

const RESOURCE_COLORS = {
  wood: '#23533e',
  brick: '#962d18',
  sheep: '#558332',
  wheat: '#d9942a',
  ore: '#475560',
  desert: '#bfa145'
};

const RESOURCE_ICONS = {
  wood: '🌲',
  brick: '🧱',
  sheep: '🐑',
  wheat: '🌾',
  ore: '⛰️',
  desert: '🌵'
};

const PORT_LABELS = {
  'any': '3:1 ?',
  'wood': '2:1 🌲',
  'brick': '2:1 🧱',
  'sheep': '2:1 🐑',
  'wheat': '2:1 🌾',
  'ore': '2:1 ⛰️'
};

export default function CatanBoard({
  board,
  activePlayerId,
  currentUserId,
  phase,
  subphase,
  buildMode, // null | 'road' | 'settlement' | 'city'
  onSelectVertex,
  onSelectEdge,
  onSelectHex
}) {
  if (!board || !board.hexes) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Cargando tablero de Catán...
      </div>
    );
  }

  const isMyTurn = activePlayerId === currentUserId;

  // 1. Calcular ViewBox automáticamente según las coordenadas extremas
  const viewBox = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (const h of board.hexes) {
      if (h.x - 70 < minX) minX = h.x - 70;
      if (h.x + 70 > maxX) maxX = h.x + 70;
      if (h.y - 70 < minY) minY = h.y - 70;
      if (h.y + 70 > maxY) maxY = h.y + 70;
    }

    const padding = 70;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    return `${minX - padding} ${minY - padding} ${width} ${height}`;
  }, [board]);

  // 2. Determinar qué vértices son legales para interactuar
  const legalVertices = useMemo(() => {
    if (!isMyTurn) return new Set();
    const legal = new Set();

    // Fase inicial de colocación (ronda 1 y 2)
    if (phase === 'setup_round_1' || phase === 'setup_round_2') {
      if (subphase === 'settlement') {
        for (const [vId, v] of Object.entries(board.vertices)) {
          if (!v.building) {
            const hasNeighborBuilding = v.adjacentVertices.some(
              adjId => board.vertices[adjId]?.building
            );
            if (!hasNeighborBuilding) legal.add(vId);
          }
        }
      }
      return legal;
    }

    // Fase principal
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

  // 3. Determinar qué aristas son legales para construir caminos
  const legalEdges = useMemo(() => {
    if (!isMyTurn) return new Set();
    const legal = new Set();

    // Fase inicial de carretera
    if ((phase === 'setup_round_1' || phase === 'setup_round_2') && subphase === 'road') {
      // Buscar el último poblado construido por el jugador
      let myLastVertex = null;
      for (const [vId, v] of Object.entries(board.vertices)) {
        if (v.building && v.building.playerId === currentUserId) {
          // Si este vértice no tiene aún caminos conectados
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

    // Fase principal: construir camino
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

  // Mover ladrón
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
          {/* Fondo oceánico con patrón suave */}
          <radialGradient id="oceanGrad" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#0a192f" />
            <stop offset="70%" stopColor="#040d1a" />
            <stop offset="100%" stopColor="#02060d" />
          </radialGradient>

          {/* Filtro sombra para edificios */}
          <filter id="buildingShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* 1. Fondo del Mar */}
        <rect x="-2000" y="-2000" width="4000" height="4000" fill="url(#oceanGrad)" />

        {/* 2. Puertos Costeros */}
        {board.ports && board.ports.map((port) => {
          const v1 = board.vertices[port.v1];
          const v2 = board.vertices[port.v2];
          if (!v1 || !v2) return null;
          const midX = (v1.x + v2.x) / 2;
          const midY = (v1.y + v2.y) / 2;
          // Calcular dirección hacia el exterior del tablero
          const angle = Math.atan2(midY, midX);
          const dockDist = 32;
          const dockX = midX + Math.cos(angle) * dockDist;
          const dockY = midY + Math.sin(angle) * dockDist;

          return (
            <g key={port.id} className="port-indicator">
              {/* Líneas de muelle desde los vértices */}
              <line
                x1={v1.x} y1={v1.y}
                x2={dockX} y2={dockY}
                stroke="#d97706"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                opacity="0.8"
              />
              <line
                x1={v2.x} y1={v2.y}
                x2={dockX} y2={dockY}
                stroke="#d97706"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                opacity="0.8"
              />
              {/* Ficha del Puerto */}
              <circle
                cx={dockX} cy={dockY} r="18"
                fill="#1e293b"
                stroke="#f59e0b"
                strokeWidth="2"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
              />
              <text
                x={dockX} y={dockY + 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#fef08a"
              >
                {PORT_LABELS[port.resource] || '3:1 ?'}
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

          return (
            <g
              key={hex.id}
              onClick={() => handleHexClick(hex)}
              className={isTarget ? 'hex-robber-target' : ''}
            >
              {/* Polígono de terreno */}
              <polygon
                points={points}
                fill={RESOURCE_COLORS[hex.resource] || '#475560'}
                className="hex-polygon"
                stroke="#111827"
                strokeWidth="2"
              />

              {/* Ícono de recurso de fondo */}
              <text
                x={hex.x}
                y={hex.y - 12}
                textAnchor="middle"
                fontSize="20"
                opacity="0.35"
                pointerEvents="none"
              >
                {RESOURCE_ICONS[hex.resource]}
              </text>

              {/* Ficha de Número (si no es desierto) */}
              {hex.number && (
                <g pointerEvents="none" className="chit-group">
                  <circle
                    cx={hex.x}
                    cy={hex.y + 4}
                    r="19"
                    className="chit-circle"
                  />
                  <text
                    x={hex.x}
                    y={hex.y + 2}
                    className={`chit-text ${
                      hex.number === 6 || hex.number === 8 ? 'chit-text-red' : 'chit-text-black'
                    }`}
                    fontSize="16"
                  >
                    {hex.number}
                  </text>
                  {/* Puntos de probabilidad debajo del número */}
                  <text
                    x={hex.x}
                    y={hex.y + 14}
                    textAnchor="middle"
                    fontSize="9"
                    fill={hex.number === 6 || hex.number === 8 ? '#dc2626' : '#64748b'}
                    fontWeight="bold"
                  >
                    {'•'.repeat(hex.dots || 1)}
                  </text>
                </g>
              )}

              {/* El Ladrón */}
              {hex.hasRobber && (
                <g pointerEvents="none" className="robber-token">
                  <circle
                    cx={hex.x}
                    cy={hex.y}
                    r="24"
                    fill="#0f172a"
                    stroke="#ef4444"
                    strokeWidth="3"
                    filter="drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))"
                  />
                  <text
                    x={hex.x}
                    y={hex.y + 7}
                    textAnchor="middle"
                    fontSize="22"
                  >
                    🥷
                  </text>
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
              {/* Carretera construida */}
              {hasRoad && (
                <line
                  x1={v1.x} y1={v1.y}
                  x2={v2.x} y2={v2.y}
                  stroke={edge.road.color}
                  strokeWidth="8.5"
                  strokeLinecap="round"
                  filter="url(#buildingShadow)"
                />
              )}

              {/* Carretera destacada en modo legal */}
              {isLegal && (
                <line
                  x1={v1.x} y1={v1.y}
                  x2={v2.x} y2={v2.y}
                  className="edge-line edge-legal"
                />
              )}

              {/* Hitbox transparente para fácil clic en móviles */}
              <line
                x1={v1.x} y1={v1.y}
                x2={v2.x} y2={v2.y}
                stroke="transparent"
                strokeWidth="20"
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
              {/* Poblado */}
              {b && b.type === 'settlement' && (
                <g filter="url(#buildingShadow)">
                  {/* Base de la casa */}
                  <rect
                    x={vertex.x - 9}
                    y={vertex.y - 7}
                    width="18"
                    height="16"
                    fill={b.color}
                    stroke="#111827"
                    strokeWidth="1.5"
                    rx="2"
                  />
                  {/* Techo triangular */}
                  <polygon
                    points={`${vertex.x},${vertex.y - 18} ${vertex.x - 11},${vertex.y - 7} ${vertex.x + 11},${vertex.y - 7}`}
                    fill={b.color}
                    stroke="#111827"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {/* Ciudad (Fortaleza con muralla) */}
              {b && b.type === 'city' && (
                <g filter="url(#buildingShadow)">
                  {/* Base de la fortaleza */}
                  <rect
                    x={vertex.x - 14}
                    y={vertex.y - 6}
                    width="28"
                    height="18"
                    fill={b.color}
                    stroke="#111827"
                    strokeWidth="1.5"
                    rx="2"
                  />
                  {/* Torre izquierda */}
                  <polygon
                    points={`${vertex.x - 9},${vertex.y - 20} ${vertex.x - 16},${vertex.y - 6} ${vertex.x - 2},${vertex.y - 6}`}
                    fill={b.color}
                    stroke="#111827"
                    strokeWidth="1.5"
                  />
                  {/* Torre derecha */}
                  <polygon
                    points={`${vertex.x + 9},${vertex.y - 20} ${vertex.x + 2},${vertex.y - 6} ${vertex.x + 16},${vertex.y - 6}`}
                    fill={b.color}
                    stroke="#111827"
                    strokeWidth="1.5"
                  />
                  {/* Ventanita */}
                  <circle cx={vertex.x} cy={vertex.y + 2} r="3" fill="#111827" />
                </g>
              )}

              {/* Indicador de vértice legal (anillo dorado brillante) */}
              {isLegal && (
                <circle
                  cx={vertex.x}
                  cy={vertex.y}
                  r="9"
                  className="vertex-legal"
                />
              )}

              {/* Hitbox amplio para clic */}
              <circle
                cx={vertex.x}
                cy={vertex.y}
                r="16"
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
