// routes/catanRoutes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const CatanUser = require('../models/CatanUser');
const CatanGame = require('../models/CatanGame');
const catanService = require('../services/catanService');

// Middleware para verificar token de usuario de Catan
const authCatanUser = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers['x-catan-token'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (authHeader) {
    token = authHeader;
  }

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación no proporcionado.' });
  }

  const payload = CatanUser.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Sesión expirada o token inválido.' });
  }

  const user = await CatanUser.findById(payload.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  req.catanUser = user;
  next();
};

// 1. REGISTRO
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, avatar, preferredColor } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos (usuario, email, contraseña) son obligatorios.' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'El nombre de usuario debe tener entre 3 y 20 caracteres.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // Verificar si ya existe
    const existingUser = await CatanUser.findOne({
      $or: [
        { username: username.trim().toLowerCase() },
        { email: email.trim().toLowerCase() }
      ]
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email.trim().toLowerCase()) {
        return res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico.' });
      }
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = CatanUser.hashPassword(password, salt);

    const newUser = new CatanUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      avatar: avatar || '🧑‍🌾',
      preferredColor: preferredColor || '#EF4444'
    });

    await newUser.save();
    const token = CatanUser.generateToken(newUser);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        preferredColor: newUser.preferredColor,
        stats: newUser.stats
      }
    });
  } catch (error) {
    console.error('Error en registro de Catan:', error);
    res.status(500).json({ error: 'Error interno al registrar usuario.' });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Debes ingresar tu usuario/email y contraseña.' });
    }

    const searchStr = login.trim();
    const user = await CatanUser.findOne({
      $or: [
        { username: new RegExp(`^${searchStr}$`, 'i') },
        { email: searchStr.toLowerCase() }
      ]
    });

    if (!user || !user.validatePassword(password)) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu usuario y contraseña.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = CatanUser.generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        preferredColor: user.preferredColor,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Error en login de Catan:', error);
    res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
});

// 3. PERFIL ACTUAL
router.get('/me', authCatanUser, async (req, res) => {
  const user = req.catanUser;
  res.json({
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    preferredColor: user.preferredColor,
    stats: user.stats,
    createdAt: user.createdAt
  });
});

// 4. ACTUALIZAR PERFIL (avatar, color preferido)
router.patch('/profile', authCatanUser, async (req, res) => {
  try {
    const { avatar, preferredColor } = req.body;
    const user = req.catanUser;

    if (avatar) user.avatar = avatar;
    if (preferredColor) user.preferredColor = preferredColor;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
        preferredColor: user.preferredColor,
        stats: user.stats
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar perfil.' });
  }
});

// 5. SALAS: LISTAR SALAS ACTIVAS
router.get('/rooms', (req, res) => {
  try {
    const rooms = catanService.listRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener salas.' });
  }
});

// 6. SALAS: CREAR SALA
router.post('/rooms', (req, res) => {
  try {
    const { title, mapType, targetPoints, turnTimeLimit, hostUser } = req.body;

    let user = hostUser;
    // Si viene token, intentar autenticar
    const authHeader = req.headers.authorization || req.headers['x-catan-token'];
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      const verified = CatanUser.verifyToken(token);
      if (verified) {
        user = { id: verified.userId, username: verified.username };
      }
    }

    if (!user || !user.username) {
      user = {
        id: `guest_${Math.random().toString(36).substring(2, 7)}`,
        username: `Anfitrión_${Math.floor(Math.random() * 100)}`,
        avatar: '👑'
      };
    }

    const game = catanService.createRoom({
      title,
      mapType: mapType === 'extended' ? 'extended' : 'classic',
      targetPoints: targetPoints || 10,
      turnTimeLimit: turnTimeLimit !== undefined ? Number(turnTimeLimit) : 60,
      hostUser: user
    });

    res.status(201).json({
      success: true,
      roomCode: game.roomCode,
      game: game.getPublicState()
    });
  } catch (error) {
    console.error('Error al crear sala de Catan:', error);
    res.status(400).json({ error: error.message });
  }
});

// 7. SALAS: OBTENER SALA ESPECÍFICA
router.get('/rooms/:code', (req, res) => {
  const game = catanService.getRoom(req.params.code);
  if (!game) {
    return res.status(404).json({ error: 'Sala no encontrada.' });
  }
  res.json(game.getPublicState());
});

// 8. CLASIFICACIÓN (LEADERBOARD)
router.get('/leaderboard', async (req, res) => {
  try {
    const topWinners = await CatanUser.find({})
      .sort({ 'stats.gamesWon': -1, 'stats.totalVictoryPoints': -1 })
      .limit(20)
      .select('username avatar stats preferredColor');

    res.json(topWinners);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tabla de clasificación.' });
  }
});

// 9. HISTORIAL RECIENTE DE PARTIDAS
router.get('/history', async (req, res) => {
  try {
    const history = await CatanGame.find({})
      .sort({ endedAt: -1 })
      .limit(15);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial.' });
  }
});

module.exports = router;
