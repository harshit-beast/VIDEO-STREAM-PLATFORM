/**
 * Socket.io Handler
 * Manages real-time communication for video processing updates
 */

export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join user-specific room for real-time updates
    socket.on('join-user-room', (userId) => {
      const room = `user-${userId}`;
      socket.join(room);
      console.log(`📦 Socket ${socket.id} joined room: ${room}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};
