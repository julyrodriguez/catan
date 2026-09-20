// src/components/CatanBoard.jsx
import React, { useMemo } from 'react';
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
  'any': { ratio: '3:1', label: '?', color: '#f59e0b', ringColor: '#d97706' },
  'wood': { ratio: '2:1', label: 'Madera', color: '#22c55e', ringColor: '#16a34a' },
  'brick': { ratio: '2:1', label: 'Arcilla', color: '#f97316', ringColor: '#ea580c' },
  'sheep': { ratio: '2:1', label: 'Oveja', color: '#84cc16', ringColor: '#65a30d' },
  'wheat': { ratio: '2:1', label: 'Trigo', color: '#eab308', ringColor: '#ca8a04' },
  'ore': { ratio: '2:1', label: 'Mineral', color: '#cbd5e1', ringColor: '#94a3b8' }
};

// Componente para Dibujar el Barco Mercante y Muelles
function PortShip({ port, board }) {
  const v1 = board.vertices[port.v1];
  const v2 = board.vertices[port.v2];
  if (!v1 || !v2) return null;

  const midX = (v1.x + v2.x) / 2;
  const midY = (v1.y + v2.y) / 2;

  // Vector hacia el océano desde el centro (0,0)
  const seaAngle = Math.atan2(midY, midX);
  const dockDist = 44; // Distancia hacia el mar
  const shipX = midX + Math.cos(seaAngle) * dockDist;
  const shipY = midY + Math.sin(seaAngle) * dockDist;

  // Ángulo tangente a la costa para orientar el barco
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  const coastAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

  const pInfo = PORT_CONFIG[port.resource] || PORT_CONFIG['any'];

  // Puntos de anclaje de los muelles de madera hacia el barco
  const pier1EndX = v1.x + (shipX - v1.x) * 0.82;
  const pier1EndY = v1.y + (shipY - v1.y) * 0.82;
  const pier2EndX = v2.x + (shipX - v2.x) * 0.82;
  const pier2EndY = v2.y + (shipY - v2.y) * 0.82;

  // Posición del Escudo de Comercio (centrado y vertical para legibilidad total)
  const badgeX = shipX + Math.cos(seaAngle) * 8;
  const badgeY = shipY + Math.sin(seaAngle) * 8;

  return (
    <g className="port-ship-group select-none pointer-events-none">
      {/* 1. Muelles de Madera dobles desde los dos vértices costeros */}
      {/* Base oscura de vigas de soporte */}
      <line
        x1={v1.x} y1={v1.y}
        x2={pier1EndX} y2={pier1EndY}
        stroke="#271306"
        strokeWidth="5.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <line
        x1={v2.x} y1={v2.y}
        x2={pier2EndX} y2={pier2EndY}
        stroke="#271306"
        strokeWidth="5.5"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Tablones superiores de roble con textura de listones */}
      <line
        x1={v1.x} y1={v1.y}
        x2={pier1EndX} y2={pier1EndY}
        stroke="#b45309"
        strokeWidth="3.2"
        strokeDasharray="3 1.5"
      />
      <line
        x1={v2.x} y1={v2.y}
        x2={pier2EndX} y2={pier2EndY}
        stroke="#b45309"
        strokeWidth="3.2"
        strokeDasharray="3 1.5"
      />

      {/* Postes de amarre en los vértices */}
      <circle cx={v1.x} cy={v1.y} r="3.5" fill="#451a03" stroke="#d97706" strokeWidth="1" />
      <circle cx={v2.x} cy={v2.y} r="3.5" fill="#451a03" stroke="#d97706" strokeWidth="1" />

      {/* 2. El Barco Mercante de Vela (Carabela estilo Colonist) */}
      <g transform={`translate(${shipX}, ${shipY}) rotate(${coastAngleDeg})`} filter="url(#pieceShadow)">
        {/* Estela de agua y espuma bajo el casco */}
        <ellipse cx="0" cy="3" rx="24" ry="11" fill="rgba(56, 189, 248, 0.15)" />
        <ellipse cx="0" cy="3" rx="28" ry="13" fill="none" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="0.8" strokeDasharray="4 3" />

        {/* Casco de madera con curvatura náutica */}
        <path
          d="M -21,-5 C -15,11 15,11 21,-5 C 12,-1 -12,-1 -21,-5 Z"
          fill="url(#hullWoodGrad)"
          stroke="#261204"
          strokeWidth="1.2"
        />

        {/* Línea dorada de regala / borda */}
        <path
          d="M -18,-3 C -10,6 10,6 18,-3"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1"
          opacity="0.85"
        />
        {/* Cubierta de madera */}
        <line x1="-12" y1="-1" x2="12" y2="-1" stroke="#92400e" strokeWidth="1.2" />

        {/* Mástil principal de madera */}
        <line x1="0" y1="-2" x2="0" y2="-24" stroke="#3b1d08" strokeWidth="2.4" strokeLinecap="round" />
        {/* Verga horizontal (cruceta de la vela) */}
        <line x1="-14" y1="-18" x2="14" y2="-18" stroke="#3b1d08" strokeWidth="1.5" strokeLinecap="round" />

        {/* Cabos / Aparejos de jarcia náutica */}
        <line x1="0" y1="-22" x2="-17" y2="-4" stroke="#f1f5f9" strokeWidth="0.6" opacity="0.45" />
        <line x1="0" y1="-22" x2="17" y2="-4" stroke="#f1f5f9" strokeWidth="0.6" opacity="0.45" />

        {/* Vela blanca hinchada por el viento */}
        <path
          d="M -13,-18 Q 0,-23 13,-18 Q 16,-7 11,-8 Q 0,-12 -11,-8 Q -16,-7 -13,-18 Z"
          fill="url(#sailGrad)"
          stroke="#94a3b8"
          strokeWidth="0.8"
        />
        {/* Pliegues de la tela */}
        <line x1="-4" y1="-18" x2="-3" y2="-9" stroke="#cbd5e1" strokeWidth="0.6" />
        <line x1="4" y1="-18" x2="3" y2="-9" stroke="#cbd5e1" strokeWidth="0.6" />

        {/* Gallardete / Banderín en la punta del mástil */}
        <path
          d="M 0,-24 L 9,-27 L 0,-30 Z"
          fill={pInfo.color}
          stroke="#0f172a"
          strokeWidth="0.5"
        />
      </g>

      {/* 3. Escudo Medallón de Comercio (orientado 100% vertical y legible) */}
      <g transform={`translate(${badgeX}, ${badgeY})`} filter="url(#chitShadow)">
        {/* Medalla circular con borde de color de recurso */}
        <circle
          cx="0" cy="0" r="14.5"
          fill="#090d16"
          stroke={pInfo.color}
          strokeWidth="2.2"
        />
        {/* Anillo interior decorativo de latón */}
        <circle
          cx="0" cy="0" r="12"
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="0.8"
        />

        {/* Proporción de comercio (3:1 o 2:1) */}
        <text
          x="0" y="-3"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="900"
          fill="#ffffff"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          letterSpacing="0.02em"
        >
          {pInfo.ratio}
        </text>

        {/* Ícono distintivo del recurso en el puerto */}
        {port.resource === 'any' && (
          <text
            x="0" y="8"
            textAnchor="middle"
            fontSize="11"
            fontWeight="900"
            fill="#f59e0b"
            fontFamily="sans-serif"
          >
            ?
          </text>
        )}

        {port.resource === 'wood' && (
          <g transform="translate(-4.5, 2) scale(0.65)">
            {/* Troncos de madera gemelos */}
            <rect x="0" y="0" width="14" height="4.5" rx="2" fill="#22c55e" stroke="#14532d" strokeWidth="0.8" />
            <rect x="2" y="4.5" width="10" height="4" rx="1.8" fill="#16a34a" stroke="#14532d" strokeWidth="0.8" />
          </g>
        )}

        {port.resource === 'brick' && (
          <g transform="translate(-5, 2.5) scale(0.65)">
            {/* Ladrillo de terracota */}
            <rect x="0" y="0" width="15" height="7.5" rx="1.5" fill="#f97316" stroke="#7c2d12" strokeWidth="0.8" />
            <line x1="7.5" y1="0" x2="7.5" y2="7.5" stroke="#7c2d12" strokeWidth="0.8" />
          </g>
        )}

        {port.resource === 'sheep' && (
          <g transform="translate(-5, 2) scale(0.65)">
            {/* Cabecita / lana de oveja */}
            <circle cx="7" cy="4" r="5.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <circle cx="7" cy="5" r="3.5" fill="#1e293b" />
          </g>
        )}

        {port.resource === 'wheat' && (
          <g transform="translate(-4, 2) scale(0.65)">
            {/* Espiga de trigo */}
            <path d="M 6,9 L 6,1" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="4" cy="3" rx="2.5" ry="1.2" fill="#facc15" transform="rotate(-30 4 3)" />
            <ellipse cx="8" cy="3" rx="2.5" ry="1.2" fill="#facc15" transform="rotate(30 8 3)" />
            <ellipse cx="4" cy="6" rx="2.5" ry="1.2" fill="#facc15" transform="rotate(-30 4 6)" />
            <ellipse cx="8" cy="6" rx="2.5" ry="1.2" fill="#facc15" transform="rotate(30 8 6)" />
          </g>
        )}

        {port.resource === 'ore' && (
          <g transform="translate(-5, 2) scale(0.65)">
            {/* Roca de mineral facetada */}
            <polygon points="7,0 13,4 10,9 4,9 1,4" fill="#94a3b8" stroke="#475569" strokeWidth="0.8" />
            <polygon points="7,0 13,4 7,9" fill="#64748b" />
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

  // 1. Calcular ViewBox automático con margen suficiente para los barcos
  const viewBox = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (const h of board.hexes) {
      if (h.x - 75 < minX) minX = h.x - 75;
      if (h.x + 75 > maxX) maxX = h.x + 75;
      if (h.y - 75 < minY) minY = h.y - 75;
      if (h.y + 75 > maxY) maxY = h.y + 75;
    }

    const padding = 95;
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
            <stop offset="0%" stopColor="#0f274a" />
            <stop offset="45%" stopColor="#08172c" />
            <stop offset="100%" stopColor="#030814" />
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

        {/* 1. Océano infinito */}
        <rect x="-3000" y="-3000" width="6000" height="6000" fill="url(#oceanGrad)" />

        {/* Ondas náuticas concéntricas decorativas */}
        <circle cx="0" cy="0" r="320" fill="none" stroke="#1e3a5f" strokeWidth="1.2" strokeDasharray="8 12" opacity="0.3" />
        <circle cx="0" cy="0" r="440" fill="none" stroke="#1e3a5f" strokeWidth="1.2" strokeDasharray="12 16" opacity="0.22" />
        <circle cx="0" cy="0" r="560" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="16 20" opacity="0.15" />

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
              className={isTarget ? 'hex-robber-target' : ''}
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
