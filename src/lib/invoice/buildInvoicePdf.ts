import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { InvoiceResponse } from "@/lib/api/types";

const BUSINESS_NAME_EN = "Alhaj Yeaqub Ali Irrigation Pump";
const BUSINESS_NAME_BN = "আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প";

/**
 * Builds the invoice PDF entirely in the browser from the JSON the backend returns.
 * Nothing binary crosses the network, so there's no "invalid PDF" failure mode here —
 * the worst case is a JS error before the file is even generated.
 */
export function buildInvoicePdf(data: InvoiceResponse): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text(BUSINESS_NAME_EN, pageWidth / 2, 16, { align: "center" });
  doc.setFontSize(12);
  doc.text(BUSINESS_NAME_BN, pageWidth / 2, 23, { align: "center" });

  doc.setFontSize(14);
  doc.text("INVOICE", pageWidth / 2, 33, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Invoice No: ${data.invoiceNo}`, 14, 42);
  doc.text(`Issued: ${new Date(data.issuedAt).toLocaleString()}`, pageWidth - 14, 42, { align: "right" });

  let y = 52;
  doc.setFontSize(11);
  doc.text("Pump", 14, y);
  doc.text("Farmer", pageWidth / 2 + 4, y);
  y += 6;
  doc.setFontSize(9);
  doc.text(`${data.pump.name} (#${data.pump.identifier})`, 14, y);
  doc.text(`${data.farmer.name} (${data.farmer.identifier})`, pageWidth / 2 + 4, y);
  y += 6;
  doc.text(`Operator: ${data.operator.name}`, 14, y);
  if (data.season.name) {
    doc.text(`Season: ${data.season.name}${data.season.type ? ` (${data.season.type})` : ""} ${data.season.year ?? ""}`, pageWidth / 2 + 4, y);
  }
  y += 10;

  doc.setFontSize(11);
  doc.text("Payment", 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.text(`Amount: ${data.payment.amount.toFixed(2)}  |  Date: ${data.payment.paidAt}  |  Method: ${data.payment.method}`, 14, y);
  y += 8;

  if (data.lands.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Landmark No.", "Area"]],
      body: data.lands.map((l) => [l.landmarkNumber, l.area]),
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [60, 120, 60] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // The season-wise allocation ladder — mirrors the farmer ledger.
  autoTable(doc, {
    startY: y,
    head: [["Season", "Due Date", "Applied", "Remaining After"]],
    body: data.allocations.map((a) => [
      a.seasonName,
      a.dueDate,
      a.applied.toFixed(2),
      a.remainingAfter.toFixed(2),
    ]),
    theme: "grid",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [40, 80, 140] },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: y,
    body: [
      ["Total Due", data.balances.totalDue.toFixed(2)],
      ["Total Paid", data.balances.totalPaid.toFixed(2)],
      ["Outstanding", data.balances.outstanding.toFixed(2)],
      ["Credit Balance", data.balances.creditBalance.toFixed(2)],
    ],
    theme: "plain",
    styles: { fontSize: 10, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" } },
  });

  return doc;
}
