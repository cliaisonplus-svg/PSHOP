<?php
/**
 * Configuration de la base de données
 */

// Désactiver l'affichage des erreurs en production
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuration de la base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'pshop');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Créer la connexion à la base de données
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Si la base de données n'existe pas, la créer
        if ($e->getCode() == 1049) {
            createDatabase();
            return getDBConnection();
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']);
        exit;
    }
}

// Créer la base de données et les tables
function createDatabase() {
    try {
        // Connexion sans spécifier la base de données
        $dsn = "mysql:host=" . DB_HOST . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Créer la base de données
        $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE " . DB_NAME);
        
        // Créer la table users
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at DATETIME NOT NULL,
            INDEX idx_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        
        // Créer la table sessions
        $pdo->exec("CREATE TABLE IF NOT EXISTS sessions (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            username VARCHAR(100) NOT NULL,
            created_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            INDEX idx_user_id (user_id),
            INDEX idx_expires_at (expires_at),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        
        // Créer la table products
        $pdo->exec("CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            prix_partenaire DECIMAL(15, 2) NOT NULL,
            prix_revente DECIMAL(15, 2) NOT NULL,
            marge DECIMAL(15, 2) NOT NULL,
            stock INT NOT NULL DEFAULT 0,
            photos LONGTEXT,
            specifications TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX idx_user_id (user_id),
            INDEX idx_category (category),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        
        // Vérifier et ajouter la colonne specifications si elle n'existe pas (migration)
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM products LIKE 'specifications'");
            if ($stmt->rowCount() === 0) {
                // Vérifier si photos existe pour placer specifications après
                $stmt2 = $pdo->query("SHOW COLUMNS FROM products LIKE 'photos'");
                if ($stmt2->rowCount() > 0) {
                    $pdo->exec("ALTER TABLE products ADD COLUMN specifications TEXT AFTER photos");
                } else {
                    $pdo->exec("ALTER TABLE products ADD COLUMN specifications TEXT");
                }
            }
        } catch (PDOException $e) {
            // La colonne existe déjà ou erreur, continuer
            error_log("Note: Colonne specifications - " . $e->getMessage());
        }
        
        // Modifier le type de photos en LONGTEXT si nécessaire (migration)
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM products LIKE 'photos'");
            if ($stmt->rowCount() > 0) {
                $pdo->exec("ALTER TABLE products MODIFY COLUMN photos LONGTEXT");
            } else {
                // Si photos n'existe pas, la créer
                $pdo->exec("ALTER TABLE products ADD COLUMN photos LONGTEXT");
            }
        } catch (PDOException $e) {
            // Ignorer si déjà modifié ou erreur
            error_log("Note: Colonne photos - " . $e->getMessage());
        }
        
        // Créer la table sales
        $pdo->exec("CREATE TABLE IF NOT EXISTS sales (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            product_id VARCHAR(255),
            product_name VARCHAR(255) NOT NULL,
            quantity INT NOT NULL,
            price DECIMAL(15, 2) NOT NULL,
            total DECIMAL(15, 2) NOT NULL,
            profit DECIMAL(15, 2) NOT NULL,
            client_name VARCHAR(255),
            client_phone VARCHAR(50),
            sale_date DATETIME NOT NULL,
            created_at DATETIME NOT NULL,
            INDEX idx_user_id (user_id),
            INDEX idx_sale_date (sale_date),
            INDEX idx_product_id (product_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        
        // Créer la table expenses
        $pdo->exec("CREATE TABLE IF NOT EXISTS expenses (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            amount DECIMAL(15, 2) NOT NULL,
            category VARCHAR(100) NOT NULL,
            supplier VARCHAR(255),
            description TEXT,
            expense_date DATETIME NOT NULL,
            created_at DATETIME NOT NULL,
            INDEX idx_user_id (user_id),
            INDEX idx_expense_date (expense_date),
            INDEX idx_category (category),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        
        // Créer la table themes
        $pdo->exec("CREATE TABLE IF NOT EXISTS themes (
            user_id VARCHAR(255) PRIMARY KEY,
            theme_data TEXT NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        
        return true;
    } catch (PDOException $e) {
        error_log("Erreur lors de la création de la base de données: " . $e->getMessage());
        return false;
    }
}

// Fonction pour vérifier et corriger la structure de la table products
function ensureProductsTableStructure() {
    try {
        $pdo = getDBConnection();
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Vérifier si la table products existe
        $stmt = $pdo->query("SHOW TABLES LIKE 'products'");
        if ($stmt->rowCount() === 0) {
            // La table n'existe pas, elle sera créée par createDatabase()
            return;
        }
        
        // Vérifier les colonnes existantes
        $stmt = $pdo->query("SHOW COLUMNS FROM products");
        $columns = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'Field');
        
        // Ajouter specifications si elle n'existe pas
        if (!in_array('specifications', $columns)) {
            if (in_array('photos', $columns)) {
                $pdo->exec("ALTER TABLE products ADD COLUMN specifications TEXT AFTER photos");
            } else {
                $pdo->exec("ALTER TABLE products ADD COLUMN specifications TEXT");
            }
            error_log("Colonne 'specifications' ajoutée à la table products");
        }
        
        // Vérifier et modifier le type de photos si nécessaire
        if (in_array('photos', $columns)) {
            $stmt = $pdo->query("SHOW COLUMNS FROM products WHERE Field = 'photos'");
            $photoColumn = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($photoColumn && strpos(strtolower($photoColumn['Type']), 'longtext') === false) {
                $pdo->exec("ALTER TABLE products MODIFY COLUMN photos LONGTEXT");
                error_log("Type de 'photos' modifié en LONGTEXT");
            }
        } else {
            $pdo->exec("ALTER TABLE products ADD COLUMN photos LONGTEXT");
            error_log("Colonne 'photos' ajoutée à la table products");
        }
    } catch (PDOException $e) {
        error_log("Erreur lors de la vérification de la structure de products: " . $e->getMessage());
    }
}

// Initialiser la base de données au premier accès
try {
    getDBConnection();
    // Vérifier et corriger la structure de la table products
    ensureProductsTableStructure();
} catch (Exception $e) {
    error_log("Erreur lors de l'initialisation: " . $e->getMessage());
}

?>

