class Boxy {
    constructor(options = {}) {
        if (options.standalone) {
            this.container = options.container;
            this.images = [options.image];
            this.currentIndex = 0;
            
            // Create lightbox elements
            this.createLightbox();
            
            // Add click event for standalone image
            options.image.addEventListener('click', () => {
                this.showLightbox();
            });
            
            // Add event listeners
            this.addEventListeners();
            return;
        }

        this.container = document.getElementById('boxy');
        
        // Create grid container
        this.gridContainer = document.createElement('div');
        this.gridContainer.className = 'boxy-grid-container';
        
        // Move existing images to grid container
        const images = this.container.querySelectorAll('img');
        images.forEach(img => this.gridContainer.appendChild(img));
        
        // Add grid container to boxy
        this.container.appendChild(this.gridContainer);
        
        this.images = this.gridContainer.querySelectorAll('img');
        this.currentIndex = 0;
        
        // Add container navigation
        this.addContainerPagination();
        
        // Check for overflow
        this.checkOverflow();
        
        // Create lightbox elements
        this.createLightbox();
         
        // Add event listeners 
        this.addEventListeners();
    }

    createLightbox() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'boxy-overlay';
        
        // Create lightbox container
        this.lightbox = document.createElement('div');
        this.lightbox.className = 'boxy-lightbox';
        
        // Create image container for transitions
        this.imageContainer = document.createElement('div');
        this.imageContainer.className = 'boxy-image-container';
        
        // Create image element
        this.modalImage = document.createElement('img');
        this.modalImage.className = 'boxy-image';
        this.imageContainer.appendChild(this.modalImage);
        
        // Create pagination counter
        this.pagination = document.createElement('div');
        this.pagination.className = 'boxy-pagination';
        if (this.images.length <= 1) {
            this.pagination.style.display = 'none';
        }

        this.imageDescription = document.createElement('div');
        this.imageDescription.className = 'boxy-description';
        
        // Controls container
        const controls = document.createElement('div');
        controls.className = 'boxy-controls';
        
        // Navigation buttons
        if (this.images.length > 1) {
            const prevButton = document.createElement('button');
            prevButton.className = 'boxy-prev';
            prevButton.innerHTML = '&#10094;';
            prevButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showPreviousImage();
            });
            
            const nextButton = document.createElement('button');
            nextButton.className = 'boxy-next';
            nextButton.innerHTML = '&#10095;';
            nextButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showNextImage();
            });
            
            this.lightbox.appendChild(prevButton);
            this.lightbox.appendChild(nextButton);
        }
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.className = 'boxy-close';
        closeButton.innerHTML = '&#10005;';
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeLightbox();
        });
        
        // Share button
        const shareButton = document.createElement('button');
        shareButton.className = 'boxy-share';
        shareButton.innerHTML = '&#128279;';
        shareButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.shareImage();
        });
        
        // Assemble controls
        controls.appendChild(this.pagination);
        controls.appendChild(shareButton);
        controls.appendChild(closeButton);
        
        // Assemble lightbox
        this.lightbox.appendChild(this.imageContainer);
        this.lightbox.appendChild(this.imageDescription);
        this.lightbox.appendChild(controls);
        this.overlay.appendChild(this.lightbox);
        document.body.appendChild(this.overlay);
    }

    scrollContainer(direction) {
        const scrollAmount = this.gridContainer.clientWidth * 0.8;
        const targetScroll = this.gridContainer.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
        
        this.gridContainer.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
        // Update button visibility after scroll
        setTimeout(() => {
            this.updateContainerButtons(
                this.container.querySelector('.boxy-container-prev'),
                this.container.querySelector('.boxy-container-next')
            );
        }, 100);
    }

    checkOverflow() {
        const isOverflowed = this.gridContainer.scrollWidth > this.gridContainer.clientWidth;
        if (isOverflowed) {
            this.container.classList.add('overflow');
            const prevButton = this.container.querySelector('.boxy-container-prev');
            const nextButton = this.container.querySelector('.boxy-container-next');
            if (prevButton && nextButton) {
                this.updateContainerButtons(prevButton, nextButton);
            }
        } else {
            this.container.classList.remove('overflow');
        }
    }

    addEventListeners() {
        // Image click events
        this.images.forEach((img, index) => {
            img.addEventListener('click', () => {
                this.currentIndex = index;
                this.showLightbox();
            });
        });
        
        // Lightbox overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeLightbox();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', event => {
            if (!this.overlay.classList.contains('active')) return;
            
            if (event.key === 'ArrowLeft') {
                this.showPreviousImage();
            } else if (event.key === 'ArrowRight') {
                this.showNextImage();
            } else if (event.key === 'Escape') {
                this.closeLightbox();
            }
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            if (this.overlay.classList.contains('active')) {
                this.updateLightboxPosition();
            }
        });
    }

    addContainerPagination() {
        // Create container navigation
        const prevPage = document.createElement('button');
        prevPage.className = 'boxy-container-prev';
        prevPage.innerHTML = '&#10094;';
        prevPage.addEventListener('click', () => this.scrollContainer('left'));
        
        const nextPage = document.createElement('button');
        nextPage.className = 'boxy-container-next';
        nextPage.innerHTML = '&#10095;';
        nextPage.addEventListener('click', () => this.scrollContainer('right'));
        
        // Add buttons directly to the container
        this.container.insertBefore(prevPage, this.gridContainer);
        this.container.appendChild(nextPage);
        
        // Add scroll event listener to update button visibility
        this.gridContainer.addEventListener('scroll', () => {
            this.updateContainerButtons(prevPage, nextPage);
        });

        // Add resize observer for overflow detection
        const resizeObserver = new ResizeObserver(() => {
            this.checkOverflow();
        });
        resizeObserver.observe(this.gridContainer);
        
        // Initial button state
        this.updateContainerButtons(prevPage, nextPage);
    }

    updateContainerButtons(prevButton, nextButton) {
        const scrollLeft = this.gridContainer.scrollLeft;
        const maxScroll = this.gridContainer.scrollWidth - this.gridContainer.clientWidth;
        
        if (maxScroll <= 0) {
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
            return;
        }
        
        prevButton.style.display = scrollLeft > 0 ? 'block' : 'none';
        nextButton.style.display = scrollLeft < maxScroll ? 'block' : 'none';
    }

    updatePagination() {
        if (this.images.length > 1) {
            this.pagination.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        }
    }

    updateLightboxPosition() {
        this.overlay.style.paddingLeft = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.left = '0';
    }

    showLightbox() {
        const currentImage = this.images[this.currentIndex];
        this.modalImage.src = currentImage.src;
        this.modalImage.alt = currentImage.alt || '';
        
        // Get description from alt or aria-label
        const description = currentImage.getAttribute('aria-label') || currentImage.alt;
        if (description) {
            this.imageDescription.textContent = description;
            this.imageDescription.style.display = 'block';
        } else {
            this.imageDescription.style.display = 'none';
        }
        
        this.updatePagination();
        this.updateLightboxPosition();
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    showPreviousImage() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateImage();
        }
    }

    showNextImage() {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
            this.updateImage();
        }
    }

    updateImage() {
        const currentImage = this.images[this.currentIndex];
        this.modalImage.style.opacity = '0';
        setTimeout(() => {
            this.modalImage.src = currentImage.src;
            this.modalImage.alt = currentImage.alt || '';
            
            // Get description from alt or aria-label
            const description = currentImage.getAttribute('aria-label') || currentImage.alt;
            if (description) {
                this.imageDescription.textContent = description;
                this.imageDescription.style.display = 'block';
            } else {
                this.imageDescription.style.display = 'none';
            }
            
            this.modalImage.style.opacity = '1';
            this.updatePagination();
        }, 200);
    }

    closeLightbox() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    async shareImage() {
        const currentImage = this.images[this.currentIndex];
        try {
            await navigator.clipboard.writeText(currentImage.src);
            this.showToast('Image URL copied to clipboard');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            this.showToast('Failed to copy URL');
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'boxy-toast';
        toast.textContent = message;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'boxy-toast-close';
        closeButton.innerHTML = '&#10005;';
        closeButton.addEventListener('click', () => toast.remove());
        
        toast.appendChild(closeButton);
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 5000);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new Boxy();
    
    // Handle standalone images with .boxyimg class
    document.querySelectorAll('img.boxyimg').forEach(img => {
        new Boxy({
            container: img.parentElement,
            standalone: true,
            image: img
        });
    });
});