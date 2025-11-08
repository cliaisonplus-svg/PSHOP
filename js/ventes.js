import { loadProducts, markProductAsSold, loadSales } from './storage.js';
import { formatCurrency } from './utils.js';
import { showNotification, showConfirm } from './notifications.js';
import { initIcons } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const saleForm = document.getElementById('sale-form');
    const productSelect = document.getElementById('sale-product');
    const salesList = document.getElementById('sales-list');

    // Charger les produits dans le select
    async function loadProductsForSale() {
        const products = await loadProducts();
        productSelect.innerHTML = '<option value="">Sélectionner un produit...</option>';
        
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.nom} - Stock: ${product.stock || 0}`;
            option.dataset.price = product.prixRevente;
            option.dataset.cost = product.prixPartenaire;
            productSelect.appendChild(option);
        });
    }

    // Mettre à jour le prix automatiquement
    productSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (selectedOption && selectedOption.dataset.price) {
            const priceInput = document.getElementById('sale-price');
            priceInput.value = parseFloat(selectedOption.dataset.price) || 0;
        }
    });

    // Soumission du formulaire de vente
    saleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productId = productSelect.value;
        const quantity = parseInt(document.getElementById('sale-quantity').value);
        const price = parseFloat(document.getElementById('sale-price').value);
        const clientName = document.getElementById('sale-client-name').value;
        const clientEmail = document.getElementById('sale-client-email').value;
        const clientPhone = document.getElementById('sale-client-phone').value;
        const notes = document.getElementById('sale-notes').value;

        if (!productId) {
            showNotification('Veuillez sélectionner un produit', 'error');
            return;
        }

        const selectedOption = productSelect.selectedOptions[0];
        const cost = parseFloat(selectedOption.dataset.cost) || 0;

        const confirmed = await showConfirm(
            `Enregistrer la vente de ${quantity} unité(s) pour ${formatCurrency(price * quantity)} ?`,
            'Confirmer la vente'
        );

        if (confirmed) {
            try {
                await markProductAsSold(productId, {
                    quantity,
                    price,
                    cost,
                    clientName,
                    clientEmail,
                    clientPhone,
                    notes
                });

                showNotification('Vente enregistrée avec succès !', 'success');
                saleForm.reset();
                await loadProductsForSale();
                await renderSalesList();
            } catch (error) {
                showNotification('Erreur lors de l\'enregistrement de la vente', 'error');
                console.error(error);
            }
        }
    });

    // Afficher la liste des ventes
    async function renderSalesList() {
        const sales = await loadSales();
        salesList.innerHTML = '';

        if (sales.length === 0) {
            salesList.innerHTML = '<p class="no-data">Aucune vente enregistrée.</p>';
            return;
        }

        // Trier par date (plus récentes en premier)
        const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedSales.forEach(sale => {
            const saleCard = document.createElement('div');
            saleCard.className = 'sale-card card';
            const saleDate = new Date(sale.date);
            
            saleCard.innerHTML = `
                <div class="sale-header">
                    <h3>${sale.productName}</h3>
                    <span class="sale-date">${saleDate.toLocaleDateString('fr-FR')} ${saleDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="sale-details">
                    <div class="sale-detail-item">
                        <span class="detail-label">Quantité:</span>
                        <span class="detail-value">${sale.quantity}</span>
                    </div>
                    <div class="sale-detail-item">
                        <span class="detail-label">Prix unitaire:</span>
                        <span class="detail-value">${formatCurrency(sale.price)}</span>
                    </div>
                    <div class="sale-detail-item">
                        <span class="detail-label">Montant total:</span>
                        <span class="detail-value highlight">${formatCurrency(sale.price * sale.quantity)}</span>
                    </div>
                    <div class="sale-detail-item">
                        <span class="detail-label">Bénéfice:</span>
                        <span class="detail-value profit">${formatCurrency(sale.profit * sale.quantity)}</span>
                    </div>
                    ${sale.clientName ? `
                        <div class="sale-detail-item">
                            <span class="detail-label">Client:</span>
                            <span class="detail-value">${sale.clientName}</span>
                        </div>
                    ` : ''}
                    ${sale.clientPhone ? `
                        <div class="sale-detail-item">
                            <span class="detail-label">Téléphone:</span>
                            <span class="detail-value">${sale.clientPhone}</span>
                        </div>
                    ` : ''}
                    ${sale.notes ? `
                        <div class="sale-detail-item">
                            <span class="detail-label">Notes:</span>
                            <span class="detail-value">${sale.notes}</span>
                        </div>
                    ` : ''}
                </div>
            `;
            salesList.appendChild(saleCard);
        });
    }

    // Initialisation
    loadProductsForSale();
    renderSalesList();
    setTimeout(() => initIcons(), 100);
});

