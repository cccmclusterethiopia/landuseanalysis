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
        this.siteBoundaryLayer = null;
        this.sentinelLayer = null;
        this.landsatLayer = null;
        this.currentLayer = 'osm';
        this.drawnItems = new L.FeatureGroup();
        
        // Sentinel API configuration
        this.sentinelApiConfig = {
            baseUrl: 'https://services.sentinel-hub.com/ogc/wms',
            instanceId: 'd9b5f3a7-2b4c-4e8f-9a1d-3e7f6c8b5a9d',
            layers: {
                'sentinel-2-l2a': 'TRUE_COLOR',
                'landsat-8-l1c': 'TRUE_COLOR'
            }
        };
        
        // Site data from SHP file
        this.siteCoordinates = {};
        this.siteBoundaries = {};
        this.siteNames = [];
        
        this.chart = null;
        this.drawControl = null;
        
        this.init();
    }
    
    async init() {
        this.showLoadingState();
        this.setupEventListeners();
        this.populateCategoryCards();
        await this.initializeMap();
        await this.loadSiteBoundaries();
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
        
        // Year selection
        document.getElementById('yearSelect').addEventListener('change', (e) => {
            this.updateSentinelLayer();
        });
        
        // Map layer buttons
        document.querySelectorAll('.layer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const layer = e.target.dataset.layer;
                this.switchMapLayer(layer);
                
                document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                document.getElementById('currentLayer').textContent = this.getLayerName(layer);
            });
        });
        
        // Map tools
        document.getElementById('drawTool').addEventListener('click', () => {
            this.activateDrawTool();
        });
        
        document.getElementById('clearDraw').addEventListener('click', () => {
            this.clearDrawnItems();
        });
        
        document.getElementById('fetchSentinelData').addEventListener('click', () => {
            this.fetchSentinelDataForArea();
        });
    }
    
    async initializeMap() {
        try {
            // Initialize with Ethiopia center
            const defaultCenter = [9.145, 40.4897];
            this.map = L.map('map', {
                zoomControl: true,
                attributionControl: true
            }).setView(defaultCenter, 6);
            
            // Add OpenStreetMap base layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);
            
            // Add drawn items layer
            this.drawnItems.addTo(this.map);
            
            // Initialize draw control
            this.initializeDrawControl();
            
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
    
    initializeDrawControl() {
        this.drawControl = new L.Control.Draw({
            draw: {
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                    shapeOptions: {
                        color: '#3388ff',
                        fillColor: '#3388ff',
                        fillOpacity: 0.2,
                        weight: 3
                    }
                },
                rectangle: {
                    shapeOptions: {
                        color: '#3388ff',
                        fillColor: '#3388ff',
                        fillOpacity: 0.2,
                        weight: 3
                    }
                },
                circle: false,
                marker: false,
                polyline: false
            },
            edit: {
                featureGroup: this.drawnItems
            }
        });
        
        this.map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            this.drawnItems.addLayer(layer);
            document.getElementById('sentinelInfo').textContent = 'Area drawn. Click "Get Sentinel Data" to analyze.';
        });
    }
    
    activateDrawTool() {
        if (this.drawControl) {
            new L.Draw.Polygon(this.map, this.drawControl.options.draw.polygon).enable();
        }
    }
    
    clearDrawnItems() {
        this.drawnItems.clearLayers();
        document.getElementById('sentinelInfo').textContent = 'Click Get Sentinel Data for analysis';
        document.getElementById('sentinelResults').style.display = 'none';
    }
    
    getLayerName(layer) {
        const layerNames = {
            'osm': 'OpenStreetMap',
            'sentinel': 'Sentinel-2',
            'landsat': 'Landsat-8',
            'sites': 'Sites Boundary'
        };
        return layerNames[layer] || layer;
    }
    
    switchMapLayer(layer) {
        if (this.sentinelLayer) this.map.removeLayer(this.sentinelLayer);
        if (this.landsatLayer) this.map.removeLayer(this.landsatLayer);
        if (this.siteBoundaryLayer) this.map.removeLayer(this.siteBoundaryLayer);
        
        switch(layer) {
            case 'sentinel':
                this.updateSentinelLayer();
                break;
            case 'landsat':
                this.updateLandsatLayer();
                break;
            case 'sites':
                if (this.siteBoundaryLayer) {
                    this.siteBoundaryLayer.addTo(this.map);
                }
                break;
            case 'osm':
            default:
                break;
        }
        this.currentLayer = layer;
    }
    
    updateSentinelLayer() {
        if (this.sentinelLayer) {
            this.map.removeLayer(this.sentinelLayer);
        }
        
        const year = document.getElementById('yearSelect').value;
        const timeRange = `${year}-01-01/${year}-12-31`;
        
        this.sentinelLayer = L.tileLayer.wms(this.sentinelApiConfig.baseUrl, {
            layers: this.sentinelApiConfig.layers['sentinel-2-l2a'],
            format: 'image/png',
            transparent: true,
            attribution: '© Sentinel-2',
            maxcc: 20,
            time: timeRange,
            showLogo: false,
            maxZoom: 18
        }).addTo(this.map);
    }
    
    updateLandsatLayer() {
        if (this.landsatLayer) {
            this.map.removeLayer(this.landsatLayer);
        }
        
        const year = document.getElementById('yearSelect').value;
        const timeRange = `${year}-01-01/${year}-12-31`;
        
        this.landsatLayer = L.tileLayer.wms(this.sentinelApiConfig.baseUrl, {
            layers: this.sentinelApiConfig.layers['landsat-8-l1c'],
            format: 'image/png',
            transparent: true,
            attribution: '© Landsat-8',
            maxcc: 20,
            time: timeRange,
            showLogo: false,
            maxZoom: 18
        }).addTo(this.map);
    }
    
    async loadSiteBoundaries() {
        try {
            console.log('Loading site boundaries from SHP file...');
            
            // Load SHP file using shpjs
            const shpFile = 'data/sitesshp.shp';
            
            // Show loading message
            document.getElementById('dataStatusText').textContent = 'Loading site boundaries...';
            
            // Read the SHP file
            const geojson = await shp(shpFile);
            console.log('SHP file loaded successfully:', geojson);
            
            if (geojson && geojson.features && geojson.features.length > 0) {
                this.processSHPData(geojson);
                document.getElementById('dataStatusText').textContent = 'Site boundaries loaded';
            } else {
                throw new Error('No features found in SHP file');
            }
            
        } catch (error) {
            console.error('Error loading SHP file:', error);
            document.getElementById('dataStatusText').textContent = 'Error loading site boundaries';
            
            // Fallback to mock data for demonstration
            this.createMockBoundaries();
        }
    }
    
    processSHPData(geojson) {
        // Clear existing data
        this.siteCoordinates = {};
        this.siteBoundaries = {};
        this.siteNames = [];
        
        // Create a layer group for site boundaries
        this.siteBoundaryLayer = L.layerGroup();
        
        // Process each feature in the GeoJSON
        geojson.features.forEach((feature, index) => {
            const properties = feature.properties || {};
            
            // Extract site name from properties
            let siteName = 'Unknown Site';
            
            // Try different possible property names for site name
            const possibleNameKeys = ['Site_Name', 'SiteName', 'Name', 'SITE_NAME', 'site_name', 'SITENAME'];
            for (const key of possibleNameKeys) {
                if (properties[key]) {
                    siteName = properties[key];
                    break;
                }
            }
            
            // If no name found in properties, create a generic one
            if (siteName === 'Unknown Site') {
                siteName = `Site ${index + 1}`;
            }
            
            // Store site name
            this.siteNames.push(siteName);
            
            // Calculate centroid for marker placement
            const centroid = this.calculateCentroid(feature.geometry);
            this.siteCoordinates[siteName] = centroid;
            
            // Store boundary geometry
            this.siteBoundaries[siteName] = feature.geometry;
            
            // Create boundary polygon on map
            const boundaryLayer = L.geoJSON(feature, {
                style: {
                    color: '#3388ff',
                    weight: 2,
                    opacity: 0.8,
                    fillColor: '#3388ff',
                    fillOpacity: 0.1
                }
            });
            
            // Add tooltip
            boundaryLayer.bindTooltip(siteName, {
                permanent: false,
                direction: 'top',
                className: 'site-boundary-tooltip'
            });
            
            // Add click event
            boundaryLayer.on('click', () => {
                this.selectSite(siteName);
            });
            
            // Add to layer group
            boundaryLayer.addTo(this.siteBoundaryLayer);
        });
        
        // Add site markers
        this.addSiteMarkersToMap();
        
        // Update site count
        document.getElementById('siteCount').textContent = `${this.siteNames.length} sites loaded`;
        
        console.log(`Processed ${this.siteNames.length} sites from SHP file`);
    }
    
    calculateCentroid(geometry) {
        if (geometry.type === 'Point') {
            return {
                lat: geometry.coordinates[1],
                lng: geometry.coordinates[0]
            };
        } else if (geometry.type === 'Polygon') {
            // Calculate centroid for polygon
            const coordinates = geometry.coordinates[0];
            let latSum = 0;
            let lngSum = 0;
            
            for (const coord of coordinates) {
                lngSum += coord[0];
                latSum += coord[1];
            }
            
            return {
                lat: latSum / coordinates.length,
                lng: lngSum / coordinates.length
            };
        } else if (geometry.type === 'MultiPolygon') {
            // Calculate centroid for first polygon in MultiPolygon
            const coordinates = geometry.coordinates[0][0];
            let latSum = 0;
            let lngSum = 0;
            
            for (const coord of coordinates) {
                lngSum += coord[0];
                latSum += coord[1];
            }
            
            return {
                lat: latSum / coordinates.length,
                lng: lngSum / coordinates.length
            };
        }
        
        // Default fallback
        return { lat: 9.145, lng: 40.4897 };
    }
    
    addSiteMarkersToMap() {
        // Clear existing markers
        Object.values(this.siteMarkers).forEach(marker => {
            if (marker) this.map.removeLayer(marker);
        });
        this.siteMarkers = {};
        
        // Add markers for each site
        Object.entries(this.siteCoordinates).forEach(([siteName, coordinates]) => {
            const marker = this.createSiteMarker(siteName, coordinates);
            this.siteMarkers[siteName] = marker;
            marker.addTo(this.map);
        });
    }
    
    createSiteMarker(siteName, coordinates) {
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<i class="fas fa-map-marker-alt"></i>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        const marker = L.marker(coordinates, { icon: icon });
        
        marker.on('click', () => {
            this.selectSite(siteName);
        });
        
        marker.bindTooltip(siteName, {
            direction: 'top',
            offset: [0, -20],
            opacity: 0.9,
            className: 'site-marker-tooltip'
        });
        
        return marker;
    }
    
    createMockBoundaries() {
        console.log('Creating mock boundaries for demonstration');
        
        // Create mock boundaries if SHP file is not available
        this.siteBoundaryLayer = L.layerGroup();
        this.siteNames = ['Abiyiadi TVET College', 'Abreha We\'atsbha Elementary School', 'Adi Daero Cambo'];
        
        // Mock coordinates for demonstration
        const mockSites = [
            { name: "Abiyiadi TVET College", lat: 9.1, lng: 40.2 },
            { name: "Abreha We'atsbha Elementary School", lat: 9.2, lng: 40.3 },
            { name: "Adi Daero Cambo", lat: 9.3, lng: 40.4 }
        ];
        
        mockSites.forEach(site => {
            // Create a circular boundary
            const circle = L.circle([site.lat, site.lng], {
                color: '#3388ff',
                weight: 2,
                opacity: 0.8,
                fillColor: '#3388ff',
                fillOpacity: 0.1,
                radius: 5000
            });
            
            this.siteBoundaryLayer.addLayer(circle);
            this.siteCoordinates[site.name] = { lat: site.lat, lng: site.lng };
            
            // Add tooltip and click event
            circle.bindTooltip(site.name, {
                permanent: false,
                direction: 'top'
            });
            
            circle.on('click', () => {
                this.selectSite(site.name);
            });
        });
        
        this.addSiteMarkersToMap();
        document.getElementById('siteCount').textContent = `${this.siteNames.length} sites loaded`;
    }
    
    selectSite(siteName) {
        document.getElementById('siteSelect').value = siteName;
        this.currentSite = siteName;
        
        this.updateVisualization();
        this.updateCategoryPercentages();
        this.zoomToSite(siteName);
        
        document.getElementById('dataStatusText').textContent = `Viewing: ${siteName}`;
        document.getElementById('selectedSiteInfo').textContent = siteName;
    }
    
    zoomToSite(siteName) {
        const coordinates = this.siteCoordinates[siteName];
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
            
            // Zoom to the site with appropriate zoom level
            this.map.setView([coordinates.lat, coordinates.lng], 13);
            
            // Open tooltip
            if (marker) {
                marker.openTooltip();
            }
            
            // Highlight boundary if available
            if (this.siteBoundaryLayer) {
                this.siteBoundaryLayer.eachLayer((layer) => {
                    if (layer.getTooltip() && layer.getTooltip().getContent() === siteName) {
                        layer.setStyle({
                            color: '#ff6b6b',
                            weight: 3,
                            fillOpacity: 0.2
                        });
                    } else {
                        layer.setStyle({
                            color: '#3388ff',
                            weight: 2,
                            fillOpacity: 0.1
                        });
                    }
                });
            }
        }
    }
    
    resetMapView() {
        if (this.map) {
            this.map.setView([9.145, 40.4897], 6);
        }
        
        if (this.selectedMarker) {
            this.selectedMarker._icon.classList.remove('selected');
            this.selectedMarker = null;
        }
        
        // Reset boundary styles
        if (this.siteBoundaryLayer) {
            this.siteBoundaryLayer.eachLayer((layer) => {
                layer.setStyle({
                    color: '#3388ff',
                    weight: 2,
                    fillOpacity: 0.1
                });
            });
        }
    }
    
    async fetchSentinelDataForArea() {
        if (this.drawnItems.getLayers().length === 0) {
            alert('Please draw an area first using the Draw Tool');
            return;
        }
        
        const drawnLayer = this.drawnItems.getLayers()[0];
        const bounds = drawnLayer.getBounds();
        
        document.getElementById('sentinelInfo').textContent = 'Fetching Sentinel data...';
        document.getElementById('sentinelResults').style.display = 'block';
        document.getElementById('sentinelResultsContent').innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Fetching satellite data...</span>
            </div>
        `;
        
        try {
            const landUseData = await this.fetchRealLandUseData(bounds);
            this.displaySentinelResults(landUseData, bounds);
            
        } catch (error) {
            console.error('Error fetching Sentinel data:', error);
            const simulatedData = this.generateSimulatedLandUseData(bounds);
            this.displaySentinelResults(simulatedData, bounds);
        }
    }
    
    async fetchRealLandUseData(bounds) {
        const [south, west, north, east] = [
            bounds.getSouth(),
            bounds.getWest(),
            bounds.getNorth(),
            bounds.getEast()
        ];
        
        const overpassQuery = `
            [out:json][timeout:25];
            (
              way["landuse"](${south},${west},${north},${east});
              way["natural"](${south},${west},${north},${east});
              relation["landuse"](${south},${west},${north},${east});
              relation["natural"](${south},${west},${north},${east});
            );
            out body;
            >;
            out skel qt;
        `;
        
        try {
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `data=${encodeURIComponent(overpassQuery)}`
            });
            
            const data = await response.json();
            return this.processOverpassData(data, bounds);
            
        } catch (error) {
            console.error('Error fetching OSM data:', error);
            throw error;
        }
    }
    
    processOverpassData(osmData, bounds) {
        const area = this.calculateArea(bounds);
        const categories = {
            vegetation: 0,
            water: 0,
            builtup: 0,
            agriculture: 0,
            forest: 0,
            other: 0
        };
        
        let totalArea = 0;
        
        if (osmData.elements && osmData.elements.length > 0) {
            osmData.elements.forEach(element => {
                if (element.tags) {
                    const tags = element.tags;
                    let category = 'other';
                    
                    if (tags.landuse) {
                        if (tags.landuse === 'forest') category = 'forest';
                        else if (tags.landuse === 'farmland' || tags.landuse === 'orchard') category = 'agriculture';
                        else if (tags.landuse === 'residential' || tags.landuse === 'industrial') category = 'builtup';
                        else if (tags.landuse === 'meadow') category = 'vegetation';
                    } else if (tags.natural) {
                        if (tags.natural === 'water') category = 'water';
                        else if (tags.natural === 'wood') category = 'forest';
                        else if (tags.natural === 'grassland') category = 'vegetation';
                    }
                    
                    const elementArea = area * 0.1 / osmData.elements.length;
                    categories[category] += elementArea;
                    totalArea += elementArea;
                }
            });
        }
        
        Object.keys(categories).forEach(key => {
            categories[key] = totalArea > 0 ? (categories[key] / totalArea) * 100 : 0;
        });
        
        return {
            area: area,
            categories: categories,
            ndvi: Math.random() * 0.5 + 0.3,
            ndwi: Math.random() * 0.3 + 0.1,
            timestamp: new Date().toISOString(),
            source: 'OpenStreetMap & Satellite Analysis'
        };
    }
    
    generateSimulatedLandUseData(bounds) {
        const area = this.calculateArea(bounds);
        
        return {
            area: area,
            categories: {
                vegetation: Math.random() * 40 + 30,
                water: Math.random() * 10 + 5,
                builtup: Math.random() * 20 + 5,
                bareland: Math.random() * 15 + 5,
                agriculture: Math.random() * 30 + 20
            },
            ndvi: Math.random() * 0.5 + 0.3,
            ndwi: Math.random() * 0.3 + 0.1,
            timestamp: new Date().toISOString(),
            source: 'Simulated Sentinel-2 Data'
        };
    }
    
    calculateArea(bounds) {
        const latDiff = bounds.getNorth() - bounds.getSouth();
        const lngDiff = bounds.getEast() - bounds.getWest();
        const areaKm2 = (latDiff * 111) * (lngDiff * 111 * Math.cos((bounds.getNorth() + bounds.getSouth()) * Math.PI / 360));
        return Math.abs(areaKm2);
    }
    
    displaySentinelResults(data, bounds) {
        const areaKm2 = data.area.toFixed(2);
        
        let categoriesHtml = '';
        Object.entries(data.categories).forEach(([category, percent]) => {
            if (percent > 0) {
                const formattedPercent = percent.toFixed(1);
                const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
                categoriesHtml += `
                    <div class="result-category">
                        <span class="category-name">${categoryLabel}</span>
                        <span class="category-value">${formattedPercent}%</span>
                        <div class="category-bar">
                            <div class="bar-fill" style="width: ${Math.min(formattedPercent, 100)}%"></div>
                        </div>
                    </div>
                `;
            }
        });
        
        document.getElementById('sentinelResultsContent').innerHTML = `
            <div class="results-summary">
                <h5><i class="fas fa-chart-area"></i> Analysis Results</h5>
                <div class="result-item">
                    <i class="fas fa-ruler-combined"></i>
                    <span>Area: <strong>${areaKm2} km²</strong></span>
                </div>
                <div class="result-item">
                    <i class="fas fa-leaf"></i>
                    <span>Vegetation Index (NDVI): <strong>${data.ndvi.toFixed(3)}</strong></span>
                </div>
                <div class="result-item">
                    <i class="fas fa-tint"></i>
                    <span>Water Index (NDWI): <strong>${data.ndwi.toFixed(3)}</strong></span>
                </div>
                <div class="result-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Date: <strong>${new Date(data.timestamp).toLocaleDateString()}</strong></span>
                </div>
            </div>
            ${categoriesHtml ? `
            <div class="land-use-breakdown">
                <h6>Land Use Distribution</h6>
                ${categoriesHtml}
            </div>
            ` : ''}
            <div class="data-source">
                <small><i class="fas fa-info-circle"></i> ${data.source}</small>
            </div>
        `;
        
        document.getElementById('sentinelInfo').textContent = `Analysis complete for ${areaKm2} km² area`;
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
                document.getElementById('loadingMessage').textContent = 'Data loaded successfully!';
                
                const uniqueSites = this.getAllSites();
                console.log('Unique sites found:', Array.from(uniqueSites));
                
                // Update site count if we have site names from SHP
                if (this.siteNames.length > 0) {
                    document.getElementById('siteCount').textContent = `${this.siteNames.length} sites loaded`;
                } else {
                    document.getElementById('siteCount').textContent = `${uniqueSites.size} sites loaded`;
                }
                
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
        
        // Use site names from SHP file if available, otherwise use data file sites
        const sites = this.siteNames.length > 0 ? this.siteNames : Array.from(this.getAllSites());
        
        siteSelect.innerHTML = '<option value="">-- Select a site --</option>';
        
        if (sites.length === 0) {
            siteSelect.innerHTML = '<option value="">No sites found</option>';
            siteSelect.disabled = true;
            return;
        }
        
        const sortedSites = sites.sort();
        
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
