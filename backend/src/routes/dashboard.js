import { Router } from 'express';
import db from '../db/connection.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/labs', authRequired, requireRole('assistant', 'admin'), (req, res) => {
  const labs = db.prepare('SELECT * FROM laboratories ORDER BY name').all();
  const metrics = labs.map((lab) => {
    const slots = db.prepare('SELECT COUNT(*) AS c FROM lab_slots WHERE lab_id=?').get(lab.id).c;
    const active = db.prepare(`
      SELECT COUNT(*) AS c FROM reservations r
      JOIN lab_slots s ON s.id=r.slot_id WHERE s.lab_id=? AND r.status IN ('Pending','Approved','Active')
    `).get(lab.id).c;
    const occupancy = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN r.status IN ('Approved','Active','Completed') THEN 1 ELSE 0 END),0) AS booked,
        COALESCE(SUM(s.max_capacity),0) AS capacity
      FROM lab_slots s LEFT JOIN reservations r ON r.slot_id=s.id WHERE s.lab_id=?
    `).get(lab.id);
    const equipment = db.prepare(`
      SELECT e.id, e.name, e.category, e.total_quantity,
        COALESCE((SELECT SUM(a.quantity) FROM equipment_allocations a
          JOIN reservations r2 ON r2.id=a.reservation_id
          WHERE a.equipment_id=e.id AND r2.status IN ('Approved','Active','Completed')),0) AS used
      FROM lab_equipment e WHERE e.lab_id=?
    `).all(lab.id);
    return {
      ...lab,
      stats: {
        total_slots: slots,
        active_reservations: active,
        occupancy_pct: occupancy.capacity ? Math.round((occupancy.booked / occupancy.capacity) * 100) : 0,
      },
      equipment_utilization: equipment.map((e) => ({
        ...e,
        utilization_pct: e.total_quantity ? Math.round((e.used / e.total_quantity) * 100) : 0,
      })),
    };
  });

  const timeline = db.prepare(`
    SELECT r.id, r.status, r.project_title, u.name AS user_name,
      s.slot_date, s.start_time, s.end_time, l.id AS lab_id, l.name AS lab_name
    FROM reservations r
    JOIN users u ON u.id=r.user_id
    JOIN lab_slots s ON s.id=r.slot_id
    JOIN laboratories l ON l.id=s.lab_id
    WHERE date(s.slot_date) >= date('now','-1 day')
    ORDER BY s.slot_date, s.start_time
    LIMIT 200
  `).all();

  res.json({ labs: metrics, timeline });
});

export default router;
