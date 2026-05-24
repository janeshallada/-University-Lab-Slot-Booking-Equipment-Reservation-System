import bcrypt from 'bcryptjs';
import db from './connection.js';

console.log('Seeding database...');

const reset = db.transaction(() => {
  db.exec(`
    DELETE FROM reservation_status_logs;
    DELETE FROM equipment_allocations;
    DELETE FROM reservations;
    DELETE FROM lab_slots;
    DELETE FROM lab_equipment;
    DELETE FROM laboratories;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);
});
reset();

const insertUser = db.prepare(
  'INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)'
);
const hash = (p) => bcrypt.hashSync(p, 10);

insertUser.run('Admin User', 'admin@uni.edu', hash('admin123'), 'admin');
insertUser.run('Lab Assistant', 'assistant@uni.edu', hash('assist123'), 'assistant');
insertUser.run('Sam Student', 'student@uni.edu', hash('student123'), 'student');
insertUser.run('Riya Student', 'riya@uni.edu', hash('student123'), 'student');

const insertLab = db.prepare(
  'INSERT INTO laboratories (name,location,subject,capacity,description) VALUES (?,?,?,?,?)'
);
const physicsId = insertLab.run('Physics Lab A', 'Block A · Room 101', 'Physics', 20, 'Optics and mechanics lab').lastInsertRowid;
const chemId = insertLab.run('Chemistry Lab B', 'Block B · Room 204', 'Chemistry', 16, 'Wet chemistry lab').lastInsertRowid;
const csId = insertLab.run('Computer Lab C', 'Block C · Room 310', 'Computer Science', 30, 'High-performance workstations').lastInsertRowid;

const insertEquip = db.prepare(
  'INSERT INTO lab_equipment (lab_id,name,category,total_quantity,description) VALUES (?,?,?,?,?)'
);
insertEquip.run(physicsId, 'Oscilloscope', 'Measurement', 6, '100MHz digital scope');
insertEquip.run(physicsId, 'Laser Diode Kit', 'Optics', 4, 'For diffraction experiments');
insertEquip.run(chemId, 'Bunsen Burner', 'Heating', 10, null);
insertEquip.run(chemId, 'Spectrophotometer', 'Measurement', 2, 'UV/Vis spectrophotometer');
insertEquip.run(csId, 'GPU Workstation', 'Computing', 8, 'RTX-class GPU rigs');
insertEquip.run(csId, 'Raspberry Pi Kit', 'Embedded', 12, 'Pi 5 with sensor pack');

const insertSlot = db.prepare(
  'INSERT INTO lab_slots (lab_id,slot_date,start_time,end_time,max_capacity) VALUES (?,?,?,?,?)'
);
const today = new Date();
const fmt = (d) => d.toISOString().slice(0, 10);
for (let i = 0; i < 7; i++) {
  const d = new Date(today); d.setDate(today.getDate() + i);
  const date = fmt(d);
  for (const labId of [physicsId, chemId, csId]) {
    insertSlot.run(labId, date, '09:00', '11:00', 10);
    insertSlot.run(labId, date, '11:30', '13:30', 10);
    insertSlot.run(labId, date, '14:00', '16:00', 10);
  }
}

console.log('Seed complete.');
console.log('Demo users:');
console.log('  admin@uni.edu / admin123');
console.log('  assistant@uni.edu / assist123');
console.log('  student@uni.edu / student123');
