loadFromStorage();
render();

tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: { sans: ['Inter', 'sans-serif'] },
            colors: {
                brand: { 500: '#7b5cff', 600: '#6246ea' },
                dark: { 800: '#1e293b', 900: '#0f172a' }
            }
        }
    }
}