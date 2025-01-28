//MESSY CODE
// Constants
const STORAGE_KEY = 'justhype_releases';
const TYPES = ['movie', 'series', 'music', 'game', 'podcast', 'event'];

// Get Saved Data
function getStoredReleases() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; // Get data from local storage
    } catch (e) {
        console.error('Error loading releases:', e); // Log error
        return [];
    }
}

// Save Data
function saveReleases(releases) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(releases)); // Save data to local storage
    } catch (e) {
        console.error('Error saving releases:', e); // Log error
        alert('Error saving data. Check console for details.'); // Show alert
    }
}

// Group Releases by Month
function groupReleasesByMonth(releases) {
    const grouped = releases.reduce((groups, release) => { // Reduce releases to groups
        let key; // Initialize key variable
        if (!release.date) { // Check if date is not available
            key = 'TBA'; // Set key to TBA
        } else { // If date is available
            const date = new Date(release.date); // Create date object
            key = `${date.getFullYear()}-${date.getMonth()}`; // Set key to year-month
        }

        if (!groups[key]) { // Check if key doesn't exist in groups
            groups[key] = []; // Initialize key in groups
        }
        groups[key].push(release); // Push release to the key
        return groups; // Return groups
    }, {});

    // Sort releases within each month
    for (const month in grouped) { // Loop through each month
        grouped[month].sort((a, b) => { // Sort releases
            if (!a.date) return 1;   // Sort by date
            if (!b.date) return -1; // Sort by date
            return new Date(a.date) - new Date(b.date); // Sort by date
        });
    }

    return grouped; // Return grouped releases
}

// Create Month Section
function createMonthSection(monthKey, releases) {
    const section = document.createElement('div'); // Create section element
    section.className = 'month-section'; // Add class to section
    
    let monthName; // Initialize month name variable
    if (monthKey === 'TBA') { // Check if month is TBA
        monthName = 'To Be Announced'; // Set month name to TBA
    } else {
        const [year, month] = monthKey.split('-'); // Split year and month
        const date = new Date(year, month); // Create date object
        monthName = date.toLocaleString('default', { month: 'long', year: 'numeric'}); // Get month name
    }

    // Set section content
    section.innerHTML = ` 
        <h2 class="month-header">${monthName}</h2>
        <div class="releases-scroll"></div>
    `;
    
    const scrollContainer = section.querySelector('.releases-scroll'); // Get scroll container
    releases.forEach(release => { // Loop through each release
        scrollContainer.appendChild(createReleaseCard(release)); // Append release card
    });
    
    return section; // Return section element
}

// Create Release Cards
function createReleaseCard(release) {
    const card = document.createElement('div'); // Create card element
    card.className = 'release-card'; // Add class to card
    card.dataset.id = release.id; // Set data attribute for ID

    // Format date for display
    const dateDisplay = release.date ?
        new Date(release.date).toLocaleDateString('default', { 
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'TBA';

    // Show episode badge if it's an episode   
    const episodeInfo = release.isSeries && release.season ? 
        `<div class="episode-badge">S${release.season}${release.episode ? ` E${release.episode}` : ''}</div>` : '';
        
    // Show auto-release button for series only
    const autoReleaseButton = release.isSeries ? ` 
        <button onclick="openAutoReleasePopup('${release.id}')" title="Auto-Release Episodes">
            <i class='bx bx-calendar-plus'></i>Add Episodes
        </button>` : '';

    const platformBadge = release.platform || 'Platform TBA'; // Platform badge text

    // Create card content
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
    const container = document.getElementById('monthly-sections'); // Get container element
    const emptyState = document.getElementById('empty-state'); // Get empty state element
    
    if (!container) return; // Exit if container doesn't exist
    
    container.innerHTML = ''; // Clear container
    const releases = getStoredReleases(); // Get all releases
    
    if (releases.length === 0) { // Check if there are no releases
        emptyState.style.display = 'block'; // Show empty state
        return;
    }
    
    emptyState.style.display = 'none'; // Hide empty state
    const grouped = groupReleasesByMonth(releases); // Group releases by month
    
    Object.entries(grouped) // Loop through each month
        .sort(([a], [b]) => { // Sort by year and month
            if (a === 'TBA') return 1; // Sort TBA to the end
            if (b === 'TBA') return -1; // Sort TBA to the end
            const [yearA, monthA] = a.split('-').map(Number); // Split year and month
            const [yearB, monthB] = b.split('-').map(Number); // Split year and month
            return yearA - yearB || monthA - monthB; // Sort by year and month
        })
        .forEach(([month, releases]) => { // Loop through each month
            container.appendChild(createMonthSection(month, releases)); // Append month section
        });
}

// Adding and Editing Form Open/Close
function openForm() {
    const form = document.getElementById('release-form-container'); // Get form container
    if (!form) return; // Exit if form doesn't exist
    form.classList.add('active'); // Add active class

    const editingId = form.getAttribute('data-editing'); // Get editing ID
    if (editingId) { // Check if editing ID exists
        document.getElementById('form-title').textContent = 'Edit Release'; // Change form title
    } else { 
        document.getElementById('form-title').textContent = 'Add Release'; // Change form title
    }
}

function closeForm() {
    const form = document.getElementById('release-form-container'); // Get form container
    if (!form) return; // Exit if form doesn't exist

    form.classList.remove('active'); // Remove active class
    form.removeAttribute('data-editing'); // Remove editing attribute
    document.getElementById('release-form').reset(); // Reset form fields

    document.querySelectorAll('.platform-tag').forEach(tag => tag.classList.remove('selected')); // Reset platform tags

    const dateInput = document.getElementById('release-date'); // Get date input field
    const tbaButton = dateInput?.parentElement.querySelector('.tba-toggle'); // Get TBA button
    if (tbaButton) { // Check if TBA button exists
        tbaButton.classList.remove('active'); // Remove active class
        dateInput.disabled = false; // Enable date input
    }

    const seriesInfo = document.querySelector('.series-info'); // Get series info section
    if (seriesInfo) { // Check if series info section exists
        seriesInfo.style.display = 'none'; // Hide series info section
    }
}

// Form Handling Functions
function initializeFormHandlers() {
    const addButtons = document.querySelectorAll('[title="Add Release"], [title="Add First Release"]'); // Get add buttons
    addButtons.forEach(button => { // Loop through each add button
        button.addEventListener('click', () => { // Add click event listener
            const form = document.getElementById('release-form-container'); // Get form container
            form.removeAttribute('data-editing'); // Remove editing attribute
            document.getElementById('form-title').textContent = 'Add Release'; // Change form title
            document.getElementById('release-form').reset(); // Reset form fields
            openForm(); // Open the form
        });
    });

    const closeButton = document.querySelector('.form-header .close-button'); // Get close button
    if (closeButton) { // Check if close button exists
        closeButton.addEventListener('click', closeForm); // Add click event listener
    }

    const form = document.getElementById('release-form'); // Get form element
    if (form) { // Check if form exists
        form.addEventListener('submit', saveRelease); // Add submit event listener
    }

    setupPlatformTags(); // Platform tags setup
    setupContentTypeToggle(); // Content type toggle setup
}

// Setup Platform Tags
function setupPlatformTags() {
    // Platform options for each content type
    const moviePlatform = ['Theaters', 'Netflix', 'Prime Video', 'Disney+', 'Max', 'Hulu', 'Apple TV+', 'Paramount+', 'Peacock', 'Youtube', 'Other'];
    const seriesPlatform = ['Netflix', 'Prime Video', 'Disney+', 'Max', 'Hulu', 'Apple TV+', 'Paramount+', 'Peacock', 'Youtube', 'Other'];
    const musicPlatform = ['All','Spotify', 'Apple Music', 'YouTube Music', 'Tidal', 'Deezer', 'Amazon Music', 'Pandora', 'Soundcloud', 'Bandcamp', 'Other'];
    const gamePlatform = ['All','PlayStation', 'Xbox', 'Nintendo', 'Steam', 'Epic Games', 'Other'];
    const podcastPlatform = ['All','Spotify', 'Apple Podcasts', 'Google Podcasts', 'Amazon Music', 'Stitcher', 'TuneIn', 'iHeartRadio', 'Deezer', 'Podbean', 'Other'];
    const eventPlatform = ['Online', 'In-Person', 'YouTube', 'Twitch', 'Discord'];

    const platformOptions = document.getElementById('platform-options'); // Platform options container
    const typeInputs = document.querySelectorAll('input[name="content-type"]'); // Content type inputs

    function updatePlatformOptions(contentType) { // Update platform options based on content type
        platformOptions.innerHTML = ''; // Clear platform options
 
        let platforms = []; // Initialize platforms array
        switch (contentType) { // Check content type
            case 'movie':  // If movie
                platforms = moviePlatform; // Set platforms
                break;
            case 'series': // If series
                platforms = seriesPlatform;  // Set platforms
                break; 
            case 'music': // If music
                platforms = musicPlatform; // Set platforms
                break;
            case 'game': // If game
                platforms = gamePlatform; // Set platforms
                break;
            case 'podcast': // If podcast
                platforms = podcastPlatform; // Set platforms
                break; 
            case 'event': // If event
                platforms = eventPlatform; // Set platforms
                break;
        }

        // creates options dropdown
        platforms.forEach(platform => { // Loop through each platform
            const tag = document.createElement('div'); // Create tag element
            tag.className = 'platform-tag'; // Add class to tag
            tag.textContent = platform; // Set text content
            tag.addEventListener('click', () => selectPlatform(platform)); // Add click event listener
            platformOptions.appendChild(tag); // Append tag to platform options
        });
    }

    typeInputs.forEach(input => { // Loop through each content type input
        input.addEventListener('change', () => { // Add change event listener
            updatePlatformOptions(input.value); // Update platform options
            selectPlatform(''); // Reset platform selection
            togglePlatformDropdown(); // Toggle platform dropdown
        });
    });

    const initialType = document.querySelector('input[name="content-type"]:checked'); // Get initial content type
    if (initialType) { // Check if initial content type exists 
        updatePlatformOptions(initialType.value); // Update platform options
    }
}

// Setup Content Type Toggle
function setupContentTypeToggle() {
    const typeInputs = document.querySelectorAll('input[name="content-type"]'); // Get content type inputs
    const seriesInfo = document.querySelector('.series-info'); // Get series info section
    const platformBadge = document.querySelector('.platform-badge'); // Get platform badge

    typeInputs.forEach(input => { // Loop through each content type input
        input.addEventListener('change', (e) => { // Add change event listener
            if (seriesInfo) { // Check if series info section exists
                seriesInfo.style.display = e.target.value === 'series' ? 'block' : 'none'; // Show/hide series info section
            }
            if (platformBadge) { // Check if platform badge exists
                platformBadge.style.display = ['music', 'game', 'podcast', 'event'].includes(e.target.value) ? 'none' : 'block'; // Show/hide platform badge
            }
        });
    });
}

// Setup Date Input
function setupDateInput() {
    const dateInput = document.getElementById('release-date'); // Get date input field
    if (!dateInput) return; // Exit if date input doesn't exist

    const dateContainer = dateInput.parentElement; // Get date input container
    
    // Create TBA toggle button if it doesn't exist
    let tbaButton = dateContainer.querySelector('.tba-toggle'); // Get TBA button
    if (!tbaButton) { // Check if TBA button doesn't exist
        tbaButton = document.createElement('button'); // Create TBA button
        tbaButton.type = 'button'; // Set button type
        tbaButton.className = 'tba-toggle'; // Add class to button
        tbaButton.textContent = 'TBA'; // Set button text
        dateContainer.appendChild(tbaButton); // Append button to date container
    }
    
    // TBA toggle functionality
    tbaButton.addEventListener('click', (e) => { // Add click event listener
        e.preventDefault(); // Prevent default action
        tbaButton.classList.toggle('active'); // Toggle active class
        dateInput.disabled = tbaButton.classList.contains('active'); // Disable date input
        dateInput.value = ''; // Clear date input
        
        if (dateInput.disabled) { // Check if date input is disabled
            dateInput.display = 'none'; // Hide date input
        } else {
            dateInput.display = 'block'; // Show date input
        }
    });
}

// Save Release Function
function saveRelease(event) {
    event.preventDefault(); // Prevent default form submission

    const form = document.getElementById('release-form-container'); // Get form container
    const releases = getStoredReleases(); // Get all releases
    const editingId = form.getAttribute('data-editing'); // Get editing ID

    const dateInput = document.getElementById('release-date'); // Get date input field
    const tbaButton = dateInput?.parentElement.querySelector('.tba-toggle'); // Get TBA button
    const isTBA = tbaButton?.classList.contains('active'); // Check if date is TBA

    const newRelease = { // Create new release object
        id: editingId || Date.now().toString(), // Set ID
        title: document.getElementById('release-title').value, // Get title
        date: isTBA ? null : dateInput.value, // Get date
        platform: document.getElementById('custom-platform').value || null, // Get platform
        backdrop: document.getElementById('backdrop').value, // Get backdrop
        isMovie: document.querySelector('input[name="content-type"]:checked')?.value === 'movie', // Get content type
        isSeries: document.querySelector('input[name="content-type"]:checked')?.value === 'series', // Get content type
        isMusic: document.querySelector('input[name="content-type"]:checked')?.value === 'music', // Get content type
        isGame: document.querySelector('input[name="content-type"]:checked')?.value === 'game', // Get content type
        isPodcast: document.querySelector('input[name="content-type"]:checked')?.value === 'podcast', // Get content type
        isEvent: document.querySelector('input[name="content-type"]:checked')?.value === 'event', // Get content type
        season: document.getElementById('season-number')?.value || null, // Get season number
        episode: document.getElementById('episode-number')?.value || null // Get episode number
    };

    if (editingId) { // Check if editing ID exists
        const index = releases.findIndex(r => r.id === editingId); // Find release index
        if (index !== -1) { // Check if release index exists
            releases[index] = { ...releases[index], ...newRelease }; // Update release
        }
    } else {
        releases.push(newRelease); // Add new release
    }

    saveReleases(releases); // Save releases
    displayReleases(); // Display releases 

    const seriesInfo = document.querySelector('.series-info'); // Get series info section
    if (seriesInfo && !newRelease.isSeries) { // Check if series info section exists and it's not an episode
        seriesInfo.style.display = 'none'; // Hide series info section
    }

    closeForm(); // Close the form
}

// Edit Release Function
function editRelease(id) {
    const releases = getStoredReleases(); // Get all releases
    const release = releases.find(r => r.id === id); // Find the release to edit
    if (!release) return; // Exit if release not found

    const form = document.getElementById('release-form-container'); // Get the form container
    form.setAttribute('data-editing', id); // Set the editing ID
    document.getElementById('form-title').textContent = 'Edit Release'; // Change form title

    document.getElementById('release-form').reset(); // Reset form first

    // Set content type and show/hide series info section
    const contentType = TYPES.find(type => release[`is${type.charAt(0).toUpperCase() + type.slice(1)}`]); // Find content type
    console.log(contentType)
    if (contentType) { // Check if content type exists
        const contentTypeInput = document.querySelector(`input[name="content-type"][value="${contentType}"]`); // Get content type input
        if (contentTypeInput) { // Check if content type input exists
            contentTypeInput.checked = true; // Set content type

            const seriesInfo = document.querySelector('.series-info'); // Get series info section
            if (seriesInfo) { // Check if series info section exists
                seriesInfo.style.display = release.isSeries ? 'block' : 'none'; // Show/hide series info section
            }
        }
    }
    

    // Populate form fields
    document.getElementById('release-title').value = release.title || ''; // Set title
    const dateInput = document.getElementById('release-date'); // Get date input field
    const tbaButton = dateInput?.parentElement.querySelector('.tba-toggle'); // Get TBA button
    
    if (release.date === null) { // Check if date is TBA
        tbaButton?.classList.add('active'); // Set TBA button state
        dateInput.disabled = true; // Disable date input
        dateInput.value = ''; // Clear date input
        dateInput.placeholder = 'To Be Announced'; // Set placeholder
    } else {
        tbaButton?.classList.remove('active'); // Set TBA button state
        dateInput.disabled = false; // Enable date input
        dateInput.value = release.date || ''; // Set date
    }

    document.getElementById('custom-platform').value = release.platform || ''; // Set platform
    document.getElementById('backdrop').value = release.backdrop || ''; // Set backdrop

    // Set season and episode numbers
    const seasonNumber = document.getElementById('season-number'); // Get season number input
    const episodeNumber = document.getElementById('episode-number'); // Get episode number input
    
    if (release.isSeries) { // Check if it's an episode
        seasonNumber.value = release.season || ''; // Set season number
        episodeNumber.value = release.episode || ''; // Set episode number
    } else {
        seasonNumber.value = ''; // Clear season number
        episodeNumber.value = ''; // Clear episode number
    }    

    openForm(); // Open the form
}

// Delete Release Function
function deleteRelease(id) {
    if (!confirm('Are you sure you want to delete this release?')) return; // Confirm deletion

    const releases = getStoredReleases().filter(release => release.id !== id); // Filter out
    saveReleases(releases); // Save releases
    displayReleases(); // Display releases
}

// JSON Handling Functions
function setupJsonHandling() {
    const exportBtn = document.getElementById('export-json'); // Get export button
    const importBtn = document.getElementById('import-json'); // Get import button
    const fileInput = document.getElementById('json-import'); // Get file input

    if (exportBtn) { // Check if export button exists
        exportBtn.addEventListener('click', exportJson); // Add click event listener
    }
    
    if (importBtn && fileInput) { // Check if import button and file input exist
        importBtn.addEventListener('click', () => fileInput.click()); // Add click event listener
        fileInput.addEventListener('change', importJson); // Add change event listener
    }
}

// JSON Export Function
function exportJson() {
    const releases = getStoredReleases(); // Get all releases
    const dataStr = JSON.stringify(releases, null, 2); // Stringify data
    const blob = new Blob([dataStr], { type: 'application/json' }); // Create blob
    const url = URL.createObjectURL(blob); // Create URL
    
    const a = document.createElement('a'); // Create anchor element
    a.href = url; // Set href attribute
    a.download = `releases-${new Date().toISOString().split('T')[0]}.json`; // Set download attribute
    document.body.appendChild(a); // Append anchor to body
    a.click(); // Click anchor
    document.body.removeChild(a); // Remove anchor from body
    URL.revokeObjectURL(url); // Revoke URL
}

// JSON Import Function
async function importJson(event) {
    const file = event.target.files[0]; // Get file
    if (!file) return; // Exit if no file selected

    try {
        const text = await file.text(); // Read file as text
        const releases = JSON.parse(text); // Parse JSON
        
        if (!Array.isArray(releases)) { // Check if data is an array
            throw new Error('Invalid format: data must be an array'); // Throw error
        }
        
        // Enhanced validation
        const invalidReleases = releases.filter(release => { // Filter invalid releases
            return !release || typeof release !== 'object' || // Check if release is an object
                   !release.id || typeof release.id !== 'string' || // Check if ID is a string
                   !release.title || typeof release.title !== 'string' || // Check if title is a string
                   (release.date !== null && release.date !== undefined && typeof release.date !== 'string') || // Check if date is a string
                   (release.platform && typeof release.platform !== 'string') || // Check if platform is a string
                   (release.backdrop && typeof release.backdrop !== 'string') || // Check if backdrop is a string
                   (release.isSeries && typeof release.isSeries !== 'boolean') || // Check if isSeries is a boolean
                   (release.season && typeof release.season !== 'string') || // Check if season is a string
                   (release.episode && typeof release.episode !== 'string'); // Check if episode is a string
        });        

        if (invalidReleases.length > 0) { // Check if there are invalid releases
            throw new Error(`Invalid release format: ${invalidReleases.length} releases failed validation`); // Throw error
        }
        
        saveReleases(releases); // Save releases
        displayReleases(); // Display releases
        event.target.value = ''; // Reset input
        alert('Releases imported successfully!'); // Show success message
    } catch (e) { 
        console.error('Import error:', e); // Log error
        alert(`Import error: ${e.message}`); // Show error message
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    displayReleases(); // Display releases
    initializeFormHandlers(); // Form handlers setup
    setupDateInput(); // Date input setup
    setupJsonHandling(); // JSON handling setup
});

// Custom Platform Dropdown
function togglePlatformDropdown() {
    const dropdown = document.getElementById("platform-options"); // Get platform options
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none"; // Toggle display
}

// Select Platform
function selectPlatform(name) {
    const input = document.getElementById("custom-platform"); // Get custom platform input
    input.value = name; // Set input value

    // Hide the dropdown after selection
    togglePlatformDropdown(); // Toggle platform dropdown
}

// Close dropdown if clicked outside or when a platform is selected
document.addEventListener("click", function(event) { 
    const dropdown = document.getElementById("platform-options"); // Get platform options
    const input = document.getElementById("custom-platform"); // Get custom platform input
    if (!input.contains(event.target) && !dropdown.contains(event.target)) { 
        dropdown.style.display = "none"; // Hide dropdown
    } else if (dropdown.contains(event.target)) { 
        dropdown.style.display = "none"; // Hide dropdown
    }
});

// Auto-Release Episodes Popup Opening
function openAutoReleasePopup(seriesId) {
    const popup = document.getElementById('auto-release-popup'); // Get auto-release popup
    popup.style.display = 'flex'; // Show popup
    popup.setAttribute('data-series-id', seriesId); // Set series ID
}

// Auto-Release Episodes Popup Closing
function closeAutoReleasePopup() {
    const popup = document.getElementById('auto-release-popup'); // Get auto-release popup
    popup.style.display = 'none'; // Hide popup
    document.getElementById('auto-release-form').reset(); // Reset form fields
}

// Auto-Release Episodes Form Submission
document.getElementById('auto-release-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission
    const seriesId = document.getElementById('auto-release-popup').getAttribute('data-series-id'); // Get series ID
    const totalEpisodes = parseInt(document.getElementById('total-episodes').value, 10); // Get total episodes
    const frequency = document.getElementById('release-frequency').value; // Get release frequency

    autoReleaseEpisodes(seriesId, totalEpisodes, frequency); // Auto-release episodes
    closeAutoReleasePopup(); // Close auto-release popup
});

// Auto-Release Episodes Function
function autoReleaseEpisodes(seriesId, totalEpisodes, frequency) {
    const releases = getStoredReleases(); // Get all releases
    const seriesRelease = releases.find(r => r.id === seriesId); // Find series release
    if (!seriesRelease || !seriesRelease.date) return; // Exit if series release not found or date is not available

    const releaseDate = new Date(seriesRelease.date); // Get release date
    const newEpisodes = []; // Initialize new episodes array

    // Start from episode 1 if the episode is currently null
    let existingEpisodes = seriesRelease.episode === null ? 1 : parseInt(seriesRelease.episode) || 1; // Get existing episodes
    let lastEpisode = existingEpisodes + 1; // Get last episode
 
    if (existingEpisodes > totalEpisodes) { // Check if all episodes have been released
        alert('All episodes have already been released.'); // Show alert
        return;
    }

    // If frequency is daily or weekly, proceed with regular episode release
    for (let i = lastEpisode; i <= totalEpisodes; i++) { // Loop through each episode
        let n = i.toString(); // Convert episode number to string
        const newRelease = { ...seriesRelease, episode: n, id: `${seriesId}-E${i}` }; // Create new release object

        if (frequency === 'daily') { // Check if frequency is daily
            releaseDate.setDate(releaseDate.getDate() + 1); // Increment date by 1
        } else if (frequency === 'weekly') { // Check if frequency is weekly
            releaseDate.setDate(releaseDate.getDate() + 7); // Increment date by 7
        }
 
        newRelease.date = releaseDate.toISOString().split('T')[0]; // Set release date
        newEpisodes.push(newRelease); // Add new release to episodes
    }

    alert(`Auto-releasing ${newEpisodes.length} episodes for ${seriesRelease.title}`); // Show alert
    saveReleases([...releases, ...newEpisodes]); // Save releases
    displayReleases(); // Display releases
}

// Settings Dropdown
document.getElementById('settings').addEventListener('click', function() {
    const dropdown = document.getElementById('dropdown'); // Get dropdown
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none'; // Toggle display
});

// Remove All Releases Button Logic
function removeAllReleases() {
    if (confirm('Are you sure you want to delete all releases?')) { // Confirm deletion
        saveReleases([]); // Save empty array
        displayReleases(); // Display releases
    }
}