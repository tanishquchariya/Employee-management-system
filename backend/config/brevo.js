// Sends OTP emails through Brevo's transactional API. Not used by the current
// screens (admins create employee logins directly); kept ready for OTP flows.
// If BREVO_API_KEY is missing or the request fails, the OTP is logged to the
// console instead so development is never blocked.

const APP_NAME = "EMS";

const buildHtml = ({ heading, intro, name, otp, footer }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0f2fe; border-radius: 16px; background-color: #ffffff;">
    <h1 style="color: #0369a1; margin: 0 0 20px; font-size: 28px; text-align: center;">${APP_NAME}</h1>
    <div style="padding: 20px; background-color: #f0f9ff; border-radius: 12px; margin-bottom: 20px;">
      <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">${heading}</h2>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hello ${name},</p>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">${intro}</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #0284c7; background-color: #ffffff; padding: 12px 30px; border: 2px solid #bae6fd; border-radius: 8px;">${otp}</span>
      </div>
      <p style="color: #ef4444; font-size: 14px; font-weight: 500;">This code is valid for 15 minutes.</p>
    </div>
    <p style="color: #64748b; font-size: 14px; text-align: center;">${footer}</p>
    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
`;

const sendEmail = async ({ email, name, subject, htmlContent, fallbackLabel, otp }) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error("BREVO_API_KEY is not set");

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: APP_NAME,
          email: process.env.BREVO_SENDER_EMAIL || "no-reply@example.com",
        },
        to: [{ email, name }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      throw new Error(`Brevo responded with ${response.status}`);
    }
  } catch (error) {
    console.log(
      `\n--- [DEVELOPMENT FALLBACK ${fallbackLabel} LOG] (${error.message}) ---\nRecipient: ${email} (${name})\nOTP Code: ${otp}\n---------------------------------------\n`,
    );
  }
};

export const sendOtpEmail = (email, otp, name) =>
  sendEmail({
    email,
    name,
    otp,
    fallbackLabel: "OTP",
    subject: `Verify your ${APP_NAME} account`,
    htmlContent: buildHtml({
      heading: "Verify Your Email Address",
      intro: "To complete your sign-up, please use the 6-digit verification code below:",
      name,
      otp,
      footer: "If you didn't request this email, please ignore it.",
    }),
  });

export const sendResetOtpEmail = (email, otp, name) =>
  sendEmail({
    email,
    name,
    otp,
    fallbackLabel: "RESET OTP",
    subject: `Reset your ${APP_NAME} password`,
    htmlContent: buildHtml({
      heading: "Reset Your Password",
      intro: "We received a request to reset your password. Use the 6-digit verification code below:",
      name,
      otp,
      footer: "If you didn't request a password reset, please ignore this email.",
    }),
  });
