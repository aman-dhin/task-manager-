const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, passwordHash });

      const payload = { id: user._id.toString(), name: user.name, email: user.email };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({ message: 'Registration successful', token, user: payload });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const matches = await bcrypt.compare(password, user.passwordHash);
      if (!matches) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const payload = { id: user._id.toString(), name: user.name, email: user.email };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      return res.json({ message: 'Login successful', token, user: payload });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------
// POST /logout
// Stateless JWT: logout is handled client-side by discarding the
// token. This endpoint exists for API symmetry / future blacklisting.
// ---------------------------------------------------------------
router.post('/logout', authenticate, (req, res) => {
  return res.json({ message: 'Logout successful' });
});

// ---------------------------------------------------------------
// GET /me - return current logged-in user (used to restore session)
// ---------------------------------------------------------------
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
