# OUTR Hostel Food Frontend

React + TypeScript + Tailwind CSS web app for the OUTR Hostel Food Management System.

## Stack
- **React 18** + **TypeScript**
- **Tailwind CSS** (dark theme, custom design system)
- **React Router v6** (nested routes)
- **Zustand** (auth state)
- **Recharts** (pie charts on dashboard)
- **html5-qrcode** (camera QR scanner)
- **Axios** (API calls with JWT interceptors)
- **react-hot-toast** (notifications)

## Setup

```bash
npm install
cp .env.example .env
# Edit VITE_API_URL to point to your backend
npm run dev
```

## Routes

### Student (mobile-first)
- `/` — Landing (choose student or management)
- `/login/student` — Student login
- `/student` — Dashboard (today + tomorrow meals)
- `/student/calendar` — 7-day food preference calendar
- `/student/qr` — Live QR code for current meal

### Management (admin)
- `/login/management` — Admin login
- `/management` — Dashboard with veg/nonveg counts + not-eaten list
- `/management/scanner` — QR scanner (camera-based)
- `/management/students` — Student list + add/manage
- `/management/history` — Scan history with filters

## Key Features

### QR Scanner
- Uses device camera via `html5-qrcode`
- Auto-processes scans, shows ✅ green overlay for success
- Shows 🔴 red overlay for errors (duplicate scan, wrong hostel, etc.)
- Auto-resumes after 3 seconds
- Manual token fallback for devices without camera

### Food Calendar
- Shows next 7 days
- Toggle breakfast included/skipped
- Toggle lunch/dinner veg or nonveg
- Per-day save button (only appears when edited)
- Auto-fill indicator for days copied from previous day

### Dashboard
- Live refresh every 30 seconds (toggleable)
- Pie chart for lunch veg vs non-veg distribution
- Collapsible "not eaten yet" lists per meal
- Date picker to view any day's data
