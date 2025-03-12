let gpuData = [];
let currentBrand = 'NVIDIA'; // Assume 1000 items
const itemsPerPage = 21; // Display 20 per page
let currentPage = 1;
let currentSort = 'default';
let searchQuery = "";

function sanitizeInput(input) {
    // Prevent XSS by removing special characters
    return input.replace(/[<>{}()]/g, '');
}

function searchGPUs() {
    const searchInput = document.querySelector(".search-input");
    const clearButton = document.getElementById("clear-search");

    searchQuery = sanitizeInput(searchInput.value.trim());

    currentPage =1;

    updateGPUGrid(); // Reset page & update grid
}


document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initializeApp();

    // Tab functionality
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

    // Series Filter functionality
    const seriesFilter = document.querySelector('.filter-group[aria-label="GPU Series"]');
    if (seriesFilter) {
        seriesFilter.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-button')) {
                const button = e.target;
                const filterGroup = button.closest('.filter-group');
                
                // Handle exclusive selection
                if (filterGroup.getAttribute('data-exclusive') === 'true') {
                    filterGroup.querySelectorAll('.filter-button').forEach(btn => {
                        if (btn !== button) {
                            btn.classList.remove('active');
                            btn.setAttribute('aria-checked', 'false');
                        }
                    });
                }
                
                button.classList.toggle('active');
                button.setAttribute('aria-checked', button.classList.contains('active'));

                currentPage=1
                
                // Update card filters immediately after series selection
                updateCardFilters();
                updateGPUGrid();
            }
        });
    }

    // Card Filter functionality
    const cardFilter = document.querySelector('.filter-group[aria-label="GPU Cards"]');
    if (cardFilter) {
        cardFilter.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-button')) {
                const button = e.target;
                const filterGroup = button.closest('.filter-group');
                
                // Handle exclusive selection
                if (filterGroup.getAttribute('data-exclusive') === 'true') {
                    filterGroup.querySelectorAll('.filter-button').forEach(btn => {
                        if (btn !== button) {
                            btn.classList.remove('active');
                            btn.setAttribute('aria-checked', 'false');
                        }
                    });
                }
                
                button.classList.toggle('active');
                button.setAttribute('aria-checked', button.classList.contains('active'));
                
                // Update grid immediately after card selection
                currentPage = 1
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
    
    // Clear existing filters
    filterGroup.innerHTML = '';
    
    // Add new series filters
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
    
    // Clear existing filters
    filterGroup.innerHTML = '';
    
    // Add new card filters
    uniqueCards.forEach(card => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.setAttribute('role', 'checkbox');
        button.setAttribute('aria-checked', 'false');
        button.textContent = card;
        filterGroup.appendChild(button);
    });
}

function getActiveFilters() {
    const filters = {
        series: [],
        cards: []
    };

    document.querySelectorAll('.filter-group[aria-label="GPU Series"] .filter-button.active')
        .forEach(button => filters.series.push(button.textContent.trim()));

    document.querySelectorAll('.filter-group[aria-label="GPU Cards"] .filter-button.active')
        .forEach(button => filters.cards.push(button.textContent.trim()));

    return filters;
}

function filterGPUs(gpus, filters) {
    return gpus.filter(gpu => {
        const brandMatch = gpu.Brand.toUpperCase() === currentBrand.toUpperCase();
        const seriesMatch = filters.series.length === 0 || 
                           filters.series.includes(gpu.Series);
        const cardMatch = filters.cards.length === 0 ||
                         filters.cards.includes(gpu.Card);
        return brandMatch && seriesMatch && cardMatch;
    });
}

function updateGPUGrid() {
    const gpuGrid = document.querySelector('.gpu-grid');
    const pageInfo = document.getElementById("page-info");

    if (!gpuGrid || !pageInfo) return;

    const filters = getActiveFilters();
    let filteredGPUs = filterGPUs(gpuData, filters);
    
    gpuGrid.innerHTML = '';

    if (searchQuery) {
        filteredGPUs = filteredGPUs.filter(gpu =>
            gpu.Card.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gpu.Model.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gpu.Brand.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }


    if (currentSort === "high") {
        filteredGPUs.sort((a, b) => b.Price - a.Price); // High to Low
    } else if (currentSort === "low") {
        filteredGPUs.sort((a, b) => a.Price - b.Price); // Low to High
    }

    num = filteredGPUs.length; // ✅ Update num dynamically
    totalItems = num;


    if (filteredGPUs.length === 0) {
        gpuGrid.innerHTML = '<div class="no-results">No GPUs found matching the selected filters</div>';
        pageInfo.textContent = 'No results found';
        return;
    }

    // Pagination logic
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedGPUs = filteredGPUs.slice(start, start + itemsPerPage);


    paginatedGPUs.forEach(gpu => {
        const card = createGPUCard(gpu);
        gpuGrid.appendChild(card);
    });

    const sectionTitle = document.querySelector('.section-title');
    if (sectionTitle) {
        const seriesText = filters.series.length > 0 ? filters.series[0] : '';
        const cardText = filters.cards.length > 0 ? ` - ${filters.cards[0]}` : '';
        sectionTitle.textContent = `${currentBrand} ${seriesText}${cardText} (${filteredGPUs.length} cards)`;
    }

     // Update pagination controls
     pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(totalItems / itemsPerPage)}`;
     document.getElementById("prev").disabled = currentPage === 1;
     document.getElementById("next").disabled = currentPage === Math.ceil(totalItems / itemsPerPage);
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
            updateGPUGrid(true); // Re-render with sorting
        }


