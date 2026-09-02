/* =========================================================
   HARISH SILK & SAREES — CART.JS
   Runs only on cart.html.
   Reads/writes the shared cart in localStorage (see main.js),
   renders the Amazon/Flipkart-style cart table, and hands the
   selected items off to billing.html via localStorage.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const cartBody = document.getElementById('cartBody');
  if (!cartBody) return; // Not on the cart page — nothing to do

  const cartTableWrap = document.getElementById('cartTableWrap');
  const emptyCartState = document.getElementById('emptyCartState');
  const cartSummaryCard = document.getElementById('cartSummaryCard');

  const subtotalEl = document.getElementById('cartSubtotal');
  const gstEl = document.getElementById('cartGst');
  const grandTotalEl = document.getElementById('cartGrandTotal');
  const itemCountEl = document.getElementById('cartItemCount');

  const GST_RATE = 0.05; // 5%

  /* -----------------------------------------------------
     RENDER THE CART TABLE
  ----------------------------------------------------- */
  function renderCart() {
    const items = getCartDetails(); // from main.js

    if (items.length === 0) {
      cartTableWrap.style.display = 'none';
      cartSummaryCard.style.display = 'none';
      emptyCartState.style.display = 'block';
      return;
    }

    cartTableWrap.style.display = 'block';
    cartSummaryCard.style.display = 'block';
    emptyCartState.style.display = 'none';

    cartBody.innerHTML = items.map(item => `
      <tr data-id="${item.id}">
        <td>
          <div class="cart-product-cell">
            <img src="${item.image}" alt="${item.name}">
            <div>
              <div class="cart-product-name">${item.name}</div>
              <div class="cart-product-cat">${item.category}</div>
            </div>
          </div>
        </td>
        <td class="cart-price">${formatINRWhole(item.price)}</td>
        <td>
          <div class="qty-control">
            <button type="button" class="qty-minus" aria-label="Decrease quantity">&minus;</button>
            <input type="number" class="qty-input" min="1" value="${item.qty}" aria-label="Quantity">
            <button type="button" class="qty-plus" aria-label="Increase quantity">+</button>
          </div>
        </td>
        <td class="cart-total">${formatINRWhole(item.total)}</td>
        <td><button type="button" class="remove-btn" title="Remove item">&#10005;</button></td>
      </tr>
    `).join('');

    wireRowControls();
    recalcTotals(items);
  }

  /* -----------------------------------------------------
     WIRE QTY +/- , QTY INPUT, AND REMOVE BUTTONS
  ----------------------------------------------------- */
  function wireRowControls() {
    cartBody.querySelectorAll('tr').forEach(row => {
      const id = row.dataset.id;
      const qtyInput = row.querySelector('.qty-input');

      row.querySelector('.qty-minus').addEventListener('click', () => {
        const newQty = Math.max(1, Number(qtyInput.value) - 1);
        updateQty(id, newQty);
      });
      row.querySelector('.qty-plus').addEventListener('click', () => {
        const newQty = Number(qtyInput.value) + 1;
        updateQty(id, newQty);
      });
      qtyInput.addEventListener('change', () => {
        const newQty = Math.max(1, Number(qtyInput.value) || 1);
        updateQty(id, newQty);
      });
      row.querySelector('.remove-btn').addEventListener('click', () => {
        removeItem(id);
      });
    });
  }

  function updateQty(id, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) {
      item.qty = qty;
      saveCart(cart);
      renderCart();
    }
  }

  function removeItem(id) {
    const cart = getCart().filter(i => i.id !== id);
    saveCart(cart);
    renderCart();
    showToast('Item removed from cart');
  }

  /* -----------------------------------------------------
     TOTALS
  ----------------------------------------------------- */
  function recalcTotals(items) {
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const gst = subtotal * GST_RATE;
    const grandTotal = subtotal + gst;

    subtotalEl.textContent = formatINR(subtotal);
    gstEl.textContent = formatINR(gst);
    grandTotalEl.textContent = formatINR(grandTotal);
    itemCountEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
  }

  /* -----------------------------------------------------
     PROCEED TO BILLING
     Freezes a snapshot of the current cart into
     'harishBillingItems' so billing.html has a stable
     copy to invoice, then navigates there.
  ----------------------------------------------------- */
  const proceedBtn = document.getElementById('proceedToBillingBtn');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      const items = getCartDetails();
      if (items.length === 0) {
        showToast('Your cart is empty — add a product first');
        return;
      }
      localStorage.setItem('harishBillingItems', JSON.stringify(items));
      window.location.href = 'billing.html';
    });
  }

  renderCart();
});
