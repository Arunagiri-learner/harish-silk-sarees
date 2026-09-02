// ==========================================================
// seed.js
// One-time script to copy the products that used to be
// hardcoded in the frontend (js/main.js -> PRODUCTS array)
// into the Supabase "products" table.
//
// Safe to run more than once: it checks which product names
// already exist in the table first, and only inserts the
// ones that are missing — so it will never create duplicates.
//
// Run it from the backend folder with:
//   node seed.js
// ==========================================================

const dotenv = require('dotenv');
dotenv.config();

const supabase = require('./config/supabaseClient');

// This is the same data that was in js/main.js's PRODUCTS array,
// just renamed to match the Supabase column names:
//   desc -> description
// The "badge" field (Bestseller/New/Bridal ribbons) isn't stored
// in the database — it's a small display-only label the frontend
// no longer needs from here.
const PRODUCTS_TO_SEED = [
  { name: 'Silk Saree',     category: 'saree', price: 3999, stock: 20, image: 'images/fabrics.jpg',  description: 'Pure Kanchipuram silk with a hand-woven zari border.' },
  { name: 'Cotton Saree',   category: 'saree', price: 1499, stock: 20, image: 'images/fabrics.jpg',  description: 'Handloom cotton, breathable everyday wear.' },
  { name: 'Designer Saree', category: 'saree', price: 5499, stock: 20, image: 'images/fabrics.jpg',  description: 'Embroidered party-wear saree with matching blouse piece.' },
  { name: 'Men Shirt',      category: 'men',   price: 799,  stock: 20, image: 'images/menswear.jpg', description: 'Slim-fit formal cotton shirt.' },
  { name: 'Men Kurta',      category: 'men',   price: 1199, stock: 20, image: 'images/menswear.jpg', description: 'Festive cotton-silk kurta for men.' },
  { name: 'Men Jeans',      category: 'men',   price: 1299, stock: 20, image: 'images/menswear.jpg', description: 'Stretch-fit denim, all-day comfort.' },
  { name: 'Kurti',          category: 'women', price: 899,  stock: 20, image: 'images/fabrics.jpg',  description: 'Printed rayon kurti for everyday wear.' },
  { name: 'Lehenga',        category: 'women', price: 6499, stock: 20, image: 'images/fabrics.jpg',  description: 'Bridal lehenga with hand embroidery.' },
  { name: 'Night Wear',     category: 'women', price: 699,  stock: 20, image: 'images/fabrics.jpg',  description: 'Soft cotton nightwear set.' },
  { name: 'Kids Dress',     category: 'kids',  price: 999,  stock: 20, image: 'images/fabrics.jpg',  description: 'Frilled party dress for girls.' },
  { name: 'Kids Kurta Set', category: 'kids',  price: 899,  stock: 20, image: 'images/menswear.jpg', description: 'Ethnic kurta-pyjama set for boys.' },
  { name: 'Kids Frock',     category: 'kids',  price: 1099, stock: 20, image: 'images/showroom.jpg', description: 'Cotton frock with floral print.' }
];

async function seed() {
  console.log('Checking which products already exist in Supabase...');

  // 1. Get the names of products already in the table
  const { data: existingProducts, error: fetchError } = await supabase
    .from('products')
    .select('name');

  if (fetchError) {
    console.error('Failed to read existing products:', fetchError.message);
    process.exit(1);
  }

  const existingNames = new Set(existingProducts.map(p => p.name));

  // 2. Only keep products that aren't already in the table
  const newProducts = PRODUCTS_TO_SEED.filter(p => !existingNames.has(p.name));

  if (newProducts.length === 0) {
    console.log('All products already exist in Supabase. Nothing to insert.');
    return;
  }

  // 3. Insert the missing ones
  const { data: inserted, error: insertError } = await supabase
    .from('products')
    .insert(newProducts)
    .select();

  if (insertError) {
    console.error('Failed to insert products:', insertError.message);
    process.exit(1);
  }

  console.log(`Inserted ${inserted.length} new product(s):`);
  inserted.forEach(p => console.log(`  - ${p.name} (${p.category}) — ₹${p.price}`));

  const skipped = PRODUCTS_TO_SEED.length - newProducts.length;
  if (skipped > 0) {
    console.log(`Skipped ${skipped} product(s) that already existed.`);
  }
}

seed()
  .then(() => {
    console.log('Seeding complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error while seeding:', err);
    process.exit(1);
  });
