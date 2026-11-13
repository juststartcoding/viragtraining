import { api } from './api';

let razorpayPromise;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  razorpayPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = () => {
      razorpayPromise = null;
      reject(new Error('Could not load payment gateway. Check your internet connection.'));
    };
    document.body.appendChild(s);
  });
  return razorpayPromise;
}

/**
 * Handles any checkout response from the server.
 * Resolves to { status: 'enrolled' | 'paid' | 'manual' | 'dismissed', ...data }
 */
export async function completeCheckout(data) {
  if (data.alreadyEnrolled || data.free) return { status: 'enrolled', ...data };
  if (data.registered) return { status: 'registered', ...data };
  if (data.manual) return { status: 'manual', ...data };
  if (!data.razorpay) throw new Error('Unexpected checkout response');

  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rz = new window.Razorpay({
      ...data.razorpay,
      name: 'Virag Training Solutions',
      theme: { color: '#2550eb' },
      handler: async (resp) => {
        try {
          const { data: v } = await api.post('/checkout/verify', resp);
          resolve({ status: 'paid', ...v });
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => resolve({ status: 'dismissed' }) },
    });
    rz.on('payment.failed', (r) => reject(new Error(r?.error?.description || 'Payment failed')));
    rz.open();
  });
}

/** Logged-in student buys a course or batch */
export async function buy(kind, id) {
  const { data } = await api.post('/student/checkout', { kind, id });
  return completeCheckout(data);
}
