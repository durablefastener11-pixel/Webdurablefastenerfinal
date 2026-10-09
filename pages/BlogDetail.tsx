import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Loader, Clock, ChevronRight, CheckCircle2, 
  Facebook, BookOpen, Twitter, Linkedin, Copy, MapPin,
  Phone, Instagram, Youtube
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';

// --- FAQ Item Component ---
const FAQItem = ({ item, index }: { item: any; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-zinc-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-start justify-between text-left group transition-all"
      >
        <div className="flex gap-4">
          <span className="text-yellow-500 font-black text-lg">0{index + 1}.</span>
          <h3 className="text-xl font-bold text-zinc-900 mt-0.5 leading-tight group-hover:text-yellow-600 transition-colors">
            {item.question}
          </h3>
        </div>
        <div className={`mt-1 p-1 rounded-full border border-zinc-200 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-zinc-900 border-zinc-900' : ''}`}>
          <ChevronRight size={18} className={isOpen ? 'text-white' : 'text-zinc-400'} />
        </div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="pb-8 pl-12 pr-6">
          <div 
            className="blog-content-render text-zinc-600 leading-relaxed font-serif text-lg m-0 italic border-l-2 border-yellow-500/30 pl-4 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: item.answer || '' }}
          />
        </div>
      </motion.div>
    </div>
  );
};

const BlogDetail: React.FC = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const summarySection = useMemo(
  () => sections.find(section => section.type === 'summary'),
  [sections]
);

const contentSections = useMemo(
  () => sections.filter(section => section.type !== 'summary'),
  [sections]
);

  // --- WHATSAPP MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ screwName: '', quantity: '', city: '' });

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      const { data } = await supabase.from('blogs').select('*').eq('slug', slug).maybeSingle();
      if (data) {
        setPost(data);
        try {
          const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          setSections(Array.isArray(parsed) ? parsed : [{ type: 'text', heading: 'Introduction', body: data.content }]);
        } catch {
          setSections([{ type: 'text', heading: 'Overview', body: data.content }]);
        }
      }
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  // --- WHATSAPP SUBMIT HANDLER ---
  const handleWhatsAppShare = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneNumber = "918758700704"; 
    const message = `*Inquiry from Durable Fastener Website*%0A%0A` +
                    `*Screw Name:* ${formData.screwName}%0A` +
                    `*Quantity:* ${formData.quantity}%0A` +
                    `*City:* ${formData.city}`;
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    setIsModalOpen(false);
  };

  const toc = useMemo(() => {
    return sections
      .filter(s => s.heading || s.type === 'heading2' || s.type === 'heading3')
      .map(s => {
        const rawText = s.heading || s.body || '';
        return rawText.replace(/<\/?[^>]+(>|$)/g, "").trim();
      });
  }, [sections]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
        <Loader className="text-yellow-600" size={32} />
      </motion.div>
    </div>
  );

  return (
    <div className="bg-[#FCFCFC] min-h-screen font-sans text-zinc-900 selection:bg-yellow-200">
      
      {/* 🔥 INJECTED STYLE SHEET (STRICT FORMATTING FIX) 🔥 */}
      <style>{`
        .blog-content-render b, .blog-content-render strong { font-weight: 800 !important; color: #18181b !important; }
        .blog-content-render i, .blog-content-render em { font-style: italic !important; }
        .blog-content-render u { text-decoration: underline !important; }
        .blog-content-render s { text-decoration: line-through !important; }
        .blog-content-render a { color: #2563eb !important; text-decoration: underline !important; font-weight: 600 !important; }
        
        .blog-content-render p, .blog-content-render div {
          margin-bottom: 1.5rem !important;
          display: block;
        }
        .blog-content-render p:last-child, .blog-content-render div:last-child {
          margin-bottom: 0 !important;
        }
/* 🔥 NAYA CODE: SUMMARY TEXT FORCE WHITE 🔥 */
        .summary-content-render, .summary-content-render * { 
          color: #ffffff !important; 
        }

      `}</style>

         <Helmet>
  {/* Title */}
  <title>{post ? `${post.title} | Durable Fastener` : 'Durable Fastener Blog'}</title>

  {/* Dynamic Meta Description */}
  <meta 
    name="description" 
    content={
      post?.meta_description || 
      "Explore expert insights, technical guides, and industry updates on high-precision manufacturing and industrial fasteners from Durable Fastener."
    } 
  />

  {/* Dynamic Canonical Link */}
  {/* window.location.origin se aapki base domain dynamically fetch ho jayegi (e.g., https://yourwebsite.com) */}
  <link 
    rel="canonical" 
    href={`${typeof window !== 'undefined' ? window.location.origin : 'https://www.durablefastener.com'}/blog/${slug}`} 
  />
</Helmet>


      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-yellow-500 origin-left z-[250]" style={{ scaleX }} />

      <nav className="fixed top-48 w-full z-[200] px-4 md:px-72 py-3 flex justify-between items-center transition-all">
        <Link to="/blog" className="group flex items-center gap-2">
          <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100 group-hover:bg-zinc-900 transition-all duration-300">
            <ArrowLeft size={14} className="group-hover:text-yellow-500 transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-white transition-colors">Back to Lab</span>
          </div>
        </Link>
      </nav>

      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <aside className="hidden lg:block lg:col-span-3 pt-48 sticky top-0 h-screen overflow-y-auto pb-10 scrollbar-hide">
          <div className="flex flex-col items-start gap-16">
            <div className="flex flex-col items-center w-fit">
              <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-8">Follow Us</p>
              <div className="flex flex-col gap-4">
                {[
                  { Icon: Linkedin, url: "https://www.linkedin.com/company/durable-fastener/", color: "hover:text-blue-600" },
                  { Icon: Facebook, url: "https://www.facebook.com/durablefastener", color: "hover:text-blue-500" },
                  { Icon: Instagram, url: "https://www.instagram.com/durablefastener/", color: "hover:text-pink-500" },
                  { Icon: Youtube, url: "https://www.youtube.com/@durablefastener-rajkot", color: "hover:text-red-600" }
                ].map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 flex items-center justify-center border border-zinc-100 rounded-full bg-white shadow-sm transition-all duration-300 ${item.color} hover:border-zinc-900 hover:shadow-md hover:-translate-y-1`}>
                    <item.Icon size={16} className="text-zinc-400" />
                  </a>
                ))}
              </div>
            </div>

            {toc.length > 0 && (
              <div className="w-full">
                <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-8">Contents</p>
                <div className="flex flex-col gap-6">
                  {toc.map((item, i) => (
                    <a key={i} href={`#section-${i}`} className="group flex gap-3 items-start text-[10px] font-bold text-zinc-400 hover:text-yellow-600 transition-all leading-tight">
                      <span className="text-zinc-200 tabular-nums">0{i+1}.</span>
                      <span className="line-clamp-2 uppercase tracking-wide">{item}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <article className="lg:col-span-8 pt-48 pb-32">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-yellow-400/10 text-yellow-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-md border border-yellow-400/20">
                {post?.category || 'Technical Guide'}
              </span>
              <div className="h-1 w-1 rounded-full bg-zinc-300" />
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                <Clock size={12} /> 5 Min Read
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-10 text-zinc-900">
              {post?.title}
            </h1>

            {post?.image_url && (
              <div className="mb-12 overflow-hidden rounded-[2.5rem] shadow-2xl border border-zinc-100">
                <img src={post.image_url} alt={post.title} className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700" />
              </div>
            )}

            <div className="flex items-center gap-4 py-6 border-y border-zinc-100">
              <div className="w-12 h-12 rounded-full border border-zinc-100 overflow-hidden bg-white flex items-center justify-center shadow-sm">
                <img src="/logo.png" alt="Durable Fastener Logo" className="w-9 h-9 object-contain" onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=DF&background=18181b&color=eab308"; }} />
              </div>
              <div>
                <p className="text-sm font-black text-zinc-900">Durable Editorial Team</p>
                <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-400">
                  <span>{new Date(post?.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider"><MapPin size={10} /> Rajkot, India</span>
                </div>
              </div>
            </div>
          </header>

          <main className="prose prose-zinc prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight">
            {summarySection && (
  <div className="relative mb-16 p-10 bg-[#0a0a0a] rounded-[32px] shadow-2xl border border-yellow-500/20">

    <div className="flex items-center gap-3 mb-6">
      <div className="h-[2px] w-8 bg-yellow-500" />

      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500">
        EXECUTIVE SUMMARY
      </span>
    </div>

    <div
      className="summary-content-render"
      style={{
        fontFamily: "'Georgia', serif",
        fontSize: "20px",
        lineHeight: "1.6",
        fontStyle: "italic"
      }}
      dangerouslySetInnerHTML={{
        __html: summarySection.body || ''
      }}
    />
  </div>
)}
            {contentSections.map((section, idx) => {
              const sectionId = `section-${idx}`;
              switch (section.type) {
                // 🔥 FIXED HEADING 2 (Solves &amp; Issue) 🔥
                case 'heading2':
                  return <h2 key={idx} id={sectionId} className="text-3xl md:text-4xl font-bold text-zinc-900 mt-20 mb-8 border-b-4 border-yellow-500 pb-4" dangerouslySetInnerHTML={{ __html: section.body || '' }} />;
                
                // 🔥 FIXED HEADING 3 (Solves &amp; Issue) 🔥
                case 'heading3':
                  return <h3 key={idx} id={sectionId} className="text-2xl font-bold text-zinc-800 mt-12 mb-6" dangerouslySetInnerHTML={{ __html: section.body || '' }} />;
                
                case 'table':
                  return (
                    <div key={idx} id={sectionId} className="my-10 overflow-x-auto">
                      {section.heading && <h3 className="text-xl font-bold text-zinc-900 mb-4">{section.heading}</h3>}
                      <table className="w-full border-collapse rounded-xl overflow-hidden shadow-lg border border-zinc-200">
                        <thead>
                          <tr className="bg-zinc-900 text-yellow-500 uppercase text-[10px] font-black tracking-[0.2em]">
                            {section.headers?.map((h: string, i: number) => <th key={i} className="px-6 py-4 text-left border border-zinc-800">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows?.map((row: string[], ri: number) => (
                            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                             {row.map((cell: string, ci: number) => (
                                <td 
                                  key={ci} 
                                  className="blog-content-render px-6 py-4 text-sm text-zinc-600 border border-zinc-100"
                                  dangerouslySetInnerHTML={{ __html: cell || '' }}
                                />
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );

                

                case 'faq':
                  return (
                    <div key={idx} id={sectionId} className="my-20 bg-white border border-zinc-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
                      <div className="flex items-center gap-4 mb-10">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                          <BookOpen className="text-black" size={20} />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 m-0">
                          {section.heading || 'FAQ Section'}
                        </h2>
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {section.faqItems?.map((item: any, fIdx: number) => <FAQItem key={fIdx} item={item} index={fIdx} />)}
                      </div>
                    </div>
                  );

                case 'split':
                  return (
                    <div key={idx} id={sectionId} className="block my-12 overflow-hidden">
                      <div className={`mb-12 ${section.splitLayout === 'left-image' ? 'md:float-left md:mr-10' : 'md:float-right md:ml-10'} w-full md:w-1/2 lg:w-2/5`}>
                        <img src={section.splitImage || ''} alt="" className="w-full rounded-2xl shadow-xl object-cover border border-zinc-100" />
                        {section.caption && <p className="mt-3 text-sm text-zinc-400 italic font-serif text-center md:text-left">— {section.caption}</p>}
                      </div>
                      {/* 🔥 FIXED SPLIT TEXT CONTENT 🔥 */}
                      <div 
                        className="blog-content-render text-lg leading-[1.8] text-zinc-600 font-serif mb-6 text-justify whitespace-pre-wrap" 
                        dangerouslySetInnerHTML={{ __html: section.splitContent || '' }} 
                      />
                      <div className="clear-both"></div>
                    </div>
                  );

                case 'image':
                  return (
                    <figure key={idx} className="my-12 text-center">
                      <img src={section.imageUrl} alt={section.caption} className="w-full h-auto object-contain border-4 border-zinc-900 bg-zinc-900" />
                      {section.caption && <figcaption className="mt-4 text-sm text-zinc-400 italic font-serif">— {section.caption}</figcaption>}
                    </figure>
                  );

                // 🔥 FIXED DEFAULT PARAGRAPH RENDERER (Solves Bold/Underline breaking) 🔥
                default:
                  return (
                    <section key={idx} id={sectionId} className="mb-12">
                      {section.heading && <h2 className="text-2xl font-bold text-zinc-900 mb-6">{section.heading}</h2>}
                      <div 
                        className="blog-content-render text-lg leading-[1.8] text-zinc-600 font-serif font-light whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: section.body || '' }}
                      />
                    </section>
                  );
              }
            })}
          </main>
        </article>
      </div>

      <footer className="max-w-6xl mx-auto px-6 mb-32">
        <div className="bg-zinc-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.1),transparent)]" />
          <div className="relative z-10 flex flex-col items-center">
            <CheckCircle2 className="text-yellow-500 mb-8" size={48} />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Built for Industrial Strength</h2>
            <p className="text-zinc-400 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
              Join 500+ global partners who trust Durable Fastener for high-precision manufacturing.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <a href="tel:+918758700704" className="flex items-center justify-center gap-2 bg-yellow-500 text-black font-black px-12 py-5 rounded-full text-[10px] uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-xl shadow-yellow-500/20 w-full sm:w-auto">
                <Phone size={18} />
                <span>Engineering</span>
              </a>
              <button onClick={() => setIsModalOpen(true)} className="bg-yellow-500 text-black font-black px-12 py-5 rounded-full text-[10px] uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-xl shadow-yellow-500/20 w-full sm:w-auto">
                Request Samples
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* --- WHATSAPP REQUEST MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl z-10">
              <h2 className="text-2xl font-bold text-white mb-2">Request Samples</h2>
              <p className="text-zinc-400 text-sm mb-8 font-serif italic">Get high-precision industrial samples delivered to your facility.</p>
              <form onSubmit={handleWhatsAppShare} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-yellow-500 block mb-2">Requirement Screw Name</label>
                  <input required type="text" placeholder="e.g. Drywall Screw Phillips Head" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all" onChange={(e) => setFormData({...formData, screwName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-yellow-500 block mb-2">Quantity</label>
                    <input required type="text" placeholder="e.g. 5000 Pcs" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all" onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-yellow-500 block mb-2">City</label>
                    <input required type="text" placeholder="e.g. Rajkot" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all" onChange={(e) => setFormData({...formData, city: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-yellow-500/10">Submit Inquiry to WhatsApp</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogDetail;
