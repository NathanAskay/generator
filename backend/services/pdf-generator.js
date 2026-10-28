const fs = require("fs");
const PDFDocument = require("pdfkit");
const config = require("../config/environment");

class PDFGenerator {
  constructor() {
    if (!fs.existsSync(config.QUOTE_DIR))
      fs.mkdirSync(config.QUOTE_DIR, { recursive: true });
  }

  /**
   * Generate a PDF document.
   * @param {string} docType - 'quote', 'invoice', or 'receipt'
   * @param {string} docNumber - Unique document ID
   * @param {string} clientName - Client's name
   * @param {Array} items - Array of {name, qty, unitPrice}
   * @param {number} discountPct - Discount percentage
   * @param {number} taxPct - Tax percentage
   * @param {string} notes - Additional notes
   * @param {object} company - Company object from DB
   * @returns {Promise<{filePath, publicUrl}>}
   */
  async generateDocument({
    docType,
    docNumber,
    clientName,
    items,
    discountPct = 0,
    taxPct = 0,
    notes = "",
    company = null,
  }) {
    const fileName = `${docNumber}.pdf`;
    const filePath = path.join(config.QUOTE_DIR, fileName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header: Document type and company info
      this._drawHeader(doc, docType, docNumber, company);

      // Client info
      this._drawClientInfo(doc, clientName);

      // Items table
      const subTotal = this._drawItemsTable(doc, items);

      // Totals with discount/tax
      this._drawTotals(doc, subTotal, discountPct, taxPct);

      // Notes
      if (notes) this._drawNotes(doc, notes);

      // Footer
      this._drawFooter(doc, company);

      doc.end();

      stream.on("finish", () => {
        const publicUrl = `${config.PUBLIC_URL}/pdf/${docNumber}`;
        resolve({ filePath, publicUrl });
      });
      stream.on("error", reject);
    });
  }

  _drawHeader(doc, docType, docNumber, company) {
    const title = docType.charAt(0).toUpperCase() + docType.slice(1);
    doc.fontSize(22).font("Helvetica-Bold").text(title, { align: "left" });
    doc.moveDown(0.5);

    if (company) {
      doc.fontSize(10).font("Helvetica-Bold").text(company.companyName);
      doc.font("Helvetica");
      if (company.registrationNumber)
        doc.text(`Reg: ${company.registrationNumber}`);
      if (company.address) doc.text(company.address);
      if (company.email) doc.text(company.email);
      if (company.phoneNumber)
        doc.text(company.phoneNumber.replace("whatsapp:", ""));
      doc.moveDown(1);
    }

    // Document details
    const left = 350;
    doc.fontSize(9);
    doc.text("Date:", left, 100);
    doc.text(new Date().toLocaleDateString(), left + 40, 100);
    doc.text("Document No.:", left, 115);
    doc.text(docNumber, left + 40, 115);
    doc.text("Due Date:", left, 130);
    doc.text(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      left + 40,
      130,
    );
    doc.moveTo(40, 160).lineTo(550, 160).stroke();
  }

  _drawClientInfo(doc, clientName) {
    doc.fontSize(10).font("Helvetica-Bold").text("Bill To", 40, 180);
    doc.font("Helvetica").text(clientName, 40, 195);
  }

  _drawItemsTable(doc, items) {
    const tableTop = 240;
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Qty", 40, tableTop);
    doc.text("Description", 80, tableTop);
    doc.text("Unit Price", 350, tableTop);
    doc.text("Total", 480, tableTop);
    doc
      .moveTo(40, tableTop + 12)
      .lineTo(550, tableTop + 12)
      .stroke();

    let y = tableTop + 25;
    let subTotal = 0;
    doc.font("Helvetica").fontSize(9);

    items.forEach((item) => {
      const lineTotal = item.qty * item.unitPrice;
      subTotal += lineTotal;
      doc.text(item.qty.toString(), 40, y);
      doc.text(item.name.substring(0, 40), 80, y, { width: 250 });
      doc.text(`P${item.unitPrice.toFixed(2)}`, 350, y);
      doc.text(`P${lineTotal.toFixed(2)}`, 480, y);
      y += 20;
    });

    doc
      .moveTo(40, y + 5)
      .lineTo(550, y + 5)
      .stroke();
    doc.y = y + 20;
    return subTotal;
  }

  _drawTotals(doc, subTotal, discountPct, taxPct) {
    const discountAmt = (discountPct / 100) * subTotal;
    const afterDiscount = subTotal - discountAmt;
    const taxAmt = (taxPct / 100) * afterDiscount;
    const total = afterDiscount + taxAmt;

    const left = 400;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Total", left, doc.y);
    doc.text(`P${subTotal.toFixed(2)}`, 480, doc.y);
    doc.moveDown(0.5);

    if (discountPct > 0) {
      doc.text(`Discount (${discountPct}%)`, left, doc.y);
      doc.text(`-P${discountAmt.toFixed(2)}`, 480, doc.y);
      doc.moveDown(0.5);
    }

    doc.text("Subtotal", left, doc.y);
    doc.text(`P${afterDiscount.toFixed(2)}`, 480, doc.y);
    doc.moveDown(0.5);

    if (taxPct > 0) {
      doc.text(`Tax (${taxPct}%)`, left, doc.y);
      doc.text(`P${taxAmt.toFixed(2)}`, 480, doc.y);
      doc.moveDown(0.5);
    }

    doc.fontSize(12).text("TOTAL", left, doc.y);
    doc.text(`P${total.toFixed(2)}`, 480, doc.y);
    doc.moveDown(1);
  }

  _drawNotes(doc, notes) {
    doc.fontSize(9).font("Helvetica-Bold").text("Notes:");
    doc.font("Helvetica").text(notes, { width: 500 });
  }

  _drawFooter(doc, company) {
    doc.moveDown(3);
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        company
          ? `${company.companyName} - Professional Business Solutions`
          : "Professional Business Solutions",
        { align: "center" },
      );
  }
}

module.exports = new PDFGenerator();
//nate
