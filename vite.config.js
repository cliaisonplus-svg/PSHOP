import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Plugin pour copier les fichiers CSS et autres assets
function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    closeBundle() {
      // Copier le dossier css
      const cssDir = resolve(__dirname, 'css');
      const distCssDir = resolve(__dirname, 'dist', 'css');
      
      if (existsSync(cssDir)) {
        if (!existsSync(distCssDir)) {
          mkdirSync(distCssDir, { recursive: true });
        }
        
        const cssFiles = readdirSync(cssDir);
        cssFiles.forEach(file => {
          if (file.endsWith('.css')) {
            try {
              copyFileSync(resolve(cssDir, file), resolve(distCssDir, file));
              console.log(`✓ Copied css/${file}`);
            } catch (error) {
              console.error(`✗ Failed to copy css/${file}:`, error);
            }
          }
        });
      }
    }
  };
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        'reset-password': resolve(__dirname, 'reset-password.html'),
        ajouter: resolve(__dirname, 'ajouter.html'),
        produit: resolve(__dirname, 'produit.html'),
        personnaliser: resolve(__dirname, 'personnaliser.html'),
        ventes: resolve(__dirname, 'ventes.html'),
        depenses: resolve(__dirname, 'depenses.html'),
        dashboard: resolve(__dirname, 'dashboard.html')
      }
    }
  },
  plugins: [copyAssetsPlugin()]
});
