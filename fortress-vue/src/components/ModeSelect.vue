<template>
  <div class="mode-select-container">

    <!-- Title Section -->
    <div class="title-section">
      <div class="title-deco-row">
        <span class="deco-line"></span>
        <h1 class="main-title">Fortress Battle</h1>
        <span class="deco-line"></span>
      </div>
      <p class="subtitle">选择游戏模式</p>
    </div>

    <!-- Mode Cards -->
    <div class="modes-wrapper">

      <!-- Single Player -->
      <div class="mode-card single-player" @click="selectSinglePlayer">
        <div class="card-accent-bar solo-bar"></div>
        <div class="card-body">
          <div class="card-icon">👤</div>
          <div class="card-mode-tag solo-tag">[ SOLO ]</div>
          <h2 class="card-title">单人模式</h2>
          <p class="card-desc">独自挑战限时赛，刷新个人最高分</p>
          <div class="card-stats">
            <span class="stat">⏱ 5 分钟</span>
            <span class="stat">👤 1 人</span>
          </div>
        </div>
      </div>

      <!-- Multiplayer -->
      <div class="mode-card multiplayer" @click="selectMultiplayer">
        <div class="card-accent-bar multi-bar"></div>
        <div class="card-body">
          <div class="card-icon">🌐</div>
          <div class="card-mode-tag multi-tag">[ ONLINE ]</div>
          <h2 class="card-title">联机模式</h2>
          <p class="card-desc">与好友在线对战，争夺领土控制权</p>
          <div class="card-stats">
            <span class="stat">🌐 2 人对战</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useSocket } from '../composables/useSocket';

const emit = defineEmits(['selectMode']);
const { showToast } = useSocket();

const selectSinglePlayer = () => {
  emit('selectMode', 'singleplayer');
};

const selectMultiplayer = () => {
  emit('selectMode', 'multiplayer');
};
</script>

<style scoped>
/* ── Container ── */
.mode-select-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100svh;
  overflow-y: auto;
  background-color: #050505;
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 30px 30px;
  color: white;
  padding: 2rem 1rem;
  box-sizing: border-box;
  position: relative;
}
.mode-select-container::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 100%);
  pointer-events: none;
  z-index: 0;
}

/* ── Title ── */
.title-section {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-bottom: 3.5rem;
  animation: fadeInDown 0.6s ease-out both;
}

.title-deco-row {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
  margin-bottom: 12px;
}

.deco-line {
  flex: 1;
  max-width: 80px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #ffff00);
}
.deco-line:last-child {
  background: linear-gradient(90deg, #ffff00, transparent);
}

.main-title {
  font-size: clamp(1.4rem, 4vw, 2.4rem);
  margin: 0;
  color: #ffff00;
  text-shadow:
    3px 3px 0 #cc0000,
    6px 6px 0 rgba(204,0,0,0.3);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.subtitle {
  font-size: clamp(0.8rem, 2.5vw, 1rem);
  color: #00ffff;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}
.subtitle::after {
  content: '▌';
  animation: blink 1s step-end infinite;
  margin-left: 4px;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ── Cards Wrapper ── */
.modes-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 2.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* ── Mode Card ── */
.mode-card {
  position: relative;
  background: #111;
  border: 4px solid #333;
  width: 260px;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s, border-color 0.15s;
  box-shadow: 8px 8px 0 #000;
  animation: fadeInUp 0.6s ease-out both;
  display: flex;
  flex-direction: column;
}

.mode-card:active {
  transform: translate(4px, 4px);
  box-shadow: 2px 2px 0 #000;
}

/* ── Accent Bar (top strip) ── */
.card-accent-bar {
  height: 6px;
  width: 100%;
  flex-shrink: 0;
}
.solo-bar  { background: linear-gradient(90deg, #00aa33, #00ff55); }
.multi-bar { background: linear-gradient(90deg, #0077bb, #00ffff); }

/* ── Card Body ── */
.card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.4rem 1.4rem;
  gap: 8px;
  flex: 1;
}

.card-icon {
  font-size: 3.8rem;
  line-height: 1;
}

/* ── Mode Tag ── */
.card-mode-tag {
  font-size: 0.7em;
  padding: 2px 10px;
  border: 2px solid;
  letter-spacing: 0.15em;
  font-weight: 700;
}
.solo-tag  { color: #00cc44; border-color: #00cc44; background: rgba(0,204,68,0.08); }
.multi-tag { color: #00ccff; border-color: #00ccff; background: rgba(0,204,255,0.08); }

.card-title {
  font-size: 1.4rem;
  margin: 4px 0 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.single-player .card-title { color: #00ee55; }
.multiplayer   .card-title { color: #00ccff; }

.card-desc {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
  line-height: 1.5;
  text-align: center;
}

/* ── Stats ── */
.card-stats {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 4px;
}
.stat {
  font-size: 0.78em;
  color: #555;
  letter-spacing: 0.04em;
}

/* ── Card Hover ── */
.single-player:hover {
  border-color: #00cc44;
  transform: translate(-4px, -4px);
  box-shadow: 12px 12px 0 #001a00;
}
.single-player:hover .card-enter-btn {
  background: #00cc44;
  color: #000;
}

.multiplayer:hover {
  border-color: #00ccff;
  transform: translate(-4px, -4px);
  box-shadow: 12px 12px 0 #001a33;
}
.multiplayer:hover .card-enter-btn {
  background: #00ccff;
  color: #000;
}

/* ── Animations ── */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ── */
@media (max-width: 600px) {
  .modes-wrapper {
    flex-direction: column;
    gap: 1.4rem;
  }
  .mode-card {
    width: 88%;
    max-width: 320px;
  }
  .main-title {
    white-space: normal;
    font-size: 1.3rem;
  }
  .title-section {
    margin-bottom: 2rem;
  }
  .card-icon { font-size: 3rem; }
}

@media (max-width: 380px) {
  .card-title  { font-size: 1.1rem; }
  .card-desc   { font-size: 0.75rem; }
  .card-body   { padding: 1.4rem 1rem; }
}
</style>
