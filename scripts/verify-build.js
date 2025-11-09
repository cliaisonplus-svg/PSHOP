/**
 * Script de vérification du build
 * Vérifie que tous les fichiers nécessaires sont présents dans dist/
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = resolve(__dirname, '..', 'dist');

console.log('🔍 Vérification du build...\n');

// Vérifier que dist/ existe
if (!existsSync(distDir)) {
  console.error('❌ ERREUR: Le répertoire dist/ n\'existe pas!');
  console.error('   Le build a peut-être échoué.');
  process.exit(1);
}

// Vérifier que dist/ n'est pas vide
const distFiles = readdirSync(distDir);
if (distFiles.length === 0) {
  console.error('❌ ERREUR: Le répertoire dist/ est vide!');
  console.error('   Le build n\'a généré aucun fichier.');
  process.exit(1);
}

console.log(`✓ Répertoire dist/ existe (${distFiles.length} éléments)\n`);

// Fichiers HTML requis
const requiredHtmlFiles = [
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

console.log('📄 Vérification des fichiers HTML:');
let missingFiles = [];
requiredHtmlFiles.forEach(file => {
  const filePath = resolve(distDir, file);
  if (existsSync(filePath)) {
    const stats = statSync(filePath);
    console.log(`  ✓ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`  ✗ ${file} (MANQUANT)`);
    missingFiles.push(file);
  }
});

// Vérifier les fichiers CSS
console.log('\n🎨 Vérification des fichiers CSS:');
const cssDir = resolve(distDir, 'css');
if (existsSync(cssDir)) {
  const cssFiles = readdirSync(cssDir).filter(f => f.endsWith('.css'));
  if (cssFiles.length > 0) {
    console.log(`  ✓ ${cssFiles.length} fichier(s) CSS trouvé(s)`);
    cssFiles.forEach(file => {
      const filePath = resolve(cssDir, file);
      const stats = statSync(filePath);
      console.log(`    - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
  } else {
    console.log('  ⚠️  Aucun fichier CSS trouvé');
  }
} else {
  console.log('  ✗ Répertoire css/ n\'existe pas');
}

// Vérifier les assets JavaScript
console.log('\n📦 Vérification des assets:');
const assetsDir = resolve(distDir, 'assets');
if (existsSync(assetsDir)) {
  const assetsFiles = readdirSync(assetsDir);
  const jsFiles = assetsFiles.filter(f => f.endsWith('.js'));
  const cssAssets = assetsFiles.filter(f => f.endsWith('.css'));
  
  if (jsFiles.length > 0) {
    console.log(`  ✓ ${jsFiles.length} fichier(s) JavaScript`);
  }
  if (cssAssets.length > 0) {
    console.log(`  ✓ ${cssAssets.length} fichier(s) CSS (assets)`);
  }
  if (assetsFiles.length === 0) {
    console.log('  ⚠️  Aucun asset trouvé');
  }
} else {
  console.log('  ⚠️  Répertoire assets/ n\'existe pas');
}

// Résumé
console.log('\n' + '='.repeat(50));
if (missingFiles.length > 0) {
  console.error(`❌ ERREUR: ${missingFiles.length} fichier(s) HTML manquant(s):`);
  missingFiles.forEach(file => console.error(`   - ${file}`));
  console.error('\n   Le build est incomplet. Vérifiez les logs de build.');
  process.exit(1);
} else {
  console.log('✅ Build vérifié avec succès!');
  console.log(`   - ${requiredHtmlFiles.length} fichier(s) HTML`);
  console.log(`   - Répertoire dist/ contient ${distFiles.length} élément(s)`);
  console.log('\n   Le build est prêt pour le déploiement.');
}

