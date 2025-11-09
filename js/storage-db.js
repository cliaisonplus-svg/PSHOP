/**
 * Module de stockage utilisant l'API de base de données
 * Remplace storage.js pour utiliser MySQL au lieu de localStorage
 */

import { dataAPI } from './api.js';

/**
 * Charge les produits depuis la base de données
 */
export async function loadProducts() {
    try {
        const products = await dataAPI.getProducts();
        // Adapter le format des données si nécessaire
        return products.map(p => ({
            id: p.id,
            nom: p.name,
            description: p.description || '',
            categorie: p.category || '',
            prixPartenaire: parseFloat(p.prix_partenaire) || 0,
            prixRevente: parseFloat(p.prix_revente) || 0,
            marge: parseFloat(p.marge) || 0,
            stock: parseInt(p.stock) || 0,
            photos: Array.isArray(p.photos) ? p.photos : [],
            specifications: p.specifications || {},
            dateAjout: p.created_at,
            userId: p.user_id
        }));
    } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        return [];
    }
}

/**
 * Sauvegarde la liste des produits
 */
export async function saveProducts(products) {
    try {
        // Pour chaque produit, créer ou mettre à jour
        for (const product of products) {
            const productData = {
                id: product.id,
                name: product.nom,
                description: product.description || '',
                category: product.categorie || '',
                prixPartenaire: product.prixPartenaire || 0,
                prixRevente: product.prixRevente || 0,
                marge: product.marge || 0,
                stock: product.stock || 0,
                photos: Array.isArray(product.photos) ? product.photos : [],
                specifications: product.specifications || {}
            };
            
            // Essayer de mettre à jour d'abord, sinon créer
            try {
                await dataAPI.updateProduct(product.id, productData);
            } catch (e) {
                // Si le produit n'existe pas, le créer
                await dataAPI.createProduct(productData);
            }
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des produits:', error);
        throw error;
    }
}

/**
 * Récupère un produit par son ID
 */
export async function getProductById(id) {
    try {
        const products = await loadProducts();
        return products.find(p => p.id === id);
    } catch (error) {
        console.error('Erreur lors de la récupération du produit:', error);
        return undefined;
    }
}

/**
 * Ajoute ou met à jour un produit
 */
export async function saveProduct(product) {
    try {
        const productData = {
            id: product.id,
            name: product.nom,
            description: product.description || '',
            category: product.categorie || '',
            prixPartenaire: product.prixPartenaire || 0,
            prixRevente: product.prixRevente || 0,
            marge: product.marge || 0,
            stock: product.stock || 0,
            photos: Array.isArray(product.photos) ? product.photos : [],
            specifications: product.specifications || {}
        };
        
        // Vérifier si le produit existe déjà
        const existingProduct = await getProductById(product.id);
        
        if (existingProduct) {
            await dataAPI.updateProduct(product.id, productData);
        } else {
            await dataAPI.createProduct(productData);
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du produit:', error);
        throw error;
    }
}

/**
 * Supprime un produit par son ID
 */
export async function deleteProductById(id) {
    try {
        await dataAPI.deleteProduct(id);
    } catch (error) {
        console.error('Erreur lors de la suppression du produit:', error);
        throw error;
    }
}

/**
 * Sauvegarde les préférences de thème
 */
export async function saveTheme(theme) {
    try {
        await dataAPI.saveTheme(theme);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du thème:', error);
        throw error;
    }
}

/**
 * Charge les préférences de thème
 */
export async function loadTheme() {
    try {
        const theme = await dataAPI.getTheme();
        return theme || {};
    } catch (error) {
        console.error('Erreur lors du chargement du thème:', error);
        return {};
    }
}

/**
 * Charge toutes les ventes
 */
export async function loadSales() {
    try {
        const sales = await dataAPI.getSales();
        // Adapter le format des données
        return sales.map(s => ({
            id: s.id,
            productId: s.product_id,
            productName: s.product_name,
            quantity: parseInt(s.quantity) || 1,
            price: parseFloat(s.price) || 0,
            total: parseFloat(s.total) || 0,
            profit: parseFloat(s.profit) || 0,
            clientName: s.client_name || '',
            clientPhone: s.client_phone || '',
            date: s.sale_date,
            userId: s.user_id
        }));
    } catch (error) {
        console.error('Erreur lors du chargement des ventes:', error);
        return [];
    }
}

/**
 * Sauvegarde une vente
 */
export async function saveSale(sale) {
    try {
        const saleData = {
            id: sale.id || `sale-${Date.now()}`,
            productId: sale.productId || null,
            productName: sale.productName || '',
            quantity: sale.quantity || 1,
            price: sale.price || 0,
            total: sale.total || (sale.price * sale.quantity),
            profit: sale.profit || 0,
            clientName: sale.clientName || '',
            clientPhone: sale.clientPhone || '',
            saleDate: sale.date || new Date().toISOString()
        };
        
        await dataAPI.createSale(saleData);
        return saleData.id;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la vente:', error);
        throw error;
    }
}

/**
 * Marque un produit comme vendu et enregistre la vente
 */
export async function markProductAsSold(productId, saleDetails) {
    try {
        const product = await getProductById(productId);
        if (!product) {
            throw new Error('Produit non trouvé');
        }

        // Créer la vente
        const sale = {
            productId: productId,
            productName: product.nom,
            quantity: saleDetails.quantity || 1,
            price: saleDetails.price || product.prixRevente,
            total: (saleDetails.price || product.prixRevente) * (saleDetails.quantity || 1),
            profit: ((saleDetails.price || product.prixRevente) - (product.prixPartenaire || 0)) * (saleDetails.quantity || 1),
            clientName: saleDetails.clientName || '',
            clientPhone: saleDetails.clientPhone || '',
            date: new Date().toISOString()
        };

        await saveSale(sale);

        // Mettre à jour le stock du produit
        product.stock = Math.max(0, (product.stock || 0) - (saleDetails.quantity || 1));
        await saveProduct(product);
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la vente:', error);
        throw error;
    }
}

/**
 * Charge les statistiques de ventes
 */
export async function getSalesStats() {
    try {
        const stats = await dataAPI.getStats();
        
        return {
            totalSales: stats.totalRevenue || 0,
            totalCost: (stats.totalRevenue || 0) - (stats.totalProfit || 0),
            totalProfit: stats.totalProfit || 0,
            totalItemsSold: stats.totalItemsSold || 0,
            totalTransactions: stats.totalSales || 0,
            thisMonthSales: stats.monthRevenue || 0,
            thisMonthProfit: stats.monthProfit || 0,
            last7Days: (stats.recentSales || []).map(s => ({
                date: s.date,
                sales: s.revenue || 0,
                profit: s.profit || 0,
                count: 1
            })),
            recentSales: [] // Sera rempli par loadSales()
        };
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        return {
            totalSales: 0,
            totalCost: 0,
            totalProfit: 0,
            totalItemsSold: 0,
            totalTransactions: 0,
            thisMonthSales: 0,
            thisMonthProfit: 0,
            last7Days: [],
            recentSales: []
        };
    }
}

/**
 * Charge toutes les dépenses
 */
export async function loadExpenses() {
    try {
        const expenses = await dataAPI.getExpenses();
        // Adapter le format des données
        return expenses.map(e => ({
            id: e.id,
            amount: parseFloat(e.amount) || 0,
            category: e.category || '',
            supplier: e.supplier || '',
            description: e.description || '',
            date: e.expense_date,
            userId: e.user_id
        }));
    } catch (error) {
        console.error('Erreur lors du chargement des dépenses:', error);
        return [];
    }
}

/**
 * Sauvegarde une dépense
 */
export async function saveExpense(expense) {
    try {
        const expenseData = {
            id: expense.id || `expense-${Date.now()}`,
            amount: expense.amount || 0,
            category: expense.category || '',
            supplier: expense.supplier || '',
            description: expense.description || '',
            expenseDate: expense.date || new Date().toISOString()
        };
        
        await dataAPI.createExpense(expenseData);
        return expenseData.id;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la dépense:', error);
        throw error;
    }
}

/**
 * Supprime une dépense par son ID
 */
export async function deleteExpenseById(id) {
    try {
        await dataAPI.deleteExpense(id);
    } catch (error) {
        console.error('Erreur lors de la suppression de la dépense:', error);
        throw error;
    }
}

/**
 * Charge les statistiques de dépenses
 */
export async function getExpensesStats() {
    try {
        const stats = await dataAPI.getStats();
        const expenses = await loadExpenses();
        
        // Statistiques par catégorie
        const byCategory = {};
        expenses.forEach(expense => {
            const category = expense.category || 'Autres';
            if (!byCategory[category]) {
                byCategory[category] = 0;
            }
            byCategory[category] += expense.amount;
        });
        
        // Formater les dates des 7 derniers jours
        const last7Days = (stats.recentExpenses || []).map(e => {
            const date = e.date ? new Date(e.date.split(' ')[0]) : new Date();
            return {
                date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                dateKey: e.date ? e.date.split(' ')[0] : date.toISOString().split('T')[0],
                amount: parseFloat(e.amount || 0),
                count: 1
            };
        });
        
        return {
            totalExpenses: parseFloat(stats.totalExpensesAmount || 0),
            thisMonthExpenses: parseFloat(stats.monthExpenses || 0),
            byCategory: byCategory,
            last7Days: last7Days,
            recentExpenses: expenses.slice(-10).reverse(),
            totalCount: parseInt(stats.totalExpenses || 0)
        };
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques de dépenses:', error);
        return {
            totalExpenses: 0,
            thisMonthExpenses: 0,
            byCategory: {},
            last7Days: [],
            recentExpenses: [],
            totalCount: 0
        };
    }
}

/**
 * Charge les statistiques complètes (ventes + dépenses)
 */
export async function getCompleteStats() {
    try {
        const stats = await dataAPI.getStats();
        const sales = await loadSales();
        const expenses = await loadExpenses();
        
        // Créer une map pour les dépenses par date
        const expensesMap = new Map();
        (stats.recentExpenses || []).forEach(e => {
            const dateKey = e.date ? e.date.split(' ')[0] : e.date; // Extraire uniquement la date
            expensesMap.set(dateKey, parseFloat(e.amount || 0));
        });
        
        // Créer une map pour les ventes par date
        const salesMap = new Map();
        (stats.recentSales || []).forEach(s => {
            const dateKey = s.date ? s.date.split(' ')[0] : s.date; // Extraire uniquement la date
            salesMap.set(dateKey, {
                revenue: parseFloat(s.revenue || 0),
                profit: parseFloat(s.profit || 0)
            });
        });
        
        // Créer une liste complète des 7 derniers jours
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
            const dateFormatted = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }); // Format DD/MM
            
            const saleData = salesMap.get(dateKey) || { revenue: 0, profit: 0 };
            const expenseAmount = expensesMap.get(dateKey) || 0;
            
            last7Days.push({
                date: dateFormatted,
                dateKey: dateKey,
                sales: saleData.revenue,
                profit: saleData.profit,
                expenses: expenseAmount,
                count: 1
            });
        }
        
        return {
            totalSales: parseFloat(stats.totalRevenue || 0),
            totalCost: parseFloat(stats.totalRevenue || 0) - parseFloat(stats.totalProfit || 0),
            totalProfit: parseFloat(stats.totalProfit || 0),
            totalItemsSold: parseInt(stats.totalItemsSold || 0),
            totalTransactions: parseInt(stats.totalSales || 0),
            thisMonthSales: parseFloat(stats.monthRevenue || 0),
            thisMonthProfit: parseFloat(stats.monthProfit || 0),
            totalExpenses: parseFloat(stats.totalExpensesAmount || 0),
            thisMonthExpenses: parseFloat(stats.monthExpenses || 0),
            netProfit: parseFloat(stats.netProfit || 0),
            thisMonthNetProfit: parseFloat(stats.monthNetProfit || 0),
            last7Days: last7Days,
            recentSales: sales.slice(-10).reverse(),
            recentExpenses: expenses.slice(-10).reverse()
        };
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques complètes:', error);
        return {
            totalSales: 0,
            totalCost: 0,
            totalProfit: 0,
            totalItemsSold: 0,
            totalTransactions: 0,
            thisMonthSales: 0,
            thisMonthProfit: 0,
            totalExpenses: 0,
            thisMonthExpenses: 0,
            netProfit: 0,
            thisMonthNetProfit: 0,
            last7Days: [],
            recentSales: [],
            recentExpenses: []
        };
    }
}

