
import 'dotenv/config';
import { sendEmail } from '@/lib/email/service';

async function main() {
    console.log('Testing Email Service...');

    // Replace with a valid email for testing or use a dummy one if just checking API connection
    // In production verification, we'd ask the user for an email.
    // For now, we'll try to send to the onboarding address or a safe sink, 
    // but Resend might restrict sending to verified domains/emails in test mode.
    // Usually 'onboarding@resend.dev' allows sending TO the registered email.

    // We'll try sending to a generic test email, if it fails due to "only to verified email", that confirms the connection works at least.
    const testEmail = 'olamike077@gmail.com'; // Using the email from the user's prompt example

    const success = await sendEmail(testEmail, {
        subject: 'AgriTrade Verification',
        body: 'This is a test email to verify the Resend integration.'
    });

    if (success) {
        console.log('✅ Email sent successfully!');
    } else {
        console.error('❌ Email failed to send.');
        process.exit(1);
    }
}

main();
