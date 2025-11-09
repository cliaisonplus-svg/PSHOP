import { loadProducts, deleteProductById, saveProducts } from './storage-db.js';
import { formatCurrency } from './utils.js';
import { initIcons } from './ui.js';
import { showNotification, showConfirm } from './notifications.js';

let presentationMode = false;

document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const searchBar = document.getElementById('search-bar');
    const categoryFilter = document.getElementById('category-filter');
    const priceMinFilter = document.getElementById('price-min-filter');
    const priceMaxFilter = document.getElementById('price-max-filter');
    const exportBtn = document.getElementById('export-json');
    const importBtn = document.getElementById('import-json');
    const importLabel = document.querySelector('label[for="import-json"]');

    let allProducts = [];

    async function renderProducts(products) {
        if (!productGrid) return;
        productGrid.innerHTML = '';
        if (products.length === 0) {
            productGrid.className = 'empty-state';
            productGrid.innerHTML = `
                <div class="empty-state-content">
                    <h2><i data-lucide="package"></i> Aucun produit trouvé</h2>
                    <p>Il n'y a aucun produit correspondant à vos critères de recherche.</p>
                    <a href="ajouter.html" class="btn btn-primary">
                        <i data-lucide="plus-circle"></i> Ajouter un produit
                    </a>
                </div>
            `;
            initIcons();
            return;
        }
        productGrid.className = '';

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${(product.photos && Array.isArray(product.photos) && product.photos.length > 0 && product.photos[0] && product.photos[0].trim() !== '') ? product.photos[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzE2MWIyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNjOWQxZDkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWl0PC90ZXh0Pjwvc3ZnPg=='}" alt="${product.nom}" class="product-card__image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzE2MWIyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNjOWQxZDkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWl0PC90ZXh0Pjwvc3ZnPg==';">
                <div class="product-card__content">
                    <h3 class="product-card__title">${product.nom}</h3>
                    <p class="product-card__category">${product.categorie}</p>
                    ${!presentationMode ? `<p class="product-card__margin">Marge: ${formatCurrency(product.marge)}</p>` : ''}
                    <p class="product-card__price">${formatCurrency(product.prixRevente)}</p>
                    ${product.isSold ? '<span class="product-sold-badge">Vendu</span>' : ''}
                    ${product.stock !== undefined && product.stock > 0 ? `<span class="product-stock-badge">Stock: ${product.stock}</span>` : ''}
                </div>
                <div class="product-card__actions">
                    <a href="produit.html?id=${product.id}" class="btn btn-secondary"><i data-lucide="eye"></i> Voir</a>
                    <a href="ajouter.html?id=${product.id}" class="btn btn-secondary"><i data-lucide="edit"></i> Éditer</a>
                    <button class="btn btn-danger delete-btn" data-id="${product.id}"><i data-lucide="trash-2"></i> Suppr.</button>
                </div>
            `;
            productGrid.appendChild(card);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const confirmed = await showConfirm('Êtes-vous sûr de vouloir supprimer ce produit ?', 'Supprimer le produit');
                if (confirmed) {
                    await deleteProductById(id);
                    await refreshProductList();
                    showNotification('Produit supprimé avec succès', 'success');
                }
            });
        });
        
        // Initialize icons for newly added elements
        initIcons();
    }

    function filterAndSortProducts() {
        const searchTerm = searchBar.value.toLowerCase();
        const category = categoryFilter.value;
        const minPrice = parseFloat(priceMinFilter.value) || 0;
        const maxPrice = parseFloat(priceMaxFilter.value) || Infinity;

        const filtered = allProducts.filter(p => {
            const nameMatch = p.nom.toLowerCase().includes(searchTerm);
            const categoryMatch = category === 'all' || p.categorie === category;
            const priceMatch = p.prixRevente >= minPrice && p.prixRevente <= maxPrice;
            return nameMatch && categoryMatch && priceMatch;
        });

        renderProducts(filtered);
    }
    
    async function refreshProductList() {
        allProducts = await loadProducts();
        filterAndSortProducts();
    }
    
    // Mode présentation
    const presentationToggle = document.getElementById('presentation-mode-toggle');
    if (presentationToggle) {
        presentationToggle.addEventListener('click', () => {
            presentationMode = !presentationMode;
            document.body.classList.toggle('presentation-mode', presentationMode);
            presentationToggle.innerHTML = presentationMode 
                ? '<i data-lucide="eye-off"></i> Mode Normal'
                : '<i data-lucide="eye"></i> Mode Présentation';
            initIcons();
            filterAndSortProducts();
        });
    }

    // Initial load
    refreshProductList();

    // Event listeners for filters
    [searchBar, categoryFilter, priceMinFilter, priceMaxFilter].forEach(el => {
        el.addEventListener('input', filterAndSortProducts);
    });

    // Export functionality
    exportBtn.addEventListener('click', async () => {
        try {
            const products = await loadProducts();
            if (products.length === 0) {
                showNotification('Aucun produit à exporter', 'warning');
                return;
            }
            const dataStr = JSON.stringify(products, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = 'produits.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            showNotification('Export réussi !', 'success');
        } catch (error) {
            showNotification('Erreur lors de l\'export', 'error');
            console.error(error);
        }
    });

    // Import functionality
    importLabel.addEventListener('click', () => importBtn.click());
    importBtn.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedProducts = JSON.parse(e.target.result);
                    if(Array.isArray(importedProducts)) {
                       const confirmed = await showConfirm(
                           'Voulez-vous remplacer votre catalogue actuel par celui-ci ?', 
                           'Importer des produits'
                       );
                       if (confirmed) {
                            saveProducts(importedProducts);
                            await refreshProductList();
                            showNotification(`Importation réussie ! ${importedProducts.length} produit(s) importé(s).`, 'success');
                            importBtn.value = ''; // Reset file input
                       }
                    } else {
                        throw new Error("Le fichier JSON n'est pas un tableau de produits.");
                    }
                } catch (error) {
                    showNotification('Erreur lors de l\'importation du fichier. Assurez-vous que le format est correct.', 'error');
                    console.error(error);
                    importBtn.value = ''; // Reset file input
                }
            };
            reader.readAsText(file);
        }
    });
});
