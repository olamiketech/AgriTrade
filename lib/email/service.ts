import { Resend } from 'resend';

// Initialize Resend with API Key from env
// If key is missing (e.g. build time), we can default to null and log a warning
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY is not set. Email sending will be disabled.');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendEmail(
    to: string,
    template: { subject: string; body: string },
    attachments?: Array<{ filename: string; content: string }>
) {
    if (!resend) {
        console.log(`[Email Mock] To: ${to}, Subject: ${template.subject}`);
        return false;
    }

    try {
        console.log(`[Email Service] Sending to ${to}...`);

        const { data, error } = await resend.emails.send({
            from: 'AgriTrade Secure <onboarding@resend.dev>', // Use registered domain in prod
            to: [to],
            subject: template.subject,
            html: template.body.replace(/\n/g, '<br>'), // Simple text-to-html conversion
            attachments: attachments?.map(att => ({
                filename: att.filename,
                content: Buffer.from(att.content).toString('base64'), // Resend expects buffer or base64
            }))
        });

        if (error) {
            console.error('[Email Service] Error:', error);
            return false;
        }

        console.log('[Email Service] Sent successfully:', data?.id);
        return true;

    } catch (err) {
        console.error('[Email Service] Exception:', err);
        return false;
    }
}
