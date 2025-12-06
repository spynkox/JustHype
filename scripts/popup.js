// Toggle season/episode visibility based on type
function toggleSeasonEpisodeFields() {
    const typeSelect = document.getElementById('input-type');
    const seasonEpisodeDiv = document.querySelector('#addReleaseForm .grid-cols-2');
    
    if (typeSelect && seasonEpisodeDiv) {
        if (typeSelect.value === 'tv') {
            seasonEpisodeDiv.style.display = 'grid';
        } else {
            seasonEpisodeDiv.style.display = 'none';
        }
    }
}

// Toggle season/episode visibility for edit form
function toggleEditSeasonEpisodeFields() {
    const typeSelect = document.getElementById('edit-input-type');
    const form = document.getElementById('editReleaseForm');
    const seasonEpisodeDiv = form.querySelector('.grid-cols-2');
    
    if (typeSelect && seasonEpisodeDiv) {
        if (typeSelect.value === 'tv') {
            seasonEpisodeDiv.style.display = 'grid';
        } else {
            seasonEpisodeDiv.style.display = 'none';
        }
    }
}

// Toggle auto-generate section based on type
function toggleAutoGenerateSection() {
    const typeSelect = document.getElementById('input-type');
    const autoGenSection = document.querySelector('#addReleaseForm .border-t.border-white\\/5');
    
    if (typeSelect && autoGenSection) {
        if (typeSelect.value === 'tv') {
            autoGenSection.style.display = 'block';
        } else {
            autoGenSection.style.display = 'none';
        }
    }
}

// Toggle auto-generate section in edit form
function toggleEditAutoGenerateSection() {
    const typeSelect = document.getElementById('edit-input-type');
    const autoGenSection = document.getElementById('edit-auto-generate-section');
    
    if (typeSelect && autoGenSection) {
        if (typeSelect.value === 'tv') {
            autoGenSection.style.display = 'block';
        } else {
            autoGenSection.style.display = 'none';
        }
    }
}

// Open add release popup
function openAddPopup() {
    const popup = document.getElementById('addReleasePopup');
    if (popup) {
        popup.classList.remove('hidden');
        document.getElementById('input-date-type').value = 'exact';
        toggleDateInputs();
        document.getElementById('input-date').valueAsDate = new Date();
        
        // Initialize visibility
        toggleSeasonEpisodeFields();
        toggleAutoGenerateSection();
    }
}

// Close add release popup
function closeAddPopup() {
    const popup = document.getElementById('addReleasePopup');
    const form = document.getElementById('addReleaseForm');
    if (popup) {
        popup.classList.add('hidden');
        if (form) form.reset();
        currentEditId = null;
    }
}

// Toggle date input visibility for add form
function toggleDateInputs() {
    const dateType = document.getElementById('input-date-type').value;
    const dateInput = document.getElementById('input-date');
    const yearInput = document.getElementById('input-year');
    const periodInput = document.getElementById('input-period');

    dateInput.classList.add('hidden');
    yearInput.classList.add('hidden');
    periodInput.classList.add('hidden');

    if (dateType === 'exact') {
        dateInput.classList.remove('hidden');
    } else if (dateType === 'year') {
        yearInput.classList.remove('hidden');
    } else if (dateType === 'period') {
        periodInput.classList.remove('hidden');
    }
}

// Toggle date input visibility for edit form
function toggleEditDateInputs() {
    const dateType = document.getElementById('edit-input-date-type').value;
    const dateInput = document.getElementById('edit-input-date');
    const yearInput = document.getElementById('edit-input-year');
    const periodInput = document.getElementById('edit-input-period');

    dateInput.classList.add('hidden');
    yearInput.classList.add('hidden');
    periodInput.classList.add('hidden');

    if (dateType === 'exact') {
        dateInput.classList.remove('hidden');
    } else if (dateType === 'year') {
        yearInput.classList.remove('hidden');
    } else if (dateType === 'period') {
        periodInput.classList.remove('hidden');
    }
}

// Open edit popup with release data
function openEditPopup(id) {
    const popup = document.getElementById('editReleasePopup');
    const item = getReleaseById(id);
    
    if (popup && item) {
        currentEditId = id;
        popup.classList.remove('hidden');

        document.getElementById('edit-input-title').value = item.title || '';
        document.getElementById('edit-input-type').value = item.type || '';
        document.getElementById('edit-input-platform').value = item.platform || '';
        document.getElementById('edit-input-image').value = item.image || '';
        document.getElementById('edit-input-season').value = item.season || '';
        document.getElementById('edit-input-episode').value = item.episode || '';
        
        // Set date type and values
        const dateType = item.dateType || 'exact';
        document.getElementById('edit-input-date-type').value = dateType;
        
        if (dateType === 'exact') {
            document.getElementById('edit-input-date').value = item.date || '';
        } else if (dateType === 'year') {
            document.getElementById('edit-input-year').value = item.dateYear || '';
        } else if (dateType === 'period') {
            document.getElementById('edit-input-period').value = item.datePeriod || '';
        }
        
        toggleEditDateInputs();
        toggleEditSeasonEpisodeFields();
        toggleEditAutoGenerateSection();
    }
}

// Close edit popup
function closeEditPopup() {
    const popup = document.getElementById('editReleasePopup');
    if (popup) {
        popup.classList.add('hidden');
        document.getElementById('editReleaseForm').reset();
        currentEditId = null;
    }
}

// Delete current release with confirmation
function deleteCurrentRelease() {
    if (!currentEditId) {
        alert('Errore: release non trovata');
        return;
    }
    
    const item = getReleaseById(currentEditId);
    if (!item) {
        alert('Errore: release non trovata');
        return;
    }
    
    if (confirm(`Sei sicuro di voler eliminare "${item.title}"?`)) {
        releases = releases.filter(r => r.id !== currentEditId);
        saveToStorage();
        render();
        closeEditPopup();
        alert('Release eliminata con successo!');
    }
}

// Auto-generate episodes for add form
function autoGenerateEpisodes() {
    const count = parseInt(document.getElementById('input-auto-count').value) || 0;
    const cadence = document.getElementById('input-auto-cadence').value;
    const dateType = document.getElementById('input-date-type').value;
    const typeSelect = document.getElementById('input-type').value;
    
    if (typeSelect !== 'tv') {
        alert('Auto-genera episodi è disponibile solo per le serie TV');
        return;
    }
    
    if (count <= 0) {
        alert('Inserisci un numero valido di episodi');
        return;
    }

    let startDate;
    if (dateType === 'exact') {
        startDate = new Date(document.getElementById('input-date').value);
        if (!startDate.getTime()) {
            alert('Seleziona una data valida');
            return;
        }
    } else {
        alert('Usa "Exact Date" per auto-generare episodi');
        return;
    }

    const title = document.getElementById('input-title').value;
    const platform = document.getElementById('input-platform').value;
    const image = document.getElementById('input-image').value;
    const season = parseInt(document.getElementById('input-season').value) || 1;

    if (!title || !platform) {
        alert('Compila almeno Titolo e Platform');
        return;
    }

    let currentDate = new Date(startDate);
    const interval = cadence === 'daily' ? 1 : cadence === 'weekly' ? 7 : 0;

    for (let i = 0; i < count; i++) {
        const newRelease = {
            id: generateId(),
            title: title,
            type: 'tv',
            platform: platform,
            date: currentDate.toISOString().split('T')[0],
            dateType: 'exact',
            image: image,
            season: season,
            episode: i + 1
        };
        
        releases.push(newRelease);

        if (interval > 0) {
            currentDate = new Date(currentDate.getTime() + interval * 86400000);
        }
    }

    saveToStorage();
    render();
    closeAddPopup();
    alert(`${count} episodi generati con successo!`);
}

// Auto-generate episodes for edit form
function autoGenerateEditEpisodes() {
    if (!currentEditId) {
        alert('Errore: release non trovata');
        return;
    }

    const currentItem = getReleaseById(currentEditId);
    if (!currentItem || currentItem.type !== 'tv') {
        alert('Auto-genera episodi è disponibile solo per le serie TV');
        return;
    }

    const count = parseInt(document.getElementById('edit-input-auto-count').value) || 0;
    const cadence = document.getElementById('edit-input-auto-cadence').value;
    const dateType = document.getElementById('edit-input-date-type').value;
    
    if (count <= 0) {
        alert('Inserisci un numero valido di episodi');
        return;
    }

    let startDate;
    if (dateType === 'exact') {
        startDate = new Date(document.getElementById('edit-input-date').value);
        if (!startDate.getTime()) {
            alert('Seleziona una data valida');
            return;
        }
    } else {
        alert('Usa "Exact Date" per auto-generare episodi');
        return;
    }

    const title = document.getElementById('edit-input-title').value;
    const platform = document.getElementById('edit-input-platform').value;
    const image = document.getElementById('edit-input-image').value;
    const season = parseInt(document.getElementById('edit-input-season').value) || 1;

    if (!title || !platform) {
        alert('Compila almeno Titolo e Platform');
        return;
    }

    let currentDate = new Date(startDate);
    const interval = cadence === 'daily' ? 1 : cadence === 'weekly' ? 7 : 0;

    for (let i = 0; i < count; i++) {
        const newRelease = {
            id: generateId(),
            title: title,
            type: 'tv',
            platform: platform,
            date: currentDate.toISOString().split('T')[0],
            dateType: 'exact',
            image: image,
            season: season,
            episode: i + 1
        };
        
        releases.push(newRelease);

        if (interval > 0) {
            currentDate = new Date(currentDate.getTime() + interval * 86400000);
        }
    }

    saveToStorage();
    render();
    closeEditPopup();
    alert(`${count} episodi generati con successo!`);
}

// Handle add form submission
document.getElementById('addReleaseForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const dateType = document.getElementById('input-date-type').value;
    const typeValue = document.getElementById('input-type').value;
    
    const newRelease = {
        id: generateId(),
        title: document.getElementById('input-title').value,
        type: typeValue,
        platform: document.getElementById('input-platform').value,
        dateType: dateType,
        image: document.getElementById('input-image').value
    };

    // Add season/episode only if type is tv
    if (typeValue === 'tv') {
        if (document.getElementById('input-season').value) {
            newRelease.season = parseInt(document.getElementById('input-season').value);
        }
        if (document.getElementById('input-episode').value) {
            newRelease.episode = parseInt(document.getElementById('input-episode').value);
        }
    }

    if (dateType === 'exact') {
        newRelease.date = document.getElementById('input-date').value;
    } else if (dateType === 'year') {
        newRelease.dateYear = document.getElementById('input-year').value;
    } else if (dateType === 'period') {
        newRelease.datePeriod = document.getElementById('input-period').value;
    }

    if (!newRelease.title || !newRelease.type || !newRelease.platform) {
        alert('Compila i campi obbligatori: Titolo, Tipo, Platform');
        return;
    }

    releases.push(newRelease);
    saveToStorage();
    render();
    closeAddPopup();
    alert('Release aggiunta con successo!');
    console.log('New release added:', newRelease);
});

// Handle edit form submission
document.getElementById('editReleaseForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!currentEditId) {
        alert('Errore: release non trovata');
        return;
    }

    const idx = getIndexById(currentEditId);
    if (idx < 0) {
        alert('Errore: release non trovata');
        return;
    }

    const dateType = document.getElementById('edit-input-date-type').value;
    const typeValue = document.getElementById('edit-input-type').value;
    
    const updatedRelease = {
        id: currentEditId,
        title: document.getElementById('edit-input-title').value,
        type: typeValue,
        platform: document.getElementById('edit-input-platform').value,
        dateType: dateType,
        image: document.getElementById('edit-input-image').value
    };

    // Add season/episode only if type is tv
    if (typeValue === 'tv') {
        if (document.getElementById('edit-input-season').value) {
            updatedRelease.season = parseInt(document.getElementById('edit-input-season').value);
        }
        if (document.getElementById('edit-input-episode').value) {
            updatedRelease.episode = parseInt(document.getElementById('edit-input-episode').value);
        }
    }

    if (dateType === 'exact') {
        updatedRelease.date = document.getElementById('edit-input-date').value;
    } else if (dateType === 'year') {
        updatedRelease.dateYear = document.getElementById('edit-input-year').value;
    } else if (dateType === 'period') {
        updatedRelease.datePeriod = document.getElementById('edit-input-period').value;
    }

    if (!updatedRelease.title || !updatedRelease.type || !updatedRelease.platform) {
        alert('Compila i campi obbligatori: Titolo, Tipo, Platform');
        return;
    }

    releases[idx] = updatedRelease;
    saveToStorage();
    render();
    closeEditPopup();
    alert('Release aggiornata con successo!');
    console.log('Release updated:', updatedRelease);
});

// Event listeners for type changes
document.getElementById('input-type')?.addEventListener('change', function() {
    toggleSeasonEpisodeFields();
    toggleAutoGenerateSection();
});

document.getElementById('edit-input-type')?.addEventListener('change', function() {
    toggleEditSeasonEpisodeFields();
    toggleEditAutoGenerateSection();
});

// Close popup when clicking outside
document.getElementById('addReleasePopup')?.addEventListener('click', function(e) {
    if (e.target.id === 'addReleasePopup') {
        closeAddPopup();
    }
});

document.getElementById('editReleasePopup')?.addEventListener('click', function(e) {
    if (e.target.id === 'editReleasePopup') {
        closeEditPopup();
    }
});

// Close popups with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAddPopup();
        closeEditPopup();
    }
});