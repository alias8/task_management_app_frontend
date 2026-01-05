#!/bin/bash

# CloudFront Distribution Setup Script
# Creates a CloudFront distribution for the S3-hosted React app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}CloudFront Distribution Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Get parameters
BUCKET_NAME="$1"
AWS_REGION="${2:-us-east-1}"

if [ -z "$BUCKET_NAME" ]; then
    read -p "Enter S3 bucket name: " BUCKET_NAME
fi

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${RED}Error: Bucket name is required${NC}"
    exit 1
fi

S3_WEBSITE_ENDPOINT="$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Bucket: $BUCKET_NAME"
echo "  Region: $AWS_REGION"
echo "  Origin: $S3_WEBSITE_ENDPOINT"
echo ""

# Create CloudFront distribution config
DIST_CONFIG=$(cat <<EOF
{
  "CallerReference": "task-manager-$(date +%s)",
  "Comment": "Task Manager Frontend Distribution",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-Website-$BUCKET_NAME",
        "DomainName": "$S3_WEBSITE_ENDPOINT",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-Website-$BUCKET_NAME",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  }
}
EOF
)

echo -e "${YELLOW}Creating CloudFront distribution...${NC}"
echo "This may take 10-15 minutes to fully deploy."
echo ""

# Save config to temp file
TEMP_CONFIG="aws/cloudfront-config-temp.json"
echo "$DIST_CONFIG" > "$TEMP_CONFIG"

# Create distribution
DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution \
    --distribution-config "file://$TEMP_CONFIG" \
    --output json)

# Extract distribution ID and domain
DISTRIBUTION_ID=$(echo "$DISTRIBUTION_OUTPUT" | grep -o '"Id": "[^"]*"' | head -1 | cut -d'"' -f4)
DISTRIBUTION_DOMAIN=$(echo "$DISTRIBUTION_OUTPUT" | grep -o '"DomainName": "[^"]*"' | head -1 | cut -d'"' -f4)

# Clean up temp file
rm "$TEMP_CONFIG"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}CloudFront Distribution Created!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Distribution ID: ${YELLOW}$DISTRIBUTION_ID${NC}"
echo -e "Domain: ${YELLOW}https://$DISTRIBUTION_DOMAIN${NC}"
echo ""
echo -e "${YELLOW}Status:${NC} Deploying (this takes 10-15 minutes)"
echo ""
echo "Check deployment status:"
echo "  aws cloudfront get-distribution --id $DISTRIBUTION_ID"
echo ""
echo -e "${YELLOW}Important: Update CORS on your backend${NC}"
echo "Your backend must allow requests from:"
echo "  https://$DISTRIBUTION_DOMAIN"
echo ""
echo "Save this information:"
echo "  - Distribution ID: $DISTRIBUTION_ID"
echo "  - CloudFront URL: https://$DISTRIBUTION_DOMAIN"
echo ""