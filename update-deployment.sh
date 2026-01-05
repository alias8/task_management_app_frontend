#!/bin/bash

# Quick Update Script
# Use this to update an existing deployment after code changes

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Updating Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get bucket name
read -p "Enter S3 bucket name: " BUCKET_NAME

if [ -z "$BUCKET_NAME" ]; then
    echo "Error: Bucket name required"
    exit 1
fi

# Optional: CloudFront distribution ID for cache invalidation
read -p "CloudFront Distribution ID (optional, press Enter to skip): " DISTRIBUTION_ID

echo ""
echo -e "${YELLOW}Step 1: Building application...${NC}"
npm run build

echo ""
echo -e "${YELLOW}Step 2: Uploading to S3...${NC}"
aws s3 sync dist/ "s3://$BUCKET_NAME" \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html"

aws s3 cp dist/index.html "s3://$BUCKET_NAME/index.html" \
    --cache-control "no-cache, no-store, must-revalidate"

echo -e "${GREEN}✓ Files uploaded${NC}"

# Invalidate CloudFront cache if distribution ID provided
if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo ""
    echo -e "${YELLOW}Step 3: Invalidating CloudFront cache...${NC}"
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)

    echo -e "${GREEN}✓ Invalidation created: $INVALIDATION_ID${NC}"
    echo "Cache will be cleared in 1-2 minutes"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Updated!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

if [ -z "$DISTRIBUTION_ID" ]; then
    S3_URL="http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
    echo "S3 Website URL: $S3_URL"
else
    echo "Changes will be live shortly after cache invalidation completes"
fi

echo ""