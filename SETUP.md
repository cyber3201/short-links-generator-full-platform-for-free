# 🚀 Setup & Business Adaptation Guide

This guide explains how to take this project, customize it for your own brand, link it to your own database, and deploy it to a live custom domain.

## 1. Customizing the Brand

Before deploying, you'll want to change the branding to match your business:

- **Logo Image:** 
  - Locate `App.tsx` and `animated-characters-login-page.tsx`.
  - Search for the `<img src="https://i.ibb.co/rGZzYLJV/9-SIR-LOGO.png" .../>` tags.
  - Replace the `src` URL with a link to your own company's logo.
  
- **Brand Colors:**
  - Open `src/index.css`.
  - Modify the `--primary` HSL variable to match your brand's primary hex/hsl color. By default, it is set to a vibrant brand color `#F14F44`.
  
- **Website Title & Favicon:**
  - Open `index.html` in the root directory.
  - Change `<title>9-SIR | Premium URL Shortener</title>` to your own business name.
  - Replace the `<link rel="icon" .../>` href with your own favicon file.

## 2. Setting Up the Database (Supabase)

This project uses [Supabase](https://supabase.com) as its backend database and authentication provider. 

1. **Create a Project:** Go to Supabase and create a new project.
2. **Run SQL Migrations:** 
   - Go to the **SQL Editor** in your Supabase dashboard.
   - Copy the contents of `database.sql` and run it. This creates the `urls` and `clicks` tables, along with some essential functions.
   - Next, copy the contents of `security_updates.sql` and run it. This hardens the Row Level Security (RLS) to ensure unauthorized users cannot edit your database.
3. **Configure Authentication (OTP):**
   - Go to **Authentication > Providers** and ensure Email is enabled.
   - Enable **Confirm Email** and **Secure Email Change**.
   - Go to **Authentication > Email Templates**. In your "Signup" and "Reset Password" templates, ensure you include the OTP token. Since the UI asks for an 8-digit OTP, your signup email should look something like: `Here is your verification code: {{ .Token }}`. 
4. **Get API Keys:**
   - Go to **Project Settings > API**.
   - Copy the **Project URL** and the **anon** public key.

## 3. Linking the Code to Supabase

1. In the root of your project, create a file named `.env`.
2. Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```
3. Test locally by running `npm run dev`.

## 4. Deploying to Netlify (With Custom Domain)

1. **Push to GitHub:** Commit all your changes and push the repository to your own GitHub account.
2. **Connect to Netlify:**
   - Go to [Netlify](https://www.netlify.com/) and create a new site from GitHub.
   - Select your repository.
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
3. **Set Environment Variables in Netlify:**
   - Before deploying, go to Site Settings > Environment Variables in Netlify.
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the exact same values you used in step 3.
4. **Deploy Site:** Click Deploy!
5. **Add Custom Domain:**
   - Go to Site Settings > Domain Management.
   - Click "Add custom domain" (e.g., `link.yourbusiness.com`).
   - Follow Netlify's instructions to add CNAME/A records to your DNS provider (like GoDaddy, Namecheap, or Cloudflare). Netlify will automatically provide you with a free SSL Certificate.

**You're all set! Your premium URL shortener is live.**
