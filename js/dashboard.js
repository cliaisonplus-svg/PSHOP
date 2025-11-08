import { getCompleteStats } from './storage.js';
import { formatCurrency } from './utils.js';
import { initIcons } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    await renderDashboard();
    setTimeout(() => initIcons(), 100);
});

async function renderDashboard() {
    const stats = await getCompleteStats();

    // Afficher les statistiques principales
    document.getElementById('total-sales').textContent = formatCurrency(stats.totalSales);
    document.getElementById('total-profit').textContent = formatCurrency(stats.netProfit || stats.totalProfit);
    document.getElementById('total-items').textContent = stats.totalItemsSold.toString();
    document.getElementById('total-transactions').textContent = stats.totalTransactions.toString();

    // Afficher les statistiques du mois
    document.getElementById('month-sales').textContent = formatCurrency(stats.thisMonthSales);
    document.getElementById('month-profit').textContent = formatCurrency(stats.thisMonthNetProfit || stats.thisMonthProfit);

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
    const expensesStats = await import('./storage.js').then(m => m.getExpensesStats()).catch(() => ({ last7Days: [] }));
    renderChart(stats.last7Days, expensesStats.last7Days || []);

    // Afficher les ventes récentes
    renderRecentSales(stats.recentSales);

    // Afficher les dépenses récentes si elles existent
    if (stats.recentExpenses && stats.recentExpenses.length > 0) {
        renderRecentExpenses(stats.recentExpenses);
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

    if (salesData.length === 0 && expensesData.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Aucune donnée disponible', width / 2, height / 2);
        return;
    }

    // Trouver les valeurs max pour l'échelle
    const maxSales = salesData.length > 0 ? Math.max(...salesData.map(d => d.sales), 1) : 1;
    const maxProfit = salesData.length > 0 ? Math.max(...salesData.map(d => d.profit), 1) : 1;
    const maxExpenses = expensesData.length > 0 ? Math.max(...expensesData.map(d => d.amount), 1) : 1;
    const maxValue = Math.max(maxSales, maxProfit, maxExpenses);

    // Utiliser les données de ventes comme référence pour les dates
    const data = salesData.length > 0 ? salesData : expensesData;
    
    // Dimensions du graphique
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / data.length / 4;

    // Dessiner les barres
    data.forEach((day, index) => {
        const x = padding + (index * (chartWidth / data.length)) + barWidth / 2;
        
        // Trouver les données correspondantes
        const salesDay = salesData.find(d => d.date === day.date);
        const expensesDay = expensesData.find(d => d.date === day.date);

        // Barre de ventes (bleu)
        if (salesDay && salesDay.sales > 0) {
            const barHeight = (salesDay.sales / maxValue) * chartHeight;
            const y = height - padding - barHeight;
            ctx.fillStyle = '#0d6efd';
            ctx.fillRect(x, y, barWidth, barHeight);
        }

        // Barre de bénéfices (vert)
        if (salesDay && salesDay.profit > 0) {
            const profitHeight = (salesDay.profit / maxValue) * chartHeight;
            const profitY = height - padding - profitHeight;
            ctx.fillStyle = '#198754';
            ctx.fillRect(x + barWidth + 3, profitY, barWidth, profitHeight);
        }

        // Barre de dépenses (rouge)
        if (expensesDay && expensesDay.amount > 0) {
            const expenseHeight = (expensesDay.amount / maxValue) * chartHeight;
            const expenseY = height - padding - expenseHeight;
            ctx.fillStyle = '#dc3545';
            ctx.fillRect(x + barWidth * 2 + 6, expenseY, barWidth, expenseHeight);
        }

        // Labels des dates
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x + barWidth * 1.5, height - padding + 15);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(day.date.split('/')[0] + '/' + day.date.split('/')[1], 0, 0);
        ctx.restore();
    });

    // Légende
    let legendY = 20;
    if (salesData.length > 0) {
        ctx.fillStyle = '#0d6efd';
        ctx.fillRect(width - 150, legendY, 15, 15);
        ctx.fillStyle = '#212529';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Ventes', width - 130, legendY + 12);
        legendY += 20;

        ctx.fillStyle = '#198754';
        ctx.fillRect(width - 150, legendY, 15, 15);
        ctx.fillText('Bénéfices', width - 130, legendY + 12);
        legendY += 20;
    }
    
    if (expensesData.length > 0) {
        ctx.fillStyle = '#dc3545';
        ctx.fillRect(width - 150, legendY, 15, 15);
        ctx.fillStyle = '#212529';
        ctx.fillText('Dépenses', width - 130, legendY + 12);
    }
}

function renderRecentSales(sales) {
    const recentSalesList = document.getElementById('recent-sales-list');
    if (!recentSalesList) return;

    recentSalesList.innerHTML = '';

    if (sales.length === 0) {
        recentSalesList.innerHTML = '<p class="no-data">Aucune vente récente.</p>';
        return;
    }

    sales.forEach(sale => {
        const saleItem = document.createElement('div');
        saleItem.className = 'recent-sale-item card';
        const saleDate = new Date(sale.date);
        
        saleItem.innerHTML = `
            <div class="recent-sale-header">
                <h4>${sale.productName}</h4>
                <span class="recent-sale-date">${saleDate.toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="recent-sale-info">
                <span class="recent-sale-quantity">${sale.quantity}x</span>
                <span class="recent-sale-amount">${formatCurrency(sale.price * sale.quantity)}</span>
                <span class="recent-sale-profit">Bénéfice: ${formatCurrency(sale.profit * sale.quantity)}</span>
            </div>
        `;
        recentSalesList.appendChild(saleItem);
    });
}

function renderRecentExpenses(expenses) {
    // Cette fonction peut être utilisée pour afficher les dépenses récentes
    // si on veut ajouter une section dans le dashboard
}

// Rafraîchir le dashboard toutes les 30 secondes
setInterval(async () => {
    await renderDashboard();
}, 30000);

