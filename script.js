let gpuData = [];
let currentBrand = 'NVIDIA'; // Assume 1000 items
const itemsPerPage = 21; // Display 20 per page
let currentPage = 1;
let currentSort = 'default';
let searchQuery = "";

function sanitizeInput(input) {
    return input.replace(/[<>{}()]/g, '');
}

function searchGPUs() {
    const searchInput = document.querySelector(".search-input");
    searchQuery = sanitizeInput(searchInput.value.trim());
    currentPage = 1;
    updateGPUGrid();
}

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
        const container = document.createElement('div');
        container.className = 'series-container';

        const button = document.createElement('button');
        button.className = 'filter-button series-toggle';
        button.textContent = series;
        button.onclick = () => toggleSeries(series, container);
        
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container hidden';
        
        container.appendChild(button);
        container.appendChild(cardsContainer);
        filterGroup.appendChild(container);
        
        populateCards(series, cardsContainer);
    });
}

function getUniqueCards(series) {
    return [...new Set(gpuData
        .filter(gpu => gpu.Brand.toUpperCase() === currentBrand.toUpperCase() && gpu.Series === series)
        .map(gpu => gpu.Card)
        .filter(card => card && card.trim() !== '')
    )].sort();
}

function populateCards(series, container) {
    const uniqueCards = getUniqueCards(series);
    container.innerHTML = '';
    
    uniqueCards.forEach(card => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.setAttribute('role', 'checkbox');
        button.setAttribute('aria-checked', 'false');
        button.textContent = card;
        button.onclick = () => toggleFilter(button, 'cards');
        container.appendChild(button);
    });
}

function toggleSeries(series, container) {
    const cardsContainer = container.querySelector('.cards-container');
    if (cardsContainer) {
        cardsContainer.classList.toggle('hidden');
    }
}

function toggleFilter(button, type) {
    button.classList.toggle('active');
    button.setAttribute('aria-checked', button.classList.contains('active') ? 'true' : 'false');
    updateGPUGrid();
}

function getActiveFilters() {
    return {
        series: Array.from(document.querySelectorAll('.filter-group[aria-label="GPU Series"] .filter-button.active'))
            .map(button => button.textContent.trim()),
        cards: Array.from(document.querySelectorAll('.filter-group[aria-label="GPU Cards"] .filter-button.active'))
            .map(button => button.textContent.trim())
    };
}

function filterGPUs(gpus, filters) {
    return gpus.filter(gpu => {
        const brandMatch = gpu.Brand.toUpperCase() === currentBrand.toUpperCase();
        const seriesMatch = filters.series.length === 0 || filters.series.includes(gpu.Series);
        const cardMatch = filters.cards.length === 0 || filters.cards.includes(gpu.Card);
        return brandMatch && seriesMatch && cardMatch;
    });
}

function updateGPUGrid() {
    const gpuGrid = document.querySelector('.gpu-grid');
    const pageInfo = document.getElementById("page-info");

    if (!gpuGrid || !pageInfo) return;

    const filters = getActiveFilters();
    let filteredGPUs = filterGPUs(gpuData, filters);
    
    if (searchQuery) {
        filteredGPUs = filteredGPUs.filter(gpu =>
            gpu.Card.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gpu.Model.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gpu.Brand.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    if (currentSort === "high") {
        filteredGPUs.sort((a, b) => b.Price - a.Price);
    } else if (currentSort === "low") {
        filteredGPUs.sort((a, b) => a.Price - b.Price);
    }

    const totalItems = filteredGPUs.length;
    gpuGrid.innerHTML = '';

    if (filteredGPUs.length === 0) {
        gpuGrid.innerHTML = '<div class="no-results">No GPUs found matching the selected filters or search results</div>';
        pageInfo.textContent = 'No results found';
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const paginatedGPUs = filteredGPUs.slice(start, start + itemsPerPage);

    paginatedGPUs.forEach(gpu => {
        const card = createGPUCard(gpu);
        gpuGrid.appendChild(card);
    });

    pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(totalItems / itemsPerPage)}`;
    document.getElementById("prev").disabled = currentPage === 1;
    document.getElementById("next").disabled = currentPage === Math.ceil(totalItems / itemsPerPage);
}

function nextPage() {
    if (currentPage < totalItems / itemsPerPage) {
        currentPage++;
        updateGPUGrid();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        updateGPUGrid();
    }
}

function sortGPUs(order) {
    currentSort = order;
    currentPage = 1;
    updateGPUGrid();
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
