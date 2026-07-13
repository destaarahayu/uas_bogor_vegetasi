# GeoVista Bogor

## WebGIS Analisis Perubahan Vegetasi Kabupaten Bogor Menggunakan Metode Random Forest pada Citra Sentinel-2 Tahun 2024–2025

---

# Deskripsi Proyek

GeoVista Bogor merupakan aplikasi **WebGIS** yang dikembangkan untuk memvisualisasikan hasil analisis perubahan tutupan vegetasi di Kabupaten Bogor menggunakan metode **Random Forest** pada citra **Sentinel-2 Surface Reflectance Harmonized** periode **2024–2025**.

Website ini menyediakan peta interaktif, informasi proses pengolahan data, evaluasi performa model, serta insight hasil analisis perubahan vegetasi sehingga pengguna dapat memahami perubahan kondisi vegetasi secara visual dan informatif.

---

# Kelompok 14

## Anggota Kelompok

| No | Nama |
|----|------------------------------|
| 1 | Aulia Febriyanti |
| 2 | Desta Rahayu |
| 3 | Erina Nayla Syakira Salsabila |
| 4 | Mawar Suwendi |
| 5 | Reino Rachmatullah |

---

# Identitas Mata Kuliah

**Universitas Bakrie**

**Program Studi:** Sistem Informasi

**Mata Kuliah:** Kapita Selekta Sistem Informasi & Maha Data

**Tahun Akademik:** 2025/2026

---

# Studi Kasus

Analisis perubahan tutupan vegetasi Kabupaten Bogor menggunakan citra Sentinel-2 tahun 2024 dan 2025 dengan pendekatan klasifikasi **Random Forest**.

---

# Tujuan

- Mengidentifikasi perubahan tutupan vegetasi Kabupaten Bogor periode 2024–2025.
- Membandingkan kondisi vegetasi antara tahun 2024 dan 2025.
- Menyajikan hasil analisis dalam bentuk WebGIS interaktif.
- Mengevaluasi performa model Random Forest menggunakan data Ground Truth.

---

# Teknologi yang Digunakan

### Pengolahan Data
- Google Earth Engine
- Sentinel-2 Surface Reflectance Harmonized
- Cloud Masking (QA60)
- Median Composite

### Machine Learning
- Random Forest Classifier
- 100 Trees
- Random Seed 42

### WebGIS
- HTML5
- CSS3
- JavaScript
- Leaflet.js
- Chart.js

---

# Dataset

### Data Citra
- Sentinel-2 Surface Reflectance Harmonized

### Data Administrasi
- Batas Kabupaten Bogor
- Batas Kecamatan Kabupaten Bogor

### Ground Truth
- Total titik: 300
- Kelas: Vegetasi dan Non-Vegetasi
- Training Data: 210 titik
- Testing Data: 90 titik

### Periode Analisis

2024–2025

---

# Metodologi

1. Pengumpulan data Sentinel-2
2. Cloud Masking menggunakan QA60
3. Median Composite
4. Penyusunan Feature Stack
5. Pembuatan Ground Truth
6. Training model Random Forest
7. Klasifikasi vegetasi tahun 2024 dan 2025
8. Analisis perubahan vegetasi (Gain dan Loss)
9. Evaluasi model menggunakan Confusion Matrix
10. Visualisasi hasil pada WebGIS

---

# Struktur Repository

```
uas_bogor_vegetasi
│
├── assets/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── data/
│       ├── batas_kabupaten_bogor.geojson
│       ├── batas_kecamatan_bogor.geojson
│       ├── target_2024.geojson
│       ├── target_2025.geojson
│       ├── gain_vegetasi.geojson
│       ├── loss_vegetasi.geojson
│       ├── Bogor_Veg_Master_300pts_FIXED.csv
│       ├── ChangeMap_Bogor_2024_2025.tif
│       ├── Klasifikasi_Bogor_Vegetasi_2024.tif
│       ├── Klasifikasi_Bogor_Vegetasi_2025.tif
│       └── Ringkasan_Perubahan_Vegetasi_Bogor.csv
│
├── gee/
│   └── UAS_Bogor_Vegetasi.js
│
├── index.html
└── README.md
```

---

# Fitur WebGIS

## Home
- Informasi proyek
- Objek target
- Periode analisis

## Peta Hasil
- Peta interaktif
- Basemap
- Layer Control
- Legenda
- Popup informasi
- Pencarian kecamatan
- Statistik luas vegetasi

## Data & Proses
- Sumber data
- Tahapan preprocessing
- Feature Stack
- Ground Truth
- Training & Testing
- Diagram alur proses

## Evaluasi Model
- Accuracy
- Precision
- Recall
- F1 Score
- Confusion Matrix
- Interpretasi hasil
- Kesimpulan evaluasi

## Insight Hasil
- Ringkasan perubahan vegetasi
- Grafik perbandingan luas vegetasi
- Grafik komposisi perubahan
- Wilayah dengan perubahan terbesar
- Top 5 Kecamatan Gain
- Top 5 Kecamatan Loss
- Analisis dan rekomendasi

---

# Hasil Evaluasi Model

| Parameter | Nilai |
|-----------|-------:|
| Accuracy | **96.67%** |
| Precision | **97.78%** |
| Recall | **95.65%** |
| F1 Score | **96.70%** |

Model Random Forest menunjukkan performa klasifikasi yang sangat baik sehingga layak digunakan untuk analisis perubahan tutupan vegetasi Kabupaten Bogor periode 2024–2025.

---

# Output Proyek

- WebGIS Interaktif GeoVista Bogor
- Peta Klasifikasi Vegetasi Tahun 2024
- Peta Klasifikasi Vegetasi Tahun 2025
- Peta Gain Vegetasi
- Peta Loss Vegetasi
- Analisis Perubahan Vegetasi
- Evaluasi Model Random Forest

---

# Lisensi

Repository ini dibuat sebagai pemenuhan tugas **Ujian Akhir Semester (UAS)** Mata Kuliah **Kapita Selekta Sistem Informasi & Maha Data** Program Studi Sistem Informasi Universitas Bakrie.

**© 2026 Kelompok 14 – Universitas Bakrie**
