import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.STRIPE_SECRET_KEY;
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !webhookSecret) {
    return new Response('Stripe nu este configurat.', { status: 500 });
  }

  const stripe = new Stripe(secret);
  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('Lipsește semnătura.', { status: 400 });

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message);
    return new Response(`Webhook invalid: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const amount = (session.amount_total || 0) / 100;
      const email = session.customer_email || session.customer_details?.email;
      const isRecurring = session.mode === 'subscription';

      console.log(
        `[Donație ${isRecurring ? 'lunară' : 'unică'}] ${amount} RON de la ${email} — sesiune ${session.id}`
      );

      // TODO: trimite email de mulțumire (Resend, SendGrid etc.)
      // TODO: log în Google Sheets / Notion / DB pentru contabilitate
      break;
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Donație recurentă plătită] ${(invoice.amount_paid || 0) / 100} RON`);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      console.log(`[Donație lunară oprită] ${sub.id}`);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
