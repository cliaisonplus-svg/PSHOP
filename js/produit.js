import { getProductById, saveProduct } from './storage-db.js';
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

            if (product.photos && Array.isArray(product.photos) && product.photos.length > 0) {
                existingPhotos = product.photos.filter(photo => photo && photo.trim() !== '');
                renderPhotoPreviews(existingPhotos);
            }
            updateMarge();
        }
    } else {
        formTitle.textContent = 'Ajouter un nouveau produit';
    }

    // Input fichier normal
    photosInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length + existingPhotos.length > 6) {
            showNotification('Vous ne pouvez téléverser que 6 photos au maximum.', 'warning');
            e.target.value = ''; // Reset file input
            return;
        }
        handlePhotoFiles(files);
        e.target.value = ''; // Reset pour permettre de sélectionner les mêmes fichiers
    });

    // Bouton caméra - amélioré pour tous les appareils
    const cameraBtn = document.getElementById('camera-btn');
    const cameraInput = document.getElementById('camera-input');
    
    // Détecter si on est en HTTPS ou localhost (contexte sécurisé pour getUserMedia)
    const isSecureContext = window.location.protocol === 'https:' || 
                           window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           /^192\.168\.\d+\.\d+$/.test(window.location.hostname) ||
                           /^10\.\d+\.\d+\.\d+$/.test(window.location.hostname);
    
    // Détecter si on est sur mobile (amélioration)
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                          (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform)) ||
                          (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    
    if (cameraBtn && cameraInput) {
        cameraBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Sur mobile, utiliser directement l'input file avec capture (plus fiable)
            // Cela fonctionne mieux sur Android et iOS
            if (isMobileDevice) {
                console.log('Appareil mobile détecté, utilisation de l\'input file avec capture');
                cameraInput.click();
                return;
            }
            
            // Sur desktop, essayer d'utiliser getUserMedia si disponible et en contexte sécurisé
            if (isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { 
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                            facingMode: 'environment' // Caméra arrière sur mobile si disponible
                        } 
                    });
                    
                    // Créer un élément video pour prévisualiser
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.autoplay = true;
                    video.playsInline = true;
                    video.muted = true; // Nécessaire pour autoplay
                    video.style.width = '100%';
                    video.style.maxWidth = '600px';
                    video.style.borderRadius = '8px';
                    video.style.backgroundColor = '#000';
                    
                    // Créer une modale pour la capture
                    const modal = document.createElement('div');
                    modal.className = 'modal-overlay show';
                    modal.style.display = 'flex';
                    modal.innerHTML = `
                        <div class="modal show" style="max-width: 700px; width: 90%;">
                            <div class="modal-header">
                                <h3 class="modal-title">Prendre une photo</h3>
                                <button type="button" class="modal-close-btn" id="close-camera-modal">&times;</button>
                            </div>
                            <div class="modal-body" style="text-align: center; padding: 1.5rem;">
                                <div id="video-container" style="margin-bottom: 1rem; display: flex; justify-content: center;">
                                </div>
                                <canvas id="photo-canvas" style="display: none;"></canvas>
                                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                                    <button type="button" class="btn btn-primary" id="capture-photo-btn" style="min-width: 120px;">
                                        <i data-lucide="camera"></i> <span>Capturer</span>
                                    </button>
                                    <button type="button" class="btn btn-secondary" id="cancel-camera-btn" style="min-width: 120px;">Annuler</button>
                                </div>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(modal);
                    
                    const videoContainer = modal.querySelector('#video-container');
                    videoContainer.appendChild(video);
                    
                    const canvas = modal.querySelector('#photo-canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Ajuster la taille du canvas à la vidéo
                    let canvasInitialized = false;
                    video.addEventListener('loadedmetadata', () => {
                        if (!canvasInitialized) {
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            canvasInitialized = true;
                        }
                    });
                    
                    // Capturer la photo
                    modal.querySelector('#capture-photo-btn').addEventListener('click', async () => {
                        if (!canvasInitialized) {
                            canvas.width = video.videoWidth || 1920;
                            canvas.height = video.videoHeight || 1080;
                        }
                        
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        // Compresser l'image
                        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.75);
                        const compressedPhoto = await compressImage(photoDataUrl, 0.7);
                        
                        // Arrêter le stream
                        stream.getTracks().forEach(track => track.stop());
                        
                        // Ajouter la photo
                        if (existingPhotos.length >= 6) {
                            showNotification('Vous ne pouvez téléverser que 6 photos au maximum.', 'warning');
                        } else {
                            existingPhotos.push(compressedPhoto);
                            renderPhotoPreviews(existingPhotos);
                            showNotification('Photo capturée avec succès !', 'success');
                        }
                        
                        // Fermer la modale
                        if (document.body.contains(modal)) {
                            document.body.removeChild(modal);
                        }
                    });
                    
                    // Fermer la modale
                    const closeModal = () => {
                        stream.getTracks().forEach(track => track.stop());
                        if (document.body.contains(modal)) {
                            document.body.removeChild(modal);
                        }
                    };
                    
                    modal.querySelector('#close-camera-modal').addEventListener('click', closeModal);
                    modal.querySelector('#cancel-camera-btn').addEventListener('click', closeModal);
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) closeModal();
                    });
                    
                    // Initialiser les icônes dans la modale
                    setTimeout(() => initIcons(), 100);
                    
                } catch (error) {
                    console.error('Erreur lors de l\'accès à la caméra:', error);
                    // Fallback: utiliser l'input file
                    showNotification('Impossible d\'accéder à la caméra. Utilisez le bouton "Choisir un fichier" ou l\'input file.', 'info');
                    cameraInput.click();
                }
            } else {
                // Fallback: utiliser l'input file
                if (!isSecureContext) {
                    showNotification('La capture photo nécessite HTTPS ou localhost. Utilisez le bouton "Choisir un fichier".', 'info');
                }
                cameraInput.click();
            }
        });

        cameraInput.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                
                // Vérifier le nombre total de photos
                if (existingPhotos.length + files.length > 6) {
                    showNotification('Vous ne pouvez téléverser que 6 photos au maximum.', 'warning');
                    e.target.value = '';
                    return;
                }
                
                try {
                    await handlePhotoFiles(files);
                } catch (error) {
                    console.error('Erreur lors du traitement des photos:', error);
                    showNotification('Erreur lors du traitement des photos: ' + (error.message || 'Erreur inconnue'), 'error');
                }
                
                e.target.value = ''; // Reset pour permettre de prendre une autre photo
            }
        });
    }

    function renderPhotoPreviews(photoArray) {
        photosPreview.innerHTML = '';
        if (!photoArray || photoArray.length === 0) {
            return;
        }
        
        photoArray.forEach((photoSrc, index) => {
            if (!photoSrc || photoSrc.trim() === '') {
                return;
            }
            
            const imgContainer = document.createElement('div');
            imgContainer.style.position = 'relative';
            
            const img = document.createElement('img');
            img.src = photoSrc;
            img.alt = `Photo ${index + 1} du produit`;
            img.loading = 'lazy';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            
            // Gestion des erreurs d'image
            img.onerror = () => {
                console.error('Erreur de chargement de l\'image:', photoSrc.substring(0, 50) + '...');
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzE2MWIyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNjOWQxZDkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FcnJldXIgY2hhcmdlbWVudDwvdGV4dD48L3N2Zz4=';
            };
            
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
        if (!files || files.length === 0) {
            return;
        }
        
        const newPhotos = [];
        const maxSize = 10 * 1024 * 1024; // 10 MB max par image (avant compression)
        
        for (const file of files) {
            // Vérifier la taille du fichier
            if (file.size > maxSize) {
                showNotification(`L'image ${file.name} est trop volumineuse (max 10 MB)`, 'warning');
                continue;
            }
            
            // Vérifier le type de fichier
            if (!file.type.startsWith('image/')) {
                showNotification(`Le fichier ${file.name} n'est pas une image`, 'warning');
                continue;
            }
            
            try {
                const photoDataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const result = event.target.result;
                        if (result && typeof result === 'string' && result.length > 100 && result.startsWith('data:image/')) {
                            resolve(result);
                        } else {
                            reject(new Error('Données d\'image invalides'));
                        }
                    };
                    reader.onerror = () => {
                        reject(new Error('Erreur lors de la lecture du fichier'));
                    };
                    reader.readAsDataURL(file);
                });
                
                // Compresser l'image
                const compressedPhoto = await compressImage(photoDataUrl, 0.75);
                
                // Vérifier que la photo compressée est valide
                if (compressedPhoto && compressedPhoto.startsWith('data:image/') && compressedPhoto.length > 100) {
                    newPhotos.push(compressedPhoto);
                    console.log(`Photo ${file.name} traitée avec succès: ${(compressedPhoto.length * 0.75 / 1024).toFixed(2)} KB`);
                } else {
                    throw new Error('Erreur lors de la compression de l\'image');
                }
            } catch (error) {
                console.error('Erreur lors du traitement de', file.name, ':', error);
                showNotification(`Erreur lors du traitement de ${file.name}: ${error.message || 'Erreur inconnue'}`, 'error');
            }
        }
        
        if (newPhotos.length > 0) {
            existingPhotos = [...existingPhotos, ...newPhotos];
            renderPhotoPreviews(existingPhotos);
            showNotification(`${newPhotos.length} photo(s) ajoutée(s) avec succès`, 'success');
        } else if (files.length > 0) {
            showNotification('Aucune photo n\'a pu être traitée. Vérifiez que les fichiers sont des images valides.', 'warning');
        }
    }
    
    // Fonction pour compresser l'image
    function compressImage(dataUrl, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Redimensionner si nécessaire (max 1920x1920 pour réduire la taille)
                    let width = img.width;
                    let height = img.height;
                    const maxDimension = 1920;
                    
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height / width) * maxDimension);
                            width = maxDimension;
                        } else {
                            width = Math.round((width / height) * maxDimension);
                            height = maxDimension;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Dessiner l'image redimensionnée
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convertir en JPEG avec compression
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    
                    // Vérifier la taille (limiter à environ 2 MB en base64)
                    const base64Size = compressedDataUrl.length * 0.75; // Approximation
                    if (base64Size > 2 * 1024 * 1024) {
                        // Recompresser avec une qualité plus faible
                        const lowerQuality = Math.max(0.3, quality - 0.2);
                        const recompressed = canvas.toDataURL('image/jpeg', lowerQuality);
                        console.log(`Image compressée: ${(base64Size / 1024 / 1024).toFixed(2)} MB -> ${((recompressed.length * 0.75) / 1024 / 1024).toFixed(2)} MB`);
                        resolve(recompressed);
                    } else {
                        console.log(`Image compressée: ${(base64Size / 1024 / 1024).toFixed(2)} MB`);
                        resolve(compressedDataUrl);
                    }
                } catch (error) {
                    console.error('Erreur lors de la compression:', error);
                    resolve(dataUrl); // Retourner l'original en cas d'erreur
                }
            };
            img.onerror = (error) => {
                console.error('Erreur de chargement de l\'image:', error);
                resolve(dataUrl); // Retourner l'original en cas d'erreur
            };
            img.src = dataUrl;
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validation des photos
        if (existingPhotos.length === 0) {
            showNotification('Veuillez ajouter au moins une photo.', 'warning');
            return;
        }
        
        if (existingPhotos.length < 3 && !productId) {
            showNotification('Veuillez ajouter au moins 3 photos pour un nouveau produit.', 'warning');
            return;
        }

        try {
            // Filtrer et valider les photos
            const validPhotos = existingPhotos.filter(photo => {
                if (!photo || typeof photo !== 'string') return false;
                const trimmed = photo.trim();
                if (trimmed === '' || trimmed.length < 100) return false; // Minimum 100 caractères pour une image base64 valide
                // Vérifier que c'est bien une data URL
                if (!trimmed.startsWith('data:image/')) {
                    console.warn('Photo invalide (pas une data URL):', trimmed.substring(0, 50));
                    return false;
                }
                return true;
            });
            
            if (validPhotos.length === 0) {
                showNotification('Veuillez ajouter au moins une photo valide.', 'warning');
                return;
            }
            
            console.log(`Enregistrement du produit avec ${validPhotos.length} photo(s)`);
            
            // Vérifier la taille totale des photos (environ 10 MB max pour toutes les photos)
            const totalSize = validPhotos.reduce((sum, photo) => sum + (photo.length * 0.75), 0);
            const maxTotalSize = 10 * 1024 * 1024; // 10 MB
            
            if (totalSize > maxTotalSize) {
                showNotification(`Les photos sont trop volumineuses (${(totalSize / 1024 / 1024).toFixed(2)} MB). Veuillez réduire le nombre ou la qualité des images.`, 'warning');
                return;
            }
            
            const product = {
                id: productId || generateUUID(),
                nom: nomInput.value.trim(),
                categorie: categorieInput.value,
                description: descriptionInput.value.trim(),
                prixPartenaire: parseFloat(prixPartenaireInput.value) || 0,
                prixRevente: parseFloat(prixReventeInput.value) || 0,
                marge: (parseFloat(prixReventeInput.value) || 0) - (parseFloat(prixPartenaireInput.value) || 0),
                stock: parseInt(stockInput.value) || 0,
                photos: validPhotos,
                specifications: {
                    processeur: specProcesseur.value.trim(),
                    ram: specRam.value.trim(),
                    stockage: specStockage.value.trim(),
                    carteGraphique: specCarteGraphique.value.trim(),
                    ecran: specEcran.value.trim()
                },
                dateAjout: productId ? ((await getProductById(productId))?.dateAjout) : new Date().toISOString()
            };
            
            console.log('Données du produit à sauvegarder:', {
                id: product.id,
                nom: product.nom,
                photosCount: product.photos.length,
                firstPhotoLength: product.photos[0] ? product.photos[0].length : 0,
                totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
            });

            await saveProduct(product);
            console.log('Produit enregistré avec succès:', product.id);
            showNotification('Produit enregistré avec succès !', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
            const errorMessage = error.message || error.toString() || 'Erreur inconnue';
            showNotification('Erreur lors de l\'enregistrement du produit: ' + errorMessage, 'error');
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
        .filter(([, value]) => value && value.trim() !== '')
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

    // Vérifier que les photos existent et sont valides
    const photos = (product.photos && Array.isArray(product.photos)) 
        ? product.photos.filter(photo => photo && photo.trim() !== '')
        : [];
    
    if (photos.length > 0) {
        initCarousel('product-carousel-container', photos);
    } else {
        const container = document.getElementById('product-carousel-container');
        if (container) {
            container.innerHTML = `<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzIxMjUyOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QYXMgZCZhcG9zO2ltYWdlPC90ZXh0Pjwvc3ZnPg==" alt="Image par défaut" class="product-card__image">`;
        }
    }
    
    // Initialize icons after rendering
    setTimeout(() => {
        initIcons();
    }, 100);
}
