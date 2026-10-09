import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Save, Plus, Trash2, ArrowLeft, Upload, X, Layout,
  Table as TableIcon, Type, Quote, Image as ImageIcon,
  List, Code, Minus, AlertCircle, Eye, EyeOff,
  Zap, Heading1, Heading2, Grid, Link as LinkIcon, Loader2,
  BookOpen, GripVertical, HelpCircle
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';

// ─── UTILS ──────────────────────────────────────────────────────────────────

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const genId = () => Math.random().toString(36).slice(2, 9);

// ─── GLOBAL SELECTION TRACKER ───────────────────────────────────────────────
let globalSavedRange: Range | null = null;

export const cacheGlobalSelection = () => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    globalSavedRange = selection.getRangeAt(0).cloneRange();
  }
};

// ─── GLOBAL RIBBON TOOLBAR (COMPLETE & ERROR-FREE) ──────────────────────────
export const GlobalToolbar = () => {
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);

  const fonts = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Calibri', value: "'Calibri', sans-serif" },
    { name: 'Georgia', value: "'Georgia', serif" },
    { name: 'Times New Roman', value: "'Times New Roman', serif" },
    { name: 'Playfair Display', value: "'Playfair Display', serif" },
    { name: 'Monospace', value: 'monospace' }
  ];

  const sizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];

  const colorPalette = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#cc0202', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd'
  ];

  const triggerGlobalSync = () => {
    window.dispatchEvent(new Event('sync-editor-content'));
  };

  const handleColorClick = (property: string, colorValue: string) => {
    const selection = window.getSelection();
    if (globalSavedRange) {
      selection?.removeAllRanges();
      selection?.addRange(globalSavedRange);
    }

    if (!selection || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);

    const extractStylesAndClean = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.style.getPropertyValue(property)) {
          element.style.removeProperty(property);
        }
        if (element.tagName === 'SPAN' && !element.style.cssText) {
          const parent = element.parentNode;
          while (element.firstChild) {
            parent?.insertBefore(element.firstChild, element);
          }
          parent?.removeChild(element);
        }
      }
      node.childNodes.forEach(extractStylesAndClean);
    };

    const fragment = range.extractContents();
    extractStylesAndClean(fragment);

    const span = document.createElement('span');
    span.style.setProperty(property, colorValue);
    span.appendChild(fragment);
    range.insertNode(span);

    triggerGlobalSync();
    
    globalSavedRange = range.cloneRange();
    setShowColorMenu(false);
    setShowBgMenu(false);
  };

  const applyCustomSpanStyle = (property: string, value: string) => {
    const selection = window.getSelection();
    if (globalSavedRange) {
      selection?.removeAllRanges();
      selection?.addRange(globalSavedRange);
    }

    if (!selection || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.setProperty(property, value);

    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
    } catch (e) {
      document.execCommand(property === 'color' ? 'foreColor' : 'backColor', false, value);
    }

    triggerGlobalSync();
    if (range) globalSavedRange = range.cloneRange();
  };

  const applyInlineStyle = (command: string, value: string = '') => {
    const selection = window.getSelection();
    if (globalSavedRange) {
      selection?.removeAllRanges();
      selection?.addRange(globalSavedRange);
    }
    document.execCommand(command, false, value);
    triggerGlobalSync();
  };

  const applyIncrementalFontSize = (multiplier: number) => {
    const selection = window.getSelection();
    if (globalSavedRange) {
      selection?.removeAllRanges();
      selection?.addRange(globalSavedRange);
    }
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer.parentElement;
    
    let currentSize = 16; 
    if (container) {
      const computedStyle = window.getComputedStyle(container).fontSize;
      currentSize = parseInt(computedStyle) || 16;
    }

    const newSize = `${currentSize + (multiplier * 2)}px`;
    applyCustomSpanStyle('font-size', newSize);
  };

  const addLink = () => {
    const selection = window.getSelection();
    let existingUrl = "";
    if (selection && selection.anchorNode) {
      const parent = selection.anchorNode.parentElement;
      if (parent && parent.tagName === 'A') existingUrl = parent.getAttribute('href') || "";
    }

    const url = window.prompt("Edit URL:", existingUrl);
    if (url !== null) {
      document.execCommand('createLink', false, url);
      const newSelection = window.getSelection();
      if (newSelection && newSelection.anchorNode) {
        const newParent = newSelection.anchorNode.parentElement;
        if (newParent && newParent.tagName === 'A') {
          newParent.setAttribute('target', '_blank');
          newParent.setAttribute('rel', 'noopener noreferrer');
        }
      }
      triggerGlobalSync();
    }
  };
  const removeLink = () => {
    const selection = window.getSelection();
    if (globalSavedRange) {
      selection?.removeAllRanges();
      selection?.addRange(globalSavedRange);
    }
    if (!selection || selection.isCollapsed) return;

    document.execCommand('unlink', false);
    triggerGlobalSync();
  };

  return (
    <div className="flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200 shadow-sm mx-auto select-none flex-wrap z-50">
      
      {/* 1. FONT STYLE DROPDOWN */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            cacheGlobalSelection();
            setShowFontMenu(!showFontMenu);
            setShowSizeMenu(false);
            setShowColorMenu(false);
            setShowBgMenu(false);
          }}
          className="flex items-center justify-between text-[11px] font-bold bg-white border border-zinc-200 rounded-md px-2 py-1 min-w-[100px] text-zinc-700 hover:bg-zinc-50"
        >
          <span>Font Style</span>
          <span className="text-[9px] text-zinc-400 ml-1">▼</span>
        </button>
        
        {showFontMenu && (
          <div className="absolute left-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl py-1 z-[999] min-w-[140px] max-h-[200px] overflow-y-auto">
            {fonts.map((f) => (
              <button
                key={f.name}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyCustomSpanStyle('font-family', f.value);
                  setShowFontMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-yellow-50 hover:text-yellow-700 font-medium transition-colors"
                style={{ fontFamily: f.value }}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. FONT SIZE DROPDOWN */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            cacheGlobalSelection();
            setShowSizeMenu(!showSizeMenu);
            setShowFontMenu(false);
            setShowColorMenu(false);
            setShowBgMenu(false);
          }}
          className="flex items-center justify-between text-[11px] font-bold bg-white border border-zinc-200 rounded-md px-2 py-1 min-w-[55px] text-zinc-700 hover:bg-zinc-50"
        >
          <span>Size</span>
          <span className="text-[9px] text-zinc-400 ml-1">▼</span>
        </button>
        
        {showSizeMenu && (
          <div className="absolute left-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl py-1 z-[999] min-w-[80px] max-h-[200px] overflow-y-auto">
            {sizes.map((sz) => (
              <button
                key={sz}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyCustomSpanStyle('font-size', sz);
                  setShowSizeMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-yellow-50 hover:text-yellow-700 font-bold transition-colors"
              >
                {sz.replace('px', '')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* A+ / A- Buttons */}
      <div className="flex items-center bg-white border border-zinc-200 rounded-md p-0.5">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); cacheGlobalSelection(); }} onClick={() => applyIncrementalFontSize(1)} className="p-1 px-2 hover:bg-zinc-100 rounded text-xs font-black text-zinc-800" title="Grow Font">A⁺</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); cacheGlobalSelection(); }} onClick={() => applyIncrementalFontSize(-1)} className="p-1 px-2 hover:bg-zinc-100 rounded text-xs font-black text-zinc-800" title="Shrink Font">A⁻</button>
      </div>

      <div className="w-[1px] h-4 bg-zinc-300 mx-0.5" />

      {/* Basic Weights */}
      <div className="flex items-center bg-white border border-zinc-200 rounded-md p-0.5 whitespace-nowrap">
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle('bold')} className="p-1 px-1.5 hover:bg-zinc-100 rounded text-zinc-800 font-extrabold text-xs" title="Bold">B</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle('italic')} className="p-1 px-1.5 hover:bg-zinc-100 rounded text-zinc-800 italic text-xs" title="Italic">I</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle('underline')} className="p-1 px-1.5 hover:bg-zinc-100 rounded text-zinc-800 underline text-xs" title="Underline">U</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle('strikeThrough')} className="p-1 px-1.5 hover:bg-zinc-100 rounded text-zinc-800 line-through text-xs" title="Strikethrough">abc</button>
      </div>

      <div className="w-[1px] h-4 bg-zinc-300 mx-0.5" />

      {/* 3. HIGHLIGHT COLOR (ab) */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            cacheGlobalSelection();
            setShowBgMenu(!showBgMenu);
            setShowColorMenu(false);
            setShowFontMenu(false);
            setShowSizeMenu(false);
          }}
          className="flex items-center gap-1 bg-white border border-zinc-200 rounded-md px-2 py-1 text-zinc-700 hover:bg-zinc-50 font-bold"
          title="Text Highlight Color"
        >
          <span className="text-[11px] font-black border-b-2 border-yellow-400">ab</span>
          <span className="text-[7px] text-zinc-400">▼</span>
        </button>

        {showBgMenu && (
          <div className="absolute left-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl p-2 z-[999] w-[180px]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 px-0.5">Highlight Color</p>
            <div className="grid grid-cols-10 gap-1">
              {colorPalette.map((color, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  style={{ backgroundColor: color }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleColorClick('background-color', color);
                  }}
                  className="w-3.5 h-3.5 rounded border border-zinc-200/50 hover:scale-115 hover:shadow-sm transition-transform"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. FONT TEXT COLOR (A) */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            cacheGlobalSelection();
            setShowColorMenu(!showColorMenu);
            setShowBgMenu(false);
            setShowFontMenu(false);
            setShowSizeMenu(false);
          }}
          className="flex items-center gap-1 bg-white border border-zinc-200 rounded-md px-2 py-1 text-zinc-800 hover:bg-zinc-50 font-bold"
          title="Font Color"
        >
          <span className="text-[11px] font-black border-b-2 border-red-600">A</span>
          <span className="text-[7px] text-zinc-400">▼</span>
        </button>

        {showColorMenu && (
          <div className="absolute left-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl p-2 z-[999] w-[180px]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 px-0.5">Font Color</p>
            <div className="grid grid-cols-10 gap-1">
              {colorPalette.map((color, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  style={{ backgroundColor: color }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleColorClick('color', color);
                  }}
                  className="w-3.5 h-3.5 rounded border border-zinc-200/50 hover:scale-115 hover:shadow-sm transition-transform"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-zinc-300 mx-0.5" />

      {/* 5. BULLETS & INDENT */}
      <div className="flex items-center bg-white border border-zinc-200 rounded-md p-0.5">
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle('insertUnorderedList')} className="p-1 hover:bg-zinc-100 rounded text-zinc-700 text-xs font-bold" title="Bullets">⋮☰</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle('insertOrderedList')} className="p-1 hover:bg-zinc-100 rounded text-zinc-700 text-xs font-bold" title="Numbering">1☰</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle('outdent')} className="p-1 hover:bg-zinc-100 rounded text-zinc-700 text-xs font-bold" title="Decrease Indent">⇦</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle('indent')} className="p-1 hover:bg-zinc-100 rounded text-zinc-700 text-xs font-bold" title="Increase Indent">⇨</button>
      </div>
      
      <div className="w-[1px] h-4 bg-zinc-300 mx-0.5" />

      {/* 6. ALIGNMENT (Justify Included) */}
      <div className="flex items-center bg-white border border-zinc-200 rounded-md p-0.5">
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle('justifyLeft')} className="p-1 hover:bg-zinc-100 rounded text-zinc-700 text-xs" title="Align Left">𝌆</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle('justifyCenter')} className="p-1 hover:bg-zinc-100 rounded text-zinc-700 text-xs" title="Center">𝌇</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle('justifyRight')} className="p-1 hover:bg-zinc-100 rounded text-zinc-700 text-xs" title="Align Right">𝌈</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle('justifyFull')} className="p-1 hover:bg-zinc-100 rounded text-zinc-700 text-xs" title="Justify">𝌉</button>
      </div>

      <div className="w-[1px] h-4 bg-zinc-300 mx-0.5" />

      {/* Links */}
      <button type="button" onMouseDown={e => e.preventDefault()} onClick={addLink} className="p-1.5 hover:bg-blue-50 rounded text-blue-600 bg-white border" title="Link"><LinkIcon size={13}/></button>
      <button type="button" onMouseDown={e => { e.preventDefault(); cacheGlobalSelection(); }} onClick={removeLink} className="p-1.5 hover:bg-red-50 rounded text-red-400 bg-white border" title="Unlink"><X size={13}/></button>
    </div>
  );
};

// ─── TYPES ───────────────────────────────────────────────────────────────────

type BlockType =
  | 'text' | 'heading2' | 'heading3'
  | 'quote' | 'callout' | 'highlight'
  | 'table' | 'list' | 'code' | 'divider'
  | 'image' | 'image_row' | 'summary'
  | 'split' | 'image_text'| 'faq';

interface ImageItem { url: string; caption: string; }

interface Block {
  id: string;
  type: BlockType;
  heading?: string;
  body?: string;
  headers?: string[];
  rows?: string[][];
  listType?: 'bullet' | 'numbered';
  items?: string[];
  calloutVariant?: 'info' | 'warning' | 'tip' | 'danger';
  imageUrl?: string;
  caption?: string;
  language?: string;
  highlightColor?: string;
  images?: ImageItem[];
  columns?: 2 | 3;
  splitLayout?: 'left-image' | 'right-image';
  splitImage?: string;
  splitContent?: string;
  faqItems?: { question: string; answer: string; }[];
}

// ─── PALETTE ─────────────────────────────────────────────────────────────────

const PALETTE: { type: BlockType; label: string; icon: React.ReactNode; desc: string; accent: string }[] = [
  { type: 'text',      label: 'Paragraph',     icon: <Type size={15}/>,        desc: 'Body text + optional heading', accent: '#6366f1' },
  { type: 'heading2',  label: 'H2 Heading',     icon: <Heading1 size={15}/>,    desc: 'Major section title',          accent: '#7c3aed' },
  { type: 'heading3',  label: 'H3 Heading',     icon: <Heading2 size={15}/>,    desc: 'Sub-section title',            accent: '#a78bfa' },
  { type: 'list',      label: 'List',          icon: <List size={15}/>,        desc: 'Bullet or numbered list',      accent: '#0891b2' },
  { type: 'quote',     label: 'Blockquote',    icon: <Quote size={15}/>,       desc: 'Pull quote or attribution',    accent: '#db2777' },
  { type: 'callout',   label: 'Callout',       icon: <AlertCircle size={15}/>, desc: 'Info / Tip / Warning box',     accent: '#d97706' },
  { type: 'highlight', label: 'Key Takeaway',  icon: <Zap size={15}/>,         desc: 'Highlighted insight or stat',  accent: '#ea580c' },
  { type: 'image',     label: 'Single Image',  icon: <ImageIcon size={15}/>,   desc: 'Full-width image + caption',   accent: '#059669' },
  { type: 'image_row', label: 'Image Row',      icon: <Grid size={15}/>,        desc: '2–3 images side by side',      accent: '#0d9488' },
  { type: 'table',     label: 'Table',         icon: <TableIcon size={15}/>,   desc: 'Comparison or data table',     accent: '#16a34a' },
  { type: 'code',      label: 'Code Block',     icon: <Code size={15}/>,        desc: 'Code or command snippet',      accent: '#65a30d' },
  { type: 'divider',   label: 'Divider',       icon: <Minus size={15}/>,       desc: 'Visual section separator',     accent: '#94a3b8' },
  { type: 'summary',   label: 'Exec. Summary', icon: <BookOpen size={15}/>,    desc: 'Dark executive summary card',  accent: '#facc15' },
  { type: 'split',     label: 'Image + Content',icon: <Layout size={15}/>,      desc: 'Side by side layout',          accent: '#2563eb'},
  { type: 'image_text', label: 'Image + Text',  icon: <Grid size={15}/>,        desc: 'Text left, image right',       accent: '#0ea5e9' },
  { type: 'faq',        label: 'FAQ Section',   icon: <HelpCircle size={15}/>,  desc: 'Question & Answer list',       accent: '#8b5cf6' },
];

const CALLOUT_META: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  info:    { bg: '#eff6ff', border: '#3b82f6', icon: 'ℹ️', label: 'Info'      },
  tip:     { bg: '#f0fdf4', border: '#22c55e', icon: '💡', label: 'Tip'       },
  warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠️', label: 'Warning'   },
  danger:  { bg: '#fef2f2', border: '#ef4444', icon: '🚫', label: 'Important' },
};

// ─── BLOCK FACTORY ────────────────────────────────────────────────────────────

const makeBlock = (type: BlockType): Block => {
  const id = genId();
  switch (type) {
    case 'summary': return { id, type, body: '' };
    case 'table':     return { id, type, heading: '', headers: ['Feature', 'Option A', 'Option B'], rows: [['', '', '']] };
    case 'list':      return { id, type, heading: '', listType: 'bullet', items: [''] };
    case 'callout':   return { id, type, calloutVariant: 'info', body: '' };
    case 'code':      return { id, type, heading: '', language: 'bash', body: '' };
    case 'image':     return { id, type, imageUrl: '', caption: '' };
    case 'image_row': return { id, type, columns: 2, images: [{ url: '', caption: '' }, { url: '', caption: '' }] };
    case 'divider':   return { id, type };
    case 'highlight': return { id, type, body: '', highlightColor: '#fef9c3' };
    case 'split':     return { id, type,   splitLayout: 'left-image',    splitImage: '',     splitContent: ''  };
    case 'image_text':
      return { id, type, body: '', imageUrl: '', caption: '' };
    case 'faq':
      return { id, type, heading: 'Frequently Asked Questions', faqItems: [{ question: '', answer: '' }] };
    default:          return { id, type, heading: '', body: '' };
  }
};

// ─── PREVIEW BLOCK ────────────────────────────────────────────────────────────

const PreviewBlock: React.FC<{ block: Block }> = ({ block }) => {
  const pf = "'Playfair Display', Georgia, serif";
  const bf = "'Georgia', serif";

  switch (block.type) {
   case 'text':
      return (
        <div style={{ marginBottom: 26 }}>
          {block.heading && <h4 style={{ fontFamily: pf, fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 9, marginTop: 0 }}>{block.heading}</h4>}
          <div 
            className="blog-preview-render-text whitespace-pre-line"
            style={{ fontFamily: bf, fontSize: 17, lineHeight: 1.9, color: '#374151', margin: 0 }}
            dangerouslySetInnerHTML={{ __html: block.body || '<em style="color: #ccc">Empty paragraph…</em>' }}
          />
        </div>
      );
    case 'image':
      return (
        <figure style={{ float: 'right', width: '45%', marginLeft: 20, marginBottom: 15, marginTop: 5, textAlign: 'center' }}>
          {block.imageUrl ? (
            <img src={block.imageUrl} alt="" style={{ width: '100%', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
          ) : (
            <div style={{ background: '#f4f4f5', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon /></div>
          )}
          {block.caption && <figcaption style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', marginTop: 5 }}>{block.caption}</figcaption>}
        </figure>
      );
    case 'heading2':
      return <h2 style={{ fontFamily: pf, fontSize: 27, fontWeight: 800, color: '#111', marginTop: 44, marginBottom: 12, borderBottom: '3px solid #facc15', paddingBottom: 10 }}>{block.body || 'Section Heading'}</h2>;
    case 'heading3':
      return <h3 style={{ fontFamily: pf, fontSize: 20, fontWeight: 700, color: '#1f2937', marginTop: 30, marginBottom: 8 }}>{block.body || 'Sub-heading'}</h3>;
    case 'quote':
      return (
        <blockquote style={{ margin: '28px 0', padding: '15px 22px 15px 18px', borderLeft: '5px solid #facc15', background: '#fffbeb', borderRadius: '0 14px 14px 0', fontFamily: bf, fontSize: 18, fontStyle: 'italic', color: '#374151', lineHeight: 1.7 }}>
          <span style={{ fontSize: 42, lineHeight: 0, color: '#facc15', verticalAlign: '-0.3em', marginRight: 4, fontFamily: 'Georgia' }}>"</span>
          {block.body}
          {block.heading && <footer style={{ marginTop: 10, fontStyle: 'normal', fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase' }}>— {block.heading}</footer>}
        </blockquote>
      );
    case 'summary':
      return (
        <div style={{ background: '#0f0f11', borderRadius: 24, padding: '40px', margin: '30px 0', position: 'relative', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 24, height: 2, background: '#facc15' }} />
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', color: '#facc15', textTransform: 'uppercase' }}>Executive Summary</span>
          </div>
          <p style={{ fontFamily: bf, fontSize: 20, fontStyle: 'italic', lineHeight: 1.6, color: '#d1d5db', margin: 0 }}>
            {block.body || "A deep dive into manufacturing excellence..."}
          </p>
        </div>
      );
    case 'callout': {
      const s = CALLOUT_META[block.calloutVariant || 'info'];
      return (
        <div style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 14, padding: '14px 18px', margin: '18px 0', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 19 }}>{s.icon}</span>
          <div>
            <p style={{ fontWeight: 800, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.border, marginBottom: 4, marginTop: 0 }}>{s.label}</p>
            <p style={{ fontFamily: bf, fontSize: 15, lineHeight: 1.7, color: '#374151', margin: 0 }}>{block.body}</p>
          </div>
        </div>
      );
    }
    case 'highlight':
      return <div style={{ background: block.highlightColor || '#fef9c3', borderRadius: 14, padding: '15px 19px', margin: '18px 0', borderLeft: '4px solid #eab308', fontFamily: bf, fontSize: 17, fontWeight: 500, color: '#717172', lineHeight: 1.75 }}>{block.body || 'Key takeaway…'}</div>;
    case 'list': {
      const Tag = block.listType === 'numbered' ? 'ol' : 'ul';
      return (
        <div style={{ margin: '18px 0' }}>
          {block.heading && <p style={{ fontFamily: pf, fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 6 }}>{block.heading}</p>}
          <Tag style={{ paddingLeft: 24, margin: 0 }}>
            {(block.items || []).map((item, i) => <li key={i} style={{ fontFamily: bf, fontSize: 16, lineHeight: 1.85, color: '#374151', marginBottom: 5 }}>{item}</li>)}
          </Tag>
        </div>
      );
    }
    case 'table':
      return (
        <div style={{ margin: '22px 0', overflowX: 'auto' }}>
          {block.heading && <p style={{ fontFamily: pf, fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 9 }}>{block.heading}</p>}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            <thead>
              <tr style={{ background: '#18181b' }}>
                {(block.headers || []).map((h, i) => <th key={i} style={{ padding: '11px 15px', color: '#facc15', fontWeight: 800, textAlign: 'left', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {(block.rows || []).map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {row.map((cell, ci) => <td key={ci} style={{ padding: '10px 15px', color: '#374151', fontWeight: ci === 0 ? 600 : 400 }} dangerouslySetInnerHTML={{ __html: cell || '' }} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'code':
      return (
        <div style={{ margin: '18px 0', borderRadius: 13, overflow: 'hidden', border: '1px solid #27272a' }}>
          <div style={{ background: '#18181b', padding: '7px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{block.language}</span>
            {block.heading && <span style={{ fontSize: 12, color: '#a1a1aa' }}>{block.heading}</span>}
          </div>
          <pre style={{ background: '#09090b', color: '#d4d4d8', margin: 0, padding: '16px 20px', fontFamily: '"JetBrains Mono","Fira Code",monospace', fontSize: 13, lineHeight: 1.7, overflowX: 'auto' }}>
            <code>{block.body || '// your code here'}</code>
          </pre>
        </div>
      );
    case 'divider':
      return (
        <div style={{ margin: '30px 0', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <div style={{ width: 7, height: 7, background: '#facc15', borderRadius: '50%' }} />
          <div style={{ width: 5, height: 5, background: '#d4d4d8', borderRadius: '50%' }} />
          <div style={{ width: 7, height: 7, background: '#facc15', borderRadius: '50%' }} />
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>
      );
    case 'image_row': {
      const imgs = block.images || [];
      const cols = block.columns || 2;
      return (
        <div style={{ margin: '26px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
            {imgs.map((img, i) => (
              <figure key={i} style={{ margin: 0, textAlign: 'center' }}>
                {img.url
                  ? <img src={img.url} alt={img.caption || ''} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'contain', borderRadius: 10, background: '#f9fafb', border: '1px solid #ebebeb', padding: 10, boxSizing: 'border-box' }} />
                  : <div style={{ background: '#f4f4f5', borderRadius: 10, aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4d4d8' }}><ImageIcon size={22}/></div>
                }
                {img.caption && <figcaption style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: bf, fontStyle: 'italic' }}>{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      );
    }
    case 'split':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center', margin: '30px 0' }}>
          {block.splitLayout === 'left-image' ? (
            <>
              <img src={block.splitImage} style={{ width: '100%', borderRadius: 12 }} alt="" />
              <div className="blog-preview-render-text whitespace-pre-line" style={{ fontFamily: bf, fontSize: 17, lineHeight: 1.9, color: '#374151' }} dangerouslySetInnerHTML={{ __html: block.splitContent || '' }} />
            </>
          ) : (
            <>
              <div className="blog-preview-render-text whitespace-pre-line" style={{ fontFamily: bf, fontSize: 17, lineHeight: 1.9, color: '#374151' }} dangerouslySetInnerHTML={{ __html: block.splitContent || '' }} />
              <img src={block.splitImage} style={{ width: '100%', borderRadius: 12 }} alt="" />
            </>
          )}
        </div>
      );
    case 'faq':
      return (
        <div style={{ margin: '36px 0' }}>
          {block.heading && (
            <h2 style={{ fontFamily: pf, fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 20, borderBottom: '2px solid #facc15', paddingBottom: 8 }}>
              {block.heading}
            </h2>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(block.faqItems || []).map((item, i) => (
              <details key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', cursor: 'pointer' }}>
                <summary style={{ fontWeight: 700, fontFamily: bf, fontSize: 16, color: '#1f2937', outline: 'none' }}>
                  {item.question || 'Empty Question'}
                </summary>
                <p style={{ marginTop: 12, marginBottom: 0, fontFamily: bf, fontSize: 15, color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {item.answer || 'Empty Answer'}
                </p>
              </details>
            ))}
          </div>
        </div>
      );
    default: return null;
  }
};

// ─── BLOCK EDITOR CARD ────────────────────────────────────────────────────────

const inp = "w-full border border-zinc-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 rounded-xl px-4 py-3 text-sm bg-white outline-none transition-all placeholder-zinc-400";
const txta = inp + " resize-none font-serif text-[15px] leading-relaxed";

const BlockEditor: React.FC<{
  block: Block; index: number;
  onUpdate: (id: string, patch: Partial<Block>) => void;
  onRemove: (id: string) => void;
  onUpload: (file: File) => Promise<string>;
  setDraggable: (state: boolean) => void;
}> = ({ block, index, onUpdate, onRemove, onUpload, setDraggable }) => {
  const [uploading, setUploading] = useState(false);
  const u = (patch: Partial<Block>) => onUpdate(block.id, patch);
  
  // NAYA: Global toolbar se command aane par text save karega
  useEffect(() => {
    const handleSync = () => {
      const el = document.getElementById(`editor-body-${block.id}`);
      if (el && el.innerHTML !== block.body) u({ body: el.innerHTML });

      const elSplit = document.getElementById(`editor-split-${block.id}`);
      if (elSplit && elSplit.innerHTML !== block.splitContent) u({ splitContent: elSplit.innerHTML });
    };

    window.addEventListener('sync-editor-content', handleSync);
    return () => window.removeEventListener('sync-editor-content', handleSync);
  }, [block, u]);

  const syncContent = () => {
    // Text Block Sync
    const elText = document.getElementById(`editor-body-${block.id}`);
    if (elText && block.type === 'text') u({ body: elText.innerHTML });

    // Split Block Sync
    const elSplit = document.getElementById(`editor-split-${block.id}`);
    if (elSplit && block.type === 'split') u({ splitContent: elSplit.innerHTML });

    // Summary Block Sync
    const elSummary = document.getElementById(`editor-body-${block.id}`);
    if (elSummary && block.type === 'summary') u({ body: elSummary.innerHTML });

    // Headings Sync
    const elHeading = document.getElementById(`editor-body-${block.id}`);
    if (elHeading && (block.type === 'heading2' || block.type === 'heading3')) u({ body: elHeading.innerHTML });
  };

  const addLinkLocal = () => {
    const selection = window.getSelection();
    let existingUrl = "";
    if (selection && selection.anchorNode) {
      const parent = selection.anchorNode.parentElement;
      if (parent && parent.tagName === 'A') {
        existingUrl = parent.getAttribute('href') || "";
      }
    }

    const url = window.prompt("Edit Product URL:", existingUrl);
    if (url !== null) {
      document.execCommand('createLink', false, url);
     const newSelection = window.getSelection();
      if (newSelection && newSelection.anchorNode) {
        const newParent = newSelection.anchorNode.parentElement;
        if (newParent && newParent.tagName === 'A') {
          newParent.setAttribute('target', '_blank');
          newParent.setAttribute('rel', 'noopener noreferrer');
        }
      }
      syncContent();
    }
  };

  const meta = PALETTE.find(p => p.type === block.type)!;

  const handleFileChange = async (file: File | undefined, callback: (url: string) => void) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUpload(file);
      callback(url);
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e4e4e7', borderRadius: 20, padding: '22px 22px 18px', position: 'relative' }} className="hover:border-yellow-400 hover:shadow-sm transition-all group">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div 
            onMouseEnter={() => setDraggable(true)} 
            onMouseLeave={() => setDraggable(false)}
            style={{ cursor: 'grab', color: '#d4d4d8', padding: '4px' }} 
            className="hover:text-zinc-800 hover:bg-zinc-100 rounded"
          >
            <GripVertical size={16} />
          </div>
          
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#18181b', color: '#facc15', borderRadius: 99, padding: '3px 10px', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <span style={{ color: meta.accent }}>{meta.icon}</span> {meta.label}
          </span>
          <span style={{ fontSize: 9, color: '#a1a1aa', fontWeight: 600 }}>#{index + 1}</span>
          {uploading && <span className="flex items-center gap-1 text-[9px] font-bold text-blue-500 animate-pulse"><Loader2 size={10} className="animate-spin"/> UPLOADING...</span>}
        </div>
        <button type="button" onClick={() => onRemove(block.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 3 }} className="hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
      </div>

      {/* ─── TEXT BLOCK ─── */}
      {block.type === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="flex items-center justify-between bg-zinc-50 p-2 rounded-t-lg border border-zinc-200 flex-wrap gap-2">
            <input 
              className="bg-transparent border-none outline-none text-[10px] font-bold text-zinc-500 min-w-[150px] flex-1" 
              placeholder="OPTIONAL SECTION HEADING..." 
              value={block.heading || ''} 
              onChange={e => u({ heading: e.target.value })} 
            />
          </div>

          <div
            id={`editor-body-${block.id}`}
            contentEditable
            suppressContentEditableWarning
            className="w-full min-h-[120px] max-h-[250px] overflow-y-auto p-4 border border-zinc-200 border-t-0 rounded-b-xl focus:ring-2 focus:ring-yellow-400/20 outline-none bg-white font-serif text-[16px] leading-relaxed text-zinc-800 select-text whitespace-pre-line"
            onMouseUp={cacheGlobalSelection}
            onKeyUp={cacheGlobalSelection}
            onBlur={syncContent}
            dangerouslySetInnerHTML={{ __html: block.body || '' }}
          />
          <p className="text-[9px] text-zinc-400 italic px-1">* Highlight text to format styles dynamically mirroring standard corporate processors.</p>
        </div>
      )}

      {/* ─── TABLE BLOCK ─── */}
      {block.type === 'table' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="flex gap-2 items-center">
            <input className={inp} placeholder="Table Heading (e.g. Technical Specifications)" value={block.heading || ''} onChange={e => u({ heading: e.target.value })} />
            <button 
              type="button" 
              onMouseDown={(e) => e.preventDefault()}
              onClick={addLinkLocal}
              className="p-3 bg-white border border-zinc-200 hover:bg-yellow-100 rounded-xl text-zinc-600 hover:text-yellow-700 transition-colors flex-shrink-0"
              title="Add Link to Selected Table Text"
            >
              <LinkIcon size={16} />
            </button>
          </div>
          <div style={{ overflowX: 'auto', border: '1.5px solid #e4e4e7', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#18181b' }}>
                  {(block.headers || []).map((h, i) => (
                    <th key={i} style={{ padding: 8, border: '1px solid #3f3f46' }}>
                      <input 
                        style={{ width: '100%', background: 'transparent', color: '#facc15', border: 'none', outline: 'none', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}
                        value={h}
                        onChange={e => {
                          const newHeaders = [...(block.headers || [])];
                          newHeaders[i] = e.target.value;
                          u({ headers: newHeaders });
                        }}
                      />
                    </th>
                  ))}
                  <th style={{ width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {(block.rows || []).map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: 8, border: '1px solid #e4e4e7' }}>
                        <div 
                          contentEditable
                          suppressContentEditableWarning
                          style={{ width: '100%', minHeight: '20px', border: 'none', outline: 'none', background: 'transparent' }}
                          onMouseUp={cacheGlobalSelection}
                          onKeyUp={cacheGlobalSelection}
                          onBlur={e => {
                            const newRows = [...(block.rows || [])];
                            newRows[ri] = [...newRows[ri]];
                            newRows[ri][ci] = e.currentTarget.innerHTML;
                            u({ rows: newRows });
                          }}
                          dangerouslySetInnerHTML={{ __html: cell || '' }}
                        />
                      </td>
                    ))}
                    <td style={{ textAlign: 'center' }}>
                      <button type="button" onClick={() => u({ rows: block.rows?.filter((_, i) => i !== ri) })} style={{ color: '#fca5a5' }} className="hover:text-red-500"><Trash2 size={12}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => u({ rows: [...(block.rows || []), Array((block.headers || []).length).fill('')] })} style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#f4f4f5', fontSize: 10, fontWeight: 800, border: '1px solid #e4e4e7', cursor: 'pointer' }}>+ ADD ROW</button>
            <button type="button" onClick={() => u({ headers: [...(block.headers || []), 'New'], rows: (block.rows || []).map(r => [...r, '']) })} style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#f4f4f5', fontSize: 10, fontWeight: 800, border: '1px solid #e4e4e7', cursor: 'pointer' }}>+ ADD COLUMN</button>
          </div>
        </div>
      )}

      {/* ─── EXECUTIVE SUMMARY BLOCK ─── */}
      {block.type === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary Content (Italicized in preview)</p>
          <div
            id={`editor-body-${block.id}`}
            contentEditable
            suppressContentEditableWarning
            className={`${txta} min-h-[100px] bg-white`}
            onMouseUp={cacheGlobalSelection}
            onKeyUp={cacheGlobalSelection}
            onBlur={syncContent}
            dangerouslySetInnerHTML={{ __html: block.body || '' }}
          />
        </div>
      )}

      {/* ─── HEADINGS ─── */}
      {(block.type === 'heading2' || block.type === 'heading3') && (
        <div
          id={`editor-body-${block.id}`}
          contentEditable
          suppressContentEditableWarning
          className={`w-full border border-zinc-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 rounded-xl px-4 py-3 outline-none transition-all font-black bg-white ${block.type === 'heading2' ? 'text-2xl' : 'text-xl'}`}
          onMouseUp={cacheGlobalSelection}
          onKeyUp={cacheGlobalSelection}
          onBlur={syncContent}
          dangerouslySetInnerHTML={{ __html: block.body || '' }}
        />
      )}

      {/* ─── IMAGE BLOCK ─── */}
      {block.type === 'image' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ position: 'relative', height: 120, background: '#f9fafb', border: '2px dashed #d4d4d8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {block.imageUrl ? (
              <>
                <img src={block.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <button type="button" className="p-2 bg-white rounded-full text-zinc-900 shadow-lg"><Upload size={16}/></button>
                   <button type="button" onClick={() => u({ imageUrl: '' })} className="p-2 bg-red-500 rounded-full text-white shadow-lg"><X size={16}/></button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Upload size={18} style={{ color: '#a1a1aa', margin: '0 auto 6px' }}/>
                <p style={{ fontSize: 9, fontWeight: 800, color: '#71717a' }}>CLICK OR DRAG TO UPLOAD FROM PC</p>
              </div>
            )}
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={e => handleFileChange(e.target.files?.[0], (url) => u({ imageUrl: url }))} />
          </div>
          <div className="flex gap-2">
            <LinkIcon size={12} className="text-zinc-400 mt-3" />
            <input className={inp} placeholder="Or paste image URL instead…" value={block.imageUrl||''} onChange={e => u({ imageUrl: e.target.value })} />
          </div>
          <input className={inp} placeholder="Add a caption..." value={block.caption||''} onChange={e => u({ caption: e.target.value })} />
        </div>
      )}

      {/* ─── IMAGE ROW BLOCK ─── */}
      {block.type === 'image_row' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#71717a' }}>LAYOUT</span>
            <div className="flex border rounded-lg overflow-hidden bg-white">
              {[2,3].map(n => (
                <button key={n} type="button" onClick={() => {
                  const imgs = [...(block.images||[])];
                  while (imgs.length < n) imgs.push({ url: '', caption: '' });
                  u({ columns: n as 2|3, images: imgs.slice(0, n) });
                }} className={`px-3 py-1 text-[10px] font-bold ${block.columns === n ? 'bg-zinc-900 text-yellow-400' : 'text-zinc-500 hover:bg-zinc-50'}`}>{n} COLS</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${block.columns||2}, 1fr)`, gap: 10 }}>
            {(block.images||[]).map((img, i) => (
              <div key={i} className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex flex-col gap-2">
                <div className="relative aspect-square rounded-lg bg-white border flex items-center justify-center overflow-hidden">
                   {img.url ? (
                     <img src={img.url} className="w-full h-full object-contain p-2" alt=""/>
                   ) : <ImageIcon className="text-zinc-200" size={24}/>}
                   <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={e => handleFileChange(e.target.files?.[0], (url) => {
                      const ni=[...(block.images||[])]; ni[i]={...ni[i],url}; u({ images: ni });
                    })} />
                </div>
                <input className="w-full border p-2 text-[10px] rounded-md outline-none" placeholder="Device Upload or URL" value={img.url} 
                  onChange={e => { const ni=[...(block.images||[])]; ni[i]={...ni[i],url:e.target.value}; u({ images: ni }); }} />
                <input className="w-full border p-2 text-[10px] rounded-md outline-none" placeholder="Label/Caption" value={img.caption} 
                  onChange={e => { const ni=[...(block.images||[])]; ni[i]={...ni[i],caption:e.target.value}; u({ images: ni }); }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SPLIT IMAGE/TEXT BLOCK ─── */}
      {block.type === 'split' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['left-image', 'right-image'].map((layout) => (
              <button key={layout} type="button" onClick={() => u({ splitLayout: layout as any })}
                className={`px-3 py-1 text-[10px] font-bold rounded ${block.splitLayout === layout ? 'bg-zinc-900 text-yellow-400' : 'bg-zinc-100'}`}>
                {layout === 'left-image' ? 'Image Left' : 'Image Right'}
              </button>
            ))}
          </div>
          <input type="file" accept="image/*" onChange={e => handleFileChange(e.target.files?.[0], (url) => u({ splitImage: url }))} />
          <input className={inp} placeholder="Or paste image URL" value={block.splitImage || ''} onChange={e => u({ splitImage: e.target.value })} />
          
          <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
            <div
              id={`editor-split-${block.id}`}
              contentEditable
              suppressContentEditableWarning
              className="w-full min-h-[120px] max-h-[200px] overflow-y-auto p-4 focus:ring-2 focus:ring-yellow-400/20 outline-none bg-white font-serif text-[16px] leading-relaxed text-zinc-800 whitespace-pre-line"
              onMouseUp={cacheGlobalSelection}
              onKeyUp={cacheGlobalSelection}
              onBlur={syncContent}
              dangerouslySetInnerHTML={{ __html: block.splitContent || '' }}
            />
          </div>
        </div>
      )}

      {/* ─── QUOTE BLOCK ─── */}
      {block.type === 'quote' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea className={txta} rows={3} placeholder="Your quote…" value={block.body || ''} onChange={e => u({ body: e.target.value })} />
          <input className={inp} placeholder="Source or attribution (optional)" value={block.heading || ''} onChange={e => u({ heading: e.target.value })} />
        </div>
      )}

      {/* ─── FAQ BLOCK ─── */}
      {block.type === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input 
            className={inp} 
            placeholder="FAQ Heading (e.g., Frequently Asked Questions)" 
            value={block.heading || ''} 
            onChange={e => u({ heading: e.target.value })} 
          />
          
          {(block.faqItems || []).map((item, i) => (
            <div key={i} style={{ background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: 12, padding: '14px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#a1a1aa' }}>QUESTION {i + 1}</span>
                <button 
                  type="button" 
                  onClick={() => {
                    const newFaq = [...(block.faqItems || [])];
                    newFaq.splice(i, 1);
                    u({ faqItems: newFaq });
                  }} 
                  style={{ color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer' }}
                  className="hover:text-red-500"
                >
                  <Trash2 size={14}/>
                </button>
              </div>
              
              <input 
                className={inp} 
                style={{ marginBottom: 10 }}
                placeholder="Enter question here..." 
                value={item.question} 
                onChange={e => {
                  const newFaq = [...(block.faqItems || [])];
                  newFaq[i] = { ...newFaq[i], question: e.target.value };
                  u({ faqItems: newFaq });
                }} 
              />
              
              <textarea 
                className={txta} 
                rows={4} 
                placeholder="Enter answer here..." 
                value={item.answer} 
                onChange={e => {
                  const newFaq = [...(block.faqItems || [])];
                  newFaq[i] = { ...newFaq[i], answer: e.target.value };
                  u({ faqItems: newFaq });
                }} 
              />
            </div>
          ))}
          
          <button 
            type="button" 
            onClick={() => {
              const newFaq = [...(block.faqItems || []), { question: '', answer: '' }];
              u({ faqItems: newFaq });
            }} 
            style={{ padding: '10px', borderRadius: 8, background: '#f4f4f5', fontSize: 10, fontWeight: 800, border: '1px solid #e4e4e7', cursor: 'pointer', color: '#18181b' }}
          >
            + ADD NEW QUESTION
          </button>
        </div>
      )}
    </div>
  );
};

const AddBlockPanel: React.FC<{ onAdd: (t: BlockType) => void }> = ({ onAdd }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px,1fr))', gap: 8 }}>
    {PALETTE.map(bt => (
      <button key={bt.type} type="button" onClick={() => onAdd(bt.type)}
        style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fff', border: '1.5px dashed #d4d4d8', borderRadius: 11, padding: '11px 13px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}
        className="hover:border-yellow-400 hover:bg-yellow-50">
        <span style={{ color: bt.accent, flexShrink: 0 }}>{bt.icon}</span>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#18181b', margin: 0 }}>{bt.label}</p>
          <p style={{ fontSize: 9, color: '#a1a1aa', margin: '2px 0 0', lineHeight: 1.3 }}>{bt.desc}</p>
        </div>
      </button>
    ))}
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AddBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([makeBlock('heading2'), makeBlock('text')]);
  const [formData, setFormData] = useState({
    title: '', category: 'Technical Guide', excerpt: '',
    author: 'Durable Editorial', image_url: ''
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggableBlockId, setDraggableBlockId] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      const { data } = await supabase.from('blogs').select('*').eq('id', id).single();
      if (!data) return;
      setFormData(data);
      setImagePreview(data.image_url);
      try {
        const saved = JSON.parse(data.content);
        setBlocks(Array.isArray(saved)
          ? saved.map((s: any) => ({ ...makeBlock(s.type||'text'), ...s, id: s.id||genId() }))
          : [makeBlock('text')]);
      } catch { setBlocks([{ ...makeBlock('text'), body: data.content }]); }
    })();
  }, [id, isEditing]);

  const uploadFileToSupabase = async (file: File) => {
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { data, error } = await supabase.storage.from('blog-images').upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from('blog-images').getPublicUrl(fileName).data.publicUrl;
  };

  const addBlockAtIndex = (type: BlockType, index?: number) => {
    if (index === undefined) {
      setBlocks(p => [...p, makeBlock(type)]);
    } else {
      setBlocks(p => {
        const newBlocks = [...p];
        newBlocks.splice(index, 0, makeBlock(type));
        return newBlocks;
      });
    }
    setInsertIndex(null);
  };

  const removeBlock = (id: string)      => setBlocks(p => p.filter(b => b.id !== id));
  const updateBlock = (id: string, patch: Partial<Block>) =>
    setBlocks(p => p.map(b => b.id === id ? { ...b, ...patch } : b));

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggableBlockId(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      const newBlocks = [...blocks];
      const [movedBlock] = newBlocks.splice(draggedIndex, 1);
      newBlocks.splice(index, 0, movedBlock);
      setBlocks(newBlocks);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggableBlockId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);

    try {
      let finalImageUrl = formData.image_url;
      if (imageFile) {
        finalImageUrl = await uploadFileToSupabase(imageFile);
      }

      const slug = generateSlug(formData.title);

      const payload = { 
        ...formData, 
        slug: slug,
        image_url: finalImageUrl, 
        content: JSON.stringify(blocks) 
      };

      const { error } = isEditing
        ? await supabase.from('blogs').update(payload).eq('id', id)
        : await supabase.from('blogs').insert([payload]);

      if (error) throw error;
      navigate('/dfpladmin access/blogs');
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f5', fontFamily: "'DM Sans',sans-serif" }}>

      <style>{`
        [contenteditable] {
          font-family: Georgia, serif;
          font-size: 16px;
          line-height: 1.8 !important;
        }
        [contenteditable] a {
          color: #2563eb !important;
          text-decoration: underline !important;
          font-weight: 600;
        }
        
        .blog-preview-render-text,
        .blog-preview-render-text div, 
        .blog-preview-render-text p, 
        .blog-preview-render-text li {
          font-family: 'Georgia', serif;
          font-size: 17px;
          line-height: 1.9;
          color: #374151;
        }
        .blog-preview-render-text span {
          font-family: inherit;
          font-size: inherit;
          color: inherit;
          line-height: inherit;
        }
        .blog-preview-render-text a {
          color: #2563eb !important;
          text-decoration: underline !important;
          font-weight: 600 !important;
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;800&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet"/>

      <form onSubmit={handleSubmit}>
        {/* TOPBAR */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e4e4e7', padding: '10px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          
          <Link to="/dfpladmin access/blogs" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800, color: '#71717a', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <ArrowLeft size={12}/> Back
          </Link>

          {/* YAHAN GLOBAL TOOLBAR AAYEGA JO HAMESHA UPAR DIKHEGA */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <GlobalToolbar />
          </div>
          
          <div style={{ display: 'flex', gap: 7 }}>
            <button type="button" onClick={() => setShowPreview(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 15px', borderRadius: 8, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s', background: showPreview ? '#18181b' : '#f4f4f5', color: showPreview ? '#facc15' : '#71717a', border: '1.5px solid ' + (showPreview ? '#18181b' : '#d4d4d8') }}>
              {showPreview ? <EyeOff size={12}/> : <Eye size={12}/>} {showPreview ? 'Hide Preview' : 'Live Preview'}
            </button>
            <button type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 8, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', background: '#18181b', color: '#facc15', border: '1.5px solid #18181b', opacity: loading ? 0.7 : 1, transition: 'all 0.15s' }}>
              <Save size={12}/> {loading ? 'Saving…' : isEditing ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>

        {/* MAIN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr', maxWidth: showPreview ? '100%' : 800, margin: '0 auto', minHeight: 'calc(100vh - 53px)' }}>

          {/* LEFT — EDITOR */}
          <div style={{ padding: '24px 20px 80px', overflowY: 'auto', maxHeight: 'calc(100vh - 53px)', borderRight: showPreview ? '1px solid #e4e4e7' : 'none' }}>

            <div style={{ background: '#fff', border: '1.5px solid #e4e4e7', borderRadius: 16, padding: 22, marginBottom: 18 }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: '#a1a1aa', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 13px' }}>Article Details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>Title *</label>
                  <input required style={{ width: '100%', border: '1.5px solid #e4e4e7', borderRadius: 10, padding: '10px 13px', fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display',serif", outline: 'none', boxSizing: 'border-box' }}
                    placeholder="e.g. Bolts vs Screws – What's the Difference?"
                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>Category</label>
                    <select style={{ width: '100%', border: '1.5px solid #e4e4e7', borderRadius: 10, padding: '8px 11px', fontSize: 12, fontWeight: 600, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                      value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      {['Technical Guide','How-To','Comparison','News','Tutorial','Opinion','Product Review'].map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>Author</label>
                    <input style={{ width: '100%', border: '1.5px solid #e4e4e7', borderRadius: 10, padding: '8px 11px', fontSize: 12, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                      value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 9, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>Cover Image</label>
                  <div style={{ position: 'relative', height: 130, background: '#f9fafb', border: '2px dashed #d4d4d8', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}>
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Cover"/>
                        <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }}
                          style={{ position: 'absolute', top: 7, right: 7, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 99, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <X size={12}/>
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <Upload size={20} style={{ color: '#d4d4d8', display: 'block', margin: '0 auto 6px' }}/>
                        <p style={{ fontSize: 9, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Upload Cover Photo</p>
                        <input type="file" accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                          onChange={e => { if(e.target.files?.[0]){ setImageFile(e.target.files[0]); setImagePreview(URL.createObjectURL(e.target.files[0])); } }}/>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 11 }}>
                <Layout size={13} style={{ color: '#facc15' }}/>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#18181b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Content Blocks</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {blocks.map((block, index) => (
                  <React.Fragment key={block.id}>
                    {/* DRAG WRAPPER */}
                    <div
                      draggable={draggableBlockId === block.id}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      style={{
                        opacity: draggedIndex === index ? 0.4 : 1,
                        borderTop: dragOverIndex === index && draggedIndex !== index ? '3px solid #facc15' : '3px solid transparent',
                        borderRadius: dragOverIndex === index ? '8px 8px 0 0' : '0',
                        transition: 'all 0.2s',
                        paddingTop: dragOverIndex === index ? '10px' : '0'
                      }}
                    >
                      <BlockEditor 
                        block={block} 
                        index={index} 
                        onUpdate={updateBlock} 
                        onRemove={removeBlock} 
                        onUpload={uploadFileToSupabase}
                        setDraggable={(state) => setDraggableBlockId(state ? block.id : null)}
                      />
                    </div>

                    {/* INSERT IN-BETWEEN BUTTON */}
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '4px 0', zIndex: 10 }}>
                      <div style={{ position: 'absolute', width: '100%', height: '1px', background: '#e4e4e7', top: '50%', zIndex: -1, opacity: 0.5 }} />
                      <button 
                        type="button" 
                        onClick={() => setInsertIndex(insertIndex === index + 1 ? null : index + 1)}
                        style={{ background: '#f4f4f5', border: '1px solid #d4d4d8', color: '#71717a', borderRadius: 99, padding: '4px 10px', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', transition: 'all 0.2s' }}
                        className="hover:border-yellow-400 hover:text-yellow-600 hover:bg-yellow-50"
                      >
                        <Plus size={10} /> INSERT BLOCK
                      </button>
                    </div>

                    {/* IN-BETWEEN INSERTION PANEL */}
                    {insertIndex === index + 1 && (
                      <div style={{ background: '#fafafa', border: '1.5px dashed #d4d4d8', borderRadius: 16, padding: 18, margin: '8px 0 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#71717a', letterSpacing: '0.1em' }}>SELECT BLOCK TO INSERT HERE</span>
                          <button type="button" onClick={() => setInsertIndex(null)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14}/></button>
                        </div>
                        <AddBlockPanel onAdd={(type) => addBlockAtIndex(type, index + 1)} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* DEFAULT ADD TO BOTTOM */}
            <div style={{ background: '#fff', border: '1.5px solid #e4e4e7', borderRadius: 16, padding: 18 }}>
               <p style={{ fontSize: 9, fontWeight: 800, color: '#a1a1aa', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 13px' }}>Add to Bottom</p>
              <AddBlockPanel onAdd={(type) => addBlockAtIndex(type)} />
            </div>
          </div>

          {/* RIGHT — LIVE PREVIEW */}
          {showPreview && (
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 53px)', background: '#fff' }}>
              <article style={{ maxWidth: 640, margin: '0 auto', padding: '32px 26px 80px' }}>
                {imagePreview && (
                  <div style={{ marginBottom: 28, borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9' }}>
                    <img src={imagePreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  </div>
                )}
                <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 800, lineHeight: 1.2, color: '#0f0f0f', margin: '0 0 12px' }}>{formData.title}</h1>
                {blocks.map(block => <PreviewBlock key={block.id} block={block}/>)}
              </article>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddBlog;
