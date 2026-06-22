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
  // Season calculation (from farmerDetail)
  calculatedCost?: number;
  totalLandShatak?: number;
  dueAmount?: number;
  advanceAmount?: number;
}

export function buildPaymentListPdf(opts: PaymentListPdfOptions): { save: (filename: string) => void } {
  const METHODS: Record<string, string> = { CASH: "নগদ", BANK: "ব্যাংক", MOBILE_BANKING: "মোবাইল" };
  const TYPE: Record<string, string> = { PAYMENT: "পেমেন্ট", ADJUSTMENT: "সমন্বয়", DEDUCTION: "কর্তন" };
  const isFarmerSpecific = !!(opts.farmerName && opts.farmerCode);
  const hasSeasonCalc = isFarmerSpecific && opts.seasonName && opts.calculatedCost != null;

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
    ? `<div style="font-weight:bold">${opts.farmerName} (${opts.farmerCode})</div>`
    : `<div>সকল কৃষকের পেমেন্ট</div>`;

  const farmerColHeader = isFarmerSpecific ? "" : "<th>কৃষক ID</th>";

  // Season calculation box — shown only for farmer-specific, season-filtered PDFs
  const due = opts.dueAmount ?? 0;
  const advance = opts.advanceAmount ?? 0;
  const dueColor = due > 0 ? "#991b1b" : "#166534";
  const dueLabel = due > 0 ? "মোট বকেয়া" : "অগ্রিম জমা";
  const dueValue = due > 0 ? fmt(due) : advance > 0 ? fmt(advance) : "—";

  const seasonCalcBox = hasSeasonCalc ? `
<div class="calc-box">
  <div class="calc-row">
    <span>মৌসুম</span>
    <span>${opts.seasonName} ${opts.year ?? ""}</span>
  </div>
  ${opts.totalLandShatak != null ? `<div class="calc-row">
    <span>মোট জমি</span>
    <span>${opts.totalLandShatak.toFixed(2)} শতক (${(opts.totalLandShatak / 33).toFixed(3)} বিঘা)</span>
  </div>` : ""}
  <div class="calc-row">
    <span>মৌসুম বিল</span>
    <span>${fmt(opts.calculatedCost!)}</span>
  </div>
  <div class="calc-row due-row" style="color:${dueColor}">
    <span>${dueLabel}</span>
    <span style="font-size:10pt;font-weight:bold">${dueValue}</span>
  </div>
</div>` : "";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Noto Sans Bengali', Arial, sans-serif; }
  body { width: 100%; padding: 5mm; font-size: 8pt; }
  h1 { font-size: 8pt; text-align: center; }
  h2 { font-size: 7pt; text-align: center; color: #555; margin-bottom: 4px; }
  .title { font-size: 9pt; font-weight: bold; text-align: center; margin: 4px 0 6px; }
  .meta { font-size: 7pt; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 6pt; }
  tr { page-break-inside: avoid; }
  th { background: #28508c; color: #fff; padding: 2px 4px; text-align: left; }
  td { padding: 2px 4px; border-bottom: 1px solid #eee; }
  .calc-box {
    border: 1.5px solid #28508c; border-radius: 4px;
    padding: 5px 8px; margin-bottom: 8px; font-size: 7pt;
  }
  .calc-row { display: flex; justify-content: space-between; padding: 1.5px 0; }
  .due-row { border-top: 1px solid #ccc; margin-top: 3px; padding-top: 4px; font-weight: bold; }
  .section-title { font-size: 7pt; font-weight: bold; color: #555; margin-bottom: 3px; }
</style>
</head>
<body>
<h1>${BUSINESS_NAME_EN}</h1>
<h2>${BUSINESS_NAME_BN}</h2>
<div class="title">PAYMENT STATEMENT</div>
<div class="meta">
  ${farmerHeader}
  <div>${opts.pumpName}</div>
</div>
${seasonCalcBox}
<div class="section-title">পেমেন্ট বিবরণ${opts.seasonName ? ` — ${opts.seasonName} ${opts.year ?? ""}` : ""}</div>
<table>
  <thead><tr>${farmerColHeader}<th>তারিখ</th><th>পরিমাণ</th><th>ধরন</th><th>পদ্ধতি</th></tr></thead>
  <tbody>${rows.length ? rows : '<tr><td colspan="5" style="text-align:center;color:#999;padding:6px">কোনো পেমেন্ট নেই</td></tr>'}</tbody>
</table>
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
