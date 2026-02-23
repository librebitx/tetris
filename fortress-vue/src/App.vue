<template>
  <Splash v-if="currentView === 'splash'" @done="currentView = 'modeSelect'" />
  <ModeSelect v-else-if="currentView === 'modeSelect'" @selectMode="handleModeSelect" />
  <template v-else>
    <Lobby v-if="currentView === 'multiplayer' && !showGame" @back="currentView = 'modeSelect'" />
    <SinglePlayerLobby v-else-if="currentView === 'singleplayer' && !showGame" @back="currentView = 'modeSelect'" />
    <Game v-else />
  </template>

  <!-- Global Toast Notification -->
  <Transition name="toast-fade">
    <div v-if="toastMessage" class="global-toast">
      {{ toastMessage }}
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Splash from './components/Splash.vue';
import ModeSelect from './components/ModeSelect.vue';
import Lobby from './components/Lobby.vue';
import SinglePlayerLobby from './components/SinglePlayerLobby.vue';
import Game from './components/Game.vue';
import { useSocket } from './composables/useSocket';

const currentView = ref('splash'); // 'splash', 'modeSelect', 'multiplayer'

const handleModeSelect = (mode) => {
  currentView.value = mode;
};

const { initSocket, gameState, currentRoom, toastMessage } = useSocket();

onMounted(() => {
  initSocket();
});

const showGame = computed(() => {
  return currentRoom.value && gameState.config && (gameState.config.active || gameState.config.winner);
});
</script>

<style>
/* Global Font Inheritance */
button, input, select, textarea {
  font-family: inherit;
}

/* Global Toast Styles - Retro Arcade Version */
.global-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #000;
  color: #00ffff; /* Retro terminal green */
  padding: 12px 24px;
  border: 4px solid #00ffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  z-index: 10000;
  box-shadow: 4px 4px 0px rgba(0,255,255,0.3);
  pointer-events: none;
  text-transform: uppercase;
}

/* Toast Transitions */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.2s steps(4);
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
