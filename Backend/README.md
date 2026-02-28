# OUTR Hostel Food Management System - Backend

A production-ready Node.js + MongoDB backend for managing food preferences and QR-based meal serving for OUTR hostels (RHR, APJ, KHR, KCHR) — designed to handle 1400+ students.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (v18+) |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Caching | Redis (ioredis) |
| Auth | JWT (jsonwebtoken) |
| QR Code | `qrcode` + JWT signing |
| Logging | Winston |
| Security | Helmet, CORS, express-rate-limit |

---

## 🚀 Setup

```bash
# 1. Clone and install
npm install

# 2. Copy env file
cp .env.example .env
# Edit .env with your MongoDB URI, Redis URL, JWT secrets

# 3. Seed initial admin accounts
npm run seed

# 4. Start
npm run dev     # development with hot reload
npm start       # production
```

---

## 📁 Project Structure

```
src/
  config/       database.js, redis.js
  models/       Student, Management, FoodPreference, MealScan
  controllers/  studentAuth, managementAuth, foodPref, qr, dashboard, scan, studentMgmt
  middleware/   auth.js (JWT middleware)
  routes/       studentRoutes, managementRoutes
  utils/        logger, dateHelper (IST), qrHelper, prefService
scripts/
  seed.js       — creates initial admin accounts + demo student
```

---

## 📡 API Reference

### Student Endpoints (`/api/student`)

#### `POST /api/student/login`
```json
Request:  { "registrationNo": "22CS001", "password": "pass123" }
Response: { "success": true, "token": "eyJ...", "student": {...} }
```

#### `GET /api/student/profile`
> Auth: `Bearer <token>`

#### `GET /api/student/food/preference?date=YYYY-MM-DD`
Returns food preference for a date (defaults to tomorrow). Auto-fills from previous day if not set.

#### `PUT /api/student/food/preference`
```json
Request: {
  "date": "2024-02-15",
  "breakfast": { "selected": true },
  "lunch": { "selected": true, "type": "veg" },
  "dinner": { "selected": true, "type": "nonveg" }
}
```
> ⚠️ Only future dates allowed (must be set the day before)

#### `GET /api/student/food/calendar`
Returns 7-day food preference calendar (auto-fills missing dates).

#### `GET /api/student/qr`
Returns QR code for current active meal window.
```json
Response: {
  "success": true,
  "qr": {
    "image": "data:image/png;base64,...",   // display this
    "token": "eyJ...",                        // raw JWT
    "mealType": "lunch",
    "date": "2024-02-14",
    "expiresIn": 7200
  }
}
```
> Returns 400 if no active meal window right now.

---

### Management Endpoints (`/api/management`)

#### `POST /api/management/login`
```json
Request:  { "email": "admin.rhr@outr.ac.in", "password": "rhr@admin123" }
Response: { "success": true, "token": "eyJ...", "admin": {...} }
```

#### `GET /api/management/dashboard?date=YYYY-MM-DD`
Returns meal counts and not-eaten list for your hostel.
```json
Response: {
  "hostelName": "RHR",
  "date": "2024-02-14",
  "totalStudents": 350,
  "counts": {
    "breakfast": { "selected": 320, "notSelected": 30 },
    "lunch": { "veg": 200, "nonveg": 110, "notSelected": 40 },
    "dinner": { "veg": 180, "nonveg": 130, "notSelected": 40 }
  },
  "notEaten": {
    "breakfast": { "count": 45, "students": [...] },
    "lunch": { "count": 12, "students": [...] },
    "dinner": { "count": 0, "students": [] }
  }
}
```

#### `GET /api/management/students?page=1&limit=50&search=name`
Paginated student list for your hostel.

#### `POST /api/management/students`
Register a single student.

#### `POST /api/management/students/bulk`
Bulk import array of students.

#### `PATCH /api/management/students/:id`
Update student details.

#### `POST /api/management/students/:id/reset-password`

#### `POST /api/management/scan`
Scan a student's QR code → returns what food to serve.
```json
Request:  { "token": "eyJ..." }
Response: {
  "success": true,
  "message": "✅ LUNCH served",
  "student": { "name": "Ravi Kumar", "registrationNo": "22CS001", "badNo": "3321", "hostelName": "RHR" },
  "meal": { "type": "lunch", "foodType": "veg", "serveLabel": "🥦 Veg" }
}
```

#### `GET /api/management/scan/history?date=YYYY-MM-DD&mealType=lunch`
View scan history for auditing.

---

## 🍽️ Meal Windows (configurable via .env)

| Meal | Default Window |
|------|---------------|
| Breakfast | 7:00 AM – 10:00 AM |
| Lunch | 12:00 PM – 4:00 PM |
| Dinner | 7:00 PM – 10:00 PM |

---

## 🔒 Food Preference Logic

1. Student selects preference **the day before** (any time before midnight IST)
2. If no selection → **auto-copies from previous day**
3. If no previous day → uses student's **defaultFoodPref** (default: `veg`)
4. **Breakfast** = just selected/not selected (no veg/nonveg)
5. **Lunch & Dinner** = veg or nonveg

---

## ⚡ Performance for 1400+ Students

- MongoDB connection pool: 50 connections
- Redis cache: dashboard data (2 min TTL), per hostel+date key
- Indexed fields: registrationNo, hostelName, date, student+date (compound unique)
- Bulk preference auto-fill uses `insertMany` with `ordered:false`
- Paginated student queries (max 100/page)
- Response compression (gzip)
- Rate limiting: 100 req/min general, 500 req/min for scanner

---

## 🏠 Hostel Scoping

- Each management account is tied to ONE hostel (`hostelName` field)
- Admins can only see/scan students from their own hostel
- `super_admin` role can query any hostel via `?hostelName=RHR`

---

## 🗃️ Database Indexes

```
Student:        registrationNo (unique), hostelName+isActive
FoodPreference: student+date (unique), hostelName+date
MealScan:       student+date+mealType (unique), hostelName+date+mealType
```

---

## 📋 Default Admin Credentials (after seed)

| Email | Password | Hostel |
|-------|----------|--------|
| admin.rhr@outr.ac.in | rhr@admin123 | RHR |
| admin.apj@outr.ac.in | apj@admin123 | APJ |
| admin.khr@outr.ac.in | khr@admin123 | KHR |
| admin.kchr@outr.ac.in | kchr@admin123 | KCHR |
| superadmin@outr.ac.in | super@admin123 | All |

> ⚠️ **Change all passwords in production!**
