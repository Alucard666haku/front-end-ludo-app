import { gameConfig, PLAYER_COLORS } from './config.js';
import { getPathTiles } from './board.js';
import { getPawns, getPlayerPawns, updatePawnPosition, setPawnAnimation } from './pawns.js';

let currentPlayerIndex = 0;
let diceValue = 0;
let gameState = 'waiting'; // waiting, rolled, moving

export function initGameLogic() {
  currentPlayerIndex = 0;
  diceValue = 0;
  gameState = 'waiting';
  updatePlayerTurn();
}

export function rollDice() {
  if (gameState !== 'waiting') return false;
  
  gameState = 'rolling';
  
  // Animation du dé
  let rolls = 0;
  const rollInterval = setInterval(() => {
    diceValue = Math.floor(Math.random() * 6) + 1;
    updateDiceDisplay(diceValue);
    rolls++;
    
    if (rolls >= 10) {
      clearInterval(rollInterval);
      gameState = 'rolled';
      showPawnSelector();
      return true;
    }
  }, 100);
  
  return false;
}

export function movePawn(pawnId) {
  if (gameState !== 'rolled') return;
  
  const pawn = getPawns().find(p => p.id === pawnId);
  if (!pawn) return;
  
  gameState = 'moving';
  hidePawnSelector();
  
  const pathTiles = getPathTiles();
  const playerTiles = pathTiles.filter(t => t.playerIndex === pawn.playerIndex);
  
  if (!pawn.inPlay && diceValue === 6) {
    // Sortir le pion
    if (playerTiles.length > 0) {
      const firstTile = playerTiles[0];
      animatePawnToTile(pawn, firstTile.position, () => {
        pawn.inPlay = true;
        pawn.currentTile = firstTile;
        pawn.pathProgress = 1;
        completeTurn();
      });
    } else {
      completeTurn();
    }
  } else if (pawn.inPlay) {
    // Avancer
    const currentIndex = pawn.currentTile ? 
      playerTiles.findIndex(t => t === pawn.currentTile) : 0;
    const newIndex = Math.min(currentIndex + diceValue, playerTiles.length - 1);
    const targetTile = playerTiles[newIndex];
    
    animatePawnToTile(pawn, targetTile.position, () => {
      pawn.currentTile = targetTile;
      pawn.pathProgress = newIndex + 1;
      completeTurn();
    });
  } else {
    // Ne peut pas bouger
    shakeDiceDisplay();
    completeTurn();
  }
}

function animatePawnToTile(pawn, targetPos, callback) {
  const startPos = { x: pawn.mesh.position.x, z: pawn.mesh.position.z };
  const startY = pawn.mesh.position.y;
  const jumpHeight = 2;
  const duration = 800;
  const startTime = Date.now();
  
  setPawnAnimation(pawn.id, true);
  
  function move() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    pawn.mesh.position.x = startPos.x + (targetPos.x - startPos.x) * easeProgress;
    pawn.mesh.position.z = startPos.z + (targetPos.z - startPos.z) * easeProgress;
    pawn.mesh.position.y = startY + Math.sin(easeProgress * Math.PI) * jumpHeight;

    if (progress < 1) {
      requestAnimationFrame(move);
    } else {
      pawn.mesh.position.y = startY;
      setPawnAnimation(pawn.id, false);
      if (callback) callback();
    }
  }
  move();
}

function showPawnSelector() {
  const selector = document.getElementById('pawnSelector');
  selector.innerHTML = '';
  
  const availablePawns = getPlayerPawns(currentPlayerIndex);
  
  availablePawns.forEach((pawn, index) => {
    const btn = document.createElement('button');
    btn.className = 'pawn-btn';
    btn.style.background = `linear-gradient(135deg, ${rgbToHex(pawn.colorHex)} 0%, ${darkenColor(pawn.colorHex)} 100%)`;
    btn.textContent = `P${index + 1}`;
    btn.addEventListener('click', () => movePawn(pawn.id));
    selector.appendChild(btn);
  });
}

function hidePawnSelector() {
  document.getElementById('pawnSelector').innerHTML = '';
}

function completeTurn() {
  if (diceValue !== 6) {
    currentPlayerIndex = (currentPlayerIndex + 1) % gameConfig.numPlayers;
  }
  
  updatePlayerTurn();
  resetDice();
  gameState = 'waiting';
}

export function updatePlayerTurn() {
  const currentPlayer = PLAYER_COLORS[currentPlayerIndex];
  const playerSpan = document.getElementById('currentPlayer');
  playerSpan.textContent = currentPlayer.name;
  playerSpan.className = currentPlayer.cssClass;
}

function updateDiceDisplay(value) {
  document.getElementById('diceValue').textContent = value;
}

function resetDice() {
  diceValue = 0;
  document.getElementById('diceValue').textContent = '-';
}

function shakeDiceDisplay() {
  const diceDisplay = document.getElementById('diceValue');
  diceDisplay.classList.add('shake');
  setTimeout(() => diceDisplay.classList.remove('shake'), 300);
}

export function getCurrentPlayer() {
  return currentPlayerIndex;
}

export function getGameState() {
  return gameState;
}

// Fonctions utilitaires (à déplacer dans utils.js plus tard)
function rgbToHex(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}

function darkenColor(hex) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return '#' + ((r * 0.7) << 16 | (g * 0.7) << 8 | (b * 0.7)).toString(16).padStart(6, '0');
}