// 1. Load Batas Kabupaten Bogor (GANTI DENGAN ASSET ID ANDA)
var bogor = table;

// 2. Fungsi Cloud Masking menggunakan QA60 (Sesuai Dokumen UAS)
function maskS2clouds(image) {
  var qa = image.select('QA60');
  // Bit 10: Opaque clouds, Bit 11: Cirrus
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  // Update mask dan kembalikan nilai reflektansi ke skala 0-1 (divide by 10000)
  return image.updateMask(mask).divide(10000);
}

// 3. Parameter Periode (Juni - September untuk kedua tahun)
var startDate_2024 = '2024-06-01';
var endDate_2024 = '2024-09-30';
var startDate_2025 = '2025-06-01';
var endDate_2025 = '2025-09-30';

// 4. Fungsi untuk membuat Komposit Tahunan
function createAnnualComposite(start, end) {
  var collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(bogor)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) // Maksimal 20% awan
    .map(maskS2clouds);

  // Hitung median dan clip ke batas kabupaten
  return collection.median().clip(bogor);
}

// 5. Buat Komposit 2024 dan 2025
var s2_2024 = createAnnualComposite(startDate_2024, endDate_2024);
var s2_2025 = createAnnualComposite(startDate_2025, endDate_2025);

// 6. Hitung Indeks Vegetasi (NDVI & NDMI)
function calculateIndices(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var ndmi = image.normalizedDifference(['B8', 'B11']).rename('NDMI');
  return image.addBands([ndvi, ndmi]);
}

var s2_2024_idx = calculateIndices(s2_2024);
var s2_2025_idx = calculateIndices(s2_2025);

// 7. Susun Feature Stack (Hanya ambil band dan indeks yang dibutuhkan)
var bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDMI'];
var featureStack_2024 = s2_2024_idx.select(bands);
var featureStack_2025 = s2_2025_idx.select(bands);

// 8. Visualisasi untuk cek hasil
var visParams = { bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3 };
Map.addLayer(featureStack_2024, visParams, 'Feature Stack 2024');
Map.addLayer(featureStack_2025, visParams, 'Feature Stack 2025');
Map.centerObject(bogor, 10);

// Print ke console untuk memastikan band sudah benar (Cek tab Console)
print('Feature Stack 2024 Bands:', featureStack_2024.bandNames());
print('Feature Stack 2025 Bands:', featureStack_2025.bandNames());

// ==========================================
// 9. LOAD GROUND TRUTH DARI ASSETS
// ==========================================
var gt_2024 = ee.FeatureCollection('projects/gee-reino-rachmatullah/assets/GT_Bogor_2024');
var gt_2025 = ee.FeatureCollection('projects/gee-reino-rachmatullah/assets/GT_Bogor_2025');

// ==========================================
// 10. PAKSA TAMBAH KOLOM 'year' (FIXING THE MISSING COLUMN)
// ==========================================
// Kita override properti 'year' secara manual agar pasti ter-export
var gt_2024_fixed = gt_2024.map(function (f) {
  return f.set('year', 2024);
});

var gt_2025_fixed = gt_2025.map(function (f) {
  return f.set('year', 2025);
});

// ==========================================
// 11. EXTRACT NILAI PIKSEL DARI FEATURE STACK
// ==========================================
function extractPixelValues(featureCollection, imageStack) {
  return featureCollection.map(function (feature) {
    var values = imageStack.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: feature.geometry(),
      scale: 10,
      maxPixels: 1e9
    });
    return feature.set(values);
  });
}

// Ekstrak nilai untuk 2024 dan 2025 (menggunakan data yang sudah di-fix year-nya)
var gt_2024_with_values = extractPixelValues(gt_2024_fixed, featureStack_2024);
var gt_2025_with_values = extractPixelValues(gt_2025_fixed, featureStack_2025);

// ==========================================
// 12. GABUNGKAN MENJADI SATU DATASET MASTER
// ==========================================
var master_dataset = gt_2024_with_values.merge(gt_2025_with_values);

// Cek hasil di Console
print('=== DATASET MASTER (FIXED) ===');
print('Total ground truth:', master_dataset.size());
print('Sample data (cek apakah kolom year sudah ada):', master_dataset.first());

// ==========================================
// LANGKAH 5: SPLIT DATA 70:30 (SEED 84)
// ==========================================

// 1. Tambahkan kolom acak dengan seed tetap
var gt_with_random = master_dataset.randomColumn('random', 84);

// 2. Bagi data: <= 0.7 untuk Training, > 0.7 untuk Testing
var training_data = gt_with_random.filter(ee.Filter.lte('random', 0.7));  // lte = less than or equal
var testing_data = gt_with_random.filter(ee.Filter.gt('random', 0.7));     // gt = greater than

print('=== JUMLAH DATA SETELAH SPLIT ===');
print('Training data (70%):', training_data.size());
print('Testing data (30%):', testing_data.size());

// 3. Cek distribusi kelas (Metode AMAN tanpa aggregate_histogram)
print('\n=== DISTRIBUSI KELAS (0=NonVeg, 1=Veg) ===');
print('Training - Class 0:', training_data.filter(ee.Filter.eq('class', 0)).size());
print('Training - Class 1:', training_data.filter(ee.Filter.eq('class', 1)).size());
print('Testing  - Class 0:', testing_data.filter(ee.Filter.eq('class', 0)).size());
print('Testing  - Class 1:', testing_data.filter(ee.Filter.eq('class', 1)).size());

print('\n=== DISTRIBUSI PER TAHUN & KELAS (Training) ===');
print('2024 - Class 0:', training_data.filter(ee.Filter.and(
  ee.Filter.eq('year', 2024), ee.Filter.eq('class', 0))).size());
print('2024 - Class 1:', training_data.filter(ee.Filter.and(
  ee.Filter.eq('year', 2024), ee.Filter.eq('class', 1))).size());
print('2025 - Class 0:', training_data.filter(ee.Filter.and(
  ee.Filter.eq('year', 2025), ee.Filter.eq('class', 0))).size());
print('2025 - Class 1:', training_data.filter(ee.Filter.and(
  ee.Filter.eq('year', 2025), ee.Filter.eq('class', 1))).size());

print('\n=== DISTRIBUSI PER TAHUN & KELAS (Testing) ===');
print('2024 - Class 0:', testing_data.filter(ee.Filter.and(
  ee.Filter.eq('year', 2024), ee.Filter.eq('class', 0))).size());
print('2024 - Class 1:', testing_data.filter(ee.Filter.and(
  ee.Filter.eq('year', 2024), ee.Filter.eq('class', 1))).size());
print('2025 - Class 0:', testing_data.filter(ee.Filter.and(
  ee.Filter.eq('year', 2025), ee.Filter.eq('class', 0))).size());
print('2025 - Class 1:', testing_data.filter(ee.Filter.and(
  ee.Filter.eq('year', 2025), ee.Filter.eq('class', 1))).size());

// ==========================================
// LANGKAH 6: TRAIN RANDOM FOREST & EVALUASI
// ==========================================

var bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDMI'];

// 1. Latih Model Random Forest (100 trees, seed 42)
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 100,
  seed: 42
}).train({
  features: training_data,
  classProperty: 'class',
  inputProperties: bands
});

print('\n✅ Model Random Forest berhasil dilatih!');

// 2. Evaluasi Model menggunakan Testing Data
var tested = testing_data.classify(classifier);
var confusionMatrix = tested.errorMatrix('class', 'classification');

print('\n=== CONFUSION MATRIX ===');
print(confusionMatrix);

// 3. Hitung Metrik APRF (Accuracy, Precision, Recall, F1-Score)
var array = confusionMatrix.array();
var tp = ee.Number(array.get([1, 1])); // True Positive
var tn = ee.Number(array.get([0, 0])); // True Negative
var fp = ee.Number(array.get([0, 1])); // False Positive
var fn = ee.Number(array.get([1, 0])); // False Negative

var accuracy = tp.add(tn).divide(tp.add(tn).add(fp).add(fn));
var precision = tp.divide(tp.add(fp));
var recall = tp.divide(tp.add(fn));
var f1 = ee.Number(2).multiply(precision).multiply(recall).divide(precision.add(recall));

print('\n=== METRIK APRF (Kelas Target = 1) ===');
print('Accuracy :', accuracy.format('%.4f'));
print('Precision:', precision.format('%.4f'));
print('Recall   :', recall.format('%.4f'));
print('F1-Score :', f1.format('%.4f'));


// ==========================================
// LANGKAH 7: KLASIFIKASI PETA 2024 & 2025
// ==========================================

// Gunakan model yang SAMA untuk mengklasifikasi kedua tahun
var classification_2024 = featureStack_2024.classify(classifier).rename('klasifikasi_2024');
var classification_2025 = featureStack_2025.classify(classifier).rename('klasifikasi_2025');

// Visualisasi Hasil Klasifikasi (0 = Merah/NonVeg, 1 = Hijau/Veg)
var visClass = { min: 0, max: 1, palette: ['red', 'green'] };

Map.addLayer(classification_2024, visClass, 'Peta Klasifikasi 2024');
Map.addLayer(classification_2025, visClass, 'Peta Klasifikasi 2025');
Map.centerObject(bogor, 10);

print('\n LANGKAH 5, 6, DAN 7 SELESAI! Silakan cek peta di sebelah kanan.');

// ==========================================
// EXPORT PETA KLASIFIKASI KE GOOGLE DRIVE
// ==========================================

// Export Klasifikasi 2024
Export.image.toDrive({
  image: classification_2024,
  description: 'Export_Klasifikasi_Vegetasi_2024',
  folder: 'UAS_MahaData_KS', // Ganti dengan nama folder di Google Drive Anda
  fileNamePrefix: 'Klasifikasi_Bogor_Vegetasi_2024',
  region: bogor,
  scale: 10, // Resolusi asli Sentinel-2 (10 meter)
  maxPixels: 1e13, // Angka besar agar proses tidak gagal karena batas piksel
  fileFormat: 'GeoTIFF'
});

// Export Klasifikasi 2025
Export.image.toDrive({
  image: classification_2025,
  description: 'Export_Klasifikasi_Vegetasi_2025',
  folder: 'UAS_MahaData_KS',
  fileNamePrefix: 'Klasifikasi_Bogor_Vegetasi_2025',
  region: bogor,
  scale: 10,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF'
});

print('🚀 Export Peta Klasifikasi dimulai. Silakan cek tab "Tasks" di panel kanan untuk menjalankan download!');