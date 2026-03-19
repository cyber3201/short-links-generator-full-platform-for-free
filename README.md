<div align="center">
  <img src="https://i.ibb.co/rGZzYLJV/9-SIR-LOGO.png" alt="9-SIR Logo" height="150" />
</div>

<h1 align="center">9-SIR Premium URL Shortener</h1>

<p align="center">
  <strong>A modern, secure, and beautiful URL shortener tailored for businesses, marketing agencies, and professionals.</strong>
</p>

## 🌟 What is this?
9-SIR is a full-stack, customizable URL shortener designed to give you complete control over your links. Unlike generic link shorteners, this platform was built with **data privacy, aesthetic excellence, and deep analytics** in mind.

It enables you to create short links, lock them behind passwords, and beautifully track exactly who clicked them—all natively hosted on your own domain with your own database.

## 🎯 Who is it for?
- **Marketing Agencies:** Brand your links securely, track the performance of ad campaigns, and analyze deep geopolitical and device usage analytics.
- **Enterprise Businesses:** Protect sensitive documents behind password-secured shorter URLs, ensuring internal links stay internal.
- **Independent Creators & Developers:** Maintain ownership over your click data and link history without a monthly subscription to third-party providers.

## ✨ Key Features
- **OTP Email Authentication:** Secure email verification (no more forgotten passwords, just one-time passcodes).
- **Password-Protected Links:** Lock any link behind a custom password.
- **Deep Analytics Dashboard:** Track clicks over time (24h graphs), IP addresses, Geo-Locations (Top Country/City), and exact Device models (iOS, Android, Windows, Mac).
- **Dark-Mode Native UI:** A gorgeous, Glassmorphism-inspired UI with Framer Motion animations.
- **Role-Based Security:** Fully secured using Supabase Row Level Security (RLS). You own your data, and nobody else can edit it.

## 🚀 How to Use It?

We've prepared two detailed guides to help you understand and deploy this project for your own business:

1. **[Setup & Deployment Guide](SETUP.md):** 
   Learn how to clone this repository, change the branding (logos/colors) to fit your business, link it to your own Supabase database, and deploy it live to a custom domain for free using Netlify.
   
2. **[Architecture & How It Works](ARCHITECTURE.md):** 
   A deep dive into the code! Learn exactly how React works with Supabase, how passwords are hashed securely, how tracking is recorded, and how the magic of the short link redirection operates behind the scenes.

## 🛠️ Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts
- **Backend & Auth:** Supabase (PostgreSQL), RPC edge functions
- **APIs:** GeoJS for IP tracking

---
*Built to be fast, secure, and uniquely yours.*
