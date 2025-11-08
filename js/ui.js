import { createIcons, Sun, Moon, Palette, PlusCircle, ArrowLeft, Save, Trash2, Eye, Edit, RefreshCw, Download, Upload } from 'lucide';
import { loadTheme, saveTheme } from './storage.js';

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

function initTheme() {
    const savedTheme = loadTheme();
    const isDarkMode = savedTheme.mode === 'dark';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    const colors = savedTheme.colors || (isDarkMode ? defaultDarkTheme : defaultTheme);
    applyTheme(colors);
}

function handlePersonalizationPage() {
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

    let currentTheme = loadTheme();
    const isDarkMode = document.body.classList.contains('dark-mode');
    updateColorPickers(currentTheme.colors || (isDarkMode ? defaultDarkTheme : defaultTheme));

    [primaryColorInput, secondaryColorInput, bgColorInput, textColorInput, cardBgColorInput].forEach(input => {
        input.addEventListener('input', (e) => {
            const newColors = {
                'primary': primaryColorInput.value,
                'secondary': secondaryColorInput.value,
                'bg': bgColorInput.value,
                'text': textColorInput.value,
                'card-bg': cardBgColorInput.value,
            };
            applyTheme(newColors);
            currentTheme.colors = newColors;
            saveTheme(currentTheme);
        });
    });

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isNowDark = document.body.classList.contains('dark-mode');
        currentTheme.mode = isNowDark ? 'dark' : 'light';
        const newDefault = isNowDark ? defaultDarkTheme : defaultTheme;
        applyTheme(newDefault);
        updateColorPickers(newDefault);
        currentTheme.colors = newDefault;
        saveTheme(currentTheme);
    });

    resetThemeBtn.addEventListener('click', () => {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const themeToReset = isDarkMode ? defaultDarkTheme : defaultTheme;
        applyTheme(themeToReset);
        updateColorPickers(themeToReset);
        saveTheme({ mode: isDarkMode ? 'dark' : 'light', colors: themeToReset });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    createIcons({
        icons: { Sun, Moon, Palette, PlusCircle, ArrowLeft, Save, Trash2, Eye, Edit, RefreshCw, Download, Upload }
    });
    handlePersonalizationPage();
});
