const PRODUCTS_KEY = 'products';
const THEME_KEY = 'theme';
const SALES_KEY = 'sales';
const EXPENSES_KEY = 'expenses';

// Importer getCurrentUserId depuis auth.js de manière dynamique
async function getCurrentUserId() {
    try {
        const authModule = await import('./auth.js');
        return authModule.getCurrentUserId();
    } catch (error) {
        console.error('Erreur lors de l\'importation de auth.js:', error);
        return null;
    }
}

/**
 * Charge les produits depuis le localStorage pour l'utilisateur actuel.
 * Initialise avec des données par défaut si le localStorage est vide.
 * @returns {Promise<Array>}
 */
export async function loadProducts() {
    const userId = await getCurrentUserId();
    if (!userId) return [];
    
    const allProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
    
    // Filtrer les produits par userId
    let products = allProducts.filter(p => p.userId === userId);
    
    // Si aucun produit pour cet utilisateur, initialiser avec les données par défaut
    if (products.length === 0) {
        try {
            const response = await fetch('data/produits.json');
            if(response.ok) {
                const defaultProducts = await response.json();
                // Ajouter userId à chaque produit
                products = defaultProducts.map(p => ({
                    ...p,
                    userId: userId
                }));
                // Sauvegarder tous les produits (y compris ceux des autres utilisateurs)
                const otherProducts = allProducts.filter(p => p.userId !== userId);
                localStorage.setItem(PRODUCTS_KEY, JSON.stringify([...otherProducts, ...products]));
            } else {
                products = [];
            }
        } catch (error) {
            console.error("Could not load initial data:", error);
            products = [];
        }
    }
    return products;
}

/**
 * Sauvegarde la liste des produits dans le localStorage pour l'utilisateur actuel.
 * @param {Array} products 
 */
export async function saveProducts(products) {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    // Charger tous les produits
    const allProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
    
    // Supprimer les anciens produits de cet utilisateur
    const otherProducts = allProducts.filter(p => p.userId !== userId);
    
    // Ajouter userId à chaque produit s'il n'existe pas
    const userProducts = products.map(p => ({
        ...p,
        userId: userId
    }));
    
    // Sauvegarder tous les produits
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify([...otherProducts, ...userProducts]));
}

/**
 * Récupère un produit par son ID.
 * @param {string} id 
 * @returns {Promise<Object|undefined>}
 */
export async function getProductById(id) {
    const products = await loadProducts();
    return products.find(p => p.id === id);
}

/**
 * Ajoute ou met à jour un produit.
 * @param {Object} product 
 * @returns {Promise<void>}
 */
export async function saveProduct(product) {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    // S'assurer que le produit a le bon userId
    product.userId = userId;
    
    const products = await loadProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    if (existingIndex > -1) {
        products[existingIndex] = product;
    } else {
        products.push(product);
    }
    await saveProducts(products);
}

/**
 * Supprime un produit par son ID pour l'utilisateur actuel.
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function deleteProductById(id) {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    const allProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
    // Supprimer seulement si c'est un produit de l'utilisateur actuel
    const filteredProducts = allProducts.filter(p => !(p.id === id && p.userId === userId));
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filteredProducts));
}

/**
 * Sauvegarde les préférences de thème pour l'utilisateur actuel.
 * @param {Object} theme 
 */
export async function saveTheme(theme) {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    // Stocker le thème par utilisateur
    const themes = JSON.parse(localStorage.getItem(THEME_KEY)) || {};
    themes[userId] = theme;
    localStorage.setItem(THEME_KEY, JSON.stringify(themes));
}

/**
 * Charge les préférences de thème pour l'utilisateur actuel.
 * @returns {Promise<Object>}
 */
export async function loadTheme() {
    const userId = await getCurrentUserId();
    if (!userId) return {};
    
    const themes = JSON.parse(localStorage.getItem(THEME_KEY)) || {};
    return themes[userId] || {};
}

/**
 * Charge toutes les ventes pour l'utilisateur actuel.
 * @returns {Promise<Array>}
 */
export async function loadSales() {
    const userId = await getCurrentUserId();
    if (!userId) return [];
    
    const allSales = JSON.parse(localStorage.getItem(SALES_KEY)) || [];
    // Filtrer les ventes par userId
    return allSales.filter(s => s.userId === userId);
}

/**
 * Sauvegarde une vente pour l'utilisateur actuel.
 * @param {Object} sale 
 * @returns {Promise<void>}
 */
export async function saveSale(sale) {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    const allSales = JSON.parse(localStorage.getItem(SALES_KEY)) || [];
    const newSale = {
        ...sale,
        id: sale.id || `sale-${Date.now()}`,
        date: sale.date || new Date().toISOString(),
        userId: userId
    };
    allSales.push(newSale);
    localStorage.setItem(SALES_KEY, JSON.stringify(allSales));
}

/**
 * Marque un produit comme vendu et enregistre la vente.
 * @param {string} productId 
 * @param {Object} saleDetails 
 * @returns {Promise<void>}
 */
export async function markProductAsSold(productId, saleDetails) {
    const product = await getProductById(productId);
    if (!product) return;

    // Créer la vente
    const sale = {
        productId: productId,
        productName: product.nom,
        quantity: saleDetails.quantity || 1,
        price: saleDetails.price || product.prixRevente,
        cost: saleDetails.cost || product.prixPartenaire,
        profit: (saleDetails.price || product.prixRevente) - (saleDetails.cost || product.prixPartenaire),
        clientName: saleDetails.clientName || '',
        clientEmail: saleDetails.clientEmail || '',
        clientPhone: saleDetails.clientPhone || '',
        notes: saleDetails.notes || ''
    };

    await saveSale(sale);

    // Mettre à jour le stock du produit
    product.stock = Math.max(0, (product.stock || 0) - (saleDetails.quantity || 1));
    product.isSold = product.stock === 0;
    await saveProduct(product);
}

/**
 * Charge les statistiques de ventes.
 * @returns {Promise<Object>}
 */
export async function getSalesStats() {
    const sales = await loadSales();
    const products = await loadProducts();

    const totalSales = sales.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);
    const totalCost = sales.reduce((sum, sale) => sum + (sale.cost * sale.quantity), 0);
    const totalProfit = totalSales - totalCost;
    const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    // Statistiques par période
    const now = new Date();
    const thisMonth = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    });

    const thisMonthSales = thisMonth.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);
    const thisMonthProfit = thisMonth.reduce((sum, sale) => sum + sale.profit * sale.quantity, 0);

    // Statistiques par jour (7 derniers jours)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const daySales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.toDateString() === date.toDateString();
        });
        last7Days.push({
            date: date.toLocaleDateString('fr-FR'),
            sales: daySales.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0),
            profit: daySales.reduce((sum, sale) => sum + sale.profit * sale.quantity, 0),
            count: daySales.length
        });
    }

    return {
        totalSales,
        totalCost,
        totalProfit,
        totalItemsSold,
        totalTransactions: sales.length,
        thisMonthSales,
        thisMonthProfit,
        last7Days,
        recentSales: sales.slice(-10).reverse()
    };
}

/**
 * Charge toutes les dépenses pour l'utilisateur actuel.
 * @returns {Promise<Array>}
 */
export async function loadExpenses() {
    const userId = await getCurrentUserId();
    if (!userId) return [];
    
    const allExpenses = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [];
    // Filtrer les dépenses par userId
    return allExpenses.filter(e => e.userId === userId);
}

/**
 * Sauvegarde une dépense pour l'utilisateur actuel.
 * @param {Object} expense 
 * @returns {Promise<void>}
 */
export async function saveExpense(expense) {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    const allExpenses = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [];
    const newExpense = {
        ...expense,
        id: expense.id || `expense-${Date.now()}`,
        date: expense.date || new Date().toISOString(),
        userId: userId
    };
    allExpenses.push(newExpense);
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(allExpenses));
}

/**
 * Supprime une dépense par son ID pour l'utilisateur actuel.
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function deleteExpenseById(id) {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    const allExpenses = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [];
    // Supprimer seulement si c'est une dépense de l'utilisateur actuel
    const filteredExpenses = allExpenses.filter(e => !(e.id === id && e.userId === userId));
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(filteredExpenses));
}

/**
 * Charge les statistiques de dépenses.
 * @returns {Promise<Object>}
 */
export async function getExpensesStats() {
    const expenses = await loadExpenses();

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Statistiques par période
    const now = new Date();
    const thisMonth = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    });

    const thisMonthExpenses = thisMonth.reduce((sum, expense) => sum + expense.amount, 0);

    // Statistiques par catégorie
    const byCategory = {};
    expenses.forEach(expense => {
        const category = expense.category || 'Autres';
        if (!byCategory[category]) {
            byCategory[category] = 0;
        }
        byCategory[category] += expense.amount;
    });

    // Statistiques par jour (7 derniers jours)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.toDateString() === date.toDateString();
        });
        last7Days.push({
            date: date.toLocaleDateString('fr-FR'),
            amount: dayExpenses.reduce((sum, expense) => sum + expense.amount, 0),
            count: dayExpenses.length
        });
    }

    return {
        totalExpenses,
        thisMonthExpenses,
        byCategory,
        last7Days,
        recentExpenses: expenses.slice(-10).reverse(),
        totalCount: expenses.length
    };
}

/**
 * Charge les statistiques complètes (ventes + dépenses).
 * @returns {Promise<Object>}
 */
export async function getCompleteStats() {
    const salesStats = await getSalesStats();
    const expensesStats = await getExpensesStats();

    return {
        ...salesStats,
        ...expensesStats,
        netProfit: salesStats.totalProfit - expensesStats.totalExpenses,
        thisMonthNetProfit: salesStats.thisMonthProfit - expensesStats.thisMonthExpenses
    };
}
