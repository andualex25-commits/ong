# Educația Schimbă Destine — site Astro

Site oficial al Asociației Educația Schimbă Destine, construit cu [Astro](https://astro.build) și donații prin [Stripe](https://stripe.com).

## Pornire locală

```bash
npm install
cp .env.example .env   # adaugă cheile reale Stripe în .env
npm run dev
```

Site-ul rulează pe `http://localhost:4321`.

## Structura

```
src/
  layouts/Layout.astro      ← head, fonturi, header+footer pe fiecare pagină
  components/
    Header.astro            ← bar de sus + meniu mobil
    Footer.astro            ← footer + sticky donate + cookie banner
  pages/
    index.astro             ← /
    despre.astro            ← /despre
    misiune.astro           ← /misiune
    proiecte.astro          ← /proiecte
    echipa.astro            ← /echipa
    doneaza.astro           ← /doneaza  (form Stripe)
    multumim.astro          ← /multumim (după plată reușită)
    api/
      create-checkout.ts    ← POST /api/create-checkout (creează Stripe Session)
      stripe-webhook.ts     ← POST /api/stripe-webhook  (primește confirmările)
public/
  styles.css                ← CSS-ul existent, neatins
```

## Configurare Stripe

1. Cont Stripe la https://dashboard.stripe.com — înregistrezi ONG-ul (CIF, IBAN). 1-2 zile aprobare.
2. Aplică la programul **Stripe for Nonprofits** pentru reducere de 25% la comision: https://stripe.com/connect/nonprofits
3. Ia cheile din **Developers → API keys**:
   - `STRIPE_SECRET_KEY` (începe cu `sk_test_...` sau `sk_live_...`)
4. Pentru webhook:
   - **Developers → Webhooks → Add endpoint**
   - URL: `https://e-sd.ro/api/stripe-webhook`
   - Event-uri: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
   - Copiază **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

## Deploy pe Netlify

1. Push-uiești repo-ul pe GitHub.
2. https://app.netlify.com → **Add new site → Import from Git** → alege repo.
3. Build command: `npm run build`. Publish dir: `dist`. (Detectează automat.)
4. **Site settings → Environment variables** adaugi:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `PUBLIC_SITE_URL=https://e-sd.ro`
5. Domeniu personalizat: **Domain settings → Add custom domain → e-sd.ro**, urmează instrucțiunile DNS.

## Testare donații

Cu cheia `sk_test_...` poți testa cu carduri de test Stripe:

- Plată reușită: `4242 4242 4242 4242` · expiry orice viitor · CVC orice 3 cifre
- Plată respinsă: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

Pentru webhook local: `stripe listen --forward-to localhost:4321/api/stripe-webhook` (instalezi Stripe CLI).

## TODO opționale

- Email de mulțumire automat (Resend / SendGrid) — în `stripe-webhook.ts` la `checkout.session.completed`.
- Pagină `/contact` cu formular.
- Înlocuire `<div class="ph">` cu poze reale.
- Formular 230 PDF în `public/formular-230.pdf`.
- Politica de cookies, termeni, confidențialitate (linkurile `#` din footer).
