class LandUseVisualizer {
    constructor() {
        this.data = {};
        this.currentSite = null;
        this.selectedCategories = new Set();
        this.theme = 'default';
        this.chart = null;
        this.comparisonChart = null;
        
        // Initialize the application
        this.init();
    }
    
    async init() {
        // Load data from JSON files
        await this.loadData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize UI components
        this.populateSiteSelect();
        this.populateCategoryCheckboxes();
        
        // Initialize theme
        this.applyTheme(this.theme);
    }
    
    async loadData() {
        try {
            // Load data for each year
            const years = ['2020', '2022', '2024'];
            for (const year of years) {
                const response = await fetch(`data/${year}-Result-exc.json`);
                if (response.ok) {
                    this.data[year] = await response.json();
                } else {
                    console.warn(`Could not load data for ${year}`);
                    // Create mock data structure for demo
                    this.data[year] = this.createMockData();
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Create mock data for demo purposes
            this.data = this.createMockDataStructure();
        }
    }
    
    createMockDataStructure() {
        const years = ['2020', '2022', '2024'];
        const sites = [
            'Abiyiadi TVET College',
            'Abreha We\'atsbha Elementary School',
            'Sample Site A',
            'Sample Site B',
            'Sample Site C'
        ];
        
        const data = {};
        
        years.forEach(year => {
            data[year] = sites.map(site => ({
                Site_Name: site,
                Total_Area_sq_km: Math.random() * 2000 + 500,
                Water_Area: Math.random() * 10,
                Water_Percent: Math.random() * 5,
                Trees_Area: Math.random() * 100,
                Trees_Percent: Math.random() * 15,
                FloodVegetation_Area: Math.random() * 50,
                FloodVegetation_Percent: Math.random() * 10,
                Crops_Area: Math.random() * 300,
                Crops_Percent: Math.random() * 20,
                BuiltArea_Area: Math.random() * 400,
                BuiltArea_Percent: Math.random() * 25,
                BareGround_Area: Math.random() * 100,
                BareGround_Percent: Math.random() * 10,
                Rangeland_Area: Math.random() * 600,
                Rangeland_Percent: Math.random() * 40
            }));
        });
        
        return data;
    }
    
    populateSiteSelect() {
        const siteSelect = document.getElementById('siteSelect');
        const compareSite1 = document.getElementById('compareSite1');
        const compareSite2 = document.getElementById('compareSite2');
        
        // Get unique site names from all years
        const sites = new Set();
        Object.values(this.data).forEach(yearData => {
            yearData.forEach(site => {
                sites.add(site.Site_Name);
            });
        });
        
        // Populate dropdowns
        sites.forEach(site => {
            const option = document.createElement('option');
            option.value = site;
            option.textContent = site;
            
            siteSelect.appendChild(option.cloneNode(true));
            compareSite1.appendChild(option.cloneNode(true));
            compareSite2.appendChild(option.cloneNode(true));
        });
    }
    
    populateCategoryCheckboxes() {
        const categories = [
            { id: 'water', label: 'Water', color: '#3498db' },
            { id: 'trees', label: 'Trees', color: '#27ae60' },
            { id: 'floodVegetation', label: 'Flood Vegetation', color: '#1abc9c' },
            { id: 'crops', label: 'Crops', color: '#f1c40f' },
            { id: 'builtArea', label: 'Built Area', color: '#e74c3c' },
            { id: 'bareGround', label: 'Bare Ground', color: '#95a5a6' },
            { id: 'rangeland', label: 'Rangeland', color: '#8e44ad' }
        ];
        
        const container = document.getElementById('categoryCheckboxes');
        container.innerHTML = '';
        
        categories.forEach(category => {
            const label = document.createElement('label');
            label.className = 'category-checkbox';
            label.innerHTML = `
                <input type="checkbox" id="${category.id}" checked>
                <span class="category-label">${category.label}</span>
                <span class="category-color" style="background: ${category.color}; width: 15px; height: 15px; border-radius: 3px;"></span>
            `;
            
            label.querySelector('input').addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedCategories.add(category.id);
                } else {
                    this.selectedCategories.delete(category.id);
                }
                if (this.currentSite) {
                    this.updateVisualization();
                }
            });
            
            container.appendChild(label);
            this.selectedCategories.add(category.id);
        });
    }
    
    setupEventListeners() {
        // Site selection
        document.getElementById('siteSelect').addEventListener('change', (e) => {
            this.currentSite = e.target.value;
            if (this.currentSite) {
                this.updateVisualization();
            }
        });
        
        // Chart type selection
        document.getElementById('chartType').addEventListener('change', () => {
            if (this.currentSite) {
                this.updateVisualization();
            }
        });
        
        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.applyTheme(theme);
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Comparison modal
        const compareBtn = document.getElementById('compareSitesBtn');
        const modal = document.getElementById('comparisonModal');
        const closeModal = document.querySelector('.close-modal');
        
        compareBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
        
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Generate comparison
        document.getElementById('generateComparison').addEventListener('click', () => {
            this.generateComparison();
        });
    }
    
    applyTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    getSiteData(siteName, year) {
        if (!this.data[year]) return null;
        return this.data[year].find(site => site.Site_Name === siteName);
    }
    
    updateVisualization() {
        if (!this.currentSite) return;
        
        const chartType = document.getElementById('chartType').value;
        const years = ['2020', '2022', '2024'];
        
        // Prepare data for chart
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
        const colors = {
            water: '#3498db',
            trees: '#27ae60',
            floodVegetation: '#1abc9c',
            crops: '#f1c40f',
            builtArea: '#e74c3c',
            bareGround: '#95a5a6',
            rangeland: '#8e44ad'
        };
        
        // Create datasets for selected categories
        Array.from(this.selectedCategories).forEach(categoryId => {
            const category = categories[categoryId];
            const data = years.map(year => {
                const siteData = this.getSiteData(this.currentSite, year);
                return siteData ? siteData[category.key] || 0 : 0;
            });
            
            datasets.push({
                label: category.label,
                data: data,
                backgroundColor: colors[categoryId] + '80',
                borderColor: colors[categoryId],
                borderWidth: 2,
                fill: chartType === 'area'
            });
        });
        
        // Update main chart
        this.updateChart(years, datasets, chartType);
        
        // Update data table
        this.updateDataTable(years);
        
        // Update timeline
        this.updateTimeline(years);
        
        // Update stats summary
        this.updateStatsSummary(years);
    }
    
    updateChart(labels, datasets, type) {
        const ctx = document.getElementById('mainChart').getContext('2d');
        
        // Destroy previous chart if exists
        if (this.chart) {
            this.chart.destroy();
        }
        
        const chartConfig = {
            type: type === 'area' ? 'line' : type,
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
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Percentage (%)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                },
                ...(type === 'area' && {
                    elements: {
                        line: {
                            tension: 0.4
                        }
                    }
                })
            }
        };
        
        this.chart = new Chart(ctx, chartConfig);
    }
    
    updateDataTable(years) {
        const tbody = document.querySelector('#dataTable tbody');
        tbody.innerHTML = '';
        
        const categories = {
            water: { label: 'Water', areaKey: 'Water_Area', percentKey: 'Water_Percent' },
            trees: { label: 'Trees', areaKey: 'Trees_Area', percentKey: 'Trees_Percent' },
            floodVegetation: { label: 'Flood Vegetation', areaKey: 'FloodVegetation_Area', percentKey: 'FloodVegetation_Percent' },
            crops: { label: 'Crops', areaKey: 'Crops_Area', percentKey: 'Crops_Percent' },
            builtArea: { label: 'Built Area', areaKey: 'BuiltArea_Area', percentKey: 'BuiltArea_Percent' },
            bareGround: { label: 'Bare Ground', areaKey: 'BareGround_Area', percentKey: 'BareGround_Percent' },
            rangeland: { label: 'Rangeland', areaKey: 'Rangeland_Area', percentKey: 'Rangeland_Percent' }
        };
        
        years.forEach(year => {
            const siteData = this.getSiteData(this.currentSite, year);
            if (!siteData) return;
            
            Array.from(this.selectedCategories).forEach(categoryId => {
                const category = categories[categoryId];
                const row = document.createElement('tr');
                
                // Calculate change from previous year
                let change = '';
                if (year !== '2020') {
                    const prevYear = (parseInt(year) - 2).toString();
                    const prevData = this.getSiteData(this.currentSite, prevYear);
                    if (prevData) {
                        const currentVal = siteData[category.percentKey] || 0;
                        const prevVal = prevData[category.percentKey] || 0;
                        const diff = currentVal - prevVal;
                        const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
                        change = `${arrow} ${Math.abs(diff).toFixed(2)}%`;
                    }
                }
                
                row.innerHTML = `
                    <td>${year}</td>
                    <td>${category.label}</td>
                    <td>${(siteData[category.areaKey] || 0).toFixed(2)}</td>
                    <td>${(siteData[category.percentKey] || 0).toFixed(2)}%</td>
                    <td class="${change.includes('↑') ? 'positive' : change.includes('↓') ? 'negative' : ''}">
                        ${change || '-'}
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        });
    }
    
    updateTimeline(years) {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '';
        
        const totalArea2020 = this.getSiteData(this.currentSite, '2020')?.Total_Area_sq_km || 0;
        
        years.forEach((year, index) => {
            const siteData = this.getSiteData(this.currentSite, year);
            if (!siteData) return;
            
            const item = document.createElement('div');
            item.className = 'timeline-item';
            
            let change = '';
            if (index > 0) {
                const prevYear = years[index - 1];
                const prevData = this.getSiteData(this.currentSite, prevYear);
                const prevTotal = prevData?.Total_Area_sq_km || 0;
                const currentTotal = siteData.Total_Area_sq_km || 0;
                const percentChange = prevTotal ? ((currentTotal - prevTotal) / prevTotal * 100) : 0;
                
                change = percentChange > 0 ? 
                    `+${percentChange.toFixed(1)}%` : 
                    `${percentChange.toFixed(1)}%`;
            }
            
            item.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-year">${year}</div>
                <div class="timeline-change">${change || 'Baseline'}</div>
                <div class="timeline-area">${(siteData.Total_Area_sq_km || 0).toFixed(1)} sq km</div>
            `;
            
            timeline.appendChild(item);
        });
    }
    
    updateStatsSummary(years) {
        const statsGrid = document.querySelector('.stats-grid');
        statsGrid.innerHTML = '';
        
        const latestYear = years[years.length - 1];
        const siteData = this.getSiteData(this.currentSite, latestYear);
        if (!siteData) return;
        
        // Calculate total percentage for selected categories
        const categories = {
            water: 'Water_Percent',
            trees: 'Trees_Percent',
            floodVegetation: 'FloodVegetation_Percent',
            crops: 'Crops_Percent',
            builtArea: 'BuiltArea_Percent',
            bareGround: 'BareGround_Percent',
            rangeland: 'Rangeland_Percent'
        };
        
        let totalSelectedPercent = 0;
        Array.from(this.selectedCategories).forEach(categoryId => {
            totalSelectedPercent += siteData[categories[categoryId]] || 0;
        });
        
        // Calculate overall change from 2020 to 2024
        const data2020 = this.getSiteData(this.currentSite, '2020');
        const data2024 = this.getSiteData(this.currentSite, '2024');
        
        let overallChange = 0;
        if (data2020 && data2024) {
            const categories = ['Crops_Percent', 'BuiltArea_Percent', 'Rangeland_Percent'];
            let total2020 = 0;
            let total2024 = 0;
            
            categories.forEach(cat => {
                total2020 += data2020[cat] || 0;
                total2024 += data2024[cat] || 0;
            });
            
            overallChange = total2024 - total2020;
        }
        
        const stats = [
            { label: 'Total Area', value: `${(siteData.Total_Area_sq_km || 0).toFixed(1)} sq km` },
            { label: 'Selected Coverage', value: `${totalSelectedPercent.toFixed(1)}%` },
            { label: 'Dominant Category', value: this.getDominantCategory(siteData) },
            { label: '2020-2024 Change', value: `${overallChange > 0 ? '+' : ''}${overallChange.toFixed(1)}%` }
        ];
        
        stats.forEach(stat => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `
                <div class="stat-label">${stat.label}</div>
                <div class="stat-value">${stat.value}</div>
            `;
            statsGrid.appendChild(div);
        });
    }
    
    getDominantCategory(siteData) {
        const categories = {
            'Water_Percent': 'Water',
            'Trees_Percent': 'Trees',
            'FloodVegetation_Percent': 'Flood Vegetation',
            'Crops_Percent': 'Crops',
            'BuiltArea_Percent': 'Built Area',
            'BareGround_Percent': 'Bare Ground',
            'Rangeland_Percent': 'Rangeland'
        };
        
        let maxPercent = 0;
        let dominantCategory = 'None';
        
        Object.entries(categories).forEach(([key, label]) => {
            const percent = siteData[key] || 0;
            if (percent > maxPercent) {
                maxPercent = percent;
                dominantCategory = label;
            }
        });
        
        return dominantCategory;
    }
    
    generateComparison() {
        const site1 = document.getElementById('compareSite1').value;
        const site2 = document.getElementById('compareSite2').value;
        
        if (!site1 || !site2 || site1 === site2) {
            alert('Please select two different sites for comparison.');
            return;
        }
        
        const years = ['2020', '2022', '2024'];
        const categories = ['Crops_Percent', 'BuiltArea_Percent', 'Rangeland_Percent'];
        
        const datasets = [
            {
                label: `${site1} - Crops`,
                data: years.map(year => {
                    const data = this.getSiteData(site1, year);
                    return data ? data.Crops_Percent || 0 : 0;
                }),
                borderColor: '#f1c40f',
                backgroundColor: '#f1c40f40'
            },
            {
                label: `${site2} - Crops`,
                data: years.map(year => {
                    const data = this.getSiteData(site2, year);
                    return data ? data.Crops_Percent || 0 : 0;
                }),
                borderColor: '#f39c12',
                backgroundColor: '#f39c1240',
                borderDash: [5, 5]
            },
            {
                label: `${site1} - Built Area`,
                data: years.map(year => {
                    const data = this.getSiteData(site1, year);
                    return data ? data.BuiltArea_Percent || 0 : 0;
                }),
                borderColor: '#e74c3c',
                backgroundColor: '#e74c3c40'
            },
            {
                label: `${site2} - Built Area`,
                data: years.map(year => {
                    const data = this.getSiteData(site2, year);
                    return data ? data.BuiltArea_Percent || 0 : 0;
                }),
                borderColor: '#c0392b',
                backgroundColor: '#c0392b40',
                borderDash: [5, 5]
            }
        ];
        
        this.updateComparisonChart(years, datasets);
    }
    
    updateComparisonChart(labels, datasets) {
        const ctx = document.getElementById('comparisonChart').getContext('2d');
        
        if (this.comparisonChart) {
            this.comparisonChart.destroy();
        }
        
        this.comparisonChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Site Comparison: Crops vs Built Area'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Percentage (%)'
                        }
                    }
                }
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LandUseVisualizer();
});