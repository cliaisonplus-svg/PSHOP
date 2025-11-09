/**
 * Script postinstall pour forcer l'installation des binaires natifs Rollup
 * Nécessaire car Yarn ne gère pas toujours correctement les optionalDependencies
 * Ce script s'exécute après l'installation des dépendances
 * 
 * Compatible avec Node.js 18+ et les modules ES
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Détecter la plateforme
const platform = process.platform;
const arch = process.arch;

// Mapping des binaires Rollup selon la plateforme
const rollupBinaries = {
  'linux': {
    'x64': '@rollup/rollup-linux-x64-gnu',
    'arm64': '@rollup/rollup-linux-arm64-gnu'
  },
  'darwin': {
    'x64': '@rollup/rollup-darwin-x64',
    'arm64': '@rollup/rollup-darwin-arm64'
  },
  'win32': {
    'x64': '@rollup/rollup-win32-x64-msvc',
    'arm64': '@rollup/rollup-win32-arm64-msvc'
  }
};

function getRollupBinary() {
  const platformBinaries = rollupBinaries[platform];
  if (!platformBinaries) {
    return null;
  }
  
  return platformBinaries[arch] || null;
}

function checkBinaryExists(binary) {
  try {
    const binaryPath = join(projectRoot, 'node_modules', binary);
    return existsSync(binaryPath);
  } catch (error) {
    return false;
  }
}

function installBinary(binary) {
  try {
    console.log(`📦 Installation du binaire natif Rollup: ${binary}`);
    console.log(`   Plateforme: ${platform}-${arch}`);
    
    // Essayer d'abord avec npm (gère mieux les optionalDependencies)
    // npm est toujours disponible sur Vercel, même si on utilise Yarn
    try {
      // Utiliser npm pour installer uniquement le binaire optionnel
      // --no-save pour ne pas modifier package.json
      // --legacy-peer-deps pour éviter les problèmes de compatibilité
      execSync(`npm install ${binary} --no-save --legacy-peer-deps --no-package-lock`, {
        cwd: projectRoot,
        stdio: 'pipe', // Utiliser 'pipe' pour éviter trop de logs
        env: {
          ...process.env,
          npm_config_optional: 'true',
          npm_config_save: 'false'
        }
      });
      console.log(`✅ ${binary} installé avec succès`);
      return true;
    } catch (npmError) {
      // Si npm échoue, essayer avec yarn (fallback)
      console.log(`⚠️  Tentative avec yarn...`);
      try {
        execSync(`yarn add ${binary} --dev --ignore-optional=false --silent`, {
          cwd: projectRoot,
          stdio: 'pipe'
        });
        console.log(`✅ ${binary} installé avec succès (yarn)`);
        return true;
      } catch (yarnError) {
        // Les deux ont échoué, mais on ne fait pas échouer le build
        console.log(`⚠️  Impossible d'installer ${binary} automatiquement`);
        console.log(`   Le build pourrait fonctionner si Rollup peut utiliser un fallback`);
        return false;
      }
    }
  } catch (error) {
    console.log(`⚠️  Erreur lors de l'installation: ${error.message}`);
    return false;
  }
}

function main() {
  // Sur Vercel, on est toujours sur Linux
  // Vérifier uniquement si on est sur Linux (ou forcer l'installation sur Linux)
  if (platform === 'linux' && arch === 'x64') {
    const binary = '@rollup/rollup-linux-x64-gnu';
    
    // Vérifier si le binaire existe déjà
    if (checkBinaryExists(binary)) {
      console.log(`✅ ${binary} est déjà installé`);
      return;
    }
    
    // Installer le binaire
    installBinary(binary);
  } else if (platform === 'linux' && arch === 'arm64') {
    const binary = '@rollup/rollup-linux-arm64-gnu';
    
    if (checkBinaryExists(binary)) {
      console.log(`✅ ${binary} est déjà installé`);
      return;
    }
    
    installBinary(binary);
  } else {
    // Sur d'autres plateformes, utiliser le mapping
    const binary = getRollupBinary();
    if (binary) {
      if (checkBinaryExists(binary)) {
        console.log(`✅ ${binary} est déjà installé`);
        return;
      }
      installBinary(binary);
    } else {
      console.log(`ℹ️  Aucun binaire natif requis pour ${platform}-${arch}`);
    }
  }
}

// Exécuter le script
try {
  main();
} catch (error) {
  // Ne pas faire échouer l'installation si le script échoue
  // Le build pourrait quand même fonctionner
  console.log(`⚠️  Erreur dans postinstall (non bloquante): ${error.message}`);
  process.exit(0);
}

