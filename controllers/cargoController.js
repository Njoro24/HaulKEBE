import pool from '../config/db.js';
import cloudinary from '../config/cloudinary.js';

export const postCargo = async (req, res) => {
  try {
    const {
      cargo_type,
      description,
      weight_kg,
      pickup_location,
      pickup_lat,
      pickup_lng,
      destination,
      destination_lat,
      destination_lng,
      pickup_time,
      special_instructions,
      offered_price,
    } = req.body;

    // Get shipper ID
    const shipperResult = await pool.query('SELECT id FROM shippers WHERE user_id = $1', [req.user.id]);
    if (shipperResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shipper profile not found' });
    }

    const shipper_id = shipperResult.rows[0].id;

    // Upload photos if provided
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'haulke/cargo', resource_type: 'auto' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.end(file.buffer);
        })
      );
      photoUrls = await Promise.all(uploadPromises);
    }

    // Create cargo listing
    const result = await pool.query(
      `INSERT INTO cargo_listings (
        shipper_id, cargo_type, description, weight_kg, photos,
        pickup_location, pickup_lat, pickup_lng,
        destination, destination_lat, destination_lng,
        pickup_time, special_instructions, offered_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        shipper_id,
        cargo_type,
        description,
        weight_kg,
        photoUrls,
        pickup_location,
        pickup_lat,
        pickup_lng,
        destination,
        destination_lat,
        destination_lng,
        pickup_time,
        special_instructions,
        offered_price,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post cargo' });
  }
};

export const getAllCargo = async (req, res) => {
  try {
    const { cargo_type, route } = req.query;

    let query = 'SELECT * FROM cargo_listings WHERE status = $1';
    const params = ['open'];

    if (cargo_type) {
      query += ` AND cargo_type = $${params.length + 1}`;
      params.push(cargo_type);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cargo listings' });
  }
};

export const getCargoById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM cargo_listings WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cargo' });
  }
};

export const updateCargo = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, offered_price, special_instructions } = req.body;

    const result = await pool.query(
      `UPDATE cargo_listings
       SET description = $1, offered_price = $2, special_instructions = $3
       WHERE id = $4 AND status = $5
       RETURNING *`,
      [description, offered_price, special_instructions, id, 'open']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo not found or cannot be updated' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update cargo' });
  }
};

export const deleteCargo = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE cargo_listings SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
      ['cancelled', id, 'open']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo not found or cannot be cancelled' });
    }

    res.json({ message: 'Cargo cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete cargo' });
  }
};
