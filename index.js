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

        // Show reset tooltip on page load, then hide it after 7 seconds
        this.showResetTooltip();

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

    showResetTooltip() {
        const notification = document.getElementById('resetDataNotification');
        if (notification) {
            // Show notification immediately
            setTimeout(() => {
                notification.classList.add('show');
            }, 500);

            // Hide after 7 seconds
            setTimeout(() => {
                notification.classList.remove('show');
            }, 5000);
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
            'berwaz': { en: 'berwaz', ar: 'براويز و مرايات' },
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
                
            ];

            this.items = sampleItems;
            this.saveItems();
        }
    }

    loadItems() {
        const saved = localStorage.getItem('furnitureItemss');
        return saved ? JSON.parse(saved) : [];
    }

    saveItems() {
        localStorage.setItem('furnitureItemss', JSON.stringify(this.items));
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