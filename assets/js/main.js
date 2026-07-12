/* ==============================
   GeoVista Bogor - Main JavaScript
   ============================== */

document.addEventListener('DOMContentLoaded', () => {

    // ===== NAVBAR SCROLL EFFECT =====
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section, .hero-section, .ev-section');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        updateActiveNav();
    });

    function updateActiveNav() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }

    // ===== MOBILE NAVIGATION =====
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });

    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ===== FADE-IN ON SCROLL (Intersection Observer) =====
    const fadeElements = document.querySelectorAll('.fade-in');
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    fadeElements.forEach(el => fadeObserver.observe(el));

    // ===== HERO SLIDER =====
    const slides = document.querySelectorAll('.hero-slide');
    let currentSlide = 0;
    if (slides.length > 0) {
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 5000);
    }



    // ===== LEAFLET MAP =====
    initMap();

    // ===== LOAD GROUND TRUTH CSV =====
    loadGroundTruthCSV();
});

// ===== MAP INITIALIZATION =====
function initMap() {
    const map = L.map('map', {
        center: [-6.55, 106.8],
        zoom: 10,
        zoomControl: false,
        preferCanvas: true // Use Canvas to fix complex polygon rendering bugs
    });

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Scale bar
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // Basemaps
    const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    });

    const osmTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors, SRTM',
        maxZoom: 17
    });

    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri',
        maxZoom: 18
    });

    osmStandard.addTo(map);

    const baseMaps = {
        "OpenStreetMap": osmStandard,
        "Topographic": osmTopo,
        "Satellite": esriSatellite
    };

    const canvasRenderer = L.canvas();

    // ===== LAYER STYLES =====
    const layerStyles = {
        batasAdmin: { color: '#FF9800', weight: 3, fill: false, opacity: 1 },
        target2024: { color: '#2E7D32', weight: 1.5, stroke: true, fillColor: '#43A047', fillOpacity: 0.45, smoothFactor: 2 },
        target2025: { color: '#1565C0', weight: 1.5, stroke: true, fillColor: '#2196F3', fillOpacity: 0.45, smoothFactor: 2 },
        gain:       { color: '#00C853', weight: 1.5, stroke: true, fillColor: '#00E676', fillOpacity: 0.75, smoothFactor: 2 },
        loss:       { color: '#D50000', weight: 1.5, stroke: true, fillColor: '#FF5252', fillOpacity: 0.75, smoothFactor: 2 }
    };

    // ===== POPUP BUILDERS (data dibaca langsung dari atribut GeoJSON) =====

    // Shared popup wrapper style
    const popupBase = 'font-family:\'Poppins\',sans-serif;min-width:220px;max-width:300px;';
    function popupRow(label, value, valueStyle) {
        const vs = valueStyle || 'color:#1a1a1a;font-size:12px;font-weight:600;';
        return `
            <tr>
                <td style="padding:7px 14px 7px 0;color:#888;font-size:11px;font-weight:500;vertical-align:top;white-space:nowrap;">${label}</td>
                <td style="${vs}padding:7px 0;font-size:12px;">${value}</td>
            </tr>`;
    }
    function popupDivider() {
        return `<tr><td colspan="2" style="padding:0;border-top:1px solid #f0f0f0;"></td></tr>`;
    }
    function popupHeader(icon, title, accentColor) {
        return `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid ${accentColor};">
                <span style="width:28px;height:28px;border-radius:8px;background:${accentColor}20;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="${icon}" style="color:${accentColor};font-size:12px;"></i>
                </span>
                <span style="font-size:13px;font-weight:700;color:#1a1a1a;">${title}</span>
            </div>`;
    }
    function formatArea(areaSqm) {
        if (areaSqm === null || areaSqm === undefined) return null;
        const ha  = (areaSqm / 10000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
        const sqm = Number(areaSqm).toLocaleString('id-ID', { maximumFractionDigits: 0 });
        return `${sqm} m² &nbsp;<span style="color:#888;font-weight:400;">(${ha} ha)</span>`;
    }

    // --- Generic Popup Builder ---
    function buildCustomPopup(props, type) {
        let wilayah = 'Kabupaten Bogor';
        for (let k of Object.keys(props)) {
            const kl = k.toLowerCase();
            if (kl === 'wadmkk' || kl === 'kabupaten' || kl === 'nama' || kl === 'name') {
                wilayah = props[k]; break;
            }
        }

        let luasM2 = 0;
        for (let k of Object.keys(props)) {
            const kl = k.toLowerCase();
            if (kl.includes('luas') || kl.includes('area')) {
                luasM2 = Number(props[k]); break;
            }
        }
        
        let pct = '-';
        for (let k of Object.keys(props)) {
            const kl = k.toLowerCase();
            if (kl.includes('persen') || kl.includes('pct')) {
                pct = Number(props[k]).toFixed(2) + ' %'; break;
            }
        }
        // Fallback computation if exact percentage property is missing
        if (pct === '-' && luasM2 > 0) {
            pct = (luasM2 / 2988380000 * 100).toFixed(4) + ' %'; // Approx area Bogor
        }

        let rows = '';
        let icon = 'fas fa-map', title = 'Batas Administrasi', color = '#FF9800';

        if (type === 'admin') {
            rows += popupRow('Nama Wilayah', wilayah) + popupDivider();
            rows += popupRow('Luas Wilayah', formatArea(luasM2));
        } else if (type === 'target2024') {
            icon = 'fas fa-crosshairs'; title = 'Target Tahun 2024'; color = '#43A047';
            rows += popupRow('Wilayah', wilayah) + popupDivider();
            rows += popupRow('Periode', '2024') + popupDivider();
            rows += popupRow('Luas', formatArea(luasM2)) + popupDivider();
            rows += popupRow('Persentase terhadap luas wilayah', pct);
        } else if (type === 'target2025') {
            icon = 'fas fa-crosshairs'; title = 'Target Tahun 2025'; color = '#2196F3';
            rows += popupRow('Wilayah', wilayah) + popupDivider();
            rows += popupRow('Periode', '2025') + popupDivider();
            rows += popupRow('Luas', formatArea(luasM2)) + popupDivider();
            rows += popupRow('Persentase terhadap luas wilayah', pct);
        } else if (type === 'gain') {
            icon = 'fas fa-arrow-up'; title = 'Gain'; color = '#00E676';
            rows += popupRow('Wilayah', wilayah) + popupDivider();
            rows += popupRow('Periode', '2024 &rarr; 2025') + popupDivider();
            rows += popupRow('Luas Pertambahan Vegetasi', formatArea(luasM2)) + popupDivider();
            rows += popupRow('Persentase Pertambahan', pct);
        } else if (type === 'loss') {
            icon = 'fas fa-arrow-down'; title = 'Loss'; color = '#FF5252';
            rows += popupRow('Wilayah', wilayah) + popupDivider();
            rows += popupRow('Periode', '2024 &rarr; 2025') + popupDivider();
            rows += popupRow('Luas Pengurangan Vegetasi', formatArea(luasM2)) + popupDivider();
            rows += popupRow('Persentase Pengurangan', pct);
        }
        
        return `
            <div style="${popupBase}">
                ${popupHeader(icon, title, color)}
                <div style="max-height: 250px; overflow-y: auto; padding-right: 5px;">
                    <table style="width:100%;border-collapse:collapse;">
                        ${rows}
                    </table>
                </div>
            </div>`;
    }

    function buildPopupBatasAdmin(props) { return buildCustomPopup(props, 'admin'); }
    function buildPopupTarget2024(props) { return buildCustomPopup(props, 'target2024'); }
    function buildPopupTarget2025(props) { return buildCustomPopup(props, 'target2025'); }
    function buildPopupGain(props) { return buildCustomPopup(props, 'gain'); }
    function buildPopupLoss(props) { return buildCustomPopup(props, 'loss'); }

    // ===== LAYER REFERENCES =====
    const layerRefs = {
        batasAdmin: null, target2024: null, target2025: null, gain: null, loss: null
    };

    // Groups registered with Layer Control immediately → checkboxes appear right away.
    // Target layers are added directly to the map to avoid layerGroup overhead.
    const batasAdminGroup = L.layerGroup().addTo(map);   // visible on startup

    // NO built-in Layer Control — wired via custom HTML panel (see panel wiring below)

    // ===== GEODESIC AREA CALCULATORS =====
    function getPolygonArea(coordinates) {
        let totalArea = 0;
        const r = 6378137; // Earth radius in meters
        function ringArea(coords) {
            let area = 0;
            if (coords.length > 2) {
                for (let i = 0; i < coords.length - 1; i++) {
                    const p1 = coords[i];
                    const p2 = coords[i+1];
                    area += (p2[0] - p1[0]) * Math.PI / 180 * 
                            (2 + Math.sin(p1[1] * Math.PI / 180) + Math.sin(p2[1] * Math.PI / 180));
                }
                area = area * r * r / 2;
            }
            return area;
        }
        totalArea += Math.abs(ringArea(coordinates[0]));
        for (let i = 1; i < coordinates.length; i++) {
            totalArea -= Math.abs(ringArea(coordinates[i]));
        }
        return totalArea;
    }

    function calculateGeodesicArea(feature) {
        if (!feature || !feature.geometry) return 0;
        const geom = feature.geometry;
        let totalAreaSqm = 0;
        if (geom.type === 'Polygon') {
            totalAreaSqm += getPolygonArea(geom.coordinates);
        } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach(poly => {
                totalAreaSqm += getPolygonArea(poly);
            });
        }
        return totalAreaSqm;
    }

    function calculateGeoJSONArea(data) {
        let totalAreaSqm = 0;
        if (data && data.features) {
            data.features.forEach(f => {
                if (f.properties && f.properties.area) {
                    totalAreaSqm += Number(f.properties.area);
                }
            });
        }
        return totalAreaSqm / 10000; // convert to Ha
    }

    // ===== LOAD BATAS KABUPATEN BOGOR =====
    fetch('assets/data/batas_kabupaten_bogor.geojson')
        .then(res => {
            if (!res.ok) throw new Error('Gagal memuat batas_kabupaten_bogor.geojson');
            return res.json();
        })
        .then(data => {
            const geoLayer = L.geoJSON(data, {
                renderer: canvasRenderer,
                style: () => layerStyles.batasAdmin,
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        layer.bindPopup(() => buildPopupBatasAdmin(feature.properties));
                    }
                }
            });
            layerRefs.batasAdmin = geoLayer;
            geoLayer.addTo(batasAdminGroup);
            try {
                const bounds = geoLayer.getBounds();
                map.fitBounds(bounds, { padding: [40, 40] });
                window.geovistaInitBounds = bounds;
                
                // Calculate dynamic geodesic area of Kabupaten Bogor boundary
                let totalAreaSqm = 0;
                if (data.features && data.features.length > 0) {
                    totalAreaSqm = calculateGeodesicArea(data.features[0]);
                }
                const totalAreaKm2 = totalAreaSqm / 1000000;
                window.boundaryAreaHa = totalAreaSqm / 10000;
                
                const elLuas = document.getElementById('val-luas');
                if (elLuas) elLuas.innerHTML = Math.round(totalAreaKm2).toLocaleString('id-ID') + ' km²';
            } catch (e) {
                map.setView([-6.55, 106.8], 10);
                const elLuas = document.getElementById('val-luas');
                if (elLuas) elLuas.innerHTML = '—';
            }
        })
        .catch(err => {
            console.warn('[GeoVista] batas_kabupaten_bogor.geojson:', err.message);
            const elLuas = document.getElementById('val-luas'); if (elLuas) elLuas.innerHTML = '—';
        });

    // ===== PRELOAD & CACHE LAYER ENGINE =====
    const lazyConfig = {
        target2024: { type: 'geojson', url: 'assets/data/target_2024.geojson', style: 'target2024', popup: buildPopupTarget2024, silent: false, statCard: 'val-t2024' },
        target2025: { type: 'geojson', url: 'assets/data/target_2025.geojson', style: 'target2025', popup: buildPopupTarget2025, silent: false, statCard: 'val-t2025' },
        gain:       { type: 'geojson', url: 'assets/data/gain_vegetasi.geojson', style: 'gain',       popup: buildPopupGain,       silent: true,  statCard: 'val-gain' },
        loss:       { type: 'geojson', url: 'assets/data/loss_vegetasi.geojson', style: 'loss',       popup: buildPopupLoss,       silent: true,  statCard: 'val-loss' }
    };

    const lazyState = {};
    Object.keys(lazyConfig).forEach(k => { lazyState[k] = { promise: null }; });

    function fmtHa(sqm) {
        const ha = sqm / 10000;
        return ha >= 1000
            ? (ha / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' rb ha'
            : ha.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' ha';
    }

    async function checkFileExists(key) {
        try {
            const res = await fetch(lazyConfig[key].url, { method: 'HEAD' });
            if (res.ok) {
                const cbEl = document.getElementById('lyr-' + key);
                if (cbEl) { cbEl.disabled = false; cbEl.parentElement.classList.remove('panel-check-disabled'); }
            }
        } catch { /* silent */ }
    }
    ['gain', 'loss'].forEach(checkFileExists);

    // Fetch and build L.geoJSON or GeoRasterLayer once, returning a promise to avoid duplicate fetches
    function loadLayerCache(key) {
        const cfg = lazyConfig[key];
        const state = lazyState[key];
        
        if (state.promise) return state.promise;

        state.promise = (async () => {
            try {
                const res = await fetch(cfg.url);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();

                // Calculate dynamic GeoJSON area
                const computedAreaHa = calculateGeoJSONArea(data);

                const geoLayer = L.geoJSON(data, {
                    renderer: canvasRenderer,
                    style: () => layerStyles[cfg.style],
                    onEachFeature: (feature, layer) => {
                        if (feature.properties) {
                            layer.bindPopup(() => cfg.popup(feature.properties));
                        }
                    }
                });

                layerRefs[key] = geoLayer;

                if (cfg.statCard) {
                    const el = document.getElementById(cfg.statCard);
                    if (el) {
                        el.classList.remove('peta-stat-pending');
                        const fmt = val => val.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                        el.innerText = fmt(computedAreaHa) + ' Ha';
                    }
                }

                if (key === 'gain' || key === 'loss') {
                    const lgEl = document.getElementById('legend-' + key);
                    if (lgEl) lgEl.querySelector('span:last-child').style.opacity = '1';
                }
                return geoLayer;
            } catch (err) {
                if (!cfg.silent) console.warn('[GeoVista]', cfg.url, ':', err.message);
                throw err;
            }
        })();

        return state.promise;
    }

    // Preload all layers in background sequentially to avoid blocking the main thread
    async function preloadAllLayers() {
        const keys = ['target2024', 'target2025', 'gain', 'loss'];
        for (const key of keys) {
            try {
                await loadLayerCache(key);
            } catch (e) {
                console.warn('[GeoVista] Preload failed for ' + key, e);
            }
        }
    }

    if (window.requestIdleCallback) {
        window.requestIdleCallback(() => preloadAllLayers());
    } else {
        setTimeout(preloadAllLayers, 1000);
    }

    // ===== CUSTOM PANEL: BASEMAP RADIOS =====
    const basemapTiles = { osm: osmStandard, topo: osmTopo, satellite: esriSatellite };
    let activeBasemap = osmStandard;
    document.querySelectorAll('input[name="basemap"]').forEach(radio => {
        radio.addEventListener('change', () => {
            map.removeLayer(activeBasemap);
            activeBasemap = basemapTiles[radio.value];
            map.addLayer(activeBasemap);
        });
    });

    // ===== CUSTOM PANEL: LAYER CHECKBOXES =====
    async function toggleLayer(key, isChecked) {
        if (isChecked) {
            try {
                const layer = await loadLayerCache(key);
                if (!map.hasLayer(layer)) map.addLayer(layer);
            } catch (e) { /* silent */ }
        } else {
            const layer = layerRefs[key];
            if (layer && map.hasLayer(layer)) map.removeLayer(layer);
        }
    }

    const chkAdmin = document.getElementById('lyr-admin');
    const chk2024  = document.getElementById('lyr-2024');
    const chk2025  = document.getElementById('lyr-2025');
    const chkGain  = document.getElementById('lyr-gain');
    const chkLoss  = document.getElementById('lyr-loss');

    if (chkAdmin) chkAdmin.addEventListener('change', () => {
        if (chkAdmin.checked) { 
            if (!map.hasLayer(batasAdminGroup)) map.addLayer(batasAdminGroup); 
        }
        else { 
            if (map.hasLayer(batasAdminGroup)) map.removeLayer(batasAdminGroup); 
        }
    });

    if (chk2024) { 
        chk2024.addEventListener('change', () => toggleLayer('target2024', chk2024.checked));
        if(chk2024.checked) toggleLayer('target2024', true);
    }
    if (chk2025) { 
        chk2025.addEventListener('change', () => toggleLayer('target2025', chk2025.checked));
        if(chk2025.checked) toggleLayer('target2025', true);
    }
    
    if (chkGain) { 
        chkGain.addEventListener('change', () => toggleLayer('gain', chkGain.checked));
        if(chkGain.checked) toggleLayer('gain', true);
    }
    if (chkLoss) { 
        chkLoss.addEventListener('change', () => toggleLayer('loss', chkLoss.checked));
        if(chkLoss.checked) toggleLayer('loss', true);
    }

    // ===== LOAD RINGKASAN CSV =====
    fetch('assets/data/Ringkasan_Perubahan_Vegetasi_Bogor.csv')
        .then(res => res.text())
        .then(csv => {
            const lines = csv.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            
            let luas2024 = 0, luas2025 = 0, gain = 0, loss = 0, netChange = 0, pctChange = 0;
            
            for(let i=1; i<lines.length; i++) {
                const match = lines[i].match(/^(\d+),([^,]+),([^,]+),/);
                if (match) {
                    const kategori = match[2].trim();
                    const nilai = parseFloat(match[3]);
                    if (kategori === 'Luas Vegetasi 2024 (Ha)') luas2024 = nilai;
                    else if (kategori === 'Luas Vegetasi 2025 (Ha)') luas2025 = nilai;
                    else if (kategori === 'Gain (Ha)') gain = nilai;
                    else if (kategori === 'Loss (Ha)') loss = nilai;
                    else if (kategori === 'Net Change (Ha)') netChange = nilai;
                    else if (kategori === 'Persentase Net Change (%)') pctChange = nilai;
                }
            }
            
            const fmt = val => val.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            
            if (document.getElementById('stat-luas-2024')) document.getElementById('stat-luas-2024').innerText = fmt(luas2024) + ' Ha';
            if (document.getElementById('stat-luas-2025')) document.getElementById('stat-luas-2025').innerText = fmt(luas2025) + ' Ha';
            if (document.getElementById('stat-gain')) document.getElementById('stat-gain').innerText = fmt(gain) + ' Ha';
            if (document.getElementById('stat-loss')) document.getElementById('stat-loss').innerText = fmt(loss) + ' Ha';
            if (document.getElementById('stat-net-change')) document.getElementById('stat-net-change').innerText = fmt(netChange) + ' Ha';
            if (document.getElementById('stat-pct-change')) document.getElementById('stat-pct-change').innerText = fmt(pctChange) + '%';

            // Update Ringkasan Temuan Card values dynamically from CSV
            if (document.getElementById('rt-luas-2024')) document.getElementById('rt-luas-2024').innerText = fmt(luas2024) + ' Ha';
            if (document.getElementById('rt-luas-2025')) document.getElementById('rt-luas-2025').innerText = fmt(luas2025) + ' Ha';
            if (document.getElementById('rt-gain')) document.getElementById('rt-gain').innerText = fmt(gain) + ' Ha';
            if (document.getElementById('rt-loss')) document.getElementById('rt-loss').innerText = fmt(loss) + ' Ha';
            if (document.getElementById('rt-net-change')) document.getElementById('rt-net-change').innerText = fmt(netChange) + ' Ha';
            if (document.getElementById('rt-pct-change')) document.getElementById('rt-pct-change').innerText = fmt(pctChange) + '%';
            
            // Draw Chart
            const ctx = document.getElementById('insightChart');
            if (ctx) {
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Luas Vegetasi 2024', 'Luas Vegetasi 2025'],
                        datasets: [{
                            label: 'Luas Vegetasi (Ha)',
                            data: [luas2024, luas2025],
                            backgroundColor: ['#1B5E20', '#81C784'],
                            borderWidth: 0,
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return context.parsed.y.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' Ha';
                                    }
                                }
                            }
                        },
                        scales: { 
                            y: { 
                                beginAtZero: true,
                                ticks: { 
                                    color: '#ffffff',
                                    callback: function(value) {
                                        return value.toLocaleString('id-ID') + ' Ha';
                                    }
                                },
                                grid: { color: 'rgba(255,255,255,0.1)' }
                            },
                            x: {
                                ticks: { color: '#ffffff', font: { weight: 'bold' } },
                                grid: { display: false }
                            }
                        }
                    }
                });
            }

            // Draw Pie Chart
            const pieCtx = document.getElementById('compositionChart');
            if (pieCtx) {
                // Use boundary area calculated from GeoJSON if available, else fallback to CSV-derived estimate
                const totalArea = window.boundaryAreaHa || 298838;
                const stable = totalArea - gain - loss;
                const totalPie = gain + loss + stable;
                const fmtPct = val => (val / totalPie * 100).toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
                
                new Chart(pieCtx, {
                    type: 'pie',
                    data: {
                        labels: [
                            'Gain Area (' + fmtPct(gain) + ')',
                            'Loss Area (' + fmtPct(loss) + ')',
                            'Stable Area (' + fmtPct(stable) + ')'
                        ],
                        datasets: [{
                            data: [gain, loss, stable],
                            backgroundColor: ['#2E7D32', '#D32F2F', '#5C756B'],
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'right',
                                labels: {
                                    color: '#ffffff',
                                    font: {
                                        family: 'Poppins, Inter, sans-serif',
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label.split(' (')[0] || '';
                                        const value = context.parsed;
                                        const pct = (value / totalPie * 100).toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
                                        return label + ': ' + value.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' Ha (' + pct + ')';
                                    }
                                }
                            }
                        }
                    }
                });
            }
        })
        .catch(err => console.warn('[GeoVista] Ringkasan CSV:', err));

    // ===== RESET VIEW BUTTON =====
    document.getElementById('btnResetView')?.addEventListener('click', () => {
        if (window.geovistaInitBounds) map.fitBounds(window.geovistaInitBounds, { padding: [40, 40] });
        else map.setView([-6.55, 106.8], 10);
    });

    // Store global references
    window.geovistaMap    = map;
    window.geovistaLayers = layerRefs;
    window.geovistaGroups = { batasAdmin: batasAdminGroup };

    window.geovistaStyles = layerStyles;
}

// ===== GROUND TRUTH CSV LOADER =====
function loadGroundTruthCSV() {
    fetch('assets/data/Bogor_Veg_Master_300pts_FIXED.csv')
        .then(res => {
            if (!res.ok) throw new Error('Gagal memuat Bogor_Veg_Master_300pts_FIXED.csv');
            return res.text();
        })
        .then(text => {
            const lines = text.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

            const rows = lines.slice(1).map(line => {
                // CSV-safe parse: handle quoted fields
                const cols = [];
                let cur = '', inQ = false;
                for (let i = 0; i < line.length; i++) {
                    const ch = line[i];
                    if (ch === '"') { inQ = !inQ; }
                    else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
                    else { cur += ch; }
                }
                cols.push(cur);
                const obj = {};
                headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim(); });
                return obj;
            });

            // ===== COMPUTE STATISTICS FROM ACTUAL DATA =====
            const total = rows.length;
            const classIdx  = headers.indexOf('class');
            const yearIdx   = headers.indexOf('year');

            const classLabel = { '1': 'Target (Vegetasi)', '0': 'Non-Target' };

            // Count by class
            const byClass = {};
            rows.forEach(r => {
                const c = r['class'];
                byClass[c] = (byClass[c] || 0) + 1;
            });

            // Count by year
            const byYear = {};
            rows.forEach(r => {
                const y = r['year'];
                byYear[y] = (byYear[y] || 0) + 1;
            });

            // Count by class × year
            const byClassYear = {};
            rows.forEach(r => {
                const key = `${r['class']}_${r['year']}`;
                byClassYear[key] = (byClassYear[key] || 0) + 1;
            });

            // Available spectral bands and indices from headers
            const bands = headers.filter(h => !['system:index', 'class', 'year', '.geo'].includes(h));

            renderGroundTruthSummary({
                total, byClass, byYear, byClassYear, classLabel, bands, headers
            });
        })
        .catch(err => {
            console.warn('[GeoVista] CSV:', err.message);
            renderGroundTruthFallback();
        });
}

function renderGroundTruthSummary({ total, byClass, byYear, byClassYear, classLabel, bands }) {
    const el = document.getElementById('gt-summary-content');
    if (!el) return;

    const years = Object.keys(byYear).sort();
    const classes = Object.keys(byClass).sort();

    // Build class breakdown HTML
    const classRows = classes.map(c => {
        const label = classLabel[c] || `Kelas ${c}`;
        const count = byClass[c] || 0;
        const pct   = ((count / total) * 100).toFixed(1);
        return `
            <div class="gt-class-row">
                <div class="gt-class-label">
                    <span class="gt-class-dot" style="background:${c === '1' ? '#4CAF50' : '#EF5350'};"></span>
                    ${label}
                </div>
                <div class="gt-class-bar-wrap">
                    <div class="gt-class-bar" style="width:${pct}%;background:${c === '1' ? '#4CAF50' : '#EF5350'};"></div>
                </div>
                <div class="gt-class-count"><strong>${count}</strong> <span class="gt-pct">(${pct}%)</span></div>
            </div>`;
    }).join('');

    // Build year breakdown HTML
    const yearRows = years.map(y => {
        const count = byYear[y] || 0;
        const pct   = ((count / total) * 100).toFixed(1);
        const t1    = byClassYear[`1_${y}`] || 0;
        const t0    = byClassYear[`0_${y}`] || 0;
        return `
            <div class="gt-year-block">
                <div class="gt-year-title"><i class="fas fa-calendar-alt"></i> Tahun ${y}</div>
                <div class="gt-year-stats">
                    <span><strong>${count}</strong> titik total</span>
                    <span class="gt-sep">|</span>
                    <span style="color:#4CAF50;"><i class="fas fa-check-circle"></i> Target: <strong>${t1}</strong></span>
                    <span class="gt-sep">|</span>
                    <span style="color:#EF5350;"><i class="fas fa-times-circle"></i> Non-Target: <strong>${t0}</strong></span>
                </div>
            </div>`;
    }).join('');

    // Band badges
    const bandBadges = bands.map(b => `<span class="badge ${['NDVI','NDWI','NDBI','NDMI'].includes(b.toUpperCase()) ? 'badge-accent' : ''}">${b.toUpperCase()}</span>`).join('');

    el.innerHTML = `
        <div class="gt-summary-grid">

            <div class="gt-stat-card">
                <div class="gt-stat-icon"><i class="fas fa-map-pin"></i></div>
                <div class="gt-stat-value">${total.toLocaleString('id-ID')}</div>
                <div class="gt-stat-label">Total Titik Ground Truth</div>
            </div>

            <div class="gt-stat-card">
                <div class="gt-stat-icon"><i class="fas fa-calendar-check"></i></div>
                <div class="gt-stat-value">${years.length}</div>
                <div class="gt-stat-label">Tahun Data (${years.join(', ')})</div>
            </div>

            <div class="gt-stat-card">
                <div class="gt-stat-icon"><i class="fas fa-tags"></i></div>
                <div class="gt-stat-value">${classes.length}</div>
                <div class="gt-stat-label">Kelas Klasifikasi</div>
            </div>

            <div class="gt-stat-card">
                <div class="gt-stat-icon"><i class="fas fa-layer-group"></i></div>
                <div class="gt-stat-value">${bands.length}</div>
                <div class="gt-stat-label">Fitur Spektral &amp; Indeks</div>
            </div>

        </div>

        <div class="gt-section-title"><i class="fas fa-chart-bar"></i> Distribusi Kelas</div>
        <div class="gt-class-breakdown">${classRows}</div>

        <div class="gt-section-title"><i class="fas fa-calendar-alt"></i> Distribusi per Tahun</div>
        <div class="gt-year-breakdown">${yearRows}</div>

        <div class="gt-section-title"><i class="fas fa-satellite-dish"></i> Fitur Spektral &amp; Indeks yang Digunakan</div>
        <div class="feature-badges" style="padding:12px 0 4px;">${bandBadges}</div>
    `;
}

function renderGroundTruthFallback() {
    const el = document.getElementById('gt-summary-content');
    if (!el) return;
    el.innerHTML = `<p style="color:#aaa;text-align:center;padding:20px;">Data ground truth tidak dapat dimuat. Pastikan file <code>Bogor_Veg_Master_300pts_FIXED.csv</code> tersedia di folder <code>assets/data/</code>.</p>`;
}
// ==============================
// 9. ANIMASI COUNTER METRIK
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    const counters = document.querySelectorAll('.counter');
    
    const animateCounters = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute('data-target');
                const duration = 1500; // 1.5 seconds
                const step = target / (duration / 16); 
                
                let current = 0;
                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        counter.innerText = current.toFixed(2) + "%";
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.innerText = target.toFixed(2) + "%";
                    }
                };
                
                updateCounter();
                observer.unobserve(counter);
            }
        });
    };
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(animateCounters, { threshold: 0.5 });
        counters.forEach(counter => {
            counter.innerText = "0.00%";
            observer.observe(counter);
        });
    }
});
