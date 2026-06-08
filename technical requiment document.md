# AlbumFlow Technical Stack Document

Version: 1.0 (MVP)

---

# 1. Architecture Overview

AlbumFlow follows a hybrid architecture:

Desktop Application (Electron)

↓

Backend API Server

↓

Database + AWS Storage

↓

Google Drive Integration

↓

Client Web Gallery

The desktop application is used by photographers, while clients access galleries through a browser on mobile or desktop.

---

# 2. High-Level System Architecture

Photographer Desktop App (Electron)

↓

React Frontend

↓

Node.js API

↓

PostgreSQL Database

↓

AWS S3 Temporary Storage

↓

Google Drive API

↓

Client Web Gallery

---

# 3. Frontend Stack

## Photographer Dashboard

Framework:

* React.js

Language:

* TypeScript

UI Framework:

* Tailwind CSS

State Management:

* Zustand

Data Fetching:

* TanStack Query

Forms:

* React Hook Form

Validation:

* Zod

Notifications:

* Sonner

Icons:

* Lucide React

Charts:

* Recharts

---

# 4. Desktop Application

Framework:

* Electron

Purpose:

* Windows Software Installation
* Desktop Icon
* Native File Upload Access

Deliverables:

Windows:

* .exe Installer

Future:

* macOS
* Linux

Capabilities:

* Drag and Drop Upload
* Background Uploading
* Auto Updates
* Native File Access

---

# 5. Client Gallery Frontend

Framework:

* React.js

Styling:

* Tailwind CSS

Deployment:

* Vercel

Requirements:

* Mobile First Design
* Fast Image Loading
* Lazy Loading
* Infinite Scroll

Supported Devices:

* Android
* iPhone
* Tablet
* Desktop Browser

---

# 6. Backend

Runtime:

* Node.js

Framework:

* Express.js

Language:

* TypeScript

Purpose:

* Authentication
* Upload Management
* Collection Management
* Selection Processing
* Google Drive Export
* Licensing Validation

API Type:

REST API

Example Endpoints:

POST /login

POST /collections

POST /upload

GET /gallery/:id

POST /selection

POST /confirm-selection

POST /export-drive

---

# 7. Database

Database:

* PostgreSQL

Hosting:

* AWS RDS

ORM:

* Prisma

Tables:

Users

Collections

Photos

Selections

GoogleDriveConnections

Licenses

WatermarkSettings

Analytics

---

# 8. Cloud Storage

Provider:

* AWS S3

Purpose:

* Temporary Photo Storage

Folder Structure:

albumflow/

├── collection-id/

│ ├── originals/

│ ├── previews/

│ └── exports/

Storage Rules:

Original Photos:

* Temporary

Preview Photos:

* Temporary

Automatic Cleanup:

* 7 Days After Export

Unconfirmed Collections:

* 30 Days Auto Delete

---

# 9. Image Processing

Library:

* Sharp

Functions:

* Compression
* Resizing
* Watermarking
* Thumbnail Generation

Workflow:

Original Image

↓

Sharp Processing

↓

Preview Image

↓

AWS S3

Preview Specifications:

Width:

* 1600px

Quality:

* 70%

Watermark:

* Enabled

---

# 10. Authentication

Method:

* JWT

Password Encryption:

* bcrypt

Login Flow:

User Login

↓

Backend Validation

↓

JWT Token

↓

Authenticated Session

Token Expiry:

* 7 Days

---

# 11. Licensing System (Phase 1)

Provider:

* Google Apps Script

Database:

* Google Sheets

Stored Fields:

User ID

Email

Plan

Status

Expiry Date

License Key

Validation Flow:

Electron App

↓

API Request

↓

Apps Script

↓

Google Sheet Check

↓

Active / Expired Response

Future Upgrade:

Firebase Authentication

Firestore Database

---

# 12. Google Drive Integration

Authentication:

* Google OAuth 2.0

API:

* Google Drive API

Capabilities:

* Connect Account
* Create Folder
* Upload Selected Images
* Verify Upload

Folder Example:

AlbumFlow Exports

└── Arun Wedding

```
  ├── IMG001.jpg

  ├── IMG002.jpg

  ├── IMG003.jpg
```

---

# 13. Watermark System

Storage:

Studio Logo

Studio Name

Settings

Watermark Types:

Text

Logo

Combined

Processing Tool:

Sharp

Supported Positions:

Top Left

Top Right

Center

Bottom Left

Bottom Right

Opacity:

10%-50%

---

# 14. Notifications

Provider:

* Resend

Purpose:

* Welcome Email
* Collection Ready
* Selection Confirmed
* Export Completed

Future:

WhatsApp Integration

SMS Integration

---

# 15. Analytics

Tracking:

Collections Created

Photos Uploaded

Photos Selected

Client Activity

Storage Usage

Dashboard Library:

Recharts

---

# 16. Security

Authentication:

* JWT

Password Hashing:

* bcrypt

HTTPS:

* Enabled

Database Access:

* Restricted

AWS Access:

* IAM Roles

Google Tokens:

* Encrypted

Signed URLs:

* Enabled

Rate Limiting:

* Enabled

CORS:

* Configured

---

# 17. Deployment

Frontend:

Vercel

Backend:

AWS EC2

Database:

AWS RDS PostgreSQL

Storage:

AWS S3

Monitoring:

Better Stack

Error Tracking:

Sentry

---

# 18. DevOps

Version Control:

* Git

Repository:

* GitHub

CI/CD:

* GitHub Actions

Environment Management:

* .env

Deployment Flow:

GitHub Push

↓

GitHub Actions

↓

Build

↓

Deploy

---

# 19. Recommended AWS Services

AWS S3

* Photo Storage

AWS RDS

* PostgreSQL Database

AWS EC2

* Backend Hosting

AWS CloudFront

* Fast Image Delivery

AWS Secrets Manager

* Store API Keys

AWS CloudWatch

* Monitoring

---



# Final MVP Stack

Frontend:

* React
* TypeScript
* Tailwind

Desktop:

* Electron

Backend:

* Node.js
* Express
* TypeScript

Database:

* PostgreSQL
* Prisma

Storage:

* AWS S3

Image Processing:

* Sharp

Authentication:

* JWT

Licensing:

* Google Apps Script + Google Sheets

Drive Export:

* Google Drive API

Hosting:

* AWS + Vercel

Monitoring:

* Sentry + Better Stack
