# MYNIX — admin & newsletter setup

One-time setup, about 15 minutes. Until it's done the site keeps working with
the bundled product list in `data/products.ts`, and the newsletter form shows
"Sign-ups are unavailable".

## 1. Supabase (products, photos, admin login)

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: paste and run `supabase/schema.sql`.
   This creates the `products` and `newsletter_subscribers` tables, the
   `product-images` photo bucket (images only, up to 8 MB) and the security
   rules (anyone can read live products; only admins can change them).
   It's safe to re-run after pulling schema changes.
3. Run `supabase/seed.sql` the same way to load the current 66 products.
4. **Authentication → Users → Add user**: create your admin login (email +
   password, tick "Auto confirm").
5. Make that user an admin — **SQL Editor**:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
6. **Authentication → Sign In / Providers → Email**: turn off
   "Allow new users to sign up", so nobody else can create an account.
   Under **Authentication → Policies** (password settings), set the minimum
   password length to 12.
7. **Project Settings → API**: copy the Project URL and the `anon` public key.

## 2. Resend (newsletter notifications)

Sign-ups are saved in Supabase and listed under **Subscribers** in the admin
either way; Resend only adds an email to you for each new subscriber.

1. Create a free account at [resend.com](https://resend.com) → **API Keys** → create one.
2. Without a verified domain, Resend only delivers to the email you signed up
   with, so set `NEWSLETTER_NOTIFY_EMAIL` to that address. To send from your own
   domain (e.g. `hello@mynix.lk`), verify it under **Domains** and set
   `NEWSLETTER_FROM_EMAIL`.

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in the values. On Vercel add the
same variables under **Project → Settings → Environment Variables**, then
redeploy.

## Using the admin

- Go to **`/admin`** on your site and sign in.
- **Add product**, or click the pencil to edit. Fields:
  - *Product code*: internal ID used in WhatsApp inquiries (not shown on the site).
  - *Key features*, *Options*: one per line.
  - *Photo*: upload JPG/PNG/WebP/AVIF up to 8 MB. Transparent or plain backgrounds look best.
  - *Show on the website*: untick to hide without deleting.
  - *Flagship*: the product behind the hero's "Order the kit" button (only one at a time).
- The switch in the list shows or hides a product instantly.
- **Subscribers** lists everyone who joined the newsletter, newest first.
- Changes appear on the website straight away.

To add another admin, create their user (step 1.4) and run step 1.5 with their email.
