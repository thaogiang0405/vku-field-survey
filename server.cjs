/**
 * VKU Field Survey API
 * Durable shared store for local development and deployments with persistent disk.
 * Set DATA_FILE to a mounted persistent path in production.
 */
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'inspections.json');
let inspections = [];
let writeChain = Promise.resolve();

app.use(cors());
app.use(express.json({ limit: '12mb' }));

async function loadStore() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    const file = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(file);
    inspections = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await persistStore();
  }
}

function persistStore() {
  writeChain = writeChain.then(async () => {
    const temporaryFile = `${DATA_FILE}.tmp`;
    await fs.writeFile(temporaryFile, JSON.stringify(inspections, null, 2), 'utf8');
    await fs.rename(temporaryFile, DATA_FILE);
  });
  return writeChain;
}

function isNewer(candidate, current) {
  return new Date(candidate.updatedAt || candidate.updated_at || 0).getTime() > new Date(current.updatedAt || current.updated_at || 0).getTime();
}

function normalizeInspection(input, existing) {
  const now = new Date().toISOString();
  return {
    ...existing,
    ...input,
    id: existing?.id || input.id || uuidv4(),
    createdAt: existing?.createdAt || input.createdAt || now,
    updatedAt: now,
    status: 'SYNCED',
    syncAttempts: existing?.syncAttempts || input.syncAttempts || 0,
  };
}

function validInspection(inspection) {
  return inspection && inspection.building && inspection.room && inspection.category;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), inspections: inspections.length, storage: 'persistent-file' });
});

// Idempotent create/upsert: retrying an offline queue item cannot create duplicates.
app.post('/api/inspections', async (req, res, next) => {
  try {
    if (!validInspection(req.body)) return res.status(400).json({ success: false, error: 'Thiếu các trường bắt buộc: building, room, category.' });
    const id = req.body.id || uuidv4();
    const index = inspections.findIndex((item) => item.id === id);
    const existing = index === -1 ? undefined : inspections[index];

    // Keep the latest version if the client retries an older payload.
    if (existing && !isNewer(req.body, existing)) {
      return res.status(200).json({ success: true, data: existing, message: 'Phiếu khảo sát đã tồn tại.' });
    }

    const inspection = normalizeInspection({ ...req.body, id }, existing);
    if (index === -1) inspections.push(inspection); else inspections[index] = inspection;
    await persistStore();
    res.status(index === -1 ? 201 : 200).json({ success: true, data: inspection, message: index === -1 ? 'Đã tạo phiếu khảo sát.' : 'Đã cập nhật phiếu khảo sát.' });
  } catch (error) { next(error); }
});

app.get('/api/inspections', (req, res) => {
  const sorted = [...inspections].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json({ success: true, data: sorted, count: sorted.length });
});

app.get('/api/inspections/:id', (req, res) => {
  const inspection = inspections.find((item) => item.id === req.params.id);
  if (!inspection) return res.status(404).json({ success: false, error: 'Không tìm thấy phiếu khảo sát.' });
  return res.json({ success: true, data: inspection });
});

app.put('/api/inspections/:id', async (req, res, next) => {
  try {
    const index = inspections.findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Không tìm thấy phiếu khảo sát.' });
    if (!isNewer(req.body, inspections[index])) return res.status(200).json({ success: true, data: inspections[index], message: 'Máy chủ đã có phiên bản mới hơn.' });
    inspections[index] = normalizeInspection({ ...req.body, id: req.params.id }, inspections[index]);
    await persistStore();
    return res.json({ success: true, data: inspections[index] });
  } catch (error) { return next(error); }
});

app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') return res.status(413).json({ success: false, error: 'Ảnh hoặc dữ liệu gửi lên quá lớn.' });
  console.error('[API] Lỗi máy chủ:', error);
  return res.status(500).json({ success: false, error: 'Không thể lưu dữ liệu trên máy chủ.' });
});

app.use((req, res) => res.status(404).json({ success: false, error: `Không tìm thấy API: ${req.method} ${req.path}` }));

loadStore().then(() => {
  app.listen(PORT, () => {
    console.log(`VKU Field Survey API đang chạy tại http://localhost:${PORT}/api`);
    console.log(`Kho dữ liệu dùng chung: ${DATA_FILE}`);
  });
}).catch((error) => { console.error('Không thể khởi động kho dữ liệu:', error); process.exit(1); });
