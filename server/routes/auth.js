import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// Store temporary OTPs in-memory for testing/development
const otpStore = new Map();

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const digits10 = (phone || '').toString().replace(/\D/g, '').slice(-10);
    if (!digits10 || digits10.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    // Default test OTP
    const otp = '123456';
    otpStore.set(digits10, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    res.json({
      success: true,
      message: `OTP sent successfully to ${digits10}`,
      debugOtp: otp
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const digits10 = (phone || '').toString().replace(/\D/g, '').slice(-10);
    if (!digits10 || digits10.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    if (!otp) {
      return res.status(400).json({ error: 'Verification OTP is required' });
    }

    const stored = otpStore.get(digits10);
    const isValid = otp === '123456' || (stored && stored.otp === otp && stored.expiresAt > Date.now());

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    otpStore.delete(digits10);

    // Look up user: exact 10 digits
    const existing = await query(
      `SELECT * FROM users WHERE phone = $1 ORDER BY id ASC LIMIT 1`,
      [digits10]
    );

    const adminPhone = (process.env.ADMIN_PHONE || '8122850816').toString().replace(/\D/g, '').slice(-10);
    const expectedRole = digits10 === adminPhone ? 'admin' : 'user';

    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      if (user.role !== expectedRole) {
        try {
          const updateRes = await query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
            [expectedRole, user.id]
          );
          user = updateRes.rows[0] || { ...user, role: expectedRole };
        } catch {
          user.role = expectedRole;
        }
      }
    } else {
      const id = 'usr_' + Date.now();
      const insertResult = await query(
        'INSERT INTO users (id, phone, role) VALUES ($1, $2, $3) RETURNING *',
        [id, digits10, expectedRole]
      );
      user = insertResult.rows[0];
    }

    // Fetch user's active subscription if assigned
    const subRes = await query(
      `SELECT * FROM subscriptions 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY started_at DESC LIMIT 1`,
      [user.id]
    );

    let subscription = null;
    if (subRes.rows.length > 0) {
      const sub = subRes.rows[0];
      subscription = {
        planId: sub.plan_id,
        planName: sub.plan_name,
        status: sub.status,
        startedAt: sub.started_at,
        expiresAt: sub.expires_at
      };
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at
      },
      subscription,
      token: 'jwt-auth-token-' + Date.now()
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
