class LandUseVisualizer {
    constructor() {
        this.data = {};
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
    
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.populateSiteSelect();
        this.populateCategoryCards();
        this.updateNarrative();
    }
    
    async loadData() {
        try {
            const years = ['2020', '2022', '2024'];
            for (const year of years) {
                const response = await fetch(`data/${year}-Result-exc.json`);
                if (response.ok) {
                    this.data[year] = await response.json();
                } else {
                    console.warn(`Could not load data for ${year}`);
                    this.data[year] = this.createMockData();
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
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
        
        const sites = new Set();
        Object.values(this.data).forEach(yearData => {
            yearData.forEach(site => {
                sites.add(site.Site_Name);
            });
        });
        
        sites.forEach(site => {
            const option = document.createElement('option');
            option.value = site;
            option.textContent = site;
            siteSelect.appendChild(option);
        });
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
                <div class="category-percent" id="percent-${category.id}">--%</div>
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
            this.updateNarrative();
        }
    }
    
    setupEventListeners() {
        document.getElementById('siteSelect').addEventListener('change', (e) => {
            this.currentSite = e.target.value;
            if (this.currentSite) {
                this.updateVisualization();
                this.updateNarrative();
                this.updateCategoryPercentages();
            }
        });
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
        
        // Create incremental stacked bar chart data
        let cumulativeData = [0, 0, 0]; // Initialize for each year
        
        selectedCategories.forEach(categoryId => {
            const category = categories[categoryId];
            const data = years.map((year, index) => {
                const siteData = this.getSiteData(this.currentSite, year);
                const value = siteData ? siteData[category.key] || 0 : 0;
                
                // For incremental stacking, we need to add to the previous category's value
                const incrementalValue = value;
                const previousCumulative = index > 0 ? cumulativeData[index] : 0;
                cumulativeData[index] = previousCumulative + incrementalValue;
                
                return incrementalValue;
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
                        stacked: false, // Not stacked, but incremental
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
        
        if (!siteData2020 || !siteData2022 || !siteData2024) return;
        
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
    
    updateNarrative() {
        if (!this.currentSite) {
            document.getElementById('narrativeContent').innerHTML = `
                <p class="narrative-text">
                    Welcome to the Land Use Variation Analyzer. Select a site from the dropdown menu to begin exploring land use changes from 2020 to 2024.
                </p>
                <div class="narrative-stats">
                    <p>Select a site to view detailed statistics and insights about land use changes over time.</p>
                </div>
                <div class="narrative-insights">
                    <h4><i class="fas fa-lightbulb"></i> Key Insights</h4>
                    <ul class="insights-list">
                        <li>Track changes in land cover percentages over time</li>
                        <li>Monitor urbanization and agricultural expansion</li>
                        <li>Understand environmental transformation patterns</li>
                        <li>Analyze the impact of development on natural resources</li>
                    </ul>
                </div>
            `;
            return;
        }
        
        const siteData2020 = this.getSiteData(this.currentSite, '2020');
        const siteData2024 = this.getSiteData(this.currentSite, '2024');
        
        if (!siteData2020 || !siteData2024) return;
        
        // Calculate key statistics
        const totalArea2020 = siteData2020.Total_Area_sq_km || 0;
        const totalArea2024 = siteData2024.Total_Area_sq_km || 0;
        const areaChange = ((totalArea2024 - totalArea2020) / totalArea2020 * 100).toFixed(1);
        
        // Find dominant categories
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
        
        // Calculate total selected percentage
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
        
        const narrativeContent = `
            <p class="narrative-text">
                Analysis of <strong>${this.currentSite}</strong> reveals significant land use transformations between 2020 and 2024. 
                The site covers ${totalArea2024.toFixed(1)} square kilometers, showing a ${areaChange >= 0 ? 'growth' : 'reduction'} 
                of ${Math.abs(areaChange)}% in total monitored area.
            </p>
            
            <div class="narrative-stats">
                <div class="stat-item">
                    <span class="stat-label">Total Area (2024):</span>
                    <span class="stat-value">${totalArea2024.toFixed(1)} sq km</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Area Change (2020-2024):</span>
                    <span class="stat-value">${areaChange}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Dominant Use (2024):</span>
                    <span class="stat-value">${dominant2024}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Selected Categories:</span>
                    <span class="stat-value">${totalSelectedPercent.toFixed(1)}%</span>
                </div>
            </div>
            
            <div class="narrative-insights">
                <h4><i class="fas fa-chart-line"></i> Trend Analysis</h4>
                <ul class="insights-list">
                    <li>${dominant2020} was the primary land use in 2020 (${max2020.toFixed(1)}%)</li>
                    <li>${dominant2024} has emerged as dominant in 2024 (${max2024.toFixed(1)}%)</li>
                    <li>${areaChange >= 0 ? 'Expansion' : 'Contraction'} of monitored area suggests ${areaChange >= 0 ? 'increased' : 'reduced'} development activity</li>
                    <li>Selected categories represent ${totalSelectedPercent.toFixed(1)}% of total land use in 2024</li>
                </ul>
            </div>
        `;
        
        document.getElementById('narrativeContent').innerHTML = narrativeContent;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new LandUseVisualizer();
});
