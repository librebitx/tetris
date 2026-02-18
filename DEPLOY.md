# 部署指南 (Deployment Guide)

本指南介绍如何在运行 **Debian 12** 的服务器上部署多人俄罗斯方块游戏。

## 📋 架构概览

- **前端**: Vue 3 + Vite (构建为静态文件，由 Nginx 托管)
- **后端**: Node.js + Socket.io (由 PM2 管理进程)
- **反向代理**: Nginx (处理 HTTP 请求和 WebSocket 转发)

## 1. 环境准备 (Prerequisites)

### 更新系统
```bash
sudo apt update && sudo apt upgrade -y
```

### 安装 Node.js (v20+)
推荐使用 NodeSource 安装最新 LTS 版本：
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential
```

### 安装 PM2 和 Nginx
```bash
sudo npm install -g pm2
sudo apt install -y nginx
```

## 2. 项目部署 (Deployment)

假设项目部署在 `/opt/tetris` 目录。

### 上传代码
将本地项目上传到服务器：
```bash
# 示例：创建目录并赋权
sudo mkdir -p /opt/tetris
sudo chown -R $USER:$USER /opt/tetris
# (通过 SCP 或 Git 将代码传输到 /opt/tetris)
```

### 后端安装与启动
```bash
cd /opt/tetris/tetris-shared

# 安装生产依赖
npm ci --omit=dev

# 启动服务
pm2 start server.js --name "tetris-backend"

# 保存进程列表并设置开机自启
pm2 save
pm2 startup
```

### 前端构建
```bash
cd /opt/tetris/tetris-vue

# 安装依赖
npm ci

# 构建生产版本
npm run build
# 构建完成后，生成的静态文件位于 dist/ 目录
```

## 3. 配置 Nginx (Configuration)

创建站点配置文件：
```bash
sudo nano /etc/nginx/sites-available/tetris
```

**配置内容** (替换 `your_domain_or_ip`):
```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    # 前端静态文件
    location / {
        root /opt/tetris/tetris-vue/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # 后端 API & WebSocket 代理
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点并重启 Nginx：
```bash
sudo ln -s /etc/nginx/sites-available/tetris /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 4. 验证与维护

- **访问**: 打开浏览器访问 `http://your_domain_or_ip`。
- **日志查看**:
  - 后端: `pm2 logs tetris-backend`
  - Nginx: `sudo tail -f /var/log/nginx/error.log`
- **更新代码**:
  1. 拉取新代码。
  2. 后端: `pm2 restart tetris-backend`。
  3. 前端: 重新运行 `npm run build`。
