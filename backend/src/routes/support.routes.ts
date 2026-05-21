import { Router } from 'express';
import { superAdminAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';
import {
  listSupportTickets,
  getSupportTicket,
  createSupportTicket,
  updateSupportTicket,
  addTicketMessage,
  closeSupportTicket,
  getTicketStats,
  listFaqArticles,
  getFaqArticle,
  createFaqArticle,
  updateFaqArticle,
  deleteFaqArticle,
  reorderFaqArticles,
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  trackAnnouncementView,
  getActiveAnnouncements,
  getAnnouncementStats,
} from '../controllers/support.controller';

// ============================================
// Validation Schemas
// ============================================

const createTicketSchema = z.object({
  firm_id: z.string().uuid().optional(),
  subject: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['TECHNICAL', 'BILLING', 'FEATURE_REQUEST', 'BUG_REPORT', 'GENERAL', 'DOLIBARR_INTEGRATION']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigned_to: z.string().optional(),
});

const addMessageSchema = z.object({
  content: z.string().min(1),
  sender_type: z.enum(['CUSTOMER', 'SUPPORT_AGENT', 'SYSTEM']).optional(),
});

const closeTicketSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
});

const createFaqSchema = z.object({
  firm_id: z.string().uuid().optional(),
  title: z.string().min(1),
  slug: z.string().optional(),
  category: z.string().optional(),
  content: z.string().min(1),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().optional(),
});

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'ERROR', 'PROMO']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
  target_type: z.enum(['ALL', 'SPECIFIC_FIRMS', 'PLAN_BASED', 'NEW_FIRMS']).optional(),
  firm_ids: z.array(z.string()).optional(),
  plan_filters: z.array(z.string()).optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  image_url: z.string().url().optional(),
  is_active: z.boolean().optional(),
  is_dismissible: z.boolean().optional(),
  action_url: z.string().url().optional(),
  action_label: z.string().optional(),
});

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'ERROR', 'PROMO']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
  target_type: z.enum(['ALL', 'SPECIFIC_FIRMS', 'PLAN_BASED', 'NEW_FIRMS']).optional(),
  firm_ids: z.array(z.string()).optional(),
  plan_filters: z.array(z.string()).optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  image_url: z.string().url().optional(),
  is_active: z.boolean().optional(),
  is_dismissible: z.boolean().optional(),
  action_url: z.string().url().optional(),
  action_label: z.string().optional(),
});

// ============================================
// Router
// ============================================

const router = Router();

// ============================================
// Support Tickets Routes
// ============================================

// List all tickets
router.get('/tickets', superAdminAuth, listSupportTickets);

// Get ticket details
router.get('/tickets/:id', superAdminAuth, getSupportTicket);

// Create new ticket
router.post('/tickets', superAdminAuth, validateBody(createTicketSchema), createSupportTicket);

// Update ticket
router.put('/tickets/:id', superAdminAuth, validateBody(updateTicketSchema), updateSupportTicket);

// Add message to ticket
router.post('/tickets/:id/messages', superAdminAuth, validateBody(addMessageSchema), addTicketMessage);

// Close ticket
router.post('/tickets/:id/close', superAdminAuth, validateBody(closeTicketSchema), closeSupportTicket);

// Get ticket statistics
router.get('/tickets/stats', superAdminAuth, getTicketStats);

// ============================================
// FAQ Routes
// ============================================

// List FAQ articles
router.get('/faq', superAdminAuth, listFaqArticles);

// Get FAQ article
router.get('/faq/:id', superAdminAuth, getFaqArticle);

// Create FAQ article
router.post('/faq', superAdminAuth, validateBody(createFaqSchema), createFaqArticle);

// Update FAQ article
router.put('/faq/:id', superAdminAuth, validateBody(createFaqSchema), updateFaqArticle);

// Delete FAQ article
router.delete('/faq/:id', superAdminAuth, deleteFaqArticle);

// Reorder FAQ articles
router.post('/faq/reorder', superAdminAuth, reorderFaqArticles);

// ============================================
// Announcements Routes
// ============================================

// List announcements
router.get('/announcements', superAdminAuth, listAnnouncements);

// Get announcement
router.get('/announcements/:id', superAdminAuth, getAnnouncement);

// Create announcement
router.post('/announcements', superAdminAuth, validateBody(createAnnouncementSchema), createAnnouncement);

// Update announcement
router.put('/announcements/:id', superAdminAuth, validateBody(updateAnnouncementSchema), updateAnnouncement);

// Delete announcement
router.delete('/announcements/:id', superAdminAuth, deleteAnnouncement);

// Track announcement view
router.post('/announcements/:id/view', superAdminAuth, trackAnnouncementView);

// Get active announcements (for firm)
router.get('/announcements/active', getActiveAnnouncements);

// Get announcement statistics
router.get('/announcements/stats', superAdminAuth, getAnnouncementStats);

export default router;