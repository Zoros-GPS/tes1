let gpuData = [];
let currentBrand = 'NVIDIA';

async function initializeApp() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'flex'; // Show loading screen

    try {
        const response = await fetch('./gpu_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        gpuData = await response.json();
        
        if (gpuData.length === 0) {
            throw new Error('GPU data is empty');
        }

        console.log('GPU Data loaded:', gpuData);

        // Ensure NVIDIA is the default brand
        currentBrand = 'NVIDIA';

        // Update UI only after data is loaded
        updateSeriesFilters();
        updateCardFilters()
        updateGPUGrid();
    } catch (error) {
        console.error('Error loading GPU data:', error);
        document.querySelector('.gpu-grid').innerHTML = 
            '<div class="error-message">Error loading GPU data. Please try again later.</div>';
    } finally {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0'; // Fade out effect
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500); // Ensure it disappears after fade-out
        }, 1000); // Keep loading visible for 1 sec for smooth UX
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initializeApp();

    // Tab functionality - Updated selector to match your HTML structure
    const tabsContainer = document.querySelector('.tabs-container .tabs');
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (!tab) return;

            // Remove active class from all tabs
            tabsContainer.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            
            // Add active class to clicked tab
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            
            // Update current brand
            const brandSpan = tab.querySelector('span');
            if (brandSpan) {
                currentBrand = brandSpan.textContent;
                updateSeriesFilters();
                updateCardFilters()
                updateGPUGrid();
            }
        });
    }

    // Filter functionality
    document.querySelector('.filter-group[aria-label="GPU Series"]').addEventListener('click', (e) => {
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
            
            updateCardFilters();
             // Update card filters when series changes
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
    if (!filterGroup) return;
    
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

function getUniqueCards() {
    return [...new Set(gpuData
        .filter(gpu => {
            const brandMatch = gpu.Brand.toUpperCase() === currentBrand.toUpperCase();
            const seriesMatch = getActiveFilters().series.length === 0 || 
                              getActiveFilters().series.includes(gpu.Series);
            return brandMatch && seriesMatch;
        })
        .map(gpu => gpu.Card)
        .filter(card => card && card.trim() !== '')
    )].sort();
}

function updateCardFilters() {
    const uniqueCards = getUniqueCards();
    const filterGroup = document.querySelector('.filter-group[aria-label="GPU Cards"]');
    if (!filterGroup) return;
    
    filterGroup.innerHTML = '';
    uniqueCards.forEach(card => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.setAttribute('role', 'checkbox');
        button.setAttribute('aria-checked', 'false');
        button.textContent = card;
        filterGroup.appendChild(button);
    });
}

// Update the getActiveFilters function to include cards
function getActiveFilters() {
    const filters = {
        series: [],
        cards: [],
        memory: []
    };

    document.querySelectorAll('.filter-group[aria-label="GPU Series"] .filter-button.active')
        .forEach(button => filters.series.push(button.textContent.trim()));

    document.querySelectorAll('.filter-group[aria-label="GPU Cards"] .filter-button.active')
        .forEach(button => filters.cards.push(button.textContent.trim()));

    document.querySelectorAll('.filter-group[aria-label="Memory Size"] .filter-button.active')
        .forEach(button => filters.memory.push(button.textContent.trim()));

    return filters;
}

// Update the filterGPUs function to include card filtering
function filterGPUs(gpus, filters) {
    return gpus.filter(gpu => {
        const brandMatch = gpu.Brand.toUpperCase() === currentBrand.toUpperCase();
        const seriesMatch = filters.series.length === 0 || 
                           filters.series.some(series => gpu.Series === series);
        const cardMatch = filters.cards.length === 0 ||
                         filters.cards.some(card => gpu.Card === card);
        return brandMatch && seriesMatch && cardMatch;
    });
}


function updateGPUGrid() {
    const gpuGrid = document.querySelector('.gpu-grid');
    if (!gpuGrid) return;

    if (!gpuData.length) {
        gpuGrid.innerHTML = '<div class="error-message">No GPU data available</div>';
        return;
    }

    const filters = getActiveFilters();
    const filteredGPUs = filterGPUs(gpuData, filters);
    
    gpuGrid.innerHTML = '';

    if (filteredGPUs.length === 0) {
        gpuGrid.innerHTML = '<div class="no-results">No GPUs found matching the selected filters</div>';
        return;
    }

    filteredGPUs.forEach(gpu => {
        const card = createGPUCard(gpu);
        gpuGrid.appendChild(card);
    });

    const sectionTitle = document.querySelector('.section-title');
    if (sectionTitle) {
        const seriesText = filters.series.length > 0 ? filters.series[0] : '';
        sectionTitle.textContent = `${currentBrand} ${seriesText} (${filteredGPUs.length} cards)`;
    }
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