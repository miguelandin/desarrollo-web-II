import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

let io = null;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, { cors: { origin: '*' } });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('Token requerido'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded._id);
            if (!user || user.deleted) return next(new Error('Usuario no válido'));

            socket.user = user;
            next();
        } catch {
            next(new Error('Token inválido'));
        }
    });

    io.on('connection', (socket) => {
        if (socket.user?.company) {
            socket.join(socket.user.company.toString());
        }
    });

    return io;
};

export const getIo = () => io;
