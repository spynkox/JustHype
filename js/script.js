// Constants
const STORAGE_KEY = 'justhype_releases';
const PLATFORMS = ['Theaters', 'Netflix', 'Disney+', 'Prime Video'];

// Enhanced utility functions
function getStoredReleases() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
        console.error('Error loading releases:', e);
        return [];
    }
}

function saveReleases(releases) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(releases));
    } catch (e) {
        console.error('Error saving releases:', e);
        alert('Error saving data. Check console for details.');
    }
}

function groupReleasesByMonth(releases) {
    const grouped = releases.reduce((groups, release) => {
        let key;

        if (!release.date) {
            key = 'TBA';
        } else if (release.date.length === 4) {
            key = `${release.date}-13`; // Year-only entries set as "13th month"
        } else {
            const date = new Date(release.date);
            key = `${date.getFullYear()}-${date.getMonth()}`;
        }

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(release);
        return groups;
    }, {});

    // Sort releases within each month
    for (const month in grouped) {
        grouped[month].sort((a, b) => {
            if (!a.date) return 1;  // TBA items go last
            if (!b.date) return -1;
            if (a.date.length === 4 && b.date.length === 4) return a.date - b.date;
            if (a.date.length === 4) return -1;  // Year-only items go first
            if (b.date.length === 4) return 1;
            return new Date(a.date) - new Date(b.date);
        });
    }

    // Replace "year-13" keys with just the year
    const displayGrouped = {};
    Object.keys(grouped).forEach((key) => {
        if (key.endsWith('-13')) {
            const year = key.split('-')[0];
            displayGrouped[year] = grouped[key]; // Display as year only
        } else {
            displayGrouped[key] = grouped[key];
        }
    });

    return displayGrouped;
}

// UI Functions
function createMonthSection(monthKey, releases) {
    const [year, month] = monthKey.split('-');
    let monthName;

    if (month === "00") {
        monthName = year; // Solo anno
    } else {
        const date = new Date(year, month);
        monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    const section = document.createElement('div');
    section.className = 'month-section';
    section.innerHTML = `
        <h2 class="month-header">${monthName}</h2>
        <div class="releases-scroll"></div>
    `;
    
    const scrollContainer = section.querySelector('.releases-scroll');
    releases.forEach(release => {
        scrollContainer.appendChild(createReleaseCard(release));
    });
    
    return section;
}

function createReleaseCard(release) {
    const card = document.createElement('div');
    card.className = 'release-card';
    card.dataset.id = release.id;

    let dateDisplay;
    if (!release.date) {
        dateDisplay = 'TBA';
    } else if (release.date.length === 4) {
        // If only year is provided
        dateDisplay = release.date;
    } else {
        // Full date
        dateDisplay = new Date(release.date).toLocaleDateString('default', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    const episodeInfo = release.isEpisode ? 
        `<div class="episode-badge">${release.episodeNumber}</div>` : '';

    card.innerHTML = `
        <img class="release-backdrop" src="${release.backdrop || '/api/placeholder/300/150'}" 
             alt="Backdrop" onerror="this.src='/api/placeholder/300/150'">
        ${episodeInfo}
        <div class="release-content">
            <h3 class="release-title">${release.title || 'Untitled'}</h3>
            <p class="release-date">
                <span class="material-icons">event</span>
                ${dateDisplay}
            </p>
            <div class="platform-badge">
                ${release.platform || 'Platform TBA'}
            </div>
            <div class="card-actions">
                <button onclick="editRelease('${release.id}')" title="Edit Release">
                    <span class="material-icons">edit</span>
                </button>
                <button onclick="deleteRelease('${release.id}')" class="delete-btn" title="Delete Release">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        </div>
    `;
    return card;
}

function displayReleases() {
    const container = document.getElementById('monthly-sections');
    const emptyState = document.getElementById('empty-state');
    
    if (!container) return;
    
    container.innerHTML = '';
    const releases = getStoredReleases();
    
    if (releases.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    const grouped = groupReleasesByMonth(releases);
    
    Object.entries(grouped)
        .sort(([a], [b]) => {
            const [yearA, monthA] = a.split('-').map(Number);
            const [yearB, monthB] = b.split('-').map(Number);
            return yearA - yearB || monthA - monthB;
        })
        .forEach(([month, releases]) => {
            container.appendChild(createMonthSection(month, releases));
        });
}

// Form handling
function setupPlatformTags() {
    const container = document.querySelector('.preset-tags');
    const selectedPlatform = document.getElementById('custom-platform');
    
    container.addEventListener('click', (e) => {
        const tag = e.target.closest('.platform-tag');
        if (!tag) return;
        
        document.querySelectorAll('.platform-tag').forEach(t => t.classList.remove('selected'));
        tag.classList.add('selected');
        selectedPlatform.value = tag.dataset.platform;
    });
}

function setupContentTypeToggle() {
    const typeInputs = document.querySelectorAll('input[name="content-type"]');
    const seriesInfo = document.querySelector('.series-info');
    
    typeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            seriesInfo.style.display = e.target.value === 'series' ? 'block' : 'none';
        });
    });
}

// JSON Import/Export
function setupJsonHandling() {
    document.getElementById('export-json').addEventListener('click', exportJson);
    document.getElementById('import-json').addEventListener('click', () => {
        document.getElementById('json-import').click();
    });
    
    document.getElementById('json-import').addEventListener('change', importJson);
}

function exportJson() {
    const releases = getStoredReleases();
    const dataStr = JSON.stringify(releases, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `releases-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function importJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const releases = JSON.parse(text);
        
        if (!Array.isArray(releases)) {
            throw new Error('Invalid format: data must be an array');
        }
        
        // Validate each release
        releases.forEach(release => {
            if (!release.id || !release.title || !release.date) {
                throw new Error('Invalid release format');
            }
        });
        
        saveReleases(releases);
        displayReleases();
        event.target.value = ''; // Reset input
        alert('Releases imported successfully!');
    } catch (e) {
        console.error('Import error:', e);
        alert('Error importing releases. Please check the file format.');
    }
}

// Enhanced form handling
function openForm() {
    const form = document.getElementById('release-form-container');
    if (!form) return;
    
    form.classList.add('active');
    
    if (!form.hasAttribute('data-editing')) {
        document.getElementById('form-title').textContent = 'Add Release';
        document.getElementById('release-form').reset();
        // Reset platform tags
        document.querySelectorAll('.platform-tag').forEach(tag => tag.classList.remove('selected'));
        // Reset series info
        document.querySelector('input[value="movie"]').checked = true;
        document.querySelector('.series-info').style.display = 'none';
    }
}

function closeForm() {
    const form = document.getElementById('release-form-container');
    if (!form) return;
    
    form.classList.remove('active');
    form.removeAttribute('data-editing');
    document.getElementById('release-form').reset();
    // Reset all form states
    document.querySelectorAll('.platform-tag').forEach(tag => tag.classList.remove('selected'));
}

// Enhanced CRUD Operations
function saveRelease(event) {
    event.preventDefault();

    const releases = getStoredReleases();
    const form = document.getElementById('release-form-container');
    const editingId = form.getAttribute('data-editing');

    const isFullDate = document.getElementById('release-date').style.display === 'block';
    const releaseDate = isFullDate ? document.getElementById('release-date').value : document.getElementById('release-year').value;

    const newRelease = {
        id: editingId || Date.now().toString(),
        title: document.getElementById('release-title').value,
        date: releaseDate,
        platform: document.getElementById('custom-platform').value,
        backdrop: document.getElementById('backdrop').value,
        isEpisode: document.querySelector('input[name="content-type"]:checked').value === 'series',
        episodeNumber: document.getElementById('episode-number').value || null
    };

    if (editingId) {
        const index = releases.findIndex(r => r.id === editingId);
        if (index !== -1) {
            releases[index] = { ...releases[index], ...newRelease };
        }
    } else {
        releases.push(newRelease);
    }

    saveReleases(releases);
    displayReleases();
    closeForm();
}

function editRelease(id) {
    const releases = getStoredReleases();
    const release = releases.find(r => r.id === id);
    if (!release) return;

    const form = document.getElementById('release-form-container');
    form.setAttribute('data-editing', id);
    document.getElementById('form-title').textContent = 'Edit Release';

    // Populate form fields
    document.getElementById('release-title').value = release.title || '';
    const dateInput = document.getElementById('release-date');
    const tbaButton = dateInput.parentElement.querySelector('.tba-toggle');
    
    if (release.date === null) {
        // Handle TBA case
        tbaButton.classList.add('active');
        dateInput.disabled = true;
        dateInput.value = '';
        dateInput.placeholder = 'To Be Dated';
    } else {
        tbaButton.classList.remove('active');
        dateInput.disabled = false;
        dateInput.value = release.date || '';
        dateInput.placeholder = 'Select release date';
    }

    document.getElementById('custom-platform').value = release.platform || '';
    document.getElementById('backdrop').value = release.backdrop || '';

    // Handle content type
    const contentType = release.isEpisode ? 'series' : 'movie';
    document.querySelector(`input[name="content-type"][value="${contentType}"]`).checked = true;
    
    const seriesInfo = document.querySelector('.series-info');
    seriesInfo.style.display = release.isEpisode ? 'block' : 'none';

    if (release.isEpisode && document.getElementById('episode-number')) {
        document.getElementById('episode-number').value = release.episodeNumber || '';
    }

    openForm();
}

function deleteRelease(id) {
    if (!confirm('Are you sure you want to delete this release?')) return;

    const releases = getStoredReleases().filter(release => release.id !== id);
    saveReleases(releases);
    displayReleases();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    displayReleases();
    setupPlatformTags();
    setupContentTypeToggle();
    setupJsonHandling();
    setupDateInput();
    
    // Add form submit handler
    const form = document.getElementById('release-form');
    if (form) {
        form.addEventListener('submit', saveRelease);
    }
});

function setupDateInput() {
    const dateInput = document.getElementById('release-date');
    const dateContainer = dateInput.parentElement;
    
    // Create TBA toggle button
    const tbaButton = document.createElement('button');
    tbaButton.type = 'button'; // Prevent form submission
    tbaButton.className = 'tba-toggle';
    tbaButton.textContent = 'TBA';
    dateContainer.appendChild(tbaButton);
    
    // TBA toggle functionality
    let isTBA = false;
    
    tbaButton.addEventListener('click', (e) => {
        e.preventDefault();
        isTBA = !isTBA;
        tbaButton.classList.toggle('active');
        dateInput.disabled = isTBA;
        dateInput.value = '';
        
        if (isTBA) {
            dateInput.placeholder = 'To Be Announced';
        } else {
            dateInput.placeholder = 'Select release date';
        }
    });
}

function toggleDateType() {
    const dateInput = document.getElementById('release-date');
    const yearInput = document.getElementById('release-year');
    const toggleButton = document.querySelector('.toggle-date');

    if (dateInput.style.display === 'none') {
        dateInput.style.display = 'block';
        yearInput.style.display = 'none';
        toggleButton.textContent = 'Year Only';
    } else {
        dateInput.style.display = 'none';
        yearInput.style.display = 'block';
        toggleButton.textContent = 'Full Date';
    }
}