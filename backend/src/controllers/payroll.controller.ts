import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Validation schemas
const createSalarySchema = z.object({
  user_id: z.string().uuid(),
  base_salary: z.number().positive(),
  currency: z.string().default('TRY'),
  meal_allowance: z.number().min(0).default(0),
  transport_allowance: z.number().min(0).default(0),
  housing_allowance: z.number().min(0).default(0),
  other_allowances: z.number().min(0).default(0),
  work_hours_per_month: z.number().min(1).default(225),
  effective_date: z.string().or(z.date()).optional(),
});

const calculatePayrollSchema = z.object({
  period_year: z.number().min(2020).max(2100),
  period_month: z.number().min(1).max(12),
  user_ids: z.array(z.string().uuid()).optional(),
});

const approvePayrollSchema = z.object({
  notes: z.string().optional(),
});

const payPayrollSchema = z.object({
  payment_date: z.string().or(z.date()),
  payment_method: z.enum(['BANK_TRANSFER', 'CASH', 'CHECK']).optional(),
  payment_reference: z.string().optional(),
});

const createOvertimeSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(['WEEKDAY', 'WEEKEND', 'HOLIDAY', 'NIGHT', 'COMPENSATORY']),
  date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  hours: z.number().positive(),
  rate_multiplier: z.number().min(1).default(1.5),
  reason: z.string().optional(),
});

const approveOvertimeSchema = z.object({
  approved: z.boolean(),
  rejection_reason: z.string().optional(),
  is_paid: z.boolean().optional(),
});

const createAdvanceSchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().optional(),
  installments: z.number().min(1).max(12).optional(),
});

const approveAdvanceSchema = z.object({
  approved: z.boolean(),
  rejection_reason: z.string().optional(),
  payment_date: z.string().or(z.date()).optional(),
});

// Tax brackets for 2025 (annual income)
const TAX_BRACKETS = [
  { min: 0, max: 22000, rate: 0.15 },
  { min: 22000, max: 49000, rate: 0.20 },
  { min: 49000, max: 93000, rate: 0.27 },
  { min: 93000, max: 213000, rate: 0.35 },
  { min: 213000, max: Infinity, rate: 0.40 },
];

// Calculate income tax based on brackets
function calculateIncomeTax(annualGross: number): number {
  let tax = 0;
  let remaining = annualGross;
  
  for (const bracket of TAX_BRACKETS) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
  }
  
  return tax;
}

// Helper to calculate payroll for a user
async function calculateUserPayroll(
  firmId: string,
  userId: string,
  year: number,
  month: number
) {
  // Get salary definition
  const salaryDef = await prisma.salaryDefinition.findFirst({
    where: {
      firm_id: firmId,
      user_id: userId,
      is_active: true,
      effective_date: { lte: new Date(year, month - 1, 1) },
      OR: [{ end_date: null }, { end_date: { gte: new Date(year, month - 1, 1) } }],
    },
    orderBy: { effective_date: 'desc' },
  });

  if (!salaryDef) {
    throw new Error(`No salary definition found for user ${userId}`);
  }

  // Get attendance records for the period
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      firm_id: firmId,
      user_id: userId,
      check_in_time: { gte: periodStart, lte: periodEnd },
    },
  });

  // Calculate working days and overtime
  const workingDays = new Date(year, month, 0).getDate();
  const presentDays = new Set(attendanceRecords.map(r => 
    r.check_in_time?.toISOString().split('T')[0]
  )).size;
  
  const absenceDays = workingDays - presentDays;

  // Get overtime records
  const overtimeRecords = await prisma.overtimeRecord.findMany({
    where: {
      firm_id: firmId,
      user_id: userId,
      period_year: year,
      period_month: month,
      status: 'APPROVED',
    },
  });

  const overtimeHours = overtimeRecords.reduce((sum, r) => sum + Number(r.hours), 0);
  const weekendHours = overtimeRecords
    .filter(r => r.type === 'WEEKEND')
    .reduce((sum, r) => sum + Number(r.hours), 0);
  const holidayHours = overtimeRecords
    .filter(r => r.type === 'HOLIDAY')
    .reduce((sum, r) => sum + Number(r.hours), 0);

  // Calculate rates
  const baseSalary = Number(salaryDef.base_salary);
  const dailyRate = baseSalary / 30;
  const hourlyRate = baseSalary / salaryDef.work_hours_per_month;

  // Calculate earnings
  const mealAllowance = Number(salaryDef.meal_allowance);
  const transportAllowance = Number(salaryDef.transport_allowance);
  const housingAllowance = Number(salaryDef.housing_allowance);
  const otherAllowances = Number(salaryDef.other_allowances);

  // Overtime pay
  const overtimePay = overtimeHours * hourlyRate * Number(salaryDef.overtime_rate);
  const weekendPay = weekendHours * hourlyRate * Number(salaryDef.weekend_rate);
  const holidayPay = holidayHours * hourlyRate * Number(salaryDef.holiday_rate);

  // Total gross
  const grossSalary = baseSalary + mealAllowance + transportAllowance + 
                      housingAllowance + overtimePay + weekendPay + 
                      holidayPay + otherAllowances;

  // Calculate deductions
  const sgkEmployee = grossSalary * Number(salaryDef.sgk_rate);
  const unemploymentEmployee = grossSalary * Number(salaryDef.unemployment_rate);
  
  // Income tax (annual calculation)
  const annualGross = grossSalary * 12;
  const annualIncomeTax = calculateIncomeTax(annualGross);
  const monthlyIncomeTax = annualIncomeTax / 12;

  // Stamp duty
  const stampDuty = grossSalary * Number(salaryDef.stamp_duty_rate);

  const totalDeductions = sgkEmployee + unemploymentEmployee + monthlyIncomeTax + stampDuty;

  // Net salary
  const netSalary = grossSalary - totalDeductions;

  // Employer costs
  const sgkEmployer = grossSalary * 0.155;
  const unemploymentEmployer = grossSalary * 0.02;
  const totalCost = grossSalary + sgkEmployer + unemploymentEmployer;

  return {
    working_days: workingDays,
    actual_days: presentDays,
    absence_days: absenceDays,
    overtime_hours: overtimeHours,
    weekend_hours: weekendHours,
    holiday_hours: holidayHours,
    late_days: 0,
    base_salary: baseSalary,
    daily_rate: dailyRate,
    meal_allowance: mealAllowance,
    transport_allowance: transportAllowance,
    housing_allowance: housingAllowance,
    overtime_pay: overtimePay,
    weekend_pay: weekendPay,
    holiday_pay: holidayPay,
    other_earnings: otherAllowances,
    gross_salary: grossSalary,
    sgk_employee: sgkEmployee,
    unemployment_employee: unemploymentEmployee,
    income_tax: monthlyIncomeTax,
    stamp_duty: stampDuty,
    agi_deduction: 0,
    other_deductions: 0,
    total_deductions: totalDeductions,
    net_salary: netSalary,
    sgk_employer: sgkEmployer,
    unemployment_employer: unemploymentEmployer,
    total_cost: totalCost,
  };
}

// Payroll Controller
export const payrollController = {
  // List all payrolls
  async list(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { year, month, status, user_id } = req.query;

      const where: any = { firm_id: firmId };
      
      if (year) where.period_year = Number(year);
      if (month) where.period_month = Number(month);
      if (status) where.status = status;
      if (user_id) where.user_id = user_id;

      const payrolls = await prisma.payroll.findMany({
        where,
        include: {
          // User info would be joined via firm relation
        },
        orderBy: [{ period_year: 'desc' }, { period_month: 'desc' }],
      });

      res.json({ success: true, data: payrolls });
    } catch (error) {
      console.error('Payroll list error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch payrolls' });
    }
  },

  // Get payroll by ID
  async get(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { id } = req.params;

      const payroll = await prisma.payroll.findFirst({
        where: { id, firm_id: firmId },
      });

      if (!payroll) {
        return res.status(404).json({ success: false, error: 'Payroll not found' });
      }

      res.json({ success: true, data: payroll });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch payroll' });
    }
  },

  // Calculate payroll for a period
  async calculate(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const validated = calculatePayrollSchema.parse(req.body);
      const { period_year, period_month, user_ids } = validated;

      // Get period dates
      const periodStart = new Date(period_year, period_month - 1, 1);
      const periodEnd = new Date(period_year, period_month, 0, 23, 59, 59);

      // Get users to process
      let users;
      if (user_ids && user_ids.length > 0) {
        users = await prisma.user.findMany({
          where: { firm_id: firmId, id: { in: user_ids } },
        });
      } else {
        users = await prisma.user.findMany({
          where: { firm_id: firmId, is_active: true },
        });
      }

      const results= [];
      const errors = [];

      for (const user of users) {
        try {
          const calculation = await calculateUserPayroll(firmId, user.id, period_year, period_month);

          // Upsert payroll record
          const payroll = await prisma.payroll.upsert({
            where: {
              firm_id_user_id_period_year_period_month: {
                firm_id: firmId,
                user_id: user.id,
                period_year,
                period_month,
              },
            },
            update: {
              ...calculation,
              period_start: periodStart,
              period_end: periodEnd,
              status: 'CALCULATED',
              updated_at: new Date(),
            },
            create: {
              firm_id: firmId,
              user_id: user.id,
              period_year,
              period_month,
              period_start: periodStart,
              period_end: periodEnd,
              status: 'CALCULATED',
              ...calculation,
            },
          });

          results.push(payroll);
        } catch (err: any) {
          errors.push({ user_id: user.id, error: err.message });
        }
      }

      res.json({
        success: true,
        data: {
          processed: results.length,
          errors: errors.length,
          results,
          errors_detail: errors,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error('Calculate payroll error:', error);
      res.status(500).json({ success: false, error: 'Failed to calculate payroll' });
    }
  },

  // Approve payroll
  async approve(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const { notes } = approvePayrollSchema.parse(req.body);

      const payroll = await prisma.payroll.findFirst({
        where: { id, firm_id: firmId },
      });

      if (!payroll) {
        return res.status(404).json({ success: false, error: 'Payroll not found' });
      }

      if (payroll.status !== 'CALCULATED') {
        return res.status(400).json({ success: false, error: 'Payroll must be calculated before approval' });
      }

      const updated = await prisma.payroll.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approved_by: userId,
          approved_at: new Date(),
          notes: notes || payroll.notes,
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to approve payroll' });
    }
  },

  // Mark as paid
  async pay(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { id } = req.params;
      const validated = payPayrollSchema.parse(req.body);

      const payroll = await prisma.payroll.findFirst({
        where: { id, firm_id: firmId },
      });

      if (!payroll) {
        return res.status(404).json({ success: false, error: 'Payroll not found' });
      }

      if (payroll.status !== 'APPROVED') {
        return res.status(400).json({ success: false, error: 'Payroll must be approved before payment' });
      }

      const updated = await prisma.payroll.update({
        where: { id },
        data: {
          status: 'PAID',
          payment_date: new Date(validated.payment_date),
          payment_method: validated.payment_method,
          payment_reference: validated.payment_reference,
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to mark payroll as paid' });
    }
  },

  // Get period summary
  async summary(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { year, month } = req.params;

      const payrolls = await prisma.payroll.findMany({
        where: {
          firm_id: firmId,
          period_year: Number(year),
          period_month: Number(month),
        },
      });

      const summary = {
        total_employees: payrolls.length,
        total_gross: payrolls.reduce((sum, p) => sum + Number(p.gross_salary), 0),
        total_deductions: payrolls.reduce((sum, p) => sum + Number(p.total_deductions), 0),
        total_net: payrolls.reduce((sum, p) => sum + Number(p.net_salary), 0),
        total_cost: payrolls.reduce((sum, p) => sum + Number(p.total_cost), 0),
        by_status: {
          draft: payrolls.filter(p => p.status === 'DRAFT').length,
          calculated: payrolls.filter(p => p.status === 'CALCULATED').length,
          approved: payrolls.filter(p => p.status === 'APPROVED').length,
          paid: payrolls.filter(p => p.status === 'PAID').length,
        },
      };

      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get summary' });
    }
  },
};

// Salary Definition Controller
export const salaryController = {
  async list(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { user_id, active_only } = req.query;

      const where: any = { firm_id: firmId };
      if (user_id) where.user_id = user_id as string;
      if (active_only === 'true') where.is_active = true;

      const salaries = await prisma.salaryDefinition.findMany({
        where,
        orderBy: [{ user_id: 'asc' }, { effective_date: 'desc' }],
      });

      res.json({ success: true, data: salaries });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch salary definitions' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const validated = createSalarySchema.parse(req.body);

      const salary = await prisma.salaryDefinition.create({
        data: {
          firm_id: firmId,
          ...validated,
          hourly_rate: validated.base_salary / validated.work_hours_per_month,
          daily_rate: validated.base_salary / 30,
          effective_date: validated.effective_date ? new Date(validated.effective_date as any) : new Date(),
        },
      });

      res.status(201).json({ success: true, data: salary });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      res.status(500).json({ success: false, error: 'Failed to create salary definition' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { id } = req.params;
      const validated = createSalarySchema.partial().parse(req.body);

      const existing = await prisma.salaryDefinition.findFirst({
        where: { id, firm_id: firmId },
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Salary definition not found' });
      }

      // Deactivate old definition
      await prisma.salaryDefinition.update({
        where: { id },
        data: { is_active: false, end_date: new Date() },
      });

      // Create new active definition
      const updated = await prisma.salaryDefinition.create({
        data: {
          firm_id: firmId,
          user_id: validated.user_id || existing.user_id,
          base_salary: validated.base_salary ?? existing.base_salary,
          currency: validated.currency ?? existing.currency,
          meal_allowance: validated.meal_allowance ?? existing.meal_allowance,
          transport_allowance: validated.transport_allowance ?? existing.transport_allowance,
          housing_allowance: validated.housing_allowance ?? existing.housing_allowance,
          other_allowances: validated.other_allowances ?? existing.other_allowances,
          work_hours_per_month: validated.work_hours_per_month ?? existing.work_hours_per_month,
          effective_date: new Date(),
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update salary definition' });
    }
  },
};

// Overtime Controller
export const overtimeController = {
  async list(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { year, month, status, user_id } = req.query;

      const where: any = { firm_id: firmId };
      if (year) where.period_year = Number(year);
      if (month) where.period_month = Number(month);
      if (status) where.status = status;
      if (user_id) where.user_id = user_id;

      const records = await prisma.overtimeRecord.findMany({
        where,
        orderBy: [{ date: 'desc' }, { start_time: 'desc' }],
      });

      res.json({ success: true, data: records });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch overtime records' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const validated = createOvertimeSchema.parse(req.body);

      const date = new Date(validated.date);
      const periodYear = date.getFullYear();
      const periodMonth = date.getMonth() + 1;

      // Get hourly rate from salary definition
      const salaryDef = await prisma.salaryDefinition.findFirst({
        where: { firm_id: firmId, user_id: validated.user_id, is_active: true },
      });

      if (!salaryDef) {
        return res.status(400).json({ success: false, error: 'No salary definition found for user' });
      }

      const hourlyRate = Number(salaryDef.base_salary) / Number(salaryDef.work_hours_per_month);
      const totalAmount = validated.hours * hourlyRate * validated.rate_multiplier;

      const record = await prisma.overtimeRecord.create({
        data: {
          firm_id: firmId,
          user_id: validated.user_id,
          period_year: periodYear,
          period_month: periodMonth,
          type: validated.type,
          date: date,
          start_time: validated.start_time,
          end_time: validated.end_time,
          hours: validated.hours,
          rate_multiplier: validated.rate_multiplier,
          hourly_rate: hourlyRate,
          total_amount: totalAmount,
          reason: validated.reason,
          status: 'PENDING',
        },
      });

      res.status(201).json({ success: true, data: record });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      res.status(500).json({ success: false, error: 'Failed to create overtime record' });
    }
  },

  async approve(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const { approved, rejection_reason, is_paid } = approveOvertimeSchema.parse(req.body);

      const record = await prisma.overtimeRecord.findFirst({
        where: { id, firm_id: firmId },
      });

      if (!record) {
        return res.status(404).json({ success: false, error: 'Overtime record not found' });
      }

      const updated = await prisma.overtimeRecord.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'REJECTED',
          approved_by: userId,
          approved_at: new Date(),
          rejection_reason: approved ? undefined : rejection_reason,
          is_paid: approved && is_paid ? true : record.is_paid,
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to approve overtime' });
    }
  },

  async report(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { year, month } = req.params;

      const records = await prisma.overtimeRecord.findMany({
        where: {
          firm_id: firmId,
          period_year: Number(year),
          period_month: Number(month),
        },
      });

      const summary = {
        total_records: records.length,
        total_hours: records.reduce((sum, r) => sum + Number(r.hours), 0),
        total_amount: records.reduce((sum, r) => sum + Number(r.total_amount), 0),
        by_type: {
          WEEKDAY: records.filter(r => r.type === 'WEEKDAY').length,
          WEEKEND: records.filter(r => r.type === 'WEEKEND').length,
          HOLIDAY: records.filter(r => r.type === 'HOLIDAY').length,
          NIGHT: records.filter(r => r.type === 'NIGHT').length,
          COMPENSATORY: records.filter(r => r.type === 'COMPENSATORY').length,
        },
        by_status: {
          PENDING: records.filter(r => r.status === 'PENDING').length,
          APPROVED: records.filter(r => r.status === 'APPROVED').length,
          REJECTED: records.filter(r => r.status === 'REJECTED').length,
          PAID: records.filter(r => r.status === 'PAID').length,
        },
      };

      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to generate overtime report' });
    }
  },
};

// Advance Payment Controller
export const advanceController = {
  async list(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { status, user_id } = req.query;

      const where: any = { firm_id: firmId };
      if (status) where.status = status;
      if (user_id) where.user_id = user_id;

      const advances = await prisma.advancePayment.findMany({
        where,
        orderBy: { request_date: 'desc' },
      });

      res.json({ success: true, data: advances });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch advance payments' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const validated = createAdvanceSchema.parse(req.body);

      const advance = await prisma.advancePayment.create({
        data: {
          firm_id: firmId,
          user_id: validated.user_id,
          amount: validated.amount,
          requested_amount: validated.amount,
          reason: validated.reason,
          remaining_amount: validated.amount,
          remaining_balance: validated.amount,
          status: 'PENDING',
          total_installments: validated.installments || 1,
        },
      });

      res.status(201).json({ success: true, data: advance });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      res.status(500).json({ success: false, error: 'Failed to create advance payment' });
    }
  },

  async approve(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const { approved, rejection_reason, payment_date } = approveAdvanceSchema.parse(req.body);

      const advance = await prisma.advancePayment.findFirst({
        where: { id, firm_id: firmId },
      });

      if (!advance) {
        return res.status(404).json({ success: false, error: 'Advance payment not found' });
      }

      const updated = await prisma.advancePayment.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'REJECTED',
          approved_by: userId,
          approved_at: new Date(),
          rejection_reason: approved ? undefined : rejection_reason,
          payment_date: approved && payment_date ? new Date(payment_date) : undefined,
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to approve advance' });
    }
  },

  async balance(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { userId } = req.params;

      const advances = await prisma.advancePayment.findMany({
        where: {
          firm_id: firmId,
          user_id: userId,
          status: { in: ['APPROVED', 'PARTIAL'] },
        },
      });

      const totalBalance = advances.reduce((sum, a) => sum + Number(a.remaining_balance || 0), 0);

      res.json({
        success: true,
        data: {
          user_id: userId,
          total_balance: totalBalance,
          active_advances: advances.length,
          advances,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get advance balance' });
    }
  },
};

// Equipment Controller
export const equipmentController = {
  async listCategories(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;

      const categories = await prisma.equipmentCategory.findMany({
        where: { firm_id: firmId, is_active: true },
        include: { equipment: true },
      });

      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
  },

  async listEquipment(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { category_id, status } = req.query;

      const where: any = { firm_id: firmId };
      if (category_id) where.category_id = category_id as string;
      if (status) where.status = status;

      const equipment = await prisma.equipment.findMany({
        where,
        include: { category: true },
      });

      res.json({ success: true, data: equipment });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch equipment' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { category_id, name, brand, model, serial_number, barcode, description } = req.body;

      const equipment = await prisma.equipment.create({
        data: {
          firm_id: firmId,
          category_id,
          name,
          brand,
          model,
          serial_number,
          barcode,
          description,
        },
      });

      res.status(201).json({ success: true, data: equipment });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create equipment' });
    }
  },

  async listAssignments(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { status, user_id } = req.query;

      const where: any = { firm_id: firmId };
      if (status) where.status = status;
      if (user_id) where.user_id = user_id as string;

      const assignments = await prisma.equipmentAssignment.findMany({
        where,
        include: { equipment: { include: { category: true } } },
      });

      res.json({ success: true, data: assignments });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
    }
  },

  async assign(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { equipment_id, user_id, notes, condition } = req.body;

      // Update equipment status
      await prisma.equipment.update({
        where: { id: equipment_id },
        data: { status: 'ASSIGNED' },
      });

      const assignment = await prisma.equipmentAssignment.create({
        data: {
          firm_id: firmId,
          equipment_id,
          user_id,
          condition_when_issued: condition || 'NEW',
          notes,
          status: 'ACTIVE',
        },
      });

      res.status(201).json({ success: true, data: assignment });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create assignment' });
    }
  },

  async return(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { id } = req.params;
      const { condition, notes } = req.body;

      const assignment = await prisma.equipmentAssignment.findFirst({
        where: { id, firm_id: firmId },
      });

      if (!assignment) {
        return res.status(404).json({ success: false, error: 'Assignment not found' });
      }

      // Update assignment
      const updated = await prisma.equipmentAssignment.update({
        where: { id },
        data: {
          status: 'RETURNED',
          return_date: new Date(),
          condition_when_returned: condition,
          return_notes: notes,
        },
      });

      // Update equipment status
      await prisma.equipment.update({
        where: { id: assignment.equipment_id },
        data: { status: 'AVAILABLE' },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to process return' });
    }
  },

  async userEquipment(req: Request, res: Response) {
    try {
      const firmId = (req as any).firm?.id;
      const { userId } = req.params;

      const assignments = await prisma.equipmentAssignment.findMany({
        where: {
          firm_id: firmId,
          user_id: userId,
          status: 'ACTIVE',
        },
        include: { equipment: { include: { category: true } } },
      });

      res.json({ success: true, data: assignments });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch user equipment' });
    }
  },
};
