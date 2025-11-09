import { defineConfig } from 'vite';
import { resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, readdirSync, existsSync, renameSync, unlinkSync, readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Liste des fichiers HTML à builder
const htmlFiles = [
  'index.html',
  'login.html',
  'register.html',
  'reset-password.html',
  'ajouter.html',
  'produit.html',
  'personnaliser.html',
  'ventes.html',
  'depenses.html',
  'dashboard.html'
];

// Plugin pour copier les assets et corriger les noms de fichiers HTML
function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      
      // Renommer les fichiers HTML générés par Vite
      // Vite génère main.html, login.html, etc. depuis rollupOptions.input
      // On doit s'assurer que index.html existe (pas main.html)
      const mainHtmlPath = resolve(distDir, 'main.html');
      const indexHtmlPath = resolve(distDir, 'index.html');
      
      if (existsSync(mainHtmlPath)) {
        if (existsSync(indexHtmlPath)) {
          // Si index.html existe déjà, supprimer main.html
          try {
            unlinkSync(mainHtmlPath);
            console.log('✓ Removed duplicate main.html (index.html exists)');
          } catch (error) {
            console.warn('⚠ Could not remove main.html:', error.message);
          }
        } else {
          // Renommer main.html en index.html
          try {
            renameSync(mainHtmlPath, indexHtmlPath);
            console.log('✓ Renamed main.html to index.html');
          } catch (error) {
            console.error('✗ Failed to rename main.html:', error);
            // Si le renommage échoue, copier le contenu
            try {
              const content = readFileSync(mainHtmlPath, 'utf-8');
              writeFileSync(indexHtmlPath, content);
              console.log('✓ Copied main.html to index.html');
            } catch (copyError) {
              console.error('✗ Failed to copy main.html:', copyError);
            }
          }
        }
      }
      
      // Vérifier que index.html existe (critique pour Vercel)
      if (!existsSync(indexHtmlPath)) {
        console.error('❌ ERREUR: index.html n\'existe pas dans dist/!');
        console.error('   Vercel ne pourra pas servir l\'application.');
        throw new Error('index.html is missing from dist/');
      }
      
      // Copier le dossier css
      const cssDir = resolve(__dirname, 'css');
      const distCssDir = resolve(distDir, 'css');
      
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
      
      // Vérifier que tous les fichiers HTML existent
      console.log('\n📄 Vérification des fichiers HTML dans dist/:');
      htmlFiles.forEach(file => {
        const filePath = resolve(distDir, file);
        if (existsSync(filePath)) {
          console.log(`  ✓ ${file}`);
        } else {
          console.log(`  ✗ ${file} (MANQUANT)`);
        }
      });
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
      input: htmlFiles.reduce((acc, file) => {
        // Utiliser le nom de fichier (sans extension) comme clé
        const key = file.replace('.html', '');
        // Pour index.html, utiliser 'main' comme clé mais on le renommera après
        acc[key === 'index' ? 'main' : key] = resolve(__dirname, file);
        return acc;
      }, {})
    }
  },
  plugins: [copyAssetsPlugin()]
});
