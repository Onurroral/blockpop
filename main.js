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

// Oyun istatistikleri (achievement için)
let gameBlocksPlaced = 0;
let gameLinesCleared = 0;
let gameMaxCombo = 0; 

// Seçili parça
let selectedPiece = null;   // DOM elemanı
let selectedShape = null;   // Matris (2D array)

// Seçili parçanın rengi (board'a yerleşince bu renk basılacak)
let selectedPieceColor = null;

// === TEMA SİSTEMİ ===
const THEMES = {
  classic: {
    name: 'Classic',
    colors: { red:'#f87171', blue:'#60a5fa', green:'#34d399', yellow:'#fbbf24', orange:'#fb923c', purple:'#a78bfa' },
    boardBg: 'transparent', cellBorder: 'rgba(255,255,255,0.04)', glow: false,
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

  // Mevcut tahtayı yeniden çiz (board hazırsa)
  if (board && board.length === BOARD_SIZE) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (board[y][x] && board[y][x].colorName) {
          board[y][x].color = t.colors[board[y][x].colorName] || board[y][x].color;
        }
      }
    }
    renderBoard();
  }

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
  // === TEK KARE ===
  [[1]],

  // === I - Yatay ===
  [[1,1,1,1]],
  // I - Dikey
  [[1],[1],[1],[1]],

  // === O - 2x2 Kare ===
  [[1,1],[1,1]],

  // === L şekli ===
  [[1,0],[1,0],[1,1]],
  // L - 90° döndür
  [[1,1,1],[1,0,0]],
  // L - 180°
  [[1,1],[0,1],[0,1]],
  // L - 270°
  [[0,0,1],[1,1,1]],

  // === J şekli (ters L) ===
  [[0,1],[0,1],[1,1]],
  // J - 90°
  [[1,0,0],[1,1,1]],
  // J - 180°
  [[1,1],[1,0],[1,0]],
  // J - 270°
  [[1,1,1],[0,0,1]],

  // === T şekli ===
  [[1,1,1],[0,1,0]],
  // T - 90°
  [[1,0],[1,1],[1,0]],
  // T - 180°
  [[0,1,0],[1,1,1]],
  // T - 270°
  [[0,1],[1,1],[0,1]],

  // === S şekli ===
  [[0,1,1],[1,1,0]],
  // S - 90°
  [[1,0],[1,1],[0,1]],

  // === Z şekli ===
  [[1,1,0],[0,1,1]],
  // Z - 90°
  [[0,1],[1,1],[1,0]],

  // === Kısa I (3lü) ===
  [[1,1,1]],
  [[1],[1],[1]],

  // === Kısa I (2li) ===
  [[1,1]],
  [[1],[1]],

  // === SCORE UNLOCK: 10.000 ===
  // Büyük L (4'lü)
  [[1,0],[1,0],[1,0],[1,1]],
  // Büyük L - ters
  [[0,1],[0,1],[0,1],[1,1]],

  // === SCORE UNLOCK: 30.000 ===
  // Büyük I (5'li yatay)
  [[1,1,1,1,1]],
  // Büyük I (5'li dikey)
  [[1],[1],[1],[1],[1]],

  // === SCORE UNLOCK: 50.000 ===
  // Artı şekli
  [[0,1,0],[1,1,1],[0,1,0]],
  // U şekli
  [[1,0,1],[1,1,1]],

  // === SCORE UNLOCK: 100.000 ===
  // 3x3 dolu kare
  [[1,1,1],[1,1,1],[1,1,1]],
  // Büyük T (5'li)
  [[1,1,1,1,1],[0,0,1,0,0]],
];

// === SCORE BAZLI PARÇA UNLOCK SİSTEMİ ===
// Her threshold'dan itibaren o bloklar havuza giriyor
const PIECE_UNLOCKS = [
  { minScore: 0,       maxIndex: 23 },  // temel parçalar (0-23)
  { minScore: 10000,   maxIndex: 25 },  // +2: Büyük L halleri
  { minScore: 30000,   maxIndex: 27 },  // +2: Büyük I (5'li)
  { minScore: 50000,   maxIndex: 29 },  // +2: Artı + U
  { minScore: 100000,  maxIndex: 31 },  // +2: 3x3 + Büyük T
];

function getAvailablePieceIndices() {
  let maxIdx = 25;
  for (const unlock of PIECE_UNLOCKS) {
    if (score >= unlock.minScore) maxIdx = unlock.maxIndex;
  }
  const result = [];
  for (let i = 0; i < Math.min(maxIdx + 1, PIECES.length); i++) {
    result.push(i);
  }
  return result;
}


// === TİTREŞİM ===
function vibrate(pattern) {
  if (!window.navigator || !window.navigator.vibrate) return;
  const hapticOn = localStorage.getItem('tgl-haptic') !== 'off';
  if (!hapticOn) return;
  navigator.vibrate(pattern);
}


// === POWERUP XP SİSTEMİ ===
const POWERUP_XP_COST = {
  clearRow: 100,
  reroll:   75,
  undo:     50,
};

function getDiamonds() {
  return parseInt(localStorage.getItem('bp_diamonds') || '0');
}

function spendDiamonds(amount) {
  const current = getDiamonds();
  if (current < amount) return false;
  localStorage.setItem('bp_diamonds', current - amount);
  // XP göstergesini güncelle (index.html'deki updateXPDisplay)
  if (typeof updateDiamondDisplay === 'function') updateDiamondDisplay();
  return true;
}

function buyPowerupWithXP(type) {
  const cost = POWERUP_XP_COST[type];
  const diamonds = getDiamonds();

  if (diamonds < cost) {
    showXPShortageToast(cost - diamonds);
    return false;
  }

  if (!spendDiamonds(cost)) return false;

  if (type === 'clearRow') { clearRowCharges++; }
  else if (type === 'reroll') { rerollCharges++; }
  else if (type === 'undo') { undoCharges++; }

  updatePowerupUI();
  vibrate(40);
  showXPSpentToast(cost, type);
  return true;
}

function showXPShortageToast(needed) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:140px;left:50%;transform:translateX(-50%);background:rgba(255,80,80,0.9);color:#fff;padding:8px 18px;border-radius:50px;font-size:13px;font-weight:600;z-index:9999;pointer-events:none;animation:xpToastAnim 1.8s ease forwards;';
  t.textContent = `${needed} 💎 daha lazım!`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

function showXPSpentToast(cost, type) {
  const names = { clearRow: 'Satır Sil', reroll: 'Parça Yenile', undo: 'Geri Al' };
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:140px;left:50%;transform:translateX(-50%);background:rgba(255,210,77,0.9);color:#1a1a2e;padding:8px 18px;border-radius:50px;font-size:13px;font-weight:600;z-index:9999;pointer-events:none;animation:xpToastAnim 1.8s ease forwards;';
  t.textContent = `-${cost} XP → ${names[type]} +1`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

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
  // BlockBlast gibi: bounding box'ın ortası
  // Asimetrik parçalarda ağırlık merkezi değil geometrik merkez
  return {
    cx: (w - 1) / 2,
    cy: (h - 1) / 2
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
  const colors = ['#7c6ff7','#a78bfa','#60a5fa','#34d399','#f472b6','#fbbf24'];
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

// === ACHİEVEMENT SİSTEMİ ===
const ACHIEVEMENTS = [
  // Skor
  { id:'score_100',    icon:'🌱', name:'İlk Adım',       desc:'100 puan kazan',          cat:'skor',  check: s => s.totalScore >= 100 },
  { id:'score_500',    icon:'⭐', name:'Yükselen Yıldız', desc:'500 puan kazan',          cat:'skor',  check: s => s.totalScore >= 500 },
  { id:'score_1k',     icon:'🏅', name:'Bin Puan',        desc:'1,000 puan kazan',        cat:'skor',  check: s => s.totalScore >= 1000 },
  { id:'score_5k',     icon:'🥈', name:'Usta',            desc:'5,000 puan kazan',        cat:'skor',  check: s => s.totalScore >= 5000 },
  { id:'score_10k',    icon:'🥇', name:'Efsane',          desc:'10,000 puan kazan',       cat:'skor',  check: s => s.totalScore >= 10000 },
  { id:'score_50k',    icon:'💎', name:'Elmas Seviye',    desc:'50,000 puan kazan',       cat:'skor',  check: s => s.totalScore >= 50000 },
  { id:'score_100k',   icon:'👑', name:'Kral',            desc:'100,000 puan kazan',      cat:'skor',  check: s => s.totalScore >= 100000 },

  // Combo
  { id:'combo_2',      icon:'🔥', name:'Combo!',          desc:'2x combo yap',            cat:'combo', check: s => s.maxCombo >= 2 },
  { id:'combo_3',      icon:'💥', name:'Üçlü Kombo',      desc:'3x combo yap',            cat:'combo', check: s => s.maxCombo >= 3 },
  { id:'combo_5',      icon:'⚡', name:'Beşli Fırtına',   desc:'5x combo yap',            cat:'combo', check: s => s.maxCombo >= 5 },
  { id:'combo_10',     icon:'🌪️', name:'Kasırga',         desc:'10x combo yap',           cat:'combo', check: s => s.maxCombo >= 10 },

  // Blok
  { id:'blocks_100',   icon:'🧱', name:'İnşaatçı',        desc:'100 blok yerleştir',      cat:'blok',  check: s => s.totalBlocks >= 100 },
  { id:'blocks_500',   icon:'🏗️', name:'Mimar',           desc:'500 blok yerleştir',      cat:'blok',  check: s => s.totalBlocks >= 500 },
  { id:'blocks_1000',  icon:'🏰', name:'Kale Ustası',     desc:'1000 blok yerleştir',     cat:'blok',  check: s => s.totalBlocks >= 1000 },
  { id:'blocks_5000',  icon:'🌆', name:'Şehir Kurucusu',  desc:'5000 blok yerleştir',     cat:'blok',  check: s => s.totalBlocks >= 5000 },

  // Mod
  { id:'mode_hard',    icon:'💀', name:'Cesur Yürek',     desc:'Zor modda oyna',          cat:'mod',   check: s => s.playedHard },
  { id:'mode_time',    icon:'⏱️', name:'Zamana Karşı',    desc:'Zaman modunda oyna',      cat:'mod',   check: s => s.playedTime },
  { id:'mode_time_l5', icon:'🚀', name:'Işık Hızı',       desc:'Zaman Modu Seviye 5 oyna',cat:'mod',   check: s => s.playedTimeL5 },
  { id:'mode_hard_5k', icon:'🗡️', name:'Demir İrade',     desc:'Zor modda 5000 puan kazan',cat:'mod',  check: s => s.hardModeScore >= 5000 },

  // Satır
  { id:'lines_10',     icon:'💫', name:'Satır Avcısı',    desc:'10 satır/sütun temizle',  cat:'satır', check: s => s.totalLines >= 10 },
  { id:'lines_50',     icon:'🌟', name:'Temizlikçi',      desc:'50 satır/sütun temizle',  cat:'satır', check: s => s.totalLines >= 50 },
  { id:'lines_200',    icon:'✨', name:'Süpürge',         desc:'200 satır/sütun temizle', cat:'satır', check: s => s.totalLines >= 200 },

  // Oyun sayısı
  { id:'games_5',      icon:'🎮', name:'Oyun Sever',      desc:'5 oyun oyna',             cat:'oyun',  check: s => s.totalGames >= 5 },
  { id:'games_20',     icon:'🎯', name:'Bağımlı',         desc:'20 oyun oyna',            cat:'oyun',  check: s => s.totalGames >= 20 },
  { id:'games_100',    icon:'🏆', name:'Veteran',         desc:'100 oyun oyna',           cat:'oyun',  check: s => s.totalGames >= 100 },
];

function getAchievementStats() {
  const raw = localStorage.getItem('bp_ach_stats');
  return raw ? JSON.parse(raw) : {
    totalScore: 0, maxCombo: 0, totalBlocks: 0,
    totalLines: 0, totalGames: 0,
    playedHard: false, playedTime: false, playedTimeL5: false,
    hardModeScore: 0, bestScore: 0, totalPlayTime: 0,
    easyGames: 0, normalGames: 0, hardGames: 0, timeGames: 0,
  };
}

function saveAchievementStats(stats) {
  localStorage.setItem('bp_ach_stats', JSON.stringify(stats));
}

function getUnlockedAchievements() {
  const raw = localStorage.getItem('bp_achievements');
  return raw ? JSON.parse(raw) : [];
}

function checkAchievements(stats) {
  const unlocked = getUnlockedAchievements();
  const newOnes = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlocked.includes(ach.id)) continue;
    if (ach.check(stats)) {
      unlocked.push(ach.id);
      newOnes.push(ach);
    }
  }

  if (newOnes.length > 0) {
    localStorage.setItem('bp_achievements', JSON.stringify(unlocked));
    newOnes.forEach((ach, i) => {
      setTimeout(() => showAchievementToast(ach), i * 1200);
    });
  }
}

function showAchievementToast(ach) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; top:20px; left:50%; transform:translateX(-50%);
    background:rgba(15,15,25,0.97);
    border:1px solid rgba(124,111,247,0.4);
    border-radius:16px; padding:12px 20px;
    display:flex; align-items:center; gap:12px;
    z-index:9999; pointer-events:none;
    box-shadow:0 8px 32px rgba(124,111,247,0.25);
    animation:achieveSlide 3s ease forwards;
    min-width:240px; max-width:320px;
  `;
  toast.innerHTML = `
    <div style="font-size:28px;flex-shrink:0">${ach.icon}</div>
    <div>
      <div style="font-size:10px;font-weight:700;color:#a78bfa;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">🏆 Rozet Kazandın!</div>
      <div style="font-size:15px;font-weight:900;color:#fff;font-family:'Nunito',sans-serif;">${ach.name}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);">${ach.desc}</div>
    </div>
  `;

  if (!document.getElementById('achieveStyle')) {
    const s = document.createElement('style');
    s.id = 'achieveStyle';
    s.textContent = `@keyframes achieveSlide {
      0%  { opacity:0; transform:translateX(-50%) translateY(-20px); }
      12% { opacity:1; transform:translateX(-50%) translateY(0); }
      75% { opacity:1; transform:translateX(-50%) translateY(0); }
      100%{ opacity:0; transform:translateX(-50%) translateY(-10px); }
    }`;
    document.head.appendChild(s);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
  if (typeof vibrate === 'function') vibrate([30, 20, 60]);
}

function updateAchievementStats(gameScore, blocksPlaced, linesCleared, comboMax) {
  const stats = getAchievementStats();
  stats.totalScore   = (stats.totalScore || 0) + gameScore;
  stats.totalBlocks  = (stats.totalBlocks || 0) + blocksPlaced;
  stats.totalLines   = (stats.totalLines || 0) + linesCleared;
  stats.totalGames   = (stats.totalGames || 0) + 1;
  stats.maxCombo     = Math.max(stats.maxCombo || 0, comboMax);
  stats.bestScore    = Math.max(stats.bestScore || 0, gameScore);

  const mode = window.currentGameMode || 'normal';
  if (mode === 'easy')        stats.easyGames   = (stats.easyGames || 0) + 1;
  else if (mode === 'normal') stats.normalGames = (stats.normalGames || 0) + 1;
  else if (mode === 'hard')   { stats.hardGames = (stats.hardGames || 0) + 1; stats.playedHard = true; stats.hardModeScore = Math.max(stats.hardModeScore || 0, gameScore); }
  else if (mode === 'timeattack') { stats.timeGames = (stats.timeGames || 0) + 1; stats.playedTime = true; if (window.currentTimeLevel >= 5) stats.playedTimeL5 = true; }

  saveAchievementStats(stats);
  checkAchievements(stats);
}

// === DAILY CHALLENGE + STREAK SİSTEMİ ===

const DAILY_CHALLENGES = [
  { id:'score_300',   icon:'🎯', desc:'300 puan kazan',        check: (s,b,l,c) => s >= 300,   xp: 80  },
  { id:'score_500',   icon:'⭐', desc:'500 puan kazan',        check: (s,b,l,c) => s >= 500,   xp: 120 },
  { id:'score_1000',  icon:'🏅', desc:'1000 puan kazan',       check: (s,b,l,c) => s >= 1000,  xp: 200 },
  { id:'score_2000',  icon:'💎', desc:'2000 puan kazan',       check: (s,b,l,c) => s >= 2000,  xp: 350 },
  { id:'combo_3',     icon:'🔥', desc:'3x combo yap',          check: (s,b,l,c) => c >= 3,     xp: 100 },
  { id:'combo_5',     icon:'⚡', desc:'5x combo yap',          check: (s,b,l,c) => c >= 5,     xp: 200 },
  { id:'lines_5',     icon:'💫', desc:'5 satır/sütun temizle', check: (s,b,l,c) => l >= 5,     xp: 150 },
  { id:'lines_10',    icon:'🌟', desc:'10 satır/sütun temizle',check: (s,b,l,c) => l >= 10,    xp: 250 },
  { id:'blocks_50',   icon:'🧱', desc:'50 blok yerleştir',     check: (s,b,l,c) => b >= 50,    xp: 100 },
  { id:'blocks_100',  icon:'🏗️', desc:'100 blok yerleştir',   check: (s,b,l,c) => b >= 100,   xp: 180 },
  { id:'hard_mode',   icon:'💀', desc:'Zor modda oyna',        check: (s,b,l,c) => window.currentGameMode === 'hard', xp: 200 },
  { id:'time_mode',   icon:'⏱️', desc:'Zaman modunda oyna',   check: (s,b,l,c) => window.currentGameMode === 'timeattack', xp: 150 },
  { id:'score_no_pu', icon:'🗡️', desc:'Powerupsuz 500 puan',  check: (s,b,l,c) => s >= 500 && (window.currentGameMode === 'hard' || window.currentGameMode === 'timeattack'), xp: 300 },
];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getDailyChallenge() {
  // Günün challengei — tarihe göre sabit seçim
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
  const idx = seed % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[idx];
}

function getDailyStatus() {
  const raw = localStorage.getItem('bp_daily');
  return raw ? JSON.parse(raw) : { lastDate: '', completed: false, streak: 0, lastStreakDate: '' };
}

function saveDailyStatus(status) {
  localStorage.setItem('bp_daily', JSON.stringify(status));
}

function checkDailyChallenge(score, blocks, lines, combo) {
  const today = getTodayStr();
  const status = getDailyStatus();
  if (status.lastDate === today && status.completed) return; // Zaten tamamlandı

  const challenge = getDailyChallenge();
  if (!challenge.check(score, blocks, lines, combo)) return;

  // Tamamlandı!
  const yesterday = (() => {
    const d = new Date(); d.setDate(d.getDate()-1);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  })();

  const newStreak = status.lastStreakDate === yesterday ? (status.streak || 0) + 1 : 1;

  saveDailyStatus({ lastDate: today, completed: true, streak: newStreak, lastStreakDate: today });

  // XP ver
  const xpBonus = challenge.xp + (newStreak * 10); // Streak bonusu
  if (typeof window.addXPDirect === 'function') window.addXPDirect(xpBonus);

  // Bildirim
  showDailyCompleteToast(challenge, newStreak, xpBonus);

  // Achievement güncelle
  if (typeof window.onGameEnd === 'function') {}
}

function showDailyCompleteToast(challenge, streak, xp) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; top:20px; left:50%; transform:translateX(-50%);
    background:linear-gradient(135deg,rgba(15,15,25,0.98),rgba(20,20,40,0.98));
    border:1px solid rgba(251,191,36,0.4);
    border-radius:18px; padding:16px 20px;
    display:flex; align-items:center; gap:12px;
    z-index:9999; pointer-events:none;
    box-shadow:0 8px 32px rgba(251,191,36,0.2);
    animation:achieveSlide 3.5s ease forwards;
    min-width:260px;
  `;
  toast.innerHTML = `
    <div style="font-size:32px">${challenge.icon}</div>
    <div>
      <div style="font-size:10px;font-weight:700;color:#fbbf24;letter-spacing:1px;text-transform:uppercase;">📅 Günlük Görev Tamamlandı!</div>
      <div style="font-size:14px;font-weight:900;color:#fff;font-family:'Nunito',sans-serif;margin:2px 0">${challenge.desc}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);">+${xp} XP kazandın · 🔥 ${streak} gün streak</div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
  if (typeof vibrate === 'function') vibrate([40, 20, 40, 20, 80]);
}

// === BAŞLANGIÇ ===
window.addEventListener('DOMContentLoaded', () => {
  // Sesleri al
  sndPlace    = document.getElementById('snd-place');
  sndClear    = document.getElementById('snd-clear');
  sndCombo    = document.getElementById('snd-combo');
  sndGameOver = document.getElementById('snd-gameover1');

  createFlashOverlay();
  spawnBgBlocks();

  highScore = Number(localStorage.getItem('bb_high_score')) || 0;
  document.getElementById('high-score').textContent = highScore;

  initBoard();
  renderBoard();
  loadTheme();

  // Kayıtlı oyun varsa yükle, yoksa yeni başlat
  const hasSave = loadGameState();
  if (!hasSave) {
    generatePieces();
  }

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

// === WEB AUDIO - KOD İLE SES ===
let _audioCtx = null;
function _getCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  if (_audioCtx && _audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
function _isOn() { return localStorage.getItem('tgl-sfx') !== 'off'; }

function _tone(freq1, freq2, type, vol, dur, delay) {
  if (!_isOn()) return;
  const ctx = _getCtx(); if (!ctx) return;
  try {
    const t = ctx.currentTime + (delay||0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq1, t);
    if (freq2) o.frequency.exponentialRampToValueAtTime(freq2, t + dur * 0.7);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur);
  } catch(e) {}
}

// Ses buffer sistemi — tüm MP3'ler için
const _buffers = {};
async function _loadBuffer(name, url) {
  try {
    const ctx = _getCtx(); if (!ctx) return;
    const resp = await fetch(url);
    const arr  = await resp.arrayBuffer();
    _buffers[name] = await ctx.decodeAudioData(arr);
  } catch(e) {}
}
function _playBuffer(name, volume=0.7) {
  if (!_isOn()) return;
  try {
    const ctx = _getCtx(); if (!ctx) return;
    const buf = _buffers[name];
    if (buf) {
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = buf;
      src.connect(gain); gain.connect(ctx.destination);
      gain.gain.value = volume;
      src.start(ctx.currentTime);
    }
  } catch(e) {}
}

// Blok alırken: pick.mp3 — Web Audio buffer ile (sıfır delay)
let _pickBuffer = null;
async function _loadPickBuffer() {
  try {
    const ctx = _getCtx(); if (!ctx) return;
    const resp = await fetch('assets/sounds/pick.mp3');
    const arr  = await resp.arrayBuffer();
    _pickBuffer = await ctx.decodeAudioData(arr);
  } catch(e) {}
}

function playSndPick() {
  if (!_isOn()) return;
  try {
    const ctx = _getCtx(); if (!ctx) return;
    if (_pickBuffer) {
      // Buffer hazır — anında çal, sıfır delay
      const src  = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = _pickBuffer;
      src.connect(gain); gain.connect(ctx.destination);
      gain.gain.value = 0.7;
      src.start(ctx.currentTime);
    } else {
      // Fallback: normal audio element
      const el = document.getElementById('snd-pick');
      if (el) { el.pause(); el.currentTime = 0; el.volume = 0.7; el.play().catch(()=>{}); }
      _loadPickBuffer(); // arka planda yükle
    }
  } catch(e) {}
}

// Sayfa yüklenince buffer'ı hazırla
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(_loadPickBuffer, 1000);
  _loadBuffer('tick', 'assets/sounds/tick.mp3');
});

// Blok koyma: tick.mp3
function playSndPlace() {
  if (!_isOn()) return;
  try {
    const el = document.getElementById('snd-tick');
    if (el) { el.pause(); el.currentTime = 0; el.volume = 0.8; el.play().catch(()=>{}); return; }
  } catch(e) {}
  // Fallback
  _tone(1200, 400, 'sine', 0.28, 0.08);
}

// Satır/sütun temizleme: tok modern patlama
function playSndClear(count) {
  if (!_isOn()) return;
  try {
    const el = document.getElementById('snd-clear');
    if (el) { el.pause(); el.currentTime = 0; el.volume = 0.8; el.play().catch(()=>{}); return; }
  } catch(e) {}
  // Fallback
  _tone(1200, 400, 'sine', 0.28, 0.08);
}


// Combo: her seviyede farklı, giderek coşkulu
function playSndCombo(level) {
  if (!_isOn()) return;
  const ctx = _getCtx(); if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const lv = Math.min(Math.max(level, 2), 8);

    // Hızlanan arpej — seviyeye göre daha fazla nota
    const baseNotes = [523, 659, 784, 880, 1047, 1175, 1319, 1568];
    const noteCount = Math.min(lv, baseNotes.length);
    const speed = Math.max(0.025, 0.06 - lv*0.005); // hızlanır

    baseNotes.slice(0, noteCount).forEach((f, i) => {
      const vol = 0.12 + lv*0.02;
      _tone(f, f, 'triangle', Math.min(vol, 0.28), 0.22, i*speed);
    });

    // Yüksek parlama — seviyeye göre artar
    const sweepVol = 0.1 + lv*0.03;
    _tone(1000+lv*100, 3000+lv*200, 'sine', Math.min(sweepVol, 0.35), 0.25, 0.05);

    // 3x ve üstü: ekstra "pow" darbe
    if (lv >= 3) {
      _tone(200, 600, 'sine', 0.25, 0.18, 0);
    }
    // 5x ve üstü: tüm ekrana hissettiren düşük bas
    if (lv >= 5) {
      _tone(100, 60, 'sine', 0.3, 0.4, 0.05);
      _tone(2000, 4000, 'sine', 0.15, 0.2, 0.1);
    }
  } catch(e) {}
}

// Game over: dramatik çöküş
function playSndGameOver() {
    if (!_isOn()) return;
  try {
    const el = document.getElementById('snd-gameover1');
    if (el) { el.pause(); el.currentTime = 0; el.volume = 0.8; el.play().catch(()=>{}); return; }
  } catch(e) {}
  // Fallback
  _tone(1200, 400, 'sine', 0.28, 0.08);
}

// Yeni rekor: parlak fanfare
function playSndRecord() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => {
    _tone(f, f, 'triangle', 0.15, 0.22, i*0.08);
  });
  _tone(2000, 2000, 'sine', 0.1, 0.3, 0.15);
}

// AudioContext'i ilk dokunuşta başlat
document.addEventListener('pointerdown', _getCtx, { once: true });

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
      cellEl.dataset.x = x;
      cellEl.dataset.y = y;

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

// === SCORE UNLOCK BİLDİRİM ===
let lastUnlockNotified = parseInt(localStorage.getItem('bp_last_unlock') || '0');

function checkScoreUnlocks() {
  const thresholds = [10000, 30000, 50000, 100000];
  for (const t of thresholds) {
    if (score >= t && lastUnlockNotified < t) {
      lastUnlockNotified = t;
      localStorage.setItem('bp_last_unlock', t);
      showUnlockToast(t);
      vibrate([50, 30, 50, 30, 80]);
      break;
    }
  }
}

function showUnlockToast(threshold) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;top:80px;left:50%;transform:translateX(-50%);
    background:linear-gradient(135deg,#b04dff,#4d7cff);
    color:#fff;padding:12px 24px;border-radius:16px;
    font-size:14px;font-weight:700;z-index:9999;
    pointer-events:none;text-align:center;
    box-shadow:0 4px 20px rgba(176,77,255,0.4);
    animation:xpToastAnim 2.5s ease forwards;
  `;
  toast.innerHTML = `🎉 Yeni Bloklar Açıldı!<br><span style="font-size:11px;opacity:0.85">${threshold.toLocaleString()} skor → 2 yeni şekil</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
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

  // Score unlock bildirimi
  checkScoreUnlocks();

  // High score ekrana yaz
  if (highScoreEl) {
    highScoreEl.textContent = highScore;
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
  isGameOver = true;

  const screen    = document.getElementById("gameOverScreen");
  const scoreText = document.getElementById("finalScore");
  const isTimeMode = window.currentGameMode === 'timeattack';

  // Skor kayıt
  const hsKey = isTimeMode ? 'bp_time_high_score' : 'bb_high_score';
  const savedHS = parseInt(localStorage.getItem(hsKey) || '0');
  if (score > savedHS) {
    localStorage.setItem(hsKey, score);
    if (!isTimeMode) highScore = score;
    setTimeout(() => { triggerNewRecord(); playSndRecord(); }, 2200);
  }
  if (!isTimeMode && score > highScore) {
    highScore = score;
    localStorage.setItem('bb_high_score', highScore);
  }

  // Ekran mesajı hazırla (henüz gösterme)
  const modeLabel = isTimeMode ? '⏱ Zaman Modu' : '🎮 Klasik Mod';
  scoreText.innerHTML = `<span style="font-size:12px;opacity:0.5;display:block;margin-bottom:4px;">${modeLabel}</span>Score: ${score}`;

  // Dramatik game over animasyonu
  playGameOverSequence(() => {
    // Animasyon bitti, ekranı göster
    screen.style.visibility = "visible";

    // XP, achievement, daily
    if (typeof window.onGameEnd === 'function')
      window.onGameEnd(isTimeMode ? Math.floor(score * 1.5) : score);
    if (typeof updateAchievementStats === 'function')
      updateAchievementStats(score, gameBlocksPlaced, gameLinesCleared, gameMaxCombo);
    if (typeof checkDailyChallenge === 'function')
      setTimeout(() => checkDailyChallenge(score, gameBlocksPlaced, gameLinesCleared, gameMaxCombo), 300);

    // Leaderboard
    setTimeout(() => {
      if (typeof window.submitScoreToLeaderboard === 'function')
        window.submitScoreToLeaderboard(score, window.currentGameMode || 'normal');
    }, 800);
  });
}

function playGameOverSequence(onDone) {
  const boardEl = document.getElementById('board');
  if (!boardEl) { onDone(); return; }
  const cells = document.querySelectorAll('.board-cell');

  // 1. Orta şerit banner
  const banner = document.createElement('div');
  banner.style.cssText = `
    position:absolute; left:0; right:0;
    top:50%; transform:translateY(-50%);
    background:rgba(10,10,20,0.92);
    border-top:2px solid rgba(239,68,68,0.6);
    border-bottom:2px solid rgba(239,68,68,0.6);
    padding:14px 0; text-align:center;
    z-index:50; pointer-events:none;
    animation:bannerSlide 0.35s cubic-bezier(0.2,1.3,0.4,1) both;
  `;
  banner.innerHTML = `<span style="color:#f87171;font-size:18px;font-weight:900;font-family:'Nunito',sans-serif;letter-spacing:1px;">Boş yer kalmadı!</span>`;
  boardEl.style.position = 'relative';
  boardEl.appendChild(banner);

  // Banner animasyon CSS
  if (!document.getElementById('goAnimStyle')) {
    const s = document.createElement('style');
    s.id = 'goAnimStyle';
    s.textContent = `
      @keyframes bannerSlide {
        from { opacity:0; transform:translateY(-50%) scaleX(0.3); }
        to   { opacity:1; transform:translateY(-50%) scaleX(1); }
      }
      @keyframes cellDestroy {
        0%   { transform:scale(1) rotate(0deg); opacity:1; filter:brightness(2); }
        40%  { transform:scale(1.3) rotate(var(--rot)); opacity:1; }
        100% { transform:scale(0) rotate(var(--rot)); opacity:0; }
      }
    `;
    document.head.appendChild(s);
  }

  // 2. Dramatik düşen ses
  playSndGameOverDrama();

  // 3. 400ms sonra bloklar dalgalanarak patlar
  setTimeout(() => {
    banner.remove();

    // Dolu hücreleri topla
    const filled = [];
    for (let y = 0; y < BOARD_SIZE; y++)
      for (let x = 0; x < BOARD_SIZE; x++)
        if (board[y][x] !== null) filled.push({x, y, cell: cells[y*BOARD_SIZE+x]});

    // Ortadan dışa doğru dalga
    filled.sort((a, b) => {
      const da = Math.abs(a.x-3.5) + Math.abs(a.y-3.5);
      const db = Math.abs(b.x-3.5) + Math.abs(b.y-3.5);
      return da - db;
    });

    filled.forEach(({cell}, i) => {
      const delay = i * 18;
      setTimeout(() => {
        if (!cell) return;
        const rot = (Math.random()-0.5)*40 + 'deg';
        cell.style.setProperty('--rot', rot);
        cell.style.animation = `cellDestroy 0.35s ease-out forwards`;
      }, delay);
    });

    // 4. Hepsi bittikten sonra game over ekranı
    const totalDelay = filled.length * 18 + 400;
    setTimeout(() => {
      flashGameover();
      onDone();
    }, totalDelay);

  }, 600);
}

// Game over dramatik ses: dırırırırı yüksekten alçağa
function playSndGameOverDrama() {
  const ctx = _getCtx(); if (!ctx || !_isOn()) return;
  try {
    const t = ctx.currentTime;

    // Ana düşen ses — yüksekten alçağa hızlı
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 1.2);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.setValueAtTime(0.4, t + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    osc.start(t); osc.stop(t + 1.4);

    // Titreşim efekti — LFO ile
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(18, t);
    lfo.frequency.linearRampToValueAtTime(6, t + 1.2);
    lfoGain.gain.setValueAtTime(80, t);
    lfoGain.gain.linearRampToValueAtTime(20, t + 1.2);
    lfo.start(t); lfo.stop(t + 1.4);

    // İkinci harmonik
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, t);
    osc2.frequency.exponentialRampToValueAtTime(40, t + 1.3);
    gain2.gain.setValueAtTime(0.2, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    osc2.start(t); osc2.stop(t + 1.4);

  } catch(e) {}
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
      piecesEl.appendChild(createPieceElement(shapeIndex));
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
      if (btnClearRow.dataset.xpMode === 'true') {
        buyPowerupWithXP('clearRow'); return;
      }
      if (clearRowCharges <= 0) return;
      clearRowMode = !clearRowMode;
      if (clearRowMode && selectedPiece) {
        selectedPiece.classList.remove('selected');
        selectedPiece = null; selectedShape = null;
      }
      renderBoard();
      playSndPlace();
      btnClearRow.classList.add('used-flash');
      setTimeout(() => btnClearRow.classList.remove('used-flash'), 250);
      updatePowerupUI();
    });
  }

  if (btnReroll) {
    btnReroll.addEventListener('click', () => {
      if (isGameOver) return;
      if (btnReroll.dataset.xpMode === 'true') {
        buyPowerupWithXP('reroll'); return;
      }
      if (rerollCharges <= 0) return;
      saveState();
      rerollPieces();
      rerollCharges--;
      playSndPlace();
      btnReroll.classList.add('used-flash');
      setTimeout(() => btnReroll.classList.remove('used-flash'), 250);
      updatePowerupUI();
    });
  }

  if (btnUndo) {
    btnUndo.addEventListener('click', () => {
      if (isGameOver) return;
      if (btnUndo.dataset.xpMode === 'true') {
        buyPowerupWithXP('undo'); return;
      }
      if (undoCharges <= 0 || !lastState) return;
      restoreState();
      undoCharges--;
      lastState = null;
      playSndPlace();
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
  const isHard = window.currentGameMode === 'hard';
  const isTimeMode = window.currentGameMode === 'timeattack';

  function setupPUBtn(btn, charges, mode, label, xpKey, xpCost) {
    if (!btn) return;
    if (isHard || isTimeMode) {
      btn.disabled = true;
      btn.innerHTML = `${label} <span class="pu-count" style="opacity:0.4">—</span>`;
      return;
    }
    if (charges > 0 && !isGameOver) {
      btn.disabled = false;
      btn.innerHTML = mode
        ? `${label} (Satırı Seç)`
        : `${label} <span class="pu-count">${charges}</span>`;
      btn.classList.toggle('active', !!mode);
      btn.dataset.xpMode = 'false';
    } else if (!isGameOver) {
      btn.disabled = false;
      btn.innerHTML = `${label} <span class="pu-xp-buy">💎 +1 · ${xpCost} XP</span>`;
      btn.dataset.xpMode = 'true';
      btn.dataset.xpKey  = xpKey;
      btn.classList.remove('active');
    } else {
      btn.disabled = true;
      btn.innerHTML = `${label} <span class="pu-count">0</span>`;
      btn.dataset.xpMode = 'false';
    }
  }

  setupPUBtn(btnClearRow, clearRowCharges, clearRowMode, 'Satır Sil', 'clearRow', POWERUP_XP_COST.clearRow);
  setupPUBtn(btnReroll,   rerollCharges,   false,         'Yenile',    'reroll',   POWERUP_XP_COST.reroll);
  setupPUBtn(btnUndo,     undoCharges,     false,         'Geri Al',   'undo',     POWERUP_XP_COST.undo);
}

// === PARÇA OLUŞTUR ===
function createPieceElement(shapeIndex) {
  const shape = PIECES[shapeIndex];

  const slotEl = document.createElement('div');
  slotEl.classList.add('piece-slot');
  slotEl.dataset.shapeIndex = shapeIndex;

  const pieceEl = document.createElement('div');
  pieceEl.classList.add('piece');
  pieceEl.dataset.shapeIndex = shapeIndex;
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
      rowEl.appendChild(cellEl);
    });
    pieceEl.appendChild(rowEl);
  });

  slotEl.appendChild(pieceEl);

  // Tek event listener — slotEl'e bağlı, bubble ile piece-cell'den de gelir
  slotEl.addEventListener('pointerdown', (e) => {
    if (isGameOver || clearRowMode) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    startDragPiece(pieceEl, shape, e);
  });

  return slotEl;
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
      const startX = Math.round(bx - cx);
      const startY = Math.round(by - cy);

      if (startX < 0 || startY < 0 || startX + w > BOARD_SIZE || startY + h > BOARD_SIZE) continue;
      if (!board[startY] || !board[startY + h - 1]) continue; // ekstra güvenlik

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
  if (!piecesEl) return;
  piecesEl.innerHTML = '';
  selectedPiece = null;
  selectedShape = null;

  // Tahtaya sığan adaylar
  const available = getAvailablePieceIndices();
  const placeable = available.filter(i => canPlaceShapeAnywhere(PIECES[i]));
  const pool = placeable.length > 0 ? placeable : available;

  const helpScore = new Map();
  for (const idx of pool) helpScore.set(idx, bestHelpScoreForShape(PIECES[idx]));

  function sizeWeightFor(idx) {
    const sh = PIECES[idx];
    let cells = 0;
    for (let y = 0; y < sh.length; y++)
      for (let x = 0; x < sh[0].length; x++)
        if (sh[y][x] === 1) cells++;
    if (cells <= 2) return 2.2;
    if (cells <= 4) return 1.6;
    if (cells <= 6) return 1.2;
    return 1.0;
  }

  // Mod bazlı yardım oranı
  const mode = window.currentGameMode || 'classic';
  let smartChance;
  if (mode === 'easy')        smartChance = 1.00; // %100 yardımcı
  else if (mode === 'hard')   smartChance = 0.00; // %0 tamamen rastgele
  else if (mode === 'timeattack') smartChance = 0.80; // zaman modunda orta
  else                        smartChance = 0.70; // normal: %70

  for (let k = 0; k < 3; k++) {
    let shapeIndex;
    if (Math.random() < smartChance && pool.length > 0) {
      const weights = pool.map(idx => 1.0 + Math.max(0, helpScore.get(idx) ?? 0) * 0.12 + sizeWeightFor(idx));
      shapeIndex = weightedPick(pool, weights);
    } else {
      shapeIndex = pool[Math.floor(Math.random() * pool.length)];
    }
    piecesEl.appendChild(createPieceElement(shapeIndex));
  }
}



// === HER YERE SIĞAR MI (GAME OVER KONTROLÜ İÇİN) ===
function canPlaceShapeAnywhere(shape) {
  const h = shape.length;
  const w = shape[0].length;

  for (let startY = 0; startY <= BOARD_SIZE - h; startY++) {
    for (let startX = 0; startX <= BOARD_SIZE - w; startX++) {
      let fits = true;
      for (let y = 0; y < h && fits; y++) {
        for (let x = 0; x < w && fits; x++) {
          if (shape[y][x] === 1 && board[startY + y][startX + x] !== null) {
            fits = false;
          }
        }
      }
      if (fits) return true;
    }
  }

  // Sığmıyorsa board'u logla
  console.log(`${h}x${w} sığmıyor. Board:`);
  for (let y = 0; y < BOARD_SIZE; y++) {
    let row = '';
    for (let x = 0; x < BOARD_SIZE; x++) row += board[y][x] === null ? '.' : '#';
    console.log(row);
  }
  return false;
}

// === GAME OVER KONTROLÜ ===
function checkGameOver() {
  const piecesEl = document.getElementById('pieces');
  if (!piecesEl) return;

  const pieceNodes = piecesEl.querySelectorAll('.piece-slot .piece');
  if (pieceNodes.length === 0) return;

  let anyCanPlace = false;
  for (const p of pieceNodes) {
    const idx = parseInt(p.dataset.shapeIndex, 10);
    if (isNaN(idx)) continue;
    const shape = PIECES[idx];
    if (!shape) continue;
    if (canPlaceShapeAnywhere(shape)) { anyCanPlace = true; break; }
  }

  if (anyCanPlace) return;

  // Zor mod ve zaman modunda powerup yok sayılır
  const isHard = window.currentGameMode === 'hard';
  const isTime = window.currentGameMode === 'timeattack';
  if (!isHard && !isTime && (clearRowCharges > 0 || rerollCharges > 0 || undoCharges > 0)) return;

  isGameOver = true;
  updatePowerupUI();
  playSndGameOver();
  vibrate([80, 40, 80, 40, 120]);
  if (isTime && typeof window.stopTimer === 'function') window.stopTimer();
  setTimeout(() => showGameOver(), 50);
}

// === PARÇAYI YERLEŞTİRME (direkt startX, startY) ===
function tryPlacePieceAt(startX, startY) {
  if (!selectedShape) return;
  if (isGameOver) return;

  const h = selectedShape.length;
  const w = selectedShape[0].length;

  // Sınır kontrolü
  if (startX < 0 || startY < 0 || startX + w > BOARD_SIZE || startY + h > BOARD_SIZE) return;

  // Çakışma kontrolü
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (selectedShape[y][x] === 1 && board[startY + y][startX + x] !== null) return;
    }
  }

  // Geçerli hamle → state kaydet
  saveState();

  let placedCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (selectedShape[y][x] === 1) {
        const type = getRandomElementType();
        const finalColor = (type === 'normal')
          ? (colorToHex(selectedPieceColor) || getColorForType(type))
          : getColorForType(type);

        board[startY + y][startX + x] = {
          type, color: finalColor,
          colorName: (type === 'normal') ? selectedPieceColor : null,
          justPlaced: true
        };

        const cellEl = document.querySelector(`.board-cell[data-x="${startX + x}"][data-y="${startY + y}"]`);
        if (cellEl) {
          cellEl.classList.add("pop", "color-pop");
          setTimeout(() => cellEl.classList.remove("color-pop"), 300);
        }
        placedCount++;
      }
    }
  }

  playSndPlace();
  vibrate(30);
  score += placedCount;
  gameBlocksPlaced += placedCount;

  // Zaman modunda blok başına +0.5s
  if (typeof window.addTime === 'function') window.addTime(0.5);

  const bonus = clearCompletedLines();
  score += bonus;
  updateScore();

  // Seçili parçayı sil
  if (selectedPiece) {
    const slot = selectedPiece.closest('.piece-slot') || selectedPiece;
    slot.innerHTML = '';
    slot.style.pointerEvents = 'none';
  }
  selectedPiece = null;
  selectedShape = null;
  selectedPieceColor = null;

  renderBoard();

  const remainingPieces = document.querySelectorAll('.piece-slot .piece');
  if (remainingPieces.length === 0) generatePieces();

  setTimeout(() => {
    checkGameOver();
    saveGameState();
  }, 350);
}

// === PARÇAYI YERLEŞTİRME (eski — ağırlık merkezi bazlı, click için) ===
function tryPlacePiece(boardX, boardY) {
  if (!selectedShape) return;
  if (isGameOver) return;
  const h = selectedShape.length;
  const w = selectedShape[0].length;
  const { cx: centerX, cy: centerY } = getShapeCenter(selectedShape);
  const sx = Math.max(0, Math.min(BOARD_SIZE - w, Math.round(boardX - centerX)));
  const sy = Math.max(0, Math.min(BOARD_SIZE - h, Math.round(boardY - centerY)));
  let fits = true;
  for (let y = 0; y < h && fits; y++)
    for (let x = 0; x < w && fits; x++)
      if (selectedShape[y][x] === 1 && board[sy+y][sx+x] !== null) fits = false;
  if (fits) tryPlacePieceAt(sx, sy);
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


    // 🔔 Patlamadan önce uyarı glow (animasyon açıksa)
  const animOn = localStorage.getItem('tgl-anim') !== 'off';
  if (animOn) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (toClear[y][x] && board[y][x] !== null) {
          const cell = cells[y * BOARD_SIZE + x];
          if (cell) cell.classList.add("pre-glow");
        }
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
  gameLinesCleared += lineCount;
  gameMaxCombo = Math.max(gameMaxCombo, clearStreak);

  let comboMultiplier = 1 + (clearStreak - 1) * 0.5;

  if (comboMultiplier < 1) comboMultiplier = 1;

  bonusScore *= comboMultiplier;

  spawnFloatingScore(bonusScore);

  // toplam skor popup
  spawnFloatingScore(Math.floor(BOARD_SIZE/2), Math.floor(BOARD_SIZE/2), bonusScore);

  const _animOn = localStorage.getItem('tgl-anim') !== 'off';
  if (clearStreak >= 2) {
    showComboPopup(clearStreak);
    if (_animOn) { flashCombo(); shakeBoardBig(); spawnComboParticles(); }
  } else {
    if (_animOn) flashClear();
  }
  triggerScoreBounce();

  // Zaman modunda satır/sütun başına +3s
  if (typeof window.addTime === 'function') {
    window.addTime(lineCount * 3);
  }

  // Ses: satır/sütun kırılma + combo/streak
  if (lineCount > 0) {
    vibrate(lineCount >= 2 ? [40,20,40] : 50);
    if (lineCount >= 2 || clearStreak >= 2) {
      playSndCombo(clearStreak);
    } else {
      playSndClear(lineCount);
    }
  }

    const boardEl = document.getElementById("board");
    boardEl.classList.add("shake");

    // Board'u ANINDA temizle — game over kontrolü doğru çalışsın
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (toClear[y][x] && board[y][x] !== null) {
          board[y][x] = null;
        }
      }
    }

    // Görsel animasyon için timeout
    setTimeout(() => {
      const burstCells = [];
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          if (toClear[y][x]) {
            const cell = cells[y * BOARD_SIZE + x];
            if (cell) {
              cell.classList.add("explode");
              burstCells.push({ cell, color: '#fff' });
            }
          }
        }
      }
      const animEnabled = localStorage.getItem('tgl-anim') !== 'off';
      if (animEnabled) {
        const sample = burstCells.filter((_, i) => i % Math.ceil(burstCells.length / 4) === 0).slice(0, 4);
        sample.forEach(({ cell, color }) => spawnBurstParticles(cell, color, 4));
      }

      setTimeout(() => {
        renderBoard();
        boardEl.classList.remove("shake");
      }, 200);

    }, 50);

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


// === OYUN KAYIT SİSTEMİ ===
function saveGameState() {
  if (isGameOver) {
    localStorage.removeItem('bp_game_save');
    return;
  }

  const piecesEl = document.getElementById('pieces');
  const piecesData = [];
  if (piecesEl) {
    piecesEl.querySelectorAll('.piece').forEach(p => {
      piecesData.push({
        shapeIndex: parseInt(p.dataset.shapeIndex, 10),
        colorName: p.dataset.pieceColor || 'red',
      });
    });
  }

  const saveData = {
    board: board.map(row => row.map(cell => cell ? { ...cell } : null)),
    score,
    displayedScore: score,
    clearRowCharges,
    rerollCharges,
    undoCharges,
    clearStreak,
    piecesData,
    savedAt: Date.now(),
  };

  localStorage.setItem('bp_game_save', JSON.stringify(saveData));
}

function loadGameState() {
  const raw = localStorage.getItem('bp_game_save');
  if (!raw) return false;

  try {
    const s = JSON.parse(raw);
    if (!s.board || !s.piecesData) return false;

    board = s.board.map(row => row.map(cell => cell ? { ...cell } : null));
    score = s.score || 0;
    displayedScore = score;
    clearRowCharges = s.clearRowCharges ?? 1;
    rerollCharges   = s.rerollCharges   ?? 1;
    undoCharges     = s.undoCharges     ?? 1;
    clearStreak     = s.clearStreak     ?? 0;

    renderBoard();
    loadTheme();

    const piecesEl = document.getElementById('pieces');
    if (piecesEl) {
      piecesEl.innerHTML = '';
      selectedPiece = null;
      selectedShape = null;
      s.piecesData.forEach(pd => {
        if (pd.shapeIndex == null) return;
        const slotEl = createPieceElement(pd.shapeIndex);
        const pieceEl = slotEl.querySelector('.piece');
        if (pieceEl) {
          pieceEl.dataset.pieceColor = pd.colorName;
          pieceEl.querySelectorAll('.piece-cell.filled').forEach(cell => {
            cell.style.background = colorToHex(pd.colorName);
          });
        }
        piecesEl.appendChild(slotEl);
      });
    }

    updateScore();
    updatePowerupUI();
    return true;
  } catch(e) {
    console.warn('Kayıt yüklenemedi:', e);
    localStorage.removeItem('bp_game_save');
    return false;
  }
}

function clearGameSave() {
  localStorage.removeItem('bp_game_save');
}


// === OYUNU SIFIRLA ===
function resetGame() {
  clearGameSave();
  lastUnlockNotified = 0;
  localStorage.removeItem('bp_last_unlock');
  // Oyun istatistiklerini sıfırla
  gameBlocksPlaced = 0;
  gameLinesCleared = 0;
  gameMaxCombo = 0;
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
  playSndPick(); // Blok alırken pop sesi
  dragShape = shape;
  dragPieceEl = pieceEl;
  dragPointerId = event.pointerId || null;

  // Lift: parça parmağın üstünde görünsün (sadece görsel, ghost etkilenmez)
  const boardEl = document.getElementById('board');
  const bRect = boardEl.getBoundingClientRect();
  const cellH = bRect.height / BOARD_SIZE;
  // Touch: 2.5 hücre yukarı. Mouse: 0
  dragLiftY = (event.pointerType === 'touch') ? Math.round(cellH * 2.5) : 0;

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
  // Orijinal parçayı gizle — sürükleme sırasında aşağıda görünmesin
  pieceEl.style.opacity = '0';

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
  updateGhostPreview(e.clientX, e.clientY); // ghost = parmağın tam koordinatı
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
  // Orijinal parçayı geri göster (yerleştirilemediyse)
  if (dragPieceEl) {
    dragPieceEl.style.opacity = '1';
  }

  document.body.classList.add("snap-slow");
  setTimeout(() => document.body.classList.remove("snap-slow"), 80);


  // lastGhostCell artık [startX, startY] — direkt tryPlacePiece'e ver
  if (lastGhostCell && selectedShape) {
    const [startX, startY] = lastGhostCell;
    tryPlacePieceAt(startX, startY);
  } else if (selectedShape) {
    const snapped = trySnapToValid(e.clientX, e.clientY);
    if (snapped) tryPlacePieceAt(snapped[0], snapped[1]);
  }

  isDragging = false;
  dragShape = null;
  dragPieceEl = null;
  dragPointerId = null;
  lastGhostCell = null;

  clearGhostPreview();
}

function updateDragPosition(e) {
  if (!dragPreviewEl || !selectedShape) return;
  const pr = dragPreviewEl.getBoundingClientRect();
  dragPreviewEl.style.left = (e.clientX - pr.width / 2) + "px";
  dragPreviewEl.style.top  = (e.clientY - dragLiftY - pr.height / 2) + "px";
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
  // Ghost parmağın tam koordinatına göre — lift yok
  updateGhostPreview(e.clientX, e.clientY);
}

// Ghost: parmağın altındaki hücreyi bul, tüm geçerli pozisyonları dene
function trySnapToValid(clientX, clientY) {
  if (!selectedShape) return null;
  const boardEl = document.getElementById("board");
  const rect = boardEl.getBoundingClientRect();
  const cellSize = rect.width / BOARD_SIZE;
  const h = selectedShape.length;
  const w = selectedShape[0].length;

  // Board dışındaysa null
  if (clientX < rect.left || clientX > rect.right ||
      clientY < rect.top  || clientY > rect.bottom) return null;

  // Parmağın grid hücresi
  const fingerCol = Math.floor((clientX - rect.left) / cellSize);
  const fingerRow = Math.floor((clientY - rect.top)  / cellSize);

  // Tüm geçerli startX/startY kombinasyonlarını dene
  // Parmağın altındaki hücreyi kapsayan pozisyonları bul
  let bestSx = -1, bestSy = -1, bestDist = Infinity;

  for (let sy = 0; sy <= BOARD_SIZE - h; sy++) {
    for (let sx = 0; sx <= BOARD_SIZE - w; sx++) {
      // Bu pozisyon parmağı kapsıyor mu?
      const coversX = sx <= fingerCol && fingerCol < sx + w;
      const coversY = sy <= fingerRow && fingerRow < sy + h;

      // Merkeze olan mesafe
      const midX = sx + (w - 1) / 2;
      const midY = sy + (h - 1) / 2;
      const dist = Math.abs(fingerCol - midX) + Math.abs(fingerRow - midY);

      // Parmağı kapsayan pozisyonlara öncelik ver
      const adjustedDist = (coversX && coversY) ? dist - 100 : dist;

      // Çakışma kontrolü
      let fits = true;
      for (let y = 0; y < h && fits; y++)
        for (let x = 0; x < w && fits; x++)
          if (selectedShape[y][x] === 1 && board[sy+y][sx+x] !== null)
            fits = false;

      if (fits && adjustedDist < bestDist) {
        bestDist = adjustedDist;
        bestSx = sx;
        bestSy = sy;
      }
    }
  }

  // Çok uzaksa (2 hücreden fazla) gösterme
  if (bestSx === -1 || bestDist > 2) return null;
  return [bestSx, bestSy];
}

function updateGhostPreview(clientX, clientY) {
  clearPrediction();
  clearGhostPreview();
  lastGhostCell = null;

  if (!isDragging || !selectedShape || isGameOver) return;

  const snapped = trySnapToValid(clientX, clientY);
  if (!snapped) return;

  const [startX, startY] = snapped;
  const h = selectedShape.length;
  const w = selectedShape[0].length;

  lastGhostCell = [startX, startY];

  // Ghost çiz
  const cells = document.querySelectorAll('.board-cell');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (selectedShape[y][x] === 1) {
        const idx = (startY + y) * BOARD_SIZE + (startX + x);
        const cellEl = cells[idx];
        if (cellEl) cellEl.classList.add('ghost-valid');
      }
    }
  }

  // Clear predictor
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
