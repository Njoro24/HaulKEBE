import pool from '../config/db.js';
import { db } from '../config/firebase.js';

export const updateLocation = async (req, res) => {
  try {
    const { trip_id, lat, lng } = req.body;

    // Update trip location
    const result = await pool.query(
      'UPDATE trips SET driver_lat = $1, driver_lng = $2 WHERE id = $3 RETURNING *',
      [lat, lng, trip_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Also update Firebase for real-time tracking if available
    if (db) {
      await db.ref(`trips/${trip_id}/location`).set({
        lat,
        lng,
        timestamp: Date.now(),
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

export const getLocation = async (req, res) => {
  try {
    const { trip_id } = req.params;

    const result = await pool.query(
      'SELECT driver_lat, driver_lng FROM trips WHERE id = $1',
      [trip_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
};
