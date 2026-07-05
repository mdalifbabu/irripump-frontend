import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Menu, X, Droplet, BookOpen, MapPin, Hash, Receipt, Building2,
  Smartphone, BarChart3, Repeat, ShieldCheck, ChevronDown, ChevronUp,
  ArrowRight, Mail, FileX, AlertTriangle, Calculator,
  FileCheck, CheckCircle2, Zap, CalendarDays, Users, CreditCard,
  Printer, Image, Star,
} from "lucide-react";

// ─── Shared helpers ──────────────────────────────────────────────────────────

const APP_LOGIN_URL = "/login";
const CONTACT_EMAIL = "mdalifbabu.0x@gmail.com";

function CTAButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "white";
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500";
  const styles = {
    primary: "bg-green-700 text-white hover:bg-green-600 shadow-md hover:shadow-lg",
    outline: "border-2 border-green-700 text-green-700 hover:bg-green-50",
    white: "bg-white text-green-800 hover:bg-green-50 shadow-md hover:shadow-lg",
  };
  const isExternal = href.startsWith("mailto:") || href.startsWith("http");
  if (isExternal) {
    return (
      <a href={href} className={`${base} ${styles[variant]} ${className}`}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </Link>
  );
}

function ImagePlaceholder({
  label,
  className = "",
  aspect = "aspect-video",
}: {
  label: string;
  className?: string;
  aspect?: string;
}) {
  return (
    <div
      className={`${aspect} rounded-2xl border-2 border-dashed border-green-200 bg-green-50/60 flex flex-col items-center justify-center gap-3 text-green-400 ${className}`}
    >
      <Image className="w-10 h-10" strokeWidth={1.5} />
      <p className="text-sm text-center px-4 max-w-xs">{label}</p>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#faq", label: "FAQ" },
    { href: "/contact", label: "Contact", internal: true },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-green-600 transition-colors">
            <Droplet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-green-900 tracking-tight">irripump</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) =>
            l.internal ? (
              <Link key={l.href} to={l.href} className="text-sm font-medium text-stone-600 hover:text-green-700 transition-colors">
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} className="text-sm font-medium text-stone-600 hover:text-green-700 transition-colors">
                {l.label}
              </a>
            )
          )}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to={APP_LOGIN_URL}
            className="text-sm font-semibold text-green-700 hover:text-green-600 transition-colors px-3 py-2"
          >
            Log in
          </Link>
          <Link
            to={APP_LOGIN_URL}
            className="bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-600 transition-colors shadow-sm"
          >
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-stone-100 shadow-lg">
          <nav className="flex flex-col p-4 gap-1">
            {links.map((l) =>
              l.internal ? (
                <Link
                  key={l.href}
                  to={l.href}
                  className="px-4 py-3 text-sm font-medium text-stone-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  className="px-4 py-3 text-sm font-medium text-stone-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              )
            )}
            <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col gap-2">
              <Link
                to={APP_LOGIN_URL}
                className="px-4 py-3 text-sm font-semibold text-green-700 border-2 border-green-700 rounded-xl text-center hover:bg-green-50 transition-colors"
                onClick={() => setOpen(false)}
              >
                Log in
              </Link>
              <Link
                to={APP_LOGIN_URL}
                className="px-4 py-3 text-sm font-semibold bg-green-700 text-white rounded-xl text-center hover:bg-green-600 transition-colors"
                onClick={() => setOpen(false)}
              >
                Get started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-green-900 via-green-800 to-sky-900 pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Decorative background rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full border border-white/5" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/5" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-6">
          <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
          Built for irrigation pump operators in Bangladesh
        </div>

        {/* Headline */}
        <h1 className="text-white">
          <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            সেচের হিসাব এখন ডিজিটাল
          </span>
          <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-green-100">
            Irrigation Billing, Gone Digital
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-green-100/90 leading-relaxed">
          irripump replaces the paper <em>khata</em> with a structured digital system —
          track farmers, seasonal dues, and payments, and print receipts, all from your phone.
        </p>
        <p className="mt-2 text-sm text-green-200/70" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
          কাগজের খাতা বাদ দিন। ফার্মার, বকেয়া, পেমেন্ট — সব হাতের মুঠোয়।
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <CTAButton href={APP_LOGIN_URL} variant="white">
            Get started free <ArrowRight className="w-4 h-4" />
          </CTAButton>
          <CTAButton href={`mailto:${CONTACT_EMAIL}?subject=irripump demo request`} variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:border-white">
            Request a demo
          </CTAButton>
        </div>

        {/* Hero image placeholder */}
        <div className="mt-14 max-w-3xl mx-auto">
          <ImagePlaceholder
            label="Hero image — add your own photo: irrigation fields, tubewell, or pump in operation"
            className="border-white/20 bg-white/5 text-white/40 rounded-2xl"
            aspect="aspect-video"
          />
        </div>
      </div>
    </section>
  );
}

// ─── Problem → Solution ───────────────────────────────────────────────────────

const problems = [
  { icon: FileX, text: "Paper ledgers get lost, torn, or damaged in the field" },
  { icon: AlertTriangle, text: "Disputed dues with no audit trail — just word vs. word" },
  { icon: Calculator, text: "Manual math is slow and error-prone every season" },
];

const solutions = [
  { icon: FileCheck, text: "All records stored securely and accessible anytime" },
  { icon: CheckCircle2, text: "Full payment history with a clear, time-stamped audit log" },
  { icon: Zap, text: "Dues calculated automatically — zero manual arithmetic" },
];

function ProblemSolutionSection() {
  return (
    <section className="py-16 md:py-24 bg-white" id="problem">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900">
            The paper <em>khata</em> problem
          </h2>
          <p className="mt-3 text-stone-500 text-base md:text-lg max-w-xl mx-auto">
            Most irrigation operators still run their books by hand. irripump fixes that.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Problems */}
          <div className="bg-red-50 rounded-2xl p-6 md:p-8 space-y-5 border border-red-100">
            <h3 className="text-lg font-semibold text-red-700 mb-2">Before irripump</h3>
            {problems.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-stone-700 text-sm md:text-base leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* Solutions */}
          <div className="bg-green-50 rounded-2xl p-6 md:p-8 space-y-5 border border-green-100">
            <h3 className="text-lg font-semibold text-green-700 mb-2">With irripump</h3>
            {solutions.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-stone-700 text-sm md:text-base leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

const features = [
  {
    icon: BookOpen,
    title: "Season-wise payment ledger",
    desc: "Track dues and payments per season with automatic FIFO allocation — payments clear the oldest dues first.",
  },
  {
    icon: MapPin,
    title: "Land tracking in shatak",
    desc: "Record land in shatak (displayed as bigha too; 1 bigha = 33 shatak). Per-shatak pricing auto-computes each farmer's total due.",
  },
  {
    icon: Hash,
    title: "Auto farmer codes",
    desc: "Each farmer gets a unique code prefixed by your pump's identifier. No collisions, no manual numbering.",
  },
  {
    icon: Receipt,
    title: "Printable receipts with QR",
    desc: "Generate POS/thermal invoices with a QR code linking directly to the farmer's own payment portal.",
  },
  {
    icon: Building2,
    title: "Multi-pump, multi-tenant",
    desc: "Manage multiple pumps from one account. Admin controls everything; operators see only their pump.",
  },
  {
    icon: Smartphone,
    title: "Operator mobile app",
    desc: "Field operators use a dedicated Android app (built with Expo) — lightweight, fast, and works on basic phones.",
  },
  {
    icon: BarChart3,
    title: "Dashboard at a glance",
    desc: "Yearly and season-wise totals for dues and income. Know your numbers without digging through records.",
  },
  {
    icon: Repeat,
    title: "One-tap season transfer",
    desc: "Start a fresh season instantly — carries over farmers and land assignments. No re-entry required.",
  },
  {
    icon: ShieldCheck,
    title: "Audit logging",
    desc: "Every action is logged with a timestamp and user. Full accountability for admins and operators alike.",
  },
];

function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-stone-50" id="features">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900">
            Everything you need to run your pump
          </h2>
          <p className="mt-3 text-stone-500 text-base md:text-lg max-w-xl mx-auto">
            Built from real operator workflows — not generic accounting software.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 border border-stone-100 hover:border-green-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Icon className="w-5 h-5 text-green-700" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-2">{title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

const steps = [
  {
    icon: Building2,
    title: "Create your pump profile",
    desc: "Register your irrigation pump with a name and prefix code. Admin sets up the account.",
  },
  {
    icon: CalendarDays,
    title: "Set up a year & season",
    desc: "Create a crop year and a season (e.g. Boro 2025). All data is organized per season.",
  },
  {
    icon: Users,
    title: "Add farmers & their land",
    desc: "Register each farmer with auto-generated codes and assign their land plots in shatak.",
  },
  {
    icon: CreditCard,
    title: "Set the unit price",
    desc: "Enter the price per shatak for this season. irripump auto-computes each farmer's total due.",
  },
  {
    icon: Printer,
    title: "Record payments & print receipts",
    desc: "Operators log payments on the mobile app. Dues update instantly. Print a receipt with QR code.",
  },
  {
    icon: Repeat,
    title: "Start the next season in one tap",
    desc: "When the season ends, transfer farmers and land into a fresh season. All history is preserved.",
  },
];

function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-white" id="how-it-works">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900">How irripump works</h2>
          <p className="mt-3 text-stone-500 text-base md:text-lg max-w-xl mx-auto">
            From first setup to printing receipts — six clear steps.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative flex gap-4">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 w-px bg-green-100 mt-2 mb-0 hidden lg:block" />
                )}
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-stone-900">{title}</h3>
                </div>
                <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Mobile App ───────────────────────────────────────────────────────────────

function MobileAppSection() {
  return (
    <section className="py-16 md:py-24 bg-green-900 text-white" id="app">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-6">
              <Smartphone className="w-3.5 h-3.5" />
              Android App
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Field operators work from the phone
            </h2>
            <p className="text-green-100/80 text-base md:text-lg leading-relaxed mb-6">
              The irripump operator app is built with Expo for Android. It's lightweight, fast,
              and designed for everyday use on basic smartphones — even in bright sunlight.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                "Record farmer payments on the spot",
                "Instant due balance update",
                "Generate and print receipts with one tap",
                "Works with basic Android phones",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-green-100">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {/* TODO: replace with real Play Store / APK link when available */}
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-sm text-white/70">
              <Smartphone className="w-5 h-5" />
              <span>Android APK — <em>coming soon, contact us to join the pilot</em></span>
            </div>
          </div>

          <ImagePlaceholder
            label="Phone mockup placeholder — add a screenshot of the operator mobile app"
            className="border-white/20 bg-white/5 text-white/30 max-w-xs mx-auto md:max-w-none"
            aspect="aspect-[9/16] max-h-[520px]"
          />
        </div>
      </div>
    </section>
  );
}

// ─── Who it's for ─────────────────────────────────────────────────────────────

function WhoItsForSection() {
  return (
    <section className="py-16 md:py-24 bg-stone-50" id="who">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <ImagePlaceholder
            label="Image placeholder — farmers in fields, irrigation channel, or rural Bangladesh landscape"
            aspect="aspect-[4/3]"
          />
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Built for Bangladesh's irrigation operators
            </h2>
            <p className="text-stone-600 text-base md:text-lg leading-relaxed mb-6">
              irripump is designed specifically for deep-tubewell and irrigation-pump owners
              and operators across rural Bangladesh — the people who manage seasonal water dues
              for dozens or hundreds of farming families every year.
            </p>
            <div className="space-y-4">
              {[
                {
                  title: "Pump owners (admin)",
                  desc: "Full control over pumps, seasons, users, and reports. Manage from a desktop or tablet.",
                },
                {
                  title: "Pump operators (field staff)",
                  desc: "Record payments, view farmer dues, and print receipts from a simple Android app.",
                },
                {
                  title: "Farmers",
                  desc: "Access their own payment history and dues via a QR-linked farmer portal — no login needed.",
                },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-600 mt-2.5" />
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{title}</p>
                    <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

function PricingSection() {
  return (
    <section className="py-16 md:py-20 bg-white" id="pricing">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-3">Pricing</h2>
        <p className="text-stone-500 text-base md:text-lg mb-8">
          We're working on transparent pricing tiers. For now, get in touch — we'll find a plan
          that fits your pump operation.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 md:p-10">
          <div className="w-14 h-14 bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-2">Request pricing</h3>
          <p className="text-stone-500 text-sm mb-6">
            Tell us about your pump — how many farmers, how many seasons per year — and we'll
            reach back within 24 hours.
          </p>
          <CTAButton href={`mailto:${CONTACT_EMAIL}?subject=irripump pricing enquiry`} variant="primary">
            Contact us <ArrowRight className="w-4 h-4" />
          </CTAButton>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "Is my data safe?",
    a: "Yes. All data is encrypted in transit (HTTPS). Access is role-controlled — operators only see their pump's data, and admins control who can access what. We do not sell or share your data.",
  },
  {
    q: "Does it work on a basic phone with limited data?",
    a: "The operator app is built to be lightweight and fast on basic Android smartphones. The admin web interface also loads quickly. irripump avoids heavy assets so it works well on slower mobile connections.",
  },
  {
    q: "Is Bangla supported?",
    a: "Yes. irripump uses Bangla throughout — labels, farmer names, receipts, and the farmer portal all support Bangla text. The interface is bilingual (Bangla + English) so operators and admins can use whichever they're comfortable with.",
  },
  {
    q: "How are dues calculated?",
    a: "Each farmer's due = unit price per shatak × their total land in shatak for the season. When a payment is recorded, it's applied using FIFO (oldest due first). irripump always shows the net outstanding balance.",
  },
  {
    q: "Can I print receipts for farmers?",
    a: "Yes. irripump generates POS/thermal-format receipts that include the farmer's name, code, payment amount, balance due, and a QR code linking to their individual farmer portal where they can view their payment history.",
  },
  {
    q: "How many pumps can I manage from one account?",
    a: "Multiple. An admin account can manage several pumps, each with their own set of operators, farmers, seasons, and data. Roles are scoped per pump so there's no cross-pump data leakage.",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-24 bg-stone-50" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900">Frequently asked questions</h2>
        </div>
        <div className="space-y-2">
          {faqs.map(({ q, a }, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={q} className="bg-white rounded-xl border border-stone-100 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-stone-900 hover:bg-stone-50 transition-colors"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="text-sm md:text-base">{q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0 text-green-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0 text-stone-400" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm md:text-base text-stone-500 leading-relaxed border-t border-stone-50">
                    <div className="pt-3">{a}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA band ───────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section className="py-16 md:py-20 bg-green-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Ready to ditch the paper khata?
        </h2>
        <p className="text-green-100 text-base md:text-lg mb-8 max-w-xl mx-auto" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
          সেচ প্রকল্পের হিসাব-নিকাশ সহজ করতে irripump ব্যবহার শুরু করুন।
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <CTAButton href={APP_LOGIN_URL} variant="white">
            Get started <ArrowRight className="w-4 h-4" />
          </CTAButton>
          <CTAButton
            href={`mailto:${CONTACT_EMAIL}?subject=irripump demo request`}
            variant="outline"
            className="border-white/40 text-white hover:bg-white/10 hover:border-white"
          >
            Request a demo
          </CTAButton>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function FooterSection() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-stone-900 text-stone-400 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
                <Droplet className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">irripump</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Digitizing irrigation-pump dues and payments for Bangladesh, one pump at a time.
            </p>
            <p className="text-xs text-stone-500">Made in Bangladesh 🇧🇩</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-stone-200 font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#app" className="hover:text-white transition-colors">Mobile app</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-stone-200 font-semibold text-sm mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-stone-200 font-semibold text-sm mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact form
                </Link>
              </li>
              <li className="text-xs text-stone-500 mt-2">
                CHAKALMA, NANDIGRAM<br />BOGURA, BANGLADESH
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>© {year} IRRIPUMP. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-stone-300 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-stone-300 transition-colors">Privacy</Link>
            <Link to="/contact" className="hover:text-stone-300 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', 'Hind Siliguri', sans-serif" }}>
      <Nav />
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <MobileAppSection />
        <WhoItsForSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <FooterSection />
    </div>
  );
}
