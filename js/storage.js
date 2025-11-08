const PRODUCTS_KEY = 'products';
const THEME_KEY = 'theme';

/**
 * Charge les produits depuis le localStorage.
 * Initialise avec des données par défaut si le localStorage est vide.
 * @returns {Promise<Array>}
 */
export async function loadProducts() {
    let products = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
    if (!products) {
        try {
            const response = await fetch('/data/produits.json');
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
