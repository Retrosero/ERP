import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, AppError } from '../middleware/validation.middleware';

/**
 * Destek Sistemi Controller
 * Destek talepleri, FAQ, Duyurular
 */

// ============================================
// Support Tickets
// ============================================

export const listSupportTickets = asyncHandler(async (req: Request, res: Response) => {
  const { status, priority, category, firm_id, page = 1, limit = 20 } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (firm_id) where.firm_id = firm_id;

  const skip = (Number(page) - 1) * Number(limit);

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: { firm: { select: { id: true, name: true } } },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
      skip,
      take: Number(limit),
    }),
    prisma.supportTicket.count({ where }),
  ]);

  res.json({
    success: true,
    data: tickets,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
});

export const getSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      firm: { select: { id: true, name: true } },
      messages: { orderBy: { created_at: 'asc' } },
    },
  });

  if (!ticket) throw new AppError('Destek talebi bulunamadı', 404);

  res.json({ success: true, data: ticket });
});

export const createSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id, subject, description, category, priority = 'MEDIUM' } = req.body;

  if (!subject || !description) throw new AppError('Konu ve açıklama gerekli', 400);

  const ticket = await prisma.supportTicket.create({
    data: {
      firm_id: firm_id || null,
      subject,
      description,
      category: category || 'GENERAL',
      priority: priority as any,
      created_by: (req as any).user?.sub || 'system',
    },
  });

  res.status(201).json({ success: true, data: ticket, message: 'Destek talebi oluşturuldu' });
});

export const updateSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: updates,
  });

  res.json({ success: true, data: ticket, message: 'Destek talebi güncellendi' });
});

export const addTicketMessage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, sender_type = 'SUPPORT_AGENT' } = req.body;

  if (!content) throw new AppError('Mesaj içeriği gerekli', 400);

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new AppError('Destek talebi bulunamadı', 404);

  const message = await prisma.supportMessage.create({
    data: {
      ticket_id: id,
      sender_id: (req as any).user?.sub || 'system',
      sender_type: sender_type as any,
      sender_name: (req as any).user?.name || 'Admin',
      content,
    },
  });

  await prisma.supportTicket.update({
    where: { id },
    data: { last_reply_at: new Date(), message_count: { increment: 1 } },
  });

  res.status(201).json({ success: true, data: message });
});

export const closeSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating } = req.body;

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      status: 'RESOLVED',
      rating: rating || null,
    },
  });

  res.json({ success: true, data: ticket, message: 'Destek talebi kapatıldı' });
});

export const getTicketStats = asyncHandler(async (req: Request, res: Response) => {
  const [byStatus, byPriority, totalTickets] = await Promise.all([
    prisma.supportTicket.groupBy({ by: ['status'], _count: true }),
    prisma.supportTicket.groupBy({ by: ['priority'], _count: true }),
    prisma.supportTicket.count(),
  ]);

  res.json({
    success: true,
    data: {
      total: totalTickets,
      by_status: byStatus.map(s => ({ status: s.status, count: s._count })),
      by_priority: byPriority.map(p => ({ priority: p.priority, count: p._count })),
    },
  });
});

// ============================================
// FAQ Articles
// ============================================

export const listFaqArticles = asyncHandler(async (req: Request, res: Response) => {
  const { category, is_published, search, page = 1, limit = 20 } = req.query;

  const where: any = {};
  if (category) where.category = category;
  if (is_published !== undefined) where.is_published = is_published === 'true';
  if (search) {
    where.OR = [
      { title: { contains: search as string } },
      { content: { contains: search as string } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [articles, total] = await Promise.all([
    prisma.faqArticle.findMany({
      where,
      orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
      skip,
      take: Number(limit),
    }),
    prisma.faqArticle.count({ where }),
  ]);

  res.json({
    success: true,
    data: articles,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
});

export const getFaqArticle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const article = await prisma.faqArticle.findUnique({ where: { id } });
  if (!article) throw new AppError('FAQ makalesi bulunamadı', 404);

  await prisma.faqArticle.update({
    where: { id },
    data: { view_count: { increment: 1 } },
  });

  res.json({ success: true, data: article });
});

export const createFaqArticle = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id, title, slug, category, content, meta_title, meta_description, is_published = false, is_featured = false, sort_order = 0 } = req.body;

  if (!title || !content) throw new AppError('Başlık ve içerik gerekli', 400);

  const article = await prisma.faqArticle.create({
    data: {
      firm_id: firm_id || null,
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      category: category || 'GENERAL',
      content,
      meta_title,
      meta_description,
      is_published,
      is_featured,
      sort_order,
      created_by: (req as any).user?.sub || 'system',
    },
  });

  res.status(201).json({ success: true, data: article, message: 'FAQ makalesi oluşturuldu' });
});

export const updateFaqArticle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const article = await prisma.faqArticle.update({ where: { id }, data: updates });

  res.json({ success: true, data: article, message: 'FAQ makalesi güncellendi' });
});

export const deleteFaqArticle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.faqArticle.delete({ where: { id } });
  res.json({ success: true, message: 'FAQ makalesi silindi' });
});

export const reorderFaqArticles = asyncHandler(async (req: Request, res: Response) => {
  const { articles } = req.body;
  if (!articles || !Array.isArray(articles)) throw new AppError('Geçerli bir sıralama dizisi gerekli', 400);

  for (const item of articles) {
    await prisma.faqArticle.update({
      where: { id: item.id },
      data: { sort_order: item.sort_order },
    });
  }

  res.json({ success: true, message: 'Sıralama güncellendi' });
});

// ============================================
// Announcements
// ============================================

export const listAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const { type, priority, target_type, is_active, page = 1, limit = 20 } = req.query;

  const where: any = {};
  if (type) where.type = type;
  if (priority) where.priority = priority;
  if (target_type) where.target_type = target_type;
  if (is_active !== undefined) {
    where.is_active = is_active === 'true';
    if (is_active === 'true') {
      where.starts_at = { lte: new Date() };
      where.OR = [{ ends_at: null }, { ends_at: { gte: new Date() } }];
    }
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { starts_at: 'desc' }],
      skip,
      take: Number(limit),
    }),
    prisma.announcement.count({ where }),
  ]);

  res.json({
    success: true,
    data: announcements,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
});

export const getAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) throw new AppError('Duyuru bulunamadı', 404);

  res.json({ success: true, data: announcement });
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, type = 'INFO', priority = 'NORMAL', target_type = 'ALL', firm_ids, plan_filters, starts_at, ends_at, image_url, is_active = true, is_dismissible = true, action_url, action_label } = req.body;

  if (!title || !content) throw new AppError('Başlık ve içerik gerekli', 400);

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      type,
      priority,
      target_type,
      firm_ids: firm_ids || [],
      plan_filters: plan_filters || [],
      starts_at: starts_at ? new Date(starts_at) : new Date(),
      ends_at: ends_at ? new Date(ends_at) : null,
      image_url,
      is_active,
      is_dismissible,
      action_url,
      action_label,
      created_by: (req as any).user?.sub || 'system',
    },
  });

  res.status(201).json({ success: true, data: announcement, message: 'Duyuru oluşturuldu' });
});

export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      ...updates,
      starts_at: updates.starts_at ? new Date(updates.starts_at) : undefined,
      ends_at: updates.ends_at ? new Date(updates.ends_at) : undefined,
    },
  });

  res.json({ success: true, data: announcement, message: 'Duyuru güncellendi' });
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.announcementView.deleteMany({ where: { announcement_id: id } });
  await prisma.announcement.delete({ where: { id } });
  res.json({ success: true, message: 'Duyuru silindi' });
});

export const trackAnnouncementView = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id, firm_id } = req.body;

  await prisma.announcementView.create({
    data: { announcement_id: id, user_id: user_id || null, firm_id: firm_id || null },
  });

  res.json({ success: true, message: 'Görüntüleme kaydedildi' });
});

export const getActiveAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id } = req.query;
  const now = new Date();

  const where: any = {
    is_active: true,
    starts_at: { lte: now },
    OR: [{ ends_at: null }, { ends_at: { gte: now } }],
  };

  if (firm_id) {
    where.target_type = { in: ['ALL', 'SPECIFIC_FIRMS'] };
  } else {
    where.target_type = { in: ['ALL'] };
  }

  const announcements = await prisma.announcement.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { starts_at: 'desc' }],
    take: 10,
  });

  res.json({ success: true, data: announcements });
});

export const getAnnouncementStats = asyncHandler(async (req: Request, res: Response) => {
  const [total, active, totalViews, byType] = await Promise.all([
    prisma.announcement.count(),
    prisma.announcement.count({ where: { is_active: true, starts_at: { lte: new Date() } } }),
    prisma.announcementView.count(),
    prisma.announcement.groupBy({ by: ['type'], _count: true }),
  ]);

  res.json({
    success: true,
    data: {
      total,
      active,
      total_views: totalViews,
      by_type: byType.map(t => ({ type: t.type, count: t._count })),
    },
  });
});