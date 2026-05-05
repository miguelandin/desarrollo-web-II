import { createServer } from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { initSocket } from './config/socket.js';

const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI;

const httpServer = createServer(app);
const io = initSocket(httpServer);

mongoose.connect(DB_URI)
    .then(() => {
        console.log('Conectado a MongoDB');
        httpServer.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
    })
    .catch(err => {
        console.error('Error conectando a MongoDB', err);
        process.exit(1);
    });

const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} recibido. Cerrando servidor...`);
    httpServer.close(async () => {
        try {
            await mongoose.connection.close();
            console.log('MongoDB desconectado');
            io.close();
            console.log('Socket.IO cerrado');
            process.exit(0);
        } catch (err) {
            console.error('Error durante el cierre:', err);
            process.exit(1);
        }
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
