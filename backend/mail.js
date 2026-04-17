import nodemailer from 'nodemailer';

/**
 * SMTP is read from the backend process environment (e.g. backend/.env or root .env when running server).
 *
 * SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS — required to send mail
 * SMTP_FROM — optional From address (defaults to SMTP_USER)
 * SMTP_SECURE — set to "true" for TLS on port 465
 * APP_PUBLIC_URL — optional login page base (default http://localhost:5173)
 */

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function createMailer() {
  if (!isSmtpConfigured()) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * @param {{ to: string, fullName: string, tempPassword: string, loginUrl: string }} opts
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendNewUserWelcomeEmail({ to, fullName, tempPassword, loginUrl }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transporter = createMailer();
  if (!transporter) {
    return {
      sent: false,
      error: 'SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in the server environment.',
    };
  }

  const displayName = fullName?.trim() || 'there';
  const subject = 'Your account — sign in details';
  const text = [
    `Hello ${displayName},`,
    '',
    'An account has been created for you on the 66 Day Challenge dashboard.',
    '',
    `Sign-in ID (email): ${to}`,
    `Temporary password: ${tempPassword}`,
    '',
    'For security, you will be asked to choose a new password immediately after your first sign-in.',
    '',
    `Sign in here: ${loginUrl}`,
    '',
    'If you were not expecting this message, contact your program administrator.',
  ].join('\n');

  const html = `
    <p>Hello ${escapeHtml(displayName)},</p>
    <p>An account has been created for you on the <strong>66 Day Challenge</strong> dashboard.</p>
    <p><strong>Sign-in ID (email):</strong> ${escapeHtml(to)}<br/>
    <strong>Temporary password:</strong> ${escapeHtml(tempPassword)}</p>
    <p>For security, you will be asked to choose a new password immediately after your first sign-in.</p>
    <p><a href="${escapeHtml(loginUrl)}">Sign in</a></p>
    <p style="color:#666;font-size:12px;">If you were not expecting this message, contact your program administrator.</p>
  `;

  try {
    await transporter.sendMail({ from, to, subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error('[mail] welcome email failed:', err.message);
    return { sent: false, error: 'Could not send email. Check SMTP settings and server logs.' };
  }
}
