import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import pool from './config/db.js';

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
import profileRoutes from './routes/profile.js';

// Import socket handlers
import { setupTripSocket } from './sockets/tripSocket.js';
import { setupLocationSocket } from './sockets/locationSocket.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
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
app.use('/api/profile', profileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Socket.io setup
setupTripSocket(io);
setupLocationSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error:', err.stack);
  
  // Don't send stack trace to client in production
  const errorResponse = {
    error: 'Internal server error',
    message: err.message
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

const PORT = process.env.PORT || 5000;

// Test database connection before starting server
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✓ Database connected successfully');
    server.listen(PORT, () => {
      console.log(`HaulKE Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('✗ Database connection failed:');
    console.error(err.message);
    console.error('\nPlease ensure:');
    console.error('1. PostgreSQL is running');
    console.error('2. Database credentials in .env are correct');
    console.error('3. Database exists and tables are created');
    console.error('\nRun: node scripts/test-db-connection.js to diagnose');
    process.exit(1);
  });
