// Configuration et UI
export const PLAYER_COLORS = [
  { name: 'Rouge', hex: 0xef4444, cssClass: 'color-red' },
  { name: 'Jaune', hex: 0xfbbf24, cssClass: 'color-yellow' },
  { name: 'Vert', hex: 0x22c55e, cssClass: 'color-green' },
  { name: 'Bleu', hex: 0x3b82f6, cssClass: 'color-blue' },
  { name: 'Violet', hex: 0xa855f7, cssClass: 'color-violet' },
  { name: 'Orange', hex: 0xf97316, cssClass: 'color-orange' },
  { name: 'Rose', hex: 0xec4899, cssClass: 'color-pink' },
  { name: 'Cyan', hex: 0x06b6d4, cssClass: 'color-cyan' }
];

export let gameConfig = {
  numPlayers: 4,
  pawnsPerPlayer: 4,
  pathLength: 5
};

export function setupConfigUI() {
  const playerOptions = document.querySelectorAll('.player-option');
  playerOptions.forEach(option => {
    option.addEventListener('click', () => {
      playerOptions.forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      gameConfig.numPlayers = parseInt(option.dataset.players);
    });
  });

  document.getElementById('pawnsSlider').addEventListener('input', (e) => {
    gameConfig.pawnsPerPlayer = parseInt(e.target.value);
    document.getElementById('pawnsValue').textContent = e.target.value;
  });

  document.getElementById('pathSlider').addEventListener('input', (e) => {
    gameConfig.pathLength = parseInt(e.target.value);
    document.getElementById('pathValue').textContent = e.target.value;
  });

  document.getElementById('startGameBtn').addEventListener('click', () => {
    document.getElementById('configOverlay').classList.add('hidden');
    document.getElementById('container').classList.add('visible');
    // Déclencheur d'événement pour initialiser le jeu
    document.dispatchEvent(new CustomEvent('startGame'));
  });

  document.getElementById('reconfigBtn').addEventListener('click', () => {
    location.reload();
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('resetView'));
  });

  document.getElementById('diceBtn').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('rollDice'));
  });
}