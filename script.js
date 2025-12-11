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
        this.chart = null;
        
        this.init();
    }
    
    init() {
        this.showLoadingState();
        this.setupEventListeners();
        this.populateCategoryCards();
        this.loadData();
    }
    
    showLoadingState() {
        document.getElementById('loadingChart').style.display = 'flex';
        document.getElementById('mainChart').style.display = 'none';
        this.updateStatus('2020', 'loading');
        this.updateStatus('2022', 'loading');
        this.updateStatus('2024', 'loading');
        document.getElementById('dataStatusText').textContent = 'Loading data...';
    }
    
    hideLoadingState() {
        document.getElementById('loadingChart').style.display = 'none';
        document.getElementById('mainChart').style.display = 'block';
    }
    
    updateStatus(year, status, message = '') {
        const element = document.getElementById(`status${year}`);
        if (element) {
            element.textContent = message || this.getStatusText(status);
            element.className = `status-value ${status}`;
        }
    }
    
    getStatusText(status) {
        const statusMap = {
            'loading': 'Loading...',
            'loaded': '✓ Loaded',
            'error': '✗ Error',
            'not-found': 'Not found'
        };
        return statusMap[status] || status;
    }
    
    setupEventListeners() {
        // Site selection from top bar
        document.getElementById('siteSelect').addEventListener('change', (e) => {
            this.currentSite = e.target.value;
            if (this.currentSite) {
                this.updateVisualization();
                this.updateCategoryPercentages();
                this.updateSiteAnalysis();
                document.getElementById('dataStatusText').textContent = `Viewing: ${this.currentSite}`;
            } else {
                document.getElementById('dataStatusText').textContent = 'Select a site';
            }
        });
        
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.loadData();
        });
    }
    
    async loadData() {
        console.log('Starting data load...');
        
        // Reset states
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
                            this.updateStatus(year, 'loaded', `✓ Loaded (${jsonData.length} sites)`);
                        } else {
                            this.updateStatus(year, 'error', '✗ Empty data');
                            allLoaded = false;
                        }
                    } else {
                        console.error(`Failed to load ${year} data: ${response.status}`);
                        this.updateStatus(year, 'error', '✗ File not found');
                        allLoaded = false;
                    }
                } catch (error) {
                    console.error(`Error loading ${year} data:`, error);
                    this.updateStatus(year, 'error', `✗ ${error.message}`);
                    allLoaded = false;
                }
            }
            
            if (allLoaded) {
                this.populateSiteSelect();
                document.getElementById('loadingMessage').textContent = 'Data loaded successfully!';
                
                const uniqueSites = this.getAllSites();
                console.log('Unique sites found:', Array.from(uniqueSites));
                document.getElementById('totalSites').textContent = uniqueSites.size;
                document.getElementById('siteCount').textContent = `${uniqueSites.size} sites loaded`;
                document.getElementById('dataStatusText').textContent = 'Select a site to begin';
                
                if (uniqueSites.size > 0) {
                    const firstSite = Array.from(uniqueSites)[0];
                    const siteSelect = document.getElementById('siteSelect');
                    siteSelect.value = firstSite;
                    this.currentSite = firstSite;
                    this.updateVisualization();
                    this.updateCategoryPercentages();
                    this.updateSiteAnalysis();
                    document.getElementById('dataStatusText').textContent = `Viewing: ${this.currentSite}`;
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
            this.updateSiteAnalysis();
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
            
            // Calculate changes for Built Area, Trees, and Crops
            let builtChange = '';
            let treesChange = '';
            let cropsChange = '';
            
            if (index > 0) {
                const prevItem = timelineData[index - 1];
                
                // Built Area change
                const prevBuilt = prevItem.data.BuiltArea_Percent || 0;
                const currentBuilt = item.data.BuiltArea_Percent || 0;
                const builtDiff = currentBuilt - prevBuilt;
                builtChange = this.formatChange(builtDiff);
                
                // Trees change
                const prevTrees = prevItem.data.Trees_Percent || 0;
                const currentTrees = item.data.Trees_Percent || 0;
                const treesDiff = currentTrees - prevTrees;
                treesChange = this.formatChange(treesDiff);
                
                // Crops change
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
    
    updateSiteAnalysis() {
        if (!this.currentSite) {
            document.getElementById('siteAnalysis').style.display = 'none';
            const narrativeContent = document.getElementById('narrativeContent');
            narrativeContent.innerHTML = `
                <div class="data-status-panel">
                    <div class="status-item">
                        <span class="status-label">2020 Data:</span>
                        <span class="status-value" id="status2020">Checking...</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">2022 Data:</span>
                        <span class="status-value" id="status2022">Checking...</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">2024 Data:</span>
                        <span class="status-value" id="status2024">Checking...</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Total Sites:</span>
                        <span class="status-value" id="totalSites">0</span>
                    </div>
                </div>
            `;
            return;
        }
        
        const siteData2020 = this.getSiteData(this.currentSite, '2020');
        const siteData2024 = this.getSiteData(this.currentSite, '2024');
        
        if (!siteData2020 || !siteData2024) {
            const analysisDiv = document.getElementById('siteAnalysis');
            analysisDiv.innerHTML = `
                <div class="narrative-text">
                    <p>Incomplete data for <strong>${this.currentSite}</strong>.</p>
                </div>
            `;
            analysisDiv.style.display = 'block';
            return;
        }
        
        const totalArea2020 = siteData2020.Total_Area_sq_km || 0;
        const totalArea2024 = siteData2024.Total_Area_sq_km || 0;
        const areaChange = ((totalArea2024 - totalArea2020) / totalArea2020 * 100).toFixed(1);
        
        // Calculate key changes
        const builtChange = ((siteData2024.BuiltArea_Percent || 0) - (siteData2020.BuiltArea_Percent || 0)).toFixed(1);
        const treesChange = ((siteData2024.Trees_Percent || 0) - (siteData2020.Trees_Percent || 0)).toFixed(1);
        const cropsChange = ((siteData2024.Crops_Percent || 0) - (siteData2020.Crops_Percent || 0)).toFixed(1);
        
        const categories = {
            'Water_Percent': 'Water',
            'Trees_Percent': 'Trees',
            'Crops_Percent': 'Crops',
            'BuiltArea_Percent': 'Built Area',
            'Rangeland_Percent': 'Rangeland'
        };
        
        let max2020 = 0;
        let dominant2020 = '';
        let max2024 = 0;
        let dominant2024 = '';
        
        Object.entries(categories).forEach(([key, label]) => {
            const percent2020 = siteData2020[key] || 0;
            const percent2024 = siteData2024[key] || 0;
            
            if (percent2020 > max2020) {
                max2020 = percent2020;
                dominant2020 = label;
            }
            
            if (percent2024 > max2024) {
                max2024 = percent2024;
                dominant2024 = label;
            }
        });
        
        let totalSelectedPercent = 0;
        const percentKeys = {
            water: 'Water_Percent',
            trees: 'Trees_Percent',
            floodVegetation: 'FloodVegetation_Percent',
            crops: 'Crops_Percent',
            builtArea: 'BuiltArea_Percent',
            bareGround: 'BareGround_Percent',
            rangeland: 'Rangeland_Percent'
        };
        
        Array.from(this.selectedCategories).forEach(categoryId => {
            totalSelectedPercent += siteData2024[percentKeys[categoryId]] || 0;
        });
        
        const analysisContent = `
            <div class="narrative-text">
                <p>Analysis of <strong>${this.currentSite}</strong> (2020-2024)</p>
            </div>
            
            <div class="narrative-stats">
                <div class="stat-item">
                    <span class="stat-label">Area (2024):</span>
                    <span class="stat-value">${totalArea2024.toFixed(1)} sq km</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Area Change:</span>
                    <span class="stat-value">${areaChange}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Built Area Δ:</span>
                    <span class="stat-value ${builtChange >= 0 ? 'positive' : 'negative'}">
                        ${builtChange >= 0 ? '+' : ''}${builtChange}%
                    </span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Trees Δ:</span>
                    <span class="stat-value ${treesChange >= 0 ? 'positive' : 'negative'}">
                        ${treesChange >= 0 ? '+' : ''}${treesChange}%
                    </span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Crops Δ:</span>
                    <span class="stat-value ${cropsChange >= 0 ? 'positive' : 'negative'}">
                        ${cropsChange >= 0 ? '+' : ''}${cropsChange}%
                    </span>
                </div>
            </div>
            
            <div class="narrative-insights">
                <h4><i class="fas fa-chart-line"></i> Trend Analysis</h4>
                <ul class="insights-list">
                    <li>Dominant land use changed from <strong>${dominant2020}</strong> to <strong>${dominant2024}</strong></li>
                    <li>Built Area: ${builtChange >= 0 ? 'Increased' : 'Decreased'} by ${Math.abs(builtChange)}%</li>
                    <li>Trees: ${treesChange >= 0 ? 'Increased' : 'Decreased'} by ${Math.abs(treesChange)}%</li>
                    <li>Crops: ${cropsChange >= 0 ? 'Increased' : 'Decreased'} by ${Math.abs(cropsChange)}%</li>
                    <li>Total area ${areaChange >= 0 ? 'expanded' : 'contracted'} by ${Math.abs(areaChange)}%</li>
                </ul>
            </div>
        `;
        
        const analysisDiv = document.getElementById('siteAnalysis');
        analysisDiv.innerHTML = analysisContent;
        analysisDiv.style.display = 'block';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing LandUseVisualizer...');
    new LandUseVisualizer();
});
