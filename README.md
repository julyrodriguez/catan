# 🌾 Colonos de Catán Online (Settlers of Catan)

Recreación multijugador completa en tiempo real del juego de mesa **Colonos de Catán**, con soporte para **hasta 6 jugadores**, mapas para 3-4 y 5-6 jugadores, sistema de cuentas con autenticación y bots con inteligencia artificial.

![Catán Online](https://img.shields.io/badge/Catán-Online%20Multiplayer-amber)
![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-6-purple)
![NodeJS](https://img.shields.io/badge/Node.js-Express%20%2B%20WS-emerald)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)

---

## 🎲 Características Principales

- **Hasta 6 Jugadores en Simultáneo:**
  - **Mapa Estándar (3 a 4 Jugadores):** 19 hexágonos de terreno, 18 fichas numéricas, 54 vértices, 72 caminos y 9 puertos.
  - **Mapa Extensión (5 a 6 Jugadores):** 30 hexágonos de terreno, 28 fichas numéricas, 80 vértices, 109 caminos y 11 puertos costeros.
  - **Fase Especial de Construcción:** Implementación de la regla oficial para 5-6 jugadores, permitiendo a todos los jugadores construir entre turnos para evitar acumulación excesiva de cartas.
- **Autenticación y Perfiles:**
  - Registro e inicio de sesión con contraseñas seguras (`scrypt` + `salt`).
  - Tokens de sesión basados en HMAC-SHA256.
  - Estadísticas persistentes del jugador: partidas jugadas, victorias, rutas comerciales más largas, ejércitos más grandes y construcciones.
  - Opción de **Jugar como Invitado** para partidas rápidas sin registro.
- **Tablero SVG Interactivo y Dinámico:**
  - Terrenos con texturas y colores distintivos (Bosque, Colina, Pasto, Campo, Montaña, Desierto).
  - Fichas numéricas con puntos de probabilidad (los números **6** y **8** resaltados en rojo intenso).
  - Vértices y aristas con anillos y líneas brillantes interactivas para colocar poblados, ciudades y carreteras con un solo clic.
  - Visualización del Ladrón con animación e indicadores de bloqueo de producción.
  - Puertos costeros posicionados alrededor de la isla (3:1 genérico y 2:1 específicos).
- **Mecánicas Oficiales Completas:**
  - **Fase de Preparación (Snake Draft):** Ronda 1 y 2 en orden inverso; el segundo poblado entrega inmediatamente 1 recurso por cada hexágono colindante.
  - **Tirada de Dados y Ladrón (7):** Descarte obligatorio de la mitad de la mano si tienes más de 7 cartas, movimiento del ladrón y robo de recursos a rivales adyacentes.
  - **Comercio:**
    - Comercio doméstico entre jugadores (oferta, contraoferta y confirmación).
    - Comercio con la banca y puertos (reconocimiento automático de puertos 2:1 y 3:1 del jugador).
  - **Cartas de Desarrollo:** Caballeros, Monopolio, Año de la Abundancia, Construcción de Carreteras y Puntos de Victoria secretos.
  - **Títulos de Victoria:** Gran Ruta Comercial (2 PV, mínimo 5 segmentos continuos) y Mayor Ejército (2 PV, mínimo 3 caballeros).
  - **Bots con IA:** Capaces de jugar la fase inicial, tirar dados, descartar, comerciar, construir carreteras, poblados y ciudades inteligentemente.
- **Efectos de Sonido Procedurales:**
  - Sintetizados nativamente con **Web Audio API** (sin descargas externas): traqueteo de dados, martillo de construcción, campana de comercio y fanfarria de victoria.
- **Celebración de Victoria:** Confeti interactivo y podio cuando un jugador alcanza la meta de puntos (10 o 12 PV).

---

## 🏗️ Arquitectura del Proyecto

```
catan/
├── server/                    # Backend modular de Catán
│   ├── models/
│   │   ├── CatanUser.js       # Modelo de usuarios y estadísticas
│   │   └── CatanGame.js       # Historial de partidas terminadas
│   ├── services/
│   │   ├── catanEngine.js     # Motor central con reglas y generación matemática
│   │   ├── catanService.js    # Gestor de salas y persistencia
│   │   └── catanSocket.js     # Servidor WebSocket en /api/catan/ws
│   ├── routes/
│   │   └── catanRoutes.js     # API REST (auth, salas, clasificación)
│   └── server.js              # Servidor Express + WS standalone
├── src/                       # Frontend SPA (React 19 + Vite)
│   ├── components/
│   │   ├── CatanBoard.jsx     # Tablero hexagonal SVG interactivo
│   │   ├── PlayerHUD.jsx      # Barra de acción, dados y mano de cartas
│   │   ├── TradeModal.jsx     # Comercio entre jugadores y con puertos
│   │   ├── RobberModal.jsx    # Descarte de 7 y robo del ladrón
│   │   ├── DevCardModal.jsx   # Cartas de desarrollo
│   │   ├── SidebarPlayers.jsx # Tabla de posiciones en vivo
│   │   ├── ChatAndLogs.jsx    # Historial y chat de sala
│   │   ├── GameRoomLobby.jsx  # Sala de espera y selección de colores
│   │   ├── LobbyBrowser.jsx   # Explorador de partidas y clasificación
│   │   └── VictoryModal.jsx   # Modal de victoria con confeti
│   ├── utils/
│   │   ├── api.js             # Conexión REST y WebSocket
│   │   └── soundEffects.js    # Sintetizador de audio Web Audio API
│   ├── App.jsx                # Componente raíz
│   ├── index.css              # Estilos completos y animaciones
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js >= 18
- MongoDB (local o conexión remota URI)

### 1. Clonar el repositorio
```bash
git clone https://github.com/julyrodriguez/catan.git
cd catan
```

### 2. Instalar dependencias del cliente
```bash
npm install
```

### 3. Compilar el cliente
```bash
npm run build
```

### 4. Iniciar el servidor
```bash
cd server
npm install
node server.js
```

La aplicación estará accesible en:
👉 **`http://localhost:3000/catan/`**

---

## 📜 Licencia

MIT © Julian Rodríguez
