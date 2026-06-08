# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# AlbumFlow AI

Version: 1.0 MVP

Tagline:
Upload Once. Let Clients Shortlist. Get Album-Ready Photos Automatically.

---

# 1. Product Overview

AlbumFlow AI is a desktop and web-based platform designed for photographers to simplify the photo shortlisting process.

Instead of sharing pen drives, Google Drive folders, or WhatsApp screenshots, photographers upload event photos to AlbumFlow AI. A client gallery link is automatically generated and shared with the client.

Clients can browse compressed preview images on their mobile phones, select the photos they want in their album, and confirm their selection.

After confirmation, only the selected original-quality photos are automatically transferred to the photographer's Google Drive, while all temporary files are removed from cloud storage.

---

# 2. Problem Statement

Current Process:

1. Photographer captures event photos.
2. Photos are copied to a pen drive or uploaded to Google Drive.
3. Client manually reviews thousands of photos.
4. Client communicates selections through WhatsApp or calls.
5. Photographer manually searches and copies selected images.

Problems:

* Time consuming
* Repetitive manual work
* Client confusion
* Risk of missing photos
* Difficult to manage large weddings and events

AlbumFlow AI automates this workflow.

---

# 3. Target Users

Primary Users:

* Wedding Photographers
* Event Photographers
* Studio Owners
* Photography Teams

Secondary Users:

* Wedding Clients
* Families
* Event Organizers

---

# 4. Product Goals

Business Goals:

* Reduce photo shortlisting effort by 90%
* Build a subscription-based software business
* Serve photographers with minimal technical setup

User Goals:

* Upload photos quickly
* Share one gallery link
* Receive finalized selections automatically
* Eliminate manual sorting

---

# 5. User Roles

## Photographer

Can:

* Login
* Manage account
* Connect Google Drive
* Create collections
* Upload photos
* Generate client links
* View collection status
* Manage branding

## Client

Can:

* Open gallery link
* View preview images
* Select photos
* Deselect photos
* Confirm final selection

---

# 6. Core Workflow

Photographer Login

↓

Create Collection

↓

Upload Photos

↓

System Creates Preview Images

↓

Generate Client Link

↓

Client Opens Gallery

↓

Client Selects Photos

↓

Client Confirms Selection

↓

Selected Originals Exported To Google Drive

↓

Temporary Files Deleted

---

# 7. Authentication & Licensing

Login Fields:

* Email
* Password

License Validation:

* Active
* Trial
* Expired
* Suspended

Phase 1 Licensing System:

Google Apps Script + Google Sheets

Stored Information:

* User ID
* Email
* Plan
* License Status
* Expiry Date

---

# 8. Photographer Admin Portal

Every licensed user receives an Admin Portal.

---

## Dashboard

Displays:

* Total Collections
* Pending Collections
* Completed Collections
* Photos Uploaded
* Photos Selected
* Google Drive Status
* License Status
* Account Expiry

---

## Studio Branding

Fields:

* Studio Name
* Studio Logo
* Contact Number
* Website URL
* Social Media Links

Supported Logo Formats:

* PNG
* JPG
* SVG

Maximum Size:

5 MB

---

## Watermark Settings

Photographers can configure watermarking on preview images.

Options:

### Text Watermark

Uses Studio Name

### Logo Watermark

Uses Studio Logo

### Combined Watermark

Studio Logo + Studio Name

Position Options:

* Center
* Top Left
* Top Right
* Bottom Left
* Bottom Right

Opacity:

* 10%
* 20%
* 30%
* 40%
* 50%

Default:

Bottom Right
30% Opacity

---

## Google Drive Integration

Connect Google Drive through OAuth.

Flow:

1. Connect Google Drive
2. Login to Google
3. Grant Permission
4. Save Connection

Stored Securely:

* Access Token
* Refresh Token

---

## Export Settings

Choose Export Folder

Example:

AlbumFlow Exports

Folder Structure:

AlbumFlow Exports

└── Arun Wedding

└── Priya Reception

└── Reception Event

Naming Options:

* Collection Name
* Client Name
* Event Date + Collection Name

---

## License Information

Displays:

* Plan
* License Key
* Activation Date
* Expiry Date
* Account Status

---

# 9. Collection Management

Create Collection

Fields:

* Collection Name
* Client Name
* Event Type
* Event Date

Examples:

* Arun Wedding
* Priya Reception
* Birthday Celebration

Generated Automatically:

* Collection ID
* Client Link

---

# 10. Photo Upload System

Supported Formats:

* JPG
* JPEG
* PNG

Maximum:

10,000 Photos Per Collection

Upload Destination:

AWS S3 Temporary Storage

Storage Structure:

collection-id/

├── originals/

├── previews/

---

# 11. Preview Generation

For every uploaded image:

Original Image

↓

Compressed Preview

Example:

Original: 15 MB

Preview: 300 KB

Purpose:

* Faster loading
* Lower bandwidth
* Better client experience
* Theft prevention

Watermark automatically applied.

---

# 12. Client Gallery

Client opens gallery using shared link.

Functions:

* Mobile Friendly Layout
* Grid View
* Zoom Preview
* Select Photo
* Deselect Photo
* Selected Count

---

# 13. Client Gallery Branding

Gallery Header Displays:

* Studio Logo
* Studio Name
* Contact Number
* Website URL

Example:

[Studio Logo]

Dream Frames Studio

+91 9876543210

[www.dreamframes.com](http://www.dreamframes.com)

---

# 14. Selection Confirmation

Client clicks:

Confirm Selection

Warning:

"Selections cannot be modified after confirmation."

After Confirmation:

* Collection Locked
* Photographer Notified
* Export Process Triggered

---

# 15. Google Drive Export

System Automatically:

1. Creates Collection Folder
2. Transfers Selected Originals
3. Maintains Original Quality
4. Verifies Successful Upload

Example:

Google Drive

└── Arun Wedding Selected Photos

```
  ├── IMG001.jpg

  ├── IMG005.jpg

  ├── IMG020.jpg
```

---

# 16. Automatic Cleanup

After Successful Export:

Retention Period:

7 Days

Purpose:

Recovery Window

After 7 Days:

Delete:

* Original Photos
* Preview Images
* Temporary Files

Unconfirmed Collections:

Auto Delete After 30 Days

---

# 17. Collection Status Tracking

Status Types:

* Uploading
* Processing
* Ready
* Awaiting Client
* Client Viewing
* Selection Completed
* Exported
* Archived

---

# 18. Analytics

Displays:

* Total Collections
* Total Uploads
* Total Selected Photos
* Average Selection Percentage
* Monthly Activity

---

# 19. Security Requirements

* HTTPS
* JWT Authentication
* Password Hashing
* Signed URLs
* Role-Based Access
* Secure Google OAuth
* Temporary Cloud Storage
* Automatic Data Cleanup

---

# 20. Technical Architecture

Desktop Application:

Electron

Frontend:

React
Tailwind CSS

Backend:

Node.js
Express.js

Database:

PostgreSQL

Cloud Storage:

AWS S3

Authentication:

JWT

Licensing:

Google Apps Script
Google Sheets

Integrations:

Google Drive API

---

# 21. Custom Branding (Future Upgrade)

Custom Subdomain

Examples:

rkstudio.albumflow.ai

dreamframes.albumflow.ai

Benefits:

* Professional branding
* Improved trust
* Better client experience

---

# 22. Future AI Features (Phase 2)

* AI Face Grouping
* Duplicate Detection
* Blur Detection
* Best Photo Suggestions
* Album Layout Generator
* Lightroom Export
* Team Accounts
* Multi-Client Approval

---

# 23. MVP Success Metrics

First 6 Months

* 100 Paying Photographers
* 1,000 Collections Created
* 100,000+ Photos Processed
* 80% Client Completion Rate
* Less Than 48 Hours Average Selection Time

---

# 24. Out of Scope (MVP)

* Online Payment Gateway
* AI Photo Editing
* Video Management
* Permanent Cloud Storage
* Mobile Application

Focus:

Upload → Client Selection → Google Drive Export → Auto Cleanup
