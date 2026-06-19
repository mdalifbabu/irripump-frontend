import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { InvoiceResponse } from "@/lib/api/types";

// Portrait, mobile-width canvas: 90mm × 160mm
const PAGE_W = 90;
const PAGE_H = 160;
const MARGIN = 5;

const BUSINESS_NAME_EN = "Alhaj Yeaqub Ali Irrigation Pump";
const BUSINESS_NAME_BN = "আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প";

function fmt(n: number | undefined | null): string {
  return `৳${(n ?? 0).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
}

export function buildInvoicePdf(data: InvoiceResponse): jsPDF {
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
  doc.text("INVOICE", w / 2, 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(`No: ${data.invoiceNo}`, MARGIN, 23);
  doc.text(new Date(data.issuedAt).toLocaleString(), w - MARGIN, 23, { align: "right" });

  let y = 28;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Farmer", MARGIN, y);
  doc.setFont("helvetica", "normal");
  y += 4;
  doc.text(`${data.farmer.name} (${data.farmer.identifier})`, MARGIN, y);
  y += 3;
  doc.text(`Season: ${data.season.name ?? ""} ${data.season.year ?? ""}`, MARGIN, y);
  y += 3;
  doc.text(`Pump: ${data.pump.name}  |  Operator: ${data.operator.name}`, MARGIN, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Payment", MARGIN, y);
  doc.setFont("helvetica", "normal");
  y += 4;
  doc.text(`${fmt(data.payment.amount)}  •  ${data.payment.paidAt}  •  ${data.payment.method}`, MARGIN, y);

  if (data.lands.length > 0) {
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Landmark", "Area"]],
      body: data.lands.map((l) => [l.landmarkNumber, l.area]),
      theme: "grid",
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [60, 120, 60], fontSize: 6 },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  autoTable(doc, {
    startY: y,
    head: [["Season", "Applied", "Remaining"]],
    body: data.allocations.map((a) => [a.seasonName, fmt(a.applied), fmt(a.remainingAfter)]),
    theme: "grid",
    styles: { fontSize: 6, cellPadding: 1 },
    headStyles: { fillColor: [40, 80, 140], fontSize: 6 },
    margin: { left: MARGIN, right: MARGIN },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  autoTable(doc, {
    startY: y,
    body: [
      ["Total Due", fmt(data.balances.totalDue)],
      ["Total Paid", fmt(data.balances.totalPaid)],
      ["Outstanding", fmt(data.balances.outstanding)],
      ["Credit", fmt(data.balances.creditBalance)],
    ],
    theme: "plain",
    styles: { fontSize: 7, fontStyle: "bold", cellPadding: 1 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: MARGIN, right: MARGIN },
  });

  return doc;
}
