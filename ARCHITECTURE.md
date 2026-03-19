# 🏗️ Architecture & How It Works

This document explains the technical inner workings of the URL Shortener application, how the frontend and backend communicate, and how security is enforced.

## 1. The Technology Stack

- **Frontend:** Built with React (TypeScript), Vite, and Tailwind CSS. The UI is powered by modern components and smooth animations (`framer-motion`, animated elements). We use `lucide-react` for dynamic, lightweight icons.
- **Backend / Database:** [Supabase](https://supabase.com/), an open-source Firebase alternative powered by a real PostgreSQL database. It handles our Authentication, Row Level Security (RLS), and API endpoints natively.

## 2. Authentication & Sign Up Flow

1. **Sign Up:** A user enters their Name and Email in `animated-characters-login-page.tsx`. 
2. **OTP Generation:** The app calls `supabase.auth.signInWithOtp()`. Supabase generates a securely hashed 8-digit code and emails it to the user.
3. **Verification:** The UI switches to an OTP input screen. When the user enters the code, `supabase.auth.verifyOtp()` is called. If successful, Supabase returns a secure JSON Web Token (JWT) that React stores in local storage.
4. **Passwords:** Supabase handles all password hashing entirely on the backend side using bcrypt. No raw passwords are ever stored in the database.

## 3. Link Generation Workflow

When a logged-in user wants to create a short link:
1. They paste their long URL in the dashboard.
2. The `handleSubmit` function in `App.tsx` intercepts the form. If no custom alias is provided, it generates a random string of alphanumeric characters (e.g., `Xy9K1z`).
3. If they require a password, the frontend hashes the password (using standard Web Crypto API logic or sends it up to be hashed). 
4. The system inserts a new row into the `urls` table in Supabase. Supabase automatically attaches the authenticated user's `id` to the row.

## 4. The Redirection Flow (The Magic)

How does `yourdomain.com/Xy9K1z` become a redirection?

1. **Catching the Route:** The frontend router catches any path that isn't `home` or `dashboard` via the `RedirectHandler.tsx` component.
2. **Metadata Fetch:** `RedirectHandler` asks Supabase: *"Does the link `Xy9K1z` exist? Is it active? Is it password protected?"* 
3. **Security Gate:**
   - If it **is password protected**, the redirect halts. The UI prompts the user to enter a password. The frontend then sends the password to a secure Postgres Remote Procedure Call (RPC) named `verify_and_get_url`. This RPC evaluates the password *inside* the database and, if correct, returns the hidden original URL.
   - If it is **public**, `RedirectHandler` simply fetches the `original_url`.
4. **Data Analytics Logging:** Before sending the user to the destination, the app records their interaction.
   - It fetches the user's IP Address, Country, and City using public Geo APIs.
   - It captures the `navigator.userAgent` (browser information).
   - It saves this payload to the `clicks` table in Supabase and asynchronously increments the total click count on the `urls` table.
5. **Redirection:** Finally, the app runs `window.location.href = original_url`, bouncing the user to their final destination.

## 5. Security & Data Protection (RLS)

PostgreSQL features **Row Level Security (RLS)** which acts as a bouncer at the database level.
- Even if a malicious user inspects the network tab and finds the Supabase Anon Key, they **cannot** delete or modify another user's links. The database physically rejects queries where `auth.uid() != user_id`.
- The `security_updates.sql` script ensures that an unauthenticated user can *only* trigger `INSERT` statements into the `clicks` table and *never* alter a URL's destination.

## 6. Profile & Data Management

- **Account Security:** Updating a password requires cryptographic verification of the current password via `signInWithPassword(email, oldPassword)` before completing the update.
- **Export Data:** The client-side application securely joins data from the `urls` and `clicks` tables matching the authenticated user's ID, packages it into a portable JSON blob, and triggers a localized browser download.
- **Account Deletion:** Users can permanently delete their accounts using a secure Postgres RPC (`delete_user_account()`). Because `auth.users` manages all primary keys, this cascades and instantly drops all associated links and analytics logs tied to that user.
