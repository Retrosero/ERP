import { Router } from 'express';
import { superAdminAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';
import {
  listScheduledTasks,
  createScheduledTask,
  updateScheduledTask,
  deleteScheduledTask,
  executeTaskNow,
  listTaskLogs,
} from '../controllers/automation.controller';

// ============================================
// Validation Schemas
// ============================================

const createTaskSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    'CHECK_EXPIRING',
    'AUTO_SUSPEND',
    'CLEANUP_SESSIONS',
    'CLEANUP_API_LOGS',
    'CLEANUP_HEALTH_LOGS',
    'RETRY_DOLIBARR_ERRORS',
    'CUSTOM',
  ]),
  cron_expression: z.string().min(1),
  config: z.record(z.any()).optional(),
  firm_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
});

const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  cron_expression: z.string().min(1).optional(),
  config: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
  timeout_seconds: z.number().optional(),
  max_retries: z.number().optional(),
});

const taskLogQuerySchema = z.object({
  task_id: z.string().uuid().optional(),
  status: z.enum(['SUCCESS', 'FAILED', 'RUNNING']).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

// ============================================
// Router
// ============================================

const router = Router();

// ============================================
// Scheduled Tasks Routes
// ============================================

// List all scheduled tasks
router.get('/tasks', superAdminAuth, listScheduledTasks);

// Create new scheduled task
router.post('/tasks', superAdminAuth, validateBody(createTaskSchema), createScheduledTask);

// Update scheduled task
router.put('/tasks/:id', superAdminAuth, validateBody(updateTaskSchema), updateScheduledTask);

// Delete scheduled task
router.delete('/tasks/:id', superAdminAuth, deleteScheduledTask);

// Execute task immediately (manual trigger)
router.post('/tasks/:id/execute', superAdminAuth, executeTaskNow);

// ============================================
// Task Logs Routes
// ============================================

// List task execution logs
router.get('/task-logs', superAdminAuth, listTaskLogs);

export default router;