let gpuData = [];
let currentBrand = 'NVIDIA'; // Assume 1000 items
const itemsPerPage = 21; // Display 20 per page
let currentPage = 1;
let currentSort = 'default';
let searchQuery = "";
let activeSeries = null; // Track which series is active

function sanitizeInput(input) {
    // Prevent XSS by removing special characters
    return input.replace(/[<>{}()]/g, '');
}

function searchGPUs() {
    const searchInput = document.querySelector(".search-input");
    searchQuery = sanitizeInput(searchInput.value.trim());
    currentPage = 1;
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
                activeSeries = null; // Reset active series when brand changes
                updateSeriesFilters();
                hideAllCardFilters(); // Hide card filters when brand changes
                updateGPUGrid();
            }
        });
    }

    // Setup search clear button
    const clearButton = document.getElementById("clear-search");
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            const searchInput = document.querySelector(".search-input");
            if (searchInput) {
                searchInput.value = "";
                searchQuery = "";
                currentPage = 1;
                updateGPUGrid();
            }
        });
    }

    // Add event listener for sort buttons
    document.querySelectorAll('[data-sort]').forEach(button => {
        button.addEventListener('click', function() {
            const sortOrder = this.getAttribute('data-sort');
            sortGPUs(sortOrder);
        });
    });

    // Add event listeners for pagination
    const prevButton = document.getElementById("prev");
    const nextButton = document.getElementById("next");
    
    if (prevButton) {
        prevButton.addEventListener('click', prevPage);
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', nextPage);
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
    const seriesContainer = document.querySelector('.filter-group[aria-label="GPU Series"]');
    if (!seriesContainer) return;
    
    // Clear existing filters
    seriesContainer.innerHTML = '';
    
    // Create series buttons
    uniqueSeries.forEach(series => {
        const seriesWrapper = document.createElement('div');
        seriesWrapper.className = 'series-wrapper';
        seriesWrapper.dataset.series = series;
        
        const seriesButton = document.createElement('button');
        seriesButton.className = 'filter-button series-button';
        seriesButton.textContent = series;
        seriesButton.setAttribute('aria-expanded', 'false');
        seriesButton.addEventListener('click', () => toggleSeriesDropdown(series));
        
        // Create container for card filters (initially hidden)
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container hidden';
        cardsContainer.setAttribute('aria-label', `${series} Cards`);
        
        seriesWrapper.appendChild(seriesButton);
        seriesWrapper.appendChild(cardsContainer);
        seriesContainer.appendChild(seriesWrapper);
    });
}

function toggleSeriesDropdown(series) {
    // If this series is already active, just close it
    if (activeSeries === series) {
        hideCardFilters(series);
        activeSeries = null;
        document.querySelectorAll('.series-button').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
        });
        return;
    }
    
    // Hide all card filters first
    hideAllCardFilters();
    
    // Set this series as active
    activeSeries = series;
    
    // Update UI to show this series as active
    document.querySelectorAll('.series-button').forEach(btn => {
        const isActive = btn.textContent === series;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });
    
    // Update and show card filters for this series
    updateCardFiltersForSeries(series);
    
    // Update the grid based on the selected series
    currentPage = 1;
    updateGPUGrid();
}

function hideAllCardFilters() {
    document.querySelectorAll('.cards-container').forEach(container => {
        container.classList.add('hidden');
    });
}

function hideCardFilters(series) {
    const seriesWrapper = document.querySelector(`.series-wrapper[data-series="${series}"]`);
    if (seriesWrapper) {
        const cardsContainer = seriesWrapper.querySelector('.cards-container');
        if (cardsContainer) {
            cardsContainer.classList.add('hidden');
        }
    }
}

function getCardsForSeries(series) {
    return [...new Set(gpuData
        .filter(gpu => 
            gpu.Brand.toUpperCase() === currentBrand.toUpperCase() && 
            gpu.Series === series
        )
        .map(gpu => gpu.Card)
        .filter(card => card && card.trim() !== '')
    )].sort();
}

function updateCardFiltersForSeries(series) {
    const seriesWrapper = document.querySelector(`.series-wrapper[data-series="${series}"]`);
    if (!seriesWrapper) return;
    
    const cardsContainer = seriesWrapper.querySelector('.cards-container');
    if (!cardsContainer) return;
    
    // Clear existing card filters
    cardsContainer.innerHTML = '';
    
    // Get cards for this series
    const seriesCards = getCardsForSeries(series);
    
    // Create card filter buttons
    seriesCards.forEach(card => {
        const cardButton = document.createElement('button');
        cardButton.className = 'filter-button card-button';
        cardButton.setAttribute('role', 'checkbox');
        cardButton.setAttribute('aria-checked', 'false');
        cardButton.textContent = card;
        
        cardButton.addEventListener('click', function() {
            // Toggle active state
            this.classList.toggle('active');
            this.setAttribute('aria-checked', this.classList.contains('active'));
            
            // Update grid immediately
            currentPage = 1;
            updateGPUGrid();
        });
        
        cardsContainer.appendChild(cardButton);
    });
    
    // Show this card container
    cardsContainer.classList.remove('hidden');
}

function getActiveFilters() {
    const filters = {
        series: activeSeries ? [activeSeries] : [],
        cards: []
    };

    // Only collect active card filters if we have an active series
    if (activeSeries) {
        const seriesWrapper = document.querySelector(`.series-wrapper[data-series="${activeSeries}"]`);
        if (seriesWrapper) {
            seriesWrapper.querySelectorAll('.card-button.active').forEach(button => {
                filters.cards.push(button.textContent.trim());
            });
        }
    }

    return filters;
}

function filterGPUs(gpus, filters) {
    return gpus.filter(gpu => {
        const brandMatch = gpu.Brand.toUpperCase() === currentBrand.toUpperCase();
        const seriesMatch = filters.series.length === 0 || 
                           filters.series.includes(gpu.Series);
        const cardMatch = filters.cards.length === 0 ||
                         filters.cards.includes(gpu.Card);
        
        // Apply search filter if there's a search query
        const searchMatch = !searchQuery || 
                          gpu.Card.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          gpu.Model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          gpu.Brand.toLowerCase().includes(searchQuery.toLowerCase());
        
        return brandMatch && seriesMatch && cardMatch && searchMatch;
    });
}

function updateGPUGrid() {
    const gpuGrid = document.querySelector('.gpu-grid');
    const pageInfo = document.getElementById("page-info");

    if (!gpuGrid || !pageInfo) return;

    const filters = getActiveFilters();
    let filteredGPUs = filterGPUs(gpuData, filters);
    
    gpuGrid.innerHTML = '';

    if (currentSort === "high") {
        filteredGPUs.sort((a, b) => b.Price - a.Price); // High to Low
    } else if (currentSort === "low") {
        filteredGPUs.sort((a, b) => a.Price - b.Price); // Low to High
    }

    const totalItems = filteredGPUs.length;

    if (filteredGPUs.length === 0) {
        gpuGrid.innerHTML = '<div class="no-results">No GPUs found matching the selected filters or search results</div>';
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
        const cardText = filters.cards.length > 0 ? ` - ${filters.cards.join(', ')}` : '';
        sectionTitle.textContent = `${currentBrand} ${seriesText}${cardText} (${filteredGPUs.length} cards)`;
    }

    // Update pagination controls
    pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(totalItems / itemsPerPage)}`;
    document.getElementById("prev").disabled = currentPage === 1;
    document.getElementById("next").disabled = currentPage === Math.ceil(totalItems / itemsPerPage) || totalItems === 0;
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

function nextPage() {
    const totalItems = filterGPUs(gpuData, getActiveFilters()).length;
    if (currentPage < Math.ceil(totalItems / itemsPerPage)) {
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