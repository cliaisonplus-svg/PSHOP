import { register } from './auth-db.js';
import { showNotification } from './notifications.js';
import { initIcons } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    const registerForm = document.getElementById('register-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // Vérifier si l'utilisateur est déjà connecté
    try {
        const { isAuthenticated, hasUsers } = await import('./auth-db.js');
        
        // Si l'utilisateur est déjà connecté et qu'il y a des utilisateurs, rediriger
        const usersExist = await hasUsers();
        const authenticated = await isAuthenticated();
        if (usersExist && authenticated) {
            console.log('Utilisateur déjà connecté, redirection vers index.html');
            window.location.href = 'index.html';
            return;
        }
        // Sinon, permettre l'inscription (premier utilisateur ou utilisateur non connecté)
    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        // En cas d'erreur, continuer quand même pour permettre l'inscription
    }

    // Vérifier que les mots de passe correspondent
    confirmPasswordInput.addEventListener('input', () => {
        if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('Les mots de passe ne correspondent pas');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const adminCode = document.getElementById('admin-code').value.trim();
        
        if (!username || !password || !confirmPassword || !adminCode) {
            showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Les mots de passe ne correspondent pas', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
            return;
        }
        
        if (username.length < 3) {
            showNotification('Le nom d\'utilisateur doit contenir au moins 3 caractères', 'error');
            return;
        }
        
        // Désactiver le bouton pendant le traitement
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const submitBtnText = submitBtn.querySelector('span');
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtnText.textContent = 'Création du compte...';
        
        try {
            const result = await register(username, password, adminCode);
            
            if (result.success) {
                submitBtnText.textContent = 'Compte créé !';
                showNotification(result.message, 'success');
                
                // Rediriger vers index.html après inscription
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 800);
            } else {
                showNotification(result.message, 'error');
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtnText.textContent = 'Créer mon compte';
                
                // Mettre en évidence le champ en erreur
                if (result.message.includes('nom d\'utilisateur')) {
                    document.getElementById('username').style.borderColor = '#dc3545';
                    document.getElementById('username').focus();
                } else if (result.message.includes('Code admin')) {
                    document.getElementById('admin-code').style.borderColor = '#dc3545';
                    document.getElementById('admin-code').focus();
                } else if (result.message.includes('mot de passe')) {
                    passwordInput.style.borderColor = '#dc3545';
                    passwordInput.focus();
                }
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            const errorMessage = error.message || 'Une erreur est survenue lors de la création du compte. Veuillez réessayer.';
            showNotification(errorMessage, 'error');
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtnText.textContent = 'Créer mon compte';
            
            // Afficher plus de détails dans la console pour le débogage
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
        }
    });

    // Initialiser les icônes
    setTimeout(() => initIcons(), 100);
});

