import { Link } from "react-router-dom";
import { Droplet, ArrowLeft, AlertTriangle } from "lucide-react";

interface LegalLayoutProps {
  title: string;
  effectiveDate?: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, effectiveDate, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Simple nav */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
              <Droplet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-green-900">irripump</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-green-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        {/* Draft banner */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 leading-relaxed">
            <strong>DRAFT TEMPLATE — must be reviewed by a qualified lawyer before publishing.</strong>{" "}
            This document is not legal advice. All <strong>[BRACKETED PLACEHOLDERS]</strong> must be
            replaced with accurate information by IRRIPUMP before this page goes live.
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">{title}</h1>
        {effectiveDate && (
          <p className="text-sm text-stone-400 mb-8">Effective Date: {effectiveDate}</p>
        )}

        <div className="prose prose-stone max-w-none prose-headings:font-semibold prose-headings:text-stone-900 prose-p:text-stone-600 prose-p:leading-relaxed prose-li:text-stone-600 prose-strong:text-stone-800">
          {children}
        </div>
      </main>

      <footer className="border-t border-stone-200 bg-white mt-10 py-6 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} IRRIPUMP &nbsp;·&nbsp;
        <Link to="/terms" className="hover:text-stone-600">Terms</Link> &nbsp;·&nbsp;
        <Link to="/privacy" className="hover:text-stone-600">Privacy</Link> &nbsp;·&nbsp;
        <Link to="/refund" className="hover:text-stone-600">Refund</Link>
      </footer>
    </div>
  );
}
