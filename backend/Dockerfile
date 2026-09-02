# Build stage
FROM golang:1.24-bookworm AS builder

WORKDIR /app

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build statically linked Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server ./cmd/server

# Production runtime stage with Chromium for Rod Scraper
FROM debian:bookworm-slim

WORKDIR /app

# Install Chromium and dependencies for Rod headless scraper
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Set Timezone to Asia/Jakarta
ENV TZ=Asia/Jakarta
ENV ROD_BIN=/usr/bin/chromium

# Copy binary from builder
COPY --from=builder /app/server /app/server

EXPOSE 8080

CMD ["/app/server"]
