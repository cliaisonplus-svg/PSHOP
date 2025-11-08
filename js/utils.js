/**
 * Génère un identifiant unique (UUID v4).
 * @returns {string}
 */
export function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

/**
 * Formate un nombre en devise (EUR).
 * @param {number} amount - Le montant à formater.
 * @returns {string}
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}
