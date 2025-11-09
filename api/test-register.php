<?php
/**
 * Script de test pour l'API d'inscription
 * Permet de tester directement l'API sans passer par le frontend
 */

require_once 'config.php';

header('Content-Type: application/json');

// Simuler les données d'inscription
$testData = [
    'username' => 'testuser',
    'password' => 'testpass123',
    'adminCode' => 'pshopusercheck@manu'
];

echo "=== Test de l'API d'inscription ===\n\n";

// Test 1: Vérifier la connexion à la base de données
echo "1. Test de connexion à la base de données...\n";
try {
    $pdo = getDBConnection();
    echo "✓ Connexion réussie\n\n";
} catch (Exception $e) {
    echo "✗ Erreur de connexion: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 2: Vérifier que la table users existe
echo "2. Vérification de la table users...\n";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() > 0) {
        echo "✓ Table users existe\n\n";
    } else {
        echo "✗ Table users n'existe pas\n\n";
        exit(1);
    }
} catch (Exception $e) {
    echo "✗ Erreur: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 3: Vérifier la structure de la table users
echo "3. Vérification de la structure de la table users...\n";
try {
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Colonnes: " . implode(', ', $columns) . "\n";
    $requiredColumns = ['id', 'username', 'password', 'name', 'created_at'];
    $missingColumns = array_diff($requiredColumns, $columns);
    if (empty($missingColumns)) {
        echo "✓ Toutes les colonnes nécessaires existent\n\n";
    } else {
        echo "✗ Colonnes manquantes: " . implode(', ', $missingColumns) . "\n\n";
        exit(1);
    }
} catch (Exception $e) {
    echo "✗ Erreur: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 4: Tester l'inscription via une requête HTTP simulée
echo "4. Test de l'inscription via API...\n";

// Préparer les données pour la requête
$postData = json_encode($testData);

// Créer un contexte de flux pour simuler une requête POST
$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
            'Content-Length: ' . strlen($postData)
        ],
        'content' => $postData
    ]
]);

// Faire une requête à auth.php
$url = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['SCRIPT_NAME']) . '/auth.php?action=register';
echo "URL: $url\n";

try {
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        echo "✗ Impossible de contacter l'API\n";
        echo "  Vérifiez que le serveur web est démarré et que auth.php est accessible\n";
    } else {
        echo "Réponse: " . $response . "\n\n";
        
        $responseData = json_decode($response, true);
        if ($responseData && $responseData['success']) {
            echo "✓ Inscription réussie!\n";
            echo "  User ID: " . ($responseData['user']['id'] ?? 'N/A') . "\n";
            echo "  Username: " . ($responseData['user']['username'] ?? 'N/A') . "\n";
        } else {
            echo "✗ Échec de l'inscription: " . ($responseData['message'] ?? 'Erreur inconnue') . "\n";
            if (isset($responseData['error'])) {
                echo "  Erreur détaillée: " . $responseData['error'] . "\n";
            }
        }
    }
} catch (Exception $e) {
    echo "✗ Erreur: " . $e->getMessage() . "\n";
}

echo "\n=== Fin du test ===\n";

?>

