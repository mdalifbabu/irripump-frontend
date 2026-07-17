import QRCode from "qrcode";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&family=Noto+Sans:wght@400;700&display=swap";

const METHODS: Record<string, string> = {
  CASH: "নগদ",
  BANK: "ব্যাংক",
  MOBILE_BANKING: "মোবাইল ব্যাংকিং",
};

function fmt(n: number | null | undefined): string {
  return `৳${Math.round(n ?? 0).toLocaleString("en-BD")}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export interface LandInfo {
  landmarkNumber: string;
  area: string;
  tag?: string;
  sizeShatak?: number;
}

export interface SinglePaymentInfo {
  amount: number;
  date: string;
  method: string;
  reference?: string;
}

export interface OtherSeasonDue {
  seasonName: string;
  year?: number;
  due: number;
}

export interface PaymentRow {
  date: string;
  amount: number;
  method: string;
  reference?: string;
  isReversed?: boolean;
}

export interface SingleReceiptData {
  mode: "single";
  invoiceNo: string;
  issuedAt: string;
  pumpName: string;
  pumpNameBengali?: string;
  farmerName: string;
  farmerCode: string;
  seasonName: string;
  year: number;
  payment: SinglePaymentInfo;
  lands: LandInfo[];
  totalLandShatak?: number;
  selectedSeasonTotal: number;
  selectedSeasonDue: number;
  otherSeasonDues: OtherSeasonDue[];
  farmerPortalUrl: string;
}

export interface ListReceiptData {
  mode: "list";
  statementNo: string;
  issuedAt: string;
  pumpName: string;
  pumpNameBengali?: string;
  farmerName?: string;
  farmerCode?: string;
  seasonName: string;
  year: number;
  payments: PaymentRow[];
  selectedSeasonTotal?: number;
  selectedSeasonDue?: number;
  farmerPortalUrl?: string;
}

export type ReceiptData = SingleReceiptData | ListReceiptData;

export async function buildReceiptHtml(data: ReceiptData): Promise<string> {
  const portalUrl =
    data.mode === "single"
      ? data.farmerPortalUrl
      : (data as ListReceiptData).farmerPortalUrl;

  const qrSvg = portalUrl
    ? await QRCode.toString(portalUrl, {
        type: "svg",
        width: 80,
        margin: 0,
        errorCorrectionLevel: "M",
      })
    : null;

  const pumpBn = data.pumpNameBengali ?? data.pumpName;
  const docNo = data.mode === "single" ? data.invoiceNo : data.statementNo;
  const docTitle = data.mode === "single" ? "INVOICE / রসিদ" : "PAYMENT STATEMENT / বিবৃতি";

  const farmerName = data.mode === "single" ? data.farmerName : (data as ListReceiptData).farmerName;
  const farmerCode = data.mode === "single" ? data.farmerCode : (data as ListReceiptData).farmerCode;

  const farmerBlock =
    farmerName && qrSvg
      ? `<div class="flex-row farmer-block">
  <div class="flex-grow">
    <div class="bold">${farmerName}</div>
    <div class="small gray">কোড: ${farmerCode ?? ""}</div>
    <div class="small">মৌসুম: ${data.seasonName} ${data.year}</div>
    <div class="small">পাম্প: ${data.pumpName}</div>
  </div>
  <div class="qr-box">${qrSvg}</div>
</div>`
      : `<div class="small">মৌসুম: ${data.seasonName} ${data.year} · পাম্প: ${data.pumpName}</div>`;

  const headerHtml = `
<div class="center bold large">${pumpBn}</div>
<div class="center small gray">${data.pumpName}</div>
<div class="divider"></div>
<div class="center bold doc-title">${docTitle}</div>
<div class="meta-row">
  <span>No: ${docNo}</span>
  <span>${fmtDate(data.issuedAt)}</span>
</div>
<div class="divider"></div>
${farmerBlock}
<div class="divider"></div>`;

  let contentHtml = "";

  if (data.mode === "single") {
    const methodLabel = METHODS[data.payment.method] ?? data.payment.method;
    contentHtml += `
<div class="pay-box">
  <div class="pay-amount">${fmt(data.payment.amount)}</div>
  <div class="small">তারিখ: ${fmtDate(data.payment.date)}</div>
  <div class="small">পদ্ধতি: ${methodLabel}</div>
  ${data.payment.reference ? `<div class="small gray">Ref: ${data.payment.reference}</div>` : ""}
</div>`;

    if (data.lands.length > 0) {
      const rows = data.lands
        .map((l) => {
          const tag = l.tag ? `<br/><span class="gray" style="font-size:6pt">${l.tag}</span>` : "";
          return `<tr><td>${l.landmarkNumber}${tag}</td><td class="right">${l.area}</td></tr>`;
        })
        .join("");
      const computedTotal = data.lands.reduce((s, l) => s + (l.sizeShatak ?? 0), 0);
      const shatak = data.totalLandShatak ?? (computedTotal > 0 ? computedTotal : null);
      const totalLine = shatak != null
        ? `<div class="total-line">মোট: ${shatak.toFixed(2)} শতক (${(shatak / 33).toFixed(3)} বিঘা)</div>`
        : "";
      contentHtml += `
<div class="section-label">জমির তথ্য</div>
<table>
  <thead><tr><th>দাগ নং</th><th>আয়তন</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
${totalLine}
<div class="divider"></div>`;
    }

    const dueColor = data.selectedSeasonDue > 0 ? "#c62828" : "#166534";
    const dueLabel = data.selectedSeasonDue > 0 ? "মোট বকেয়া" : "অগ্রিম জমা";
    contentHtml += `
<div class="calc-box">
  <div class="calc-title">মৌসুম হিসাব — ${data.seasonName} ${data.year}</div>
  <div class="calc-row"><span>মৌসুম বিল</span><span>${fmt(data.selectedSeasonTotal)}</span></div>
  <div class="calc-row due-row" style="color:${dueColor}">
    <span>${dueLabel}</span>
    <span class="due-amount">${fmt(Math.abs(data.selectedSeasonDue))}</span>
  </div>
</div>`;

    if (data.otherSeasonDues.length > 0) {
      const dueRows = data.otherSeasonDues
        .map(
          (s) =>
            `<div class="calc-row other-due"><span>${s.seasonName}${s.year ? ` ${s.year}` : ""}</span><span>${fmt(s.due)}</span></div>`
        )
        .join("");
      contentHtml += `
<div class="other-dues-box">
  <div class="calc-title red">অন্য মৌসুমের বকেয়া</div>
  ${dueRows}
</div>`;
    }
  } else {
    const validPayments = data.payments.filter((p) => !p.isReversed);
    const totalPaid = validPayments.reduce((s, p) => s + p.amount, 0);

    const rows = data.payments
      .map((p) => {
        const cls = p.isReversed ? ' class="reversed"' : "";
        const ref = p.reference
          ? `<br/><span class="gray" style="font-size:6pt">${p.reference}</span>`
          : "";
        return `<tr${cls}><td>${fmtDate(p.date)}</td><td class="right">${fmt(p.amount)}${ref}</td><td>${METHODS[p.method] ?? p.method}</td></tr>`;
      })
      .join("");

    contentHtml += `
<div class="section-label">পেমেন্ট বিবরণ — ${data.seasonName} ${data.year}</div>
<table>
  <thead><tr><th>তারিখ</th><th>পরিমাণ</th><th>পদ্ধতি</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="3" class="center gray">কোনো পেমেন্ট নেই</td></tr>'}</tbody>
</table>
<div class="total-line">মোট আদায়: ${fmt(totalPaid)}</div>
<div class="divider"></div>`;

    if (data.selectedSeasonTotal != null || data.selectedSeasonDue != null) {
      const dueAmt = data.selectedSeasonDue ?? 0;
      const dueColor = dueAmt > 0 ? "#c62828" : "#166534";
      const dueLabel = dueAmt > 0 ? "মোট বকেয়া" : "অগ্রিম জমা";
      contentHtml += `
<div class="calc-box">
  <div class="calc-title">মৌসুম হিসাব — ${data.seasonName} ${data.year}</div>
  <div class="calc-row"><span>মৌসুম বিল</span><span>${fmt(data.selectedSeasonTotal)}</span></div>
  <div class="calc-row due-row" style="color:${dueColor}">
    <span>${dueLabel}</span>
    <span class="due-amount">${fmt(Math.abs(dueAmt))}</span>
  </div>
</div>`;
    }
  }

  const css = `
@page { size: 80mm auto; margin: 2mm 3mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: 74mm;
  font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif;
  font-size: 8pt;
  color: #111;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.center { text-align: center; }
.right { text-align: right; }
.bold { font-weight: 700; }
.large { font-size: 10pt; margin-bottom: 1px; }
.small { font-size: 7pt; }
.gray { color: #666; }
.red { color: #c62828; }
.doc-title { font-size: 9pt; margin: 3px 0; letter-spacing: 0.5px; }
.divider { border-top: 1px dashed #bbb; margin: 4px 0; }
.meta-row { display: flex; justify-content: space-between; font-size: 7pt; color: #555; margin: 2px 0; }
.flex-row { display: flex; align-items: flex-start; gap: 6px; }
.farmer-block { justify-content: space-between; }
.flex-grow { flex: 1; min-width: 0; line-height: 1.5; }
.qr-box { flex-shrink: 0; width: 72px; height: 72px; }
.qr-box svg { width: 72px !important; height: 72px !important; display: block; }
.section-label { font-weight: 700; font-size: 7pt; color: #444; margin: 3px 0 2px; }
table { width: 100%; border-collapse: collapse; font-size: 7pt; margin-bottom: 3px; }
th { background: #1a6b3c; color: #fff; padding: 2px 4px; text-align: left; }
td { padding: 2px 4px; border-bottom: 1px solid #eee; vertical-align: top; }
tr.reversed td { color: #999; text-decoration: line-through; }
.total-line { font-size: 7pt; font-weight: 700; text-align: right; margin-bottom: 3px; }
.pay-box { background: #f0f9f4; border: 1.5px solid #1a6b3c; border-radius: 3px; padding: 5px 7px; margin-bottom: 5px; }
.pay-amount { font-size: 14pt; font-weight: 700; color: #1a6b3c; line-height: 1.2; }
.calc-box { border: 1px solid #1a6b3c; border-radius: 3px; padding: 4px 6px; margin-top: 4px; font-size: 7pt; }
.other-dues-box { border: 1px solid #ef9a9a; border-radius: 3px; padding: 4px 6px; margin-top: 4px; font-size: 7pt; }
.calc-title { font-weight: 700; font-size: 7pt; color: #1a6b3c; margin-bottom: 3px; }
.calc-title.red { color: #c62828; }
.calc-row { display: flex; justify-content: space-between; padding: 1px 0; }
.due-row { border-top: 1px solid #c8e6c9; margin-top: 3px; padding-top: 3px; font-weight: 700; }
.due-amount { font-size: 9pt; }
.other-due { color: #c62828; }
.footer { margin-top: 5px; font-size: 6pt; color: #999; text-align: center; }`;

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8"/>
<title>${docNo}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="${FONT_URL}" rel="stylesheet"/>
<style>${css}</style>
</head>
<body>
${headerHtml}
${contentHtml}
<div class="footer">IrriPump · irripump.com</div>
</body>
</html>`;
}

export function printReceiptHtml(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:0;width:320px;height:1px;border:0;visibility:hidden;";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const cleanup = () => {
    try {
      document.body.removeChild(iframe);
    } catch {}
  };
  iframe.contentWindow?.addEventListener("afterprint", cleanup);
  // Give Google Fonts time to load before printing
  setTimeout(() => {
    iframe.contentWindow?.print();
  }, 900);
}

export async function downloadReceiptAsPng(html: string, filename: string): Promise<void> {
  const { toPng } = await import("html-to-image");

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:-9999px;top:0;background:#fff;padding:4mm;box-sizing:border-box;";
  // 74mm ≈ 280px at 96dpi
  wrapper.style.width = "280px";

  // Inline the receipt <style>
  const styleEl = doc.querySelector("style");
  if (styleEl) {
    const s = document.createElement("style");
    s.textContent = styleEl.textContent ?? "";
    wrapper.appendChild(s);
  }

  const bodyEl = doc.body;
  bodyEl.style.width = "280px";
  wrapper.innerHTML += bodyEl.innerHTML;

  document.body.appendChild(wrapper);
  try {
    await document.fonts.ready;
    const dataUrl = await toPng(wrapper, { pixelRatio: 2, backgroundColor: "#ffffff" });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${filename}.png`;
    a.click();
  } finally {
    document.body.removeChild(wrapper);
  }
}
