/**
 * VKU Field Survey - Demo Backend API Server
 * Simple Express.js backend for local development and testing
 * 
 * Usage:
 *   node server.js
 * 
 * API runs at: http://localhost:3000/api
 * 
 * No external database needed - uses in-memory storage
 * Perfect for development and demonstrations
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
let inspections = [];

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    inspections: inspections.length,
  });
});

// Create inspection
app.post('/api/inspections', (req, res) => {
  try {
    const inspection = req.body;

    // Validate required fields
    if (!inspection.building || !inspection.room || !inspection.category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: building, room, category',
      });
    }

    // Add server-side data
    if (!inspection.id) {
      inspection.id = uuidv4();
    }
    inspection.createdAt = inspection.createdAt || new Date().toISOString();
    inspection.updatedAt = new Date().toISOString();
    inspection.status = 'SYNCED';

    // Store
    inspections.push(inspection);

    console.log(`[API] ✅ Created inspection: ${inspection.building} - ${inspection.room}`);
    console.log(`[API] 📊 Total inspections: ${inspections.length}`);

    // Return success
    res.status(201).json({
      success: true,
      data: inspection,
      message: 'Inspection created successfully',
    });
  } catch (error) {
    console.error('[API] ❌ Error creating inspection:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all inspections
app.get('/api/inspections', (req, res) => {
  try {
    // Sort by timestamp descending
    const sorted = [...inspections].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    console.log(`[API] 📖 Retrieved ${sorted.length} inspections`);

    res.json({
      success: true,
      data: sorted,
      count: sorted.length,
    });
  } catch (error) {
    console.error('[API] ❌ Error getting inspections:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get single inspection
app.get('/api/inspections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const inspection = inspections.find((i) => i.id === id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        error: `Inspection ${id} not found`,
      });
    }

    res.json({
      success: true,
      data: inspection,
    });
  } catch (error) {
    console.error('[API] ❌ Error getting inspection:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update inspection
app.put('/api/inspections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const index = inspections.findIndex((i) => i.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: `Inspection ${id} not found`,
      });
    }

    inspections[index] = {
      ...inspections[index],
      ...updates,
      id, // Don't allow ID change
      updatedAt: new Date().toISOString(),
    };

    console.log(`[API] ✏️  Updated inspection: ${id}`);

    res.json({
      success: true,
      data: inspections[index],
    });
  } catch (error) {
    console.error('[API] ❌ Error updating inspection:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete inspection
app.delete('/api/inspections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = inspections.findIndex((i) => i.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: `Inspection ${id} not found`,
      });
    }

    const deleted = inspections.splice(index, 1)[0];
    console.log(`[API] 🗑️  Deleted inspection: ${id}`);

    res.json({
      success: true,
      data: deleted,
    });
  } catch (error) {
    console.error('[API] ❌ Error deleting inspection:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Clear all (for testing)
app.delete('/api/inspections', (req, res) => {
  try {
    const count = inspections.length;
    inspections = [];
    console.log(`[API] 🧹 Cleared all ${count} inspections`);

    res.json({
      success: true,
      message: `Cleared ${count} inspections`,
    });
  } catch (error) {
    console.error('[API] ❌ Error clearing:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Not found: ${req.method} ${req.path}`,
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  VKU Field Survey - Backend API Server             ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health\n`);
  console.log('Available Endpoints:');
  console.log('  POST   /api/inspections          - Create inspection');
  console.log('  GET    /api/inspections          - Get all inspections');
  console.log('  GET    /api/inspections/:id      - Get single inspection');
  console.log('  PUT    /api/inspections/:id      - Update inspection');
  console.log('  DELETE /api/inspections/:id      - Delete inspection');
  console.log('  DELETE /api/inspections          - Clear all (testing)');
  console.log('  GET    /api/health               - Health check\n');
  console.log('Testing:');
  console.log('  curl http://localhost:3000/api/health\n');
});
