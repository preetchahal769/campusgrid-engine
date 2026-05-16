import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  async generatePdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });
    await browser.close();
    return Buffer.from(pdf);
  }

  getFeeReceiptTemplate(data: {
    schoolName: string;
    studentName: string;
    rollNo: string;
    billId: string;
    month: string;
    amount: number;
    paidAt: string;
  }) {
    return `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #1a73e8; }
            .receipt-info { margin-top: 30px; display: flex; justify-content: space-between; }
            .details { margin-top: 40px; width: 100%; border-collapse: collapse; }
            .details th, .details td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
            .total { margin-top: 30px; text-align: right; font-size: 20px; font-weight: bold; }
            .footer { margin-top: 100px; text-align: center; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${data.schoolName}</div>
            <p>Fee Payment Receipt</p>
          </div>
          <div class="receipt-info">
            <div>
              <strong>Student:</strong> ${data.studentName}<br>
              <strong>Roll No:</strong> ${data.rollNo}
            </div>
            <div style="text-align: right;">
              <strong>Receipt No:</strong> ${data.billId}<br>
              <strong>Date:</strong> ${data.paidAt}
            </div>
          </div>
          <table class="details">
            <thead>
              <tr>
                <th>Description</th>
                <th>Month</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Academic Fees</td>
                <td>${data.month}</td>
                <td>₹${data.amount}</td>
              </tr>
            </tbody>
          </table>
          <div class="total">Total Paid: ₹${data.amount}</div>
          <div class="footer">
            This is a computer-generated receipt and does not require a physical signature.
          </div>
        </body>
      </html>
    `;
  }

  getSalarySlipTemplate(data: {
    schoolName: string;
    staffName: string;
    role: string;
    month: string;
    base: number;
    allowances: number;
    deductions: number;
    net: number;
    paidAt: string;
  }) {
    return `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #d93025; }
            .info { margin-top: 30px; display: flex; justify-content: space-between; }
            .table { margin-top: 40px; width: 100%; border-collapse: collapse; }
            .table th, .table td { padding: 12px; border: 1px solid #eee; text-align: left; }
            .net { background: #f8f9fa; font-weight: bold; }
            .footer { margin-top: 100px; text-align: center; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${data.schoolName}</div>
            <p>Salary Slip - ${data.month}</p>
          </div>
          <div class="info">
            <div>
              <strong>Employee:</strong> ${data.staffName}<br>
              <strong>Designation:</strong> ${data.role}
            </div>
            <div style="text-align: right;">
              <strong>Date Paid:</strong> ${data.paidAt}
            </div>
          </div>
          <table class="table">
            <tr>
              <th>Earnings</th>
              <th>Amount</th>
              <th>Deductions</th>
              <th>Amount</th>
            </tr>
            <tr>
              <td>Basic Salary</td>
              <td>₹${data.base}</td>
              <td>Taxes / Other</td>
              <td>₹${data.deductions}</td>
            </tr>
            <tr>
              <td>Allowances</td>
              <td>₹${data.allowances}</td>
              <td></td>
              <td></td>
            </tr>
            <tr class="net">
              <td colspan="3">Net Salary Disbursed</td>
              <td>₹${data.net}</td>
            </tr>
          </table>
          <div class="footer">
            Generated by CampusGrid Engine on ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;
  }

  getSubscriptionInvoiceTemplate(data: {
    invoiceId: string;
    schoolName: string;
    month: string;
    studentCount: number;
    ratePerStudent: number;
    amountDue: number;
    amountPaid: number;
    paidAt: string;
  }) {
    return `
      <html>
        <head>
          <style>
            body { font-family: 'Inter', 'Helvetica', sans-serif; padding: 50px; color: #1f2937; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 30px; }
            .logo { font-size: 28px; font-weight: 800; color: #4f46e5; letter-spacing: -0.025em; }
            .invoice-title { font-size: 36px; font-weight: 700; color: #111827; margin-top: 10px; }
            .meta { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .meta-box h3 { font-size: 14px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin-bottom: 8px; }
            .meta-box p { font-size: 16px; font-weight: 500; color: #374151; }
            .table { width: 100%; margin-top: 50px; border-collapse: collapse; }
            .table th { background: #f9fafb; text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
            .table td { padding: 16px; font-size: 15px; border-bottom: 1px solid #f3f4f6; }
            .summary { margin-top: 40px; margin-left: auto; width: 300px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .summary-row.total { border-top: 2px solid #e5e7eb; margin-top: 10px; padding-top: 15px; font-size: 20px; font-weight: 700; color: #111827; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #dcfce7; color: #166534; }
            .footer { margin-top: 80px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">CAMPUSGRID</div>
              <div class="invoice-title">INVOICE</div>
            </div>
            <div style="text-align: right;">
              <div class="status-badge">PAID</div>
              <p style="margin-top: 10px; font-weight: 600; color: #4b5563;">${data.invoiceId}</p>
            </div>
          </div>
          
          <div class="meta">
            <div class="meta-box">
              <h3>Billed To</h3>
              <p><strong>${data.schoolName}</strong></p>
              <p>School Node ID: ${data.invoiceId.split('-').pop()}</p>
            </div>
            <div style="text-align: right;" class="meta-box">
              <h3>Payment Details</h3>
              <p>Billing Month: ${data.month}</p>
              <p>Date Paid: ${data.paidAt}</p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Service Description</th>
                <th style="text-align: right;">Student Count</th>
                <th style="text-align: right;">Rate / Student</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>CampusGrid Infrastructure & Node Maintenance Subscription</td>
                <td style="text-align: right;">${data.studentCount}</td>
                <td style="text-align: right;">₹${data.ratePerStudent}</td>
                <td style="text-align: right;">₹${data.amountDue}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Amount Due</span>
              <span>₹${data.amountDue}</span>
            </div>
            <div class="summary-row total">
              <span>Total Paid</span>
              <span>₹${data.amountPaid}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing CampusGrid. This is an official receipt for your school node subscription.</p>
            <p style="margin-top: 5px;">Support: help@campusgrid.com | Website: campusgrid.com</p>
          </div>
        </body>
      </html>
    `;
  }
}
