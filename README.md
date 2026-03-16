For future deploys after code changes:

git pull
npm install
npm run build
pm2 restart dashboard-backend
pm2 restart dashboard-frontend
systemctl reload nginx

#  ssh root@161.129.64.66
#  password: 5ngG$FuD

