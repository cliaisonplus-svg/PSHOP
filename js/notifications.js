/**
 * Système de notifications et modales personnalisées
 * Remplace les alert() et confirm() natifs du navigateur
 */

// Container pour les notifications
let notificationContainer = null;
let modalOverlay = null;

/**
 * Initialise le système de notifications
 */
function initNotifications() {
    // Créer le container pour les notifications toast
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);

    // Créer l'overlay pour les modales
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'modal-overlay';
    modalOverlay.className = 'modal-overlay';
    document.body.appendChild(modalOverlay);
}

/**
 * Affiche une notification toast
 * @param {string} message - Le message à afficher
 * @param {string} type - Le type de notification (success, error, warning, info)
 * @param {number} duration - Durée d'affichage en millisecondes (défaut: 3000)
 */
export function showNotification(message, type = 'info', duration = 3000) {
    if (!notificationContainer) {
        initNotifications();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Icône selon le type
    const icons = {
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    notification.innerHTML = `
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-close" aria-label="Fermer">&times;</button>
    `;

    notificationContainer.appendChild(notification);

    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Bouton de fermeture
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });

    // Fermeture automatique
    if (duration > 0) {
        setTimeout(() => {
            removeNotification(notification);
        }, duration);
    }

    return notification;
}

/**
 * Supprime une notification
 */
function removeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/**
 * Affiche une modale de confirmation
 * @param {string} message - Le message de confirmation
 * @param {string} title - Le titre de la modale (optionnel)
 * @returns {Promise<boolean>} - Promise qui résout à true si confirmé, false sinon
 */
export function showConfirm(message, title = 'Confirmation') {
    return new Promise((resolve) => {
        if (!modalOverlay) {
            initNotifications();
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Annuler</button>
                <button class="btn btn-primary modal-confirm">Confirmer</button>
            </div>
        `;

        modalOverlay.innerHTML = '';
        modalOverlay.appendChild(modal);
        modalOverlay.classList.add('show');

        // Animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Bouton Annuler
        const cancelBtn = modal.querySelector('.modal-cancel');
        cancelBtn.addEventListener('click', () => {
            closeModal(modal);
            resolve(false);
        });

        // Bouton Confirmer
        const confirmBtn = modal.querySelector('.modal-confirm');
        confirmBtn.addEventListener('click', () => {
            closeModal(modal);
            resolve(true);
        });

        // Fermeture en cliquant sur l'overlay
        modalOverlay.addEventListener('click', function overlayClick(e) {
            if (e.target === modalOverlay) {
                closeModal(modal);
                resolve(false);
                modalOverlay.removeEventListener('click', overlayClick);
            }
        });

        // Fermeture avec Échap
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal(modal);
                resolve(false);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    });
}

/**
 * Ferme une modale
 */
function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        modalOverlay.classList.remove('show');
        modalOverlay.innerHTML = '';
    }, 300);
}

// Initialiser au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    initNotifications();
}

