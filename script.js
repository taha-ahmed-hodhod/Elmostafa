// Furniture Store Application
class FurnitureStore {
    constructor() {
        this.items = this.loadItems();
        this.currentEditingId = null;
        this.currentLanguage = localStorage.getItem('language') || 'ar';
        // Pagination state
        this.itemsPerPage = 9;
        this.visibleCount = this.itemsPerPage;
        this.init();
    }

    init() {
        console.log('Initializing Furniture Store...');
        this.setLanguage(this.currentLanguage);
        this.bindEvents();
        this.renderItems();
        this.renderDashboardItems();
        this.addSampleData();
        console.log('Items loaded:', this.items.length);
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(link.getAttribute('href').substring(1));
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            // Reset pagination on new search
            this.visibleCount = this.itemsPerPage;
            this.filterItems(e.target.value);
        });

        // Category filtering via select
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                // Reset pagination on category change
                this.visibleCount = this.itemsPerPage;
                this.filterByCategory(e.target.value);
            });
        }

        // Dashboard add item button
        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Modal events
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Form submission
        document.getElementById('itemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveItem();
        });

        // Price calculation on input change
        document.getElementById('itemCommercialPrice').addEventListener('input', () => {
            this.calculateProfit();
        });

        document.getElementById('itemSellingPrice').addEventListener('input', () => {
            this.calculateProfit();
        });

        // Language toggle (check if element exists)
        const languageToggle = document.getElementById('languageToggle');
        if (languageToggle) {
            languageToggle.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }

        // Reset data button
        const resetBtn = document.getElementById('resetDataBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm(this.currentLanguage === 'ar' ? 'هل تريد تصفير البيانات وإعادة التحميل؟' : 'Reset data and reload?')) {
                    localStorage.removeItem('furnitureItems');
                    location.reload();
                }
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('itemModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Image lightbox events
        const lightbox = document.getElementById('imageLightbox');
        const lightboxImg = document.getElementById('lightboxImg');
        const lightboxClose = document.getElementById('imageLightboxClose');
        if (lightbox && lightboxImg && lightboxClose) {
            // Open via event delegation on items grid
            document.addEventListener('click', (e) => {
                const target = e.target;
                if (target && target.classList && target.classList.contains('item-image')) {
                    lightboxImg.src = target.src;
                    lightbox.classList.add('show');
                    lightbox.setAttribute('aria-hidden', 'false');
                    document.body.style.overflow = 'hidden';
                }
            });

            // Close on overlay click or button
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox || e.target === lightboxClose) {
                    lightbox.classList.remove('show');
                    lightbox.setAttribute('aria-hidden', 'true');
                    lightboxImg.removeAttribute('src');
                    document.body.style.overflow = 'auto';
                }
            });

            // Close on ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.classList.contains('show')) {
                    lightbox.classList.remove('show');
                    lightbox.setAttribute('aria-hidden', 'true');
                    lightboxImg.removeAttribute('src');
                    document.body.style.overflow = 'auto';
                }
            });
        }

        // Toggle reveal of commercial price on price area click
        document.addEventListener('click', (e) => {
            const priceRow = e.target.closest('.item-prices');
            const isImage = e.target.closest('.item-image');
            if (priceRow && !isImage) {
                const card = priceRow.closest('.item-card');
                if (card) {
                    card.classList.toggle('reveal-price');
                }
            }
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionId).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`).classList.add('active');

        // Refresh dashboard if needed
        if (sectionId === 'dashboard') {
            this.renderDashboardItems();
        }
    }

    filterItems(searchTerm) {
        const filteredItems = this.items.filter(item => {
            const searchLower = searchTerm.toLowerCase();
            const nameLower = item.name.toLowerCase();
            const numberLower = item.number.toLowerCase();
            const arabicNameLower = (item.arabicName || '').toLowerCase();

            return nameLower.includes(searchLower) ||
                numberLower.includes(searchLower) ||
                arabicNameLower.includes(searchLower);
        });
        this.renderItems(filteredItems);
    }

    filterByCategory(category) {
        // Sync select value if present
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.value = category;
        }

        // Filter items
        const filteredItems = category === 'all'
            ? this.items
            : this.items.filter(item => item.category === category);

        this.renderItems(filteredItems);
    }

    renderItems(items = this.items) {
        console.log('Rendering items:', items.length);
        const itemsGrid = document.getElementById('itemsGrid');
        const loadMoreBtn = document.getElementById('loadMoreBtn');

        if (!itemsGrid) {
            console.error('Items grid not found!');
            return;
        }

        if (items.length === 0) {
            itemsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No items found</h3>
                    <p>Try adjusting your search or category filter</p>
                </div>
            `;
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
                loadMoreBtn.onclick = null;
            }
            return;
        }

        // Determine how many items to show (respect current visibleCount)
        const itemsToShow = items.slice(0, this.visibleCount);

        itemsGrid.innerHTML = itemsToShow.map(item => `
            <div class="item-card" data-id="${item.id}">
                <div class="img-hight">
                    <img src="${item.image}" alt="${item.name}" class="item-image" 
                    onerror="this.src='https://via.placeholder.com/300x250?text=No+Image'">
                </div>
                <div class="item-content">
                    <h3 class="item-name">${this.currentLanguage === 'ar' && item.arabicName ? item.arabicName : item.name}</h3>
                    <p class="item-number">${this.currentLanguage === 'ar' ? 'الرقم الخاص:' : 'Special Number:'} ${item.number}</p>
                    <span class="item-category">${this.getCategoryName(item.category)}</span>
                    ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                    <div class="item-prices">
                        <div class="price-row">
                            <span class="price-label">${this.currentLanguage === 'ar' ? 'السعر التجاري:' : 'Commercial Price:'}</span>
                            <span class="price-value commercial-price">${(item.commercialPrice || 0).toFixed(2)} EGP</span>
                        </div>
                        <div class="price-row">
                            <span class="price-label">${this.currentLanguage === 'ar' ? 'سعر البيع:' : 'Selling Price:'}</span>
                            <span class="price-value selling-price">${(item.sellingPrice || 0).toFixed(2)} EGP</span>
                        </div>

                    </div>
                </div>
            </div>
        `).join('');

        // Setup Load More
        if (loadMoreBtn) {
            if (this.visibleCount < items.length) {
                loadMoreBtn.style.display = 'inline-block';
                loadMoreBtn.textContent = this.currentLanguage === 'ar' ? 'تحميل المزيد' : 'Load more';
                loadMoreBtn.onclick = () => {
                    this.visibleCount += this.itemsPerPage;
                    this.renderItems(items);
                };
            } else {
                loadMoreBtn.style.display = 'none';
                loadMoreBtn.onclick = null;
            }
        }
    }

    renderDashboardItems() {
        const dashboardList = document.getElementById('dashboardItemsList');

        if (this.items.length === 0) {
            dashboardList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <h3>No items yet</h3>
                    <p>Click "Add New Item" to get started</p>
                </div>
            `;
            return;
        }

        dashboardList.innerHTML = this.items.map(item => `
            <div class="dashboard-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="dashboard-item-image"
                    onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'">
                <div class="dashboard-item-info">
                    <h4 class="dashboard-item-name">${this.currentLanguage === 'ar' && item.arabicName ? item.arabicName : item.name}</h4>
                    <div class="dashboard-item-details">
                        <p><strong>${this.currentLanguage === 'ar' ? 'الرقم الخاص:' : 'Special Number:'}</strong> ${item.number}</p>
                        <p><strong>${this.currentLanguage === 'ar' ? 'الفئة:' : 'Category:'}</strong> ${this.getCategoryName(item.category)}</p>
                        <p><strong>${this.currentLanguage === 'ar' ? 'السعر التجاري:' : 'Commercial Price:'}</strong> ${(item.commercialPrice || 0).toFixed(2)} EGP</p>
                        <p><strong>${this.currentLanguage === 'ar' ? 'سعر البيع:' : 'Selling Price:'}</strong> ${(item.sellingPrice || 0).toFixed(2)} EGP</p>
                        ${item.description ? `<p><strong>${this.currentLanguage === 'ar' ? 'الوصف:' : 'Description:'}</strong> ${item.description}</p>` : ''}
                    </div>
                </div>
                <div class="dashboard-item-actions">
                    <button class="btn btn-edit" onclick="furnitureStore.editItem('${item.id}')">
                        <i class="fas fa-edit"></i> ${this.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}
                    </button>
                    <button class="btn btn-danger" onclick="furnitureStore.deleteItem('${item.id}')">
                        <i class="fas fa-trash"></i> ${this.currentLanguage === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    openModal(itemId = null) {
        const modal = document.getElementById('itemModal');
        const form = document.getElementById('itemForm');
        const title = document.getElementById('modalTitle');

        if (itemId) {
            const item = this.items.find(i => i.id === itemId);
            if (item) {
                this.currentEditingId = itemId;
                title.textContent = 'Edit Item';
                form.itemName.value = item.name;
                form.itemArabicName.value = item.arabicName || '';
                form.itemNumber.value = item.number;
                form.itemCategory.value = item.category;
                form.itemDescription.value = item.description || '';
                form.itemCommercialPrice.value = item.commercialPrice || 0;
                form.itemSellingPrice.value = item.sellingPrice || 0;
                // Clear file input for editing - user needs to re-upload
                form.itemImage.value = '';
                // Calculate profit for existing item
                this.calculateProfit();
            }
        } else {
            this.currentEditingId = null;
            title.textContent = 'Add New Item';
            form.reset();
        }

        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('itemModal');
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        this.currentEditingId = null;
    }

    async saveItem() {
        const form = document.getElementById('itemForm');
        const fileInput = form.itemImage;
        let imageDataUrl = null;

        // Handle file upload
        if (fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showMessage('Please select a valid image file', 'error');
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                this.showMessage('Image file size must be less than 5MB', 'error');
                return;
            }

            // Convert file to data URL
            imageDataUrl = await this.fileToDataURL(file);
        } else if (!this.currentEditingId) {
            // New item must have an image
            this.showMessage('Please select an image file', 'error');
            return;
        }

        const formData = {
            name: form.itemName.value.trim(),
            arabicName: form.itemArabicName.value.trim(),
            number: form.itemNumber.value.trim(),
            category: form.itemCategory.value,
            description: form.itemDescription.value.trim(),
            commercialPrice: parseFloat(form.itemCommercialPrice.value) || 0,
            sellingPrice: parseFloat(form.itemSellingPrice.value) || 0
        };

        // Use new image if uploaded, otherwise keep existing for edits
        if (imageDataUrl) {
            formData.image = imageDataUrl;
        } else if (this.currentEditingId) {
            // Keep existing image when editing
            const existingItem = this.items.find(item => item.id === this.currentEditingId);
            formData.image = existingItem ? existingItem.image : null;
        }

        // Validation
        if (!formData.name || !formData.number || !formData.category) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        // Price validation
        if (formData.commercialPrice < 0 || formData.sellingPrice < 0) {
            this.showMessage('Prices cannot be negative', 'error');
            return;
        }

        if (formData.commercialPrice === 0 && formData.sellingPrice === 0) {
            this.showMessage('Please enter at least one price', 'error');
            return;
        }

        // Check for duplicate special number
        const existingItem = this.items.find(item =>
            item.number === formData.number && item.id !== this.currentEditingId
        );
        if (existingItem) {
            this.showMessage('An item with this special number already exists', 'error');
            return;
        }

        if (this.currentEditingId) {
            // Edit existing item
            const itemIndex = this.items.findIndex(item => item.id === this.currentEditingId);
            if (itemIndex !== -1) {
                this.items[itemIndex] = { ...this.items[itemIndex], ...formData };
                this.showMessage('Item updated successfully!', 'success');
            }
        } else {
            // Add new item
            const newItem = {
                id: this.generateId(),
                ...formData,
                createdAt: new Date().toISOString()
            };
            this.items.push(newItem);
            this.showMessage('Item added successfully!', 'success');
        }

        this.saveItems();
        this.closeModal();
        // Reset pagination after save
        this.visibleCount = this.itemsPerPage;
        this.renderItems();
        this.renderDashboardItems();
    }

    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    calculateProfit() {
        const commercialPrice = parseFloat(document.getElementById('itemCommercialPrice').value) || 0;
        const sellingPrice = parseFloat(document.getElementById('itemSellingPrice').value) || 0;
        const priceInfo = document.getElementById('priceInfo');
        const profitValue = document.getElementById('profitValue');

        if (commercialPrice > 0 && sellingPrice > 0) {
            const profit = sellingPrice - commercialPrice;
            const profitPercentage = commercialPrice > 0 ? ((profit / commercialPrice) * 100) : 0;

            priceInfo.style.display = 'block';
            profitValue.textContent = `${profit.toFixed(2)} EGP (${profitPercentage.toFixed(1)}%)`;
            profitValue.className = profit >= 0 ? 'profit-value' : 'profit-value negative';
        } else {
            priceInfo.style.display = 'none';
        }
    }

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'en' ? 'ar' : 'en';
        this.setLanguage(this.currentLanguage);
        localStorage.setItem('language', this.currentLanguage);
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        // Update all elements with data attributes
        document.querySelectorAll('[data-en][data-ar]').forEach(element => {
            element.textContent = element.getAttribute(`data-${lang}`);
        });

        // Update placeholders
        document.querySelectorAll('input[data-en][data-ar]').forEach(input => {
            input.placeholder = input.getAttribute(`data-${lang}`);
        });

        // Update language toggle button (if it exists)
        const langToggle = document.getElementById('languageToggle');
        if (langToggle) {
            const langText = langToggle.querySelector('.lang-text');
            if (langText) {
                langText.textContent = lang === 'en' ? 'العربية' : 'English';
            }
        }

        // Re-render items to update language and reset pagination
        this.visibleCount = this.itemsPerPage;
        this.renderItems();
        this.renderDashboardItems();
    }

    getCategoryName(category) {
        const categories = {
            'chairs': { en: 'Chairs', ar: 'كراسي' },
            'tables': { en: 'Tables', ar: 'ترابيزات' },
            'sofas': { en: 'Sofas', ar: 'السلالم' },
            'storage': { en: 'Storage', ar: 'الشماعات' },
            'beds': { en: 'Beds', ar: 'السراير' },
            'desk': { en: 'desks', ar: 'المكاتب' }
        };
        return categories[category] ? categories[category][this.currentLanguage] : category;
    };

    editItem(itemId) {
        this.openModal(itemId);
    }

    deleteItem(itemId) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.items = this.items.filter(item => item.id !== itemId);
            this.saveItems();
            this.renderItems();
            this.renderDashboardItems();
            this.showMessage('Item deleted successfully!', 'success');
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // Insert at the top of the main content
        const main = document.querySelector('main');
        main.insertBefore(messageDiv, main.firstChild);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    addSampleData() {
        if (this.items.length === 0) {
            const sampleItems = [
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي بار 80 سم بدهر",
                    number: "0001",
                    category: "chairs",
                    image: "./images/1.png",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي بار 60 سم بدهر",
                    number: "0002",
                    category: "chairs",
                    image: "./images/2.png",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي بار 50 سم بدهر",
                    number: "0003",
                    category: "chairs",
                    image: "./images/3.png",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي بار 30 سم بدهر",
                    number: "0004",
                    category: "chairs",
                    image: "./images/4.png",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي بار 80 سم بدون دهر",
                    number: "0005",
                    category: "chairs",
                    image: "./images/5.png",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي بار 60 سم بدون دهر",
                    number: "0006",
                    category: "chairs",
                    image: "./images/6.png",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي بار 50 سم بدون دهر",
                    number: "0007",
                    category: "chairs",
                    image: "./images/7.png",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },

                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي بار 30 سم بدون دهر",
                    number: "0008",
                    category: "chairs",
                    image: "./images/8.png",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي سدايب",
                    number: "0009",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي منجد",
                    number: "0010",
                    category: "chairs",
                    image: "./images/10.png",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي منجد جديد دمياط",
                    number: "0011",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي فتح وقفل",
                    number: "0012",
                    category: "chairs",
                    image: "./images/12.png",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي شنطة (بحر)",
                    number: "0013",
                    category: "chairs",
                    image: "./images/13.png",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي سلم كبير",
                    number: "0014",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي سلم صغير",
                    number: "0015",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي حضانة زان",
                    number: "0016",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي حضانة سويد",
                    number: "0017",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي هزاز كبير",
                    number: "0018",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي هزاز صغير",
                    number: "0019",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي سفرة عمر بدهر مفتوح",
                    number: "0020",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي سفرة عمر فراشة",
                    number: "0021",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي سفرة بدهر مفتوح",
                    number: "0022",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي سفرة بدهر زان",
                    number: "0023",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي سفرة بدهر عدل",
                    number: "0024",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي سفرة بدهر قديم",
                    number: "0025",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي تسريحة فراشة برجل 30 سم",
                    number: "0026",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي تسريحة عدل برجل 40 سم",
                    number: "0027",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "كرسي تسريحة عدل برجل 40 سم",
                    number: "0027",
                    category: "chairs",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة مطبخ 150 سم زان",
                    number: "0028",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة مطبخ 120 سم زان",
                    number: "0029",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة مطبخ 1 م زان",
                    number: "0030",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة مطبخ 150 سم فورميكا",
                    number: "0031",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة مطبخ 120 سم فورميكا",
                    number: "0032",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة مطبخ 120 سم فورميكا",
                    number: "0032",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة مطبخ 1 م فورميكا",
                    number: "0033",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة مطبخ 120 سم علبة زان",
                    number: "0034",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة مطبخ 120 سم علبة فورميكا",
                    number: "0035",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة شنطة",
                    number: "0036",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة قهوة متر * 60 زان",
                    number: "0037",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة قهوة 60 * 80 زان",
                    number: "0038",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "طقطوقة قهوة زان",
                    number: "0039",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة قهوة متر * 60 سويد",
                    number: "0040",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة 40 * 40 واحد دور",
                    number: "0041",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة 40 * 60  اتنين دور",
                    number: "0042",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة 40 * 80  اتنين دور",
                    number: "0043",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة سفرة 6*1",
                    number: "0044",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة سفرة 4*1 بيضاوى",
                    number: "0045",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة سفرة 4*1 داير",
                    number: "0046",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة سفرة فردانى 170*90 بيضاوى",
                    number: "0047",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة سفرة دايرة",
                    number: "0048",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة انترية صوابع بيضاوى كامل هدهد",
                    number: "0049",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة انترية صوابع دائرى هدهد",
                    number: "0050",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة انترية صوابع سداسي هدهد",
                    number: "0051",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة انترية صوابع مستطيل هدهد",
                    number: "0052",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة انترية صوابع نص دايرة هدهد",
                    number: "0053",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة انترية صوابع بيضاوى كامل دمياط",
                    number: "0054",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة انترية صوابع دائرى دمياط",
                    number: "0055",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة انترية صوابع سداسي دمياط",
                    number: "0056",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة انترية صوابع مستطيل دمياط",
                    number: "0057",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة انترية صوابع نص دايرة دمياط",
                    number: "0058",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة انترية طبق ليزر",
                    number: "0059",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "ترابيزة انترية مفرغ",
                    number: "0060",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "طقطوقة بورسعيد فورميكا",
                    number: "0061",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "طقم 3*1 صوابع",
                    number: "0062",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "طقم 3*1 ليزر خفيف",
                    number: "0063",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "طقم 3*1 ليزر وسط",
                    number: "0064",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "طقم 3*1 ليزر ثقيل",
                    number: "0065",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "طقم 3*1 اشكال",
                    number: "0066",
                    category: "tables",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "سلم 2 م",
                    number: "0067",
                    category: "sofas",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "سلم 150 سم",
                    number: "0068",
                    category: "sofas",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "سلم 120 سم",
                    number: "0069",
                    category: "sofas",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "سلم 3 م ثقيل",
                    number: "0070",
                    category: "sofas",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "سلم 250 سم ثقيل",
                    number: "0071",
                    category: "sofas",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "سلم 2 م ثقيل",
                    number: "0072",
                    category: "sofas",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة مراية كبيرة",
                    number: "0073",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة مراية لف",
                    number: "0074",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة مراية صغيرة",
                    number: "0075",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة عجينة",
                    number: "0076",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة مربعة زان تشتطيب كونتر",
                    number: "0077",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة مربعة زان تشتطيب زان",
                    number: "0078",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة سويد 2 طبق",
                    number: "0079",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة مدورة زان بقاعدة طبق",
                    number: "0080",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة سويد تقيلة",
                    number: "0081",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة مشيشة خفيفة",
                    number: "0082",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة علبة خفيفة",
                    number: "0083",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة علبة ثقيلة",
                    number: "0084",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة دايرة زان تشطيب كونتر",
                    number: "0085",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "شماعة مراية بدرج",
                    number: "0086",
                    category: "storage",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "سرير سندوتش",
                    number: "0087",
                    category: "beds",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "سرير باكم هزاز",
                    number: "0088",
                    category: "beds",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "سرير كمنجا خفيف هزاز",
                    number: "0089",
                    category: "beds",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "سرير 120 سم سويد خفيف",
                    number: "0090",
                    category: "beds",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "سرير 120 سم سويد تقيل",
                    number: "0091",
                    category: "beds",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "مكتب 80 سم مدهون",
                    number: "0092",
                    category: "desk",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "مكتب 80 سم ابيض",
                    number: "0093",
                    category: "desk",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "مكتب 1 م مدهون",
                    number: "0094",
                    category: "desk",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "مكتب 1 م ابيض",
                    number: "0095",
                    category: "desk",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "مكتب 120 سم مدهون",
                    number: "0096",
                    category: "desk",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "Modern Leather Sofa",
                    arabicName: "مكتب 120 سم ابيض",
                    number: "0097",
                    category: "desk",
                    image: "./images/FB_IMG_1757260977727.jpg",
                    description: "",
                    commercialPrice: 430.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },


            ];

            this.items = sampleItems;
            this.saveItems();
        }
    }

    loadItems() {
        const saved = localStorage.getItem('furnitureItems');
        return saved ? JSON.parse(saved) : [];
    }

    saveItems() {
        localStorage.setItem('furnitureItems', JSON.stringify(this.items));
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    const furnitureStore = new FurnitureStore();
    window.furnitureStore = furnitureStore;
    // Footer year
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});
