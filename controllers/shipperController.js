import pool from '../config/db.js';

export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name, u.email, u.phone, u.profile_photo
       FROM shippers s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipper profile not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, business_name, county } = req.body;

    // Update user info
    await pool.query(
      'UPDATE users SET name = $1, phone = $2 WHERE id = $3',
      [name, phone, req.user.id]
    );

    // Update shipper info
    const result = await pool.query(
      `UPDATE shippers SET business_name = $1, county = $2
       WHERE user_id = $3
       RETURNING *`,
      [business_name, county, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const getStats = async (req, res) => {
  try {
    // Get shipper ID
    const shipperResult = await pool.query(
      'SELECT id FROM shippers WHERE user_id = $1',
      [req.user.id]
    );

    if (shipperResult.rows.length === 0) {
      return res.json({
        totalShipments: 0,
        activeShipments: 0,
        totalSpent: 0,
      });
    }

    const shipperId = shipperResult.rows[0].id;

    // Get total shipments count
    const totalResult = await pool.query(
      'SELECT COUNT(*) as count FROM cargo_listings WHERE shipper_id = $1',
      [shipperId]
    );

    // Get active shipments count
    const activeResult = await pool.query(
      `SELECT COUNT(*) as count FROM cargo_listings 
       WHERE shipper_id = $1 AND status IN ('open', 'matched', 'in_transit')`,
      [shipperId]
    );

    // Get total spent (sum of completed trip payments)
    const spentResult = await pool.query(
      `SELECT COALESCE(SUM(p.amount_kes), 0) as total
       FROM payments p
       JOIN trips t ON p.trip_id = t.id
       WHERE t.shipper_id = $1 AND p.status = 'released'`,
      [shipperId]
    );

    res.json({
      totalShipments: parseInt(totalResult.rows[0].count),
      activeShipments: parseInt(activeResult.rows[0].count),
      totalSpent: parseFloat(spentResult.rows[0].total),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
