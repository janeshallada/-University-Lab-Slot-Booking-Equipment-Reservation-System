import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['student', 'assistant', 'admin']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const labSchema = z.object({
  name: z.string().min(2).max(120),
  location: z.string().max(200).optional().nullable(),
  subject: z.string().max(120).optional().nullable(),
  capacity: z.number().int().min(1).max(1000),
  description: z.string().max(1000).optional().nullable(),
});

export const equipmentSchema = z.object({
  lab_id: z.number().int().positive(),
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  total_quantity: z.number().int().min(1).max(10000),
  description: z.string().max(1000).optional().nullable(),
});

const timeStr = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM');
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const slotSchema = z.object({
  lab_id: z.number().int().positive(),
  slot_date: dateStr,
  start_time: timeStr,
  end_time: timeStr,
  max_capacity: z.number().int().min(1).max(1000),
});

export const reservationSchema = z.object({
  slot_id: z.number().int().positive(),
  project_title: z.string().min(2).max(200),
  project_details: z.string().max(2000).optional().nullable(),
  equipment: z
    .array(z.object({
      equipment_id: z.number().int().positive(),
      quantity: z.number().int().min(1).max(1000),
    }))
    .optional()
    .default([]),
});

export const allocateSchema = z.object({
  reservation_id: z.number().int().positive(),
  equipment_id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(1000),
});

export const statusSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Active', 'Completed', 'Cancelled']),
  note: z.string().max(500).optional().nullable(),
});
