import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// GET /api/profile - Fetch current user's profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch user data
    const userResult = await pool.query(
      'SELECT id, name, email, phone, role, profile_photo, is_verified, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    let profileData = {
      fullName: user.name,
      email: user.email,
      phone: user.phone,
      profilePhoto: user.profile_photo,
      createdAt: user.created_at,
      role: userRole,
    };

    if (userRole === 'driver') {
      const driverResult = await pool.query(
        `SELECT id, truck_type, plate_number, capacity_kg, truck_photos, 
                primary_route, is_verified, rating_avg, total_trips 
         FROM drivers WHERE user_id = $1`,
        [userId]
      );

      if (driverResult.rows.length > 0) {
        const driver = driverResult.rows[0];
        
        // Parse truck_photos safely
        let truckPhotos = [];
        const tp = driver.truck_photos;
        if (tp) {
          if (Array.isArray(tp)) {
            truckPhotos = tp;
          } else if (typeof tp === 'string') {
            try {
              truckPhotos = JSON.parse(tp);
            } catch {
              truckPhotos = tp.split(',').map(s => s.trim()).filter(Boolean);
            }
          }
        }
        
        profileData = {
          ...profileData,
          truckType: driver.truck_type,
          plateNumber: driver.plate_number,
          capacityKg: driver.capacity_kg,
          truckPhotos,
          primaryRoute: driver.primary_route,
          verificationStatus: driver.is_verified ? 'verified' : 'pending',
          ratingAvg: driver.rating_avg ? parseFloat(driver.rating_avg) : 0,
          totalTrips: driver.total_trips || 0,
        };
      }
    } else if (userRole === 'shipper') {
      const shipperResult = await pool.query(
        `SELECT id, business_name, county, national_id, cargo_types, rating_avg, total_shipments 
         FROM shippers WHERE user_id = $1`,
        [userId]
      );

      if (shipperResult.rows.length > 0) {
        const shipper = shipperResult.rows[0];
        
        // Parse cargo_types safely
        let cargoTypePreferences = [];
        const ct = shipper.cargo_types;
        if (ct) {
          if (Array.isArray(ct)) {
            cargoTypePreferences = ct;
          } else if (typeof ct === 'string') {
            try {
              cargoTypePreferences = JSON.parse(ct);
            } catch {
              cargoTypePreferences = ct.split(',').map(s => s.trim());
            }
          }
        }
        
        profileData = {
          ...profileData,
          businessName: shipper.business_name,
          county: shipper.county,
          nationalId: shipper.national_id,
          cargoTypePreferences,
          ratingAvg: shipper.rating_avg ? parseFloat(shipper.rating_avg) : 0,
          totalShipments: shipper.total_shipments || 0,
        };
      }
    }

    // Fetch national ID from a separate table if it exists
    // For now, we'll return a placeholder for drivers
    if (userRole === 'driver') {
      profileData.nationalId = profileData.nationalId || 'XXXXXXXXX'; // Masked for security
    }

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/profile/password - Update password (no admin approval needed)
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      });
    }

    // Fetch current user
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// POST /api/change-requests - Submit a change request
router.post('/change-requests', authMiddleware, async (req, res) => {
  try {
    const { field, currentValue, newValue, reason } = req.body;
    const userId = req.user.id;

    if (!field || newValue === undefined) {
      return res.status(400).json({ error: 'Field and new value are required' });
    }

    // Create change request
    const result = await pool.query(
      `INSERT INTO change_requests (user_id, field, current_value, new_value, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, status, created_at`,
      [userId, field, JSON.stringify(currentValue), JSON.stringify(newValue), reason || null]
    );

    res.status(201).json({
      id: result.rows[0].id,
      status: result.rows[0].status,
      createdAt: result.rows[0].created_at,
      message: 'Change request submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting change request:', error);
    res.status(500).json({ error: 'Failed to submit change request' });
  }
});

// GET /api/change-requests - Fetch all change requests for current user
router.get('/change-requests', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, field, current_value, new_value, reason, status, admin_note, created_at, updated_at
       FROM change_requests
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const changeRequests = result.rows.map((row) => ({
      id: row.id,
      field: row.field,
      currentValue: JSON.parse(row.current_value),
      newValue: JSON.parse(row.new_value),
      reason: row.reason,
      status: row.status,
      adminNote: row.admin_note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(changeRequests);
  } catch (error) {
    console.error('Error fetching change requests:', error);
    res.status(500).json({ error: 'Failed to fetch change requests' });
  }
});

export default router;
