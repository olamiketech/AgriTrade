export const EMAIL_TEMPLATES = {
    PARTNER_REFERRAL: (partnerName: string, exporterName: string, dealId: string) => ({
        subject: `Finance referral: Exporter ${exporterName} — Deal ${dealId}`,
        body: `Hello ${partnerName},

We have a new finance request from ${exporterName} for Deal #${dealId}.

Please find the attached Trade Dossier and Finance Request details.

Best regards,
AgriTrade Secure Admin`,
    }),

    EXPORTER_SUBMISSION: (exporterName: string) => ({
        subject: `Finance Request Received`,
        body: `Hello ${exporterName},

We have received your finance request. Our team will review it shortly.
Expected timeline: 24-48 hours.

Best regards,
AgriTrade Secure`,
    }),

    EXPORTER_NEEDS_INFO: (exporterName: string, notes: string) => ({
        subject: `Action Required: Finance Request Information`,
        body: `Hello ${exporterName},

We reviewed your finance request and need additional information:

"${notes}"

Please log in to your dashboard to update your request.

Best regards,
AgriTrade Secure`,
    }),

    EXPORTER_REFERRED: (exporterName: string, partnerName: string) => ({
        subject: `Update: Finance Request Referred`,
        body: `Hello ${exporterName},

Good news! Your finance request has been referred to our partner, ${partnerName}.
They will be in touch shortly or we will update you here.

Best regards,
AgriTrade Secure`,
    }),
};
