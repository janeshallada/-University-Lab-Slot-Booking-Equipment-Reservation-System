import { Router } from 'express';
import db from '../db/connection.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { labSchema } from '../utils/validate.js';
import { httpError } from '../middleware/error.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const { search, subject } = req.query;
  let sql = 'SELECT * FROM laboratories WHERE 1=1';
  const params = [];
  if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }
  if (subject) { sql += ' AND subject = ?'; params.push(subject); }
  sql += ' ORDER BY name';
  res.json({ labs: db.prepare(sql).all(...params) });
});

router.get('/availability', authRequired, (req, res) => {
  const { date, subject, equipment_category } = req.query;
  let sql = `
    SELECT s.*, l.name AS lab_name, l.subject AS lab_subject, l.location,
      (s.max_capacity - COALESCE((
        SELECT COUNT(*) FROM reservations r
        WHERE r.slot_id = s.id AND r.status IN ('Pending','Approved','Active')
      ),0)) AS remaining
    FROM lab_slots s
    JOIN laboratories l ON l.id = s.lab_id
    WHERE 1=1`;
  const params = [];
  if (date) { sql += ' AND s.slot_date = ?'; params.push(date); }
  if (subject) { sql += ' AND l.subject = ?'; params.push(subject); }
  if (equipment_category) {
    sql += ' AND EXISTS (SELECT 1 FROM lab_equipment e WHERE e.lab_id = l.id AND e.category = ?)';
    params.push(equipment_category);
  }
  sql += ' ORDER BY s.slot_date, s.start_time';
  res.json({ slots: db.prepare(sql).all(...params) });
});

router.get('/:id', authRequired, (req, res, next) => {
  try {
    const lab = db.prepare('SELECT * FROM laboratories WHERE id = ?').get(req.params.id);
    if (!lab) throw httpError(404, 'Lab not found');
    const equipment = db.prepare('SELECT * FROM lab_equipment WHERE lab_id = ?').all(lab.id);
    res.json({ lab, equipment });
  } catch (e) { next(e); }
});

router.post('/', authRequired, requireRole('admin'), (req, res, next) => {
  try {
    const data = labSchema.parse(req.body);
    const info = db
      .prepare('INSERT INTO laboratories (name,location,subject,capacity,description) VALUES (?,?,?,?,?)')
      .run(data.name, data.location ?? null, data.subject ?? null, data.capacity, data.description ?? null);
    const lab = db.prepare('SELECT * FROM laboratories WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ lab });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(httpError(409, 'Lab name already exists'));
    next(e);
  }
});

export default router;
