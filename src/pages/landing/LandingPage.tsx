import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  teal: "#0E7C7B", tealDeep: "#083f3e", tealBright: "#2AA7A5", tealSoft: "#E2EFEE",
  gold: "#E7A81C", goldDeep: "#B67F0C",
  paper: "#F2F5F3", card: "#FFFFFF", line: "#D9E3E0",
  ink: "#0A1E1D", ink2: "#123433",
  muted: "#5C716D", muted2: "#869894",
  clay: "#B85C38", paddy: "#2F8F5B", due: "#C1454B",
};

const APP_URL = "/auth";
const CONTACT_EMAIL = "mdalifbabu.0x@gmail.com";
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const BN: React.CSSProperties = { fontFamily: "'Hind Siliguri', sans-serif" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, style: { opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(22px)", transition: "opacity .6s ease, transform .6s ease" } as React.CSSProperties };
}

// ─── Image slot ───────────────────────────────────────────────────────────────
function ImgSlot({ src, alt, style, className }: { src: string; alt: string; style?: React.CSSProperties; className?: string }) {
  const [err, setErr] = useState(false);
  if (err) return (
    <div className={className} style={{ background: C.tealSoft, border: `2px dashed ${C.tealBright}`, borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: C.muted, padding: 24, ...style }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
      <span style={{ fontSize: 12, textAlign: "center", maxWidth: 200 }}>{alt}</span>
    </div>
  );
  return <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)} className={className} style={{ borderRadius: 16, objectFit: "cover", width: "100%", height: "100%", ...style }} />;
}

// ─── Ledger card (signature hero element) ────────────────────────────────────
function LedgerCard() {
  return (
    <div style={{ background: C.card, borderRadius: 22, boxShadow: "0 40px 80px -30px rgba(0,0,0,.6)", transform: "rotate(1.4deg)", position: "relative" }}>
      <div style={{ background: `linear-gradient(160deg,${C.teal},${C.tealDeep})`, color: "#fff", padding: "16px 18px", borderRadius: "22px 22px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ ...BN, fontSize: 15, fontWeight: 700 }}>বোরো ২০২৫</div>
          <div style={{ ...MONO, fontSize: 11, opacity: 0.8, marginTop: 2 }}>চাকলমা গভীর নলকূপ</div>
        </div>
        <span style={{ ...MONO, background: C.gold, color: "#3a2905", fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 20 }}>চলমান</span>
      </div>
      <div style={{ padding: "6px 4px" }}>
        {[
          { name: "মোঃ রহিম উদ্দিন", code: "CHK-০০১ · ৬৬ শতক", due: "৳ ৪,২০০", paid: false },
          { name: "ফাতেমা বেগম", code: "CHK-০০২ · ৩৩ শতক", due: "পরিশোধিত", paid: true },
          { name: "আব্দুল করিম", code: "CHK-০০৩ · ৯৯ শতক", due: "৳ ৬,৮০০", paid: false },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderTop: i > 0 ? `1px solid #EEF3F1` : undefined }}>
            <div>
              <div style={{ ...BN, fontSize: 14.5, fontWeight: 600 }}>{r.name}</div>
              <div style={{ ...MONO, fontSize: 11, color: C.muted2, marginTop: 1 }}>{r.code}</div>
            </div>
            <div style={{ fontSize: r.paid ? 13 : 15, fontWeight: 700, color: r.paid ? C.paddy : C.due }}>{r.due}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderTop: `2px solid ${C.ink}`, margin: "4px 8px 0" }}>
        <span style={{ ...MONO, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: C.muted }}>মোট বকেয়া · Total due</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: C.due }}>৳ ১১,০০০</span>
      </div>
      {/* POS chip */}
      <div style={{ position: "absolute", bottom: -18, left: 22, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 13px", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, boxShadow: "0 12px 24px -12px rgba(0,0,0,.3)", ...MONO }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2"><path d="M4 4h16v12H4z"/><path d="M8 20h8"/></svg>
        POS রসিদ
      </div>
      {/* QR chip */}
      <div style={{ position: "absolute", bottom: -24, right: 20, width: 60, height: 60, borderRadius: 14, background: C.ink, display: "grid", placeItems: "center", boxShadow: "0 14px 26px -10px rgba(0,0,0,.5)" }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" fill="none" stroke="#fff" strokeWidth="1.6"/><rect x="16" y="16" width="3" height="3"/><rect x="16" y="20" width="1.5" height="1.5"/><rect x="20" y="16" width="1.5" height="1.5"/></svg>
      </div>
    </div>
  );
}

// ─── Phone mockup ─────────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div style={{ width: 280, margin: "0 auto", background: "#0c1b1a", borderRadius: 38, padding: 9, boxShadow: "0 40px 80px -30px rgba(0,0,0,.5)" }}>
      <div style={{ background: C.paper, borderRadius: 30, overflow: "hidden" }}>
        <div style={{ background: `linear-gradient(160deg,${C.teal},${C.tealDeep})`, color: "#fff", padding: "20px 16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"/></svg>
            </div>
            <div>
              <div style={{ ...BN, fontSize: 14, fontWeight: 700 }}>irripump</div>
              <div style={{ fontSize: 10, opacity: 0.75, ...BN }}>চাকলমা গভীর নলকূপ</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            {[["পাম্প", "চাকলমা"], ["বছর", "২০২৫"], ["মৌসুম", "বোরো"]].map(([k, v]) => (
              <div key={k} style={{ flex: 1, background: "rgba(255,255,255,.13)", borderRadius: 9, padding: "6px 8px", fontSize: 11, ...BN }}>
                <div style={{ fontSize: 8, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.5 }}>{k}</div>
                {v}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[["মোট বকেয়া", "৳ ১৮,২০০", C.due], ["মোট আয়", "৳ ১,২৬,০০০", C.paddy]].map(([label, val, color]) => (
              <div key={label} style={{ flex: 1, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 13, padding: 10 }}>
                <div style={{ fontSize: 9.5, color: C.muted, ...BN }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3, color: color as string }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 13, overflow: "hidden" }}>
            <div style={{ padding: "9px 12px", fontSize: 11.5, fontWeight: 700, borderBottom: `1px dashed ${C.line}`, ...BN }}>মৌসুম অনুযায়ী হিসাব</div>
            {[["বোরো ২০২৫", "৳ ১২,৪০০", C.due], ["আউশ ২০২৪", "৳ ৫,৮০০", C.due], ["আমন ২০২৪", "৳ ০", C.paddy]].map(([s, v, c], i) => (
              <div key={s} style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", fontSize: 12, borderTop: i > 0 ? `1px solid #EEF3F1` : undefined, ...BN }}>
                <span>{s}</span><span style={{ color: c as string, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const scrollY = useScrollY();
  const [open, setOpen] = useState(false);
  const scrolled = scrollY > 40;

  const links = [
    { href: "#features", label: "ফিচার · Features" },
    { href: "#how", label: "যেভাবে কাজ করে · How it works" },
    { href: "#app", label: "অ্যাপ · App" },
    { href: "#faq", label: "প্রশ্ন · FAQ" },
  ];

  return (
    <>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,.94)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : undefined,
        boxShadow: scrolled ? `0 1px 0 ${C.line}` : undefined,
        transition: "background .3s, box-shadow .3s",
      }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: scrolled ? C.teal : "rgba(255,255,255,.18)", display: "grid", placeItems: "center", transition: "background .3s" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"/></svg>
            </div>
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: 0.3, color: scrolled ? C.ink : "#fff", transition: "color .3s" }}>irripump</span>
          </Link>

          {/* Desktop links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 30 }} className="hidden md:flex">
            {links.map(l => (
              <a key={l.href} href={l.href} style={{ color: scrolled ? C.ink : "rgba(255,255,255,.9)", fontSize: 14.5, fontWeight: 500, textDecoration: "none", ...BN, transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.gold)}
                onMouseLeave={e => (e.currentTarget.style.color = scrolled ? C.ink : "rgba(255,255,255,.9)")}>
                {l.label}
              </a>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="hidden md:flex">
            <Link to="/farmer" style={{ color: scrolled ? C.teal : "rgba(255,255,255,.85)", fontWeight: 600, fontSize: 13.5, textDecoration: "none", ...BN, border: `1px solid ${scrolled ? C.teal : "rgba(255,255,255,.35)"}`, padding: "8px 14px", borderRadius: 10, transition: "all .2s" }}>কৃষক পোর্টাল · Farmer</Link>
            <Link to={APP_URL} style={{ color: scrolled ? C.ink : "#fff", fontWeight: 600, fontSize: 14.5, textDecoration: "none", ...BN }}>লগ ইন · Login</Link>
            <Link to={APP_URL} style={{ ...BN, background: `linear-gradient(150deg,${C.gold},${C.goldDeep})`, color: "#3a2905", fontSize: 15, fontWeight: 600, padding: "11px 20px", borderRadius: 13, textDecoration: "none", boxShadow: "0 8px 20px -6px rgba(183,127,15,.6)" }}>শুরু করুন · Start</Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: scrolled ? C.ink : "#fff" }} aria-label="মেনু">
            {open
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            }
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div style={{ background: C.card, borderTop: `1px solid ${C.line}`, padding: "16px 24px 24px" }}>
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ display: "block", padding: "15px 4px", fontSize: 17, fontWeight: 600, borderBottom: `1px solid ${C.line}`, color: C.ink, textDecoration: "none", ...BN }}>{l.label}</a>
            ))}
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <Link to="/farmer" onClick={() => setOpen(false)} style={{ ...BN, textAlign: "center", padding: "13px 20px", border: `2px solid ${C.teal}`, borderRadius: 13, color: C.teal, fontWeight: 600, textDecoration: "none" }}>কৃষক পোর্টাল · Farmer Portal</Link>
              <Link to={APP_URL} onClick={() => setOpen(false)} style={{ ...BN, textAlign: "center", padding: "13px 20px", border: `1px solid ${C.line}`, borderRadius: 13, color: C.ink, fontWeight: 600, textDecoration: "none" }}>লগ ইন · Login</Link>
              <Link to={APP_URL} onClick={() => setOpen(false)} style={{ ...BN, textAlign: "center", padding: "13px 20px", background: `linear-gradient(150deg,${C.gold},${C.goldDeep})`, borderRadius: 13, color: "#3a2905", fontWeight: 700, textDecoration: "none" }}>শুরু করুন · Get Started</Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section style={{ background: `linear-gradient(158deg,${C.teal} 0%,#0a5150 52%,${C.tealDeep} 100%)`, color: "#fff", padding: "150px 0 110px", overflow: "hidden", position: "relative" }}>
      {/* SVG ripple rings */}
      <svg style={{ position: "absolute", top: -160, right: -160, width: 620, height: 620, pointerEvents: "none", opacity: 0.5 }} viewBox="0 0 620 620">
        {[90, 160, 230, 300].map(r => <circle key={r} cx="310" cy="310" r={r} fill="none" stroke="#fff" strokeOpacity="0.10"/>)}
      </svg>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px", position: "relative" }}>
        {/* 2-col layout on md+ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 64, alignItems: "center" }} className="md:grid-cols-[1.05fr_.95fr]" >
          {/* Left: copy */}
          <div>
            <div style={{ ...MONO, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.gold, marginBottom: 18 }}>
              রুরাল বাংলাদেশের জন্য · For Rural Bangladesh · সিজন লেজার
            </div>
            <h1 style={{ margin: 0 }}>
              <span style={{ ...BN, display: "block", fontSize: "clamp(34px,5.5vw,56px)", lineHeight: 1.08, fontWeight: 700, letterSpacing: -0.5 }}>
                কাগজের খাতা<br />এখন ডিজিটাল
              </span>
              <span style={{ display: "block", fontSize: "clamp(18px,3vw,26px)", fontWeight: 500, color: C.gold, marginTop: 12 }}>
                Your irrigation ledger, now digital
              </span>
            </h1>
            <p style={{ ...BN, fontSize: "clamp(15px,2vw,17px)", color: "rgba(255,255,255,.86)", margin: "22px 0 8px", maxWidth: 520, lineHeight: 1.65 }}>
              গভীর নলকূপের প্রতি মৌসুমের পানির বকেয়া, পেমেন্ট আর কৃষকের হিসাব — সব এক জায়গায়।
              বকেয়া নিজে থেকে হিসাব হয়, রসিদ প্রিন্ট হয় এক ট্যাপে।
            </p>
            <p style={{ fontSize: "clamp(13px,1.5vw,15px)", color: "rgba(255,255,255,.65)", margin: "0 0 28px", maxWidth: 520, lineHeight: 1.6 }}>
              Season-wise dues, payments &amp; farmer records — all in one place.
              Dues calculate automatically; receipts print in one tap.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link to={APP_URL} style={{ ...BN, display: "inline-flex", alignItems: "center", gap: 8, background: `linear-gradient(150deg,${C.gold},${C.goldDeep})`, color: "#3a2905", fontSize: 15, fontWeight: 700, padding: "13px 24px", borderRadius: 13, textDecoration: "none", boxShadow: "0 10px 24px -8px rgba(183,127,15,.6)" }}>
                ফ্রি শুরু করুন · Get Started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/farmer" style={{ ...BN, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.08)", color: "#fff", border: "1px solid rgba(255,255,255,.28)", fontSize: 15, fontWeight: 600, padding: "13px 24px", borderRadius: 13, textDecoration: "none" }}>
                কৃষক পোর্টাল · Farmer Portal
              </Link>
            </div>
            <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "rgba(255,255,255,.72)", ...BN }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold, flexShrink: 0 }} />
              পাম্প · বছর · মৌসুম অনুযায়ী · Pump · Year · Season
            </div>
          </div>

          {/* Right: ledger card — hidden on mobile, shown on md+ */}
          <div className="hidden md:block" style={{ paddingBottom: 42 }}>
            <LedgerCard />
          </div>
        </div>

        {/* Hero image slot (full-width on mobile) */}
        <div className="md:hidden" style={{ marginTop: 48 }}>
          <ImgSlot
            src="/images/hero-field.jpg"
            alt="সেচ মাঠ / Irrigation field — replace with your own photo"
            style={{ width: "100%", height: 220 }}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────────
function StatsStrip() {
  const stats = [
    { n: "১ বিঘা = ৩৩ শতক", l: "Enter shatak, see bigha · শতকে ইনপুট, বিঘায় দেখা" },
    { n: "Pump → Season", l: "Separate ledger per season · মৌসুম অনুযায়ী লেজার" },
    { n: "Android App", l: "Operator's pocket tool · অপারেটরের হাতে" },
    { n: "বাংলা + English", l: "Receipts & full app · রসিদ ও পুরো অ্যাপ" },
  ];
  return (
    <section style={{ background: C.ink, color: "#fff", padding: "22px 0" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-around", gap: 24, flexWrap: "wrap", textAlign: "center" }}>
        {stats.map(({ n, l }) => (
          <div key={n}>
            <div style={{ ...BN, fontSize: 22, fontWeight: 700, color: C.gold }}>{n}</div>
            <div style={{ ...BN, fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Problem / Solution ───────────────────────────────────────────────────────
function ProblemSolutionSection() {
  const r = useReveal();
  return (
    <section style={{ padding: "96px 0", background: C.paper }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px" }}>
        <div ref={r.ref} style={{ ...r.style, maxWidth: 640, margin: "0 auto 54px", textAlign: "center" }}>
          <div style={{ ...MONO, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.teal, marginBottom: 12 }}>সমস্যা ও সমাধান · Problem & Solution</div>
          <h2 style={{ ...BN, fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.15, margin: 0, color: C.ink }}>খাতার হিসাব রাখা কঠিন।<br />irripump সহজ করে।</h2>
          <p style={{ fontSize: 15, color: C.muted2, marginTop: 8 }}>Paper ledgers are error-prone. irripump makes it simple.</p>
        </div>

        {/* Image slot between heading and cards */}
        <div style={{ marginBottom: 40, maxWidth: 780, margin: "0 auto 40px" }}>
          <ImgSlot src="/images/problem-khata.jpg" alt="কাগজের খাতা / Paper ledger problem — replace with your photo" style={{ width: "100%", height: 220 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 22 }} className="md:grid-cols-2">
          {[
            {
              tag: "পুরনো নিয়ম", title: "হাতে লেখা খাতা", bg: "#fbf3f0", tagColor: C.clay,
              items: ["কে কত দিয়েছে, কত বাকি — মনে রাখা মুশকিল", "বকেয়া নিয়ে কৃষকের সাথে ভুল বোঝাবুঝি", "প্রতিবার হাতে হিসাব, ভুলের সম্ভাবনা", "খাতা হারালে সব হিসাব শেষ"],
              icon: "✕", iconBg: "#f3ddd4", iconColor: C.clay,
            },
            {
              tag: "irripump-এ", title: "ডিজিটাল লেজার", bg: "linear-gradient(160deg,#eef6f2,#e3f0ec)", tagColor: C.paddy,
              items: ["প্রতি কৃষকের বকেয়া ও পেমেন্ট এক নজরে", "বকেয়া নিজে থেকে হিসাব (FIFO), ভুল নেই", "QR সহ রসিদ প্রিন্ট, কৃষক নিজে দেখতে পারে", "সব তথ্য নিরাপদে সংরক্ষিত, কখনো হারায় না"],
              icon: "✓", iconBg: "#cfe9dc", iconColor: C.paddy,
            },
          ].map(({ tag, title, bg, tagColor, items, icon, iconBg, iconColor }) => (
            <div key={tag} style={{ borderRadius: 20, padding: "30px", background: bg, border: `1px solid ${C.line}` }}>
              <div style={{ ...MONO, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: tagColor }}>{tag}</div>
              <h3 style={{ ...BN, fontSize: 22, fontWeight: 700, margin: "8px 0 16px", color: C.ink }}>{title}</h3>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {items.map(item => (
                  <li key={item} style={{ display: "flex", gap: 11, fontSize: 15, color: C.ink2, ...BN }}>
                    <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 7, background: iconBg, color: iconColor, display: "grid", placeItems: "center", marginTop: 1, fontSize: 13, fontWeight: 700 }}>{icon}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────
const FEATURES = [
  { bn: "মৌসুমভিত্তিক খতিয়ান", en: "Season-wise ledger · auto due", desc: "প্রতি মৌসুমের বকেয়া নিজে থেকে হিসাব হয় FIFO নিয়মে।", path: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>' },
  { bn: "শতক ও বিঘা", en: "Land in shatak · bigha auto", desc: "জমি শতকে ইনপুট, বিঘা নিজে থেকে দেখায় (১ বিঘা = ৩৩ শতক)।", path: '<path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18"/>' },
  { bn: "স্বয়ংক্রিয় কৃষক কোড", en: "Auto farmer code · pump prefix", desc: "আপনার পাম্পের নিজস্ব প্রিফিক্স দিয়ে কোড তৈরি হয়।", path: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>' },
  { bn: "POS রসিদ ও QR", en: "POS invoice · QR to portal", desc: "থার্মাল প্রিন্টারে বাংলা রসিদ, QR স্ক্যান করে কৃষক নিজে দেখে।", path: '<rect x="5" y="3" width="14" height="18"/><path d="M9 7h6M9 11h6M9 15h4"/>' },
  { bn: "মাল্টি-পাম্প ও রোল", en: "Multi-pump · RBAC", desc: "অনেক পাম্প এক অ্যাকাউন্টে; অ্যাডমিন ও অপারেটর আলাদা।", path: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>' },
  { bn: "ড্যাশবোর্ড", en: "Yearly & season summary", desc: "বছর ও মৌসুম অনুযায়ী বকেয়া-আয় এক নজরে।", path: '<path d="M3 3v18h18"/><path d="M7 15l3-4 3 2 4-6"/>' },
  { bn: "মৌসুম ট্রান্সফার", en: "One-tap season transfer", desc: "এক ট্যাপে আগের মৌসুমের কৃষক ও জমি নতুন মৌসুমে।", path: '<path d="M4 12h16"/><path d="M14 6l6 6-6 6"/>' },
  { bn: "অডিট লগ", en: "Audit log · accountability", desc: "কে কী বদলেছে সব রেকর্ড থাকে, জবাবদিহিতা নিশ্চিত।", path: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>' },
  { bn: "নিরাপদ লগ ইন", en: "Secure token refresh", desc: "টোকেন শেষ হলে রিফ্রেশ, নয়তো নিরাপদে লগ আউট।", path: '<rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>' },
];

function FeaturesSection() {
  const r = useReveal();
  return (
    <section id="features" style={{ padding: "96px 0", background: C.card }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px" }}>
        <div ref={r.ref} style={{ ...r.style, maxWidth: 640, margin: "0 auto 54px", textAlign: "center" }}>
          <div style={{ ...MONO, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.teal, marginBottom: 12 }}>ফিচার · Features</div>
          <h2 style={{ ...BN, fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.15, margin: 0, color: C.ink }}>নলকূপ চালাতে যা যা লাগে, সব একসাথে</h2>
          <p style={{ fontSize: 15, color: C.muted2, marginTop: 6 }}>Everything you need to run an irrigation pump — in one place</p>
          <p style={{ ...BN, fontSize: 16, color: C.muted, marginTop: 6 }}>প্রতিটি ফিচার তৈরি হয়েছে বাস্তব অপারেটরের কাজের কথা ভেবে।</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
          {FEATURES.map(({ bn, en, desc, path }) => (
            <FeatureCard key={bn} bn={bn} en={en} desc={desc} path={path} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ bn, en, desc, path }: { bn: string; en: string; desc: string; path: string }) {
  const r = useReveal();
  const [hovered, setHovered] = useState(false);
  return (
    <div ref={r.ref} style={{ ...r.style, background: C.card, border: `1px solid ${hovered ? C.tealSoft : C.line}`, borderRadius: 18, padding: 26, transform: hovered ? "translateY(-4px)" : undefined, boxShadow: hovered ? `0 22px 44px -24px rgba(10,30,29,.4)` : undefined, transition: "transform .2s, box-shadow .2s, border-color .2s" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: C.tealSoft, color: C.teal, display: "grid", placeItems: "center", marginBottom: 16 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: path }} />
      </div>
      <h3 style={{ ...BN, fontSize: 17.5, fontWeight: 700, marginBottom: 7, color: C.ink }}>{bn}</h3>
      <p style={{ ...BN, fontSize: 14, color: C.muted, lineHeight: 1.55, margin: 0 }}>{desc}</p>
      <div style={{ ...MONO, fontSize: 11, color: C.muted2, marginTop: 8, letterSpacing: 0.3 }}>{en}</div>
    </div>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────
const FLOW = [
  { n: "১", bn: "পাম্প", en: "Pump" }, { n: "২", bn: "বছর", en: "Year" },
  { n: "৩", bn: "মৌসুম", en: "Season" }, { n: "৪", bn: "কৃষক", en: "Farmer" },
  { n: "৫", bn: "জমি", en: "Land · shatak" }, { n: "৬", bn: "পেমেন্ট", en: "Payment" },
];

function HowItWorksSection() {
  const r = useReveal();
  return (
    <section id="how" style={{ padding: "96px 0", background: `linear-gradient(158deg,#0d6f6e,${C.tealDeep})`, color: "#fff" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px" }}>
        <div ref={r.ref} style={{ ...r.style, maxWidth: 640, margin: "0 auto 54px", textAlign: "center" }}>
          <div style={{ ...MONO, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.gold, marginBottom: 12 }}>যেভাবে সাজানো · How it works</div>
          <h2 style={{ ...BN, fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.15, margin: 0 }}>পাম্প থেকে পেমেন্ট — পরিষ্কার কাঠামো</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.65)", marginTop: 6 }}>From pump to payment — a clear structure</p>
          <p style={{ ...BN, fontSize: 16, color: "rgba(255,255,255,.82)", marginTop: 6 }}>প্রতিটি হিসাব ঠিক জায়গায় বসে, তাই খুঁজে পাওয়া সহজ।</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 0 }}>
          {FLOW.map(({ n, bn, en }, i) => (
            <div key={n} style={{ flex: "1 1 120px", minWidth: 100, textAlign: "center", position: "relative", padding: "0 8px" }}>
              <div style={{ width: 52, height: 52, margin: "0 auto 14px", borderRadius: 16, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.22)", display: "grid", placeItems: "center", ...MONO, fontWeight: 600, fontSize: 18, color: C.gold }}>{n}</div>
              <h4 style={{ ...BN, fontSize: 16, fontWeight: 600, margin: 0 }}>{bn}</h4>
              <div style={{ ...MONO, fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 3 }}>{en}</div>
              {i < FLOW.length - 1 && <span style={{ position: "absolute", top: 14, right: -8, color: "rgba(255,255,255,.35)", fontSize: 22 }}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── App section ──────────────────────────────────────────────────────────────
function AppSection() {
  const r = useReveal();
  return (
    <section id="app" style={{ padding: "96px 0", background: C.paper }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 56, alignItems: "center" }} className="md:grid-cols-[.9fr_1.1fr]">
          <div ref={r.ref} style={r.style}>
            <div style={{ ...MONO, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.teal, marginBottom: 12 }}>মোবাইল অ্যাপ · Mobile App</div>
            <h2 style={{ ...BN, fontSize: "clamp(26px,3vw,34px)", fontWeight: 700, marginTop: 0, lineHeight: 1.15, color: C.ink }}>অপারেটরের হাতেই<br />পুরো নলকূপ</h2>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 20, marginTop: 26 }}>
              {[
                { icon: "+", bn: "যেকোনো ফোনে চলে", desc: "সস্তা অ্যান্ড্রয়েড ফোনেও দ্রুত, কম ডেটায়" },
                { icon: "✓", bn: "টেনে রিফ্রেশ", desc: "নতুন পেমেন্ট, বকেয়া সাথে সাথে দেখুন" },
                { icon: "🖨", bn: "রসিদ প্রিন্ট", desc: "POS প্রিন্টারে বাংলা রসিদ, QR সহ" },
              ].map(({ icon, bn, desc }) => (
                <li key={bn} style={{ display: "flex", gap: 14 }}>
                  <span style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 13, background: C.teal, color: "#fff", display: "grid", placeItems: "center", fontSize: 16 }}>{icon}</span>
                  <div>
                    <h4 style={{ ...BN, fontSize: 16, fontWeight: 600, margin: 0, color: C.ink }}>{bn}</h4>
                    <p style={{ ...BN, fontSize: 13.5, color: C.muted, margin: "3px 0 0" }}>{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            {/* Image slot: phone/app screenshot */}
            <div style={{ marginTop: 28 }}>
              <ImgSlot src="/images/app-screenshot.jpg" alt="অপারেটর অ্যাপ স্ক্রিনশট / Operator app screenshot — replace with your photo" style={{ width: "100%", height: 180 }} />
            </div>
          </div>
          <div>
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Who it's for ─────────────────────────────────────────────────────────────
function WhoItsForSection() {
  const r = useReveal();
  return (
    <section style={{ padding: "96px 0", background: C.card }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 56, alignItems: "center" }} className="md:grid-cols-2">
          <ImgSlot src="/images/farmers-field.jpg" alt="কৃষক মাঠে / Farmers in the field — replace with your photo" style={{ width: "100%", height: 380 }} />
          <div ref={r.ref} style={r.style}>
            <h2 style={{ ...BN, fontSize: "clamp(26px,3.5vw,36px)", fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.15, color: C.ink, marginTop: 0 }}>রুরাল বাংলাদেশের সেচ অপারেটরদের জন্য</h2>
            <p style={{ ...BN, fontSize: "clamp(14px,1.5vw,17px)", color: C.muted, lineHeight: 1.65, margin: "16px 0 24px" }}>
              irripump বিশেষভাবে তৈরি করা হয়েছে গভীর নলকূপ ও সেচ প্রকল্পের মালিক ও অপারেটরদের জন্য
              — যারা প্রতি মৌসুমে শত কৃষক পরিবারের পানির হিসাব পরিচালনা করেন।
            </p>
            {[
              { title: "পাম্প মালিক (অ্যাডমিন)", desc: "পাম্প, মৌসুম, ব্যবহারকারী ও রিপোর্ট — সম্পূর্ণ নিয়ন্ত্রণ।" },
              { title: "অপারেটর (মাঠকর্মী)", desc: "পেমেন্ট রেকর্ড, বকেয়া দেখা ও রসিদ প্রিন্ট — সহজ অ্যান্ড্রয়েড অ্যাপে।" },
              { title: "কৃষক", desc: "QR স্ক্যান করে নিজের পেমেন্ট ইতিহাস ও বকেয়া দেখতে পারেন — লগইন ছাড়া।" },
            ].map(({ title, desc }) => (
              <div key={title} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
                <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: "50%", background: C.teal, marginTop: 8 }} />
                <div>
                  <p style={{ ...BN, fontWeight: 600, color: C.ink, fontSize: 15, margin: 0 }}>{title}</p>
                  <p style={{ ...BN, color: C.muted, fontSize: 14, lineHeight: 1.55, margin: "3px 0 0" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Farmer self-serve CTA ─────────────────────────────────────────────────────
function FarmerLookupBand() {
  return (
    <section style={{ padding: "48px 0", background: C.tealSoft, borderTop: `1px solid ${C.line}` }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ ...MONO, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.teal, marginBottom: 10 }}>কৃষক পোর্টাল · Farmer Portal</div>
        <h2 style={{ ...BN, fontSize: "clamp(22px,3vw,30px)", fontWeight: 700, color: C.ink, margin: "0 0 6px" }}>আপনার বকেয়া দেখুন</h2>
        <p style={{ fontSize: "clamp(14px,2vw,16px)", color: C.muted2, marginBottom: 6 }}>Check your dues &amp; payment history</p>
        <p style={{ ...BN, color: C.muted, marginBottom: 22, fontSize: 15 }}>কৃষক কোড ও মোবাইল নম্বর দিয়ে আপনার মৌসুম-ভিত্তিক বকেয়া ও পেমেন্ট ইতিহাস দেখুন।</p>
        <Link to="/farmer" style={{ ...BN, display: "inline-flex", alignItems: "center", gap: 8, background: C.teal, color: "#fff", fontSize: 15, fontWeight: 700, padding: "13px 26px", borderRadius: 13, textDecoration: "none" }}>
          কোড দিয়ে দেখুন · Check with Code
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "আমার তথ্য কি নিরাপদ?", a: "হ্যাঁ। সব তথ্য নিরাপদ সার্ভারে সংরক্ষিত থাকে এবং নিয়মিত ব্যাকআপ নেওয়া হয়। খাতার মতো হারানোর ভয় নেই।" },
  { q: "কম ইন্টারনেটেও চলবে?", a: "অ্যাপটি হালকা করে বানানো, তাই দুর্বল নেটওয়ার্ক ও সস্তা ফোনেও ভালো চলে।" },
  { q: "পুরো অ্যাপ কি বাংলায়?", a: "হ্যাঁ, পুরো অ্যাপ ও রসিদ বাংলায়। প্রয়োজনে ইংরেজি লেখাও পাশে থাকে।" },
  { q: "বকেয়া কীভাবে হিসাব হয়?", a: "প্রতি মৌসুমে ইউনিট প্রাইস ও জমির পরিমাণ থেকে হিসাব হয়; পেমেন্ট এলে FIFO নিয়মে বকেয়া কমে।" },
  { q: "রসিদ প্রিন্ট করা যায়?", a: "হ্যাঁ। POS/থার্মাল প্রিন্টারের সাইজে রসিদ তৈরি হয়, তাতে QR কোডও থাকে।" },
  { q: "কতগুলো পাম্প চালানো যায়?", a: "একটি অ্যাকাউন্টে একাধিক পাম্প যোগ করা যায়, প্রতিটির হিসাব আলাদা থাকে।" },
];

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section id="faq" style={{ padding: "96px 0", background: C.paper }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto 40px", textAlign: "center" }}>
          <div style={{ ...MONO, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.teal, marginBottom: 12 }}>সাধারণ প্রশ্ন</div>
          <h2 style={{ ...BN, fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 700, margin: 0, color: C.ink }}>যা জানতে চান</h2>
        </div>
        {FAQS.map(({ q, a }, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={q} style={{ borderBottom: `1px solid ${C.line}` }}>
              <button onClick={() => setOpenIdx(isOpen ? null : i)} aria-expanded={isOpen}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "22px 4px", ...BN, fontSize: 17, fontWeight: 600, color: C.ink, textAlign: "left" }}>
                <span>{q}</span>
                <svg style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : undefined, transition: "transform .25s", color: C.teal }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <div style={{ maxHeight: isOpen ? 300 : 0, overflow: "hidden", transition: "max-height .3s ease" }}>
                <div style={{ ...BN, padding: "0 4px 22px", fontSize: 15, color: C.muted, lineHeight: 1.7 }}>{a}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTASection() {
  const r = useReveal();
  return (
    <section style={{ padding: "96px 0", background: C.card }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px" }}>
        <div ref={r.ref} style={{ ...r.style, background: `linear-gradient(150deg,${C.gold},${C.goldDeep})`, color: "#3a2905", borderRadius: 28, padding: "clamp(36px,5vw,56px)", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <h2 style={{ ...BN, fontSize: "clamp(24px,3.5vw,34px)", fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>আজই কাগজের খাতা ছাড়ুন</h2>
          <p style={{ fontSize: "clamp(13px,1.8vw,16px)", margin: "6px auto 8px", color: "#6b5210" }}>Leave the paper ledger behind — go digital today</p>
          <p style={{ ...BN, fontSize: 16, margin: "0 auto 28px", maxWidth: 520, color: "#5a4208" }}>আপনার নলকূপের হিসাব ডিজিটাল করতে একটি ডেমো নিন — সেটআপে আমরা সাহায্য করব।</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to={APP_URL} style={{ ...BN, display: "inline-flex", alignItems: "center", gap: 8, background: C.ink, color: "#fff", fontSize: 15, fontWeight: 700, padding: "13px 26px", borderRadius: 13, textDecoration: "none" }}>শুরু করুন · Get Started</Link>
            <Link to="/farmer" style={{ ...BN, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(58,41,5,.12)", color: "#3a2905", fontSize: 15, fontWeight: 600, padding: "13px 26px", borderRadius: 13, textDecoration: "none" }}>কৃষক পোর্টাল · Farmer Portal</Link>
            <a href={`mailto:${CONTACT_EMAIL}?subject=irripump demo request`} style={{ ...BN, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(58,41,5,.08)", color: "#3a2905", fontSize: 14, fontWeight: 600, padding: "13px 22px", borderRadius: 13, textDecoration: "none" }}>যোগাযোগ · Contact</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: C.ink, color: "rgba(255,255,255,.72)", padding: "60px 0 30px" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 40, paddingBottom: 40, borderBottom: "1px solid rgba(255,255,255,.1)" }} className="sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: C.teal, display: "grid", placeItems: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"/></svg>
              </div>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>irripump</span>
            </div>
            <p style={{ ...BN, fontSize: 14, marginTop: 14, maxWidth: 280, lineHeight: 1.6 }}>রুরাল বাংলাদেশের গভীর নলকূপ অপারেটরদের জন্য সিজন-ভিত্তিক পানির হিসাব ও পেমেন্ট ব্যবস্থাপনা।</p>
          </div>
          {[
            { head: "পণ্য · Product", links: [{ href: "#features", label: "ফিচার · Features" }, { href: "#how", label: "যেভাবে কাজ করে · How it works" }, { href: "#app", label: "মোবাইল অ্যাপ · App" }] },
            { head: "কোম্পানি · Company", links: [{ href: "/contact", label: "যোগাযোগ · Contact" }, { href: `mailto:${CONTACT_EMAIL}?subject=irripump demo`, label: "ডেমো · Book Demo" }, { href: "/farmer", label: "কৃষক পোর্টাল · Farmer" }] },
            { head: "আইনি · Legal", links: [{ href: "/terms", label: "শর্তাবলী · Terms" }, { href: "/privacy", label: "গোপনীয়তা · Privacy" }, { href: "/refund", label: "রিফান্ড · Refund" }] },
          ].map(({ head, links }) => (
            <div key={head}>
              <h6 style={{ color: "#fff", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>{head}</h6>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 11 }}>
                {links.map(({ href, label }) => (
                  <li key={label}>
                    {href.startsWith("/") || href.startsWith("#")
                      ? href.startsWith("#")
                        ? <a href={href} style={{ ...BN, fontSize: 14, textDecoration: "none", color: "rgba(255,255,255,.72)" }}>{label}</a>
                        : <Link to={href} style={{ ...BN, fontSize: 14, textDecoration: "none", color: "rgba(255,255,255,.72)" }}>{label}</Link>
                      : <a href={href} style={{ ...BN, fontSize: 14, textDecoration: "none", color: "rgba(255,255,255,.72)" }}>{label}</a>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 24, fontSize: 13, flexWrap: "wrap", gap: 10, ...BN }}>
          <span>© {new Date().getFullYear()} irripump · Irripump Software Ltd.</span>
          <span>🌾 <strong style={{ color: "#fff" }}>Made in Bangladesh</strong></span>
        </div>
      </div>
    </footer>
  );
}

// ─── JSON-LD structured data ──────────────────────────────────────────────────
function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "irripump",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, Android",
    "description": "গভীর নলকূপের প্রতি মৌসুমের পানির বকেয়া, পেমেন্ট আর কৃষকের হিসাব — এক অ্যাপে। Season-wise irrigation billing and payment management for rural Bangladesh.",
    "url": "https://www.irripump.com",
    "inLanguage": ["bn", "en"],
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "BDT" },
    "publisher": {
      "@type": "Organization",
      "name": "Irripump Software Ltd.",
      "url": "https://www.irripump.com",
      "email": CONTACT_EMAIL,
      "address": { "@type": "PostalAddress", "addressLocality": "Nandigram, Bogura", "addressCountry": "BD" },
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  // Update document title for this route
  useEffect(() => {
    document.title = "irripump — কাগজের খাতা এখন ডিজিটাল | Irrigation Billing Bangladesh";
  }, []);

  return (
    <div style={{ fontFamily: "'Hind Siliguri', 'Inter', sans-serif", minHeight: "100vh" }}>
      <JsonLd />
      <Nav />
      <main>
        <HeroSection />
        <StatsStrip />
        <ProblemSolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AppSection />
        <WhoItsForSection />
        <FarmerLookupBand />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
