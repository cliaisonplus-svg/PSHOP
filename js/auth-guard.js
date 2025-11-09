/**
 * Garde d'authentification
 * À inclure dans toutes les pages protégées
 */

import { requireAuth, logout, getCurrentUser } from './auth-db.js';
import { showNotification } from './notifications.js';

// Vérifier l'authentification pour les pages protégées de manière asynchrone
const currentPage = window.location.pathname;

// Ne pas vérifier l'authentification sur les pages publiques
const publicPages = ['login.html', 'register.html', 'reset-password.html'];
const isPublicPage = publicPages.some(page => currentPage.includes(page));

if (!isPublicPage) {
    // Pour les pages protégées, vérifier l'authentification de manière asynchrone
    (async () => {
        try {
            const authenticated = await requireAuth();
            if (!authenticated) {
                // La redirection se fait dans requireAuth()
                return;
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
            // Ne pas rediriger en cas d'erreur pour éviter les boucles
        }
    })();
}

// Ajouter le bouton de déconnexion si présent
document.addEventListener('DOMContentLoaded', async () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await logout();
                showNotification('Déconnexion réussie', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 500);
            } catch (error) {
                console.error('Erreur lors de la déconnexion:', error);
                // Rediriger quand même
                window.location.href = 'login.html';
            }
        });
    }

    // Afficher le nom de l'utilisateur connecté si un élément existe
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        try {
            const user = await getCurrentUser();
            if (user) {
                userInfo.textContent = user.name || user.username;
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        }
    }
});
