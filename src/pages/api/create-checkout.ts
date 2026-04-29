import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  const secret = import.meta.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return jsonError('Stripe nu este configurat (lipsește STRIPE_SECRET_KEY).', 500);
  }

  let body: { amount?: number; mode?: 'payment' | 'subscription'; email?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Cerere invalidă.', 400);
  }

  const amount = Math.round(Number(body.amount));
  const mode = body.mode === 'subscription' ? 'subscription' : 'payment';
  const email = (body.email || '').trim();

  if (!Number.isFinite(amount) || amount < 5 || amount > 100000) {
    return jsonError('Suma trebuie să fie între 5 și 100.000 RON.', 400);
  }
  if (!email || !email.includes('@')) {
    return jsonError('Email invalid.', 400);
  }

  const stripe = new Stripe(secret);
  const origin = import.meta.env.PUBLIC_SITE_URL || url.origin;

  try {
    const productName = mode === 'subscription'
      ? 'Donație lunară — Educația Schimbă Destine'
      : 'Donație — Educația Schimbă Destine';

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        currency: 'ron',
        unit_amount: amount * 100,
        product_data: {
          name: productName,
          description: 'Donație către Asociația Educația Schimbă Destine. Mulțumim că schimbi destine alături de noi.',
        },
        ...(mode === 'subscription' ? { recurring: { interval: 'month' } } : {}),
      },
    };

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [lineItem],
      customer_email: email,
      success_url: `${origin}/multumim?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/doneaza?status=cancelled`,
      locale: 'ro',
      payment_method_types: ['card'],
      metadata: {
        donation_amount_ron: String(amount),
        donor_email: email,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return jsonError('Nu am putut iniția plata. Te rugăm să încerci din nou.', 500);
  }
};

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
