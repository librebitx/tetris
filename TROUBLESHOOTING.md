# 故障排除指南 (Troubleshooting)

如果游戏遇到问题，请通过查看日志进行诊断。

## 1. 查看日志 (Check Logs)

### 本地开发 (start_game.sh)
使用脚本启动时，日志会输出到项目目录：
- **后端日志**: `tetris-shared/server.log`
- **前端日志**: `tetris-vue/vue.log`

**实时查看命令**:
```bash
tail -f tetris-shared/server.log
# 或
tail -f tetris-vue/vue.log
```

### 生产环境 (PM2)
如果使用 PM2 管理进程：
```bash
pm2 logs tetris-backend
pm2 logs                # 查看所有日志
```

## 2. 常见问题 (Common Issues)

### A. 历史记录不保存 (History Not Saving)
如果游戏结束但看不到历史记录：
1. **检查权限**：确保后端进程有权写入 `tetris-shared/history.json`。
   ```bash
   ls -l tetris-shared/history.json
   # 确保文件所属用户与运行 Node.js 的用户一致
   ```
2. **Top Out (方块溢出)**：已修复 Bug，即使因方块堆满结束游戏也会记录。
3. **查看日志**：搜索 `[HISTORY]` 关键字查看写入是否成功。

### B. 聊天消息不显示或丢失
1. **历史同步**：新加入房间时，服务器会自动发送最近的 **50条** 消息。如果不显示，请刷新页面重试。
2. **滚动问题**：聊天窗口支持滚动，请尝试向上下滑动查看历史记录。

### C. 无法连接 WebSocket
如果浏览器控制台显示 `WebSocket connection failed`：
1. **Nginx 配置**：确保 Nginx 正确代理了 `/socket.io/` 路径，并且启用了 `Upgrade` 和 `Connection "upgrade"` 头。
   ```nginx
   location /socket.io/ {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
   }
   ```
2. **端口检查**：确保后端服务器正在运行且监听 3000 端口。
   ```bash
   netstat -tulnp | grep 3000
   ```

### D. 端口已被占用 (EADDRINUSE)
如果启动失败提示端口占用：
```bash
# 停止所有相关进程
./stop_game.sh

# 或者手动杀死进程
fuser -k 3000/tcp
fuser -k 5173/tcp
```
