# Guide de gestion des images

## Problèmes résolus

### 1. Capture photo
- **Sur mobile (Android/iOS)** : Utilisation directe de l'input file avec l'attribut `capture="environment"` qui ouvre automatiquement l'application caméra
- **Sur desktop (Windows)** : Utilisation de l'API MediaDevices.getUserMedia() si disponible et en contexte sécurisé (HTTPS ou localhost)
- **Fallback** : Si getUserMedia n'est pas disponible, utilisation de l'input file classique

### 2. Sauvegarde des images
- Les images sont converties en base64 (data URL)
- Compression automatique des images (qualité 0.7, max 1920x1920)
- Limitation de la taille totale à 10 MB pour toutes les photos
- Stockage dans la base de données MySQL (champ `photos` de type LONGTEXT)
- Validation des photos avant sauvegarde

### 3. Affichage des images
- Les images sont récupérées depuis la base de données
- Filtrage des images invalides ou vides
- Gestion des erreurs de chargement avec image par défaut
- Affichage dans le carousel et les cartes de produits

## Utilisation

### Ajouter des photos à un produit
1. Cliquez sur "Choisir un fichier" pour sélectionner des images depuis votre appareil
2. Ou cliquez sur "Prendre une photo" pour utiliser la caméra
3. Les photos sont automatiquement compressées et affichées en aperçu
4. Vous pouvez supprimer des photos en cliquant sur le bouton ×
5. Cliquez sur "Enregistrer le produit" pour sauvegarder

### Sur mobile
- Le bouton "Prendre une photo" ouvre directement l'application caméra
- Vous pouvez prendre plusieurs photos successives
- Les photos sont automatiquement ajoutées au produit

### Sur desktop
- Si vous êtes en HTTPS ou localhost, le bouton "Prendre une photo" ouvre une modale avec la webcam
- Sinon, utilisez le bouton "Choisir un fichier" pour sélectionner des images

## Notes importantes

1. **HTTPS requis pour getUserMedia** : L'API MediaDevices.getUserMedia() nécessite un contexte sécurisé (HTTPS ou localhost). Si vous n'êtes pas en HTTPS, utilisez le bouton "Choisir un fichier".

2. **Taille des images** : Les images sont automatiquement compressées pour réduire leur taille. La taille maximale recommandée est de 5 MB par image avant compression.

3. **Nombre de photos** : Minimum 3 photos pour un nouveau produit, maximum 6 photos par produit.

4. **Format des images** : Les formats supportés sont JPEG, PNG et WebP.

5. **Base de données** : Les images sont stockées en base64 dans la base de données MySQL. Le champ `photos` est de type LONGTEXT pour supporter les grandes images.

## Migration de la base de données

Si vous avez une base de données existante, exécutez le script de migration :
```bash
php api/migrate.php
```

Ou accédez à `http://localhost/PSHOP/api/migrate.php` dans votre navigateur.

Ce script va :
- Ajouter la colonne `specifications` si elle n'existe pas
- Modifier le type de la colonne `photos` en LONGTEXT

## Dépannage

### Les images ne s'affichent pas
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que les images sont bien sauvegardées dans la base de données
3. Vérifiez que le champ `photos` est de type LONGTEXT

### La capture photo ne fonctionne pas
1. Sur mobile : Vérifiez que l'attribut `capture="environment"` est présent dans l'input file
2. Sur desktop : Vérifiez que vous êtes en HTTPS ou localhost
3. Vérifiez que votre navigateur supporte l'API MediaDevices

### Les images ne sont pas sauvegardées
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez les logs PHP (error_log)
3. Vérifiez que la taille des images n'est pas trop grande (max 10 MB total)

