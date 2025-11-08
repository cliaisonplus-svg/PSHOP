export function initCarousel(containerId, images) {
    const container = document.getElementById(containerId);
    if (!container || !images || images.length === 0) {
        if (container) {
            container.innerHTML = `<img src="https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400/212529/FFFFFF/png?text=Pas+d'image" alt="Image par défaut" class="product-card__image">`;
        }
        return;
    }

    let currentIndex = 0;

    const mainImage = document.createElement('div');
    mainImage.className = 'carousel-main-image';
    mainImage.innerHTML = `<img src="${images[0]}" alt="Image principale du produit">`;

    const thumbnails = document.createElement('div');
    thumbnails.className = 'carousel-thumbnails';
    
    images.forEach((src, index) => {
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
        mainImage.querySelector('img').src = images[currentIndex];
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
