import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const TO = 'shanehnguyen@flipfixdigital.com';
const FROM = 'FlipFix Digital <onboarding@resend.dev>';

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { name, email, website, message, subject, botcheck } = req.body || {};

  if (botcheck) {
    return res.status(200).json({ success: true });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email' });
  }

  if (
    name.length > 200 ||
    email.length > 200 ||
    (website && website.length > 500) ||
    message.length > 5000
  ) {
    return res.status(400).json({ success: false, message: 'Field too long' });
  }

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#111">
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${website ? `<p><strong>Website:</strong> ${escapeHtml(website)}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `;

  const text =
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    (website ? `Website: ${website}\n` : '') +
    `\nMessage:\n${message}\n`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: subject || 'New contact form submission — FlipFix Digital',
      html,
      text,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ success: false, message: 'Failed to send' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send' });
  }
}
