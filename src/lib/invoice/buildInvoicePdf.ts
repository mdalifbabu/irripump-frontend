import type { InvoiceResponse } from "@/lib/api/types";

const BUSINESS_NAME_EN = "Alhaj Yeaqub Ali Irrigation Pump";
const BUSINESS_NAME_BN = "আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প";

function fmt(n: number | undefined | null): string {
  return `৳${(n ?? 0).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
}

export function buildInvoicePdf(data: InvoiceResponse): { save: (filename: string) => void } {
  const landRows = data.lands.map((l) =>
    `<tr><td>${l.landmarkNumber}</td><td>${l.area ?? ""}</td></tr>`
  ).join("");

  const allocRows = data.allocations.map((a) =>
    `<tr><td>${a.seasonName}</td><td>${fmt(a.applied)}</td><td>${fmt(a.remainingAfter)}</td></tr>`
  ).join("");

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
  .meta { display: flex; justify-content: space-between; font-size: 6pt; color: #666; margin-bottom: 6px; }
  .section { margin-bottom: 6px; page-break-inside: avoid; }
  .section label { font-weight: bold; display: block; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 6px; page-break-inside: avoid; }
  tr { page-break-inside: avoid; }
  th { background: #3c783c; color: #fff; padding: 2px 4px; text-align: left; }
  td { padding: 2px 4px; border-bottom: 1px solid #eee; }
  .summary td { font-weight: bold; font-size: 7pt; }
  .summary td:last-child { text-align: right; }
</style>
</head>
<body>
<h1>${BUSINESS_NAME_EN}</h1>
<h2>${BUSINESS_NAME_BN}</h2>
<div class="title">INVOICE / রসিদ</div>
<div class="meta"><span>No: ${data.invoiceNo}</span><span>${new Date(data.issuedAt).toLocaleDateString("bn-BD")}</span></div>

<div class="section">
  <label>কৃষক</label>
  <div>${data.farmer.name} (${data.farmer.identifier})</div>
  <div>মৌসুম: ${data.season.name ?? ""} ${data.season.year ?? ""}</div>
  <div>পাম্প: ${data.pump.name}</div>
</div>

<div class="section">
  <label>পেমেন্ট</label>
  <div>${fmt(data.payment.amount)} · ${data.payment.paidAt} · ${data.payment.method}</div>
</div>

${data.lands.length > 0 ? `
<table>
  <tr><th>দাগ নম্বর</th><th>আকার</th></tr>
  ${landRows}
</table>` : ""}

${data.allocations.length > 0 ? `
<table>
  <thead><tr><th>মৌসুম</th><th>প্রয়োগ</th><th>বাকি</th></tr></thead>
  <tbody>${allocRows}</tbody>
</table>` : ""}

<table class="summary">
  <tr><td>মোট দেনা</td><td>${fmt(data.balances.totalDue)}</td></tr>
  <tr><td>মোট পরিশোধ</td><td>${fmt(data.balances.totalPaid)}</td></tr>
  <tr><td>বকেয়া</td><td>${fmt(data.balances.outstanding)}</td></tr>
  <tr><td>ক্রেডিট</td><td>${fmt(data.balances.creditBalance)}</td></tr>
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
