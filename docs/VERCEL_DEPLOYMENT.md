# Guide de déploiement sur Vercel

## ⚠️ Important : Limitations

**Vercel ne supporte pas PHP nativement.** L'API PHP (`api/`) ne fonctionnera **pas** sur Vercel.

### Options pour l'API

1. **Convertir l'API PHP en Serverless Functions Node.js** (recommandé)
2. **Héberger l'API PHP ailleurs** (ex: Railway, Heroku, ou un serveur VPS)
3. **Utiliser Vercel avec un runtime PHP custom** (complexe)

## Configuration actuelle

### Fichiers de configuration

- `vercel.json` : Configuration Vercel pour le routage et les headers
- `vite.config.js` : Configuration Vite pour builder tous les fichiers HTML
- `.nvmrc` : Version Node.js (18)

### Pages HTML

L'application est une **multi-page application (MPA)** avec les pages suivantes :
- `index.html` (page d'accueil)
- `login.html`
- `register.html`
- `reset-password.html`
- `ajouter.html`
- `produit.html`
- `personnaliser.html`
- `ventes.html`
- `depenses.html`
- `dashboard.html`

### Routage

Les routes sont configurées dans `vercel.json` pour mapper les URLs propres vers les fichiers HTML :
- `/login` → `/login.html`
- `/register` → `/register.html`
- etc.

## Build

Le build Vite :
1. Compile tous les fichiers HTML définis dans `rollupOptions.input`
2. Copie les fichiers CSS dans `dist/css/`
3. Génère les assets JavaScript dans `dist/assets/`

## Déploiement

1. **Pousser le code sur GitHub/GitLab/Bitbucket**
2. **Connecter le dépôt à Vercel**
3. **Configurer les variables d'environnement** (si nécessaire)
4. **Déployer**

Vercel détectera automatiquement :
- Le framework Vite
- La version Node.js depuis `.nvmrc`
- La commande de build depuis `package.json`

## Problèmes connus

### 404 NOT_FOUND

Si vous obtenez une erreur 404 :
1. Vérifiez que tous les fichiers HTML sont listés dans `vite.config.js`
2. Vérifiez que le build s'est bien exécuté (voir les logs Vercel)
3. Vérifiez que les fichiers sont bien dans `dist/` après le build

### API PHP ne fonctionne pas

C'est normal - Vercel ne supporte pas PHP. Vous devez :
1. Convertir l'API en Serverless Functions Node.js
2. Ou héberger l'API ailleurs et mettre à jour `API_BASE_URL` dans `js/api.js`

## Solutions recommandées

### Option 1 : Convertir l'API en Serverless Functions

Créez un dossier `api/` avec des fonctions serverless Node.js qui remplacent les fichiers PHP.

### Option 2 : API externe

1. Hébergez l'API PHP sur un autre service (Railway, Heroku, VPS)
2. Mettez à jour `API_BASE_URL` dans `js/api.js` :
   ```javascript
   const API_BASE_URL = 'https://votre-api.exemple.com/api';
   ```

### Option 3 : Utiliser un backend-as-a-service

Utilisez Firebase, Supabase, ou un autre BaaS pour remplacer l'API PHP.

## Test local

Pour tester le build localement :

```bash
# Build
yarn build

# Vérifier que les fichiers sont dans dist/
ls dist/

# Prévisualiser (nécessite un serveur local)
yarn preview
```

## Support

Si vous avez des questions ou des problèmes :
1. Vérifiez les logs de build sur Vercel
2. Vérifiez la documentation Vercel : https://vercel.com/docs
3. Vérifiez la documentation Vite : https://vitejs.dev

