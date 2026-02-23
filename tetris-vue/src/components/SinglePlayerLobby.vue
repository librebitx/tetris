<template>
  <div class="lobby-container">
    <h1>单人模式</h1>

    <div class="lobby-card">
      <div class="lobby-header">
        <button class="back-btn" @click="$emit('back')">← 返回</button>
        <h3 class="room-title">游戏准备</h3>
      </div>

      <div class="rules-section">
        <h3>游戏规则</h3>
        <ul class="rules-list">
          <li>控制方块由刷新区边线随机向四个方向前进。</li>
          <li>限时赛：5分钟倒计时结束，挑战最高分！</li>
          <li>若方块堵塞刷新区，游戏提前结束。</li>
          <li>方块落在棋盘边缘得5分。</li>
          <li>填满背景中的8、10、12、16格矩形区域，额外获得10、15、20、30分。</li>
        </ul>
      </div>

      <div class="action-section">
        <button class="primary-btn" @click="handleStart">开始游戏</button>
        <button class="secondary-btn" @click="openLeaderboard">排行榜</button>
      </div>
    </div>

    <!-- Leaderboard Modal -->
    <div v-if="showLeaderboard" class="modal-overlay">
      <div class="leaderboard-card">
        <div class="modal-header">
          <h3>单人模式 Top 10</h3>
          <button class="close-btn" @click="showLeaderboard = false">×</button>
        </div>
        
        <div class="leaderboard-list">
            <div v-if="leaderboard.length === 0" class="no-data">暂无记录</div>
            <div v-else class="lb-row" v-for="(entry, idx) in leaderboard" :key="idx">
                <div class="lb-info">
                  <span class="lb-rank" :class="'rank-' + (idx + 1)">#{{ idx + 1 }}</span>
                  <span class="lb-name">{{ entry.name }}</span>
                  <span class="lb-score">{{ entry.score }}</span>
                </div>
                <!-- Only show view button if the board was saved with this entry -->
                <button v-if="entry.board" class="view-btn" @click="viewBoard(entry)">棋盘</button>
            </div>
        </div>
      </div>
    </div>

    <!-- View Board Modal -->
    <div v-if="showBoardModal" class="modal-overlay" style="z-index: 2000;">
      <div class="leaderboard-card board-view-card">
        <div class="modal-header">
          <h3>高分重现</h3>
          <button class="close-btn" @click="showBoardModal = false">×</button>
        </div>
        <div class="canvas-wrapper">
          <canvas ref="boardCanvas" width="300" height="300"></canvas>
        </div>
        <div style="margin-top: 10px; color: #888; font-size: 0.85em;">此画面为您在该局结束时的最终棋盘。</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue';
import { useSocket } from '../composables/useSocket';

const emit = defineEmits(['back']);
const { joinSinglePlayer, startGame, getLeaderboard, leaderboard } = useSocket();

const showLeaderboard = ref(false);
const showBoardModal = ref(false);
const boardCanvas = ref(null);

onMounted(() => {
  joinSinglePlayer();
  getLeaderboard();
});

const openLeaderboard = () => {
    getLeaderboard();
    showLeaderboard.value = true;
};

const handleStart = () => {
  // 5 minutes = 300 seconds
  startGame({ mode: 'time', value: 300, speed: 1 });
};

const viewBoard = (entry) => {
    showBoardModal.value = true;
    nextTick(() => {
        const canvas = boardCanvas.value;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cols = entry.boardSize || 30;
        const rows = entry.boardSize || 30;
        const BLOCK_SIZE = canvas.width / cols;

        ctx.fillStyle = '#08080e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (entry.bgRects) {
            const colorMap = {
                8: 'rgba(46, 125, 50, 0.2)',
                10: 'rgba(245, 127, 23, 0.2)',
                12: 'rgba(106, 27, 154, 0.2)',
                16: 'rgba(0, 105, 92, 0.2)'
            };
            const defaultColor = 'rgba(55, 71, 79, 0.2)';

            entry.bgRects.forEach(rect => {
                const area = rect.w * rect.h;
                const color = colorMap[area] || defaultColor;
                ctx.fillStyle = color;
                ctx.fillRect(rect.x * BLOCK_SIZE, rect.y * BLOCK_SIZE, rect.w * BLOCK_SIZE, rect.h * BLOCK_SIZE);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(rect.x * BLOCK_SIZE, rect.y * BLOCK_SIZE, rect.w * BLOCK_SIZE, rect.h * BLOCK_SIZE);
            });
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let c = 0; c <= cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * BLOCK_SIZE, 0);
            ctx.lineTo(c * BLOCK_SIZE, canvas.height);
            ctx.stroke();
        }
        for (let r = 0; r <= rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * BLOCK_SIZE);
            ctx.lineTo(canvas.width, r * BLOCK_SIZE);
            ctx.stroke();
        }

        const zoneStart = Math.floor(cols / 2) - 2;
        ctx.fillStyle = '#000000';
        ctx.fillRect(zoneStart * BLOCK_SIZE, zoneStart * BLOCK_SIZE, 4 * BLOCK_SIZE, 4 * BLOCK_SIZE);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = Math.max(1, BLOCK_SIZE / 4);
        ctx.strokeRect(zoneStart * BLOCK_SIZE, zoneStart * BLOCK_SIZE, 4 * BLOCK_SIZE, 4 * BLOCK_SIZE);

        const draw8BitBlock = (x, y, isRed) => {
            const baseColor = isRed ? '#e52521' : '#0047bb';
            const lightColor = isRed ? '#ff5956' : '#4f7df5';
            const darkColor = isRed ? '#820000' : '#001f5c';
            const borderSize = Math.max(1, BLOCK_SIZE / 4);

            ctx.fillStyle = baseColor;
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            ctx.fillStyle = lightColor;
            ctx.fillRect(x, y, BLOCK_SIZE, borderSize);
            ctx.fillRect(x, y, borderSize, BLOCK_SIZE);
            ctx.fillStyle = darkColor;
            ctx.fillRect(x, y + BLOCK_SIZE - borderSize, BLOCK_SIZE, borderSize);
            ctx.fillRect(x + BLOCK_SIZE - borderSize, y, borderSize, BLOCK_SIZE);
        };

        if (entry.board) {
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const val = entry.board[r][c];
                    if (val) draw8BitBlock(c * BLOCK_SIZE, r * BLOCK_SIZE, val === 1);
                }
            }
        }
    });
};
</script>

<style scoped>
.lobby-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  min-height: 100svh;
  color: #ececec;
  background-color: #050505;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 30px 30px;
  padding: 16px 12px 40px;
  box-sizing: border-box;
  overflow-y: auto;
  justify-content: center;
  position: relative;
}
.lobby-container::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.8) 100%);
  pointer-events: none;
  z-index: 0;
}
.lobby-card, h1 {
  position: relative;
  z-index: 1;
}

h1 {
  color: #ececec;
  margin-bottom: 24px;
  font-size: 1.5rem;
  font-weight: 700;
}

.lobby-card {
  background: #111;
  border: 6px solid #444;
  padding: 24px;
  border-radius: 0;
  text-align: center;
  width: 90%;
  max-width: 420px;
  box-sizing: border-box;
  box-shadow: 
    inset 4px 4px 0 #000,
    inset -4px -4px 0 #222,
    8px 8px 0 #000;
  position: relative;
}
.lobby-card::after {
  content: '';
  position: absolute;
  top: 4px; left: 4px; right: 4px; bottom: 4px;
  border: 2px dashed #333;
  pointer-events: none;
}

.lobby-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 24px;
}

.back-btn {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: #222;
  border: 4px solid #555;
  color: #fff;
  font-size: 0.85em;
  padding: 6px 12px;
  font-family: inherit;
  cursor: pointer;
  z-index: 100;
  box-shadow: 4px 4px 0 #000;
  transition: all 0.1s;
  border-radius: 0;
  text-transform: uppercase;
}

.back-btn:hover {
  background: #555;
  border-color: #00ffff;
  color: #00ffff;
}

.back-btn:active {
  transform: translateY(calc(-50% + 2px)) translateX(2px);
  box-shadow: 2px 2px 0 #000;
}

.room-title {
  font-weight: 600;
  font-size: 1.2em;
  color: #ececec;
  margin: 0;
}

.rules-section {
  text-align: left;
  margin-bottom: 32px;
  padding: 16px;
  background: #252525;
  border-radius: 0;
  border: 4px solid #333;
}

.rules-section h3 {
  font-size: 1.1em;
  margin: 0 0 12px;
  color: #00ffff;
}

.rules-list {
  padding-left: 1.2rem;
  margin: 0;
  color: #d1d1d1;
  font-size: 0.95em;
  line-height: 1.6;
}

.rules-list li {
  margin-bottom: 8px;
}

.rules-list b {
  color: #00ffff;
}

.primary-btn {
  width: 100%;
  padding: 14px;
  font-size: 1.2em;
  background: #0088cc;
  border: 4px solid #fff;
  font-family: inherit;
  font-weight: 600;
  color: white;
  border-radius: 0;
  cursor: pointer;
  box-shadow: 4px 4px 0 #00ffff;
  transition: all 0.1s;
  text-transform: uppercase;
}

.primary-btn:hover {
  background: #fff;
  color: #000;
  border-color: #00ffff;
}

.primary-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #00ffff;
}

.secondary-btn {
  width: 100%;
  padding: 10px;
  font-size: 1.1em;
  background: #222;
  color: #fff;
  border: 4px solid #888;
  box-shadow: 4px 4px 0 #000;
  text-transform: uppercase;
  font-family: inherit;
  cursor: pointer;
  border-radius: 0;
  margin-top: 12px;
  transition: all 0.1s;
}
.secondary-btn:hover {
  background: #888;
  color: #000;
  border-color: #fff;
}
.secondary-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #000;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.leaderboard-card {
  background: #111;
  border: 6px solid #444;
  padding: 24px;
  width: 90%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 
    inset 4px 4px 0 #000,
    inset -4px -4px 0 #222,
    8px 8px 0 #000;
  position: relative;
}
.leaderboard-card::after {
  content: '';
  position: absolute;
  top: 4px; left: 4px; right: 4px; bottom: 4px;
  border: 2px dashed #333;
  pointer-events: none;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
}

.modal-header h3 {
  margin: 0;
  color: #00ffff;
  font-size: 1.2em;
  text-shadow: 2px 2px 0 #000;
}

.close-btn {
  background: #d32f2f;
  color: white;
  border: 2px solid #ff0000;
  font-size: 1.5em;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 2px 2px 0 #000;
  border-radius: 0;
}
.close-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 #000;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 2;
}

.board-view-card {
  text-align: center;
  max-width: 360px;
}
.canvas-wrapper {
  background: #000;
  border: 4px solid #333;
  padding: 4px;
  display: inline-block;
  box-shadow: 4px 4px 0 #000;
}
.canvas-wrapper canvas {
  display: block;
}

.no-data {
  text-align: center;
  color: #777;
  padding: 20px 0;
}

.lb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #000;
  border: 2px solid #333;
  padding: 8px 12px;
  font-size: 0.9em;
  color: #ccc;
  text-transform: uppercase;
  gap: 8px;
}
.lb-info {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 8px;
  overflow: hidden;
}
.lb-rank {
  font-weight: bold;
  width: 40px;
  color: #888;
}
.rank-1 { color: #ffd700; text-shadow: 1px 1px 0 #aa8800; }
.rank-2 { color: #c0c0c0; text-shadow: 1px 1px 0 #888888; }
.rank-3 { color: #cd7f32; text-shadow: 1px 1px 0 #885522; }

.lb-name {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
}

.lb-score {
  color: #00ffff;
  font-weight: bold;
}

.view-btn {
  background: #0088cc;
  color: white;
  border: 2px solid #fff;
  border-radius: 0;
  padding: 4px 8px;
  font-size: 0.8em;
  cursor: pointer;
  box-shadow: 2px 2px 0 #00ffff;
  font-family: inherit;
  transition: all 0.1s;
}
.view-btn:hover { background: #00ffff; color: #000; border-color: #0088cc; }
.view-btn:active { transform: translate(2px, 2px); box-shadow: 0 0 0 #000; }

/* ===== Responsive Mobile ===== */
@media (max-width: 480px) {
  .lobby-container { padding: 12px 8px 32px; }
  h1 { font-size: 0.85em; margin-bottom: 14px; }
  .lobby-card { padding: 10px; border-width: 4px; }
  .primary-btn, .secondary-btn { font-size: 0.8em; padding: 10px; }
  .rules-list { font-size: 0.7em; line-height: 1.5; }
  .leaderboard-card { padding: 12px; }
  .lb-row { font-size: 0.7em; padding: 6px 8px; }
}
</style>
