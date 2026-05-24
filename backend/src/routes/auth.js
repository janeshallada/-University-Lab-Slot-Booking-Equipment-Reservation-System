import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/connection.js';
import { authRequired } from '../middleware/auth.js';
import { httpError } from '../middleware/error.js';
import { registerSchema, loginSchema } from '../utils/validate.js';

const router = Router();

function sign(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );
}

router.post('/register', (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (exists) throw httpError(409, 'Email already registered');
    const hash = bcrypt.hashSync(data.password, 10);
    const role = data.role || 'student';
    const info = db
      .prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)')
      .run(data.name, data.email, hash, role);
    const user = db.prepare('SELECT id,name,email,role FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ token: sign(user), user });
  } catch (e) { next(e); }
});

router.post('/login', (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email);
    if (!row || !bcrypt.compareSync(data.password, row.password_hash))
      throw httpError(401, 'Invalid email or password');
    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    res.json({ token: sign(user), user });
  } catch (e) { next(e); }
});

router.get('/me', authRequired, (req, res) => {
  const user = db
    .prepare('SELECT id,name,email,role FROM users WHERE id = ?')
    .get(req.user.id);
  res.json({ user });
});

export default router;
