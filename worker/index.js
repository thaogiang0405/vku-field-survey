const ALLOWED_ORIGINS = new Set([
  'https://vku-field-survey.phamthaogianghl05.workers.dev',
  'http://localhost:5173',
  'http://localhost:5174',
]);

const MAX_BODY_BYTES = 12 * 1024 * 1024;

function corsHeaders(origin) {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  });

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  return headers;
}

function json(body, { status = 200, origin } = {}) {
  const headers = corsHeaders(origin);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { status, headers });
}

function isNewer(candidate, current) {
  const candidateTime = new Date(candidate.updatedAt || candidate.updated_at || 0).getTime();
  const currentTime = new Date(current.updatedAt || current.updated_at || 0).getTime();
  return candidateTime > currentTime;
}

function rowToInspection(row) {
  if (!row) return undefined;

  return {
    id: row.id,
    building: row.building,
    floor: row.floor,
    room: row.room,
    category: row.category,
    rating: row.rating,
    defectNotes: row.defect_notes || '',
    ...(row.photo ? { photo: row.photo } : {}),
    ...(row.latitude === null ? {} : { latitude: row.latitude }),
    ...(row.longitude === null ? {} : { longitude: row.longitude }),
    timestamp: row.timestamp,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncAttempts: row.sync_attempts || 0,
    ...(row.last_sync_error ? { lastSyncError: row.last_sync_error } : {}),
  };
}

function normalizeInspection(input, existing) {
  const now = new Date().toISOString();
  const merged = { ...existing, ...input };

  return {
    ...merged,
    id: existing?.id || input.id || crypto.randomUUID(),
    defectNotes: input.defectNotes ?? input.notes ?? existing?.defectNotes ?? '',
    createdAt: existing?.createdAt || input.createdAt || now,
    updatedAt: now,
    status: 'SYNCED',
    syncAttempts: existing?.syncAttempts || input.syncAttempts || 0,
  };
}

async function getInspection(env, id) {
  const row = await env.DB.prepare('SELECT * FROM inspections WHERE id = ?').bind(id).first();
  return rowToInspection(row);
}

async function saveInspection(env, inspection, exists) {
  const values = [
    inspection.id,
    inspection.building,
    inspection.floor,
    inspection.room,
    inspection.category,
    inspection.rating,
    inspection.defectNotes,
    inspection.photo ?? null,
    inspection.latitude ?? null,
    inspection.longitude ?? null,
    inspection.timestamp,
    inspection.status,
    inspection.createdAt,
    inspection.updatedAt,
    inspection.syncAttempts,
    inspection.lastSyncError ?? null,
  ];

  if (exists) {
    await env.DB.prepare(`
      UPDATE inspections
      SET building = ?, floor = ?, room = ?, category = ?, rating = ?, defect_notes = ?,
          photo = ?, latitude = ?, longitude = ?, timestamp = ?, status = ?,
          created_at = ?, updated_at = ?, sync_attempts = ?, last_sync_error = ?
      WHERE id = ?
    `).bind(...values.slice(1), inspection.id).run();
    return;
  }

  await env.DB.prepare(`
    INSERT INTO inspections (
      id, building, floor, room, category, rating, defect_notes, photo, latitude,
      longitude, timestamp, status, created_at, updated_at, sync_attempts, last_sync_error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(...values).run();
}

function validInspection(inspection) {
  return inspection && inspection.building && inspection.room && inspection.category;
}

async function readJson(request, origin) {
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return { response: json({ success: false, error: 'Ảnh hoặc dữ liệu gửi lên quá lớn.' }, { status: 413, origin }) };
  }

  try {
    return { body: await request.json() };
  } catch {
    return { response: json({ success: false, error: 'JSON body không hợp lệ.' }, { status: 400, origin }) };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return json({ success: false, error: 'Origin không được phép gọi API.' }, { status: 403, origin });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json({ success: false, error: 'Origin không được phép gọi API.' }, { status: 403, origin });
    }

    try {
      if (request.method === 'GET' && url.pathname === '/api/health') {
        const countRow = await env.DB.prepare('SELECT COUNT(*) AS count FROM inspections').first();
        return json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          inspections: Number(countRow?.count || 0),
          storage: 'cloudflare-d1',
        }, { origin });
      }

      if (request.method === 'GET' && url.pathname === '/api/inspections') {
        const result = await env.DB.prepare('SELECT * FROM inspections ORDER BY timestamp DESC').all();
        const inspections = result.results.map(rowToInspection);
        return json({ success: true, data: inspections, count: inspections.length }, { origin });
      }

      const inspectionMatch = url.pathname.match(/^\/api\/inspections\/([^/]+)$/);
      if (inspectionMatch) {
        const id = decodeURIComponent(inspectionMatch[1]);

        if (request.method === 'GET') {
          const inspection = await getInspection(env, id);
          if (!inspection) return json({ success: false, error: 'Không tìm thấy phiếu khảo sát.' }, { status: 404, origin });
          return json({ success: true, data: inspection }, { origin });
        }

        if (request.method === 'PUT') {
          const parsed = await readJson(request, origin);
          if (parsed.response) return parsed.response;

          const existing = await getInspection(env, id);
          if (!existing) return json({ success: false, error: 'Không tìm thấy phiếu khảo sát.' }, { status: 404, origin });
          if (!isNewer(parsed.body, existing)) {
            return json({ success: true, data: existing, message: 'Máy chủ đã có phiên bản mới hơn.' }, { origin });
          }

          const inspection = normalizeInspection({ ...parsed.body, id }, existing);
          await saveInspection(env, inspection, true);
          return json({ success: true, data: inspection }, { origin });
        }
      }

      if (request.method === 'POST' && url.pathname === '/api/inspections') {
        const parsed = await readJson(request, origin);
        if (parsed.response) return parsed.response;
        if (!validInspection(parsed.body)) {
          return json({ success: false, error: 'Thiếu các trường bắt buộc: building, room, category.' }, { status: 400, origin });
        }

        const id = parsed.body.id || crypto.randomUUID();
        const existing = await getInspection(env, id);
        if (existing && !isNewer(parsed.body, existing)) {
          return json({ success: true, data: existing, message: 'Phiếu khảo sát đã tồn tại.' }, { origin });
        }

        const inspection = normalizeInspection({ ...parsed.body, id }, existing);
        await saveInspection(env, inspection, Boolean(existing));
        return json({
          success: true,
          data: inspection,
          message: existing ? 'Đã cập nhật phiếu khảo sát.' : 'Đã tạo phiếu khảo sát.',
        }, { status: existing ? 200 : 201, origin });
      }

      return json({ success: false, error: `Không tìm thấy API: ${request.method} ${url.pathname}` }, { status: 404, origin });
    } catch (error) {
      console.error('[API] Lỗi máy chủ:', error);
      return json({ success: false, error: 'Không thể lưu dữ liệu trên máy chủ.' }, { status: 500, origin });
    }
  },
};
