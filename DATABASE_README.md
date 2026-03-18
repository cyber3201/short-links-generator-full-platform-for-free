# Database Schema Details

This platform uses Supabase, a backend-as-a-service leveraging a PostgreSQL database. Below is a detailed breakdown of the tables and components used in the application based on the `database.sql` setup.

## 1. Tables

### `public.urls`
The core table responsible for storing the generated short links.
- **`id`**: (UUID) Primary key.
- **`user_id`**: (UUID) Foreign key referencing `auth.users(id)`. Determines if the link is owned by an authenticated user.
- **`original_url`**: (TEXT) The full, long URL that gets redirected to.
- **`short_code`**: (TEXT, UNIQUE) The unique hash/code generated for the URL.
- **`short_url`**: (TEXT) The fully reconstructed short format URL.
- **`created_at`**: (TIMESTAMP) The timestamp when the link was created.
- **`clicks`**: (INTEGER) The total number of times the short link has been clicked.
- **`top_location`**: (TEXT) The primary geographic location recorded for clicks.

### `public.clicks`
An analytics table used to track individual clicks on the short URLs.
- **`id`**: (UUID) Primary key.
- **`url_id`**: (UUID) Foreign key referencing `public.urls(id)` with cascading deletion.
- **`clicked_at`**: (TIMESTAMP) The exact timestamp of the click event.
- **`country`**: (TEXT) The country parsed from the user's connection.
- **`city`**: (TEXT) The city parsed from the user's connection.
- **`referrer`**: (TEXT) The referring website/application.
- **`user_agent`**: (TEXT) The browser/device information of the user accessing the link.

## 2. Row Level Security (RLS) Policies
The database restricts user operations using secure Postgres RLS policies:
- **URL Policies**:
  - Users can view only their own created URLs.
  - Anyone can execute an insert (if permitted) or view a short URL for redirection functionality.
  - Anyone can update clicks.
- **Click Policies**:
  - Only the owner of the target `url_id` can view the related rows in the `clicks` analytics table.
  - Anyone is permitted to insert new analytics rows into the `clicks` table when they visit a link.

## 3. Storage Setup
- **`avatars` Bucket**: A public Supabase storage bucket named `avatars` is mapped for storing user profile images. 
- **Storage Policies**: Set up such that anyone can download/view avatars, but only authenticated users are permitted to upload or alter them.
