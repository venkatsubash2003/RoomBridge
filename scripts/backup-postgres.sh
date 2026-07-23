#!/bin/sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
backup_dir="${BACKUP_DIRECTORY:-./backups}"
mkdir -p "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive="$backup_dir/roombridge-$timestamp.dump"
pg_dump --dbname="$DATABASE_URL" --format=custom --compress=9 --no-owner --file="$archive"
sha256sum "$archive" > "$archive.sha256"
if [ -n "${BACKUP_UPLOAD_URI:-}" ]; then
  aws s3 cp "$archive" "$BACKUP_UPLOAD_URI/" --sse AES256
  aws s3 cp "$archive.sha256" "$BACKUP_UPLOAD_URI/" --sse AES256
fi
echo "$archive"
