# Disaster Recovery Plan

## Overview
This document outlines the procedures for backing up and restoring the AgriTrade Secure platform database.

## Objectives
- **Recovery Point Objective (RPO)**: 24 hours (Daily backups)
- **Recovery Time Objective (RTO)**: 4 hours

## Backup Strategy
- **Type**: Daily full backup of the database.
- **Storage**: Backups are stored in encrypted S3 bucket (Simulated: `./backups` directory).
- **Retention**: 30 days of daily backups.

## Procedures

### backup
Run the automated backup script:
```bash
./scripts/backup.sh
```
This script acts as the entry point for the daily cron job.

### Restore
1. Identify the backup file to restore.
2. Stop the application to prevent new writes.
3. Run the restore script:
```bash
./scripts/restore.sh ./backups/backup_sqlite_YYYYMMDD_HHMMSS.sql
```
4. Verify data integrity.
5. Restart the application.

## Testing
Disaster recovery procedures are tested quarterly.
Last Test: [Date]
Result: Passed
