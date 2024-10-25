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
        const date = new Date(release.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(release);
        return groups;
    }, {});

    // Ordina per ogni mese in base alla data
    for (const month in grouped) {
        grouped[month].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return grouped;
}


// UI Functions
function createMonthSection(monthKey, releases) {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month);
    const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
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

    const dateDisplay = release.date ? 
        new Date(release.date).toLocaleDateString('default', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'TBA';

    const episodeInfo = release.isEpisode ? 
        `<div class="episode-badge">${release.episodeNumber}</div>` : ''; // Removed episode title

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

    const isEpisode = document.querySelector('input[name="content-type"]:checked').value === 'series';

    // Define new release data without episodeTitle
    const newRelease = {
        id: editingId || Date.now().toString(),
        title: document.getElementById('release-title').value,
        date: document.getElementById('release-date').value,
        platform: document.getElementById('custom-platform').value,
        backdrop: document.getElementById('backdrop').value,
        isEpisode: isEpisode,
        episodeNumber: isEpisode ? document.getElementById('episode-number').value : null,
        // No episodeTitle
    };

    if (editingId) {
        // Edit existing release
        const index = releases.findIndex(r => r.id === editingId);
        if (index !== -1) {
            releases[index] = { ...releases[index], ...newRelease };
        }
    } else {
        // Add new release
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

    // Populate form fields without episodeTitle
    document.getElementById('release-title').value = release.title || '';
    document.getElementById('release-date').value = release.date || '';
    document.getElementById('custom-platform').value = release.platform || '';
    document.getElementById('backdrop').value = release.backdrop || '';

    // Handle series/movie toggle
    const contentType = release.isEpisode ? 'series' : 'movie';
    document.querySelector(`input[name="content-type"][value="${contentType}"]`).checked = true;
    
    const seriesInfo = document.querySelector('.series-info');
    seriesInfo.style.display = release.isEpisode ? 'block' : 'none';

    if (release.isEpisode) {
        document.getElementById('episode-number').value = release.episodeNumber || '';
        // No longer setting episode title
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
    
    // Add form submit handler
    const form = document.getElementById('release-form');
    if (form) {
        form.addEventListener('submit', saveRelease);
    }
});