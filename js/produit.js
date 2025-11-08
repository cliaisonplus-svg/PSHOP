import { getProductById, saveProduct } from './storage.js';
import { generateUUID, formatCurrency } from './utils.js';
import { initCarousel } from './carousel.js';
import { initIcons } from './ui.js';
import { showNotification } from './notifications.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (document.getElementById('product-form')) {
        handleProductForm(productId);
    } else if (document.getElementById('product-detail-content')) {
        displayProductDetails(productId);
    }
});

async function handleProductForm(productId) {
    const form = document.getElementById('product-form');
    const formTitle = document.getElementById('form-title');
    const idInput = document.getElementById('product-id');
    const nomInput = document.getElementById('nom');
    const categorieInput = document.getElementById('categorie');
    const descriptionInput = document.getElementById('description');
    const prixPartenaireInput = document.getElementById('prixPartenaire');
    const prixReventeInput = document.getElementById('prixRevente');
    const margeInput = document.getElementById('marge');
    const stockInput = document.getElementById('stock');
    const photosInput = document.getElementById('photos');
    const photosPreview = document.getElementById('photos-preview');
    
    // Specs
    const specProcesseur = document.getElementById('spec-processeur');
    const specRam = document.getElementById('spec-ram');
    const specStockage = document.getElementById('spec-stockage');
    const specCarteGraphique = document.getElementById('spec-carteGraphique');
    const specEcran = document.getElementById('spec-ecran');

    let existingPhotos = [];

    function updateMarge() {
        const p1 = parseFloat(prixPartenaireInput.value) || 0;
        const p2 = parseFloat(prixReventeInput.value) || 0;
        margeInput.value = formatCurrency(p2 - p1);
    }

    prixPartenaireInput.addEventListener('input', updateMarge);
    prixReventeInput.addEventListener('input', updateMarge);

    if (productId) {
        formTitle.textContent = 'Modifier le produit';
        const product = await getProductById(productId);
        if (product) {
            idInput.value = product.id;
            nomInput.value = product.nom;
            categorieInput.value = product.categorie;
            descriptionInput.value = product.description;
            prixPartenaireInput.value = product.prixPartenaire;
            prixReventeInput.value = product.prixRevente;
            stockInput.value = product.stock;
            
            if (product.specifications) {
                specProcesseur.value = product.specifications.processeur || '';
                specRam.value = product.specifications.ram || '';
                specStockage.value = product.specifications.stockage || '';
                specCarteGraphique.value = product.specifications.carteGraphique || '';
                specEcran.value = product.specifications.ecran || '';
            }

            if (product.photos && product.photos.length > 0) {
                existingPhotos = product.photos;
                renderPhotoPreviews(existingPhotos);
            }
            updateMarge();
        }
    } else {
        formTitle.textContent = 'Ajouter un nouveau produit';
    }

    // Input fichier normal
    photosInput.addEventListener('change', (e) => {
        if (e.target.files.length + existingPhotos.length > 6) {
            showNotification('Vous ne pouvez téléverser que 6 photos au maximum.', 'warning');
            e.target.value = ''; // Reset file input
            return;
        }
        handlePhotoFiles(e.target.files);
    });

    // Bouton caméra
    const cameraBtn = document.getElementById('camera-btn');
    const cameraInput = document.getElementById('camera-input');
    
    if (cameraBtn && cameraInput) {
        cameraBtn.addEventListener('click', () => {
            cameraInput.click();
        });

        cameraInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                if (existingPhotos.length >= 6) {
                    showNotification('Vous ne pouvez téléverser que 6 photos au maximum.', 'warning');
                    e.target.value = '';
                    return;
                }
                handlePhotoFiles(e.target.files);
                e.target.value = ''; // Reset pour permettre de prendre une autre photo
            }
        });
    }

    function renderPhotoPreviews(photoArray) {
        photosPreview.innerHTML = '';
        photoArray.forEach((photoSrc, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.style.position = 'relative';
            
            const img = document.createElement('img');
            img.src = photoSrc;
            img.alt = `Photo ${index + 1} du produit`;
            img.loading = 'lazy';
            
            // Bouton pour supprimer la photo
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'photo-remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.setAttribute('aria-label', `Supprimer la photo ${index + 1}`);
            removeBtn.title = 'Supprimer cette photo';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                existingPhotos.splice(index, 1);
                renderPhotoPreviews(existingPhotos);
                showNotification('Photo supprimée', 'info');
            });
            
            imgContainer.appendChild(img);
            imgContainer.appendChild(removeBtn);
            photosPreview.appendChild(imgContainer);
        });
    }

    async function handlePhotoFiles(files) {
        const newPhotos = [];
        const promises = Array.from(files).map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    newPhotos.push(event.target.result);
                    resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });
        await Promise.all(promises);
        existingPhotos = [...existingPhotos, ...newPhotos];
        renderPhotoPreviews(existingPhotos);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (existingPhotos.length < 3 && photosInput.files.length === 0 && !productId) {
            showNotification('Veuillez ajouter au moins 3 photos.', 'warning');
            return;
        }

        try {
            const product = {
                id: productId || generateUUID(),
                nom: nomInput.value,
                categorie: categorieInput.value,
                description: descriptionInput.value,
                prixPartenaire: parseFloat(prixPartenaireInput.value),
                prixRevente: parseFloat(prixReventeInput.value),
                marge: (parseFloat(prixReventeInput.value) || 0) - (parseFloat(prixPartenaireInput.value) || 0),
                stock: parseInt(stockInput.value),
                photos: existingPhotos,
                specifications: {
                    processeur: specProcesseur.value,
                    ram: specRam.value,
                    stockage: specStockage.value,
                    carteGraphique: specCarteGraphique.value,
                    ecran: specEcran.value,
                },
                dateAjout: productId ? (await getProductById(productId)).dateAjout : new Date().toISOString()
            };

            await saveProduct(product);
            showNotification('Produit enregistré avec succès !', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            showNotification('Erreur lors de l\'enregistrement du produit.', 'error');
            console.error(error);
        }
    });
}

async function displayProductDetails(productId) {
    const contentArea = document.getElementById('product-detail-content');
    const title = document.getElementById('product-name-title');

    if (!productId) {
        contentArea.innerHTML = '<p>Aucun produit sélectionné. <a href="index.html">Retour à la liste</a></p>';
        return;
    }

    const product = await getProductById(productId);

    if (!product) {
        contentArea.innerHTML = '<p>Produit non trouvé. <a href="index.html">Retour à la liste</a></p>';
        return;
    }
    
    title.textContent = product.nom;

    const specsTable = Object.entries(product.specifications || {})
        .filter(([, value]) => value)
        .map(([key, value]) => `<tr><th>${key.charAt(0).toUpperCase() + key.slice(1)}</th><td>${value}</td></tr>`)
        .join('');

    contentArea.innerHTML = `
        <div class="product-carousel" id="product-carousel-container">
            <!-- Carousel will be initialized here -->
        </div>
        <div class="product-info card">
            <span class="category">${product.categorie}</span>
            <h2>${product.nom}</h2>
            <p class="description">${product.description || 'Aucune description.'}</p>
            
            <div class="price-details">
                <p><span>Prix Partenaire:</span> <span>${formatCurrency(product.prixPartenaire)}</span></p>
                <p><span>Marge Brute:</span> <span>${formatCurrency(product.marge)}</span></p>
                <p class="resale-price"><span>Prix de Vente:</span> <span>${formatCurrency(product.prixRevente)}</span></p>
            </div>
            
            ${specsTable ? `
                <table class="spec-table">
                    <caption>Spécifications</caption>
                    <tbody>
                        ${specsTable}
                    </tbody>
                </table>
            ` : ''}
        </div>
    `;

    initCarousel('product-carousel-container', product.photos);
    // Initialize icons after rendering
    setTimeout(() => {
        initIcons();
    }, 100);
}
