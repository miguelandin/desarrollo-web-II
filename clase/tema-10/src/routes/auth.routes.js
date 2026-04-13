const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { protect } = require('../middleware/auth.middleware');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) return res.status(400).json({ message: 'El usuario ya existe' });

    const hashedPassword = await hashPassword(password);
    const user = await User.create({ username, email, password: hashedPassword });

    res.status(201).json({
      _id: user.id,
      username: user.username,
      token: generateToken(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await comparePassword(password, user.password))) {
      res.json({
        _id: user.id,
        username: user.username,
        token: generateToken(user)
      });
    } else {
      res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// GET /api/auth/me (Protegida)
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;
