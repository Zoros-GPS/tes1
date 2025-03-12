let gpuData = [];
let currentBrand = 'NVIDIA';
const itemsPerPage = 21;
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
        button.setAttribute('role', 'button');
        button.setAttribute('aria-expanded', 'false');
        button.textContent = series;
        button.addEventListener('click', () => toggleCardDropdown(series, button));
        
        const dropdown = document.createElement('div');
        dropdown.className = 'card-dropdown hidden';
        dropdown.setAttribute('aria-label', `Cards for ${series}`);
        dropdown.dataset.series = series;
        
        filterGroup.appendChild(button);
        filterGroup.appendChild(dropdown);
    });
}

function toggleCardDropdown(series, button) {
    const dropdown = document.querySelector(`.card-dropdown[data-series="${series}"]`);
    
    if (!dropdown) return;
    
    if (dropdown.classList.contains('hidden')) {
        document.querySelectorAll('.card-dropdown').forEach(d => d.classList.add('hidden'));
        document.querySelectorAll('.filter-button').forEach(b => b.setAttribute('aria-expanded', 'false'));
        
        dropdown.classList.remove('hidden');
        button.setAttribute('aria-expanded', 'true');
        updateCardDropdown(series, dropdown);
    } else {
        dropdown.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
    }
}

function updateCardDropdown(series, dropdown) {
    const uniqueCards = gpuData.filter(gpu => gpu.Series === series).map(gpu => gpu.Card);
    dropdown.innerHTML = '';
    
    uniqueCards.forEach(card => {
        const option = document.createElement('div');
        option.className = 'card-option';
        option.textContent = card;
        option.addEventListener('click', () => selectCard(series, card));
        
        dropdown.appendChild(option);
    });
}

function selectCard(series, card) {
    document.querySelectorAll('.card-dropdown').forEach(d => d.classList.add('hidden'));
    currentBrand = gpuData.find(gpu => gpu.Series === series && gpu.Card === card)?.Brand || currentBrand;
    
    document.querySelectorAll('.filter-button').forEach(b => b.setAttribute('aria-expanded', 'false'));
    
    updateGPUGrid();
}

function updateGPUGrid() {
    const gpuGrid = document.querySelector('.gpu-grid');
    const pageInfo = document.getElementById("page-info");
    if (!gpuGrid || !pageInfo) return;
    
    let filteredGPUs = gpuData.filter(gpu => gpu.Brand === currentBrand);
    
    if (searchQuery) {
        filteredGPUs = filteredGPUs.filter(gpu =>
            gpu.Card.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gpu.Model.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    if (currentSort === "high") {
        filteredGPUs.sort((a, b) => b.Price - a.Price);
    } else if (currentSort === "low") {
        filteredGPUs.sort((a, b) => a.Price - b.Price);
    }
    
    gpuGrid.innerHTML = '';
    
    if (filteredGPUs.length === 0) {
        gpuGrid.innerHTML = '<div class="no-results">No GPUs found</div>';
        pageInfo.textContent = 'No results found';
        return;
    }
    
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedGPUs = filteredGPUs.slice(start, start + itemsPerPage);
    
    paginatedGPUs.forEach(gpu => {
        const card = createGPUCard(gpu);
        gpuGrid.appendChild(card);
    });
    
    pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(filteredGPUs.length / itemsPerPage)}`;
    document.getElementById("prev").disabled = currentPage === 1;
    document.getElementById("next").disabled = currentPage === Math.ceil(filteredGPUs.length / itemsPerPage);
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
    `;
    return card;
}

async function initializeApp() {
    try {
        const response = await fetch('./gpu_data.json');
        gpuData = await response.json();
        updateSeriesFilters();
        updateGPUGrid();
    } catch (error) {
        console.error('Error loading GPU data:', error);
    }
}

function nextPage() {
    if (currentPage < gpuData.length / itemsPerPage) {
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
