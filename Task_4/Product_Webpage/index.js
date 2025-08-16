class ProductFilter {
    constructor() {
        // Initialize with error handling for required elements
        try {
            this.products = document.querySelectorAll('.product-card');
            this.searchInput = document.getElementById('searchInput');
            this.activeFiltersContainer = document.getElementById('activeFilters');
            this.resultsCount = document.getElementById('resultsCount');
            this.productList = document.getElementById('productList');
            this.quickViewModal = document.getElementById('quickViewModal');
            this.modalProductInfo = document.getElementById('modalProductInfo');
            this.cartCount = document.querySelector('.cart-count');

            if (!this.productList || !this.searchInput || !this.activeFiltersContainer || 
                !this.resultsCount || !this.quickViewModal || !this.modalProductInfo || !this.cartCount) {
                throw new Error('Required DOM elements not found');
            }
        } catch (error) {
            console.error('Error initializing ProductFilter:', error);
            return;
        }
        
        this.currentFilters = {
            category: 'all',
            price: 'all',
            sort: 'default',
            search: ''
        };

        // Load cart from localStorage if available
        this.cart = this.loadCart();
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateResultsCount();
    }

    bindEvents() {
        // Add error handling for images
        document.querySelectorAll('.product-image img').forEach(img => {
            img.addEventListener('error', function() {
                this.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
            });
        });

        // Filter radio buttons
        const categoryRadios = document.querySelectorAll('input[name="category"]');
        const priceRadios = document.querySelectorAll('input[name="price"]');
        const sortRadios = document.querySelectorAll('input[name="sort"]');

        categoryRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.updateActiveFilters();
            });
        });

        priceRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentFilters.price = e.target.value;
                this.updateActiveFilters();
            });
        });

        sortRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.updateActiveFilters();
            });
        });

        // Apply and clear filters
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
            this.closeDropdown();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearAllFilters();
        });

        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        document.querySelector('.search-btn').addEventListener('click', () => {
            this.applyFilters();
        });

        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productName = e.target.getAttribute('data-product');
                const productPrice = parseInt(e.target.getAttribute('data-price'));
                this.addToCart(productName, productPrice);
            });
        });

        // Quick view buttons
        document.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productCard = e.target.closest('.product-card');
                this.showQuickView(productCard);
            });
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target === this.quickViewModal) {
                this.closeModal();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                this.closeDropdown();
            }
        });
    }

    applyFilters() {
        let visibleProducts = 0;
        
        this.products.forEach(product => {
            let shouldShow = true;

            // Category filter
            if (this.currentFilters.category !== 'all') {
                const productCategory = product.dataset.category;
                if (productCategory !== this.currentFilters.category) {
                    shouldShow = false;
                }
            }

            // Price filter
            if (this.currentFilters.price !== 'all') {
                const productPrice = parseInt(product.dataset.price);
                const priceRange = this.currentFilters.price;
                
                if (!this.isPriceInRange(productPrice, priceRange)) {
                    shouldShow = false;
                }
            }

            // Search filter
            if (this.currentFilters.search) {
                const productName = product.dataset.name.toLowerCase();
                const productTitle = product.querySelector('h3').textContent.toLowerCase();
                const productCategory = product.querySelector('.product-category').textContent.toLowerCase();
                
                const searchTerm = this.currentFilters.search;
                if (!productName.includes(searchTerm) && 
                    !productTitle.includes(searchTerm) && 
                    !productCategory.includes(searchTerm)) {
                    shouldShow = false;
                }
            }

            if (shouldShow) {
                product.classList.remove('hidden');
                visibleProducts++;
            } else {
                product.classList.add('hidden');
            }
        });

        this.removeNoResultsMessage();
        
        if (visibleProducts === 0) {
            this.showNoResultsMessage();
        } else {
            // Apply sorting to visible products
            this.applySorting();
        }

        this.updateResultsCount(visibleProducts);
        this.updateActiveFilters();
    }

    isPriceInRange(price, range) {
        switch (range) {
            case '0-50':
                return price < 50;
            case '50-200':
                return price >= 50 && price <= 200;
            case '200-500':
                return price > 200 && price <= 500;
            case '500+':
                return price > 500;
            default:
                return true;
        }
    }

    applySorting() {
        if (this.currentFilters.sort === 'default') return;

        const visibleProducts = Array.from(this.products).filter(product => 
            !product.classList.contains('hidden')
        );

        visibleProducts.sort((a, b) => {
            switch (this.currentFilters.sort) {
                case 'priceLowHigh':
                    return parseInt(a.dataset.price) - parseInt(b.dataset.price);
                case 'priceHighLow':
                    return parseInt(b.dataset.price) - parseInt(a.dataset.price);
                case 'name':
                    const nameA = a.querySelector('h3').textContent.toLowerCase();
                    const nameB = b.querySelector('h3').textContent.toLowerCase();
                    return nameA.localeCompare(nameB);
                default:
                    return 0;
            }
        });

        // Re-append sorted products to the DOM
        visibleProducts.forEach(product => {
            this.productList.appendChild(product);
        });
    }

    updateActiveFilters() {
        this.activeFiltersContainer.innerHTML = '';
        
        if (this.currentFilters.category !== 'all') {
            this.addFilterTag('Category', this.getCategoryDisplayName(this.currentFilters.category), 'category');
        }
        
        if (this.currentFilters.price !== 'all') {
            this.addFilterTag('Price', this.getPriceDisplayName(this.currentFilters.price), 'price');
        }
        
        if (this.currentFilters.sort !== 'default') {
            this.addFilterTag('Sort', this.getSortDisplayName(this.currentFilters.sort), 'sort');
        }
        
        if (this.currentFilters.search) {
            this.addFilterTag('Search', `"${this.currentFilters.search}"`, 'search');
        }
    }

    addFilterTag(type, value, filterKey) {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.innerHTML = `
            ${type}: ${value}
            <button class="remove-filter" data-filter="${filterKey}">×</button>
        `;
        
        tag.querySelector('.remove-filter').addEventListener('click', (e) => {
            this.removeFilter(e.target.getAttribute('data-filter'));
        });
        
        this.activeFiltersContainer.appendChild(tag);
    }

    removeFilter(filterKey) {
        switch (filterKey) {
            case 'category':
                this.currentFilters.category = 'all';
                document.querySelector('input[name="category"][value="all"]').checked = true;
                break;
            case 'price':
                this.currentFilters.price = 'all';
                document.querySelector('input[name="price"][value="all"]').checked = true;
                break;
            case 'sort':
                this.currentFilters.sort = 'default';
                document.querySelector('input[name="sort"][value="default"]').checked = true;
                break;
            case 'search':
                this.currentFilters.search = '';
                this.searchInput.value = '';
                break;
        }
        this.applyFilters();
    }

    getCategoryDisplayName(category) {
        const names = {
            'electronics': 'Electronics',
            'clothing': 'Clothing',
            'home': 'Home Appliances',
            'sports': 'Sports'
        };
        return names[category] || category;
    }

    getPriceDisplayName(price) {
        const names = {
            '0-50': 'Under $50',
            '50-200': '$50 - $200',
            '200-500': '$200 - $500',
            '500+': 'Above $500'
        };
        return names[price] || price;
    }

    getSortDisplayName(sort) {
        const names = {
            'priceLowHigh': 'Price: Low to High',
            'priceHighLow': 'Price: High to Low',
            'name': 'Name (A-Z)'
        };
        return names[sort] || sort;
    }

    clearAllFilters() {
        this.currentFilters = {
            category: 'all',
            price: 'all',
            sort: 'default',
            search: ''
        };
        
        // Reset radio buttons
        document.querySelector('input[name="category"][value="all"]').checked = true;
        document.querySelector('input[name="price"][value="all"]').checked = true;
        document.querySelector('input[name="sort"][value="default"]').checked = true;
        
        // Clear search
        this.searchInput.value = '';
        
        this.applyFilters();
        this.closeDropdown();
    }

    updateResultsCount(count = null) {
        if (count === null) {
            count = this.products.length;
        }
        this.resultsCount.textContent = `${count} product${count !== 1 ? 's' : ''} found`;
    }

    showNoResultsMessage() {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.innerHTML = `
            <h3>🔍 No products found</h3>
            <p>Try adjusting your filters or search terms</p>
        `;
        this.productList.appendChild(noResultsDiv);
    }

    removeNoResultsMessage() {
        const noResultsMessage = this.productList.querySelector('.no-results');
        if (noResultsMessage) {
            noResultsMessage.remove();
        }
    }

    addToCart(productName, productPrice) {
        const existingItem = this.cart.find(item => item.name === productName);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                name: productName,
                price: productPrice,
                quantity: 1
            });
        }
        
        this.updateCartCount();
        this.showCartNotification(productName);
    }

    updateCartCount() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        this.cartCount.textContent = totalItems;
        
        if (totalItems > 0) {
            this.cartCount.style.display = 'inline-block';
        }
        
        // Save cart to localStorage
        this.saveCart();
    }

    // Add cart persistence methods
    saveCart() {
        try {
            localStorage.setItem('shopCart', JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }

    loadCart() {
        try {
            const savedCart = localStorage.getItem('shopCart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            return [];
        }
    }

    showCartNotification(productName) {
        // Simple notification - you could enhance this with a toast library
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = `${productName} added to cart!`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    showQuickView(productCard) {
        const productName = productCard.querySelector('h3').textContent;
        const productCategory = productCard.querySelector('.product-category').textContent;
        const productPrice = productCard.querySelector('.product-price').textContent;
        const productImage = productCard.querySelector('img').src;
        
        this.modalProductInfo.innerHTML = `
            <div style="text-align: center;">
                <img src="${productImage}" alt="${productName}" style="width: 200px; height: 200px; object-fit: cover; border-radius: 15px; margin-bottom: 1rem;">
                <h2 style="margin-bottom: 0.5rem; color: #333;">${productName}</h2>
                <p style="color: #666; margin-bottom: 1rem; font-style: italic;">${productCategory}</p>
                <p style="font-size: 1.5rem; font-weight: bold; color: #e74c3c; margin-bottom: 1.5rem;">${productPrice}</p>
                <p style="color: #555; line-height: 1.6; margin-bottom: 2rem;">
                    This is a high-quality ${productName.toLowerCase()} perfect for your needs. 
                    Featuring excellent build quality and reliable performance.
                </p>
                <button class="add-to-cart-btn" onclick="productFilter.addToCart('${productName}', ${productCard.dataset.price}); productFilter.closeModal();">
                    Add to Cart
                </button>
            </div>
        `;
        
        this.quickViewModal.style.display = 'block';
    }

    closeModal() {
        this.quickViewModal.style.display = 'none';
    }

    closeDropdown() {
        // Force close dropdown by removing hover state
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
            dropdown.style.pointerEvents = 'none';
            setTimeout(() => {
                dropdown.style.pointerEvents = 'auto';
            }, 100);
        }
    }
}

// Initialize the product filter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.productFilter = new ProductFilter();
});

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add some CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);