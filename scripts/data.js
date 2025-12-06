let releases = [];
let currentEditId = null;

// Generate unique ID
function generateId() {
    return 'r' + Date.now() + Math.random().toString(36).substr(2, 9);
}

// Load releases from localStorage
function loadFromStorage() {
    try {
        const data = localStorage.getItem('releases-data');
        if (data) {
            releases = JSON.parse(data);
            console.log("Dati caricati dal localStorage:", releases);
            return true;
        }
    } catch (error) {
        console.log("Nessun dato salvato trovato");
    }
    return false;
}

// Save releases to localStorage
function saveToStorage() {
    try {
        localStorage.setItem('releases-data', JSON.stringify(releases));
        console.log("Dati salvati nel localStorage");
        return true;
    } catch (error) {
        console.error("Errore nel salvataggio:", error);
        return false;
    }
}

// Trigger file input when Import button is clicked
function triggerImport() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.click();
    }
}

// Import releases data from JSON file
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const importedData = JSON.parse(content);

            if (Array.isArray(importedData)) {
                // Ensure all imported items have IDs
                releases = importedData.map(item => ({
                    ...item,
                    id: item.id || generateId()
                }));
                saveToStorage();
                console.log("Dati importati:", releases);
                alert("Importazione riuscita! I dati sono stati salvati.");
                render();
            } else {
                alert("Il file JSON non contiene un array valido.");
            }
        } catch (error) {
            alert("Errore nella lettura del file JSON.");
            console.error(error);
        }
    };

    reader.readAsText(file);
}

// Export releases data as JSON file
function exportData() {
    if (!releases || releases.length === 0) {
        alert("Nessun dato da esportare!");
        return;
    }
    
    const dataStr = JSON.stringify(releases, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `releases_${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log("Dati esportati con successo");
}

// Get release by ID
function getReleaseById(id) {
    return releases.find(r => r.id === id);
}

// Get index by ID
function getIndexById(id) {
    return releases.findIndex(r => r.id === id);
}