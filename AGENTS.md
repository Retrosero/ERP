# AGENTS.md

Bu proje Dolibarr ERP altyapısı üzerine geliştirilen modern Türkçe satış, stok, cari, sipariş, tahsilat, depo ve raporlama panelidir.

## Her Göreve Başlamadan Önce Okunacak Dosyalar
1. `/docs/project-overview.md`
2. `/docs/module-map.md`
3. `/docs/role-permission-matrix.md`
4. `/docs/mvp-scope.md`
5. `/rules/coding-rules.md`
6. `/rules/dolibarr-rules.md`
7. `/rules/api-rules.md`
8. `/rules/permission-rules.md`
9. İlgili modülün `/skills/*.md` dosyası

## Temel Kurallar
- Dolibarr çekirdeğine dokunma.
- Dolibarr veritabanına doğrudan yazma yapma.
- Yazma işlemlerinde mümkün olduğunca Dolibarr REST API kullan.
- API key frontend’e çıkmasın.
- Tüm kullanıcı arayüzü Türkçe olsun.
- Rol bazlı yetkilendirme zorunludur.
- Depocu fiyat ve cari bakiye bilgisi görmemelidir.
- Muhasebe depo operasyonlarını sınırlı görmelidir.
- Satış personeli sistem ayarlarını göremez.
- Teknik hata detayları kullanıcıya doğrudan gösterilmemelidir.
- Kullanıcı dostu Türkçe hata mesajları kullanılmalıdır.
- Kod modüler, okunabilir ve büyüyebilir olmalıdır.
- Mobil ve tablet uyumluluk her ekranda dikkate alınmalıdır.

## Görev Tamamlama Standardı
Her görev sonunda şunları raporla:
- Hangi dosyalar oluşturuldu veya değiştirildi?
- Hangi modül etkilendi?
- Hangi API servisleri kullanıldı?
- Hangi rol/yetki kontrolleri eklendi?
- Hangi testler yapıldı?
- Bilinen eksik veya risk var mı?
- Sonraki önerilen adım nedir?
