const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev_access_secret';

function getSocketUser(socket) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer /, '');

    if (!token) {
      return null;
    }

    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = function registerSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const user = getSocketUser(socket);

    if (user?.sub) {
      socket.join(`user:${user.sub}`);
    }

    socket.on('disconnect', () => {
      socket.removeAllListeners();
    });
  });

  return io;
};
