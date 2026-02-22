<template>
  <div class="mode-select-container">
    <div class="title-section">
      <h1 class="main-title">Tetris Fortress Battle</h1>
      <p class="subtitle">选择游戏模式</p>
    </div>

    <div class="modes-wrapper">
      <div class="mode-card single-player" @click="selectSinglePlayer">
        <div class="card-icon">👤</div>
        <h2 class="card-title">单人模式</h2>
        <p class="card-desc">独自挑战限时赛</p>
      </div>

      <div class="mode-card multiplayer" @click="selectMultiplayer">
        <div class="card-icon">🌐</div>
        <h2 class="card-title">联机模式</h2>
        <p class="card-desc">与好友在线对战</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
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
  background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.8) 100%);
  pointer-events: none;
  z-index: 0;
}
.title-section, .modes-wrapper {
  position: relative;
  z-index: 1;
}

.title-section {
  text-align: center;
  margin-bottom: 4rem;
  animation: fadeInDown 0.8s steps(4);
}

.main-title {
  font-size: 2.5rem;
  margin: 0;
  color: #ffff00; /* Arcade Yellow */
  text-shadow: 4px 4px 0px #ff0000; /* Blocky 8-bit shadow */
  text-transform: uppercase;
  letter-spacing: 2px;
}

.subtitle {
  font-size: 1rem;
  color: #00ffff; /* Terminal Green */
  margin-top: 1rem;
  text-transform: uppercase;
}

.modes-wrapper {
  display: flex;
  gap: 3rem;
  flex-wrap: wrap;
  justify-content: center;
}

.mode-card {
  position: relative;
  background: #111;
  border: 6px solid #444;
  width: 280px;
  padding: 3rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.1s;
  overflow: hidden;
  animation: fadeInUp 0.8s steps(4);
  box-shadow: 
    inset 4px 4px 0 #000,
    inset -4px -4px 0 #222,
    8px 8px 0 #000;
}

.mode-card::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  bottom: 4px;
  border: 2px dashed #333;
  pointer-events: none;
}

.mode-card:hover {
  transform: translate(-4px, -4px);
  background: #1a1a1a;
}

.mode-card:active {
  transform: translate(2px, 2px);
  box-shadow: 
    inset 4px 4px 0 #000,
    inset -4px -4px 0 #222,
    2px 2px 0 #000;
}

.card-icon {
  font-size: 4.5rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
  text-shadow: 4px 4px 0 #000;
}

.card-title {
  font-size: 1.5rem;
  margin: 0 0 0.8rem 0;
  color: #fff;
  position: relative;
  z-index: 2;
  text-transform: uppercase;
}

.card-desc {
  font-size: 1rem;
  color: #888;
  margin: 0;
  position: relative;
  z-index: 2;
  line-height: 1.4;
}

/* Specific Card Styles */
.multiplayer {
  border-color: #0088cc;
}
.multiplayer:hover {
  border-color: #00ffff;
  box-shadow: 
    inset 4px 4px 0 #000,
    inset -4px -4px 0 #222,
    12px 12px 0 #005580;
}
.multiplayer .card-title {
  color: #00ffff;
}

.single-player {
  border-color: #008800;
}
.single-player:hover {
  border-color: #00ffff;
  box-shadow: 
    inset 4px 4px 0 #000,
    inset -4px -4px 0 #222,
    12px 12px 0 #005500;
}
.single-player .card-title {
  color: #00ffff;
}

.coming-soon-badge {
  position: absolute;
  top: 1.5rem;
  right: -2rem;
  background-color: #dc2626;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.25rem 2.5rem;
  transform: rotate(45deg);
  z-index: 3;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

/* Animations */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 600px) {
  .modes-wrapper {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .mode-card {
    width: 90%;
    max-width: 320px;
    padding: 2rem 1rem;
  }

  .card-icon {
    font-size: 3rem;
  }

  .main-title {
    font-size: 1.6rem;
  }

  .title-section {
    margin-bottom: 2rem;
  }
}

@media (max-width: 380px) {
  .main-title { font-size: 1.2rem; }
  .subtitle { font-size: 0.75rem; }
  .card-title { font-size: 1.1rem; }
  .card-desc { font-size: 0.8rem; }
  .mode-card { padding: 1.5rem 0.8rem; }
}
</style>
