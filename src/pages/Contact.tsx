import { useState } from "react";
import { Link } from "react-router-dom";
import { Droplet, ArrowLeft, Mail, MapPin, Send, CheckCircle2 } from "lucide-react";

const CONTACT_EMAIL = "mdalifbabu.0x@gmail.com";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [fields, setFields] = useState({ name: "", contact: "", message: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // TODO: wire to a real backend endpoint or email service (e.g. Formspree, Resend, or your own API).
  // Currently uses a mailto: fallback — opens the user's default email client.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { name, contact, message } = fields;
    const subject = encodeURIComponent(`irripump enquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nContact: ${contact}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-3">Get in touch</h1>
          <p className="text-stone-500 text-base md:text-lg max-w-xl mx-auto">
            Questions about irripump, pricing, or a demo? We're happy to help.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Contact info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-100">
              <h2 className="font-semibold text-stone-900 mb-4">Direct contact</h2>
              <div className="space-y-4">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-3 text-stone-600 hover:text-green-700 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <Mail className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 mb-0.5">Email</p>
                    <p className="text-sm font-medium">{CONTACT_EMAIL}</p>
                  </div>
                </a>

                {/* Phone placeholder — update with real number */}
                <div className="flex items-center gap-3 text-stone-400">
                  <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-stone-300" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 mb-0.5">Address</p>
                    <p className="text-sm">CHAKALMA, NANDIGRAM<br />BOGURA, BANGLADESH</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-sm text-stone-600 leading-relaxed">
              We typically respond within <strong className="text-green-700">24 hours</strong> on
              business days. For a live demo of irripump, mention it in your message and we'll
              schedule a time that works for you.
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-stone-100">
            {sent ? (
              <div className="flex flex-col items-center justify-center text-center py-8 gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-semibold text-stone-900">Your email client should open now</h3>
                <p className="text-sm text-stone-500 max-w-xs">
                  We're using a mailto link for now. If it didn't open, email us directly at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 underline underline-offset-2">
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="text-sm text-stone-400 hover:text-stone-600 underline underline-offset-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-semibold text-stone-900 mb-2">Send us a message</h2>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1.5">
                    Your name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={fields.name}
                    onChange={handleChange}
                    placeholder="e.g. Mohammad Alam"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="contact" className="block text-sm font-medium text-stone-700 mb-1.5">
                    Email or phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact"
                    name="contact"
                    type="text"
                    required
                    value={fields.contact}
                    onChange={handleChange}
                    placeholder="your@email.com or +880..."
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-stone-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    value={fields.message}
                    onChange={handleChange}
                    placeholder="Tell us about your pump — how many farmers, what you need help with..."
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-green-700 text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <Send className="w-4 h-4" />
                  Send message
                </button>

                <p className="text-xs text-stone-400 text-center">
                  This form opens your email client. Alternatively, email us directly at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-stone-200 bg-white mt-10 py-6 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} IRRIPUMP &nbsp;·&nbsp;
        <Link to="/terms" className="hover:text-stone-600">Terms</Link> &nbsp;·&nbsp;
        <Link to="/privacy" className="hover:text-stone-600">Privacy</Link>
      </footer>
    </div>
  );
}
