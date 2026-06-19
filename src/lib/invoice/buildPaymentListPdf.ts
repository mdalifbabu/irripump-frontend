import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Payment } from "@/lib/api/types";

const PAGE_W = 90;
const PAGE_H = 160;
const MARGIN = 5;

const BUSINESS_NAME_EN = "Alhaj Yeaqub Ali Irrigation Pump";
const BUSINESS_NAME_BN = "আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প";

function fmt(n: number): string {
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
}

export interface PaymentListPdfOptions {
  farmerName: string;
  farmerCode: string;
  pumpName: string;
  seasonName?: string;
  year?: number;
  payments: Payment[];
}

export function buildPaymentListPdf(opts: PaymentListPdfOptions): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: [PAGE_W, PAGE_H], orientation: "portrait" });
  const w = PAGE_W;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(BUSINESS_NAME_EN, w / 2, 8, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(BUSINESS_NAME_BN, w / 2, 12, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT STATEMENT", w / 2, 18, { align: "center" });

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  let y = 23;
  doc.text(`Farmer: ${opts.farmerName} (${opts.farmerCode})`, MARGIN, y);
  y += 3;
  doc.text(`Pump: ${opts.pumpName}`, MARGIN, y);
  if (opts.seasonName) {
    y += 3;
    doc.text(`Season: ${opts.seasonName} ${opts.year ?? ""}`, MARGIN, y);
  }

  y += 5;
  const activePayments = opts.payments.filter((p) => !p.isReversed);
  const total = activePayments.reduce((s, p) => s + p.amount, 0);

  autoTable(doc, {
    startY: y,
    head: [["Date", "Amount", "Method"]],
    body: opts.payments.map((p) => [
      p.paymentDate,
      (p.isReversed ? "(R) " : "") + fmt(p.amount),
      p.paymentMethod.replace("_", " "),
    ]),
    foot: [["Total", fmt(total), ""]],
    theme: "grid",
    styles: { fontSize: 6, cellPadding: 1 },
    headStyles: { fillColor: [40, 80, 140], fontSize: 6 },
    footStyles: { fillColor: [240, 240, 240], fontStyle: "bold", fontSize: 6 },
    margin: { left: MARGIN, right: MARGIN },
  });

  return doc;
}
