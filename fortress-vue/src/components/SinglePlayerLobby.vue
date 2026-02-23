<template>
  <div class="viewport">
    <div class="scaler" ref="scalerEl" :style="{ transform: `scale(${scale})` }">
    <div class="top-bar">
      <button class="back-btn" @click="handleBack">← 返回</button>
    </div>

    <!-- Hero -->
    <div class="hero">
      <div class="hero-tag solo">[ SOLO ]</div>
      <h1 class="hero-title">单人限时挑战</h1>
      <div class="hero-sub">⏱ 5 分钟 &nbsp;·&nbsp; 争夺最高分</div>
    </div>

    <!-- Main Panel -->
    <div class="panel solo-accent">
      <div class="panel-label">RULES</div>
      <ol class="rules-list">
        <li>控制方块由刷新区边线随机向四个方向前进</li>
        <li>5 分钟倒计时结束，挑战最高分</li>
        <li>方块堵塞刷新区时游戏提前结束</li>
        <li>方块落在棋盘边缘得 <b>5</b> 分</li>
        <li>填满 8 / 10 / 12 / 16 格区域额外得 <b>10 / 15 / 20 / 30</b> 分</li>
      </ol>
    </div>

    <!-- Actions -->
    <div class="action-group">
      <button class="action-btn primary solo-primary" @click="handleStart">▶ 开始游戏</button>
      <button class="action-btn secondary" @click="openLeaderboard">🏆 排行榜</button>
    </div>

    <!-- Leaderboard Modal -->
    <div v-if="showLeaderboard" class="modal-overlay" @click.self="showLeaderboard = false">
      <div class="modal solo-modal">
        <div class="modal-top">
          <span class="modal-tag solo">TOP 10</span>
          <span class="modal-heading">单人排行榜</span>
          <button class="x-btn" @click="showLeaderboard = false">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="leaderboard.length === 0" class="empty-tip">暂无记录</div>
          <div v-else v-for="(entry, idx) in leaderboard" :key="idx" class="lb-row">
            <span class="lb-rank" :class="'r' + (idx+1)">#{{ idx+1 }}</span>
            <span class="lb-name">{{ entry.name }}</span>
            <span class="lb-score solo-score">{{ entry.score }}</span>
            <button v-if="entry.board" class="lb-btn solo-lb-btn" @click="viewBoard(entry)">棋盘</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Board Modal -->
    <div v-if="showBoardModal" class="modal-overlay" style="z-index:2000" @click.self="showBoardModal = false">
      <div class="modal solo-modal board-modal">
        <div class="modal-top">
          <span class="modal-tag solo">REPLAY</span>
          <span class="modal-heading">高分重现</span>
          <button class="x-btn" @click="showBoardModal = false">✕</button>
        </div>
        <div class="modal-body center">
          <div class="canvas-box">
            <canvas ref="boardCanvas" width="300" height="300"></canvas>
          </div>
          <p class="canvas-note">该局结束时的最终棋盘状态</p>
        </div>
      </div>
    </div>
    </div><!-- /.scaler -->
  </div><!-- /.viewport -->
</template>

<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import { useSocket } from '../composables/useSocket';
import { useViewportScale } from '../composables/useViewportScale';

const emit = defineEmits(['back']);
const { joinSinglePlayer, startGame, getLeaderboard, leaderboard, leaveRoom } = useSocket();

const scalerEl    = ref(null);
const { scale }   = useViewportScale(scalerEl);
const showLeaderboard = ref(false);
const showBoardModal  = ref(false);
const boardCanvas     = ref(null);

onMounted(() => { joinSinglePlayer(); getLeaderboard(); });
onUnmounted(() => { leaveRoom(); });

const handleBack = () => { leaveRoom(); emit('back'); };
const openLeaderboard = () => { getLeaderboard(); showLeaderboard.value = true; };
const handleStart     = () => startGame({ mode: 'time', value: 300, speed: 1 });

const viewBoard = (entry) => {
  showBoardModal.value = true;
  nextTick(() => {
    const canvas = boardCanvas.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cols = entry.boardSize || 30;
    const rows = entry.boardSize || 30;
    const BS = canvas.width / cols;

    ctx.fillStyle = '#08080e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (entry.bgRects) {
      const cmap = { 8:'rgba(46,125,50,.2)', 10:'rgba(245,127,23,.2)', 12:'rgba(106,27,154,.2)', 16:'rgba(0,105,92,.2)' };
      entry.bgRects.forEach(r => {
        ctx.fillStyle = cmap[r.w*r.h] || 'rgba(55,71,79,.2)';
        ctx.fillRect(r.x*BS, r.y*BS, r.w*BS, r.h*BS);
        ctx.strokeStyle='#000'; ctx.lineWidth=1;
        ctx.strokeRect(r.x*BS, r.y*BS, r.w*BS, r.h*BS);
      });
    }
    ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.lineWidth=1;
    for(let c=0;c<=cols;c++){ctx.beginPath();ctx.moveTo(c*BS,0);ctx.lineTo(c*BS,canvas.height);ctx.stroke();}
    for(let r=0;r<=rows;r++){ctx.beginPath();ctx.moveTo(0,r*BS);ctx.lineTo(canvas.width,r*BS);ctx.stroke();}
    const zs=Math.floor(cols/2)-2;
    ctx.fillStyle='#000';ctx.fillRect(zs*BS,zs*BS,4*BS,4*BS);
    ctx.strokeStyle='#222';ctx.lineWidth=Math.max(1,BS/4);ctx.strokeRect(zs*BS,zs*BS,4*BS,4*BS);

    const blk=(x,y,red)=>{
      const b=red?'#e52521':'#0047bb',l=red?'#ff5956':'#4f7df5',d=red?'#820000':'#001f5c',bs=Math.max(1,BS/4);
      ctx.fillStyle=b;ctx.fillRect(x,y,BS,BS);
      ctx.fillStyle=l;ctx.fillRect(x,y,BS,bs);ctx.fillRect(x,y,bs,BS);
      ctx.fillStyle=d;ctx.fillRect(x,y+BS-bs,BS,bs);ctx.fillRect(x+BS-bs,y,bs,BS);
    };
    if(entry.board)
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){const v=entry.board[r][c];if(v)blk(c*BS,r*BS,v===1);}
  });
};
</script>

<style scoped>
/* Shared Design System — see Lobby.vue for mirrored layout */

.page {
  min-height: 100vh; min-height: 100svh;
  display: flex; flex-direction: column; align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 24px 16px 40px;
  box-sizing: border-box; overflow-y: auto;
  background-color: #050505;
  background-image:
    linear-gradient(rgba(0,255,255,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,255,.03) 1px, transparent 1px);
  background-size: 30px 30px;
  color: #ececec; position: relative;
}
.page::before {
  content:''; position:fixed; inset:0;
  background: radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(0,0,0,.85) 100%);
  pointer-events:none; z-index:0;
}
.page > * { position:relative; z-index:1; width:100%; max-width:420px; }

/* Top Bar */
.top-bar {
  display:flex;
  align-items:center;
  width:100%;
  padding-bottom:4px;
}
.back-btn {
  background:#111; border:3px solid #333; color:#666;
  font-family:inherit; font-size:.75em; padding:6px 16px;
  cursor:pointer; text-transform:uppercase; letter-spacing:.08em;
  box-shadow:3px 3px 0 #000; transition:all .1s;
}
.back-btn:hover  { border-color:#00cc44; color:#00cc44; background:#0a1a0a; }
.back-btn:active { transform:translate(2px,2px); box-shadow:1px 1px 0 #000; }

/* Hero */
.hero { text-align:center; animation:fadeDown .5s ease-out both; }
.hero-tag {
  display:inline-block; font-size:.68em; letter-spacing:.22em;
  padding:3px 14px; margin-bottom:10px; border:2px solid;
}
.hero-tag.solo { color:#00cc44; border-color:#00cc44; background:rgba(0,204,68,.07); }
.hero-title {
  margin:0 0 8px;
  font-size:clamp(1.5rem, 4.5vw, 2.2rem);
  color:#fff;
  text-shadow:3px 3px 0 #003300, 6px 6px 0 rgba(0,80,0,.25);
  text-transform:uppercase; letter-spacing:.1em;
}
.hero-sub { font-size:.82em; color:#555; letter-spacing:.08em; }

/* Panel */
.panel {
  background:#0c0c0c; border:3px solid #1e1e1e;
  border-top:5px solid;
  padding:16px; box-shadow:6px 6px 0 #000;
  display:flex; flex-direction:column; gap:10px;
  animation:fadeUp .5s .05s ease-out both;
}
.solo-accent { border-top-color:#00cc44; }
.panel-label { font-size:.62em; letter-spacing:.2em; }
.solo-accent .panel-label { color:#00cc44; }

/* Rules */
.rules-list {
  margin:0; padding-left:0; list-style:none;
  color:#777; font-size:.82em; line-height:1.85;
  counter-reset:rule;
}
.rules-list li { counter-increment:rule; position:relative; padding-left:2.2em; margin-bottom:2px; }
.rules-list li::before { content:counter(rule,decimal-leading-zero)'.'; position:absolute; left:0; }
.solo-accent .rules-list li::before { color:#1a4d1a; }
.solo-accent .rules-list b { color:#00cc44; }

/* Action Group */
.action-group {
  display:flex; flex-direction:column; gap:10px;
  animation:fadeUp .5s .12s ease-out both;
}
.action-btn {
  width:100%; padding:13px; font-size:.95em; font-family:inherit;
  text-transform:uppercase; letter-spacing:.08em; color:#fff;
  border:3px solid; cursor:pointer; transition:all .1s;
}
.action-btn.primary.solo-primary {
  background:#005522; border-color:#00cc44;
  box-shadow:0 0 0 1px #002211, 5px 5px 0 #001a00;
}
.action-btn.primary.solo-primary:hover {
  background:#00aa33; border-color:#aaffcc;
  box-shadow:0 0 14px rgba(0,200,60,.3), 5px 5px 0 #003300;
}
.action-btn.primary.solo-primary:active { transform:translate(3px,3px); box-shadow:1px 1px 0 #001a00; }
.action-btn.secondary {
  background:#111; border-color:#2a2a2a; box-shadow:4px 4px 0 #000; color:#666;
}
.action-btn.secondary:hover  { background:#1e1e1e; border-color:#555; color:#ccc; }
.action-btn.secondary:active { transform:translate(2px,2px); box-shadow:2px 2px 0 #000; }

/* Modal */
.modal-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,.9);
  display:flex; align-items:center; justify-content:center; z-index:1000;
}
.modal {
  background:#0e0e0e; border:3px solid #222;
  border-top:5px solid;
  width:90%; max-width:440px; max-height:88vh; overflow-y:auto;
  box-shadow:8px 8px 0 #000; animation:fadeUp .2s ease-out;
  display:flex; flex-direction:column;
}
.solo-modal { border-top-color:#00cc44; }
.modal-top {
  display:flex; align-items:center; gap:10px;
  padding:14px 16px; border-bottom:2px solid #1a1a1a; flex-shrink:0;
}
.modal-tag {
  font-size:.6em; letter-spacing:.18em; padding:2px 8px; border:2px solid; flex-shrink:0;
}
.modal-tag.solo { color:#00cc44; border-color:#00cc44; background:rgba(0,204,68,.06); }
.modal-heading { flex:1; font-size:1em; color:#ccc; letter-spacing:.05em; }
.x-btn {
  background:transparent; border:2px solid #2a2a2a; color:#555;
  width:28px; height:28px; display:flex; align-items:center; justify-content:center;
  cursor:pointer; font-size:.95em; transition:all .1s; flex-shrink:0;
}
.x-btn:hover { border-color:#cc2222; color:#ff6666; }

.modal-body { display:flex; flex-direction:column; gap:4px; padding:10px; overflow-y:auto; flex:1; }
.modal-body.center { align-items:center; }
.empty-tip { text-align:center; color:#444; padding:24px; font-size:.85em; }

/* Leaderboard */
.lb-row {
  display:flex; align-items:center; gap:8px;
  background:#0a0a0a; border:1px solid #1a1a1a; padding:8px 10px; font-size:.82em;
}
.lb-rank { width:34px; font-weight:700; color:#444; flex-shrink:0; }
.r1{color:#ffd700;} .r2{color:#b0b0b0;} .r3{color:#cc7733;}
.lb-name { flex:1; color:#aaa; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lb-score { font-weight:700; flex-shrink:0; }
.solo-score { color:#00cc44; }
.lb-btn { padding:3px 10px; font-size:.78em; font-family:inherit; cursor:pointer; border:2px solid; flex-shrink:0; background:transparent; transition:all .1s; }
.solo-lb-btn { color:#00cc44; border-color:#00cc44; }
.solo-lb-btn:hover { background:#00cc44; color:#000; }

/* Board */
.board-modal { max-width:360px; }
.canvas-box { background:#000; border:3px solid #222; padding:4px; display:inline-block; box-shadow:4px 4px 0 #000; }
.canvas-box canvas { display:block; }
.canvas-note { color:#444; font-size:.75em; margin:8px 0 4px; }

@keyframes fadeDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:none} }
@keyframes fadeUp   { from{opacity:0;transform:translateY(12px)}  to{opacity:1;transform:none} }

@media (max-width:480px) {
  .page { padding:60px 10px 32px; gap:14px; }
  .hero-title { font-size:1.4rem; }
  .rules-list { font-size:.74em; }
  .action-btn { font-size:.85em; padding:11px; }
}
</style>
