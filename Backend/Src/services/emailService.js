const axios = require("axios");

/**
 * EMAIL SERVICE
 * Handles sending transactional emails to users using Resend API (Direct Https)
 */

const sendEmail = async (to, subject, html) => {
  try {
    const apiKey = process.env.RESEND_API;

    if (!apiKey) {
      console.error("❌ Email Service: RESEND_API missing in environment");
      return false;
    }

    if (!to) {
      console.error("❌ Email Service: Recipient address (to) is missing");
      return false;
    }

    console.log(`📡 Attempting to send email via Resend API to ${to}...`);

    const response = await axios.post('https://api.resend.com/emails', {
      from: 'Trade AI <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ Email sent successfully! ID: ${response.data.id}`);
      return true;
    } else {
      console.error("❌ Resend API failed with status:", response.status);
      return false;
    }
  } catch (err) {
    console.error("❌ Email sending failed ERROR:", err.response?.data?.message || err.message);
    if (err.response?.data) {
      console.error("Resend Error Detail:", JSON.stringify(err.response.data));
    }
    return false;
  }
};

/**
 * IPO TEMPLATES
 */
const sendAllotmentEmail = async (user, ipo, quantity) => {
  const subject = `IPO Allotment Confirmed: ${ipo.symbol} 🎉`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4f46e5;">Congratulations ${user.name}!</h2>
      <p>We are pleased to inform you that your IPO application for <strong>${ipo.companyName} (${ipo.symbol})</strong> has been successful.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Shares Allotted</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1e293b;">${quantity} Shares</p>
      </div>

      <p>These shares have been added to your portfolio and will be available for trading once the IPO is listed on the exchange.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">This is an automated message from TRADE.AI.</p>
    </div>
  `;
  return await sendEmail(user.email, subject, html);
};

const sendIPOApplicationEmail = async (user, ipo, lots, amount) => {
  const subject = `IPO Application Received: ${ipo.symbol}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4f46e5;">IPO Bid Placed</h2>
      <p>Hi ${user.name}, your application for <strong>${ipo.companyName} (${ipo.symbol})</strong> has been received.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Lots:</strong> ${lots}</p>
        <p><strong>Amount Blocked:</strong> ₹${amount.toLocaleString()}</p>
      </div>
      <p>We will notify you once the allotment process is completed.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">This is an automated message from TRADE.AI.</p>
    </div>
  `;
  return await sendEmail(user.email, subject, html);
};

const sendIPORejectionEmail = async (user, ipo, amount) => {
  const subject = `IPO Allotment Update: ${ipo.symbol}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #64748b;">IPO Allotment Result</h2>
      <p>Hi ${user.name}, we regret to inform you that you were not allotted shares for <strong>${ipo.symbol}</strong> in this round due to high oversubscription.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Refund Amount:</strong> ₹${amount.toLocaleString()}</p>
        <p><strong>Status:</strong> Funds released to Wallet</p>
      </div>
      <p>Your blocked funds have been credited back to your wallet balance immediately.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">This is an automated message from TRADE.AI.</p>
    </div>
  `;
  return await sendEmail(user.email, subject, html);
};

/**
 * WALLET TEMPLATES
 */
const sendDepositEmail = async (user, amount) => {
  const subject = `Wallet Credited: ₹${amount.toLocaleString()} ✅`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #059669;">Funds Added Successfully!</h2>
      <p>Hi ${user.name}, your trading wallet has been credited with new funds.</p>
      <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <p style="margin: 0; font-size: 14px; color: #065f46; text-transform: uppercase;">Amount Credited</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #064e3b;">₹${amount.toLocaleString()}</p>
      </div>
      <p>You can now use these funds to buy stocks or apply for IPOs.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">This is an automated message from TRADE.AI.</p>
    </div>
  `;
  return await sendEmail(user.email, subject, html);
};

/**
 * TRADE TEMPLATES
 */
const sendTradeEmail = async (user, order) => {
  const isBuy = order.side === "BUY";
  const subject = `Order Executed: ${order.side} ${order.symbol} ${isBuy ? '🔵' : '🔴'}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: ${isBuy ? '#2563eb' : '#dc2626'};">Order ${order.status === 'SUCCESS' ? 'Executed' : order.status}</h2>
      <p>Hi ${user.name}, your ${order.type} ${order.side} order for <strong>${order.symbol}</strong> has been processed.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; font-size: 14px;">
          <tr><td style="color: #64748b;">Quantity</td><td style="text-align: right; font-weight: bold;">${order.quantity}</td></tr>
          <tr><td style="color: #64748b;">Price</td><td style="text-align: right; font-weight: bold;">₹${order.price.toLocaleString()}</td></tr>
          <tr><td style="color: #64748b;">Total Value</td><td style="text-align: right; font-weight: bold;">₹${(order.quantity * order.price).toLocaleString()}</td></tr>
        </table>
      </div>
      <p>Check your portfolio for updated holdings.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">This is an automated message from TRADE.AI.</p>
    </div>
  `;
  return await sendEmail(user.email, subject, html);
};

const sendSupportEmail = async (user, subject, message) => {
  const adminEmail = "trading.ai2006@gmail.com";
  const emailSubject = `Support Ticket: ${subject}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4f46e5;">New Support Query</h2>
      <p>Bhai, ek naya support ticket aaya hai!</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>From:</strong> ${user.name} (${user.email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; color: #334155;">${message}</p>
      </div>

      <p style="font-size: 12px; color: #94a3b8;">User ID: ${user._id}</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">This query was sent via the TRADE.AI Support Portal.</p>
    </div>
  `;
  return await sendEmail(adminEmail, emailSubject, html);
};

module.exports = {
  sendAllotmentEmail,
  sendIPOApplicationEmail,
  sendIPORejectionEmail,
  sendDepositEmail,
  sendTradeEmail,
  sendSupportEmail
};
