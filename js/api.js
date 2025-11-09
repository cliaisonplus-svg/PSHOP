/**
 * Module API pour communiquer avec le backend PHP
 */

const API_BASE_URL = 'api';

// Gestion de la session
let currentSession = null;

/**
 * Initialise la session depuis localStorage ou la récupère
 */
export function initSession() {
    const sessionStr = localStorage.getItem('session');
    if (sessionStr) {
        try {
            currentSession = JSON.parse(sessionStr);
            // Vérifier que la session n'est pas expirée
            if (currentSession.expiresAt && new Date(currentSession.expiresAt) > new Date()) {
                return currentSession;
            } else {
                // Session expirée
                localStorage.removeItem('session');
                currentSession = null;
            }
        } catch (e) {
            console.error('Erreur lors de la lecture de la session:', e);
            localStorage.removeItem('session');
            currentSession = null;
        }
    }
    return currentSession;
}

/**
 * Sauvegarde la session
 */
export function saveSession(session) {
    currentSession = session;
    if (session) {
        localStorage.setItem('session', JSON.stringify(session));
    } else {
        localStorage.removeItem('session');
    }
}

/**
 * Récupère l'ID de session
 */
export function getSessionId() {
    if (!currentSession) {
        currentSession = initSession();
    }
    return currentSession?.id || null;
}

/**
 * Effectue une requête API
 */
async function apiRequest(endpoint, options = {}) {
    const sessionId = getSessionId();
    const url = `${API_BASE_URL}/${endpoint}`;
    const authRequired = options.authRequired !== false; // Par défaut, l'auth est requise
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    // Ajouter le sessionId seulement si l'authentification est requise
    if (authRequired && sessionId) {
        defaultOptions.headers['X-Session-Id'] = sessionId;
    }
    
    const config = {
        method: options.method || 'GET',
        ...defaultOptions,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };
    
    if (options.body) {
        config.body = options.body;
    }
    
    try {
        const response = await fetch(url, config);
        
        // Lire la réponse comme texte d'abord (pour pouvoir la réutiliser)
        const responseText = await response.text();
        
        // Vérifier le type de contenu
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('Erreur de parsing JSON:', jsonError);
                console.error('Réponse reçue (texte):', responseText.substring(0, 500));
                throw new Error('Réponse invalide du serveur. Vérifiez que l\'API PHP fonctionne correctement. Consultez la console pour plus de détails.');
            }
        } else {
            // Si ce n'est pas du JSON, afficher le texte
            console.error('Réponse non-JSON reçue:', responseText.substring(0, 500));
            throw new Error(`Erreur serveur (${response.status}): ${responseText.substring(0, 100)}`);
        }
        
        if (!response.ok) {
            const errorMessage = data.message || data.error || `Erreur ${response.status}: ${response.statusText}`;
            console.error('Erreur API:', {
                status: response.status,
                statusText: response.statusText,
                message: errorMessage,
                data: data,
                url: url
            });
            throw new Error(errorMessage);
        }
        
        return data;
    } catch (error) {
        // Si c'est déjà une Error avec un message, la relancer
        if (error instanceof Error) {
            console.error('Erreur API:', {
                message: error.message,
                url: url,
                method: config.method,
                stack: error.stack
            });
            throw error;
        }
        // Sinon, créer une nouvelle Error
        console.error('Erreur API (inconnue):', error);
        throw new Error(error.message || 'Une erreur est survenue lors de la communication avec le serveur');
    }
}

/**
 * API d'authentification
 */
export const authAPI = {
    async login(username, password) {
        const response = await apiRequest('auth.php?action=login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            authRequired: false
        });
        
        if (response.success && response.session) {
            saveSession(response.session);
        }
        
        return response;
    },
    
    async register(username, password, adminCode) {
        const response = await apiRequest('auth.php?action=register', {
            method: 'POST',
            body: JSON.stringify({ username, password, adminCode }),
            authRequired: false
        });
        
        if (response.success && response.session) {
            saveSession(response.session);
        }
        
        return response;
    },
    
    async resetPassword(username, newPassword, adminCode) {
        return await apiRequest('auth.php?action=reset-password', {
            method: 'POST',
            body: JSON.stringify({ username, newPassword, adminCode }),
            authRequired: false
        });
    },
    
    async logout() {
        const sessionId = getSessionId();
        if (sessionId) {
            try {
                await apiRequest(`auth.php?action=logout`, {
                    method: 'GET'
                });
            } catch (e) {
                console.error('Erreur lors de la déconnexion:', e);
            }
        }
        saveSession(null);
    },
    
    async checkSession() {
        const sessionId = getSessionId();
        if (!sessionId) {
            return { success: false, authenticated: false };
        }
        
        try {
            const response = await apiRequest(`auth.php?action=check-session`);
            return response;
        } catch (e) {
            console.error('Erreur lors de la vérification de la session:', e);
            return { success: false, authenticated: false };
        }
    },
    
    async isAuthenticated() {
        const sessionId = getSessionId();
        if (!sessionId) {
            return false;
        }
        
        try {
            const response = await this.checkSession();
            return response.success === true && response.authenticated === true;
        } catch (e) {
            return false;
        }
    },
    
    async getCurrentUser() {
        const sessionId = getSessionId();
        if (!sessionId) {
            return null;
        }
        
        try {
            const response = await this.checkSession();
            if (response.success && response.authenticated && response.user) {
                return response.user;
            }
            return null;
        } catch (e) {
            return null;
        }
    },
    
    async hasUsers() {
        try {
            const response = await apiRequest('auth.php?action=has-users', {
                authRequired: false
            });
            return response.hasUsers === true;
        } catch (e) {
            console.error('Erreur lors de la vérification des utilisateurs:', e);
            return false;
        }
    }
};

/**
 * API de données
 */
export const dataAPI = {
    async getProducts() {
        const response = await apiRequest('data.php?resource=products');
        return response.data || [];
    },
    
    async createProduct(product) {
        return await apiRequest('data.php?resource=products', {
            method: 'POST',
            body: JSON.stringify(product)
        });
    },
    
    async updateProduct(id, product) {
        return await apiRequest(`data.php?resource=products&id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        });
    },
    
    async deleteProduct(id) {
        return await apiRequest(`data.php?resource=products&id=${id}`, {
            method: 'DELETE'
        });
    },
    
    async getSales() {
        const response = await apiRequest('data.php?resource=sales');
        return response.data || [];
    },
    
    async createSale(sale) {
        return await apiRequest('data.php?resource=sales', {
            method: 'POST',
            body: JSON.stringify(sale)
        });
    },
    
    async getExpenses() {
        const response = await apiRequest('data.php?resource=expenses');
        return response.data || [];
    },
    
    async createExpense(expense) {
        return await apiRequest('data.php?resource=expenses', {
            method: 'POST',
            body: JSON.stringify(expense)
        });
    },
    
    async deleteExpense(id) {
        return await apiRequest(`data.php?resource=expenses&id=${id}`, {
            method: 'DELETE'
        });
    },
    
    async getTheme() {
        const response = await apiRequest('data.php?resource=theme');
        return response.data || null;
    },
    
    async saveTheme(theme) {
        return await apiRequest('data.php?resource=theme', {
            method: 'POST',
            body: JSON.stringify(theme)
        });
    },
    
    async getStats() {
        const response = await apiRequest('data.php?resource=stats');
        return response.data || {};
    }
};

// Initialiser la session au chargement
initSession();

