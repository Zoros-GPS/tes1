let gpuData = [];
let currentBrand = 'NVIDIA'; // Assume 1000 items
const itemsPerPage = 21; // Display 20 per page
let currentPage = 1;
let currentSort = 'default';
let searchQuery = "";
let selectedSeries = []; // Track which series are selected

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
                selectedSeries = []; // Reset selected series when brand changes
                updateSeriesFilters();
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
    document.querySelectorAll('.sort-button').forEach(button => {
        button.addEventListener('click', function() {
            // Remove 'active' class from all buttons
            document.querySelectorAll('.sort-button').forEach(btn => btn.classList.remove('active'));
            
            // Add 'active' class to the clicked button
            this.classList.add('active');
    
            // Get the sort order and trigger sorting function
            const sortOrder = this.getAttribute('data-sort') || this.getAttribute('onclick').match(/'([^']+)'/)[1];
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
    const filterContainer = document.querySelector('.filters-container');
    if (!filterContainer) return;
    
    // Clear existing filters
    filterContainer.innerHTML = '';
    
    // Create series section
    const seriesSection = document.createElement('div');
    seriesSection.className = 'filter-section';
    
    const seriesHeading = document.createElement('h3');
    seriesHeading.className = 'filter-heading';
    seriesHeading.textContent = 'GPU Series';
    seriesSection.appendChild(seriesHeading);
    
    const seriesGroup = document.createElement('div');
    seriesGroup.className = 'filter-group';
    seriesGroup.setAttribute('aria-label', 'GPU Series');
    
    // Create series buttons
    uniqueSeries.forEach(series => {
        const seriesWrapper = document.createElement('div');
        seriesWrapper.className = 'series-wrapper';
        seriesWrapper.dataset.series = series;
        
        const seriesButton = document.createElement('button');
        seriesButton.className = 'series-button';
        seriesButton.textContent = series;
        seriesButton.setAttribute('aria-expanded', 'false');
        
        // Add down arrow icon to series button
        const arrowIcon = document.createElement('span');
        arrowIcon.className = 'arrow-icon';
        arrowIcon.innerHTML = '▼';
        seriesButton.appendChild(arrowIcon);
        
        seriesButton.addEventListener('click', () => toggleSeries(series));
        
        // Create container for card filters (initially hidden)
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container hidden';
        cardsContainer.setAttribute('aria-label', `${series} Cards`);
        
        seriesWrapper.appendChild(seriesButton);
        seriesWrapper.appendChild(cardsContainer);
        seriesGroup.appendChild(seriesWrapper);
    });
    
    seriesSection.appendChild(seriesGroup);
    filterContainer.appendChild(seriesSection);
}

function toggleSeries(series) {
    const seriesWrapper = document.querySelector(`.series-wrapper[data-series="${series}"]`);
    const seriesButton = seriesWrapper.querySelector('.series-button');
    const cardsContainer = seriesWrapper.querySelector('.cards-container');
    const isSelected = seriesButton.classList.contains('active');
    
    if (isSelected) {
        // If already selected, deselect it and hide cards
        seriesButton.classList.remove('active');
        seriesButton.setAttribute('aria-expanded', 'false');
        cardsContainer.classList.add('hidden');
        
        // Remove from selected series array
        selectedSeries = selectedSeries.filter(s => s !== series);
    } else {
        // If not selected, select it and show cards
        seriesButton.classList.add('active');
        seriesButton.setAttribute('aria-expanded', 'true');
        
        // Add to selected series array
        selectedSeries.push(series);
        
        // Update and show card filters for this series
        updateCardFiltersForSeries(series);
    }
    
    // Update the grid based on the selected series
    currentPage = 1;
    updateGPUGrid();
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

    const cardHeading = document.createElement('h4');
    cardHeading.className = 'filter-card-heading';
    cardHeading.textContent = 'Models';
    
    const cardsContainer = seriesWrapper.querySelector('.cards-container');
    if (!cardsContainer) return;
    
    // Clear existing card filters
    cardsContainer.innerHTML = '';
    
    // Get cards for this series
    const seriesCards = getCardsForSeries(series);

    
    
    // Create card filter buttons
    seriesCards.forEach(card => {
        const cardButton = document.createElement('button');
        cardButton.className = 'card-button';
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
        series: [...selectedSeries],
        cards: []
    };

    // Collect active card filters for all selected series
    selectedSeries.forEach(series => {
        const seriesWrapper = document.querySelector(`.series-wrapper[data-series="${series}"]`);
        if (seriesWrapper) {
            const activeCards = Array.from(seriesWrapper.querySelectorAll('.card-button.active'))
                .map(button => button.textContent.trim());
            
            // If no cards are selected for this series, show all cards of this series
            if (activeCards.length === 0) {
                // Add all cards for this series
                const allSeriesCards = getCardsForSeries(series);
                filters.cards.push(...allSeriesCards);
            } else {
                // Add only selected cards
                filters.cards.push(...activeCards);
            }
        }
    });

    return filters;
}

function filterGPUs(gpus, filters) {
    // If no series selected, show all for current brand
    if (filters.series.length === 0) {
        return gpus.filter(gpu => {
            const brandMatch = gpu.Brand.toUpperCase() === currentBrand.toUpperCase();
            
            // Apply search filter if there's a search query
            const searchMatch = !searchQuery || 
                              gpu.Card.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              gpu.Model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              gpu.Brand.toLowerCase().includes(searchQuery.toLowerCase());
            
            return brandMatch && searchMatch;
        });
    }
    
    // If series are selected, filter by series and cards
    return gpus.filter(gpu => {
        const brandMatch = gpu.Brand.toUpperCase() === currentBrand.toUpperCase();
        const seriesMatch = filters.series.includes(gpu.Series);
        
        // For cards, check if this card is in our filtered cards list
        const cardMatch = filters.cards.includes(gpu.Card);
        
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
        let titleText = currentBrand;
        
        if (filters.series.length === 1) {
            titleText += ` ${filters.series[0]}`;
            
            // Count active card filters for this series
            const seriesWrapper = document.querySelector(`.series-wrapper[data-series="${filters.series[0]}"]`);
            if (seriesWrapper) {
                const activeCardCount = seriesWrapper.querySelectorAll('.card-button.active').length;
                if (activeCardCount > 0) {
                    const cardNames = Array.from(seriesWrapper.querySelectorAll('.card-button.active'))
                        .map(btn => btn.textContent.trim())
                        .join(', ');
                    titleText += ` - ${cardNames}`;
                }
            }
        } else if (filters.series.length > 1) {
            titleText += ` (${filters.series.length} Series)`;
        }
        
        titleText += ` (${filteredGPUs.length} cards)`;
        sectionTitle.textContent = titleText;
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