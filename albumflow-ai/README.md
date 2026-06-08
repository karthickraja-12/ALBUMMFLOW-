# AlbumFlow AI

> Upload Once. Let Clients Shortlist. Get Album-Ready Photos Automatically.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop | Electron |
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Storage | AWS S3 (temp) → Google Drive (final) |
| Image Processing | Sharp |
| Auth | JWT + bcrypt |

## Project Structure

```
albumflow-ai/
├── packages/
│   ├── backend/     # Node.js Express API
│   ├── web/         # React Vite frontend
│   └── desktop/     # Electron shell
└── package.json     # Monorepo root
```

## Quick Start

### 1. Install Dependencies

```bash
cd packages/backend
npm install

cd ../web
npm install
```

### 2. Setup Database

```bash
cd packages/backend
# Copy .env.example to .env and fill credentials
cp .env.example .env

# Push schema to PostgreSQL
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 3. Run Development

```bash
# Terminal 1 — Backend
cd packages/backend
npm run dev

# Terminal 2 — Web App
cd packages/web
npm run dev
```

Open: http://localhost:5173

## Environment Variables

See `packages/backend/.env.example` for all required variables.

## API Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/login | ❌ | Login |
| POST | /api/auth/register | ❌ | Register |
| GET | /api/auth/me | ✅ | Current user |
| GET | /api/collections | ✅ | List collections |
| POST | /api/collections | ✅ | Create collection |
| GET | /api/collections/:id | ✅ | Collection detail |
| DELETE | /api/collections/:id | ✅ | Delete collection |
| POST | /api/upload/presign | ✅ | Get S3 upload URL |
| POST | /api/upload/complete | ✅ | Confirm upload |
| POST | /api/upload/finalize/:id | ✅ | Finalize batch |
| GET | /api/gallery/:token | ❌ | Public gallery |
| POST | /api/gallery/:token/select | ❌ | Select photo |
| POST | /api/gallery/:token/confirm | ❌ | Confirm selection |
| GET | /api/branding | ✅ | Get branding |
| PUT | /api/branding | ✅ | Update branding |
| GET | /api/drive/status | ✅ | Drive status |
| GET | /api/drive/connect | ✅ | OAuth URL |
| POST | /api/drive/disconnect | ✅ | Disconnect Drive |
| POST | /api/drive/export/:id | ✅ | Export to Drive |
| GET | /api/analytics | ✅ | Analytics data |
| POST | /api/license/validate | ✅ | Validate key |

## Database Schema

11 tables: users, branding_settings, google_drive_connections, collections, photos, photo_selections, client_sessions, export_jobs, licenses, analytics, activity_logs

## License

Proprietary — AlbumFlow AI © 2024
