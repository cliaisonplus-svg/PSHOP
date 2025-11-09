import { login } from './auth-db.js';
import { showNotification } from './notifications.js';
import { initIcons } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // Vérifier s'il existe des utilisateurs et si l'utilisateur est déjà connecté
    try {
        const { hasUsers, isAuthenticated } = await import('./auth-db.js');
        
        // Si aucun utilisateur n'existe, rediriger vers la page d'inscription
        const usersExist = await hasUsers();
        if (!usersExist) {
            console.log('Aucun utilisateur trouvé, redirection vers register.html');
            window.location.href = 'register.html';
            return;
        }
        
        // Vérifier si l'utilisateur est déjà connecté
        const authenticated = await isAuthenticated();
        if (authenticated) {
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
            sessionStorage.removeItem('redirectAfterLogin');
            console.log('Utilisateur déjà connecté, redirection vers:', redirectUrl);
            window.location.href = redirectUrl;
            return;
        }
    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        // En cas d'erreur, continuer quand même pour permettre la connexion
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }
        
        // Désactiver le bouton pendant le traitement
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const submitBtnText = submitBtn.querySelector('span');
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtnText.textContent = 'Connexion en cours...';
        
        try {
            const result = await login(username, password);
            
            if (result.success) {
                submitBtnText.textContent = 'Connexion réussie !';
                showNotification(result.message, 'success');
                
                // Rediriger vers la page sauvegardée ou index.html
                setTimeout(() => {
                    const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                    sessionStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirectUrl;
                }, 800);
            } else {
                showNotification(result.message, 'error');
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtnText.textContent = 'Se connecter';
                
                // Animation d'erreur sur les champs
                if (!result.message.includes('mot de passe')) {
                    usernameInput.style.borderColor = '#dc3545';
                    setTimeout(() => {
                        usernameInput.style.borderColor = '';
                        usernameInput.focus();
                    }, 2000);
                } else {
                    passwordInput.style.borderColor = '#dc3545';
                    setTimeout(() => {
                        passwordInput.style.borderColor = '';
                        passwordInput.focus();
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Une erreur est survenue', 'error');
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtnText.textContent = 'Se connecter';
        }
    });

    // Initialiser les icônes
    setTimeout(() => initIcons(), 100);
});

