<?php
/**
 * Script rapide pour ajouter la colonne specifications à la table products
 * À exécuter manuellement si nécessaire
 */

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

try {
    $pdo = getDBConnection();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Correction de la table products</h2>";
    echo "<pre>";
    
    // Vérifier si la colonne specifications existe
    $stmt = $pdo->query("SHOW COLUMNS FROM products");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Colonnes actuelles: " . implode(', ', $columns) . "\n\n";
    
    if (!in_array('specifications', $columns)) {
        echo "La colonne 'specifications' n'existe pas. Ajout en cours...\n";
        
        // Vérifier si la colonne photos existe pour savoir où placer specifications
        if (in_array('photos', $columns)) {
            $pdo->exec("ALTER TABLE products ADD COLUMN specifications TEXT AFTER photos");
            echo "✓ Colonne 'specifications' ajoutée après 'photos'\n";
        } else {
            $pdo->exec("ALTER TABLE products ADD COLUMN specifications TEXT");
            echo "✓ Colonne 'specifications' ajoutée\n";
        }
    } else {
        echo "✓ La colonne 'specifications' existe déjà\n";
    }
    
    // Vérifier et modifier le type de photos
    if (in_array('photos', $columns)) {
        $stmt = $pdo->query("SHOW COLUMNS FROM products WHERE Field = 'photos'");
        $photoColumn = $stmt->fetch();
        echo "\nType actuel de 'photos': " . $photoColumn['Type'] . "\n";
        
        if (strpos(strtolower($photoColumn['Type']), 'longtext') === false) {
            $pdo->exec("ALTER TABLE products MODIFY COLUMN photos LONGTEXT");
            echo "✓ Type de 'photos' modifié en LONGTEXT\n";
        } else {
            echo "✓ Le type de 'photos' est déjà LONGTEXT\n";
        }
    } else {
        echo "\nLa colonne 'photos' n'existe pas. Ajout en cours...\n";
        $pdo->exec("ALTER TABLE products ADD COLUMN photos LONGTEXT");
        echo "✓ Colonne 'photos' ajoutée avec le type LONGTEXT\n";
    }
    
    // Afficher la structure finale
    echo "\n=== Structure finale de la table products ===\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM products");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $column) {
        echo sprintf("%-20s %-20s %s\n", $column['Field'], $column['Type'], $column['Null'] === 'YES' ? 'NULL' : 'NOT NULL');
    }
    
    echo "\n✓ Correction terminée avec succès!\n";
    echo "</pre>";
    echo "<p><a href='../index.html'>Retour à l'application</a></p>";
    
} catch (Exception $e) {
    echo "<pre>";
    echo "✗ Erreur: " . $e->getMessage() . "\n";
    echo "</pre>";
}

?>

