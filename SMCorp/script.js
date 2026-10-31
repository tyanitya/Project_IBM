/**
 * ============================================================
 *  SM Corp – Fan Portal | script.js
 *  Vanilla JavaScript (defer, no framework)
 *  Semua logika rendering, filtering, dan interaksi DOM
 * ============================================================
 */

// ============================================================
// 1. STATE APLIKASI
//    Menyimpan state aktif: grup yang dipilih, kategori filter,
//    dan jumlah item di cart.
// ============================================================
const state = {
  groups: [],           // Data semua grup dari JSON
  activeGroup: null,    // Objek grup yang sedang ditampilkan
  activeCategory: 'albums', // Kategori filter aktif: 'albums' | 'merchandise' | 'events'
  cartCount: 0,         // Jumlah item di cart (simulasi)
};

// ============================================================
// 2. REFERENSI ELEMEN DOM
//    Dikumpulkan sekali untuk efisiensi performa.
// ============================================================
const DOM = {
  viewHome:       document.getElementById('view-home'),
  viewGroup:      document.getElementById('view-group'),
  artistGrid:     document.getElementById('artist-grid'),
  groupHero:      document.getElementById('group-hero'),
  groupName:      document.getElementById('group-name'),
  groupTagline:   document.getElementById('group-tagline'),
  groupMeta:      document.getElementById('group-meta'),
  groupMembers:   document.getElementById('group-members'),
  filterTabs:     document.getElementById('filter-tabs'),
  contentArea:    document.getElementById('content-area'),
  backBtn:        document.getElementById('back-btn'),
  cartBtn:        document.getElementById('cart-btn'),
  cartCount:      document.getElementById('cart-count'),
  toast:          document.getElementById('toast'),
  toastMsg:       document.getElementById('toast-msg'),
  navLogo:        document.getElementById('nav-logo'),
  navHomeLink:    document.getElementById('nav-home-link'),
  navHomeMobile:  document.getElementById('nav-home-mobile'),
  mobileMenuBtn:  document.getElementById('mobile-menu-btn'),
  mobileMenu:     document.getElementById('mobile-menu'),
};

// ============================================================
// 3. UTILS – Fungsi Pembantu
// ============================================================

/**
 * Memformat angka ke format Rupiah.
 * @param {number} price - Harga dalam angka
 * @returns {string} - Format: "Rp 185.000"
 */
function formatPrice(price) {
  return 'Rp ' + price.toLocaleString('id-ID');
}

/**
 * Memecah string lagu (dipisah "|") menjadi array judul lagu.
 * @param {string} trackString - String "Track1|Track2|Track3"
 * @returns {string[]} - Array judul lagu
 */
function parseTracks(trackString) {
  return trackString.split('|').map(t => t.trim()).filter(Boolean);
}

/**
 * Menentukan warna latar badge event berdasarkan tipe event.
 * @param {string} type - 'Concert' | 'Fan Meet' | 'Fan Sign'
 * @returns {string} - Tailwind classes
 */
function getEventBadgeClass(type) {
  const map = {
    'Concert':  'bg-brand-100 text-brand-700',
    'Fan Meet': 'bg-purple-100 text-purple-700',
    'Fan Sign': 'bg-emerald-100 text-emerald-700',
  };
  return map[type] || 'bg-gray-100 text-gray-600';
}

/**
 * Menentukan warna badge status event.
 * @param {string} status - 'On Sale' | 'Coming Soon' | 'Sold Out'
 * @returns {string} - Tailwind classes
 */
function getStatusBadgeClass(status) {
  const map = {
    'On Sale':     'bg-green-100 text-green-700',
    'Coming Soon': 'bg-yellow-100 text-yellow-700',
    'Sold Out':    'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

/**
 * Memformat tanggal dari "YYYY-MM-DD" ke "DD Bulan YYYY".
 * @param {string} dateStr - Format ISO date string
 * @returns {string} - Contoh: "15 Maret 2024"
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Menampilkan toast notifikasi selama beberapa detik.
 * @param {string} message - Pesan yang ditampilkan
 * @param {number} [duration=2500] - Durasi tampil dalam ms
 */
function showToast(message, duration = 2500) {
  DOM.toastMsg.textContent = message;
  DOM.toast.classList.remove('hidden');
  clearTimeout(DOM.toast._timer);
  DOM.toast._timer = setTimeout(() => {
    DOM.toast.classList.add('hidden');
  }, duration);
}

/**
 * Menambah jumlah item di cart dan memperbarui tampilan badge.
 */
function addToCart() {
  state.cartCount += 1;
  DOM.cartCount.textContent = state.cartCount;
  DOM.cartCount.classList.remove('hidden');
}

// ============================================================
// 4. NAVIGASI VIEW
//    Mengontrol tampilan antarmuka: Home (artist grid) vs Group Detail
// ============================================================

/**
 * Menampilkan halaman Home (grid semua artis).
 * Menyembunyikan view grup dan mengembalikan scroll ke atas.
 */
function showHomeView() {
  state.activeGroup = null;

  // Sembunyikan grup, tampilkan home dengan fade-enter
  DOM.viewGroup.classList.add('hidden');
  DOM.viewHome.classList.remove('hidden');

  // Re-trigger animasi fade-enter
  DOM.viewHome.classList.remove('fade-enter');
  void DOM.viewHome.offsetHeight; // force reflow
  DOM.viewHome.classList.add('fade-enter');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Menampilkan halaman detail grup yang dipilih.
 * Merender hero, filter tabs, dan konten default (albums).
 * @param {Object} group - Objek grup dari state.groups
 */
function showGroupView(group) {
  state.activeGroup = group;
  state.activeCategory = 'albums';

  // Sembunyikan home, tampilkan grup dengan fade-enter
  DOM.viewHome.classList.add('hidden');
  DOM.viewGroup.classList.remove('hidden');

  // Re-trigger animasi fade-enter yang mulus
  DOM.viewGroup.classList.remove('fade-enter');
  void DOM.viewGroup.offsetHeight; // force reflow
  DOM.viewGroup.classList.add('fade-enter');

  renderGroupHero(group);
  renderFilterTabs();
  renderContent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// 5. RENDER: ARTIST GRID (Home View)
// ============================================================

/**
 * Merender grid kartu artis dari data state.groups.
 * Setiap kartu menampilkan nama, debut, genre, dan avatar placeholder.
 */
function renderArtistGrid() {
  DOM.artistGrid.innerHTML = '';

  state.groups.forEach((group) => {
    const card = document.createElement('article');
    card.className = 'artist-card bg-white rounded-3xl border border-brand-100 overflow-hidden cursor-pointer shadow-pastel-sm';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View ${group.name}`);

    // Inisial dari nama grup (maks 2 karakter)
    const initials = group.name.slice(0, 2).toUpperCase();

    card.innerHTML = `
      <!-- Gradient Avatar Area -->
      <div class="avatar-placeholder h-44 sm:h-52 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
        <span class="text-white font-extrabold text-5xl sm:text-6xl opacity-25 select-none">${initials}</span>
        <!-- Debut badge -->
        <span class="absolute top-3 right-3 bg-white/75 backdrop-blur-sm text-brand-600 text-xs font-bold px-3 py-1 rounded-full shadow-pastel-sm border border-brand-100">
          Since ${group.debut}
        </span>
        <!-- Cute deco star -->
        <span class="absolute bottom-3 left-4 text-white/40 text-2xl select-none">✦</span>
      </div>

      <!-- Info -->
      <div class="p-5">
        <h3 class="text-lg font-extrabold text-gray-900 mb-0.5">${group.name}</h3>
        <p class="text-xs text-gray-400 mb-3 truncate">${group.genre}</p>

        <!-- Stats Row -->
        <div class="flex items-center justify-between text-xs text-gray-400 mb-4 bg-brand-50 rounded-2xl px-3 py-2">
          <span class="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-brand-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
            <span class="font-semibold text-gray-600">${group.members.split(',').length}</span> Members
          </span>
          <span class="w-px h-3 bg-brand-200 inline-block"></span>
          <span class="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-brand-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"/>
            </svg>
            <span class="font-semibold text-gray-600">${group.albums.length}</span> Albums
          </span>
        </div>

        <button class="w-full bg-gradient-to-r from-brand-400 to-brand-600 hover:from-brand-500 hover:to-brand-700 text-white text-sm font-bold py-2.5 rounded-full transition-all duration-200 shadow-pastel-sm hover:shadow-pastel active:scale-95">
          🌸 Explore
        </button>
      </div>
    `;

    // Event klik: masuk ke halaman grup
    card.addEventListener('click', () => showGroupView(group));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') showGroupView(group);
    });

    DOM.artistGrid.appendChild(card);
  });
}

// ============================================================
// 6. RENDER: GROUP HERO
// ============================================================

/**
 * Merender bagian hero halaman detail grup.
 * Menampilkan nama, tagline, meta info (debut, genre), dan daftar member.
 * @param {Object} group - Objek grup
 */
function renderGroupHero(group) {
  DOM.groupTagline.textContent = group.tagline;
  DOM.groupName.textContent    = group.name;
  DOM.groupMeta.textContent    = `Debut: ${group.debut}  •  Genre: ${group.genre}`;
  DOM.groupMembers.innerHTML   = `<span class="font-semibold text-gray-700">Members:</span> ${group.members}`;
}

// ============================================================
// 7. RENDER: FILTER TABS
//    Membuat tombol navigasi kategori: Albums, Merchandise, Events
// ============================================================

/**
 * Merender tombol filter kategori di bawah hero grup.
 * Menandai tab aktif dengan class 'active' dan pembaruan gaya.
 */
function renderFilterTabs() {
  const categories = [
    { id: 'albums',       label: '🎵 Albums' },
    { id: 'merchandise',  label: '🛍️ Merchandise' },
    { id: 'events',       label: '🎤 Events' },
  ];

  DOM.filterTabs.innerHTML = '';

  categories.forEach(({ id, label }) => {
    const isActive = id === state.activeCategory;
    const btn = document.createElement('button');
    btn.className = `filter-tab px-5 py-2.5 text-sm font-bold rounded-full focus:outline-none
      ${isActive
        ? 'bg-gradient-to-r from-brand-400 to-brand-600 text-white shadow-pastel-sm active'
        : 'bg-white text-gray-500 border border-brand-200 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-300'
      }`;
    btn.textContent = label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', isActive);
    btn.setAttribute('data-category', id);

    btn.addEventListener('click', () => {
      state.activeCategory = id;
      renderFilterTabs(); // re-render tabs dengan state baru
      renderContent();    // re-render konten
    });

    DOM.filterTabs.appendChild(btn);
  });
}

// ============================================================
// 8. RENDER: KONTEN UTAMA (router berdasarkan activeCategory)
// ============================================================

/**
 * Router utama konten: memanggil fungsi render yang sesuai
 * berdasarkan state.activeCategory yang aktif.
 */
function renderContent() {
  // Re-trigger animasi fade saat ganti kategori
  DOM.contentArea.classList.remove('fade-enter');
  void DOM.contentArea.offsetHeight; // force reflow
  DOM.contentArea.classList.add('fade-enter');

  switch (state.activeCategory) {
    case 'albums':      renderAlbums();      break;
    case 'merchandise': renderMerchandise(); break;
    case 'events':      renderEvents();      break;
  }
}

// ============================================================
// 9. RENDER: ALBUMS
// ============================================================

/**
 * Merender daftar album grup aktif.
 * Setiap kartu menampilkan: cover placeholder, judul, tahun, tipe,
 * daftar lagu (dipecah dari string dengan "|"), dan harga.
 */
function renderAlbums() {
  const group = state.activeGroup;
  const albums = group.albums;

  DOM.contentArea.innerHTML = `
    <h3 class="text-xl font-extrabold text-gray-800 mb-6 flex items-center gap-3">
      <span class="w-2 h-6 bg-gradient-to-b from-brand-400 to-brand-600 rounded-full inline-block"></span>
      🎵 Discography – ${albums.length} Albums
    </h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="albums-grid">
    </div>
  `;

  const grid = DOM.contentArea.querySelector('#albums-grid');

  albums.forEach((album) => {
    // Pecah string track menjadi array menggunakan parseTracks()
    const tracks = parseTracks(album.tracks);

    const card = document.createElement('article');
    card.className = 'product-card bg-white rounded-3xl border border-brand-100 overflow-hidden shadow-pastel-sm';

    // Render daftar lagu sebagai <li> items
    const trackListHTML = tracks.map((track, i) => `
      <li class="track-item flex items-center gap-2 py-1.5 border-b border-brand-50 last:border-0" style="animation-delay:${i * 30}ms">
        <span class="text-brand-400 font-bold text-xs w-5 text-right flex-shrink-0">${i + 1}</span>
        <span class="text-gray-700 text-sm truncate">${track}</span>
      </li>
    `).join('');

    card.innerHTML = `
      <!-- Album Cover Placeholder -->
      <div class="cover-placeholder h-40 flex items-center justify-center relative overflow-hidden rounded-t-3xl">
        <span class="text-white font-extrabold text-3xl opacity-25 px-4 text-center leading-tight">${album.title}</span>
        <span class="absolute bottom-2 right-3 text-white/60 text-xs font-bold">${album.year}</span>
        <span class="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-brand-600 text-xs font-bold px-3 py-1 rounded-full border border-brand-100">
          ${album.type}
        </span>
      </div>

      <!-- Album Info -->
      <div class="p-5">
        <h4 class="text-base font-extrabold text-gray-900 mb-0.5">${album.title}</h4>
        <p class="text-xs text-gray-400 mb-4">${album.year} · ${tracks.length} Tracks</p>

        <!-- Track List -->
        <div class="mb-4 bg-brand-50 rounded-2xl p-3">
          <p class="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2">🎵 Track List</p>
          <ul class="max-h-40 overflow-y-auto pr-1 space-y-0 tracklist-scroll">
            ${trackListHTML}
          </ul>
        </div>

        <!-- Price & CTA -->
        <div class="flex items-center justify-between pt-3 border-t border-brand-100">
          <p class="price-tag text-brand-600 font-extrabold text-base">${formatPrice(album.price)}</p>
          <button
            class="btn-add-cart bg-gradient-to-r from-brand-400 to-brand-600 hover:from-brand-500 hover:to-brand-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-pastel-sm flex items-center gap-1.5"
            data-item-name="${album.title} (Album)"
            data-item-price="${album.price}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Add to Cart
          </button>
        </div>
      </div>
    `;

    // Event listener tombol "Add to Cart"
    card.querySelector('.btn-add-cart').addEventListener('click', handleAddToCart);
    grid.appendChild(card);
  });
}

// ============================================================
// 10. RENDER: MERCHANDISE
// ============================================================

/**
 * Merender grid merchandise grup aktif.
 * Mengelompokkan item berdasarkan kategori dan menampilkan
 * nama item, kategori badge, dan harga.
 */
function renderMerchandise() {
  const group = state.activeGroup;
  const items = group.merchandise;

  // Kumpulkan semua kategori unik untuk sub-filter
  const categories = ['All', ...new Set(items.map(i => i.category))];

  DOM.contentArea.innerHTML = `
    <h3 class="text-xl font-extrabold text-gray-800 mb-4 flex items-center gap-3">
      <span class="w-2 h-6 bg-gradient-to-b from-brand-400 to-brand-600 rounded-full inline-block"></span>
      🛍️ Merchandise – ${items.length} Items
    </h3>

    <!-- Sub-filter kategori merchandise (kapsul pills) -->
    <div id="merch-filter" class="flex flex-wrap gap-2 mb-6">
      ${categories.map(cat => `
        <button
          class="merch-cat-btn text-xs font-bold px-4 py-2 rounded-full border transition-all duration-200
                 ${cat === 'All'
                   ? 'bg-gradient-to-r from-brand-400 to-brand-600 text-white border-transparent shadow-pastel-sm'
                   : 'bg-white text-gray-500 border-brand-200 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50'}"
          data-cat="${cat}">
          ${cat}
        </button>
      `).join('')}
    </div>

    <div id="merch-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
    </div>
  `;

  // Render semua item pertama kali
  renderMerchItems(items, 'All');

  // Pasang event listener sub-filter merchandise
  DOM.contentArea.querySelector('#merch-filter').addEventListener('click', (e) => {
    const btn = e.target.closest('.merch-cat-btn');
    if (!btn) return;

    const selectedCat = btn.dataset.cat;

    // Update style tombol aktif – reset semua, lalu set yang dipilih
    DOM.contentArea.querySelectorAll('.merch-cat-btn').forEach(b => {
      b.className = 'merch-cat-btn text-xs font-bold px-4 py-2 rounded-full border transition-all duration-200 bg-white text-gray-500 border-brand-200 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50';
    });
    btn.className = 'merch-cat-btn text-xs font-bold px-4 py-2 rounded-full border transition-all duration-200 bg-gradient-to-r from-brand-400 to-brand-600 text-white border-transparent shadow-pastel-sm';

    renderMerchItems(items, selectedCat);
  });
}

/**
 * Merender item merchandise ke dalam grid, difilter berdasarkan kategori.
 * @param {Object[]} items - Array semua item merchandise grup
 * @param {string} filterCat - Kategori yang dipilih ('All' atau nama kategori spesifik)
 */
function renderMerchItems(items, filterCat) {
  const grid = DOM.contentArea.querySelector('#merch-grid');
  const filtered = filterCat === 'All' ? items : items.filter(i => i.category === filterCat);

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `<p class="col-span-full text-center text-gray-400 py-12">No items found.</p>`;
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'product-card bg-white rounded-3xl border border-brand-100 overflow-hidden shadow-pastel-sm flex flex-col';

    card.innerHTML = `
      <!-- Item Visual Placeholder -->
      <div class="cover-placeholder h-36 flex flex-col items-center justify-center gap-1 px-3 rounded-t-3xl relative overflow-hidden">
        <span class="text-white font-extrabold text-3xl opacity-20 select-none">${item.category.slice(0, 1)}</span>
        <span class="text-white text-xs font-semibold opacity-60 text-center leading-tight px-2">${item.name}</span>
        <span class="absolute bottom-2 right-2 text-white/30 text-xl select-none">✦</span>
      </div>

      <!-- Item Info -->
      <div class="p-4 flex flex-col flex-1">
        <span class="inline-block self-start bg-brand-100 text-brand-600 text-xs font-bold px-3 py-1 rounded-full mb-2">${item.category}</span>
        <h4 class="text-sm font-bold text-gray-800 mb-1 leading-snug flex-1">${item.name}</h4>
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-brand-50">
          <p class="price-tag text-brand-600 font-extrabold text-sm">${formatPrice(item.price)}</p>
          <button
            class="btn-add-cart bg-gradient-to-r from-brand-400 to-brand-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-pastel-sm flex items-center gap-1"
            data-item-name="${item.name}"
            data-item-price="${item.price}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Add
          </button>
        </div>
      </div>
    `;

    card.querySelector('.btn-add-cart').addEventListener('click', handleAddToCart);
    grid.appendChild(card);
  });
}

// ============================================================
// 11. RENDER: EVENTS
// ============================================================

/**
 * Merender daftar event grup aktif.
 * Menampilkan tipe event, judul, tanggal, venue, harga, dan status.
 * Event dibagi berdasarkan tipe: Concert, Fan Meet, Fan Sign.
 */
function renderEvents() {
  const group = state.activeGroup;
  const events = group.events;

  // Kelompokkan event berdasarkan tipe
  const grouped = events.reduce((acc, ev) => {
    if (!acc[ev.type]) acc[ev.type] = [];
    acc[ev.type].push(ev);
    return acc;
  }, {});

  DOM.contentArea.innerHTML = `
    <h3 class="text-xl font-extrabold text-gray-800 mb-6 flex items-center gap-3">
      <span class="w-2 h-6 bg-gradient-to-b from-brand-400 to-brand-600 rounded-full inline-block"></span>
      🎤 Upcoming Events – ${events.length} Events
    </h3>
    <div id="events-list" class="space-y-8"></div>
  `;

  const list = DOM.contentArea.querySelector('#events-list');

  // Render per grup tipe event
  Object.entries(grouped).forEach(([type, typeEvents]) => {
    const section = document.createElement('div');
    section.innerHTML = `
      <h4 class="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
        <span class="event-badge ${getEventBadgeClass(type)}">${type}</span>
      </h4>
      <div class="space-y-4" id="section-${type.replace(/\s+/g, '-')}"></div>
    `;

    const sectionCards = section.querySelector(`#section-${type.replace(/\s+/g, '-')}`);

    typeEvents.forEach(ev => {
      const card = document.createElement('article');
      card.className = 'product-card bg-white rounded-3xl border border-brand-100 p-5 shadow-pastel-sm flex flex-col sm:flex-row sm:items-center gap-4';

      card.innerHTML = `
        <!-- Left: Date Block (pastel) -->
        <div class="date-block flex-shrink-0 rounded-2xl w-16 h-16 flex flex-col items-center justify-center text-brand-700">
          <span class="text-xl font-extrabold leading-none">${new Date(ev.date).getDate()}</span>
          <span class="text-xs font-bold uppercase">${new Date(ev.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
          <span class="text-xs text-brand-400 font-medium">${new Date(ev.date).getFullYear()}</span>
        </div>

        <!-- Middle: Info -->
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-1.5">
            <span class="event-badge ${getEventBadgeClass(ev.type)}">${ev.type}</span>
            <span class="event-badge ${getStatusBadgeClass(ev.status)}">${ev.status}</span>
          </div>
          <h4 class="text-base font-bold text-gray-900 truncate">${ev.title}</h4>
          <p class="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5 truncate">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-brand-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            ${ev.venue}
          </p>
          <p class="text-xs text-brand-300 mt-1 font-medium">${formatDate(ev.date)}</p>
        </div>

        <!-- Right: Price & CTA -->
        <div class="flex-shrink-0 flex flex-col items-end gap-2 sm:items-center sm:text-right">
          <p class="price-tag text-brand-600 font-extrabold text-base">${formatPrice(ev.price)}</p>
          <button
            class="btn-add-cart w-full sm:w-auto bg-gradient-to-r from-brand-400 to-brand-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-pastel-sm flex items-center justify-center gap-1.5
                   ${ev.status === 'Sold Out' ? 'opacity-50 cursor-not-allowed' : ''}"
            data-item-name="${ev.title}"
            data-item-price="${ev.price}"
            ${ev.status === 'Sold Out' ? 'disabled' : ''}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
            </svg>
            ${ev.status === 'Sold Out' ? 'Sold Out' : ev.status === 'Coming Soon' ? '🔔 Ingatkan' : '🎟️ Beli Tiket'}
          </button>
        </div>
      `;

      // Pasang event listener hanya jika event bukan Sold Out
      if (ev.status !== 'Sold Out') {
        card.querySelector('.btn-add-cart').addEventListener('click', handleAddToCart);
      }

      sectionCards.appendChild(card);
    });

    list.appendChild(section);
  });
}

// ============================================================
// 12. EVENT HANDLER: ADD TO CART
// ============================================================

/**
 * Handler untuk tombol "Add to Cart".
 * Menambah jumlah cart dan menampilkan toast konfirmasi.
 * @param {Event} e - Click event dari tombol
 */
function handleAddToCart(e) {
  const btn = e.currentTarget;
  const itemName = btn.dataset.itemName;
  addToCart();
  showToast(`✓ "${itemName}" ditambahkan ke cart!`);
}

// ============================================================
// 13. NAVIGASI & UTILITY HANDLERS
// ============================================================

/**
 * Mengatur event listener untuk elemen navigasi global:
 * - Logo & link navigasi untuk kembali ke Home
 * - Tombol Back di halaman grup
 * - Tombol toggle menu mobile
 */
function initNavigation() {
  // Klik logo kembali ke home
  DOM.navLogo.addEventListener('click', (e) => {
    e.preventDefault();
    showHomeView();
  });

  // Link "Artists" desktop
  DOM.navHomeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showHomeView();
  });

  // Link "Artists" mobile
  DOM.navHomeMobile.addEventListener('click', (e) => {
    e.preventDefault();
    showHomeView();
    DOM.mobileMenu.classList.add('hidden');
  });

  // Tombol Back di halaman grup
  DOM.backBtn.addEventListener('click', () => showHomeView());

  // Toggle menu mobile
  DOM.mobileMenuBtn.addEventListener('click', () => {
    DOM.mobileMenu.classList.toggle('hidden');
  });
}

// ============================================================
// 14. INISIALISASI APLIKASI
// ============================================================

/**
 * Fungsi utama: memuat data JSON, menyimpan ke state,
 * merender grid artis, dan mengaktifkan navigasi.
 */
async function init() {
  try {
    // Ambil data dari file JSON lokal
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error(`Gagal memuat data: ${response.status}`);
    const data = await response.json();

    // Simpan ke state
    state.groups = data.groups;

    // Render grid artis di halaman home
    renderArtistGrid();

    // Inisialisasi navigasi global
    initNavigation();

  } catch (error) {
    console.error('[SM Corp] Error inisialisasi:', error);
    // Tampilkan pesan error ke pengguna
    DOM.artistGrid.innerHTML = `
      <div class="col-span-full text-center py-20">
        <p class="text-red-400 font-semibold">Gagal memuat data artis.</p>
        <p class="text-gray-400 text-sm mt-1">Pastikan file data.json tersedia dan server lokal berjalan.</p>
      </div>
    `;
  }
}

// Jalankan aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', init);
