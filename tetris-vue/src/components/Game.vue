<template>
  <div class="game-container">

    <!-- ===== FULL-SCREEN GAME OVER OVERLAY ===== -->
    <div v-if="gameState.config?.winner && !isReviewing" class="overlay">
      <div class="overlay-card">
        <!-- Single Player Result -->
        <div v-if="isSolo" class="result-card solo-result">
          <div class="h-top">
            <span class="h-winner-tag t-red">挑战结束</span>
          </div>
          <div class="solo-score-row">
            <span class="solo-label">最终得分</span>
            <span class="solo-value">{{ gameState.stats.redScore }}</span>
          </div>
        </div>

        <!-- Multiplayer Result -->
        <div v-else class="result-card">
            <div class="h-top">
                <span class="h-mode-tag">{{ gameState.config.mode === 'time' ? '限时' : '积分' }}</span>
                <span class="h-winner-tag" :class="gameState.config.winner === 'Red' ? 't-red' : (gameState.config.winner === 'Blue' ? 't-blue' : 't-draw')">
                    {{ gameState.config.winner === 'Red' ? '红方获胜' : (gameState.config.winner === 'Blue' ? '蓝方获胜' : '平局') }}
                </span>
            </div>
            <div class="h-main-row">
                 <!-- Red Side -->
                 <div class="h-player-side side-left" :class="{ 'is-win': gameState.config.winner === 'Red' }">
                     <div class="h-info-group">
                         <div class="h-dot-row">
                             <span class="h-dot red"></span>
                             <span v-if="gameState.config.surrender?.by === 'Red'" class="surrender-mini-tag">
                                 {{ gameState.config.surrender.type === 'disconnect' ? '逃跑' : '认输' }}
                             </span>
                         </div>
                         <span class="h-name">{{ getPlayerName('red') }}</span>
                     </div>
                     <span class="h-score-num">{{ gameState.stats.redScore }}</span>
                 </div>
                 
                 <div class="h-vs">VS</div>
                 
                 <!-- Blue Side -->
                 <div class="h-player-side side-right" :class="{ 'is-win': gameState.config.winner === 'Blue' }">
                     <span class="h-score-num">{{ gameState.stats.blueScore }}</span>
                     <div class="h-info-group">
                         <div class="h-dot-row">
                             <span v-if="gameState.config.surrender?.by === 'Blue'" class="surrender-mini-tag surrender-left">
                                 {{ gameState.config.surrender.type === 'disconnect' ? '逃跑' : '认输' }}
                             </span>
                             <span class="h-dot blue"></span>
                         </div>
                         <span class="h-name">{{ getPlayerName('blue') }}</span>
                     </div>
                 </div>
            </div>
        </div>
        
        <!-- Restart Status (Multiplayer only) -->
        <div v-if="!isSolo" class="restart-status-row">
           <div class="status-pill red" :class="{ ready: isRedReady }">
               <span class="dot"></span> {{ isRedReady ? '红方就绪' : '红方等待' }}
           </div>
           <div class="status-pill blue" :class="{ ready: isBlueReady }">
               <span class="dot"></span> {{ isBlueReady ? '蓝方就绪' : '蓝方等待' }}
           </div>
        </div>

        <!-- Action Buttons -->
        <div class="restart-actions">
          <button v-if="isSolo" class="restart-btn" @click="handleRestartClick">再来一局</button>
          <button v-else-if="isHost" class="restart-btn" @click="handleRestartClick" :disabled="amIReady" :class="{ disabled: amIReady, 'pulse-cyan': isBlueReady && !amIReady }">
              {{ amIReady ? '已就绪 - 等待蓝方' : (isBlueReady ? '蓝方已就绪 - 再来一局' : '再来一局') }}
          </button>
          <button v-else class="restart-btn" @click="handleRestartClick" :disabled="amIReady" :class="{ disabled: amIReady, 'pulse-cyan': isRedReady && !amIReady }">
               {{ amIReady ? '已就绪 - 等待红方' : (isRedReady ? '红方已就绪 - 再来一局' : '再来一局') }}
          </button>

          <!-- Review button (all modes) -->
          <button class="secondary-btn" style="width: 100%; margin-top: 10px;" @click="toggleReview">对局复盘</button>

          <button class="leave-btn" style="margin-top: 10px;" @click="handleLeave">退出房间</button>
        </div>
      </div>
    </div>

    <!-- Leave Confirmation Modal (global, above overlay) -->
    <div v-if="showLeaveConfirm" class="modal-overlay">
      <div class="confirm-card">
        <h3>确定退出房间？</h3>
        <div class="confirm-actions">
          <button class="secondary-btn" @click="showLeaveConfirm = false">取消</button>
          <button class="primary-btn" @click="confirmLeave">确定</button>
        </div>
      </div>
    </div>

    <!-- Board Zone -->
    <div class="board-zone">
      <!-- Back to Result Button (Visible during Review) -->
      <button v-if="gameState.config?.winner && isReviewing" class="back-result-btn" @click="toggleReview">
          返回结算
      </button>

      <!-- HUD: top-left overlay -->
      <div class="hud">
        <div class="hud-status">{{ statusText }}</div>
        <div class="hud-scores">
          <span class="score-red">{{ isSolo ? '得分' : '红' }} {{ gameState.stats.redScore || 0 }}</span>
          <template v-if="!isSolo">
            <span class="score-divider">·</span>
            <span class="score-blue">蓝 {{ gameState.stats.blueScore || 0 }}</span>
          </template>
        </div>
        <div class="territory-bar-container" v-if="!isSolo">
          <div class="bar red" :style="{ width: redPct + '%' }"></div>
          <div class="bar blue" :style="{ width: bluePct + '%' }"></div>
        </div>
      </div>

      <!-- Score Toggle Button -->
      <button class="toggle-score-btn" @click="toggleScores" :class="{ active: showScores }">
          {{ showScores ? '隐藏分数' : '显示分数' }}
      </button>

      <!-- Surrender button -->
      <button v-if="gameState.config?.active && playerColor" class="surrender-btn" @click="handleSurrender">
        {{ isSolo ? '结束对局' : '认输' }}
      </button>

      <canvas ref="canvasRef" :width="canvasPixels" :height="canvasPixels"></canvas>
    </div>

    <!-- Bottom Control Zone: hidden when game is over (not reviewing) -->
    <div class="control-zone" v-show="!gameState.config?.winner || isReviewing">
      <!-- Mobile D-Pad: hidden when game over OR reviewing -->
      <div v-if="!isReviewing && !gameState.config?.winner" class="mobile-controls">
        <button class="d-btn d-up" @pointerdown.prevent="handleMobileDir('up')">▲</button>
        <button class="d-btn d-left" @pointerdown.prevent="handleMobileDir('left')">◀</button>
        <button class="d-btn d-right" @pointerdown.prevent="handleMobileDir('right')">▶</button>
        <button class="d-btn d-down" @pointerdown.prevent="handleMobileDir('down')">▼</button>
      </div>

      <!-- Score Log: Shown during post-game review -->
      <div v-else class="score-log-container">
        <h3>对局得分日志</h3>
        <div class="log-entries">
            <div v-if="!gameState.scoreLogs || gameState.scoreLogs.length === 0" class="no-logs">暂无得分记录</div>
            <div v-else class="log-entry" v-for="(log, idx) in gameState.scoreLogs" :key="idx" :class="log.color">
                <span class="log-time">{{ new Date(log.timestamp).toLocaleTimeString([], {minute:'2-digit', second:'2-digit'}) }}</span>
                <span class="log-player">{{ log.playerName }}</span>
                <span class="log-action">{{ log.action }}</span>
                <span class="log-points">+{{ log.points }}</span>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useSocket } from '../composables/useSocket';

const { gameState, sendAction, playerColor, controlSize, surrender, leaveRoom, resetToLobby, isHost, restartStatus, requestRestart, currentRoom } = useSocket();
const canvasRef = ref(null);

const emits = defineEmits(['restart']);

const isRedReady = computed(() => restartStatus.value && restartStatus.value.includes('red'));
const isBlueReady = computed(() => restartStatus.value && restartStatus.value.includes('blue'));
const amIReady = computed(() => restartStatus.value && restartStatus.value.includes(playerColor.value));

const isSolo = computed(() => currentRoom.value && currentRoom.value.startsWith('SOLO'));

const handleRestartClick = () => {
    if (!amIReady.value) requestRestart();
};


// Live countdown ticker - updates every second
const currentTime = ref(Date.now());
let countdownInterval = null;

// Get current player's piece gravity direction
const myPieceDir = computed(() => {
    if (!gameState.players || !playerColor.value) return 2;
    const me = Object.values(gameState.players).find(p => p.color === playerColor.value);
    return me?.piece?.dir ?? 2;
});

// Map absolute direction button press to server action based on gravity
const handleMobileDir = (absoluteDir) => {
    const gDir = myPieceDir.value;
    const dirMap = { up: 0, right: 1, down: 2, left: 3 };
    const pressed = dirMap[absoluteDir];
    const opposite = (gDir + 2) % 4;

    if (pressed === gDir) {
        sendAction('forward');
    } else if (pressed === opposite) {
        sendAction('rotate');
    } else {
        sendAction(absoluteDir);
    }
};

// Responsive scaling
const resizeBoard = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    
    const baseW = canvas.width;
    const baseH = canvas.height;
    
    // Board zone is 70% of screen height
    const availableW = window.innerWidth;
    const availableH = window.innerHeight * 0.7; 
    
    // Scale to fit, but keep some padding
    const scale = Math.min((availableW * 0.96) / baseW, (availableH * 0.96) / baseH);
    
    canvas.style.width = `${baseW * scale}px`;
    canvas.style.height = `${baseH * scale}px`;
    canvas.style.transform = 'none'; 
    canvas.style.marginTop = '0';
};

const controlStyle = computed(() => ({
  transform: `scale(${controlSize.value / 100})`,
  transformOrigin: 'center center'
}));

// Dynamic board dimensions from server data
const BLOCK_SIZE = 30;
const boardRows = computed(() => gameState.board?.length || 40);
const boardCols = computed(() => gameState.board?.[0]?.length || 40);
const canvasPixels = computed(() => boardRows.value * BLOCK_SIZE);

// Stats
const totalTerritory = computed(() => (gameState.stats.red + gameState.stats.blue) || 1);
const redPct = computed(() => (gameState.stats.red / totalTerritory.value) * 100);
const bluePct = computed(() => (gameState.stats.blue / totalTerritory.value) * 100);

const statusText = computed(() => {
  if (!gameState.config) return '等待中...';
  if (gameState.config.winner) return '游戏结束';
  
  if (gameState.config.mode === 'time') {
    const elapsed = Math.floor((currentTime.value - gameState.config.startTime) / 1000);
    const remaining = Math.max(0, gameState.config.value - elapsed);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `⏱ ${mins}:${secs < 10 ? '0' : ''}${secs}`;
  } else {
    return `获胜目标 ${gameState.config.value}`;
  }
});

const handleKeydown = (e) => {
    if (isReviewing.value || !gameState.config?.active) return;
    if (playerColor.value === 'spectator') return;

    if (playerColor.value === 'red') {
        // Player 1: WASD
        switch (e.code) {
            case 'KeyA':
                sendAction('left');
                break;
            case 'KeyD':
                sendAction('right');
                break;
            case 'KeyS':
                sendAction('down');
                break;
            case 'KeyW':
                sendAction('rotate');
                break;
            case 'Space':
                sendAction('drop');
                break;
        }
    } else if (playerColor.value === 'blue') {
        // Player 2: Arrows
        switch (e.code) {
            case 'ArrowLeft':
                sendAction('left');
                break;
            case 'ArrowRight':
                sendAction('right');
                break;
            case 'ArrowDown':
                sendAction('down');
                break;
            case 'ArrowUp':
                sendAction('rotate');
                break;
            case 'Space': 
            case 'Enter': 
            case 'NumpadEnter':
                sendAction('drop');
                break;
        }
    }
};




const handleSurrender = () => {
    // Removed confirm for better UX and debugging
    surrender();
};

const showLeaveConfirm = ref(false);

const handleLeave = () => {
    showLeaveConfirm.value = true;
};

const confirmLeave = () => {
    showLeaveConfirm.value = false;
    leaveRoom();
};

const isReviewing = ref(false);

const toggleReview = () => {
    isReviewing.value = !isReviewing.value;
};

// Reset review state on game restart or reset
watch(() => gameState.config?.active, (active) => {
    if (active) isReviewing.value = false;
});

const showScores = ref(false); // Default hidden

const toggleScores = () => {
    showScores.value = !showScores.value;
    draw(); // Re-draw immediately
};


const getPlayerName = (color) => {
    if (!gameState.players) return '???';
    const p = Object.values(gameState.players).find(p => p.color === color);
    return p ? p.name : '???';
};

// Drawing
const draw = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Clear
  ctx.fillStyle = '#08080e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Background Rectangles (if available)
  if (gameState.config?.bgRects) {
      // Mapping area size to colors with LOW OPACITY (0.2) to not overly distract
      const colorMap = {
          8: 'rgba(46, 125, 50, 0.2)',    // Green
          10: 'rgba(245, 127, 23, 0.2)',  // Orange
          12: 'rgba(106, 27, 154, 0.2)',  // Purple
          16: 'rgba(0, 105, 92, 0.2)'     // Teal
      };
      // Fallback color
      const defaultColor = 'rgba(55, 71, 79, 0.2)'; // Blue Grey

      // Score Map for display (defined here for both passes)
      const scoreMap = { 8: 10, 10: 15, 12: 20, 16: 30 };

      // 1. Draw Background Rects (Behind Grid/Pieces)
      gameState.config.bgRects.forEach(rect => {
          const area = rect.w * rect.h;
          const color = colorMap[area] || defaultColor;
          
          ctx.fillStyle = color;
          // Fill rectangle
          ctx.fillRect(
              rect.x * BLOCK_SIZE, 
              rect.y * BLOCK_SIZE, 
              rect.w * BLOCK_SIZE, 
              rect.h * BLOCK_SIZE
          );
          // Optional: Add subtle border to distinguish tiles
          ctx.strokeStyle = '#000'; // Black border between tiles
          ctx.lineWidth = 1;
          ctx.strokeRect(
              rect.x * BLOCK_SIZE, 
              rect.y * BLOCK_SIZE, 
              rect.w * BLOCK_SIZE, 
              rect.h * BLOCK_SIZE
          );
      });
  }

  // 2. Draw Grid & Pieces
  // Draw Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const cols = boardCols.value;
  const rows = boardRows.value;
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

  // Draw Spawn Zone Highlight (Center 4x4)
  const zoneStart = Math.floor(cols / 2) - 2;
  ctx.fillStyle = '#000000'; // Black Fill
  ctx.fillRect(zoneStart * BLOCK_SIZE, zoneStart * BLOCK_SIZE, 4 * BLOCK_SIZE, 4 * BLOCK_SIZE);
  ctx.strokeStyle = '#ffffff'; // White Dashed Outline
  ctx.lineWidth = 2; // Make it visible
  ctx.setLineDash([8, 6]); // Distinct dash pattern
  ctx.strokeRect(zoneStart * BLOCK_SIZE, zoneStart * BLOCK_SIZE, 4 * BLOCK_SIZE, 4 * BLOCK_SIZE);
  ctx.setLineDash([]);

  // Helper to draw 8-bit block
  const draw8BitBlock = (x, y, isRed) => {
      const baseColor = isRed ? '#e52521' : '#0047bb';
      const lightColor = isRed ? '#ff5956' : '#4f7df5';
      const darkColor = isRed ? '#820000' : '#001f5c';
      const borderSize = 4;

      ctx.fillStyle = baseColor;
      ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
      
      // Top highlight
      ctx.fillStyle = lightColor;
      ctx.fillRect(x, y, BLOCK_SIZE, borderSize);
      // Left highlight
      ctx.fillRect(x, y, borderSize, BLOCK_SIZE);
      
      // Bottom shadow
      ctx.fillStyle = darkColor;
      ctx.fillRect(x, y + BLOCK_SIZE - borderSize, BLOCK_SIZE, borderSize);
      // Right shadow
      ctx.fillRect(x + BLOCK_SIZE - borderSize, y, borderSize, BLOCK_SIZE);
  };

  // Draw Board
  if (gameState.board && gameState.board.length > 0) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = gameState.board[r][c];
            if (val) {
                draw8BitBlock(c * BLOCK_SIZE, r * BLOCK_SIZE, val === 1);
            }
        }
    }
  }

  // Draw Edge Targets removed per user request

  // Draw Players
  if (gameState.players) {
    Object.values(gameState.players).forEach(player => {
        if (!player.piece) return;
        const isRed = player.color === 'red';
        const shape = player.piece.shape;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const x = (player.piece.x + c) * BLOCK_SIZE;
                    const y = (player.piece.y + r) * BLOCK_SIZE;
                    
                    draw8BitBlock(x, y, isRed);
                    
                    // Add White Outline for active pieces (Only for own piece)
                    if (player.color === playerColor.value) {
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 4; // Thicker stroke for 8-bit
                        ctx.strokeRect(x + 2, y + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
                    }
                }
            }
        }
    });
  }

  // 3. Draw Scores and Captures (On Top of Everything)
  if (gameState.config?.bgRects) {
      // Score Map for display
      const scoreMap = { 8: 10, 10: 15, 12: 20, 16: 30 };
      
      gameState.config.bgRects.forEach(rect => {
          const area = rect.w * rect.h;
          const score = scoreMap[area];
          
          if (score) {
              // Check ownership
              let isRed = true;
              let isBlue = true;
              
              // Only check if board exists
              if (gameState.board && gameState.board.length > 0) {
                  for (let r = rect.y; r < rect.y + rect.h; r++) {
                      for (let c = rect.x; c < rect.x + rect.w; c++) {
                          // Boundary check
                          if (r >= 0 && r < gameState.config.boardSize && c >= 0 && c < gameState.config.boardSize) {
                              const val = gameState.board[r][c];
                              if (val !== 1) isRed = false;
                              if (val !== 2) isBlue = false;
                          }
                      }
                  }
              } else {
                  isRed = false;
                  isBlue = false;
              }

              if (isRed || isBlue) {
                  // Captured - Draw White Stroke (Always visible when captured)
                  ctx.strokeStyle = '#ffffff';
                  ctx.lineWidth = 3;
                  ctx.strokeRect(
                      rect.x * BLOCK_SIZE + 1, 
                      rect.y * BLOCK_SIZE + 1, 
                      rect.w * BLOCK_SIZE - 2, 
                      rect.h * BLOCK_SIZE - 2
                  );

                  // Apply Styles to score text (Always visible when captured)
                  ctx.font = '24px "Zpix", "Press Start 2P", monospace';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  
                  const centerX = (rect.x + rect.w / 2) * BLOCK_SIZE;
                  const centerY = (rect.y + rect.h / 2) * BLOCK_SIZE;

                  if (isRed) {
                      // Red Owned
                      ctx.fillStyle = '#ff0000'; 
                      ctx.lineWidth = 6;
                      ctx.strokeStyle = '#ffffff';
                      ctx.strokeText('+' + score, centerX, centerY);
                      ctx.fillText('+' + score, centerX, centerY);
                  } else {
                      // Blue Owned
                      ctx.fillStyle = '#0088ff';
                      ctx.lineWidth = 6;
                      ctx.strokeStyle = '#ffffff';
                      ctx.strokeText('+' + score, centerX, centerY);
                      ctx.fillText('+' + score, centerX, centerY);
                  }
              } else {
                  // Not captured - Default styling
                  if (showScores.value) {
                      ctx.font = '24px "Zpix", "Press Start 2P", monospace';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      
                      const centerX = (rect.x + rect.w / 2) * BLOCK_SIZE;
                      const centerY = (rect.y + rect.h / 2) * BLOCK_SIZE;

                      ctx.fillStyle = '#00ffff'; // Retro Cyan
                      ctx.fillText('+' + score, centerX, centerY);
                  }
              }
          }
      });
  }
};

// Watch for state changes to redraw
watch(() => gameState.board, draw, { deep: true });
watch(() => gameState.players, draw, { deep: true });

// Re-scale when board dimensions change
watch(boardRows, () => {
  nextTick(() => {
    resizeBoard();
    draw();
  });
});

onMounted(() => {
  window.addEventListener('resize', resizeBoard);
  window.addEventListener('keydown', handleKeydown);
  resizeBoard();
  draw();

  countdownInterval = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeBoard);
  window.removeEventListener('keydown', handleKeydown);
  if (countdownInterval) clearInterval(countdownInterval);
});
</script>

<style scoped>
/* CSS Update for Retro Arcade Theme */
.game-container {
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; right: 0;
  width: 100%;
  height: 100vh;
  height: 100svh; /* mobile browser chrome aware */
  overflow: hidden;
  touch-action: none;
  background-color: #050505;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 30px 30px;
  position: relative;
}
.game-container::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.8) 100%);
  pointer-events: none;
  z-index: 0;
}
.board-zone, .control-zone {
  position: relative;
  z-index: 1;
}

/* --- Top 70% Board Zone --- */
.board-zone {
  flex: 6; /* 60% relative size for better mobile control reach */
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: hidden;
}

/* HUD — top-left absolute overlay */
.hud {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 200;
  background: rgba(0, 0, 0, 0.72);
  border: 3px solid #333;
  padding: 6px 10px;
  box-shadow: 3px 3px 0 #000;
  display: flex;
  flex-direction: column;
  gap: 3px;
  pointer-events: none;
  min-width: 90px;
}

.hud-status {
  font-size: clamp(0.65em, 2.2vw, 0.9em);
  font-weight: 700;
  color: #00ffff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 1px 1px 0 #000;
  white-space: nowrap;
}

.hud-scores {
  display: flex;
  align-items: center;
  gap: 4px;
}

.territory-bar-container {
  width: 100%;
  height: 8px;
  background: #111;
  display: flex;
  border-radius: 0;
  overflow: hidden;
  border: 2px solid #444;
}
.bar { height: 100%; transition: width 0.5s ease; }
.red { background: #ff6b6b; }
.blue { background: #4dabf7; }

.score-red { color: #ff6b6b; font-size: 1em; font-weight: 800; text-shadow: 1px 1px 0 #000; white-space: nowrap; }
.score-blue { color: #4dabf7; font-size: 1em; font-weight: 800; text-shadow: 1px 1px 0 #000; white-space: nowrap; }
.score-divider { margin: 0 3px; color: #444; font-weight: bold; }

canvas {
  max-width: 96%;
  max-height: 80%;
  object-fit: contain;
  border: 4px solid #333;
  background: #000;
  border-radius: 0;
  box-shadow: 6px 6px 0 #000;
  display: block;
}

/* Game Over Overlay — full screen */
.overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.overlay-card {
  background: #111;
  border: 6px solid #444;
  border-top: 6px solid #00ffff; /* Cyan accent top edge */
  border-radius: 0;
  padding: 28px 24px 20px;
  text-align: center;
  width: 92%;
  max-width: 400px;
  max-height: 92vh;
  overflow-y: auto;
  box-sizing: border-box;
  box-shadow: 
    inset 4px 4px 0 #000,
    inset -4px -4px 0 #222,
    8px 8px 0 #000;
  position: relative;
}
.overlay-card::after { display: none; }
.overlay-card h2 {
  font-size: 1.5em;
  margin: 0 0 12px;
  color: #ececec;
}
.final-score {
  font-size: 2em;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin: 0 0 24px;
  color: #b4b4b4;
}
.restart-btn {
  padding: 12px 28px;
  font-size: 1.1em;
  border-radius: 0;
  background: #0088cc;
  border: 4px solid #fff;
  color: white;
  cursor: pointer;
  width: 100%;
  margin-bottom: 12px;
  text-transform: uppercase;
  font-family: inherit;
  box-shadow: 4px 4px 0 #00ffff;
  position: relative;
  z-index: 2;
  transition: all 0.1s;
}
.waiting-text {
  color: #888;
  margin-bottom: 16px;
  font-size: 0.9em;
  animation: pulse 2s infinite;
  position: relative;
  z-index: 2;
}
.restart-btn:hover {
  background: #fff;
  color: #000;
  border-color: #00ffff;
}
.restart-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #00ffff;
}
.leave-btn {
  padding: 10px 20px;
  font-size: 0.95em;
  border-radius: 0;
  background: #d32f2f;
  border: 4px solid #ff0000;
  color: #fff;
  cursor: pointer;
  width: 100%;
  font-family: inherit;
  text-transform: uppercase;
  box-shadow: 4px 4px 0 #ff0000;
  position: relative;
  z-index: 2;
  transition: all 0.1s;
}
.leave-btn:hover {
  background: #ff0000;
  color: #000;
}
.leave-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #ff0000;
}

/* Surrender */
.surrender-btn {
  position: absolute;
  top: 10px;
  right: 116px;
  padding: 6px 10px;
  font-size: 0.75em;
  border-radius: 0;
  background: #3a0a0a;
  border: 4px solid #cc2222;
  box-shadow: 4px 4px 0 #000;
  color: #ff8888;
  cursor: pointer;
  z-index: 200;
  font-family: inherit;
  text-transform: uppercase;
  transition: all 0.1s;
}
.surrender-btn:hover {
  background: #cc2222;
  color: #fff;
  border-color: #ff4444;
}
.surrender-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #000;
}

.toggle-score-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 10px;
  font-size: 0.75em;
  border-radius: 0;
  background: #181818;
  border: 4px solid #555;
  box-shadow: 4px 4px 0 #000;
  color: #aaa;
  cursor: pointer;
  z-index: 200;
  transition: all 0.1s;
  font-family: inherit;
  text-transform: uppercase;
  white-space: nowrap;
}
.toggle-score-btn:hover {
  background: #555;
  color: #00ffff;
  border-color: #00ffff;
}
.toggle-score-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #000;
}
.toggle-score-btn.active {
  background: #003355;
  border-color: #00ffff;
  color: #00ffff;
  box-shadow: 4px 4px 0 #00ffff;
}

/* Modal Overlay */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
}
.confirm-card {
  background: #111;
  padding: 24px;
  border-radius: 0;
  border: 6px solid #444;
  text-align: center;
  width: 280px;
  box-shadow: 
    inset 4px 4px 0 #000,
    inset -4px -4px 0 #222,
    8px 8px 0 #000;
  position: relative;
}
.confirm-card::after {
  content: '';
  position: absolute;
  top: 4px; left: 4px; right: 4px; bottom: 4px;
  border: 2px dashed #333;
  pointer-events: none;
}
.confirm-card h3 {
  margin: 0 0 20px;
  color: #ececec;
  font-size: 1.1em;
}
.confirm-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  position: relative;
  z-index: 2;
}
.confirm-actions button {
  flex: 1;
  padding: 12px;
  border-radius: 0;
  border: none;
  font-size: 1em;
  font-family: inherit;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.1s;
}
.secondary-btn {
  padding: 12px;
  font-size: 1.1em;
  background: #222;
  color: #fff;
  border: 4px solid #888;
  box-shadow: 4px 4px 0 #000;
  text-transform: uppercase;
  font-family: inherit;
  cursor: pointer;
  border-radius: 0;
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
.confirm-actions .primary-btn {
  background: #0088cc;
  color: white;
  border: 2px solid #00ffff;
  box-shadow: 2px 2px 0 #000;
}
.confirm-actions .primary-btn:hover {
  background: #00ffff;
  color: #000;
}
.confirm-actions button:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 #000;
}

/* --- Bottom Control Zone --- */
.control-zone {
  flex: 4;
  background: #050505;
  border-top: 4px solid #00ffff;
  box-shadow: 0 -4px 0 #000, 0 -8px 0 #003355;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 50;
  padding: 0 10px;
}

/* Mobile Controls - No longer fixed, centered in zone */
.mobile-controls {
  position: relative;
  display: block;
  width: 220px; /* Slightly larger area for spacing */
  height: 220px;
  pointer-events: none;
}

/* D-pad buttons */
.d-btn {
  position: absolute;
  width: 68px; /* Larger hit targets */
  height: 68px;
  border-radius: 0; /* No rounded corners */
  background: #111;
  border: 4px solid #555;
  color: #fff;
  font-size: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  user-select: none;
  touch-action: none; /* Critical for fast consecutive taps on mobile */
  -webkit-tap-highlight-color: transparent;
  padding: 0;
  margin: 0;
  pointer-events: auto;
  box-shadow: 4px 4px 0 #555; /* Solid retro shadow */
}

/* Position buttons in Inverted T pattern (Laptop/Keyboard style) */
/* Container is relative 220x220, centered in control-zone */
/* Up is at the top center of the T */
.d-up    { top: 15px;   left: 50%; transform: translateX(-50%); }
/* Down is below Up */
.d-down  { top: 95px;  left: 50%; transform: translateX(-50%); }
/* Left is to the left of Down */
.d-left  { top: 95px;  left: 50%; transform: translateX(-160%); } /* 50% - ~75px */
/* Right is to the right of Down */
.d-right { top: 95px;  left: 50%; transform: translateX(60%); }  /* 50% + ~40px */

/* Score Log Container (Replaces D-pad during review) */
.score-log-container {
  width: 90%;
  height: 90%;
  background: #111;
  border: 4px solid #333;
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-sizing: border-box;
  box-shadow: inset 4px 4px 0 #000;
}

.score-log-container h3 {
  margin: 0 0 10px 0;
  color: #ffff00;
  text-align: center;
  font-size: 1.2rem;
  border-bottom: 2px dashed #444;
  padding-bottom: 8px;
}

.log-entries {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 5px;
}

/* Custom Scrollbar for the log */
.log-entries::-webkit-scrollbar {
  width: 12px;
}
.log-entries::-webkit-scrollbar-track {
  background: #000;
  border-left: 2px solid #222;
}
.log-entries::-webkit-scrollbar-thumb {
  background: #333;
  border: 2px solid #111;
}

.no-logs {
  text-align: center;
  color: #777;
  font-size: 0.9rem;
  margin-top: 20px;
}

.log-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #000;
  border: 2px solid #333;
  font-size: 0.75rem;
  line-height: 1.4;
  text-transform: uppercase;
}

.log-entry.red {
  border-color: rgba(255, 0, 0, 0.4);
  color: #ffaaaa;
  box-shadow: inset 4px 0 0 #ff0000;
}

.log-entry.blue {
  border-color: rgba(0, 136, 204, 0.4);
  color: #add8e6;
  box-shadow: inset 4px 0 0 #0088cc;
}

.log-time {
  color: #666;
  font-size: 0.65rem;
  min-width: 45px;
}

.log-player {
  font-weight: bold;
  flex: 1;
  margin: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-action {
  color: #ccc;
  flex: 2;
  text-align: left;
}

.log-points {
  font-weight: bold;
  font-size: 0.85rem;
  color: #ffff00;
  text-shadow: 1px 1px 0 #000;
}

</style>

<style scoped>
.restart-status-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 16px 0;
}

/* Solo Result Styles */
.solo-result {
  min-width: 280px;
}
.solo-score-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  padding: 16px;
  background: #000;
  border-radius: 0;
  border: 4px solid #333;
}
.solo-label {
  font-size: 1rem;
  color: #888;
  margin-bottom: 8px;
}
.solo-value {
  font-size: 3.5rem;
  font-weight: 800;
  color: #00ffff;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  font-family: inherit;
}
.status-pill {
  background: #111;
  padding: 6px 12px;
  border-radius: 0;
  font-size: 0.9em;
  color: #888;
  border: 2px solid #444;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.1s;
}
.status-pill .dot {
  width: 10px; height: 10px; border-radius: 0; background: #666;
}
.status-pill.ready {
  border-color: #00ffff;
  color: #ececec;
  background: rgba(0, 255, 255, 0.1);
}
.status-pill.ready .dot { background: #00ffff; box-shadow: 0 0 5px #00ffff; }
.status-pill.red.ready { border-color: #ff6b6b; background: rgba(255,107,107,0.1); }
.status-pill.red.ready .dot { background: #ff6b6b; box-shadow: 0 0 5px #ff6b6b; }
.status-pill.blue.ready { border-color: #4dabf7; background: rgba(77,171,247,0.1); }
.status-pill.blue.ready .dot { background: #4dabf7; box-shadow: 0 0 5px #4dabf7; }

.restart-btn.disabled {
  background: #222;
  border-color: #444;
  box-shadow: none;
  cursor: not-allowed;
  color: #555;
  transform: none;
}
.pulse-green {
  animation: pulse-cyan 2s infinite;
}
@keyframes pulse-cyan {
  0% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(0, 255, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0); }
}

.back-result-btn {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 24px;
  background: #222;
  border: 4px solid #888;
  color: #fff;
  border-radius: 0;
  cursor: pointer;
  z-index: 200;
  font-family: inherit;
  box-shadow: 4px 4px 0 #000;
  text-transform: uppercase;
  transition: all 0.1s;
}

.back-result-btn:hover {
  background: #888;
  color: #000;
  border-color: #fff;
}
.back-result-btn:active {
  transform: translate(calc(-50% + 2px), 2px);
  box-shadow: 2px 2px 0 #000;
}

/* Result Card (History Style) */
.result-card {
  width: 100%;
  max-width: 380px;
  background: #111;
  border: 6px solid #444;
  border-radius: 0;
  padding: 16px;
  margin: 16px auto;
  box-shadow: 
    inset 4px 4px 0 #000,
    inset -4px -4px 0 #222,
    8px 8px 0 #000;
  position: relative;
}
.result-card::after {
  content: '';
  position: absolute;
  top: 4px; left: 4px; right: 4px; bottom: 4px;
  border: 2px dashed #333;
  pointer-events: none;
}
.result-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.h-top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  font-size: 0.9em;
  color: #888;
  border-bottom: 1px solid #4a4a4a;
  padding-bottom: 8px;
  margin-bottom: 4px;
}
.h-mode-tag {
  background: #0088cc;
  color: #fff;
  padding: 2px 6px;
  border: 2px solid #00ffff;
  justify-self: start;
}
.h-winner-tag {
  justify-self: end;
  font-weight: bold;
}
.t-red { color: #ff6b6b; }
.t-blue { color: #4dabf7; }
.t-draw { color: #ccc; }

.h-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.h-player-side {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.1em;
  color: #aaa;
  transition: all 0.3s;
}
.side-left { justify-content: flex-start; }
.side-right { justify-content: flex-end; }

.h-player-side.is-win {
  color: #fff;
  font-weight: 700;
  text-shadow: 2px 2px 0 #000;
  transform: scale(1.05);
  border: 2px dashed #00ffff;
  padding: 8px;
  background: #0088cc;
  box-shadow: 4px 4px 0 #000;
}

.h-info-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.side-left .h-info-group { align-items: flex-start; }
.side-right .h-info-group { align-items: flex-end; }

.h-dot-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.h-dot {
  width: 12px;
  height: 12px;
  border-radius: 0;
}
.h-dot.red { background: #ff6b6b; box-shadow: 2px 2px 0 #cc0000; }
.h-dot.blue { background: #4dabf7; box-shadow: 2px 2px 0 #0055cc; }

.h-name {
    font-size: 0.9em;
    color: #ccc;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.h-score-num {
    font-family: inherit;
    font-size: 1.8em;
    font-weight: 800;
    line-height: 1;
}

.h-vs {
    font-weight: 900;
    color: #555;
    font-style: italic;
    font-size: 1.2em;
    margin: 0 16px;
}

.surrender-mini-tag {
    font-size: 0.75em;
    background: #555;
    color: #ddd;
    padding: 2px 6px;
    border-radius: 0;
    border: 1px solid #777;
    margin-top: 4px;
}
.surrender-mini-tag.surrender-left {
    margin-left: 0;
    margin-right: 6px;
}

/* ===== Mobile Responsive Overrides ===== */
@media (max-width: 480px) {
  /* Shrink HUD labels even more on narrow phones */
  .status-text { font-size: 0.55em; }
  .territory-bar-container { height: 10px; border-width: 2px; }
  .score-red, .score-blue { font-size: 1em; }

  /* Make the two action buttons fit side by side */
  .surrender-btn,
  .toggle-score-btn {
    font-size: 0.6em;
    padding: 4px 8px;
    border-width: 3px;
    box-shadow: 3px 3px 0 #000;
  }
  .toggle-score-btn { right: 6px; top: 6px; }
  .surrender-btn { right: 96px; top: 6px; }

  /* Tighter overlay card on small phone */
  .overlay-card {
    padding: 12px 10px;
    width: 95%;
  }

  /* Thinner confirm card */
  .confirm-card {
    width: 95%;
    padding: 16px;
  }

  /* Score log inside control zone */
  .score-log-container { padding: 6px; }
  .score-log-container h3 { font-size: 0.8rem; margin-bottom: 6px; }
  .log-entry { font-size: 0.65em; }
}
</style>

