For future deploys after code changes:

git pull
npm install
npm run build
pm2 restart dashboard-backend
pm2 restart dashboard-frontend
systemctl reload nginx