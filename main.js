// === AYARLAR ===
const BOARD_SIZE = 8;

// === GLOBAL STATE ===
let board = [];
let score = 0;
let highScore = 0;
let isGameOver = false;
let lastX = 0, lastY = 0;
let scorePopupActive = false;
let displayedScore = 0; 

// Seçili parça
let selectedPiece = null;   // DOM elemanı
let selectedShape = null;   // Matris (2D array)

// Seçili parçanın rengi (board'a yerleşince bu renk basılacak)
let selectedPieceColor = null;

// === TEMA SİSTEMİ ===
const THEMES = {
  classic: {
    name: 'Classic',
    colors: { red:'#ff4d4d', blue:'#4d7cff', green:'#42d67a', yellow:'#ffd24d', orange:'#ff8a4d', purple:'#b04dff' },
    boardBg: '#222', cellBorder: '#2a2a2a', glow: false,
  },
  pastel: {
    name: 'Pastel',
    colors: { red:'#ffb3b3', blue:'#b3ccff', green:'#b3f0cc', yellow:'#fff0b3', orange:'#ffd9b3', purple:'#dbb3ff' },
    boardBg: '#2a2635', cellBorder: '#3a3545', glow: false,
  },
  ocean: {
    name: 'Ocean',
    colors: { red:'#00b4d8', blue:'#0077b6', green:'#48cae4', yellow:'#90e0ef', orange:'#0096c7', purple:'#023e8a' },
    boardBg: '#012a3a', cellBorder: '#01354a', glow: false,
  },
  neon: {
    name: 'Neon',
    colors: { red:'#ff003c', blue:'#00cfff', green:'#00ff88', yellow:'#ffe600', orange:'#ff6600', purple:'#cc00ff' },
    boardBg: '#0a0a1a', cellBorder: '#1a1a3a', glow: true,
  },
  retro: {
    name: 'Retro',
    colors: { red:'#c0392b', blue:'#2471a3', green:'#1e8449', yellow:'#d4ac0d', orange:'#ca6f1e', purple:'#7d3c98' },
    boardBg: '#1a1a1a', cellBorder: '#333', glow: false,
  },
  galaxy: {
    name: 'Galaxy',
    colors: { red:'#e91e63', blue:'#2196f3', green:'#00bcd4', yellow:'#9c27b0', orange:'#7b2ff7', purple:'#3f51b5' },
    boardBg: '#0d0221', cellBorder: '#1a0a3a', glow: true,
  },
  lava: {
    name: 'Lava',
    colors: { red:'#ff1744', blue:'#ff3d00', green:'#ffea00', yellow:'#ff6d00', orange:'#dd2c00', purple:'#ff6f00' },
    boardBg: '#1a0800', cellBorder: '#2a1000', glow: false,
  },
  candy: {
    name: 'Candy',
    colors: { red:'#f48fb1', blue:'#ce93d8', green:'#80deea', yellow:'#a5d6a7', orange:'#fff59d', purple:'#ffcc80' },
    boardBg: '#1a1028', cellBorder: '#2a2038', glow: false,
  },
};

// Aktif tema
let activeTheme = 'classic';

function loadTheme() {
  const saved = localStorage.getItem('bp_theme') || 'classic';
  activeTheme = THEMES[saved] ? saved : 'classic';
  applyTheme(activeTheme);
}

function applyTheme(themeKey) {
  activeTheme = themeKey;
  localStorage.setItem('bp_theme', themeKey);
  const t = THEMES[themeKey];

  // Board arka plan ve hücre rengi
  const boardEl = document.getElementById('board');
  if (boardEl) {
    boardEl.style.background = t.boardBg;
  }

  // Glow efekti CSS class
  document.body.classList.toggle('theme-glow', !!t.glow);
  document.body.dataset.theme = themeKey;

  // Mevcut tahtayı yeniden çiz (renkleri güncelle)
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] && board[y][x].colorName) {
        board[y][x].color = t.colors[board[y][x].colorName] || board[y][x].color;
      }
    }
  }
  renderBoard();

  // Parçaları yeniden renklendir
  document.querySelectorAll('.piece').forEach(pieceEl => {
    const colorName = pieceEl.dataset.pieceColor;
    if (!colorName) return;
    const hex = colorToHex(colorName);
    pieceEl.querySelectorAll('.piece-cell.filled').forEach(cell => {
      cell.style.background = hex;
    });
  });
}

// Normal parçalar için renk paleti
const PIECE_COLORS = ['red','blue','green','yellow','orange','purple'];

function pickRandomPieceColor() {
  return PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)];
}

function colorToHex(name) {
  const t = THEMES[activeTheme] || THEMES.classic;
  return t.colors[name] || '#4a8';
}

// Power-up: Satır Sil
let clearRowCharges = 1;
let clearRowMode = false;

// Power-up: Parça Yenile
let rerollCharges = 1;

// Power-up: Undo
let undoCharges = 1;
let lastState = null;

// Satır/sütun temizleme serisi (art arda clear)
let clearStreak = 0;
let comboMovesLeft = 0;

// Drag & Drop
let isDragging = false;
let dragShape = null;
let dragPieceEl = null;
let dragPreviewEl = null;
let dragPointerId = null;
let dragLiftY = 0; // sadece mobilde kullanılacak

// Drag sırasında son geçerli ghost hücresi (bx, by)
let lastGhostCell = null;

// Sesler
let sndPlace = null;
let sndClear = null;
let sndCombo = null;
let sndGameOver = null;

// === PARÇA ŞEKİLLERİ ===
const PIECES = [
  // Küçük kare 2x2
  [
    [1,1],
    [1,1]
  ],

  // Tek kare
  [
    [1]
  ],

  // Yatay 3lü
  [
    [1,1,1]
  ],

  // Dikey 2li
  [
    [1],
    [1]
  ],

  // Dikey 3lü
  [
    [1],
    [1],
    [1]
  ],

  // Dikey 4lü
  [
    [1],
    [1],
    [1],
    [1]
  ],

  // Yatay 4lü
  [
    [1,1,1,1]
  ],

  // L şekli küçük
  [
    [1,0],
    [1,0],
    [1,1]
  ],

  // Büyük L
  [
    [1,0,0],
    [1,0,0],
    [1,1,1]
  ],

  // T şekli
  [
    [1,1,1],
    [0,1,0]
  ],

  // Uzun T
  [
    [1,1,1],
    [0,1,0],
    [0,1,0]
  ],

  // Artı şekli (+)
  [
    [0,1,0],
    [1,1,1],
    [0,1,0]
  ],

  // Z şekli (SATIR UZUNLUKLARI EŞİT!)
  [
    [1,1,0],
    [0,1,1]
  ],

  // Ters Z
  [
    [0,1,1],
    [1,1,0]
  ]
];

// === ELEMENT TİPLERİ ===
function getRandomElementType() {
  const r = Math.random();
  if (r < 0.07) return 'fire';   // %7 ateş
  if (r < 0.14) return 'water';  // %7 su
  return 'normal';               // %86 normal
}

function getColorForType(type) {
  switch (type) {
    case 'fire':
      return '#ff7043';
    case 'water':
      return '#42a5f5';
    default:
      return '#4a8';
  }
}

// === ŞEKLİN AĞIRLIK MERKEZİNİ HESAPLA ===
function getShapeCenter(shape) {
  const h = shape.length;
  const w = shape[0].length;

  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (shape[y][x] === 1) {
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }

  if (count === 0) {
    return {
      cx: Math.floor(w / 2),
      cy: Math.floor(h / 2)
    };
  }

  return {
    cx: Math.round(sumX / count),
    cy: Math.round(sumY / count)
  };
}

// === SKIN-AWARE GÖRSEL EFEKT SİSTEMİ ===

const SKIN_FX = {
  classic:{ flashClear:'white', flashCombo:'combo', flashGameover:'gameover', shakeStyle:'shake-big', particleShape:'circle', particleCount:8, particleDist:55, comboColor:'#ffeb3b', comboShadow:'0 0 20px #ff9800', comboPrefix:'COMBO' },
  pastel: { flashClear:'pastel', flashCombo:'pastel-combo', flashGameover:'pastel-gameover', shakeStyle:'shake-gentle', particleShape:'star', particleCount:10, particleDist:45, comboColor:'#f48fb1', comboShadow:'0 0 20px #ce93d8', comboPrefix:'✨ COMBO' },
  ocean:  { flashClear:'ocean', flashCombo:'ocean-combo', flashGameover:'ocean-gameover', shakeStyle:'shake-wave', particleShape:'drop', particleCount:8, particleDist:50, comboColor:'#00b4d8', comboShadow:'0 0 24px #0077b6', comboPrefix:'🌊 COMBO' },
  neon:   { flashClear:'neon', flashCombo:'neon-combo', flashGameover:'neon-gameover', shakeStyle:'shake-electric', particleShape:'line', particleCount:14, particleDist:70, comboColor:'#00ff88', comboShadow:'0 0 30px #00ff88, 0 0 60px #00cfff', comboPrefix:'⚡ COMBO' },
  retro:  { flashClear:'retro', flashCombo:'retro-combo', flashGameover:'retro-gameover', shakeStyle:'shake-hard', particleShape:'pixel', particleCount:12, particleDist:60, comboColor:'#d4ac0d', comboShadow:'none', comboPrefix:'>> COMBO' },
  galaxy: { flashClear:'galaxy', flashCombo:'galaxy-combo', flashGameover:'galaxy-gameover', shakeStyle:'shake-cosmic', particleShape:'star', particleCount:16, particleDist:80, comboColor:'#ce93d8', comboShadow:'0 0 30px #9c27b0, 0 0 60px #3f51b5', comboPrefix:'🌌 COMBO' },
  lava:   { flashClear:'lava', flashCombo:'lava-combo', flashGameover:'lava-gameover', shakeStyle:'shake-quake', particleShape:'flame', particleCount:12, particleDist:65, comboColor:'#ff6d00', comboShadow:'0 0 30px #ff1744, 0 0 60px #ff6d00', comboPrefix:'🌋 COMBO' },
  candy:  { flashClear:'candy', flashCombo:'candy-combo', flashGameover:'candy-gameover', shakeStyle:'shake-bounce', particleShape:'confetti', particleCount:14, particleDist:55, comboColor:'#f48fb1', comboShadow:'0 0 20px #ce93d8', comboPrefix:'🍭 COMBO' },
};

function getSkinFX() { return SKIN_FX[activeTheme] || SKIN_FX.classic; }

function flashScreen(type) {
  const overlay = document.getElementById('flash-overlay');
  if (!overlay) return;
  overlay.className = '';
  void overlay.offsetWidth;
  overlay.classList.add('flash-' + type);
}
function flashClear()    { flashScreen(getSkinFX().flashClear); }
function flashCombo()    { flashScreen(getSkinFX().flashCombo); }
function flashGameover() { flashScreen(getSkinFX().flashGameover); }

function makeParticle(shape, color) {
  const p = document.createElement('div');
  p.className = 'burst-particle';
  switch(shape) {
    case 'pixel':    p.style.borderRadius='0'; p.style.width=p.style.height='10px'; break;
    case 'star':     p.style.borderRadius='0'; p.style.width=p.style.height='8px'; p.style.clipPath='polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)'; break;
    case 'drop':     p.style.borderRadius='50% 50% 50% 0'; p.style.width='7px'; p.style.height='10px'; break;
    case 'line':     p.style.borderRadius='2px'; p.style.width='3px'; p.style.height='14px'; break;
    case 'flame':    p.style.borderRadius='50% 0 50% 50%'; p.style.width='8px'; p.style.height='12px'; break;
    case 'confetti': p.style.borderRadius='1px'; p.style.width='6px'; p.style.height='10px'; p.style.transform=`rotate(${Math.random()*360}deg)`; break;
    default:         p.style.borderRadius='50%'; p.style.width=p.style.height='8px';
  }
  p.style.background = color;
  return p;
}

function spawnBurstParticles(cellEl, color, count = 8) {
  const fx = getSkinFX();
  const rect = cellEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const n = fx.particleCount || count;
  const dist = fx.particleDist || 55;
  for (let i = 0; i < n; i++) {
    const p = makeParticle(fx.particleShape, color);
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const d = dist * (0.6 + Math.random() * 0.8);
    p.style.cssText += `position:fixed;left:${cx}px;top:${cy}px;pointer-events:none;z-index:999;--px:${Math.cos(angle)*d}px;--py:${Math.sin(angle)*d}px;--dur:${0.3+Math.random()*0.3}s;`;
    if (activeTheme === 'neon' || activeTheme === 'galaxy') p.style.boxShadow = `0 0 6px ${color}`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

function triggerScoreBounce() {
  const el = document.getElementById('score');
  if (!el) return;
  el.classList.remove('score-bounce');
  void el.offsetWidth;
  el.classList.add('score-bounce');
  setTimeout(() => el.classList.remove('score-bounce'), 400);
}

function triggerNewRecord() {
  const el = document.getElementById('high-score');
  if (!el) return;
  el.classList.remove('new-record');
  void el.offsetWidth;
  el.classList.add('new-record');
  setTimeout(() => el.classList.remove('new-record'), 2000);
}

function shakeBoardBig() {
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  const fx = getSkinFX();
  const shakeClass = fx.shakeStyle || 'shake-big';
  boardEl.classList.remove('shake-big','shake-gentle','shake-wave','shake-electric','shake-hard','shake-cosmic','shake-quake','shake-bounce');
  void boardEl.offsetWidth;
  boardEl.classList.add(shakeClass);
  setTimeout(() => boardEl.classList.remove(shakeClass), 400);
}

function spawnBgBlocks() {
  const colors = ['#ff6b6b','#ffd24d','#42d67a','#4d7cff','#b04dff','#ff8a4d'];
  const configs = [
    { w:60, h:60, top:'8%',  left:'3%',  r:'-15deg', dur:'4.2s', delay:'0s',    op:0.06 },
    { w:40, h:40, top:'20%', right:'4%', r:'10deg',  dur:'3.5s', delay:'0.6s',  op:0.07 },
    { w:80, h:80, top:'45%', left:'1%',  r:'20deg',  dur:'5s',   delay:'1.2s',  op:0.05 },
    { w:35, h:35, top:'65%', right:'3%', r:'-8deg',  dur:'3.8s', delay:'0.3s',  op:0.07 },
    { w:50, h:50, top:'80%', left:'5%',  r:'12deg',  dur:'4.5s', delay:'0.9s',  op:0.06 },
    { w:30, h:30, top:'75%', right:'8%', r:'-20deg', dur:'3.2s', delay:'1.5s',  op:0.08 },
    { w:45, h:45, top:'30%', left:'2%',  r:'5deg',   dur:'4.8s', delay:'0.4s',  op:0.05 },
    { w:28, h:28, top:'55%', right:'2%', r:'-12deg', dur:'3.6s', delay:'1.8s',  op:0.07 },
  ];
  configs.forEach((cfg, i) => {
    const el = document.createElement('div');
    el.className = 'bg-block';
    const color = colors[i % colors.length];
    el.style.cssText = `
      width:${cfg.w}px; height:${cfg.h}px;
      background:${color};
      top:${cfg.top}; ${cfg.left ? 'left:'+cfg.left : 'right:'+cfg.right};
      --r:${cfg.r}; --dur:${cfg.dur}; --delay:${cfg.delay}; --op:${cfg.op};
    `;
    document.body.appendChild(el);
  });
}

// Flash overlay elementi oluştur
function createFlashOverlay() {
  if (document.getElementById('flash-overlay')) return;
  const el = document.createElement('div');
  el.id = 'flash-overlay';
  document.body.appendChild(el);
}

// === BAŞLANGIÇ ===
window.addEventListener('DOMContentLoaded', () => {
  // Sesleri al
  sndPlace    = document.getElementById('snd-place');
  sndClear    = document.getElementById('snd-clear');
  sndCombo    = document.getElementById('snd-combo');
  sndGameOver = document.getElementById('snd-gameover');

  createFlashOverlay();
  spawnBgBlocks();
  loadTheme();

  highScore = Number(localStorage.getItem('bb_high_score')) || 0;
  document.getElementById('high-score').textContent = "En Yüksek Skor: " + highScore;

  initBoard();
  renderBoard();
  generatePieces();
  setupPowerups();
  updateScore();
});

function playSound(audioEl, volume = 1) {
  if (!audioEl) return;
  if (window.sfxEnabled === false) return;
  try {
    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.volume = volume;
    audioEl.play().catch(() => {});
  } catch (e) {
    console.warn('Ses çalınamadı:', e);
  }
}

// === TAHTA OLUŞTUR ===
function initBoard() {
  board = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      row.push(null);
    }
    board.push(row);
  }
}

// === TAHTAYI ÇİZ ===
function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cellEl = document.createElement('div');
      cellEl.classList.add('board-cell');

      if (board[y][x] !== null) {
       const type = board[y][x].type || 'normal';
        cellEl.style.background = board[y][x].color || getColorForType(type);

        // ✅ Element ayırt etmek için
        cellEl.classList.add(`type-${type}`);
        cellEl.dataset.type = type;

      if (board[y][x].justPlaced) {
        cellEl.classList.add('placed');
        board[y][x].justPlaced = false;
        }
        setTimeout(() => cellEl.classList.remove("pop"), 200);
      }


      // Satır sil modu hover
      if (clearRowMode && clearRowCharges > 0) {
        cellEl.addEventListener('mouseenter', () => {
          highlightRow(y, true);
        });
        cellEl.addEventListener('mouseleave', () => {
          highlightRow(y, false);
        });
      }

      cellEl.addEventListener('click', () => {
        if (isGameOver) return;

        // Satır sil modu
        if (clearRowMode && clearRowCharges > 0) {
          saveState();
          clearRowAt(y);
          return;
        }

        if (!selectedShape) return;
        tryPlacePiece(x, y);
      });

      boardEl.appendChild(cellEl);
    }
  }
}

// === SKOR GÜNCELLE + HIGH SCORE ===
function updateScore() {

  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");

  // High score canlı kontrol ve kaydet
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('bb_high_score', highScore);
  }

  // High score ekrana yaz
  if (highScoreEl) {
    highScoreEl.textContent = "En Yüksek Skor: " + highScore;
  }

  const step = Math.ceil((score - displayedScore) / 10);

  if (displayedScore < score) {

    displayedScore += step;

    if (displayedScore > score) {
      displayedScore = score;
    }

    scoreEl.textContent = displayedScore;

    requestAnimationFrame(updateScore);

  } else {
    scoreEl.textContent = score;
  }

}

function showGameOver(){

  console.log("GAME OVER TETİKLENDİ");

  isGameOver = true;

  // Dramatic game over flash
  flashGameover();
  shakeBoardBig();

  const screen = document.getElementById("gameOverScreen");
  const scoreText = document.getElementById("finalScore");

  // 🔥 1. HIGH SCORE KONTROL
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('bb_high_score', highScore);
    console.log("NEW HIGH SCORE:", highScore);
    setTimeout(() => triggerNewRecord(), 500);
  }

  // XP ver
  if (typeof window.onGameEnd === 'function') {
    window.onGameEnd(score);
  }

  // skor yazdır
  scoreText.textContent = "Score: " + score;

  screen.style.visibility = "visible";

}

// === STATE KOPYALAMA ===
function cloneBoard(b) {
  return b.map(row =>
    row.map(cell => (cell ? { ...cell } : null))
  );
}

function saveState() {
  const piecesEl = document.getElementById('pieces');
  const piecesData = [];

  if (piecesEl) {
    const pieceNodes = piecesEl.querySelectorAll('.piece');
    pieceNodes.forEach(p => {
      const idx = parseInt(p.dataset.shapeIndex, 10);
      piecesData.push(idx);
    });
  }

  lastState = {
    board: cloneBoard(board),
    score,
    clearRowCharges,
    clearRowMode: false,
    rerollCharges,
    undoCharges,
    piecesData,
    clearStreak
  };
}

function restoreState() {
  if (!lastState) return;

  board = cloneBoard(lastState.board);
  score = lastState.score;
  clearRowCharges = lastState.clearRowCharges;
  clearRowMode = lastState.clearRowMode;
  rerollCharges = lastState.rerollCharges;
  undoCharges = lastState.undoCharges;
  clearStreak = lastState.clearStreak;

  const piecesEl = document.getElementById('pieces');
  if (piecesEl) {
    piecesEl.innerHTML = '';
    selectedPiece = null;
    selectedShape = null;

    lastState.piecesData.forEach(shapeIndex => {
      const pieceEl = createPieceElement(shapeIndex);
      piecesEl.appendChild(pieceEl);
    });
  }

  renderBoard();
  updateScore();
  updatePowerupUI();
}

// === POWER-UP SETUP ===
let powerupsInitialized = false;

function setupPowerups() {
  const btnClearRow = document.getElementById('pu-clear-row');
  const btnReroll   = document.getElementById('pu-reroll');
  const btnUndo     = document.getElementById('pu-undo');
  const btnReset    = document.getElementById('btn-reset');

  updatePowerupUI();

  // Zaten bağlandıysa tekrar bağlama
  if (powerupsInitialized) return;
  powerupsInitialized = true;

  if (btnClearRow) {
    btnClearRow.addEventListener('click', () => {
      if (isGameOver) return;
      if (clearRowCharges <= 0) return;
      clearRowMode = !clearRowMode;

      if (clearRowMode) {
        if (selectedPiece) {
          selectedPiece.classList.remove('selected');
          selectedPiece = null;
          selectedShape = null;
        }
      }

      renderBoard();

      // Ses + ufak buton animasyonu (buton yanlış seçilmişti, düzeltelim)
      playSound(sndPlace, 0.5);
      btnClearRow.classList.add('used-flash');
      setTimeout(() => btnClearRow.classList.remove('used-flash'), 250);

      updatePowerupUI();
    });
  }

  if (btnReroll) {
    btnReroll.addEventListener('click', () => {
      if (isGameOver) return;
      if (rerollCharges <= 0) return;
      saveState();
      rerollPieces();
      rerollCharges--;

      playSound(sndPlace, 0.5);
      btnReroll.classList.add('used-flash');
      setTimeout(() => btnReroll.classList.remove('used-flash'), 250);

      updatePowerupUI();
    });
  }

  if (btnUndo) {
    btnUndo.addEventListener('click', () => {
      if (isGameOver) return;
      if (undoCharges <= 0) return;
      if (!lastState) return;
      restoreState();
      undoCharges--;
      lastState = null;

      playSound(sndPlace, 0.5);
      btnUndo.classList.add('used-flash');
      setTimeout(() => btnUndo.classList.remove('used-flash'), 250);

      updatePowerupUI();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      resetGame();
    });
  }
}

function updatePowerupUI() {
  const btnClearRow = document.getElementById('pu-clear-row');
  const btnReroll   = document.getElementById('pu-reroll');
  const btnUndo     = document.getElementById('pu-undo');

  if (btnClearRow) {
    if (clearRowCharges > 0 && !isGameOver) {
      btnClearRow.disabled = false;
      btnClearRow.textContent = clearRowMode
        ? 'Satır Sil (Satırı Seç)'
        : `Satır Sil (${clearRowCharges})`;
    } else {
      btnClearRow.disabled = true;
      btnClearRow.textContent = 'Satır Sil (0)';
    }
    btnClearRow.classList.toggle('active', clearRowMode);
  }

  if (btnReroll) {
    if (rerollCharges > 0 && !isGameOver) {
      btnReroll.disabled = false;
      btnReroll.textContent = `Parça Yenile (${rerollCharges})`;
    } else {
      btnReroll.disabled = true;
      btnReroll.textContent = 'Parça Yenile (0)';
    }
  }

  if (btnUndo) {
    if (undoCharges > 0 && !isGameOver) {
      btnUndo.disabled = false;
      btnUndo.textContent = `Geri Al (${undoCharges})`;
    } else {
      btnUndo.disabled = true;
      btnUndo.textContent = 'Geri Al (0)';
    }
  }
}

// === PARÇA OLUŞTUR ===
function createPieceElement(shapeIndex) {
  const shape = PIECES[shapeIndex];

  const pieceEl = document.createElement('div');
  pieceEl.classList.add('piece');
  pieceEl.dataset.shapeIndex = shapeIndex;
    // Bu parçanın rengi
  const pieceColorName = pickRandomPieceColor();
  pieceEl.dataset.pieceColor = pieceColorName;

  shape.forEach(row => {
  const rowEl = document.createElement('div');
  rowEl.classList.add('piece-row');

  row.forEach(cell => {
    const cellEl = document.createElement('div');
    cellEl.classList.add('piece-cell');

    if (cell === 1) {
      cellEl.classList.add('filled');
      cellEl.style.background = colorToHex(pieceColorName);
    }

    // ✅ EKSİK OLAN KRİTİK SATIR
    rowEl.appendChild(cellEl);
  });

  pieceEl.appendChild(rowEl);
});


  // Tıklayınca seç
  pieceEl.addEventListener('click', () => {
    if (isGameOver) return;

    if (clearRowMode) {
      clearRowMode = false;
      updatePowerupUI();
    }

    document.querySelectorAll('.piece').forEach(p => p.classList.remove('selected'));
    pieceEl.classList.add('selected');
    selectedPiece = pieceEl;
    selectedShape = shape;

    selectedPieceColor = pieceEl.dataset.pieceColor || null;
  });

  // Sürükleme: pointerdown (mouse + touch + kalem)
  pieceEl.addEventListener('pointerdown', (e) => {
    if (isGameOver || clearRowMode) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return; // sadece sol klik
    e.preventDefault();
    startDragPiece(pieceEl, shape, e);
  });

  return pieceEl;
}

function countFilledInRow(y) {
  let c = 0;
  for (let x = 0; x < BOARD_SIZE; x++) if (board[y][x] !== null) c++;
  return c;
}

function countFilledInCol(x) {
  let c = 0;
  for (let y = 0; y < BOARD_SIZE; y++) if (board[y][x] !== null) c++;
  return c;
}

// Basit “yardım” skoru: (satır/kolon neredeyse doluysa) onları tamamlatmaya yakın yerleşimler bonus alır
function bestHelpScoreForShape(shape) {
  const h = shape.length;
  const w = shape[0].length;
  const { cx, cy } = getShapeCenter(shape);

  let best = -Infinity;

  for (let by = 0; by < BOARD_SIZE; by++) {
    for (let bx = 0; bx < BOARD_SIZE; bx++) {
      const startX = bx - cx;
      const startY = by - cy;

      if (startX < 0 || startY < 0 || startX + w > BOARD_SIZE || startY + h > BOARD_SIZE) continue;

      // çakışma var mı?
      let collision = false;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (shape[y][x] === 1 && board[startY + y][startX + x] !== null) {
            collision = true;
            break;
          }
        }
        if (collision) break;
      }
      if (collision) continue;

      // skor: bu yerleşim hangi satır/kolonları dolduruyor?
      // Neredeyse dolu satır/kolonlara taş koymak bonus.
      let score = 0;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (shape[y][x] !== 1) continue;
          const gy = startY + y;
          const gx = startX + x;

          const rowFilled = countFilledInRow(gy);
          const colFilled = countFilledInCol(gx);

          // 7/8 dolu satır/kolon en değerli
          if (rowFilled === BOARD_SIZE - 1) score += 40;
          else if (rowFilled === BOARD_SIZE - 2) score += 15;

          if (colFilled === BOARD_SIZE - 1) score += 40;
          else if (colFilled === BOARD_SIZE - 2) score += 15;

          // boşluk kapatma ufak bonus
          score += 1;
        }
      }

      // büyük parçalar riskli: hafif ceza
      let cells = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (shape[y][x] === 1) cells++;
      score -= cells * 0.5;

      if (score > best) best = score;
    }
  }

  return best;
}

// Ağırlıklı rastgele seçim (weights > 0 olmalı)
function weightedPick(indices, weights) {
  let sum = 0;
  for (const w of weights) sum += w;

  let r = Math.random() * sum;
  for (let i = 0; i < indices.length; i++) {
    r -= weights[i];
    if (r <= 0) return indices[i];
  }
  return indices[indices.length - 1];
}


// === ALTTAKİ 3 PARÇAYI ÜRET ===
function generatePieces() {
  const piecesEl = document.getElementById('pieces');
  piecesEl.innerHTML = '';

  selectedPiece = null;
  selectedShape = null;

  // 1) Tahtaya sığan adaylar
  const placeable = [];
  for (let i = 0; i < PIECES.length; i++) {
    if (canPlaceShapeAnywhere(PIECES[i])) placeable.push(i);
  }

  // Eğer hiç aday yoksa (çok nadir): yine random bas, zaten game-over’a yakınsın
  if (placeable.length === 0) {
    for (let i = 0; i < 3; i++) {
      const shapeIndex = Math.floor(Math.random() * PIECES.length);
      piecesEl.appendChild(createPieceElement(shapeIndex));
    }
    return;
  }

  // 2) Her aday için “yardım skoru” çıkar
  const helpScore = new Map();
  for (const idx of placeable) {
    helpScore.set(idx, bestHelpScoreForShape(PIECES[idx]));
  }

  // 3) Küçük parçaları doğal biçimde biraz daha sık getir (yardım hissi)
  // Burada “sizeWeight” ile küçük parçaya bonus veriyoruz.
  function sizeWeightFor(idx) {
    const sh = PIECES[idx];
    let cells = 0;
    for (let y = 0; y < sh.length; y++) for (let x = 0; x < sh[0].length; x++) if (sh[y][x] === 1) cells++;
    if (cells <= 2) return 2.2;
    if (cells <= 4) return 1.6;
    if (cells <= 6) return 1.2;
    return 1.0;
  }

  // 4) 3 parça seç: çoğunlukla “yardımcı”, bazen normal
  for (let k = 0; k < 3; k++) {
    const useSmart = Math.random() < 0.90; // %90 akıllı, %10 düz random

    if (!useSmart) {
      const shapeIndex = placeable[Math.floor(Math.random() * placeable.length)];
      piecesEl.appendChild(createPieceElement(shapeIndex));
      continue;
    }

    // ağırlık = exp( helpScore ) gibi abartmayalım; lineer + taban kullan
    const indices = placeable;
    const weights = indices.map(idx => {
      const s = helpScore.get(idx) ?? 0;
      const base = 1.0;
      const help = Math.max(0, s); // negatifleri sıfıra çekelim
      return base + help * 0.12 + sizeWeightFor(idx);
    });

    const picked = weightedPick(indices, weights);
    piecesEl.appendChild(createPieceElement(picked));
  }
}


// === HER YERE SIĞAR MI (GAME OVER KONTROLÜ İÇİN) ===
function canPlaceShapeAnywhere(shape) {
  const h = shape.length;
  const w = shape[0].length;
  const { cx, cy } = getShapeCenter(shape);

  for (let by = 0; by < BOARD_SIZE; by++) {
    for (let bx = 0; bx < BOARD_SIZE; bx++) {

      const startX = bx - cx;
      const startY = by - cy;

      if (
        startX < 0 ||
        startY < 0 ||
        startX + w > BOARD_SIZE ||
        startY + h > BOARD_SIZE
      ) {
        continue;
      }

      let collision = false;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (shape[y][x] === 1) {
            if (board[startY + y][startX + x] !== null) {
              collision = true;
              break;
            }
          }
        }
        if (collision) break;
      }

      if (!collision) {
        return true;
      }
    }
  }

  return false;
}

// === GAME OVER KONTROLÜ ===
function checkGameOver() {
  const piecesEl = document.getElementById('pieces');
  if (!piecesEl) return;

  const pieceNodes = piecesEl.querySelectorAll('.piece');
  if (pieceNodes.length === 0) return; // yeni parça gelecek zaten

  // Her parça için board'a sığıyor mu?
  for (const p of pieceNodes) {
    const idx = parseInt(p.dataset.shapeIndex, 10);
    const shape = PIECES[idx];
    if (!shape) continue;
    if (canPlaceShapeAnywhere(shape)) {
      return; // en az bir hamle var
    }
  }

  // Hiç hamle yok, ama elinde power-up var mı?
  if (clearRowCharges > 0 || rerollCharges > 0 || undoCharges > 0) {
    console.log('Hamle yok ama power-up hakkı var, oyun devam ediyor.');
    return;
  }

  // Gerçek game over
  isGameOver = true;
  updatePowerupUI();

  playSound(sndGameOver, 0.8);

  setTimeout(() => {
    showGameOver();
  }, 50);

}

// === PARÇAYI YERLEŞTİRME (AĞIRLIK MERKEZİ PİVOT) ===
function tryPlacePiece(boardX, boardY) {
  if (!selectedShape) return;
  if (isGameOver) return;

  const h = selectedShape.length;
  const w = selectedShape[0].length;

  const { cx: centerX, cy: centerY } = getShapeCenter(selectedShape);

  const startX = boardX - centerX;
  const startY = boardY - centerY;

  // Sınır kontrolü
  if (
    startX < 0 ||
    startY < 0 ||
    startX + w > BOARD_SIZE ||
    startY + h > BOARD_SIZE
  ) {
    console.log('Yerleştirilemedi (sınır dışında)');
    return;
  }

  // Çakışma kontrolü
  let collision = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (selectedShape[y][x] === 1) {
        if (board[startY + y][startX + x] !== null) {
          collision = true;
          break;
        }
      }
    }
    if (collision) break;
  }

  if (collision) {
    console.log('Yerleştirilemedi (çakışma)');
    return;
  }

  // Geçerli hamle → state kaydet
  saveState();

  let placedCount = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (selectedShape[y][x] === 1) {
        const type = getRandomElementType();
        const finalColor =
          (type === 'normal')
          ? (colorToHex(selectedPieceColor) || getColorForType(type))
          : getColorForType(type);

          board[startY + y][startX + x] = {
          type,
          color: finalColor,
          colorName: (type === 'normal') ? selectedPieceColor : null,
          justPlaced: true
      };
          const cellEl = document.querySelector(
            `.board-cell[data-x="${startX + x}"][data-y="${startY + y}"]`
          );
          if (cellEl) {
            cellEl.classList.add("pop");
            cellEl.classList.add("color-pop");
            setTimeout(() => cellEl.classList.remove("color-pop"), 300);
          }

        placedCount++;
      }
    }
  }

  // Parça yerleştirme sesi
  playSound(sndPlace, 0.7);

  // Yerleştirme puanı: kaç kare koyduysan o kadar
  score += placedCount;

  // Satır/sütun temizleme + bonuslar
  const bonus = clearCompletedLines();
  score += bonus;

  updateScore();

  // seçili parçayı sil
  if (selectedPiece) {
    selectedPiece.remove();
  }
  selectedPiece = null;
  selectedShape = null;
  selectedPieceColor = null;

  renderBoard();

  // parçalar bitti ise yenilerini üret
  if (document.querySelectorAll('.piece').length === 0) {
    generatePieces();
  }

  // animasyon bittikten sonra game over kontrolü
  setTimeout(() => {
    checkGameOver();
  }, 220);
}

// === SATIR SİLME ===
function clearRowAt(rowY) {
  const cells = document.querySelectorAll('.board-cell');
  let cleared = 0;

  for (let x = 0; x < BOARD_SIZE; x++) {
    if (board[rowY][x] !== null) {
      const cell = cells[rowY * BOARD_SIZE + x];
      if (cell) cell.classList.add('clearing');
    }
  }

  setTimeout(() => {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[rowY][x] !== null) {
        board[rowY][x] = null;
        cleared++;
      }
    }

    if (cleared > 0) {
      const bonus = cleared * 2;
      score += bonus;
      updateScore();
    }

    clearRowCharges--;
    clearRowMode = false;

    updatePowerupUI();
    renderBoard();

    setTimeout(() => {
      checkGameOver();
    }, 220);
  }, 180);
}

// === SATIR/SÜTUN TEMİZLEME + PUAN ===
function clearCompletedLines() {
  let fullRows = [];
  let fullCols = [];

  for (let y = 0; y < BOARD_SIZE; y++) {
    let full = true;
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] === null) {
        full = false;
        break;
      }
    }
    if (full) fullRows.push(y);
  }

  for (let x = 0; x < BOARD_SIZE; x++) {
    let full = true;
    for (let y = 0; y < BOARD_SIZE; y++) {
      if (board[y][x] === null) {
        full = false;
        break;
      }
    }
    if (full) fullCols.push(x);
  }

  if (fullRows.length === 0 && fullCols.length === 0) {
    
    if (comboMovesLeft > 0) {
      comboMovesLeft--;

      if (comboMovesLeft === 0) {
        clearStreak = 0;
      }
    }

    return 0;
  }

  const toClear = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    toClear[y] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      toClear[y][x] = false;
    }
  }

  fullRows.forEach(rowY => {
    for (let x = 0; x < BOARD_SIZE; x++) {
      toClear[rowY][x] = true;
    }
  });

  fullCols.forEach(colX => {
    for (let y = 0; y < BOARD_SIZE; y++) {
      toClear[y][colX] = true;
    }
  });

  const baseClear = toClear.map(row => row.slice());

  // Element etkileri
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (baseClear[y][x] && board[y][x] !== null) {
        const type = board[y][x].type || 'normal';

        if (type === 'fire') {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < BOARD_SIZE && nx >= 0 && nx < BOARD_SIZE) {
                toClear[ny][nx] = true;
              }
            }
          }
        } else if (type === 'water') {
          for (let dy = -2; dy <= 2; dy++) {
            const ny = y + dy;
            if (ny >= 0 && ny < BOARD_SIZE) {
              toClear[ny][x] = true;
            }
          }
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            if (nx >= 0 && nx < BOARD_SIZE) {
              toClear[y][nx] = true;
            }
          }
        }
      }
    }
  }

  const cells = document.querySelectorAll('.board-cell');
  let clearedCells = 0;
  let extraFromElements = 0;

    // === Patlayacak satır/sütun ön uyarı efekti ===
    fullRows.forEach(rowY => {
  for (let x = 0; x < BOARD_SIZE; x++) {
    const cell = cells[rowY * BOARD_SIZE + x];
    if (cell) cell.classList.add("line-warning");
   }
  });

    fullCols.forEach(colX => {
   for (let y = 0; y < BOARD_SIZE; y++) {
    const cell = cells[y * BOARD_SIZE + colX];
    if (cell) cell.classList.add("line-warning");
    }
  });


    // 🔔 Patlamadan önce uyarı glow
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
     if (toClear[y][x] && board[y][x] !== null) {
      const cell = cells[y * BOARD_SIZE + x];
     if (cell) cell.classList.add("pre-glow");
      }
    } 
  }


  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (toClear[y][x] && board[y][x] !== null) {
        const cell = cells[y * BOARD_SIZE + x];
        if (cell) cell.classList.add('clearing');
        clearedCells++;

        if (!baseClear[y][x]) {
          extraFromElements++;
        }
      }
    }
  }

  const lineCount = fullRows.length + fullCols.length;
  let bonusScore = 0;

  // kırılan her blok
  bonusScore += clearedCells * 10;

  // satır / sütun bonusu
  bonusScore += lineCount * 150;

  // multi-line bonus
  if (lineCount >= 2) bonusScore += 300;

  // element zinciri
  if (extraFromElements > 0) bonusScore += 250;


  // 2) Combo: aynı hamlede 2+ çizgi
  if (lineCount >= 2) {
    bonusScore += 100;
  }

  // 3) Element bonusu
  if (extraFromElements > 0) {
    bonusScore += 150;
  }

  // 4) Streak: art arda clear
  clearStreak++;
  comboMovesLeft = 3;

  let comboMultiplier = 1 + (clearStreak - 1) * 0.5;

  if (comboMultiplier < 1) comboMultiplier = 1;

  bonusScore *= comboMultiplier;

  spawnFloatingScore(bonusScore);

  // toplam skor popup
  spawnFloatingScore(Math.floor(BOARD_SIZE/2), Math.floor(BOARD_SIZE/2), bonusScore);

  if (clearStreak >= 2) {
    showComboPopup(clearStreak);
    flashCombo();
    shakeBoardBig();
    spawnComboParticles();
  } else {
    flashClear();
  }
  triggerScoreBounce();

  // Ses: satır/sütun kırılma + combo/streak
  if (lineCount > 0) {
    if (lineCount >= 2 || clearStreak >= 2) {
      playSound(sndCombo, 0.85);  // büyük temizlik/kombo için
    } else {
      playSound(sndClear, 0.8);   // tek satır/sütun için
    }
  }

    const boardEl = document.getElementById("board");
    boardEl.classList.add("shake");

      setTimeout(() => {

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (toClear[y][x] && board[y][x] !== null) {
          const cell = cells[y * BOARD_SIZE + x];
          if (cell) {
            cell.classList.add("explode");
            cell.classList.add("burst");
            const color = board[y][x].color || '#fff';
            spawnBurstParticles(cell, color, 6);
          }
        }
      }
    }

      setTimeout(() => {
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          if (toClear[y][x] && board[y][x] !== null) {
            board[y][x] = null;
          }
        } 
      }
        renderBoard();
        boardEl.classList.remove("shake");
      }, 200);

    }, 250);

    setTimeout(() => {
    document.querySelectorAll('.line-warning').forEach(el => {
      el.classList.add("final-pulse");
    });
    }, 150);

    console.log(
    `Satır: ${fullRows.length}, Sütun: ${fullCols.length}, ` +
    `Temizlenen hücre: ${clearedCells}, Element ekstra: ${extraFromElements}, ` +
    `Streak: ${clearStreak}, Bonus Puan: ${bonusScore}`
    );

    return bonusScore;  
  }

  // === SATIR HIGHLIGHT ===
  function highlightRow(rowY, active) {
  const cells = document.querySelectorAll('.board-cell');
  for (let x = 0; x < BOARD_SIZE; x++) {
    const cell = cells[rowY * BOARD_SIZE + x];
    if (!cell) continue;
    if (active) cell.classList.add('row-target');
    else cell.classList.remove('row-target');
  }
}

function triggerComboEffect() {
  const board = document.getElementById('board');

  // slow motion
  document.body.classList.add('slowmo');
  setTimeout(() => document.body.classList.remove('slowmo'), 90);

  // screen shake
  board.classList.add('combo-shake');
  setTimeout(() => board.classList.remove('combo-shake'), 220);

  spawnComboParticles();
}

// === PARÇA YENİLE ===
function rerollPieces() {
  const piecesEl = document.getElementById('pieces');
  if (!piecesEl) return;

  piecesEl.innerHTML = '';
  selectedPiece = null;
  selectedShape = null;

  generatePieces();
}

// === OYUNU SIFIRLA ===
function resetGame() {
  isGameOver = false;
  score = 0;
  clearRowCharges = 1;
  rerollCharges = 1;
  undoCharges = 1;
  clearRowMode = false;
  lastState = null;
  selectedPiece = null;
  selectedShape = null;
  clearStreak = 0;

  initBoard();
  renderBoard();
  generatePieces();
  updatePowerupUI();
  updateScore();
}

// === DRAG & DROP (POINTER EVENTS) ===
function startDragPiece(pieceEl, shape, event) {
  isDragging = true;
  dragShape = shape;
  dragPieceEl = pieceEl;
  dragPointerId = event.pointerId || null;

    // Mobilde parmak görüşü kapatmasın diye parçayı yukarı kaldır
  // Lift miktarını board hücre yüksekliğine göre ayarlıyoruz (cihazdan cihaza tutarlı)
  const boardEl = document.getElementById('board');
  if (boardEl && (event.pointerType === 'touch')) {
    const rect = boardEl.getBoundingClientRect();
    const cellH = rect.height / BOARD_SIZE;
    dragLiftY = Math.round(cellH * 2.2); // istersen 1.8–2.8 arası oynarsın
  } else {
    dragLiftY = 0; // mouse/PC
  }

  document.querySelectorAll('.piece').forEach(p => p.classList.remove('selected'));
  pieceEl.classList.add('selected');
  selectedPiece = pieceEl;
  selectedShape = shape;
  selectedPieceColor = pieceEl.dataset.pieceColor || null;


  dragPreviewEl = pieceEl.cloneNode(true);
  dragPreviewEl.classList.add('drag-preview');
  dragPreviewEl.style.position = 'fixed';
  dragPreviewEl.style.pointerEvents = 'none';
  dragPreviewEl.style.opacity = '0.85';
  dragPreviewEl.style.zIndex = '9999';
  document.body.appendChild(dragPreviewEl);

  updateDragPosition(event);
  updateGhostFromEvent(event);

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
}

function onPointerMove(e) {
  if (!isDragging) return;
  if (dragPointerId !== null && e.pointerId !== dragPointerId) return;

  updateDragPosition(e);
  // Ghost: parmağın tam yerini kullan, gecikme yok
  updateGhostPreview(e.clientX, e.clientY - dragLiftY);
}

function onPointerUp(e) {
  if (!isDragging) return;
  if (dragPointerId !== null && e.pointerId !== dragPointerId) return;

  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerUp);

  if (dragPreviewEl) {
    dragPreviewEl.remove();
    dragPreviewEl = null;
  }

  document.body.classList.add("snap-slow");
  setTimeout(() => document.body.classList.remove("snap-slow"), 80);


  // BLOK NEREYE GİTSİN? → En son geçerli ghost hücresine
  if (lastGhostCell && selectedShape) {
    const [bx, by] = lastGhostCell;
    tryPlacePiece(bx, by);
  } else if (selectedShape) {
    // Ghost yoksa bırakılan noktada bir kez daha snap dene
    const snapped = trySnapToValid(e.clientX, e.clientY - dragLiftY);
    if (snapped) tryPlacePiece(snapped[0], snapped[1]);
  }

  isDragging = false;
  dragShape = null;
  dragPieceEl = null;
  dragPointerId = null;
  lastGhostCell = null;

  clearGhostPreview();
}

function updateDragPosition(e) {
  if (!dragPreviewEl) return;

  const rect = dragPreviewEl.getBoundingClientRect();
  dragPreviewEl.style.left = (e.clientX - rect.width / 2) + "px";
  dragPreviewEl.style.top  = ((e.clientY - dragLiftY) - rect.height / 2) + "px";
}

function getBoardCellFromClient(clientX, clientY) {
  const board = document.getElementById("board");
  if (!board) return null;

  const rect = board.getBoundingClientRect();
  const cell = rect.width / BOARD_SIZE;

  const lx = clientX - rect.left;
  const ly = clientY - rect.top;

  if (lx < 0 || ly < 0 || lx >= rect.width || ly >= rect.height) return null;

  const bx = Math.floor(lx / cell);
  const by = Math.floor(ly / cell);

  return [bx, by];
}


// === GHOST PREVIEW ===
function clearGhostPreview() {
  document.querySelectorAll('.board-cell').forEach(c => {
    c.classList.remove('ghost-valid', 'ghost-invalid');
  });
}

function updateGhostFromEvent(e) {
  // Parmağın/imlecin tam konumunu kullan — smoothing yok, gecikme yok
  let clientX = e.clientX;
  let clientY = e.clientY;

  // Mobilde parmağın görüşü kapatmaması için yukarı kaldırma offsetini uygula
  if (dragLiftY > 0) {
    clientY -= dragLiftY;
  }

  updateGhostPreview(clientX, clientY);
}

// Geçerli pozisyon bulunca şekli oraya snap et
function trySnapToValid(clientX, clientY) {
  if (!selectedShape) return null;
  const boardEl = document.getElementById("board");
  const rect = boardEl.getBoundingClientRect();
  const cellSize = rect.width / BOARD_SIZE;
  const h = selectedShape.length;
  const w = selectedShape[0].length;
  const { cx: centerX, cy: centerY } = getShapeCenter(selectedShape);

  // Parmak pozisyonundan board koordinatına
  const rawBx = Math.floor((clientX - rect.left) / cellSize);
  const rawBy = Math.floor((clientY - rect.top)  / cellSize);

  // Çevre hücreleri de dene (±1 snap manyetizması)
  const offsets = [
    [0,0], [-1,0],[1,0],[0,-1],[0,1],
    [-1,-1],[1,-1],[-1,1],[1,1]
  ];

  for (const [ox, oy] of offsets) {
    const bx = rawBx + ox;
    const by = rawBy + oy;
    const startX = bx - centerX;
    const startY = by - centerY;

    if (startX < 0 || startY < 0 || startX + w > BOARD_SIZE || startY + h > BOARD_SIZE) continue;

    let ok = true;
    for (let y = 0; y < h && ok; y++) {
      for (let x = 0; x < w && ok; x++) {
        if (selectedShape[y][x] === 1 && board[startY + y][startX + x] !== null) {
          ok = false;
        }
      }
    }
    if (ok) return [bx, by];
  }
  return null;
}

function updateGhostPreview(clientX, clientY) {
  clearPrediction();
  clearGhostPreview();
  lastGhostCell = null;

  if (!isDragging || !selectedShape || isGameOver) return;

  // Snap manyetizması ile en yakın geçerli hücreyi bul
  const snapped = trySnapToValid(clientX, clientY);
  if (!snapped) return;

  const [bx, by] = snapped;
  const h = selectedShape.length;
  const w = selectedShape[0].length;
  const { cx: centerX, cy: centerY } = getShapeCenter(selectedShape);
  const startX = bx - centerX;
  const startY = by - centerY;

  // Geçerli hedef → kaydet
  lastGhostCell = [bx, by];

  // Ghost çiz
  const cells = document.querySelectorAll('.board-cell');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (selectedShape[y][x] === 1) {
        const idx = (startY + y) * BOARD_SIZE + (startX + x);
        const cellEl = cells[idx];
        if (cellEl) {
          cellEl.classList.add('ghost-valid');
        }
      }
    }
  }

  // ===== CLEAR PREDICTOR =====
  const tempBoard = board.map(r => r.slice());

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (selectedShape[y][x] === 1) {
        const ty = startY + y;
        const tx = startX + x;
        if (ty >= 0 && ty < BOARD_SIZE && tx >= 0 && tx < BOARD_SIZE) {
          tempBoard[ty][tx] = { type: "normal" };
        }
      }
    }
  }

  showClearPrediction(tempBoard);
}

function clearPrediction() {
  document.querySelectorAll(".predict-clear").forEach(c => {
    c.classList.remove("predict-clear");
  });
}

function showClearPrediction(testBoard) {
  const cells = document.querySelectorAll('.board-cell');

  for (let y = 0; y < BOARD_SIZE; y++) {
    let full = true;
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (testBoard[y][x] === null) { full = false; break; }
    }
    if (full) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const cell = cells[y * BOARD_SIZE + x];
        if (cell) cell.classList.add("predict-clear");
      }
    }
  }

  for (let x = 0; x < BOARD_SIZE; x++) {
    let full = true;
    for (let y = 0; y < BOARD_SIZE; y++) {
      if (testBoard[y][x] === null) { full = false; break; }
    }
    if (full) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        const cell = cells[y * BOARD_SIZE + x];
        if (cell) cell.classList.add("predict-clear");
      }
    }
  }
}

function showComboPopup(count) {
  const fx = getSkinFX();
  const div = document.createElement("div");
  div.className = "combo-popup";
  div.textContent = fx.comboPrefix + " x" + count;
  div.style.color = fx.comboColor;
  if (fx.comboShadow !== 'none') div.style.textShadow = fx.comboShadow;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 750);
}

function spawnFloatingScore(value) {

  if (scorePopupActive) return;
  scorePopupActive = true;

  const popup = document.createElement("div");
  popup.className = "score-popup";
  popup.textContent = "+" + value;

  // büyük puan renklensin
  if (value >= 500) {
    popup.style.color = "#ff3d00";
  } 
  else if (value >= 200) {
    popup.style.color = "#ff9800";
  }

  popup.style.left = "50%";
  popup.style.top = "45%";
  popup.style.position = "fixed";

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
    scorePopupActive = false;
  }, 900);
}

const SNAP_RANGE = 0.45; // hücre oranı

let lastMoveTime = 0;
const MOVE_COOLDOWN = 8; // ms – arcade hızı

function spawnComboParticles() {
  const board = document.getElementById('board');
  const rect = board.getBoundingClientRect();

  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'combo-particle';
    p.style.left = rect.width/2 + 'px';
    p.style.top = rect.height/2 + 'px';

    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 100;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;

    p.style.setProperty('--x', x + 'px');
    p.style.setProperty('--y', y + 'px');

    board.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

const SNAP_PULL = 0.92;

document.getElementById("restartBtn").onclick = () => {
 location.reload();
};