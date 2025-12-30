// ===== RÉFÉRENCES DOM =====
const board = document.getElementById('board');

// ===== FONCTION POUR CRÉER UNE CELLULE =====
function createCell(col, row, classes = '', content = '') {
  const cell = document.createElement('div');
  cell.className = `cell ${classes}`;
  cell.style.gridColumn = col;
  cell.style.gridRow = row;
  if (content) cell.innerHTML = content;
  return cell;
}

// ===== FONCTION POUR CRÉER UNE BASE =====
function createBase(color) {
  const base = document.createElement('div');
  base.className = `base base-${color}`;
  
  const inner = document.createElement('div');
  inner.className = 'base-inner';
  
  for (let i = 0; i < 4; i++) {
    const spawn = document.createElement('div');
    spawn.className = 'spawn';
    inner.appendChild(spawn);
  }
  
  base.appendChild(inner);
  return base;
}

// ===== CRÉATION DES 4 BASES =====
board.appendChild(createBase('red'));
board.appendChild(createBase('yellow'));
board.appendChild(createBase('green'));
board.appendChild(createBase('blue'));

// ===== CRÉATION DU CENTRE =====
const center = document.createElement('div');
center.className = 'center';
center.innerHTML = `
  <div class="tri red"></div>
  <div class="tri yellow"></div>
  <div class="tri green"></div>
  <div class="tri blue"></div>
  <div class="center-circle"></div>
`;
board.appendChild(center);

// ===== CHEMIN PRINCIPAL (52 cases) =====

// Haut vertical (colonne 7) - de haut en bas
for (let r = 1; r <= 6; r++) {
  let cls = r === 2 ? 'start entry-red' : '';
  board.appendChild(createCell(7, r, cls));
}

// Haut vertical (colonne 9) - de bas en haut  
for (let r = 6; r >= 1; r--) {
  board.appendChild(createCell(9, r));
}

// Haut horizontal (ligne 7) - vers la gauche
for (let c = 6; c >= 1; c--) {
  board.appendChild(createCell(c, 7));
}

// Haut horizontal (ligne 9) - vers la droite
for (let c = 1; c <= 6; c++) {
  let cls = c === 2 ? 'start entry-green' : '';
  board.appendChild(createCell(c, 9, cls));
}

// Bas vertical (colonne 7) - de haut en bas
for (let r = 10; r <= 15; r++) {
  board.appendChild(createCell(7, r));
}

// Bas vertical (colonne 9) - de bas en haut
for (let r = 15; r >= 10; r--) {
  let cls = r === 14 ? 'start entry-blue' : '';
  board.appendChild(createCell(9, r, cls));
}

// Bas horizontal (ligne 7) - vers la droite
for (let c = 10; c <= 15; c++) {
  let cls = c === 14 ? 'start entry-yellow' : '';
  board.appendChild(createCell(c, 7, cls));
}

// Bas horizontal (ligne 9) - vers la gauche
for (let c = 15; c >= 10; c--) {
  board.appendChild(createCell(c, 9));
}

// ===== COULOIRS COLORÉS VERS LE CENTRE =====

// Couloir ROUGE (ligne 8, de col 2 à 6)
for (let c = 2; c <= 6; c++) {
  board.appendChild(createCell(c, 8, 'lane-red'));
}

// Couloir JAUNE (ligne 8, de col 10 à 14)
for (let c = 10; c <= 14; c++) {
  board.appendChild(createCell(c, 8, 'lane-yellow'));
}

// Couloir VERT (colonne 8, de ligne 10 à 14)
for (let r = 10; r <= 14; r++) {
  board.appendChild(createCell(8, r, 'lane-green'));
}

// Couloir BLEU (colonne 8, de ligne 2 à 6)
for (let r = 2; r <= 6; r++) {
  board.appendChild(createCell(8, r, 'lane-blue'));
}

// Cases aux coins des couloirs
board.appendChild(createCell(1, 8));
board.appendChild(createCell(15, 8));
board.appendChild(createCell(8, 1));
board.appendChild(createCell(8, 15));

// ===== GESTION DES VUES =====
function setView(mode) {
  const container = document.getElementById('boardContainer');
  const btn2d = document.getElementById('btn2d');
  const btn25d = document.getElementById('btn25d');
  
  if (mode === '2d') {
    container.classList.remove('perspective-view');
    btn2d.classList.add('active');
    btn25d.classList.remove('active');
  } else {
    container.classList.add('perspective-view');
    btn25d.classList.add('active');
    btn2d.classList.remove('active');
  }
}
