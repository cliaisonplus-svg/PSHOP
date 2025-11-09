/**
 * Guard pour vérifier s'il existe des utilisateurs
 * Redirige vers register.html s'il n'y a aucun utilisateur
 * Doit être chargé en premier (avant auth-guard.js)
 */

// Vérifier immédiatement (pas besoin d'attendre DOMContentLoaded pour cette vérification)
(async () => {
    const currentPage = window.location.pathname;
    
    // Pages publiques qui ne nécessitent pas de redirection
    const publicPages = ['register.html', 'reset-password.html', 'login.html'];
    const isPublicPage = publicPages.some(page => currentPage.includes(page));
    
    if (isPublicPage) {
        return; // Ne pas rediriger si on est déjà sur une page publique
    }
    
    try {
        const { hasUsers } = await import('./auth-db.js');
        
        // Si aucun utilisateur n'existe, rediriger vers register.html
        const usersExist = await hasUsers();
        if (!usersExist) {
            console.log('Aucun utilisateur trouvé, redirection vers register.html');
            window.location.href = 'register.html';
        }
    } catch (error) {
        console.error('Erreur lors de la vérification des utilisateurs:', error);
        // En cas d'erreur, permettre l'accès pour éviter de bloquer l'application
    }
})();
