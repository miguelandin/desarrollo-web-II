const express = require('express');
const router = express.Router();
const Room = require('../models/room.model');
const Message = require('../models/message.model');
const { protect } = require('../middleware/auth.middleware');

// GET /api/rooms - Listar salas
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener salas' });
  }
});

// POST /api/rooms - Crear sala nueva
router.post('/', protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    const room = await Room.create({ name, description });
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear la sala' });
  }
});

// GET /api/rooms/:id/messages - Historial de mensajes
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.id })
      .populate('sender', 'username') // Trae el nombre del usuario, no solo su ID
      .sort({ timestamp: 1 }) // Orden cronológico (más antiguo primero)
      .limit(50); // Últimos 50 mensajes

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el historial' });
  }
});

module.exports = router;
