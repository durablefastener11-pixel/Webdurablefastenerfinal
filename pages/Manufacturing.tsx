import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Factory, Anvil, Flame, Layers, Microscope, Truck, 
  ShieldCheck, CheckCircle2, Package, Settings, 
  Activity, ArrowRight, ArrowDown, ArrowLeft, FileCheck, Scale, Play, Video,
  Globe, Instagram, X
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
const formatMediaUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  return url; // Uses the full public URL from your Supabase storage
};
// =========================================
// 0. SMART ASSET URL HELPER (R2 Redirect)
// =========================================
const cleanImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  const R2_BASE = "https://pub-ffd0eb07a99540ac95c35c521dd8f7ae.r2.dev";
  
  // If already R2, return as-is
  if (url.startsWith(R2_BASE)) return url;
  
  // If it's a full URL (Supabase/External), extract filename and point to R2
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const fileName = url.split('/').pop(); 
    return `${R2_BASE}/${fileName}`;
  }
  
  // Relative path → prepend R2
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${R2_BASE}/${cleanPath}`;
};

// =========================================
// 1. REUSABLE ANIMATION COMPONENT
// =========================================
const RevealOnScroll: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ 
  children, 
  delay = 0, 
  className = "" 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// =========================================
// 2. MAIN MANUFACTURING PAGE
// =========================================
const Manufacturing: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [instaPosts, setInstaPosts] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      const { data, error } = await supabase
        .from('manufacturing_content')
        .select('*')
        .eq('id', 1) 
        .single();
        
      if (error) console.error("Error loading factory data:", error);
      if (data) setData(data);
    };

    const fetchInstagram = async () => {
      // Note: In production, store this token in an environment variable or backend
      const token = 'IGAAU5AY4ShC1BZAGE2b0NfQ0t2TjhoTzN5OExhRUZAjU1VWZAG1DN3B1NDB2SDAybXl6UjFZAcFV6blYwYkQ4bGN5UHJ1QlczblpybjlPYV9BY1VjeTZAnWXRJUnViWFlZAZA2JyUjFMWWNNZAUxOLXR3UjdPS0E5ZAFNvRkZA0WTFhYW1TdwZDZD'; 
      try {
       const res = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_url,thumbnail_url,permalink,media_type&limit=8&access_token=${token}`);
        const json = await res.json();
        if (json.data) setInstaPosts(json.data);
      } catch (err) {
        console.error("Instagram Error:", err);
      }
    };

    loadContent();
    fetchInstagram();
  }, []);

  const steps = [
    { id: "01", title: "Raw Material Inspection", icon: FileCheck },
    { id: "02", title: "Wire Drawing & Annealing", icon: Activity },
    { id: "03", title: "Cold Heading (Forging)", icon: Anvil },
    { id: "04", title: "Thread Rolling", icon: Settings },
    { id: "05", title: "Heat Treatment", icon: Flame },
    { id: "06", title: "Surface Coating", icon: Layers },
    { id: "07", title: "Optical Sorting", icon: Microscope },
    { id: "08", title: "Packing & Dispatch", icon: Truck },
  ];

  const getGridPosition = (index: number) => {
    const positions = [
      "md:col-start-1 md:row-start-1",
      "md:col-start-2 md:row-start-1",
      "md:col-start-3 md:row-start-1",
      "md:col-start-4 md:row-start-1",
      "md:col-start-4 md:row-start-2",
      "md:col-start-3 md:row-start-2",
      "md:col-start-2 md:row-start-2",
      "md:col-start-1 md:row-start-2",
    ];
    return positions[index];
  };

  return (
    <div className="bg-white min-h-screen pt-18 font-sans text-slate-800 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      <Helmet>
        <title>Fastener Manufacturing Factory in Rajkot | Durable Fastener</title>
        <style>
          {`
            html, body { max-width: 100%; overflow-x: hidden; }
            h1, h2, h3, h4, p, span { overflow-wrap: break-word; word-wrap: break-word; hyphens: auto; }
          `}
        </style>
      </Helmet>

      {/* ================= 1. HERO SECTION ================= */}
      <section className="relative py-32 md:py-56 bg-slate-900 overflow-hidden px-4 flex items-center justify-center min-h-[80vh]">
        {data?.hero_video_url && (
          <video 
            key={data.hero_video_url} 
            autoPlay loop muted playsInline 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            src={formatMediaUrl(data.hero_video_url)}
          />
        )}
        
        {/* Centered Dark Overlay */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          <RevealOnScroll>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-black mb-8 uppercase tracking-[0.2em]">
              <Globe size={14} /> Global Supply Chain Hub
            </div>

            {/* Main Title */}
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-black text-white mb-8 leading-[0.9] tracking-tighter uppercase">
              {data?.hero_title || "PRODUCTION EXCELLENCE"}
            </h1>

            {/* Subtitle (Border removed and centered) */}
            <p className="text-lg md:text-2xl text-slate-200 mb-10 font-medium max-w-2xl mx-auto leading-relaxed">
              {data?.hero_subtitle || "High-precision manufacturing ecosystem with Total Quality Supervision."}
            </p>

            {/* Visual Accent */}
            <div className="w-24 h-1.5 bg-blue-600 mx-auto rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)]"></div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ================= 2. MANUFACTURING OVERVIEW ================= */}
   <section className="py-24 px-6 bg-slate-50">
        <RevealOnScroll>
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">
                  {data?.overview_title || "Built for Scale & Precision"}
                </h2>
                <div 
                  className="text-xl md:text-2xl text-slate-600 leading-relaxed font-normal [&>strong]:text-blue-600 [&>strong]:font-bold"
                  dangerouslySetInnerHTML={{ __html: data?.overview_desc }} 
                />
            </div>
        </RevealOnScroll>
      </section>

      {/* ================= 3. VIRTUAL FACTORY TOUR ================= */}
     <section className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <RevealOnScroll><h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-12">Production Floor</h2></RevealOnScroll>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: data?.video1_title, sub: data?.video1_sub, media: data?.video1_img },
              { title: data?.video2_title, sub: data?.video2_sub, media: data?.video2_img },
              { title: data?.video3_title, sub: data?.video3_sub, media: data?.video3_img }
            ].map((item, index) => (
              <RevealOnScroll key={index} delay={index * 150}>
                <div 
                  onClick={() => item.media && setActiveVideo(formatMediaUrl(item.media))} 
                  className="group relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-xl cursor-pointer border-4 border-white transition-transform hover:scale-[1.02]"
                >
                  {item.media?.match(/\.(mp4|webm|mov)$/i) ? (
                    <video src={formatMediaUrl(item.media)} className="absolute inset-0 w-full h-full object-cover opacity-70" muted loop autoPlay playsInline />
                  ) : (
                    <img src={formatMediaUrl(item.media)} className="absolute inset-0 w-full h-full object-cover opacity-70" alt={item.title} />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Play fill="currentColor" size={28} />
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-slate-900 to-transparent">
                    <p className="text-white font-bold text-xl">{item.title}</p>
                    <p className="text-sm text-blue-300">{item.sub}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 4. COMPLETE MANUFACTURING FLOW ================= */}
      <section className="py-24 bg-white overflow-hidden">
         <div className="max-w-7xl mx-auto px-6">
            <RevealOnScroll>
                <div className="text-center mb-24">
                   <h2 className="text-blue-600 font-bold uppercase tracking-[0.2em] text-sm mb-3">The Process</h2>
                   <h3 className="text-4xl md:text-5xl font-black text-slate-900">End-to-End Production Flow</h3>
                   <div className="w-24 h-1.5 bg-blue-600 mx-auto mt-6 rounded-full"></div>
                </div>
            </RevealOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-12 gap-y-20 relative">
                {steps.map((step, i) => (
                  <div key={i} className={`relative ${getGridPosition(i)}`}>
                      <RevealOnScroll delay={i * 100} className="h-full z-10 relative">
                          <div className="bg-white border-2 border-blue-100 p-8 rounded-3xl relative group hover:border-blue-400 hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)] transition-all duration-300 h-full flex flex-col items-center text-center z-20">
                             <span className="absolute top-5 right-6 text-4xl font-black text-blue-200 group-hover:text-blue-500 transition-colors">
                               {step.id}
                             </span>
                             <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                <step.icon size={36} strokeWidth={1.5} />
                             </div>
                             <h4 className="text-slate-900 font-bold text-lg leading-snug">{step.title}</h4>
                          </div>
                      </RevealOnScroll>

                      {/* DESKTOP CONNECTORS */}
                      {[0, 1, 2].includes(i) && (
                        <div className="hidden md:flex absolute -right-12 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-12">
                          <div className="absolute -top-3 bg-blue-500 text-white text-[10px] font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-md z-20 border-2 border-white">QC</div>
                          <ArrowRight size={44} strokeWidth={1} className="text-blue-300" />
                        </div>
                      )}
                      {i === 3 && (
                        <div className="hidden md:flex flex-col items-center absolute -bottom-16 left-1/2 -translate-x-1/2 z-10 h-16 justify-center">
                          <div className="absolute top-2 left-4 bg-blue-500 text-white text-[10px] font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-md z-20 border-2 border-white">QC</div>
                          <ArrowDown size={44} strokeWidth={1} className="text-blue-300" />
                        </div>
                      )}
                      {[4, 5, 6].includes(i) && (
                        <div className="hidden md:flex absolute -left-12 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-12">
                          <div className="absolute -top-3 bg-blue-500 text-white text-[10px] font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-md z-20 border-2 border-white">QC</div>
                          <ArrowLeft size={44} strokeWidth={1} className="text-blue-300" />
                        </div>
                      )}

                      {/* MOBILE CONNECTORS */}
                      {i !== steps.length - 1 && (
                        <div className="md:hidden absolute -bottom-14 left-1/2 -translate-x-1/2 text-blue-300 flex flex-col items-center z-0">
                           <div className="bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">QC Check</div>
                           <ArrowDown size={24} />
                        </div>
                      )}
                  </div>
                ))}
            </div>
         </div>
      </section>

      {/* ================= 5. VIDEO MODAL ================= */}
     {activeVideo && (
        <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4 md:p-10 backdrop-blur-md" onClick={() => setActiveVideo(null)}>
          <button onClick={() => setActiveVideo(null)} className="absolute top-6 right-6 text-white hover:text-blue-500 transition-colors z-[1001]">
            <X size={48} strokeWidth={3} />
          </button>
          <div className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)] relative" onClick={(e) => e.stopPropagation()}>
            <video src={activeVideo} className="w-full h-full object-contain" controls autoPlay />
          </div>
        </div>
      )}
      {/* ================= 6. RAW MATERIAL ================= */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-slate-50">
          <RevealOnScroll>
              <div className="max-w-7xl mx-auto bg-slate-900 rounded-3xl md:rounded-[2.5rem] overflow-hidden border border-slate-800">
                <div className="grid md:grid-cols-2">
                   <div className="p-6 sm:p-10 md:p-16">
                      <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Raw Material Integrity</h2>
                      <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                          Quality starts with the wire. We source from mills like <span className="text-white font-bold border-b-2 border-blue-600">JSW, TATA Steel</span>.
                      </p>
                      <ul className="space-y-4">
                          {["Grade Control: C1022, C1010, C1008, C1018, SS204, SS316, SS304", "Full Chemical Traceability", "Incoming Wire Testing Lab"].map((item, i) => (
                              <li key={i} className="flex items-start gap-3 text-slate-300 font-medium text-sm md:text-base">
                                  <CheckCircle2 className="text-blue-400 shrink-0 mt-0.5" size={20}/> 
                                  <span className="break-words">{item}</span>
                              </li>
                          ))}
                      </ul>
                   </div>
                   <div className="relative h-64 md:h-auto">
                       <img src={cleanImageUrl('RAW.jpeg')} alt="Raw material" className="absolute inset-0 w-full h-full object-cover opacity-60"/>
                   </div>
                </div>
              </div>
          </RevealOnScroll>
      </section>

      {/* ================= 7. HEAT TREATMENT & COATING ================= */}
      <section className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8 md:gap-12">
            <RevealOnScroll delay={0}>
                <div className="relative p-10 md:p-12 bg-white rounded-[2rem] border border-slate-200 overflow-hidden group h-full shadow-sm hover:shadow-xl transition-all">
                   <div className="relative z-10">
                       <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:bg-blue-600 transition-colors"><Flame size={32} /></div>
                       <h3 className="text-3xl font-black text-slate-900 mb-4">Heat Treatment Facility</h3>
                       <p className="text-lg text-slate-600 mb-8 leading-relaxed">Heat treatment ensures uniform hardness and mechanical properties across every batch.</p>
                       <ul className="space-y-3 text-slate-700 font-semibold">
                          <li className="flex gap-3"><span className="text-blue-600">✔</span> Continuous Mesh Belt Furnaces</li>
                          <li className="flex gap-3"><span className="text-blue-600">✔</span> Material Range: 8.8, 10.9, 12.9 Grade</li>
                       </ul>
                   </div>
                </div>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
                <div className="relative p-10 md:p-12 bg-white rounded-[2rem] border border-slate-200 overflow-hidden group h-full shadow-sm hover:shadow-xl transition-all">
                   <div className="relative z-10">
                       <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:bg-blue-600 transition-colors"><Layers size={32} /></div>
                       <h3 className="text-3xl font-black text-slate-900 mb-4">Surface Coating & Finishing</h3>
                       <p className="text-lg text-slate-600 mb-8 leading-relaxed">Advanced plating lines delivering aesthetic finish and high corrosion resistance.</p>
                       <ul className="space-y-3 text-slate-700 font-semibold">
                          <li className="flex gap-3"><span className="text-blue-600">✔</span> Zinc (blue, yellow, black)</li>
                          <li className="flex gap-3"><span className="text-blue-600">✔</span> Black Phosphate & Oil</li>
                       </ul>
                   </div>
                </div>
            </RevealOnScroll>
         </div>
      </section>

      {/* ================= 8. QUALITY CONTROL & CAPACITY ================= */}
     <section className="py-16 md:py-24 px-4 md:px-6 bg-slate-50">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-16">
            <div className="flex flex-col justify-center">
               <RevealOnScroll><h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 md:mb-10 border-b-4 border-blue-600 inline-block">Quality Lab</h2></RevealOnScroll>
               <div className="grid gap-4 md:gap-6">
                   {[
                       { id: "1", title: "Incoming Check", desc: "Spectro analysis of wire rod." },
                       { id: "2", title: "In-Process QC", desc: "Hourly dimension checks." },
                   ].map((qc, i) => (
                       <RevealOnScroll key={i} delay={i * 100}>
                           <div className="bg-white p-5 md:p-8 rounded-2xl border border-slate-200 flex gap-4 md:gap-6">
                               <div className="h-10 w-10 md:h-14 md:w-14 bg-slate-900 rounded-full flex items-center justify-center text-white font-black shrink-0">{qc.id}</div>
                               <div><h4 className="text-slate-900 font-bold text-lg md:text-xl mb-1">{qc.title}</h4><p className="text-slate-500 text-sm md:text-base">{qc.desc}</p></div>
                           </div>
                       </RevealOnScroll>
                   ))}
               </div>
            </div>

            <div className="bg-slate-900 p-6 sm:p-10 rounded-3xl md:rounded-[2.5rem] shadow-2xl">
               <RevealOnScroll><h2 className="text-3xl md:text-4xl font-black text-white mb-8 md:mb-10">Production Capacity</h2></RevealOnScroll>
               <div className="grid grid-cols-2 gap-3 md:gap-6">
                  {[
                    {l:"Monthly Output", v:"50 TONS+"},
                    {l:"Shift System", v:"24/7 Ops"},
                    {l:"Expansion", v:"Ready Infra"},
                    {l:"Lead Time", v:"Quick Turn"}
                  ].map((stat, i) => (
                      <RevealOnScroll key={i} delay={i * 100}>
                          <div className="p-4 md:p-8 bg-slate-800/50 rounded-xl md:rounded-2xl border border-slate-700 h-full flex flex-col justify-center hover:bg-slate-800 transition-all">
                             <p className="text-blue-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2">{stat.l}</p>
                             <p className="text-xl sm:text-2xl md:text-4xl font-black text-white leading-tight">{stat.v}</p>
                          </div>
                      </RevealOnScroll>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* ================= 9. INSTAGRAM FEED ================= */}
     {/* ================= 9. INSTAGRAM FEED ================= */}
<section className="py-24 bg-white border-t border-slate-100">
  <div className="max-w-7xl mx-auto px-6">
    <RevealOnScroll>
      <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-3 flex items-center justify-center md:justify-start gap-2">
            <Instagram size={18} /> Live from Rajkot Factory
          </h2>
          <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Our Social Media Journey</h3>
        </div>
        <a href="https://instagram.com/durablefastener" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg">
          Follow @durablefastener <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </RevealOnScroll>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {instaPosts.length > 0 ? instaPosts.map((post, index) => {
        // Use thumbnail_url if available (for videos), otherwise fallback to media_url
        const displayImage = post.thumbnail_url || post.media_url;

        return (
          <RevealOnScroll key={post.id} delay={index * 100}>
            <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square bg-slate-100 rounded-[2rem] overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all shadow-sm">
              {displayImage ? (
                <img 
                  src={displayImage} 
                  alt={post.caption || "Factory Update"} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                  Preview Unavailable
                </div>
              )}

              {/* Video Play Icon Overlay */}
              {post.media_type === 'VIDEO' && (
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full text-white shadow-md">
                  <Play size={16} fill="white" />
                </div>
              )}

              {/* Caption Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                <p className="text-white text-xs font-medium line-clamp-2">{post.caption || "View on Instagram"}</p>
              </div>
            </a>
          </RevealOnScroll>
        );
      }) : (
        [...Array(4)].map((_, i) => (
          <div key={i} className="aspect-square bg-slate-100 rounded-[2rem] animate-pulse"></div>
        ))
      )}
    </div>
  </div>
</section>
      {/* ================= 10. USP & CTA ================= */}
      <section className="py-24 px-6 bg-slate-50 text-center border-t border-slate-200">
         <div className="max-w-5xl mx-auto">
            <RevealOnScroll><h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-12">Why Durable Fasteners?</h2></RevealOnScroll>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 text-left">
                {[
                  { t: "Strategic Production", d: "Managed manufacturing ecosystem." },
                  { t: "Consistent Quality", d: "Repeatable precision." },
                  { t: "On-Time Delivery", d: "Committed to schedules." },
                  { t: "OEM Focus", d: "Industrial supply chains." }
                ].map((usp, i) => (
                  <RevealOnScroll key={i} delay={i * 100}>
                      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm h-full hover:-translate-y-2 transition-transform duration-300">
                         <h4 className="text-slate-900 font-bold text-lg mb-2">{usp.t}</h4>
                         <p className="text-slate-500 text-sm font-medium">{usp.d}</p>
                      </div>
                  </RevealOnScroll>
                ))}
            </div>
            <RevealOnScroll delay={300}>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                   <Link to="/contact" className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold px-12 py-6 rounded-2xl shadow-xl shadow-blue-600/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3">
                      Start OEM Manufacturing <ArrowRight />
                   </Link>
                   <a
                       href="https://wa.me/918758700709?text=Hi%20Durable%20Fastener,%20I%20want%20to%20request%20your%20Capability%20Sheet."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white border-2 border-slate-200 hover:border-slate-900 text-slate-900 text-xl font-bold px-12 py-6 rounded-2xl transition-all hover:-translate-y-1 flex items-center justify-center"
                    >
                       Request Capability Sheet
                   </a>
                </div>
            </RevealOnScroll>
         </div>
      </section>
    </div>
  );
};

export default Manufacturing;
