import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Create reusable transporter object
let transporter;

async function setupTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Use user-provided SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('✅ Custom SMTP Transporter setup complete.');
  } else {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log('✅ Ethereal Email Test Transporter setup complete.');
    console.log(`Test account: ${testAccount.user}`);
  }
}

setupTransporter().catch(console.error);

app.post('/api/broadcast', async (req, res) => {
  const { employees, threat } = req.body;

  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ error: 'No employees provided.' });
  }

  if (!threat) {
    return res.status(400).json({ error: 'No threat details provided.' });
  }

  const emailAddresses = employees.map((emp) => emp.companyEmail || `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@example.com`).join(', ');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="background-color: ${threat.classification === 'ALERT' ? '#ef4444' : '#f59e0b'}; color: white; padding: 15px; border-radius: 6px 6px 0 0; text-align: center;">
        <h2 style="margin: 0; font-size: 24px;">🚨 ${threat.title || 'Security Alert'}</h2>
      </div>
      <div style="padding: 20px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
        <p style="font-size: 16px; margin: 0 0 10px;"><strong>Hazard Type:</strong> ${threat.hazard || 'Unknown'}</p>
        <p style="font-size: 16px; margin: 0 0 10px;"><strong>Region:</strong> ${threat.region || 'Unknown'}</p>
        <p style="font-size: 16px; margin: 0 0 10px;"><strong>Classification:</strong> ${threat.classification || 'ALERT'}</p>
      </div>
      <div style="padding: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Description & Reasoning</h3>
        <p style="color: #4b5563; line-height: 1.6;">${threat.reasoning || 'A potential hazard has been detected in your vicinity. Please remain vigilant.'}</p>
        
        <h3 style="color: #374151; margin-top: 20px;">Required Safety Action / Mitigation</h3>
        <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px;">
          <p style="color: #991b1b; margin: 0; font-weight: bold;">${threat.mitigation || threat.citizen_action || 'Follow local authorities guidelines and avoid the affected area.'}</p>
        </div>
      </div>
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>This is an automated safety broadcast from the Tactical Operations Center.</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"Tactical Ops Center" <no-reply@tactical-ops.com>',
      to: emailAddresses,
      subject: `[${threat.classification || 'ALERT'}] Safety Broadcast: ${threat.title}`,
      text: `Alert: ${threat.title}\nHazard: ${threat.hazard}\nRegion: ${threat.region}\n\nReasoning: ${threat.reasoning}\n\nSafety Action: ${threat.mitigation}`,
      html: htmlContent,
    });

    console.log('Message sent: %s', info.messageId);
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Preview URL: %s', previewUrl);
    }

    res.status(200).json({
      message: 'Broadcast dispatched successfully',
      messageId: info.messageId,
      previewUrl,
    });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({ error: 'Failed to send broadcast email' });
  }
});

// Export the Express API for Vercel
export default app;

// Only listen locally, Vercel will handle the requests via the export
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Broadcast API server running on port ${PORT}`);
  });
}
