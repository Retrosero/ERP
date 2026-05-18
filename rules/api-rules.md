# API Kuralları

- Frontend sadece kendi backend API endpointlerini çağırır.
- Backend, Dolibarr API’ye proxy/service katmanı üzerinden bağlanır.
- Her API route rol kontrolünden geçmelidir.
- Hata cevapları standart formatta olmalıdır.
- Pagination desteklenmelidir.
- Teknik hata detayları loglanmalı, kullanıcıya sade mesaj dönülmelidir.
- API key frontend’e asla dönülmemelidir.

## Başarılı Cevap
```json
{ "success": true, "data": {} }
```

## Hatalı Cevap
```json
{ "success": false, "message": "Dolibarr bağlantısı kurulamadı.", "code": "DOLIBARR_CONNECTION_ERROR" }
```
