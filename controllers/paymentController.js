import pool from '../config/db.js';
import Stripe from 'stripe';
import axios from 'axios';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export const initiateMpesa = async (req, res) => {
  try {
    const { trip_id, phone_number } = req.body;

    // Get trip and amount
    const tripResult = await pool.query(
      'SELECT t.*, c.offered_price FROM trips t JOIN cargo_listings c ON t.cargo_id = c.id WHERE t.id = $1',
      [trip_id]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripResult.rows[0];
    const amount = trip.offered_price;

    // Create payment record
    const paymentResult = await pool.query(
      `INSERT INTO payments (trip_id, amount_kes, method, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [trip_id, amount, 'mpesa', 'pending']
    );

    // TODO: Integrate with M-Pesa Daraja API
    // This is a placeholder for M-Pesa STK push logic
    res.json({
      payment: paymentResult.rows[0],
      message: 'M-Pesa STK push initiated',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to initiate M-Pesa payment' });
  }
};

export const mpesaCallback = async (req, res) => {
  try {
    // Handle M-Pesa callback
    const { Body } = req.body;
    const result = Body.stkCallback;

    if (result.ResultCode === 0) {
      // Payment successful
      const mpesaRef = result.CallbackMetadata.Item[1].Value;

      // Update payment status
      await pool.query(
        `UPDATE payments SET status = $1, mpesa_reference = $2, paid_at = NOW()
         WHERE mpesa_reference = $3`,
        ['held', mpesaRef, mpesaRef]
      );
    }

    res.json({ ResultCode: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Callback processing failed' });
  }
};

export const chargeCard = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { trip_id, token } = req.body;

    // Get trip and amount
    const tripResult = await pool.query(
      'SELECT t.*, c.offered_price FROM trips t JOIN cargo_listings c ON t.cargo_id = c.id WHERE t.id = $1',
      [trip_id]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripResult.rows[0];
    const amount = Math.round(trip.offered_price * 100); // Convert to cents

    // Create Stripe charge
    const charge = await stripe.charges.create({
      amount,
      currency: 'kes',
      source: token,
      description: `HaulKE Trip ${trip_id}`,
    });

    // Create payment record
    const paymentResult = await pool.query(
      `INSERT INTO payments (trip_id, amount_kes, method, stripe_payment_id, status, paid_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [trip_id, trip.offered_price, 'card', charge.id, 'held']
    );

    res.json(paymentResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Card payment failed' });
  }
};

export const releaseEscrow = async (req, res) => {
  try {
    const { trip_id } = req.body;

    // Get payment
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE trip_id = $1 AND status = $2',
      [trip_id, 'held']
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment status
    const result = await pool.query(
      `UPDATE payments SET status = $1, released_at = NOW()
       WHERE trip_id = $2
       RETURNING *`,
      ['released', trip_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to release escrow' });
  }
};
