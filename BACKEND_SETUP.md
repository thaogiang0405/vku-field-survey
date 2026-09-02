# Backend Server Setup

## Overview

The VKU Field Survey project includes a simple Express.js backend server for local development and testing. This server:

- ✅ Handles inspection data CRUD operations
- ✅ Persists data in memory (perfect for dev/demo)
- ✅ Provides REST API endpoints
- ✅ Implements CORS for cross-origin requests
- ✅ Runs on port 3000 by default

**Note**: The in-memory storage is reset when the server restarts. For production, replace with a real database (MongoDB, PostgreSQL, etc.).

---

## Quick Start

### 1. Install Dependencies

All dependencies are included in package.json. Just run:

```bash
npm install
```

### 2. Start the Server

```bash
npm run server
```

Expected output:
```
✅ Server running on http://localhost:3000
📍 API endpoint: http://localhost:3000/api
❤️  Health check: http://localhost:3000/api/health
```

### 3. Start Frontend + Backend (Parallel)

To run both the dev server and backend API simultaneously:

```bash
npm run dev:all
```

Or in separate terminals:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run server
```

---

## API Endpoints

### Health Check

```bash
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-09-01T10:30:00Z",
  "inspections": 0
}
```

### Create Inspection

```bash
POST /api/inspections
Content-Type: application/json

{
  "building": "Building A",
  "floor": 3,
  "room": "Room 301",
  "category": "Hardware",
  "rating": 4,
  "defectNotes": "Minor scratches",
  "photo": "base64_encoded_image",
  "latitude": 20.8282,
  "longitude": 106.6537,
  "timestamp": "2026-09-01T10:30:00Z"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "building": "Building A",
    "floor": 3,
    "room": "Room 301",
    "category": "Hardware",
    "rating": 4,
    "defectNotes": "Minor scratches",
    "photo": "base64_encoded_image",
    "latitude": 20.8282,
    "longitude": 106.6537,
    "timestamp": "2026-09-01T10:30:00Z",
    "status": "SYNCED",
    "createdAt": "2026-09-01T10:30:00Z",
    "updatedAt": "2026-09-01T10:30:00Z",
    "syncAttempts": 0
  },
  "message": "Inspection created successfully"
}
```

### Get All Inspections

```bash
GET /api/inspections
```

Response:
```json
{
  "success": true,
  "data": [
    { /* inspection object */ },
    { /* inspection object */ }
  ],
  "count": 2
}
```

### Get Single Inspection

```bash
GET /api/inspections/{id}
```

Response:
```json
{
  "success": true,
  "data": { /* inspection object */ }
}
```

### Update Inspection

```bash
PUT /api/inspections/{id}
Content-Type: application/json

{
  "rating": 5,
  "defectNotes": "Updated notes"
}
```

Response:
```json
{
  "success": true,
  "data": { /* updated inspection object */ }
}
```

### Delete Inspection

```bash
DELETE /api/inspections/{id}
```

Response:
```json
{
  "success": true,
  "data": { /* deleted inspection object */ }
}
```

### Clear All Inspections (Testing Only)

```bash
DELETE /api/inspections
```

Response:
```json
{
  "success": true,
  "message": "Cleared 5 inspections"
}
```

---

## Testing with cURL

### Test Health Check

```bash
curl http://localhost:3000/api/health
```

### Create Test Inspection

```bash
curl -X POST http://localhost:3000/api/inspections \
  -H "Content-Type: application/json" \
  -d '{
    "building": "Test Building",
    "floor": 1,
    "room": "101",
    "category": "Hardware",
    "rating": 3,
    "defectNotes": "Test inspection",
    "timestamp": "2026-09-01T10:30:00Z"
  }'
```

### Get All Inspections

```bash
curl http://localhost:3000/api/inspections
```

### Clear All (Testing)

```bash
curl -X DELETE http://localhost:3000/api/inspections
```

---

## Testing with Browser DevTools

1. Open http://localhost:5173 (frontend)
2. Open DevTools → Console tab
3. Create an inspection in the app
4. Check Network tab → see POST to localhost:3000/api/inspections
5. Response should show `"success": true` and status: "SYNCED"

---

## Environment Configuration

### Development (Default)

Frontend automatically connects to `http://localhost:3000/api`:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

### Production Deployment

To use a different backend server:

1. Create `.env` file:

```bash
VITE_API_BASE_URL=https://api.example.com
```

2. Rebuild:

```bash
npm run build
```

3. Deploy dist/ folder to hosting

---

## Production Deployment

For production, you should:

### Option 1: Use Backend as a Service

- Firebase Cloud Functions
- AWS Lambda + API Gateway
- Heroku
- Vercel serverless functions
- Netlify Functions

### Option 2: Self-Hosted Backend

- Node.js + Express on your server
- Add real database (MongoDB, PostgreSQL)
- Add authentication
- Add validation
- Add logging

Example production server.cjs with MongoDB:

```javascript
const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Create inspection schema
const inspectionSchema = new mongoose.Schema({
  building: String,
  floor: Number,
  room: String,
  category: String,
  rating: Number,
  defectNotes: String,
  photo: String,
  latitude: Number,
  longitude: Number,
  timestamp: Date,
  status: String,
  createdAt: Date,
  updatedAt: Date,
  syncAttempts: Number,
});

const Inspection = mongoose.model('Inspection', inspectionSchema);

// Use with your Express routes
app.post('/api/inspections', async (req, res) => {
  const inspection = new Inspection(req.body);
  await inspection.save();
  res.json({ success: true, data: inspection });
});

// ... other routes
```

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Kill process
taskkill /PID <pid> /F         # Windows
kill -9 <pid>                  # Mac/Linux

# Or use different port
PORT=3001 npm run server
```

### CORS Errors

The server has CORS enabled for all origins. If you still see CORS errors:

1. Check that frontend is on http://localhost:5173
2. Check that backend is on http://localhost:3000
3. Verify requests have `Content-Type: application/json` header

### JSON Parse Errors

Ensure your request body is valid JSON:

```bash
# ✅ CORRECT
curl -X POST http://localhost:3000/api/inspections \
  -H "Content-Type: application/json" \
  -d '{"building":"A","floor":1,"room":"101","category":"Hardware","rating":3}'

# ❌ WRONG (single quotes don't work)
curl -X POST http://localhost:3000/api/inspections \
  -H 'Content-Type: application/json' \
  -d '{"building":"A"}'
```

### Server Not Responding

Check:

1. Is server running? `npm run server`
2. Is it on port 3000? `netstat -ano | findstr :3000`
3. Can you access health check? `curl http://localhost:3000/api/health`
4. Is frontend trying to connect? Check browser console
5. Is API_BASE_URL correct in .env?

---

## Performance Notes

- In-memory storage: Fast for dev, not for production
- No database queries: Simple and instant
- No authentication: Add for production
- No validation: Add server-side validation
- No logging: Add structured logging

---

## Next Steps

1. ✅ Test backend with `npm run server`
2. ✅ Test sync in app (offline → create → online → sync)
3. ⚠️ For production, implement real database
4. ⚠️ Add authentication if needed
5. ⚠️ Add error handling and validation
6. ⚠️ Deploy to your infrastructure

---

**Backend Status**: ✅ WORKING & READY FOR TESTING
