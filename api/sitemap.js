import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get current date in ISO format
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Fetch blogs with updated_at
    const { data: blogs } = await supabase
      .from('blogs')
      .select('slug, updated_at');
    
    // Fetch products with updated_at
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at');

    const STATIC_URLS = [
      { url: 'https://durablefastener.com/', priority: '1.0' },
      { url: 'https://durablefastener.com/products', priority: '0.9' },
      { url: 'https://durablefastener.com/products/fasteners-segment', priority: '0.8' },
      { url: 'https://durablefastener.com/products/fittings', priority: '0.8' },
      { url: 'https://durablefastener.com/manufacturing', priority: '0.8' },
      { url: 'https://durablefastener.com/about', priority: '0.7' },
      { url: 'https://durablefastener.com/blog', priority: '0.8' },
      { url: 'https://durablefastener.com/oem-platform', priority: '0.7' },
      { url: 'https://durablefastener.com/careers', priority: '0.6' },
      { url: 'https://durablefastener.com/contact', priority: '0.7' }
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Static URLs with lastmod
    STATIC_URLS.forEach(({ url, priority }) => {
      sitemap += `<url>
        <loc>${url}</loc>
        <lastmod>${currentDate}</lastmod>
        <priority>${priority}</priority>
      </url>`;
    });

    // Blogs URLs with their updated_at dates
    blogs?.forEach(blog => {
      const lastmod = blog.updated_at 
        ? new Date(blog.updated_at).toISOString().split('T')[0]
        : currentDate;
      
      sitemap += `<url>
        <loc>https://durablefastener.com/blog/${blog.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <priority>0.7</priority>
      </url>`;
    });

    // Products URLs with their updated_at dates
    products?.forEach(product => {
      const lastmod = product.updated_at 
        ? new Date(product.updated_at).toISOString().split('T')[0]
        : currentDate;
      
      sitemap += `<url>
        <loc>https://durablefastener.com/product/${product.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <priority>0.9</priority>
      </url>`;
    });

    sitemap += `</urlset>`;

    // XML Headers set karein
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 's-maxage=0, stale-while-revalidate');
    res.write(sitemap);
    res.end();

  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send("Error generating sitemap");
  }
}
