// src/socket/index.js
const jwt = require('jsonwebtoken');
const registerRoomHandlers = require('./handlers/room.handler');
const registerChatHandlers = require('./handlers/chat.handler');

module.exports = (io) => {
  // Middleware de Autenticación de Socket.IO
  io.use((socket, next) => {
    try {
      // El token debe venir en el handshake
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Autenticación denegada: Token no proporcionado'));
      }

      // Verificar el JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Guardar los datos del usuario en el objeto socket para usarlos luego
      socket.user = decoded; 
      next();
    } catch (error) {
      next(new Error('Autenticación denegada: Token inválido'));
    }
  });

  // Gestión de Conexiones
  io.on('connection', (socket) => {
    console.log(`🟢 Usuario conectado: ${socket.user.username} (${socket.id})`);

    // Emitir estado global (opcional)
    io.emit('user:online', { userId: socket.user.id });

    // Registrar manejadores de eventos modulares
    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);

    // Gestión de desconexión
    socket.on('disconnect', () => {
      console.log(`🔴 Usuario desconectado: ${socket.user.username}`);
      io.emit('user:offline', { userId: socket.user.id });
    });
  });
};
