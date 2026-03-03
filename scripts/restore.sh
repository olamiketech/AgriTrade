#!/bin/bash

# Restore Script
# Usage: ./scripts/restore.sh <backup_file>

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore.sh <backup_file>"
    exit 1
fi

BACKUP_FILE=$1

if [ -f "dev.db" ]; then
    echo "Restoring SQLite dev.db from $BACKUP_FILE..."
    # Close connections effectively by just overwriting?
    # Better to delete and recreate from dump
    rm dev.db
    sqlite3 dev.db < $BACKUP_FILE
    echo "Restore complete."
else
    echo "Restoring Postgres..."
    # psql $DATABASE_URL < $BACKUP_FILE
    echo "Postgres restore command would run here."
fi
