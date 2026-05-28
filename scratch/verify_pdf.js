const { PdfService } = require('c:/Users/dell/Documents/campusgrid-engine/dist/modules/storage/pdf.service.js');
const fs = require('fs');
const path = require('path');

async function test() {
  const service = new PdfService();

  const scratchDir = __dirname;
  console.log("Scratch directory:", scratchDir);

  console.log("Generating fee receipt...");
  const receipt = await service.generateFeeReceipt({
    schoolName: "Delhi Public School",
    studentName: "Preet Chahal",
    rollNo: "12345",
    billId: "BILL-2026-001",
    month: "May 2026",
    amount: 15000,
    paidAt: "28/05/2026",
  });
  fs.writeFileSync(path.join(scratchDir, 'receipt.pdf'), receipt);
  console.log("Receipt generated!");

  console.log("Generating salary slip...");
  const slip = await service.generateSalarySlip({
    schoolName: "Delhi Public School",
    staffName: "Amit Sharma",
    role: "TEACHER",
    month: "May 2026",
    base: 45000,
    allowances: 5000,
    deductions: 2000,
    net: 48000,
    paidAt: "28/05/2026",
  });
  fs.writeFileSync(path.join(scratchDir, 'salary_slip.pdf'), slip);
  console.log("Salary slip generated!");

  console.log("Generating subscription invoice...");
  const invoice = await service.generateSubscriptionInvoice({
    invoiceId: "INV-202605-SCH1234",
    schoolName: "Delhi Public School",
    month: "May 2026",
    studentCount: 150,
    ratePerStudent: 80,
    amountDue: 12000,
    amountPaid: 12000,
    paidAt: "28/05/2026",
  });
  fs.writeFileSync(path.join(scratchDir, 'subscription_invoice.pdf'), invoice);
  console.log("Subscription invoice generated!");
}

test().catch(console.error);
