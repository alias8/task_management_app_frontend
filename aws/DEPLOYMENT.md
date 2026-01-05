# AWS Deployment Guide

This guide walks you through deploying the Task Manager frontend to AWS S3 + CloudFront.

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws configure
   ```
   You'll need:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., `us-east-1`)

2. **Node.js and npm installed**
   ```bash
   node --version
   npm --version
   ```

3. **Environment configured**
   - The `.env` file should have `VITE_API_BASE_URL` set to your backend URL
   - Currently configured: `http://task-manager-backend-alb-1405696018.us-east-1.elb.amazonaws.com`

## Quick Start

### Option A: Automated Deployment (Recommended)

Run the deployment script:

```bash
./deploy.sh
```

The script will:
1. Build your React app
2. Create/configure an S3 bucket
3. Enable static website hosting
4. Upload your build files
5. Provide your S3 website URL

Then, optionally set up CloudFront for HTTPS:

```bash
./setup-cloudfront.sh
```

### Option B: Manual Deployment

If you prefer to run commands manually, follow the steps below.

## Manual Deployment Steps

### Step 1: Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Step 2: Create S3 Bucket

```bash
# Replace 'your-bucket-name' with your desired bucket name
BUCKET_NAME="task-manager-frontend"
AWS_REGION="us-east-1"

aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION
```

### Step 3: Configure Static Website Hosting

```bash
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html
```

The error document is set to `index.html` to support React Router.

### Step 4: Apply Bucket Policy

```bash
# Update bucket policy with your bucket name
sed "s/BUCKET_NAME/$BUCKET_NAME/g" aws/bucket-policy.json > aws/bucket-policy-temp.json

# Apply the policy
aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file://aws/bucket-policy-temp.json

# Clean up
rm aws/bucket-policy-temp.json
```

### Step 5: Disable Block Public Access

```bash
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### Step 6: Upload Files

```bash
# Upload all files except index.html with long cache
aws s3 sync dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "no-cache, no-store, must-revalidate"
```

### Step 7: Get Your Website URL

```bash
echo "http://$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"
```

Visit this URL to test your deployment!

## CloudFront Setup (Recommended)

CloudFront provides:
- HTTPS support
- Global CDN for faster load times
- DDoS protection
- Custom domain support

### Automated Setup

```bash
./setup-cloudfront.sh your-bucket-name us-east-1
```

### Manual CloudFront Setup

1. Go to AWS Console → CloudFront → Create Distribution
2. Configure:
   - **Origin Domain**: Use the S3 website endpoint (not the bucket directly)
     - Example: `task-manager-frontend.s3-website-us-east-1.amazonaws.com`
   - **Origin Protocol**: HTTP only
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP Methods**: GET, HEAD
   - **Compress Objects**: Yes
   - **Default Root Object**: `index.html`

3. Add Custom Error Responses (for React Router):
   - **Error Code**: 403 → **Response**: `/index.html` with code **200**
   - **Error Code**: 404 → **Response**: `/index.html` with code **200**

4. Click "Create Distribution"
5. Wait 10-15 minutes for deployment
6. Access your app at the CloudFront domain (e.g., `https://d111111abcdef8.cloudfront.net`)

## CORS Configuration

Your backend must allow requests from your frontend domain.

### Update Backend CORS Headers

Your backend at `http://task-manager-backend-alb-1405696018.us-east-1.elb.amazonaws.com` needs these headers:

```
Access-Control-Allow-Origin: https://your-cloudfront-domain.cloudfront.net
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### Testing CORS

```bash
curl -H "Origin: https://your-cloudfront-domain.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -X OPTIONS \
  http://task-manager-backend-alb-1405696018.us-east-1.elb.amazonaws.com/api/tasks
```

Check that the response includes proper CORS headers.

## Updating Your Deployment

After making changes to your code:

```bash
# Build the new version
npm run build

# Upload to S3
aws s3 sync dist/ s3://$BUCKET_NAME --delete

# If using CloudFront, create an invalidation to clear the cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

Or simply run:
```bash
./deploy.sh
```

## Custom Domain (Optional)

To use a custom domain like `app.yourdomain.com`:

1. **Get an SSL Certificate** (in `us-east-1` region):
   - AWS Console → Certificate Manager → Request Certificate
   - Add your domain name
   - Validate via DNS or email

2. **Update CloudFront Distribution**:
   - Add your domain to "Alternate Domain Names (CNAMEs)"
   - Select your SSL certificate

3. **Update DNS**:
   - Add a CNAME record pointing to your CloudFront domain
   - Example: `app.yourdomain.com` → `d111111abcdef8.cloudfront.net`

## Troubleshooting

### Issue: "Access Denied" on S3

- Check bucket policy is applied correctly
- Verify public access is not blocked
- Ensure files are uploaded with correct permissions

### Issue: 404 on Page Refresh

- Verify CloudFront custom error responses are configured
- Ensure error document points to `/index.html` with 200 status

### Issue: CORS Errors

- Check browser console for specific CORS error
- Verify backend CORS headers include your frontend domain
- Test with curl command above

### Issue: Old Version Still Showing

- Clear CloudFront cache with invalidation
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check that index.html has `no-cache` header

## Cost Estimation

Approximate monthly costs for low-traffic app:

- **S3 Storage**: $0.023/GB (~$0.10 for typical React app)
- **S3 Requests**: $0.005 per 1,000 requests (~$0.50)
- **CloudFront**: First 1TB free tier, then ~$0.085/GB
- **Data Transfer**: Minimal for small apps

**Total**: Typically **$1-5/month** for development/small production apps

## Security Best Practices

1. **Use HTTPS**: Always use CloudFront (or similar) for HTTPS in production
2. **Environment Variables**: Never commit sensitive data to `.env`
3. **CORS**: Only allow specific origins in production, not `*`
4. **Headers**: Consider adding security headers via CloudFront Functions
5. **Access Keys**: Use IAM roles instead of access keys when possible

## Additional Resources

- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

## Support

If you encounter issues:

1. Check AWS CloudWatch logs
2. Review browser console for errors
3. Verify all configuration steps above
4. Test backend connectivity directly with curl

---

**Backend URL**: http://task-manager-backend-alb-1405696018.us-east-1.elb.amazonaws.com

Remember to update CORS configuration on the backend after deployment!