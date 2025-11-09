import { resetPassword } from './auth-db.js';
import { showNotification } from './notifications.js';
import { initIcons } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    const resetForm = document.getElementById('reset-password-form');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    // Vérifier s'il existe des utilisateurs
    try {
        const { hasUsers, isAuthenticated } = await import('./auth-db.js');
        
        // Si aucun utilisateur n'existe, rediriger vers register.html
        const usersExist = await hasUsers();
        if (!usersExist) {
            console.log('Aucun utilisateur trouvé, redirection vers register.html');
            window.location.href = 'register.html';
            return;
        }
        
        // Si l'utilisateur est déjà connecté, rediriger vers index.html
        // (pas besoin de réinitialiser le mot de passe si on est connecté)
        const authenticated = await isAuthenticated();
        if (authenticated) {
            console.log('Utilisateur déjà connecté, redirection vers index.html');
            window.location.href = 'index.html';
            return;
        }
    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        // En cas d'erreur, continuer quand même
    }

    // Vérifier que les mots de passe correspondent
    confirmPasswordInput.addEventListener('input', () => {
        if (newPasswordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('Les mots de passe ne correspondent pas');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    });

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const adminCode = document.getElementById('admin-code').value.trim();
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (!username || !adminCode || !newPassword || !confirmPassword) {
            showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showNotification('Les mots de passe ne correspondent pas', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
            return;
        }
        
        // Désactiver le bouton pendant le traitement
        const submitBtn = resetForm.querySelector('button[type="submit"]');
        const submitBtnText = submitBtn.querySelector('span');
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtnText.textContent = 'Réinitialisation...';
        
        try {
            const result = await resetPassword(username, newPassword, adminCode);
            
            if (result.success) {
                submitBtnText.textContent = 'Réinitialisé !';
                showNotification(result.message, 'success');
                
                // Rediriger vers login.html après réinitialisation
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                showNotification(result.message, 'error');
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtnText.textContent = 'Réinitialiser le mot de passe';
                
                // Mettre en évidence le champ en erreur
                if (result.message.includes('nom d\'utilisateur')) {
                    document.getElementById('username').style.borderColor = '#dc3545';
                    document.getElementById('username').focus();
                } else if (result.message.includes('Code administrateur') || result.message.includes('Code admin')) {
                    document.getElementById('admin-code').style.borderColor = '#dc3545';
                    document.getElementById('admin-code').focus();
                } else if (result.message.includes('mot de passe')) {
                    newPasswordInput.style.borderColor = '#dc3545';
                    newPasswordInput.focus();
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Une erreur est survenue', 'error');
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtnText.textContent = 'Réinitialiser le mot de passe';
        }
    });

    // Initialiser les icônes
    setTimeout(() => initIcons(), 100);
});

