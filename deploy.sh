#!/bin/bash

# Task Manager Frontend Deployment Script
# Deploys React app to AWS S3 + CloudFront

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Task Manager Frontend Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check for required tools
echo "Checking prerequisites..."
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# ==========================================
# DEFAULT CONFIGURATION
# Edit these values to avoid typing them each time
# ==========================================
DEFAULT_BUCKET_NAME="task-manager-frontend-871268126"
DEFAULT_AWS_REGION="us-east-1"
CUSTOM_DOMAIN_URL="https://taskmanager-jkirk-547563.com/login"

# Get bucket name (use env var, default, or prompt)
if [ ! -z "$BUCKET_NAME" ]; then
    # Already set via environment variable
    echo "Using bucket name from environment: $BUCKET_NAME"
elif [ ! -z "$DEFAULT_BUCKET_NAME" ]; then
    # Use default value
    read -p "Enter S3 bucket name [$DEFAULT_BUCKET_NAME]: " INPUT_BUCKET
    if [ -z "$INPUT_BUCKET" ]; then
        BUCKET_NAME="$DEFAULT_BUCKET_NAME"
    else
        BUCKET_NAME="$INPUT_BUCKET"
    fi
else
    # Prompt for value
    read -p "Enter S3 bucket name (e.g., task-manager-frontend): " BUCKET_NAME
fi

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${RED}Error: Bucket name cannot be empty${NC}"
    exit 1
fi

# Get AWS region (use env var, default, or prompt)
if [ ! -z "$AWS_REGION" ]; then
    # Already set via environment variable
    echo "Using AWS region from environment: $AWS_REGION"
elif [ ! -z "$DEFAULT_AWS_REGION" ]; then
    # Use default value
    read -p "Enter AWS region [$DEFAULT_AWS_REGION]: " INPUT_REGION
    if [ -z "$INPUT_REGION" ]; then
        AWS_REGION="$DEFAULT_AWS_REGION"
    else
        AWS_REGION="$INPUT_REGION"
    fi
else
    # Prompt for value
    read -p "Enter AWS region: " AWS_REGION
fi

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Bucket: $BUCKET_NAME"
echo "  Region: $AWS_REGION"
echo ""

read -p "Continue with deployment? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Step 1: Build the application
echo ""
echo -e "${YELLOW}Step 1: Building application...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed - dist/ directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed${NC}"

# Step 2: Create S3 bucket
echo ""
echo -e "${YELLOW}Step 2: Setting up S3 bucket...${NC}"

# Check if bucket exists
if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Creating bucket: $BUCKET_NAME"
    aws s3 mb "s3://$BUCKET_NAME" --region "$AWS_REGION"
    echo -e "${GREEN}✓ Bucket created${NC}"
else
    echo -e "${YELLOW}Bucket already exists${NC}"
fi

# Step 3: Configure bucket for static website hosting
echo ""
echo -e "${YELLOW}Step 3: Configuring static website hosting...${NC}"
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html

echo -e "${GREEN}✓ Static website hosting enabled${NC}"

# Step 4: Disable Block Public Access (required for public website)
echo ""
echo -e "${YELLOW}Step 4: Configuring public access...${NC}"
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo -e "${GREEN}✓ Public access configured${NC}"

# Step 5: Update and apply bucket policy
echo ""
echo -e "${YELLOW}Step 5: Applying bucket policy...${NC}"

# Create temporary bucket policy with correct bucket name
POLICY_FILE="aws/bucket-policy.json"
TEMP_POLICY_FILE="aws/bucket-policy-temp.json"

if [ ! -f "$POLICY_FILE" ]; then
    echo -e "${RED}Error: Bucket policy file not found at $POLICY_FILE${NC}"
    exit 1
fi

# Replace BUCKET_NAME placeholder with actual bucket name
sed "s/BUCKET_NAME/$BUCKET_NAME/g" "$POLICY_FILE" > "$TEMP_POLICY_FILE"

aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy "file://$TEMP_POLICY_FILE"

# Clean up temp file
rm "$TEMP_POLICY_FILE"

echo -e "${GREEN}✓ Bucket policy applied${NC}"

# Step 6: Upload files to S3
echo ""
echo -e "${YELLOW}Step 6: Uploading files to S3...${NC}"
aws s3 sync dist/ "s3://$BUCKET_NAME" \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html"

# Upload index.html with no-cache to ensure fresh app shell
aws s3 cp dist/index.html "s3://$BUCKET_NAME/index.html" \
    --cache-control "no-cache, no-store, must-revalidate"

echo -e "${GREEN}✓ Files uploaded${NC}"

# Get S3 website URL
S3_WEBSITE_URL="http://$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
if [ ! -z "$CUSTOM_DOMAIN_URL" ]; then
    echo -e "${GREEN}✓ Your app is live at: ${YELLOW}$CUSTOM_DOMAIN_URL${NC}"
    echo ""
fi
echo -e "S3 Website URL: ${YELLOW}$S3_WEBSITE_URL${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test your app at: $S3_WEBSITE_URL"
echo ""
echo "2. (Recommended) Set up CloudFront for HTTPS and better performance:"
echo "   Run: ./setup-cloudfront.sh $BUCKET_NAME $AWS_REGION"
echo "   Or follow instructions in aws/CLOUDFRONT.md"
echo ""
echo -e "${YELLOW}Important: CORS Configuration${NC}"
echo "Make sure your backend ALB allows requests from:"
echo "  - $S3_WEBSITE_URL (for testing)"
echo "  - Your CloudFront domain (after CloudFront setup)"
echo ""
echo "Your backend should have these CORS headers:"
echo "  Access-Control-Allow-Origin: <your-frontend-domain>"
echo "  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"
echo "  Access-Control-Allow-Headers: Content-Type, Authorization"
echo "  Access-Control-Allow-Credentials: true"
echo ""