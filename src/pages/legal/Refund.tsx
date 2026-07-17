import LegalLayout from "./LegalLayout";

export default function Refund() {
  return (
    <LegalLayout title="Refund Policy" effectiveDate="[Effective Date]">
      {/* ── PENDING PRICING MODEL ───────────────────────────────────────────────
          This page is scaffolded but the content below is marked [PENDING
          PRICING MODEL]. irripump's pricing tiers and billing cycle have not
          yet been finalized. Replace all [PENDING …] and [BRACKETED] sections
          before publishing, and have this document reviewed by a qualified lawyer.
      ─────────────────────────────────────────────────────────────────────── */}

      <div className="not-prose bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <strong>[PENDING PRICING MODEL]</strong> — The sections below are scaffolded placeholders.
        Finalize your billing model, then replace all bracketed items and have this page reviewed
        before publishing.
      </div>

      <p>
        This Refund Policy describes the billing and cancellation terms for the irripump service,
        operated by <strong>[Legal Business Name]</strong>.
      </p>

      <h2>1. Subscription Billing</h2>
      <p>
        irripump is offered on a <strong>[PENDING: monthly / annual / per-pump]</strong> subscription
        basis. Fees are charged in advance at the beginning of each billing period. All fees are
        stated in <strong>[PENDING: BDT / USD]</strong> and are exclusive of any applicable taxes.
      </p>

      <h2>2. Free Trial</h2>
      <p>
        <strong>[PENDING: describe any free trial period, e.g. "New accounts receive a 14-day free
        trial. No credit card is required during the trial."]</strong>
      </p>

      <h2>3. Cancellation</h2>
      <p>
        You may cancel your irripump subscription at any time by contacting us at{" "}
        <strong>[Contact Email]</strong> or through the account settings page. Cancellation takes
        effect at the end of the current billing period. You will continue to have access to the
        service until that date.
      </p>

      <h2>4. Refund Eligibility</h2>
      <p>
        <strong>[PENDING PRICING MODEL — choose one of the following and remove the others:]</strong>
      </p>
      <ul>
        <li>
          <em>Option A (no refunds):</em> All fees paid are non-refundable. We do not provide refunds
          or credits for partial billing periods.
        </li>
        <li>
          <em>Option B (pro-rata):</em> If you cancel within [X] days of a charge and have not used
          the service during that period, you may request a pro-rata refund by contacting{" "}
          <strong>[Contact Email]</strong>.
        </li>
        <li>
          <em>Option C (30-day guarantee):</em> New subscribers who are unsatisfied may request a full
          refund within 30 days of their first payment by contacting <strong>[Contact Email]</strong>.
        </li>
      </ul>

      <h2>5. Service Termination by Us</h2>
      <p>
        If we terminate your account for a reason other than a breach of our Terms and Conditions, we
        will refund a pro-rata portion of any pre-paid subscription fees for the unused period.
      </p>

      <h2>6. How to Request a Refund</h2>
      <p>To request a refund, email <strong>[Contact Email]</strong> with:</p>
      <ul>
        <li>Your account email address</li>
        <li>The date of the charge in question</li>
        <li>The reason for your request</li>
      </ul>
      <p>We will respond within <strong>[X business days]</strong>.</p>

      <h2>7. Changes to This Policy</h2>
      <p>
        We may update this Refund Policy at any time. Changes will be posted on this page with an
        updated effective date. Continued use of irripump after changes are published constitutes
        acceptance.
      </p>

      <h2>8. Contact</h2>
      <ul>
        <li><strong>[Legal Business Name]</strong></li>
        <li><strong>[Registered Address]</strong></li>
        <li>Email: <strong>[Contact Email]</strong></li>
      </ul>
    </LegalLayout>
  );
}
