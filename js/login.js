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
        try {
            const usersExist = await hasUsers();
            if (!usersExist) {
                console.log('Aucun utilisateur trouvé, redirection vers register.html');
                window.location.href = 'register.html';
                return;
            }
        } catch (hasUsersError) {
            console.error('Erreur lors de la vérification des utilisateurs:', hasUsersError);
            // En cas d'erreur, continuer pour permettre la connexion (peut-être que l'API ne fonctionne pas)
        }
        
        // Vérifier si l'utilisateur est déjà connecté
        try {
            const authenticated = await isAuthenticated();
            if (authenticated) {
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                sessionStorage.removeItem('redirectAfterLogin');
                console.log('Utilisateur déjà connecté, redirection vers:', redirectUrl);
                window.location.href = redirectUrl;
                return;
            }
        } catch (authError) {
            console.error('Erreur lors de la vérification de l\'authentification:', authError);
            // En cas d'erreur, continuer pour permettre la connexion
        }
    } catch (error) {
        console.error('Erreur lors de la vérification initiale:', error);
        // En cas d'erreur, continuer quand même pour permettre la connexion
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Réinitialiser les styles d'erreur
        usernameInput.style.borderColor = '';
        passwordInput.style.borderColor = '';
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // Validation côté client
        if (!username || !password) {
            showNotification('Veuillez remplir tous les champs', 'error');
            if (!username) {
                usernameInput.style.borderColor = '#dc3545';
                usernameInput.focus();
            } else {
                passwordInput.style.borderColor = '#dc3545';
                passwordInput.focus();
            }
            return;
        }
        
        if (username.length < 3) {
            showNotification('Le nom d\'utilisateur doit contenir au moins 3 caractères', 'error');
            usernameInput.style.borderColor = '#dc3545';
            usernameInput.focus();
            return;
        }
        
        if (password.length < 6) {
            showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
            passwordInput.style.borderColor = '#dc3545';
            passwordInput.focus();
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
                showNotification(result.message || 'Erreur de connexion', 'error');
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtnText.textContent = 'Se connecter';
                
                // Animation d'erreur sur les champs
                const errorMessage = result.message || '';
                if (errorMessage.includes('utilisateur') || errorMessage.includes('nom')) {
                    usernameInput.style.borderColor = '#dc3545';
                    usernameInput.focus();
                    setTimeout(() => {
                        usernameInput.style.borderColor = '';
                    }, 3000);
                } else if (errorMessage.includes('mot de passe') || errorMessage.includes('password')) {
                    passwordInput.style.borderColor = '#dc3545';
                    passwordInput.focus();
                    passwordInput.value = ''; // Vider le champ mot de passe
                    setTimeout(() => {
                        passwordInput.style.borderColor = '';
                    }, 3000);
                } else {
                    // Erreur générale - mettre en évidence les deux champs
                    usernameInput.style.borderColor = '#dc3545';
                    passwordInput.style.borderColor = '#dc3545';
                    usernameInput.focus();
                    setTimeout(() => {
                        usernameInput.style.borderColor = '';
                        passwordInput.style.borderColor = '';
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            const errorMessage = error.message || 'Une erreur est survenue lors de la connexion. Veuillez réessayer.';
            showNotification(errorMessage, 'error');
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtnText.textContent = 'Se connecter';
            
            // Afficher plus de détails dans la console pour le débogage
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
            
            // Réinitialiser les bordures des champs
            usernameInput.style.borderColor = '';
            passwordInput.style.borderColor = '';
            
            // Focus sur le champ username en cas d'erreur réseau
            if (errorMessage.includes('réseau') || errorMessage.includes('serveur') || errorMessage.includes('communication')) {
                usernameInput.focus();
            }
        }
    });

    // Initialiser les icônes
    setTimeout(() => initIcons(), 100);
});

