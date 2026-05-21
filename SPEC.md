# ERP Sistemi - İnsan Kaynakları ve Bordro Modülü Spesifikasyonu

**Versiyon:** 1.0.0
**Tarih:** 2026-05-21
**Durum:** Planlama Aşamasında
**Dolibarr Uyumluluğu:** %100

---

## 1. Genel Bakış

Bu doküman, ERP sisteminin İnsan Kaynakları ve Bordro modülünün geliştirme spesifikasyonunu içerir. Modül, aylık maaş hesaplama, fazla mesai yönetimi, avans ödemeleri ve zimmet takibi gibi temel HR işlevlerini kapsar.

### 1.1 Temel Özellikler

- **Maaş Hesaplama:** Aylık çalışma saatine göre otomatik maaş hesaplama
- **Fazla Mesai Yönetimi:** Fazla mesai kaydı, onay ve ücretlendirme
- **Bordro Oluşturma:** Aylık bordro raporları ve PDF çıktısı
- **Avans Yönetimi:** Personel avans talepleri ve ödemeleri
- **Zimmet Takibi:** Ekipman ve malzeme zimmet kayıtları
- **Dolibarr Entegrasyonu:** Tüm işlemlerin Dolibarr HR modülü ile senkronizasyonu

---

## 2. Modül Yapısı

```
İnsan Kaynakları (HR)
├── Personel Yönetimi
├── Giriş-Çıkış Takibi
├── İzin Yönetimi
├── Maaş ve Bordro ⭐ (YENİ)
│   ├── Maaş Tanımları
│   ├── Bordro Listesi
│   ├── Bordro Detay
│   └── Maaş Hesaplama
├── Fazla Mesai ⭐ (YENİ)
│   ├── Mesai Talepleri
│   ├── Onay Bekleyenler
│   └── Mesai Raporu
├── Avans Yönetimi ⭐ (YENİ)
│   ├── Avans Talepleri
│   ├── Avans Ödemeleri
│   └── Bakiye Takibi
└── Zimmet Yönetimi ⭐ (YENİ)
    ├── Zimmet Listesi
    ├── Zimmet Ekleme
    ├── Zimmet İade
    └── Ekipman Takibi
```

---

## 3. Veritabanı Modelleri (Prisma Schema)

### 3.1 Maaş Tanımı (SalaryDefinition)
- base_salary, hourly_rate, daily_rate
- Ek ödemeler: meal_allowance, transport_allowance, housing_allowance
- Kesintiler: sgk_employee, unemployment_employee, income_tax
- Mesai çarpanları: overtime_rate, weekend_rate, holiday_rate

### 3.2 Bordro (Payroll)
- period_year, period_month
- working_days, actual_days, overtime_hours
- gross_salary, total_deductions, net_salary
- status: DRAFT, CALCULATED, APPROVED, PAID, CANCELLED

### 3.3 Fazla Mesai (OvertimeRecord)
- type: WEEKDAY, WEEKEND, HOLIDAY, NIGHT, COMPENSATORY
- rate_multiplier, total_amount
- status: PENDING, APPROVED, REJECTED, CANCELLED, PAID

### 3.4 Avans (AdvancePayment)
- amount, requested_amount, remaining_balance
- installment_plan (JSON)
- status: PENDING, APPROVED, REJECTED, PAID, COMPLETED

### 3.5 Zimmet (EquipmentCategory, Equipment, EquipmentAssignment)
- EquipmentCategory: name, description, icon
- Equipment: name, brand, model, serial_number, status
- EquipmentAssignment: assigned_date, return_date, condition

---

## 4. Maaş Hesaplama Formülleri

### 4.1 Temel Hesaplamalar
```
Aylık Çalışma Saati = 225 saat
Saatlik Ücret = Aylık Brüt Maaş / 225
```

### 4.2 Mesai Çarpanları
```
Hafta içi mesai = 1.5x
Hafta sonu mesai = 2.0x
Resmi tatil = 2.0x
```

### 4.3 SGK Kesintileri (2025)
```
Çalışan: SGK 14%, İşsizlik 1%
İşveren: SGK 15.5%, İşsizlik 2%
```

### 4.4 Gelir Vergisi Dilimleri
```
0-22.000 TL: %15
22.001-49.000 TL: %20
49.001-93.000 TL: %27
93.001-213.000 TL: %35
213.001+ TL: %40
```

---

## 5. Geliştirme Aşamaları

### Aşama 1: Temel Altyapı (Bu Sprint)
- Prisma Schema güncellemeleri
- Backend API endpointleri
- Bordro listesi sayfası
- Maaş hesaplama motoru

### Aşama 2: Fazla Mesai
- Mesai kayıtları CRUD
- Onay iş akışı
- Mesai raporu

### Aşama 3: Avans Yönetimi
- Avans talepleri
- Bakiye takibi
- Taksit planı

### Aşama 4: Zimmet
- Ekipman yönetimi
- Zimmet atama/iade
- Raporlama

---

## 6. Dolibarr Uyumluluğu

| ERP Modülü | Dolibarr Modülü |
|-----------|-----------------|
| SalaryDefinition | HR Salary |
| Payroll | Payroll |
| OvertimeRecord | HR Overtime |
| AdvancePayment | HR Advance |
| Equipment | HR Equipment |

---

**Son Güncelleme:** 2026-05-21
