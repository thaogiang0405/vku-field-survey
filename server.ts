import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with database in production)
interface InspectionRecord {
  id: string;
  building: string;
  floor: number;
  room: string;
  category: string;
  rating: number;
  defectNotes: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  syncAttempts: number;
}

let inspections: InspectionRecord[] = [];

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create inspection
app.post('/api/inspections', (req, res) => {
  try {
    const inspection = req.body as InspectionRecord;
    
    // Validate required fields
    if (!inspection.building || !inspection.room || !inspection.category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: building, room, category',
      });
    }

    // Add server-side timestamp and ID if missing
    if (!inspection.id) {
      inspection.id = uuidv4();
    }
    if (!inspection.createdAt) {
      inspection.createdAt = new Date().toISOString();
    }
    inspection.updatedAt = new Date().toISOString();
    inspection.status = 'SYNCED';

    // Store in memory
    inspections.push(inspection);

    // Log for debugging
    console.log(`[API] Created inspection: ${inspection.id}`);
    console.log(`[API] Total inspections: ${inspections.length}`);

    // Return success response
    res.status(201).json({
      success: true,
      data: inspection,
      message: 'Inspection created successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Error creating inspection:', message);
    res.status(500).json({
      success: false,
      error: message,
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

    console.log(`[API] Retrieved ${sorted.length} inspections`);

    res.json({
      success: true,
      data: sorted,
      count: sorted.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Error getting inspections:', message);
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Get single inspection
app.get('/api/inspections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const inspection = inspections.find(i => i.id === id);

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
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Error getting inspection:', message);
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Update inspection
app.put('/api/inspections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const index = inspections.findIndex(i => i.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: `Inspection ${id} not found`,
      });
    }

    // Merge updates
    inspections[index] = {
      ...inspections[index],
      ...updates,
      id, // Don't allow ID change
      updatedAt: new Date().toISOString(),
    };

    console.log(`[API] Updated inspection: ${id}`);

    res.json({
      success: true,
      data: inspections[index],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Error updating inspection:', message);
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Delete inspection
app.delete('/api/inspections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = inspections.findIndex(i => i.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: `Inspection ${id} not found`,
      });
    }

    const deleted = inspections.splice(index, 1)[0];
    console.log(`[API] Deleted inspection: ${id}`);

    res.json({
      success: true,
      data: deleted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Error deleting inspection:', message);
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Clear all inspections (for testing)
app.delete('/api/inspections', (req, res) => {
  try {
    const count = inspections.length;
    inspections = [];
    console.log(`[API] Cleared all ${count} inspections`);

    res.json({
      success: true,
      message: `Cleared ${count} inspections`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Error clearing inspections:', message);
    res.status(500).json({
      success: false,
      error: message,
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

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ VKU Field Survey Backend Server`);
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
  console.log('Endpoints:');
  console.log('  POST   /api/inspections          - Create inspection');
  console.log('  GET    /api/inspections          - Get all inspections');
  console.log('  GET    /api/inspections/:id      - Get single inspection');
  console.log('  PUT    /api/inspections/:id      - Update inspection');
  console.log('  DELETE /api/inspections/:id      - Delete inspection');
  console.log('  DELETE /api/inspections          - Clear all (testing)');
  console.log('  GET    /api/health               - Health check\n');
});
