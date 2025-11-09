import { getCompleteStats, loadExpenses } from './storage-db.js';
import { formatCurrency } from './utils.js';
import { initIcons } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    await renderDashboard();
    setTimeout(() => initIcons(), 100);
});

async function renderDashboard() {
    try {
        const stats = await getCompleteStats();

        // Afficher les statistiques principales
        const totalSalesEl = document.getElementById('total-sales');
        const totalProfitEl = document.getElementById('total-profit');
        const totalItemsEl = document.getElementById('total-items');
        const totalTransactionsEl = document.getElementById('total-transactions');
        
        if (totalSalesEl) totalSalesEl.textContent = formatCurrency(stats.totalSales || 0);
        if (totalProfitEl) totalProfitEl.textContent = formatCurrency(stats.netProfit || stats.totalProfit || 0);
        if (totalItemsEl) totalItemsEl.textContent = (stats.totalItemsSold || 0).toString();
        if (totalTransactionsEl) totalTransactionsEl.textContent = (stats.totalTransactions || 0).toString();

        // Afficher les statistiques du mois
        const monthSalesEl = document.getElementById('month-sales');
        const monthProfitEl = document.getElementById('month-profit');
        
        if (monthSalesEl) monthSalesEl.textContent = formatCurrency(stats.thisMonthSales || 0);
        if (monthProfitEl) monthProfitEl.textContent = formatCurrency(stats.thisMonthNetProfit || stats.thisMonthProfit || 0);

        // Afficher les dépenses
        const totalExpensesEl = document.getElementById('total-expenses');
        const monthExpensesEl = document.getElementById('month-expenses');
        if (totalExpensesEl) {
            totalExpensesEl.textContent = formatCurrency(stats.totalExpenses || 0);
        }
        if (monthExpensesEl) {
            monthExpensesEl.textContent = formatCurrency(stats.thisMonthExpenses || 0);
        }

        // Afficher le graphique avec ventes et dépenses
        const last7Days = stats.last7Days || [];
        const expensesData = last7Days.map(d => ({ 
            date: d.date, 
            dateKey: d.dateKey, 
            amount: d.expenses || 0 
        }));
        renderChart(last7Days, expensesData);

        // Afficher les ventes récentes
        renderRecentSales(stats.recentSales || []);

        // Afficher les dépenses récentes si elles existent
        if (stats.recentExpenses && stats.recentExpenses.length > 0) {
            renderRecentExpenses(stats.recentExpenses);
        }
    } catch (error) {
        console.error('Erreur lors du rendu du dashboard:', error);
        // Afficher un message d'erreur si nécessaire
        const chart = document.getElementById('sales-chart');
        if (chart) {
            const ctx = chart.getContext('2d');
            ctx.clearRect(0, 0, chart.width, chart.height);
            ctx.fillStyle = '#dc3545';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Erreur lors du chargement des données', chart.width / 2, chart.height / 2);
        }
    }
}

function renderChart(salesData, expensesData) {
    const canvas = document.getElementById('sales-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 300;

    // Nettoyer le canvas
    ctx.clearRect(0, 0, width, height);

    // Utiliser les données de ventes comme référence (elles contiennent déjà les 7 derniers jours)
    const data = salesData.length > 0 ? salesData : (expensesData.length > 0 ? expensesData : []);
    
    if (data.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Aucune donnée disponible', width / 2, height / 2);
        return;
    }

    // Trouver les valeurs max pour l'échelle
    const maxSales = Math.max(...data.map(d => parseFloat(d.sales || 0)), 1);
    const maxProfit = Math.max(...data.map(d => parseFloat(d.profit || 0)), 1);
    const maxExpenses = Math.max(
        ...data.map(d => parseFloat(d.expenses || 0)), 
        expensesData.length > 0 ? Math.max(...expensesData.map(d => parseFloat(d.amount || 0)), 1) : 1
    );
    const maxValue = Math.max(maxSales, maxProfit, maxExpenses, 1);

    // Dimensions du graphique
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2 - 20; // Espace pour les labels
    const barWidth = Math.max(chartWidth / Math.max(data.length, 1) / 4, 8);

    // Créer une map pour les dépenses par date
    const expensesMap = new Map();
    expensesData.forEach(d => {
        const key = d.date || d.dateKey || '';
        if (key) {
            expensesMap.set(key, parseFloat(d.amount || 0));
        }
    });

    // Dessiner les barres
    data.forEach((day, index) => {
        const x = padding + (index * (chartWidth / Math.max(data.length, 1))) + barWidth / 2;
        const daySales = parseFloat(day.sales || 0);
        const dayProfit = parseFloat(day.profit || 0);
        const dayExpenses = parseFloat(day.expenses || 0) || expensesMap.get(day.date || day.dateKey || '') || 0;

        // Barre de ventes (bleu)
        if (daySales > 0) {
            const barHeight = (daySales / maxValue) * chartHeight;
            const y = height - padding - barHeight;
            ctx.fillStyle = '#0d6efd';
            ctx.fillRect(x, y, barWidth, barHeight);
        }

        // Barre de bénéfices (vert)
        if (dayProfit > 0) {
            const profitHeight = (dayProfit / maxValue) * chartHeight;
            const profitY = height - padding - profitHeight;
            ctx.fillStyle = '#198754';
            ctx.fillRect(x + barWidth + 2, profitY, barWidth, profitHeight);
        }

        // Barre de dépenses (rouge)
        if (dayExpenses > 0) {
            const expenseHeight = (dayExpenses / maxValue) * chartHeight;
            const expenseY = height - padding - expenseHeight;
            ctx.fillStyle = '#dc3545';
            ctx.fillRect(x + barWidth * 2 + 4, expenseY, barWidth, expenseHeight);
        }

        // Labels des dates
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x + barWidth * 1.5, height - padding + 15);
        ctx.rotate(-Math.PI / 4);
        const dateStr = day.date || '';
        const dateParts = dateStr.split('/');
        if (dateParts.length >= 2) {
            ctx.fillText(dateParts[0] + '/' + dateParts[1], 0, 0);
        } else if (dateStr) {
            ctx.fillText(dateStr.substring(0, 5), 0, 0);
        }
        ctx.restore();
    });

    // Légende
    let legendY = 20;
    ctx.fillStyle = '#212529';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    if (maxSales > 0) {
        ctx.fillStyle = '#0d6efd';
        ctx.fillRect(width - 150, legendY, 15, 15);
        ctx.fillStyle = '#212529';
        ctx.fillText('Ventes', width - 130, legendY + 12);
        legendY += 20;
    }

    if (maxProfit > 0) {
        ctx.fillStyle = '#198754';
        ctx.fillRect(width - 150, legendY, 15, 15);
        ctx.fillStyle = '#212529';
        ctx.fillText('Bénéfices', width - 130, legendY + 12);
        legendY += 20;
    }
    
    if (maxExpenses > 0) {
        ctx.fillStyle = '#dc3545';
        ctx.fillRect(width - 150, legendY, 15, 15);
        ctx.fillStyle = '#212529';
        ctx.fillText('Dépenses', width - 130, legendY + 12);
    }
    
    // Axe Y - valeurs
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
        const value = maxValue * (1 - i / numTicks);
        const y = padding + (i / numTicks) * chartHeight;
        ctx.fillText(Math.round(value).toLocaleString('fr-FR'), padding - 10, y + 4);
        // Ligne de grille
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
}

function renderRecentSales(sales) {
    const recentSalesList = document.getElementById('recent-sales-list');
    if (!recentSalesList) return;

    recentSalesList.innerHTML = '';

    if (!sales || sales.length === 0) {
        recentSalesList.innerHTML = '<p class="no-data">Aucune vente récente.</p>';
        return;
    }

    sales.forEach(sale => {
        try {
            const saleItem = document.createElement('div');
            saleItem.className = 'recent-sale-item card';
            saleItem.style.cursor = 'pointer';
            saleItem.setAttribute('data-sale-id', sale.id || sale.date || '');
            
            // Parser la date correctement
            let saleDate;
            try {
                saleDate = new Date(sale.date);
                if (isNaN(saleDate.getTime())) {
                    saleDate = new Date();
                }
            } catch (e) {
                saleDate = new Date();
            }
            
            const quantity = parseInt(sale.quantity) || 1;
            const price = parseFloat(sale.price) || 0;
            const total = parseFloat(sale.total) || (price * quantity);
            const profit = parseFloat(sale.profit) || 0;
            
            saleItem.innerHTML = `
                <div class="recent-sale-header">
                    <h4>${sale.productName || 'Produit sans nom'}</h4>
                    <span class="recent-sale-date">${saleDate.toLocaleDateString('fr-FR')}</span>
                </div>
                <div class="recent-sale-info">
                    <span class="recent-sale-quantity">${quantity}x</span>
                    <span class="recent-sale-amount">${formatCurrency(total)}</span>
                    <span class="recent-sale-profit">Bénéfice: ${formatCurrency(profit)}</span>
                </div>
            `;
            
            // Ajouter l'événement de clic
            saleItem.addEventListener('click', () => {
                showSaleDetails(sale);
            });
            
            recentSalesList.appendChild(saleItem);
        } catch (error) {
            console.error('Erreur lors de l\'affichage d\'une vente:', error, sale);
        }
    });
}

/**
 * Affiche les détails d'une vente avec les dépenses associées
 */
async function showSaleDetails(sale) {
    try {
        // Charger les dépenses
        const expenses = await loadExpenses();
        
        // Parser la date de vente correctement
        let saleDate;
        try {
            saleDate = new Date(sale.date);
            if (isNaN(saleDate.getTime())) {
                saleDate = new Date();
            }
        } catch (e) {
            saleDate = new Date();
        }
        
        // Trouver les dépenses associées (dans les 7 jours avant et après la vente)
        const associatedExpenses = expenses.filter(expense => {
            try {
                const expenseDate = new Date(expense.date);
                if (isNaN(expenseDate.getTime())) {
                    return false;
                }
                const diffDays = Math.abs((expenseDate - saleDate) / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            } catch (e) {
                return false;
            }
        }).sort((a, b) => {
            try {
                return new Date(b.date) - new Date(a.date);
            } catch (e) {
                return 0;
            }
        }).slice(0, 10); // Les 10 plus récentes
        
        // Obtenir le modal overlay
        let modalOverlay = document.getElementById('modal-overlay');
        if (!modalOverlay) {
            modalOverlay = document.createElement('div');
            modalOverlay.id = 'modal-overlay';
            modalOverlay.className = 'modal-overlay';
            document.body.appendChild(modalOverlay);
        }

        const modal = document.createElement('div');
        modal.className = 'modal sale-details-modal';
        
        // Fonction pour obtenir le libellé de catégorie
        const getCategoryLabel = (category) => {
            const labels = {
                'achat-produit': 'Achat de produit',
                'loyer': 'Loyer',
                'salaires': 'Salaires',
                'marketing': 'Marketing / Publicité',
                'transport': 'Transport / Livraison',
                'utilities': 'Services (électricité, eau, internet)',
                'fournitures': 'Fournitures de bureau',
                'maintenance': 'Maintenance / Réparation',
                'autres': 'Autres'
            };
            return labels[category] || category || 'Autres';
        };
        
        const quantity = parseInt(sale.quantity) || 1;
        const price = parseFloat(sale.price) || 0;
        const total = parseFloat(sale.total) || (price * quantity);
        const profit = parseFloat(sale.profit) || 0;
        const costPerUnit = quantity > 0 ? (total - profit) / quantity : 0;
        const profitPerUnit = quantity > 0 ? profit / quantity : 0;
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">
                    <i data-lucide="dollar-sign"></i> Détails de la vente
                </h3>
                <button class="modal-close-btn" aria-label="Fermer">&times;</button>
            </div>
            <div class="modal-body sale-details-body">
                <div class="sale-details-section">
                    <h4>Informations de la vente</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Produit:</span>
                            <span class="detail-value">${sale.productName || 'Produit sans nom'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Date:</span>
                            <span class="detail-value">${saleDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Heure:</span>
                            <span class="detail-value">${saleDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Quantité:</span>
                            <span class="detail-value">${quantity}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Prix unitaire:</span>
                            <span class="detail-value">${formatCurrency(price || (total / quantity))}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Montant total:</span>
                            <span class="detail-value highlight">${formatCurrency(total)}</span>
                        </div>
                        ${quantity > 0 ? `
                        <div class="detail-item">
                            <span class="detail-label">Coût unitaire:</span>
                            <span class="detail-value">${formatCurrency(costPerUnit)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Bénéfice unitaire:</span>
                            <span class="detail-value profit">${formatCurrency(profitPerUnit)}</span>
                        </div>
                        ` : ''}
                        <div class="detail-item">
                            <span class="detail-label">Bénéfice total:</span>
                            <span class="detail-value profit highlight">${formatCurrency(profit)}</span>
                        </div>
                        ${sale.clientName ? `
                            <div class="detail-item">
                                <span class="detail-label">Client:</span>
                                <span class="detail-value">${sale.clientName}</span>
                            </div>
                        ` : ''}
                        ${sale.clientEmail ? `
                            <div class="detail-item">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">${sale.clientEmail}</span>
                            </div>
                        ` : ''}
                        ${sale.clientPhone ? `
                            <div class="detail-item">
                                <span class="detail-label">Téléphone:</span>
                                <span class="detail-value">${sale.clientPhone}</span>
                            </div>
                        ` : ''}
                        ${sale.notes ? `
                            <div class="detail-item span-2">
                                <span class="detail-label">Notes:</span>
                                <span class="detail-value">${sale.notes}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="sale-details-section">
                    <h4>
                        <i data-lucide="credit-card"></i> Dépenses associées 
                        <span class="section-subtitle">(7 jours autour de la vente)</span>
                    </h4>
                    ${associatedExpenses.length > 0 ? `
                        <div class="associated-expenses-list">
                            ${associatedExpenses.map(expense => {
                                try {
                                    let expDate;
                                    try {
                                        expDate = new Date(expense.date);
                                        if (isNaN(expDate.getTime())) {
                                            expDate = new Date();
                                        }
                                    } catch (e) {
                                        expDate = new Date();
                                    }
                                    return `
                                        <div class="expense-item">
                                            <div class="expense-item-header">
                                                <span class="expense-category">${getCategoryLabel(expense.category || 'autres')}</span>
                                                <span class="expense-date">${expDate.toLocaleDateString('fr-FR')}</span>
                                            </div>
                                            <div class="expense-item-details">
                                                <span class="expense-amount">${formatCurrency(parseFloat(expense.amount) || 0)}</span>
                                                ${expense.supplier ? `<span class="expense-supplier">${expense.supplier}</span>` : ''}
                                            </div>
                                            ${expense.description ? `<p class="expense-description">${expense.description}</p>` : ''}
                                        </div>
                                    `;
                                } catch (e) {
                                    console.error('Erreur lors de l\'affichage d\'une dépense:', e, expense);
                                    return '';
                                }
                            }).join('')}
                        </div>
                        <div class="expenses-summary">
                            <strong>Total des dépenses associées: ${formatCurrency(associatedExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0))}</strong>
                        </div>
                    ` : `
                        <p class="no-data">Aucune dépense enregistrée dans les 7 jours autour de cette vente.</p>
                    `}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Fermer</button>
            </div>
        `;

        modalOverlay.innerHTML = '';
        modalOverlay.appendChild(modal);
        modalOverlay.classList.add('show');

        // Animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Initialiser les icônes
        initIcons();

        // Bouton de fermeture
        const closeBtn = modal.querySelector('.modal-close');
        const closeBtnHeader = modal.querySelector('.modal-close-btn');
        
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modalOverlay.classList.remove('show');
                modalOverlay.innerHTML = '';
            }, 300);
        };

        closeBtn.addEventListener('click', closeModal);
        if (closeBtnHeader) {
            closeBtnHeader.addEventListener('click', closeModal);
        }

        // Fermeture en cliquant sur l'overlay
        const overlayClick = (e) => {
            if (e.target === modalOverlay) {
                closeModal();
                modalOverlay.removeEventListener('click', overlayClick);
            }
        };
        modalOverlay.addEventListener('click', overlayClick);

        // Fermeture avec Échap
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    } catch (error) {
        console.error('Erreur lors de l\'affichage des détails de la vente:', error);
    }
}

function renderRecentExpenses(expenses) {
    // Cette fonction peut être utilisée pour afficher les dépenses récentes
    // si on veut ajouter une section dans le dashboard
}

// Rafraîchir le dashboard toutes les 30 secondes
setInterval(async () => {
    await renderDashboard();
}, 30000);
