# PSHOP - Gestion de Produits Informatiques

Application web pour gérer un catalogue de produits informatiques avec gestion de stock, filtres, et personnalisation de thème.

## 🚀 Installation et Démarrage

### Option 1 : Avec WAMP (Recommandé pour Windows)

1. **Vérifier que WAMP est installé et démarré**
   - Le serveur Apache doit être actif (icône verte dans la barre des tâches)

2. **Placer le projet dans le répertoire www de WAMP**
   - Le projet est déjà dans `C:\wamp64\www\PSHOP`

3. **Accéder à l'application**
   - Ouvrez votre navigateur
   - Accédez à : `http://localhost/PSHOP/` ou `http://localhost/PSHOP/index.html`
   - L'application fonctionne **sans connexion internet** une fois chargée

### Option 2 : Avec Vite (Serveur de développement)

1. **Installer les dépendances** (si nécessaire)
   ```bash
   npm install
   # ou
   yarn install
   ```

2. **Lancer le serveur de développement**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

3. **Accéder à l'application**
   - Le serveur se lance automatiquement sur `http://localhost:3000`

## 📋 Fonctionnalités

- ✅ Gestion de produits (ajout, modification, suppression)
- ✅ Filtrage par catégorie et prix
- ✅ Recherche par nom
- ✅ Export/Import de données JSON
- ✅ Personnalisation de thème (couleurs, mode sombre)
- ✅ Carousel d'images pour les produits
- ✅ Stockage local (localStorage)
- ✅ Responsive design

## 🗂️ Structure du projet

```
PSHOP/
├── index.html          # Page d'accueil (liste des produits)
├── ajouter.html        # Formulaire d'ajout/édition
├── produit.html        # Détail d'un produit
├── personnaliser.html  # Personnalisation du thème
├── css/               # Fichiers CSS
│   ├── theme.css
│   ├── style.css
│   ├── grid.css
│   ├── form.css
│   └── responsive.css
├── js/                # Fichiers JavaScript
│   ├── main.js        # Logique principale
│   ├── produit.js     # Gestion des produits
│   ├── storage.js     # Gestion du localStorage
│   ├── ui.js          # Interface utilisateur (icônes, thème)
│   ├── carousel.js    # Carousel d'images
│   └── utils.js       # Utilitaires
├── data/              # Données
│   └── produits.json  # Données initiales
└── .htaccess          # Configuration Apache
```

## 🔧 Configuration

### Configuration WAMP

Le fichier `.htaccess` est configuré pour :
- Servir correctement les modules ES6
- Définir les types MIME appropriés
- Activer la compression
- Gérer le cache des fichiers statiques

Si le projet est dans un sous-dossier, vous pouvez ajuster `RewriteBase` dans `.htaccess`.

### Fonctionnement hors ligne

L'application fonctionne **complètement hors ligne** après le premier chargement :
- ✅ Pas de dépendances externes (polices système)
- ✅ Images placeholder intégrées (SVG base64)
- ✅ Stockage local (localStorage)
- ✅ Pas de CDN externe

## 📝 Notes

- Les données sont stockées dans le `localStorage` du navigateur
- Les données initiales sont chargées depuis `data/produits.json`
- Les images des produits sont stockées en base64 dans le localStorage
- Le thème personnalisé est sauvegardé dans le localStorage

## 🌐 Compatibilité

- Navigateurs modernes supportant ES6 modules
- Chrome, Firefox, Edge, Safari (versions récentes)
- Fonctionne sur Windows, macOS, Linux

## 📄 Licence

Ce projet est privé.
