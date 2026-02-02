const nodemailer = require("nodemailer");

/**
 * EMAIL SERVICE
 * Handles sending transactional emails to users
 */

const sendEmail = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"TRADE.AI" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}: ${subject}`);
        return true;
    } catch (err) {
        console.error("❌ Email sending failed:", err.message);
        return false;
    }
};

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
      
      <p style="font-size: 12px; color: #94a3b8;">
        This is an automated message from TRADE.AI. If you have any questions, please contact support.
      </p>
    </div>
  `;

    return await sendEmail(user.email, subject, html);
};

module.exports = { sendAllotmentEmail };
