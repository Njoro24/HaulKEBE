export const setupLocationSocket = (io) => {
  io.on('connection', (socket) => {
    // Driver sends location update
    socket.on('driver_location_update', (data) => {
      const { tripId, lat, lng } = data;
      io.to(`trip_${tripId}`).emit('driver_location_changed', { tripId, lat, lng });
    });

    // Shipper requests location
    socket.on('request_driver_location', (tripId) => {
      socket.join(`trip_${tripId}`);
      io.to(`trip_${tripId}`).emit('location_requested', { tripId });
    });
  });
};
