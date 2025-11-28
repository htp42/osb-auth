# ======================
# Stage 1: Build PocketBase
# ======================
FROM golang:1.25.4-bookworm AS builder

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64

WORKDIR /app

# Copy PocketBase source
COPY . .

# Build the PocketBase executable
RUN go build -o pocketbase ./examples/base

# ======================
# Stage 2: Run PocketBase
# ======================
FROM debian:bookworm-slim

# Install minimal dependencies
RUN apt-get update && apt-get install -y ca-certificates curl bash && rm -rf /var/lib/apt/lists/*

WORKDIR /pb_app

# Copy built executable
COPY --from=builder /app/pocketbase .

# Create data directory
RUN mkdir -p /pb_app/pb_data

# Copy entrypoint script
COPY entrypoint.sh .

# Make scripts executable
RUN chmod +x ./pocketbase ./entrypoint.sh

# Expose default PocketBase port
EXPOSE 8090

# Use entrypoint
ENTRYPOINT ["./entrypoint.sh"]

