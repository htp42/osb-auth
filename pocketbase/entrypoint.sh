#!/bin/bash
set -e

SUPERUSER_EMAIL=${SUPERUSER_EMAIL:-admin@example.com}
SUPERUSER_PASS=${SUPERUSER_PASS:-secret123}

# Create superuser only once
if [ ! -f /pb_app/pb_data/.superuser_created ]; then
    echo "Creating superuser with role and roles..."
    ./pocketbase superuser upsert "$SUPERUSER_EMAIL" "$SUPERUSER_PASS" \
        --set role=1 \
        --set 'roles=["Study.Read","Study.Write"]'
    touch /pb_app/pb_data/.superuser_created
fi

# Start PocketBase server
exec ./pocketbase serve --http=0.0.0.0:8090

