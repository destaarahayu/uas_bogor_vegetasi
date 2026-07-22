# GeoVista Bogor

## WebGIS Analisis Perubahan Vegetasi Kabupaten Bogor Menggunakan Metode Random Forest pada Citra Sentinel-2 Tahun 2024–2025

---

# Deskripsi Proyek

GeoVista Bogor merupakan aplikasi **WebGIS** yang dikembangkan untuk memvisualisasikan hasil analisis perubahan tutupan vegetasi di Kabupaten Bogor menggunakan metode **Random Forest** pada citra **Sentinel-2 Surface Reflectance Harmonized** periode **2024–2025**.

Website ini menyediakan peta interaktif, informasi proses pengolahan data, evaluasi performa model, serta insight hasil analisis perubahan vegetasi sehingga pengguna dapat memahami perubahan kondisi vegetasi secara visual dan informatif.

---

# Kelompok 14

## Anggota Kelompok

| No | Nama | NIM |
|:--:|------|:----------:|
| 1 | Aulia Febriyanti | 1232002014 |
| 2 | Desta Rahayu | 1232002054 |
| 3 | Erina Nayla Syakira Salsabila | 1232002024 |
| 4 | Mawar Suwendi | 1242002031 |
| 5 | Reino Rachmatullah | 1232002043 |

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

# Wilayah Studi

Kabupaten Bogor, Jawa Barat

---

# Objek Analisis

Perubahan Tutupan Vegetasi Tahun 2024–2025

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
- Random Seed 84

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
│       ├── Ringkasan_Perubahan_Vegetasi_Bogor.csv
│       ├── GT_Bogor_2024.shp
│       ├── GT_Bogor_2025.csv
│       ├── KabBogor_FeatureStack_2024.tif
│       ├── KabBogor_FeatureStack_2025.tif
│       ├── kecamatan_change.json
│       ├── Hasil Evaluasi Model (APRF) + Confusion Matrix.png
│       └── batas_kabupaten_bogor/
│           ├── kabupaten_bogor.cpg
│           ├── kabupaten_bogor.dbf
│           ├── kabupaten_bogor.prj
│           ├── kabupaten_bogor.shp
│           └── kabupaten_bogor.shx
│
├── gee/
│   └── RandomForest.js
│
├── index.html
└── README.md
```

### Penjelasan Struktur

| Folder / File | Keterangan |
|---------------|------------|
| `assets/css/` | Folder berisi stylesheet tampilan WebGIS. |
| `assets/css/style.css` | File CSS utama untuk layout, komponen UI, dan styling halaman. |
| `assets/js/` | Folder berisi skrip JavaScript aplikasi WebGIS. |
| `assets/js/main.js` | File JavaScript utama untuk peta interaktif, layer, popup, grafik, dan interaksi pengguna. |
| `assets/img/` | Folder berisi gambar dan aset visual website. |
| `assets/img/bogor1.jpg` | Gambar latar hero slider (slide 1). |
| `assets/img/bogor2.jpeg` | Gambar latar hero slider dan section insight (slide 2). |
| `assets/img/bogor3.jpg` | Gambar latar hero slider dan section data & proses (slide 3). |
| `assets/img/bogor4.jpg` | Gambar latar hero slider (slide 4). |
| `assets/img/logo_bogor.png` | Logo Kabupaten Bogor untuk navbar, favicon, dan footer. |
| `assets/data/` | Folder berisi data spasial, statistik, dan output analisis. |
| `assets/data/batas_kabupaten_bogor.geojson` | Data vektor batas administrasi Kabupaten Bogor untuk layer peta. |
| `assets/data/batas_kecamatan_bogor.geojson` | Data vektor batas kecamatan untuk pencarian dan popup informasi. |
| `assets/data/target_2024.geojson` | Data vektor area target vegetasi hasil klasifikasi tahun 2024. |
| `assets/data/target_2025.geojson` | Data vektor area target vegetasi hasil klasifikasi tahun 2025. |
| `assets/data/gain_vegetasi.geojson` | Data vektor area pertambahan vegetasi (Gain) periode 2024–2025. |
| `assets/data/loss_vegetasi.geojson` | Data vektor area pengurangan vegetasi (Loss) periode 2024–2025. |
| `assets/data/Bogor_Veg_Master_300pts_FIXED.csv` | Data Ground Truth 300 titik referensi pelatihan dan pengujian model. |
| `assets/data/GT_Bogor_2024.shp` | Data shapefile Ground Truth tahun 2024. |
| `assets/data/GT_Bogor_2025.csv` | Data Ground Truth tahun 2025 dalam format CSV. |
| `assets/data/kecamatan_change.json` | Data statistik perubahan vegetasi per kecamatan untuk grafik insight. |
| `assets/data/Ringkasan_Perubahan_Vegetasi_Bogor.csv` | Ringkasan luas Gain, Loss, Net Change, dan persentase perubahan. |
| `assets/data/ChangeMap_Bogor_2024_2025.tif` | Raster peta perubahan vegetasi Kabupaten Bogor 2024–2025. |
| `assets/data/Klasifikasi_Bogor_Vegetasi_2024.tif` | Raster hasil klasifikasi vegetasi tahun 2024. |
| `assets/data/Klasifikasi_Bogor_Vegetasi_2025.tif` | Raster hasil klasifikasi vegetasi tahun 2025. |
| `assets/data/KabBogor_FeatureStack_2024.tif` | Raster feature stack input model klasifikasi tahun 2024. |
| `assets/data/KabBogor_FeatureStack_2025.tif` | Raster feature stack input model klasifikasi tahun 2025. |
| `assets/data/Hasil Evaluasi Model (APRF) + Confusion Matrix.png` | Gambar dokumentasi hasil evaluasi model (APRF dan Confusion Matrix). |
| `assets/data/batas_kabupaten_bogor/` | Folder berisi file shapefile sumber batas Kabupaten Bogor. |
| `assets/data/batas_kabupaten_bogor/kabupaten_bogor.cpg` | File metadata encoding shapefile batas kabupaten. |
| `assets/data/batas_kabupaten_bogor/kabupaten_bogor.dbf` | File atribut shapefile batas kabupaten. |
| `assets/data/batas_kabupaten_bogor/kabupaten_bogor.prj` | File proyeksi koordinat shapefile batas kabupaten. |
| `assets/data/batas_kabupaten_bogor/kabupaten_bogor.shp` | File geometri shapefile batas kabupaten. |
| `assets/data/batas_kabupaten_bogor/kabupaten_bogor.shx` | File indeks shapefile batas kabupaten. |
| `gee/` | Folder berisi skrip Google Earth Engine untuk pengolahan dan klasifikasi data. |
| `gee/RandomForest_Bogor.js` | Skrip GEE untuk preprocessing, training Random Forest, klasifikasi, dan analisis perubahan. |
| `index.html` | Halaman utama WebGIS GeoVista Bogor. |
| `README.md` | Dokumentasi proyek UAS. |
| `last_request_raw.json` | File log permintaan terakhir (referensi internal pengembangan). |

---

# Link WebGIS

**https://uas-bogor-vegetasi.vercel.app**

---

# Cara Membuka WebGIS

### Secara Online
Akses WebGIS melalui tautan Vercel berikut:

**https://uas-bogor-vegetasi.vercel.app**

### Secara Lokal
Untuk menjalankan WebGIS di komputer lokal, gunakan **Live Server** (ekstensi VS Code) atau web server sederhana agar file data (GeoJSON/CSV) dapat dimuat dengan benar.

**Menggunakan Live Server:**
1. Buka folder proyek `UAS_Bogor_Vegetasi` di VS Code.
2. Klik kanan file `index.html`, lalu pilih **Open with Live Server**.
3. Browser akan membuka halaman WebGIS secara otomatis.

**Menggunakan web server sederhana (Python):**
1. Buka terminal/command prompt di folder proyek.
2. Jalankan perintah berikut:

```
python -m http.server 8000
```

3. Buka browser dan akses **http://localhost:8000**.

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
