<?php
/**
 * Script de migration pour mettre à jour la base de données
 * Ajoute les colonnes manquantes et modifie les types de colonnes
 */

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = getDBConnection();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $migrations = [];
    
    // Vérifier si la colonne specifications existe
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM products");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (!in_array('specifications', $columns)) {
            // Vérifier si la colonne photos existe pour savoir où placer specifications
            if (in_array('photos', $columns)) {
                $pdo->exec("ALTER TABLE products ADD COLUMN specifications TEXT AFTER photos");
            } else {
                $pdo->exec("ALTER TABLE products ADD COLUMN specifications TEXT");
            }
            $migrations[] = "Colonne 'specifications' ajoutée avec succès";
        } else {
            $migrations[] = "Colonne 'specifications' existe déjà";
        }
    } catch (PDOException $e) {
        // Si la table n'existe pas, créer la colonne avec la table
        if (strpos($e->getMessage(), "doesn't exist") !== false || strpos($e->getMessage(), "n'existe pas") !== false) {
            $migrations[] = "Erreur: La table 'products' n'existe pas. Veuillez d'abord créer la table.";
        } else {
            $migrations[] = "Erreur lors de la vérification/ajout de la colonne 'specifications': " . $e->getMessage();
        }
    }
    
    // Modifier le type de photos en LONGTEXT si elle existe
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM products LIKE 'photos'");
        if ($stmt->rowCount() > 0) {
            $pdo->exec("ALTER TABLE products MODIFY COLUMN photos LONGTEXT");
            $migrations[] = "Type de colonne 'photos' modifié en LONGTEXT";
        } else {
            // Si la colonne photos n'existe pas, la créer
            $pdo->exec("ALTER TABLE products ADD COLUMN photos LONGTEXT");
            $migrations[] = "Colonne 'photos' créée avec le type LONGTEXT";
        }
    } catch (PDOException $e) {
        $migrations[] = "Erreur lors de la modification/création de 'photos': " . $e->getMessage();
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Migration terminée',
        'migrations' => $migrations
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la migration: ' . $e->getMessage()
    ]);
}

?>

