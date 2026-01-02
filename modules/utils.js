// Fonctions utilitaires
export function rgbToHex(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}

export function darkenColor(hex) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return '#' + ((r * 0.7) << 16 | (g * 0.7) << 8 | (b * 0.7)).toString(16).padStart(6, '0');
}

export function calculatePositionOnCircle(radius, angle, centerX = 0, centerZ = 0) {
  return {
    x: centerX + Math.cos(angle) * radius,
    z: centerZ + Math.sin(angle) * radius
  };
}

export function getAngleForPlayer(playerIndex, numPlayers) {
  return (playerIndex * (Math.PI * 2) / numPlayers) - Math.PI / 2;
}