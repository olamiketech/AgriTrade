#!/bin/bash

# Backup Script
# Usage: ./scripts/backup.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Check environment (Mock check, normally check NODE_ENV or DB URL)
if [ -f "dev.db" ]; then
    echo "Backing up SQLite dev.db..."
    sqlite3 dev.db ".dump" > "$BACKUP_DIR/backup_sqlite_$TIMESTAMP.sql"
    echo "Backup created at $BACKUP_DIR/backup_sqlite_$TIMESTAMP.sql"
else
    echo "dev.db not found. Assuming Postgres..."
    # Postgres command (commented out as we don't have pg env here)
    # pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_pg_$TIMESTAMP.sql"
    echo "Postgres backup command would run here."
fi

# Retention Policy: Delete backups older than 30 days
find $BACKUP_DIR -type f -name "*.sql" -mtime +30 -delete
