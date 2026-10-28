/* ZELLE HAIR — interactions */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let themeMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeMeta) {
    themeMeta = document.createElement('meta');
    themeMeta.name = 'theme-color';
    document.head.appendChild(themeMeta);
  }
  const syncSystemTheme = (event) => {
    document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
    themeMeta.content = event.matches ? '#0c0b0a' : '#f8f7f5';
  };
  syncSystemTheme(systemTheme);
  systemTheme.addEventListener('change', syncSystemTheme);
  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = document.querySelector('.menu-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) toggle.addEventListener('click', () => links.classList.toggle('open'));

  const io = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('in')),
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal').forEach((element) => io.observe(element));

  const hero = document.querySelector('.hero');
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroDots = document.querySelectorAll('.hero-dot');
  const heroCount = document.querySelector('.hero-count b');
  if (heroSlides.length) {
    let heroIndex = 0;
    let heroTimer;
    const showHeroSlide = (next) => {
      heroIndex = (next + heroSlides.length) % heroSlides.length;
      heroSlides.forEach((slide, index) => slide.classList.toggle('active', index === heroIndex));
      heroDots.forEach((dot, index) => dot.classList.toggle('active', index === heroIndex));
      if (heroCount) heroCount.textContent = String(heroIndex + 1).padStart(2, '0');
    };
    const startHero = () => {
      if (reduceMotion || heroSlides.length < 2) return;
      clearInterval(heroTimer);
      heroTimer = setInterval(() => showHeroSlide(heroIndex + 1), 5500);
    };
    heroDots.forEach((dot, index) => dot.addEventListener('click', () => { showHeroSlide(index); startHero(); }));
    hero?.addEventListener('mouseenter', () => clearInterval(heroTimer));
    hero?.addEventListener('mouseleave', startHero);
    document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(heroTimer) : startHero());
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight) heroSlides.forEach((slide) => { slide.style.setProperty('--hero-y', `${window.scrollY * 0.12}px`); });
    }, { passive: true });
    showHeroSlide(0);
    startHero();
  }

  const track = document.querySelector('.carousel-track');
  const dots = document.querySelectorAll('.carousel-nav .dot');
  if (track && dots.length) {
    let index = 0;
    let timer;
    const go = (next) => {
      index = (next + dots.length) % dots.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, position) => dot.classList.toggle('active', position === index));
    };
    const auto = () => { timer = setInterval(() => go(index + 1), 6000); };
    dots.forEach((dot, position) => dot.addEventListener('click', () => { clearInterval(timer); go(position); auto(); }));
    go(0);
    auto();
  }

  const chips = document.querySelectorAll('.chip');
  const cards = document.querySelectorAll('.product-card[data-cat]');
  const applyFilter = (category) => {
    const selected = Array.from(chips).some((chip) => chip.dataset.filter === category) ? category : 'all';
    chips.forEach((chip) => {
      const active = chip.dataset.filter === selected;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    let count = 0;
    cards.forEach((card) => {
      const show = selected === 'all' || card.dataset.cat === selected;
      card.hidden = !show;
      card.classList.toggle('hide', !show);
      if (show) {
        count += 1;
        card.classList.add('in');
        card.classList.remove('pop');
        void card.offsetWidth;
        card.classList.add('pop');
      }
    });
    const status = document.querySelector('.filter-status');
    if (status) status.textContent = `${count} ${selected === 'all' ? 'pieces' : selected} in the collection`;
  };
  if (chips.length) {
    const readFilter = () => applyFilter(new URLSearchParams(window.location.search).get('category') || 'all');
    chips.forEach((chip) => chip.addEventListener('click', () => {
      const url = new URL(window.location.href);
      if (chip.dataset.filter === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', chip.dataset.filter);
      window.history.pushState(null, '', url);
      applyFilter(chip.dataset.filter);
    }));
    window.addEventListener('popstate', readFilter);
    readFilter();
  }

  const currency = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
  let cart = JSON.parse(localStorage.getItem('zelle-cart') || '[]');
  document.body.insertAdjacentHTML('beforeend', `
    <div class="cart-backdrop" aria-hidden="true"></div>
    <aside class="cart-drawer" aria-hidden="true" aria-label="Shopping bag">
      <div class="cart-head"><div><span class="eyebrow">Your selection</span><h2>Shopping bag</h2></div><button class="cart-close" aria-label="Close bag">×</button></div>
      <div class="cart-items"></div>
      <div class="cart-foot"><div class="cart-total"><span>Subtotal</span><strong>£0.00</strong></div><p>UK delivery is complimentary over £150.</p><button class="btn btn-lacquer checkout-btn">Secure checkout <span>→</span></button><small class="checkout-note" aria-live="polite"></small></div>
    </aside>
    <div class="quick-view-backdrop" aria-hidden="true"></div>
    <section class="quick-view" role="dialog" aria-modal="true" aria-labelledby="quick-view-title" aria-hidden="true">
      <button class="quick-view-close" aria-label="Close product preview">×</button>
      <div class="quick-view-image"><img src="" alt="" /><span>Quick view</span></div>
      <div class="quick-view-copy">
        <span class="quick-view-category"></span>
        <h2 id="quick-view-title"></h2>
        <div class="quick-view-rating"></div>
        <p class="quick-view-description"></p>
        <ul><li>100% virgin human hair</li><li>Cuticle aligned for lasting softness</li><li>Complimentary UK delivery over £150</li></ul>
        <div class="quick-view-price"></div>
        <label class="quick-view-option"><span>Select length</span><select></select></label>
        <button class="btn btn-lacquer quick-view-add">Add to bag <span>→</span></button>
      </div>
    </section>`);

  const nav = document.querySelector('.nav-inner');
  if (nav) nav.insertAdjacentHTML('beforeend', '<button class="cart-trigger" aria-label="Open shopping bag">Bag <span>0</span></button>');
  const drawer = document.querySelector('.cart-drawer');
  const backdrop = document.querySelector('.cart-backdrop');
  const itemContainer = document.querySelector('.cart-items');
  const totalElement = document.querySelector('.cart-total strong');
  const cartCount = document.querySelector('.cart-trigger span');
  const checkoutButton = document.querySelector('.checkout-btn');
  const quickView = document.querySelector('.quick-view');
  const quickViewBackdrop = document.querySelector('.quick-view-backdrop');
  let activeProduct = null;

  const save = () => localStorage.setItem('zelle-cart', JSON.stringify(cart));
  const openCart = () => { drawer.classList.add('open'); backdrop.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.classList.add('cart-open'); };
  const closeCart = () => { drawer.classList.remove('open'); backdrop.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('cart-open'); };
  const renderCart = () => {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartCount.textContent = count;
    totalElement.textContent = currency.format(total);
    checkoutButton.disabled = !cart.length;
    itemContainer.innerHTML = cart.length ? cart.map((item, index) => `
      <article class="cart-item">
        <img src="${item.image}" alt="" />
        <div><span>${item.category}</span><h3>${item.name}</h3><p>${item.option}</p><div class="quantity"><button data-action="minus" data-index="${index}" aria-label="Decrease quantity">−</button><b>${item.quantity}</b><button data-action="plus" data-index="${index}" aria-label="Increase quantity">+</button></div></div>
        <div><strong>${currency.format(item.price * item.quantity)}</strong><button class="remove-item" data-action="remove" data-index="${index}">Remove</button></div>
      </article>`).join('') : '<div class="empty-cart"><span>0</span><h3>Your bag is empty</h3><p>Explore the collection to find your signature texture.</p><a href="store.html">Shop the collection →</a></div>';
    save();
  };
  const addProduct = (item) => {
    const existing = cart.find((entry) => entry.name === item.name && entry.option === item.option);
    if (existing) existing.quantity += 1; else cart.push({ ...item, quantity: 1 });
    renderCart();
    openCart();
  };
  const closeQuickView = () => {
    quickView.classList.remove('open');
    quickViewBackdrop.classList.remove('open');
    quickView.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('quick-view-open');
    activeProduct = null;
  };
  const openQuickView = (card) => {
    activeProduct = card;
    const image = card.querySelector('img');
    const select = card.querySelector('.product-option select');
    quickView.querySelector('img').src = image.src;
    quickView.querySelector('img').alt = image.alt;
    quickView.querySelector('.quick-view-category').textContent = card.querySelector('.cat').textContent;
    quickView.querySelector('h2').textContent = card.querySelector('.product-info h3').textContent;
    quickView.querySelector('.quick-view-rating').innerHTML = card.querySelector('.rating').innerHTML;
    quickView.querySelector('.quick-view-description').textContent = `A refined ${card.querySelector('.cat').textContent.toLowerCase()} selected for natural movement, consistent density and a seamless finish.`;
    quickView.querySelector('.quick-view-price').innerHTML = card.querySelector('.price').innerHTML;
    quickView.querySelector('select').innerHTML = select.innerHTML;
    quickView.classList.add('open');
    quickViewBackdrop.classList.add('open');
    quickView.setAttribute('aria-hidden', 'false');
    document.body.classList.add('quick-view-open');
    quickView.querySelector('.quick-view-close').focus();
  };

  cards.forEach((card) => {
    const info = card.querySelector('.product-info');
    const category = card.dataset.cat;
    const options = category === 'frontals' ? ['As shown', '20 inch', '22 inch'] : ['As shown', '20 inch', '22 inch', '24 inch', '26 inch'];
    info.insertAdjacentHTML('beforeend', `<label class="product-option"><span>Select length</span><select>${options.map((option, index) => `<option value="${option}" data-extra="${index * 15}">${option}${index ? ` (+£${index * 15})` : ''}</option>`).join('')}</select></label>`);
    card.querySelector('.product-media').insertAdjacentHTML('beforeend', '<button class="quick-view-trigger">Quick view <span>↗</span></button>');
    const productData = (select) => {
      const option = select.options[select.selectedIndex];
      const basePrice = Number(card.querySelector('.price').childNodes[0].textContent.replace(/[^0-9.]/g, ''));
      return { name: card.querySelector('.product-info h3').textContent.trim(), category: card.querySelector('.cat').textContent, option: option.value, price: basePrice + Number(option.dataset.extra), image: card.querySelector('img').src };
    };
    card.querySelector('.add-cart').addEventListener('click', (event) => {
      event.stopPropagation();
      addProduct(productData(card.querySelector('.product-option select')));
    });
    card.querySelector('.quick-view-trigger').addEventListener('click', (event) => { event.stopPropagation(); openQuickView(card); });
    card.querySelector('.product-media img').addEventListener('click', () => openQuickView(card));
  });

  quickView.querySelector('.quick-view-close').addEventListener('click', closeQuickView);
  quickViewBackdrop.addEventListener('click', closeQuickView);
  quickView.querySelector('.quick-view-add').addEventListener('click', () => {
    if (!activeProduct) return;
    const select = quickView.querySelector('select');
    const option = select.options[select.selectedIndex];
    const basePrice = Number(activeProduct.querySelector('.price').childNodes[0].textContent.replace(/[^0-9.]/g, ''));
    addProduct({ name: activeProduct.querySelector('.product-info h3').textContent.trim(), category: activeProduct.querySelector('.cat').textContent, option: option.value, price: basePrice + Number(option.dataset.extra), image: activeProduct.querySelector('img').src });
    closeQuickView();
  });
  document.querySelector('.cart-trigger')?.addEventListener('click', openCart);
  document.querySelector('.cart-close')?.addEventListener('click', closeCart);
  backdrop.addEventListener('click', closeCart);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeCart();
    closeQuickView();
  });
  itemContainer.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const index = Number(button.dataset.index);
    if (button.dataset.action === 'plus') cart[index].quantity += 1;
    if (button.dataset.action === 'minus') cart[index].quantity = Math.max(1, cart[index].quantity - 1);
    if (button.dataset.action === 'remove') cart.splice(index, 1);
    renderCart();
  });

  checkoutButton.addEventListener('click', async () => {
    const note = document.querySelector('.checkout-note');
    checkoutButton.disabled = true;
    checkoutButton.firstChild.textContent = 'Preparing checkout ';
    note.textContent = '';
    try {
      const response = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (error) {
      note.textContent = error.message || 'Checkout is temporarily unavailable.';
      checkoutButton.disabled = false;
      checkoutButton.firstChild.textContent = 'Secure checkout ';
    }
  });
  renderCart();

  const newsletter = document.querySelector('.newsletter-form');
  if (newsletter) newsletter.addEventListener('submit', (event) => {
    event.preventDefault();
    if (newsletter.querySelector('input').value) newsletter.innerHTML = '<p class="newsletter-success">Welcome to the house of ZELLE.</p>';
  });

  const contactForm = document.querySelector('.glass-form form');
  if (contactForm) contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    contactForm.querySelector('.form-note').textContent = 'Thank you — our concierge will reply within 24 hours.';
    contactForm.reset();
  });
})();
