import { Injectable } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';

class PDFHelper {
  private y: number = 780;
  constructor(private page: PDFPage, private fonts: { regular: PDFFont; bold: PDFFont }) {}

  moveDown(points: number) {
    this.y -= points;
  }

  getY() {
    return this.y;
  }

  setY(val: number) {
    this.y = val;
  }

  drawText(text: string, options: { x: number; size: number; isBold?: boolean; color?: any }) {
    this.page.drawText(text, {
      x: options.x,
      y: this.y,
      size: options.size,
      font: options.isBold ? this.fonts.bold : this.fonts.regular,
      color: options.color || rgb(31/255, 41/255, 55/255),
    });
  }

  drawRightAlignedText(text: string, options: { x: number; size: number; isBold?: boolean; color?: any }) {
    const font = options.isBold ? this.fonts.bold : this.fonts.regular;
    const textWidth = font.widthOfTextAtSize(text, options.size);
    this.page.drawText(text, {
      x: options.x - textWidth,
      y: this.y,
      size: options.size,
      font,
      color: options.color || rgb(31/255, 41/255, 55/255),
    });
  }

  drawLine(options: { thickness?: number; color?: any; margin?: number }) {
    const margin = options.margin || 40;
    this.page.drawLine({
      start: { x: margin, y: this.y },
      end: { x: 595.28 - margin, y: this.y },
      thickness: options.thickness || 1,
      color: options.color || rgb(229/255, 231/255, 235/255),
    });
  }

  drawTableHeaderBg(x: number, width: number, height: number = 22) {
    this.page.drawRectangle({
      x,
      y: this.y - 6,
      width,
      height,
      color: rgb(249/255, 250/255, 251/255),
    });
  }
}

@Injectable()
export class PdfService {
  async generateFeeReceipt(data: {
    schoolName: string;
    studentName: string;
    rollNo: string;
    billId: string;
    month: string;
    amount: number;
    paidAt: string;
  }): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const helper = new PDFHelper(page, { regular: fontRegular, bold: fontBold });
    
    // Header
    helper.setY(760);
    helper.drawText(data.schoolName, { x: 40, size: 24, isBold: true, color: rgb(26/255, 115/255, 232/255) });
    helper.moveDown(22);
    helper.drawText('Fee Payment Receipt', { x: 40, size: 12, color: rgb(107/255, 114/255, 128/255) });
    
    helper.moveDown(18);
    helper.drawLine({});
    
    // Info Block
    helper.moveDown(30);
    const startY = helper.getY();
    helper.drawText(`Student: ${data.studentName}`, { x: 40, size: 11, isBold: true });
    helper.moveDown(18);
    helper.drawText(`Roll No: ${data.rollNo}`, { x: 40, size: 11 });
    
    helper.setY(startY);
    helper.drawRightAlignedText(`Receipt No: ${data.billId}`, { x: 555.28 - 40, size: 11, isBold: true });
    helper.moveDown(18);
    helper.drawRightAlignedText(`Date: ${data.paidAt}`, { x: 555.28 - 40, size: 11 });
    
    // Table
    helper.moveDown(40);
    helper.drawTableHeaderBg(40, 515.28);
    helper.drawText('Description', { x: 50, size: 10, isBold: true, color: rgb(75/255, 85/255, 99/255) });
    helper.drawText('Month', { x: 300, size: 10, isBold: true, color: rgb(75/255, 85/255, 99/255) });
    helper.drawRightAlignedText('Amount', { x: 555.28 - 50, size: 10, isBold: true, color: rgb(75/255, 85/255, 99/255) });
    
    helper.moveDown(22);
    helper.drawLine({});
    
    helper.moveDown(20);
    helper.drawText('Academic Fees', { x: 50, size: 11 });
    helper.drawText(data.month, { x: 300, size: 11 });
    helper.drawRightAlignedText(`Rs. ${data.amount}`, { x: 555.28 - 50, size: 11 });
    
    helper.moveDown(20);
    helper.drawLine({});
    
    // Total
    helper.moveDown(35);
    helper.drawRightAlignedText(`Total Paid: Rs. ${data.amount}`, { x: 555.28 - 50, size: 16, isBold: true });
    
    // Footer
    helper.setY(100);
    helper.drawLine({});
    helper.moveDown(20);
    const footerText = 'This is a computer-generated receipt and does not require a physical signature.';
    const textWidth = fontRegular.widthOfTextAtSize(footerText, 9);
    page.drawText(footerText, {
      x: (595.28 - textWidth) / 2,
      y: helper.getY(),
      size: 9,
      font: fontRegular,
      color: rgb(156/255, 163/255, 175/255),
    });
    
    return Buffer.from(await pdfDoc.save());
  }

  async generateSalarySlip(data: {
    schoolName: string;
    staffName: string;
    role: string;
    month: string;
    base: number;
    allowances: number;
    deductions: number;
    net: number;
    paidAt: string;
  }): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const helper = new PDFHelper(page, { regular: fontRegular, bold: fontBold });
    
    // Header
    helper.setY(760);
    helper.drawText(data.schoolName, { x: 40, size: 24, isBold: true, color: rgb(217/255, 48/255, 37/255) });
    helper.moveDown(22);
    helper.drawText(`Salary Slip - ${data.month}`, { x: 40, size: 12, color: rgb(107/255, 114/255, 128/255) });
    
    helper.moveDown(18);
    helper.drawLine({});
    
    // Info Block
    helper.moveDown(30);
    const startY = helper.getY();
    helper.drawText(`Employee: ${data.staffName}`, { x: 40, size: 11, isBold: true });
    helper.moveDown(18);
    helper.drawText(`Designation: ${data.role}`, { x: 40, size: 11 });
    
    helper.setY(startY);
    helper.drawRightAlignedText(`Date Paid: ${data.paidAt}`, { x: 555.28 - 40, size: 11 });
    
    // Table
    helper.moveDown(40);
    helper.drawTableHeaderBg(40, 515.28);
    helper.drawText('Earnings', { x: 50, size: 10, isBold: true, color: rgb(75/255, 85/255, 99/255) });
    helper.drawRightAlignedText('Amount', { x: 250, size: 10, isBold: true, color: rgb(75/255, 85/255, 99/255) });
    helper.drawText('Deductions', { x: 300, size: 10, isBold: true, color: rgb(75/255, 85/255, 99/255) });
    helper.drawRightAlignedText('Amount', { x: 555.28 - 50, size: 10, isBold: true, color: rgb(75/255, 85/255, 99/255) });
    
    helper.moveDown(22);
    helper.drawLine({});
    
    helper.moveDown(20);
    helper.drawText('Basic Salary', { x: 50, size: 11 });
    helper.drawRightAlignedText(`Rs. ${data.base}`, { x: 250, size: 11 });
    helper.drawText('Taxes / Other', { x: 300, size: 11 });
    helper.drawRightAlignedText(`Rs. ${data.deductions}`, { x: 555.28 - 50, size: 11 });
    
    helper.moveDown(20);
    helper.drawText('Allowances', { x: 50, size: 11 });
    helper.drawRightAlignedText(`Rs. ${data.allowances}`, { x: 250, size: 11 });
    
    helper.moveDown(20);
    helper.drawLine({});
    
    // Net Salary Row
    helper.moveDown(20);
    helper.drawTableHeaderBg(40, 515.28);
    helper.drawText('Net Salary Disbursed', { x: 50, size: 11, isBold: true });
    helper.drawRightAlignedText(`Rs. ${data.net}`, { x: 555.28 - 50, size: 11, isBold: true });
    
    // Footer
    helper.setY(100);
    helper.drawLine({});
    helper.moveDown(20);
    const footerText = `Generated by CampusGrid Engine on ${new Date().toLocaleDateString()}`;
    const textWidth = fontRegular.widthOfTextAtSize(footerText, 9);
    page.drawText(footerText, {
      x: (595.28 - textWidth) / 2,
      y: helper.getY(),
      size: 9,
      font: fontRegular,
      color: rgb(156/255, 163/255, 175/255),
    });
    
    return Buffer.from(await pdfDoc.save());
  }

  async generateSubscriptionInvoice(data: {
    invoiceId: string;
    schoolName: string;
    month: string;
    studentCount: number;
    ratePerStudent: number;
    amountDue: number;
    amountPaid: number;
    paidAt: string;
  }): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const helper = new PDFHelper(page, { regular: fontRegular, bold: fontBold });
    
    // Header
    helper.setY(760);
    helper.drawText('CAMPUSGRID', { x: 40, size: 24, isBold: true, color: rgb(79/255, 70/255, 229/255) });
    helper.moveDown(26);
    helper.drawText('INVOICE', { x: 40, size: 30, isBold: true });
    
    // Paid Badge & Invoice ID
    helper.setY(760);
    page.drawRectangle({
      x: 555.28 - 40 - 55,
      y: helper.getY() - 4,
      width: 55,
      height: 18,
      color: rgb(220/255, 252/255, 231/255),
    });
    page.drawText('PAID', {
      x: 555.28 - 40 - 40,
      y: helper.getY(),
      size: 10,
      font: fontBold,
      color: rgb(22/255, 101/255, 52/255),
    });
    
    helper.moveDown(24);
    helper.drawRightAlignedText(data.invoiceId, { x: 555.28 - 40, size: 12, isBold: true, color: rgb(75/255, 85/255, 99/255) });
    
    helper.moveDown(22);
    helper.drawLine({});
    
    // Billed To / Payment Details
    helper.moveDown(30);
    const startY = helper.getY();
    helper.drawText('BILLED TO', { x: 40, size: 9, isBold: true, color: rgb(156/255, 163/255, 175/255) });
    helper.moveDown(15);
    helper.drawText(data.schoolName, { x: 40, size: 12, isBold: true });
    helper.moveDown(15);
    const lastFour = data.invoiceId.split('-').pop() || '';
    helper.drawText(`School Node ID: ${lastFour}`, { x: 40, size: 10, color: rgb(75/255, 85/255, 99/255) });
    
    helper.setY(startY);
    helper.drawRightAlignedText('PAYMENT DETAILS', { x: 555.28 - 40, size: 9, isBold: true, color: rgb(156/255, 163/255, 175/255) });
    helper.moveDown(15);
    helper.drawRightAlignedText(`Billing Month: ${data.month}`, { x: 555.28 - 40, size: 10 });
    helper.moveDown(15);
    helper.drawRightAlignedText(`Date Paid: ${data.paidAt}`, { x: 555.28 - 40, size: 10 });
    
    // Table
    helper.moveDown(45);
    helper.drawTableHeaderBg(40, 515.28);
    helper.drawText('Service Description', { x: 50, size: 10, isBold: true, color: rgb(75/255, 85/255, 99/255) });
    helper.drawRightAlignedText('Student Count', { x: 340, size: 10, isBold: true, color: rgb(75/255, 85/255, 99/255) });
    helper.drawRightAlignedText('Rate / Student', { x: 440, size: 10, isBold: true, color: rgb(75/255, 85/255, 99/255) });
    helper.drawRightAlignedText('Subtotal', { x: 555.28 - 50, size: 10, isBold: true, color: rgb(75/255, 85/255, 99/255) });
    
    helper.moveDown(22);
    helper.drawLine({});
    
    helper.moveDown(20);
    helper.drawText('CampusGrid Infrastructure & Node', { x: 50, size: 10 });
    helper.drawRightAlignedText(data.studentCount.toString(), { x: 340, size: 10 });
    helper.drawRightAlignedText(`Rs. ${data.ratePerStudent}`, { x: 440, size: 10 });
    helper.drawRightAlignedText(`Rs. ${data.amountDue}`, { x: 555.28 - 50, size: 10 });
    
    helper.moveDown(15);
    helper.drawText('Maintenance Subscription', { x: 50, size: 10 });
    
    helper.moveDown(20);
    helper.drawLine({});
    
    // Summary
    helper.moveDown(30);
    helper.drawRightAlignedText('Amount Due', { x: 440, size: 11 });
    helper.drawRightAlignedText(`Rs. ${data.amountDue}`, { x: 555.28 - 50, size: 11 });
    
    helper.moveDown(20);
    helper.drawLine({ margin: 380 });
    
    helper.moveDown(25);
    helper.drawRightAlignedText('Total Paid', { x: 440, size: 16, isBold: true });
    helper.drawRightAlignedText(`Rs. ${data.amountPaid}`, { x: 555.28 - 50, size: 16, isBold: true, color: rgb(79/255, 70/255, 229/255) });
    
    // Footer
    helper.setY(100);
    helper.drawLine({});
    helper.moveDown(20);
    const footerText1 = 'Thank you for choosing CampusGrid. This is an official receipt for your school node subscription.';
    let textWidth = fontRegular.widthOfTextAtSize(footerText1, 9);
    page.drawText(footerText1, {
      x: (595.28 - textWidth) / 2,
      y: helper.getY(),
      size: 9,
      font: fontRegular,
      color: rgb(156/255, 163/255, 175/255),
    });
    
    helper.moveDown(15);
    const footerText2 = 'Support: help@campusgrid.com | Website: campusgrid.com';
    textWidth = fontRegular.widthOfTextAtSize(footerText2, 9);
    page.drawText(footerText2, {
      x: (595.28 - textWidth) / 2,
      y: helper.getY(),
      size: 9,
      font: fontRegular,
      color: rgb(156/255, 163/255, 175/255),
    });
    
    return Buffer.from(await pdfDoc.save());
  }
}
