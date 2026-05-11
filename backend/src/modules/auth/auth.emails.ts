import { Resend } from "resend";

import { env } from "../../config/env";

const resend = new Resend(env.RESEND_API_KEY);

export const sendLoginOtpEmail = async (email: string, code: string, ttlMinutes: number): Promise<void> => {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: [email],
    subject: "Your ZenPoll verification code",
    html: `
      <div style="margin:0;padding:0;background:#f7f3ef;font-family:'Segoe UI', Arial, sans-serif;color:#1f1f1f;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:32px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #eadfd7;">
                <tr>
                  <td style="padding:28px 32px 8px;">
                    <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b3261e;font-weight:700;">ZenPoll</div>
                    <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;color:#1f1f1f;">Verify your sign-in</h1>
                    <p style="margin:12px 0 0;font-size:14px;color:#5f5f5f;">Use this code to finish signing in. It expires in ${ttlMinutes} minutes.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 32px 8px;">
                    <div style="background:#faf7f4;border:1px dashed #e0d2c9;padding:18px;text-align:center;">
                      <div style="font-size:28px;font-weight:800;letter-spacing:6px;color:#b3261e;">${code}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 32px 28px;">
                    <p style="margin:0;font-size:12px;color:#8a7f78;">If you did not request this, you can safely ignore this email.</p>
                  </td>
                </tr>
              </table>
              <p style="margin:18px auto 0;max-width:560px;font-size:11px;color:#9a8f88;text-align:center;">
                ZenPoll • Secure sign-in
              </p>
            </td>
          </tr>
        </table>
      </div>
    `
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string,
  ttlMinutes: number
): Promise<void> => {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: [email],
    subject: "Reset your ZenPoll password",
    html: `
      <div style="margin:0;padding:0;background:#f7f3ef;font-family:'Segoe UI', Arial, sans-serif;color:#1f1f1f;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:32px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #eadfd7;">
                <tr>
                  <td style="padding:28px 32px 8px;">
                    <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b3261e;font-weight:700;">ZenPoll</div>
                    <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;color:#1f1f1f;">Reset your password</h1>
                    <p style="margin:12px 0 0;font-size:14px;color:#5f5f5f;">We received a request to reset your password. This link expires in ${ttlMinutes} minutes.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px 8px;">
                    <a href="${resetUrl}" style="display:inline-block;background:#b3261e;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:2px;">
                      Reset password
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 32px 24px;">
                    <p style="margin:0;font-size:12px;color:#8a7f78;">If you did not request this, you can safely ignore this email.</p>
                  </td>
                </tr>
              </table>
              <p style="margin:18px auto 0;max-width:560px;font-size:11px;color:#9a8f88;text-align:center;">
                ZenPoll • Secure account recovery
              </p>
            </td>
          </tr>
        </table>
      </div>
    `
  });
};
