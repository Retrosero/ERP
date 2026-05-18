import { Router, Request, Response } from 'express';
import { dolibarrProxy } from '../services/dolibarrProxy';
import logger from '../services/logger';

const router = Router();

// Utility function to handle proxy requests
async function proxyRequest(
  req: Request,
  res: Response,
  method: 'get' | 'post' | 'put' | 'delete',
  dolibarrEndpoint: string,
  bodyData?: Record<string, any>
) {
  try {
    let result;

    switch (method) {
      case 'get':
        result = await dolibarrProxy.get(dolibarrEndpoint, req.query as Record<string, any>);
        break;
      case 'post':
        result = await dolibarrProxy.post(dolibarrEndpoint, bodyData || req.body);
        break;
      case 'put':
        result = await dolibarrProxy.put(dolibarrEndpoint, bodyData || req.body);
        break;
      case 'delete':
        result = await dolibarrProxy.delete(dolibarrEndpoint);
        break;
    }

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.statusCode || 500).json({
        error: result.error,
        success: false,
      });
    }
  } catch (error: any) {
    logger.error(`Proxy error: ${error.message}`);
    res.status(500).json({
      error: 'Internal server error',
      success: false,
    });
  }
}

// ==================== THIRDPARTIES (Müşteriler/Tedarikçiler) ====================

// List third parties
router.get('/thirdparties', async (req, res) => {
  await proxyRequest(req, res, 'get', 'thirdparties', req.query);
});

// Get third party by ID
router.get('/thirdparties/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `thirdparties/${req.params.id}`);
});

// Create third party
router.post('/thirdparties', async (req, res) => {
  await proxyRequest(req, res, 'post', 'thirdparties', req.body);
});

// Update third party
router.put('/thirdparties/:id', async (req, res) => {
  await proxyRequest(req, res, 'put', `thirdparties/${req.params.id}`, req.body);
});

// Delete third party
router.delete('/thirdparties/:id', async (req, res) => {
  await proxyRequest(req, res, 'delete', `thirdparties/${req.params.id}`);
});

// ==================== PRODUCTS (Ürünler) ====================

// List products
router.get('/products', async (req, res) => {
  await proxyRequest(req, res, 'get', 'products', req.query);
});

// Get product by ID
router.get('/products/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `products/${req.params.id}`);
});

// Create product
router.post('/products', async (req, res) => {
  await proxyRequest(req, res, 'post', 'products', req.body);
});

// Update product
router.put('/products/:id', async (req, res) => {
  await proxyRequest(req, res, 'put', `products/${req.params.id}`, req.body);
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  await proxyRequest(req, res, 'delete', `products/${req.params.id}`);
});

// Get product stock
router.get('/products/:id/stock', async (req, res) => {
  await proxyRequest(req, res, 'get', `products/${req.params.id}/stock`);
});

// ==================== ORDERS (Siparişler) ====================

// List orders
router.get('/orders', async (req, res) => {
  await proxyRequest(req, res, 'get', 'orders', req.query);
});

// Get order by ID
router.get('/orders/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `orders/${req.params.id}`);
});

// Create order
router.post('/orders', async (req, res) => {
  await proxyRequest(req, res, 'post', 'orders', req.body);
});

// Update order
router.put('/orders/:id', async (req, res) => {
  await proxyRequest(req, res, 'put', `orders/${req.params.id}`, req.body);
});

// Delete order
router.delete('/orders/:id', async (req, res) => {
  await proxyRequest(req, res, 'delete', `orders/${req.params.id}`);
});

// Validate order
router.post('/orders/:id/validate', async (req, res) => {
  await proxyRequest(req, res, 'post', `orders/${req.params.id}/validate`, req.body);
});

// ==================== PROPOSALS (Teklifler) ====================

// List proposals
router.get('/proposals', async (req, res) => {
  await proxyRequest(req, res, 'get', 'proposals', req.query);
});

// Get proposal by ID
router.get('/proposals/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `proposals/${req.params.id}`);
});

// Create proposal
router.post('/proposals', async (req, res) => {
  await proxyRequest(req, res, 'post', 'proposals', req.body);
});

// Update proposal
router.put('/proposals/:id', async (req, res) => {
  await proxyRequest(req, res, 'put', `proposals/${req.params.id}`, req.body);
});

// Delete proposal
router.delete('/proposals/:id', async (req, res) => {
  await proxyRequest(req, res, 'delete', `proposals/${req.params.id}`);
});

// Validate proposal
router.post('/proposals/:id/validate', async (req, res) => {
  await proxyRequest(req, res, 'post', `proposals/${req.params.id}/validate`, req.body);
});

// ==================== INVOICES (Faturalar) ====================

// List invoices
router.get('/invoices', async (req, res) => {
  await proxyRequest(req, res, 'get', 'invoices', req.query);
});

// Get invoice by ID
router.get('/invoices/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `invoices/${req.params.id}`);
});

// Create invoice
router.post('/invoices', async (req, res) => {
  await proxyRequest(req, res, 'post', 'invoices', req.body);
});

// Update invoice
router.put('/invoices/:id', async (req, res) => {
  await proxyRequest(req, res, 'put', `invoices/${req.params.id}`, req.body);
});

// Delete invoice
router.delete('/invoices/:id', async (req, res) => {
  await proxyRequest(req, res, 'delete', `invoices/${req.params.id}`);
});

// Validate invoice
router.post('/invoices/:id/validate', async (req, res) => {
  await proxyRequest(req, res, 'post', `invoices/${req.params.id}/validate`, req.body);
});

// ==================== PAYMENTS (Tahsilatlar/Tedarik Ödemeleri) ====================

// List payments
router.get('/payments', async (req, res) => {
  await proxyRequest(req, res, 'get', 'payments', req.query);
});

// Get payment by ID
router.get('/payments/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `payments/${req.params.id}`);
});

// Create payment
router.post('/payments', async (req, res) => {
  await proxyRequest(req, res, 'post', 'payments', req.body);
});

// ==================== STOCK (Stok Hareketleri) ====================

// List stock movements
router.get('/stockmovements', async (req, res) => {
  await proxyRequest(req, res, 'get', 'stockmovements', req.query);
});

// Create stock movement
router.post('/stockmovements', async (req, res) => {
  await proxyRequest(req, res, 'post', 'stockmovements', req.body);
});

// ==================== CATEGORIES (Kategoriler) ====================

// List categories
router.get('/categories', async (req, res) => {
  await proxyRequest(req, res, 'get', 'categories', req.query);
});

// Get category by ID
router.get('/categories/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `categories/${req.params.id}`);
});

// ==================== USERS (Kullanıcılar) ====================

// List users
router.get('/users', async (req, res) => {
  await proxyRequest(req, res, 'get', 'users', req.query);
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `users/${req.params.id}`);
});

// ==================== PROJECTS (Projeler) ====================

// List projects
router.get('/projects', async (req, res) => {
  await proxyRequest(req, res, 'get', 'projects', req.query);
});

// Get project by ID
router.get('/projects/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `projects/${req.params.id}`);
});

// ==================== BANK ACCOUNTS (Banka Hesapları) ====================

// List bank accounts
router.get('/bankaccounts', async (req, res) => {
  await proxyRequest(req, res, 'get', 'bankaccounts', req.query);
});

// Get bank account by ID
router.get('/bankaccounts/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `bankaccounts/${req.params.id}`);
});

// ==================== EXPENSE REPORTS (Giderler) ====================

// List expense reports
router.get('/expensereports', async (req, res) => {
  await proxyRequest(req, res, 'get', 'expensereports', req.query);
});

// Get expense report by ID
router.get('/expensereports/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `expensereports/${req.params.id}`);
});

// ==================== WAREHOUSES (Depolar) ====================

// List warehouses
router.get('/warehouses', async (req, res) => {
  await proxyRequest(req, res, 'get', 'warehouses', req.query);
});

// Get warehouse by ID
router.get('/warehouses/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `warehouses/${req.params.id}`);
});

// Create warehouse
router.post('/warehouses', async (req, res) => {
  await proxyRequest(req, res, 'post', 'warehouses', req.body);
});

// ==================== CONTACT / ADDRESS (İletişim) ====================

// List contacts
router.get('/contacts', async (req, res) => {
  await proxyRequest(req, res, 'get', 'contacts', req.query);
});

// Get contact by ID
router.get('/contacts/:id', async (req, res) => {
  await proxyRequest(req, res, 'get', `contacts/${req.params.id}`);
});

// Create contact
router.post('/contacts', async (req, res) => {
  await proxyRequest(req, res, 'post', 'contacts', req.body);
});

// ==================== COMPANIES (Şirket Bilgileri) ====================

// Get company info
router.get('/setup/dictionary/company', async (req, res) => {
  await proxyRequest(req, res, 'get', 'setup/dictionary/company');
});

// ==================== HEALTH CHECK ====================

router.get('/health', async (req, res) => {
  const result = await dolibarrProxy.get('status');
  res.json({
    status: result.success ? 'ok' : 'error',
    dolibarr: result.success ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

export default router;