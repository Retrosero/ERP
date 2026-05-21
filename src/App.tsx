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
  BarkodTarama,
  // İnsan Kaynakları
  PersonelListesi,
  PersonelDetay,
  YeniPersonel,
  PersonelGirisCikis,
  IzinTalepleri,
  YeniIzinTalebi,
  IzinDetay,
  IsIlanlari,
  YeniIsIlani,
  IlanDetay,
  AdayListesi,
  AdayDetay,
  HarcamaRaporlari,
  HarcamaDetay,
  IzinBakiyesi,
  Projeler,
  ProjeDetay,
  // Faz 8: Dashboard ve Raporlama
  PerformansDashboard,
  SatisAnalitik,
  IKAnalitik,
  // Faz 9: Takvim ve Randevular
  EtkinlikTakvimi,
  Hatirlaticilar,
  // Faz 10: Entegrasyonlar ve Otomasyon
  Webhooks,
  APIGateway,
  // Super Admin
  SuperAdminPanel,
  // Faz 11: Maaş ve Bordro (YENİ)
  BordroListesi,
  MesaiTalepleri,
  AvansYonetimi,
  ZimmetYonetimi,
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
            {/* Barkod Tarama */}
            <Route path="barkod-tarama" element={<BarkodTarama />} />
            {/* İnsan Kaynakları */}
            <Route path="personel" element={<PersonelListesi />} />
            <Route path="personel/yeni" element={<YeniPersonel />} />
            <Route path="personel/:id" element={<PersonelDetay />} />
            <Route path="personel/:id/duzenle" element={<YeniPersonel />} />
            <Route path="personel-giris-cikis" element={<PersonelGirisCikis />} />
            <Route path="izin-talepleri" element={<IzinTalepleri />} />
            <Route path="izin-talepleri/yeni" element={<YeniIzinTalebi />} />
            <Route path="izin-talepleri/:id" element={<IzinDetay />} />
            <Route path="harcama-raporlari" element={<HarcamaRaporlari />} />
            <Route path="harcama-raporlari/yeni" element={<HarcamaDetay />} />
            <Route path="harcama-raporlari/:id" element={<HarcamaDetay />} />
            <Route path="izin-bakiyesi" element={<IzinBakiyesi />} />
            {/* İşe Alım */}
            <Route path="ise-alim" element={<IsIlanlari />} />
            <Route path="ise-alim/ilan/yeni" element={<YeniIsIlani />} />
            <Route path="ise-alim/ilan/:id" element={<IlanDetay />} />
            <Route path="ise-alim/ilan/:id/duzenle" element={<YeniIsIlani />} />
            <Route path="ise-alim/adaylar" element={<AdayListesi />} />
            <Route path="ise-alim/aday/yeni" element={<AdayDetay />} />
            <Route path="ise-alim/aday/:id" element={<AdayDetay />} />
            {/* Faz 7: Proje Yönetimi */}
            <Route path="projeler" element={<Projeler />} />
            <Route path="projeler/yeni" element={<ProjeDetay />} />
            <Route path="projeler/:id" element={<ProjeDetay />} />
            {/* Faz 8: Dashboard ve Raporlama */}
            <Route path="dashboard" element={<PerformansDashboard />} />
            <Route path="satis-analitik" element={<SatisAnalitik />} />
            <Route path="ik-analitik" element={<IKAnalitik />} />
            {/* Faz 9: Takvim ve Randevular */}
            <Route path="takvim" element={<EtkinlikTakvimi />} />
            <Route path="hatirlaticilar" element={<Hatirlaticilar />} />
            {/* Faz 10: Entegrasyonlar ve Otomasyon */}
            <Route path="webhooks" element={<Webhooks />} />
            <Route path="api-gateway" element={<APIGateway />} />
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
            {/* Faz 11: Maaş ve Bordro */}
            <Route path="bordro" element={<BordroListesi />} />
            <Route path="mesai-talepleri" element={<MesaiTalepleri />} />
            <Route path="avans-yonetimi" element={<AvansYonetimi />} />
            <Route path="zimmet-yonetimi" element={<ZimmetYonetimi />} />
          </Route>
          {/* Super Admin Routes */}
          <Route path="super-admin" element={<SuperAdminPanel />} />
        </Routes>
      </ApiProvider>
    </BrowserRouter>
  );
}

export default App;