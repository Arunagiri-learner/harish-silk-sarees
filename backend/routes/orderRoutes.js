// ==========================================================
// routes/orderRoutes.js
// Endpoints for creating and viewing orders (invoices).
// Backed by two Supabase tables: "orders" and "order_items"
// (order_items has a foreign key order_id -> orders.id).
// ==========================================================

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// @route   GET /api/orders
// @desc    Get all orders, each with its line items attached
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
  res.json(data);
});

// @route   GET /api/orders/:id
// @desc    Get a single order by ID, with its line items attached
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', req.params.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
  res.json(data);
});

// @route   POST /api/orders
// @desc    Create a new order (used by the billing page) along
//          with its line items. Written as two steps since
//          Supabase's free REST API doesn't do multi-table
//          transactions the way Mongoose sessions did — if the
//          items insert fails, we roll back by deleting the order.
router.post('/', async (req, res) => {
  const {
    orderNumber,
    customerName,
    phone,
    address,
    items,       // expected: [{ productId, name, price, qty }, ...]
    subtotal,
    gst,
    grandTotal,
    paymentMethod
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item' });
  }

  // Step 1: insert the order row
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      order_number: orderNumber,
      customer_name: customerName,
      phone,
      address,
      subtotal,
      gst,
      grand_total: grandTotal,
      payment_method: paymentMethod
    }])
    .select()
    .single();

  if (orderError) {
    return res.status(400).json({ message: 'Failed to create order', error: orderError.message });
  }

  // Step 2: insert the order_items rows, linked via order_id
  const itemRows = items.map(item => ({
    order_id: order.id,
    product_id: item.productId || null,
    product_name: item.name,
    price: item.price,
    quantity: item.qty,
    total: item.price * item.qty
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(itemRows)
    .select();

  if (itemsError) {
    // Roll back the order we just created so we don't leave an
    // order with no items behind
    await supabase.from('orders').delete().eq('id', order.id);
    return res.status(400).json({ message: 'Failed to create order items', error: itemsError.message });
  }

  res.status(201).json({ ...order, order_items: insertedItems });
});

module.exports = router;
