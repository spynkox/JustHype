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
            return new Date(a.date) - new Date(b.date);
        });
    }

    return grouped;
}

// UI Functions
function createMonthSection(monthKey, releases) {
    const section = document.createElement('div');
    section.className = 'month-section';
    
    let monthName;
    if (monthKey === 'TBA') {
        monthName = 'To Be Announced';
    } else {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, month);
        monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

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
        `<div class="episode-badge">${release.episodeNumber}</div>` : '';

    card.innerHTML = `
        <img class="release-backdrop" src="${release.backdrop || 'img/placeholder_backdrop.png'}" 
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
            if (a === 'TBA') return 1;
            if (b === 'TBA') return -1;
            const [yearA, monthA] = a.split('-').map(Number);
            const [yearB, monthB] = b.split('-').map(Number);
            return yearA - yearB || monthA - monthB;
        })
        .forEach(([month, releases]) => {
            container.appendChild(createMonthSection(month, releases));
        });
}

// Form Functions
function openForm() {
    const form = document.getElementById('release-form-container');
    if (!form) return;
    form.classList.add('active');
}

function closeForm() {
    const form = document.getElementById('release-form-container');
    if (!form) return;

    form.classList.remove('active');
    form.removeAttribute('data-editing');
    document.getElementById('release-form').reset();

    // Reset all form states
    document.querySelectorAll('.platform-tag').forEach(tag => tag.classList.remove('selected'));

    // Reset TBA state
    const dateInput = document.getElementById('release-date');
    const tbaButton = dateInput?.parentElement.querySelector('.tba-toggle');
    if (tbaButton) {
        tbaButton.classList.remove('active');
        dateInput.disabled = false;
        dateInput.placeholder = 'Select release date';
    }

    // Hide series info section when closing the form
    const seriesInfo = document.querySelector('.series-info');
    if (seriesInfo) {
        seriesInfo.style.display = 'none';
    }
}

function initializeFormHandlers() {
    // Add button handlers
    const addButtons = document.querySelectorAll('[title="Add Release"], [title="Add First Release"]');
    addButtons.forEach(button => {
        button.addEventListener('click', () => {
            const form = document.getElementById('release-form-container');
            form.removeAttribute('data-editing');
            document.getElementById('form-title').textContent = 'Add Release';
            document.getElementById('release-form').reset();
            openForm();
        });
    });

    // Close button handler
    const closeButton = document.querySelector('.form-header .close-button');
    if (closeButton) {
        closeButton.addEventListener('click', closeForm);
    }

    // Form submit handler
    const form = document.getElementById('release-form');
    if (form) {
        form.addEventListener('submit', saveRelease);
    }

    // Platform tags handler
    setupPlatformTags();

    // Content type toggle handler
    setupContentTypeToggle();
}

// Form Related Setup Functions
function setupPlatformTags() {
    const container = document.querySelector('.preset-tags');
    if (!container) return;

    container.addEventListener('click', (e) => {
        // Trova il button.platform-tag più vicino
        const platformButton = e.target.closest('.platform-tag');
        if (!platformButton) return;

        // Rimuovi la classe selected da tutti i buttons
        container.querySelectorAll('.platform-tag').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Aggiungi la classe selected al button cliccato
        platformButton.classList.add('selected');

        // Prendi il valore della piattaforma dal data-attribute
        const platformValue = platformButton.dataset.platform;

        // Aggiorna il valore dell'input
        const platformInput = document.getElementById('custom-platform');
        if (platformInput) {
            platformInput.value = platformValue;
        }
    });
}

function setupContentTypeToggle() {
    const typeInputs = document.querySelectorAll('input[name="content-type"]');
    const seriesInfo = document.querySelector('.series-info');
    
    typeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (seriesInfo) {
                seriesInfo.style.display = e.target.value === 'series' ? 'block' : 'none';
            }
        });
    });
}

function setupDateInput() {
    const dateInput = document.getElementById('release-date');
    if (!dateInput) return;

    const dateContainer = dateInput.parentElement;
    
    // Create TBA toggle button if it doesn't exist
    let tbaButton = dateContainer.querySelector('.tba-toggle');
    if (!tbaButton) {
        tbaButton = document.createElement('button');
        tbaButton.type = 'button';
        tbaButton.className = 'tba-toggle';
        tbaButton.textContent = 'TBA';
        dateContainer.appendChild(tbaButton);
    }
    
    // TBA toggle functionality
    tbaButton.addEventListener('click', (e) => {
        e.preventDefault();
        tbaButton.classList.toggle('active');
        dateInput.disabled = tbaButton.classList.contains('active');
        dateInput.value = '';
        
        if (dateInput.disabled) {
            dateInput.placeholder = 'To Be Announced';
        } else {
            dateInput.placeholder = 'Select release date';
        }
    });
}

// CRUD Operations
function saveRelease(event) {
    event.preventDefault();

    const form = document.getElementById('release-form-container');
    const releases = getStoredReleases();
    const editingId = form.getAttribute('data-editing');

    const dateInput = document.getElementById('release-date');
    const tbaButton = dateInput?.parentElement.querySelector('.tba-toggle');
    const isTBA = tbaButton?.classList.contains('active');

    const newRelease = {
        id: editingId || Date.now().toString(),
        title: document.getElementById('release-title').value,
        date: isTBA ? null : dateInput.value,
        platform: document.getElementById('custom-platform').value,
        backdrop: document.getElementById('backdrop').value,
        isEpisode: document.querySelector('input[name="content-type"]:checked')?.value === 'series',
        episodeNumber: document.getElementById('episode-number')?.value || null
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

    // Hide series info section if not a series
    const seriesInfo = document.querySelector('.series-info');
    if (seriesInfo && !newRelease.isEpisode) {
        seriesInfo.style.display = 'none';
    }

    closeForm();
}

function editRelease(id) {
    const releases = getStoredReleases();
    const release = releases.find(r => r.id === id);
    if (!release) return;

    const form = document.getElementById('release-form-container');
    form.setAttribute('data-editing', id);
    document.getElementById('form-title').textContent = 'Edit Release';

    // Reset form first
    document.getElementById('release-form').reset();

    // Populate form fields
    document.getElementById('release-title').value = release.title || '';
    const dateInput = document.getElementById('release-date');
    const tbaButton = dateInput?.parentElement.querySelector('.tba-toggle');
    
    if (release.date === null) {
        tbaButton?.classList.add('active');
        dateInput.disabled = true;
        dateInput.value = '';
        dateInput.placeholder = 'To Be Announced';
    } else {
        tbaButton?.classList.remove('active');
        dateInput.disabled = false;
        dateInput.value = release.date || '';
    }

    document.getElementById('custom-platform').value = release.platform || '';
    document.getElementById('backdrop').value = release.backdrop || '';

    const contentTypeInput = document.querySelector(`input[name="content-type"][value="${release.isEpisode ? 'series' : 'movie'}"]`);
    if (contentTypeInput) {
        contentTypeInput.checked = true;
        
        const seriesInfo = document.querySelector('.series-info');
        if (seriesInfo) {
            seriesInfo.style.display = release.isEpisode ? 'block' : 'none';
        }
    }

    const episodeNumber = document.getElementById('episode-number');
    if (episodeNumber && release.isEpisode) {
        episodeNumber.value = release.episodeNumber || '';
    }

    openForm();
}

function deleteRelease(id) {
    if (!confirm('Are you sure you want to delete this release?')) return;

    const releases = getStoredReleases().filter(release => release.id !== id);
    saveReleases(releases);
    displayReleases();
}

// JSON Import/Export Functions
function setupJsonHandling() {
    const exportBtn = document.getElementById('export-json');
    const importBtn = document.getElementById('import-json');
    const fileInput = document.getElementById('json-import');

    if (exportBtn) {
        exportBtn.addEventListener('click', exportJson);
    }
    
    if (importBtn && fileInput) {
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', importJson);
    }
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
        
        // Enhanced validation
        const invalidReleases = releases.filter(release => {
            return !release || typeof release !== 'object' ||
                   !release.id || typeof release.id !== 'string' ||
                   !release.title || typeof release.title !== 'string' ||
                   (release.date !== null && release.date !== undefined && typeof release.date !== 'string') ||
                   (release.platform && typeof release.platform !== 'string') ||
                   (release.backdrop && typeof release.backdrop !== 'string') ||
                   (release.isEpisode && typeof release.isEpisode !== 'boolean') ||
                   (release.episodeNumber && typeof release.episodeNumber !== 'string');
        });

        if (invalidReleases.length > 0) {
            throw new Error(`Invalid release format: ${invalidReleases.length} releases failed validation`);
        }
        
        saveReleases(releases);
        displayReleases();
        event.target.value = ''; // Reset input
        alert('Releases imported successfully!');
    } catch (e) {
        console.error('Import error:', e);
        alert(`Import error: ${e.message}`);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    displayReleases();
    initializeFormHandlers();
    setupDateInput();
    setupJsonHandling();
});

function togglePlatformDropdown() {
    const dropdown = document.getElementById("platform-options");
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
}

function selectPlatform(name) {
    const input = document.getElementById("custom-platform");
    input.value = name;

    // Hide the dropdown after selection
    togglePlatformDropdown();
}

// Close dropdown if clicked outside or when a platform is selected
document.addEventListener("click", function(event) {
    const dropdown = document.getElementById("platform-options");
    const input = document.getElementById("custom-platform");
    if (!input.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = "none";
    } else if (dropdown.contains(event.target)) {
        dropdown.style.display = "none";
    }
});
