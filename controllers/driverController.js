import pool from '../config/db.js';
import cloudinary from '../config/cloudinary.js';

export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.name, u.email, u.phone, u.profile_photo, u.is_verified
       FROM drivers d
       JOIN users u ON d.user_id = u.id
       WHERE d.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, truck_type, capacity_kg, primary_route } = req.body;

    // Update user info
    await pool.query(
      'UPDATE users SET name = $1, phone = $2 WHERE id = $3',
      [name, phone, req.user.id]
    );

    // Update driver info
    const result = await pool.query(
      `UPDATE drivers SET truck_type = $1, capacity_kg = $2, primary_route = $3
       WHERE user_id = $4
       RETURNING *`,
      [truck_type, capacity_kg, primary_route, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const uploadPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadPromises = req.files.map((file) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'haulke/drivers', resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      })
    );

    const photoUrls = await Promise.all(uploadPromises);

    // Update driver photos
    const result = await pool.query(
      'UPDATE drivers SET truck_photos = $1 WHERE user_id = $2 RETURNING *',
      [photoUrls, req.user.id]
    );

    res.json({ photos: photoUrls, driver: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Photo upload failed' });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT d.id, d.truck_type, d.plate_number, d.capacity_kg, d.truck_photos, d.primary_route, d.rating_avg, d.total_trips,
              u.name, u.profile_photo
       FROM drivers d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
};
