class LandUseVisualizer {
    constructor() {
        this.data = {
            '2020': null,
            '2022': null,
            '2024': null
        };
        this.currentSite = null;
        this.selectedCategories = new Set([
            'water', 'trees', 'floodVegetation', 'crops', 'builtArea', 'bareGround', 'rangeland'
        ]);
        this.categoryIcons = {
            water: 'fas fa-tint',
            trees: 'fas fa-tree',
            floodVegetation: 'fas fa-water',
            crops: 'fas fa-seedling',
            builtArea: 'fas fa-building',
            bareGround: 'fas fa-mountain',
            rangeland: 'fas fa-paw'
        };
        this.categoryColors = {
            water: '#3498db',
            trees: '#27ae60',
            floodVegetation: '#1abc9c',
            crops: '#f1c40f',
            builtArea: '#e74c3c',
            bareGround: '#95a5a6',
            rangeland: '#8e44ad'
        };
        
        // Map variables
        this.map = null;
        this.siteMarkers = {};
        this.selectedMarker = null;
        this.geoTiffLayers = {
            '2020': null,
            '2022': null,
            '2024': null
        };
        this.currentLayer = '2024';
        this.satelliteLayer = null;
        
        // Site coordinates (you'll need to add your actual coordinates here)
        this.siteCoordinates = {
            // Example coordinates - YOU NEED TO REPLACE THESE WITH YOUR ACTUAL COORDINATES
            "Abiyiadi TVET College": { lat: 13.5, lng: 39.5 },
            "Abreha We'atsbha Elementary School": { lat: 13.6, lng: 39.6 },
            "Adi Daero Cambo": { lat: 13.7, lng: 39.7 }
            // Add all your 70 sites here with their actual coordinates
        };
        
        this.chart = null;
        
        this.init();
    }
    
    async init() {
        this.showLoadingState();
        this.setupEventListeners();
        this.populateCategoryCards();
        await this.initializeMap();
        await this.loadData();
    }
    
    showLoadingState() {
        document.getElementById('loadingChart').style.display = 'flex';
        document.getElementById('mainChart').style.display = 'none';
        document.getElementById('dataStatusText').textContent = 'Loading data...';
        document.getElementById('selectedSiteInfo').textContent = 'No site selected';
    }
    
    hideLoadingState() {
        document.getElementById('loadingChart').style.display = 'none';
        document.getElementById('mainChart').style.display = 'block';
    }
    
    setupEventListeners() {
        // Site selection from top bar
        document.getElementById('siteSelect').addEventListener('change', (e) => {
            const siteName = e.target.value;
            this.currentSite = siteName;
            if (this.currentSite) {
                this.updateVisualization();
                this.updateCategoryPercentages();
                this.zoomToSite(this.currentSite);
                document.getElementById('dataStatusText').textContent = `Viewing: ${this.currentSite}`;
                document.getElementById('selectedSiteInfo').textContent = this.currentSite;
            } else {
                document.getElementById('dataStatusText').textContent = 'Select a site';
                document.getElementById('selectedSiteInfo').textContent = 'No site selected';
                this.resetMapView();
            }
        });
        
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.loadData();
        });
        
        // Map layer buttons
        document.querySelectorAll('.layer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const year = e.target.dataset.year;
                this.switchMapLayer(year);
                
                // Update active state
                document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update layer info
                const layerName = year === 'satellite' ? 'Satellite View' : `${year} Land Use`;
                document.getElementById('currentLayer').textContent = layerName;
            });
        });
    }
    
    async initializeMap() {
        try {
            // Initialize map with a default center (you may want to adjust this)
            const defaultCenter = [13.5, 39.5]; // Approximate center of Ethiopia
            this.map = L.map('map').setView(defaultCenter, 8);
            
            // Add base layers
            this.satelliteLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);
            
            // Load GeoTIFF layers
            await this.loadGeoTIFFLayers();
            
            // Set default layer
            this.switchMapLayer('2024');
            
            console.log('Map initialized successfully');
            
        } catch (error) {
            console.error('Error initializing map:', error);
            document.getElementById('map').innerHTML = `
                <div style="padding: 20px; text-align: center; color: #666;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Unable to load map. Please check your internet connection.</p>
                </div>
            `;
        }
    }
    
    async loadGeoTIFFLayers() {
        const years = ['2020', '2022', '2024'];
        
        for (const year of years) {
            try {
                const url = `data/c${year}_02.tif`;
                console.log(`Loading GeoTIFF for ${year}: ${url}`);
                
                // Create GeoTIFF layer
                const layer = await createGeoTIFFLayer(url);
                this.geoTiffLayers[year] = layer;
                
                console.log(`GeoTIFF layer for ${year} loaded successfully`);
                
            } catch (error) {
                console.error(`Error loading GeoTIFF for ${year}:`, error);
                // Create a placeholder layer if GeoTIFF fails to load
                this.geoTiffLayers[year] = L.layerGroup();
            }
        }
    }
    
    switchMapLayer(year) {
        // Remove all layers
        if (this.geoTiffLayers['2020']) this.map.removeLayer(this.geoTiffLayers['2020']);
        if (this.geoTiffLayers['2022']) this.map.removeLayer(this.geoTiffLayers['2022']);
        if (this.geoTiffLayers['2024']) this.map.removeLayer(this.geoTiffLayers['2024']);
        if (this.satelliteLayer) this.map.removeLayer(this.satelliteLayer);
        
        // Add selected layer
        if (year === 'satellite') {
            this.satelliteLayer.addTo(this.map);
            this.currentLayer = 'satellite';
        } else {
            const layer = this.geoTiffLayers[year];
            if (layer) {
                layer.addTo(this.map);
                this.currentLayer = year;
            } else {
                // Fallback to satellite if GeoTIFF not available
                this.satelliteLayer.addTo(this.map);
                this.currentLayer = 'satellite';
            }
        }
    }
    
    async loadData() {
        console.log('Starting data load...');
        
        this.showLoadingState();
        document.getElementById('retryBtn').style.display = 'none';
        document.getElementById('loadingMessage').textContent = 'Loading data from repository...';
        document.getElementById('dataStatusText').textContent = 'Loading data...';
        
        try {
            const years = ['2020', '2022', '2024'];
            let allLoaded = true;
            
            for (const year of years) {
                try {
                    console.log(`Loading ${year} data...`);
                    const response = await fetch(`data/${year}-Result-exc.json`);
                    
                    if (response.ok) {
                        const jsonData = await response.json();
                        console.log(`${year} data loaded:`, jsonData.length, 'records');
                        
                        if (Array.isArray(jsonData) && jsonData.length > 0) {
                            this.data[year] = this.cleanData(jsonData, year);
                        } else {
                            allLoaded = false;
                        }
                    } else {
                        console.error(`Failed to load ${year} data: ${response.status}`);
                        allLoaded = false;
                    }
                } catch (error) {
                    console.error(`Error loading ${year} data:`, error);
                    allLoaded = false;
                }
            }
            
            if (allLoaded) {
                this.populateSiteSelect();
                this.addSiteMarkersToMap();
                document.getElementById('loadingMessage').textContent = 'Data loaded successfully!';
                
                const uniqueSites = this.getAllSites();
                console.log('Unique sites found:', Array.from(uniqueSites));
                document.getElementById('siteCount').textContent = `${uniqueSites.size} sites loaded`;
                document.getElementById('dataStatusText').textContent = 'Select a site to begin';
                
                if (uniqueSites.size > 0) {
                    const firstSite = Array.from(uniqueSites)[0];
                    const siteSelect = document.getElementById('siteSelect');
                    siteSelect.value = firstSite;
                    this.currentSite = firstSite;
                    this.updateVisualization();
                    this.updateCategoryPercentages();
                    this.zoomToSite(this.currentSite);
                    document.getElementById('dataStatusText').textContent = `Viewing: ${this.currentSite}`;
                    document.getElementById('selectedSiteInfo').textContent = this.currentSite;
                }
            } else {
                document.getElementById('loadingMessage').textContent = 'Failed to load some data files.';
                document.getElementById('retryBtn').style.display = 'inline-flex';
                document.getElementById('dataStatusText').textContent = 'Data loading failed';
            }
        } catch (error) {
            console.error('Critical error loading data:', error);
            document.getElementById('loadingMessage').textContent = 'Critical error loading data.';
            document.getElementById('retryBtn').style.display = 'inline-flex';
            document.getElementById('dataStatusText').textContent = 'Data loading failed';
        }
    }
    
    addSiteMarkersToMap() {
        // Clear existing markers
        Object.values(this.siteMarkers).forEach(marker => {
            if (marker) this.map.removeLayer(marker);
        });
        this.siteMarkers = {};
        
        // Add markers for each site
        const sites = this.getAllSites();
        
        sites.forEach(siteName => {
            const coordinates = this.getSiteCoordinates(siteName);
            if (coordinates) {
                const marker = this.createSiteMarker(siteName, coordinates);
                this.siteMarkers[siteName] = marker;
                marker.addTo(this.map);
            }
        });
    }
    
    createSiteMarker(siteName, coordinates) {
        // Create custom HTML marker
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<i class="fas fa-map-marker-alt"></i>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        const marker = L.marker(coordinates, { icon: icon });
        
        // Add click event
        marker.on('click', () => {
            this.selectSite(siteName);
        });
        
        // Add tooltip
        marker.bindTooltip(siteName, {
            direction: 'top',
            offset: [0, -20],
            opacity: 0.9
        });
        
        return marker;
    }
    
    getSiteCoordinates(siteName) {
        // Return coordinates if available, otherwise use a default
        if (this.siteCoordinates[siteName]) {
            return this.siteCoordinates[siteName];
        }
        
        // Generate random coordinates within Ethiopia bounds as fallback
        // YOU SHOULD REPLACE THIS WITH YOUR ACTUAL COORDINATES
        const ethiopiaBounds = {
            minLat: 3.4, maxLat: 14.9,
            minLng: 32.9, maxLng: 47.9
        };
        
        return {
            lat: ethiopiaBounds.minLat + Math.random() * (ethiopiaBounds.maxLat - ethiopiaBounds.minLat),
            lng: ethiopiaBounds.minLng + Math.random() * (ethiopiaBounds.maxLng - ethiopiaBounds.minLng)
        };
    }
    
    selectSite(siteName) {
        // Update dropdown
        document.getElementById('siteSelect').value = siteName;
        this.currentSite = siteName;
        
        // Update visualization
        this.updateVisualization();
        this.updateCategoryPercentages();
        this.zoomToSite(siteName);
        
        // Update UI text
        document.getElementById('dataStatusText').textContent = `Viewing: ${siteName}`;
        document.getElementById('selectedSiteInfo').textContent = siteName;
    }
    
    zoomToSite(siteName) {
        const coordinates = this.getSiteCoordinates(siteName);
        if (coordinates && this.map) {
            // Update marker style
            if (this.selectedMarker) {
                this.selectedMarker._icon.classList.remove('selected');
            }
            
            const marker = this.siteMarkers[siteName];
            if (marker && marker._icon) {
                marker._icon.classList.add('selected');
                this.selectedMarker = marker;
            }
            
            // Zoom to the site
            this.map.setView([coordinates.lat, coordinates.lng], 12);
            
            // Open tooltip
            if (marker) {
                marker.openTooltip();
            }
        }
    }
    
    resetMapView() {
        // Reset to default view
        if (this.map) {
            this.map.setView([13.5, 39.5], 8);
        }
        
        // Reset marker style
        if (this.selectedMarker) {
            this.selectedMarker._icon.classList.remove('selected');
            this.selectedMarker = null;
        }
    }
    
    // Helper function to create GeoTIFF layer
    async function createGeoTIFFLayer(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const georaster = await parseGeoraster(arrayBuffer);
            
            return new GeoRasterLayer({
                georaster,
                opacity: 0.7,
                resolution: 256
            });
        } catch (error) {
            console.error('Error creating GeoTIFF layer:', error);
            return L.layerGroup(); // Return empty layer group as fallback
        }
    }
    
    // Rest of your existing methods remain the same...
    cleanData(data, year) {
        if (!Array.isArray(data)) return [];
        
        return data.map(item => {
            const cleaned = {};
            
            const findValue = (possibleKeys) => {
                const itemKeys = Object.keys(item);
                
                for (const key of possibleKeys) {
                    if (item[key] !== undefined) {
                        return item[key];
                    }
                }
                
                const lowerPossibleKeys = possibleKeys.map(k => k.toLowerCase());
                for (const itemKey of itemKeys) {
                    if (lowerPossibleKeys.includes(itemKey.toLowerCase())) {
                        return item[itemKey];
                    }
                }
                
                return 0;
            };
            
            const siteNameKeys = ['Site_Name', 'Site Name', 'site_name', 'SiteName', 'Site', 'Name'];
            cleaned.Site_Name = findValue(siteNameKeys) || 'Unknown Site';
            
            cleaned.Total_Area_sq_km = findValue(['Total_Area_sq_km', 'Total_Area_sq km', 'Total Area (sq km)', 'Total_Area', 'total_area', 'Area']);
            
            cleaned.Water_Percent = findValue(['Water_Percent', 'Water Percent', 'water_percent', 'Water%']);
            cleaned.Trees_Percent = findValue(['Trees_Percent', 'Trees Percent', 'trees_percent', 'Trees%']);
            cleaned.FloodVegetation_Percent = findValue(['FloodVegetation_Percent', 'FloodVegetation Percent', 'Flood_Vegetation_Percent', 'FloodVegetation%']);
            cleaned.Crops_Percent = findValue(['Crops_Percent', 'Crops Percent', 'crops_percent', 'Crops%']);
            cleaned.BuiltArea_Percent = findValue(['BuiltArea_Percent', 'BuiltArea Percent', 'Built_Area_Percent', 'BuiltArea%']);
            cleaned.BareGround_Percent = findValue(['BareGround_Percent', 'BareGround Percent', 'Bare_Ground_Percent', 'BareGround%']);
            cleaned.Rangeland_Percent = findValue(['Rangeland_Percent', 'Rangeland Percent', 'rangeland_percent', 'Rangeland%']);
            
            if (year === '2024') {
                const class11Percent = findValue(['Class_11_Percent', 'Class11_Percent', 'Class 11 Percent']);
                if (class11Percent > 0) {
                    cleaned.Rangeland_Percent = class11Percent;
                }
            }
            
            Object.keys(cleaned).forEach(key => {
                if (key !== 'Site_Name' && cleaned[key] !== null && cleaned[key] !== undefined) {
                    const num = parseFloat(cleaned[key]);
                    cleaned[key] = isNaN(num) ? 0 : num;
                }
            });
            
            return cleaned;
        });
    }
    
    getAllSites() {
        const sites = new Set();
        
        Object.keys(this.data).forEach(year => {
            if (this.data[year]) {
                this.data[year].forEach(item => {
                    if (item.Site_Name && item.Site_Name !== 'Unknown Site') {
                        sites.add(item.Site_Name);
                    }
                });
            }
        });
        
        return sites;
    }
    
    populateSiteSelect() {
        const siteSelect = document.getElementById('siteSelect');
        const sites = this.getAllSites();
        
        siteSelect.innerHTML = '<option value="">-- Select a site --</option>';
        
        if (sites.size === 0) {
            siteSelect.innerHTML = '<option value="">No sites found in data</option>';
            siteSelect.disabled = true;
            return;
        }
        
        const sortedSites = Array.from(sites).sort();
        
        sortedSites.forEach(site => {
            const option = document.createElement('option');
            option.value = site;
            option.textContent = site;
            siteSelect.appendChild(option);
        });
        
        siteSelect.disabled = false;
    }
    
    populateCategoryCards() {
        const container = document.getElementById('categoriesGrid');
        container.innerHTML = '';
        
        const categories = [
            { id: 'water', label: 'Water', percentKey: 'Water_Percent' },
            { id: 'trees', label: 'Trees', percentKey: 'Trees_Percent' },
            { id: 'floodVegetation', label: 'Flood Vegetation', percentKey: 'FloodVegetation_Percent' },
            { id: 'crops', label: 'Crops', percentKey: 'Crops_Percent' },
            { id: 'builtArea', label: 'Built Area', percentKey: 'BuiltArea_Percent' },
            { id: 'bareGround', label: 'Bare Ground', percentKey: 'BareGround_Percent' },
            { id: 'rangeland', label: 'Rangeland', percentKey: 'Rangeland_Percent' }
        ];
        
        categories.forEach(category => {
            const card = document.createElement('div');
            card.className = `category-card ${this.selectedCategories.has(category.id) ? 'active' : ''}`;
            card.dataset.category = category.id;
            card.innerHTML = `
                <div class="category-toggle">
                    <i class="fas fa-check"></i>
                </div>
                <div class="category-icon">
                    <i class="${this.categoryIcons[category.id]}"></i>
                </div>
                <div class="category-label">${category.label}</div>
                <div class="category-percent" id="percent-${category.id}">0%</div>
            `;
            
            card.addEventListener('click', () => {
                this.toggleCategory(category.id, card);
            });
            
            container.appendChild(card);
        });
    }
    
    toggleCategory(categoryId, card) {
        if (this.selectedCategories.has(categoryId)) {
            this.selectedCategories.delete(categoryId);
            card.classList.remove('active');
        } else {
            this.selectedCategories.add(categoryId);
            card.classList.add('active');
        }
        
        if (this.currentSite) {
            this.updateVisualization();
        }
    }
    
    getSiteData(siteName, year) {
        if (!this.data[year]) return null;
        return this.data[year].find(site => site.Site_Name === siteName);
    }
    
    updateCategoryPercentages() {
        if (!this.currentSite) return;
        
        const siteData2024 = this.getSiteData(this.currentSite, '2024');
        if (!siteData2024) return;
        
        const percentMap = {
            water: siteData2024.Water_Percent || 0,
            trees: siteData2024.Trees_Percent || 0,
            floodVegetation: siteData2024.FloodVegetation_Percent || 0,
            crops: siteData2024.Crops_Percent || 0,
            builtArea: siteData2024.BuiltArea_Percent || 0,
            bareGround: siteData2024.BareGround_Percent || 0,
            rangeland: siteData2024.Rangeland_Percent || 0
        };
        
        Object.entries(percentMap).forEach(([category, percent]) => {
            const element = document.getElementById(`percent-${category}`);
            if (element) {
                element.textContent = `${percent.toFixed(2)}%`;
            }
        });
    }
    
    updateVisualization() {
        if (!this.currentSite) return;
        
        this.hideLoadingState();
        
        const years = ['2020', '2022', '2024'];
        const categories = {
            water: { label: 'Water', key: 'Water_Percent' },
            trees: { label: 'Trees', key: 'Trees_Percent' },
            floodVegetation: { label: 'Flood Vegetation', key: 'FloodVegetation_Percent' },
            crops: { label: 'Crops', key: 'Crops_Percent' },
            builtArea: { label: 'Built Area', key: 'BuiltArea_Percent' },
            bareGround: { label: 'Bare Ground', key: 'BareGround_Percent' },
            rangeland: { label: 'Rangeland', key: 'Rangeland_Percent' }
        };
        
        const datasets = [];
        const selectedCategories = Array.from(this.selectedCategories);
        
        const nonZeroCategories = selectedCategories.filter(categoryId => {
            const category = categories[categoryId];
            const hasNonZeroValue = years.some(year => {
                const siteData = this.getSiteData(this.currentSite, year);
                const value = siteData ? (siteData[category.key] || 0) : 0;
                return value > 0.01;
            });
            return hasNonZeroValue;
        });
        
        if (nonZeroCategories.length === 0) {
            document.getElementById('loadingChart').style.display = 'flex';
            document.getElementById('mainChart').style.display = 'none';
            document.getElementById('loadingChart').innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-chart-bar"></i>
                    <h3>No Data Available</h3>
                    <p>All selected categories have zero values for this site.</p>
                </div>
            `;
            return;
        }
        
        nonZeroCategories.forEach(categoryId => {
            const category = categories[categoryId];
            const data = years.map(year => {
                const siteData = this.getSiteData(this.currentSite, year);
                const value = siteData ? (siteData[category.key] || 0) : 0;
                return value > 0.01 ? value : 0;
            });
            
            datasets.push({
                label: category.label,
                data: data,
                backgroundColor: this.categoryColors[categoryId],
                borderColor: this.categoryColors[categoryId],
                borderWidth: 2,
                borderRadius: 6,
                categoryPercentage: 0.8,
                barPercentage: 0.9
            });
        });
        
        this.updateChart(years, datasets, nonZeroCategories.length);
        this.updateTimeline(years);
        this.updateCategoryPercentages();
    }
    
    updateChart(labels, datasets, categoryCount) {
        const ctx = document.getElementById('mainChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        const hideZeroBarsPlugin = {
            id: 'hideZeroBars',
            beforeDraw: (chart) => {
                const meta = chart.getDatasetMeta(0);
                if (!meta || !meta.data) return;
                
                meta.data.forEach((bar, index) => {
                    const dataset = chart.data.datasets[0];
                    if (dataset.data[index] === 0) {
                        bar.hidden = true;
                    }
                });
            }
        };
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14,
                                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                            },
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'rectRounded'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#2c3e50',
                        bodyColor: '#4a5568',
                        borderColor: '#e1e5eb',
                        borderWidth: 1,
                        padding: 12,
                        filter: (tooltipItem) => {
                            return tooltipItem.parsed.y > 0.01;
                        },
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                if (value < 0.01) return null;
                                return `${context.dataset.label}: ${value.toFixed(2)}%`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: '#2c3e50',
                        anchor: 'end',
                        align: 'top',
                        formatter: function(value, context) {
                            return value > 0.01 ? value.toFixed(1) + '%' : '';
                        },
                        font: {
                            weight: 'bold',
                            size: 11
                        },
                        padding: {
                            top: 4
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 14,
                                weight: '600'
                            },
                            color: '#2c3e50'
                        },
                        title: {
                            display: true,
                            text: 'Year',
                            font: {
                                size: 16,
                                weight: '600'
                            },
                            color: '#2c3e50',
                            padding: { top: 10 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        stacked: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 13
                            },
                            color: '#4a5568',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Percentage (%)',
                            font: {
                                size: 16,
                                weight: '600'
                            },
                            color: '#2c3e50',
                            padding: { bottom: 10 }
                        },
                        max: categoryCount > 0 ? 100 : 10
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 750,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: {
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20
                    }
                }
            },
            plugins: [ChartDataLabels, hideZeroBarsPlugin]
        });
    }
    
    updateTimeline(years) {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '';
        
        const siteData2020 = this.getSiteData(this.currentSite, '2020');
        const siteData2022 = this.getSiteData(this.currentSite, '2022');
        const siteData2024 = this.getSiteData(this.currentSite, '2024');
        
        if (!siteData2020 || !siteData2022 || !siteData2024) {
            timeline.innerHTML = '<div class="no-data">Complete data not available for all years</div>';
            return;
        }
        
        const timelineData = [
            { year: '2020', data: siteData2020 },
            { year: '2022', data: siteData2022 },
            { year: '2024', data: siteData2024 }
        ];
        
        timelineData.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'timeline-item';
            
            let builtChange = '';
            let treesChange = '';
            let cropsChange = '';
            
            if (index > 0) {
                const prevItem = timelineData[index - 1];
                
                const prevBuilt = prevItem.data.BuiltArea_Percent || 0;
                const currentBuilt = item.data.BuiltArea_Percent || 0;
                const builtDiff = currentBuilt - prevBuilt;
                builtChange = this.formatChange(builtDiff);
                
                const prevTrees = prevItem.data.Trees_Percent || 0;
                const currentTrees = item.data.Trees_Percent || 0;
                const treesDiff = currentTrees - prevTrees;
                treesChange = this.formatChange(treesDiff);
                
                const prevCrops = prevItem.data.Crops_Percent || 0;
                const currentCrops = item.data.Crops_Percent || 0;
                const cropsDiff = currentCrops - prevCrops;
                cropsChange = this.formatChange(cropsDiff);
            }
            
            div.innerHTML = `
                <div class="timeline-year">${item.year}</div>
                <div class="timeline-changes">
                    <div class="change-item">
                        <span class="change-label">
                            <i class="fas fa-building" style="color: ${this.categoryColors.builtArea};"></i>
                            <span>Built Area</span>
                        </span>
                        <span class="change-value ${this.getChangeClass(builtChange)}">
                            ${index === 0 ? item.data.BuiltArea_Percent.toFixed(1) + '%' : builtChange}
                        </span>
                    </div>
                    <div class="change-item">
                        <span class="change-label">
                            <i class="fas fa-tree" style="color: ${this.categoryColors.trees};"></i>
                            <span>Trees</span>
                        </span>
                        <span class="change-value ${this.getChangeClass(treesChange)}">
                            ${index === 0 ? item.data.Trees_Percent.toFixed(1) + '%' : treesChange}
                        </span>
                    </div>
                    <div class="change-item">
                        <span class="change-label">
                            <i class="fas fa-seedling" style="color: ${this.categoryColors.crops};"></i>
                            <span>Crops</span>
                        </span>
                        <span class="change-value ${this.getChangeClass(cropsChange)}">
                            ${index === 0 ? item.data.Crops_Percent.toFixed(1) + '%' : cropsChange}
                        </span>
                    </div>
                </div>
            `;
            
            timeline.appendChild(div);
        });
    }
    
    formatChange(value) {
        if (value === 0) return '0%';
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    }
    
    getChangeClass(changeStr) {
        if (changeStr.startsWith('+')) return 'positive';
        if (changeStr.startsWith('-')) return 'negative';
        return 'neutral';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing LandUseVisualizer...');
    new LandUseVisualizer();
});
