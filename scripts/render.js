const grid = document.getElementById('cards-grid');

function getSortPriority(item) {
    // Priority: exact date (0) > year/period (1) > TBA (2)
    if (item.dateType === 'exact' && item.date) {
        return 0;
    } else if ((item.dateType === 'year' && item.dateYear) || (item.dateType === 'period' && item.datePeriod)) {
        return 1;
    } else {
        return 2;
    }
}

function isToday(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function render(filter = 'all') {
    if (!grid) {
        console.error("Element with id 'cards-grid' not found in HTML");
        return;
    }

    grid.innerHTML = '';

    let data = releases;
    if (filter !== 'all') data = releases.filter(i => i.type == filter);
    
    // Separate items by priority
    const exactDateItems = data.filter(i => getSortPriority(i) === 0);
    const yearPeriodItems = data.filter(i => getSortPriority(i) === 1);
    const tbaItems = data.filter(i => getSortPriority(i) === 2);

    // Sort exact dates by countdown
    exactDateItems.sort((a, b) => {
        const da = getNextDate(a);
        const db = getNextDate(b);
        if (!da) return 1;
        if (!db) return -1;
        return da - db;
    });

    // Combine: exact dates first, then year/period, then TBA
    const sortedData = [...exactDateItems, ...yearPeriodItems, ...tbaItems];

    sortedData.forEach((item) => {
        const date = getNextDate(item);
        const timeLeft = getCountdown(date);
        const icon = getPlatformIcon(item.platform);
        const episodeDisplay = formatEpisodeDisplay(item);
        const imageUrl = item.image || PLACEHOLDER_IMAGE;

        const card = document.createElement('div');
        card.className = 'glass-card rounded-2xl overflow-hidden group relative flex flex-col h-full';
        
        let timeLeftHTML = '';
        if (date) {
            let label = timeLeft.label;
            let colorClass = getTimeColor(timeLeft.d);
            
            // Check if it's today
            if (isToday(item.date)) {
                label = 'Today';
                colorClass = 'text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.3)]';
            }
            
            timeLeftHTML = `<div class="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 ${colorClass}">
                ${label}
            </div>`;
        } else {
            let label = 'Coming Soon';
            if (item.dateType === 'tba') label = 'Coming Soon';
            else if (item.dateType === 'year') label = `${item.dateYear || 'Coming Soon'}`;
            else if (item.dateType === 'period') label = item.datePeriod || 'Coming Soon';
            
            timeLeftHTML = `<div class="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 text-gray-300">
                ${label}
            </div>`;
        }

        let typeAndEpisodeHTML = `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-600/80 text-white uppercase">${item.type}</span>`;
        
        if (episodeDisplay) {
            typeAndEpisodeHTML += `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/60 text-white uppercase ml-2">${episodeDisplay}</span>`;
        }

        // Render cards
        card.innerHTML = `
<div class="group relative w-full aspect-[2/3] md:aspect-video rounded-xl overflow-hidden shadow-2xl bg-dark-800 cursor-pointer">
    
    <div class="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" 
         style="background-image: url('${imageUrl}')">
    </div>

    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 p-4 flex flex-col justify-between transition-opacity duration-500">
        <div class="flex justify-between items-start">
            ${timeLeftHTML}
            <div class="flex gap-1">${typeAndEpisodeHTML}</div>
        </div>
        
        <div class="group-hover:opacity-0 transition-opacity duration-300">
            <p class="text-[10px] uppercase tracking-widest text-gray-400">Release</p>
            <p class="text-white font-mono font-bold">${formatDateDisplay(item)}</p>
        </div>
    </div>

    <div class="absolute inset-0 bg-dark-900/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center items-center p-6 text-center">
        
        <h3 class="text-xl font-bold text-white mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            ${item.title}
        </h3>
        
        <div class="flex items-center gap-2 text-sm text-brand-400 mb-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <i class="${icon}"></i> ${item.platform}
        </div>

        <div class="flex gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
            <button class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition" onclick="openEditPopup('${item.id}')">
                <i class="fa-regular fa-edit mr-2"></i> EDIT DETAILS
            </button>
        </div>
    </div>
</div>
        `;
        grid.appendChild(card);
    });
}

function filterData(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.className = 'filter-btn px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition';
    });
    if(btn) btn.className = 'filter-btn px-4 py-1.5 rounded-lg text-sm font-medium transition bg-trasparent text-white shadow-lg shadow-brand-500/25';
    render(type);
}

function showSettings() {
    const settings = document.getElementById('settingsWindow');
    const btn = document.getElementById('settingsBtn');

    if (!settings || !btn) return;

    const rect = btn.getBoundingClientRect();

    settings.style.left = rect.left - 220 + "px";
    settings.style.top = rect.bottom + 10 + "px";

    const isHidden = settings.classList.contains('hidden');

    if (isHidden) {
        settings.classList.replace('hidden', 'block');
        document.addEventListener('click', handleOutsideClick);
    } else {
        settings.classList.replace('block', 'hidden');
        document.removeEventListener('click', handleOutsideClick);
    }

    function handleOutsideClick(e) {
        if (settings.contains(e.target) || btn.contains(e.target)) return;

        settings.classList.replace('block', 'hidden');
        document.removeEventListener('click', handleOutsideClick);
    }
}