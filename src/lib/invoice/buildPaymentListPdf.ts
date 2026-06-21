import type { Payment } from "@/lib/api/types";

const BUSINESS_NAME_EN = "Alhaj Yeaqub Ali Irrigation Pump";
const BUSINESS_NAME_BN = "আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প";

function fmt(n: number): string {
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
}

export interface PaymentListPdfOptions {
  farmerName?: string;
  farmerCode?: string;
  pumpName: string;
  seasonName?: string;
  year?: number;
  payments: Payment[];
  totalPaid?: number;
  dueAmount?: number;
  advanceAmount?: number;
}

export function buildPaymentListPdf(opts: PaymentListPdfOptions): { save: (filename: string) => void } {
  const METHODS: Record<string, string> = { CASH: "নগদ", BANK: "ব্যাংক", MOBILE_BANKING: "মোবাইল" };
  const TYPE: Record<string, string> = { PAYMENT: "পেমেন্ট", ADJUSTMENT: "সমন্বয়", DEDUCTION: "কর্তন" };
  const activePayments = opts.payments.filter((p) => !p.isReversed && p.paymentType === "PAYMENT");
  const total = activePayments.reduce((s, p) => s + p.amount, 0);
  const isFarmerSpecific = !!(opts.farmerName && opts.farmerCode);

  const rows = opts.payments.map((p) => {
    const farmerCol = isFarmerSpecific ? "" : `<td>${p.farmerId ?? "-"}</td>`;
    return `<tr style="${p.isReversed ? "color:#999;text-decoration:line-through" : ""}">
      ${farmerCol}
      <td>${p.paymentDate}</td>
      <td>${fmt(p.amount)}</td>
      <td>${TYPE[p.paymentType] ?? p.paymentType}</td>
      <td>${METHODS[p.paymentMethod] ?? p.paymentMethod}</td>
    </tr>`;
  }).join("");

  const farmerHeader = isFarmerSpecific
    ? `<div>${opts.farmerName} (${opts.farmerCode})</div>`
    : `<div>সকল কৃষকের পেমেন্ট</div>`;

  const farmerColHeader = isFarmerSpecific ? "" : "<th>কৃষক ID</th>";
  const farmerColFooter = isFarmerSpecific ? "" : "<td></td>";

  // Summary rows: due or advance
  const due = opts.dueAmount ?? 0;
  const advance = opts.advanceAmount ?? 0;
  const paidSummary = opts.totalPaid != null
    ? `<tr><td colspan="4" style="text-align:right;padding-right:6px;">মৌসুমে মোট পরিশোধ</td><td style="font-weight:bold;color:#166534;">${fmt(opts.totalPaid)}</td></tr>`
    : "";
  const balanceRow = due > 0
    ? `<tr><td colspan="4" style="text-align:right;padding-right:6px;">বকেয়া</td><td style="font-weight:bold;color:#991b1b;">${fmt(due)}</td></tr>`
    : advance > 0
    ? `<tr><td colspan="4" style="text-align:right;padding-right:6px;">অগ্রিম জমা</td><td style="font-weight:bold;color:#166534;">${fmt(advance)}</td></tr>`
    : `<tr><td colspan="4" style="text-align:right;padding-right:6px;">বকেয়া</td><td style="font-weight:bold;color:#6b7280;">—</td></tr>`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Noto Sans Bengali', Arial, sans-serif; }
  body { width: 100%; padding: 5mm; font-size: 8pt; }
  h1 { font-size: 8pt; text-align: center; }
  h2 { font-size: 7pt; text-align: center; color: #555; margin-bottom: 6px; }
  .title { font-size: 9pt; font-weight: bold; text-align: center; margin: 4px 0; }
  .meta { font-size: 7pt; margin-bottom: 8px; page-break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; font-size: 6pt; page-break-inside: avoid; }
  tr { page-break-inside: avoid; }
  th { background: #28508c; color: #fff; padding: 2px 4px; text-align: left; }
  td { padding: 2px 4px; border-bottom: 1px solid #eee; }
  tfoot td { font-weight: bold; background: #f5f5f5; }
  .summary { margin-top: 8px; border-top: 2px solid #28508c; padding-top: 4px; }
  .summary table { font-size: 7pt; }
  .summary tr:last-child td { border-bottom: none; }
</style>
</head>
<body>
<h1>${BUSINESS_NAME_EN}</h1>
<h2>${BUSINESS_NAME_BN}</h2>
<div class="title">PAYMENT STATEMENT</div>
<div class="meta">
  ${farmerHeader}
  <div>${opts.pumpName}${opts.seasonName ? ` | মৌসুম: ${opts.seasonName} ${opts.year ?? ""}` : ""}</div>
</div>
<table>
  <thead><tr>${farmerColHeader}<th>তারিখ</th><th>পরিমাণ</th><th>ধরন</th><th>পদ্ধতি</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr>${farmerColFooter}<td>তালিকায় মোট</td><td>${fmt(total)}</td><td></td><td></td></tr></tfoot>
</table>
${isFarmerSpecific && opts.seasonName ? `
<div class="summary">
  <table>
    <tbody>
      ${paidSummary}
      ${balanceRow}
    </tbody>
  </table>
</div>` : ""}
</body>
</html>`;

  return {
    save: (_filename: string) => {
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;height:1px;border:0;";
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (!doc) { document.body.removeChild(iframe); return; }
      doc.open(); doc.write(html); doc.close();
      const cleanup = () => { document.body.removeChild(iframe); };
      iframe.contentWindow?.addEventListener("afterprint", cleanup);
      setTimeout(() => { iframe.contentWindow?.print(); }, 300);
    },
  };
}
