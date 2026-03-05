For future deploys after code changes:

git pull
npm install
npm run build
pm2 restart dashboard-backend
systemctl reload nginx
