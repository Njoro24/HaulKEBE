-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(10) CHECK (role IN ('driver', 'shipper')) NOT NULL,
  profile_photo TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  truck_type VARCHAR(20) CHECK (truck_type IN ('standard', 'refrigerated')) NOT NULL,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  capacity_kg INTEGER NOT NULL,
  truck_photos TEXT[],
  primary_route VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3,2) DEFAULT 0.00,
  total_trips INTEGER DEFAULT 0
);

-- Shippers table
CREATE TABLE shippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  county VARCHAR(100),
  rating_avg DECIMAL(3,2) DEFAULT 0.00,
  total_shipments INTEGER DEFAULT 0
);

-- Cargo listings table
CREATE TABLE cargo_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id UUID REFERENCES shippers(id) ON DELETE CASCADE,
  cargo_type VARCHAR(20) CHECK (cargo_type IN ('cold', 'standard')) NOT NULL,
  description TEXT NOT NULL,
  weight_kg DECIMAL(10,2) NOT NULL,
  photos TEXT[],
  pickup_location TEXT NOT NULL,
  pickup_lat DECIMAL(9,6),
  pickup_lng DECIMAL(9,6),
  destination TEXT NOT NULL,
  destination_lat DECIMAL(9,6),
  destination_lng DECIMAL(9,6),
  pickup_time TIMESTAMP NOT NULL,
  special_instructions TEXT,
  offered_price DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','matched','in_transit','delivered','cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id UUID REFERENCES cargo_listings(id),
  driver_id UUID REFERENCES drivers(id),
  shipper_id UUID REFERENCES shippers(id),
  status VARCHAR(20) DEFAULT 'accepted' CHECK (status IN ('accepted','picked_up','in_transit','delivered')),
  driver_lat DECIMAL(9,6),
  driver_lng DECIMAL(9,6),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id),
  amount_kes DECIMAL(12,2) NOT NULL,
  method VARCHAR(10) CHECK (method IN ('mpesa','card')) NOT NULL,
  mpesa_reference VARCHAR(255),
  stripe_payment_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','held','released','refunded')),
  paid_at TIMESTAMP,
  released_at TIMESTAMP
);

-- Ratings table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id),
  rated_by UUID REFERENCES users(id),
  rated_user UUID REFERENCES users(id),
  score INTEGER CHECK (score BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_shippers_user_id ON shippers(user_id);
CREATE INDEX idx_cargo_shipper_id ON cargo_listings(shipper_id);
CREATE INDEX idx_cargo_status ON cargo_listings(status);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_shipper_id ON trips(shipper_id);
CREATE INDEX idx_trips_cargo_id ON trips(cargo_id);
CREATE INDEX idx_payments_trip_id ON payments(trip_id);
CREATE INDEX idx_ratings_rated_user ON ratings(rated_user);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
