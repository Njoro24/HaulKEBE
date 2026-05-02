import pool from '../config/db.js';

export const acceptCargo = async (req, res) => {
  try {
    const { cargo_id } = req.body;

    // Get driver ID
    const driverResult = await pool.query('SELECT id FROM drivers WHERE user_id = $1', [req.user.id]);
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    const driver_id = driverResult.rows[0].id;

    // Get cargo details
    const cargoResult = await pool.query('SELECT * FROM cargo_listings WHERE id = $1', [cargo_id]);
    if (cargoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo not found' });
    }

    const cargo = cargoResult.rows[0];

    // Create trip
    const result = await pool.query(
      `INSERT INTO trips (cargo_id, driver_id, shipper_id, status, started_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [cargo_id, driver_id, cargo.shipper_id, 'accepted']
    );

    // Update cargo status
    await pool.query('UPDATE cargo_listings SET status = $1 WHERE id = $2', ['matched', cargo_id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept cargo' });
  }
};

export const getMyTrips = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.cargo_type, c.weight_kg, c.pickup_location, c.destination, c.offered_price
       FROM trips t
       JOIN cargo_listings c ON t.cargo_id = c.id
       WHERE t.driver_id = (SELECT id FROM drivers WHERE user_id = $1)
       OR t.shipper_id = (SELECT id FROM shippers WHERE user_id = $1)
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
};

export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT t.*, c.*, d.plate_number, d.truck_type, u.name as driver_name, u.phone as driver_phone
       FROM trips t
       JOIN cargo_listings c ON t.cargo_id = c.id
       JOIN drivers d ON t.driver_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
};

export const updateTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['accepted', 'picked_up', 'in_transit', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE trips SET status = $1, completed_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE completed_at END
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Update cargo status
    if (status === 'delivered') {
      await pool.query('UPDATE cargo_listings SET status = $1 WHERE id = $2', ['delivered', result.rows[0].cargo_id]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update trip status' });
  }
};
