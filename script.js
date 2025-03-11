let gpuData = [];
let currentBrand = 'NVIDIA';
let itemsPerPage = 10;
let currentPage = 1;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();

    const tabsContainer = document.querySelector('.tabs-container .tabs');
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (!tab) return;

            tabsContainer.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            
            const brandSpan = tab.querySelector('span');
            if (brandSpan) {
                currentBrand = brandSpan.textContent;
                updateSeriesFilters();
                updateCardFilters();
                updateGPUGrid();
            }
        });
    }
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
    const activeFilters = getActiveFilters();
    return [...new Set(gpuData
        .filter(gpu => {
            const brandMatch = gpu.Brand.toUpperCase() === currentBrand.toUpperCase();
            const seriesMatch = activeFilters.series.length === 0 || 
                              activeFilters.series.includes(gpu.Series);
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

function updateGPUGrid() {
    const gpuGrid = document.querySelector('.gpu-grid');
    if (!gpuGrid) return;

    const filters = getActiveFilters();
    const filteredGPUs = filterGPUs(gpuData, filters);
    
    const totalPages = Math.ceil(filteredGPUs.length / itemsPerPage);
    currentPage = Math.min(currentPage, totalPages) || 1;

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedGPUs = filteredGPUs.slice(startIdx, endIdx);

    gpuGrid.innerHTML = '';

    if (paginatedGPUs.length === 0) {
        gpuGrid.innerHTML = '<div class="no-results">No GPUs found matching the selected filters</div>';
    } else {
        paginatedGPUs.forEach(gpu => {
            const card = createGPUCard(gpu);
            gpuGrid.appendChild(card);
        });
    }

    updatePaginationControls(totalPages);
}

function updatePaginationControls(totalPages) {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages || totalPages === 0;
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            updateGPUGrid();
        }
    };

    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateGPUGrid();
        }
    };
}

async function initializeApp() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }

    try {
        const response = await fetch('./gpu_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        gpuData = await response.json();
        
        if (gpuData.length === 0) {
            throw new Error('GPU data is empty');
        }

        updateSeriesFilters();
        updateCardFilters();
        updateGPUGrid();
    } catch (error) {
        console.error('Error loading GPU data:', error);
        const gpuGrid = document.querySelector('.gpu-grid');
        if (gpuGrid) {
            gpuGrid.innerHTML = '<div class="error-message">Error loading GPU data. Please try again later.</div>';
        }
    } finally {
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 500);
            }, 1000);
        }
    }
}
