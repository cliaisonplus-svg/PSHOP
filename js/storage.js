const PRODUCTS_KEY = 'products';
const THEME_KEY = 'theme';
const SALES_KEY = 'sales';
const EXPENSES_KEY = 'expenses';

/**
 * Charge les produits depuis le localStorage.
 * Initialise avec des données par défaut si le localStorage est vide.
 * @returns {Promise<Array>}
 */
export async function loadProducts() {
    let products = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
    if (!products) {
        try {
            const response = await fetch('data/produits.json');
            if(response.ok) {
                products = await response.json();
                saveProducts(products);
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
 * Sauvegarde la liste des produits dans le localStorage.
 * @param {Array} products 
 */
export function saveProducts(products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
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
    const products = await loadProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    if (existingIndex > -1) {
        products[existingIndex] = product;
    } else {
        products.push(product);
    }
    saveProducts(products);
}

/**
 * Supprime un produit par son ID.
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function deleteProductById(id) {
    let products = await loadProducts();
    products = products.filter(p => p.id !== id);
    saveProducts(products);
}

/**
 * Sauvegarde les préférences de thème.
 * @param {Object} theme 
 */
export function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
}

/**
 * Charge les préférences de thème.
 * @returns {Object}
 */
export function loadTheme() {
    return JSON.parse(localStorage.getItem(THEME_KEY)) || {};
}

/**
 * Charge toutes les ventes.
 * @returns {Promise<Array>}
 */
export async function loadSales() {
    const sales = JSON.parse(localStorage.getItem(SALES_KEY)) || [];
    return sales;
}

/**
 * Sauvegarde une vente.
 * @param {Object} sale 
 * @returns {Promise<void>}
 */
export async function saveSale(sale) {
    const sales = await loadSales();
    sales.push({
        ...sale,
        id: sale.id || `sale-${Date.now()}`,
        date: sale.date || new Date().toISOString()
    });
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
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
 * Charge toutes les dépenses.
 * @returns {Promise<Array>}
 */
export async function loadExpenses() {
    const expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [];
    return expenses;
}

/**
 * Sauvegarde une dépense.
 * @param {Object} expense 
 * @returns {Promise<void>}
 */
export async function saveExpense(expense) {
    const expenses = await loadExpenses();
    expenses.push({
        ...expense,
        id: expense.id || `expense-${Date.now()}`,
        date: expense.date || new Date().toISOString()
    });
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

/**
 * Supprime une dépense par son ID.
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function deleteExpenseById(id) {
    let expenses = await loadExpenses();
    expenses = expenses.filter(e => e.id !== id);
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
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
