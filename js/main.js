/* =========================================================
   HARISH SILK & SAREES — MAIN.JS
   ========================================================= */

const API_BASE_URL = 'https://harish-silk-sarees.onrender.com/api';


/* ---------------------------------------------------------
   1. PRODUCT CATALOGUE
--------------------------------------------------------- */

const PRODUCTS = [
  {
    id: 2,
    name: 'Silk Saree',
    price: 3999,
    category: 'saree',
    image: 'images/silk-saree.jpg',
    badge: 'Bestseller',
    desc: 'Pure Kanchipuram silk with a hand-woven zari border.'
  },
  {
    id: 3,
    name: 'Cotton Saree',
    price: 1499,
    category: 'saree',
    image: 'images/cotton-saree.jpg',
    badge: '',
    desc: 'Handloom cotton, breathable everyday wear.'
  },
  {
    id: 4,
    name: 'Designer Saree',
    price: 5499,
    category: 'saree',
    image: 'images/designer-saree.jpg',
    badge: 'New',
    desc: 'Embroidered party-wear saree with matching blouse piece.'
  },
  {
    id: 5,
    name: 'Men Shirt',
    price: 799,
    category: 'men',
    image: 'images/men-shirt.jpg',
    badge: '',
    desc: 'Slim-fit formal cotton shirt.'
  },
  {
    id: 6,
    name: 'Men Kurta',
    price: 1199,
    category: 'men',
    image: 'images/men-kurta.jpg',
    badge: '',
    desc: 'Festive cotton-silk kurta for men.'
  },
  {
    id: 7,
    name: 'Men Jeans',
    price: 1299,
    category: 'men',
    image: 'images/men-jeans.jpg',
    badge: '',
    desc: 'Stretch-fit denim, all-day comfort.'
  },
  {
    id: 8,
    name: 'Kurti',
    price: 899,
    category: 'women',
    image: 'images/kurti.jpg',
    badge: '',
    desc: 'Printed rayon kurti for everyday wear.'
  },
  {
    id: 9,
    name: 'Lehenga',
    price: 6499,
    category: 'women',
    image: 'images/lehenga.jpg',
    badge: 'Bridal',
    desc: 'Bridal lehenga with hand embroidery.'
  },
  {
    id: 10,
    name: 'Night Wear',
    price: 699,
    category: 'women',
    image: 'images/night-wear.jpg',
    badge: '',
    desc: 'Soft cotton nightwear set.'
  },
  {
    id: 11,
    name: 'Kids Dress',
    price: 999,
    category: 'kids',
    image: 'images/kids-dress.jpg',
    badge: '',
    desc: 'Frilled party dress for girls.'
  },
  {
    id: 12,
    name: 'Kids Kurta Set',
    price: 899,
    category: 'kids',
    image: 'images/kids-kurta-set.jpg',
    badge: '',
    desc: 'Ethnic kurta-pyjama set for boys.'
  },
  {
    id: 13,
    name: 'Kids Frock',
    price: 1099,
    category: 'kids',
    image: 'images/kids-frock.jpg',
    badge: 'New',
    desc: 'Cotton frock with floral print.'
  }
];


/* ---------------------------------------------------------
   2. CART STORAGE HELPERS
--------------------------------------------------------- */

const CART_KEY = 'harishCart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(productId, qty = 1) {
  const cart = getCart();

  const existing = cart.find(
    item => String(item.id) === String(productId)
  );

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: productId,
      qty: qty
    });
  }

  saveCart(cart);
}

function getCartTotalQty() {
  return getCart().reduce(
    (sum, item) => sum + item.qty,
    0
  );
}

function getCartDetails() {
  const cart = getCart();

  return cart
    .map(item => {
      const product = PRODUCTS.find(
        p => String(p.id) === String(item.id)
      );

      if (!product) return null;

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        qty: item.qty,
        total: product.price * item.qty
      };
    })
    .filter(Boolean);
}


/* ---------------------------------------------------------
   3. FORMAT HELPERS
--------------------------------------------------------- */

function formatINR(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatINRWhole(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}


/* ---------------------------------------------------------
   4. TOAST NOTIFICATION
--------------------------------------------------------- */

let toastTimer;

function showToast(message) {
  const toast = document.getElementById('toast');

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(
    () => toast.classList.remove('show'),
    2400
  );
}


/* ---------------------------------------------------------
   5. PRODUCT CARD
--------------------------------------------------------- */

function buildProductCard(product) {
  const badge = product.badge
    ? `<span class="tag">${product.badge}</span>`
    : '';

  return `
    <article
      class="product-card reveal is-visible"
      data-category="${product.category}"
    >
      <div class="product-img">
        <img
          src="/${product.image}"
          alt="${product.name}"
          loading="lazy"
        >
      </div>

      ${badge}

      <span class="product-category">
        ${product.category}
      </span>

      <div class="product-body">
        <h3>${product.name}</h3>

        <p class="product-desc">
          ${product.desc}
        </p>

        <div class="product-footer">
          <span class="price">
            ${formatINRWhole(product.price)}
          </span>

          <button
            class="btn-cart"
            data-id="${product.id}"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  `;
}


/* ---------------------------------------------------------
   6. ADD TO CART BUTTONS
--------------------------------------------------------- */

function wireAddToCartButtons(
  container,
  productList = PRODUCTS
) {
  container.querySelectorAll('.btn-cart').forEach(btn => {

    btn.addEventListener('click', () => {

      const product = productList.find(
        p => String(p.id) === String(btn.dataset.id)
      );

      if (!product) return;

      addToCart(product.id, 1);

      const originalText = btn.textContent;

      btn.textContent = 'Added ✓';
      btn.classList.add('added');

      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('added');
      }, 1100);

      showToast(
        `${product.name} added to cart`
      );
    });

  });
}


/* ---------------------------------------------------------
   7. NAVIGATION
--------------------------------------------------------- */

function updateCartBadge() {
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = getCartTotalQty();
  });
}

function initNavigation() {

  const hamburger =
    document.getElementById('hamburger');

  const navLinks =
    document.getElementById('navLinks');

  if (hamburger && navLinks) {

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    navLinks
      .querySelectorAll('a')
      .forEach(link => {

        link.addEventListener('click', () => {
          hamburger.classList.remove('open');
          navLinks.classList.remove('open');
        });

      });
  }

  const currentPage =
    window.location.pathname.split('/').pop()
    || 'index.html';

  document.querySelectorAll('.nav-link')
    .forEach(link => {

      const linkPage =
        link.getAttribute('href');

      if (
        linkPage === currentPage ||
        (
          currentPage === '' &&
          linkPage === 'index.html'
        )
      ) {
        link.classList.add('active');
      }

    });

  updateCartBadge();
}


/* ---------------------------------------------------------
   8. SCROLL REVEAL
--------------------------------------------------------- */

function initScrollReveal() {

  const revealEls =
    document.querySelectorAll(
      '.reveal:not(.is-visible)'
    );

  if (!revealEls.length) return;

  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target.classList.add(
              'is-visible'
            );

            observer.unobserve(
              entry.target
            );
          }

        });

      },
      {
        threshold: 0.15
      }
    );

  revealEls.forEach(el =>
    observer.observe(el)
  );
}


/* ---------------------------------------------------------
   9. HOME PAGE
--------------------------------------------------------- */

function initHomeSections() {

  const map = [
    {
      containerId: 'featuredSarees',
      category: 'saree',
      limit: 3
    },
    {
      containerId: 'mensCollection',
      category: 'men',
      limit: 3
    },
    {
      containerId: 'womensCollection',
      category: 'women',
      limit: 3
    },
    {
      containerId: 'kidsCollection',
      category: 'kids',
      limit: 3
    }
  ];

  map.forEach(
    ({ containerId, category, limit }) => {

      const container =
        document.getElementById(
          containerId
        );

      if (!container) return;

      const items =
        PRODUCTS
          .filter(
            p => p.category === category
          )
          .slice(0, limit);

      container.innerHTML =
        items
          .map(buildProductCard)
          .join('');

      wireAddToCartButtons(
        container
      );
    }
  );
}


/* ---------------------------------------------------------
   10. PRODUCTS PAGE
--------------------------------------------------------- */

function mapApiProductToCard(row) {

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    image: row.image,
    desc: row.description || '',
    badge: ''
  };
}

function initProductsPage() {

  const grid =
    document.getElementById(
      'productGrid'
    );

  if (!grid) return;

  const filterBtns =
    document.querySelectorAll(
      '.filter-btn'
    );

  const sortSelect =
    document.getElementById(
      'sortSelect'
    );

  const resultCount =
    document.getElementById(
      'resultCount'
    );

  let allProducts = [];
  let activeFilter = 'all';

  const urlParams =
    new URLSearchParams(
      window.location.search
    );

  const urlCategory =
    urlParams.get('category');

  function render() {

    let items =
      activeFilter === 'all'
        ? [...allProducts]
        : allProducts.filter(
            p =>
              p.category === activeFilter
          );

    const sortValue =
      sortSelect
        ? sortSelect.value
        : 'default';

    if (sortValue === 'price-low') {
      items.sort(
        (a, b) => a.price - b.price
      );
    }

    if (sortValue === 'price-high') {
      items.sort(
        (a, b) => b.price - a.price
      );
    }

    if (sortValue === 'name') {
      items.sort(
        (a, b) =>
          a.name.localeCompare(b.name)
      );
    }

    grid.innerHTML = items.length
      ? items.map(buildProductCard).join('')
      : `
        <div
          class="empty-state"
          style="grid-column:1/-1;"
        >
          <div class="empty-icon">🔍</div>
          <h3>No products found</h3>
          <p>
            Try a different category,
            or add products via the API.
          </p>
        </div>
      `;

    wireAddToCartButtons(
      grid,
      items
    );

    if (resultCount) {
      resultCount.textContent =
        `${items.length} product${
          items.length !== 1 ? 's' : ''
        }`;
    }
  }

  function wireFilterAndSort() {

    filterBtns.forEach(btn => {

      if (
        btn.dataset.filter ===
        activeFilter
      ) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }

      btn.addEventListener(
        'click',
        () => {

          filterBtns.forEach(
            b =>
              b.classList.remove(
                'active'
              )
          );

          btn.classList.add(
            'active'
          );

          activeFilter =
            btn.dataset.filter;

          render();
        }
      );
    });

    if (sortSelect) {
      sortSelect.addEventListener(
        'change',
        render
      );
    }
  }

  grid.innerHTML = `
    <div
      class="empty-state"
      style="grid-column:1/-1;"
    >
      <div class="empty-icon">⏳</div>
      <h3>Loading products...</h3>
    </div>
  `;

  fetch(
    `${API_BASE_URL}/products`
  )
    .then(response => {

      if (!response.ok) {
        throw new Error(
          `Server responded with ${response.status}`
        );
      }

      return response.json();
    })

    .then(data => {

      allProducts =
        data.map(
          mapApiProductToCard
        );

      if (
        urlCategory &&
        allProducts.some(
          p =>
            p.category ===
            urlCategory
        )
      ) {
        activeFilter =
          urlCategory;
      }

      wireFilterAndSort();

      render();
    })

    .catch(error => {

      console.error(
        'Failed to load products from backend:',
        error
      );

      grid.innerHTML = `
        <div
          class="empty-state"
          style="grid-column:1/-1;"
        >
          <div class="empty-icon">
            ⚠️
          </div>

          <h3>
            Could not load products
          </h3>

          <p>
            Make sure the backend server
            is running at
            <strong>
              ${API_BASE_URL}
            </strong>,
            then refresh this page.
          </p>
        </div>
      `;
    });
}


/* ---------------------------------------------------------
   11. RUN ON EVERY PAGE LOAD
--------------------------------------------------------- */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    initNavigation();

    initHomeSections();

    initProductsPage();

    initScrollReveal();

    const yearEl =
      document.getElementById('year');

    if (yearEl) {
      yearEl.textContent =
        new Date().getFullYear();
    }

    const newsletterForm =
      document.getElementById(
        'newsletterForm'
      );

    if (newsletterForm) {

      newsletterForm.addEventListener(
        'submit',
        e => {

          e.preventDefault();

          showToast(
            'Subscribed! Watch your inbox for festive offers.'
          );

          newsletterForm.reset();
        }
      );
    }

  }
);