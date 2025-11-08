import { saveExpense, loadExpenses, deleteExpenseById } from './storage.js';
import { formatCurrency } from './utils.js';
import { showNotification, showConfirm } from './notifications.js';
import { initIcons } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const expensesList = document.getElementById('expenses-list');

    // Définir la date du jour par défaut
    const dateInput = document.getElementById('expense-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.max = today; // Ne pas permettre les dates futures
    }

    // Soumission du formulaire de dépense
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const category = document.getElementById('expense-category').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const supplier = document.getElementById('expense-supplier').value;
        const description = document.getElementById('expense-description').value;

        if (!category || !amount || !date) {
            showNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        if (amount <= 0) {
            showNotification('Le montant doit être supérieur à 0', 'error');
            return;
        }

        const confirmed = await showConfirm(
            `Enregistrer une dépense de ${formatCurrency(amount)} pour la catégorie "${getCategoryLabel(category)}" ?`,
            'Confirmer la dépense'
        );

        if (confirmed) {
            try {
                await saveExpense({
                    category,
                    amount,
                    date: new Date(date).toISOString(),
                    supplier,
                    description
                });

                showNotification('Dépense enregistrée avec succès !', 'success');
                expenseForm.reset();
                // Réinitialiser la date
                if (dateInput) {
                    dateInput.value = new Date().toISOString().split('T')[0];
                }
                await renderExpensesList();
            } catch (error) {
                showNotification('Erreur lors de l\'enregistrement de la dépense', 'error');
                console.error(error);
            }
        }
    });

    // Afficher la liste des dépenses
    async function renderExpensesList() {
        const expenses = await loadExpenses();
        expensesList.innerHTML = '';

        if (expenses.length === 0) {
            expensesList.innerHTML = '<p class="no-data">Aucune dépense enregistrée.</p>';
            return;
        }

        // Trier par date (plus récentes en premier)
        const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedExpenses.forEach(expense => {
            const expenseCard = document.createElement('div');
            expenseCard.className = 'sale-card card expense-card';
            const expenseDate = new Date(expense.date);
            
            expenseCard.innerHTML = `
                <div class="sale-header">
                    <div>
                        <h3>${getCategoryLabel(expense.category)}</h3>
                        ${expense.supplier ? `<p class="expense-supplier">Fournisseur: ${expense.supplier}</p>` : ''}
                    </div>
                    <div class="expense-actions">
                        <span class="sale-date">${expenseDate.toLocaleDateString('fr-FR')}</span>
                        <button class="btn-icon delete-expense-btn" data-id="${expense.id}" title="Supprimer">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <div class="sale-details">
                    <div class="sale-detail-item">
                        <span class="detail-label">Montant:</span>
                        <span class="detail-value expense-amount">${formatCurrency(expense.amount)}</span>
                    </div>
                    ${expense.description ? `
                        <div class="sale-detail-item">
                            <span class="detail-label">Description:</span>
                            <span class="detail-value">${expense.description}</span>
                        </div>
                    ` : ''}
                </div>
            `;
            expensesList.appendChild(expenseCard);
        });

        // Ajouter les event listeners pour les boutons de suppression
        document.querySelectorAll('.delete-expense-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const expenseId = e.currentTarget.dataset.id;
                const expense = expenses.find(e => e.id === expenseId);
                
                if (expense) {
                    const confirmed = await showConfirm(
                        `Êtes-vous sûr de vouloir supprimer cette dépense de ${formatCurrency(expense.amount)} ?`,
                        'Confirmer la suppression'
                    );

                    if (confirmed) {
                        try {
                            await deleteExpenseById(expenseId);
                            showNotification('Dépense supprimée avec succès', 'success');
                            await renderExpensesList();
                            initIcons();
                        } catch (error) {
                            showNotification('Erreur lors de la suppression', 'error');
                            console.error(error);
                        }
                    }
                }
            });
        });

        initIcons();
    }

    // Fonction pour obtenir le libellé de la catégorie
    function getCategoryLabel(category) {
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
        return labels[category] || category;
    }

    // Initialisation
    renderExpensesList();
    setTimeout(() => initIcons(), 100);
});

