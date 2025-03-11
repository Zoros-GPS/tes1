// Secure data storage
const gpuData = [
    {
        "Brand": "NVIDIA",
        "Series": "RTX 4000",
        "Card": "RTX 4090",
        "Model": "NVIDIA GeForce RTX 4090 FE",
        "Price": 159999.0,
        "Retailer": "RPTech",
        "Link": "#"
    },
    {
        "Brand": "NVIDIA",
        "Series": "RTX 3000",
        "Card": "RTX 3080",
        "Model": "NVIDIA GeForce RTX 3080 FE",
        "Price": 69999.0,
        "Retailer": "RPTech",
        "Link": "#"
    },
    {
        "Brand": "NVIDIA",
        "Series": "RTX 2000",
        "Card": "RTX 2080",
        "Model": "NVIDIA GeForce RTX 2080 FE",
        "Price": 79999.0,
        "Retailer": "RPTech",
        "Link": "#"
    }
    // Add all your GPU data here
];

let currentBrand = 'NVIDIA';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize with dynamic series filters
    updateSeriesFilters();
    updateGPUGrid();

    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            
            currentBrand = tab.querySelector('span').textContent;
            updateSeriesFilters(); // Update series filters when brand changes
            updateGPUGrid();
        });
    });

    // Filter functionality
    document.querySelector('.filter-group').addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-button')) {
            const button = e.target;
            const filterGroup = button.closest('.filter-group');
            const isGroupExclusive = filterGroup.getAttribute('data-exclusive') === 'true';
            
            if (isGroupExclusive) {
                filterGroup.querySelectorAll('.filter-button').forEach(btn => {
                    if (btn !== button) {
                        btn.classList.remove('active');
                        btn.setAttribute('aria-checked', 'false');
                    }
                });
            }
            
            button.classList.toggle('active');
            button.setAttribute('aria-checked', button.classList.contains('active'));
            
            updateGPUGrid();
        }
    });
});

function getUniqueSeries() {
    return [...new Set(gpuData
        .filter(gpu => gpu.Brand.toUpperCase() === currentBrand.toUpperCase())
        .map(gpu => gpu.Series)
        .filter(series => series && series.trim() !== '')
    )].sort();
}

function updateSeriesFilters() {
    const uniqueSeries = getUniqueSeries();
    const filterGroup = document.querySelector('.filter-group[aria-label="GPU Series"]');
    filterGroup.innerHTML = '';

    uniqueSeries.forEach(series => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.setAttribute('role', 'checkbox');
        button.setAttribute('aria-checked', 'false');
        button.textContent = series;
        filterGroup.appendChild(button);
    });
}

function getActiveFilters() {
    const filters = {
        series: [],
        memory: []
    };

    document.querySelectorAll('.filter-group[aria-label="GPU Series"] .filter-button.active')
        .forEach(button => filters.series.push(button.textContent.trim()));

    document.querySelectorAll('.filter-group[aria-label="Memory Size"] .filter-button.active')
        .forEach(button => filters.memory.push(button.textContent.trim()));

    return filters;
}

function filterGPUs(gpus, filters) {
    return gpus.filter(gpu => {
        const brandMatch = gpu.Brand.toUpperCase() === currentBrand.toUpperCase();
        const seriesMatch = filters.series.length === 0 || 
                           filters.series.some(series => gpu.Series === series);
        return brandMatch && seriesMatch;
    });
}

function updateGPUGrid() {
    const filters = getActiveFilters();
    const filteredGPUs = filterGPUs(gpuData, filters);
    
    const gpuGrid = document.querySelector('.gpu-grid');
    gpuGrid.innerHTML = '';

    if (filteredGPUs.length === 0) {
        gpuGrid.innerHTML = '<div class="no-results">No GPUs found matching the selected filters</div>';
        return;
    }

    filteredGPUs.forEach(gpu => {
        const card = createGPUCard(gpu);
        gpuGrid.appendChild(card);
    });

    // Update section title
    const sectionTitle = document.querySelector('.section-title');
    const seriesText = filters.series.length > 0 ? filters.series[0] : '';
    sectionTitle.textContent = `${currentBrand} ${seriesText} (${filteredGPUs.length} cards)`;
}

function createGPUCard(gpu) {
    const card = document.createElement('div');
    card.className = 'gpu-card';
    
    card.innerHTML = `
        <div class="gpu-header">
            <div class="gpu-name">${gpu.Card}</div>
            <div class="gpu-badge">${gpu.Brand}</div>
        </div>
        <div class="gpu-details">
            <div class="detail-label">Model</div>
            <div class="memory-blue">${gpu.Model}</div>
            <div class="detail-label">Price</div>
            <div class="price-green">₹${gpu.Price.toLocaleString()}</div>
            <div class="detail-label">Retailer</div>
            <div>${gpu.Retailer}</div>
        </div>
        <div class="retailers">
            <div class="retailers-count">${gpu.Retailer}</div>
            <a href="${gpu.Link}" target="_blank" class="view-details">
                View Details 
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </a>
        </div>
    `;

    return card;
}
