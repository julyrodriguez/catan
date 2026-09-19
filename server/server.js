// server/server.js
// Servidor standalone para Catan Online
require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const catanRoutes = require('./routes/catanRoutes');
const { initCatanWebSocket } = require('./services/catanSocket');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vacas_locas';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('🔌 Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Rutas de API
app.use('/api/catan', catanRoutes);

// Servir frontend compilado
app.use('/catan', express.static(path.join(__dirname, '../dist')));
app.get('/catan/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Redirección de raíz a /catan/
app.get('/', (req, res) => {
  res.redirect('/catan/');
});

const server = http.createServer(app);
initCatanWebSocket(server);

server.listen(PORT, () => {
  console.log(`🎲 Servidor de Catán Online corriendo en http://localhost:${PORT}/catan/`);
});
