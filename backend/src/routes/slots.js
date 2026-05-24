import { Router } from 'express';
import db from '../db/connection.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { slotSchema } from '../utils/validate.js';
import { httpError } from '../middleware/error.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const { lab_id, date } = req.query;
  let sql = `SELECT s.*, l.name AS lab_name, l.subject AS lab_subject FROM lab_slots s JOIN laboratories l ON l.id=s.lab_id WHERE 1=1`;
  const params = [];
  if (lab_id) { sql += ' AND s.lab_id=?'; params.push(Number(lab_id)); }
  if (date) { sql += ' AND s.slot_date=?'; params.push(date); }
  sql += ' ORDER BY s.slot_date, s.start_time';
  res.json({ slots: db.prepare(sql).all(...params) });
});

router.post('/', authRequired, requireRole('admin'), (req, res, next) => {
  try {
    const data = slotSchema.parse(req.body);
    if (data.start_time >= data.end_time) throw httpError(400, 'start_time must be before end_time');
    const lab = db.prepare('SELECT id FROM laboratories WHERE id=?').get(data.lab_id);
    if (!lab) throw httpError(404, 'Lab not found');
    // prevent overlap with existing slots in same lab/date
    const overlap = db.prepare(`
      SELECT 1 FROM lab_slots WHERE lab_id=? AND slot_date=?
        AND NOT (end_time <= ? OR start_time >= ?)
    `).get(data.lab_id, data.slot_date, data.start_time, data.end_time);
    if (overlap) throw httpError(409, 'Slot overlaps with an existing slot for this lab');
    const info = db.prepare(
      'INSERT INTO lab_slots (lab_id,slot_date,start_time,end_time,max_capacity) VALUES (?,?,?,?,?)'
    ).run(data.lab_id, data.slot_date, data.start_time, data.end_time, data.max_capacity);
    res.status(201).json({ slot: db.prepare('SELECT * FROM lab_slots WHERE id=?').get(info.lastInsertRowid) });
  } catch (e) { next(e); }
});

export default router;
