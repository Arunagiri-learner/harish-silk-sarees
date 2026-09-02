/* =========================================================
   HARISH SILK & SAREES — BILLING.JS
   Runs only on billing.html.
   Reads the items handed off from cart.html (localStorage),
   builds the invoice, calculates GST, and drives Generate /
   Print / Save / Back-to-cart actions. No backend involved.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const invoiceBody = document.getElementById('invoiceBody');
  if (!invoiceBody) return; // Not on the billing page

  const GST_RATE = 0.05; // 5%

  /* -----------------------------------------------------
     1. LOAD BILLING ITEMS
     Prefer the frozen snapshot saved by cart.js when the
     shopper clicked "Proceed to Billing". Fall back to
     whatever is currently in the live cart, so billing.html
     also works if someone lands here directly.
  ----------------------------------------------------- */
  function loadBillingItems() {
    const snapshot = localStorage.getItem('harishBillingItems');
    if (snapshot) {
      try { return JSON.parse(snapshot); } catch (e) { /* fall through */ }
    }
    return getCartDetails(); // from main.js, reads the live cart
  }

  let billItems = loadBillingItems();

  /* -----------------------------------------------------
     2. INVOICE NUMBER + DATE (auto-generated)
  ----------------------------------------------------- */
  const invoiceNoEl = document.getElementById('invoiceNo');
  const invoiceDateEl = document.getElementById('invoiceDate');

  function generateInvoiceNumber() {
    const stored = Number(localStorage.getItem('harishInvoiceSeq') || '2000');
    const next = stored + 1;
    localStorage.setItem('harishInvoiceSeq', String(next));
    return `HSS-${next}`;
  }

  function todayFormatted() {
    return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  invoiceNoEl.value = generateInvoiceNumber();
  invoiceDateEl.value = todayFormatted();

  /* -----------------------------------------------------
     3. RENDER INVOICE TABLE + TOTALS
  ----------------------------------------------------- */
  const emptyRow = document.getElementById('emptyInvoiceRow');
  const generateBillBtn = document.getElementById('generateBillBtn');
  const printBillBtn = document.getElementById('printBillBtn');
  const saveBillBtn = document.getElementById('saveBillBtn');

  function renderInvoiceTable() {
    invoiceBody.innerHTML = '';

    if (billItems.length === 0) {
      invoiceBody.appendChild(emptyRow);
      if (generateBillBtn) generateBillBtn.disabled = true;
      if (printBillBtn) printBillBtn.disabled = true;
      if (saveBillBtn) saveBillBtn.disabled = true;
      return;
    }

    if (generateBillBtn) generateBillBtn.disabled = false;
    if (printBillBtn) printBillBtn.disabled = false;
    if (saveBillBtn) saveBillBtn.disabled = false;

    billItems.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>${formatINRWhole(item.price)}</td>
        <td>${formatINRWhole(item.qty * item.price)}</td>
      `;
      invoiceBody.appendChild(row);
    });
  }

  function recalcTotals() {
    const subtotal = billItems.reduce((sum, i) => sum + (i.qty * i.price), 0);
    const gst = subtotal * GST_RATE;
    const grandTotal = subtotal + gst;

    document.getElementById('subtotalVal').textContent = formatINR(subtotal);
    document.getElementById('gstVal').textContent = formatINR(gst);
    document.getElementById('grandTotalVal').textContent = formatINR(grandTotal);

    return { subtotal, gst, grandTotal };
  }

  /* -----------------------------------------------------
     4. PAYMENT MODE SELECTOR
  ----------------------------------------------------- */
  let selectedPaymentMode = 'Cash';
  const pmButtons = document.querySelectorAll('.pm-btn');
  pmButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pmButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPaymentMode = btn.dataset.mode;
    });
  });

  /* -----------------------------------------------------
     5. NOTES / VALIDATION MESSAGES
  ----------------------------------------------------- */
  const posNote = document.getElementById('posNote');
  function setNote(message, isError = false) {
    posNote.textContent = message;
    posNote.classList.toggle('error', isError);
  }

  const thankYouBox = document.getElementById('thankYouBox');

  /* -----------------------------------------------------
     6. GENERATE BILL
  ----------------------------------------------------- */
  function generateBill() {
    const custName = document.getElementById('custName').value.trim();
    const custPhone = document.getElementById('custPhone').value.trim();
    const custAddress = document.getElementById('custAddress').value.trim();

    if (billItems.length === 0) {
      setNote('Your cart is empty. Add products before billing.', true);
      return null;
    }
    if (!custName) { setNote('Please enter the customer name.', true); return null; }
    if (!custPhone || custPhone.length < 10) { setNote('Please enter a valid 10-digit phone number.', true); return null; }
    if (!custAddress) { setNote('Please enter the customer address.', true); return null; }

    const totals = recalcTotals();

    // Populate the hidden printable receipt
    document.getElementById('printInvoiceNo').textContent = `Invoice: ${invoiceNoEl.value}`;
    document.getElementById('printDate').textContent = `Date: ${invoiceDateEl.value}`;
    document.getElementById('printCustName').textContent = `Customer: ${custName}`;
    document.getElementById('printCustPhone').textContent = `Phone: ${custPhone}`;
    document.getElementById('printCustAddress').textContent = `Address: ${custAddress}`;

    const printBody = document.getElementById('printTableBody');
    printBody.innerHTML = '';
    billItems.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>${formatINRWhole(item.price)}</td>
        <td>${formatINRWhole(item.qty * item.price)}</td>
      `;
      printBody.appendChild(tr);
    });

    document.getElementById('printSubtotal').textContent = formatINR(totals.subtotal);
    document.getElementById('printGst').textContent = formatINR(totals.gst);
    document.getElementById('printGrandTotal').textContent = formatINR(totals.grandTotal);
    document.getElementById('printPaymentMode').textContent = selectedPaymentMode;

    setNote(`Bill ${invoiceNoEl.value} generated successfully.`, false);
    thankYouBox.classList.add('show');
    thankYouBox.querySelector('.ty-message').textContent =
      `Thank you, ${custName}! Your invoice ${invoiceNoEl.value} for ${formatINR(totals.grandTotal)} has been generated.`;

    showToast('Bill generated — you can now print or save it.');
    return { custName, custPhone, custAddress, totals };
  }

  generateBillBtn.addEventListener('click', generateBill);

  /* -----------------------------------------------------
     7. PRINT BILL
  ----------------------------------------------------- */
  printBillBtn.addEventListener('click', () => {
    const result = generateBill();
    if (!result) return;
    window.print();
  });

  /* -----------------------------------------------------
     8. SAVE BILL (UI only — no backend/server)
     Keeps a lightweight local record so the action feels
     real, but this is purely client-side for demo purposes.
  ----------------------------------------------------- */
  saveBillBtn.addEventListener('click', () => {
    const result = generateBill();
    if (!result) return;

    try {
      const saved = JSON.parse(localStorage.getItem('harishSavedBills')) || [];
      saved.push({
        invoiceNo: invoiceNoEl.value,
        date: invoiceDateEl.value,
        customer: result.custName,
        grandTotal: result.totals.grandTotal
      });
      localStorage.setItem('harishSavedBills', JSON.stringify(saved));
    } catch (e) { /* storage unavailable — ignore, this is UI-only */ }

    showToast(`Bill ${invoiceNoEl.value} saved locally.`);
  });

  /* -----------------------------------------------------
     9. INITIAL RENDER
  ----------------------------------------------------- */
  renderInvoiceTable();
  recalcTotals();

  if (billItems.length === 0) {
    setNote('Your cart is empty — go back and add some products first.', true);
  }
});
