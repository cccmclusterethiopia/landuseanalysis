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
        this.debugMode = true;
        
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
        document.getElementById('siteSelect').addEventListener('change', (e) => {
            this.currentSite = e.target.value;
            if (this.currentSite) {
                this.updateVisualization();
                this.updateCategoryPercentages();
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
        
        try {
            const years = ['2020', '2022', '2024'];
            let allLoaded = true;
            
            for (const year of years) {
                try {
                    console.log(`Attempting to load ${year} data...`);
                    
                    // Try different possible paths
                    const paths = [
                        `data/${year}-Result-exc.json`,
                        `data/${year}-Result-exc.json?t=${Date.now()}`,
                        `/${year}-Result-exc.json`,
                        `${year}-Result-exc.json`
                    ];
                    
                    let response = null;
                    let lastError = null;
                    
                    for (const path of paths) {
                        try {
                            console.log(`Trying path: ${path}`);
                            response = await fetch(path);
                            if (response.ok) break;
                        } catch (err) {
                            lastError = err;
                            console.log(`Path ${path} failed:`, err);
                        }
                    }
                    
                    if (response && response.ok) {
                        const jsonData = await response.json();
                        console.log(`${year} data loaded successfully:`, jsonData);
                        
                        if (Array.isArray(jsonData) && jsonData.length > 0) {
                            this.data[year] = this.cleanData(jsonData, year);
                            this.updateStatus(year, 'loaded', `✓ Loaded (${jsonData.length} sites)`);
                            
                            // Log sample data for debugging
                            if (this.debugMode && jsonData[0]) {
                                console.log(`${year} sample data:`, jsonData[0]);
                                console.log(`${year} available keys:`, Object.keys(jsonData[0]));
                            }
                        } else {
                            this.updateStatus(year, 'error', '✗ Empty data');
                            allLoaded = false;
                        }
                    } else {
                        console.error(`Failed to load ${year} data from all paths`);
                        this.updateStatus(year, 'error', '✗ File not found');
                        allLoaded = false;
                    }
                    
                } catch (error) {
                    console.error(`Error loading ${year} data:`, error);
                    this.updateStatus(year, 'error', `✗ ${error.message}`);
                    allLoaded = false;
                }
            }
            
            if (allLoaded && this.data['2020'] && this.data['2020'].length > 0) {
                // Success - populate UI
                this.populateSiteSelect();
                document.getElementById('loadingMessage').textContent = 'Data loaded successfully!';
                
                // Auto-select first site
                if (this.data['2020'].length > 0) {
                    const firstSite = this.data['2020'][0].Site_Name;
                    document.getElementById('siteSelect').value = firstSite;
                    this.currentSite = firstSite;
                    this.updateVisualization();
                    this.updateCategoryPercentages();
                }
                
                // Update total sites count
                const uniqueSites = this.getAllSites();
                document.getElementById('totalSites').textContent = uniqueSites.size;
                
            } else {
                // Some files failed to load
                document.getElementById('loadingMessage').textContent = 'Failed to load some data files. Check console for details.';
                document.getElementById('retryBtn').style.display = 'inline-flex';
                this.showDataHelp();
            }
            
        } catch (error) {
            console.error('Critical error loading data:', error);
            document.getElementById('loadingMessage').textContent = 'Critical error loading data. Check console.';
            document.getElementById('retryBtn').style.display = 'inline-flex';
            this.showDataHelp();
        }
    }
    
    cleanData(data, year) {
        if (!Array.isArray(data)) return [];
        
        return data.map(item => {
            const cleaned = {};
            
            // Helper function to find value by possible key names
            const findValue = (possibleKeys) => {
                for (const key of possibleKeys) {
                    if (item[key] !== undefined) {
                        const value = item[key];
                        // Convert to number if possible
                        return typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
                    }
                }
                return 0;
            };
            
            // Map all possible column name variations
            cleaned.Site_Name = findValue(['Site_Name', 'Site Name', 'site_name', 'SiteName']);
            cleaned.Total_Area_sq_km = findValue(['Total_Area_sq_km', 'Total_Area_sq km', 'Total Area (sq km)', 'Total_Area', 'total_area']);
            
            cleaned.Water_Percent = findValue(['Water_Percent', 'Water Percent', 'water_percent', 'Water%']);
            cleaned.Trees_Percent = findValue(['Trees_Percent', 'Trees Percent', 'trees_percent', 'Trees%']);
            cleaned.FloodVegetation_Percent = findValue(['FloodVegetation_Percent', 'FloodVegetation Percent', 'Flood_Vegetation_Percent', 'FloodVegetation%']);
            cleaned.Crops_Percent = findValue(['Crops_Percent', 'Crops Percent', 'crops_percent', 'Crops%']);
            cleaned.BuiltArea_Percent = findValue(['BuiltArea_Percent', 'BuiltArea Percent', 'Built_Area_Percent', 'BuiltArea%']);
            cleaned.BareGround_Percent = findValue(['BareGround_Percent', 'BareGround Percent', 'Bare_Ground_Percent', 'BareGround%']);
            cleaned.Rangeland_Percent = findValue(['Rangeland_Percent', 'Rangeland Percent', 'rangeland_percent', 'Rangeland%']);
            
            // Special handling for 2024 Class_11
            if (year === '2024') {
                const class11Percent = findValue(['Class_11_Percent', 'Class11_Percent', 'Class 11 Percent']);
                if (class11Percent > 0) {
                    cleaned.Rangeland_Percent = class11Percent;
                }
            }
            
            return cleaned;
        });
    }
    
    getAllSites() {
        const sites = new Set();
        Object.keys(this.data).forEach(year => {
            if (this.data[year]) {
                this.data[year].forEach(item => {
                    if (item.Site_Name) {
                        sites.add(item.Site_Name);
                    }
                });
            }
        });
        return sites;
    }
    
    showDataHelp() {
        const debugInfo = `
            <strong>Debug Information:</strong><br>
            - Looking for JSON files in: data/ folder<br>
            - Expected files: 2020-Result-exc.json, 2022-Result-exc.json, 2024-Result-exc.json<br>
            - Check browser console for detailed errors<br>
            - Make sure JSON files are valid (use <a href="https://jsonlint.com/" target="_blank">JSONLint</a> to validate)<br>
            - GitHub Pages URL: https://[username].github.io/[repo-name]/<br>
            - Current URL: ${window.location.href}
        `;
        document.getElementById('debugInfo').innerHTML = debugInfo;
        document.getElementById('debugInfo').style.display = 'block';
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
        
        sites.forEach(site => {
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
        
        selectedCategories.forEach(categoryId => {
            const category = categories[categoryId];
            const data = years.map(year => {
                const siteData = this.getSiteData(this.currentSite, year);
                return siteData ? (siteData[category.key] || 0) : 0;
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
        
        this.updateChart(years, datasets);
        this.updateTimeline(years);
        this.updateCategoryPercentages();
    }
    
    updateChart(labels, datasets) {
        const ctx = document.getElementById('mainChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
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
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: '#2c3e50',
                        anchor: 'end',
                        align: 'top',
                        formatter: function(value, context) {
                            return value.toFixed(1) + '%';
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
                        max: 100
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
            plugins: [ChartDataLabels]
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
            
            let change = '';
            let changeClass = '';
            
            if (index > 0) {
                const prevItem = timelineData[index - 1];
                const prevTotal = prevItem.data.Total_Area_sq_km || 0;
                const currentTotal = item.data.Total_Area_sq_km || 0;
                const percentChange = prevTotal ? ((currentTotal - prevTotal) / prevTotal * 100) : 0;
                
                change = percentChange > 0 ? 
                    `+${percentChange.toFixed(1)}%` : 
                    `${percentChange.toFixed(1)}%`;
                changeClass = percentChange > 0 ? 'positive' : percentChange < 0 ? 'negative' : '';
            }
            
            div.innerHTML = `
                <div class="timeline-year">${item.year}</div>
                <div class="timeline-total">${(item.data.Total_Area_sq_km || 0).toFixed(1)} sq km</div>
                <div class="timeline-change ${changeClass}">${change || 'Baseline'}</div>
            `;
            
            timeline.appendChild(div);
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing LandUseVisualizer...');
    console.log('Current URL:', window.location.href);
    console.log('GitHub Pages expected at: https://[username].github.io/[repo-name]/');
    
    const visualizer = new LandUseVisualizer();
    window.landUseVisualizer = visualizer; // Expose for debugging
});
