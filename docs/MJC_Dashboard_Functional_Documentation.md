# Madera Jet Center — Office Dashboard
## Functional Documentation

**Version:** 1.0  
**Date:** May 3, 2026  
**Project Codename:** MJC Dashboard  
**Location:** 4181 Aviation Drive, Madera, CA 93637 — Madera Municipal Airport (KMAE)

---

## 1. Project Overview

The MJC Dashboard is an internal informational display system for Madera Jet Center's office. It renders real-time and manually managed content on a wall-mounted TV (portrait orientation) driven by a Mini PC Stick (Pentium N4200, 4GB RAM, 64GB eMMC). An accompanying admin panel allows authorized personnel to manage content, configure the display, and control which views are visible.

### 1.1 Goals

- Provide at-a-glance visibility into flight schedules, HR announcements, and maintenance/parts status.
- Allow non-technical staff to manage dashboard content through an admin interface.
- Auto-refresh the TV display to reflect the latest data without manual intervention.
- Deploy as an internet-accessible application for remote administration.

### 1.2 Branding Reference

- **Source:** [maderajetcenter.com](https://www.maderajetcenter.com/)
- **Logo:** MJC logo (white text on dark background and dark text on light background variants exist on the website; extract for use)
- **Color palette:** To be extracted from the website — dark navy/blue tones, white, and accent colors as present on maderajetcenter.com.
- **Typography:** To match or complement the website's font choices.
- **Certifications to display (optional):** FAA Part 145 Repair Station, NBAA Member, Blackhawk Aero & Raisbeck Engineering Authorized Dealer.

---

## 2. Architecture

### 2.1 Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js | Dashboard display + Admin panel |
| Backend | Node.js (Express or similar) | REST API |
| Database | MongoDB | Stores HR notices, maintenance data, user accounts, dashboard settings |
| Auth | JWT | Simple token-based authentication |
| Hosting — Frontend | Vercel | |
| Hosting — Backend | AWS AppRunner | |
| Hosting — Database | MongoDB Atlas (or self-hosted on AWS) | TBD |

### 2.2 High-Level Diagram

```
┌─────────────────────────────────────────────────────┐
│                   INTERNET                          │
│                                                     │
│  ┌──────────────┐         ┌──────────────────────┐  │
│  │   Vercel      │         │   AWS AppRunner       │  │
│  │   (Next.js)   │◄───────►│   (Node.js API)       │  │
│  │               │  REST   │                       │  │
│  │  - TV Display │         │  - Auth (JWT)         │  │
│  │  - Admin Panel│         │  - Data endpoints     │  │
│  └──────┬───────┘         │  - .ics polling        │  │
│         │                  │  - Excel ingest        │  │
│         │                  └──────────┬────────────┘  │
│         │                             │               │
│         │                    ┌────────▼────────┐      │
│         │                    │   MongoDB        │      │
│         │                    │   (Atlas / AWS)  │      │
│         │                    └─────────────────┘      │
│         │                                             │
└─────────┼─────────────────────────────────────────────┘
          │
    ┌─────▼──────────────────┐
    │  Mini PC Stick          │
    │  (Pentium N4200)        │
    │  Running browser in     │
    │  fullscreen / kiosk     │
    │  Portrait orientation   │
    │  Loads TV Display URL   │
    └─────────────────────────┘
```

### 2.3 External Data Sources

| Source | Type | Ingestion Method |
|--------|------|-----------------|
| JetInsight Calendar | `.ics` feed (URL) | Backend polls every 10 minutes |
| HR Notices | Manual entry | Admin panel → API → MongoDB |
| Maintenance / Parts Dept | Excel upload OR future API | Admin uploads `.xlsx` daily; future: direct API integration TBD |

---

## 3. Data Sources — Detail

### 3.1 JetInsight Calendar

- **Feed URL:** `https://portal.jetinsight.com/schedule/fb217c59-38ab-4ae7-9b42-8f387a34cf15/58649a7e-58c3-44b3-bd97-63d4c9a62756.ics`
- **Data type:** iCalendar (.ics) standard format
- **Polling interval:** Every 10 minutes
- **Data extracted (initial scope):** Flight schedules (event summary, date/time, location/route, description/notes)
- **Note:** Scope of extracted fields may change later; design the parser to be flexible.

**Backend behavior:**
1. A scheduled job (cron or interval) fetches the `.ics` file every 10 minutes.
2. Parse events using an iCalendar library (e.g., `ical.js` or `node-ical`).
3. Store/update parsed events in MongoDB, keyed by event UID to avoid duplicates.
4. Expose parsed flight schedule data via a REST endpoint for the frontend.

### 3.2 HR Notices

- **Data type:** Rich text announcements (title, body, optional priority/category, publish date, expiry date)
- **Ingestion:** Manual entry through the Admin panel's content manager.
- **Storage:** MongoDB collection.

**Functionality:**
- Create, edit, delete, and reorder HR notices.
- Set an optional expiry date after which the notice automatically hides from the TV display.
- Mark notices with priority levels (e.g., normal, important, urgent) to control visual treatment on the dashboard.

### 3.3 Maintenance / Parts Department

- **Data type:** Ordering and delivery queue (parts on order, expected delivery dates, status, associated aircraft, etc.)
- **Ingestion (current):** Admin uploads an `.xlsx` file daily through the Admin panel. Backend parses and stores the data.
- **Ingestion (future):** Direct API integration if one becomes available — TBD.

**Backend behavior (Excel upload):**
1. Admin uploads `.xlsx` via Admin panel.
2. Backend parses the spreadsheet (e.g., using `xlsx` / SheetJS library).
3. Replaces the existing maintenance queue data in MongoDB with the newly parsed data (or merges — TBD based on the spreadsheet structure).
4. Expose via REST endpoint.

---

## 4. Application Modules

### 4.1 TV Dashboard (Public Display)

**URL:** e.g., `https://mjc-dashboard.vercel.app/display`  
**Rendered on:** Mini PC Stick in fullscreen/kiosk mode browser, portrait orientation TV.

#### 4.1.1 Layout

The display is portrait-oriented and divided into sections/panels for each data source. The layout, ordering, and visibility of panels are controlled via the Admin panel's dashboard configuration.

**Panels (initial set):**

1. **Flight Schedule Panel** — Shows upcoming flights from JetInsight. Displays event name, date/time, and relevant details. Sorted chronologically.
2. **HR Notices Panel** — Shows current (non-expired) HR announcements. Supports priority-based visual styling (e.g., urgent notices highlighted).
3. **Maintenance Queue Panel** — Shows parts ordering/delivery status. Displays part name, status, expected delivery, associated aircraft, etc.

#### 4.1.2 Refresh Behavior

- The TV display page auto-refreshes on a regular interval to pull the latest data from the backend.
- Suggested approach: Client-side polling every 1–2 minutes (or configurable via admin settings). Alternatively, use Server-Sent Events (SSE) or WebSockets for real-time push — TBD based on complexity tolerance.
- The page should handle refresh gracefully (no visible flicker or full-page reload — use in-place data updates).

#### 4.1.3 View Control

- The Admin panel controls which panels are visible and in what order on the TV display.
- Possible modes (configurable from admin):
  - **All panels visible simultaneously** (stacked vertically in portrait)
  - **Rotating/cycling view** — auto-cycles through panels on a timer
  - **Single panel focus** — admin selects which panel to show full-screen
- The active view mode and configuration are stored in MongoDB and fetched by the TV display on each refresh cycle.

#### 4.1.4 Branding

- MJC logo displayed (header or corner watermark).
- Color scheme consistent with maderajetcenter.com.
- Current date/time displayed prominently.
- Optional: Weather widget for KMAE airport — TBD.

### 4.2 Admin Panel

**URL:** e.g., `https://mjc-dashboard.vercel.app/admin`  
**Access:** JWT-authenticated login.

#### 4.2.1 Authentication

- Simple login page (username + password).
- On successful auth, backend returns a JWT token.
- Token stored client-side and sent with all subsequent API requests.
- Single admin account can create additional user accounts.

#### 4.2.2 User Management

- The primary admin can create new user accounts (username, password, optional display name).
- Simple flat user model — no role-based permissions in initial scope (all authenticated users have full admin access).
- Admin can delete or reset passwords for other users.

#### 4.2.3 HR Notices Management

- **List view:** All HR notices with title, status (active/expired), priority, created date.
- **Create:** Form with fields: title, body (rich text or markdown), priority (normal / important / urgent), publish date, expiry date (optional).
- **Edit:** Modify any existing notice.
- **Delete:** Remove a notice.
- **Reorder:** Drag-and-drop or manual ordering to control display sequence on the TV.

#### 4.2.4 Maintenance Data Management

- **Upload:** File upload input accepting `.xlsx` files.
- **Preview:** After upload, display a preview of parsed data before confirming import.
- **History:** Log of past uploads with timestamps and uploading user.
- **Manual override (optional/future):** Inline editing of maintenance queue entries directly in the admin panel.

#### 4.2.5 Dashboard Configuration

- **Panel visibility:** Toggle each panel on/off for the TV display.
- **Panel ordering:** Set the display order of panels.
- **View mode:** Select between simultaneous view, rotating/cycling view (with configurable cycle duration), or single-panel focus.
- **Refresh interval:** Configure how often the TV display polls for new data.
- **Preview:** A live preview or screenshot of the current TV display state.

#### 4.2.6 JetInsight Calendar Settings

- View last fetch timestamp and status (success/error).
- Manually trigger a re-fetch.
- View/edit the .ics feed URL (if it changes in the future).
- Toggle the flight schedule panel on/off independently of the main panel controls.

---

## 5. API Endpoints (Preliminary)

All endpoints are prefixed with `/api/v1`. Protected endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

### 5.1 Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Authenticate, returns JWT | No |
| POST | `/auth/users` | Create a new user account | Yes |
| GET | `/auth/users` | List all user accounts | Yes |
| DELETE | `/auth/users/:id` | Delete a user account | Yes |
| PUT | `/auth/users/:id/password` | Reset a user's password | Yes |

### 5.2 Flight Schedule

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/flights` | Get parsed flight schedule events | No* |
| POST | `/flights/refresh` | Manually trigger .ics re-fetch | Yes |
| GET | `/flights/status` | Get last fetch timestamp and status | Yes |
| PUT | `/flights/settings` | Update .ics URL, polling interval | Yes |

*\*The TV display needs unauthenticated access to data endpoints, or uses a long-lived display token — approach TBD.*

### 5.3 HR Notices

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/notices` | Get all active (non-expired) notices | No* |
| GET | `/notices/all` | Get all notices including expired | Yes |
| POST | `/notices` | Create a new notice | Yes |
| PUT | `/notices/:id` | Update a notice | Yes |
| DELETE | `/notices/:id` | Delete a notice | Yes |
| PUT | `/notices/order` | Update display ordering | Yes |

### 5.4 Maintenance Queue

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/maintenance` | Get current maintenance queue data | No* |
| POST | `/maintenance/upload` | Upload and parse .xlsx file | Yes |
| GET | `/maintenance/history` | Get upload history log | Yes |

### 5.5 Dashboard Config

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard/config` | Get current display configuration | No* |
| PUT | `/dashboard/config` | Update display configuration | Yes |

---

## 6. Database Schema (Preliminary)

### 6.1 Collections

**`users`**
```
{
  _id: ObjectId,
  username: String (unique),
  passwordHash: String,
  displayName: String,
  createdAt: Date,
  createdBy: ObjectId (ref: users)
}
```

**`notices`**
```
{
  _id: ObjectId,
  title: String,
  body: String,
  priority: String (enum: "normal", "important", "urgent"),
  publishDate: Date,
  expiryDate: Date | null,
  displayOrder: Number,
  createdBy: ObjectId (ref: users),
  createdAt: Date,
  updatedAt: Date
}
```

**`flights`**
```
{
  _id: ObjectId,
  uid: String (unique, from .ics event UID),
  summary: String,
  description: String | null,
  location: String | null,
  startDate: Date,
  endDate: Date,
  rawEvent: Object (full parsed iCal event for flexibility),
  fetchedAt: Date
}
```

**`maintenanceItems`**
```
{
  _id: ObjectId,
  partName: String,
  partNumber: String | null,
  aircraft: String | null,
  status: String,
  orderDate: Date | null,
  expectedDelivery: Date | null,
  notes: String | null,
  uploadId: ObjectId (ref: maintenanceUploads),
  createdAt: Date
}
```

**`maintenanceUploads`**
```
{
  _id: ObjectId,
  filename: String,
  uploadedBy: ObjectId (ref: users),
  uploadedAt: Date,
  itemCount: Number
}
```

**`dashboardConfig`**
```
{
  _id: ObjectId,
  panels: [
    {
      panelId: String (e.g., "flights", "notices", "maintenance"),
      visible: Boolean,
      displayOrder: Number
    }
  ],
  viewMode: String (enum: "simultaneous", "rotating", "single"),
  rotationIntervalSeconds: Number | null,
  singlePanelFocus: String | null (panelId),
  refreshIntervalSeconds: Number,
  updatedAt: Date,
  updatedBy: ObjectId (ref: users)
}
```

**`calendarSettings`**
```
{
  _id: ObjectId,
  icsUrl: String,
  pollingIntervalMinutes: Number,
  lastFetchAt: Date | null,
  lastFetchStatus: String (enum: "success", "error"),
  lastFetchError: String | null,
  updatedAt: Date
}
```

---

## 7. TV Display Hardware & Setup

### 7.1 Hardware

- **Device:** Mini PC Stick, Pentium N4200, 4GB RAM, 64GB eMMC
- **OS:** Windows 10/11 or lightweight Linux (TBD)
- **Display:** TV mounted in portrait orientation
- **Network:** Wi-Fi or Ethernet connection to the internet

### 7.2 Browser Kiosk Configuration

- The Mini PC runs a browser (e.g., Chrome/Chromium) in fullscreen kiosk mode.
- The browser opens the TV display URL on boot.
- Kiosk mode prevents user interaction (no address bar, no right-click).
- Auto-start on power-on; auto-recover on crash.
- Screen orientation set to portrait at OS or display level.

### 7.3 Performance Considerations

Given the limited hardware (4GB RAM, Atom-class CPU):
- Keep the TV display page lightweight — minimal JavaScript, no heavy frameworks on the display page if possible (consider a statically rendered or SSR page with simple polling).
- Avoid memory leaks from long-running JS (the page may run 24/7).
- Consider a full page reload on a long interval (e.g., every few hours) to clear accumulated memory.

---

## 8. Deployment

### 8.1 Frontend (Vercel)

- Next.js application deployed to Vercel.
- Environment variables for API base URL.
- Two main route groups:
  - `/display` — TV dashboard (public/unauthenticated or display-token-protected)
  - `/admin` — Admin panel (JWT-authenticated)

### 8.2 Backend (AWS AppRunner)

- Node.js API deployed to AWS AppRunner.
- Environment variables for MongoDB connection string, JWT secret, JetInsight .ics URL.
- AppRunner handles auto-scaling, HTTPS termination.
- Scheduled job for .ics polling runs within the Node.js process (e.g., `node-cron`).

### 8.3 Database (MongoDB)

- MongoDB Atlas (managed) or self-hosted on AWS — TBD.
- Single database, collections as defined in Section 6.

### 8.4 CORS

- Backend must allow requests from the Vercel frontend domain.
- Consider allowing the Mini PC's IP or a wildcard for the display endpoint if needed.

---

## 9. Security Considerations

- JWT tokens should have a reasonable expiry (e.g., 24 hours) with refresh mechanism.
- Passwords stored as bcrypt hashes.
- The `.ics` feed URL contains embedded credentials/tokens — store securely in environment variables, not in client-side code.
- Admin panel protected behind login; TV display endpoints may be unauthenticated but should not expose sensitive data.
- HTTPS enforced on all endpoints (handled by Vercel and AppRunner).
- Rate limiting on auth endpoints to prevent brute-force attacks.

---

## 10. Open Questions & Decisions Needed

| # | Question | Status |
|---|----------|--------|
| 1 | TV display resolution and exact model? | TBD |
| 2 | Maintenance Excel: what are the column names/structure? Need a sample file to define the parser. | In progress |
| 3 | Maintenance: API integration possibility — any vendor/system details? | TBD |
| 4 | Should the TV display endpoints be fully public, or protected with a display-specific long-lived token? | TBD |
| 5 | MongoDB hosting decision: Atlas vs self-hosted on AWS? | TBD |
| 6 | Mini PC OS choice: Windows or Linux? Affects kiosk setup instructions. | TBD |
| 7 | JetInsight calendar: which specific event fields to display beyond summary and date/time? | TBD — start with summary, start/end time, location, description |
| 8 | Branding: extract exact color hex codes and fonts from maderajetcenter.com or receive brand guide? | TBD |
| 9 | Future data sources beyond the initial 3? | TBD |
| 10 | Real-time push (SSE/WebSocket) vs polling for TV display? | TBD — start with polling for simplicity |
| 11 | Rich text editor for HR notices (e.g., TipTap, Slate) or plain markdown? | TBD |

---

## 11. Milestones (Suggested)

| Phase | Scope | Description |
|-------|-------|-------------|
| 1 | Foundation | Project scaffolding, auth system, user management, database setup, deployment pipeline |
| 2 | HR Notices | Admin CRUD for notices, TV display panel for notices |
| 3 | JetInsight Integration | .ics polling, parsing, storage, TV display panel for flights |
| 4 | Maintenance Queue | Excel upload, parsing, storage, TV display panel for maintenance |
| 5 | Dashboard Config | Admin controls for panel visibility, ordering, view modes, refresh interval |
| 6 | Polish & Deploy | Branding, responsive portrait layout, kiosk setup, performance optimization, production deployment |

---

*This is a living document. Update as decisions are made and requirements evolve.*
