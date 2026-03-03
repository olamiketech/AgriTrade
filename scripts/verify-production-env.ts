
import 'dotenv/config';

const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_API_URL',
    'MODULR_API_KEY',
    'MODULR_API_SECRET',
    'MODULR_WEBHOOK_SECRET',
    'EBURY_CLIENT_ID',
    'EBURY_CLIENT_SECRET',
];

function verifyEnv() {
    console.log('🔍 Verifying Production Environment Variables...');

    const missing = [];

    for (const key of requiredEnvVars) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        console.error('❌ Missing Required Environment Variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\nPlease set these variables in your Vercel Project Settings or .env file.');
        process.exit(1);
    }

    console.log('✅ All critical environment variables are set.');

    // Optional: Validate formats
    if (!process.env.DATABASE_URL?.startsWith('postgres')) {
        console.warn('⚠️  DATABASE_URL does not start with "postgres". Ensure you are using the correct connection string.');
    }

    console.log('🚀 Ready for Deployment!');
}

verifyEnv();
