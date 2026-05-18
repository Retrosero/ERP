# Dolibarr API Mapping

Dolibarr’dan gelen ham veri doğrudan UI’a basılmamalı; mapping katmanından geçirilmelidir.

| Dolibarr Verisi | Uygulama Modeli |
|---|---|
| Thirdparty | Customer |
| Product | Product |
| Stock | StockInfo |
| Customer Order | SalesOrder |
| Proposal | Proposal |
| Invoice | Invoice |
| Payment | Payment |
| Warehouse | Warehouse |
| Bank Account | CashAccount |

## Standart Hata
```json
{ "success": false, "message": "Dolibarr bağlantısı kurulamadı.", "code": "DOLIBARR_CONNECTION_ERROR" }
```
