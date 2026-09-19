const mongoose = require('mongoose');
const crypto = require('crypto');

const catanUserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    minlength: 2, 
    maxlength: 24 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  avatar: { type: String, default: '🧑‍🌾' },
  preferredColor: { type: String, default: '#EF4444' },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalVictoryPoints: { type: Number, default: 0 },
    longestRoadCount: { type: Number, default: 0 },
    largestArmyCount: { type: Number, default: 0 },
    settlementsBuilt: { type: Number, default: 0 },
    citiesBuilt: { type: Number, default: 0 },
    roadsBuilt: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

// Helpers para hashing seguro sin librerías externas
catanUserSchema.statics.hashPassword = function(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
};

catanUserSchema.methods.validatePassword = function(password) {
  const hash = crypto.scryptSync(password, this.salt, 64).toString('hex');
  return this.passwordHash === hash;
};

// Generación de token de sesión simple y seguro (HMAC-SHA256)
const SECRET = process.env.ADMIN_SECRET_TOKEN || 'catan_jwt_secret_key_vacaslocas_2026';

catanUserSchema.statics.generateToken = function(user) {
  const payload = {
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 días
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
};

catanUserSchema.statics.verifyToken = function(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (signature !== expectedSignature) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
};

module.exports = mongoose.model('CatanUser', catanUserSchema);
