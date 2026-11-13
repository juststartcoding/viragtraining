import crypto from 'crypto';
import { Enrollment, Order, WebinarRegistration } from '../models/lms.js';
import { HttpError } from './helpers.js';

export const razorpayEnabled = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

async function createRazorpayOrder(amountInr, receipt) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const r = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: Math.round(amountInr * 100), currency: 'INR', receipt }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, data?.error?.description || 'Payment gateway error');
  return data;
}

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export const verifyCheckoutSignature = (orderId, paymentId, signature) =>
  razorpayEnabled() &&
  safeEqual(crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex'), signature);

export const verifyWebhookSignature = (rawBody, signature) =>
  !!process.env.RAZORPAY_WEBHOOK_SECRET &&
  !!rawBody &&
  safeEqual(crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex'), signature);

/** Grants access for a paid order. Idempotent: safe to call from verify + webhook + admin approve. */
export async function fulfillOrder(order) {
  if (order.status !== 'paid') {
    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();
  }
  if (order.kind === 'course' || order.kind === 'batch') {
    await Enrollment.findOneAndUpdate(
      { user: order.user, [order.kind]: order.refId },
      {
        $set: { status: 'active', kind: order.kind, order: order._id },
        $setOnInsert: { source: order.gateway === 'free' ? 'free' : order.gateway === 'manual' ? 'admin' : 'purchase' },
      },
      { upsert: true, new: true }
    );
  } else if (order.kind === 'webinar') {
    await WebinarRegistration.findOneAndUpdate(
      { webinar: order.refId, email: order.guest.email },
      {
        $set: { paid: true, amount: order.amount, order: order._id, name: order.guest.name, phone: order.guest.phone },
        $setOnInsert: { user: order.user || null },
      },
      { upsert: true, new: true }
    );
  }
  return order;
}

/**
 * Starts a purchase.
 *  price 0          → fulfilled immediately             → { free: true }
 *  Razorpay enabled → Razorpay order for the client SDK  → { razorpay: {...} }
 *  otherwise        → pending order for admin approval   → { manual: true }
 */
export async function startCheckout({ kind, item, user = null, guest = {} }) {
  const price = Number(item.price) || 0;
  const order = await Order.create({
    user: user?._id || null,
    guest,
    kind,
    refId: item._id,
    title: item.title,
    amount: price,
    gateway: price <= 0 ? 'free' : razorpayEnabled() ? 'razorpay' : 'manual',
  });

  if (price <= 0) {
    await fulfillOrder(order);
    return { free: true, orderId: order._id };
  }
  if (!razorpayEnabled()) {
    order.status = 'pending';
    await order.save();
    return { manual: true, orderId: order._id, amount: price };
  }
  const rz = await createRazorpayOrder(price, String(order._id));
  order.razorpayOrderId = rz.id;
  await order.save();
  return {
    razorpay: {
      key: process.env.RAZORPAY_KEY_ID,
      order_id: rz.id,
      amount: rz.amount,
      currency: 'INR',
      description: item.title,
      prefill: { name: user?.name || guest.name || '', email: user?.email || guest.email || '', contact: user?.phone || guest.phone || '' },
    },
  };
}
