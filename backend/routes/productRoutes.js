// ==========================================================
// routes/productRoutes.js
// CRUD endpoints for products, backed by the Supabase
// "products" table (Postgres) instead of MongoDB.
// ==========================================================

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// @route   GET /api/products
// @desc    Get all products
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
  res.json(data);
});

// @route   GET /api/products/:id
// @desc    Get a single product by ID
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) {
    // PGRST116 = no rows found for .single()
    if (error.code === 'PGRST116') {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
  res.json(data);
});

// @route   POST /api/products
// @desc    Create a new product
router.post('/', async (req, res) => {
  const { name, category, description, price, stock, image } = req.body;

  const { data, error } = await supabase
    .from('products')
    .insert([{ name, category, description, price, stock, image }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: 'Failed to create product', error: error.message });
  }
  res.status(201).json(data);
});

// @route   PUT /api/products/:id
// @desc    Update an existing product
router.put('/:id', async (req, res) => {
  const { name, category, description, price, stock, image } = req.body;

  const { data, error } = await supabase
    .from('products')
    .update({ name, category, description, price, stock, image })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(400).json({ message: 'Failed to update product', error: error.message });
  }
  res.json(data);
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
router.delete('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
  res.json({ message: 'Product deleted successfully', product: data });
});

module.exports = router;
