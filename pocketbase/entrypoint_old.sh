#!/bin/bash
set -e

# Initialize superuser only if not already created
if [ ! -f /pb_app/pb_data/.superuser_created ]; then
    echo "Creating superuser..."
    ./pocketbase superuser upsert admin@example.com secret123
    touch /pb_app/pb_data/.superuser_created
fi

# Start PocketBase server
exec ./pocketbase serve --http=0.0.0.0:8090

