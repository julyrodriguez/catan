// src/utils/api.js
// Cliente de API REST y WebSocket para Catan Online

export function getServerEndpoints() {
  if (typeof window === 'undefined') {
    return {
      apiBase: 'https://apivacas.jariel.com.ar/api/catan',
      wsUrl: 'wss://apivacas.jariel.com.ar/api/catan/ws'
    };
  }

  // 1. Si hay variable de entorno explícita de Vite
  if (import.meta.env.VITE_API_URL) {
    const base = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    const ws = base.replace(/^http/, 'ws') + '/ws';
    return { apiBase: base, wsUrl: ws };
  }

  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || 
                  hostname === '127.0.0.1' || 
                  hostname.startsWith('192.168.') || 
                  hostname.startsWith('100.');

  // Si está desplegado en Vercel, en catan.jariel.com.ar o en cualquier dominio de producción
  if (!isLocal || hostname.endsWith('jariel.com.ar') || hostname.includes('vercel.app')) {
    return {
      apiBase: 'https://apivacas.jariel.com.ar/api/catan',
      wsUrl: 'wss://apivacas.jariel.com.ar/api/catan/ws'
    };
  }

  // Si estamos en entorno de desarrollo local (ej. Vite en 5173 o 5174)
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (window.location.port === '5173' || window.location.port === '5174') {
    return {
      apiBase: `${protocol}//${hostname}:3000/api/catan`,
      wsUrl: `${wsProtocol}//${hostname}:3000/api/catan/ws`
    };
  }

  // Si estamos sirviendo directamente desde el servidor local (ej. Express en puerto 3000)
  return {
    apiBase: '/api/catan',
    wsUrl: `${wsProtocol}//${window.location.host}/api/catan/ws`
  };
}

export const authStorage = {
  getToken: () => localStorage.getItem('catan_token'),
  setToken: (token) => localStorage.setItem('catan_token', token),
  clearToken: () => localStorage.removeItem('catan_token'),
  getUser: () => {
    try {
      const u = localStorage.getItem('catan_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('catan_user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('catan_user')
};

export async function apiRequest(endpoint, method = 'GET', body = null) {
  const { apiBase } = getServerEndpoints();
  const headers = { 'Content-Type': 'application/json' };
  const token = authStorage.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${apiBase}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
  } catch (netErr) {
    throw new Error(`Error de conexión con el servidor (${netErr.message})`);
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (parseErr) {
    throw new Error(res.ok ? 'Respuesta no válida del servidor' : `Error del servidor (${res.status}): ${text.slice(0, 80)}`);
  }

  if (!res.ok) {
    throw new Error(data.error || 'Error en la petición al servidor');
  }
  return data;
}

export const api = {
  login: async (login, password) => {
    const data = await apiRequest('/login', 'POST', { login, password });
    if (data.token) {
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
    }
    return data;
  },

  register: async (username, email, password, avatar) => {
    const data = await apiRequest('/register', 'POST', { username, email, password, avatar });
    if (data.token) {
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
    }
    return data;
  },

  getMe: async () => {
    return await apiRequest('/me');
  },

  getRooms: async () => {
    return await apiRequest('/rooms');
  },

  createRoom: async (roomData) => {
    return await apiRequest('/rooms', 'POST', roomData);
  },

  getRoom: async (code) => {
    return await apiRequest(`/rooms/${code}`);
  },

  getLeaderboard: async () => {
    return await apiRequest('/leaderboard');
  },

  getHistory: async () => {
    return await apiRequest('/history');
  },

  deleteRoom: async (code) => {
    return await apiRequest(`/rooms/${code}`, 'DELETE');
  },

  cleanupRooms: async () => {
    return await apiRequest('/rooms/cleanup', 'POST');
  }
};

export class CatanSocketClient {
  constructor() {
    this.ws = null;
    this.callbacks = new Map();
    this.roomCode = null;
    this.reconnectAttempts = 0;
  }

  connect(onOpen) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (onOpen) onOpen();
      return;
    }

    const { wsUrl } = getServerEndpoints();
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      if (onOpen) onOpen();
      this.emit('open');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.emit(msg.type, msg.payload);
      } catch (e) {
        console.error('Error parseando mensaje WS:', e);
      }
    };

    this.ws.onclose = () => {
      this.emit('close');
      // Intentar reconectar si estábamos en una sala
      if (this.roomCode && this.reconnectAttempts < 5) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), 2000);
      }
    };

    this.ws.onerror = (err) => {
      this.emit('error', err);
    };
  }

  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event).add(callback);
    return () => this.callbacks.get(event)?.delete(callback);
  }

  emit(event, data) {
    const list = this.callbacks.get(event);
    if (list) {
      for (const cb of list) cb(data);
    }
  }

  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket no conectado para enviar:', type);
    }
  }

  joinRoom(roomCode, user) {
    this.roomCode = roomCode;
    const token = authStorage.getToken();
    this.send('join_room', { roomCode, user, token });
  }

  disconnect() {
    this.roomCode = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socketClient = new CatanSocketClient();
