# Deployment Guide for GoDaddy Hosting

## Prerequisites
- GoDaddy hosting account with Node.js support
- Domain: calculusdetection.com
- SSH access to your hosting account

## Step 1: Upload Files
1. Upload all project files to your GoDaddy hosting directory
2. Maintain the folder structure as shown in the README

## Step 2: Install Dependencies
```bash
npm install --production
```

## Step 3: Environment Configuration
Create a `.env` file with:
```
PORT=3000
NODE_ENV=production
```

## Step 4: Add Sample Images
1. Place your 20 sample images in `/public/sample-images/`
2. Name them `sample-1.jpg` through `sample-20.jpg`
3. Ensure they are accessible via the web

## Step 5: Configure Subdomains
In your GoDaddy control panel:
1. Set up subdomain routing:
   - `detect.calculusdetection.com` → `/detect`
   - `test.calculusdetection.com` → `/test`
   - `annotate.calculusdetection.com` → `/annotate`

## Step 6: Start the Application
```bash
npm start
```

## Step 7: Process Management (Recommended)
Install PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name "calculus-detection"
pm2 save
pm2 startup
```

## Step 8: Set up SSL (Optional but Recommended)
1. Enable SSL in your GoDaddy control panel
2. Update any hardcoded HTTP URLs to HTTPS

## Troubleshooting
- Check server logs: `pm2 logs`
- Restart server: `pm2 restart calculus-detection`
- Check file permissions: Ensure uploads directory is writable
- Verify Node.js version compatibility

## Security Considerations
- Set up proper file permissions
- Configure firewall rules
- Regular security updates
- Monitor server logs

## Maintenance
- Regular backups of annotation data
- Monitor disk space (uploads folder)
- Keep Node.js and dependencies updated
