/* ==============================
   GeoVista Bogor - Main JavaScript
   ============================== */

// ===== COUNTER ANIMATION =====
function animateValue(elementOrId, start, end, duration, suffix) {
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = progress * (end - start) + start;
        el.innerText = current.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            el.innerText = end.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + suffix;
        }
    };
    window.requestAnimationFrame(step);
}

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

    // ===== LOAD KECAMATAN CHANGE DATA =====
    loadKecamatanChangeJSON();

    // ===== SCROLL REVEAL (One by One) =====
    initScrollReveal();
});

// ===== MAP INITIALIZATION =====
function initMap() {
    let focusedLayerKey = null;

    const map = L.map('map', {
        center: [-6.55, 106.8],
        zoom: 10,
        zoomControl: false,
        preferCanvas: true // Use Canvas to fix complex polygon rendering bugs
    });

    // Create custom panes for strict layering
    map.createPane('paneAdmin');
    map.getPane('paneAdmin').style.zIndex = '401';

    map.createPane('paneTarget2024');
    map.getPane('paneTarget2024').style.zIndex = '402';

    map.createPane('paneTarget2025');
    map.getPane('paneTarget2025').style.zIndex = '403';

    map.createPane('paneLoss');
    map.getPane('paneLoss').style.zIndex = '404';

    map.createPane('paneGain');
    map.getPane('paneGain').style.zIndex = '405';

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Fullscreen control below Zoom control
    const FullscreenControl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-fullscreen-control');
            const button = L.DomUtil.create('a', 'leaflet-fullscreen-button', container);
            button.innerHTML = '<i class="fas fa-expand"></i>';
            button.title = 'Fullscreen';
            button.href = '#';
            button.style.cursor = 'pointer';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.width = '30px';
            button.style.height = '30px';
            button.style.backgroundColor = '#fff';
            
            L.DomEvent.on(button, 'click', function (e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                toggleFullscreen();
            });
            return container;
        }
    });
    map.addControl(new FullscreenControl());

    function toggleFullscreen() {
        const dashboard = document.querySelector('.peta-dashboard');
        const body = document.body;
        const btn = document.querySelector('.leaflet-fullscreen-button i');
        const btnLink = document.querySelector('.leaflet-fullscreen-button');
        
        if (dashboard.classList.contains('fullscreen-active')) {
            dashboard.classList.remove('fullscreen-active');
            body.classList.remove('map-fullscreen-active');
            btn.className = 'fas fa-expand';
            btnLink.title = 'Fullscreen';
        } else {
            dashboard.classList.add('fullscreen-active');
            body.classList.add('map-fullscreen-active');
            btn.className = 'fas fa-compress';
            btnLink.title = 'Exit Fullscreen';
        }
        setTimeout(() => { map.invalidateSize(); }, 300);
    }

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

    // ===== PRELOAD KECAMATAN DATA =====
    let kecamatanGeoJSON = null;
    let kecamatanNameIndex = [];     // ['Cibinong', 'Citeureup', ...]
    let kecamatanLayer = null;       // L.geoJSON layer for kecamatan
    let currentKecamatanHighlight = null;
    let highlightedKecamatanLayer = null;

    fetch('assets/data/batas_kecamatan_bogor.geojson')
        .then(res => { if (res.ok) return res.json(); return null; })
        .then(data => {
            if (!data) return;
            kecamatanGeoJSON = data;

            // Build search index
            kecamatanNameIndex = [];
            data.features.forEach(f => {
                const name = extractKecamatanName(f.properties);
                if (name && !kecamatanNameIndex.includes(name)) {
                    kecamatanNameIndex.push(name);
                }
            });
            kecamatanNameIndex.sort();

            // Build clickable kecamatan layer (on paneAdmin)
            kecamatanLayer = L.geoJSON(data, {
                pane: 'paneAdmin',
                renderer: canvasRenderer,
                style: () => ({ color: '#FF9800', weight: 1.5, fill: false, opacity: 0.7 }),
                onEachFeature: (feature, layer) => {
                    layer.on('click', (e) => {
                        if (e.originalEvent) e.originalEvent.stopPropagation();
                        L.DomEvent.stopPropagation(e);
                        const html = buildCustomPopup(feature, 'admin', e.latlng);
                        layer.bindPopup(html, { maxWidth: 280 }).openPopup(e.latlng);
                    });
                }
            }).addTo(batasAdminGroup);
        })
        .catch(err => {
            console.warn('[GeoVista] batas_kecamatan_bogor.geojson not loaded:', err.message);
        });

    // buildKecamatanPopupHtml has been replaced by buildCustomPopup



    // Extract kecamatan name from any GeoJSON feature properties
    function extractKecamatanName(props) {
        if (!props) return null;
        const fieldPriority = ['NAME_3','NAMOBJ','WADMKC','KECAMATAN','NAMA_KEC','NAMAKEC','KECAMATAN_','NAME','Nama','nama','kecamatan','name_3','namobj'];
        for (let k of fieldPriority) {
            if (props[k] && String(props[k]).trim() !== '' && String(props[k]) !== 'NA') {
                return String(props[k]).trim();
            }
        }
        // Fallback: scan all keys
        for (let k of Object.keys(props)) {
            const kl = k.toLowerCase();
            if (kl.includes('kec') || kl.includes('name') || kl.includes('nama')) {
                if (props[k] && String(props[k]).trim() !== '' && String(props[k]) !== 'NA') {
                    return String(props[k]).trim();
                }
            }
        }
        console.log('[GeoVista] Field nama kecamatan tidak ditemukan. Properties:', props);
        return null;
    }

    function extractKabupatenName(props) {
        if (!props) return 'Bogor';
        const fieldPriority = ['NAME_2','WADMKK','KABUPATEN','name_2'];
        for (let k of fieldPriority) {
            if (props[k] && String(props[k]).trim() !== '' && String(props[k]) !== 'NA') {
                return String(props[k]).trim();
            }
        }
        return 'Bogor';
    }

    function findKecamatanDesa(latlng) {
        if (!kecamatanGeoJSON || !latlng) return { kecamatan: null, desa: null };
        const pt = turf.point([latlng.lng, latlng.lat]);
        for (let f of kecamatanGeoJSON.features) {
            if (f.geometry && turf.booleanPointInPolygon(pt, f)) {
                const name = extractKecamatanName(f.properties);
                return { kecamatan: name, desa: null, feature: f };
            }
        }
        return { kecamatan: null, desa: null };
    }

    function getAreaHectares(f) {
        let areaSqm = null;
        if (f.properties && f.properties.area !== undefined) {
            areaSqm = Number(f.properties.area);
        } else if (f.properties && f.properties.luas !== undefined) {
            areaSqm = Number(f.properties.luas);
        } else {
            areaSqm = turf.area(f);
        }
        return areaSqm / 10000;
    }

    function formatPercent(pct) {
        if (pct === 0) return '0,00%';
        if (pct < 0.01) {
            return pct.toLocaleString('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + '%';
        }
        return pct.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    }

    // --- Generic Popup Builder ---
    function buildCustomPopup(feature, type, latlng) {
        const lat = latlng ? latlng.lat.toFixed(6) : '-';
        const lng = latlng ? latlng.lng.toFixed(6) : '-';
        
        let title = '';
        let accentColor = '';
        let kategoriLayer = '';
        let periode = '';
        
        if (type === 'admin' || type === 'batasAdmin') {
            title = 'Batas Administrasi';
            accentColor = '#FF9800'; // Oranye
            kategoriLayer = 'Batas Administrasi';
            periode = '2024–2025';
        } else if (type === 'target2024') {
            title = 'Target Tahun 2024';
            accentColor = '#2E7D32'; // Hijau tua
            kategoriLayer = 'Target Tahun 2024';
            periode = '2024';
        } else if (type === 'target2025') {
            title = 'Target Tahun 2025';
            accentColor = '#2196F3'; // Biru
            kategoriLayer = 'Target Tahun 2025';
            periode = '2025';
        } else if (type === 'gain') {
            title = 'Gain Vegetasi';
            accentColor = '#00E676'; // Hijau terang
            kategoriLayer = 'Gain';
            periode = '2024–2025';
        } else if (type === 'loss') {
            title = 'Loss Vegetasi';
            accentColor = '#FF5252'; // Merah
            kategoriLayer = 'Loss';
            periode = '2024–2025';
        }

        // Detect kecamatan
        const loc = findKecamatanDesa(latlng);
        let kecamatan = loc.kecamatan;
        if (!kecamatan && feature) {
            kecamatan = extractKecamatanName(feature.properties);
        }
        if (!kecamatan) {
            kecamatan = '-';
        }

        const areaHa = getAreaHectares(feature);
        const totalAreaHa = 298838;
        const pct = (areaHa / totalAreaHa) * 100;
        
        const luasFormatted = areaHa.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Ha';
        const pctFormatted = formatPercent(pct);

        let detailsHtml = '';

        if (type === 'admin' || type === 'batasAdmin') {
            detailsHtml = `
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Kabupaten</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #222;">Bogor</span>
                </div>
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Kecamatan</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #222;">${kecamatan}</span>
                </div>
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Luas Wilayah</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #222;">${luasFormatted}</span>
                </div>
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Persentase terhadap Kabupaten</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #222;">${pctFormatted}</span>
                </div>
            `;
        } else {
            let statusPerubahanHtml = '';
            if (type === 'gain') {
                statusPerubahanHtml = `
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Status Perubahan</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #00E676;">Pertambahan Vegetasi</span>
                </div>`;
            } else if (type === 'loss') {
                statusPerubahanHtml = `
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Status Perubahan</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #FF5252;">Pengurangan Vegetasi</span>
                </div>`;
            }

            detailsHtml = `
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Kabupaten</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #222;">Bogor</span>
                </div>
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Kecamatan</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #222;">${kecamatan}</span>
                </div>
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Objek Target</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #222;">Vegetasi</span>
                </div>
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Kategori Layer</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #222;">${kategoriLayer}</span>
                </div>
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Periode</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #222;">${periode}</span>
                </div>
                ${statusPerubahanHtml}
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Luas Area (Ha)</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #222;">${luasFormatted}</span>
                </div>
                <div style="display: grid; grid-template-columns: 180px 10px 1fr; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 500; color: #777;">Persentase terhadap luas wilayah (%)</span>
                    <span style="color: #777; font-weight: 500;">:</span>
                    <span style="font-weight: 600; color: #222;">${pctFormatted}</span>
                </div>
            `;
        }

        return `
            <div style="font-family: 'Poppins', sans-serif; font-size: 11px; color: #333; line-height: 1.45; padding: 4px; min-width: 310px; max-width: 350px;">
                <div style="font-weight: 800; font-size: 13px; margin-bottom: 12px; color: ${accentColor}; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${title}
                </div>
                
                <div style="margin-bottom: 10px;">
                    ${detailsHtml}
                </div>
                
                <div style="display: flex; gap: 20px; margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.08);">
                    <div>
                        <span style="font-size: 9px; color: #999; display: block; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Latitude</span>
                        <span style="font-weight: 600; color: #444; font-size: 11px;">${lat}</span>
                    </div>
                    <div>
                        <span style="font-size: 9px; color: #999; display: block; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Longitude</span>
                        <span style="font-weight: 600; color: #444; font-size: 11px;">${lng}</span>
                    </div>
                </div>
            </div>`;
    }



    // ===== LAYER REFERENCES =====
    const layerRefs = {
        batasAdmin: null, target2024: null, target2025: null, gain: null, loss: null
    };

    // Groups registered with Layer Control immediately → checkboxes appear right away.
    // Target layers are added directly to the map to avoid layerGroup overhead.
    const batasAdminGroup = L.layerGroup().addTo(map);   // visible on startup

    // NO built-in Layer Control — wired via custom HTML panel (see panel wiring below)

    // ===== LOAD BATAS KABUPATEN BOGOR =====
    fetch('assets/data/batas_kabupaten_bogor.geojson')
        .then(res => {
            if (!res.ok) throw new Error('Gagal memuat batas_kabupaten_bogor.geojson');
            return res.json();
        })
        .then(data => {
            // Convert Polygon/MultiPolygon to LineString/MultiLineString to prevent fill click capture on Canvas
            if (data && data.features) {
                data.features.forEach(f => {
                    if (f.geometry) {
                        if (f.geometry.type === 'Polygon') {
                            f.geometry.type = 'LineString';
                            f.geometry.coordinates = f.geometry.coordinates[0]; // exterior ring
                        } else if (f.geometry.type === 'MultiPolygon') {
                            f.geometry.type = 'MultiLineString';
                            f.geometry.coordinates = f.geometry.coordinates.map(poly => poly[0]); // exterior ring of each polygon
                        }
                    }
                });
            }

            const geoLayer = L.geoJSON(data, {
                pane: 'paneAdmin',
                renderer: canvasRenderer,
                style: () => layerStyles.batasAdmin,
                onEachFeature: (feature, layer) => {
                    layer.on('click', (e) => {
                        if (e.originalEvent) e.originalEvent.stopPropagation();
                        L.DomEvent.stopPropagation(e);
                        const popupContent = buildCustomPopup(feature, 'admin', e.latlng);
                        layer.bindPopup(popupContent).openPopup(e.latlng);
                    });

                    // Highlight on hover
                    layer.on({
                        mouseover: (e) => {
                            const l = e.target;
                            l.setStyle({
                                weight: 5,
                                color: '#FFB74D'
                            });
                        },
                        mouseout: (e) => {
                            const isFocused = (focusedLayerKey === null || focusedLayerKey === 'batasAdmin');
                            if (isFocused) {
                                geoLayer.resetStyle(e.target);
                            } else {
                                const orig = layerStyles.batasAdmin;
                                e.target.setStyle({
                                    color: orig.color,
                                    weight: orig.weight * 0.5,
                                    opacity: 0.15
                                });
                            }
                        }
                    });
                }
            });
            layerRefs.batasAdmin = geoLayer;
            geoLayer.addTo(batasAdminGroup);
            try {
                const bounds = geoLayer.getBounds();
                map.fitBounds(bounds, { padding: [40, 40] });
                window.geovistaInitBounds = bounds;
                
                const elLuas = document.getElementById('val-luas');
                if (elLuas) elLuas.innerHTML = '298.838,00 Ha';
            } catch (e) {
                map.setView([-6.55, 106.8], 10);
                const elLuas = document.getElementById('val-luas');
                if (elLuas) elLuas.innerHTML = '298.838,00 Ha';
            }
        })
        .catch(err => {
            console.warn('[GeoVista] batas_kabupaten_bogor.geojson:', err.message);
            const elLuas = document.getElementById('val-luas'); if (elLuas) elLuas.innerHTML = '298.838,00 Ha';
        });

    // ===== PRELOAD & CACHE LAYER ENGINE =====
    const lazyConfig = {
        target2024: { type: 'geojson', url: 'assets/data/target_2024.geojson', style: 'target2024', silent: false, statCard: 'val-t2024' },
        target2025: { type: 'geojson', url: 'assets/data/target_2025.geojson', style: 'target2025', silent: false, statCard: 'val-t2025' },
        gain:       { type: 'geojson', url: 'assets/data/gain_vegetasi.geojson', style: 'gain',       silent: true,  statCard: 'val-gain' },
        loss:       { type: 'geojson', url: 'assets/data/loss_vegetasi.geojson', style: 'loss',       silent: true,  statCard: 'val-loss' }
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
                
                const paneMap = {
                    'target2024': 'paneTarget2024',
                    'target2025': 'paneTarget2025',
                    'loss': 'paneLoss',
                    'gain': 'paneGain'
                };
                const paneName = paneMap[key] || 'overlayPane';

                const geoLayer = L.geoJSON(data, {
                    pane: paneName,
                    renderer: canvasRenderer,
                    style: () => layerStyles[cfg.style],
                    onEachFeature: (feature, layer) => {
                        layer.on('click', (e) => {
                            if (e.originalEvent) e.originalEvent.stopPropagation();
                            L.DomEvent.stopPropagation(e);
                            const popupContent = buildCustomPopup(feature, key, e.latlng);
                            layer.bindPopup(popupContent).openPopup(e.latlng);
                        });

                        // Tooltip hover
                        const areaHa = getAreaHectares(feature);
                        const areaText = areaHa.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' Ha';
                        const labelMap = {
                            gain: 'Gain',
                            loss: 'Loss',
                            target2024: 'Target 2024',
                            target2025: 'Target 2025'
                        };
                        const label = labelMap[key] || key;
                        layer.bindTooltip(`<strong>${label}</strong><br>${areaText}`, {
                            sticky: true,
                            direction: 'top',
                            opacity: 0.9,
                            className: 'custom-map-tooltip'
                        });

                        // Highlight on hover
                        layer.on({
                            mouseover: (e) => {
                                const l = e.target;
                                const orig = layerStyles[cfg.style];
                                l.setStyle({
                                    weight: (orig.weight || 1.5) + 1.5,
                                    fillOpacity: Math.min((orig.fillOpacity || 0.5) + 0.15, 0.95),
                                    color: '#ffffff'
                                });
                                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                    l.bringToFront();
                                }
                            },
                            mouseout: (e) => {
                                const isFocused = (focusedLayerKey === null || focusedLayerKey === key);
                                if (isFocused) {
                                    geoLayer.resetStyle(e.target);
                                } else {
                                    const orig = layerStyles[cfg.style];
                                    e.target.setStyle({
                                        color: orig.color,
                                        weight: orig.weight * 0.5,
                                        fillOpacity: orig.fillOpacity * 0.15,
                                        opacity: 0.15
                                    });
                                }
                            }
                        });
                    }
                });

                layerRefs[key] = geoLayer;
                updateActiveStats();
                updateActiveBadge();
 
                // Focus rendering edge case handler
                const isFocused = (focusedLayerKey === null || focusedLayerKey === key);
                if (!isFocused) {
                    const orig = layerStyles[cfg.style];
                    geoLayer.setStyle({
                        color: orig.color,
                        weight: orig.weight * 0.5,
                        fillOpacity: orig.fillOpacity * 0.15,
                        opacity: 0.15
                    });
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

    // Preload Target 2024 and 2025 in background
    function schedulePreload(key) {
        if (window.requestIdleCallback) {
            window.requestIdleCallback(() => loadLayerCache(key));
        } else {
            setTimeout(() => loadLayerCache(key), 1000);
        }
    }
    schedulePreload('target2024');
    schedulePreload('target2025');

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

    // ===== INTERACTIVE LEGEND FOCUS =====
    const legendMap = {
        'legend-admin': 'batasAdmin',
        'legend-target2024': 'target2024',
        'legend-target2025': 'target2025',
        'legend-gain': 'gain',
        'legend-loss': 'loss'
    };

    Object.keys(legendMap).forEach(id => {
        const row = document.getElementById(id);
        if (!row) return;
        
        row.style.cursor = 'pointer';
        row.style.transition = 'opacity 0.3s ease, transform 0.2s ease';
        
        row.addEventListener('click', () => {
            const key = legendMap[id];
            
            // If already focused, unfocus
            if (focusedLayerKey === key) {
                focusedLayerKey = null;
            } else {
                focusedLayerKey = key;
            }
            
            applyLegendFocus();
        });

        row.addEventListener('mouseenter', () => {
            if (focusedLayerKey === null) {
                row.style.transform = 'translateX(4px)';
            }
        });
        row.addEventListener('mouseleave', () => {
            if (focusedLayerKey === null) {
                row.style.transform = 'translateX(0)';
            } else if (focusedLayerKey === legendMap[id]) {
                row.style.transform = 'scale(1.05)';
            } else {
                row.style.transform = 'scale(0.95)';
            }
        });
    });

    function applyLegendFocus() {
        // 1. Update Legend UI styles
        Object.keys(legendMap).forEach(id => {
            const row = document.getElementById(id);
            const key = legendMap[id];
            if (!row) return;
            
            if (focusedLayerKey === null) {
                row.style.opacity = '1';
                row.style.transform = 'scale(1)';
                row.classList.remove('legend-active');
            } else if (focusedLayerKey === key) {
                row.style.opacity = '1';
                row.style.transform = 'scale(1.05)';
                row.classList.add('legend-active');
            } else {
                row.style.opacity = '0.35';
                row.style.transform = 'scale(0.95)';
                row.classList.remove('legend-active');
            }
        });
        
        // 2. Update Map Layers Opacities
        const keys = ['batasAdmin', 'target2024', 'target2025', 'gain', 'loss'];
        keys.forEach(k => {
            const targetLayer = k === 'batasAdmin' ? layerRefs.batasAdmin : layerRefs[k];
            if (!targetLayer) return;
            
            const isFocused = (focusedLayerKey === null || focusedLayerKey === k);
            
            if (isFocused) {
                // Restore original style
                const orig = k === 'batasAdmin' ? layerStyles.batasAdmin : layerStyles[lazyConfig[k].style];
                targetLayer.setStyle(orig);
            } else {
                // Dim style
                const orig = k === 'batasAdmin' ? layerStyles.batasAdmin : layerStyles[lazyConfig[k].style];
                targetLayer.setStyle({
                    color: orig.color,
                    weight: orig.weight * 0.5,
                    fillOpacity: orig.fillOpacity ? orig.fillOpacity * 0.15 : 0,
                    opacity: 0.15
                });
            }
        });
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
            
            // Stats counting animation
            animateValue('stat-luas-2024', 0, luas2024, 1500, 'Ha');
            animateValue('stat-luas-2025', 0, luas2025, 1500, 'Ha');
            animateValue('stat-gain', 0, gain, 1500, 'Ha');
            animateValue('stat-loss', 0, loss, 1500, 'Ha');
            animateValue('stat-net-change', 0, netChange, 1500, 'Ha');
            animateValue('stat-pct-change', 0, pctChange, 1500, '%');
            
            animateValue('val-t2024', 0, luas2024, 1500, 'Ha');
            animateValue('val-t2025', 0, luas2025, 1500, 'Ha');
            animateValue('val-gain', 0, gain, 1500, 'Ha');
            animateValue('val-loss', 0, loss, 1500, 'Ha');

            // Ringkasan temuan counting animation
            animateValue('rt-luas-2024', 0, luas2024, 1500, 'Ha');
            animateValue('rt-luas-2025', 0, luas2025, 1500, 'Ha');
            animateValue('rt-gain', 0, gain, 1500, 'Ha');
            animateValue('rt-loss', 0, loss, 1500, 'Ha');
            animateValue('rt-net-change', 0, netChange, 1500, 'Ha');
            animateValue('rt-pct-change', 0, pctChange, 1500, '%');
            
            // Draw Chart
            const ctx = document.getElementById('insightChart');
            if (ctx) {
                const barValuePlugin = {
                    id: 'barValuePlugin',
                    afterDraw(chart) {
                        const ctx = chart.ctx;
                        chart.data.datasets.forEach((dataset, i) => {
                            const meta = chart.getDatasetMeta(i);
                            meta.data.forEach((bar, index) => {
                                const data = dataset.data[index];
                                const label = data.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Ha';
                                ctx.fillStyle = '#ffffff';
                                ctx.font = '600 11px Poppins, sans-serif';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                ctx.fillText(label, bar.x, bar.y - 8);
                            });
                        });
                    }
                };

                new Chart(ctx, {
                    type: 'bar',
                    plugins: [barValuePlugin],
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
                        animation: {
                            duration: 2000,
                            easing: 'easeOutQuart'
                        },
                        plugins: { 
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(18, 60, 32, 0.95)',
                                titleFont: { family: 'Poppins', size: 13, weight: 'bold' },
                                bodyFont: { family: 'Poppins', size: 12 },
                                padding: 12,
                                cornerRadius: 8,
                                displayColors: false,
                                callbacks: {
                                    title: function(context) {
                                        return context[0].label;
                                    },
                                    label: function(context) {
                                        const val = context.raw;
                                        return 'Luas: ' + val.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' Ha';
                                    }
                                }
                            }
                        },
                        scales: { 
                            y: { 
                                beginAtZero: true,
                                grace: '15%',
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
                const totalArea = 298838; // total area of Kabupaten Bogor in Hectares
                const stable = totalArea - gain - loss;
                const totalPie = gain + loss + stable;
                const fmtPct = val => (val / totalArea * 100).toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
                
                new Chart(pieCtx, {
                    type: 'pie',
                    data: {
                        labels: ['Gain Area', 'Loss Area', 'Stable Area'],
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
                        animation: {
                            duration: 2000,
                            easing: 'easeOutQuart'
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(18, 60, 32, 0.95)',
                                titleFont: { family: 'Poppins', size: 13, weight: 'bold' },
                                bodyFont: { family: 'Poppins', size: 12 },
                                padding: 12,
                                cornerRadius: 8,
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.parsed;
                                        const pct = (value / totalArea * 100).toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
                                        return label + ': ' + value.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' Ha (' + pct + ')';
                                    }
                                }
                            }
                        }
                    }
                });

                // Custom Legend rendering
                const legendEl = document.getElementById('compositionLegend');
                if (legendEl) {
                    legendEl.innerHTML = `
                        <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9rem; line-height: 2.2;">
                            <li style="display: flex; align-items: center; gap: 10px;">
                                <span style="display: inline-block; width: 12px; height: 12px; background-color: #2E7D32; border-radius: 50%; flex-shrink: 0;"></span>
                                <span>Gain Area: <strong>${fmt(gain)} Ha</strong> (${fmtPct(gain)})</span>
                            </li>
                            <li style="display: flex; align-items: center; gap: 10px;">
                                <span style="display: inline-block; width: 12px; height: 12px; background-color: #D32F2F; border-radius: 50%; flex-shrink: 0;"></span>
                                <span>Loss Area: <strong>${fmt(loss)} Ha</strong> (${fmtPct(loss)})</span>
                            </li>
                            <li style="display: flex; align-items: center; gap: 10px;">
                                <span style="display: inline-block; width: 12px; height: 12px; background-color: #5C756B; border-radius: 50%; flex-shrink: 0;"></span>
                                <span>Stable Area: <strong>${fmt(stable)} Ha</strong> (${fmtPct(stable)})</span>
                            </li>
                        </ul>
                        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 0.8rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85;">
                            Total Area Klasifikasi ${fmt(totalArea)} Ha
                        </div>
                    `;
                }
            }
        })
        .catch(err => console.warn('[GeoVista] Ringkasan CSV:', err));

    // ===== RESET VIEW BUTTON =====
    document.getElementById('btnResetView')?.addEventListener('click', () => {
        if (window.geovistaInitBounds) map.fitBounds(window.geovistaInitBounds, { padding: [40, 40] });
        else map.setView([-6.55, 106.8], 10);
    });

    // ===== RESET LAYER BUTTON =====
    const btnResetLayer = document.getElementById('btnResetLayer');
    if (btnResetLayer) {
        btnResetLayer.addEventListener('click', () => {
            map.closePopup();

            // Clear kecamatan highlight
            if (highlightedKecamatanLayer) {
                map.removeLayer(highlightedKecamatanLayer);
                highlightedKecamatanLayer = null;
            }

            // Clear search box
            const srch = document.getElementById('kecamatan-search');
            const sugg = document.getElementById('search-suggestions');
            if (srch) srch.value = '';
            if (sugg) sugg.style.display = 'none';

            // Basemap reset
            const bmOsm = document.getElementById('bm-osm');
            if (bmOsm) {
                bmOsm.checked = true;
                map.removeLayer(activeBasemap);
                activeBasemap = osmStandard;
                map.addLayer(activeBasemap);
            }

            // Checkboxes reset
            if (chkAdmin) {
                chkAdmin.checked = true;
                if (!map.hasLayer(batasAdminGroup)) map.addLayer(batasAdminGroup);
            }
            if (chk2024) { chk2024.checked = true; toggleLayer('target2024', true); }
            if (chk2025) { chk2025.checked = true; toggleLayer('target2025', true); }
            if (chkGain) { chkGain.checked = false; toggleLayer('gain', false); }
            if (chkLoss) { chkLoss.checked = false; toggleLayer('loss', false); }

            focusedLayerKey = null;
            applyLegendFocus();

            // Reset view to Kabupaten Bogor
            if (window.geovistaInitBounds) map.fitBounds(window.geovistaInitBounds, { padding: [40, 40] });
            else map.setView([-6.55, 106.8], 10);

            updateActiveStats();
            updateActiveBadge();
        });
    }

    // ===== SEARCH KECAMATAN =====
    const searchInput = document.getElementById('kecamatan-search');
    const suggestionsDropdown = document.getElementById('search-suggestions');

    if (searchInput && suggestionsDropdown) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            suggestionsDropdown.innerHTML = '';
            if (!query) { suggestionsDropdown.style.display = 'none'; return; }

            // Use GeoJSON-built index, fallback to empty
            const source = kecamatanNameIndex.length > 0 ? kecamatanNameIndex : [];
            const matches = source.filter(n => n.toLowerCase().includes(query)).slice(0, 8);
            if (matches.length === 0) { suggestionsDropdown.style.display = 'none'; return; }

            suggestionsDropdown.style.display = 'block';
            matches.forEach(m => {
                const div = document.createElement('div');
                div.className = 'search-suggestion-item';
                div.textContent = m;
                div.addEventListener('click', () => {
                    searchInput.value = m;
                    suggestionsDropdown.style.display = 'none';
                    selectKecamatan(m);
                });
                suggestionsDropdown.appendChild(div);
            });
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const first = suggestionsDropdown.querySelector('.search-suggestion-item');
                if (first) first.click();
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestionsDropdown.contains(e.target)) {
                suggestionsDropdown.style.display = 'none';
            }
        });
    }

    function selectKecamatan(name) {
        if (!kecamatanGeoJSON) return;

        // Find GeoJSON feature by name
        const feature = kecamatanGeoJSON.features.find(f => extractKecamatanName(f.properties) === name);
        if (!feature) return;

        // Remove previous highlight
        if (highlightedKecamatanLayer) {
            map.removeLayer(highlightedKecamatanLayer);
            highlightedKecamatanLayer = null;
        }

        // Create new highlight
        highlightedKecamatanLayer = L.geoJSON(feature, {
            style: {
                color: '#FFD600',
                weight: 3,
                fillColor: '#FFD600',
                fillOpacity: 0.10,
                dashArray: null
            }
        }).addTo(map);

        // Zoom to bounds with padding
        const tempLayer = L.geoJSON(feature);
        const bounds = tempLayer.getBounds();
        map.fitBounds(bounds, { padding: [30, 30] });

        // Auto open popup at center
        const center = bounds.getCenter();
        const html = buildCustomPopup(feature, 'admin', center);

        setTimeout(() => {
            L.popup({ maxWidth: 280 })
                .setLatLng(center)
                .setContent(html)
                .openOn(map);
        }, 400);
    }

    // ===== ACTIVE STATS & BADGE ENGINE =====
    function updateActiveStats() {}
    function updateActiveBadge() {}

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

function renderGroundTruthSummary() {
    const el = document.getElementById('gt-summary-content');
    if (!el) return;

    el.innerHTML = `
        <div class="gt-summary-grid">
            <div class="gt-stat-card">
                <div class="gt-stat-icon"><i class="fas fa-map-pin"></i></div>
                <div class="gt-stat-value">300</div>
                <div class="gt-stat-label">Total Ground Truth</div>
            </div>

            <div class="gt-stat-card">
                <div class="gt-stat-icon"><i class="fas fa-calendar-check"></i></div>
                <div class="gt-stat-value">2024–2025</div>
                <div class="gt-stat-label">Periode Data</div>
            </div>

            <div class="gt-stat-card">
                <div class="gt-stat-icon"><i class="fas fa-tags"></i></div>
                <div class="gt-stat-value">2 Kelas</div>
                <div class="gt-stat-label">Jumlah Kelas</div>
            </div>

            <div class="gt-stat-card">
                <div class="gt-stat-icon"><i class="fas fa-flask"></i></div>
                <div class="gt-stat-value">210 / 90</div>
                <div class="gt-stat-label">Training / Testing Data</div>
            </div>
        </div>

        <div class="gt-section-title"><i class="fas fa-chart-bar"></i> Distribusi Kelas</div>
        <div class="gt-class-breakdown">
            <div class="gt-class-row">
                <div class="gt-class-label">
                    <span class="gt-class-dot" style="background:#4CAF50;"></span>
                    Vegetasi
                </div>
                <div class="gt-class-bar-wrap">
                    <div class="gt-class-bar" style="width:50%;background:#4CAF50;"></div>
                </div>
                <div class="gt-class-count"><strong>150 titik</strong> <span class="gt-pct">(50%)</span></div>
            </div>
            <div class="gt-class-row">
                <div class="gt-class-label">
                    <span class="gt-class-dot" style="background:#EF5350;"></span>
                    Non-Vegetasi
                </div>
                <div class="gt-class-bar-wrap">
                    <div class="gt-class-bar" style="width:50%;background:#EF5350;"></div>
                </div>
                <div class="gt-class-count"><strong>150 titik</strong> <span class="gt-pct">(50%)</span></div>
            </div>
        </div>

        <div class="gt-section-title"><i class="fas fa-calendar-alt"></i> Distribusi per Tahun</div>
        <div class="gt-year-breakdown">
            <div class="gt-year-block" style="background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15); border-radius: 12px; padding: 16px;">
                <div class="gt-year-title" style="font-size: 1rem; font-weight: 700; color: #F4C542; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-calendar-alt"></i> Tahun 2024
                </div>
                <ul style="padding: 0; margin: 0; list-style: none; font-size: 0.85rem; color: #FFFFFF; line-height: 1.8;">
                    <li style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span>Total Titik:</span>
                        <strong>150</strong>
                    </li>
                    <li style="display: flex; justify-content: space-between; margin-bottom: 6px; color:#4CAF50;">
                        <span><i class="fas fa-check-circle"></i> Vegetasi:</span>
                        <strong>75</strong>
                    </li>
                    <li style="display: flex; justify-content: space-between; color:#EF5350;">
                        <span><i class="fas fa-times-circle"></i> Non-Vegetasi:</span>
                        <strong>75</strong>
                    </li>
                </ul>
            </div>

            <div class="gt-year-block" style="background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15); border-radius: 12px; padding: 16px;">
                <div class="gt-year-title" style="font-size: 1rem; font-weight: 700; color: #F4C542; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-calendar-alt"></i> Tahun 2025
                </div>
                <ul style="padding: 0; margin: 0; list-style: none; font-size: 0.85rem; color: #FFFFFF; line-height: 1.8;">
                    <li style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span>Total Titik:</span>
                        <strong>150</strong>
                    </li>
                    <li style="display: flex; justify-content: space-between; margin-bottom: 6px; color:#4CAF50;">
                        <span><i class="fas fa-check-circle"></i> Vegetasi:</span>
                        <strong>75</strong>
                    </li>
                    <li style="display: flex; justify-content: space-between; color:#EF5350;">
                        <span><i class="fas fa-times-circle"></i> Non-Vegetasi:</span>
                        <strong>75</strong>
                    </li>
                </ul>
            </div>
        </div>
    `;
}

function renderGroundTruthFallback() {
    renderGroundTruthSummary();
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

// ===== KECAMATAN CHANGE LOADER AND CHARTS =====
function loadKecamatanChangeJSON() {
    fetch('assets/data/kecamatan_change.json')
        .then(res => {
            if (!res.ok) throw new Error('Gagal memuat kecamatan_change.json');
            return res.json();
        })
        .then(data => {
            renderKecamatanChartsAndCards(data);
        })
        .catch(err => {
            console.warn('[GeoVista] loadKecamatanChangeJSON:', err.message);
        });
}

function renderKecamatanChartsAndCards(data) {
    if (!data || !Array.isArray(data)) return;

    // Filter, sort, and process data
    // Calculate total change (gain + loss) and net change for each kecamatan
    const processed = data.map(item => {
        const gain = parseFloat(item.gain_ha || 0);
        const loss = parseFloat(item.loss_ha || 0);
        const net = gain - loss;
        const totalVolume = gain + loss;
        return {
            name: item.kecamatan,
            gain,
            loss,
            net,
            totalVolume
        };
    });

    // 1. Sort by totalVolume descending to get "Perubahan Terbesar" for chart
    const top10Volume = [...processed]
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .slice(0, 10);

    // 2. Sort by gain descending to get Top 5 Gain
    const top5Gain = [...processed]
        .sort((a, b) => b.gain - a.gain)
        .slice(0, 5);

    // 3. Sort by loss descending to get Top 5 Loss
    const top5Loss = [...processed]
        .sort((a, b) => b.loss - a.loss)
        .slice(0, 5);

    // Populate Top 5 Gain List in UI
    const gainListEl = document.getElementById('top-gain-list');
    if (gainListEl) {
        gainListEl.innerHTML = '';
        const medals = ['1.', '2.', '3.', '4.', '5.'];
        top5Gain.forEach((item, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `${medals[idx]} <span class="name">${item.name}</span> <span class="value">+${item.gain.toLocaleString('id-ID', {maximumFractionDigits: 2})} Ha</span>`;
            gainListEl.appendChild(li);
        });
    }

    // Populate Top 5 Loss List in UI
    const lossListEl = document.getElementById('top-loss-list');
    if (lossListEl) {
        lossListEl.innerHTML = '';
        const medals = ['1.', '2.', '3.', '4.', '5.'];
        top5Loss.forEach((item, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `${medals[idx]} <span class="name">${item.name}</span> <span class="value" style="color: #FF5252;">-${item.loss.toLocaleString('id-ID', {maximumFractionDigits: 2})} Ha</span>`;
            lossListEl.appendChild(li);
        });
    }

    // Populate Mini KPIs
    // Top Gain name
    const topGainKec = top5Gain[0] ? `${top5Gain[0].name} (+${top5Gain[0].gain.toLocaleString('id-ID', {maximumFractionDigits: 0})} Ha)` : '-';
    const topGainEl = document.getElementById('kpi-top-gain');
    if (topGainEl) topGainEl.innerText = topGainKec;

    // Top Loss name
    const topLossKec = top5Loss[0] ? `${top5Loss[0].name} (-${top5Loss[0].loss.toLocaleString('id-ID', {maximumFractionDigits: 0})} Ha)` : '-';
    const topLossEl = document.getElementById('kpi-top-loss');
    if (topLossEl) topLossEl.innerText = topLossKec;

    // Total Kecamatan Berubah (with positive gain or loss)
    const activeKecs = processed.filter(item => item.gain > 0.01 || item.loss > 0.01).length;
    const totalKecEl = document.getElementById('kpi-total-kec');
    if (totalKecEl) totalKecEl.innerText = `${activeKecs} Kecamatan`;

    // Persentase Area Berubah
    // Total gain + loss area over total area (298838 Ha)
    const totalChangedArea = processed.reduce((acc, curr) => acc + curr.totalVolume, 0);
    const pctChangedArea = (totalChangedArea / 298838) * 100;
    const pctChangeEl = document.getElementById('kpi-pct-change');
    if (pctChangeEl) pctChangeEl.innerText = `${pctChangedArea.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`;

    // 4. Render Kecamatan Chart (Horizontal Grouped Bar Chart)
    const kecCanvas = document.getElementById('kecamatanChart');
    if (kecCanvas) {
        const labels = top10Volume.map(item => item.name);
        const gainData = top10Volume.map(item => item.gain);
        const lossData = top10Volume.map(item => item.loss);

        new Chart(kecCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Gain Area (Ha)',
                        data: gainData,
                        backgroundColor: '#2E7D32',
                        borderRadius: 4
                    },
                    {
                        label: 'Loss Area (Ha)',
                        data: lossData,
                        backgroundColor: '#D32F2F',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#ffffff',
                            font: { family: 'Poppins', size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(18, 60, 32, 0.95)',
                        titleFont: { family: 'Poppins', size: 12, weight: 'bold' },
                        bodyFont: { family: 'Poppins', size: 11 },
                        padding: 10,
                        cornerRadius: 6
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff',
                            font: { family: 'Poppins', size: 10 }
                        },
                        grid: { color: 'rgba(255,255,255,0.08)' }
                    },
                    y: {
                        ticks: {
                            color: '#ffffff',
                            font: { family: 'Poppins', size: 10, weight: 'bold' }
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }
}

// ===== SCROLL REVEAL FUNCTION =====
function initScrollReveal() {
    const revealEls = document.querySelectorAll('.scroll-reveal');
    if (revealEls.length === 0) return;

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
}

