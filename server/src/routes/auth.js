import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Admin } from '../models/index.js';
import { protect, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/helpers.js';

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, message: { message: 'Too many login attempts, try again later' } });

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');
    if (!email || !password) throw new HttpError(400, 'Email and password are required');
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await admin.matchPassword(password))) throw new HttpError(401, 'Invalid email or password');
    res.json({ token: signToken(admin._id), admin: { id: admin._id, name: admin.name, email: admin.email } });
  })
);

router.get('/me', protect, (req, res) => {
  const { _id, name, email } = req.admin;
  res.json({ id: _id, name, email });
});

router.put(
  '/password',
  protect,
  asyncHandler(async (req, res) => {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 8) throw new HttpError(400, 'New password must be at least 8 characters');
    const admin = await Admin.findById(req.admin._id).select('+password');
    if (!(await admin.matchPassword(currentPassword))) throw new HttpError(400, 'Current password is incorrect');
    admin.password = newPassword;
    await admin.save();
    res.json({ message: 'Password updated' });
  })
);

export default router;
