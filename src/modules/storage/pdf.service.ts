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
}
