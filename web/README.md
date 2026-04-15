# Camp Tracker Web App

Next.js web app for the LU Young Men Camp project.

## Setup

1. Copy env template:

   ```bash
   cp .env.example .env.local
   ```

2. Set these values in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Install dependencies:

   ```bash
   npm install
   ```

4. Run local server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Current features

- Supabase email/password login
- Role-aware dashboard using RLS
- Ward roster + latest registration status table
- Shirt-size visibility for follow-up

## Commands

- `npm run dev` - start development server
- `npm run lint` - run ESLint
- `npm run build` - production build
