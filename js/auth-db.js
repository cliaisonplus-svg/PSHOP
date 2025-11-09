/**
 * Module d'authentification utilisant l'API de base de données
 * Remplace auth.js pour utiliser MySQL au lieu de localStorage
 */

import { authAPI, saveSession, initSession } from './api.js';

const ADMIN_CODE = 'pshopusercheck@manu';

let currentUser = null;

/**
 * Vérifie s'il existe au moins un utilisateur enregistré
 * @returns {Promise<boolean>}
 */
export async function hasUsers() {
    try {
        return await authAPI.hasUsers();
    } catch (error) {
        console.error('Erreur lors de la vérification des utilisateurs:', error);
        return false;
    }
}

/**
 * Vérifie si l'utilisateur est connecté
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
    try {
        const session = await authAPI.checkSession();
        if (session.success && session.authenticated) {
            if (session.user) {
                currentUser = session.user;
            }
            return true;
        }
        currentUser = null;
        return false;
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        currentUser = null;
        return false;
    }
}

/**
 * Obtient l'utilisateur actuellement connecté
 * @returns {Promise<User|null>}
 */
export async function getCurrentUser() {
    if (currentUser) {
        return currentUser;
    }
    
    const authenticated = await isAuthenticated();
    if (authenticated && currentUser) {
        return currentUser;
    }
    
    // Essayer de récupérer l'utilisateur depuis l'API
    try {
        const session = await authAPI.checkSession();
        if (session.success && session.authenticated && session.user) {
            currentUser = session.user;
            return currentUser;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    }
    
    return null;
}

/**
 * Obtient l'ID de l'utilisateur actuellement connecté
 * @returns {Promise<string|null>}
 */
export async function getCurrentUserId() {
    const user = await getCurrentUser();
    return user ? user.id : null;
}

/**
 * Connecte un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<{success: boolean, message: string, user?: User}>}
 */
export async function login(username, password) {
    try {
        if (!username || !password) {
            return {
                success: false,
                message: 'Veuillez remplir tous les champs'
            };
        }
        
        const trimmedUsername = username.trim();
        if (trimmedUsername.length < 3) {
            return {
                success: false,
                message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
            };
        }
        
        if (password.length < 6) {
            return {
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
            };
        }
        
        const result = await authAPI.login(trimmedUsername, password);
        
        if (result.success && result.user) {
            currentUser = result.user;
        }
        
        return result;
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        return {
            success: false,
            message: error.message || 'Une erreur est survenue lors de la connexion. Veuillez réessayer.'
        };
    }
}

/**
 * Inscrit un nouvel utilisateur
 * @param {string} username - Nom d'utilisateur
 * @param {string} password - Mot de passe
 * @param {string} adminCode - Code admin
 * @returns {Promise<{success: boolean, message: string, user?: User}>}
 */
export async function register(username, password, adminCode) {
    try {
        if (!username || !password || !adminCode) {
            return {
                success: false,
                message: 'Veuillez remplir tous les champs'
            };
        }
        
        const trimmedUsername = username.trim();
        if (trimmedUsername.length < 3) {
            return {
                success: false,
                message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
            };
        }
        
        if (password.length < 6) {
            return {
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
            };
        }
        
        if (adminCode.trim() !== ADMIN_CODE) {
            return {
                success: false,
                message: 'Code admin incorrect'
            };
        }
        
        const result = await authAPI.register(trimmedUsername, password, adminCode);
        
        if (result.success && result.user) {
            currentUser = result.user;
        }
        
        return result;
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        return {
            success: false,
            message: error.message || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.'
        };
    }
}

/**
 * Réinitialise le mot de passe
 * @param {string} username - Nom d'utilisateur
 * @param {string} newPassword - Nouveau mot de passe
 * @param {string} adminCode - Code administrateur
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function resetPassword(username, newPassword, adminCode) {
    try {
        if (!username || !newPassword || !adminCode) {
            return {
                success: false,
                message: 'Veuillez remplir tous les champs'
            };
        }
        
        if (newPassword.length < 6) {
            return {
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
            };
        }
        
        if (adminCode.trim() !== ADMIN_CODE) {
            return {
                success: false,
                message: 'Code administrateur incorrect'
            };
        }
        
        return await authAPI.resetPassword(username, newPassword, adminCode);
    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        return {
            success: false,
            message: error.message || 'Une erreur est survenue lors de la réinitialisation. Veuillez réessayer.'
        };
    }
}

/**
 * Déconnecte l'utilisateur
 */
export async function logout() {
    try {
        await authAPI.logout();
        currentUser = null;
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        // Même en cas d'erreur, nettoyer l'état local
        currentUser = null;
        saveSession(null);
    }
}

/**
 * Vérifie l'authentification et redirige si nécessaire
 * @returns {Promise<boolean>} - true si authentifié, false sinon
 */
export async function requireAuth() {
    try {
        // Vérifier s'il y a des utilisateurs
        const usersExist = await hasUsers();
        if (!usersExist) {
            const currentPage = window.location.pathname;
            const publicPages = ['register.html', 'reset-password.html', 'login.html'];
            const isPublicPage = publicPages.some(page => currentPage.includes(page));
            
            if (!isPublicPage) {
                console.log('Aucun utilisateur, redirection vers register.html');
                window.location.href = 'register.html';
                return false;
            }
            return false;
        }
        
        // Vérifier l'authentification
        const authenticated = await isAuthenticated();
        if (!authenticated) {
            const currentPage = window.location.pathname;
            const publicPages = ['login.html', 'register.html', 'reset-password.html'];
            const isPublicPage = publicPages.some(page => currentPage.includes(page));
            
            if (!isPublicPage) {
                const fullUrl = window.location.pathname + window.location.search;
                sessionStorage.setItem('redirectAfterLogin', fullUrl);
                console.log('Non authentifié, redirection vers login.html, URL sauvegardée:', fullUrl);
                window.location.href = 'login.html';
                return false;
            }
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erreur dans requireAuth:', error);
        const currentPage = window.location.pathname;
        const publicPages = ['login.html', 'register.html', 'reset-password.html'];
        const isPublicPage = publicPages.some(page => currentPage.includes(page));
        
        if (!isPublicPage) {
            window.location.href = 'login.html';
        }
        return false;
    }
}

// Initialiser la session au chargement
initSession();
