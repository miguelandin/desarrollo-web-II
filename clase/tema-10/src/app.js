// src/app.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db'); // Asumimos que tienes tu conexión a Mongo aquí
const configureSockets = require('./socket');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configuración de Socket.IO con CORS
const io = new Server(server, {
  cors: {
    origin: "*", // En producción, ajusta esto a tu dominio
    methods: ["GET", "POST"]
  }
});

// Middlewares de Express
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Servir index.html y chat.html

// Rutas REST (Puedes implementarlas luego)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/rooms', require('./routes/rooms.routes'));

// Inicializar configuración de WebSockets
configureSockets(io);

const PORT = process.env.PORT || 3000;

// Iniciar base de datos y servidor
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(err => console.error('Error conectando a la BD:', err));
