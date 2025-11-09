<?php
/**
 * API de gestion des données (produits, ventes, dépenses, thèmes)
 */

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Session-Id');

// Gérer les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier la session
function verifySession() {
    $sessionId = $_GET['sessionId'] ?? $_SERVER['HTTP_X_SESSION_ID'] ?? '';
    
    if (empty($sessionId)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Session non valide']);
        exit;
    }
    
    try {
        $pdo = getDBConnection();
        
        // Nettoyer les sessions expirées
        $pdo->exec("DELETE FROM sessions WHERE expires_at < NOW()");
        
        // Vérifier la session
        $stmt = $pdo->prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > NOW()");
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch();
        
        if (!$session) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Session expirée ou invalide']);
            exit;
        }
        
        return $session['user_id'];
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? '';
$userId = verifySession();

if ($method === 'GET') {
    switch ($resource) {
        case 'products':
            getProducts($userId);
            break;
        case 'sales':
            getSales($userId);
            break;
        case 'expenses':
            getExpenses($userId);
            break;
        case 'theme':
            getTheme($userId);
            break;
        case 'stats':
            getStats($userId);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ressource non valide']);
            break;
    }
} else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($resource) {
        case 'products':
            createProduct($userId, $data);
            break;
        case 'sales':
            createSale($userId, $data);
            break;
        case 'expenses':
            createExpense($userId, $data);
            break;
        case 'theme':
            saveTheme($userId, $data);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ressource non valide']);
            break;
    }
} else if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'] ?? '';
    
    switch ($resource) {
        case 'products':
            updateProduct($userId, $id, $data);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ressource non valide']);
            break;
    }
} else if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    
    switch ($resource) {
        case 'products':
            deleteProduct($userId, $id);
            break;
        case 'expenses':
            deleteExpense($userId, $id);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ressource non valide']);
            break;
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}

// === PRODUITS ===

function getProducts($userId) {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $products = $stmt->fetchAll();
        
        // Convertir les photos (JSON) en tableau et les spécifications
        foreach ($products as &$product) {
            $photosJson = $product['photos'] ?? null;
            
            // Si photos est vide, null ou 'null', utiliser un tableau vide
            if (empty($photosJson) || $photosJson === 'null' || $photosJson === null) {
                $product['photos'] = [];
            } else {
                $decodedPhotos = json_decode($photosJson, true);
                // Vérifier que le décodage a réussi et que c'est un tableau
                if (json_last_error() === JSON_ERROR_NONE && is_array($decodedPhotos)) {
                    // Filtrer les photos vides ou invalides
                    $product['photos'] = array_filter($decodedPhotos, function($photo) {
                        return !empty($photo) && is_string($photo) && strlen(trim($photo)) > 50;
                    });
                    // Réindexer le tableau
                    $product['photos'] = array_values($product['photos']);
                } else {
                    error_log("Erreur de décodage JSON pour les photos du produit " . ($product['id'] ?? 'unknown') . ": " . json_last_error_msg());
                    $product['photos'] = [];
                }
            }
            
            // Convertir les spécifications
            $specsJson = $product['specifications'] ?? null;
            if (empty($specsJson) || $specsJson === 'null' || $specsJson === null) {
                $product['specifications'] = [];
            } else {
                $decodedSpecs = json_decode($specsJson, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decodedSpecs)) {
                    $product['specifications'] = $decodedSpecs;
                } else {
                    error_log("Erreur de décodage JSON pour les spécifications du produit " . ($product['id'] ?? 'unknown') . ": " . json_last_error_msg());
                    $product['specifications'] = [];
                }
            }
            
            $product['prix_partenaire'] = (float)$product['prix_partenaire'];
            $product['prix_revente'] = (float)$product['prix_revente'];
            $product['marge'] = (float)$product['marge'];
            $product['stock'] = (int)$product['stock'];
        }
        
        echo json_encode(['success' => true, 'data' => $products]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("Erreur getProducts: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

function createProduct($userId, $data) {
    try {
        $pdo = getDBConnection();
        
        $id = $data['id'] ?? 'product-' . time() . '-' . uniqid();
        $name = $data['name'] ?? '';
        $description = $data['description'] ?? '';
        $category = $data['category'] ?? '';
        $prixPartenaire = $data['prixPartenaire'] ?? 0;
        $prixRevente = $data['prixRevente'] ?? 0;
        $marge = $data['marge'] ?? 0;
        $stock = $data['stock'] ?? 0;
        $photosArray = $data['photos'] ?? [];
        
        // Vérifier que les photos sont bien un tableau
        if (!is_array($photosArray)) {
            $photosArray = [];
        }
        
        // Filtrer les photos vides
        $photosArray = array_filter($photosArray, function($photo) {
            return !empty($photo) && is_string($photo) && strlen(trim($photo)) > 100;
        });
        
        $photos = json_encode(array_values($photosArray), JSON_UNESCAPED_SLASHES);
        $specifications = json_encode($data['specifications'] ?? [], JSON_UNESCAPED_SLASHES);
        
        // Vérifier la taille des photos (LONGTEXT peut stocker jusqu'à 4GB)
        $photosLength = strlen($photos);
        if ($photosLength > 16 * 1024 * 1024) { // 16 MB max pour les photos JSON
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Les photos sont trop volumineuses (max 16 MB)']);
            return;
        }
        
        $stmt = $pdo->prepare("INSERT INTO products (id, user_id, name, description, category, prix_partenaire, prix_revente, marge, stock, photos, specifications, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        $stmt->execute([$id, $userId, $name, $description, $category, $prixPartenaire, $prixRevente, $marge, $stock, $photos, $specifications]);
        
        echo json_encode(['success' => true, 'message' => 'Produit créé avec succès', 'id' => $id, 'photosCount' => count($photosArray)]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("Erreur createProduct: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

function updateProduct($userId, $id, $data) {
    try {
        $pdo = getDBConnection();
        
        // Vérifier que le produit appartient à l'utilisateur
        $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Produit non trouvé']);
            return;
        }
        
        $name = $data['name'] ?? '';
        $description = $data['description'] ?? '';
        $category = $data['category'] ?? '';
        $prixPartenaire = $data['prixPartenaire'] ?? 0;
        $prixRevente = $data['prixRevente'] ?? 0;
        $marge = $data['marge'] ?? 0;
        $stock = $data['stock'] ?? 0;
        $photosArray = $data['photos'] ?? [];
        
        // Vérifier que les photos sont bien un tableau
        if (!is_array($photosArray)) {
            $photosArray = [];
        }
        
        // Filtrer les photos vides
        $photosArray = array_filter($photosArray, function($photo) {
            return !empty($photo) && is_string($photo) && strlen(trim($photo)) > 100;
        });
        
        $photos = json_encode(array_values($photosArray), JSON_UNESCAPED_SLASHES);
        $specifications = json_encode($data['specifications'] ?? [], JSON_UNESCAPED_SLASHES);
        
        // Vérifier la taille des photos
        $photosLength = strlen($photos);
        if ($photosLength > 16 * 1024 * 1024) { // 16 MB max
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Les photos sont trop volumineuses (max 16 MB)']);
            return;
        }
        
        $stmt = $pdo->prepare("UPDATE products SET name = ?, description = ?, category = ?, prix_partenaire = ?, prix_revente = ?, marge = ?, stock = ?, photos = ?, specifications = ?, updated_at = NOW() WHERE id = ? AND user_id = ?");
        $stmt->execute([$name, $description, $category, $prixPartenaire, $prixRevente, $marge, $stock, $photos, $specifications, $id, $userId]);
        
        echo json_encode(['success' => true, 'message' => 'Produit mis à jour avec succès', 'photosCount' => count($photosArray)]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("Erreur updateProduct: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

function deleteProduct($userId, $id) {
    try {
        $pdo = getDBConnection();
        
        // Vérifier que le produit appartient à l'utilisateur
        $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Produit non trouvé']);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        
        echo json_encode(['success' => true, 'message' => 'Produit supprimé avec succès']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

// === VENTES ===

function getSales($userId) {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT * FROM sales WHERE user_id = ? ORDER BY sale_date DESC");
        $stmt->execute([$userId]);
        $sales = $stmt->fetchAll();
        
        foreach ($sales as &$sale) {
            $sale['quantity'] = (int)$sale['quantity'];
            $sale['price'] = (float)$sale['price'];
            $sale['total'] = (float)$sale['total'];
            $sale['profit'] = (float)$sale['profit'];
        }
        
        echo json_encode(['success' => true, 'data' => $sales]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

function createSale($userId, $data) {
    try {
        $pdo = getDBConnection();
        
        $id = $data['id'] ?? 'sale-' . time() . '-' . uniqid();
        $productId = $data['productId'] ?? null;
        $productName = $data['productName'] ?? '';
        $quantity = $data['quantity'] ?? 1;
        $price = $data['price'] ?? 0;
        $total = $data['total'] ?? 0;
        $profit = $data['profit'] ?? 0;
        $clientName = $data['clientName'] ?? '';
        $clientPhone = $data['clientPhone'] ?? '';
        $saleDate = $data['saleDate'] ?? date('Y-m-d H:i:s');
        
        $stmt = $pdo->prepare("INSERT INTO sales (id, user_id, product_id, product_name, quantity, price, total, profit, client_name, client_phone, sale_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$id, $userId, $productId, $productName, $quantity, $price, $total, $profit, $clientName, $clientPhone, $saleDate]);
        
        // Mettre à jour le stock du produit si un productId est fourni
        if ($productId) {
            $stmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$quantity, $productId, $userId]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Vente enregistrée avec succès', 'id' => $id]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

// === DÉPENSES ===

function getExpenses($userId) {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC");
        $stmt->execute([$userId]);
        $expenses = $stmt->fetchAll();
        
        foreach ($expenses as &$expense) {
            $expense['amount'] = (float)$expense['amount'];
        }
        
        echo json_encode(['success' => true, 'data' => $expenses]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

function createExpense($userId, $data) {
    try {
        $pdo = getDBConnection();
        
        $id = $data['id'] ?? 'expense-' . time() . '-' . uniqid();
        $amount = $data['amount'] ?? 0;
        $category = $data['category'] ?? '';
        $supplier = $data['supplier'] ?? '';
        $description = $data['description'] ?? '';
        $expenseDate = $data['expenseDate'] ?? date('Y-m-d H:i:s');
        
        $stmt = $pdo->prepare("INSERT INTO expenses (id, user_id, amount, category, supplier, description, expense_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$id, $userId, $amount, $category, $supplier, $description, $expenseDate]);
        
        echo json_encode(['success' => true, 'message' => 'Dépense enregistrée avec succès', 'id' => $id]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

function deleteExpense($userId, $id) {
    try {
        $pdo = getDBConnection();
        
        // Vérifier que la dépense appartient à l'utilisateur
        $stmt = $pdo->prepare("SELECT id FROM expenses WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Dépense non trouvée']);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        
        echo json_encode(['success' => true, 'message' => 'Dépense supprimée avec succès']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

// === THÈMES ===

function getTheme($userId) {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT theme_data FROM themes WHERE user_id = ?");
        $stmt->execute([$userId]);
        $theme = $stmt->fetch();
        
        if ($theme) {
            echo json_encode(['success' => true, 'data' => json_decode($theme['theme_data'], true)]);
        } else {
            echo json_encode(['success' => true, 'data' => null]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

function saveTheme($userId, $data) {
    try {
        $pdo = getDBConnection();
        $themeData = json_encode($data);
        
        $stmt = $pdo->prepare("INSERT INTO themes (user_id, theme_data, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE theme_data = ?, updated_at = NOW()");
        $stmt->execute([$userId, $themeData, $themeData]);
        
        echo json_encode(['success' => true, 'message' => 'Thème sauvegardé avec succès']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

// === STATISTIQUES ===

function getStats($userId) {
    try {
        $pdo = getDBConnection();
        
        // Statistiques des ventes
        $stmt = $pdo->prepare("SELECT 
            COUNT(*) as total_sales,
            SUM(total) as total_revenue,
            SUM(profit) as total_profit,
            SUM(quantity) as total_items_sold
            FROM sales WHERE user_id = ?");
        $stmt->execute([$userId]);
        $salesStats = $stmt->fetch();
        
        // Statistiques des dépenses
        $stmt = $pdo->prepare("SELECT 
            COUNT(*) as total_expenses,
            SUM(amount) as total_expenses_amount
            FROM expenses WHERE user_id = ?");
        $stmt->execute([$userId]);
        $expensesStats = $stmt->fetch();
        
        // Statistiques du mois en cours
        $stmt = $pdo->prepare("SELECT 
            COUNT(*) as month_sales,
            SUM(total) as month_revenue,
            SUM(profit) as month_profit
            FROM sales WHERE user_id = ? AND MONTH(sale_date) = MONTH(NOW()) AND YEAR(sale_date) = YEAR(NOW())");
        $stmt->execute([$userId]);
        $monthSalesStats = $stmt->fetch();
        
        $stmt = $pdo->prepare("SELECT 
            SUM(amount) as month_expenses
            FROM expenses WHERE user_id = ? AND MONTH(expense_date) = MONTH(NOW()) AND YEAR(expense_date) = YEAR(NOW())");
        $stmt->execute([$userId]);
        $monthExpensesStats = $stmt->fetch();
        
        // Ventes des 7 derniers jours
        $stmt = $pdo->prepare("SELECT 
            DATE(sale_date) as date,
            SUM(total) as revenue,
            SUM(profit) as profit
            FROM sales 
            WHERE user_id = ? AND sale_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(sale_date)
            ORDER BY date ASC");
        $stmt->execute([$userId]);
        $recentSales = $stmt->fetchAll();
        
        $stmt = $pdo->prepare("SELECT 
            DATE(expense_date) as date,
            SUM(amount) as amount
            FROM expenses 
            WHERE user_id = ? AND expense_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(expense_date)
            ORDER BY date ASC");
        $stmt->execute([$userId]);
        $recentExpenses = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'totalSales' => (int)($salesStats['total_sales'] ?? 0),
                'totalRevenue' => (float)($salesStats['total_revenue'] ?? 0),
                'totalProfit' => (float)($salesStats['total_profit'] ?? 0),
                'totalItemsSold' => (int)($salesStats['total_items_sold'] ?? 0),
                'totalExpenses' => (int)($expensesStats['total_expenses'] ?? 0),
                'totalExpensesAmount' => (float)($expensesStats['total_expenses_amount'] ?? 0),
                'netProfit' => (float)($salesStats['total_profit'] ?? 0) - (float)($expensesStats['total_expenses_amount'] ?? 0),
                'monthSales' => (int)($monthSalesStats['month_sales'] ?? 0),
                'monthRevenue' => (float)($monthSalesStats['month_revenue'] ?? 0),
                'monthProfit' => (float)($monthSalesStats['month_profit'] ?? 0),
                'monthExpenses' => (float)($monthExpensesStats['month_expenses'] ?? 0),
                'monthNetProfit' => (float)($monthSalesStats['month_profit'] ?? 0) - (float)($monthExpensesStats['month_expenses'] ?? 0),
                'recentSales' => $recentSales,
                'recentExpenses' => $recentExpenses
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
    }
}

?>
