// src/socket/handlers/room.handler.js
module.exports = (io, socket) => {
  
  socket.on('room:join', (payload) => {
    const { roomId } = payload;
    
    // Unir el socket a la sala de Socket.IO
    socket.join(roomId);
    console.log(`${socket.user.username} se unió a la sala ${roomId}`);

    // Avisar a los demás en la sala
    socket.to(roomId).emit('room:user-joined', {
      user: socket.user.username
    });

    // Confirmar al usuario que se unió
    socket.emit('room:joined', { roomId, status: 'success' });
  });

  socket.on('room:leave', (payload) => {
    const { roomId } = payload;
    
    socket.leave(roomId);
    
    // Avisar a la sala que salió
    socket.to(roomId).emit('room:user-left', {
      user: socket.user.username
    });
  });
};
