// ==========================================================
// server.js
// Entry point for the Harish Silk & Sarees backend.
// Sets up Express and mounts the product and order API routes.
// Database access goes through Supabase (see config/supabaseClient.js) —
// there is no separate "connect to DB" step needed like MongoDB had,
// since Supabase is accessed over its REST API per-request.
// ==========================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Importing this here makes the app fail fast at startup if
// SUPABASE_URL / SUPABASE_ANON_KEY are missing from .env
require('./config/supabaseClient');

const app = express();

// ---------- Middleware ----------
app.use(cors());          // allow the frontend (different origin/port) to call this API
app.use(express.json());  // parse incoming JSON request bodies

// ---------- Routes ----------
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Simple health-check route to confirm the server is running
app.get('/', (req, res) => {
  res.send('Harish Silk & Sarees API is running (Supabase backend).');
});

// ---------- Start server ----------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
