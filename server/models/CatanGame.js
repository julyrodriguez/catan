const mongoose = require('mongoose');

const catanGameSchema = new mongoose.Schema({
  roomCode: { type: String, required: true },
  title: { type: String, default: 'Catan Game' },
  mapType: { type: String, enum: ['classic', 'extended'], default: 'classic' },
  targetPoints: { type: Number, default: 10 },
  winner: {
    userId: { type: String },
    username: { type: String, required: true },
    color: { type: String },
    points: { type: Number, required: true }
  },
  players: [{
    userId: { type: String },
    username: { type: String, required: true },
    color: { type: String },
    points: { type: Number, default: 0 },
    isBot: { type: Boolean, default: false },
    settlements: { type: Number, default: 0 },
    cities: { type: Number, default: 0 },
    roads: { type: Number, default: 0 },
    armySize: { type: Number, default: 0 },
    roadLength: { type: Number, default: 0 },
    hasLongestRoad: { type: Boolean, default: false },
    hasLargestArmy: { type: Boolean, default: false }
  }],
  totalTurns: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: Date.now },
  durationSeconds: { type: Number, default: 0 }
});

module.exports = mongoose.model('CatanGame', catanGameSchema);
