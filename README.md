# HRD App

Comprehensive HR Management System for multi-branch retail businesses.

## Features

- 🔐 Authentication & Role-Based Access Control
- 👥 Employee Management
- 📍 Branch Management with Geolocation
- ⏰ Attendance Tracking (GPS/Fingerprint)
- 📅 Shift Scheduling
- 💰 Payroll Management
- 🏖️ Leave Management (including dynamic monthly quotas)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **UI**: Tailwind CSS + Shadcn/UI
- **Auth**: NextAuth.js v5

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/hrd_app?schema=public"
   ```

4. Push database schema:
   ```bash
   npx prisma db push
   ```

5. Seed the database:
   ```bash
   npx tsx prisma/seed.ts
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

## Default Credentials

- Email: `admin@tokoku.com`
- Password: `admin123`

## License

MIT
