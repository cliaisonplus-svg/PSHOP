<?php
/**
 * Script de correction pour la fonction checkSession
 * À utiliser pour tester et corriger les problèmes de session
 */

require_once 'config.php';
require_once 'auth.php';

header('Content-Type: application/json');

// Tester la fonction checkSession
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['test'])) {
    $sessionId = $_GET['sessionId'] ?? '';
    
    echo "=== Test de checkSession ===\n\n";
    echo "Session ID: " . ($sessionId ?: 'N/A') . "\n\n";
    
    if ($sessionId) {
        $_GET['action'] = 'check-session';
        checkSession();
    } else {
        echo "Veuillez fournir un sessionId en paramètre: ?test=1&sessionId=xxx\n";
    }
    exit;
}

?>

