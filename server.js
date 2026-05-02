import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import driverRoutes from './routes/drivers.js';
import shipperRoutes from './routes/shippers.js';
import cargoRoutes from './routes/cargo.js';
import tripRoutes from './routes/trips.js';
import paymentRoutes from './routes/payments.js';
import ratingRoutes from './routes/ratings.js';
import trackingRoutes from './routes/tracking.js';
import notificationRoutes from './routes/notifications.js';

// Import socket handlers
import { setupTripSocket } from './sockets/tripSocket.js';
import { setupLocationSocket } from './sockets/locationSocket.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/shippers', shipperRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Socket.io setup
setupTripSocket(io);
setupLocationSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`HaulKE Backend running on port ${PORT}`);
});
