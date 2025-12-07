const PLACEHOLDER_IMAGE = 'img/placeholder_backdrop.png';

const getPlatformIcon = (platform) => {
    const map = {
        'Theaters': 'fa-solid fa-film',
        'Online': 'fa-solid fa-globe',
        'In-Person': 'fa-solid fa-user-group',
        'Event': 'fa-solid fa-calendar-star',
        'Music': 'fa-solid fa-music',
        'Discord': 'fa-brands fa-discord',
        'Netflix': 'fa-solid fa-n',
        'Prime Video': 'fa-brands fa-amazon',
        'Disney+': 'fa-brands fa-d',
        'HBO': 'fa-solid fa-h',
        'Hulu': 'fa-solid fa-h',
        'Apple TV+': 'fa-brands fa-apple',
        'Paramount+': 'fa-solid fa-mountain', 
        'Peacock': 'fa-solid fa-p',
        'Crunchyroll': 'fa-solid fa-play',
        'Youtube': 'fa-brands fa-youtube',
        'Twitch': 'fa-brands fa-twitch',
        'Playstation': 'fa-brands fa-playstation',
        'PS5': 'fa-brands fa-playstation',
        'Xbox': 'fa-brands fa-xbox',
        'Nintendo': 'fa-solid fa-n',
        'Steam': 'fa-brands fa-steam',
        'Epic Games': 'fa-solid fa-e',
        'Android': 'fa-brands fa-android',
        'Other': 'fa-solid fa-circle-question'
    };
    
    return map[platform] || 'fa-circle-question';
}

function stripTime(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getNextDate(item) {
    // Non-exact date types (year, period, TBA) should return null
    if (!item.dateType || item.dateType !== 'exact' || !item.date) {
        return null;
    }

    let target = stripTime(new Date(item.date));
    const now = stripTime(new Date());

    if (target >= now) {
        return target;
    }

    // For recurring events (if cadence is set)
    if (item.cadence) {
        const msPerDay = 86400000;
        const interval = item.cadence === 'weekly' ? 7 : 1;
        const daysPassed = Math.floor((now - target) / msPerDay);
        const intervalsToAdd = Math.ceil(daysPassed / interval);

        let nextDate = new Date(target.getTime() + (intervalsToAdd * interval * msPerDay));

        if (nextDate <= now) {
            nextDate = new Date(nextDate.getTime() + (interval * msPerDay));
        }
        return nextDate;
    }

    // If date is in the past and no cadence, return null
    return null;
}

function getCountdown(date) {
    if (!date) return { d: 0, h: 0, m: 0, s: 0, finished: true, label: '' };
    
    const total = stripTime(date) - stripTime(new Date());
    
    if (total < 0) return { d: 0, h: 0, m: 0, s: 0, finished: true, label: '' };
    
    const days = Math.floor(total / (1000*60*60*24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    let label = `${days} Days Left`;
    
    if (years >= 1) {
        label = years === 1 ? 'One Year Left' : `${years} Years Left`;
    } else if (months >= 1) {
        label = months === 1 ? 'One Month Left' : `${months} Months Left`;
    }
    
    return {
        d: days,
        h: 0,
        m: 0,
        finished: false,
        label: label
    };
}

function getTimeColor(days) {
    if (days < 7) return 'text-red-400 shadow-[0_0_10px_rgba(248,113,113,0.3)]';
    if (days < 30) return 'text-yellow-400';
    return 'text-brand-300';
}

function formatDateDisplay(item) {
    if (item.dateType === 'tba') {
        return 'TBA';
    } else if (item.dateType === 'year' && item.dateYear) {
        return item.dateYear;
    } else if (item.dateType === 'period' && item.datePeriod) {
        return item.datePeriod;
    } else if (item.dateType === 'exact' && item.date) {
        const date = new Date(item.date);
        return date.toLocaleDateString();
    }
    return 'TBA';
}

function formatEpisodeDisplay(item) {
    if (!item.season && !item.episode) return '';
    let display = '';
    if (item.season) display += `S${item.season}`;
    if (item.episode) display += `E${item.episode}`;
    return display;
}
