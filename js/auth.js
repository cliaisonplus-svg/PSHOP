/**
 * Module d'authentification
 * Gère la connexion, l'inscription et la réinitialisation de mot de passe
 */

const AUTH_KEY = 'auth';
const USERS_KEY = 'users';
const SESSION_KEY = 'session';

/**
 * Structure d'un utilisateur
 * @typedef {Object} User
 * @property {string} id - ID unique de l'utilisateur
 * @property {string} username - Nom d'utilisateur
 * @property {string} password - Mot de passe hashé
 * @property {string} name - Nom de l'utilisateur
 * @property {Date} createdAt - Date de création du compte
 */

const ADMIN_CODE = 'pshopusercheck@manu';

/**
 * Initialise les utilisateurs (ne crée plus de compte admin par défaut)
 */
function initUsers() {
    try {
        let users = [];
        const storedUsers = localStorage.getItem(USERS_KEY);
        
        if (storedUsers) {
            try {
                users = JSON.parse(storedUsers);
                // Vérifier si c'est un tableau valide
                if (!Array.isArray(users)) {
                    users = [];
                }
            } catch (e) {
                console.error('Erreur lors de la lecture des utilisateurs:', e);
                users = [];
            }
        }
        
        return users;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des utilisateurs:', error);
        return [];
    }
}

/**
 * Vérifie s'il existe au moins un utilisateur enregistré
 * @returns {boolean}
 */
export function hasUsers() {
    const users = initUsers();
    return users.length > 0;
}

/**
 * Hash un mot de passe (méthode simple pour démo - en production, utiliser bcrypt)
 * @param {string} password - Mot de passe en clair
 * @returns {string} - Mot de passe hashé
 */
function hashPassword(password) {
    if (!password || typeof password !== 'string') {
        return '';
    }
    // Hash simple pour démo (en production, utiliser une bibliothèque comme bcrypt)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
}

/**
 * Vérifie si un mot de passe correspond au hash
 * @param {string} password - Mot de passe en clair
 * @param {string} hash - Hash du mot de passe
 * @returns {boolean}
 */
function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}

/**
 * Vérifie si l'utilisateur est connecté
 * @returns {boolean}
 */
export function isAuthenticated() {
    try {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) return false;
        
        const session = JSON.parse(sessionStr);
        if (!session || !session.userId || !session.createdAt) return false;
        
        // Vérifier que la session n'est pas expirée (24 heures)
        const sessionTime = new Date(session.createdAt);
        const now = new Date();
        
        // Vérifier que la date est valide
        if (isNaN(sessionTime.getTime())) return false;
        
        const diffHours = (now - sessionTime) / (1000 * 60 * 60);
        
        if (diffHours > 24) {
            // Session expirée, nettoyer mais ne pas rediriger ici
            localStorage.removeItem(SESSION_KEY);
            return false;
        }
        
        // Vérifier que l'utilisateur existe toujours
        const users = initUsers();
        const userExists = users.some(u => u.id === session.userId);
        
        if (!userExists) {
            // L'utilisateur n'existe plus, nettoyer la session
            localStorage.removeItem(SESSION_KEY);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        // En cas d'erreur, considérer comme non authentifié
        return false;
    }
}

/**
 * Obtient l'utilisateur actuellement connecté
 * @returns {User|null}
 */
export function getCurrentUser() {
    try {
        if (!isAuthenticated()) {
            return null;
        }
        
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) return null;
        
        const session = JSON.parse(sessionStr);
        if (!session || !session.userId) return null;
        
        const users = initUsers();
        return users.find(user => user.id === session.userId) || null;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        return null;
    }
}

/**
 * Obtient l'ID de l'utilisateur actuellement connecté
 * @returns {string|null}
 */
export function getCurrentUserId() {
    const user = getCurrentUser();
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
        // Validation des paramètres
        if (!username || !password) {
            return {
                success: false,
                message: 'Veuillez remplir tous les champs'
            };
        }
        
        // Vérifier s'il existe des utilisateurs
        if (!hasUsers()) {
            return {
                success: false,
                message: 'Aucun compte n\'a été créé. Veuillez d\'abord créer un compte.'
            };
        }
        
        // S'assurer que les utilisateurs sont initialisés
        const users = initUsers();
        
        if (!users || users.length === 0) {
            return {
                success: false,
                message: 'Aucun utilisateur trouvé. Veuillez créer un compte.'
            };
        }
        
        // Rechercher l'utilisateur (insensible à la casse)
        const trimmedUsername = username.trim().toLowerCase();
        const user = users.find(u => u.username && u.username.toLowerCase() === trimmedUsername);
        
        if (!user) {
            console.log('Utilisateur non trouvé. Utilisateurs disponibles:', users.map(u => u.username));
            return {
                success: false,
                message: 'Nom d\'utilisateur ou mot de passe incorrect'
            };
        }
        
        // Vérifier le mot de passe
        if (!user.password) {
            console.error('Mot de passe manquant pour l\'utilisateur:', user.username);
            return {
                success: false,
                message: 'Erreur: compte invalide'
            };
        }
        
        const passwordMatch = verifyPassword(password, user.password);
        if (!passwordMatch) {
            console.log('Mot de passe incorrect pour:', user.username);
            return {
                success: false,
                message: 'Nom d\'utilisateur ou mot de passe incorrect'
            };
        }
        
        // Créer une session
        const session = {
            userId: user.id,
            username: user.username,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        
        console.log('Connexion réussie pour:', user.username);
        
        return {
            success: true,
            message: 'Connexion réussie',
            user: {
                id: user.id,
                username: user.username,
                name: user.name || user.username
            }
        };
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        return {
            success: false,
            message: 'Une erreur est survenue lors de la connexion. Veuillez réessayer.'
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
        // Validation des paramètres
        if (!username || !password || !adminCode) {
            return {
                success: false,
                message: 'Veuillez remplir tous les champs'
            };
        }
        
        // Validation du nom d'utilisateur
        const trimmedUsername = username.trim();
        if (trimmedUsername.length < 3) {
            return {
                success: false,
                message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
            };
        }
        
        // Validation du mot de passe
        if (password.length < 6) {
            return {
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
            };
        }
        
        // Validation du code admin
        if (adminCode.trim() !== ADMIN_CODE) {
            return {
                success: false,
                message: 'Code admin incorrect'
            };
        }
        
        // Récupérer les utilisateurs existants
        const users = initUsers();
        
        // Vérifier si le nom d'utilisateur existe déjà
        const usernameLower = trimmedUsername.toLowerCase();
        if (users.some(u => u.username && u.username.toLowerCase() === usernameLower)) {
            return {
                success: false,
                message: 'Ce nom d\'utilisateur est déjà utilisé'
            };
        }
        
        // Créer le nouvel utilisateur
        const newUser = {
            id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            username: usernameLower,
            password: hashPassword(password),
            name: trimmedUsername,
            createdAt: new Date().toISOString()
        };
        
        // Ajouter le nouvel utilisateur
        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        console.log('Nouvel utilisateur créé:', newUser.username);
        
        // Initialiser les données isolées pour cet utilisateur
        await initUserData(newUser.id);
        
        // Connecter automatiquement l'utilisateur
        const session = {
            userId: newUser.id,
            username: newUser.username,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        
        console.log('Utilisateur connecté automatiquement après inscription');
        
        return {
            success: true,
            message: 'Inscription réussie. Vous êtes maintenant connecté.',
            user: {
                id: newUser.id,
                username: newUser.username,
                name: newUser.name
            }
        };
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        return {
            success: false,
            message: 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.'
        };
    }
}

/**
 * Initialise les données pour un nouvel utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
async function initUserData(userId) {
    // Les produits, ventes et dépenses seront automatiquement isolés par userId
    // via les fonctions de storage qui filtrent par getCurrentUserId()
    // Pas besoin d'initialiser quoi que ce soit ici
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
        // Validation des paramètres
        if (!username || !newPassword || !adminCode) {
            return {
                success: false,
                message: 'Veuillez remplir tous les champs'
            };
        }
        
        // Vérifier s'il existe des utilisateurs
        if (!hasUsers()) {
            return {
                success: false,
                message: 'Aucun compte n\'a été créé. Veuillez d\'abord créer un compte.'
            };
        }
        
        // Validation du code admin
        if (adminCode.trim() !== ADMIN_CODE) {
            return {
                success: false,
                message: 'Code administrateur incorrect'
            };
        }
        
        // Validation du mot de passe
        if (newPassword.length < 6) {
            return {
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
            };
        }
        
        // Récupérer les utilisateurs
        const users = initUsers();
        const trimmedUsername = username.trim().toLowerCase();
        const userIndex = users.findIndex(u => u.username && u.username.toLowerCase() === trimmedUsername);
        
        if (userIndex === -1) {
            return {
                success: false,
                message: 'Aucun compte trouvé avec ce nom d\'utilisateur'
            };
        }
        
        // Mettre à jour le mot de passe
        users[userIndex].password = hashPassword(newPassword);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        // Si l'utilisateur était connecté, déconnecter pour forcer une nouvelle connexion
        try {
            const session = JSON.parse(localStorage.getItem(SESSION_KEY));
            if (session && session.userId === users[userIndex].id) {
                localStorage.removeItem(SESSION_KEY);
                console.log('Session supprimée après réinitialisation du mot de passe');
            }
        } catch (e) {
            // Ignorer les erreurs de session
        }
        
        console.log('Mot de passe réinitialisé pour:', users[userIndex].username);
        
        return {
            success: true,
            message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
        };
    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        return {
            success: false,
            message: 'Une erreur est survenue lors de la réinitialisation. Veuillez réessayer.'
        };
    }
}

/**
 * Déconnecte l'utilisateur
 */
export function logout() {
    localStorage.removeItem(SESSION_KEY);
}

/**
 * Vérifie l'authentification et redirige si nécessaire
 * @returns {boolean} - true si authentifié, false sinon
 */
export function requireAuth() {
    try {
        // D'abord vérifier s'il y a des utilisateurs
        if (!hasUsers()) {
            // Si aucun utilisateur, rediriger vers register.html
            const currentPage = window.location.pathname;
            const publicPages = ['register.html', 'reset-password.html', 'login.html'];
            const isPublicPage = publicPages.some(page => currentPage.includes(page));
            
            if (!isPublicPage) {
                console.log('Aucun utilisateur, redirection vers register.html');
                window.location.href = 'register.html';
            }
            return false;
        }
        
        // Ensuite vérifier l'authentification
        if (!isAuthenticated()) {
            // Sauvegarder la page actuelle pour y revenir après connexion
            const currentPage = window.location.pathname;
            const publicPages = ['login.html', 'register.html', 'reset-password.html'];
            const isPublicPage = publicPages.some(page => currentPage.includes(page));
            
            if (!isPublicPage) {
                // Sauvegarder l'URL complète (pathname + search)
                const fullUrl = currentPage + window.location.search;
                sessionStorage.setItem('redirectAfterLogin', fullUrl);
                console.log('Redirection vers login.html, URL sauvegardée:', fullUrl);
            }
            window.location.href = 'login.html';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erreur dans requireAuth:', error);
        // En cas d'erreur, rediriger vers login
        window.location.href = 'login.html';
        return false;
    }
}

// Initialiser les utilisateurs au chargement du module
initUsers();

