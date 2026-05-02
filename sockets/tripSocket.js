export const setupTripSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join trip room
    socket.on('join_trip', (tripId) => {
      socket.join(`trip_${tripId}`);
      console.log(`User joined trip: ${tripId}`);
    });

    // Trip status update
    socket.on('trip_status_update', (data) => {
      const { tripId, status } = data;
      io.to(`trip_${tripId}`).emit('trip_status_changed', { tripId, status });
    });

    // Leave trip room
    socket.on('leave_trip', (tripId) => {
      socket.leave(`trip_${tripId}`);
      console.log(`User left trip: ${tripId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
