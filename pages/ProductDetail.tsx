// ProductDetail.tsx
import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Wrench, ArrowUpRight,
  ChevronRight, ShoppingCart, Loader2, Share2, Printer,
  Ruler, Maximize2, Info, X, FileText,
  ArrowRight, Lock, Activity, FileCheck, Layers,
  ShieldCheck, Tag, Settings,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import MagicZoomClone from '../components/MagicZoomClone';
import { Helmet } from 'react-helmet-async';

const { useParams, Link } = ReactRouterDOM;

const getMaterialData = (displayMaterial: string) => {
  if (!displayMaterial) return { ms: '-', ss: '-' };

  const materials = displayMaterial.split('|');

  let ms = null;
  let ss = null;

  materials.forEach((mat) => {
    const clean = mat.trim();

    if (clean.toLowerCase().includes('mild')) {
      ms = clean.match(/\((.*?)\)/)?.[1] || clean;
    }

    if (clean.toLowerCase().includes('stainless')) {
      ss = clean.match(/\((.*?)\)/)?.[1] || clean;
    }
  });

  return {
    ms,
    ss,
  };
};

const FINISH_TEXTURES: Record<string, string> = {
  nickel: "linear-gradient(135deg, #d9d9d9, #a6a6a6)",
  black: "#000000",
  antique: "linear-gradient(135deg, #6b4b2a, #3e2a14)",
  zinc: "linear-gradient(135deg, #e0decf, #ab9f92)",
};

const THEME = {
  bg: "bg-[#dbdbdc]",
  textPrimary: "text-neutral-900",
  textSecondary: "text-neutral-700",
  textMuted: "text-neutral-500",
  accentText: "text-yellow-700",
  border: "border-neutral-200",
};

const fontHeading = { fontFamily: '"Oswald", sans-serif', letterSpacing: '0.03em' };
const fontBody = { fontFamily: '"Roboto", sans-serif' };
const fontMono = { fontFamily: '"Roboto Mono", monospace' };

const blueprintGridStyleLight = {
  backgroundImage:
    'linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),' +
    'linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)',
  backgroundSize: '24px 24px',
};

const PERFORMANCE_KEYS_DISPLAY = [
  "Core Hardness", "Surface Hardness", "Tensile Strength",
  "Shear Strength", "Salt Spray Resistance", "Installation Speed", "Temperature Range",
];

const HIDDEN_SPECS = [
  'hardness', 'sst', 'torque', 'salt', 'box_qty', 'carton_qty',
  'standard', 'seo_keywords', 'tds_url', 'mtc_url',
  'head type', 'head_type', 'drive', 'drive type', 'drive_type', 'type',
  ...PERFORMANCE_KEYS_DISPLAY.map(s => s.toLowerCase()),
];

const containerVar = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVar: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 60, damping: 20 } },
};

// =========================================
// SMART IMAGE URL HELPER
// =========================================
const cleanImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  const R2_BASE = "https://pub-ffd0eb07a99540ac95c35c521dd8f7ae.r2.dev";
  
  // Already R2 → return as-is
  if (url.startsWith(R2_BASE)) return url;
  
  // ANY full URL (workers.dev, supabase.co, etc.)
  // → extract just the filename → redirect to R2
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const fileName = url.split('/').pop();
    return `${R2_BASE}/${fileName}`;
  }
  
  // Relative path → prepend R2
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${R2_BASE}/${cleanPath}`;
};

// ✅ Improved FAQ Schema Builder – ensures valid format for Google
const buildFaqSchema = (faqs: { question: string; answer: string }[]) => {
  if (!faqs?.length) return null;

  const validFaqs = faqs.filter(faq => faq.question?.trim() && faq.answer?.trim());
  if (validFaqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": validFaqs.map(faq => ({
      "@type": "Question",
      "name": faq.question.trim(),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer.trim()
      }
    }))
  };
};

/** BreadcrumbList schema – always valid */
const buildBreadcrumbSchema = (productName: string, slug: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://durablefastener.com" },
    { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://durablefastener.com/products" },
    { "@type": "ListItem", "position": 3, "name": productName, "item": `https://durablefastener.com/product/${slug}` },
  ],
});

/** Product schema – robust for all product types (fasteners, fittings, etc.) */
const buildProductSchema = (
  product: any,
  slug: string,
  selectedDia: string,
  selectedLen: string,
  selectedUnit: string,
) => {
  // Ensure images array exists, at least one placeholder
  let images = (product.images || []);
  if (!images.length) {
    images = ['https://via.placeholder.com/600x600?text=No+Image'];
  }
  const cleanedImages = images.map((img: string) => cleanImageUrl(img));

  // Build additionalProperty safely
  const specifications = product.specifications || [];
  const additionalProperties = specifications
    .filter((s: any) => s?.key && !HIDDEN_SPECS.includes(s.key.toLowerCase()))
    .map((s: any) => ({
      "@type": "PropertyValue",
      "name": s.key,
      "value": s.value,
    }));

  // Build size string only if both dimensions exist
  let size = undefined;
  if (selectedDia && selectedLen) {
    size = `${selectedDia} × ${selectedLen} ${selectedUnit}`;
  } else if (product.size) {
    size = product.size;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name || "Industrial Product",
    "description": product.short_description || product.description || "High-quality industrial component from Durable Fastener.",
    "image": cleanedImages,
    "sku": product.slug || slug,
    "mpn": product.slug || slug,
    "brand": { "@type": "Brand", "name": "Classone" },
    "manufacturer": {
      "@type": "Organization",
      "name": "Durable Fastener Private Limited",
      "url": "https://durablefastener.com",
    },
    "category": product.category || "Industrial Components",
    "material": product.material || "",
    ...(size ? { "size": size } : {}),
    ...(additionalProperties.length > 0 ? { "additionalProperty": additionalProperties } : {}),
    "offers": {
      "@type": "Offer",
      "url": `https://durablefastener.com/product/${slug}`,
      "priceCurrency": "INR",
      "price": "0",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "price": "0",
        "priceCurrency": "INR",
        "description": "Contact for bulk pricing",
      },
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Durable Fastener Private Limited",
      },
    },
  };
};

interface FaqProps { question: string; answer: string; index: number }

const FaqAccordion: React.FC<FaqProps> = ({ question, answer, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`mb-4 border border-neutral-200 rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'ring-2 ring-yellow-500 shadow-lg bg-white' : 'bg-neutral-50 hover:bg-neutral-100'
        }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-yellow-500 text-neutral-900' : 'bg-neutral-200 text-neutral-500 group-hover:bg-neutral-300'
            }`}>
            <HelpCircle size={20} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold uppercase tracking-tight text-neutral-900" style={fontHeading}>
            {question}
          </span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className={isOpen ? 'text-yellow-600' : 'text-neutral-400'}>
          <Settings size={24} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="px-6 pb-8 flex gap-6 relative">
              <div className="w-1 bg-yellow-500 rounded-full shrink-0" />
              <div className="flex-1">
                <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100 text-neutral-600 leading-relaxed font-medium whitespace-pre-wrap">
                  {answer}
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-400">
                  <Wrench size={12} /> Tech Verified Answer
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className={`flex items-center gap-2.5 mb-5 border-b ${THEME.border} pb-3`}>
    <Icon size={20} className="text-yellow-600" />
    <span className="text-lg font-bold uppercase tracking-wide text-neutral-900" style={fontHeading}>
      {title}
    </span>
  </div>
);

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  // State
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDia, setSelectedDia] = useState('');
  const [selectedLen, setSelectedLen] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('mm');
  const [selectedType, setSelectedType] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeImageOverride, setActiveImageOverride] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [fullScreenAppImage, setFullScreenAppImage] = useState<string | null>(null);
  const [activeAppIndex, setActiveAppIndex] = useState(0);

  // ✅ Inject FAQ schema directly into head (bypasses Helmet limitations)
  useEffect(() => {
    if (!product?.faqs?.length) return;

    // Remove any existing FAQ schema scripts to avoid duplicates
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-faq-schema]');
    existingScripts.forEach(script => script.remove());

    // Create and inject FAQ schema
    const faqSchema = buildFaqSchema(product.faqs);
    if (faqSchema) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-faq-schema', 'true');
      script.textContent = JSON.stringify(faqSchema);
      document.head.appendChild(script);
    }

    return () => {
      const scriptsToRemove = document.querySelectorAll('script[type="application/ld+json"][data-faq-schema]');
      scriptsToRemove.forEach(script => script.remove());
    };
  }, [product?.faqs]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 1024px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700' +
      '&family=Roboto:wght@300;400;500;700' +
      '&family=Roboto+Mono:wght@400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // Fetch product + variants from Supabase
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        if (!slug) throw new Error('No product slug');

        const { data: productData, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) throw error;

        const { data: vData } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productData.id);

        const fullProduct = {
          ...productData,
          applications: productData.applications || [],
          variants: vData || [],
          specifications: productData.specifications || [],
          dimensional_specifications: productData.dimensional_specifications || [],
          faqs: productData.faqs || [],
          images: productData.images || [],
        };

        setProduct(fullProduct);

        // Set default selections only if variants exist
        if (vData && vData.length > 0) {
          const dias = Array.from(
            new Set(vData.map((v: any) => v.diameter).filter(Boolean)),
          ).sort((a: any, b: any) => parseFloat(a) - parseFloat(b));
          if (dias.length > 0) setSelectedDia(dias[0] as string);
        }
      } catch (err) {
        console.error('ProductDetail fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // Derived data – robust for missing variants
  const uniqueDiameters = useMemo(() => {
    if (!product?.variants?.length) return [];
    const dias = product.variants
      .map((v: any) => v.diameter?.toString().trim())
      .filter(Boolean);
    return Array.from(new Set(dias)).sort(
      (a: any, b: any) => parseFloat(a) - parseFloat(b),
    );
  }, [product]);

  const diameterTitle = useMemo(() => {
    if (!product?.variants?.length || !selectedDia) return 'Select Diameter';
    const v = product.variants.find((v: any) => v.diameter === selectedDia);
    return v?.diameter_unit === 'gauge' ? 'Select Gauge' : 'Select Diameter';
  }, [product, selectedDia]);

  const availableLengthOptions = useMemo(() => {
    if (!product?.variants?.length || !selectedDia) return [];
    const filtered = product.variants.filter((v: any) => v.diameter === selectedDia);
    const map = new Map();
    filtered.forEach((v: any) => {
      if (!v.length) return;
      const u = v.unit || 'mm';
      const lengths = v.length.includes(',')
        ? v.length.split(',').map((l: string) => l.trim())
        : [v.length];
      lengths.forEach((l: string) => {
        const key = `${l}_${u}`;
        if (!map.has(key)) map.set(key, { value: l, unit: u });
      });
    });
    return Array.from(map.values()).sort(
      (a, b) => parseFloat(a.value) - parseFloat(b.value),
    );
  }, [product, selectedDia]);

  useEffect(() => {
    if (availableLengthOptions.length > 0) {
      const valid = availableLengthOptions.some(
        o => o.value === selectedLen && o.unit === selectedUnit,
      );
      if (!valid) {
        setSelectedLen(availableLengthOptions[0].value);
        setSelectedUnit(availableLengthOptions[0].unit);
      }
    } else {
      // Reset if no length options
      setSelectedLen('');
      setSelectedUnit('mm');
    }
  }, [selectedDia, availableLengthOptions, selectedLen, selectedUnit]);

  const availableFinishes = useMemo(() => {
    if (!product?.variants?.length) return [];
    return Array.from(
      new Set(
        product.variants
          .filter(
            (v: any) =>
              v.diameter === selectedDia &&
              (v.length === selectedLen || v.length?.includes(selectedLen)) &&
              (v.unit || 'mm') === selectedUnit,
          )
          .map((v: any) => v.finish)
          .filter(Boolean),
      ),
    );
  }, [product, selectedDia, selectedLen, selectedUnit]);

  const availableTypes = useMemo(() => {
    if (!product?.variants?.length) return [];
    return Array.from(
      new Set(
        product.variants
          .filter(
            (v: any) =>
              v.diameter === selectedDia &&
              (v.length === selectedLen || v.length?.includes(selectedLen)) &&
              (v.unit || 'mm') === selectedUnit,
          )
          .map((v: any) => v.type)
          .filter(Boolean),
      ),
    );
  }, [product, selectedDia, selectedLen, selectedUnit]);

  const handleFinishClick = (finish: string) => {
    let img: string | null =
      product.finish_images?.[finish] ||
      product.variants?.find((v: any) => v.finish === finish && v.image)?.image ||
      null;
    setActiveImageOverride(img);
    setSelectedImageIndex(0);
  };

  const handleTypeClick = (type: string) => {
    setSelectedType(type);
    const img: string | null =
      product.type_images?.[type] ||
      product.variants?.find(
        (v: any) => v.type === type && v.diameter === selectedDia && v.image,
      )?.image ||
      product.variants?.find((v: any) => v.type === type && v.image)?.image ||
      null;
    setActiveImageOverride(img);
    setSelectedImageIndex(0);
  };

  // Safe image list
  const displayImages = useMemo(() => {
    let imgs = (product?.images?.length ? product.images : ['https://via.placeholder.com/600x600?text=No+Image']).map(cleanImageUrl);
    if (activeImageOverride) return [cleanImageUrl(activeImageOverride), ...imgs];
    return imgs;
  }, [product, activeImageOverride]);

  if (loading)
    return (
      <div className={`h-screen flex items-center justify-center ${THEME.bg}`}>
        <Loader2 className="animate-spin text-yellow-500" size={48} />
      </div>
    );

  if (!product)
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${THEME.bg} p-10 text-center`}>
        <h2 className="text-4xl font-bold mb-4 text-neutral-900" style={fontHeading}>
          Product Not Found
        </h2>
        <p className="text-neutral-600 mb-8 max-w-md">
          The product you are looking for may have been moved or is currently unavailable.
        </p>
        <div className="flex gap-4">
          <Link to="/products" className="bg-yellow-500 px-6 py-3 rounded-lg font-bold uppercase">
            View All Products
          </Link>
          <Link to="/contact" className="bg-neutral-900 text-white px-6 py-3 rounded-lg font-bold uppercase">
            Inquire for Custom Order
          </Link>
        </div>
      </div>
    );

  const currentImage = displayImages[selectedImageIndex];
  const standard = product.specifications?.find((s: any) => s.key.toLowerCase() === 'standard')?.value;
  const showDimensions = product.technical_drawing || product.dimensional_specifications?.length > 0;
  const displayMaterial = product.material || '';
  const displayHeadType = product.head_type?.replace(/Buggel/gi, 'Bugle') || '';
  const materialData = getMaterialData(displayMaterial);
  const seoTitle = product.seo_title || `${product.name} | Durable Fastener – Industrial Solutions`;
const seoDescription = product.seo_description 
  || product.short_description 
  || `High-quality ${product.name} from Durable Fastener. Ideal for industrial applications. Bulk orders available.`;
  const metaKeywords = product.seo_keywords ? (
  <meta name="keywords" content={product.seo_keywords} />
) : null;

  // Schema data – always generated even if some fields missing
  const breadcrumbSchema = buildBreadcrumbSchema(product.name, slug!);
  const productSchema = buildProductSchema(product, slug!, selectedDia, selectedLen, selectedUnit);
  const faqSchema = buildFaqSchema(product.faqs || []);

  // Determine canonical URL – always use product slug
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://durablefastener.com';
  
  // Kyunki aapke sabhi products '/product/slug' par khulte hain, canonical bhi same rahega
  const canonicalUrl = `${baseUrl}/product/${slug}`;

  // Testing ke liye console log (aap testing ke baad isse hata sakte hain)
  console.log("Current Canonical URL:", canonicalUrl);

  return (
    <div
      className={`${THEME.bg} min-h-screen pb-24 pt-[170px] md:pt-[200px] selection:bg-yellow-500/30 selection:text-black`}
      style={fontBody}
    >
      <Helmet>
         <title>{seoTitle}</title>
  <link rel="canonical" href={canonicalUrl} />
  <meta name="description" content={seoDescription} />
        {/* Breadcrumb Schema */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        {/* Product Schema */}
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      </Helmet>

      {/* Breadcrumb Nav Bar */}
      <div className="fixed top-[80px] md:top-[96px] left-0 w-full z-30 bg-neutral-900 border-b border-neutral-800 shadow-md">
        <div className="max-w-7xl mx-auto px-5 py-2.5">
          <nav className="flex items-center gap-2 text-[13px] md:text-[14px] font-medium tracking-wide">
            <Link to="/" className="text-neutral-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} className="text-neutral-600" />
            <Link to="/products" className="text-neutral-400 hover:text-white transition-colors">Products</Link>
            <ChevronRight size={12} className="text-neutral-600" />
            <span className="text-yellow-500 font-bold uppercase tracking-wider text-xs md:text-sm truncate max-w-[180px] md:max-w-none">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
        {/* Title Block */}
        <motion.div variants={containerVar} initial="hidden" animate="visible" className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div>
              <motion.div variants={itemVar} className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded bg-yellow-100 border border-yellow-200 text-yellow-900 text-[12px] font-bold uppercase tracking-widest">
                  {product.category || 'Industrial Series'}
                </span>
                {standard && (
                  <span className="text-neutral-600 text-[12px] font-mono font-bold tracking-wider px-2 py-1 bg-white rounded border border-neutral-200">
                    {standard}
                  </span>
                )}
              </motion.div>
              <motion.h1
                variants={itemVar}
                className="text-4xl md:text-5xl lg:text-6xl font-semibold text-neutral-900 uppercase leading-tight tracking-wide"
                style={fontHeading}
              >
                {product.name}
              </motion.h1>
            </div>
            <motion.div variants={itemVar} className="flex gap-3">
              <button className="p-3 bg-white rounded-lg text-neutral-500 hover:text-neutral-900 transition-all border border-neutral-200 shadow-sm hover:shadow-md">
                <Share2 size={20} />
              </button>
              <button className="p-3 bg-white rounded-lg text-neutral-500 hover:text-neutral-900 transition-all border border-neutral-200 shadow-sm hover:shadow-md">
                <Printer size={20} />
              </button>
            </motion.div>
          </div>
          <motion.div variants={itemVar} className="flex items-start gap-5 mt-6 border-l-4 border-yellow-500 pl-6">
            <p className="text-neutral-700 text-lg font-normal leading-relaxed max-w-4xl">
              {product.short_description || product.description || "Precision-engineered component suitable for a wide range of industrial applications."}
            </p>
          </motion.div>
        </motion.div>

        {/* MAIN PRODUCT SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT COLUMN: PRODUCT IMAGE */}
          <div className="lg:col-span-4 flex items-center justify-center min-h-[400px] lg:min-h-[1100px]">
            <div className="w-full max-w-[400px]">
              <MagicZoomClone
                src={currentImage}
                zoomSrc={currentImage}
                alt={product.name}
                zoomLevel={4}
                glassSize={isMobile ? 120 : 180}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: CONFIG PANEL – only show if variants exist, otherwise show basic info */}
          <div className="lg:col-span-8 space-y-7">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
              {product.variants?.length > 0 ? (
                <>
                  {/* SELECT DIAMETER */}
                  {uniqueDiameters.length > 0 && (
                    <div className="mb-8">
                      <SectionHeader icon={Ruler} title={diameterTitle} />
                      <div className="flex flex-wrap gap-3">
                        {uniqueDiameters.map((dia: any) => {
                          const isSelected = selectedDia === dia;
                          return (
                            <button
                              key={dia}
                              onClick={() => setSelectedDia(dia)}
                              className={`relative px-3 h-12 min-w-[3.5rem] rounded-lg flex items-center justify-center text-lg transition-all duration-200 border-2 ${isSelected
                                  ? 'bg-yellow-500 text-neutral-900 border-yellow-500 shadow-md font-bold'
                                  : 'bg-neutral-50 text-neutral-600 border-neutral-100 hover:border-neutral-300 hover:text-neutral-900 hover:bg-white font-medium'
                                }`}
                              style={fontMono}
                            >
                              {dia.toString().replace('mm', '').trim()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SELECT LENGTH */}
                  {availableLengthOptions.length > 0 && (
  <div className="mb-5">
    <div className="flex justify-between items-end mb-0 border-b border-neutral-100 pb-2">
      <SectionHeader icon={Maximize2} title={`Select Length (${selectedUnit})`} />
      <span className="text-4xl font-bold text-neutral-900 tracking-tight" style={fontHeading}>
        {selectedLen || '--'}
        <span className="text-sm text-neutral-400 ml-1 font-sans font-medium">{selectedUnit}</span>
      </span>
    </div>
    <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />
      <div className="flex items-end justify-between h-40 gap-1 relative z-10 w-full px-1">
        {availableLengthOptions.map((opt: any, idx: number) => {
          const isSelected = selectedLen === opt.value && selectedUnit === opt.unit;
          
          // --- AUTO BAR HEIGHT CALCULATION ---
          // Find min and max length values for dynamic scaling
          const numericValues = availableLengthOptions.map(o => parseFloat(o.value));
          const minVal = Math.min(...numericValues);
          const maxVal = Math.max(...numericValues);
          const range = maxVal - minVal || 1; // Avoid division by zero
          
          // Calculate percentage height (minimum 20% height for visibility)
          const currentValue = parseFloat(opt.value);
          const heightPercent = 20 + ((currentValue - minVal) / range) * 70; // 20% to 90% range
          const barHeight = Math.max(25, Math.min(90, heightPercent)); // Clamp between 25% and 90%
          
          return (
            <button
              key={idx}
              onClick={() => { setSelectedLen(opt.value); setSelectedUnit(opt.unit); }}
              className="group flex-1 flex flex-col items-center justify-end h-full gap-2 focus:outline-none relative"
            >
              {/* BAR - height dynamically scales with length value */}
              <div 
                className={`w-1.5 sm:w-3 rounded-t-[3px] transition-all duration-300 ${
                  isSelected ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' : 'bg-neutral-300 group-hover:bg-neutral-400'
                }`}
                style={{ 
                  height: `${barHeight}%`,
                  minHeight: '8px'
                }}
              />
              
              {/* VALUE LABEL */}
              <span className={`font-mono transition-all duration-200 whitespace-nowrap block ${
                isSelected 
                  ? 'text-base font-bold text-neutral-900 -translate-y-0.5 scale-110' 
                  : 'text-xs sm:text-sm text-neutral-500 font-medium group-hover:text-neutral-900'
              }`}>
                {parseFloat(opt.value)}
                {opt.unit !== 'mm' && <span className="text-[9px] block text-center">{opt.unit}</span>}
              </span>
              
              {/* SELECTION INDICATOR LINE */}
              <div className="absolute bottom-0 w-full h-[1px] bg-neutral-300 -z-10" />
              
              {/* SMALL RULER MARKERS */}
              <div className="absolute bottom-5 w-px h-1.5 bg-neutral-300 -z-5" />
            </button>
          );
        })}
      </div>
      
      {/* RULER REFERENCE LABELS */}
      <div className="flex justify-between px-1 mt-1 text-[8px] font-mono text-neutral-400 uppercase tracking-wider">
        <span>Min</span>
        <span>Length Scale</span>
        <span>Max</span>
      </div>
    </div>
  </div>
)}

                  {/* Finish */}
                  {availableFinishes.length > 0 && (
                    <div className="mb-4">
                      <SectionHeader icon={Layers} title="Surface Finish" />
                      <div className="flex flex-wrap gap-4">
                        {availableFinishes.map((finish: any) => {
                          const key = finish.toLowerCase().trim();
                          const customIcon = product.finish_icons?.[finish];
                          const isActive =
                            activeImageOverride === (product.finish_images?.[finish]) ||
                            product.variants?.find(
                              (v: any) => v.finish === finish && v.image === activeImageOverride
                            );
                          const bgStyle = FINISH_TEXTURES[key] || "#f3f4f6";

                          return (
                            <button
                              key={finish}
                              onClick={() => handleFinishClick(finish)}
                              className={`flex flex-col items-center justify-center gap-2 p-1.5 rounded-xl border transition-all duration-300
                                ${isActive
                                  ? "ring-2 ring-yellow-500 scale-105 border-yellow-500 bg-white shadow-lg"
                                  : "border-neutral-200 bg-neutral-50/50 hover:bg-white hover:scale-105 hover:shadow-md"
                                }
                              `}
                            >
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-neutral-100">
                                {customIcon ? (
                                  <img src={customIcon} alt={finish} className="w-full h-full object-contain p-1" />
                                ) : (
                                  <div className="w-full h-full" style={{ background: bgStyle }} />
                                )}
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-widest px-1 transition-colors ${isActive ? 'text-neutral-900' : 'text-neutral-400'
                                }`} style={fontHeading}>
                                {finish}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <Tag size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">This product has no variant options.</p>
                  <p className="text-sm">Please contact us for more details.</p>
                </div>
              )}

              {/* Specification Details – always show if specifications exist */}
              {(product.specifications?.length > 0 || displayHeadType || product.drive_type) && (
                <div className="mb-5 border-b border-neutral-100">
                  <SectionHeader icon={FileCheck} title="Specification Details" />
                  <table className="w-full text-sm rounded-2xl border-collapse border border-neutral-200">
                    <tbody>
                      {[
                        { label: 'Head Type', value: displayHeadType },
                        { label: 'Drive', value: product.drive_type },
                        { label: 'Type', value: selectedType },
                        ...(product.specifications || [])
                          .filter((s: any) => s?.key && !HIDDEN_SPECS.includes(s.key.toLowerCase()))
                          .map((s: any) => ({
                            label: s.key,
                            value: s.value,
                          })),
                      ].map(
                        (item, idx) =>
                          item.value && (
                            <tr key={idx} className="border">
                              <td className="p-4 border font-medium text-neutral-600 uppercase text-xs tracking-wider w-[30%]">
                                {item.label}
                              </td>
                              <td className="p-4 border font-semibold text-neutral-900" colSpan={2}>
                                {item.value}
                              </td>
                            </tr>
                          )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Material Specifications */}
              {displayMaterial && (
                <div className="p-1 flex flex-col gap-0 divide-y divide-neutral-100">
                  <div className="pb-1 mb-1">
                    <h4 className="text-center text-sm font-bold uppercase tracking-widest text-neutral-800 mb-5" style={fontHeading}>
                      Material Specifications
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {displayMaterial.split(/\|/g).map((mat: string, idx: number) => {
                        const parts = mat.split('(');
                        const name = parts[0].trim();
                        let grade = parts.length > 1 ? parts[1].replace(')', '').trim() : '';
                        grade = grade.replace(/grade/i, '').trim();
                        return (
                          <div key={idx} className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-neutral-100">
                              <Settings className="text-neutral-400" size={20} />
                              <span className="text-base font-bold text-neutral-900">{name}</span>
                            </div>
                            <div className="mt-auto">
                              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Grade:</span>
                              <span className="text-sm font-semibold text-neutral-800">{grade}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* CTA BUTTONS */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <a
                  href="/contact"
                  className="col-span-1 bg-yellow-500 hover:bg-yellow-400 text-neutral-900 h-14 rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 transition-all text-sm border border-yellow-600/10 hover:-translate-y-0.5"
                  style={fontHeading}
                >
                  <ShoppingCart size={20} /> Bulk Quote
                </a>
                <a
                  href="/public/Durable Fastener Pvt. Ltd. Catalogue.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-1 bg-neutral-900 text-white h-14 rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all text-sm hover:-translate-y-0.5"
                  style={fontHeading}
                >
                  <FileText size={20} /> View Catalogue
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Vault – only if dimensions or drawing exist */}
        {showDimensions && (
          <div className="bg-[#aaaaab] border-t border-neutral-300 relative z-20 overflow-hidden text-neutral-900 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVar}>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                  <div className="flex items-center gap-3">
                    <Activity className="text-yellow-600" size={32} />
                    <h3 className="text-3xl md:text-4xl font-bold text-neutral-900 uppercase tracking-wider" style={fontHeading}>
                      Technical Specifications
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-6">
                    {(product.certifications || []).map((cert: any, idx: number) => (
                      <div key={idx} className="bg-neutral-900 rounded-md py-2 px-3 flex items-center gap-3 border border-neutral-800 shadow-2xl hover:scale-105 transition-transform duration-300">
                        <div className="p-1 rounded-full border-2 border-emerald-500/30">
                          <ShieldCheck className="text-emerald-500" size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-black text-sm leading-none">{cert.title}</span>
                          <span className="text-emerald-500 text-[9px] font-bold tracking-[0.25em] uppercase mt-1.5 font-mono">{cert.subtitle}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col lg:flex-row shadow-xl">
                  {/* Drawing */}
                  <div className="lg:w-2/3 relative p-12 bg-white flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-neutral-200 group">
                    <div className="absolute inset-0 opacity-100" style={blueprintGridStyleLight} />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent z-10 pointer-events-none border-b border-yellow-500/20"
                      animate={{ top: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                    />
                    <div className="absolute top-6 left-6 z-20">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-neutral-100 border border-neutral-300 text-[11px] font-mono uppercase text-neutral-600 font-bold tracking-wider">
                        ISO View
                      </span>
                    </div>
                    {product.technical_drawing ? (
                      <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        src={cleanImageUrl(product.technical_drawing)}
                        className="relative z-10 max-h-[450px] w-auto object-contain opacity-90 transition-transform duration-500 group-hover:scale-105 mix-blend-multiply"
                        alt="Technical Drawing"
                      />
                    ) : (
                      <div className="text-neutral-500 font-mono text-sm border border-neutral-200 px-6 py-3 rounded bg-neutral-50">
                        [ DRAWING DATA UNAVAILABLE ]
                      </div>
                    )}
                  </div>

                  {/* Performance */}
                  <div className="lg:w-1/3 bg-neutral-50 p-8 flex flex-col border-l border-neutral-200 relative">
                    <div className="mb-6 pb-4 border-b border-neutral-200 flex items-center justify-between">
                      <h4 className="text-lg font-bold uppercase tracking-widest text-neutral-900 flex items-center gap-2" style={fontHeading}>
                        <Layers size={18} className="text-yellow-600" /> Performance Data
                      </h4>
                      <div className="flex gap-2 items-center bg-white px-3 py-1 rounded border border-neutral-200 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[15px] text-green-700 font-mono uppercase font-bold">Verified</span>
                      </div>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                      {PERFORMANCE_KEYS_DISPLAY.map((key, i) => {
                        const spec = (product.specifications || []).find(
                          (s: any) => s.key.toLowerCase() === key.toLowerCase(),
                        );
                        if (!spec) return null;
                        return (
                          <motion.div
                            key={i}
                            initial={{ x: 20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex justify-between items-center p-3.5 bg-white rounded border border-neutral-200 hover:border-neutral-400 transition-colors shadow-sm"
                          >
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider" style={fontHeading}>{key}</span>
                            <span className="text-neutral-900 font-mono text-sm font-bold">{spec.value}</span>
                          </motion.div>
                        );
                      })}
                      {!(product.specifications || []).some((s: any) =>
                        PERFORMANCE_KEYS_DISPLAY.map(k => k.toLowerCase()).includes(s.key.toLowerCase()),
                      ) && (
                          <div className="text-center text-neutral-500 text-xs italic py-4 font-mono">
                            No specific performance data listed.
                          </div>
                        )}
                    </div>
                    <button
                      className="w-full mt-6 flex items-center justify-center gap-2 bg-neutral-900 text-white py-3.5 rounded text-sm font-bold uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all border border-neutral-900 hover:border-yellow-500 shadow-md"
                      style={fontHeading}
                    >
                      <Lock size={14} /> Unlock Engineering Report
                    </button>
                  </div>
                </div>

                {/* Dimensional Table – only if dimensional_specifications exist */}
                {product.dimensional_specifications?.length > 0 && uniqueDiameters.length > 0 && (
                  <div className="w-full bg-white border border-t-0 border-neutral-200 rounded-b-2xl overflow-hidden shadow-sm">
                    {/* MOBILE VIEW */}
                    <div className="block md:hidden">
                      {uniqueDiameters.map((dia: any) => {
                        const isActive = selectedDia === dia;
                        return (
                          <div key={dia} className={`border-b last:border-0 ${isActive ? 'ring-2 ring-inset ring-yellow-500 bg-yellow-50/30' : ''}`}>
                            <div className={`p-3 flex justify-between items-center ${isActive ? 'bg-yellow-500 text-neutral-900' : 'bg-neutral-800 text-white'}`}>
                              <span className="text-xs font-black uppercase tracking-widest" style={fontHeading}>Size Detail</span>
                              <span className="text-xl font-black" style={fontHeading}>{dia.includes('mm') ? dia : `${dia}mm`}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-px bg-neutral-100">
                              {product.dimensional_specifications.map((dim: any, idx: number) => {
                                let val = '-';
                                if (dim.values && typeof dim.values === 'object') {
                                  const raw = dia.toString().replace('mm', '').replace('#', '').trim();
                                  val = String(dim.values[dia] || dim.values[raw] ||
                                    Object.entries(dim.values).find(([k]) => k.replace('mm', '').trim() === raw)?.[1] || '-');
                                } else if (dia === selectedDia) {
                                  val = String(dim.value || '-');
                                }
                                return (
                                  <div key={idx} className="bg-white p-3 flex flex-col justify-center min-h-[70px]">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="text-[10px] font-serif italic font-bold text-yellow-600">{dim.symbol || '•'}</span>
                                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">{dim.label}</span>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-neutral-900">{val}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* DESKTOP VIEW */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="border-b border-neutral-200 bg-neutral-100">
                            <th className="py-6 pl-8 text-sm font-bold text-neutral-800 uppercase tracking-widest sticky left-0 z-10 bg-neutral-100 border-r border-neutral-200 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]" style={fontHeading}>
                              Feature
                            </th>
                            <th className="py-6 text-center text-sm font-bold text-neutral-600 uppercase tracking-widest w-28 bg-neutral-100 border-r border-neutral-200" style={fontHeading}>
                              Symbol
                            </th>
                            {uniqueDiameters.map((dia: any) => (
                              <th
                                key={dia}
                                className={`py-6 px-6 text-center text-base font-bold uppercase tracking-widest whitespace-nowrap ${selectedDia === dia ? 'text-yellow-700 bg-yellow-50 border-b-2 border-yellow-500' : 'text-neutral-500'
                                  }`}
                                style={fontHeading}
                              >
                                {dia.includes('.') && !dia.includes('mm') && !dia.includes('#') ? `${dia}mm` : dia}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-sm font-mono">
                          {product.dimensional_specifications.map((dim: any, idx: number) => (
                            <tr key={idx} className="hover:bg-neutral-50 transition-colors group">
                              <td className="py-5 pl-8 text-neutral-800 font-bold text-sm uppercase tracking-wider sticky left-0 bg-white group-hover:bg-neutral-50 border-r border-neutral-200 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]" style={fontHeading}>
                                {dim.label}
                              </td>
                              <td className="py-5 text-center text-yellow-600/90 font-serif italic font-bold bg-neutral-50/50 border-r border-neutral-200">
                                {dim.symbol || '-'}
                              </td>
                              {uniqueDiameters.map((dia: any) => {
                                let val = '-';
                                if (dim.values && typeof dim.values === 'object') {
                                  const raw = dia.toString().replace('mm', '').replace('#', '').trim();
                                  val = String(dim.values[dia] || dim.values[raw] ||
                                    Object.entries(dim.values).find(([k]) => k.replace('mm', '').trim() === raw)?.[1] || '-');
                                } else if (dia === selectedDia) {
                                  val = String(dim.value || '-');
                                }
                                return (
                                  <td key={dia} className={`py-5 text-center transition-all duration-300 font-medium ${selectedDia === dia ? 'bg-yellow-50 text-neutral-900 font-bold text-base border-x border-yellow-200' : 'text-neutral-500 border-x border-transparent'
                                    }`}>
                                    {val}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* Applications – only if present */}
        {product.applications?.length > 0 && (
          <section className={`py-32 ${THEME.bg} overflow-hidden border-t border-neutral-300`}>
            <div className="max-w-7xl mx-auto px-4">
              <div className="mb-20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-px w-12 bg-yellow-500" />
                  <span className="font-mono text-sm font-bold tracking-[0.4em] uppercase text-neutral-500">Industry Deployment</span>
                </div>
                <h3 className="text-5xl md:text-7xl font-black text-neutral-900 uppercase tracking-tighter" style={fontHeading}>
                  Where Excellence <br />
                  <span className="text-white drop-shadow-[2px_2px_0_#171717] [-webkit-text-stroke:1px_#171717]">
                    Meets Integrity
                  </span>
                </h3>
              </div>

              <div className="relative flex flex-col lg:flex-row gap-12 items-start">
                <div className="w-full lg:w-1/3 space-y-4 sticky top-[250px] z-20">
                  {product.applications.map((app: any, idx: number) => {
                    const appName = typeof app === 'string' ? app : app.name;
                    const isActive = activeAppIndex === idx;
                    return (
                      <motion.div
                        key={idx}
                        onMouseEnter={() => setActiveAppIndex(idx)}
                        className={`group flex items-center gap-6 p-6 rounded-xl border transition-all duration-500 cursor-pointer ${isActive
                            ? 'bg-neutral-900 border-neutral-900 shadow-2xl translate-x-4'
                            : 'bg-white border-neutral-200 hover:border-yellow-500'
                          }`}
                      >
                        <span className={`font-mono text-lg font-bold transition-colors duration-300 ${isActive ? 'text-yellow-500' : 'text-neutral-300'
                          }`}>
                          0{idx + 1}
                        </span>
                        <div className="flex-1">
                          <h4
                            className={`text-xl font-bold uppercase tracking-tight transition-colors duration-300 ${isActive ? 'text-white' : 'text-neutral-900'
                              }`}
                            style={fontHeading}
                          >
                            {appName}
                          </h4>
                          {isActive && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="text-neutral-400 text-xs mt-2 uppercase tracking-widest font-bold"
                            >
                              View Technical Case
                            </motion.p>
                          )}
                        </div>
                        <ChevronRight className={`transition-colors duration-300 ${isActive ? 'text-yellow-500' : 'text-neutral-300'
                          }`} />
                      </motion.div>
                    );
                  })}
                </div>

                <div className="w-full lg:w-2/3 aspect-[4/3] lg:aspect-square relative">
                  <AnimatePresence mode="wait">
                    {product.applications.map((app: any, idx: number) => {
                      if (activeAppIndex !== idx) return null;
                      const appImage = typeof app === 'object' ? app.image : null;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 1.1, rotateY: 10 }}
                          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                          exit={{ opacity: 0, scale: 0.95, rotateY: -10 }}
                          transition={{ duration: 0.6, ease: 'circOut' }}
                          className="absolute inset-0 rounded-3xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] bg-neutral-800"
                        >
                          <div className="relative w-full h-full overflow-hidden group">
                            <img
                              src={cleanImageUrl(appImage) || 'https://via.placeholder.com/800'}
                              className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                              alt={typeof app === 'string' ? app : app.name}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
                              <div className="space-y-1">
                                <p className="text-yellow-500 font-mono text-xs uppercase tracking-widest font-bold">Standard Optimized</p>
                                <h5 className="text-3xl font-bold text-white uppercase tracking-tight" style={fontHeading}>
                                  {typeof app === 'string' ? app : app.name}
                                </h5>
                              </div>
                              <Link
                                to={`/applications/${(typeof app === 'string' ? app : app.name).toLowerCase().replace(/\s+/g, '-')}`}
                                className="bg-white text-black p-4 rounded-full hover:bg-yellow-500 transition-colors shadow-xl"
                              >
                                <ArrowUpRight size={28} />
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {product.faqs?.length > 0 && (
          <section className="py-24 bg-neutral-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl -ml-48 -mb-48" />

            <div className="max-w-5xl mx-auto px-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Wrench className="text-yellow-500" size={24} />
                    <span className="font-mono text-xs font-bold tracking-[0.5em] uppercase text-yellow-500/60">Fastener Support</span>
                  </div>
                  <h3 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white" style={fontHeading}>
                    Technical <span className="text-yellow-500">Knowledge</span> Base
                  </h3>
                </div>
                <div className="hidden md:block">
                  <Activity size={80} className="text-neutral-800" />
                </div>
              </div>

              <div className="space-y-4">
                {product.faqs.map((faq: any, idx: number) => (
                  <FaqAccordion key={idx} index={idx} question={faq.question} answer={faq.answer} />
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="mt-16 p-8 bg-neutral-800/50 border border-neutral-700 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm"
              >
                <div className="flex items-center gap-6 text-left">
                  <div className="w-16 h-16 bg-neutral-700 rounded-2xl flex items-center justify-center text-yellow-500">
                    <Info size={32} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-xl uppercase" style={fontHeading}>Need Custom Specifications?</p>
                    <p className="text-neutral-400 text-sm">Our engineering team can assist with specific bulk requirements.</p>
                  </div>
                </div>
                <Link
                  to="/contact"
                  className="group bg-yellow-500 hover:bg-yellow-400 text-neutral-900 px-8 py-4 rounded-xl font-bold uppercase tracking-widest flex items-center gap-3 transition-all"
                >
                  Get Expert Advice
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </section>
        )}

        {/* Full-screen image modal */}
        <AnimatePresence>
          {fullScreenAppImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setFullScreenAppImage(null)}
            >
              <button
                className="absolute top-6 right-6 z-[10000] text-neutral-500 hover:text-black bg-white border border-neutral-200 p-3 rounded-full shadow-xl"
                onClick={() => setFullScreenAppImage(null)}
              >
                <X size={24} />
              </button>
              <img
                src={fullScreenAppImage}
                className="max-w-full max-h-[85vh] object-contain rounded-lg border border-neutral-200 shadow-2xl"
                onClick={e => e.stopPropagation()}
                alt="Full screen view"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductDetail;
