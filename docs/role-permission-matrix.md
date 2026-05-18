# Rol ve Yetki Matrisi

| Modül | SUPER_ADMIN | COMPANY_ADMIN | SALES_USER | WAREHOUSE_USER | ACCOUNTING_USER | VIEWER |
|---|---|---|---|---|---|---|
| Dashboard | Tüm firmalar | Firma geneli | Kendi satışları | Depo işleri | Tahsilat/finans | Görüntüleme |
| Cari | Tam | Tam | Görür/Kullanır | Görmez | Tam | Sadece görür |
| Ürün | Tam | Tam | Görür | Stok görür | Sınırlı | Sadece görür |
| Fiyat | Tam | Tam | Görür | Görmez | Görür | Sınırlı |
| Stok | Tam | Tam | Görür | Tam | Görür | Sadece görür |
| Sipariş | Tam | Tam | Oluşturur | Hazırlar | Görür | Sadece görür |
| Teklif | Tam | Tam | Oluşturur | Görmez | Görür | Sadece görür |
| Fatura | Tam | Tam | Sınırlı | Görmez | Tam | Sadece görür |
| Tahsilat | Tam | Tam | Sınırlı | Görmez | Tam | Sadece görür |
| Depo | Tam | Tam | Görür | Tam | Görmez | Sadece görür |
| Raporlar | Tam | Tam | Kendi verisi | Depo raporu | Finans raporu | Sınırlı |
| Ayarlar | Tam | Tam | Görmez | Görmez | Görmez | Görmez |

Depocu fiyat, cari bakiye ve tahsilat bilgisi göremez. Viewer hiçbir kayıt oluşturamaz.
