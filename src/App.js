import React, { useEffect, useRef, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Typewriter } from 'react-simple-typewriter';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  // ---- Contact form state ----
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwhNLTCc7vCTLnhAPq_C8smdTfnXLukVyNXM-XWLaxSjncWVxVjMukUMoKHBGS-8n8-dQ/exec';

  // ---- Fancy navbar scroll behavior ----
  const [compact, setCompact] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastYRef = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    AOS.init({ duration: 900, once: true, offset: 40 });
  }, []);

  // lock body scroll when mobile menu open
  useEffect(() => {
    const { style } = document.body;
    if (menuOpen) {
      style.overflow = 'hidden';
      style.touchAction = 'none';
    } else {
      style.overflow = '';
      style.touchAction = '';
    }
    return () => {
      style.overflow = '';
      style.touchAction = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        setCompact(y > 12);
        const last = lastYRef.current;
        const delta = y - last;
        if (Math.abs(delta) > 4) {
          if (y > 120 && delta > 0) setHidden(true);
          else setHidden(false);
        }
        lastYRef.current = y;

        const doc = document.documentElement;
        const h = doc.scrollHeight - window.innerHeight;
        setProgress(h > 0 ? Math.min(100, Math.max(0, (y / h) * 100)) : 0);

        ticking.current = false;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const email = (data.get('email') || '').toString().trim();
    const phone = (data.get('phone') || '').toString().trim();
    if (!email && !phone) {
      setSubmitting(false);
      setStatus({ ok: false, msg: 'Please provide an email or phone number.' });
      return;
    }

    if ((data.get('company') || '').toString().trim() !== '') {
      setSubmitting(false);
      setStatus({ ok: true, msg: 'Thanks!' });
      form.reset();
      return;
    }

    data.append('source', 'website');
    data.append('page', window.location.pathname + window.location.hash);

    try {
      const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: data, redirect: 'follow' });
      let ok = res.ok;
      try {
        const json = await res.json();
        if (json?.status === 'ok' || json?.ok === true) ok = true;
      } catch {}
      if (ok) {
        form.reset();
        setStatus({ ok: true, msg: 'Thanks! We’ll get back to you shortly.' });
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setStatus({ ok: false, msg: 'Something went wrong. Please WhatsApp or call us.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* THEME + GLOBAL */}
      <style>{`
:root {
  --nav-bg: #A7D3C6;   /* mint */
  --nav-ink: #0B4B3A;  /* deep forest */
  --nav-h: 96px;       /* keep navbar height the same */

  --accent: #2B8F78;
  --ring: rgba(43, 143, 120, 0.25);

  --ink: #0B4B3A;
  --muted: #5B6776;
  --body: #1D2732;
  --card: #FFFFFF;
}
@media (max-width: 767px){ :root{ --nav-h: 88px; } } /* same height on phones */

html { scroll-behavior: smooth; }
body, #root { background:#F6F7F8; color:#111; overflow-x:hidden; }
img, video { max-width:100%; height:auto; }
.shadow-soft { box-shadow: 0 6px 18px rgba(0,0,0,.08); }
[id]{ scroll-margin-top: calc(var(--nav-h) + 10px); }

/* ===== Dynamic Navbar ===== */
.nav-shell{
  position:fixed; top:0; left:0; right:0; z-index:50;
  transition: transform .28s ease, background-color .25s ease, box-shadow .25s ease, height .22s ease;
  will-change: transform, background-color, box-shadow, height;
  height: var(--nav-h);
  background: color-mix(in srgb, var(--nav-bg) 92%, transparent);
  color: var(--nav-ink);
  overflow: visible; /* allow logo to overflow when scaled */
}
.nav-shell[data-compact="true"]{
  height: calc(var(--nav-h) - 18px);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 28px rgba(0,0,0,.12);
  background: color-mix(in srgb, var(--nav-bg) 85%, white 15%);
}
.nav-shell[data-hidden="true"]{ transform: translateY(-100%); }

/* progress bar */
.nav-progress{
  position:absolute; left:0; top:0; height:3px; width:100%;
  background: linear-gradient(90deg, var(--accent) var(--p,0%), transparent 0);
  transition: background .14s linear;
}

/* ====== Logo: big on phone + bigger on laptop, navbar height unchanged ====== */
.logo-wrap{ height: 100%; display:flex; align-items:center; }
.logo-img{
  height: 56px; width: auto; object-fit: contain;
  transform-origin: left center;
}
@media (max-width: 767px){
  .logo-img{
    height: 60px;
    transform: scale(2.2) translateY(2px); /* really big on phones */
    will-change: transform;
  }
}
/* laptop/desktop: make it bigger with scale, keep bar height.
   Important: we only increase, never shrink on large screens. */
@media (min-width: 1024px){
  .logo-img{
    height: 100px;
    transform: scale(1.55);
  }
}

/* ===== Right contact cluster (desktop) ===== */
.contact-cluster{
  display:flex;
  align-items:center;
  gap:.8rem;
  flex-wrap:nowrap;
  white-space:nowrap;
  margin-left:.25rem;
}
.contact-text{
  display:flex;
  flex-direction:column;        /* stack "Call Us Today!" above number */
  align-items:flex-end;         /* right align text */
  line-height:1.1;
}
.contact-text .ey{
  font-size:11px;
  text-transform:uppercase;
  opacity:.8;
}
.contact-text .ph{
  font-weight:800;
  letter-spacing:.02em;
  color: var(--nav-ink);
  font-size: 1rem;
}
.contact-btn{
  display:inline-flex;
  align-items:center;
  gap:.5rem;
  padding:.6rem 1rem;
  border-radius:12px;
  font-weight:800;
  background: var(--nav-ink);
  color:#fff;
  text-decoration:none;
  white-space:nowrap;
  border: 1px solid color-mix(in srgb, var(--nav-ink) 20%, transparent);
}

/* ===== MOBILE MENU (sheet) ===== */
.mm-backdrop{
  position: fixed; inset: 0; z-index: 70;
  background: rgba(5, 20, 17, .45);
  opacity: 0; transition: opacity .22s ease;
}
.mm-backdrop[data-open="true"]{ opacity: 1; }

.mm-sheet{
  position: fixed; inset: 0 0 0 auto; /* right side */
  width: min(88vw, 420px);
  z-index: 80;
  transform: translateX(102%);
  transition: transform .28s cubic-bezier(.2,.9,.2,1);
  display: flex; flex-direction: column;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--nav-bg) 92%, #fff 8%) 0%, color-mix(in srgb, var(--nav-bg) 86%, #fff 14%) 100%);
  backdrop-filter: blur(14px) saturate(1.1);
  border-left: 1px solid color-mix(in srgb, var(--nav-ink) 20%, transparent);
  box-shadow: -24px 0 48px rgba(0,0,0,.22);
}
.mm-sheet[data-open="true"]{ transform: translateX(0); }
.mm-head{ display:flex; align-items:center; justify-content:space-between; padding: max(14px, env(safe-area-inset-top)) 16px 8px 16px; }
.mm-close{
  height:40px; width:40px; display:inline-flex; align-items:center; justify-content:center;
  border-radius:12px; border:1px solid color-mix(in srgb, var(--nav-ink) 18%, transparent);
  background: rgba(255,255,255,.65);
}
.mm-links{ padding: 6px 18px 14px 18px; }
.mm-link{
  display:block; padding: 14px 6px; margin: 2px 0;
  font-weight: 800; letter-spacing:.06em; text-transform:uppercase; font-size: clamp(16px, 4.2vw, 22px);
  color: var(--nav-ink);
  transform: translateX(14px); opacity: 0;
  transition: transform .32s cubic-bezier(.2,.9,.2,1), opacity .22s ease;
}
.mm-sheet[data-open="true"] .mm-link{ transform: translateX(0); opacity: 1; }
.mm-link:nth-child(1){ transition-delay: .04s; }
.mm-link:nth-child(2){ transition-delay: .08s; }
.mm-link:nth-child(3){ transition-delay: .12s; }
.mm-link:nth-child(4){ transition-delay: .16s; }
.mm-link:nth-child(5){ transition-delay: .20s; }
.mm-link:nth-child(6){ transition-delay: .24s; }

.mm-divider{ height:1px; background: color-mix(in srgb, var(--nav-ink) 18%, transparent); margin: 6px 18px; }
.mm-actions{
  margin-top:auto;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom)) 16px;
  display:grid; grid-template-columns: 1fr 1fr; gap:10px;
  background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--nav-bg) 90%, #fff 10%) 40%);
  border-top: 1px solid color-mix(in srgb, var(--nav-ink) 16%, transparent);
}
.mm-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
  padding: 12px; border-radius: 14px; font-weight: 800;
  border: 1px solid color-mix(in srgb, var(--nav-ink) 20%, transparent);
  background:#fff; color:#0b3e33;
}
.mm-btn.primary{ background: var(--nav-ink); color:#fff; }

/* Section fade band (rest of site) */
.section-shell{ position:relative }
.section-shell::before{
  content:""; position:absolute; inset:-2rem -9999px auto -9999px; height:220px;
  background:linear-gradient(180deg, rgba(43,143,120,.08), transparent 70%);
  pointer-events:none;
}

/* --- rest styles unchanged --- */
.eyebrow{ display:inline-block; font-size:.8rem; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); background:rgba(43,143,120,.12); border:1px solid var(--ring); padding:.4rem .6rem; border-radius:999px; }
.section-title{ font-family:'Playfair Display', serif; line-height:1.1; color:var(--accent); font-weight:800; margin:.75rem 0 1rem; }
.gold-hr{ height:3px; width:72px; background:var(--accent); border-radius:3px; margin:.75rem 0 1.25rem; }
.lede{ font-weight:600; color:#1D2732; }
.copy{ color:#223041; font-size:1.05rem; }
.badges{ display:flex; flex-wrap:wrap; gap:.5rem .6rem; margin:.35rem 0 1rem; }
.badge{ background:#fff; border:1px solid var(--ring); padding:.45rem .6rem; border-radius:10px; font-size:.9rem; color:#111; box-shadow:0 8px 24px rgba(0,0,0,.06); }
.about-block{ background:transparent; border-left:4px solid var(--accent); padding:.25rem 0 .25rem 1rem; margin:.5rem 0 1.25rem; }
.about-block h5{ margin:0 0 .4rem; font-weight:700; font-size:1rem; color:#0f172a; }
.content-grid{ display:grid; grid-template-columns:1fr; gap:1rem; margin-top:.25rem; }
@media(min-width:768px){ .content-grid{ grid-template-columns: 1fr 1fr; } }
.content-card{ background:#fff; border:1px solid var(--ring); border-radius:14px; padding:1rem 1.1rem; box-shadow:0 10px 24px rgba(0,0,0,.06); position:relative; }
.content-card h5{ font-weight:700; font-size:.95rem; color:#0f172a; }
.stat-row{ display:grid; grid-template-columns:1fr; gap:.6rem; }
@media(min-width:520px){ .stat-row{ grid-template-columns:1fr 1fr; } }
.stat{ border:1px solid var(--ring); border-radius:10px; padding:.6rem .7rem; background:#fff; }
.stat .t{ font-weight:700; }
.stat .s{ font-size:.9rem; color:#4b5563; line-height:1.5; }
.mix-row{ display:grid; grid-template-columns:1fr; gap:1rem; }
@media(min-width:520px){ .mix-row{ grid-template-columns:1fr 1fr; } }
.mix-stat{ padding:1rem 1.1rem; }
.mix-stat .t{ font-size:1.05rem; font-weight:800; color:#0f172a; margin-bottom:.35rem; }
.check-cols{ display:grid; grid-template-columns:1fr; gap:.35rem 1rem; }
@media(min-width:640px){ .check-cols{ grid-template-columns: 1fr 1fr; } }
.check-cols li{ list-style:none; display:flex; gap:.5rem; align-items:flex-start; color:#213044; }
.image-stack{ display:flex; flex-direction:column; gap:1rem; }
.image-card{ background:var(--card); border:1px solid var(--ring); border-radius:16px; padding:.6rem; box-shadow:0 20px 40px rgba(0,0,0,.08); transition: transform .25s ease, box-shadow .25s ease; }
.image-card:hover{ transform: rotate(-.3deg) translateY(-2px); box-shadow:0 26px 60px rgba(0,0,0,.12); }
.image-card img{ border-radius:12px; display:block; width:100%; height:auto; }
.image-card.small{ max-width:100%; margin-left:0; transform:none; }
@media(min-width:1024px){ .image-card.small{ max-width:72%; margin-left:auto; transform:translate(6px,-4px); } }
.stamp{ position:absolute; top:-10px; right:-10px; background:#fff; border:2px dashed var(--accent); color:#111; padding:.35rem .55rem; border-radius:10px; font-weight:800; font-size:.7rem; transform:rotate(6deg); box-shadow:0 6px 16px rgba(0,0,0,.08); }
.why-band{ background: linear-gradient(180deg, rgba(43,143,120,.06), rgba(43,143,120,.02)); border-top: 4px solid var(--accent); border-bottom: 1px solid var(--ring); }
.why-wrap{ max-width:72rem; margin:0 auto; padding:2.5rem 1.5rem; }
.why-head{ text-align:center; margin:0 0 1.25rem; font-family:'Playfair Display', serif; font-weight:800; color:var(--accent); }
.why-copy{ color:#213044; text-align:center; max-width:56rem; margin:.35rem auto 1.25rem; }
.pedigree-panel{ background:#fff; border:1px solid var(--ring); border-radius:16px; padding:14px; margin:0 auto 18px; max-width:860px; box-shadow:0 10px 24px rgba(0,0,0,.06); }
.pedigree-top{ display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap; }
.medal{ display:inline-flex; align-items:center; justify-content:center; min-width:124px; height:48px; padding:0 14px; border-radius:999px; font-weight:800; letter-spacing:.02em; background:linear-gradient(180deg, rgba(43,143,120,.12), rgba(43,143,120,.04)); border:1px solid var(--ring); color:#0f172a; }
.dot{ width:6px; height:6px; border-radius:50%; background:var(--accent); opacity:.7; }
.pedigree-sub{ text-align:center; color:#4b5563; font-weight:600; margin-top:8px; }
.caps{ display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:10px; }
.pedigree-marquee{ position:relative; overflow:hidden; margin: 10px auto 22px; padding:2px 0; -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%); mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%); }
.pedigree-track{ display:flex; gap:.65rem; width:max-content; will-change: transform; animation: pedigree-scroll 24s linear infinite; }
.pedigree-marquee:hover .pedigree-track{ animation-play-state: paused; }
@keyframes pedigree-scroll{ from{ transform: translateX(0); } to{ transform: translateX(-50%); } }
.tag{ background:#fff; border:1px solid var(--ring); border-radius:999px; padding:.45rem .75rem; font-weight:600; font-size:.9rem; white-space:nowrap; box-shadow:0 6px 18px rgba(0,0,0,.05); }
.perks{ display:grid; grid-template-columns:1fr; gap:14px; }
@media(min-width:768px){ .perks{ grid-template-columns:1fr 1fr; } }
.perk{ background:#fff; border:1px solid var(--ring); border-radius:14px; padding:14px 16px; box-shadow:0 8px 22px rgba(0,0,0,.06); }
.perk h4{ margin:0 0 .35rem; font-weight:800; color:#0f172a; font-size:1.05rem; }
.perk p{ margin:0; color:#5B6776; line-height:1.55; font-size:.93rem; }
.why-cta{ text-align:center; margin-top:1.25rem; }
.why-cta a{ display:inline-block; padding:.6rem 1rem; border:1px solid var(--accent); border-radius:12px; font-weight:700; color:#0f172a; background:#fff; box-shadow:0 8px 18px rgba(0,0,0,.06); }
.why-cta a:hover{ background:rgba(43,143,120,.08); }
.company{ background:#fff; border-top:1px solid var(--ring); }
.company-wrap{ max-width:72rem; margin:0 auto; padding:2.25rem 1.5rem; }
.company h3{ text-align:center; color:var(--accent); font-family:'Playfair Display', serif; font-weight:800; margin:0 0 1rem; }
.company p{ color:#223041; }
.company-grid{ display:grid; grid-template-columns:1fr; gap:1rem; }
@media(min-width:900px){ .company-grid{ grid-template-columns:1fr 1fr; } }
.company-card{ background:#fff; border:1px solid var(--ring); border-radius:14px; padding:16px; box-shadow:0 8px 22px rgba(0,0,0,.06); }
.company-card h4{ margin:0 0 .4rem; font-weight:800; color:#0f172a; }
.company-card ul{ margin:.25rem 0 0; padding:0; list-style:none; }
.company-card li{ display:flex; gap:.5rem; margin:.35rem 0; color:#213044; }
      `}</style>

      {/* NAVBAR */}
      <header
        className="nav-shell px-4 md:px-8 shadow-soft"
        data-compact={compact}
        data-hidden={hidden}
        onMouseEnter={() => setHidden(false)}
      >
        <div className="nav-progress" style={{ ['--p']: `${progress}%` }} />

        <div className="h-full max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo — huge on phones, bigger on laptops, navbar height unchanged */}
          <div className="logo-wrap flex-shrink-0">
            <img
              src="public/assets/Windsor Heights Logo (1).png"
              alt="Assotech Windsor Group"
              className="logo-img"
            />
          </div>

          {/* Desktop nav + contact cluster */}
          <nav className="hidden md:flex items-center gap-8 font-semibold uppercase tracking-wide min-w-0">
            {['overview', 'gallery', 'brochure', 'sitemap', 'location', 'contact'].map((link) => (
              <a key={link} href={`#${link}`} className="hover:underline underline-offset-4 whitespace-nowrap">{link}</a>
            ))}

            {/* Right-side: stacked text + phone + button aligned */}
            <div className="contact-cluster shrink-0">
              <div className="contact-text">
                <span className="ey">Call Us Today!</span>
                <span className="ph">+91-9311967199</span>
              </div>
              <a
                href="https://wa.me/919311967199"
                target="_blank"
                rel="noreferrer"
                className="contact-btn"
              >
                📞 Contact Us
              </a>
            </div>
          </nav>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border border-[color:var(--nav-ink)]/20 bg-white/70 flex-shrink-0"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M3 6h18M3 12h18M3 18h18'} />
            </svg>
          </button>
        </div>
      </header>

      {/* ===== MOBILE MENU: Backdrop + Sliding Sheet ===== */}
      <div
        className="mm-backdrop"
        data-open={menuOpen}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
        style={{ pointerEvents: menuOpen ? 'auto' : 'none' }}
      />
      <aside
        id="mobile-menu"
        className="mm-sheet"
        data-open={menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div className="mm-head">
          <img src="public/assets/Windsor Heights Logo (1).png" alt="Assotech Windsor Group" className="h-12 w-auto" />
          <button onClick={() => setMenuOpen(false)} className="mm-close" aria-label="Close menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mm-links">
          {['overview', 'gallery', 'brochure', 'sitemap', 'location', 'contact'].map((link) => (
            <a
              key={link}
              className="mm-link"
              href={`#${link}`}
              onClick={() => setMenuOpen(false)}
            >
              {link}
            </a>
          ))}
        </nav>

        <div className="mm-divider" />

        <div style={{ padding: '6px 18px 10px' }}>
          <div style={{ fontSize:'12px', opacity:.75, color:'var(--nav-ink)' }}>Call Us Today!</div>
          <div style={{ fontWeight:900, fontSize:'18px', color:'var(--nav-ink)' }}>+91-9311967199</div>
        </div>

        <div className="mm-actions">
          <a
            className="mm-btn"
            href="tel:+919311967199"
            onClick={() => setMenuOpen(false)}
          >
            <span>Call</span>
          </a>
          <a
            className="mm-btn primary"
            href="https://wa.me/919311967199"
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            <span>WhatsApp</span>
          </a>
        </div>
      </aside>

      {/* PAGE CONTENT */}
      <main>
        {/* HERO */}
        <section className="relative min-h-[88vh] flex items-center justify-center">
          <img src="/hero.jpg" alt="hero" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative text-center px-4 max-w-3xl text-white" data-aos="fade-up">
            <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Windsor Heights, Katni
            </h1>
            <p className="text-lg md:text-2xl text-gray-200">
              <Typewriter
                words={[
                  'Premium LIG & MIG Township',
                  'Under PMAY AHP – Jhinjhri, Katni',
                  'Modern Living. Government Support.',
                ]}
                loop={0} cursor cursorStyle="|" typeSpeed={60} deleteSpeed={40} delaySpeed={1400}
              />
            </p>
            <a href="#contact" className="inline-block mt-8 rounded px-6 py-3 font-semibold hover:opacity-90 transition text-black" style={{ background: 'var(--accent)' }}>
              Book a Site Visit
            </a>
          </div>
        </section>

        {/* OVERVIEW */}
        <section id="overview" className="pt-6 md:pt-8 pb-16 md:pb-20 border-t-4 bg-white" style={{ borderColor: 'var(--accent)' }}>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 px-6 section-shell">
            <div data-aos="fade-right">
              <span className="eyebrow">Project Overview</span>
              <h2 className="section-title text-3xl md:text-5xl">Windsor Heights, Katni</h2>
              <div className="gold-hr" />
              <p className="lede">Luxury Meets Affordability, Backed by Government Assurance</p>

              <div className="badges">
                <span className="badge">Premium MIG & LIG</span>
                <span className="badge">Stilt + 6 Floors</span>
                <span className="badge">Government-Backed PPP</span>
              </div>

              <div className="about-block" data-aos="fade-up" data-aos-delay="80">
                <h5>About the Project</h5>
                <p className="copy">
                  Windsor Heights is a special government-backed residential township under <strong>Pradhan Mantri Awas Yojana (PMAY - AHP)</strong>.
                  It is being developed with the <strong>Katni Municipal Corporation</strong> through the <strong>Public-Private Partnership (PPP)</strong> model.
                  Built by <strong>Assotech Windsor LLP</strong>, the project focuses on strong construction quality, on-time delivery, and a safe, well-equipped community.
                  It brings the comfort of modern living with trust, clear dealings, and long-term value.
                </p>
              </div>

              <div className="content-grid">
                <div className="content-card" data-aos="fade-up">
                  <div className="stamp">RERA Approved*</div>
                  <h5>Apartment Mix</h5>
                  <div className="mix-row">
                    <div className="stat mix-stat">
                      <div className="t">LIG</div>
                      <div className="s">Carpet: ~52&nbsp;sqm</div>
                      <div className="s">Built-up: ~67&nbsp;sqm</div>
                      <div className="s">Super: ~76&nbsp;sqm</div>
                    </div>
                    <div className="stat mix-stat">
                      <div className="t">MIG</div>
                      <div className="s">Carpet: ~66&nbsp;sqm</div>
                      <div className="s">Built-up: ~75&nbsp;sqm</div>
                      <div className="s">Super: ~89&nbsp;sqm</div>
                    </div>
                  </div>
                </div>

                <div className="content-card" data-aos="fade-up" data-aos-delay="70">
                  <h5>Construction Status</h5>
                  <ul className="check-cols">
                    <li>LIG-1: stilt + 6 floors complete</li>
                    <li>MIG-1 up to the 5th floor</li>
                    <li>Annexure-I/II schedule tracking</li>
                    <li>Strict penalties on delays</li>
                  </ul>
                </div>

                <div className="content-card" data-aos="fade-up" data-aos-delay="140">
                  <h5>Lifestyle & Benefits</h5>
                  <ul className="check-cols">
                    <li>Clubhouse, gym, indoor games</li>
                    <li>Landscaped gardens & tracks</li>
                    <li>Kids’ play zones</li>
                    <li>Prime Jhinjhri connectivity</li>
                    <li>PMAY (AHP) subsidy (eligible)</li>
                    <li>RERA Approved</li>
                  </ul>
                </div>

                <div className="content-card" data-aos="fade-up" data-aos-delay="210">
                  <h5>Connectivity & Locale</h5>
                  <ul className="check-cols">
                    <li>Central School Road — approx. 5&nbsp;minutes</li>
                    <li>Katni Junction Railway Station — approx. 12&nbsp;minutes</li>
                    <li>District Hospital — approx. 15&nbsp;minutes</li>
                    <li>Daily Market & Essential Stores — approx. 8&nbsp;minutes</li>
                    <li>NH-30 Highway Access — quick entry & exit</li>
                  </ul>
                </div>
              </div>
            </div>

            <div data-aos="fade-left">
              <div className="image-stack">
                <div className="image-card"><img src="f+6.png" alt="Windsor Heights — front elevation render" /></div>
                <div className="image-card small"><img src="/swim.png" alt="Clubhouse with swimming pool" /></div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE — Pedigree + Perks */}
        <section className="why-band">
          <div className="why-wrap" data-aos="fade-up">
            <h3 className="why-head text-2xl md:text-3xl">Why Choose Windsor Heights?</h3>

            <div className="pedigree-panel" data-aos="zoom-in">
              <div className="pedigree-top">
                <span className="medal">Trusted Name</span>
                <span className="dot" />
                <span className="medal">25+ Years Of Experience</span>
              </div>
              <div className="pedigree-sub">Our Completed Projects:</div>
              <div className="caps">
                <span className="cap">Windsor Green · Noida</span>
                <span className="cap">Windsor Park · Ghaziabad</span>
                <span className="cap">GAIL Society · Noida</span>
                <span className="cap">Windsor Hills · Gwalior</span>
                <span className="cap">Metropolis City · Rudrapur</span>
                <span className="cap">Golf Vista Apartments · Greater Noida</span>
                <span className="cap">Shipra Sun City · Kaushambi</span>
              </div>
            </div>

            <div className="pedigree-marquee" aria-label="Brand promises by Assotech Windsor LLP">
              <div className="pedigree-track">
                {[
                  'Shaping Skylines, Enriching Lives',
                  'Luxury Homes, Built to Last',
                  'Where Quality Meets Affordability',
                  'Delivering Trust, One Project at a Time',
                  'Creating Communities, Not Just Buildings',
                  'Your Dream Home, Our Proven Legacy',
                ].concat([
                  'Shaping Skylines, Enriching Lives',
                  'Luxury Homes, Built to Last',
                  'Where Quality Meets Affordability',
                  'Delivering Trust, One Project at a Time',
                  'Creating Communities, Not Just Buildings',
                  'Your Dream Home, Our Proven Legacy',
                ]).map((t, i) => (
                  <span key={i} className="tag">{t}</span>
                ))}
              </div>
            </div>

            <div className="perks">
              <div className="perk" data-aos="fade-up" data-aos-delay="60">
                <h4>Exclusive Clubhouse & Leisure</h4>
                <p>Residents-only clubhouse with gym, indoor games, and a calm community lounge.</p>
              </div>
              <div className="perk" data-aos="fade-up" data-aos-delay="90">
                <h4>Modern Luxury Living</h4>
                <p>Contemporary architecture, premium finishes, and thoughtfully curated amenities.</p>
              </div>
              <div className="perk" data-aos="fade-up" data-aos-delay="120">
                <h4>Design Your Home</h4>
                <p>Choose a turnkey interior package crafted in collaboration with leading Delhi designers.</p>
              </div>
              <div className="perk" data-aos="fade-up" data-aos-delay="150">
                <h4>Landscaped Green Retreats</h4>
                <p>Walking tracks, themed gardens, and quiet meditation pockets across the campus.</p>
              </div>
              <div className="perk" data-aos="fade-up" data-aos-delay="180">
                <h4>Secure & Private Living</h4>
                <p>24×7 gated entry with CCTV coverage and controlled access for peace of mind.</p>
              </div>
              <div className="perk" data-aos="fade-up" data-aos-delay="210">
                <h4>On-Site Convenience</h4>
                <p>Daily essentials within the premises — groceries, pharmacy, and services.</p>
              </div>
              <div className="perk" data-aos="fade-up" data-aos-delay="240">
                <h4>Covered Parking & EV-Ready Bays</h4>
                <p>Dedicated parking with EV charging points to future-proof your home.</p>
              </div>
              <div className="perk" data-aos="fade-up" data-aos-delay="270">
                <h4>Facility Management & Backup</h4>
                <p>Professional upkeep, water assurance, and reliable power backup.</p>
              </div>
            </div>

            <div className="why-cta" data-aos="zoom-in" data-aos-delay="320">
              <a href="#contact">Ask about interior design packages</a>
            </div>
          </div>
        </section>

        {/* COMPANY */}
        <section className="company">
          <div className="company-wrap" data-aos="fade-up">
            <h3 className="text-2xl md:text-3xl">Legacy & Vision for Katni</h3>
            <p className="why-copy" style={{marginTop:'.25rem'}}>
              With a proven presence across India, our portfolio reflects disciplined construction, transparent dealings, and on-time delivery.
              With Windsor Heights, we bring this nationwide expertise to Katni—shaping a refined, future-ready neighborhood for its residents.
            </p>

            <div className="company-grid">
              <div className="company-card" data-aos="fade-right">
                <h4>Our Legacy</h4>
                <ul>
                  <li>25+ years delivering residential communities across India.</li>
                  <li>Trusted partners behind Windsor Green, Windsor Park, GAIL Society, Windsor Hills, and Metropolis City.</li>
                  <li>Strong track record of structural quality, compliance, and timely handover.</li>
                </ul>
              </div>

              <div className="company-card" data-aos="fade-left">
                <h4>Vision for Katni</h4>
                <ul>
                  <li>Raise the city’s skyline with elegant, efficient mid-rise homes.</li>
                  <li>Blend affordability with premium finishes and reliable facility management.</li>
                  <li>Create a safe, green campus with lifestyle amenities and EV-ready infrastructure.</li>
                  <li>Enable local jobs through construction and ongoing township operations.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* GALLERY */}
        <section id="gallery" className="py-20 md:py-24 border-t-4 bg-white" style={{ borderColor: 'var(--accent)' }}>
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-10" style={{ color: 'var(--accent)', fontFamily: "'Playfair Display', serif" }} data-aos="fade-down">
              Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['entrance-logo.png', 'entrance.png', 'park.png'].map((img, i) => (
                <img key={img} src={`/assets/${img}`} alt={`Gallery ${i + 1}`} className="rounded-lg" data-aos="zoom-in" data-aos-delay={i * 100} />
              ))}
            </div>
          </div>
        </section>

        {/* BROCHURE */}
        <section id="brochure" className="py-20 md:py-24 border-t-4 bg-white text-center" style={{ borderColor: 'var(--accent)' }}>
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: 'var(--accent)', fontFamily: "'Playfair Display', serif" }} data-aos="fade-up">
              Download Brochure
            </h2>
            <p className="mb-8 text-gray-700" data-aos="fade-up" data-aos-delay="150">
              Get all the specs, layouts, and amenities in our detailed brochure.
            </p>
            <a href="/assets/brochure.pdf" target="_blank" rel="noopener noreferrer"
               className="inline-block rounded px-6 py-3 font-semibold hover:opacity-90 transition text-black"
               style={{ background: 'var(--accent)' }} data-aos="zoom-in">
              Download Brochure
            </a>
          </div>
        </section>

        {/* SITE MAP */}
        <section id="sitemap" className="py-20 md:py-24 border-t-4 bg-white text-center" style={{ borderColor: 'var(--accent)' }}>
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ color: 'var(--accent)', fontFamily: "'Playfair Display', serif" }} data-aos="fade-up">
              Site Map
            </h2>
            <div className="mx-auto rounded-lg overflow-hidden border-4 max-w-2xl" style={{ borderColor: 'var(--accent)' }} data-aos="zoom-in">
              <img src="/assets/sitemap.png" alt="Site Map" />
            </div>
          </div>
        </section>

        {/* LOCATION */}
        <section id="location" className="py-20 md:py-24 border-t-4 bg-white" style={{ borderColor: 'var(--accent)' }}>
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: 'var(--accent)', fontFamily: "'Playfair Display', serif" }}>
              Location
            </h2>

            <div className="mx-auto rounded-lg overflow-hidden border-4 max-w-3xl aspect-[16/9]" style={{ borderColor: 'var(--accent)' }}>
              <iframe
                title="Windsor Heights, Katni — Map"
                src="https://www.google.com/maps?q=23.796222,80.357694&z=16&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=23.796222,80.357694"
                target="_blank" rel="noreferrer"
                className="rounded px-5 py-3 font-semibold text-black"
                style={{ background: 'var(--accent)' }}
              >
                Open in Google Maps
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=23.796222,80.357694"
                target="_blank" rel="noreferrer"
                className="rounded px-5 py-3 font-semibold border"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              >
                View Nearby
              </a>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Co-ordinates: 23°47'46.4"N, 80°21'27.7"E (23.796222, 80.357694)
            </p>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="py-20 md:py-24 border-t-4 bg-white text-center" style={{ borderColor: 'var(--accent)' }}>
          <div className="max-w-xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: 'var(--accent)', fontFamily: "'Playfair Display', serif" }} data-aos="fade-up">
              Contact Us
            </h2>
            <p className="mb-8 text-gray-700" data-aos="fade-up" data-aos-delay="150">
              Interested? Book a site visit or send us a message.
            </p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 text-left" data-aos="fade-up" data-aos-delay="300">
              <input type="text" name="company" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <input name="name" type="text" placeholder="Your Name" className="p-3 rounded border border-gray-300 bg-white text-gray-900 placeholder-gray-400" />
              <input name="email" type="email" placeholder="Email" className="p-3 rounded border border-gray-300 bg-white text-gray-900 placeholder-gray-400" />
              <input name="phone" type="tel" placeholder="Phone Number" className="p-3 rounded border border-gray-300 bg-white text-gray-900 placeholder-gray-400" />
              <textarea name="message" placeholder="Message" className="p-3 h-32 rounded border border-gray-300 bg-white text-gray-900 placeholder-gray-400" />
              <button type="submit" disabled={submitting} className="rounded px-6 py-3 font-semibold hover:opacity-90 transition text-black disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
              {status && (<div className={status.ok ? 'text-green-700' : 'text-red-600'}>{status.msg}</div>)}
            </form>
          </div>
        </section>
      </main>

      {/* WhatsApp CTA */}
      <a href="https://wa.me/919311967199" target="_blank" rel="noreferrer"
         className="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-3 rounded-full shadow-lg z-30">
        📞 Chat on WhatsApp
      </a>

      {/* FOOTER */}
      <footer className="text-center py-6 text-sm bg-white border-t" style={{ borderColor: 'rgba(0,0,0,.06)' }}>
        <div className="text-gray-500">© 2025 Assotech Windsor LLP. All Rights Reserved.</div>
      </footer>
    </>
  );
}

export default App;
