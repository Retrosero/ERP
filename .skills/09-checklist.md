# Özellik Geliştirme Checklist

## Yeni Özellik Eklerken

### 1. Planlama
- [ ] Özellik gereksinimlerini belirle
- [ ] API endpoint'lerini tanımla
- [ ] Gerekli bileşenleri listele
- [ ] Sayfa/shablon oluştur

### 2. Kod Yapısı
```
src/
├── components/
│   └── feature/           # Yeni özellik bileşenleri
│       ├── FeatureCard.tsx
│       ├── FeatureForm.tsx
│       └── index.ts
├── pages/
│   └── FeaturePage.tsx    # Özellik sayfası
├── lib/
│   └── featureApi.ts       # API fonksiyonları (gerekirse)
└── types/
    └── feature.ts          # TypeScript tipleri
```

### 3. Checklist
- [ ] Tip tanımları yapıldı
- [ ] API entegrasyonu tamamlandı
- [ ] UI bileşenleri kullanıldı
- [ ] Form validasyonu eklendi
- [ ] Hata yönetimi yapıldı
- [ ] Loading state'ler eklendi
- [ ] Responsive tasarım
- [ ] Türkçe etiketler
- [ ] TypeScript hataları yok
- [ ] Build başarılı

## Test Checklist
- [ ] Manuel test edildi
- [ ] Farklı ekran boyutlarında test
- [ ] Error state'ler test edildi
- [ ] Empty state'ler test edildi
- [ ] Form validasyonları test edildi