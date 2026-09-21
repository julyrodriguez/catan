// src/components/CatanBoard.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

const TERRAIN_CONFIG = {
  wood: {
    base: '#1e4d2b',
    stroke: '#13351d',
    name: 'Bosque',
    label: 'Madera'
  },
  brick: {
    base: '#b44c28',
    stroke: '#662410',
    name: 'Colina',
    label: 'Arcilla'
  },
  sheep: {
    base: '#40916c',
    stroke: '#1b4332',
    name: 'Pasto',
    label: 'Oveja'
  },
  wheat: {
    base: '#d99b26',
    stroke: '#805309',
    name: 'Campo',
    label: 'Trigo'
  },
  ore: {
    base: '#475569',
    stroke: '#1e293b',
    name: 'Montaña',
    label: 'Mineral'
  },
  desert: {
    base: '#d4a373',
    stroke: '#78350f',
    name: 'Desierto',
    label: 'Desierto'
  }
};

const PORT_CONFIG = {
  'any': { ratio: '3:1', label: 'Cualquiera', name: 'Puerto 3:1', color: '#f59e0b', ringColor: '#d97706', glow: 'rgba(245, 158, 11, 0.45)' },
  'wood': { ratio: '2:1', label: 'Madera', name: 'Puerto 2:1', color: '#22c55e', ringColor: '#16a34a', glow: 'rgba(34, 197, 94, 0.45)' },
  'brick': { ratio: '2:1', label: 'Arcilla', name: 'Puerto 2:1', color: '#f97316', ringColor: '#ea580c', glow: 'rgba(249, 115, 22, 0.45)' },
  'sheep': { ratio: '2:1', label: 'Lana', name: 'Puerto 2:1', color: '#84cc16', ringColor: '#65a30d', glow: 'rgba(132, 204, 22, 0.45)' },
  'wheat': { ratio: '2:1', label: 'Trigo', name: 'Puerto 2:1', color: '#eab308', ringColor: '#ca8a04', glow: 'rgba(234, 179, 8, 0.45)' },
  'ore': { ratio: '2:1', label: 'Mineral', name: 'Puerto 2:1', color: '#cbd5e1', ringColor: '#94a3b8', glow: 'rgba(203, 213, 225, 0.45)' }
};

// Componente para Dibujar el Barco Mercante y Muelles Colonist
function PortShip({ port, board }) {
  const v1 = board.vertices[port.v1];
  const v2 = board.vertices[port.v2];
  if (!v1 || !v2) return null;

  const midX = (v1.x + v2.x) / 2;
  const midY = (v1.y + v2.y) / 2;

  // Vector hacia el océano desde el centro (0,0)
  const seaAngle = Math.atan2(midY, midX);
  const dockDist = 56; // Distancia hacia el mar para dar espacio óptimo
  const shipX = midX + Math.cos(seaAngle) * dockDist;
  const shipY = midY + Math.sin(seaAngle) * dockDist;

  // Ángulo tangente a la costa para orientar el barco
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  const coastAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

  const pInfo = PORT_CONFIG[port.resource] || PORT_CONFIG['any'];

  // Puntos de anclaje de los muelles de madera hacia el barco
  const pier1EndX = v1.x + (shipX - v1.x) * 0.78;
  const pier1EndY = v1.y + (shipY - v1.y) * 0.78;
  const pier2EndX = v2.x + (shipX - v2.x) * 0.78;
  const pier2EndY = v2.y + (shipY - v2.y) * 0.78;

  // Posición del Escudo de Comercio (centrado y vertical para legibilidad total)
  const badgeX = shipX + Math.cos(seaAngle) * 9;
  const badgeY = shipY + Math.sin(seaAngle) * 9;

  return (
    <g className="port-ship-group select-none pointer-events-none">
      {/* 1. Muelles de Madera dobles desde los dos vértices costeros */}
      {/* Base oscura de vigas de soporte */}
      <line
        x1={v1.x} y1={v1.y}
        x2={pier1EndX} y2={pier1EndY}
        stroke="#1a0d05"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <line
        x1={v2.x} y1={v2.y}
        x2={pier2EndX} y2={pier2EndY}
        stroke="#1a0d05"
        strokeWidth="6.5"
        strokeLinecap="round"
      />

      {/* Tablones superiores de roble con textura de listones */}
      <line
        x1={v1.x} y1={v1.y}
        x2={pier1EndX} y2={pier1EndY}
        stroke="#b45309"
        strokeWidth="3.8"
        strokeDasharray="4 2"
      />
      <line
        x1={v2.x} y1={v2.y}
        x2={pier2EndX} y2={pier2EndY}
        stroke="#b45309"
        strokeWidth="3.8"
        strokeDasharray="4 2"
      />

      {/* Postes de amarre en los vértices */}
      <circle cx={v1.x} cy={v1.y} r="4.5" fill="#2e1403" stroke="#d97706" strokeWidth="1.2" />
      <circle cx={v2.x} cy={v2.y} r="4.5" fill="#2e1403" stroke="#d97706" strokeWidth="1.2" />

      {/* 2. El Barco Mercante de Vela (Carabela estilo Colonist) */}
      <g transform={`translate(${shipX}, ${shipY}) rotate(${coastAngleDeg})`} filter="url(#pieceShadow)">
        {/* Estela sutil de agua bajo el casco */}
        <ellipse cx="0" cy="3" rx="26" ry="12" fill="rgba(255, 255, 255, 0.08)" />
        <ellipse cx="0" cy="3" rx="30" ry="14" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.8" strokeDasharray="4 3" />

        {/* Casco de madera con curvatura náutica */}
        <path
          d="M -23,-5 C -17,12 17,12 23,-5 C 13,-1 -13,-1 -23,-5 Z"
          fill="url(#hullWoodGrad)"
          stroke="#1c0e04"
          strokeWidth="1.4"
        />

        {/* Línea dorada de regala / borda */}
        <path
          d="M -20,-3 C -11,7 11,7 20,-3"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.2"
          opacity="0.85"
        />
        {/* Cubierta de madera */}
        <line x1="-14" y1="-1" x2="14" y2="-1" stroke="#92400e" strokeWidth="1.3" />

        {/* Mástil principal de madera */}
        <line x1="0" y1="-2" x2="0" y2="-26" stroke="#3b1d08" strokeWidth="2.6" strokeLinecap="round" />
        {/* Verga horizontal (cruceta de la vela) */}
        <line x1="-16" y1="-20" x2="16" y2="-20" stroke="#3b1d08" strokeWidth="1.6" strokeLinecap="round" />

        {/* Cabos / Aparejos de jarcia náutica */}
        <line x1="0" y1="-24" x2="-19" y2="-4" stroke="#f1f5f9" strokeWidth="0.7" opacity="0.45" />
        <line x1="0" y1="-24" x2="19" y2="-4" stroke="#f1f5f9" strokeWidth="0.7" opacity="0.45" />

        {/* Vela blanca hinchada por el viento */}
        <path
          d="M -15,-20 Q 0,-26 15,-20 Q 18,-8 12,-9 Q 0,-14 -12,-9 Q -18,-8 -15,-20 Z"
          fill="url(#sailGrad)"
          stroke="#94a3b8"
          strokeWidth="0.9"
        />
        {/* Pliegues de la tela */}
        <line x1="-5" y1="-20" x2="-4" y2="-10" stroke="#cbd5e1" strokeWidth="0.7" />
        <line x1="5" y1="-20" x2="4" y2="-10" stroke="#cbd5e1" strokeWidth="0.7" />

        {/* Gallardete / Banderín en la punta del mástil */}
        <path
          d="M 0,-26 L 11,-29 L 0,-33 Z"
          fill={pInfo.color}
          stroke="#09090d"
          strokeWidth="0.6"
        />
      </g>

      {/* 3. Escudo Medallón de Comercio GRANDE y ULTRA CLARO (Estilo Colonist.io) */}
      <g transform={`translate(${badgeX}, ${badgeY})`} filter="url(#chitShadow)">
        {/* Halo de resplandor exterior suave */}
        <circle
          cx="0" cy="0" r="26"
          fill="none"
          stroke={pInfo.color}
          strokeWidth="3"
          opacity="0.35"
        />

        {/* Medalla circular de alto contraste (Diámetro 46px - Súper nítido) */}
        <circle
          cx="0" cy="0" r="23"
          fill="#09090d"
          stroke={pInfo.color}
          strokeWidth="2.8"
        />

        {/* Anillo interior decorativo */}
        <circle
          cx="0" cy="0" r="19"
          fill="none"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="0.9"
        />

        {/* Proporción de comercio en texto grande (3:1 o 2:1) */}
        <text
          x="0" y="-6"
          textAnchor="middle"
          fontSize="12.5"
          fontWeight="900"
          fill="#ffffff"
          fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
          letterSpacing="0.04em"
        >
          {pInfo.ratio}
        </text>

        {/* Ícono distintivo del recurso en tamaño grande y súper definido */}
        {port.resource === 'any' && (
          <text
            x="0" y="12"
            textAnchor="middle"
            fontSize="16"
            fontWeight="900"
            fill="#f59e0b"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            ?
          </text>
        )}

        {port.resource === 'wood' && (
          <g transform="translate(0, 7)">
            {/* Troncos de madera grandes con corteza */}
            <rect x="-8.5" y="-1.5" width="17" height="5.5" rx="2.2" fill="#22c55e" stroke="#14532d" strokeWidth="0.9" />
            <rect x="-6" y="4.5" width="13" height="4.8" rx="2" fill="#16a34a" stroke="#14532d" strokeWidth="0.9" />
            <circle cx="-6" cy="1.2" r="1.3" fill="#86efac" />
          </g>
        )}

        {port.resource === 'brick' && (
          <g transform="translate(0, 7)">
            {/* Ladrillo de terracota nítido */}
            <rect x="-9.5" y="-1" width="19" height="9.5" rx="2" fill="#f97316" stroke="#7c2d12" strokeWidth="0.9" />
            <line x1="0" y1="-1" x2="0" y2="8.5" stroke="#7c2d12" strokeWidth="1" />
            <line x1="-9.5" y1="3.8" x2="9.5" y2="3.8" stroke="#7c2d12" strokeWidth="0.8" />
            <rect x="-7.5" y="0.5" width="6" height="2" rx="0.5" fill="#fb923c" />
            <rect x="2" y="0.5" width="6" height="2" rx="0.5" fill="#fb923c" />
          </g>
        )}

        {port.resource === 'sheep' && (
          <g transform="translate(0, 7)">
            {/* Oveja esponjosa con orejitas */}
            <ellipse cx="0" cy="2" rx="8" ry="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.9" />
            <circle cx="-4" cy="0" r="3.5" fill="#ffffff" />
            <circle cx="4" cy="0" r="3.5" fill="#ffffff" />
            <circle cx="0" cy="3.5" r="3.5" fill="#1e293b" />
            <circle cx="-1.2" cy="3" r="0.7" fill="#ffffff" />
            <circle cx="1.2" cy="3" r="0.7" fill="#ffffff" />
          </g>
        )}

        {port.resource === 'wheat' && (
          <g transform="translate(0, 7)">
            {/* Espiga de trigo dorada de gran tamaño */}
            <path d="M 0,9 L 0,-2" stroke="#facc15" strokeWidth="1.8" strokeLinecap="round" />
            <ellipse cx="-4" cy="1" rx="3.2" ry="1.6" fill="#fde047" stroke="#ca8a04" strokeWidth="0.6" transform="rotate(-30 -4 1)" />
            <ellipse cx="4" cy="1" rx="3.2" ry="1.6" fill="#fde047" stroke="#ca8a04" strokeWidth="0.6" transform="rotate(30 4 1)" />
            <ellipse cx="-3.5" cy="5" rx="3" ry="1.5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.6" transform="rotate(-30 -3.5 5)" />
            <ellipse cx="3.5" cy="5" rx="3" ry="1.5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.6" transform="rotate(30 3.5 5)" />
            <ellipse cx="0" cy="-2.5" rx="1.8" ry="2.8" fill="#fde047" stroke="#ca8a04" strokeWidth="0.6" />
          </g>
        )}

        {port.resource === 'ore' && (
          <g transform="translate(0, 7)">
            {/* Pico de mineral facetado en roca de plata */}
            <polygon points="0,-3 9,3 6,9 -6,9 -9,3" fill="#94a3b8" stroke="#475569" strokeWidth="0.9" />
            <polygon points="0,-3 9,3 1,9" fill="#64748b" />
            <polygon points="0,-3 -9,3 -1,9" fill="#cbd5e1" />
            <polygon points="0,-3 4,2 -4,2" fill="#f8fafc" />
          </g>
        )}
      </g>
    </g>
  );
}

// Ilustraciones Vectoriales de Biomas estilo Colonist.io
function HexBiomeArt({ hex }) {
  const { resource, x, y } = hex;

  if (resource === 'wood') {
    // Bosque: Pinos estilizados con facetas 3D luz/sombra
    return (
      <g pointerEvents="none">
        {/* Pino superior */}
        <g transform={`translate(${x}, ${y - 27}) scale(0.72)`}>
          <rect x="-1.5" y="14" width="3" height="6" fill="#3e2723" rx="0.5" />
          <polygon points="0,-12 -12,0 0,0" fill="#48bb78" />
          <polygon points="0,-12 0,0 12,0" fill="#22543d" />
          <polygon points="0,-4 -14,8 0,8" fill="#38a169" />
          <polygon points="0,-4 0,8 14,8" fill="#1b4332" />
          <polygon points="0,4 -16,16 0,16" fill="#2f855a" />
          <polygon points="0,4 0,16 16,16" fill="#143628" />
        </g>
        {/* Pino izquierdo */}
        <g transform={`translate(${x - 22}, ${y - 12}) scale(0.62)`}>
          <rect x="-1.5" y="14" width="3" height="6" fill="#3e2723" rx="0.5" />
          <polygon points="0,-12 -12,0 0,0" fill="#48bb78" />
          <polygon points="0,-12 0,0 12,0" fill="#22543d" />
          <polygon points="0,-4 -14,8 0,8" fill="#38a169" />
          <polygon points="0,-4 0,8 14,8" fill="#1b4332" />
          <polygon points="0,4 -16,16 0,16" fill="#2f855a" />
          <polygon points="0,4 0,16 16,16" fill="#143628" />
        </g>
        {/* Pino derecho */}
        <g transform={`translate(${x + 22}, ${y - 12}) scale(0.62)`}>
          <rect x="-1.5" y="14" width="3" height="6" fill="#3e2723" rx="0.5" />
          <polygon points="0,-12 -12,0 0,0" fill="#48bb78" />
          <polygon points="0,-12 0,0 12,0" fill="#22543d" />
          <polygon points="0,-4 -14,8 0,8" fill="#38a169" />
          <polygon points="0,-4 0,8 14,8" fill="#1b4332" />
          <polygon points="0,4 -16,16 0,16" fill="#2f855a" />
          <polygon points="0,4 0,16 16,16" fill="#143628" />
        </g>
        {/* Pino inferior izquierdo */}
        <g transform={`translate(${x - 18}, ${y + 18}) scale(0.6)`}>
          <rect x="-1.5" y="14" width="3" height="6" fill="#3e2723" rx="0.5" />
          <polygon points="0,-12 -12,0 0,0" fill="#48bb78" />
          <polygon points="0,-12 0,0 12,0" fill="#22543d" />
          <polygon points="0,-4 -14,8 0,8" fill="#38a169" />
          <polygon points="0,-4 0,8 14,8" fill="#1b4332" />
          <polygon points="0,4 -16,16 0,16" fill="#2f855a" />
          <polygon points="0,4 0,16 16,16" fill="#143628" />
        </g>
        {/* Pino inferior derecho */}
        <g transform={`translate(${x + 18}, ${y + 18}) scale(0.6)`}>
          <rect x="-1.5" y="14" width="3" height="6" fill="#3e2723" rx="0.5" />
          <polygon points="0,-12 -12,0 0,0" fill="#48bb78" />
          <polygon points="0,-12 0,0 12,0" fill="#22543d" />
          <polygon points="0,-4 -14,8 0,8" fill="#38a169" />
          <polygon points="0,-4 0,8 14,8" fill="#1b4332" />
          <polygon points="0,4 -16,16 0,16" fill="#2f855a" />
          <polygon points="0,4 0,16 16,16" fill="#143628" />
        </g>
      </g>
    );
  }

  if (resource === 'brick') {
    // Colinas: Cantera escalonada de arcilla con bloques isométricos de terracota
    return (
      <g pointerEvents="none">
        {/* Terrazas de excavación de arcilla */}
        <path d={`M ${x - 36},${y - 22} Q ${x},${y - 34} ${x + 36},${y - 22}`} fill="none" stroke="#f97316" strokeWidth="2.5" opacity="0.45" />
        <path d={`M ${x - 30},${y + 24} Q ${x},${y + 34} ${x + 30},${y + 24}`} fill="none" stroke="#7c2d12" strokeWidth="3" opacity="0.6" />

        {/* Pila de ladrillos superior */}
        <g transform={`translate(${x - 12}, ${y - 28}) scale(0.8)`}>
          {/* Ladrillo 1 */}
          <polygon points="6,0 16,-3 26,0 16,3" fill="#fb923c" />
          <polygon points="6,0 16,3 16,8 6,5" fill="#ea580c" />
          <polygon points="16,3 26,0 26,5 16,8" fill="#9a3412" />
          {/* Ladrillo 2 */}
          <polygon points="-4,4 6,1 16,4 6,7" fill="#fb923c" />
          <polygon points="-4,4 6,7 6,12 -4,9" fill="#ea580c" />
          <polygon points="6,7 16,4 16,9 6,12" fill="#9a3412" />
        </g>

        {/* Pila de ladrillos inferior izquierda */}
        <g transform={`translate(${x - 28}, ${y + 14}) scale(0.75)`}>
          <polygon points="0,0 10,-3 20,0 10,3" fill="#fb923c" />
          <polygon points="0,0 10,3 10,8 0,5" fill="#ea580c" />
          <polygon points="10,3 20,0 20,5 10,8" fill="#9a3412" />
        </g>

        {/* Pila de ladrillos inferior derecha */}
        <g transform={`translate(${x + 10}, ${y + 14}) scale(0.75)`}>
          <polygon points="0,0 10,-3 20,0 10,3" fill="#fb923c" />
          <polygon points="0,0 10,3 10,8 0,5" fill="#ea580c" />
          <polygon points="10,3 20,0 20,5 10,8" fill="#9a3412" />
        </g>
      </g>
    );
  }

  if (resource === 'sheep') {
    // Pastos: Colinas verdes onduladas con ovejitas esponjosas pastando
    return (
      <g pointerEvents="none">
        {/* Curvas suaves de colinas */}
        <path d={`M ${x - 40},${y - 20} Q ${x},${y - 32} ${x + 40},${y - 18}`} fill="none" stroke="#86efac" strokeWidth="2" opacity="0.3" />
        <path d={`M ${x - 38},${y + 22} Q ${x},${y + 14} ${x + 38},${y + 24}`} fill="none" stroke="#22543d" strokeWidth="2.5" opacity="0.4" />

        {/* Oveja 1 (superior) */}
        <g transform={`translate(${x}, ${y - 25}) scale(0.75)`}>
          {/* Patitas */}
          <line x1="-5" y1="5" x2="-5" y2="8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="-2" y1="5" x2="-2" y2="8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2" y1="5" x2="2" y2="8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="5" y1="5" x2="5" y2="8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          {/* Cuerpo esponjoso de lana blanca */}
          <ellipse cx="0" cy="1" rx="8" ry="5.5" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
          <circle cx="-5" cy="0" r="3.5" fill="#ffffff" />
          <circle cx="5" cy="0" r="3.5" fill="#ffffff" />
          <circle cx="0" cy="-2.5" r="3.5" fill="#ffffff" />
          {/* Cabecita negra con orejitas */}
          <circle cx="8.5" cy="-0.5" r="3" fill="#1e293b" />
          <ellipse cx="9" cy="-3.5" rx="1.5" ry="0.8" fill="#1e293b" transform="rotate(30 9 -3.5)" />
        </g>

        {/* Oveja 2 (inferior izquierda) */}
        <g transform={`translate(${x - 22}, ${y + 16}) scale(0.68)`}>
          <line x1="-5" y1="5" x2="-5" y2="8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="-2" y1="5" x2="-2" y2="8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2" y1="5" x2="2" y2="8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="5" y1="5" x2="5" y2="8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="0" cy="1" rx="8" ry="5.5" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
          <circle cx="-5" cy="0" r="3.5" fill="#ffffff" />
          <circle cx="5" cy="0" r="3.5" fill="#ffffff" />
          <circle cx="0" cy="-2.5" r="3.5" fill="#ffffff" />
          <circle cx="-8.5" cy="-0.5" r="3" fill="#1e293b" />
        </g>

        {/* Oveja 3 (inferior derecha) */}
        <g transform={`translate(${x + 22}, ${y + 16}) scale(0.68)`}>
          <line x1="-5" y1="5" x2="-5" y2="8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="-2" y1="5" x2="-2" y2="8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2" y1="5" x2="2" y2="8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="5" y1="5" x2="5" y2="8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="0" cy="1" rx="8" ry="5.5" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
          <circle cx="-5" cy="0" r="3.5" fill="#ffffff" />
          <circle cx="5" cy="0" r="3.5" fill="#ffffff" />
          <circle cx="0" cy="-2.5" r="3.5" fill="#ffffff" />
          <circle cx="8.5" cy="-0.5" r="3" fill="#1e293b" />
        </g>
      </g>
    );
  }

  if (resource === 'wheat') {
    // Campos: Gavillas doradas de trigo atadas con cinta roja y surcos de siembra
    return (
      <g pointerEvents="none">
        {/* Surcos ondulados de campo arado */}
        <path d={`M ${x - 38},${y - 20} Q ${x},${y - 30} ${x + 38},${y - 18}`} fill="none" stroke="#fef08a" strokeWidth="1.5" opacity="0.35" />
        <path d={`M ${x - 34},${y + 24} Q ${x},${y + 14} ${x + 34},${y + 24}`} fill="none" stroke="#713f12" strokeWidth="2" opacity="0.4" />

        {/* Gavilla superior */}
        <g transform={`translate(${x}, ${y - 27}) scale(0.75)`}>
          {/* Tallos de trigo en abanico */}
          <line x1="0" y1="12" x2="0" y2="-10" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="0" y1="12" x2="-8" y2="-6" stroke="#facc15" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="0" y1="12" x2="8" y2="-6" stroke="#facc15" strokeWidth="1.8" strokeLinecap="round" />
          {/* Granos */}
          <ellipse cx="-7" cy="-7" rx="3.5" ry="2" fill="#fde047" transform="rotate(-40 -7 -7)" />
          <ellipse cx="7" cy="-7" rx="3.5" ry="2" fill="#fde047" transform="rotate(40 7 -7)" />
          <ellipse cx="0" cy="-11" rx="2.5" ry="3.8" fill="#fde047" />
          {/* Cinta roja de amarre */}
          <rect x="-4" y="2" width="8" height="3" rx="1" fill="#dc2626" />
        </g>

        {/* Gavilla inferior izquierda */}
        <g transform={`translate(${x - 22}, ${y + 16}) scale(0.7)`}>
          <line x1="0" y1="12" x2="0" y2="-10" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="0" y1="12" x2="-7" y2="-6" stroke="#facc15" strokeWidth="1.8" />
          <line x1="0" y1="12" x2="7" y2="-6" stroke="#facc15" strokeWidth="1.8" />
          <ellipse cx="-6" cy="-7" rx="3" ry="1.8" fill="#fde047" transform="rotate(-40 -6 -7)" />
          <ellipse cx="6" cy="-7" rx="3" ry="1.8" fill="#fde047" transform="rotate(40 6 -7)" />
          <ellipse cx="0" cy="-11" rx="2.2" ry="3.5" fill="#fde047" />
          <rect x="-3.5" y="2" width="7" height="2.8" rx="1" fill="#dc2626" />
        </g>

        {/* Gavilla inferior derecha */}
        <g transform={`translate(${x + 22}, ${y + 16}) scale(0.7)`}>
          <line x1="0" y1="12" x2="0" y2="-10" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="0" y1="12" x2="-7" y2="-6" stroke="#facc15" strokeWidth="1.8" />
          <line x1="0" y1="12" x2="7" y2="-6" stroke="#facc15" strokeWidth="1.8" />
          <ellipse cx="-6" cy="-7" rx="3" ry="1.8" fill="#fde047" transform="rotate(-40 -6 -7)" />
          <ellipse cx="6" cy="-7" rx="3" ry="1.8" fill="#fde047" transform="rotate(40 6 -7)" />
          <ellipse cx="0" cy="-11" rx="2.2" ry="3.5" fill="#fde047" />
          <rect x="-3.5" y="2" width="7" height="2.8" rx="1" fill="#dc2626" />
        </g>
      </g>
    );
  }

  if (resource === 'ore') {
    // Montañas: Picos escarpados de granito con cumbres nevadas y facetas 3D
    return (
      <g pointerEvents="none">
        {/* Pico central majestuoso */}
        <g transform={`translate(${x}, ${y - 28}) scale(0.85)`}>
          {/* Faceta izquierda iluminada de granito */}
          <polygon points="0,-18 -18,16 0,16" fill="#94a3b8" />
          {/* Faceta derecha en sombra profunda */}
          <polygon points="0,-18 0,16 18,16" fill="#334155" />
          {/* Cumbre nevada brillante */}
          <polygon points="0,-18 -7,-4 -3,-6 0,-3 4,-6 7,-4" fill="#ffffff" />
          <polygon points="0,-18 0,-3 4,-6 7,-4" fill="#e2e8f0" />
        </g>

        {/* Pico izquierdo */}
        <g transform={`translate(${x - 22}, ${y - 12}) scale(0.7)`}>
          <polygon points="0,-16 -16,14 0,14" fill="#94a3b8" />
          <polygon points="0,-16 0,14 16,14" fill="#334155" />
          <polygon points="0,-16 -6,-3 -2,-5 0,-2 3,-5 6,-3" fill="#ffffff" />
          <polygon points="0,-16 0,-2 3,-5 6,-3" fill="#e2e8f0" />
        </g>

        {/* Pico derecho */}
        <g transform={`translate(${x + 22}, ${y - 12}) scale(0.7)`}>
          <polygon points="0,-16 -16,14 0,14" fill="#94a3b8" />
          <polygon points="0,-16 0,14 16,14" fill="#334155" />
          <polygon points="0,-16 -6,-3 -2,-5 0,-2 3,-5 6,-3" fill="#ffffff" />
          <polygon points="0,-16 0,-2 3,-5 6,-3" fill="#e2e8f0" />
        </g>

        {/* Risco rocoso inferior izquierdo */}
        <g transform={`translate(${x - 18}, ${y + 18}) scale(0.6)`}>
          <polygon points="0,-12 -12,12 0,12" fill="#64748b" />
          <polygon points="0,-12 0,12 12,12" fill="#1e293b" />
          <polygon points="0,-12 -4,-2 0,-1 4,-2" fill="#ffffff" />
        </g>

        {/* Risco rocoso inferior derecho */}
        <g transform={`translate(${x + 18}, ${y + 18}) scale(0.6)`}>
          <polygon points="0,-12 -12,12 0,12" fill="#64748b" />
          <polygon points="0,-12 0,12 12,12" fill="#1e293b" />
          <polygon points="0,-12 -4,-2 0,-1 4,-2" fill="#ffffff" />
        </g>
      </g>
    );
  }

  if (resource === 'desert') {
    // Desierto: Dunas de arena dorada con oasis y palmeras
    return (
      <g pointerEvents="none">
        {/* Crestas de dunas sopladas por el viento */}
        <path d={`M ${x - 36},${y - 20} Q ${x - 10},${y - 28} ${x + 15},${y - 16} T ${x + 36},${y - 22}`} fill="none" stroke="#fef3c7" strokeWidth="2.5" opacity="0.6" />
        <path d={`M ${x - 30},${y + 22} Q ${x - 5},${y + 14} ${x + 20},${y + 26} T ${x + 32},${y + 18}`} fill="none" stroke="#78350f" strokeWidth="2" opacity="0.4" />

        {/* Pequeño Oasis con palmera en la parte superior */}
        <g transform={`translate(${x}, ${y - 25}) scale(0.85)`}>
          {/* Laguna de agua turquesa */}
          <ellipse cx="-2" cy="6" rx="8" ry="3.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
          {/* Palmera */}
          <path d="M 5,6 Q 7,1 5,-4" fill="none" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          {/* Hojas verdes de palma */}
          <path d="M 5,-4 Q 0,-8 -4,-5" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 5,-4 Q 6,-10 9,-8" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 5,-4 Q 10,-4 12,-1" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </g>
    );
  }

  return null;
}

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

  // Zoom & Pan interactivo del mapa (Estilo Colonist.io)
  const [zoom, setZoom] = useState(1.15); // Zoom inicial ligeramente aumentado para mayor protagonismo
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, moved: false });
  const containerRef = useRef(null);

  // 1. Calcular ViewBox automático ajustado (mapa más grande)
  const baseBounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (const h of board.hexes) {
      if (h.x - 75 < minX) minX = h.x - 75;
      if (h.x + 75 > maxX) maxX = h.x + 75;
      if (h.y - 75 < minY) minY = h.y - 75;
      if (h.y + 75 > maxY) maxY = h.y + 75;
    }

    const padding = 70; // Margen optimizado para maximizar el tamaño del tablero
    return {
      minX: minX - padding,
      minY: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2
    };
  }, [board]);

  // ViewBox dinámico con zoom y paneo
  const viewBox = useMemo(() => {
    const { minX, minY, width, height } = baseBounds;
    const currentW = width / zoom;
    const currentH = height / zoom;
    const scaleFactor = width / 750;
    const currentX = minX + (width - currentW) / 2 - (pan.x * scaleFactor);
    const currentY = minY + (height - currentH) / 2 - (pan.y * scaleFactor);
    return `${currentX} ${currentY} ${currentW} ${currentH}`;
  }, [baseBounds, zoom, pan]);

  // Soporte de rueda de ratón (mouse wheel) suave y preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.12 : -0.12;
      setZoom(prev => Math.min(2.8, Math.max(0.6, +(prev + zoomDelta).toFixed(2))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    if (e.target.closest('.interactive-node') || e.target.closest('.board-zoom-widget')) return;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false
    };
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
    }
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Soporte Touch para móviles y portátiles táctiles
  const touchStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, dist: 0, zoom: 1 });

  const handleTouchStart = (e) => {
    if (e.target.closest('.interactive-node') || e.target.closest('.board-zoom-widget')) return;
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        panX: pan.x,
        panY: pan.y,
        dist: 0,
        zoom
      };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current.dist = Math.hypot(dx, dy);
      touchStartRef.current.zoom = zoom;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragStartRef.current.moved = true;
      }
      setPan({
        x: touchStartRef.current.panX + dx,
        y: touchStartRef.current.panY + dy
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / touchStartRef.current.dist;
      setZoom(Math.min(2.8, Math.max(0.6, +(touchStartRef.current.zoom * ratio).toFixed(2))));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

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
    if (dragStartRef.current.moved) return;
    if (legalVertices.has(vId)) {
      sounds.playBuild();
      onSelectVertex(vId);
    }
  };

  const handleEdgeClick = (eId) => {
    if (dragStartRef.current.moved) return;
    if (legalEdges.has(eId)) {
      sounds.playBuild();
      onSelectEdge(eId);
    }
  };

  const handleHexClick = (h) => {
    if (dragStartRef.current.moved) return;
    if (isRobberSelectable && !h.hasRobber) {
      sounds.playCardDraw();
      onSelectHex(h.id);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`board-container select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* Widget Flotante de Zoom y Recentrado (Estilo Colonist.io) */}
      <div className="board-zoom-widget">
        <button
          onClick={() => setZoom(z => Math.min(2.8, +(z + 0.2).toFixed(2)))}
          className="zoom-btn"
          title="Acercar mapa (+)"
        >
          <ZoomIn size={16} />
        </button>

        <div className="text-[10px] font-mono font-bold text-center text-slate-300 py-0.5">
          {Math.round(zoom * 100)}%
        </div>

        <button
          onClick={() => setZoom(z => Math.max(0.6, +(z - 0.2).toFixed(2)))}
          className="zoom-btn"
          title="Alejar mapa (-)"
        >
          <ZoomOut size={16} />
        </button>

        <button
          onClick={() => { setZoom(1.15); setPan({ x: 0, y: 0 }); }}
          className="zoom-btn text-amber-400 hover:text-amber-300"
          title="Restablecer vista centrada"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <svg
        viewBox={viewBox}
        className="board-svg drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Fondo oceánico negro / carbón elegante Colonist */}
          <radialGradient id="oceanGrad" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#141419" />
            <stop offset="45%" stopColor="#0a0a0d" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Gradients de Terrenos con iluminación natural estilo Colonist */}
          <linearGradient id="grad-wood" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2e7d4d" />
            <stop offset="100%" stopColor="#154427" />
          </linearGradient>

          <linearGradient id="grad-brick" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c2572b" />
            <stop offset="100%" stopColor="#7a2a14" />
          </linearGradient>

          <linearGradient id="grad-sheep" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#68b857" />
            <stop offset="100%" stopColor="#306b29" />
          </linearGradient>

          <linearGradient id="grad-wheat" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#9a670e" />
          </linearGradient>

          <linearGradient id="grad-ore" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#273244" />
          </linearGradient>

          <linearGradient id="grad-desert" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eab875" />
            <stop offset="100%" stopColor="#a37042" />
          </linearGradient>

          {/* Gradiente para el casco del barco mercante */}
          <linearGradient id="hullWoodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#854d0e" />
            <stop offset="100%" stopColor="#3b1d08" />
          </linearGradient>

          {/* Gradiente para la vela blanca del barco */}
          <linearGradient id="sailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Sombra de relieve para piezas */}
          <filter id="pieceShadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="1" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.75" />
          </filter>

          {/* Sombra suave para fichas de números */}
          <filter id="chitShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* 1. Océano infinito (Negro estilo Colonist) */}
        <rect x="-6000" y="-6000" width="12000" height="12000" fill="url(#oceanGrad)" />

        {/* Ondas náuticas concéntricas decorativas en tonos carbón */}
        <circle cx="0" cy="0" r="320" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1.2" strokeDasharray="8 12" />
        <circle cx="0" cy="0" r="440" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1.2" strokeDasharray="12 16" />
        <circle cx="0" cy="0" r="560" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" strokeDasharray="16 20" />

        {/* 2. Puertos Costeros con Barcos Mercantes a Vela (Colonist style) */}
        {board.ports && board.ports.map((port) => (
          <PortShip key={port.id} port={port} board={board} />
        ))}

        {/* 3. Hexágonos de Terreno (con arte enriquecido de biomas) */}
        {board.hexes.map((hex) => {
          const points = hex.vertices
            .map(vId => {
              const v = board.vertices[vId];
              return `${v.x},${v.y}`;
            })
            .join(' ');

          const isTarget = isRobberSelectable && !hex.hasRobber;
          const conf = TERRAIN_CONFIG[hex.resource] || TERRAIN_CONFIG.desert;
          const dotsCount = hex.dots || (6 - Math.abs(7 - hex.number));

          return (
            <g
              key={hex.id}
              onClick={() => handleHexClick(hex)}
              className={isTarget ? 'hex-robber-target interactive-node' : ''}
            >
              {/* Borde exterior del hexágono (tablero de juego con bisel) */}
              <polygon
                points={points}
                fill={`url(#grad-${hex.resource})`}
                className="hex-polygon"
                stroke={conf.stroke}
                strokeWidth="2.8"
              />

              {/* Borde interior sutil que da efecto de bisel de tablero de madera */}
              <polygon
                points={points}
                fill="none"
                stroke="rgba(255, 255, 255, 0.22)"
                strokeWidth="1.2"
                transform={`scale(0.95) translate(${hex.x * 0.05}, ${hex.y * 0.05})`}
                pointerEvents="none"
              />

              {/* Ilustración de Bioma rica estilo Colonist.io */}
              <HexBiomeArt hex={hex} />

              {/* Ficha de Número (Estilo Pergamino de Marfil Colonist) */}
              {hex.number && (
                <g pointerEvents="none" className="chit-group" filter="url(#chitShadow)">
                  {/* Disco de pergamino marfil */}
                  <circle
                    cx={hex.x}
                    cy={hex.y + 4}
                    r="19"
                    fill="#fefce8"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                  />
                  {/* Anillo interior fino */}
                  <circle
                    cx={hex.x}
                    cy={hex.y + 4}
                    r="16"
                    fill="none"
                    stroke="#d4a373"
                    strokeWidth="0.8"
                    opacity="0.5"
                  />
                  {/* Número grande y legible (Rojo para 6 y 8, Slate oscuro para el resto) */}
                  <text
                    x={hex.x}
                    y={hex.y + 3}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
                    fontWeight="900"
                    fontSize="18"
                    fill={hex.number === 6 || hex.number === 8 ? '#dc2626' : '#0f172a'}
                  >
                    {hex.number}
                  </text>
                  {/* Puntos de probabilidad exactos */}
                  <text
                    x={hex.x}
                    y={hex.y + 14}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill={hex.number === 6 || hex.number === 8 ? '#dc2626' : '#475569'}
                    fontWeight="900"
                    letterSpacing="0.1em"
                  >
                    {'•'.repeat(dotsCount)}
                  </text>
                </g>
              )}

              {/* El Ladrón (Peón bandido con ojos rojos y anillo de peligro) */}
              {hex.hasRobber && (
                <g pointerEvents="none" className="robber-token" filter="url(#pieceShadow)">
                  {/* Resplandor de peligro en la base */}
                  <circle
                    cx={hex.x}
                    cy={hex.y}
                    r="23"
                    fill="#020617"
                    stroke="#ef4444"
                    strokeWidth="3"
                    opacity="0.95"
                  />
                  {/* Silueta de peón de ajedrez / bandido encapuchado */}
                  <path
                    d={`M${hex.x - 12},${hex.y + 13} Q${hex.x},${hex.y - 16} ${hex.x + 12},${hex.y + 13} Z`}
                    fill="#1e293b"
                  />
                  {/* Cabeza del peón */}
                  <circle cx={hex.x} cy={hex.y - 8} r="6.5" fill="#1e293b" stroke="#0f172a" strokeWidth="0.8" />
                  {/* Visor de ojos rojos del ladrón */}
                  <circle cx={hex.x - 3} cy={hex.y - 7} r="1.5" fill="#ef4444" />
                  <circle cx={hex.x + 3} cy={hex.y - 7} r="1.5" fill="#ef4444" />
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
            <g key={edge.id} onClick={() => handleEdgeClick(edge.id)} className={isLegal ? 'interactive-node' : ''}>
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
                    stroke="rgba(255, 255, 255, 0.45)"
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
              className={`vertex-node ${isLegal || b ? 'interactive-node' : ''}`}
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
