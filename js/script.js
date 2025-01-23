// Constants
const STORAGE_KEY = 'justhype_releases';
const TYPES = ['movie', 'series', 'music', 'game', 'podcast', 'event'];

// Get Saved Data
function getStoredReleases() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
        console.error('Error loading releases:', e);
        return [];
    }
}

// Save Data
function saveReleases(releases) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(releases));
    } catch (e) {
        console.error('Error saving releases:', e);
        alert('Error saving data. Check console for details.');
    }
}

// Group Releases by Month
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
            if (!a.date) return 1;  
            if (!b.date) return -1;
            return new Date(a.date) - new Date(b.date);
        });
    }

    return grouped;
}

// Create Month Section
function createMonthSection(monthKey, releases) {
    const section = document.createElement('div');
    section.className = 'month-section';
    
    let monthName;
    if (monthKey === 'TBA') {
        monthName = 'To Be Announced';
    } else {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, month);
        monthName = date.toLocaleString('default', { month: 'long', year: 'numeric'});
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

// Create Release Cards
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

    // Show episode badge if it's an episode   
    const episodeInfo = release.isEpisode && release.season ? 
        `<div class="episode-badge">S${release.season}${release.episode ? ` E${release.episode}` : ''}</div>` : '';
        
    // Show auto-release button for series only
    const autoReleaseButton = release.isEpisode ? `
        <button onclick="openAutoReleasePopup('${release.id}')" title="Auto-Release Episodes">
            <i class='bx bx-calendar-plus'></i>Add Episodes
        </button>` : '';

    const platformBadge = release.platform || 'Platform TBA';

    card.innerHTML = `
        <img class="release-backdrop" src="${release.backdrop || 'img/placeholder_backdrop.png'}" 
             alt="Backdrop" onerror="this.src='img/placeholder_backdrop.png'">
        ${episodeInfo}
        <div class="release-content">
            <h3 class="release-title">${release.title || 'Untitled'}</h3>
            <p class="release-date">
                <i class='bx bx-calendar-event'></i>
                ${dateDisplay}
            </p>
            <div class="platform-badge">
                ${platformBadge}
            </div>
            <div class="card-actions">
                <button onclick="editRelease('${release.id}')" title="Edit Release">
                    <i class='bx bx-edit'></i>
                </button>
                ${autoReleaseButton}
                <button onclick="deleteRelease('${release.id}')" class="delete-btn" title="Delete Release">
                    <i class='bx bx-trash-alt'></i>
                </button>
            </div>
        </div>
    `;
    return card;
}

// Display Release Cards
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

// Adding and Editing Form Open/Close
function openForm() {
    const form = document.getElementById('release-form-container');
    if (!form) return;
    form.classList.add('active');

    const editingId = form.getAttribute('data-editing');
    if (editingId) {
        document.getElementById('form-title').textContent = 'Edit Release';
    } else {
        document.getElementById('form-title').textContent = 'Add Release';
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

    // Reset TBA state
    const dateInput = document.getElementById('release-date');
    const tbaButton = dateInput?.parentElement.querySelector('.tba-toggle');
    if (tbaButton) {
        tbaButton.classList.remove('active');
        dateInput.disabled = false;
    }

    // Hide series info section when closing the form
    const seriesInfo = document.querySelector('.series-info');
    if (seriesInfo) {
        seriesInfo.style.display = 'none';
    }
}

// Form Handling Functions
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

// Setup Platform Tags
function setupPlatformTags() {
    const movieAndSeriesPlatform = ['Theaters', 'Netflix', 'Prime Video', 'Disney+', 'Max', 'Hulu', 'Apple TV+', 'Paramount+', 'Peacock', 'Youtube', 'Other'];
    const musicPlatform = ['All','Spotify', 'Apple Music', 'YouTube Music', 'Tidal', 'Deezer', 'Amazon Music', 'Pandora', 'Soundcloud', 'Bandcamp', 'Other'];
    const gamePlatform = ['All','PlayStation', 'Xbox', 'Nintendo', 'Steam', 'Epic Games', 'Other'];
    const podcastPlatform = ['All','Spotify', 'Apple Podcasts', 'Google Podcasts', 'Amazon Music', 'Stitcher', 'TuneIn', 'iHeartRadio', 'Deezer', 'Podbean', 'Other'];
    const eventPlatform = ['Online', 'In-Person', 'YouTube', 'Twitch', 'Discord'];

    const platformOptions = document.getElementById('platform-options');
    const typeInputs = document.querySelectorAll('input[name="content-type"]');

    function updatePlatformOptions(contentType) {
        platformOptions.innerHTML = '';

        let platforms = [];
        switch (contentType) {
            case 'movie':
            case 'series':
                platforms = movieAndSeriesPlatform;
                break;
            case 'music':
                platforms = musicPlatform;
                break;
            case 'game':
                platforms = gamePlatform;
                break;
            case 'podcast':
                platforms = podcastPlatform;
                break;
            case 'event':
                platforms = eventPlatform;
                break;
        }

        platforms.forEach(platform => {
            const tag = document.createElement('div');
            tag.className = 'platform-tag';
            tag.textContent = platform;
            tag.addEventListener('click', () => selectPlatform(platform));
            platformOptions.appendChild(tag);
        });
    }

    typeInputs.forEach(input => {
        input.addEventListener('change', () => {
            updatePlatformOptions(input.value);
        });
    });

    // Initialize with the first content type selected
    const initialType = document.querySelector('input[name="content-type"]:checked');
    if (initialType) {
        updatePlatformOptions(initialType.value);
    }
}

// Setup Content Type Toggle
function setupContentTypeToggle() {
    const typeInputs = document.querySelectorAll('input[name="content-type"]');
    const seriesInfo = document.querySelector('.series-info');
    const platformBadge = document.querySelector('.platform-badge');

    typeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (seriesInfo) {
                seriesInfo.style.display = e.target.value === 'series' ? 'block' : 'none';
            }
            if (platformBadge) {
                platformBadge.style.display = ['music', 'game', 'podcast', 'event'].includes(e.target.value) ? 'none' : 'block';
            }
        });
    });
}

// Setup Date Input
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

// Save Release Function
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
        platform: document.getElementById('custom-platform').value || null,
        backdrop: document.getElementById('backdrop').value,
        isMovie: document.querySelector('input[name="content-type"]:checked')?.value === 'movie',
        isEpisode: document.querySelector('input[name="content-type"]:checked')?.value === 'series',
        isMusic: document.querySelector('input[name="content-type"]:checked')?.value === 'music',
        isGame: document.querySelector('input[name="content-type"]:checked')?.value === 'game',
        isPodcast: document.querySelector('input[name="content-type"]:checked')?.value === 'podcast',
        isEvent: document.querySelector('input[name="content-type"]:checked')?.value === 'event',
        season: document.getElementById('season-number')?.value || null,
        episode: document.getElementById('episode-number')?.value || null
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

    // Hide platform badge if not a movie or series
    const platformBadge = document.querySelector('.platform-badge');
    if (platformBadge && !['movie', 'series'].includes(newRelease.isMovie ? 'movie' : 'series')) {
        platformBadge.style.display = 'none';
    }

    closeForm();
}

// Edit Release Function
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

    const seasonNumber = document.getElementById('season-number');
    const episodeNumber = document.getElementById('episode-number');
    
    if (release.isEpisode) {
        seasonNumber.value = release.season || '';
        episodeNumber.value = release.episode || '';
    } else {
        seasonNumber.value = '';
        episodeNumber.value = '';
    }    

    openForm();
}

// Delete Release Function
function deleteRelease(id) {
    if (!confirm('Are you sure you want to delete this release?')) return;

    const releases = getStoredReleases().filter(release => release.id !== id);
    saveReleases(releases);
    displayReleases();
}

// JSON Handling Functions
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

// JSON Export Function
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

// JSON Import Function
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
                   (release.season && typeof release.season !== 'string') ||
                   (release.episode && typeof release.episode !== 'string');
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

// Custom Platform Dropdown
function togglePlatformDropdown() {
    const dropdown = document.getElementById("platform-options");
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
}

// Select Platform
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

// Auto-Release Episodes Popup Opening
function openAutoReleasePopup(seriesId) {
    const popup = document.getElementById('auto-release-popup');
    popup.style.display = 'flex';
    popup.setAttribute('data-series-id', seriesId);
}

// Auto-Release Episodes Popup Closing
function closeAutoReleasePopup() {
    const popup = document.getElementById('auto-release-popup');
    popup.style.display = 'none';
    document.getElementById('auto-release-form').reset();
}

// Auto-Release Episodes Form Submission
document.getElementById('auto-release-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const seriesId = document.getElementById('auto-release-popup').getAttribute('data-series-id');
    const totalEpisodes = parseInt(document.getElementById('total-episodes').value, 10);
    const frequency = document.getElementById('release-frequency').value;

    autoReleaseEpisodes(seriesId, totalEpisodes, frequency);
    closeAutoReleasePopup();
});

// Auto-Release Episodes Function
function autoReleaseEpisodes(seriesId, totalEpisodes, frequency) {
    const releases = getStoredReleases();
    const seriesRelease = releases.find(r => r.id === seriesId);
    if (!seriesRelease || !seriesRelease.date) return;

    const releaseDate = new Date(seriesRelease.date);
    const newEpisodes = [];

    // Start from episode 1 if the episode is currently null
    let existingEpisodes = seriesRelease.episode === null ? 1 : parseInt(seriesRelease.episode) || 1;
    let lastEpisode = existingEpisodes + 1;

    if (existingEpisodes > totalEpisodes) {
        alert('All episodes have already been released.');
        return;
    }

    // If frequency is daily or weekly, proceed with regular episode release
    for (let i = lastEpisode; i <= totalEpisodes; i++) {
        let n = i.toString();
        const newRelease = { ...seriesRelease, episode: n, id: `${seriesId}-E${i}` };

        if (frequency === 'daily') {
            releaseDate.setDate(releaseDate.getDate() + 1);
        } else if (frequency === 'weekly') {
            releaseDate.setDate(releaseDate.getDate() + 7);
        }

        newRelease.date = releaseDate.toISOString().split('T')[0];
        newEpisodes.push(newRelease);
    }

    alert(`Auto-releasing ${newEpisodes.length} episodes for ${seriesRelease.title}`);
    saveReleases([...releases, ...newEpisodes]);
    displayReleases();
}

// Settings Dropdown
document.getElementById('settings').addEventListener('click', function() {
    const dropdown = document.getElementById('dropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
});

// Remove All Releases Button Logic
function removeAllReleases() {
    if (confirm('Are you sure you want to delete all releases?')) {
        saveReleases([]);
        displayReleases();
    }
}