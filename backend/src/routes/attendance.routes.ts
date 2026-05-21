import { Router } from 'express';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  checkIn,
  checkOut,
  quickCheckOut,
  listAttendance,
  getTodayAttendance,
  getUserAttendance,
  approveAttendance,
  getAttendanceSummary,
  bulkAttendance,
  bulkCheckIn,
  bulkCheckOut,
} from '../controllers/attendance.controller';

const router = Router();

// ============================================
// Attendance Routes - Personel Giriş-Çıkış
// ============================================

// Check In - Giriş
router.post('/checkin', validateBody, checkIn);

// Check Out - Çıkış
router.post('/checkout', validateBody, checkOut);

// Quick Check Out - Hızlı Çıkış
router.post('/quick-checkout', quickCheckOut);

// Bulk Attendance - Toplu Giriş-Çıkış
router.post('/bulk', validateBody, bulkAttendance);

// Bulk Check In - Sadece Giriş
router.post('/bulk-checkin', validateBody, bulkCheckIn);

// Bulk Check Out - Sadece Çıkış
router.post('/bulk-checkout', validateBody, bulkCheckOut);

// List Attendance - Kayıtları Listele
router.get('/', getAttendanceSummary); // summary route
router.get('/records', listAttendance);

// Today's Attendance - Bugünkü Durum
router.get('/today', getTodayAttendance);

// User Attendance - Kullanıcının Kayıtları
router.get('/user/:userId', getUserAttendance);

// Approve/Reject - Onayla/Reddet
router.post('/approve', validateBody, approveAttendance);

// Summary - Özet Rapor
router.get('/summary', getAttendanceSummary);

export default router;