/* =========================================================
   HARISH SILK & SAREES — BILLING.JS
   Handles:
   - Invoice generation
   - GST calculation
   - Print Bill
   - Save Bill as PDF
   - Payment method
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const invoiceBody = document.getElementById('invoiceBody');

  if (!invoiceBody) return;

  const GST_RATE = 0.05;

  /* =======================================================
     1. LOAD BILLING ITEMS
  ======================================================= */

  function loadBillingItems() {

    const snapshot =
      localStorage.getItem('harishBillingItems');

    if (snapshot) {
      try {
        const items = JSON.parse(snapshot);

        if (Array.isArray(items)) {
          return items;
        }
      } catch (error) {
        console.error(
          'Billing items could not be loaded:',
          error
        );
      }
    }

    if (typeof getCartDetails === 'function') {
      return getCartDetails();
    }

    return [];
  }

  let billItems = loadBillingItems();


  /* =======================================================
     2. ELEMENTS
  ======================================================= */

  const invoiceNoEl =
    document.getElementById('invoiceNo');

  const invoiceDateEl =
    document.getElementById('invoiceDate');

  const generateBillBtn =
    document.getElementById('generateBillBtn');

  const printBillBtn =
    document.getElementById('printBillBtn');

  const saveBillBtn =
    document.getElementById('saveBillBtn');

  const emptyRow =
    document.getElementById('emptyInvoiceRow');

  const posNote =
    document.getElementById('posNote');

  const thankYouBox =
    document.getElementById('thankYouBox');


  /* =======================================================
     3. INVOICE NUMBER
  ======================================================= */

  function generateInvoiceNumber() {

    const stored =
      Number(
        localStorage.getItem('harishInvoiceSeq') || '2000'
      );

    const next = stored + 1;

    localStorage.setItem(
      'harishInvoiceSeq',
      String(next)
    );

    return `HSS-${next}`;
  }


  function todayFormatted() {

    return new Date().toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
  }


  invoiceNoEl.value =
    generateInvoiceNumber();

  invoiceDateEl.value =
    todayFormatted();


  /* =======================================================
     4. FORMAT MONEY
  ======================================================= */

  function formatINR(amount) {

    return `₹${Number(amount).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )}`;
  }


  function formatINRWhole(amount) {

    return `₹${Number(amount).toLocaleString(
      'en-IN'
    )}`;
  }


  /* =======================================================
     5. TOAST
  ======================================================= */

  function showMessage(message, isError = false) {

    if (!posNote) return;

    posNote.textContent = message;

    posNote.classList.toggle(
      'error',
      isError
    );
  }


  /* =======================================================
     6. PAYMENT METHOD
  ======================================================= */

  let selectedPaymentMode = 'Cash';

  const paymentButtons =
    document.querySelectorAll('.pm-btn');

  paymentButtons.forEach(button => {

    button.addEventListener(
      'click',
      () => {

        paymentButtons.forEach(btn => {
          btn.classList.remove('active');
        });

        button.classList.add('active');

        selectedPaymentMode =
          button.dataset.mode || 'Cash';
      }
    );

  });


  /* =======================================================
     7. RENDER PRODUCTS
  ======================================================= */

  function renderInvoiceTable() {

    invoiceBody.innerHTML = '';

    if (!billItems.length) {

      if (emptyRow) {
        invoiceBody.appendChild(emptyRow);
      }

      if (generateBillBtn)
        generateBillBtn.disabled = true;

      if (printBillBtn)
        printBillBtn.disabled = true;

      if (saveBillBtn)
        saveBillBtn.disabled = true;

      return;
    }


    if (generateBillBtn)
      generateBillBtn.disabled = false;

    if (printBillBtn)
      printBillBtn.disabled = false;

    if (saveBillBtn)
      saveBillBtn.disabled = false;


    billItems.forEach(item => {

      const row =
        document.createElement('tr');

      row.innerHTML = `
        <td>${escapeHtml(item.name)}</td>

        <td>${Number(item.qty)}</td>

        <td>
          ${formatINRWhole(item.price)}
        </td>

        <td>
          ${formatINRWhole(
            Number(item.qty) *
            Number(item.price)
          )}
        </td>
      `;

      invoiceBody.appendChild(row);
    });
  }


  /* =======================================================
     8. CALCULATE TOTALS
  ======================================================= */

  function calculateTotals() {

    const subtotal =
      billItems.reduce(
        (total, item) => {

          return total +
            Number(item.qty) *
            Number(item.price);

        },
        0
      );


    const gst =
      subtotal * GST_RATE;


    const grandTotal =
      subtotal + gst;


    document.getElementById(
      'subtotalVal'
    ).textContent =
      formatINR(subtotal);


    document.getElementById(
      'gstVal'
    ).textContent =
      formatINR(gst);


    document.getElementById(
      'grandTotalVal'
    ).textContent =
      formatINR(grandTotal);


    return {
      subtotal,
      gst,
      grandTotal
    };
  }


  /* =======================================================
     9. VALIDATE CUSTOMER
  ======================================================= */

  function getCustomerDetails() {

    const nameInput =
      document.getElementById('custName');

    const phoneInput =
      document.getElementById('custPhone');

    const addressInput =
      document.getElementById('custAddress');


    const name =
      nameInput.value.trim();

    const phone =
      phoneInput.value.trim();

    const address =
      addressInput.value.trim();


    if (!billItems.length) {

      showMessage(
        'Your cart is empty. Add products before billing.',
        true
      );

      return null;
    }


    if (!name) {

      showMessage(
        'Please enter the customer name.',
        true
      );

      nameInput.focus();

      return null;
    }


    const phoneDigits =
      phone.replace(/\D/g, '');


    if (phoneDigits.length !== 10) {

      showMessage(
        'Please enter a valid 10-digit phone number.',
        true
      );

      phoneInput.focus();

      return null;
    }


    if (!address) {

      showMessage(
        'Please enter the customer address.',
        true
      );

      addressInput.focus();

      return null;
    }


    return {
      name,
      phone,
      address
    };
  }


  /* =======================================================
     10. PREPARE PRINT INVOICE
  ======================================================= */

  function preparePrintInvoice(
    customer,
    totals
  ) {

    const setText = (
      id,
      value
    ) => {

      const element =
        document.getElementById(id);

      if (element) {
        element.textContent = value;
      }
    };


    setText(
      'printInvoiceNo',
      `Invoice: ${invoiceNoEl.value}`
    );


    setText(
      'printDate',
      `Date: ${invoiceDateEl.value}`
    );


    setText(
      'printCustName',
      `Customer: ${customer.name}`
    );


    setText(
      'printCustPhone',
      `Phone: ${customer.phone}`
    );


    setText(
      'printCustAddress',
      `Address: ${customer.address}`
    );


    const printBody =
      document.getElementById(
        'printTableBody'
      );


    if (printBody) {

      printBody.innerHTML = '';


      billItems.forEach(item => {

        const row =
          document.createElement('tr');


        row.innerHTML = `
          <td>${escapeHtml(item.name)}</td>

          <td>${Number(item.qty)}</td>

          <td>
            ${formatINRWhole(item.price)}
          </td>

          <td>
            ${formatINRWhole(
              Number(item.qty) *
              Number(item.price)
            )}
          </td>
        `;


        printBody.appendChild(row);
      });
    }


    setText(
      'printSubtotal',
      formatINR(totals.subtotal)
    );


    setText(
      'printGst',
      formatINR(totals.gst)
    );


    setText(
      'printGrandTotal',
      formatINR(totals.grandTotal)
    );


    setText(
      'printPaymentMode',
      selectedPaymentMode
    );
  }


  /* =======================================================
     11. GENERATE BILL
  ======================================================= */

  function generateBill() {

    const customer =
      getCustomerDetails();


    if (!customer) {
      return null;
    }


    const totals =
      calculateTotals();


    preparePrintInvoice(
      customer,
      totals
    );


    showMessage(
      `Bill ${invoiceNoEl.value} generated successfully.`,
      false
    );


    if (thankYouBox) {

      thankYouBox.classList.add('show');


      const message =
        thankYouBox.querySelector(
          '.ty-message'
        );


      if (message) {

        message.textContent =
          `Thank you, ${customer.name}! ` +
          `Your invoice ${invoiceNoEl.value} ` +
          `for ${formatINR(
            totals.grandTotal
          )} has been generated.`;
      }
    }


    if (typeof window.showToast === 'function') {

      window.showToast(
        'Bill generated successfully.'
      );
    }


    return {
      customer,
      totals
    };
  }


  /* =======================================================
     12. GENERATE BUTTON
  ======================================================= */

  if (generateBillBtn) {

    generateBillBtn.addEventListener(
      'click',
      () => {

        generateBill();

      }
    );
  }


  /* =======================================================
     13. PRINT BUTTON
  ======================================================= */

  if (printBillBtn) {

    printBillBtn.addEventListener(
      'click',
      () => {

        const result =
          generateBill();


        if (!result) {
          return;
        }


        setTimeout(
          () => {
            window.print();
          },
          150
        );

      }
    );
  }


  /* =======================================================
     14. LOAD jsPDF
  ======================================================= */

  function loadJsPDF() {

    if (
      window.jspdf &&
      window.jspdf.jsPDF
    ) {

      return Promise.resolve(
        window.jspdf.jsPDF
      );
    }


    return new Promise(
      (resolve, reject) => {

        const script =
          document.createElement('script');


        script.src =
          'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';


        script.onload = () => {

          if (
            window.jspdf &&
            window.jspdf.jsPDF
          ) {

            resolve(
              window.jspdf.jsPDF
            );

          } else {

            reject(
              new Error(
                'PDF library was not loaded.'
              )
            );
          }
        };


        script.onerror = () => {

          reject(
            new Error(
              'Could not load PDF library.'
            )
          );
        };


        document.head.appendChild(
          script
        );
      }
    );
  }


  /* =======================================================
     15. CREATE PDF
  ======================================================= */

  async function createPDF(
    result
  ) {

    const jsPDF =
      await loadJsPDF();


    const pdf =
      new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });


    const pageWidth =
      pdf.internal.pageSize.getWidth();


    const pageHeight =
      pdf.internal.pageSize.getHeight();


    /* ---------------------------------------------------
       HEADER
    --------------------------------------------------- */

    pdf.setFillColor(
      118,
      28,
      46
    );


    pdf.rect(
      0,
      0,
      pageWidth,
      30,
      'F'
    );


    pdf.setTextColor(
      255,
      255,
      255
    );


    pdf.setFont(
      'helvetica',
      'bold'
    );


    pdf.setFontSize(18);


    pdf.text(
      'HARISH SILK & SAREES',
      15,
      14
    );


    pdf.setFont(
      'helvetica',
      'normal'
    );


    pdf.setFontSize(9);


    pdf.text(
      'TRADITION MEETS ELEGANCE',
      15,
      21
    );


    pdf.setFont(
      'helvetica',
      'bold'
    );


    pdf.setFontSize(15);


    pdf.text(
      'INVOICE',
      pageWidth - 15,
      17,
      {
        align: 'right'
      }
    );


    pdf.setTextColor(
      30,
      30,
      30
    );


    /* ---------------------------------------------------
       INVOICE INFO
    --------------------------------------------------- */

    let y = 42;


    pdf.setFontSize(10);


    pdf.setFont(
      'helvetica',
      'bold'
    );


    pdf.text(
      'Invoice Number:',
      15,
      y
    );


    pdf.setFont(
      'helvetica',
      'normal'
    );


    pdf.text(
      invoiceNoEl.value,
      48,
      y
    );


    pdf.setFont(
      'helvetica',
      'bold'
    );


    pdf.text(
      'Date:',
      125,
      y
    );


    pdf.setFont(
      'helvetica',
      'normal'
    );


    pdf.text(
      invoiceDateEl.value,
      140,
      y
    );


    /* ---------------------------------------------------
       CUSTOMER
    --------------------------------------------------- */

    y += 12;


    pdf.setFillColor(
      248,
      243,
      234
    );


    pdf.roundedRect(
      15,
      y - 6,
      180,
      35,
      2,
      2,
      'F'
    );


    pdf.setFont(
      'helvetica',
      'bold'
    );


    pdf.setFontSize(11);


    pdf.text(
      'CUSTOMER DETAILS',
      20,
      y
    );


    y += 7;


    pdf.setFontSize(9);


    pdf.text(
      `Name: ${result.customer.name}`,
      20,
      y
    );


    pdf.text(
      `Phone: ${result.customer.phone}`,
      110,
      y
    );


    y += 7;


    pdf.setFont(
      'helvetica',
      'bold'
    );


    pdf.text(
      'Address:',
      20,
      y
    );


    pdf.setFont(
      'helvetica',
      'normal'
    );


    const addressLines =
      pdf.splitTextToSize(
        result.customer.address,
        150
      );


    pdf.text(
      addressLines,
      38,
      y
    );


    y +=
      Math.max(
        7,
        addressLines.length * 4.5
      ) + 12;


    /* ---------------------------------------------------
       PRODUCTS
    --------------------------------------------------- */

    pdf.setFont(
      'helvetica',
      'bold'
    );


    pdf.setFontSize(12);


    pdf.text(
      'PRODUCT DETAILS',
      15,
      y
    );


    y += 8;


    /* Table heading */

    pdf.setFillColor(
      244,
      235,
      218
    );


    pdf.rect(
      15,
      y - 6,
      180,
      9,
      'F'
    );


    pdf.setFontSize(9);


    pdf.text(
      'PRODUCT',
      18,
      y
    );


    pdf.text(
      'QTY',
      118,
      y
    );


    pdf.text(
      'PRICE',
      137,
      y
    );


    pdf.text(
      'AMOUNT',
      169,
      y
    );


    y += 8;


    pdf.setFont(
      'helvetica',
      'normal'
    );


    billItems.forEach(
      item => {

        if (
          y >
          pageHeight - 55
        ) {

          pdf.addPage();


          pdf.setFillColor(
            118,
            28,
            46
          );


          pdf.rect(
            0,
            0,
            pageWidth,
            30,
            'F'
          );


          pdf.setTextColor(
            255,
            255,
            255
          );


          pdf.setFont(
            'helvetica',
            'bold'
          );


          pdf.setFontSize(16);


          pdf.text(
            'HARISH SILK & SAREES',
            15,
            17
          );


          pdf.setTextColor(
            30,
            30,
            30
          );


          y = 42;
        }


        const nameLines =
          pdf.splitTextToSize(
            String(item.name),
            90
          );


        pdf.setFontSize(9);


        pdf.text(
          nameLines,
          18,
          y
        );


        pdf.text(
          String(item.qty),
          120,
          y
        );


        pdf.text(
          `Rs. ${Number(item.price).toLocaleString('en-IN')}`,
          137,
          y
        );


        pdf.text(
          `Rs. ${(
            Number(item.qty) *
            Number(item.price)
          ).toLocaleString('en-IN')}`,
          169,
          y
        );


        const rowHeight =
          Math.max(
            7,
            nameLines.length * 4.5
          );


        pdf.setDrawColor(
          220,
          205,
          185
        );


        pdf.line(
          15,
          y + rowHeight,
          195,
          y + rowHeight
        );


        y +=
          rowHeight + 6;
      }
    );


    /* ---------------------------------------------------
       TOTALS
    --------------------------------------------------- */

    if (
      y >
      pageHeight - 70
    ) {

      pdf.addPage();

      y = 42;
    }


    y += 5;


    pdf.setFont(
      'helvetica',
      'normal'
    );


    pdf.setFontSize(10);


    pdf.text(
      'Subtotal',
      125,
      y
    );


    pdf.text(
      `Rs. ${result.totals.subtotal.toLocaleString(
        'en-IN',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )}`,
      195,
      y,
      {
        align: 'right'
      }
    );


    y += 7;


    pdf.text(
      'GST (5%)',
      125,
      y
    );


    pdf.text(
      `Rs. ${result.totals.gst.toLocaleString(
        'en-IN',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )}`,
      195,
      y,
      {
        align: 'right'
      }
    );


    y += 5;


    pdf.line(
      125,
      y,
      195,
      y
    );


    y += 9;


    pdf.setFont(
      'helvetica',
      'bold'
    );


    pdf.setFontSize(13);


    pdf.setTextColor(
      118,
      28,
      46
    );


    pdf.text(
      'GRAND TOTAL',
      125,
      y
    );


    pdf.text(
      `Rs. ${result.totals.grandTotal.toLocaleString(
        'en-IN',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )}`,
      195,
      y,
      {
        align: 'right'
      }
    );


    y += 10;


    pdf.setTextColor(
      30,
      30,
      30
    );


    pdf.setFont(
      'helvetica',
      'normal'
    );


    pdf.setFontSize(10);


    pdf.text(
      `Payment Method: ${selectedPaymentMode}`,
      15,
      y
    );


    /* ---------------------------------------------------
       FOOTER
    --------------------------------------------------- */

    y += 18;


    if (
      y >
      pageHeight - 25
    ) {

      pdf.addPage();

      y = 45;
    }


    pdf.setDrawColor(
      220,
      205,
      185
    );


    pdf.line(
      15,
      y,
      195,
      y
    );


    y += 8;


    pdf.setFont(
      'helvetica',
      'bold'
    );


    pdf.setFontSize(10);


    pdf.text(
      'Thank you for shopping with Harish Silk & Sarees!',
      pageWidth / 2,
      y,
      {
        align: 'center'
      }
    );


    y += 5;


    pdf.setFont(
      'helvetica',
      'normal'
    );


    pdf.setFontSize(8);


    pdf.text(
      'Tradition meets elegance.',
      pageWidth / 2,
      y,
      {
        align: 'center'
      }
    );


    /* ---------------------------------------------------
       PAGE NUMBERS
    --------------------------------------------------- */

    const totalPages =
      pdf.getNumberOfPages();


    for (
      let page = 1;
      page <= totalPages;
      page++
    ) {

      pdf.setPage(page);


      pdf.setFont(
        'helvetica',
        'normal'
      );


      pdf.setFontSize(8);


      pdf.setTextColor(
        100,
        100,
        100
      );


      pdf.text(
        `Page ${page} of ${totalPages}`,
        pageWidth - 15,
        pageHeight - 8,
        {
          align: 'right'
        }
      );
    }


    /* ---------------------------------------------------
       DOWNLOAD
    --------------------------------------------------- */

    const safeInvoice =
      invoiceNoEl.value.replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      );


    pdf.save(
      `Harish-Silk-Sarees-${safeInvoice}.pdf`
    );
  }


  /* =======================================================
     16. SAVE BILL AS PDF
  ======================================================= */

  if (saveBillBtn) {

    saveBillBtn.addEventListener(
      'click',
      async () => {

        const result =
          generateBill();


        if (!result) {
          return;
        }


        const oldText =
          saveBillBtn.textContent;


        saveBillBtn.disabled = true;

        saveBillBtn.textContent =
          'Creating PDF...';


        try {

          await createPDF(result);


          /* Save a local record too */

          try {

            const saved =
              JSON.parse(
                localStorage.getItem(
                  'harishSavedBills'
                )
              ) || [];


            saved.push({

              invoiceNo:
                invoiceNoEl.value,

              date:
                invoiceDateEl.value,

              customer:
                result.customer.name,

              phone:
                result.customer.phone,

              address:
                result.customer.address,

              paymentMode:
                selectedPaymentMode,

              subtotal:
                result.totals.subtotal,

              gst:
                result.totals.gst,

              grandTotal:
                result.totals.grandTotal,

              savedAt:
                new Date().toISOString()

            });


            localStorage.setItem(
              'harishSavedBills',
              JSON.stringify(saved)
            );

          } catch (storageError) {

            console.warn(
              'Could not save local bill record:',
              storageError
            );
          }


          showMessage(
            `Bill ${invoiceNoEl.value} downloaded as PDF.`,
            false
          );


          if (
            typeof window.showToast ===
            'function'
          ) {

            window.showToast(
              'Bill downloaded as PDF.'
            );
          }

        } catch (error) {

          console.error(
            'PDF generation error:',
            error
          );


          showMessage(
            'PDF could not be created. Please check your internet connection and try again.',
            true
          );


          if (
            typeof window.showToast ===
            'function'
          ) {

            window.showToast(
              'PDF creation failed.'
            );
          }

        } finally {

          saveBillBtn.disabled = false;

          saveBillBtn.textContent =
            oldText || 'Save Bill';
        }

      }
    );
  }


  /* =======================================================
     17. HTML ESCAPE
  ======================================================= */

  function escapeHtml(value) {

    return String(value)
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );
  }


  /* =======================================================
     18. INITIAL LOAD
  ======================================================= */

  renderInvoiceTable();

  calculateTotals();


  if (!billItems.length) {

    showMessage(
      'Your cart is empty — go back and add some products first.',
      true
    );
  }

});