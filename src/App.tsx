import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { ApiProvider } from '@/contexts/ApiContext';
import {
  Dashboard,
  Musteriler,
  Urunler,
  Siparisler,
  Teklifler,
  Faturalar,
  Tahsilatlar,
  Stok,
  Ayarlar,
  NakitYonetimi,
  CekSenet,
  Giderler,
  RaporMerkezi,
  Yonetim,
  Sirketler,
  EFatura,
  HizliSatis,
  YeniUrun,
  UrunDetay,
  YeniMusteri,
  MusteriDetay,
  YeniTahsilat,
  TahsilatDetay,
  YeniTediye,
  TediyeDetay,
  YeniAlisFaturasi,
  AlisFaturaDetay,
  YeniTeklif,
  TeklifDetay,
  YeniSiparis,
  SiparisDetay,
  BarkodBaski,
  Depolar,
  FiyatListeleri,
  KarMarjiAnalizi,
  TekrarEdenSiparisler,
  Bildirimler,
  TermalBaski,
  KargoTakip,
} from '@/pages';

function App() {
  return (
    <BrowserRouter>
      <ApiProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="musteriler" element={<Musteriler />} />
            <Route path="musteriler/yeni" element={<YeniMusteri />} />
            <Route path="musteriler/:id" element={<MusteriDetay />} />
            <Route path="musteriler/:id/duzenle" element={<YeniMusteri />} />
            <Route path="urunler" element={<Urunler />} />
            <Route path="urunler/yeni" element={<YeniUrun />} />
            <Route path="urunler/:id" element={<UrunDetay />} />
            <Route path="urunler/:id/duzenle" element={<YeniUrun />} />
            <Route path="siparisler" element={<Siparisler />} />
            <Route path="siparisler/yeni" element={<YeniSiparis />} />
            <Route path="siparisler/:id" element={<SiparisDetay />} />
            <Route path="siparisler/:id/duzenle" element={<YeniSiparis />} />
            <Route path="teklifler" element={<Teklifler />} />
            <Route path="teklifler/yeni" element={<YeniTeklif />} />
            <Route path="teklifler/:id" element={<TeklifDetay />} />
            <Route path="teklifler/:id/duzenle" element={<YeniTeklif />} />
            <Route path="faturalar" element={<Faturalar />} />
            <Route path="faturalar/yeni" element={<YeniAlisFaturasi />} />
            <Route path="faturalar/:id" element={<AlisFaturaDetay />} />
            <Route path="faturalar/:id/duzenle" element={<YeniAlisFaturasi />} />
            <Route path="tahsilatlar" element={<Tahsilatlar />} />
            <Route path="tahsilatlar/yeni" element={<YeniTahsilat />} />
            <Route path="tahsilatlar/:id" element={<TahsilatDetay />} />
            <Route path="tediye/yeni" element={<YeniTediye />} />
            <Route path="tediye/:id" element={<TediyeDetay />} />
            <Route path="tediye/:id/duzenle" element={<YeniTediye />} />
            <Route path="stok" element={<Stok />} />
            <Route path="stok/yeni" element={<Stok />} />
            <Route path="ayarlar" element={<Ayarlar />} />
            <Route path="hizli-satis" element={<HizliSatis />} />
            {/* Yeni Modüller */}
            <Route path="nakit-yonetimi" element={<NakitYonetimi />} />
            <Route path="cek-senet" element={<CekSenet />} />
            <Route path="giderler" element={<Giderler />} />
            <Route path="rapor-merkezi" element={<RaporMerkezi />} />
            <Route path="yonetim" element={<Yonetim />} />
            <Route path="sirketler" element={<Sirketler />} />
            <Route path="e-fatura" element={<EFatura />} />
            <Route path="barkod-baski" element={<BarkodBaski />} />
            <Route path="depolar" element={<Depolar />} />
            <Route path="fiyat-listeleri" element={<FiyatListeleri />} />
            <Route path="kar-marji-analizi" element={<KarMarjiAnalizi />} />
            <Route path="tekrar-eden-siparisler" element={<TekrarEdenSiparisler />} />
            <Route path="bildirimler" element={<Bildirimler />} />
            <Route path="termal-baski" element={<TermalBaski />} />
            <Route path="kargo-takip" element={<KargoTakip />} />
          </Route>
        </Routes>
      </ApiProvider>
    </BrowserRouter>
  );
}

export default App;