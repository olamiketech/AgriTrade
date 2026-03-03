# AgriTrade Scripts

This directory contains utility scripts for development, testing, and deployment verification.

## Core Scripts

- **`verify-production-env.ts`**: Checks if all required environment variables are set for a production deployment. Run via `npm run verify:env`.
- **`demo-flow.ts`**: a comprehensive simulation of the entire deal lifecycle (Create -> Accept -> Pay -> Ship -> Release). Useful for integration testing.
- **`verify-webhook.ts`**: Simulates a Modulr webhook event to test the payment callback handler.
- **`seed-test-users.ts`**: Seeds the database with test users (Admin, Exporter, Buyer) for local development.

## Debugging Scripts

Files starting with `debug-` or `test-` (e.g., `debug-deal-fetch.ts`) are temporary scripts used during development to isolate specific logic. You can ignore or delete these if you strictly want a clean environment, but they may be useful for troubleshooting.
