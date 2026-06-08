# AlbumFlow Backend Schema Requirements Document

Version: 1.0 MVP

Database:
PostgreSQL

ORM:
Prisma

---

# Database Overview

Core Entities

Users
│
├── Branding Settings
├── Google Drive Connections
├── Collections
│
├── Photos
│
├── Selections
│
└── Export Jobs
│
└── Analytics

---

# 1. USERS TABLE

Purpose:
Stores photographer accounts.

Table Name:
users

Fields

id UUID PK

email VARCHAR(255) UNIQUE

password_hash TEXT

full_name VARCHAR(255)

phone VARCHAR(30)

studio_name VARCHAR(255)

website VARCHAR(255)

license_key VARCHAR(255)

license_status ENUM

plan ENUM

is_active BOOLEAN

last_login TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP

---

License Status

ACTIVE

TRIAL

EXPIRED

SUSPENDED

---

Plan Types

STARTER

PRO

STUDIO

LIFETIME

---

# 2. BRANDING_SETTINGS TABLE

Purpose:
Stores studio branding settings.

Table Name:
branding_settings

Fields

id UUID PK

user_id UUID FK

logo_url TEXT

watermark_type ENUM

watermark_text VARCHAR(255)

watermark_position ENUM

watermark_opacity INTEGER

show_phone BOOLEAN

show_website BOOLEAN

created_at TIMESTAMP

updated_at TIMESTAMP

---

Watermark Types

TEXT

LOGO

COMBINED

---

Watermark Positions

TOP_LEFT

TOP_RIGHT

CENTER

BOTTOM_LEFT

BOTTOM_RIGHT

---

# 3. GOOGLE_DRIVE_CONNECTIONS TABLE

Purpose:
Stores Google Drive integration.

Table Name:
google_drive_connections

Fields

id UUID PK

user_id UUID FK

google_email VARCHAR(255)

google_account_id VARCHAR(255)

refresh_token TEXT

access_token TEXT

folder_root_id VARCHAR(255)

is_connected BOOLEAN

last_sync TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP

---

# 4. COLLECTIONS TABLE

Purpose:
Stores events and client galleries.

Table Name:
collections

Fields

id UUID PK

user_id UUID FK

collection_name VARCHAR(255)

client_name VARCHAR(255)

event_type VARCHAR(255)

event_date DATE

collection_slug VARCHAR(255)

client_access_token VARCHAR(255)

status ENUM

total_photos INTEGER

selected_photos INTEGER

upload_completed BOOLEAN

confirmed_at TIMESTAMP

expires_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP

---

Collection Status

UPLOADING

PROCESSING

READY

AWAITING_CLIENT

CLIENT_VIEWING

CONFIRMED

EXPORTED

ARCHIVED

DELETED

---

# 5. PHOTOS TABLE

Purpose:
Stores metadata only.

Do NOT store image binaries.

Store images in Cloudflare R2 or AWS S3.

Table Name:
photos

Fields

id UUID PK

collection_id UUID FK

original_filename VARCHAR(255)

file_size BIGINT

file_type VARCHAR(50)

s3_original_key TEXT

s3_preview_key TEXT

width INTEGER

height INTEGER

checksum VARCHAR(255)

upload_status ENUM

created_at TIMESTAMP

updated_at TIMESTAMP

---

Upload Status

UPLOADING

PROCESSING

READY

FAILED

---

# 6. PHOTO_SELECTIONS TABLE

Purpose:
Tracks selected photos.

Table Name:
photo_selections

Fields

id UUID PK

collection_id UUID FK

photo_id UUID FK

selected BOOLEAN

selected_at TIMESTAMP

client_session_id VARCHAR(255)

created_at TIMESTAMP

---

Important:

Never update photos table for selections.

Use separate selection records.

This scales better.

---

# 7. CLIENT_SESSIONS TABLE

Purpose:
Tracks client activity.

Table Name:
client_sessions

Fields

id UUID PK

collection_id UUID FK

session_token VARCHAR(255)

device_type VARCHAR(50)

browser VARCHAR(100)

ip_address VARCHAR(255)

started_at TIMESTAMP

last_activity TIMESTAMP

is_confirmed BOOLEAN

---

# 8. EXPORT_JOBS TABLE

Purpose:
Tracks Google Drive exports.

Table Name:
export_jobs

Fields

id UUID PK

collection_id UUID FK

user_id UUID FK

status ENUM

total_files INTEGER

completed_files INTEGER

google_folder_id VARCHAR(255)

started_at TIMESTAMP

completed_at TIMESTAMP

error_message TEXT

created_at TIMESTAMP

---

Export Status

PENDING

PROCESSING

SUCCESS

FAILED

---

# 9. LICENSES TABLE

Purpose:
Stores licensing information.

Table Name:
licenses

Fields

id UUID PK

user_id UUID FK

license_key VARCHAR(255)

plan ENUM

start_date DATE

expiry_date DATE

status ENUM

created_at TIMESTAMP

updated_at TIMESTAMP

---

# 10. ANALYTICS TABLE

Purpose:
Stores usage metrics.

Table Name:
analytics

Fields

id UUID PK

user_id UUID FK

total_collections INTEGER

total_uploads BIGINT

total_selected BIGINT

total_storage_used BIGINT

last_calculated TIMESTAMP

created_at TIMESTAMP

---

# 11. ACTIVITY_LOGS TABLE

Purpose:
Audit trail.

Table Name:
activity_logs

Fields

id UUID PK

user_id UUID FK

collection_id UUID FK

action VARCHAR(255)

description TEXT

ip_address VARCHAR(255)

created_at TIMESTAMP

---

Examples

COLLECTION_CREATED

PHOTOS_UPLOADED

CLIENT_CONFIRMED

EXPORT_STARTED

EXPORT_COMPLETED

COLLECTION_DELETED

---

# Storage Architecture

Database

Stores:

Users

Collections

Photo Metadata

Selections

Analytics

Activity Logs

---

Cloud Storage

Stores:

Original Photos

Preview Photos

Temporary Exports

---

Google Drive

Stores:

Final Selected Photos

Only

---

# Indexing Requirements

Create Indexes On

users.email

collections.user_id

collections.status

photos.collection_id

photo_selections.photo_id

photo_selections.collection_id

export_jobs.collection_id

activity_logs.user_id

---

# Estimated Scale

Per Photographer

Collections:
500+

Photos:
1,000,000+

Selections:
500,000+

Supported Without Schema Changes

---

# Data Retention Rules

Original Photos

Delete:
7 Days After Successful Export

Preview Photos

Delete:
7 Days After Successful Export

Unconfirmed Collections

Delete:
30 Days After Creation

Logs

Retain:
365 Days

Analytics

Retain:
Permanent

---

# Future Tables (Phase 2)

face_groups

duplicate_detection

ai_recommendations

album_layouts

team_members

roles_permissions

notifications

payments

subscriptions
