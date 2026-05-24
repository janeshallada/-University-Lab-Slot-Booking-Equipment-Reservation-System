import { Router } from 'express';
import db from '../db/connection.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { reservationSchema, statusSchema } from '../utils/validate.js';
import { httpError } from '../middleware/error.js';

const router = Router();

// List with filters + pagination
router.get('/', authRequired, (req, res) => {
  const { lab_id, status, equipment_category, student, page = '1', page_size = '10' } = req.query;
  const p = Math.max(1, parseInt(page));
  const ps = Math.min(100, Math.max(1, parseInt(page_size)));

  let sql = `
    SELECT r.*, u.name AS user_name, u.email AS user_email,
      s.slot_date, s.start_time, s.end_time,
      l.id AS lab_id, l.name AS lab_name, l.subject AS lab_subject
    FROM reservations r
    JOIN users u ON u.id = r.user_id
    JOIN lab_slots s ON s.id = r.slot_id
    JOIN laboratories l ON l.id = s.lab_id
    WHERE 1=1`;
  const params = [];

  if (req.user.role === 'student') {
    sql += ' AND r.user_id = ?'; params.push(req.user.id);
  }
  if (lab_id) { sql += ' AND l.id = ?'; params.push(Number(lab_id)); }
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  if (student) { sql += ' AND u.name LIKE ?'; params.push(`%${student}%`); }
  if (equipment_category) {
    sql += ` AND EXISTS (SELECT 1 FROM equipment_allocations a JOIN lab_equipment e ON e.id=a.equipment_id
              WHERE a.reservation_id = r.id AND e.category = ?)`;
    params.push(equipment_category);
  }

  const countSql = `SELECT COUNT(*) AS c FROM (${sql})`;
  const total = db.prepare(countSql).get(...params).c;

  sql += ' ORDER BY s.slot_date DESC, s.start_time DESC LIMIT ? OFFSET ?';
  params.push(ps, (p - 1) * ps);
  const rows = db.prepare(sql).all(...params);

  res.json({ reservations: rows, total, page: p, page_size: ps });
});

router.get('/:id', authRequired, (req, res, next) => {
  try {
    const r = db.prepare(`
      SELECT r.*, u.name AS user_name, u.email AS user_email,
        s.slot_date, s.start_time, s.end_time,
        l.id AS lab_id, l.name AS lab_name
      FROM reservations r
      JOIN users u ON u.id=r.user_id
      JOIN lab_slots s ON s.id=r.slot_id
      JOIN laboratories l ON l.id=s.lab_id
      WHERE r.id = ?`).get(req.params.id);
    if (!r) throw httpError(404, 'Reservation not found');
    if (req.user.role === 'student' && r.user_id !== req.user.id)
      throw httpError(403, 'Forbidden');
    const allocations = db.prepare(`
      SELECT a.*, e.name AS equipment_name, e.category
      FROM equipment_allocations a JOIN lab_equipment e ON e.id=a.equipment_id
      WHERE a.reservation_id = ?`).all(r.id);
    const logs = db.prepare(`
      SELECT l.*, u.name AS changed_by_name
      FROM reservation_status_logs l
      LEFT JOIN users u ON u.id=l.changed_by
      WHERE l.reservation_id = ? ORDER BY l.id ASC`).all(r.id);
    res.json({ reservation: r, allocations, logs });
  } catch (e) { next(e); }
});

router.post('/', authRequired, requireRole('student', 'admin'), (req, res, next) => {
  try {
    const data = reservationSchema.parse(req.body);
    const result = db.transaction(() => {
      const slot = db.prepare('SELECT s.*, l.name AS lab_name FROM lab_slots s JOIN laboratories l ON l.id=s.lab_id WHERE s.id=?').get(data.slot_id);
      if (!slot) throw httpError(404, 'Slot not found');

      // duplicate reservation by same user for same slot
      const dup = db.prepare(`SELECT 1 FROM reservations WHERE slot_id=? AND user_id=? AND status IN ('Pending','Approved','Active')`)
        .get(data.slot_id, req.user.id);
      if (dup) throw httpError(409, 'You already have a reservation for this slot');

      // capacity check
      const used = db.prepare(`SELECT COUNT(*) AS c FROM reservations WHERE slot_id=? AND status IN ('Pending','Approved','Active')`)
        .get(data.slot_id).c;
      if (used >= slot.max_capacity) throw httpError(409, 'Slot is full');

      // validate & allocate equipment
      for (const e of data.equipment) {
        const equip = db.prepare('SELECT * FROM lab_equipment WHERE id=?').get(e.equipment_id);
        if (!equip) throw httpError(404, `Equipment ${e.equipment_id} not found`);
        if (equip.lab_id !== slot.lab_id) throw httpError(400, `Equipment "${equip.name}" does not belong to this lab`);
        const overlap = db.prepare(`
          SELECT COALESCE(SUM(a.quantity),0) AS used
          FROM equipment_allocations a
          JOIN reservations r2 ON r2.id=a.reservation_id
          JOIN lab_slots s2 ON s2.id=r2.slot_id
          WHERE a.equipment_id=? AND r2.status IN ('Pending','Approved','Active')
            AND s2.slot_date=? AND NOT (s2.end_time<=? OR s2.start_time>=?)
        `).get(e.equipment_id, slot.slot_date, slot.start_time, slot.end_time);
        const usedQty = overlap.used || 0;
        if (usedQty + e.quantity > equip.total_quantity)
          throw httpError(409, `Equipment "${equip.name}" only has ${equip.total_quantity - usedQty} unit(s) available in this slot`);
      }

      const info = db.prepare(`
        INSERT INTO reservations (slot_id,user_id,project_title,project_details,status)
        VALUES (?,?,?,?, 'Pending')
      `).run(data.slot_id, req.user.id, data.project_title, data.project_details ?? null);

      for (const e of data.equipment) {
        db.prepare('INSERT INTO equipment_allocations (reservation_id,equipment_id,quantity) VALUES (?,?,?)')
          .run(info.lastInsertRowid, e.equipment_id, e.quantity);
      }
      db.prepare('INSERT INTO reservation_status_logs (reservation_id,from_status,to_status,changed_by,note) VALUES (?,?,?,?,?)')
        .run(info.lastInsertRowid, null, 'Pending', req.user.id, 'Reservation created');

      return info.lastInsertRowid;
    })();

    const reservation = db.prepare('SELECT * FROM reservations WHERE id=?').get(result);
    res.status(201).json({ reservation });
  } catch (e) { next(e); }
});

router.put('/:id/status', authRequired, requireRole('assistant', 'admin'), (req, res, next) => {
  try {
    const data = statusSchema.parse(req.body);
    const r = db.prepare('SELECT * FROM reservations WHERE id=?').get(req.params.id);
    if (!r) throw httpError(404, 'Reservation not found');
    if (r.status === data.status) return res.json({ reservation: r });
    db.transaction(() => {
  db.prepare("UPDATE reservations SET status=?, updated_at=datetime('now') WHERE id=?")
    .run(data.status, r.id);

  db.prepare(`
    INSERT INTO reservation_status_logs
    (reservation_id, from_status, to_status, changed_by, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(r.id, r.status, data.status, req.user.id, data.note ?? null);
})();
    res.json({ reservation: db.prepare('SELECT * FROM reservations WHERE id=?').get(r.id) });
  } catch (e) { next(e); }
});

export default router;
