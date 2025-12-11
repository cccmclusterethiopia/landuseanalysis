class LandUseVisualizer {
    constructor() {
        // Embedded data - NO FILE LOADING NEEDED
        this.data = this.createSampleData();
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
    
    createSampleData() {
        // Using your provided sample data and adding more for demonstration
        return {
            '2020': [
                {
                    "Site_Name": "Abiyiadi TVET College",
                    "Total_Area_sq_km": 1203.5,
                    "Water_Area": 0.18,
                    "Water_Percent": 0.02,
                    "Trees_Area": 0.58,
                    "Trees_Percent": 0.05,
                    "FloodVegetation_Area": 0.01,
                    "FloodVegetation_Percent": 0,
                    "Crops_Area": 165.61,
                    "Crops_Percent": 13.76,
                    "BuiltArea_Area": 494.65,
                    "BuiltArea_Percent": 41.1,
                    "BareGround_Area": 2.77,
                    "BareGround_Percent": 0.23,
                    "Rangeland_Area": 539.69,
                    "Rangeland_Percent": 44.84
                },
                {
                    "Site_Name": "Abreha We'atsbha Elementary School",
                    "Total_Area_sq_km": 1135.89,
                    "Water_Area": 0.06,
                    "Water_Percent": 0,
                    "Trees_Area": 22.24,
                    "Trees_Percent": 1.96,
                    "FloodVegetation_Area": 0,
                    "FloodVegetation_Percent": 0,
                    "Crops_Area": 321.02,
                    "Crops_Percent": 28.26,
                    "BuiltArea_Area": 120.07,
                    "BuiltArea_Percent": 10.57,
                    "BareGround_Area": 0.42,
                    "BareGround_Percent": 0.04,
                    "Rangeland_Area": 672.08,
                    "Rangeland_Percent": 59.17
                },
                {
                    "Site_Name": "Adigrat University",
                    "Total_Area_sq_km": 1850.25,
                    "Water_Area": 1.25,
                    "Water_Percent": 0.07,
                    "Trees_Area": 45.60,
                    "Trees_Percent": 2.46,
                    "FloodVegetation_Area": 0.85,
                    "FloodVegetation_Percent": 0.05,
                    "Crops_Area": 420.35,
                    "Crops_Percent": 22.72,
                    "BuiltArea_Area": 280.45,
                    "BuiltArea_Percent": 15.16,
                    "BareGround_Area": 3.25,
                    "BareGround_Percent": 0.18,
                    "Rangeland_Area": 1098.50,
                    "Rangeland_Percent": 59.36
                },
                {
                    "Site_Name": "Mekelle Industrial Park",
                    "Total_Area_sq_km": 950.75,
                    "Water_Area": 0.35,
                    "Water_Percent": 0.04,
                    "Trees_Area": 8.90,
                    "Trees_Percent": 0.94,
                    "FloodVegetation_Area": 0.12,
                    "FloodVegetation_Percent": 0.01,
                    "Crops_Area": 180.25,
                    "Crops_Percent": 18.96,
                    "BuiltArea_Area": 420.80,
                    "BuiltArea_Percent": 44.26,
                    "BareGround_Area": 5.60,
                    "BareGround_Percent": 0.59,
                    "Rangeland_Area": 334.73,
                    "Rangeland_Percent": 35.20
                }
            ],
            '2022': [
                {
                    "Site_Name": "Abiyiadi TVET College",
                    "Total_Area_sq_km": 1205.2,
                    "Water_Area": 0.20,
                    "Water_Percent": 0.02,
                    "Trees_Area": 0.65,
                    "Trees_Percent": 0.05,
                    "FloodVegetation_Area": 0.01,
                    "FloodVegetation_Percent": 0,
                    "Crops_Area": 168.45,
                    "Crops_Percent": 13.98,
                    "BuiltArea_Area": 520.30,
                    "BuiltArea_Percent": 43.18,
                    "BareGround_Area": 2.95,
                    "BareGround_Percent": 0.24,
                    "Rangeland_Area": 512.64,
                    "Rangeland_Percent": 42.53
                },
                {
                    "Site_Name": "Abreha We'atsbha Elementary School",
                    "Total_Area_sq_km": 1136.50,
                    "Water_Area": 0.08,
                    "Water_Percent": 0.01,
                    "Trees_Area": 23.15,
                    "Trees_Percent": 2.04,
                    "FloodVegetation_Area": 0.05,
                    "FloodVegetation_Percent": 0,
                    "Crops_Area": 325.80,
                    "Crops_Percent": 28.67,
                    "BuiltArea_Area": 135.25,
                    "BuiltArea_Percent": 11.90,
                    "BareGround_Area": 0.50,
                    "BareGround_Percent": 0.04,
                    "Rangeland_Area": 651.67,
                    "Rangeland_Percent": 57.34
                },
                {
                    "Site_Name": "Adigrat University",
                    "Total_Area_sq_km": 1852.80,
                    "Water_Area": 1.30,
                    "Water_Percent": 0.07,
                    "Trees_Area": 46.80,
                    "Trees_Percent": 2.53,
                    "FloodVegetation_Area": 0.90,
                    "FloodVegetation_Percent": 0.05,
                    "Crops_Area": 425.20,
                    "Crops_Percent": 22.95,
                    "BuiltArea_Area": 310.25,
                    "BuiltArea_Percent": 16.74,
                    "BareGround_Area": 3.40,
                    "BareGround_Percent": 0.18,
                    "Rangeland_Area": 1064.95,
                    "Rangeland_Percent": 57.48
                },
                {
                    "Site_Name": "Mekelle Industrial Park",
                    "Total_Area_sq_km": 952.40,
                    "Water_Area": 0.38,
                    "Water_Percent": 0.04,
                    "Trees_Area": 9.25,
                    "Trees_Percent": 0.97,
                    "FloodVegetation_Area": 0.15,
                    "FloodVegetation_Percent": 0.02,
                    "Crops_Area": 182.80,
                    "Crops_Percent": 19.20,
                    "BuiltArea_Area": 450.60,
                    "BuiltArea_Percent": 47.32,
                    "BareGround_Area": 6.25,
                    "BareGround_Percent": 0.66,
                    "Rangeland_Area": 302.97,
                    "Rangeland_Percent": 31.79
                }
            ],
            '2024': [
                {
                    "Site_Name": "Abiyiadi TVET College",
                    "Total_Area_sq_km": 1208.75,
                    "Water_Area": 0.22,
                    "Water_Percent": 0.02,
                    "Trees_Area": 0.72,
                    "Trees_Percent": 0.06,
                    "FloodVegetation_Area": 0.02,
                    "FloodVegetation_Percent": 0,
                    "Crops_Area": 172.30,
                    "Crops_Percent": 14.25,
                    "BuiltArea_Area": 550.45,
                    "BuiltArea_Percent": 45.52,
                    "BareGround_Area": 3.15,
                    "BareGround_Percent": 0.26,
                    "Rangeland_Area": 482.89,
                    "Rangeland_Percent": 39.89
                },
                {
                    "Site_Name": "Abreha We'atsbha Elementary School",
                    "Total_Area_sq_km": 1137.25,
                    "Water_Area": 0.10,
                    "Water_Percent": 0.01,
                    "Trees_Area": 24.80,
                    "Trees_Percent": 2.18,
                    "FloodVegetation_Area": 0.08,
                    "FloodVegetation_Percent": 0.01,
                    "Crops_Area": 330.45,
                    "Crops_Percent": 29.05,
                    "BuiltArea_Area": 155.80,
                    "BuiltArea_Percent": 13.70,
                    "BareGround_Area": 0.62,
                    "BareGround_Percent": 0.05,
                    "Rangeland_Area": 625.40,
                    "Rangeland_Percent": 54.99
                },
                {
                    "Site_Name": "Adigrat University",
                    "Total_Area_sq_km": 1855.60,
                    "Water_Area": 1.40,
                    "Water_Percent": 0.08,
                    "Trees_Area": 48.25,
                    "Trees_Percent": 2.60,
                    "FloodVegetation_Area": 1.05,
                    "FloodVegetation_Percent": 0.06,
                    "Crops_Area": 430.80,
                    "Crops_Percent": 23.21,
                    "BuiltArea_Area": 345.60,
                    "BuiltArea_Percent": 18.62,
                    "BareGround_Area": 3.65,
                    "BareGround_Percent": 0.20,
                    "Rangeland_Area": 1025.85,
                    "Rangeland_Percent": 55.23
                },
                {
                    "Site_Name": "Mekelle Industrial Park",
                    "Total_Area_sq_km": 955.20,
                    "Water_Area": 0.42,
                    "Water_Percent": 0.04,
                    "Trees_Area": 9.80,
                    "Trees_Percent": 1.03,
                    "FloodVegetation_Area": 0.20,
                    "FloodVegetation_Percent": 0.02,
                    "Crops_Area": 185.60,
                    "Crops_Percent": 19.43,
                    "BuiltArea_Area": 485.75,
                    "BuiltArea_Percent": 50.85,
                    "BareGround_Area": 7.15,
                    "BareGround_Percent": 0.75,
                    "Rangeland_Area": 266.38,
                    "Rangeland_Percent": 27.88
                }
            ]
        };
    }
    
    init() {
        this.setupEventListeners();
        this.populateSiteSelect();
        this.populateCategoryCards();
        this.updateNarrative();
    }
    
    populateSiteSelect() {
        const siteSelect = document.getElementById('siteSelect');
        
        // Get unique site names from 2020 data
        const sites = this.data['2020'].map(site => site.Site_Name);
        
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
        
        selectedCategories.forEach(categoryId => {
            const category = categories[categoryId];
            const data = years.map(year => {
                const siteData = this.getSiteData(this.currentSite, year);
                return siteData ? siteData[category.key] || 0 : 0;
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
                    <p>Data available for multiple sites with detailed land use categories including Water, Trees, Crops, Built Area, and more.</p>
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
