<template>
  <div class="viewport">
    <div class="scaler" ref="scalerEl" :style="{ transform: `scale(${scale})` }">
    <div class="top-bar">
    </div>

    <!-- ═══ Entry: No Room ═══ -->
    <template v-if="!currentRoom">

      <div class="hero">
        <div class="hero-tag online">[ ONLINE ]</div>
        <h1 class="hero-title">联机对战</h1>
        <div class="hero-sub">🌐 双人实时对战 · 争夺领土控制权</div>
      </div>

      <!-- Room Input -->
      <div class="panel online-accent">
        <div class="panel-label">ROOM CODE</div>
        <input
          type="tel"
          v-model="roomInput"
          maxlength="6"
          placeholder="输入 6 位数字房间号"
          class="room-input"
          @keyup.enter="handleJoin"
          @input="roomInput = roomInput.replace(/\D/g, '').slice(0, 6)"
          inputmode="numeric"
          pattern="[0-9]*"
        >
        <button class="action-btn primary online-primary" @click="handleJoin" :disabled="roomInput.length !== 6">
          ▶ 创建 / 加入房间
        </button>
        <div class="stats-row">
          <div class="stat">
            <span class="stat-k">在线玩家</span>
            <span class="stat-v online-v">{{ lobbyStats.onlinePlayers }}</span>
          </div>
          <div class="stat rooms-stat">
            <span class="stat-k">空闲房间</span>
            <div v-if="lobbyStats.idleRooms.length > 0" class="room-tags">
              <span v-for="code in lobbyStats.idleRooms" :key="code" class="room-tag" @click="roomInput = code; handleJoin()">{{ code }}</span>
            </div>
            <span v-else class="stat-v dim">无</span>
          </div>
        </div>
      </div>

      <!-- Rules -->
      <div class="panel online-accent">
        <div class="panel-label">RULES</div>
        <ol class="rules-list">
          <li>红蓝双方各控一组方块，两组前进方向永远相反</li>
          <li>限时模式：时间结束后分高者胜</li>
          <li>积分模式：先达目标分者胜</li>
          <li>方块堵塞刷新区时，按当前分数判输赢</li>
          <li>方块落在棋盘边缘得 <b>5</b> 分</li>
          <li>填满 8/10/12/16 格区域额外得 <b>10/15/20/30</b> 分</li>
        </ol>
      </div>

      <!-- History -->
      <div class="action-group">
        <button class="action-btn secondary" @click="showHistoryModal = true">📜 历史对局</button>
      </div>

      <!-- History Modal -->
      <div v-if="showHistoryModal" class="modal-overlay" @click.self="showHistoryModal = false">
        <div class="modal online-modal">
          <div class="modal-top">
            <span class="modal-tag online">HISTORY</span>
            <span class="modal-heading">历史对局</span>
            <button class="x-btn" @click="showHistoryModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="matchHistory.length === 0" class="empty-tip">暂无记录</div>
            <div v-else v-for="(m, i) in matchHistory" :key="i" class="hcard">
              <div class="hcard-top">
                <span class="hcard-time">{{ formatTime(m.time) }}</span>
                <span class="hcard-mode">{{ m.mode === 'time' ? '限时' : '积分' }}</span>
                <span class="hcard-result" :class="m.winner==='Red'?'c-red':m.winner==='Blue'?'c-blue':'c-draw'">
                  {{ m.winner==='Red'?'红胜':m.winner==='Blue'?'蓝胜':'平局' }}
                </span>
              </div>
              <div class="hcard-main">
                <div class="hside left" :class="{win: m.winner==='Red'}">
                  <div class="hside-info">
                    <span class="hdot red"></span>
                    <span v-if="m.surrender?.by==='Red'" class="stag">{{ m.surrender.type==='disconnect'?'逃跑':'认输' }}</span>
                    <span class="hname">{{ m.redPlayer }}</span>
                  </div>
                  <span class="hscore" :class="{win: m.winner==='Red'}">{{ m.redScore }}</span>
                </div>
                <span class="hvs">VS</span>
                <div class="hside right" :class="{win: m.winner==='Blue'}">
                  <span class="hscore" :class="{win: m.winner==='Blue'}">{{ m.blueScore }}</span>
                  <div class="hside-info">
                    <span class="hname">{{ m.bluePlayer }}</span>
                    <span v-if="m.surrender?.by==='Blue'" class="stag">{{ m.surrender.type==='disconnect'?'逃跑':'认输' }}</span>
                    <span class="hdot blue"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══ Room Matched ═══ -->
    <template v-else>

      <div class="hero">
        <div class="hero-tag online">[ ROOM ]</div>
        <h1 class="hero-title room-code-display">{{ currentRoom }}</h1>
        <div class="role-chip" :class="isHost ? 'chip-red' : 'chip-blue'">
          {{ isHost ? '🔴 红方（房主）' : '🔵 蓝方（访客）' }}
          <span class="chip-name">{{ playerName }}</span>
        </div>
      </div>

      <!-- Host Settings -->
      <div v-if="isHost" class="panel online-accent">
        <div class="panel-label">GAME SETTINGS</div>
        <div class="setting-row">
          <label class="radio-opt" :class="{ active: mode==='time' }">
            <input type="radio" value="time" v-model="mode" @change="syncSettings"> 限时
            <span v-if="mode==='time'" class="board-hint">棋盘 {{ computedBoardSize }}×{{ computedBoardSize }}</span>
          </label>
          <select v-model.number="timeValue" :disabled="mode!=='time'" @change="syncSettings" class="sel">
            <option v-for="n in [1,2,3,4,5]" :key="n" :value="n">{{ n }} 分钟</option>
          </select>
        </div>
        <div class="setting-row">
          <label class="radio-opt" :class="{ active: mode==='score' }">
            <input type="radio" value="score" v-model="mode" @change="syncSettings"> 积分
            <span v-if="mode==='score'" class="board-hint">棋盘 {{ computedBoardSize }}×{{ computedBoardSize }}</span>
          </label>
          <select v-model.number="scoreValue" :disabled="mode!=='score'" @change="syncSettings" class="sel">
            <option v-for="v in [50,100,150,200,250,300,350,400,450,500]" :key="v" :value="v">{{ v }} 分</option>
          </select>
        </div>
        <div class="speed-row">
          <span class="speed-label">速度</span>
          <div class="speed-chips">
            <label v-for="s in [1,1.5,2]" :key="s" class="speed-chip" :class="{active: speedValue===s}">
              <input type="radio" :value="s" v-model.number="speedValue" @change="syncSettings">{{ s }}×
            </label>
          </div>
        </div>
        <div class="start-area">
          <p v-if="gameState.playerCount < 2" class="wait-hint">⏳ 等待对手加入… ({{ gameState.playerCount }}/2)</p>
          <template v-else>
            <p v-if="!isGuestReady" class="wait-hint">⏳ 等待蓝方准备…</p>
            <button class="action-btn primary online-primary" @click="handleStart" :disabled="!isGuestReady">▶ 开始游戏</button>
          </template>
        </div>
      </div>

      <!-- Guest Config -->
      <div v-else class="panel online-accent">
        <div class="panel-label">GAME CONFIG</div>
        <div class="config-grid">
          <div class="cfg-item"><span class="cfg-k">模式</span><span class="cfg-v">{{ mode==='time'?'限时':'积分' }}</span></div>
          <div class="cfg-item"><span class="cfg-k">目标</span><span class="cfg-v">{{ mode==='time'?timeValue+' 分钟':scoreValue+' 分' }}</span></div>
          <div class="cfg-item"><span class="cfg-k">速度</span><span class="cfg-v">{{ gameState.config?.speed||1 }}×</span></div>
          <div class="cfg-item"><span class="cfg-k">棋盘</span><span class="cfg-v">{{ computedBoardSize }}×{{ computedBoardSize }}</span></div>
          <div class="cfg-item"><span class="cfg-k">玩家</span><span class="cfg-v">{{ gameState.playerCount }}/2</span></div>
        </div>
        <button class="action-btn primary" :class="isGuestReady ? 'cancel-btn' : 'online-primary'" @click="toggleReady">
          {{ isGuestReady ? '✓ 已准备 — 取消' : '准备' }}
        </button>
      </div>

      <!-- Chat -->
      <div class="panel online-accent chat-panel">
        <div class="panel-label">QUICK CHAT</div>
        <div class="quick-chat">
          <button v-for="msg in ['准备','开始','干的漂亮','精彩的对决','新年快乐']" :key="msg"
            class="chat-chip" @click="sendQuickChat(msg)">{{ msg }}</button>
        </div>
        <div v-if="chatMessages.length" class="chat-log" ref="chatContainer">
          <div v-for="(m, i) in chatMessages" :key="i" class="chat-msg">
            <span class="chat-time">{{ formatChatTime(m.time) }}</span>
            <span :class="getChatColorClass(m.color)">{{ m.name }}</span>
            <span :class="{'sys-text': m.color==='system'}">: {{ m.text }}</span>
          </div>
        </div>
      </div>

    </template>
    </div><!-- /.scaler -->
  </div><!-- /.viewport -->
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue';
import { useSocket } from '../composables/useSocket';
import { useViewportScale } from '../composables/useViewportScale';

defineEmits(['back']);
const {
  startGame, joinRoom, updateSettings, currentRoom, isHost,
  gameState, playerName, sendQuickChat, chatMessages,
  matchHistory, lobbyStats, leaveRoom, toggleReady
} = useSocket();

const scalerEl = ref(null);
const { scale, recompute } = useViewportScale(scalerEl);

const roomInput        = ref('');
const showHistoryModal = ref(false);
const mode             = ref('score');
const timeValue        = ref(3);
const scoreValue       = ref(200);
const speedValue       = ref(1);
const chatContainer    = ref(null);

watch(currentRoom, (r) => {
  if (r && r.startsWith('SOLO')) { speedValue.value = 1.5; syncSettings(); }
}, { immediate: true });

const isGuestReady = computed(() => {
  if (!gameState.players) return false;
  const g = Object.values(gameState.players).find(p => p.color === 'blue');
  return g ? g.isReady : false;
});
const computedBoardSize = computed(() => {
  if (mode.value === 'time'  && timeValue.value  <= 3) return 20;
  if (mode.value === 'score' && scoreValue.value  < 200) return 20;
  return 40;
});

watch(() => gameState.config, (c) => {
  if (c && !isHost.value) {
    mode.value = c.mode;
    if (c.mode === 'time') timeValue.value = Math.floor(c.value / 60) || 1;
    else scoreValue.value = c.value;
  }
}, { deep: true });

watch(() => chatMessages.length, async () => {
  await nextTick();
  if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
});

const handleJoin = () => { if (roomInput.value.length === 6) joinRoom(roomInput.value); };
const syncSettings = () => {
  if (isHost.value) {
    const value = mode.value === 'time' ? timeValue.value * 60 : scoreValue.value;
    updateSettings({ mode: mode.value, value, speed: speedValue.value });
  }
};
const handleStart = () => {
  const value = mode.value === 'time' ? timeValue.value * 60 : scoreValue.value;
  startGame({ mode: mode.value, value, speed: speedValue.value });
};
const handleLeaveConfirm = () => leaveRoom();

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};
const formatChatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
};
const getChatColorClass = (c) => c==='red'?'h-red':c==='blue'?'h-blue':'h-sys';
</script>

<style scoped>
/* Shared Design System — mirrors SinglePlayerLobby.vue */

.page {
  min-height:100vh; min-height:100svh;
  display:flex; flex-direction:column; align-items:center;
  justify-content:flex-start;
  gap:20px; padding:24px 16px 40px;
  box-sizing:border-box; overflow-y:auto;
  background-color:#050505;
  background-image:
    linear-gradient(rgba(0,255,255,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,255,.03) 1px, transparent 1px);
  background-size:30px 30px;
  color:#ececec; position:relative;
}
.page::before {
  content:''; position:fixed; inset:0;
  background:radial-gradient(ellipse at 50% 35%, transparent 25%, rgba(0,0,0,.85) 100%);
  pointer-events:none; z-index:0;
}
.page > * { position:relative; z-index:1; width:100%; max-width:420px; }

/* Top Bar */
.top-bar {
  display:flex;
  align-items:center;
  width:100%;
  max-width:420px;
  padding-bottom:4px;
  position:relative; z-index:1;
}
.back-btn {
  background:#111; border:3px solid #333; color:#666;
  font-family:inherit; font-size:.75em; padding:6px 16px;
  cursor:pointer; text-transform:uppercase; letter-spacing:.08em;
  box-shadow:3px 3px 0 #000; transition:all .1s;
}
.back-btn:hover  { border-color:#4dabf7; color:#4dabf7; background:#0a0e1a; }
.back-btn:active { transform:translate(2px,2px); box-shadow:1px 1px 0 #000; }

/* Hero */
.hero { text-align:center; animation:fadeDown .5s ease-out both; display:flex; flex-direction:column; align-items:center; gap:8px; }
.hero-tag {
  display:inline-block; font-size:.68em; letter-spacing:.22em;
  padding:3px 14px; border:2px solid;
}
.hero-tag.online { color:#4dabf7; border-color:#4dabf7; background:rgba(77,171,247,.07); }
.hero-title {
  margin:0;
  font-size:clamp(1.5rem, 4.5vw, 2.2rem); color:#fff;
  text-shadow:3px 3px 0 #001a44, 6px 6px 0 rgba(0,30,100,.25);
  text-transform:uppercase; letter-spacing:.1em;
}
.room-code-display { letter-spacing:.25em; font-size:clamp(1.8rem,6vw,2.8rem); }
.hero-sub { font-size:.82em; color:#555; letter-spacing:.08em; }
.role-chip {
  font-size:.8em; padding:5px 14px; border:2px solid;
  display:flex; align-items:center; gap:8px;
}
.chip-red  { color:#ff6b6b; border-color:#ff6b6b; background:rgba(255,107,107,.07); }
.chip-blue { color:#4dabf7; border-color:#4dabf7; background:rgba(77,171,247,.07); }
.chip-name { font-weight:700; color:#fff; }

/* Panel */
.panel {
  background:#0c0c0c; border:3px solid #1e1e1e; border-top:5px solid;
  padding:16px; box-shadow:6px 6px 0 #000;
  display:flex; flex-direction:column; gap:10px;
  animation:fadeUp .5s .05s ease-out both;
}
.online-accent { border-top-color:#4dabf7; }
.panel-label { font-size:.62em; letter-spacing:.2em; }
.online-accent .panel-label { color:#4dabf7; }

/* Room Input */
.room-input {
  font-size:1.6em; padding:10px 12px; width:100%;
  text-align:center; background:#000; border:3px solid #222;
  color:#4dabf7; box-sizing:border-box; text-transform:uppercase;
  letter-spacing:.18em; font-family:inherit; transition:border-color .1s;
}
.room-input:focus { outline:none; border-color:#4dabf7; box-shadow:0 0 8px rgba(77,171,247,.2); }

/* Stats */
.stats-row { display:flex; flex-direction:column; gap:8px; }
.stat { display:flex; justify-content:space-between; align-items:center; font-size:.85em; }
.stat-k { color:#444; letter-spacing:.05em; }
.stat-v { font-weight:700; }
.online-v { color:#4dabf7; }
.stat-v.dim { color:#333; font-weight:normal; }
.rooms-stat { flex-direction:column; align-items:flex-start; gap:6px; }
.room-tags { display:flex; flex-wrap:wrap; gap:6px; }
.room-tag {
  background:#111; border:2px solid #222; color:#555;
  padding:2px 10px; font-family:monospace; cursor:pointer; font-size:.85em;
  letter-spacing:.1em; transition:all .15s;
}
.room-tag:hover { border-color:#4dabf7; color:#4dabf7; }

/* Rules */
.rules-list {
  margin:0; padding-left:0; list-style:none;
  color:#777; font-size:.82em; line-height:1.85;
  counter-reset:rule;
}
.rules-list li { counter-increment:rule; position:relative; padding-left:2.2em; margin-bottom:2px; }
.rules-list li::before { content:counter(rule,decimal-leading-zero)'.'; position:absolute; left:0; color:#1a3a5a; }
.rules-list b { color:#4dabf7; }

/* Action */
.action-group { display:flex; flex-direction:column; gap:10px; animation:fadeUp .5s .12s ease-out both; }
.action-btn {
  width:100%; padding:13px; font-size:.95em; font-family:inherit;
  text-transform:uppercase; letter-spacing:.08em; color:#fff;
  border:3px solid; cursor:pointer; transition:all .1s;
}
.action-btn.primary.online-primary {
  background:#003d80; border-color:#4dabf7;
  box-shadow:0 0 0 1px #001a44, 5px 5px 0 #001133;
}
.action-btn.primary.online-primary:hover  { background:#0066cc; border-color:#aaddff; box-shadow:0 0 14px rgba(77,171,247,.3), 5px 5px 0 #002244; }
.action-btn.primary.online-primary:active { transform:translate(3px,3px); box-shadow:1px 1px 0 #001133; }
.action-btn.primary.online-primary:disabled { background:#111; border-color:#222; box-shadow:none; color:#333; cursor:not-allowed; transform:none; }
.cancel-btn { background:#2a0000; border-color:#cc2222; box-shadow:5px 5px 0 #660000; color:#ff8888; }
.cancel-btn:hover { background:#cc2222; color:#fff; }
.action-btn.secondary { background:#111; border-color:#2a2a2a; box-shadow:4px 4px 0 #000; color:#666; }
.action-btn.secondary:hover  { background:#1e1e1e; border-color:#555; color:#ccc; }
.action-btn.secondary:active { transform:translate(2px,2px); box-shadow:2px 2px 0 #000; }

/* Settings */
.setting-row { display:flex; justify-content:space-between; align-items:center; background:#000; border:2px solid #1a1a1a; padding:8px 12px; }
.radio-opt { display:flex; align-items:center; gap:8px; cursor:pointer; color:#555; font-size:.9em; transition:color .1s; }
.radio-opt.active { color:#4dabf7; }
.board-hint { font-size:.72em; color:#2a2a2a; }
.sel { background:#111; border:2px solid #2a2a2a; color:#aaa; padding:5px 8px; font-family:inherit; font-size:.85em; cursor:pointer; }
.sel:focus { outline:none; border-color:#4dabf7; }

.speed-row { display:flex; align-items:center; gap:12px; background:#000; border:2px solid #1a1a1a; padding:8px 12px; }
.speed-label { font-size:.82em; color:#444; white-space:nowrap; }
.speed-chips { display:flex; gap:8px; flex:1; }
.speed-chip { flex:1; text-align:center; padding:6px 4px; font-size:.8em; background:#111; border:2px solid #1e1e1e; color:#444; cursor:pointer; transition:all .1s; }
.speed-chip.active { border-color:#4dabf7; color:#4dabf7; background:#001a33; }
.speed-chip input { display:none; }

.start-area { display:flex; flex-direction:column; gap:8px; }
.wait-hint { margin:0; font-size:.82em; color:#444; letter-spacing:.05em; animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }

/* Guest Config */
.config-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.cfg-item { display:flex; justify-content:space-between; align-items:center; background:#000; border:1px solid #1a1a1a; padding:7px 10px; font-size:.82em; }
.cfg-k { color:#444; }
.cfg-v { color:#4dabf7; font-weight:700; }

/* Chat */
.chat-panel { animation-delay:.18s; }
.quick-chat { display:flex; flex-wrap:wrap; gap:8px; }
.chat-chip { background:#111; border:2px solid #1e1e1e; color:#444; font-size:.75em; padding:5px 10px; cursor:pointer; font-family:inherit; transition:all .1s; }
.chat-chip:hover  { border-color:#4dabf7; color:#4dabf7; }
.chat-chip:active { transform:translate(1px,1px); }
.chat-log {
  background:#080808; border:1px solid #1a1a1a; border-left:3px solid #1a3a5a;
  padding:8px 10px; max-height:120px; overflow-y:auto;
  display:flex; flex-direction:column; gap:3px;
}
.chat-msg { font-size:.78em; color:#444; display:flex; gap:5px; align-items:baseline; }
.chat-time { color:#222; font-family:monospace; font-size:.9em; flex-shrink:0; }
.h-red  { color:#ff6b6b; font-weight:700; }
.h-blue { color:#4dabf7; font-weight:700; }
.h-sys  { color:#555;    font-weight:700; }
.sys-text { color:#333; }

/* Modal */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.9); display:flex; align-items:center; justify-content:center; z-index:1000; }
.modal {
  background:#0e0e0e; border:3px solid #222; border-top:5px solid;
  width:90%; max-width:440px; max-height:88vh; overflow-y:auto;
  box-shadow:8px 8px 0 #000; animation:fadeUp .2s ease-out;
  display:flex; flex-direction:column;
}
.online-modal { border-top-color:#4dabf7; }
.modal-top { display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:2px solid #1a1a1a; flex-shrink:0; }
.modal-tag { font-size:.6em; letter-spacing:.18em; padding:2px 8px; border:2px solid; flex-shrink:0; }
.modal-tag.online { color:#4dabf7; border-color:#4dabf7; background:rgba(77,171,247,.06); }
.modal-heading { flex:1; font-size:1em; color:#ccc; letter-spacing:.05em; }
.x-btn { background:transparent; border:2px solid #2a2a2a; color:#555; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:.95em; transition:all .1s; flex-shrink:0; }
.x-btn:hover { border-color:#cc2222; color:#ff6666; }

.modal-body { display:flex; flex-direction:column; gap:6px; padding:10px; overflow-y:auto; flex:1; }
.empty-tip { text-align:center; color:#444; padding:24px; font-size:.85em; }

/* History Cards */
.hcard { background:#0a0a0a; border:1px solid #1a1a1a; padding:8px 10px; display:flex; flex-direction:column; gap:5px; }
.hcard-top { display:flex; align-items:center; gap:8px; font-size:.72em; color:#444; }
.hcard-time { flex:1; font-family:monospace; }
.hcard-mode { background:#1a1a1a; padding:1px 6px; color:#444; }
.hcard-result { font-weight:700; }
.c-red{color:#ff6b6b;} .c-blue{color:#4dabf7;} .c-draw{color:#555;}
.hcard-main { display:flex; align-items:center; justify-content:space-between; }
.hside { flex:1; display:flex; align-items:center; gap:6px; font-size:.85em; color:#444; }
.hside.left  { justify-content:flex-start; }
.hside.right { justify-content:flex-end; }
.hside.win   { color:#bbb; font-weight:700; }
.hside-info  { display:flex; align-items:center; gap:4px; }
.hname { font-size:.85em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70px; color:#777; }
.hscore { font-size:1.2em; font-weight:700; font-family:monospace; color:#444; }
.hscore.win { color:#ccc; }
.hvs { font-weight:900; color:#1a1a1a; font-style:italic; margin:0 8px; }
.hdot { width:8px; height:8px; border-radius:0; flex-shrink:0; }
.hdot.red{background:#ff6b6b;} .hdot.blue{background:#4dabf7;}
.stag { font-size:.7em; background:#1a1a1a; color:#555; padding:1px 4px; border:1px solid #2a2a2a; }

@keyframes fadeDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:none} }
@keyframes fadeUp   { from{opacity:0;transform:translateY(12px)}  to{opacity:1;transform:none} }

@media (max-width:480px) {
  .page { padding:60px 10px 32px; gap:14px; }
  .hero-title { font-size:1.4rem; }
  .room-code-display { font-size:2rem; }
  .rules-list { font-size:.74em; }
  .action-btn { font-size:.85em; padding:11px; }
  .config-grid { grid-template-columns:1fr; }
  .chat-chip { font-size:.68em; }
}
</style>
