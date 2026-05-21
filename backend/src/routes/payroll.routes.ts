import { Router } from 'express';
import { payrollController, salaryController, overtimeController, advanceController, equipmentController } from '../controllers/payroll.controller';

const router = Router();

// Payroll routes
router.get('/payrolls', (req, res) => payrollController.list(req, res));
router.get('/payrolls/:id', (req, res) => payrollController.get(req, res));
router.post('/payrolls/calculate', (req, res) => payrollController.calculate(req, res));
router.post('/payrolls/:id/approve', (req, res) => payrollController.approve(req, res));
router.post('/payrolls/:id/pay', (req, res) => payrollController.pay(req, res));
router.get('/payrolls/summary/:year/:month', (req, res) => payrollController.summary(req, res));

// Salary definition routes
router.get('/salaries', (req, res) => salaryController.list(req, res));
router.post('/salaries', (req, res) => salaryController.create(req, res));
router.put('/salaries/:id', (req, res) => salaryController.update(req, res));

// Overtime routes
router.get('/overtime', (req, res) => overtimeController.list(req, res));
router.post('/overtime', (req, res) => overtimeController.create(req, res));
router.post('/overtime/:id/approve', (req, res) => overtimeController.approve(req, res));
router.get('/overtime/report/:year/:month', (req, res) => overtimeController.report(req, res));

// Advance payment routes
router.get('/advances', (req, res) => advanceController.list(req, res));
router.post('/advances', (req, res) => advanceController.create(req, res));
router.post('/advances/:id/approve', (req, res) => advanceController.approve(req, res));
router.get('/advances/balance/:userId', (req, res) => advanceController.balance(req, res));

// Equipment routes
router.get('/equipment/categories', (req, res) => equipmentController.listCategories(req, res));
router.get('/equipment', (req, res) => equipmentController.listEquipment(req, res));
router.post('/equipment', (req, res) => equipmentController.create(req, res));
router.get('/assignments', (req, res) => equipmentController.listAssignments(req, res));
router.post('/assignments', (req, res) => equipmentController.assign(req, res));
router.post('/assignments/:id/return', (req, res) => equipmentController.return(req, res));
router.get('/assignments/user/:userId', (req, res) => equipmentController.userEquipment(req, res));

export default router;
