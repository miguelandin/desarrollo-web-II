// src/socket/handlers/chat.handler.js
const Message = require('../../models/message.model'); // Tu modelo de Mongoose

module.exports = (io, socket) => {
  
  // Escuchar nuevos mensajes
  socket.on('chat:message', async (payload) => {
    const { roomId, content } = payload;

    try {
      // 1. Guardar en MongoDB
      const newMessage = new Message({
        room: roomId,
        sender: socket.user.id,
        content: content,
        timestamp: new Date()
      });
      await newMessage.save();

      // 2. Emitir el mensaje SOLO a los usuarios en esa sala
      io.to(roomId).emit('chat:message', {
        id: newMessage._id,
        user: { id: socket.user.id, username: socket.user.username },
        content: content,
        timestamp: newMessage.timestamp
      });

    } catch (error) {
      console.error('Error al guardar mensaje:', error);
      socket.emit('error', { message: 'No se pudo enviar el mensaje' });
    }
  });

  // Indicador de "Escribiendo..."
  socket.on('chat:typing', (payload) => {
    const { roomId } = payload;
    
    // Broadcast a la sala excepto al que envía
    socket.to(roomId).emit('chat:typing', {
      user: socket.user.username
    });
  });
};
