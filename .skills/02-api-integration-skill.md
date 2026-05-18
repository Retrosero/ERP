# Skill — Dolibarr API Entegrasyonu

Standart akış: Frontend -> Backend API -> Dolibarr Service -> Dolibarr REST API.

Servisler: dolibarrClient, customerService, productService, orderService, invoiceService, paymentService, stockService, proposalService, warehouseService, reportService.

Dolibarr client base URL, API key, timeout, hata yakalama, response normalize etme ve loglama sorumluluğunu taşır.
