# AgriTrade Secure Platform

## Environment Variables

### Required
- `DATABASE_URL` - SQLite database connection string
- `JWT_SECRET` - Secret key for JWT token signing

### Optional Features

#### Document OCR
- `ENABLE_DOCUMENT_OCR` - Set to `true` to enable OCR processing (default: false)

**AWS Textract** (Primary OCR Provider)
- `AWS_ACCESS_KEY_ID` - AWS Access Key ID
- `AWS_SECRET_ACCESS_KEY` - AWS Secret Access Key
- `AWS_REGION` - AWS Region (default: us-east-1)

**Google Document AI** (Fallback OCR Provider)
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON key
- `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud Project ID
- `GOOGLE_CLOUD_LOCATION` - Processing location (default: us)
- `GOOGLE_DOCUMENTAI_PROCESSOR_ID` - Document AI Processor ID

> **Note**: If no OCR credentials are configured, the system falls back to mock OCR for development.

#### AI Summarization
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o summaries

## Setup

1. Copy `.env.example` to `.env`
2. Configure required variables
3. (Optional) Add OCR provider credentials
4. Run database migrations: `npx prisma migrate dev`
5. Seed database: `npm run seed`
6. Start dev server: `npm run dev`

## OCR Provider Setup

### AWS Textract
1. Create IAM user with `AmazonTextractFullAccess` policy
2. Generate access keys
3. Add to `.env`:
   ```
   AWS_ACCESS_KEY_ID=your_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   ```

### Google Document AI
1. Enable Document AI API in Google Cloud Console
2. Create a Document Processor (Form Parser or Invoice Parser)
3. Create service account with Document AI User role
4. Download JSON key
5. Add to `.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_DOCUMENTAI_PROCESSOR_ID=your-processor-id
   ```

## Architecture

- **Next.js 16** - React framework
- **Prisma** - ORM with SQLite
- **OpenAI GPT-4o** - AI summarization
- **AWS Textract / Google Document AI** - OCR extraction

## Finance Request Workflow

### Features
- **Exporter Finance Request**: Exporters can request finance for their deals directly from the deal page.
- **Admin Review**: Admins can review, approve, decline, or request more info.
- **Partner Referral**: Admins can forward approved requests to partners via Email or API.
- **Referral Logs**: All actions are auditable.

### Setup
1. Run migrations: `npx prisma migrate dev`
2. Configure `.env`:
   ```
   # Optional: SendGrid for email referrals
   SENDGRID_API_KEY=SG.xxx
   
   # Optional: Partner API Keys (if using API forwarding)
   PARTNER_API_KEY_KRIYA=xxx
   PARTNER_SECRET=secret_for_webhook_verification
   ```

### Usage
- **Exporters**: Check the "Export Finance" section on any Trade Deal page.
- **Admins**: Visit `/admin/finance` to view and manage requests.

### Testing
- Run unit tests: `npm test` (or `npx vitest tests/finance.test.ts`)
- Mock Partner Webhook: POST to `/api/partners/webhook` with `{ "partner_ref_id": "REF-...", "status": "funded" }`
