import React, { useEffect, useRef, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '../lib/supabase';
import { 
  ArrowRight, ShieldCheck, Layers, Globe, ArrowUpRight, 
  Hammer, ScanLine, Thermometer, FileCheck, 
  BookOpen, Clock, Plus 
} from 'lucide-react';
import { 
  motion, useScroll, useTransform, useSpring, AnimatePresence, 
  useMotionValue, useMotionTemplate, useInView 
} from 'framer-motion';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import GoogleReviews from "../components/GoogleReviews";

const homeFaqSchema = JSON.stringify({
 "@context": "https://schema.org",
 "@type": "FAQPage",
 "mainEntity": [
  {
   "@type": "Question",
   "name": "Who is the best screw manufacturer in India?",
   "acceptedAnswer": {
    "@type": "Answer",
    "text": "Durable Fastener Private Limited is a leading screw manufacturer in India producing high-quality self-drilling, drywall, and stainless steel screws for industrial and construction use."
   }
  },
  {
   "@type": "Question",
   "name": "Where can I buy drywall screws in bulk in India?",
   "acceptedAnswer": {
    "@type": "Answer",
    "text": "You can purchase bulk drywall screws directly from Durable Fastener Private Limited, a trusted manufacturer and supplier based in Gujarat, India."
   }
  },
  {
   "@type": "Question",
   "name": "Which company manufactures self-drilling screws in Gujarat?",
   "acceptedAnswer": {
    "@type": "Answer",
    "text": "Durable Fastener Private Limited in Rajkot, Gujarat manufactures premium quality self-drilling screws for domestic and export markets."
   }
  },
  {
   "@type": "Question",
   "name": "Do you supply screws for export and wholesale?",
   "acceptedAnswer": {
    "@type": "Answer",
    "text": "Yes, Durable Fastener supplies bulk quantities for distributors, wholesalers, and international buyers."
   }
  },
  {
   "@type": "Question",
   "name": "Can I get custom size screws manufactured?",
   "acceptedAnswer": {
    "@type": "Answer",
    "text": "Yes, custom OEM manufacturing is available according to client specifications including size, coating, and packaging."
   }
  },
  {
   "@type": "Question",
   "name": "Where is Durable Fastener located?",
   "acceptedAnswer": {
    "@type": "Answer",
    "text": "Durable Fastener Private Limited is located in Rajkot, Gujarat, India."
   }
  },
{
      "@type": "Question",
      "name": "What is the difference between self-drilling and self-tapping screws?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Self-drilling screws (TEK screws) have a drill-point tip to create their own hole in metal. Self-tapping screws tap their own threads but usually require a pre-drilled pilot hole."
      }

    }
]
});

const { Link } = ReactRouterDOM;

const R2_BASE = "https://pub-ffd0eb07a99540ac95c35c521dd8f7ae.r2.dev";

const cleanImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith(R2_BASE)) return url;
  if (url.includes('unsplash.com') || url.includes('images.unsplash')) return url;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
       return url; 
  }
  return `${R2_BASE}/${url}`;
};

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface SectionRevealProps { children: React.ReactNode; delay?: number; }

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const SectionReveal: React.FC<SectionRevealProps> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay: delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const RevealText = ({ text, className }: { text: string, className?: string }) => (
  <div className="overflow-hidden">
    <motion.span
      initial={{ y: "100%" }}
      whileInView={{ y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
      className={`block ${className || ""}`} 
    >
      {text}
    </motion.span>
  </div>
);

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-white/10">
      <button 
        onClick={onClick}
        className="w-full py-8 flex items-center justify-between text-left group transition-all"
      >
        <span className={cn(
          "text-lg md:text-xl font-bold transition-colors duration-300 pr-8",
          isOpen ? "text-yellow-500" : "text-white group-hover:text-yellow-500/80"
        )}>
          {question}
        </span>
        <motion.div 
          animate={{ rotate: isOpen ? 45 : 0 }}
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center transition-all",
            isOpen ? "bg-yellow-500 border-yellow-500 text-black" : "text-white group-hover:border-white/30"
          )}
        >
          <Plus size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-neutral-400 leading-relaxed max-w-2xl text-sm md:text-base">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AnimatedGlobalIcon = () => (
    <div className="relative w-24 h-24 mb-6">
      <motion.div className="absolute inset-0 border border-white/20 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
      <motion.div className="absolute inset-2 border border-dashed border-yellow-500/50 rounded-full" animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} />
       <div className="absolute inset-0 flex items-center justify-center">
        <Globe className="w-10 h-10 text-white" />
       </div>
       <motion.div className="absolute top-0 right-0 bg-yellow-500 w-3 h-3 rounded-full shadow-[0_0_10px_#eab308]" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
    </div>
);

const AnimatedCareerIcon = () => (
    <div className="relative w-24 h-24 mb-6 flex items-end justify-center pb-2 gap-2">
      {[0, 1, 2, 3].map((i) => (
        <motion.div key={i} className="w-4 bg-white/20" initial={{ height: 10 }} whileInView={{ height: 20 + (i * 15) }} transition={{ duration: 0.5, delay: i * 0.1 }}>
          <motion.div className="w-full h-full bg-yellow-500 origin-bottom" initial={{ scaleY: 0 }} whileHover={{ scaleY: 1 }} transition={{ duration: 0.3 }} />
        </motion.div>
      ))}
      <motion.div className="absolute top-2 right-2 text-yellow-500" animate={{ x: [0, 5, 0], y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}><ArrowUpRight size={32} /></motion.div>
    </div>
);

function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  return (
    <div className={cn("group relative border border-neutral-800 bg-neutral-900/50 overflow-hidden rounded-[2rem]", className)} onMouseMove={handleMouseMove}>
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, rgba(234, 179, 8, 0.15), transparent 80%)` }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

const Counter = ({ value }: { value: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    let start = 0;
    const end = value;
    const duration = 2000;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      ref.current!.innerText = Math.floor(ease * end).toLocaleString();
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, value]);
  return <span ref={ref}>0</span>;
};

const MagneticButton = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current!.getBoundingClientRect();
    x.set((clientX - (left + width / 2)) * 0.3);
    y.set((clientY - (top + height / 2)) * 0.3);
  };
  const reset = () => { x.set(0); y.set(0); };
  return (
    <motion.div ref={ref} onMouseMove={handleMouse} onMouseLeave={reset} style={{ x, y }} transition={{ type: "spring", stiffness: 150, damping: 15 }} className={className}>
      {children}
    </motion.div>
  );
};

const IntroLoader = ({ onComplete }: { onComplete: () => void }) => {
  const [exit, setExit] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => { setExit(true); setTimeout(onComplete, 1000); }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);
  return (
    <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505]" animate={exit ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 1 }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800/20 via-black to-black opacity-50" />
      <motion.div className="relative z-40 flex flex-col items-center" initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }} animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }} transition={{ type: "spring", stiffness: 100, damping: 20 }}>
        <img src="/durablefastener.png" alt="Durable Logo" className="w-48 h-48 md:w-80 md:h-80 object-contain relative z-50 drop-shadow-2xl" />
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="mt-8 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">Durable <span className="text-yellow-500">Fastener</span></h1>
            <p className="text-xs md:text-sm text-white/50 tracking-[0.5em] mt-2 uppercase font-mono">Engineered for Perfection</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const AnimatedManifesto = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });
  const words = [
    { text: "We" }, { text: "do" }, { text: "not" }, { text: "just" }, { text: "manufacture" },
    { text: "screws." }, { text: "We" }, 
    { text: "forge", className: "text-yellow-500" }, 
    { text: "the", className: "text-yellow-500" }, 
    { text: "backbone", className: "text-yellow-500" }, 
    { text: "of" }, { text: "industry." }, { text: "Every" }, { text: "thread" }, 
    { text: "is" }, { text: "a" }, { text: "promise" }, { text: "of" }, 
    { text: "safety,", className: "font-serif italic font-normal text-white/70" }, 
    { text: "durability,", className: "font-serif italic font-normal text-white/70" }, 
    { text: "and" }, { text: "extreme" }, 
    { text: "precision.", className: "font-serif italic font-normal text-white/70" }
  ];
  return (
    <section className="py-40 bg-neutral-900 text-white rounded-[3rem] relative z-30 min-h-[60vh] flex items-center justify-center border border-white/5">
      <div className="container mx-auto px-6">
        <motion.span initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} className="text-yellow-500 font-black tracking-widest uppercase block mb-12 text-center text-sm">Company Manifesto</motion.span>
        <motion.p ref={ref} className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.1] max-w-5xl mx-auto text-center flex flex-wrap justify-center gap-x-3 gap-y-2">
          {words.map((word, index) => (
            <motion.span key={index} initial={{ opacity: 0.1, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: index * 0.03 }} className={word.className}>
              {word.text}
            </motion.span>
          ))}
        </motion.p>
      </div>
    </section>
  );
};

// =========================================
// MAIN HOME COMPONENT
// =========================================
const Home: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({ target: containerRef });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const heroY = useTransform(smoothProgress, [0, 0.2], [0, -150]);
  const rotate = useTransform(smoothProgress, [0, 0.2], [0, 5]);

  const [heroImages, setHeroImages] = useState<string[]>(["/allscrewtemplate123.jpg"]);
  const [heroText, setHeroText] = useState({ line1: "WHERE DESIRE", line2: "MEETS", line3: "VALUE" });
  const [stats, setStats] = useState({ dealers: 350, years: 13, products: 120 });
  const [categoryImages, setCategoryImages] = useState({
    fasteners: '',
    fittings: ''
  });
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [productDivisions, setProductDivisions] = useState<any[]>([]);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase.from('site_content').select('*').single();
      if (data) {
        if (data.hero_images?.length > 0) {
          setHeroImages(data.hero_images.map((url: string) => cleanImageUrl(url)));
        }

        setHeroText({
          line1: data.hero_title_1 || "WHERE DESIRE",
          line2: data.hero_title_2 || "MEETS",
          line3: data.hero_title_3 || "VALUE"
        });

        setStats({
          dealers: data.stat_dealers || 350,
          years: data.stat_years || 13,
          products: data.stat_products || 120
        });

        setCategoryImages({
          fasteners: cleanImageUrl(data.cat_fasteners || ''),
          fittings: cleanImageUrl(data.cat_fittings || '')
        });
      }

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      const { data: allProducts } = await supabase
        .from('products')
        .select('name, category, slug')
        .order('position', { ascending: true });
        
      if (categoriesData && allProducts) {
        const grouped = categoriesData.map(cat => {
          const productsInCat = allProducts.filter(p => p.category === cat.name);
          return {
            name: cat.name,
            count: productsInCat.length,
            products: productsInCat.map(p => ({ name: p.name, slug: p.slug })), 
            slug: cat.name.toLowerCase().trim().replace(/[\s/]+/g, '-')
          };
        }).filter(div => div.count > 0);

        setProductDivisions(grouped);
      }

      const { data: blogData } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (blogData) {
        const blogsWithR2 = blogData.map((blog: any) => ({
          ...blog,
          image_url: cleanImageUrl(blog.image_url)
        }));
        setBlogs(blogsWithR2);
      }

      setTimeout(() => setIsLoading(false), 1500);
    };

    fetchContent();
  }, []);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length), 4000);
    return () => clearInterval(timer);
  }, [heroImages]);

  const faqs = [
    { q: "Who is the best screw manufacturer in India?", a: "Durable Fastener Private Limited is a leading screw manufacturer producing drywall, self-drilling, and stainless steel screws for construction and industrial use across India and export markets." },
    { q: "Where can I buy screws in bulk in India?", a: "You can purchase bulk screws directly from manufacturers or authorized distributors. We supply wholesale quantities nationwide from our facility in Rajkot, Gujarat." },
    { q: "Which company manufactures self-drilling screws in India?", a: "Several companies manufacture self-drilling screws, but Durable Fastener specializes in high-quality TEK screws for roofing and structural applications." },
    { q: "Do you supply screws across India?", a: "Yes, we deliver bulk orders to all major cities including Mumbai, Delhi, Bangalore, Chennai, and Hyderabad." },
    { q: "Do you export screws internationally?", a: "Yes, export-quality fasteners with OEM packaging under our brand CLASSONE are supplied worldwide." },
    { q: "Can I get custom size screws manufactured?", a: "Yes, custom manufacturing is available based on size, material, coating, and packaging requirements." }
  ];

  return (
    <>
      <Helmet>
        <title>Screw Manufacturer in Rajkot | Self Drilling & Drywall Screws India – Durable Fastener</title>
        <meta name="description" content="Durable Fastener Pvt Ltd is a leading screw manufacturer in Rajkot, Gujarat." />
      </Helmet>

      <AnimatePresence mode="wait">
        {isLoading && <IntroLoader onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      {/* Added -mt-28 md:-mt-36 to nullify external parent top padding gaps completely */}
      <main ref={containerRef} className="bg-[#050505] text-white selection:bg-yellow-500 selection:text-black overflow-hidden m-0 p-0 -mt-28 md:-mt-36">
        
        {/* HERO SECTION */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-36 md:pt-44 pb-20 px-4 md:px-6">
          <motion.div style={{ y: heroY, scale: 1.1, rotate }} className="absolute inset-0 z-0 h-full w-full">
            <AnimatePresence mode="popLayout">
                <motion.img 
                    key={currentHeroIndex}
                    src={heroImages[currentHeroIndex]} 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }} 
                    className="absolute inset-0 w-full h-full object-cover grayscale-[0.5] contrast-125" 
                    alt="Hero Background"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#050505] z-10" />
          </motion.div>
          
          <div className="container relative z-20 mx-auto">
            <div className="flex flex-col items-center text-center">
              {!isLoading && (
                <>
                  <h1 className="text-5xl md:text-[6vw] font-black leading-[0.9] tracking-tighter mb-8 max-w-7xl mx-auto flex flex-col">
                    <RevealText text={heroText.line1} />
                    <RevealText text={heroText.line2} />
                    <RevealText text={heroText.line3} className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 pb-4" />
                  </h1>
                  <SectionReveal delay={0.4}>
                    <MagneticButton>
                        <Link to="/products" className="group relative px-12 py-6 bg-yellow-500 rounded-full overflow-hidden flex items-center gap-3 shadow-xl">
                            <span className="relative z-10 font-black text-black uppercase">Explore Ecosystem</span>
                            <ArrowUpRight className="relative z-10 text-black w-5 h-5" />
                        </Link>
                    </MagneticButton>
                  </SectionReveal>
                </>
              )}
            </div>
          </div>
        </section>

        {/* BENTO STATS */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <SectionReveal>
            <div className="mb-12">
               <h2 className="text-3xl md:text-4xl font-bold">Engineering <span className="text-yellow-500">Excellence</span></h2>
               <p className="text-neutral-400">Durable Fasteners Pvt Ltd by the numbers.</p>
            </div>
          </SectionReveal>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8">
              <SpotlightCard className="p-12 h-full bg-neutral-900/80">
                <div className="flex justify-between items-start mb-20"><Globe className="w-8 h-8 text-yellow-500" /><ArrowUpRight className="text-neutral-600" /></div>
                <h3 className="text-7xl md:text-8xl font-black tracking-tighter"><Counter value={stats.dealers} />+</h3>
                <p className="text-yellow-200/80 font-bold tracking-widest uppercase">GLOBAL STRATEGIC DEALERS</p>
              </SpotlightCard>
            </div>
            <div className="md:col-span-4 flex flex-col gap-6">
              <motion.div whileHover={{ scale: 1.02 }} className="bg-yellow-500 p-8 rounded-[2rem] flex-1">
                <ShieldCheck className="w-8 h-8 text-black mb-4" />
                <h3 className="text-5xl font-bold text-black"><Counter value={stats.years} />+</h3>
                <p className="text-black/70 font-black text-xs uppercase">Years Mastery</p>
              </motion.div>
              <SpotlightCard className="p-8 flex-1">
                <Layers className="w-8 h-8 text-neutral-400 mb-4" />
                <h3 className="text-5xl font-bold text-white"><Counter value={stats.products} />+</h3>
                <p className="text-neutral-400 font-bold text-xs uppercase">SKU High Tensile</p>
              </SpotlightCard>
            </div>
          </div>
        </section>

        <AnimatedManifesto />

        {/* PRODUCTS */}
       <section className="py-40 px-6 container mx-auto">
         <div className="flex justify-between items-end mb-20 flex-wrap gap-6">
           <div>
             <div className="flex items-center gap-3 mb-5">
               <span className="h-px w-10 bg-yellow-500" />
               <span className="text-yellow-500 font-mono text-[10px] uppercase tracking-[0.35em] font-bold">
                 Product Divisions
               </span>
             </div>
             <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.88]">
               The Core<br />Portfolio
             </h2>
           </div>
           <Link
             to="/products"
             className="hidden md:flex items-center gap-4 text-yellow-500 font-bold group uppercase tracking-widest text-xs"
           >
             Browse All Products
             <div className="w-12 h-12 rounded-full border border-yellow-500 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-all">
               <ArrowRight size={20} />
             </div>
           </Link>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {productDivisions.map((division, index) => {
             const isFastener = division.name.toLowerCase().includes('fastener') || division.name.toLowerCase().includes('screw');
             const cardImage = isFastener ? categoryImages.fasteners : categoryImages.fittings;
             return (
               <motion.div
                 key={division.name}
                 initial={{ opacity: 0, y: 40 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-80px" }}
                 transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                 className="group relative rounded-[2rem] overflow-hidden border border-white/5 bg-neutral-900 flex flex-col"
               >
                 <div className="relative h-[260px] md:h-[300px] overflow-hidden flex-shrink-0">
                   {cardImage ? (
                     <img
                       src={cardImage}
                       alt={division.name}
                       className="w-full h-full object-cover grayscale-[0.3] brightness-75 transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105 group-hover:brightness-85"
                     />
                   ) : (
                     <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center">
                       <span className="text-white/10 text-8xl font-black">0{index + 1}</span>
                     </div>
                   )}
                   <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-900 to-transparent" />
                   <div className="absolute top-5 left-5 bg-black/60 backdrop-blur-sm border border-yellow-500/30 text-yellow-500 text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full">
                     {division.name} Segment
                   </div>
                   <div className="absolute top-5 right-5 bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                     {division.count} Products
                   </div>
                 </div>

                 <div className="flex flex-col flex-1 px-8 pt-4 pb-8">
                   <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase mb-2 group-hover:text-yellow-400 transition-colors duration-300">
                     {division.name}
                   </h3>
                   
                   <div className="w-full h-px bg-white/8 mb-5" />
                   <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-4">Products in this division</p>

                   <div className="grid grid-cols-2 gap-x-4 flex-1">
                     {division.products.map((product: { name: string; slug: string }, i: number) => (
                       <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-white/5">
                         <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500/40 flex-shrink-0 group-hover:bg-yellow-500 transition-colors" />
                         <Link 
                           to={`/product/${product.slug}`} 
                           className="text-[12px] text-neutral-400 leading-snug hover:text-yellow-500 transition-colors truncate block w-full"
                         >
                           {product.name}
                         </Link>
                       </div>
                     ))}
                   </div>

                   <div className="flex items-center justify-between pt-6 mt-4 border-t border-white/8">
                     <span className="text-xs text-neutral-600 font-mono">{division.count} types available</span>
                     <Link
                       to={`/products/${division.name.toLowerCase().replace(/\s+/g, '-')}`}
                       className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500 hover:text-white transition-colors group/cta"
                     >
                       Explore Division
                       <div className="w-6 h-6 rounded-full border border-yellow-500 flex items-center justify-center group-hover/cta:bg-yellow-500 transition-all">
                         <ArrowRight size={10} className="text-yellow-500 group-hover/cta:text-black" />
                       </div>
                     </Link>
                   </div>
                 </div>
               </motion.div>
             );
           })}
         </div>
       </section>

        {/* MANUFACTURING DNA */}
        <section className="py-24 md:py-32 relative bg-[#050505] overflow-hidden border-y border-neutral-900">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-yellow-500/5 blur-[150px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10">
              <SectionReveal>
                <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                   <div className="max-w-2xl">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="h-px w-12 bg-yellow-500"></span>
                        <span className="text-yellow-500 font-mono text-xs uppercase tracking-widest">Manufacturing DNA</span>
                      </div>
                      <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.95]">
                        FROM WIRE TO <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-700">MASTERPIECE.</span>
                      </h2>
                   </div>
                   <p className="text-neutral-400 max-w-md text-sm leading-relaxed mb-2">
                      Buyers don't just buy a product; they buy a process. Here is how we transform premium grade steel into industrial-grade reliability.
                   </p>
                </div>
              </SectionReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[
                    { step: "01", title: "Material Sourcing", desc: "We only procure high-grade C1022 Carbon Steel & Stainless Steel from certified mills. Every batch undergoes spectroscopic analysis.", icon: Layers },
                    { step: "02", title: "Cold Forging", desc: "High-speed CNC headers form the perfect head geometry and drive recess without breaking the metal grain flow.", icon: Hammer },
                    { step: "03", title: "Thread Rolling", desc: "Threads are rolled, not cut. This densifies the material structure, increasing tensile strength by 30% vs standard cutting.", icon: ScanLine },
                    { step: "04", title: "Heat Treatment", desc: "Computer-controlled Carbo-Nitriding furnaces ensure the core is tough while the surface remains diamond-hard.", icon: Thermometer },
                    { step: "05", title: "Surface Engineering", desc: "Advanced Zinc & Phosphate plating lines provide 720+ hours of salt-spray resistance against corrosion.", icon: ShieldCheck },
                    { step: "06", title: "Zero-Defect QC", desc: "Optical sorting machines check dimensions, while our lab tests torque, ductility, and pull-out strength.", icon: FileCheck }
                 ].map((item, i) => (
                    <SectionReveal key={i} delay={i * 0.1}>
                       <motion.div 
                          whileHover={{ y: -10 }}
                          className="group relative p-8 h-full bg-neutral-900/50 border border-neutral-800 hover:border-yellow-500/50 rounded-3xl transition-all duration-300"
                       >
                          <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                          <div className="relative z-10 flex flex-col h-full justify-between">
                             <div>
                                <div className="flex justify-between items-start mb-6">
                                   <div className="p-4 bg-black border border-neutral-800 rounded-2xl text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                                      <item.icon size={28} strokeWidth={1.5} />
                                   </div>
                                   <span className="text-4xl font-black text-neutral-800 group-hover:text-neutral-700 transition-colors select-none">
                                      {item.step}
                                   </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">
                                   {item.title}
                                </h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                   {item.desc}
                                </p>
                             </div>
                             <div className="w-full h-px bg-neutral-800 mt-8 group-hover:bg-yellow-500/50 transition-colors relative">
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-800 rounded-full group-hover:bg-yellow-500 transition-colors" />
                             </div>
                          </div>
                       </motion.div>
                    </SectionReveal>
                 ))}
              </div>
          </div>
        </section>

        {/* JOURNAL */}
        <section className="py-32 relative bg-[#050505] overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <SectionReveal>
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <BookOpen className="text-yellow-500 w-4 h-4" />
                    <span className="text-yellow-500 font-mono text-[10px] uppercase tracking-[0.4em] font-bold">
                      Insights & Innovation
                    </span>
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                    THE <span className="text-yellow-500">JOURNAL.</span>
                  </h2>
                </div>

                <Link
                  to="/blog"
                  className="group flex items-center gap-3 px-8 py-4 border border-white/10 rounded-full text-white font-bold text-xs uppercase tracking-widest hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-all duration-300 flex-shrink-0"
                >
                  View All Posts
                  <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all">
                    <ArrowRight size={11} />
                  </div>
                </Link>
              </div>
            </SectionReveal>

            {blogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {blogs.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      to={`/blog/${post.slug}`}
                      className="group flex flex-col h-full rounded-[2rem] overflow-hidden border border-white/5 bg-neutral-900 hover:border-yellow-500/30 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(234,179,8,0.15)]"
                    >
                      <div className="relative h-56 overflow-hidden flex-shrink-0 bg-neutral-800">
                        {post.image_url ? (
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-white/10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                        {post.category && (
                          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm border border-yellow-500/30 text-yellow-500 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">
                            {post.category}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col flex-1 p-6 gap-4">
                        <h3 className="text-lg font-black text-white leading-snug tracking-tight group-hover:text-yellow-400 transition-colors duration-300 line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2 flex-1">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                          <span className="text-neutral-600 text-[10px] font-mono uppercase tracking-wider">
                            {post.created_at
                              ? new Date(post.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric', month: 'short', year: 'numeric'
                                })
                              : 'Durable Fastener'
                            }
                          </span>
                          <div className="flex items-center gap-1.5 text-yellow-500 text-[10px] font-black uppercase tracking-widest group-hover:gap-3 transition-all duration-300">
                            Read <ArrowRight size={11} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <SectionReveal delay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Why Self-Drilling Screws Are Industry Standard",
                      category: "Technology",
                      read_time: "4 min read",
                      desc: "A deep dive into how SDS screws revolutionized metal-to-metal fastening in roofing and structural work."
                    },
                    {
                      title: "Zinc vs Phosphate Coating — What Lasts Longer?",
                      category: "Manufacturing",
                      read_time: "5 min read",
                      desc: "Understanding corrosion resistance and which surface treatment is right for your application."
                    },
                    {
                      title: "The Complete Guide to Choosing Door Hinges",
                      category: "Fittings",
                      read_time: "6 min read",
                      desc: "From auto-closing to concealed hinges — everything a contractor needs to know before specifying."
                    }
                  ].map((placeholder, i) => (
                    <Link
                      key={i}
                      to="/blog"
                      className="group flex flex-col rounded-[2rem] overflow-hidden border border-white/5 bg-neutral-900 hover:border-yellow-500/30 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(234,179,8,0.15)]"
                    >
                      <div className="relative h-56 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center overflow-hidden">
                        <BookOpen className="w-10 h-10 text-white/15 relative z-10" />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm border border-yellow-500/30 text-yellow-500 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">
                          {placeholder.category}
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 p-6 gap-4">
                        <h3 className="text-lg font-black text-white leading-snug tracking-tight group-hover:text-yellow-400 transition-colors duration-300">
                          {placeholder.title}
                        </h3>
                        <p className="text-neutral-500 text-sm leading-relaxed flex-1">
                          {placeholder.desc}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </SectionReveal>
            )}
          </div>
        </section>

        {/* GLOBAL REACH & CAREERS */}
        <section className="flex flex-col md:flex-row h-auto md:h-[70vh] border-y border-white/10">
          <Link to="/manufacturing" className="flex-1 relative group overflow-hidden border-r border-white/10 bg-[#0a0a0a] min-h-[400px]">
            <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700" alt="Global Shipping" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center z-20">
              <AnimatedGlobalIcon />
              <h3 className="text-5xl font-black text-white tracking-tighter group-hover:text-yellow-400 uppercase">Global OEM</h3>
              <p className="mt-2 text-white/60 uppercase tracking-[0.3em] text-[10px]">Logistics & Export</p>
            </div>
          </Link>
          <Link to="/careers" className="flex-1 relative group overflow-hidden bg-[#0a0a0a] min-h-[400px]">
            <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700" alt="Careers" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center z-20">
              <AnimatedCareerIcon />
              <h3 className="text-5xl font-black text-white tracking-tighter group-hover:text-yellow-400 uppercase">Careers</h3>
              <p className="mt-2 text-white/60 uppercase tracking-[0.3em] text-[10px]">Join the Mission</p>
            </div>
          </Link>
        </section>

        <GoogleReviews />

        {/* FAQ SECTION */}
        <section className="py-32 bg-[#050505] border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-4">
                <SectionReveal>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-5 h-5 rounded-full border border-yellow-500 flex items-center justify-center text-[10px] text-yellow-500 font-bold">?</div>
                    <span className="text-yellow-500 font-mono text-[10px] uppercase tracking-[0.4em] font-bold">Knowledge Base</span>
                  </div>
                  <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-8">
                    FREQUENTLY<br />
                    <span className="text-yellow-500">ASKED.</span>
                  </h2>
                  <p className="text-neutral-500 text-lg mb-10 max-w-sm leading-relaxed">
                    Find detailed answers about our manufacturing process, logistics, and bulk ordering capabilities.
                  </p>
                  <Link to="/contact" className="group flex items-center gap-4 text-white font-bold tracking-widest text-xs uppercase transition-colors hover:text-yellow-500">
                    Still have questions? <ArrowRight className="group-hover:translate-x-2 transition-transform" size={18} />
                  </Link>
                </SectionReveal>
              </div>
              <div className="lg:col-span-8">
                <SectionReveal delay={0.2}>
                  <div className="flex flex-col">
                    {faqs.map((faq, idx) => (
                      <FAQItem 
                        key={idx} 
                        question={faq.q} 
                        answer={faq.a} 
                        isOpen={openFaq === idx} 
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)} 
                      />
                    ))}
                  </div>
                </SectionReveal>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-40 bg-yellow-500 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
              <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="flex whitespace-nowrap">
                  <span className="text-[20vh] font-black mr-20 text-black">DURABLE FASTENERS • </span>
                  <span className="text-[20vh] font-black mr-20 text-black">DURABLE FASTENERS • </span>
              </motion.div>
          </div>
          <div className="relative z-10 container mx-auto px-6">
              <SectionReveal>
                <h2 className="text-7xl md:text-[10vw] font-black tracking-tighter mb-12 text-black leading-none">LET'S BUILD<br/>TOGETHER</h2>
                <div className="flex flex-col md:flex-row justify-center gap-6">
                    <Link to="/contact" className="px-16 py-8 bg-black text-white rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl">START A PROJECT</Link>
                    <Link to="/about" className="px-16 py-8 border-4 border-black text-black rounded-full font-black text-xl hover:bg-black hover:text-white transition-all">OUR STORY</Link>
                </div>
              </SectionReveal>
          </div>
        </section>

      </main>
    </>
  );
};

export default Home;
