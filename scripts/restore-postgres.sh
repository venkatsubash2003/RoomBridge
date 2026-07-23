#!/bin/sh
set -eu
: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required and must target the intended restore database}"
archive="${1:?Usage: restore-postgres.sh path/to/backup.dump}"
test -f "$archive"
test -f "$archive.sha256"
sha256sum -c "$archive.sha256"
pg_restore --dbname="$RESTORE_DATABASE_URL" --clean --if-exists --no-owner --exit-on-error "$archive"
echo "Restore completed and must now pass application smoke tests."
