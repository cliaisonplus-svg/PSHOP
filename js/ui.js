import { loadTheme, saveTheme } from './storage-db.js';

// Icon path data (simplified - in production, you'd want to use lucide-static or similar)
const iconPaths = {
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    'moon': '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    'palette': '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    'plus-circle': '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
    'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    'trash-2': '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    'edit': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    'refresh-cw': '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    'camera': '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    'bar-chart': '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    'dollar-sign': '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    'eye-off': '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
    'package': '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    'search': '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
    'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    'log-in': '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
    'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
    'key': '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'lock': '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
};

// Initialize icons by replacing data-lucide attributes with actual SVGs
export function initIcons() {
    document.querySelectorAll('[data-lucide]:not(.icon-initialized)').forEach(element => {
        const iconName = element.getAttribute('data-lucide');
        const iconPath = iconPaths[iconName];
        
        if (iconPath && !element.querySelector('svg')) {
            try {
                const size = element.getAttribute('data-size') || 24;
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', size);
                svg.setAttribute('height', size);
                svg.setAttribute('viewBox', '0 0 24 24');
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', 'currentColor');
                svg.setAttribute('stroke-width', '2');
                svg.setAttribute('stroke-linecap', 'round');
                svg.setAttribute('stroke-linejoin', 'round');
                svg.innerHTML = iconPath;
                
                // Preserve existing classes
                const classes = element.className;
                if (classes) {
                    svg.setAttribute('class', classes);
                }
                
                // Replace element content with SVG
                element.innerHTML = '';
                element.appendChild(svg);
                element.classList.add('icon-initialized');
            } catch (error) {
                console.warn(`Could not render icon: ${iconName}`, error);
                element.classList.add('icon-initialized'); // Mark as processed even on error
            }
        } else if (!iconPath) {
            // Mark as processed even if icon not found to avoid repeated attempts
            element.classList.add('icon-initialized');
        }
    });
}

const defaultTheme = {
    'primary': '#0d6efd',
    'secondary': '#6c757d',
    'bg': '#f8f9fa',
    'text': '#212529',
    'card-bg': '#ffffff',
};

const defaultDarkTheme = {
    'primary': '#2b8aff',
    'secondary': '#8b949e',
    'bg': '#0d1117',
    'text': '#c9d1d9',
    'card-bg': '#161b22',
}

function applyTheme(theme) {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme)) {
        root.style.setProperty(`--${key}`, value);
    }
}

async function initTheme() {
    const savedTheme = await loadTheme();
    const isDarkMode = savedTheme.mode === 'dark';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    const colors = savedTheme.colors || (isDarkMode ? defaultDarkTheme : defaultTheme);
    applyTheme(colors);
}

async function handlePersonalizationPage() {
    const primaryColorInput = document.getElementById('primary-color');
    const secondaryColorInput = document.getElementById('secondary-color');
    const bgColorInput = document.getElementById('bg-color');
    const textColorInput = document.getElementById('text-color');
    const cardBgColorInput = document.getElementById('card-bg-color');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const resetThemeBtn = document.getElementById('reset-theme');

    if (!primaryColorInput) return;

    function updateColorPickers(colors) {
        primaryColorInput.value = colors.primary;
        secondaryColorInput.value = colors.secondary;
        bgColorInput.value = colors.bg;
        textColorInput.value = colors.text;
        cardBgColorInput.value = colors['card-bg'];
    }

    let currentTheme = await loadTheme();
    const isDarkMode = document.body.classList.contains('dark-mode');
    updateColorPickers(currentTheme.colors || (isDarkMode ? defaultDarkTheme : defaultTheme));

    [primaryColorInput, secondaryColorInput, bgColorInput, textColorInput, cardBgColorInput].forEach(input => {
        input.addEventListener('input', async (e) => {
            const newColors = {
                'primary': primaryColorInput.value,
                'secondary': secondaryColorInput.value,
                'bg': bgColorInput.value,
                'text': textColorInput.value,
                'card-bg': cardBgColorInput.value,
            };
            applyTheme(newColors);
            currentTheme.colors = newColors;
            await saveTheme(currentTheme);
        });
    });

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', async () => {
            document.body.classList.toggle('dark-mode');
            const isNowDark = document.body.classList.contains('dark-mode');
            currentTheme.mode = isNowDark ? 'dark' : 'light';
            const newDefault = isNowDark ? defaultDarkTheme : defaultTheme;
            applyTheme(newDefault);
            updateColorPickers(newDefault);
            currentTheme.colors = newDefault;
            await saveTheme(currentTheme);
        });
    }

    if (resetThemeBtn) {
        resetThemeBtn.addEventListener('click', async () => {
            const isDarkMode = document.body.classList.contains('dark-mode');
            const themeToReset = isDarkMode ? defaultDarkTheme : defaultTheme;
            applyTheme(themeToReset);
            updateColorPickers(themeToReset);
            await saveTheme({ mode: isDarkMode ? 'dark' : 'light', colors: themeToReset });
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await initTheme();
    // Initialize icons after a short delay to ensure DOM is ready
    setTimeout(() => {
        initIcons();
    }, 100);
    await handlePersonalizationPage();
});
