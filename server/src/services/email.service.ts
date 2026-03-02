import nodemailer from "nodemailer";

/* ── Transporter (singleton) ────────────────────────────────────────── */

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
    },
    tls: {
        rejectUnauthorized: false, // ← ONLY for development
    },
});

/* ── Verify connection on startup ───────────────────────────────────── */

transporter.verify()
    .then(() => console.log("✅ SMTP connection verified"))
    .catch((err) => console.error("❌ SMTP connection failed:", err.message));

/* ── Types ──────────────────────────────────────────────────────────── */

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
}

interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

// send Email
export const sendEmail = async (options: SendEmailOptions): Promise<EmailResult> => {
    const { to, subject, text, html } = options;

    if (!to || !subject) {
        return { success: false, error: "Recipient and subject are required" };
    }

    if (!text && !html) {
        return { success: false, error: "Either text or html body is required" };
    }

    try {
        const info = await transporter.sendMail({
            from: `"TeamConnect" <${process.env.SMTP_USER}>`,
            to: Array.isArray(to) ? to.join(", ") : to,
            subject,
            text,
            html,
        });

        console.log(`📧 Email sent: ${info.messageId} → ${to}`);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error("📧 Email send failed:", error.message);
        return { success: false, error: error.message };
    }
};

// send Workspace Invite Email
export const sendWorkspaceInviteEmail = async (
    recipientEmail: string,
    workspaceName: string,
    invitedByName: string
): Promise<EmailResult> => {
    return sendEmail({
        to: recipientEmail,
        subject: `You've been invited to "${workspaceName}" on TeamConnect`,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b1220; color: #e2e8f0; border-radius: 12px;">
                <h2 style="color: #fff; margin: 0 0 16px;">You're invited!</h2>
                <p style="line-height: 1.6; margin: 0 0 8px;">
                    <strong style="color: #60a5fa;">${invitedByName}</strong> has invited you to join the workspace
                    <strong style="color: #fff;">${workspaceName}</strong> on TeamConnect.
                </p>
                <p style="color: #94a3b8; font-size: 14px; margin: 24px 0 0;">
                    Log in to TeamConnect to get started.
                </p>
            </div>
        `,
        text: `${invitedByName} has invited you to join the workspace "${workspaceName}" on TeamConnect. Log in to get started.`,
    });
};

// send Password Reset Email
export const sendPasswordResetEmail = async (
    recipientEmail: string,
    resetToken: string
): Promise<EmailResult> => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    return sendEmail({
        to: recipientEmail,
        subject: "Reset your TeamConnect password",
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b1220; color: #e2e8f0; border-radius: 12px;">
                <h2 style="color: #fff; margin: 0 0 16px;">Password Reset</h2>
                <p style="line-height: 1.6; margin: 0 0 16px;">
                    You requested a password reset. Click the link below to set a new password:
                </p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                    Reset Password
                </a>
                <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
                    This link expires in 1 hour. If you didn't request this, ignore this email.
                </p>
            </div>
        `,
        text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    });
};

export { transporter };