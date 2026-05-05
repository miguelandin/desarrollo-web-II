import EventEmitter from 'events';

class NotificationService extends EventEmitter { }
const notificationService = new NotificationService();

// Listeners requeridos
notificationService.on('user:registered', (user) => console.log(`[EVENT] Usuario registrado: ${user.email}`));
notificationService.on('user:verified', (user) => console.log(`[EVENT] Usuario verificado: ${user.email}`));
notificationService.on('user:invited', (email) => console.log(`[EVENT] Usuario invitado: ${email}`));
notificationService.on('user:deleted', (id) => console.log(`[EVENT] Usuario eliminado ID: ${id}`));

export default notificationService;
