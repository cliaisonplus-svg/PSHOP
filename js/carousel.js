export function initCarousel(containerId, images) {
    const container = document.getElementById(containerId);
    
    // Filtrer les images valides
    const validImages = images && Array.isArray(images) 
        ? images.filter(img => img && img.trim() !== '')
        : [];
    
    if (!container || validImages.length === 0) {
        if (container) {
            container.innerHTML = `<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzIxMjUyOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QYXMgZCZhcG9zO2ltYWdlPC90ZXh0Pjwvc3ZnPg==" alt="Image par défaut" class="product-card__image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzIxMjUyOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QYXMgZCZhcG9zO2ltYWdlPC90ZXh0Pjwvc3ZnPg==';">`;
        }
        return;
    }
    
    images = validImages; // Utiliser les images filtrées

    let currentIndex = 0;

    const mainImage = document.createElement('div');
    mainImage.className = 'carousel-main-image';
    const mainImg = document.createElement('img');
    mainImg.src = images[0];
    mainImg.alt = 'Image principale du produit';
    mainImg.onerror = function() {
        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzIxMjUyOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FcnJldXIgY2hhcmdlbWVudDwvdGV4dD48L3N2Zz4=';
    };
    mainImage.appendChild(mainImg);

    const thumbnails = document.createElement('div');
    thumbnails.className = 'carousel-thumbnails';
    
    validImages.forEach((src, index) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.alt = `Miniature ${index + 1}`;
        if (index === 0) thumb.classList.add('active');
        thumb.addEventListener('click', () => {
            updateCarousel(index);
        });
        thumbnails.appendChild(thumb);
    });

    const nav = document.createElement('div');
    nav.className = 'carousel-nav';
    nav.innerHTML = `
        <button class="prev">&lt;</button>
        <button class="next">&gt;</button>
    `;

    container.append(mainImage, thumbnails, nav);

    function updateCarousel(index) {
        currentIndex = index;
        const img = mainImage.querySelector('img');
        if (img) {
            img.src = images[currentIndex];
            img.onerror = function() {
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzIxMjUyOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FcnJldXIgY2hhcmdlbWVudDwvdGV4dD48L3N2Zz4=';
            };
        }
        thumbnails.querySelectorAll('img').forEach((img, i) => {
            img.classList.toggle('active', i === currentIndex);
        });
    }

    nav.querySelector('.prev').addEventListener('click', () => {
        const newIndex = (currentIndex - 1 + images.length) % images.length;
        updateCarousel(newIndex);
    });

    nav.querySelector('.next').addEventListener('click', () => {
        const newIndex = (currentIndex + 1) % images.length;
        updateCarousel(newIndex);
    });
}
