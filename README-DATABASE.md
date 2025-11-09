# Configuration de la Base de Données

## Installation

1. **Créer la base de données MySQL**
   - Ouvrez phpMyAdmin (http://localhost/phpmyadmin)
   - La base de données `pshop` sera créée automatiquement au premier accès

2. **Configuration**
   - Modifiez `api/config.php` si nécessaire :
     - `DB_HOST`: localhost (par défaut)
     - `DB_NAME`: pshop (par défaut)
     - `DB_USER`: root (par défaut pour WAMP)
     - `DB_PASS`: '' (vide par défaut pour WAMP)

## Structure de la Base de Données

### Table `users`
- `id`: ID unique de l'utilisateur
- `username`: Nom d'utilisateur (unique)
- `password`: Mot de passe hashé
- `name`: Nom de l'utilisateur
- `created_at`: Date de création

### Table `sessions`
- `id`: ID de session
- `user_id`: ID de l'utilisateur (clé étrangère)
- `username`: Nom d'utilisateur
- `created_at`: Date de création
- `expires_at`: Date d'expiration (24 heures)

### Table `products`
- `id`: ID unique du produit
- `user_id`: ID de l'utilisateur (clé étrangère)
- `name`: Nom du produit
- `description`: Description
- `category`: Catégorie
- `prix_partenaire`: Prix partenaire
- `prix_revente`: Prix de revente
- `marge`: Marge
- `stock`: Stock
- `photos`: Photos (JSON)
- `created_at`: Date de création
- `updated_at`: Date de mise à jour

### Table `sales`
- `id`: ID unique de la vente
- `user_id`: ID de l'utilisateur (clé étrangère)
- `product_id`: ID du produit
- `product_name`: Nom du produit
- `quantity`: Quantité
- `price`: Prix unitaire
- `total`: Total
- `profit`: Profit
- `client_name`: Nom du client
- `client_phone`: Téléphone du client
- `sale_date`: Date de vente
- `created_at`: Date de création

### Table `expenses`
- `id`: ID unique de la dépense
- `user_id`: ID de l'utilisateur (clé étrangère)
- `amount`: Montant
- `category`: Catégorie
- `supplier`: Fournisseur
- `description`: Description
- `expense_date`: Date de dépense
- `created_at`: Date de création

### Table `themes`
- `user_id`: ID de l'utilisateur (clé primaire et étrangère)
- `theme_data`: Données du thème (JSON)
- `updated_at`: Date de mise à jour

## Migration depuis localStorage

Pour migrer les données existantes de localStorage vers la base de données :

1. Les données seront automatiquement migrées lors de la première connexion
2. Tous les utilisateurs doivent se reconnecter après la migration
3. Les données sont isolées par utilisateur via `user_id`

## Sécurité

- Toutes les requêtes utilisent des requêtes préparées (protection contre les injections SQL)
- Les mots de passe sont hashés avec SHA-256 (considérez l'utilisation de bcrypt en production)
- Les sessions expirent après 24 heures
- Chaque utilisateur ne peut accéder qu'à ses propres données

## Isolation des Données

Toutes les requêtes sont filtrées par `user_id` pour garantir que chaque utilisateur ne peut accéder qu'à ses propres données :
- Produits
- Ventes
- Dépenses
- Thèmes

## API Endpoints

### Authentification (`api/auth.php`)
- `POST ?action=login`: Connexion
- `POST ?action=register`: Inscription
- `POST ?action=reset-password`: Réinitialisation du mot de passe
- `POST ?action=logout`: Déconnexion
- `GET ?action=check-session`: Vérifier la session
- `GET ?action=has-users`: Vérifier s'il existe des utilisateurs

### Données (`api/data.php`)
- `GET ?resource=products`: Obtenir les produits
- `POST ?resource=products`: Créer un produit
- `PUT ?resource=products&id=...`: Mettre à jour un produit
- `DELETE ?resource=products&id=...`: Supprimer un produit
- `GET ?resource=sales`: Obtenir les ventes
- `POST ?resource=sales`: Créer une vente
- `GET ?resource=expenses`: Obtenir les dépenses
- `POST ?resource=expenses`: Créer une dépense
- `DELETE ?resource=expenses&id=...`: Supprimer une dépense
- `GET ?resource=theme`: Obtenir le thème
- `POST ?resource=theme`: Sauvegarder le thème
- `GET ?resource=stats`: Obtenir les statistiques

Toutes les requêtes nécessitent un header `X-Session-Id` avec l'ID de session valide.

