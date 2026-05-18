# Dolibarr Panel - Skills Kılavuzu

Geliştirme sürecinde size yardımcı olacak skill dosyaları.

## Dosyalar

| Dosya | Açıklama |
|--------|----------|
| `01-proje-bakisi.md` | Proje yapısı, teknolojiler, sayfalar |
| `02-dolibarr-api.md` | Dolibarr API entegrasyonu ve endpoint'ler |
| `03-bilesenler.md` | UI ve Layout bileşen kullanımı |
| `04-sayfalar.md` | Sayfa oluşturma şablonları |
| `05-en-iyi-uygulamalar.md` | TypeScript, React, CSS best practices |
| `06-sik-gorevler.md` | Yaygın görevler için kod örnekleri |
| `07-hata-ayiklama.md` | Hata giderme ve debug rehberi |
| `08-deployment.md` | Deployment ve DevOps rehberi |

## Hızlı Başlangıç

```bash
# Geliştirme
pnpm dev

# Production build
pnpm build

# Deployment
pnpm deploy
```

## Örnek: Müşteri Ekleme

```typescript
import { api } from '@/lib/dolibarr';

await api.thirdParty.create({
  name: 'Firma Adı',
  email: 'info@firma.com',
  client: 1,
});
```

## Önemli Bağlantılar

- Dolibarr API: `src/lib/dolibarr.ts`
- Bileşenler: `src/components/ui/`
- Sayfalar: `src/pages/`

---

Geliştirme için tüm dokümantasyon `.skills/` klasöründe.