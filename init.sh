#!bin/bash

sudo rm -rf /etc/apt/sources.list.d/nodesource.list
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v

cd ~/fortress-battle/fortress-vue
npm install
npm run build

cd ../fortress-shared
npm install
sudo npm install -g pm2
pm2 start server.js --name "fortress-backend"
cd ..

sudo apt install nginx
sudo mkdir -p /var/www/fortress
sudo cp -r /root/fortress/fortress-vue/dist/* /var/www/fortress/
sudo chown -R www-data:www-data /var/www/fortress
sudo chmod -R 755 /var/www/fortress

sudo ln -s /etc/nginx/sites-available/fortress /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

sudo cat <<EOL> /etc/nginx/sites-available/fortress
server {
    listen 80;
    server_name 您的公网IP或域名;

    location / {
        root /var/www/fortress;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOL

sudo nginx -t
sudo systemctl restart nginx
