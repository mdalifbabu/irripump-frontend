import LegalLayout from "./LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate="[Effective Date]">
      <p>
        This Privacy Policy explains how <strong>[Legal Business Name]</strong> ("IRRIPUMP", "we",
        "us", or "our"), registered at <strong>[Registered Address]</strong>, collects, uses, stores,
        and protects information when you use the irripump platform.
      </p>

      <h2>1. What Data We Collect</h2>
      <h3>Account information</h3>
      <p>When you register, we collect your name, email address, phone number (optional), and password
        (stored as a hashed value — never in plain text).</p>

      <h3>Operational data entered by you</h3>
      <p>As an administrator or operator, you enter farmer records (name, code, contact), land
        assignments (area in shatak), season parameters (unit prices), and payment records. This data
        belongs to you and is stored on your behalf.</p>

      <h3>Usage and log data</h3>
      <p>We collect server logs, access timestamps, IP addresses, device type, and in-app audit events
        (e.g., who recorded a payment and when). This data is used for security, debugging, and
        accountability within your account.</p>

      <h3>Local storage / cookies</h3>
      <p>irripump uses browser local storage to maintain your session and save UI preferences.
        We use only essential local storage; we do not currently use tracking or advertising cookies.
        If analytics are added in future, this policy will be updated and you will be informed.</p>

      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>To provide, operate, and improve the irripump service.</li>
        <li>To authenticate users and control access by role.</li>
        <li>To generate receipts and reports on your behalf.</li>
        <li>To respond to support requests and communicate service changes.</li>
        <li>To detect and prevent unauthorized access or abuse.</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>
        We <strong>do not sell, rent, or trade</strong> your data or your farmers' data to any third
        party. We do not use your data for advertising purposes. We may share data with service
        providers (such as hosting or infrastructure providers) only to the extent necessary to
        operate the platform, and under confidentiality obligations.
      </p>
      <p>
        We may disclose data if required by law or a valid order from a competent authority in
        Bangladesh.
      </p>

      <h2>4. Data Storage and Security</h2>
      <p>
        All data is transmitted over encrypted connections (HTTPS/TLS). Access to the database is
        restricted by role-based access controls. We take reasonable technical and organisational
        measures to protect your data against unauthorized access, loss, or alteration.
      </p>
      <p>
        No system is 100% secure. In the event of a data breach that may affect your rights, we will
        notify you as required by applicable law.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain your account data for as long as your account is active. Operational data (farmer
        records, payment history) is retained for <strong>[RETENTION PERIOD — e.g. 5 years]</strong>
        after account closure, unless you request deletion earlier. Audit log data may be retained
        longer for security and compliance purposes.
      </p>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of your data (subject to legal retention requirements).</li>
        <li>Request a copy of your data in a portable format.</li>
      </ul>
      <p>
        To exercise these rights, contact us at <strong>[Contact Email]</strong>. We will respond
        within a reasonable time.
      </p>

      <h2>7. Children's Data</h2>
      <p>
        irripump is a business tool intended for adults managing irrigation pump operations. We do not
        knowingly collect personal data from children under 18.
      </p>

      <h2>8. Governing Law and Jurisdiction</h2>
      <p>
        This Privacy Policy is governed by the laws of <strong>Bangladesh</strong>. Bangladesh's
        dedicated personal-data-protection legislation is still developing. We will update this policy
        to align with the final enacted law once it is in effect. We do not assert compliance with any
        specific statute that has not yet been enacted.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material changes
        via email or in-app notice. The "Effective Date" at the top of this page reflects the date of
        the most recent revision.
      </p>

      <h2>10. Contact for Privacy Requests</h2>
      <p>For all privacy-related requests or questions:</p>
      <ul>
        <li><strong>[Legal Business Name]</strong></li>
        <li><strong>[Registered Address]</strong></li>
        <li>Email: <strong>[Contact Email]</strong></li>
      </ul>
    </LegalLayout>
  );
}
