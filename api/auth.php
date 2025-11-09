<?php
/**
 * API d'authentification
 * Gère la connexion, l'inscription et la réinitialisation de mot de passe
 */

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'login':
            handleLogin($data);
            break;
        case 'register':
            handleRegister($data);
            break;
        case 'reset-password':
            handleResetPassword($data);
            break;
        case 'logout':
            handleLogout();
            break;
        case 'check-session':
            checkSession();
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Action non valide']);
            break;
    }
} else if ($method === 'GET') {
    switch ($action) {
        case 'check-session':
            checkSession();
            break;
        case 'has-users':
            hasUsers();
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Action non valide']);
            break;
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}

// Fonction de hash de mot de passe (simple pour démo - utiliser password_hash en production)
function hashPassword($password) {
    return hash('sha256', $password);
}

// Vérifier le mot de passe
function verifyPassword($password, $hash) {
    return hashPassword($password) === $hash;
}

// Vérifier si des utilisateurs existent
function hasUsers() {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $result = $stmt->fetch();
        echo json_encode(['success' => true, 'hasUsers' => $result['count'] > 0]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

// Gérer la connexion
function handleLogin($data) {
    try {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs']);
            return;
        }
        
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([strtolower(trim($username))]);
        $user = $stmt->fetch();
        
        if (!$user || !verifyPassword($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Nom d\'utilisateur ou mot de passe incorrect']);
            return;
        }
        
        // Créer une session
        $sessionId = 'session-' . uniqid() . '-' . time();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        $stmt = $pdo->prepare("INSERT INTO sessions (id, user_id, username, created_at, expires_at) VALUES (?, ?, ?, NOW(), ?)");
        $stmt->execute([$sessionId, $user['id'], $user['username'], $expiresAt]);
        
        // Retourner la session dans la réponse
        echo json_encode([
            'success' => true,
            'message' => 'Connexion réussie',
            'session' => [
                'id' => $sessionId,
                'userId' => $user['id'],
                'username' => $user['username'],
                'expiresAt' => $expiresAt
            ],
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['name']
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

// Gérer l'inscription
function handleRegister($data) {
    try {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        $adminCode = $data['adminCode'] ?? '';
        
        if (empty($username) || empty($password) || empty($adminCode)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs']);
            return;
        }
        
        if (strlen($username) < 3) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Le nom d\'utilisateur doit contenir au moins 3 caractères']);
            return;
        }
        
        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Le mot de passe doit contenir au moins 6 caractères']);
            return;
        }
        
        if (trim($adminCode) !== 'pshopusercheck@manu') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Code admin incorrect']);
            return;
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si le nom d'utilisateur existe déjà
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([strtolower(trim($username))]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ce nom d\'utilisateur est déjà utilisé']);
            return;
        }
        
        // Créer l'utilisateur
        $userId = 'user-' . time() . '-' . uniqid();
        $hashedPassword = hashPassword($password);
        
        $stmt = $pdo->prepare("INSERT INTO users (id, username, password, name, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$userId, strtolower(trim($username)), $hashedPassword, trim($username)]);
        
        // Créer une session
        $sessionId = 'session-' . uniqid() . '-' . time();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        $stmt = $pdo->prepare("INSERT INTO sessions (id, user_id, username, created_at, expires_at) VALUES (?, ?, ?, NOW(), ?)");
        $stmt->execute([$sessionId, $userId, strtolower(trim($username)), $expiresAt]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Inscription réussie. Vous êtes maintenant connecté.',
            'session' => [
                'id' => $sessionId,
                'userId' => $userId,
                'username' => strtolower(trim($username)),
                'expiresAt' => $expiresAt
            ],
            'user' => [
                'id' => $userId,
                'username' => strtolower(trim($username)),
                'name' => trim($username)
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

// Gérer la réinitialisation du mot de passe
function handleResetPassword($data) {
    try {
        $username = $data['username'] ?? '';
        $newPassword = $data['newPassword'] ?? '';
        $adminCode = $data['adminCode'] ?? '';
        
        if (empty($username) || empty($newPassword) || empty($adminCode)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs']);
            return;
        }
        
        if (strlen($newPassword) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Le mot de passe doit contenir au moins 6 caractères']);
            return;
        }
        
        if (trim($adminCode) !== 'pshopusercheck@manu') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Code administrateur incorrect']);
            return;
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si l'utilisateur existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([strtolower(trim($username))]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Aucun compte trouvé avec ce nom d\'utilisateur']);
            return;
        }
        
        // Mettre à jour le mot de passe
        $hashedPassword = hashPassword($newPassword);
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->execute([$hashedPassword, $user['id']]);
        
        // Supprimer toutes les sessions de cet utilisateur
        $stmt = $pdo->prepare("DELETE FROM sessions WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        
        echo json_encode(['success' => true, 'message' => 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

// Vérifier la session
function checkSession() {
    try {
        $sessionId = $_GET['sessionId'] ?? $_SERVER['HTTP_X_SESSION_ID'] ?? '';
        
        if (empty($sessionId)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'authenticated' => false]);
            return;
        }
        
        $pdo = getDBConnection();
        
        // Nettoyer les sessions expirées
        $pdo->exec("DELETE FROM sessions WHERE expires_at < NOW()");
        
        // Vérifier la session
        $stmt = $pdo->prepare("SELECT s.*, u.name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > NOW()");
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch();
        
        if (!$session) {
            http_response_code(401);
            echo json_encode(['success' => false, 'authenticated' => false]);
            return;
        }
        
        echo json_encode([
            'success' => true,
            'authenticated' => true,
            'user' => [
                'id' => $session['user_id'],
                'username' => $session['username'],
                'name' => $session['name']
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

// Gérer la déconnexion
function handleLogout() {
    try {
        $sessionId = $_GET['sessionId'] ?? $_SERVER['HTTP_X_SESSION_ID'] ?? '';
        
        if (!empty($sessionId)) {
            $pdo = getDBConnection();
            $stmt = $pdo->prepare("DELETE FROM sessions WHERE id = ?");
            $stmt->execute([$sessionId]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Déconnexion réussie']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

?>

