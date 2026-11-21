import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// Store temporary OTPs in-memory for testing/development
const otpStore = new Map();

const PLAN_NAMES = {
  mobile: 'Mobile',
  super: 'Super',
  premium: 'Premium 4K'
};

// In-memory fallback registry if database is offline or VPN disconnected
const memoryUsers = new Map([
  ['8122850816', { id: 'usr_admin', name: 'Mani Admin', phone: '8122850816', role: 'admin', planId: 'premium', planName: 'Admin Premium 4K' }],
  ['9876500001', { id: 'usr_demo_1', name: 'Mobile Tester 1', phone: '9876500001', role: 'user', planId: 'mobile', planName: 'Mobile' }],
  ['9876500002', { id: 'usr_demo_2', name: 'Mobile Tester 2', phone: '9876500002', role: 'user', planId: 'mobile', planName: 'Mobile' }],
  ['9876500003', { id: 'usr_demo_3', name: 'Mobile Tester 3', phone: '9876500003', role: 'user', planId: 'mobile', planName: 'Mobile' }],
  ['9876500004', { id: 'usr_demo_4', name: 'Super Tester 1', phone: '9876500004', role: 'user', planId: 'super', planName: 'Super' }],
  ['9876500005', { id: 'usr_demo_5', name: 'Super Tester 2', phone: '9876500005', role: 'user', planId: 'super', planName: 'Super' }],
  ['9876500006', { id: 'usr_demo_6', name: 'Super Tester 3', phone: '9876500006', role: 'user', planId: 'super', planName: 'Super' }],
  ['9876500007', { id: 'usr_demo_7', name: 'Super Tester 4', phone: '9876500007', role: 'user', planId: 'super', planName: 'Super' }],
  ['9876500008', { id: 'usr_demo_8', name: 'Premium Tester 1', phone: '9876500008', role: 'user', planId: 'premium', planName: 'Premium 4K' }],
  ['9876500009', { id: 'usr_demo_9', name: 'Premium Tester 2', phone: '9876500009', role: 'user', planId: 'premium', planName: 'Premium 4K' }],
  ['9876500010', { id: 'usr_demo_10', name: 'StreamBox Admin', phone: '9876500010', role: 'admin', planId: 'premium', planName: 'Premium 4K' }]
]);

// Helper to query user with graceful fallback
const findUserByPhone = async (phone) => {
  try {
    const existing = await query(
      'SELECT id, name, phone, role FROM users WHERE phone = $1 LIMIT 1',
      [phone]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }
  } catch (err) {
    console.warn('[Auth] Database offline, checking memory store for user:', phone);
  }
  return memoryUsers.get(phone) || null;
};

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, mode } = req.body;
    const digits10 = (phone || '').toString().replace(/\D/g, '').slice(-10);
    if (!digits10 || digits10.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    const user = await findUserByPhone(digits10);
    const userExists = !!user;

    // Enforce register vs login rule
    if (mode === 'login' && !userExists) {
      return res.status(404).json({
        error: 'This mobile number is not registered. Please register first to start streaming.',
        notRegistered: true
      });
    }

    if (mode === 'register' && userExists) {
      return res.status(400).json({
        error: 'This mobile number is already registered. Please sign in instead.',
        alreadyRegistered: true
      });
    }

    // Default test OTP
    const otp = '123456';
    otpStore.set(digits10, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    res.json({
      success: true,
      message: `OTP sent successfully to ${digits10}`,
      debugOtp: otp,
      userExists
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, planId = 'super', otp } = req.body;
    const digits10 = (phone || '').toString().replace(/\D/g, '').slice(-10);
    const cleanName = (name || '').trim();

    if (!cleanName) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (!digits10 || digits10.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    const validPlans = ['mobile', 'super', 'premium'];
    const chosenPlan = validPlans.includes(planId) ? planId : 'super';

    if (!otp) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const stored = otpStore.get(digits10);
    const isValid = otp === '123456' || (stored && stored.otp === otp && stored.expiresAt > Date.now());
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    otpStore.delete(digits10);

    const existingUser = await findUserByPhone(digits10);
    if (existingUser) {
      return res.status(400).json({
        error: 'This mobile number is already registered. Please sign in.',
        alreadyRegistered: true
      });
    }

    const adminPhone = (process.env.ADMIN_PHONE || '8122850816').toString().replace(/\D/g, '').slice(-10);
    const role = digits10 === adminPhone ? 'admin' : 'user';
    const userId = 'usr_' + Date.now();
    const planName = PLAN_NAMES[chosenPlan] || 'Super';

    let userRecord = {
      id: userId,
      name: cleanName,
      phone: digits10,
      role,
      created_at: new Date().toISOString()
    };

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    let subscription = {
      planId: chosenPlan,
      planName,
      status: 'active',
      startedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    // Insert into PostgreSQL database
    console.log(`[Auth] Executing PostgreSQL INSERT for user ${digits10} (${cleanName})...`);
    const insertUserRes = await query(
      'INSERT INTO users (id, name, phone, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, cleanName, digits10, role]
    );
    if (insertUserRes.rows.length > 0) {
      userRecord = insertUserRes.rows[0];
    }
    console.log('[Auth] User successfully inserted into PostgreSQL:', userRecord);

    const subRes = await query(
      `INSERT INTO subscriptions (user_id, plan_id, plan_name, status, started_at, expires_at)
       VALUES ($1, $2, $3, 'active', NOW(), $4)
       RETURNING *`,
      [userId, chosenPlan, planName, expiresAt.toISOString()]
    );
    if (subRes.rows.length > 0) {
      const row = subRes.rows[0];
      subscription = {
        planId: row.plan_id,
        planName: row.plan_name,
        status: row.status,
        startedAt: row.started_at,
        expiresAt: row.expires_at
      };
    }
    console.log('[Auth] Subscription successfully inserted into PostgreSQL:', subscription);

    // Keep memory cache updated
    memoryUsers.set(digits10, {
      ...userRecord,
      planId: chosenPlan,
      planName,
      subscription
    });

    res.json({
      success: true,
      message: 'Registration successful! Welcome to StreamBox.',
      user: {
        id: userRecord.id,
        name: userRecord.name,
        phone: userRecord.phone,
        role: userRecord.role,
        createdAt: userRecord.created_at
      },
      subscription,
      token: 'jwt-auth-token-' + Date.now()
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: error.message || 'Failed to complete registration' });
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

    const user = await findUserByPhone(digits10);

    if (!user) {
      return res.status(404).json({
        error: 'Account not found for this mobile number. Please register first.',
        notRegistered: true
      });
    }

    const adminPhone = (process.env.ADMIN_PHONE || '8122850816').toString().replace(/\D/g, '').slice(-10);
    const expectedRole = digits10 === adminPhone ? 'admin' : (user.role || 'user');

    let subscription = user.subscription || null;

    // Try fetching active subscription from DB if available
    try {
      const subRes = await query(
        `SELECT * FROM subscriptions 
         WHERE user_id = $1 AND status = 'active'
         ORDER BY started_at DESC LIMIT 1`,
        [user.id]
      );
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
    } catch {
      // ignore db error, use fallback
    }

    if (!subscription) {
      const planId = user.planId || 'super';
      subscription = {
        planId,
        planName: PLAN_NAMES[planId] || 'Super',
        status: 'active',
        startedAt: new Date().toISOString()
      };
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name || 'User',
        phone: user.phone,
        role: expectedRole,
        createdAt: user.created_at || new Date().toISOString()
      },
      subscription,
      token: 'jwt-auth-token-' + Date.now()
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: error.message || 'Failed to verify OTP' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;