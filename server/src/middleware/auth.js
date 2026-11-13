import jwt from 'jsonwebtoken';
import { Admin } from '../models/index.js';
import { asyncHandler, HttpError } from '../utils/helpers.js';

export const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Not authorized');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Session expired, please login again');
  }
  const admin = await Admin.findById(payload.id);
  if (!admin) throw new HttpError(401, 'Not authorized');
  req.admin = admin;
  next();
});
