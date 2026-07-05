import LegalLayout from "./LegalLayout";

export default function Terms() {
  return (
    <LegalLayout title="Terms & Conditions" effectiveDate="[Effective Date]">
      <p>
        These Terms and Conditions ("Terms") govern your access to and use of the irripump platform,
        operated by <strong>[Legal Business Name]</strong> ("IRRIPUMP", "we", "us", or "our"),
        registered at <strong>[Registered Address]</strong>.
      </p>
      <p>
        By creating an account or using any part of the irripump service, you agree to be bound by
        these Terms. If you do not agree, do not access or use the service.
      </p>

      <h2>1. Description of Service</h2>
      <p>
        irripump is a multi-tenant software-as-a-service (SaaS) platform that enables irrigation-pump
        operators in Bangladesh to record, manage, and report on farmers' seasonal water-use dues and
        payments. The platform includes a web application for administrators and an Android mobile app
        for field operators.
      </p>

      <h2>2. Accounts and User Responsibilities</h2>
      <p>
        Access to irripump is granted through two roles:
      </p>
      <ul>
        <li>
          <strong>Admin:</strong> Full control over one or more pump profiles, seasons, users, and
          financial records. Admins are responsible for the accuracy of all data entered and for
          managing operator access.
        </li>
        <li>
          <strong>Operator:</strong> Limited access scoped to an assigned pump. Operators may record
          payments and generate receipts. Admins grant and revoke operator access.
        </li>
      </ul>
      <p>
        You are responsible for maintaining the confidentiality of your login credentials and for all
        activity that occurs under your account. You must notify us immediately at{" "}
        <strong>[Contact Email]</strong> if you become aware of any unauthorized use.
      </p>

      <h2>3. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use irripump for any unlawful purpose or in violation of any applicable law.</li>
        <li>Enter false, inaccurate, or fraudulent farmer, land, or payment data.</li>
        <li>Attempt to gain unauthorized access to other tenants' data or system infrastructure.</li>
        <li>Reverse-engineer, decompile, or otherwise attempt to extract source code from the platform.</li>
        <li>Use automated tools to scrape or excessively query the service.</li>
      </ul>

      <h2>4. Payment-Data Accuracy Disclaimer</h2>
      <p>
        irripump is a record-keeping tool. It records dues and payments as entered by authorized
        operators and administrators. <strong>IRRIPUMP is not a payment processor, bank, financial
        institution, or regulated financial service.</strong> We do not handle, transfer, or hold
        actual funds. The accuracy of all financial records is the sole responsibility of the pump
        operator who enters the data.
      </p>

      <h2>5. Intellectual Property</h2>
      <p>
        The irripump platform, including its software, design, and documentation, is the intellectual
        property of <strong>[Legal Business Name]</strong>. You are granted a limited, non-exclusive,
        non-transferable licence to use the service during your subscription period. No ownership
        rights are transferred to you.
      </p>
      <p>
        Data you enter (farmer records, payment data, etc.) remains yours. We do not claim ownership
        of your data.
      </p>

      <h2>6. Service Availability and "As Is" Disclaimer</h2>
      <p>
        irripump is provided <strong>"as is"</strong> and <strong>"as available"</strong> without
        warranties of any kind, express or implied, including fitness for a particular purpose or
        uninterrupted availability. We will make reasonable efforts to maintain uptime but do not
        guarantee continuous, error-free operation.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, IRRIPUMP shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages arising from your use of or inability
        to use the service, including but not limited to loss of data, loss of income, or business
        interruption.
      </p>

      <h2>8. Termination</h2>
      <p>
        We reserve the right to suspend or terminate your account at any time if you breach these
        Terms. You may terminate your account by contacting us at <strong>[Contact Email]</strong>.
        Upon termination, your data may be retained for a period as described in our Privacy Policy
        before deletion.
      </p>

      <h2>9. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of material changes by email
        or via an in-app notice. Continued use of irripump after changes take effect constitutes
        acceptance of the revised Terms.
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These Terms are governed by the laws of <strong>Bangladesh</strong>. Any disputes shall be
        subject to the exclusive jurisdiction of the courts of <strong>[Jurisdiction, Bangladesh]</strong>.
      </p>

      <h2>11. Contact</h2>
      <p>
        For questions about these Terms, contact us at:
      </p>
      <ul>
        <li><strong>[Legal Business Name]</strong></li>
        <li><strong>[Registered Address]</strong></li>
        <li>Email: <strong>[Contact Email]</strong></li>
      </ul>
    </LegalLayout>
  );
}
