const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Referencia a la sala donde se envió
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  // Referencia al usuario que lo envió
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
