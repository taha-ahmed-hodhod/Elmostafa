// ====== Utilities ======
function showWelcomeNotification() {
    const welcome = document.getElementById('welcomeNotification');
    if (welcome) {
        welcome.style.display = 'flex';
        setTimeout(() => {
            welcome.style.display = 'none';
        }, 5000);
    }
}

function setupScrollToTopBtn() {
    const scrollBtn = document.getElementById('scrollToTopBtn');
    if (!scrollBtn) return;
    window.addEventListener('scroll', function () {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });
    scrollBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
class FurnitureStore {
    constructor() {
        this.items = this.loadItems();
        this.currentEditingId = null;
        this.currentLanguage = localStorage.getItem('language') || 'ar';
        // Check for saved preference first, then fall back to system preference
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme !== null) {
            this.isDarkMode = savedTheme === 'true';
        } else {
            // Detect system preference
            this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        // Pagination state
        this.itemsPerPage = 12;
        this.visibleCount = this.itemsPerPage;
        this.init();
    }

    init() {
        console.log('Initializing Furniture Store...');
        this.setLanguage(this.currentLanguage);
        this.initDarkMode();
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
                const category = e.target.value;
                this.renderSubFilters(category);
                this.filterByCategory(category);
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

        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });

            // Double-click to reset to system theme
            darkModeToggle.addEventListener('dblclick', () => {
                this.resetToSystemTheme();
                // Show a brief message
                this.showMessage(
                    this.currentLanguage === 'ar'
                        ? 'تم إعادة تعيين الوضع إلى إعدادات النظام'
                        : 'Theme reset to system preference',
                    'success'
                );
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
            // تحديث عدد المنتجات بجانب اسم الفئة
            const options = categorySelect.options;
            // حساب عدد المنتجات لكل فئة
            const counts = {};
            this.items.forEach(item => {
                counts[item.category] = (counts[item.category] || 0) + 1;
            });
            for (let i = 0; i < options.length; i++) {
                const opt = options[i];
                if (opt.value === 'all') {
                    opt.textContent = this.currentLanguage === 'ar' ? `جميع العناصر (${this.items.length})` : `All Items (${this.items.length})`;
                } else {
                    const count = counts[opt.value] || 0;
                    opt.textContent = `${this.getCategoryName(opt.value)} (${count})`;
                }
            }
        }

        // Filter items
        const filteredItems = category === 'all'
            ? this.items
            : this.items.filter(item => item.category === category);

        // Apply sub-filter if present
        const subFiltersContainer = document.getElementById('subFiltersContainer');
        if (subFiltersContainer && subFiltersContainer.dataset.activeSub) {
            const subKey = subFiltersContainer.dataset.activeSub;
            const subValue = subFiltersContainer.dataset.activeValue || 'all';
            const refined = this.applySubFilter(category, filteredItems, subKey, subValue);
            this.renderItems(refined);
            return;
        }

        this.renderItems(filteredItems);
    }

    // Render accordion-like sub-filters based on category
    renderSubFilters(category) {
        const container = document.getElementById('subFiltersContainer');
        if (!container) return;

        const clearContainer = () => {
            container.innerHTML = '';
            container.style.display = 'none';
            delete container.dataset.activeSub;
            delete container.dataset.activeValue;
        };

        if (category === 'chairs') {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="category-select-wrapper">
                    <select id="chairsTypeSelect" class="category-select">
                        <option value="all">كل الانواع</option>
                        <option value="bar">بار</option>
                        <option value="selm">سلم</option>
                        <option value="dining">سفرة</option>
                         <option value="hazaz">هزاز</option>
                        <option value="bafat">بفات</option>
                    </select>
                </div>
            `;
            container.dataset.activeSub = 'chairsType';
            container.dataset.activeValue = 'all';
            const chairsTypeSelect = document.getElementById('chairsTypeSelect');
            if (chairsTypeSelect) {
                chairsTypeSelect.addEventListener('change', (e) => {
                    container.dataset.activeValue = e.target.value;
                    this.filterByCategory('chairs');
                });
            }
            return;
        }


        if (category === 'tables') {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="category-select-wrapper">
                    <select id="tablesTypeSelect" class="category-select">
                        <option value="all">كل الأنواع</option>
                        <option value="matbakh">مطبخ</option>
                        <option value="thabta">ثابتة</option>
                        <option value="coffee">انترية</option>
                        <option value="dining">سفرة</option>
                        <option value="taqm">الاطقم</option>
                        <option value="taqtoqa">طقطوقة</option>
                        <option value="tv">شاشة</option>
                    </select>
                </div>
            `;
            container.dataset.activeSub = 'tablesType';
            container.dataset.activeValue = 'all';
            const tablesTypeSelect = document.getElementById('tablesTypeSelect');
            if (tablesTypeSelect) {
                tablesTypeSelect.addEventListener('change', (e) => {
                    container.dataset.activeValue = e.target.value;
                    this.filterByCategory('tables');
                });             
            }
            return;
        }
        if (category === 'storage') {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="category-select-wrapper">
                    <select id="storageTypeSelect" class="category-select">
                        <option value="all">كل الأنواع</option>
                        <option value="abyad">أبيض</option>
                        <option value="mraya">مراية</option>
                        <option value="madhon">مدهون</option>
                    </select>
                </div>
            `;
            container.dataset.activeSub = 'storageType';
            container.dataset.activeValue = 'all';
            const tablesTypeSelect = document.getElementById('storageTypeSelect');
            if (tablesTypeSelect) {
                tablesTypeSelect.addEventListener('change', (e) => {
                    container.dataset.activeValue = e.target.value;
                    this.filterByCategory('storage');
                });
            }
            return;
        }
        if (category === 'trabezatmadhona') {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="category-select-wrapper">
                    <select id="trabezatmadhonaTypeSelect" class="category-select">
                        <option value="all">كل الانواع</option>
                        <option value="anterniya">انترية</option>
                        <option value="taqm">الاطقم</option>
                        <option value="taqtoqa">طقطوقة</option>
                        <option value="tv">شاشة</option>
                    </select>
                </div>
            `;
            container.dataset.activeSub = 'trabezatmadhonaType';
            container.dataset.activeValue = 'all';
            const trabezatmadhonaTypeSelect = document.getElementById('trabezatmadhonaTypeSelect');
            if (trabezatmadhonaTypeSelect) {
                trabezatmadhonaTypeSelect.addEventListener('change', (e) => {
                    container.dataset.activeValue = e.target.value;
                    this.filterByCategory('trabezatmadhona');
                });
            }
            return;
        }
        if (category === 'gazamatmadhona') {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="category-select-wrapper">
                    <select id="gazamatmadhonaTypeSelect" class="category-select">
                        <option value="all">كل الانواع</option>
                        <option value="whadat">وحدات تخزين</option>
                        <option value="formyka">فورميكا</option>
                        <option value="kontar">كونتر</option>
                    </select>
                </div>
            `;
            container.dataset.activeSub = 'gazamatmadhonaType';
            container.dataset.activeValue = 'all';
            const gazamatmadhonaTypeSelect = document.getElementById('gazamatmadhonaTypeSelect');
            if (gazamatmadhonaTypeSelect) {
                gazamatmadhonaTypeSelect.addEventListener('change', (e) => {
                    container.dataset.activeValue = e.target.value;
                    this.filterByCategory('gazamatmadhona');
                });
            }
            return;
        }
        if (category === 'istales') {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="category-select-wrapper">
                    <select id="istalesTypeSelect" class="category-select">
                        <option value="all">كل الانواع</option>
                        <option value="taqm">الاطقم</option>
                        <option value="kebera">كبيرة</option>
                        <option value="morab3">مربعة / بيضاوى</option>
                        <option value="soqera">صغيرة</option>
                        <option value="taqtoqa">طقطوقة</option>
                    </select>
                </div>
            `;
            container.dataset.activeSub = 'istalesType';
            container.dataset.activeValue = 'all';
            const istalesTypeSelect = document.getElementById('istalesTypeSelect');
            if (istalesTypeSelect) {
                istalesTypeSelect.addEventListener('change', (e) => {
                    container.dataset.activeValue = e.target.value;
                    this.filterByCategory('istales');
                });
            }
            return;
        }
        if (category === 'regol') {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="category-select-wrapper">
                    <select id="regolTypeSelect" class="category-select">
                        <option value="all">كل الانواع</option>
                        <option value="taqm">الاطقم</option>
                        <option value="ka3b">الكعوب</option>
                        <option value="reglBezawya">رجل بزاوية</option>
                        <option value="istales">الاستلس</option>
                    </select>
                </div>
            `;
            container.dataset.activeSub = 'regolType';
            container.dataset.activeValue = 'all';
            const regolTypeSelect = document.getElementById('regolTypeSelect');
            if (regolTypeSelect) {
                regolTypeSelect.addEventListener('change', (e) => {
                    container.dataset.activeValue = e.target.value;
                    this.filterByCategory('regol');
                });
            }
            return;
        }

        // No sub-filters for other categories for now
        clearContainer();
    }

    // Apply sub-filter rules
    applySubFilter(category, items, subKey, value) {
        if (!value || value === 'all') return items;
        const nameIncludes = (item, token) =>
            (item.arabicName || item.name || '').toLowerCase().includes(token.toLowerCase());

        if (category === 'chairs' && subKey === 'chairsType') {
            if (value === 'bar') return items.filter(i => nameIncludes(i, 'بار'));
            if (value === 'selm') return items.filter(i => nameIncludes(i, 'سلم'));
            if (value === 'dining') return items.filter(i => nameIncludes(i, 'سفرة'));
            if (value === 'bafat') return items.filter(i => nameIncludes(i, 'بف'));
            if (value === 'hazaz') return items.filter(i => nameIncludes(i, 'هزاز'));
        }

        if (category === 'tables' && subKey === 'tablesType') {
            if (value === 'tv') return items.filter(i => nameIncludes(i, 'شاشة'));
            if (value === 'matbakh') return items.filter(i => nameIncludes(i, 'مطبخ') || nameIncludes(i, 'شنطة'));
            if (value === 'coffee') return items.filter(i => nameIncludes(i, 'انترية'));
            if (value === 'thabta') return items.filter(i => nameIncludes(i, 'قهوة') || nameIncludes(i, 'واحد دور') || nameIncludes(i, 'اتنين دور') || nameIncludes(i, ' الرحمة'));
            if (value === 'taqm') return items.filter(i => nameIncludes(i, 'طقم'));
            if (value === 'taqtoqa') return items.filter(i => nameIncludes(i, 'طقطوقة'));
            if (value === 'dining') return items.filter(i => nameIncludes(i, 'سفرة'));
        }

        if (category === 'storage' && subKey === 'storageType') {
            if (value === 'abyad') return items.filter(i => nameIncludes(i, 'عجينة') || nameIncludes(i, 'زان') || nameIncludes(i, 'سويد') || nameIncludes(i, 'مشيشة') || nameIncludes(i, 'علبة') || nameIncludes(i, 'فواطة'));
            if (value === 'madhon') return items.filter(i => nameIncludes(i, 'مدهون'));
            if (value === 'mraya') return items.filter(i => nameIncludes(i, 'مراية'));
        }
        if (category === 'trabezatmadhona' && subKey === 'trabezatmadhonaType') {
            if (value === 'anterniya') return items.filter(i => nameIncludes(i, 'انترية'));
            if (value === 'taqm') return items.filter(i => nameIncludes(i, 'طقم'));
            if (value === 'taqtoqa') return items.filter(i => nameIncludes(i, 'طقطوقة'));
            if (value === 'tv') return items.filter(i => nameIncludes(i, 'شاشة'));
        }
        if (category === 'gazamatmadhona' && subKey === 'gazamatmadhonaType') {
            if (value === 'whadat') return items.filter(i => nameIncludes(i, ' ادراج') || nameIncludes(i, 'دولاب ') || nameIncludes(i, 'كانسور') || nameIncludes(i, 'الشريف') || nameIncludes(i, 'مراية'));
            if (value === 'formyka') return items.filter(i => nameIncludes(i, 'فورميكا'));
            if (value === 'kontar') return items.filter(i => nameIncludes(i, 'كونتر'));
        }
        if (category === 'istales' && subKey === 'istalesType') {
            if (value === 'taqm') return items.filter(i => nameIncludes(i, 'طقم'));
            if (value === 'kebera') return items.filter(i => nameIncludes(i, 'كبيرة'));
            if (value === 'morab3') return items.filter(i => nameIncludes(i, 'مربعة'));
            if (value === 'soqera') return items.filter(i => nameIncludes(i, 'صغيرة'));
            if (value === 'taqtoqa') return items.filter(i => nameIncludes(i, 'طقطوقة'));
        }
        if (category === 'regol' && subKey === 'regolType') {
            if (value === 'taqm') return items.filter(i => nameIncludes(i, 'طقم'));
            if (value === 'ka3b') return items.filter(i => nameIncludes(i, 'كعب'));
            if (value === 'reglBezawya') return items.filter(i => nameIncludes(i, 'رجل بزاوية'));
            if (value === 'istales') return items.filter(i => nameIncludes(i, 'رجل استلس'));
        }

        return items;
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
                    onerror="this.src='./images/Segment_٢٠٢٥٠٩٠٦_١٣٣٩٤٠٧٥٠.png'" loading="lazy">
                </div>
                <div class="item-content">
                    <h3 class="item-name">${this.currentLanguage === 'ar' && item.arabicName ? item.arabicName : item.name}</h3>
                    <p class="item-number">${this.currentLanguage === 'ar' ? ' رقم المنتج:' : 'Special Number:'} ${item.number}</p>
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
                    onerror="this.src='./images/Segment_٢٠٢٥٠٩٠٦_١٣٣٩٤٠٧٥٠.png'" loading="lazy">
                <div class="dashboard-item-info">
                    <h4 class="dashboard-item-name">${this.currentLanguage === 'ar' && item.arabicName ? item.arabicName : item.name}</h4>
                    <div class="dashboard-item-details">
                        <p><strong>${this.currentLanguage === 'ar' ? ' رقم المنتج:' : 'Special Number:'}</strong> ${item.number}</p>
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
        this.updateDarkModeIcon();
    }

    getCategoryName(category) {
        const categories = {
            'chairs': { en: 'Chairs', ar: 'كراسي' },
            'tables': { en: 'Tables', ar: 'ترابيزات' },
            'sofas': { en: 'Sofas', ar: 'السلالم' },
            'storage': { en: 'Storage', ar: 'الشماعات' },
            'beds': { en: 'Beds', ar: 'السراير' },
            'desk': { en: 'desks', ar: 'المكاتب' },
            'boxs': { en: 'boxs', ar: 'الجزامات' },
            'fedyat': { en: 'fedyat', ar: 'فضية' },
            'trabezatmadhona': { en: 'trabezatmadhona', ar: 'ترابيزات مدهونة' },
            'gazamatmadhona': { en: 'gazamatmadhona', ar: 'جزامات مدهونة' },
            'berwaz': { en: 'berwaz', ar: 'براويز' },
            'hamelMoshaf': { en: 'hamelMoshaf', ar: 'حامل مصحف' },
            'istales': { en: 'istales', ar: 'استلس تيل'},
            'regol': { en: 'regol', ar: 'الرجول'},
            'hlaya': { en: 'hlaya', ar: 'الحلايا'},

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
                    name: "",
                    arabicName: "كرسي بار 80 سم بدهر",
                    number: "0001",
                    category: "chairs",
                    image: "./images/1.png",
                    description: "",
                    commercialPrice: 480.00,
                    sellingPrice: 500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي بار 60 سم بدهر",
                    number: "0002",
                    category: "chairs",
                    image: "./images/2.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 480.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
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
                    name: "",
                    arabicName: "كرسي بار 30 سم بدهر",
                    number: "0004",
                    category: "chairs",
                    image: "./images/4.png",
                    description: "",
                    commercialPrice: 385.00,
                    sellingPrice: 400.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي بار 80 سم بدون دهر",
                    number: "0005",
                    category: "chairs",
                    image: "./images/5.png",
                    description: "",
                    commercialPrice: 415.00,
                    sellingPrice: 430.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي بار 60 سم بدون دهر",
                    number: "0006",
                    category: "chairs",
                    image: "./images/6.png",
                    description: "",
                    commercialPrice: 375.00,
                    sellingPrice: 400.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي بار 50 سم بدون دهر",
                    number: "0007",
                    category: "chairs",
                    image: "./images/7.png",
                    description: "",
                    commercialPrice: 365.00,
                    sellingPrice: 380.00,
                    createdAt: new Date().toISOString()
                },

                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي بار 30 سم بدون دهر",
                    number: "0008",
                    category: "chairs",
                    image: "./images/8.png",
                    description: "",
                    commercialPrice: 325.00,
                    sellingPrice: 350.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي سدايب",
                    number: "0009",
                    category: "chairs",
                    image: "./images/9.png",
                    description: "",
                    commercialPrice: 500.00,
                    sellingPrice: 530.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي منجد",
                    number: "0010",
                    category: "chairs",
                    image: "./images/10.png",
                    description: "",
                    commercialPrice: 525.00,
                    sellingPrice: 550.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي منجد جديد دمياط",
                    number: "0011",
                    category: "chairs",
                    image: "./images/11.png",
                    description: "",
                    commercialPrice: 700.00,
                    sellingPrice: 750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي فتح وقفل",
                    number: "0012",
                    category: "chairs",
                    image: "./images/12.png",
                    description: "",
                    commercialPrice: 415.00,
                    sellingPrice: 430.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي شنطة (بحر)",
                    number: "0013",
                    category: "chairs",
                    image: "./images/13.png",
                    description: "",
                    commercialPrice: 310.00,
                    sellingPrice: 330.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي سلم كبير",
                    number: "0014",
                    category: "chairs",
                    image: "./images/14.png",
                    description: "",
                    commercialPrice: 725.00,
                    sellingPrice: 800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي سلم صغير",
                    number: "0015",
                    category: "chairs",
                    image: "./images/15.png",
                    description: "",
                    commercialPrice: 675.00,
                    sellingPrice: 700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي حضانة زان",
                    number: "0016",
                    category: "chairs",
                    image: "./images/16.png",
                    description: "",
                    commercialPrice: 320.00,
                    sellingPrice: 350.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي حضانة سويد",
                    number: "0017",
                    category: "chairs",
                    image: "./images/17.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 0.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي هزاز كبير",
                    number: "0018",
                    category: "chairs",
                    image: "./images/18.png",
                    description: "",
                    commercialPrice: 1400.00,
                    sellingPrice: 1450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي هزاز صغير",
                    number: "0019",
                    category: "chairs",
                    image: "./images/19.png",
                    description: "",
                    commercialPrice: 1200.00,
                    sellingPrice: 1300.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي سفرة عمر بدهر مفتوح",
                    number: "0020",
                    category: "chairs",
                    image: "./images/20.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي سفرة عمر فراشة",
                    number: "0021",
                    category: "chairs",
                    image: "./images/21.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي سفرة بدهر مفتوح",
                    number: "0022",
                    category: "chairs",
                    image: "./images/22.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي سفرة بدهر زان",
                    number: "0023",
                    category: "chairs",
                    image: "./images/23.png",
                    description: "",
                    commercialPrice: 550.00,
                    sellingPrice: 600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي سفرة بدهر عدل",
                    number: "0024",
                    category: "chairs",
                    image: "./images/24.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي سفرة بدهر قديم",
                    number: "0025",
                    category: "chairs",
                    image: "./images/25.png",
                    description: "",
                    commercialPrice: 400.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي تسريحة فراشة برجل 30 سم",
                    number: "0026",
                    category: "chairs",
                    image: "./images/26.png",
                    description: "",
                    commercialPrice: 350.00,
                    sellingPrice: 380.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي تسريحة عدل برجل 40 سم",
                    number: "0027",
                    category: "chairs",
                    image: "./images/27.png",
                    description: "",
                    commercialPrice: 350.00,
                    sellingPrice: 380.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة مطبخ 150 سم زان",
                    number: "0028",
                    category: "tables",
                    image: "./images/28.png",
                    description: "",
                    commercialPrice: 1450.00,
                    sellingPrice: 1550.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة مطبخ 120 سم زان",
                    number: "0029",
                    category: "tables",
                    image: "./images/29.png",
                    description: "",
                    commercialPrice: 1050.00,
                    sellingPrice: 1150.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة مطبخ 1 م زان",
                    number: "0030",
                    category: "tables",
                    image: "./images/30.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة مطبخ 150 سم فورميكا",
                    number: "0031",
                    category: "tables",
                    image: "./images/31.png",
                    description: "",
                    commercialPrice: 1350.00,
                    sellingPrice: 1450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة مطبخ 120 سم فورميكا",
                    number: "0032",
                    category: "tables",
                    image: "./images/32.png",
                    description: "",
                    commercialPrice: 950.00,
                    sellingPrice: 1050.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة مطبخ 1 م فورميكا",
                    number: "0033",
                    category: "tables",
                    image: "./images/33.png",
                    description: "",
                    commercialPrice: 900.00,
                    sellingPrice: 1000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة مطبخ 120 سم علبة زان",
                    number: "0034",
                    category: "tables",
                    image: "./images/29.png",
                    description: "خلصان",
                    commercialPrice: 1200.00,
                    sellingPrice: 1250.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة مطبخ 120 سم علبة فورميكا",
                    number: "0035",
                    category: "tables",
                    image: "./images/32.png",
                    description: "خلصان",
                    commercialPrice: 1100.00,
                    sellingPrice: 1150.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شنطة فورميكا",
                    number: "0036",
                    category: "tables",
                    image: "./images/36.png",
                    description: "",
                    commercialPrice: 700.00,
                    sellingPrice: 750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة قهوة متر * 60 زان",
                    number: "0037",
                    category: "tables",
                    image: "./images/37.png",
                    description: "",
                    commercialPrice: 850.00,
                    sellingPrice: 950.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة قهوة 60 * 80 زان",
                    number: "0038",
                    category: "tables",
                    image: "./images/38.png",
                    description: "",
                    commercialPrice: 750.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة قهوة زان",
                    number: "0039",
                    category: "tables",
                    image: "./images/39.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة قهوة متر * 60 سويد",
                    number: "0040",
                    category: "tables",
                    image: "./images/40.png",
                    description: "",
                    commercialPrice: 750.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة 40 * 40 واحد دور",
                    number: "0041",
                    category: "tables",
                    image: "./images/41.png",
                    description: "",
                    commercialPrice: 650.00,
                    sellingPrice: 750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة 40 * 60  اتنين دور",
                    number: "0042",
                    category: "tables",
                    image: "./images/42.png",
                    description: "",
                    commercialPrice: 700.00,
                    sellingPrice: 800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة 40 * 80  اتنين دور",
                    number: "0043",
                    category: "tables",
                    image: "./images/43.png",
                    description: "",
                    commercialPrice: 750.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة سفرة 6*1",
                    number: "0044",
                    category: "tables",
                    image: "./images/44.png",
                    description: "",
                    commercialPrice: 3500.00,
                    sellingPrice: 3500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة سفرة 4*1 بيضاوى",
                    number: "0045",
                    category: "tables",
                    image: "./images/45.png",
                    description: "خلصان",
                    commercialPrice: 2500.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة سفرة 4*1 داير",
                    number: "0046",
                    category: "tables",
                    image: "./images/46.png",
                    description: "",
                    commercialPrice: 2500.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة سفرة فردانى 170*90 بيضاوى",
                    number: "0047",
                    category: "tables",
                    image: "./images/47.png",
                    description: "",
                    commercialPrice: 2200.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة سفرة دايرة",
                    number: "0048",
                    category: "tables",
                    image: "./images/48.png",
                    description: "",
                    commercialPrice: 2200.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع بيضاوى كامل هدهد",
                    number: "0049",
                    category: "tables",
                    image: "./images/49.png",
                    description: "",
                    commercialPrice: 800.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع دائرى هدهد",
                    number: "0050",
                    category: "tables",
                    image: "./images/50.png",
                    description: "",
                    commercialPrice: 800.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع سداسي هدهد",
                    number: "0051",
                    category: "tables",
                    image: "./images/51.png",
                    description: "",
                    commercialPrice: 800.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع مستطيل هدهد",
                    number: "0052",
                    category: "tables",
                    image: "./images/52.png",
                    description: "",
                    commercialPrice: 800.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع نص دايرة هدهد",
                    number: "0053",
                    category: "tables",
                    image: "./images/53.png",
                    description: "",
                    commercialPrice: 800.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع بيضاوى كامل دمياط",
                    number: "0054",
                    category: "tables",
                    image: "./images/54.png",
                    description: "",
                    commercialPrice: 550.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع دائرى دمياط",
                    number: "0055",
                    category: "tables",
                    image: "./images/55.png",
                    description: "خلصان",
                    commercialPrice: 550.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع سداسي دمياط",
                    number: "0056",
                    category: "tables",
                    image: "./images/56.png",
                    description: "خلصان",
                    commercialPrice: 550.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع مستطيل دمياط",
                    number: "0057",
                    category: "tables",
                    image: "./images/57.png",
                    description: "",
                    commercialPrice: 550.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع نص دايرة (زجزاج) دمياط",
                    number: "0058",
                    category: "tables",
                    image: "./images/58.png",
                    description: "",
                    commercialPrice: 550.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية طبق ليزر",
                    number: "0059",
                    category: "tables",
                    image: "images/59.png",
                    description: "",
                    commercialPrice: 700.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مفرغ حفر",
                    number: "0060",
                    category: "tables",
                    image: "./images/60.png",
                    description: "",
                    commercialPrice: 700.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة بورسعيد فورميكا",
                    number: "0061",
                    category: "tables",
                    image: "./images/61.png",
                    description: "",
                    commercialPrice: 500.00,
                    sellingPrice: 600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3*1 صوابع",
                    number: "0062",
                    category: "tables",
                    image: "./images/62.png",
                    description: "",
                    commercialPrice: 1350.00,
                    sellingPrice: 1450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3*1 ليزر خفيف",
                    number: "0063",
                    category: "tables",
                    image: "./images/63.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3*1 ليزر وسط",
                    number: "0064",
                    category: "tables",
                    image: "./images/64.png",
                    description: "",
                    commercialPrice: 600.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3*1 ليزر ثقيل",
                    number: "0065",
                    category: "tables",
                    image: "./images/65.png",
                    description: "",
                    commercialPrice: 800.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3*1 اشكال",
                    number: "0066",
                    category: "tables",
                    image: "./images/66.png",
                    description: "",
                    commercialPrice: 800.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "سلم 2 م",
                    number: "0067",
                    category: "sofas",
                    image: "./images/67.png",
                    description: "",
                    commercialPrice: 600.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "سلم 150 سم",
                    number: "0068",
                    category: "sofas",
                    image: "./images/68.png",
                    description: "",
                    commercialPrice: 485.00,
                    sellingPrice: 520.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "سلم 120 سم",
                    number: "0069",
                    category: "sofas",
                    image: "./images/69.png",
                    description: "",
                    commercialPrice: 400.00,
                    sellingPrice: 430.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "سلم 3 م ثقيل",
                    number: "0070",
                    category: "sofas",
                    image: "./images/70.png",
                    description: "",
                    commercialPrice: 1500.00,
                    sellingPrice: 1600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "سلم 250 سم ثقيل",
                    number: "0071",
                    category: "sofas",
                    image: "./images/71.png",
                    description: "",
                    commercialPrice: 1300.00,
                    sellingPrice: 1400.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "سلم 2 م ثقيل",
                    number: "0072",
                    category: "sofas",
                    image: "./images/72.png",
                    description: "",
                    commercialPrice: 650.00,
                    sellingPrice: 700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة مراية كبيرة",
                    number: "0073",
                    category: "storage",
                    image: "./images/73.png",
                    description: "",
                    commercialPrice: 800.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة مراية لف",
                    number: "0074",
                    category: "storage",
                    image: "./images/74.png",
                    description: "",
                    commercialPrice: 700.00,
                    sellingPrice: 750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة مراية صغيرة",
                    number: "0075",
                    category: "storage",
                    image: "./images/75.png",
                    description: "",
                    commercialPrice: 600.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة عجينة",
                    number: "0076",
                    category: "storage",
                    image: "./images/76.png",
                    description: "",
                    commercialPrice: 400.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة مربعة زان تشتطيب كونتر",
                    number: "0077",
                    category: "storage",
                    image: "./images/77.png",
                    description: "",
                    commercialPrice: 650.00,
                    sellingPrice: 700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة مربعة زان تشتطيب زان",
                    number: "0078",
                    category: "storage",
                    image: "./images/78.png",
                    description: "",
                    commercialPrice: 650.00,
                    sellingPrice: 700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة سويد 2 طبق",
                    number: "0079",
                    category: "storage",
                    image: "./images/79.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة مدورة زان بقاعدة طبق",
                    number: "0080",
                    category: "storage",
                    image: "./images/80.png",
                    description: "",
                    commercialPrice: 750.00,
                    sellingPrice: 800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة سويد تقيلة",
                    number: "0081",
                    category: "storage",
                    image: "./images/81.png",
                    description: "",
                    commercialPrice: 650.00,
                    sellingPrice: 700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة مشيشة خفيفة",
                    number: "0082",
                    category: "storage",
                    image: "./images/82.png",
                    description: "",
                    commercialPrice: 180.00,
                    sellingPrice: 200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة علبة خفيفة",
                    number: "0083",
                    category: "storage",
                    image: "./images/83.png",
                    description: "",
                    commercialPrice: 500.00,
                    sellingPrice: 550.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة علبة ثقيلة",
                    number: "0084",
                    category: "storage",
                    image: "./images/84.png",
                    description: "",
                    commercialPrice: 650.00,
                    sellingPrice: 700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة دايرة زان تشطيب كونتر",
                    number: "0085",
                    category: "storage",
                    image: "./images/85.png",
                    description: "",
                    commercialPrice: 750.00,
                    sellingPrice: 800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة مراية بدرج",
                    number: "0086",
                    category: "storage",
                    image: "./images/86.png",
                    description: "",
                    commercialPrice: 1200.00,
                    sellingPrice: 1400.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "سرير سندوتش ابيض",
                    number: "0087",
                    category: "beds",
                    image: "./images/87.png",
                    description: "",
                    commercialPrice: 1500.00,
                    sellingPrice: 1600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "سرير باكم هزاز ابيض",
                    number: "0088",
                    category: "beds",
                    image: "./images/88.png",
                    description: "",
                    commercialPrice: 1350.00,
                    sellingPrice: 1450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "سرير كمنجا خفيف هزاز ابيض",
                    number: "0089",
                    category: "beds",
                    image: "./images/89.png",
                    description: "",
                    commercialPrice: 850.00,
                    sellingPrice: 900.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "سرير 120 سم سويد خفيف",
                    number: "0090",
                    category: "beds",
                    image: "./images/90.png",
                    description: "",
                    commercialPrice: 1800.00,
                    sellingPrice: 2000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "سرير 120 سم سويد تقيل",
                    number: "0091",
                    category: "beds",
                    image: "./images/91.png",
                    description: "",
                    commercialPrice: 2000.00,
                    sellingPrice: 2200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "مكتب 80 سم مدهون",
                    number: "0092",
                    category: "desk",
                    image: "./images/92.png",
                    description: "",
                    commercialPrice: 1900.00,
                    sellingPrice: 2100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "مكتب 80 سم ابيض",
                    number: "0093",
                    category: "desk",
                    image: "./images/93.png",
                    description: "",
                    commercialPrice: 900.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "مكتب 1 م مدهون",
                    number: "0094",
                    category: "desk",
                    image: "./images/94.png",
                    description: "",
                    commercialPrice: 2300.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "مكتب 1 م ابيض",
                    number: "0095",
                    category: "desk",
                    image: "./images/95.png",
                    description: "",
                    commercialPrice: 1300.00,
                    sellingPrice: 1500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "مكتب 120 سم مدهون",
                    number: "0096",
                    category: "desk",
                    image: "./images/96.png",
                    description: "",
                    commercialPrice: 2300.00,
                    sellingPrice: 2700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "مكتب 120 سم ابيض",
                    number: "0097",
                    category: "desk",
                    image: "./images/97.png",
                    description: "",
                    commercialPrice: 1300.00,
                    sellingPrice: 1700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شكل M",
                    number: "0098",
                    category: "tables",
                    image: "./images/98.png",
                    description: "",
                    commercialPrice: 600.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شكل S",
                    number: "0099",
                    category: "tables",
                    image: "./images/99.png",
                    description: "",
                    commercialPrice: 600.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة دوران برف او بدرج ",
                    number: "0100",
                    category: "tables",
                    image: "./images/100.png",
                    description: "",
                    commercialPrice: 800.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة U يو كبيرة دمياط",
                    number: "0101",
                    category: "tables",
                    image: "./images/101.png",
                    description: "",
                    commercialPrice: 800.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة U يو صغيرة دمياط",
                    number: "0102",
                    category: "tables",
                    image: "./images/102.png",
                    description: "",
                    commercialPrice: 600.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة U يو هدهد",
                    number: "0103",
                    category: "tables",
                    image: "./images/103.png",
                    description: "",
                    commercialPrice: 1100.00,
                    sellingPrice: 1250.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية ستيل دوران",
                    number: "0104",
                    category: "tables",
                    image: "./images/104.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مربعات فايبر بدرج",
                    number: "0105",
                    category: "tables",
                    image: "./images/105.png",
                    description: "",
                    commercialPrice: 750.00,
                    sellingPrice: 800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مثلثة الحسينى",
                    number: "0106",
                    category: "tables",
                    image: "./images/106.png",
                    description: "",
                    commercialPrice: 950.00,
                    sellingPrice: 1050.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية كورة قشرة",
                    number: "0107",
                    category: "tables",
                    image: "./images/107.png",
                    description: "",
                    commercialPrice: 950.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية كورة سادة",
                    number: "0108",
                    category: "tables",
                    image: "./images/108.png",
                    description: "",
                    commercialPrice: 1050.00,
                    sellingPrice: 1200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية اسلامى",
                    number: "0109",
                    category: "tables",
                    image: "./images/109.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مفرغة",
                    number: "0110",
                    category: "tables",
                    image: "./images/110.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية عمود 2 رف",
                    number: "0111",
                    category: "tables",
                    image: "./images/111.png",
                    description: "",
                    commercialPrice: 900.00,
                    sellingPrice: 1050.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مصبعة (مشيشة) بدرج",
                    number: "0112",
                    category: "tables",
                    image: "./images/112.png",
                    description: "",
                    commercialPrice: 1150.00,
                    sellingPrice: 1250.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية سداسي X دمياط",
                    number: "0113",
                    category: "tables",
                    image: "./images/113.png",
                    description: "",
                    commercialPrice: 650.00,
                    sellingPrice: 750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مستطيل X دمياط",
                    number: "0114",
                    category: "tables",
                    image: "./images/114.png",
                    description: "",
                    commercialPrice: 650.00,
                    sellingPrice: 750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية كريستالا بيضاوى",
                    number: "0115",
                    category: "tables",
                    image: "./images/115.png",
                    description: "",
                    commercialPrice: 1100.00,
                    sellingPrice: 1200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية  كريستالا سداسى",
                    number: "0116",
                    category: "tables",
                    image: "./images/116.png",
                    description: "",
                    commercialPrice: 1100.00,
                    sellingPrice: 1200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية حزام بيضاوى",
                    number: "0117",
                    category: "tables",
                    image: "./images/117.png",
                    description: "",
                    commercialPrice: 800.00,
                    sellingPrice: 900.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية حزام سداسى",
                    number: "0118",
                    category: "tables",
                    image: "./images/118.png",
                    description: "",
                    commercialPrice: 900.00,
                    sellingPrice: 1000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية حزام دايرة",
                    number: "0119",
                    category: "tables",
                    image: "./images/119.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 550.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية دق لوكانز",
                    number: "0120",
                    category: "tables",
                    image: "./images/120.png",
                    description: "",
                    commercialPrice: 1250.00,
                    sellingPrice: 1350.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية سوستة هدهد",
                    number: "0121",
                    category: "tables",
                    image: "./images/121.png",
                    description: "",
                    commercialPrice: 750.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية تقيلة هدهد",
                    number: "0122",
                    category: "tables",
                    image: "./images/122.png",
                    description: "خلصان",
                    commercialPrice: 750.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية ديانا دايرة تقيلة",
                    number: "0123",
                    category: "tables",
                    image: "./images/123.png",
                    description: "",
                    commercialPrice: 1500.00,
                    sellingPrice: 1600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية ديانا دايرة خفيفة",
                    number: "0124",
                    category: "tables",
                    image: "./images/124.png",
                    description: "",
                    commercialPrice: 1200.00,
                    sellingPrice: 1300.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع بدرج",
                    number: "0125",
                    category: "tables",
                    image: "./images/125.png",
                    description: "",
                    commercialPrice: 1400.00,
                    sellingPrice: 1600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية 4 درج برف",
                    number: "0126",
                    category: "tables",
                    image: "./images/126.png",
                    description: "",
                    commercialPrice: 1400.00,
                    sellingPrice: 1600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مودرن وسط",
                    number: "0127",
                    category: "tables",
                    image: "./images/127.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مودرن تقيلة مربعة",
                    number: "0128",
                    category: "tables",
                    image: "./images/128.png",
                    description: "",
                    commercialPrice: 1500.00,
                    sellingPrice: 1700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية ابل",
                    number: "0129",
                    category: "tables",
                    image: "./images/129.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية دايرة خوص",
                    number: "0130",
                    category: "tables",
                    image: "./images/130.png",
                    description: "",
                    commercialPrice: 1600.00,
                    sellingPrice: 1800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مفرغة بأزاز بيضاوى",
                    number: "0131",
                    category: "tables",
                    image: "./images/131.png",
                    description: "",
                    commercialPrice: 800.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مفرغة بأزاز دايرة",
                    number: "0132",
                    category: "tables",
                    image: "./images/132.png",
                    description: "",
                    commercialPrice: 950.00,
                    sellingPrice: 1000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة 2 درج مشيش",
                    number: "0133",
                    category: "tables",
                    image: "./images/133.png",
                    description: "",
                    commercialPrice: 1850.00,
                    sellingPrice: 2000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة دايرة بدرج داير",
                    number: "0134",
                    category: "tables",
                    image: "./images/134.png",
                    description: "",
                    commercialPrice: 1700.00,
                    sellingPrice: 1800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة مربع بدرج عدل",
                    number: "0135",
                    category: "tables",
                    image: "./images/135.png",
                    description: "",
                    commercialPrice: 1700.00,
                    sellingPrice: 1800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة ورقة شجرة",
                    number: "0136",
                    category: "tables",
                    image: "./images/136.png",
                    description: "",
                    commercialPrice: 2200.00,
                    sellingPrice: 2400.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة ترابيزة بيضاوى",
                    number: "0137",
                    category: "tables",
                    image: "./images/137.png",
                    description: "",
                    commercialPrice: 2600.00,
                    sellingPrice: 2700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة دايرة عمود عدل",
                    number: "0138",
                    category: "tables",
                    image: "./images/138.png",
                    description: "",
                    commercialPrice: 1100.00,
                    sellingPrice: 1200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة دايرة 3 صابع",
                    number: "0139",
                    category: "tables",
                    image: "./images/139.png",
                    description: "",
                    commercialPrice: 1100.00,
                    sellingPrice: 1200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة دايرة صوابع",
                    number: "0140",
                    category: "tables",
                    image: "./images/140.png",
                    description: "",
                    commercialPrice: 1200.00,
                    sellingPrice: 1350.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة دايرة X",
                    number: "0141",
                    category: "tables",
                    image: "./images/141.png",
                    description: "",
                    commercialPrice: 1150.00,
                    sellingPrice: 1250.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3 قطعة دايرة عمود عدل",
                    number: "0142",
                    category: "tables",
                    image: "./images/142.png",
                    description: "",
                    commercialPrice: 1500.00,
                    sellingPrice: 1600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3 قطعة مربع X",
                    number: "0143",
                    category: "tables",
                    image: "./images/143.png",
                    description: "",
                    commercialPrice: 900.00,
                    sellingPrice: 1000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة ديانا تقيل",
                    number: "0144",
                    category: "tables",
                    image: "./images/144.png",
                    description: "",
                    commercialPrice: 1700.00,
                    sellingPrice: 1800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3 قطعة ديانا",
                    number: "0145",
                    category: "tables",
                    image: "./images/145.png",
                    description: "",
                    commercialPrice: 1250.00,
                    sellingPrice: 1400.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3 قطعة مربع صوابع",
                    number: "0146",
                    category: "tables",
                    image: "./images/146.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة 50 * 50 لوكانز",
                    number: "0147",
                    category: "tables",
                    image: "./images/147.png",
                    description: "",
                    commercialPrice: 900.00,
                    sellingPrice: 1000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة مربعة جوهرة",
                    number: "0148",
                    category: "tables",
                    image: "./images/148.png",
                    description: "",
                    commercialPrice: 700.00,
                    sellingPrice: 850.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة كاس عالم صغير",
                    number: "0149",
                    category: "tables",
                    image: "./images/149.png",
                    description: "",
                    commercialPrice: 1200.00,
                    sellingPrice: 1250.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة تليفون",
                    number: "0150",
                    category: "tables",
                    image: "./images/150.png",
                    description: "",
                    commercialPrice: 550.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة ديانا كبيرة",
                    number: "0151",
                    category: "tables",
                    image: "./images/151.png",
                    description: "",
                    commercialPrice: 1200.00,
                    sellingPrice: 1250.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة ديانا صغيرة",
                    number: "0152",
                    category: "tables",
                    image: "./images/152.png",
                    description: "",
                    commercialPrice: 550.00,
                    sellingPrice: 750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة مربعة دق",
                    number: "0153",
                    category: "tables",
                    image: "./images/153.png",
                    description: "",
                    commercialPrice: 600.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة دايرة دق تقيلة",
                    number: "0154",
                    category: "tables",
                    image: "./images/154.png",
                    description: "",
                    commercialPrice: 1500.00,
                    sellingPrice: 1700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة مربعة 2 مخ",
                    number: "0155",
                    category: "tables",
                    image: "./images/155.png",
                    description: "",
                    commercialPrice: 700.00,
                    sellingPrice: 750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة دايرة 2 مخ",
                    number: "0156",
                    category: "tables",
                    image: "./images/156.png",
                    description: "",
                    commercialPrice: 700.00,
                    sellingPrice: 750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة دايرة 90 سم",
                    number: "0157",
                    category: "tables",
                    image: "./images/157.png",
                    description: "",
                    commercialPrice: 550.00,
                    sellingPrice: 600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة مربعة 90 سم",
                    number: "0158",
                    category: "tables",
                    image: "./images/158.png",
                    description: "",
                    commercialPrice: 550.00,
                    sellingPrice: 600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة سادة",
                    number: "0159",
                    category: "tables",
                    image: "./images/159.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 550.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة 2 زهرة",
                    number: "0160",
                    category: "tables",
                    image: "./images/160.png",
                    description: "",
                    commercialPrice: 400.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة شميزة",
                    number: "0161",
                    category: "tables",
                    image: "./images/161.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة مروحة",
                    number: "0162",
                    category: "tables",
                    image: "./images/162.png",
                    description: "",
                    commercialPrice: 600.00,
                    sellingPrice: 600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة دايرة كورة",
                    number: "0163",
                    category: "tables",
                    image: "./images/163.png",
                    description: "",
                    commercialPrice: 500.00,
                    sellingPrice: 550.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة سداسي خفيفة",
                    number: "0164",
                    category: "tables",
                    image: "./images/164.png",
                    description: "",
                    commercialPrice: 350.00,
                    sellingPrice: 400.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية دايرة قشرة",
                    number: "0165",
                    category: "tables",
                    image: "./images/165.png",
                    description: "",
                    commercialPrice: 550.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية حلقة بيضاوى بدرج",
                    number: "0166",
                    category: "tables",
                    image: "./images/166.png",
                    description: "",
                    commercialPrice: 1500.00,
                    sellingPrice: 1700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة سفرة دايرة 4 كرسي",
                    number: "0167",
                    category: "tables",
                    image: "./images/167.png",
                    description: "",
                    commercialPrice: 2300.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة سفرة دايرة وسط برجل قرطاس",
                    number: "0168",
                    category: "tables",
                    image: "",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 0.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة سفرة بيضاوى وسط 150*80",
                    number: "0169",
                    category: "tables",
                    image: "",
                    description: "خلصان",
                    commercialPrice: 0.00,
                    sellingPrice: 0.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة الرحمة 80 * 80",
                    number: "0170",
                    category: "tables",
                    image: "./images/170.png",
                    description: "",
                    commercialPrice: 1350.00,
                    sellingPrice: 1500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة الرحمة 80 * 120",
                    number: "0171",
                    category: "tables",
                    image: "./images/172.png",
                    description: "",
                    commercialPrice: 1450.00,
                    sellingPrice: 1650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة الرحمة 80 * 160",
                    number: "0172",
                    category: "tables",
                    image: "./images/172.png",
                    description: "",
                    commercialPrice: 1550.00,
                    sellingPrice: 1750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة 5 درج",
                    number: "0173",
                    category: "tables",
                    image: "./images/173.png",
                    description: "",
                    commercialPrice: 2000.00,
                    sellingPrice: 2100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة الحسينى درفة واحدة",
                    number: "0174",
                    category: "tables",
                    image: "./images/174.png",
                    description: "",
                    commercialPrice: 1400.00,
                    sellingPrice: 1500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة وش فايبر 2 درج ودرفة",
                    number: "0175",
                    category: "tables",
                    image: "./images/175.png",
                    description: "",
                    commercialPrice: 2200.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة 2 درفة مشطوفة",
                    number: "0176",
                    category: "tables",
                    image: "./images/176.png",
                    description: "",
                    commercialPrice: 1500.00,
                    sellingPrice: 1700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة صوابع 2 درج",
                    number: "0177",
                    category: "tables",
                    image: "./images/177.png",
                    description: "",
                    commercialPrice: 1800.00,
                    sellingPrice: 1900.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة ستيل دوران",
                    number: "0178",
                    category: "tables",
                    image: "./images/178.png",
                    description: "",
                    commercialPrice: 1500.00,
                    sellingPrice: 1600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة الحسيني 2 رف 2 درج",
                    number: "0179",
                    category: "tables",
                    image: "./images/179.png",
                    description: "",
                    commercialPrice: 1400.00,
                    sellingPrice: 1500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كرسي سلم درجة واحدة قلاب",
                    number: "0180",
                    category: "chairs",
                    image: "./images/180.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شيزلونج بانكت مدقوق",
                    number: "0181",
                    category: "chairs",
                    image: "./images/181.png",
                    description: "",
                    commercialPrice: 1650.00,
                    sellingPrice: 1750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "بف داير",
                    number: "0182",
                    category: "chairs",
                    image: "./images/182.png",
                    description: "",
                    commercialPrice: 225.00,
                    sellingPrice: 250.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "بف داير بدهر",
                    number: "0183",
                    category: "chairs",
                    image: "./images/183.png",
                    description: "",
                    commercialPrice: 275.00,
                    sellingPrice: 300.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "بف مربع",
                    number: "0184",
                    category: "chairs",
                    image: "./images/184.png",
                    description: "",
                    commercialPrice: 225.00,
                    sellingPrice: 250.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "فواطة",
                    number: "0185",
                    category: "storage",
                    image: "./images/185.png",
                    description: "",
                    commercialPrice: 500.00,
                    sellingPrice: 550.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة شطرنج كورة",
                    number: "0186",
                    category: "tables",
                    image: "./images/186.png",
                    description: "",
                    commercialPrice: 2500.00,
                    sellingPrice: 3000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة 2 درفة ليزر",
                    number: "0187",
                    category: "tables",
                    image: "./images/187.png",
                    description: "",
                    commercialPrice: 2500.00,
                    sellingPrice: 3000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة 2 درفة بحزام",
                    number: "0188",
                    category: "boxs",
                    image: "./images/188.png",
                    description: "",
                    commercialPrice: 2300.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة عسكري",
                    number: "0189",
                    category: "boxs",
                    image: "./images/189.png",
                    description: "",
                    commercialPrice: 2000.00,
                    sellingPrice: 2100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة درفة دوران الحسيني",
                    number: "0190",
                    category: "boxs",
                    image: "./images/190.png",
                    description: "",
                    commercialPrice: 2500.00,
                    sellingPrice: 3000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة عسكري صغير",
                    number: "0191",
                    category: "boxs",
                    image: "./images/191.png",
                    description: "",
                    commercialPrice: 1700.00,
                    sellingPrice: 2000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة عدلة عمرو عوف",
                    number: "0192",
                    category: "boxs",
                    image: "./images/192.png",
                    description: "",
                    commercialPrice: 2300.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة 3 درفة",
                    number: "0193",
                    category: "boxs",
                    image: "./images/193.png",
                    description: "",
                    commercialPrice: 2500.00,
                    sellingPrice: 2700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة قشرة هدهد",
                    number: "0194",
                    category: "boxs",
                    image: "./images/194.png",
                    description: "",
                    commercialPrice: 1300.00,
                    sellingPrice: 1500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة قلاب هدهد",
                    number: "0195",
                    category: "boxs",
                    image: "./images/195.png",
                    description: "",
                    commercialPrice: 1400.00,
                    sellingPrice: 1600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة مفرغة فايبر",
                    number: "0196",
                    category: "boxs",
                    image: "./images/196.png",
                    description: "",
                    commercialPrice: 1200.00,
                    sellingPrice: 1300.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة 2 درفة ودرج بمقبض دهبي",
                    number: "0197",
                    category: "boxs",
                    image: "./images/197.png",
                    description: "",
                    commercialPrice: 2300.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة مجوفة عمرو عوف",
                    number: "0198",
                    category: "boxs",
                    image: "./images/198.png",
                    description: "",
                    commercialPrice: 2500.00,
                    sellingPrice: 2700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة 2 درفة ودرج تحت",
                    number: "0199",
                    category: "boxs",
                    image: "./images/199.png",
                    description: "",
                    commercialPrice: 2300.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة 3 سرة",
                    number: "0200",
                    category: "boxs",
                    image: "./images/200.png",
                    description: "",
                    commercialPrice: 2600.00,
                    sellingPrice: 2800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة درفة مفرغة بطبق",
                    number: "0201",
                    category: "boxs",
                    image: "./images/201.png",
                    description: "",
                    commercialPrice: 2300.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة مراية لف عمرو عوف",
                    number: "0202",
                    category: "boxs",
                    image: "./images/202.png",
                    description: "",
                    commercialPrice: 2800.00,
                    sellingPrice: 3000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة الشريف",
                    number: "0203",
                    category: "boxs",
                    image: "./images/203.png",
                    description: "",
                    commercialPrice: 3200.00,
                    sellingPrice: 3500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "دفاية",
                    number: "0204",
                    category: "boxs",
                    image: "./images/204.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 0.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "فضية بسارى",
                    number: "0205",
                    category: "fedyat",
                    image: "./images/205.png",
                    description: "",
                    commercialPrice: 3000.00,
                    sellingPrice: 3100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "فضية بدون سارى",
                    number: "0206",
                    category: "fedyat",
                    image: "./images/206.png",
                    description: "",
                    commercialPrice: 2800.00,
                    sellingPrice: 2900.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "فضية خفيفة",
                    number: "0207",
                    category: "fedyat",
                    image: "./images/206.png",
                    description: "",
                    commercialPrice: 2500.00,
                    sellingPrice: 2600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "بف داير درجة اولى تقيل متنجد",
                    number: "0208",
                    category: "chairs",
                    image: "./images/208.png",
                    description: "",
                    commercialPrice: 500.00,
                    sellingPrice: 550.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "بف داير درجة تانية تقيل متنجد",
                    number: "0209",
                    category: "chairs",
                    image: "./images/208.png",
                    description: "",
                    commercialPrice: 400.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "بف داير بدهر تقيل متنجد",
                    number: "0210",
                    category: "chairs",
                    image: "./images/210.png",
                    description: "",
                    commercialPrice: 650.00,
                    sellingPrice: 700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "بف داير برجل استلس تقيل متنجد",
                    number: "0211",
                    category: "chairs",
                    image: "./images/211.png",
                    description: "",
                    commercialPrice: 500.00,
                    sellingPrice: 550.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "بف داير وسط متنجد",
                    number: "0212",
                    category: "chairs",
                    image: "./images/212.png",
                    description: "",
                    commercialPrice: 250.00,
                    sellingPrice: 280.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "بف داير وسط متنجد فرو",
                    number: "0213",
                    category: "chairs",
                    image: "./images/213.png",
                    description: "",
                    commercialPrice: 280.00,
                    sellingPrice: 300.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "بف مربع ثابت متنجد",
                    number: "0214",
                    category: "chairs",
                    image: "./images/214.png",
                    description: "",
                    commercialPrice: 320.00,
                    sellingPrice: 350.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "بف مربع بانكت متنجد",
                    number: "0215",
                    category: "chairs",
                    image: "./images/215.png",
                    description: "",
                    commercialPrice: 400.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة كبيرة وش فايبر مدهون",
                    number: "0216",
                    category: "gazamatmadhona",
                    image: "./images/216.png",
                    description: "",
                    commercialPrice: 3300.00,
                    sellingPrice: 3500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة دوران خوص مدهون",
                    number: "0217",
                    category: "gazamatmadhona",
                    image: "./images/217.png",
                    description: "",
                    commercialPrice: 3500.00,
                    sellingPrice: 3800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة سيه مدهون",
                    number: "0218",
                    category: "gazamatmadhona",
                    image: "./images/218.png",
                    description: "",
                    commercialPrice: 3000.00,
                    sellingPrice: 3200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة 80 سم ربيع مدهون",
                    number: "0219",
                    category: "gazamatmadhona",
                    image: "./images/219.png",
                    description: "",
                    commercialPrice: 3000.00,
                    sellingPrice: 3300.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة 1 م ربيع 2 درفة مدهون",
                    number: "0220",
                    category: "gazamatmadhona",
                    image: "./images/220.png",
                    description: "",
                    commercialPrice: 3500.00,
                    sellingPrice: 3700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة 1 م ربيع 2 درفة ودرج مدهون",
                    number: "0221",
                    category: "gazamatmadhona",
                    image: "./images/221.png",
                    description: "خلصان",
                    commercialPrice: 3500.00,
                    sellingPrice: 3800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة هدهد مدهون",
                    number: "0222",
                    category: "gazamatmadhona",
                    image: "./images/222.png",
                    description: "",
                    commercialPrice: 2000.00,
                    sellingPrice: 2400.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة فورميكا",
                    number: "0223",
                    category: "gazamatmadhona",
                    image: "./images/223.png",
                    description: "",
                    commercialPrice: 1250.00,
                    sellingPrice: 1500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة الشريف مدهون",
                    number: "0224",
                    category: "gazamatmadhona",
                    image: "./images/224.png",
                    description: "",
                    commercialPrice: 4000.00,
                    sellingPrice: 4200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "دولاب فورميكا",
                    number: "0225",
                    category: "gazamatmadhona",
                    image: "./images/225.png",
                    description: "",
                    commercialPrice: 1600.00,
                    sellingPrice: 1750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة مراية عمرو عوف مدهون",
                    number: "0226",
                    category: "gazamatmadhona",
                    image: "./images/226.png",
                    description: "",
                    commercialPrice: 4000.00,
                    sellingPrice: 4500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "وحدة ادراج مدهون",
                    number: "0227",
                    category: "gazamatmadhona",
                    image: "./images/227.png",
                    description: "",
                    commercialPrice: 2500.00,
                    sellingPrice: 2700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كانسور",
                    number: "0228",
                    category: "gazamatmadhona",
                    image: "./images/228.png",
                    description: "",
                    commercialPrice: 4000.00,
                    sellingPrice: 4500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة مراية كبيرة ثابتة مدهون",
                    number: "0229",
                    category: "storage",
                    image: "./images/229.png",
                    description: "",
                    commercialPrice: 1600.00,
                    sellingPrice: 1800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة مراية لف مدهون",
                    number: "0230",
                    category: "storage",
                    image: "./images/230.png",
                    description: "",
                    commercialPrice: 1500.00,
                    sellingPrice: 1600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة مراية صغيرة مدهون",
                    number: "0231",
                    category: "storage",
                    image: "./images/231.png",
                    description: "",
                    commercialPrice: 1300.00,
                    sellingPrice: 1350.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة مراية بدرج مدهون",
                    number: "0232",
                    category: "storage",
                    image: "./images/232.png",
                    description: "",
                    commercialPrice: 1750.00,
                    sellingPrice: 2000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع هدهد مدهون",
                    number: "0233",
                    category: "trabezatmadhona",
                    image: "./images/233.png",
                    description: "",
                    commercialPrice: 1300.00,
                    sellingPrice: 1350.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مصبعة (مشيشة) بدرج مدهون",
                    number: "0234",
                    category: "trabezatmadhona",
                    image: "./images/234.png",
                    description: "",
                    commercialPrice: 2000.00,
                    sellingPrice: 2200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية U هدهد مدهون",
                    number: "0235",
                    category: "trabezatmadhona",
                    image: "./images/235.png",
                    description: "",
                    commercialPrice: 1800.00,
                    sellingPrice: 2200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مفرغة مدهون",
                    number: "0236",
                    category: "trabezatmadhona",
                    image: "./images/236.png",
                    description: "",
                    commercialPrice: 1800.00,
                    sellingPrice: 2200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية عمود 2 رف مدهون",
                    number: "0237",
                    category: "trabezatmadhona",
                    image: "./images/237.png",
                    description: "",
                    commercialPrice: 1800.00,
                    sellingPrice: 2200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مربعات فايبر بدرج مدهون",
                    number: "0238",
                    category: "trabezatmadhona",
                    image: "./images/238.png",
                    description: "",
                    commercialPrice: 1450.00,
                    sellingPrice: 1750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية فايبر مدهون",
                    number: "0239",
                    category: "trabezatmadhona",
                    image: "./images/239.png",
                    description: "",
                    commercialPrice: 1350.00,
                    sellingPrice: 1500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية كورة مدهون",
                    number: "0240",
                    category: "trabezatmadhona",
                    image: "./images/240.png",
                    description: "",
                    commercialPrice: 1800.00,
                    sellingPrice: 2200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية علبة كبيرة مدهون",
                    number: "0241",
                    category: "trabezatmadhona",
                    image: "./images/241.png",
                    description: "",
                    commercialPrice: 2300.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية ربيع 2 درج فورميكا مدهون",
                    number: "0242",
                    category: "trabezatmadhona",
                    image: "./images/242.png",
                    description: "",
                    commercialPrice: 1650.00,
                    sellingPrice: 1750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية دايرة بدرج تقيلة الحسينى مدهون",
                    number: "0243",
                    category: "trabezatmadhona",
                    image: "./images/243.png",
                    description: "",
                    commercialPrice: 2000.00,
                    sellingPrice: 2200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية دايرة بدرج وسط دمياط مدهون",
                    number: "0244",
                    category: "trabezatmadhona",
                    image: "./images/244.png",
                    description: "",
                    commercialPrice: 1650.00,
                    sellingPrice: 1750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة شلباية رخام مدهون",
                    number: "0245",
                    category: "trabezatmadhona",
                    image: "./images/245.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 0.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة دايرة كورة مدهون",
                    number: "0246",
                    category: "trabezatmadhona",
                    image: "./images/246.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1050.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة دايرة بدرج داير مدهون",
                    number: "0247",
                    category: "trabezatmadhona",
                    image: "./images/247.png",
                    description: "",
                    commercialPrice: 2500.00,
                    sellingPrice: 2800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3 قطعة ديانا مدهون",
                    number: "0248",
                    category: "trabezatmadhona",
                    image: "./images/248.png",
                    description: "",
                    commercialPrice: 2200.00,
                    sellingPrice: 2400.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3 قطعة حزام مدهون",
                    number: "0249",
                    category: "trabezatmadhona",
                    image: "./images/249.png",
                    description: "",
                    commercialPrice: 2200.00,
                    sellingPrice: 2400.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3 قطعة مربع X مدهون",
                    number: "0250",
                    category: "trabezatmadhona",
                    image: "./images/250.png",
                    description: "",
                    commercialPrice: 2000.00,
                    sellingPrice: 2200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3 قطعة مصبع رخام مدهون",
                    number: "0251",
                    category: "trabezatmadhona",
                    image: "./images/251.png",
                    description: "",
                    commercialPrice: 2200.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3*1 ليزر خفيف مدهون",
                    number: "0252",
                    category: "trabezatmadhona",
                    image: "./images/252.png",
                    description: "",
                    commercialPrice: 850.00,
                    sellingPrice: 900.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3 قطعة دواير مدهون",
                    number: "0253",
                    category: "trabezatmadhona",
                    image: "./images/253.png",
                    description: "",
                    commercialPrice: 1600.00,
                    sellingPrice: 1700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3 قطعة مربع صوابع مدهون",
                    number: "0254",
                    category: "trabezatmadhona",
                    image: "./images/254.png",
                    description: "",
                    commercialPrice: 1850.00,
                    sellingPrice: 2000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 3 قطعة اشكال مدهون",
                    number: "0255",
                    category: "trabezatmadhona",
                    image: "./images/255.png",
                    description: "",
                    commercialPrice: 1650.00,
                    sellingPrice: 1750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة وش فايبر 2 درج مدهون",
                    number: "0256",
                    category: "trabezatmadhona",
                    image: "./images/256.png",
                    description: "",
                    commercialPrice: 3500.00,
                    sellingPrice: 4000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة كورة مدهون",
                    number: "0257",
                    category: "trabezatmadhona",
                    image: "./images/257.png",
                    description: "",
                    commercialPrice: 3500.00,
                    sellingPrice: 4000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة فورميكا 160*35",
                    number: "0258",
                    category: "trabezatmadhona",
                    image: "./images/258.png",
                    description: "",
                    commercialPrice: 1250.00,
                    sellingPrice: 1500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة فورميكا 160*40",
                    number: "0259",
                    category: "trabezatmadhona",
                    image: "./images/259.png",
                    description: "",
                    commercialPrice: 1500.00,
                    sellingPrice: 1700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة شاشة فورميكا 120*35",
                    number: "0260",
                    category: "trabezatmadhona",
                    image: "./images/260.png",
                    description: "",
                    commercialPrice: 1200.00,
                    sellingPrice: 1250.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "برواز اشكال كبير",
                    number: "0261",
                    category: "berwaz",
                    image: "./images/261.png",
                    description: "",
                    commercialPrice: 1200.00,
                    sellingPrice: 1250.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "برواز اشكال صغير",
                    number: "0262",
                    category: "berwaz",
                    image: "./images/262.png",
                    description: "",
                    commercialPrice: 700.00,
                    sellingPrice: 750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "بف دايرة بانكت",
                    number: "0263",
                    category: "chairs",
                    image: "./images/263.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 475.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية فورميكا صغيرة ",
                    number: "0264",
                    category: "trabezatmadhona",
                    image: "./images/264.png",
                    description: "",
                    commercialPrice: 1250.00,
                    sellingPrice: 1300.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة كمنجا زان",
                    number: "0265",
                    category: "storage",
                    image: "./images/265.png",
                    description: "",
                    commercialPrice: 1300.00,
                    sellingPrice: 1350.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة شجرة عيد الميلاد زان",
                    number: "0266",
                    category: "storage",
                    image: "./images/266.png",
                    description: "",
                    commercialPrice: 750.00,
                    sellingPrice: 800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة صبارة زان",
                    number: "0267",
                    category: "storage",
                    image: "./images/267.png",
                    description: "",
                    commercialPrice: 650.00,
                    sellingPrice: 700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية مستطيل خوص",
                    number: "0268",
                    category: "tables",
                    image: "./images/268.png",
                    description: "",
                    commercialPrice: 1700.00,
                    sellingPrice: 1800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "مكتب كونتر بوحدة ادراج مدهون",
                    number: "0269",
                    category: "desk",
                    image: "./images/269.png",
                    description: "",
                    commercialPrice: .00,
                    sellingPrice: .00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حامل مصحف فتح وقفل زان",
                    number: "0270",
                    category: "hamelMoshaf",
                    image: "./images/270.png",
                    description: "",
                    commercialPrice: 170.00,
                    sellingPrice: 180.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حامل مصحف فتح وقفل ليزر",
                    number: "0271",
                    category: "hamelMoshaf",
                    image: "./images/271.png",
                    description: "",
                    commercialPrice: 135.00,
                    sellingPrice: 145.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حامل مصحف كبير",
                    number: "0272",
                    category: "hamelMoshaf",
                    image: "./images/272.png",
                    description: "",
                    commercialPrice: 600.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة دايرة بصل",
                    number: "0273",
                    category: "tables",
                    image: "./images/273.png",
                    description: "",
                    commercialPrice: 1600.00,
                    sellingPrice: 1750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة دايرة مقوس بصل",
                    number: "0274",
                    category: "tables",
                    image: "./images/274.png",
                    description: "",
                    commercialPrice: 1600.00,
                    sellingPrice: 1750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة مربع بصل",
                    number: "0275",
                    category: "tables",
                    image: "./images/275.png",
                    description: "",
                    commercialPrice: 1600.00,
                    sellingPrice: 1750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة دايرة بصل مدهون",
                    number: "0276",
                    category: "trabezatmadhona",
                    image: "./images/276.png",
                    description: "",
                    commercialPrice: .00,
                    sellingPrice: .00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة دايرة مقوس بصل مدهون",
                    number: "0277",
                    category: "trabezatmadhona",
                    image: "./images/277.png",
                    description: "",
                    commercialPrice: .00,
                    sellingPrice: .00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 قطعة مربع بصل مدهون",
                    number: "0278",
                    category: "trabezatmadhona",
                    image: "./images/278.png",
                    description: "",
                    commercialPrice: .00,
                    sellingPrice: .00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة كونتر الحسيني مدهون",
                    number: "0279",
                    category: "gazamatmadhona",
                    image: "./images/279.png",
                    description: "",
                    commercialPrice: 2500.00,
                    sellingPrice: 2700.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "جزامة كونتر الحسيني بوحدة تخزين مدهون",
                    number: "0280",
                    category: "gazamatmadhona",
                    image: "./images/280.png",
                    description: "",
                    commercialPrice: 3500.00,
                    sellingPrice: 3800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم استلس كانسور",
                    number: "0281",
                    category: "istales",
                    image: "./images/281.png",
                    description: "خلصان",
                    commercialPrice: 0.00,
                    sellingPrice: 8500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم استلس",
                    number: "0282",
                    category: "istales",
                    image: "./images/282.png",
                    description: "",
                    commercialPrice: 2500.00,
                    sellingPrice: 2800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة استلس دايرة كبيرة",
                    number: "0283",
                    category: "istales",
                    image: "./images/283.png",
                    description: "",
                    commercialPrice: 2000.00,
                    sellingPrice: 2200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة استلس كريستالا  كبيرة",
                    number: "0284",
                    category: "istales",
                    image: "./images/284.png",
                    description: "",
                    commercialPrice: 2200.00,
                    sellingPrice: 2500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة استلس اورجانز  كبيرة",
                    number: "0285",
                    category: "istales",
                    image: "./images/285.png",
                    description: "",
                    commercialPrice: 2700.00,
                    sellingPrice: 3000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة استلس مربعة / بيضاوى",
                    number: "0286",
                    category: "istales",
                    image: "./images/286.png",
                    description: "",
                    commercialPrice: 2000.00,
                    sellingPrice: 2300.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة استلس دايرة صغيرة",
                    number: "0287",
                    category: "istales",
                    image: "./images/287.png",
                    description: "",
                    commercialPrice: 1500.00,
                    sellingPrice: 1800.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقطوقة استلس",
                    number: "0288",
                    category: "istales",
                    image: "./images/288.png",
                    description: "",
                    commercialPrice: 1400.00,
                    sellingPrice: 1600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: " ترابيزة شنطة سدايب",
                    number: "0289",
                    category: "tables",
                    image: "./images/289.png",
                    description: "",
                    commercialPrice: 600.00,
                    sellingPrice: 650.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "شماعة حليبة سويد",
                    number: "0290",
                    category: "storage",
                    image: "./images/290.png",
                    description: "",
                    commercialPrice: 350.00,
                    sellingPrice: 370.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "ترابيزة انترية صوابع تقيلة هدهد",
                    number: "0291",
                    category: "tables",
                    image: "./images/291.png",
                    description: "",
                    commercialPrice: 900.00,
                    sellingPrice: 950.00,
                    createdAt: new Date().toISOString()
                },







                // خلي بالك دى الرجول
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 15سم 1",
                    number: "1001",
                    category: "regol",
                    image: "./images/regol/1001.png",
                    description: "",
                    commercialPrice: 40.00,
                    sellingPrice: 45.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 15سم 2",
                    number: "1002",
                    category: "regol",
                    image: "./images/regol/1002.png",
                    description: "",
                    commercialPrice: 40.00,
                    sellingPrice: 45.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 20سم 1",
                    number: "1003",
                    category: "regol",
                    image: "./images/regol/1003.png",
                    description: "",
                    commercialPrice: 45.00,
                    sellingPrice: 50.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 15سم 3",
                    number: "1004",
                    category: "regol",
                    image: "./images/regol/1004.png",
                    description: "",
                    commercialPrice: 40.00,
                    sellingPrice: 45.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 25سم",
                    number: "1005",
                    category: "regol",
                    image: "./images/regol/1005.png",
                    description: "",
                    commercialPrice: 55.00,
                    sellingPrice: 60.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 15سم 4",
                    number: "1006",
                    category: "regol",
                    image: "./images/regol/1006.png",
                    description: "",
                    commercialPrice: 40.00,
                    sellingPrice: 45.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 20سم 2",
                    number: "1007",
                    category: "regol",
                    image: "./images/regol/1007.png",
                    description: "",
                    commercialPrice: 45.00,
                    sellingPrice: 50.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 20سم 3",
                    number: "1008",
                    category: "regol",
                    image: "./images/regol/1008.png",
                    description: "",
                    commercialPrice: 50.00,
                    sellingPrice: 55.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب قرطاس مخروط محلي 15سم",
                    number: "1009",
                    category: "regol",
                    image: "./images/regol/1009.png",
                    description: "",
                    commercialPrice: 40.00,
                    sellingPrice: 45.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب قرطاس مخروط محلي 20سم",
                    number: "1010",
                    category: "regol",
                    image: "./images/regol/1010.png",
                    description: "",
                    commercialPrice: 50.00,
                    sellingPrice: 55.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب قرطاس مخروط محلي 30سم",
                    number: "1011",
                    category: "regol",
                    image: "./images/regol/1011.png",
                    description: "",
                    commercialPrice: 70.00,
                    sellingPrice: 75.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب قرطاس مخروط محلي 45سم",
                    number: "1012",
                    category: "regol",
                    image: "./images/regol/1012.png",
                    description: "",
                    commercialPrice: 110.00,
                    sellingPrice: 120.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب قرطاس مخروط محلي 65سم",
                    number: "1013",
                    category: "regol",
                    image: "./images/regol/1013.png",
                    description: "",
                    commercialPrice: 160.00,
                    sellingPrice: 170.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 20سم 4",
                    number: "1014",
                    category: "regol",
                    image: "./images/regol/1014.png",
                    description: "",
                    commercialPrice: 45.00,
                    sellingPrice: 50.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 15سم 5",
                    number: "1015",
                    category: "regol",
                    image: "./images/regol/1015.png",
                    description: "",
                    commercialPrice: 40.00,
                    sellingPrice: 45.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل فانوس استلس 15 سم",
                    number: "1016",
                    category: "regol",
                    image: "./images/regol/1016.png",
                    description: "",
                    commercialPrice: 40.00,
                    sellingPrice: 45.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل فانوس استلس 20سم",
                    number: "1017",
                    category: "regol",
                    image: "./images/regol/1017.png",
                    description: "",
                    commercialPrice: 45.00,
                    sellingPrice: 50.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل حلزونة زجزاج 15سم",
                    number: "1018",
                    category: "regol",
                    image: "./images/regol/1018.png",
                    description: "",
                    commercialPrice: 55.00,
                    sellingPrice: 60.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل حلزونة زجزاج 20سم",
                    number: "1019",
                    category: "regol",
                    image: "./images/regol/1019.png",
                    description: "",
                    commercialPrice: 65.00,
                    sellingPrice: 70.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 23سم محمل استلس",
                    number: "1020",
                    category: "regol",
                    image: "./images/regol/1020.png",
                    description: "",
                    commercialPrice: 70.00,
                    sellingPrice: 75.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب حلزونة 15سم",
                    number: "1021",
                    category: "regol",
                    image: "./images/regol/1021.png",
                    description: "",
                    commercialPrice: 45.00,
                    sellingPrice: 50.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب حلزونة 20سم",
                    number: "1022",
                    category: "regol",
                    image: "./images/regol/1022.png",
                    description: "",
                    commercialPrice: 65.00,
                    sellingPrice: 70.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 8سم محمل",
                    number: "1023",
                    category: "regol",
                    image: "./images/regol/1023.png",
                    description: "",
                    commercialPrice: 25.00,
                    sellingPrice: 30.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 8سم خفيف",
                    number: "1024",
                    category: "regol",
                    image: "./images/regol/1024.png",
                    description: "",
                    commercialPrice: 15.00,
                    sellingPrice: 20.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 6سم",
                    number: "1025",
                    category: "regol",
                    image: "./images/regol/1025.png",
                    description: "",
                    commercialPrice: 15.00,
                    sellingPrice: 20.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مخروط 8سم صغير سادة",
                    number: "1026",
                    category: "regol",
                    image: "./images/regol/1026.png",
                    description: "",
                    commercialPrice: 15.00,
                    sellingPrice: 20.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب ركنة مخروط  سادة",
                    number: "1027",
                    category: "regol",
                    image: "./images/regol/1027.png",
                    description: "",
                    commercialPrice: 15.00,
                    sellingPrice: 20.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مدقوق 30سم كبير",
                    number: "1028",
                    category: "regol",
                    image: "./images/regol/1028.png",
                    description: "",
                    commercialPrice: 170.00,
                    sellingPrice: 180.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مدقوق 20سم وسط",
                    number: "1029",
                    category: "regol",
                    image: "./images/regol/1029.png",
                    description: "",
                    commercialPrice: 140.00,
                    sellingPrice: 150.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "كعب مدقوق 15سم صغير",
                    number: "1030",
                    category: "regol",
                    image: "./images/regol/1030.png",
                    description: "",
                    commercialPrice: 110.00,
                    sellingPrice: 120.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية مدقوقة 20سم",
                    number: "1031",
                    category: "regol",
                    image: "./images/regol/1031.png",
                    description: "",
                    commercialPrice: 80.00,
                    sellingPrice: 85.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية مدقوقة مفرغة  20سم",
                    number: "1032",
                    category: "regol",
                    image: "./images/regol/1032.png",
                    description: "",
                    commercialPrice: 110.00,
                    sellingPrice: 120.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 رجل كالبيتشر صغير",
                    number: "1033",
                    category: "regol",
                    image: "./images/regol/1033.png",
                    description: "",
                    commercialPrice: 400.00,
                    sellingPrice: 450.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 رجل كالبيتشر كبير",
                    number: "1034",
                    category: "regol",
                    image: "./images/regol/1034.png",
                    description: "",
                    commercialPrice: 500.00,
                    sellingPrice: 550.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية معلقة 15سم",
                    number: "1035",
                    category: "regol",
                    image: "./images/regol/1035.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 40.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية معلقة 20سم",
                    number: "1036",
                    category: "regol",
                    image: "./images/regol/1036.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 45.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية مدقوقة جناح 15سم",
                    number: "1037",
                    category: "regol",
                    image: "./images/regol/1037.png",
                    description: "",
                    commercialPrice: 70.00,
                    sellingPrice: 75.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية مدقوقة طويلة 15سم",
                    number: "1038",
                    category: "regol",
                    image: "./images/regol/1038.png",
                    description: "",
                    commercialPrice: 90.00,
                    sellingPrice: 95.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية مروحة 15سم",
                    number: "1039",
                    category: "regol",
                    image: "./images/regol/1039.png",
                    description: "",
                    commercialPrice: 50.00,
                    sellingPrice: 55.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية مروحة 20سم",
                    number: "1040",
                    category: "regol",
                    image: "./images/regol/1040.png",
                    description: "",
                    commercialPrice: 60.00,
                    sellingPrice: 65.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية سلسلة 15سم",
                    number: "1041",
                    category: "regol",
                    image: "./images/regol/1041.png",
                    description: "",
                    commercialPrice: 60.00,
                    sellingPrice: 65.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية سلسلة 20سم",
                    number: "1042",
                    category: "regol",
                    image: "./images/regol/1042.png",
                    description: "",
                    commercialPrice: 80.00,
                    sellingPrice: 85.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية وردة 15سم",
                    number: "1043",
                    category: "regol",
                    image: "./images/regol/1043.png",
                    description: "",
                    commercialPrice: 60.00,
                    sellingPrice: 65.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية وردة 20سم",
                    number: "1044",
                    category: "regol",
                    image: "./images/regol/1044.png",
                    description: "",
                    commercialPrice: 80.00,
                    sellingPrice: 85.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية فلة 15سم",
                    number: "1045",
                    category: "regol",
                    image: "./images/regol/1045.png",
                    description: "",
                    commercialPrice: 40.00,
                    sellingPrice: 45.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية فلة 20سم",
                    number: "1046",
                    category: "regol",
                    image: "./images/regol/1046.png",
                    description: "",
                    commercialPrice: 50.00,
                    sellingPrice: 55.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية ملكة",
                    number: "1047",
                    category: "regol",
                    image: "./images/regol/1047.png",
                    description: "",
                    commercialPrice: 220.00,
                    sellingPrice: 250.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية مدقوقة صغيرة",
                    number: "1048",
                    category: "regol",
                    image: "./images/regol/1048.png",
                    description: "",
                    commercialPrice: 60.00,
                    sellingPrice: 65.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول زلط صغير",
                    number: "1049",
                    category: "regol",
                    image: "./images/regol/1049.png",
                    description: "",
                    commercialPrice: 110.00,
                    sellingPrice: 130.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول زلط كبير",
                    number: "1050",
                    category: "regol",
                    image: "./images/regol/1050.png",
                    description: "",
                    commercialPrice: 140.00,
                    sellingPrice: 160.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول ايطالي 15سم",
                    number: "1051",
                    category: "regol",
                    image: "./images/regol/1051.png",
                    description: "",
                    commercialPrice: 120.00,
                    sellingPrice: 125.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول ايطالي 20سم",
                    number: "1052",
                    category: "regol",
                    image: "./images/regol/1052.png",
                    description: "",
                    commercialPrice: 130.00,
                    sellingPrice: 135.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول امبير 12سم",
                    number: "1053",
                    category: "regol",
                    image: "./images/regol/1053.png",
                    description: "",
                    commercialPrice: 70.00,
                    sellingPrice: 75.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول امبير 15سم",
                    number: "1054",
                    category: "regol",
                    image: "./images/regol/1054.png",
                    description: "",
                    commercialPrice: 80.00,
                    sellingPrice: 85.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول امبير 20سم",
                    number: "1055",
                    category: "regol",
                    image: "./images/regol/1055.png",
                    description: "",
                    commercialPrice: 120.00,
                    sellingPrice: 130.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول امبير 25سم",
                    number: "1056",
                    category: "regol",
                    image: "./images/regol/1056.png",
                    description: "",
                    commercialPrice: 130.00,
                    sellingPrice: 140.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول امبير 30سم",
                    number: "1057",
                    category: "regol",
                    image: "./images/regol/1057.png",
                    description: "",
                    commercialPrice: 160.00,
                    sellingPrice: 170.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول امبير 45سم",
                    number: "1058",
                    category: "regol",
                    image: "./images/regol/1058.png",
                    description: "",
                    commercialPrice: 350.00,
                    sellingPrice: 375.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول امبير 80سم",
                    number: "1059",
                    category: "regol",
                    image: "./images/regol/1059.png",
                    description: "",
                    commercialPrice: 850.00,
                    sellingPrice: 900.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول محلي 15سم",
                    number: "1060",
                    category: "regol",
                    image: "./images/regol/1060.png",
                    description: "",
                    commercialPrice: 100.00,
                    sellingPrice: 120.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول محلي 20سم",
                    number: "1061",
                    category: "regol",
                    image: "./images/regol/1061.png",
                    description: "",
                    commercialPrice: 130.00,
                    sellingPrice: 150.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول معلقة 15سم",
                    number: "1062",
                    category: "regol",
                    image: "./images/regol/1062.png",
                    description: "",
                    commercialPrice: 110.00,
                    sellingPrice: 120.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول معلقة 20سم",
                    number: "1063",
                    category: "regol",
                    image: "./images/regol/1063.png",
                    description: "",
                    commercialPrice: 130.00,
                    sellingPrice: 140.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول معلقة 30سم",
                    number: "1064",
                    category: "regol",
                    image: "./images/regol/1064.png",
                    description: "",
                    commercialPrice: 200.00,
                    sellingPrice: 220.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول معلقة 45سم",
                    number: "1065",
                    category: "regol",
                    image: "./images/regol/1065.png",
                    description: "",
                    commercialPrice: 350.00,
                    sellingPrice: 375.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول معلقة 80سم",
                    number: "1066",
                    category: "regol",
                    image: "./images/regol/1066.png",
                    description: "",
                    commercialPrice: 900.00,
                    sellingPrice: 1000.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول قرطاس 15سم",
                    number: "1067",
                    category: "regol",
                    image: "./images/regol/1067.png",
                    description: "",
                    commercialPrice: 85.00,
                    sellingPrice: 90.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول قرطاس 20سم",
                    number: "1068",
                    category: "regol",
                    image: "./images/regol/1068.png",
                    description: "",
                    commercialPrice: 95.00,
                    sellingPrice: 100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول قرطاس 25سم",
                    number: "1069",
                    category: "regol",
                    image: "./images/regol/1069.png",
                    description: "",
                    commercialPrice: 140.00,
                    sellingPrice: 150.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول قرطاس 30سم",
                    number: "1070",
                    category: "regol",
                    image: "./images/regol/1070.png",
                    description: "",
                    commercialPrice: 160.00,
                    sellingPrice: 180.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول قرطاس 45سم",
                    number: "1071",
                    category: "regol",
                    image: "./images/regol/1071.png",
                    description: "",
                    commercialPrice: 300.00,
                    sellingPrice: 350.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول قرطاس 80سم",
                    number: "1072",
                    category: "regol",
                    image: "./images/regol/1072.png",
                    description: "",
                    commercialPrice: 700.00,
                    sellingPrice: 750.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية امبير 12سم",
                    number: "1073",
                    category: "regol",
                    image: "./images/regol/1073.png",
                    description: "",
                    commercialPrice: 25.00,
                    sellingPrice: 30.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية امبير 15سم",
                    number: "1074",
                    category: "regol",
                    image: "./images/regol/1074.png",
                    description: "",
                    commercialPrice: 25.00,
                    sellingPrice: 30.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية امبير 20سم",
                    number: "1075",
                    category: "regol",
                    image: "./images/regol/1075.png",
                    description: "",
                    commercialPrice: 35.00,
                    sellingPrice: 40.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل بزاوية لوكانز",
                    number: "1076",
                    category: "regol",
                    image: "./images/regol/1076.png",
                    description: "",
                    commercialPrice: 60.00,
                    sellingPrice: 65.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول فانوس 45سم",
                    number: "1077",
                    category: "regol",
                    image: "./images/regol/1077.png",
                    description: "",
                    commercialPrice: .00,
                    sellingPrice: .00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول فانوس 80سم",
                    number: "1078",
                    category: "regol",
                    image: "./images/regol/1078.png",
                    description: "",
                    commercialPrice: .00,
                    sellingPrice: .00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول مخروط 80سم(1)",
                    number: "1079",
                    category: "regol",
                    image: "./images/regol/1079.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول مخروط 80سم دمياط",
                    number: "1080",
                    category: "regol",
                    image: "./images/regol/1080.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول مخروط 80سم (2)",
                    number: "1081",
                    category: "regol",
                    image: "./images/regol/1081.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول مخروط 80سم (3)",
                    number: "1082",
                    category: "regol",
                    image: "./images/regol/1082.png",
                    description: "",
                    commercialPrice: 1000.00,
                    sellingPrice: 1100.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول مخروط 45سم ",
                    number: "1083",
                    category: "regol",
                    image: "./images/regol/1083.png",
                    description: "",
                    commercialPrice: 450.00,
                    sellingPrice: 500.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 رجل أويما 45سم",
                    number: "1084",
                    category: "regol",
                    image: "./images/regol/1084.png",
                    description: "",
                    commercialPrice: 550.00,
                    sellingPrice: 600.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم 2 رجل أويما 65سم",
                    number: "1085",
                    category: "regol",
                    image: "./images/regol/1085.png",
                    description: "",
                    commercialPrice: .00,
                    sellingPrice: .00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول طبلية 30سم خفيف",
                    number: "1086",
                    category: "regol",
                    image: "./images/regol/1086.png",
                    description: "",
                    commercialPrice: 75.00,
                    sellingPrice: 80.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول طبلية 30سم تقيل",
                    number: "1087",
                    category: "regol",
                    image: "./images/regol/1087.png",
                    description: "",
                    commercialPrice: 85.00,
                    sellingPrice: 90.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول مروحة 15سم",
                    number: "1088",
                    category: "regol",
                    image: "./images/regol/1088.png",
                    description: "",
                    commercialPrice: 180.00,
                    sellingPrice: 200.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول مروحة 20سم",
                    number: "1089",
                    category: "regol",
                    image: "./images/regol/1089.png",
                    description: "",
                    commercialPrice: 200.00,
                    sellingPrice: 220.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "طقم رجول مدقوق 45سم",
                    number: "1090",
                    category: "regol",
                    image: "./images/regol/1090.png",
                    description: "",
                    commercialPrice: 550.00,
                    sellingPrice: 600.00,
                    createdAt: new Date().toISOString()
                },






                // باقي الرجول لو دخلت
               {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل استلس قرطاس 10سم",
                    number: "1114",
                    category: "regol",
                    image: "./images/regol/1114.png",
                    description: "",
                    commercialPrice: 42.00,
                    sellingPrice: 42.00,
                    createdAt: new Date().toISOString()
                },
               {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل استلس قرطاس 15سم",
                    number: "1115",
                    category: "regol",
                    image: "./images/regol/1115.png",
                    description: "",
                    commercialPrice: 47.00,
                    sellingPrice: 47.00,
                    createdAt: new Date().toISOString()
                },
               {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل استلس قرطاس 20سم",
                    number: "1116",
                    category: "regol",
                    image: "./images/regol/1116.png",
                    description: "",
                    commercialPrice: 50.00,
                    sellingPrice: 50.00,
                    createdAt: new Date().toISOString()
                },
               {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل استلس كعب حصان 15سم",
                    number: "1117",
                    category: "regol",
                    image: "./images/regol/1117.png",
                    description: "",
                    commercialPrice: 60.00,
                    sellingPrice: 60.00,
                    createdAt: new Date().toISOString()
                },
               {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل استلس كعب حصان 20سم",
                    number: "1118",
                    category: "regol",
                    image: "./images/regol/1118.png",
                    description: "",
                    commercialPrice: 65.00,
                    sellingPrice: 65.00,
                    createdAt: new Date().toISOString()
                },
               {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل استلس كعب حصان مفرغ 20سم",
                    number: "1119",
                    category: "regol",
                    image: "./images/regol/1119.png",
                    description: "",
                    commercialPrice: 50.00,
                    sellingPrice: 50.00,
                    createdAt: new Date().toISOString()
                },
               {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل استلس زاوية تقيلة 10سم",
                    number: "1120",
                    category: "regol",
                    image: "./images/regol/1120.png",
                    description: "",
                    commercialPrice: 40.00,
                    sellingPrice: 40.00,
                    createdAt: new Date().toISOString()
                },
               {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل استلس زاوية تقيلة 15سم",
                    number: "1121",
                    category: "regol",
                    image: "./images/regol/1121.png",
                    description: "",
                    commercialPrice: 45.00,
                    sellingPrice: 45.00,
                    createdAt: new Date().toISOString()
                },
               {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل استلس زاوية تقيلة 20سم",
                    number: "1122",
                    category: "regol",
                    image: "./images/regol/1122.png",
                    description: "",
                    commercialPrice: 55.00,
                    sellingPrice: 55.00,
                    createdAt: new Date().toISOString()
                },
               {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل استلس نجمة 15سم",
                    number: "1123",
                    category: "regol",
                    image: "./images/regol/1123.png",
                    description: "",
                    commercialPrice: 65.00,
                    sellingPrice: 65.00,
                    createdAt: new Date().toISOString()
                },
               {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل استلس ستارة 10سم",
                    number: "1124",
                    category: "regol",
                    image: "./images/regol/1124.png",
                    description: "",
                    commercialPrice: 60.00,
                    sellingPrice: 60.00,
                    createdAt: new Date().toISOString()
                },
               {
                    id: this.generateId(),
                    name: "",
                    arabicName: "رجل استلس ستارة 15سم",
                    number: "1125",
                    category: "regol",
                    image: "./images/regol/1125.png",
                    description: "",
                    commercialPrice: 65.00,
                    sellingPrice: 65.00,
                    createdAt: new Date().toISOString()
                },







                // خلي بالك دي الحلايا
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 3 سم فرنساوي سويد",
                    number: "1200",
                    category: "hlaya",
                    image: "./images/hlaya/1200.png",
                    description: "",
                    commercialPrice: 7.50,
                    sellingPrice: 8.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 4 سم فرنساوي خفيف سويد",
                    number: "1201",
                    category: "hlaya",
                    image: "./images/hlaya/1201.png",
                    description: "",
                    commercialPrice: 10.00,
                    sellingPrice: 11.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 4 سم فرنساوي تقيل سويد",
                    number: "1202",
                    category: "hlaya",
                    image: "./images/hlaya/1202.png",
                    description: "",
                    commercialPrice: 15.00,
                    sellingPrice: 16.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 5 سم فرنساوي خفيف سويد",
                    number: "1203",
                    category: "hlaya",
                    image: "./images/hlaya/1203.png",
                    description: "",
                    commercialPrice: 15.00,
                    sellingPrice: 16.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 5 سم فرنساوي تقيل سويد",
                    number: "1204",
                    category: "hlaya",
                    image: "./images/hlaya/1204.png",
                    description: "",
                    commercialPrice: 19.00,
                    sellingPrice: 20.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بوصة اسلامي سويد",
                    number: "1205",
                    category: "hlaya",
                    image: "./images/hlaya/1205.png",
                    description: "",
                    commercialPrice: 6.00,
                    sellingPrice: 6.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 1.5 سم ايطالي سويد",
                    number: "1206",
                    category: "hlaya",
                    image: "./images/hlaya/1206.png",
                    description: "",
                    commercialPrice: 3.00,
                    sellingPrice: 4.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 2 سم ايطالي سويد",
                    number: "1207",
                    category: "hlaya",
                    image: "./images/hlaya/1207.png",
                    description: "",
                    commercialPrice: 4.00,
                    sellingPrice: 5.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 3 سم ايطالي سويد",
                    number: "1208",
                    category: "hlaya",
                    image: "./images/hlaya/1208.png",
                    description: "",
                    commercialPrice: 7.00,
                    sellingPrice: 8.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 4 سم ايطالي سويد",
                    number: "1209",
                    category: "hlaya",
                    image: "./images/hlaya/1209.png",
                    description: "",
                    commercialPrice: 10.00,
                    sellingPrice: 11.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 5 سم ايطالي سويد",
                    number: "1210",
                    category: "hlaya",
                    image: "./images/hlaya/1210.png",
                    description: "",
                    commercialPrice: 12.50,
                    sellingPrice: 13.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 7 سم ايطالي سويد",
                    number: "1211",
                    category: "hlaya",
                    image: "./images/hlaya/1211.png",
                    description: "",
                    commercialPrice: 23.00,
                    sellingPrice: 25.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 10 سم ايطالي سويد",
                    number: "1212",
                    category: "hlaya",
                    image: "./images/hlaya/1212.png",
                    description: "",
                    commercialPrice: 31.00,
                    sellingPrice: 33.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 5 سم حجاب سويد",
                    number: "1213",
                    category: "hlaya",
                    image: "./images/hlaya/1213.png",
                    description: "",
                    commercialPrice: 16.00,
                    sellingPrice: 17.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 4 سم حجاب سويد",
                    number: "1214",
                    category: "hlaya",
                    image: "./images/hlaya/1214.png",
                    description: "",
                    commercialPrice: 10.00,
                    sellingPrice: 11.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 4 سم حجاب تقيل سويد",
                    number: "1215",
                    category: "hlaya",
                    image: "./images/hlaya/1215.png",
                    description: "",
                    commercialPrice: 17.00,
                    sellingPrice: 18.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 3 سم حجاب سويد",
                    number: "1216",
                    category: "hlaya",
                    image: "./images/hlaya/1216.png",
                    description: "",
                    commercialPrice: 7.00,
                    sellingPrice: 8.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بوصة حجاب سويد",
                    number: "1217",
                    category: "hlaya",
                    image: "./images/hlaya/1217.png",
                    description: "",
                    commercialPrice: 6.00,
                    sellingPrice: 6.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 5 سم (47مل) محلي سويد",
                    number: "1218",
                    category: "hlaya",
                    image: "./images/hlaya/1218.png",
                    description: "",
                    commercialPrice: 11.00,
                    sellingPrice: 11.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 5 سم (47مل) موجة سويد",
                    number: "1219",
                    category: "hlaya",
                    image: "./images/hlaya/1219.png",
                    description: "",
                    commercialPrice: 11.00,
                    sellingPrice: 11.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 6 سم (52مل) محلي سويد",
                    number: "1220",
                    category: "hlaya",
                    image: "./images/hlaya/1220.png",
                    description: "",
                    commercialPrice: 12.50,
                    sellingPrice: 13.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 6 سم (52مل) موجة سويد",
                    number: "1221",
                    category: "hlaya",
                    image: "./images/hlaya/1221.png",
                    description: "",
                    commercialPrice: 12.50,
                    sellingPrice: 13.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 7 سم (62مل) محلي سويد",
                    number: "1222",
                    category: "hlaya",
                    image: "./images/hlaya/1222.png",
                    description: "",
                    commercialPrice: 14.50,
                    sellingPrice: 15.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 7 سم (62مل) موجة سويد",
                    number: "1223",
                    category: "hlaya",
                    image: "./images/hlaya/1223.png",
                    description: "",
                    commercialPrice: 14.50,
                    sellingPrice: 15.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 8 سم (73مل) محلي سويد",
                    number: "1224",
                    category: "hlaya",
                    image: "./images/hlaya/1224.png",
                    description: "",
                    commercialPrice: 17.50,
                    sellingPrice: 18.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 8 سم (73مل) موجة سويد",
                    number: "1225",
                    category: "hlaya",
                    image: "./images/hlaya/1225.png",
                    description: "",
                    commercialPrice: 17.50,
                    sellingPrice: 18.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 10 سم (95مل) محلي سويد",
                    number: "1226",
                    category: "hlaya",
                    image: "./images/hlaya/1226.png",
                    description: "",
                    commercialPrice: 22.00,
                    sellingPrice: 23.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 10 سم (95مل) موجة سويد",
                    number: "1227",
                    category: "hlaya",
                    image: "./images/hlaya/1227.png",
                    description: "",
                    commercialPrice: 22.00,
                    sellingPrice: 23.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 5 سم (47مل) انف سويد",
                    number: "1228",
                    category: "hlaya",
                    image: "./images/hlaya/1228.png",
                    description: "",
                    commercialPrice: 11.00,
                    sellingPrice: 11.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 6 سم (52مل) انف سويد",
                    number: "1229",
                    category: "hlaya",
                    image: "./images/hlaya/1229.png",
                    description: "",
                    commercialPrice: 12.50,
                    sellingPrice: 13.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 7 سم (62مل) انف سويد",
                    number: "1230",
                    category: "hlaya",
                    image: "./images/hlaya/1230.png",
                    description: "",
                    commercialPrice: 14.50,
                    sellingPrice: 15.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 8 سم (73مل) انف سويد",
                    number: "1231",
                    category: "hlaya",
                    image: "./images/hlaya/1231.png",
                    description: "",
                    commercialPrice: 17.50,
                    sellingPrice: 18.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية بار 9 سم (95مل) انف سويد",
                    number: "1232",
                    category: "hlaya",
                    image: "./images/hlaya/1232.png",
                    description: "",
                    commercialPrice: 22.00,
                    sellingPrice: 23.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية ربع عمود سويد",
                    number: "1233",
                    category: "hlaya",
                    image: "./images/hlaya/1233.png",
                    description: "",
                    commercialPrice: 6.50,
                    sellingPrice: 7.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية ضي 5 سم سويد",
                    number: "1234",
                    category: "hlaya",
                    image: "./images/hlaya/1234.png",
                    description: "",
                    commercialPrice: 25.00,
                    sellingPrice: 27.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية ضي 7 سم سويد",
                    number: "1235",
                    category: "hlaya",
                    image: "./images/hlaya/1235.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 50.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية سنارة 3 سم x بوصة سويد",
                    number: "1236",
                    category: "hlaya",
                    image: "./images/hlaya/1236.png",
                    description: "",
                    commercialPrice: 15.00,
                    sellingPrice: 16.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية سنارة بوصة x بوصة سويد",
                    number: "1237",
                    category: "hlaya",
                    image: "./images/hlaya/1237.png",
                    description: "",
                    commercialPrice: 13.00,
                    sellingPrice: 14.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية كوبستيد سلم سويد ",
                    number: "1238",
                    category: "hlaya",
                    image: "./images/hlaya/1238.png",
                    description: "",
                    commercialPrice: 75.00,
                    sellingPrice: 85.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية زاوية 3 سم سويد",
                    number: "1239",
                    category: "hlaya",
                    image: "./images/hlaya/1239.png",
                    description: "",
                    commercialPrice: 12.00,
                    sellingPrice: 13.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية زاوية 4 سم سويد",
                    number: "1240",
                    category: "hlaya",
                    image: "./images/hlaya/1240.png",
                    description: "",
                    commercialPrice: 16.00,
                    sellingPrice: 18.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية زاوية 5 سم سويد",
                    number: "1241",
                    category: "hlaya",
                    image: "./images/hlaya/1241.png",
                    description: "",
                    commercialPrice: 20.00,
                    sellingPrice: 21.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 10 سم برانيط خفيفة سويد",
                    number: "1242",
                    category: "hlaya",
                    image: "./images/hlaya/1242.png",
                    description: "",
                    commercialPrice: 37.00,
                    sellingPrice: 40.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 10 سم برانيط تقيلة سويد",
                    number: "1243",
                    category: "hlaya",
                    image: "./images/hlaya/1243.png",
                    description: "",
                    commercialPrice: 45.00,
                    sellingPrice: 48.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 10 سم معبد تقيلة سويد",
                    number: "1244",
                    category: "hlaya",
                    image: "./images/hlaya/1244.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 60.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 12 سم معبد تقيلة سويد",
                    number: "1245",
                    category: "hlaya",
                    image: "./images/hlaya/1245.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 75.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 10 سم مقلوبة سويد",
                    number: "1246",
                    category: "hlaya",
                    image: "./images/hlaya/1246.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 50.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 12 سم مقلوبة سويد",
                    number: "1247",
                    category: "hlaya",
                    image: "./images/hlaya/1247.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 60.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 12 سم مقلوبة أرموطية سويد",
                    number: "1248",
                    category: "hlaya",
                    image: "./images/hlaya/1248.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 60.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 10 سم مقلوبة أرموطية سويد",
                    number: "1249",
                    category: "hlaya",
                    image: "./images/hlaya/1249.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 50.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 12 سم فانوس سويد",
                    number: "1250",
                    category: "hlaya",
                    image: "./images/hlaya/1250.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 135.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 15 سم رقبة تقيلة سويد",
                    number: "1251",
                    category: "hlaya",
                    image: "./images/hlaya/1251.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 150.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 12 سم اخطبوط سويد",
                    number: "1252",
                    category: "hlaya",
                    image: "./images/hlaya/1252.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 120.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 10 سم أرموطية سويد",
                    number: "1253",
                    category: "hlaya",
                    image: "./images/hlaya/1253.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 50.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 10 سم سكلو سويد",
                    number: "1254",
                    category: "hlaya",
                    image: "./images/hlaya/1254.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 50.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 12 سم حورس سويد",
                    number: "1255",
                    category: "hlaya",
                    image: "./images/hlaya/1255.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 75.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 7 سم محلي سويد",
                    number: "1256",
                    category: "hlaya",
                    image: "./images/hlaya/1256.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 27.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: "",
                    arabicName: "حلية 7 سم أرموطية سويد",
                    number: "1257",
                    category: "hlaya",
                    image: "./images/hlaya/1257.png",
                    description: "",
                    commercialPrice: 0.00,
                    sellingPrice: 27.00,
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

    initDarkMode() {
        // Apply dark mode on page load
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        this.updateDarkModeIcon();

        // Listen for system theme changes
        this.setupSystemThemeListener();
    }

    setupSystemThemeListener() {
        // Only listen to system changes if user hasn't manually set a preference
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme === null) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleSystemThemeChange = (e) => {
                // Only update if user hasn't manually set a preference
                if (localStorage.getItem('darkMode') === null) {
                    this.isDarkMode = e.matches;
                    if (this.isDarkMode) {
                        document.documentElement.setAttribute('data-theme', 'dark');
                    } else {
                        document.documentElement.setAttribute('data-theme', 'light');
                    }
                    this.updateDarkModeIcon();
                }
            };

            // Add listener for system theme changes
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleSystemThemeChange);
            } else {
                // Fallback for older browsers
                mediaQuery.addListener(handleSystemThemeChange);
            }
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);

        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }

        this.updateDarkModeIcon();
    }

    resetToSystemTheme() {
        // Clear manual preference and use system theme
        localStorage.removeItem('darkMode');
        this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }

        this.updateDarkModeIcon();
        this.setupSystemThemeListener();
    }

    updateDarkModeIcon() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            const icon = darkModeToggle.querySelector('i');
            if (icon) {
                const savedTheme = localStorage.getItem('darkMode');
                const isSystemTheme = savedTheme === null;

                if (this.isDarkMode) {
                    icon.className = 'fas fa-sun';
                    if (isSystemTheme) {
                        darkModeToggle.title = this.currentLanguage === 'ar'
                            ? 'الوضع المظلم (إعدادات النظام) - انقر نقرتين لإعادة التعيين'
                            : 'Dark Mode (System) - Double-click to reset';
                    } else {
                        darkModeToggle.title = this.currentLanguage === 'ar'
                            ? 'تبديل الوضع المضيء - انقر نقرتين لإعادة تعيين النظام'
                            : 'Switch to Light Mode - Double-click to reset to system';
                    }
                } else {
                    icon.className = 'fas fa-moon';
                    if (isSystemTheme) {
                        darkModeToggle.title = this.currentLanguage === 'ar'
                            ? 'الوضع المضيء (إعدادات النظام) - انقر نقرتين لإعادة التعيين'
                            : 'Light Mode (System) - Double-click to reset';
                    } else {
                        darkModeToggle.title = this.currentLanguage === 'ar'
                            ? 'تبديل الوضع المظلم - انقر نقرتين لإعادة تعيين النظام'
                            : 'Switch to Dark Mode - Double-click to reset to system';
                    }
                }
            }
        }
    }
}

// ====== Initialize App on DOM Ready ======
document.addEventListener('DOMContentLoaded', () => {
    showWelcomeNotification();
    setupScrollToTopBtn();
    const furnitureStore = new FurnitureStore();
    window.furnitureStore = furnitureStore;
    // Footer year
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});
