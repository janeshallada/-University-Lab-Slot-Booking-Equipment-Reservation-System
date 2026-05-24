import { Router } from 'express';
import db from '../db/connection.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { equipmentSchema, allocateSchema } from '../utils/validate.js';
import { httpError } from '../middleware/error.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const { lab_id, category, search } = req.query;
  let sql = `SELECT e.*, l.name AS lab_name FROM lab_equipment e JOIN laboratories l ON l.id=e.lab_id WHERE 1=1`;
  const params = [];
  if (lab_id) { sql += ' AND e.lab_id = ?'; params.push(Number(lab_id)); }
  if (category) { sql += ' AND e.category = ?'; params.push(category); }
  if (search) { sql += ' AND e.name LIKE ?'; params.push(`%${search}%`); }
  sql += ' ORDER BY l.name, e.name';
  res.json({ equipment: db.prepare(sql).all(...params) });
});

router.post('/', authRequired, requireRole('admin'), (req, res, next) => {
  try {
    const data = equipmentSchema.parse(req.body);
    const lab = db.prepare('SELECT id FROM laboratories WHERE id = ?').get(data.lab_id);
    if (!lab) throw httpError(404, 'Lab not found');
    const info = db
      .prepare('INSERT INTO lab_equipment (lab_id,name,category,total_quantity,description) VALUES (?,?,?,?,?)')
      .run(data.lab_id, data.name, data.category, data.total_quantity, data.description ?? null);
    res.status(201).json({ equipment: db.prepare('SELECT * FROM lab_equipment WHERE id=?').get(info.lastInsertRowid) });
  } catch (e) { next(e); }
});

router.post('/allocate', authRequired, requireRole('assistant', 'admin'), (req, res, next) => {
  try {
    const data = allocateSchema.parse(req.body);
    const tx = db.transaction(() => {
      const res1 = db.prepare('SELECT r.*, s.slot_date, s.start_time, s.end_time FROM reservations r JOIN lab_slots s ON s.id=r.slot_id WHERE r.id=?').get(data.reservation_id);
      if (!res1) throw httpError(404, 'Reservation not found');
      const equip = db.prepare('SELECT * FROM lab_equipment WHERE id=?').get(data.equipment_id);
      if (!equip) throw httpError(404, 'Equipment not found');

      // overlapping allocations on same equipment
      const overlapping = db.prepare(`
        SELECT COALESCE(SUM(a.quantity),0) AS used
        FROM equipment_allocations a
        JOIN reservations r2 ON r2.id = a.reservation_id
        JOIN lab_slots s2 ON s2.id = r2.slot_id
        WHERE a.equipment_id = ?
          AND r2.status IN ('Pending','Approved','Active')
          AND s2.slot_date = ?
          AND NOT (s2.end_time <= ? OR s2.start_time >= ?)
          AND r2.id <> ?
      `).get(data.equipment_id, res1.slot_date, res1.start_time, res1.end_time, res1.id);

      const used = overlapping.used || 0;
      if (used + data.quantity > equip.total_quantity)
        throw httpError(409, `Only ${equip.total_quantity - used} unit(s) available in this time window`);

      db.prepare(`
        INSERT INTO equipment_allocations (reservation_id, equipment_id, quantity)
        VALUES (?,?,?)
        ON CONFLICT(reservation_id, equipment_id) DO UPDATE SET quantity = excluded.quantity
      `).run(data.reservation_id, data.equipment_id, data.quantity);
    });
    tx();
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
