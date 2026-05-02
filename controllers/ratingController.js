import pool from '../config/db.js';

export const submitRating = async (req, res) => {
  try {
    const { trip_id, rated_user_id, score, comment } = req.body;

    if (score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5' });
    }

    // Create rating
    const result = await pool.query(
      `INSERT INTO ratings (trip_id, rated_by, rated_user, score, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [trip_id, req.user.id, rated_user_id, score, comment]
    );

    // Update user average rating
    const avgResult = await pool.query(
      'SELECT AVG(score) as avg_score FROM ratings WHERE rated_user = $1',
      [rated_user_id]
    );

    const avgScore = parseFloat(avgResult.rows[0].avg_score).toFixed(2);

    // Update driver or shipper rating
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [rated_user_id]);
    if (userResult.rows[0].role === 'driver') {
      await pool.query('UPDATE drivers SET rating_avg = $1 WHERE user_id = $2', [avgScore, rated_user_id]);
    } else {
      await pool.query('UPDATE shippers SET rating_avg = $1 WHERE user_id = $2', [avgScore, rated_user_id]);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};

export const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT r.*, u.name as rater_name
       FROM ratings r
       JOIN users u ON r.rated_by = u.id
       WHERE r.rated_user = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
};
