// Board cell cache - querySelectorAll'u cachelemek için
let _cellCache = null;
let _boardElCache = null;
function getCells() {
  if (!_cellCache || _cellCache.length !== BOARD_SIZE * BOARD_SIZE) {
    _cellCache = document.querySelectorAll('.board-cell');
  }
  return _cellCache;
}
function getBoardEl() {
  if (!_boardElCache) _boardElCache = document.getElementById('board');
  return _boardElCache;
}
function invalidateCellCache() { _cellCache = null; }

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
    boardBg: 'rgba(0,0,0,0.4)', cellBorder: 'rgba(255,255,255,0.04)', glow: false, cellBg: '#2e2a67',
  },
  pastel: {
    name: 'Pastel',
    colors: { red:'#ffb3b3', blue:'#b3ccff', green:'#b3f0cc', yellow:'#fff0b3', orange:'#ffd9b3', purple:'#dbb3ff' },
    boardBg: '#2a2635', cellBorder: '#3a3545', glow: false, cellBg: '#3a2f55',
  },
  ocean: {
    name: 'Ocean',
    colors: { red:'#00b4d8', blue:'#0077b6', green:'#48cae4', yellow:'#90e0ef', orange:'#0096c7', purple:'#023e8a' },
    boardBg: '#012a3a', cellBorder: '#01354a', glow: false, cellBg: '#013a52',
  },
  neon: {
    name: 'Neon',
    colors: { red:'#ff003c', blue:'#00cfff', green:'#00ff88', yellow:'#ffe600', orange:'#ff6600', purple:'#cc00ff' },
    boardBg: '#0a0a1a', cellBorder: '#1a1a3a', glow: true, cellBg: '#12122a',
  },
  forest: {
    name: 'Forest',
    colors: { red:'#2d6a4f', blue:'#52b788', green:'#95d5b2', yellow:'#b7e4c7', orange:'#74c69d', purple:'#1b4332' },
    boardBg: '#0a1f15', cellBorder: '#1a3525', glow: false, cellBg: '#1a3528',
  },
  retro: {
    name: 'Retro',
    colors: { red:'#c0392b', blue:'#2471a3', green:'#1e8449', yellow:'#d4ac0d', orange:'#ca6f1e', purple:'#7d3c98' },
    boardBg: '#1a1a1a', cellBorder: '#333', glow: false, cellBg: '#2a2020',
  },
  sunset: {
    name: 'Sunset',
    colors: { red:'#f72585', blue:'#b5179e', green:'#7209b7', yellow:'#ff6b35', orange:'#f7931e', purple:'#ffcd3c' },
    boardBg: '#1a0520', cellBorder: '#2a0a30', glow: true, cellBg: '#2a0a30',
  },
  galaxy: {
    name: 'Galaxy',
    colors: { red:'#e91e63', blue:'#2196f3', green:'#00bcd4', yellow:'#9c27b0', orange:'#7b2ff7', purple:'#3f51b5' },
    boardBg: '#0d0221', cellBorder: '#1a0a3a', glow: true, cellBg: '#160830',
  },
  ice: {
    name: 'Ice',
    colors: { red:'#caf0f8', blue:'#90e0ef', green:'#48cae4', yellow:'#0096c7', orange:'#0077b6', purple:'#ade8f4' },
    boardBg: '#010d1a', cellBorder: '#021525', glow: false, cellBg: '#0a1e2e',
  },
  gold: {
    name: 'Gold',
    colors: { red:'#f9c74f', blue:'#f8961e', green:'#f3722c', yellow:'#ffb700', orange:'#e9c46a', purple:'#f4a261' },
    boardBg: '#1a1000', cellBorder: '#2a1a00', glow: true, cellBg: '#2a1a00',
  },
  lava: {
    name: 'Lava',
    colors: { red:'#ff1744', blue:'#ff3d00', green:'#ffea00', yellow:'#ff6d00', orange:'#dd2c00', purple:'#ff6f00' },
    boardBg: '#1a0800', cellBorder: '#2a1000', glow: false, cellBg: '#2a0a00',
  },
  candy: {
    name: 'Candy',
    colors: { red:'#f48fb1', blue:'#ce93d8', green:'#80deea', yellow:'#a5d6a7', orange:'#fff59d', purple:'#ffcc80' },
    boardBg: '#1a1028', cellBorder: '#2a2038', glow: false, cellBg: '#251535',
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
  if (!t) return;

  // Board arka planı
  const boardEl = document.getElementById('board');
  if (boardEl) {
    boardEl.style.background = t.boardBg || 'rgba(0,0,0,0.4)';
  }

  // Board hücre rengi — CSS değişkeni ile tüm hücreler güncellenir
  document.documentElement.style.setProperty('--board-cell-bg', t.cellBg || '#2e2a67');

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

// Hex rengi "r,g,b" formatına çevir (CSS variable için)
function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return '124,111,247';
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}

// Power-up: Satır Sil
let clearRowCharges = 1;
let clearLineMode = false;
let clearLineType = null; // "row" veya "col"

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
  // ============================================
  // BAŞLANGIÇ BLOKLARI (0 skor) — index 0-31
  // ============================================

  // Tek kare
  [[1]],                                    // 0

  // 2li bloklar
  [[1,1]],                                  // 1 - yatay
  [[1],[1]],                                // 2 - dikey

  // 2x2 kare
  [[1,1],[1,1]],                            // 3

  // Küçük L (3 blok) — 4 yön
  [[1,0],[1,1]],                            // 4  ┘
  [[1,1],[1,0]],                            // 5  └
  [[0,1],[1,1]],                            // 6  ┘ ters
  [[1,1],[0,1]],                            // 7  └ ters

  // 3'lü bloklar
  [[1,1,1]],                               // 8 - yatay
  [[1],[1],[1]],                           // 9 - dikey

  // 4'lü bloklar (I)
  [[1,1,1,1]],                             // 10 - yatay
  [[1],[1],[1],[1]],                       // 11 - dikey

  // L şekli (4 blok) — 4 yön
  [[1,0],[1,0],[1,1]],                     // 12
  [[1,1,1],[1,0,0]],                       // 13
  [[1,1],[0,1],[0,1]],                     // 14
  [[0,0,1],[1,1,1]],                       // 15

  // J şekli (ters L, 4 blok) — 4 yön
  [[0,1],[0,1],[1,1]],                     // 16
  [[1,0,0],[1,1,1]],                       // 17
  [[1,1],[1,0],[1,0]],                     // 18
  [[1,1,1],[0,0,1]],                       // 19

  // S şekli — 4 yön
  [[0,1,1],[1,1,0]],                       // 20 - yatay
  [[1,0],[1,1],[0,1]],                     // 21 - dikey
  [[1,1,0],[0,1,1]],                       // 22 - yatay ters (=Z yatay)
  [[0,1],[1,1],[1,0]],                     // 23 - dikey ters (=Z dikey)

  // Z şekli — 4 yön (S ile zıt, ayrı index'te tutuyoruz)
  [[1,1,0],[0,1,1]],                       // 24 - yatay
  [[0,1],[1,1],[1,0]],                     // 25 - dikey
  [[0,1,1],[1,1,0]],                       // 26 - yatay ters (=S yatay)
  [[1,0],[1,1],[0,1]],                     // 27 - dikey ters (=S dikey)

  // T şekli — 4 yön
  [[1,1,1],[0,1,0]],                       // 28
  [[1,0],[1,1],[1,0]],                     // 29
  [[0,1,0],[1,1,1]],                       // 30
  [[0,1],[1,1],[0,1]],                     // 31

  // ============================================
  // 15.000 SKOR UNLOCK — index 32-35
  // ============================================

  // 3x2 dikdörtgen
  [[1,1,1],[1,1,1]],                       // 32
  [[1,1],[1,1],[1,1]],                     // 33

  // Büyük L (4'lü) — 4 yön
  [[1,0],[1,0],[1,0],[1,1]],              // 34
  [[1,1,1,1],[1,0,0,0]],                  // 35

  // ============================================
  // 30.000 SKOR UNLOCK — index 36-39
  // ============================================

  // Büyük L (4'lü) diğer yönler
  [[1,1],[0,1],[0,1],[0,1]],              // 36
  [[0,0,0,1],[1,1,1,1]],                  // 37

  // Büyük J (4'lü) — 4 yön
  [[0,1],[0,1],[0,1],[1,1]],              // 38
  [[1,0,0,0],[1,1,1,1]],                  // 39

  // ============================================
  // 50.000 SKOR UNLOCK — index 40-43
  // ============================================

  // Büyük J diğer yönler
  [[1,1],[1,0],[1,0],[1,0]],              // 40
  [[1,1,1,1],[0,0,0,1]],                  // 41

  // 5'li I
  [[1,1,1,1,1]],                          // 42
  [[1],[1],[1],[1],[1]],                   // 43

  // ============================================
  // 70.000 SKOR UNLOCK — index 44-47
  // ============================================

  // Artı şekli
  [[0,1,0],[1,1,1],[0,1,0]],             // 44

  // U şekli — 4 yön
  [[1,0,1],[1,1,1]],                      // 45
  [[1,1],[1,0],[1,1]],                    // 46
  [[1,1,1],[1,0,1]],                      // 47

  // ============================================
  // 100.000 SKOR UNLOCK — index 48-49
  // ============================================

  // 3x3 dolu kare
  [[1,1,1],[1,1,1],[1,1,1]],             // 48

  // Büyük T (5'li) — 2 yön
  [[1,1,1,1,1],[0,0,1,0,0]],             // 49
];

// === SKOR BAZLI UNLOCK SİSTEMİ ===
const PIECE_UNLOCKS = [
  { minScore: 0,      maxIndex: 31 },   // Başlangıç (S/Z 4 yön + T dahil)
  { minScore: 15000,  maxIndex: 35 },   // +dikdörtgen + büyük L
  { minScore: 30000,  maxIndex: 39 },   // +büyük L diğer yönler + büyük J
  { minScore: 50000,  maxIndex: 43 },   // +büyük J diğer yönler + 5'li I
  { minScore: 70000,  maxIndex: 47 },   // +artı + U şekli
  { minScore: 100000, maxIndex: 49 },   // +3x3 kare + büyük T
];

function getAvailablePieceIndices() {
  let maxIdx = 31;
  for (const unlock of PIECE_UNLOCKS) {
    if (score >= unlock.minScore) maxIdx = Math.max(maxIdx, unlock.maxIndex);
  }
  const result = [];
  for (let i = 0; i <= Math.min(maxIdx, PIECES.length - 1); i++) {
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


// === POWERUP ELMAS MALİYETİ ===
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
  const L = window.currentLang || 'tr';
  const names = { clearRow: L==='en'?'Clear Row':'Satır Sil', reroll: L==='en'?'Reroll':'Yenile', undo: L==='en'?'Undo':'Geri Al' };

  // Seçim modal — elmas veya reklam
  const modal = document.createElement('div');
  modal.id = '_puModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:9999;';
  modal.innerHTML = `
    <div style="background:linear-gradient(135deg,#1e2a3a,#243447);border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:24px 20px;text-align:center;width:min(290px,88vw);">
      <div style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.4);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">${L==='en'?'GET POWERUP':'POWERUP AL'}</div>
      <div style="font-size:22px;font-weight:900;color:#fff;font-family:'Nunito',sans-serif;margin-bottom:20px;">${names[type]} +1</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button id="_puAdBtn" style="padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#7c6ff7,#a78bfa);color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;">
          📺 ${L==='en'?'Watch Ad (Free)':'Reklam İzle (Ücretsiz)'}
        </button>
        <button id="_puDiaBtn" style="padding:14px;border:1px solid rgba(96,165,250,${diamonds>=cost?'0.4':'0.2'});border-radius:14px;background:rgba(96,165,250,0.08);color:${diamonds>=cost?'#60a5fa':'rgba(255,255,255,0.3)'};font-size:15px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;">
          💎 ${cost} ${L==='en'?'Diamonds':'Elmas'} ${diamonds < cost ? `(${L==='en'?'Need':'Gereken'}: ${cost-diamonds})` : ''}
        </button>
        <button id="_puCancelBtn" style="padding:12px;border:none;border-radius:14px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);font-size:14px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;">
          ${L==='en'?'Cancel':'İptal'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('_puCancelBtn').onclick = () => modal.remove();

  // Reklam ile al
  document.getElementById('_puAdBtn').onclick = () => {
    modal.remove();
    const giveReward = () => {
      if (type === 'clearRow') { clearRowCharges++; clearLineMode = true; renderBoard(); }
      else if (type === 'reroll') { rerollCharges++; }
      else if (type === 'undo') { undoCharges++; }
      localStorage.setItem('bp_powerups', JSON.stringify({ clearRowCharges, rerollCharges, undoCharges }));
      updatePowerupUI();
      if (typeof playSndPowerup === 'function') playSndPowerup();
      vibrate(40);
    };
    if (typeof window.showRewarded === 'function') window.showRewarded(giveReward);
    else giveReward();
  };

  // Elmas ile al
  document.getElementById('_puDiaBtn').onclick = () => {
    if (diamonds < cost) { showXPShortageToast(cost - diamonds); modal.remove(); return; }
    modal.remove();
    if (!spendDiamonds(cost)) return;
    if (type === 'clearRow') { clearRowCharges++; }
    else if (type === 'reroll') { rerollCharges++; }
    else if (type === 'undo') { undoCharges++; }
    localStorage.setItem('bp_powerups', JSON.stringify({ clearRowCharges, rerollCharges, undoCharges }));
    updatePowerupUI();
    vibrate(40);
    showXPSpentToast(cost, type);
  };
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
  t.textContent = `-${cost} 💎 → ${names[type]} +1`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

// === ELEMENT TİPLERİ ===
function getRandomElementType() {
  return 'normal'; // Element blokları kaldırıldı
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
  // reflow yok: animasyonu adı değiştirerek sıfırla
  overlay.style.animation = 'none';
  overlay.className = 'flash-' + type;
  requestAnimationFrame(() => { overlay.style.animation = ''; });
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

function spawnBurstParticles(cellEl, color, count = 6) {
  // DOM yerine canvas kullan - kasma yok
  const rect = cellEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const n = Math.min(count, 5);
  _initDustCanvas();
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i / n) + Math.random() * 0.5;
    const speed = 3 + Math.random() * 3;
    _dustParticles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      r: 2 + Math.random() * 3,
      color: color || '#fff',
      life: 60 + Math.random() * 20,
    });
  }
  if (!_dustAnimId) _dustAnimId = requestAnimationFrame(_dustLoop);
}

function triggerScoreBounce() {
  const el = document.getElementById('score');
  if (!el) return;
  el.style.animation = 'none';
  requestAnimationFrame(() => {
    el.style.animation = '';
    el.classList.add('score-bounce');
    setTimeout(() => el.classList.remove('score-bounce'), 400);
  });
}

function triggerNewRecord() {
  const el = document.getElementById('high-score');
  if (!el) return;
  el.style.animation = 'none';
  requestAnimationFrame(() => {
    el.style.animation = '';
    el.classList.add('new-record');
    setTimeout(() => el.classList.remove('new-record'), 2000);
  });
}

function shakeBoardBig() {
  // Shake kaldırıldı - layout reflow ve kasma kaynağı
  // Yerine canvas flash - GPU'da, layout etkilenmiyor
  _initDustCanvas();
  if (!_dustCtx) return;
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  const r = boardEl.getBoundingClientRect();
  const colors = getCurrentThemeColors();
  // 4 köşeden parçacık
  [[r.left, r.top],[r.right, r.top],[r.left, r.bottom],[r.right, r.bottom]].forEach(([x,y]) => {
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      _dustParticles.push({
        x, y,
        vx: Math.cos(angle) * (3 + Math.random() * 3),
        vy: Math.sin(angle) * (3 + Math.random() * 3) - 2,
        r: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 50 + Math.random() * 20,
      });
    }
  });
  if (!_dustAnimId) _dustAnimId = requestAnimationFrame(_dustLoop);
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
  // === SKOR ===
  { id:'score_1k',     icon:'🌱', name:'İlk Adım',        nameEn:'First Step',       desc:'1.000 puan kazan',           descEn:'Earn 1,000 points',          cat:'skor',  check: s => s.totalScore >= 1000 },
  { id:'score_5k',     icon:'⭐', name:'Yükselen Yıldız', nameEn:'Rising Star',      desc:'5.000 puan kazan',           descEn:'Earn 5,000 points',          cat:'skor',  check: s => s.totalScore >= 5000 },
  { id:'score_10k',    icon:'🏅', name:'Bin Puan Ustası',  nameEn:'Ten K Master',     desc:'10.000 puan kazan',          descEn:'Earn 10,000 points',         cat:'skor',  check: s => s.totalScore >= 10000 },
  { id:'score_50k',    icon:'🥈', name:'Uzman',            nameEn:'Expert',           desc:'50.000 puan kazan',          descEn:'Earn 50,000 points',         cat:'skor',  check: s => s.totalScore >= 50000 },
  { id:'score_100k',   icon:'🥇', name:'Efsane',           nameEn:'Legend',           desc:'100.000 puan kazan',         descEn:'Earn 100,000 points',        cat:'skor',  check: s => s.totalScore >= 100000 },
  { id:'score_250k',   icon:'💎', name:'Elmas Seviye',     nameEn:'Diamond Tier',     desc:'250.000 puan kazan',         descEn:'Earn 250,000 points',        cat:'skor',  check: s => s.totalScore >= 250000 },
  { id:'score_500k',   icon:'👑', name:'Kral',             nameEn:'King',             desc:'500.000 puan kazan',         descEn:'Earn 500,000 points',        cat:'skor',  check: s => s.totalScore >= 500000 },
  { id:'score_1m',     icon:'🌌', name:'Galaksi Hakimi',   nameEn:'Galaxy Master',    desc:'1.000.000 puan kazan',       descEn:'Earn 1,000,000 points',      cat:'skor',  check: s => s.totalScore >= 1000000 },

  // === TEK OYUNDA SKOR ===
  { id:'best_10k',     icon:'🎯', name:'Keskin Nişancı',   nameEn:'Sharpshooter',     desc:'Tek oyunda 10.000 puan',     descEn:'10,000 in one game',         cat:'skor',  check: s => s.bestScore >= 10000 },
  { id:'best_30k',     icon:'🔭', name:'Gözlemci',         nameEn:'Observer',         desc:'Tek oyunda 30.000 puan',     descEn:'30,000 in one game',         cat:'skor',  check: s => s.bestScore >= 30000 },
  { id:'best_60k',     icon:'🚀', name:'Roket',            nameEn:'Rocket',           desc:'Tek oyunda 60.000 puan',     descEn:'60,000 in one game',         cat:'skor',  check: s => s.bestScore >= 60000 },
  { id:'best_100k',    icon:'🌠', name:'Meteor',           nameEn:'Meteor',           desc:'Tek oyunda 100.000 puan',    descEn:'100,000 in one game',        cat:'skor',  check: s => s.bestScore >= 100000 },

  // === COMBO ===
  { id:'combo_3',      icon:'🔥', name:'Üçlü Kombo',       nameEn:'Triple Combo',     desc:'3x combo yap',               descEn:'Get a 3x combo',             cat:'combo', check: s => s.maxCombo >= 3 },
  { id:'combo_5',      icon:'💥', name:'Beşli Fırtına',    nameEn:'Five Storm',       desc:'5x combo yap',               descEn:'Get a 5x combo',             cat:'combo', check: s => s.maxCombo >= 5 },
  { id:'combo_8',      icon:'⚡', name:'Yıldırım',         nameEn:'Lightning',        desc:'8x combo yap',               descEn:'Get an 8x combo',            cat:'combo', check: s => s.maxCombo >= 8 },
  { id:'combo_12',     icon:'🌪️', name:'Kasırga',          nameEn:'Hurricane',        desc:'12x combo yap',              descEn:'Get a 12x combo',            cat:'combo', check: s => s.maxCombo >= 12 },
  { id:'combo_20',     icon:'🌋', name:'Volkan',           nameEn:'Volcano',          desc:'20x combo yap',              descEn:'Get a 20x combo',            cat:'combo', check: s => s.maxCombo >= 20 },

  // === BLOK ===
  { id:'blocks_200',   icon:'🧱', name:'İnşaatçı',         nameEn:'Builder',          desc:'200 blok yerleştir',         descEn:'Place 200 blocks',           cat:'blok',  check: s => s.totalBlocks >= 200 },
  { id:'blocks_1000',  icon:'🏗️', name:'Mimar',            nameEn:'Architect',        desc:'1.000 blok yerleştir',       descEn:'Place 1,000 blocks',         cat:'blok',  check: s => s.totalBlocks >= 1000 },
  { id:'blocks_5000',  icon:'🏰', name:'Kale Ustası',       nameEn:'Castle Master',    desc:'5.000 blok yerleştir',       descEn:'Place 5,000 blocks',         cat:'blok',  check: s => s.totalBlocks >= 5000 },
  { id:'blocks_15000', icon:'🌆', name:'Şehir Kurucusu',   nameEn:'City Builder',     desc:'15.000 blok yerleştir',      descEn:'Place 15,000 blocks',        cat:'blok',  check: s => s.totalBlocks >= 15000 },
  { id:'blocks_50000', icon:'🌍', name:'Dünya İnşaatçısı', nameEn:'World Builder',    desc:'50.000 blok yerleştir',      descEn:'Place 50,000 blocks',        cat:'blok',  check: s => s.totalBlocks >= 50000 },

  // === SATIR ===
  { id:'lines_20',     icon:'💫', name:'Satır Avcısı',     nameEn:'Line Hunter',      desc:'20 satır/sütun temizle',     descEn:'Clear 20 lines/cols',        cat:'satır', check: s => s.totalLines >= 20 },
  { id:'lines_100',    icon:'🌟', name:'Temizlikçi',       nameEn:'Cleaner',          desc:'100 satır/sütun temizle',    descEn:'Clear 100 lines/cols',       cat:'satır', check: s => s.totalLines >= 100 },
  { id:'lines_500',    icon:'✨', name:'Süpürge',          nameEn:'Sweeper',          desc:'500 satır/sütun temizle',    descEn:'Clear 500 lines/cols',       cat:'satır', check: s => s.totalLines >= 500 },
  { id:'lines_1500',   icon:'🌊', name:'Tsunami',          nameEn:'Tsunami',          desc:'1.500 satır/sütun temizle',  descEn:'Clear 1,500 lines/cols',     cat:'satır', check: s => s.totalLines >= 1500 },
  { id:'lines_5000',   icon:'🌀', name:'Girdap',           nameEn:'Vortex',           desc:'5.000 satır/sütun temizle',  descEn:'Clear 5,000 lines/cols',     cat:'satır', check: s => s.totalLines >= 5000 },

  // === MOD ===
  { id:'mode_hard',    icon:'💀', name:'Cesur Yürek',      nameEn:'Brave Heart',      desc:'Zor modda oyna',             descEn:'Play Hard mode',             cat:'mod',   check: s => s.playedHard },
  { id:'mode_time',    icon:'⏱️', name:'Zamana Karşı',    nameEn:'Against Time',     desc:'Zaman modunda oyna',         descEn:'Play Time mode',             cat:'mod',   check: s => s.playedTime },
  { id:'mode_time_l5', icon:'🚀', name:'Işık Hızı',       nameEn:'Light Speed',      desc:'Zaman Modu Seviye 5 oyna',   descEn:'Play Time Mode Level 5',     cat:'mod',   check: s => s.playedTimeL5 },
  { id:'mode_hard_10k',icon:'🗡️', name:'Demir İrade',     nameEn:'Iron Will',        desc:'Zor modda 10.000 puan',      descEn:'Earn 10,000 in Hard mode',   cat:'mod',   check: s => s.hardModeScore >= 10000 },
  { id:'mode_hard_30k',icon:'⚔️', name:'Savaşçı',         nameEn:'Warrior',          desc:'Zor modda 30.000 puan',      descEn:'Earn 30,000 in Hard mode',   cat:'mod',   check: s => s.hardModeScore >= 30000 },
  { id:'mode_hard_75k',icon:'🔱', name:'Tanrı Savaşçısı', nameEn:'Godlike',          desc:'Zor modda 75.000 puan',      descEn:'Earn 75,000 in Hard mode',   cat:'mod',   check: s => s.hardModeScore >= 75000 },

  // === OYUN SAYISI ===
  { id:'games_10',     icon:'🎮', name:'Oyun Sever',       nameEn:'Game Lover',       desc:'10 oyun oyna',               descEn:'Play 10 games',              cat:'oyun',  check: s => s.totalGames >= 10 },
  { id:'games_50',     icon:'🎯', name:'Bağımlı',          nameEn:'Addicted',         desc:'50 oyun oyna',               descEn:'Play 50 games',              cat:'oyun',  check: s => s.totalGames >= 50 },
  { id:'games_200',    icon:'🏆', name:'Veteran',          nameEn:'Veteran',          desc:'200 oyun oyna',              descEn:'Play 200 games',             cat:'oyun',  check: s => s.totalGames >= 200 },
  { id:'games_500',    icon:'🎖️', name:'Efsane Oyuncu',   nameEn:'Legendary Player', desc:'500 oyun oyna',              descEn:'Play 500 games',             cat:'oyun',  check: s => s.totalGames >= 500 },
  { id:'games_1000',   icon:'🌟', name:'Ölümsüz',          nameEn:'Immortal',         desc:'1.000 oyun oyna',            descEn:'Play 1,000 games',           cat:'oyun',  check: s => s.totalGames >= 1000 },
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
  { id:'score_5000',   icon:'🎯', desc:'5.000 puan kazan',         descEn:'Earn 5,000 points',           check: (s,b,l,c) => s >= 5000,   xp: 5  },
  { id:'score_10000',  icon:'⭐', desc:'10.000 puan kazan',        descEn:'Earn 10,000 points',          check: (s,b,l,c) => s >= 10000,  xp: 8  },
  { id:'score_20000',  icon:'🏅', desc:'20.000 puan kazan',        descEn:'Earn 20,000 points',          check: (s,b,l,c) => s >= 20000,  xp: 12 },
  { id:'score_40000',  icon:'💎', desc:'40.000 puan kazan',        descEn:'Earn 40,000 points',          check: (s,b,l,c) => s >= 40000,  xp: 18 },
  { id:'combo_3',      icon:'🔥', desc:'3x combo yap',             descEn:'Get a 3x combo',              check: (s,b,l,c) => c >= 3,      xp: 5  },
  { id:'combo_5',      icon:'⚡', desc:'5x combo yap',             descEn:'Get a 5x combo',              check: (s,b,l,c) => c >= 5,      xp: 8  },
  { id:'combo_7',      icon:'💥', desc:'7x combo yap',             descEn:'Get a 7x combo',              check: (s,b,l,c) => c >= 7,      xp: 15 },
  { id:'lines_10',     icon:'💫', desc:'10 satır/sütun temizle',   descEn:'Clear 10 lines/cols',         check: (s,b,l,c) => l >= 10,     xp: 7  },
  { id:'lines_20',     icon:'🌟', desc:'20 satır/sütun temizle',   descEn:'Clear 20 lines/cols',         check: (s,b,l,c) => l >= 20,     xp: 12 },
  { id:'blocks_100',   icon:'🧱', desc:'100 blok yerleştir',       descEn:'Place 100 blocks',            check: (s,b,l,c) => b >= 100,    xp: 6  },
  { id:'blocks_200',   icon:'🏗️', desc:'200 blok yerleştir',      descEn:'Place 200 blocks',            check: (s,b,l,c) => b >= 200,    xp: 10 },
  { id:'hard_mode',    icon:'💀', desc:'Zor modda 10.000 puan',    descEn:'10,000 pts in Hard mode',     check: (s,b,l,c) => s >= 10000 && window.currentGameMode === 'hard', xp: 15 },
  { id:'time_mode',    icon:'⏱️', desc:'Zaman modunda 5.000 puan', descEn:'5,000 pts in Time mode',     check: (s,b,l,c) => s >= 5000 && window.currentGameMode === 'timeattack', xp: 10 },
  { id:'score_no_pu',  icon:'🗡️', desc:'Powerupsuz 20.000 puan',  descEn:'20,000 pts without powerups', check: (s,b,l,c) => s >= 20000 && window.currentGameMode === 'hard', xp: 20 },
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

function getYesterdayStr() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getLoginBonusForStreak(streak) {
  if (streak >= 30) return 50;
  if (streak >= 14) return 30;
  if (streak >= 7)  return 20;
  if (streak >= 3)  return 10;
  return 5;
}

function processDailyLogin() {
  const today = getTodayStr();
  const status = getDailyStatus();
  if (status.lastStreakDate === today) return { streak: status.streak || 0, bonus: 0 };
  const yesterday = getYesterdayStr();
  const newStreak = status.lastStreakDate === yesterday ? (status.streak || 0) + 1 : 1;
  const bonus = getLoginBonusForStreak(newStreak);
  saveDailyStatus({ lastDate: status.lastDate || '', completed: (status.lastDate === today) ? !!status.completed : false, streak: newStreak, lastStreakDate: today });
  if (typeof window.addDiamonds === 'function') window.addDiamonds(bonus);
  try { const pName = localStorage.getItem('bp_player_name'); if (pName && typeof window.fbSubmitStreak === 'function') window.fbSubmitStreak(pName, newStreak); } catch(e) {}
  showLoginStreakToast(newStreak, bonus);
  return { streak: newStreak, bonus };
}

function showLoginStreakToast(streak, bonus) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,rgba(15,15,25,0.98),rgba(20,20,40,0.98));border:1px solid rgba(96,165,250,0.4);border-radius:18px;padding:14px 20px;display:flex;align-items:center;gap:12px;z-index:9999;pointer-events:none;box-shadow:0 8px 32px rgba(96,165,250,0.2);animation:achieveSlide 3.5s ease forwards;min-width:240px;';
  const lang = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'en' : 'tr';
  toast.innerHTML = '<div style="font-size:32px">🔥</div><div><div style="font-size:10px;font-weight:700;color:#60a5fa;letter-spacing:1px;">' + (lang==='en'?'DAILY LOGIN':'GÜNLÜK GİRİŞ') + '</div><div style="font-size:14px;font-weight:900;color:#fff;font-family:Nunito,sans-serif;margin:2px 0">+' + bonus + ' 💎</div><div style="font-size:11px;color:rgba(255,255,255,0.5);">🔥 ' + streak + ' ' + (lang==='en'?'day streak':'gün streak') + '</div></div>';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
  if (typeof vibrate === 'function') vibrate([30, 20, 30]);
}
window.processDailyLogin = processDailyLogin;
window.getLoginBonusForStreak = getLoginBonusForStreak;

function checkDailyChallenge(score, blocks, lines, combo) {
  const today = getTodayStr();
  const status = getDailyStatus();
  if (status.lastDate === today && status.completed) return;
  const challenge = getDailyChallenge();
  if (!challenge.check(score, blocks, lines, combo)) return;
  saveDailyStatus({ lastDate: today, completed: true, streak: status.streak || 0, lastStreakDate: status.lastStreakDate || today });
  const xpBonus = challenge.xp + ((status.streak || 0) * 10);
  if (typeof window.addXPDirect === 'function') window.addXPDirect(xpBonus);
  if (typeof window.addDiamonds === 'function') window.addDiamonds(challenge.xp);
  showDailyCompleteToast(challenge, status.streak || 0, challenge.xp);
  if (typeof playSndZing === 'function') playSndZing();
  if (typeof window.updateDailyBtnDot === 'function') window.updateDailyBtnDot();
}

function showDailyCompleteToast(challenge, streak, diamonds) {
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
  const lang = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'en' : 'tr';
  toast.innerHTML = `
    <div style="font-size:32px">${challenge.icon}</div>
    <div>
      <div style="font-size:10px;font-weight:700;color:#fbbf24;letter-spacing:1px;text-transform:uppercase;">${lang==='en'?'📅 Daily Challenge Complete!':'📅 Günlük Görev Tamamlandı!'}</div>
      <div style="font-size:14px;font-weight:900;color:#fff;font-family:'Nunito',sans-serif;margin:2px 0">${(lang==='en'&&challenge.descEn)?challenge.descEn:challenge.desc}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);">+${diamonds} 💎 · 🔥 ${streak} ${lang==='en'?'day streak':'gün streak'}</div>
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
  sndGameOver = document.getElementById('snd-gameover');

  createFlashOverlay();
  spawnBgBlocks();

  highScore = Number(localStorage.getItem('bb_high_score')) || 0;
  document.getElementById('high-score').textContent = highScore;

  initBoard();
  renderBoard();
  loadTheme();

  // Kayıtlı oyun varsa yükle, yoksa yeni başlat
  const saveResult = loadGameState();
  if (!saveResult) {
    generatePieces();
  } else {
    // Kayıtlı modu geri yükle
    if (typeof window.startGame === 'function' && saveResult.gameMode) {
      window._savedGameMode  = saveResult.gameMode;
      window._savedTimeLevel = saveResult.timeLevel;
    }
  }

  setupPowerups();
  updateScore();

  // Board rect cache'ini güncelle — resize/orientation değişince pozisyon kayar
  const _refreshBoardCache = () => {
    const el = getBoardEl();
    if (el) _cachedBoardRect = el.getBoundingClientRect();
  };
  window.addEventListener('resize', _refreshBoardCache, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(_refreshBoardCache, 200), { passive: true });

  setTimeout(() => {
    if (typeof window.processDailyLogin === 'function' && typeof window.addDiamonds === 'function') {
      window.processDailyLogin();
      if (typeof window.updateDailyBtnDot === 'function') window.updateDailyBtnDot();
    }
  }, 400);
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

// Satır/sütun temizleme: gerçek tok darbe
function playSndClear(count) {
  if (!_isOn()) return;
  const ctx = _getCtx(); if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const n = Math.min(count, 4);

    // === PATLAMA GÜRÜLTÜSÜ (noise burst) ===
    const bufLen = Math.floor(ctx.sampleRate * 0.15);
    const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) nd[i] = (Math.random()*2-1) * Math.pow(1 - i/bufLen, 0.5);
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 800 + n*200;
    noiseFilter.Q.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5 + n*0.1, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    noiseSrc.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(ctx.destination);
    noiseSrc.start(t);

    // === DERİN BAS DARBE ===
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kick.connect(kickGain); kickGain.connect(ctx.destination);
    kick.type = 'sine';
    kick.frequency.setValueAtTime(180 + n*20, t);
    kick.frequency.exponentialRampToValueAtTime(35, t + 0.12);
    kickGain.gain.setValueAtTime(0.9 + n*0.1, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    kick.start(t); kick.stop(t + 0.22);

    // === PARLAK CRACK ===
    const crack = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crack.connect(crackGain); crackGain.connect(ctx.destination);
    crack.type = 'square';
    crack.frequency.setValueAtTime(2400, t);
    crack.frequency.exponentialRampToValueAtTime(400, t + 0.04);
    crackGain.gain.setValueAtTime(0.3, t);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    crack.start(t); crack.stop(t + 0.06);

    // === YÜKSELEN IŞILTILI SWEEP ===
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.connect(sweepGain); sweepGain.connect(ctx.destination);
    sweep.type = 'triangle';
    sweep.frequency.setValueAtTime(600 + n*100, t + 0.02);
    sweep.frequency.exponentialRampToValueAtTime(2400 + n*300, t + 0.2);
    sweepGain.gain.setValueAtTime(0.18, t + 0.02);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    sweep.start(t + 0.02); sweep.stop(t + 0.25);

    // === ÇOK SATIRLI EKSTRA ===
    if (n >= 2) {
      // İkinci bas katmanı — daha düşük
      const kick2 = ctx.createOscillator();
      const k2g = ctx.createGain();
      kick2.connect(k2g); k2g.connect(ctx.destination);
      kick2.type = 'sine';
      kick2.frequency.setValueAtTime(120, t + 0.03);
      kick2.frequency.exponentialRampToValueAtTime(28, t + 0.18);
      k2g.gain.setValueAtTime(0.7, t + 0.03);
      k2g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      kick2.start(t + 0.03); kick2.stop(t + 0.22);

      // Metalik çınlama
      _tone(3200, 3200, 'sine', 0.12, 0.4, 0.06);
    }
    if (n >= 3) {
      // Epik bass drop
      _tone(60, 30, 'sine', 0.4, 0.5, 0.05);
      _tone(4000, 800, 'sine', 0.18, 0.3, 0.08);
    }
    if (n >= 4) {
      // Tam patlama — tüm frekanslar
      _tone(40, 20, 'sine', 0.5, 0.6, 0.02);
      _tone(5000, 1000, 'triangle', 0.2, 0.35, 0.04);
      _tone(1200, 600, 'sawtooth', 0.15, 0.25, 0.1);
    }
  } catch(e) {}
}

// Combo: üst üste patlamada giderek daha epic
function playSndCombo(level) {
  if (!_isOn()) return;
  const ctx = _getCtx(); if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const lv = Math.min(Math.max(level, 2), 8);

    // Tok, bas ağırlıklı arpej — tiz sweep YOK
    const allNotes = [
      [261, 329],                    // lv2
      [261, 329, 392],               // lv3
      [261, 329, 392, 523],          // lv4
      [329, 392, 523, 659],          // lv5
      [392, 523, 659, 784],          // lv6
      [440, 587, 698, 880],          // lv7
      [523, 659, 784, 1047, 1319],   // lv8
    ];
    const notes = allNotes[Math.min(lv-2, allNotes.length-1)];
    const speed = Math.max(0.03, 0.07 - lv*0.006);
    const vol = Math.min(0.18 + lv*0.025, 0.38);

    // Tok triangle + sine karışımı — ıslık yok
    notes.forEach((f, i) => {
      _tone(f, f, 'triangle', vol, 0.28, i*speed);
      _tone(f*0.5, f*0.5, 'sine', vol*0.4, 0.22, i*speed); // alt oktav bas
    });

    // Bas punch — her combo'da
    _tone(120, 50, 'sine', 0.45, 0.2, 0);

    // 3x+: güçlü mid darbe
    if (lv >= 3) {
      _tone(180, 80, 'sine', 0.35, 0.22, 0.02);
      _tone(400, 200, 'triangle', 0.2, 0.18, 0.04);
    }
    // 4x+: noise punch (bas, tiz değil)
    if (lv >= 4) {
      const bufLen = Math.floor(ctx.sampleRate * 0.1);
      const nb = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let i = 0; i < bufLen; i++) nd[i] = (Math.random()*2-1) * Math.pow(1-i/bufLen, 1.5);
      const ns = ctx.createBufferSource(); ns.buffer = nb;
      const nf = ctx.createBiquadFilter();
      nf.type = 'lowpass'; // LOWPASS — tiz kesilir
      nf.frequency.value = 600;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.3+lv*0.04, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t+0.12);
      ns.connect(nf); nf.connect(ng); ng.connect(ctx.destination);
      ns.start(t);
    }
    // 5x+: sub-bass
    if (lv >= 5) {
      _tone(80, 40, 'sine', 0.45, 0.4, 0.02);
      _tone(160, 80, 'sine', 0.25, 0.3, 0.05);
    }
    // 6x+: epik bas katmanı
    if (lv >= 6) {
      _tone(50, 25, 'sine', 0.55, 0.55, 0);
      _tone(523, 784, 'triangle', 0.22, 0.35, notes.length*speed);
    }
    // 7x+: tam bas patlama
    if (lv >= 7) {
      _tone(40, 20, 'sine', 0.6, 0.65, 0.01);
      _tone(261, 392, 'sawtooth', 0.18, 0.3, 0.03);
      _tone(130, 65, 'sine', 0.35, 0.4, 0.05);
    }
  } catch(e) {}
}

// Game over: dramatik çöküş
function playSndGameOver() {
  if (!_isOn()) return; // Ses efekti kapalıysa çalma
  if (!sndGameOver) sndGameOver = document.getElementById('snd-gameover');
  if (sndGameOver) {
    sndGameOver.currentTime = 0;
    sndGameOver.volume = 0.7;
    sndGameOver.play().catch(() => {});
  }
}

// Yeni rekor: parlak fanfare
function playSndRecord() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => {
    _tone(f, f, 'triangle', 0.15, 0.22, i*0.08);
  });
  _tone(2000, 2000, 'sine', 0.1, 0.3, 0.15);
}

// Menü butonu pop sesi
function playSndPop() {
  if (window.sfxEnabled === false) return;
  _tone(600, 900, 'sine', 0.08, 0.07, 0);
}

// Powerup whoosh sesi
function playSndWhoosh() {
  if (window.sfxEnabled === false) return;
  const ctx = _getCtx();
  if (!ctx) return;
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.linearRampToValueAtTime(3000, ctx.currentTime + 0.25);
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
  src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  src.start();
}

// Günlük görev zing sesi
function playSndZing() {
  if (window.sfxEnabled === false) return;
  [880, 1320, 1760, 2200].forEach((f, i) => {
    _tone(f, f * 1.5, 'sine', 0.12, 0.18, i * 0.06);
  });
  _tone(3000, 3500, 'triangle', 0.08, 0.25, 0.1);
}

// High score sesi
function playSndHighScore() {
  if (window.sfxEnabled === false) return;
  [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
    _tone(f, f, 'triangle', 0.14, 0.2, i * 0.07);
  });
  setTimeout(() => {
    [1047, 1319, 1568, 2093].forEach((f, i) => {
      _tone(f, f * 1.2, 'sine', 0.1, 0.3, i * 0.05);
    });
  }, 500);
}

window.playSndPop      = playSndPop;
window.playSndWhoosh   = playSndWhoosh;
window.playSndZing     = playSndZing;
window.playSndHighScore= playSndHighScore;

// === YENİ SES EFEKTLERİ ===

// Yeni rekor — epik fanfare
function playSndNewRecord() {
  if (!_isOn()) return;
  // Yükselen arpej
  [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => {
    _tone(f, f * 1.1, 'triangle', 0.18, 0.3, i * 0.06);
  });
  // Parlak üst nota
  setTimeout(() => {
    _tone(2093, 2637, 'sine', 0.22, 0.6, 0);
    _tone(2637, 3136, 'sine', 0.15, 0.5, 0.1);
    // Trill efekti
    [0.3, 0.35, 0.4, 0.45, 0.5].forEach((d, i) => {
      _tone(i % 2 === 0 ? 2093 : 2637, i % 2 === 0 ? 2637 : 2093, 'triangle', 0.1, 0.07, d);
    });
  }, 350);
}

// Streak bonusu — merdiven çıkış sesi
function playSndStreakBonus() {
  if (!_isOn()) return;
  const ctx = _getCtx(); if (!ctx) return;
  // Yukarı çıkan hızlı arpej
  [440, 554, 659, 880, 1109, 1319].forEach((f, i) => {
    _tone(f, f, 'sine', 0.16, 0.15, i * 0.04);
  });
  // Son parıltı
  _tone(1760, 2200, 'triangle', 0.2, 0.4, 0.22);
  _tone(2200, 2637, 'sine', 0.12, 0.35, 0.28);
}

// Menü butonu — daha zengin click
function playSndMenuClick() {
  if (!_isOn()) return;
  _tone(800, 1200, 'sine', 0.1, 0.06, 0);
  _tone(1200, 800, 'sine', 0.06, 0.04, 0.03);
}

// Elmas kazanma — kristal ding
function playSndDiamond() {
  if (!_isOn()) return;
  // İnce kristal sesi
  [2093, 2637, 3136].forEach((f, i) => {
    _tone(f, f * 0.98, 'sine', 0.18, 0.5, i * 0.04);
  });
  // Titreşim efekti
  const ctx = _getCtx(); if (!ctx) return;
  try {
    const t = ctx.currentTime + 0.1;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'triangle';
    o.frequency.setValueAtTime(4186, t);
    o.frequency.exponentialRampToValueAtTime(3136, t + 0.3);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.start(t); o.stop(t + 0.5);
  } catch(e) {}
}

// Powerup kullanma — güçlü whoosh + enerji
function playSndPowerup() {
  if (!_isOn()) return;
  const ctx = _getCtx(); if (!ctx) return;
  // Gürültü sweep
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.2);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(400, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.3);
  filter.Q.value = 1.2;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  src.start();
  // Enerji notası
  _tone(220, 880, 'sawtooth', 0.15, 0.3, 0);
  _tone(880, 1760, 'sine', 0.12, 0.25, 0.08);
}

// Geri sayım tick — normal
function playSndCountdownTick() {
  if (!_isOn()) return;
  _tone(880, 880, 'sine', 0.12, 0.08, 0);
}

// Geri sayım son 5 saniye — acil, kırmızı his
function playSndCountdownUrgent() {
  if (!_isOn()) return;
  _tone(1100, 1100, 'square', 0.15, 0.06, 0);
  _tone(1200, 1200, 'sine', 0.1, 0.05, 0.07);
}

window.playSndNewRecord     = playSndNewRecord;
window.playSndStreakBonus   = playSndStreakBonus;
window.playSndMenuClick     = playSndMenuClick;
window.playSndDiamond       = playSndDiamond;
window.playSndPowerup       = playSndPowerup;
window.playSndCountdownTick = playSndCountdownTick;
window.playSndCountdownUrgent = playSndCountdownUrgent;

// AudioContext'i ilk dokunuşta başlat
document.addEventListener('pointerdown', _getCtx, { once: true });

// === ARKA PLAN MÜZİĞİ ===
let _bgMusic = null;
let _musicOnCache = null; // memory cache - localStorage tutarsız olursa yedek

function _isMusicOn() {
  try {
    const val = localStorage.getItem('tgl-music');
    if (val === null) {
      // Henüz hiç ayar yapılmamış - cache varsa onu kullan, yoksa default açık
      return _musicOnCache !== null ? _musicOnCache : true;
    }
    const isOn = val !== 'off';
    _musicOnCache = isOn; // cache'i güncelle
    return isOn;
  } catch(e) {
    // localStorage okunamıyorsa cache'e güven, o da yoksa kapalı say
    return _musicOnCache !== null ? _musicOnCache : false;
  }
}

function _setMusicOn(isOn) {
  _musicOnCache = isOn;
  try { localStorage.setItem('tgl-music', isOn ? 'on' : 'off'); } catch(e) {}
}

// Combo elementlerini preload et - oyun başlamadan önce hazırla
(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(_initComboElements, 500));
  } else {
    setTimeout(_initComboElements, 500);
  }
})();

function startBgMusic() {
  if (!_bgMusic) _bgMusic = document.getElementById('snd-bg');
  if (!_bgMusic) return;
  if (!_isMusicOn()) return;
  _bgMusic.volume = 0.35;
  _bgMusic.play().catch(() => {});
}

function stopBgMusic() {
  if (!_bgMusic) _bgMusic = document.getElementById('snd-bg');
  if (!_bgMusic) return;
  _bgMusic.pause();
  _bgMusic.currentTime = 0;
}

function updateBgMusic() {
  if (_isMusicOn()) startBgMusic();
  else stopBgMusic();
}

window.startBgMusic = startBgMusic;
window.stopBgMusic = stopBgMusic;
window._setMusicOn = _setMusicOn;
window._isMusicOn = _isMusicOn;

// Uygulama arka plana geçince müziği durdur, öne gelince devam ettir
document.addEventListener('visibilitychange', () => {
  if (!_bgMusic) _bgMusic = document.getElementById('snd-bg');
  if (!_bgMusic) return;
  if (document.hidden) {
    _bgMusic.pause();
    // Ekran kapanınca/uygulama arka plana geçince takılı drag'i iptal et
    if (typeof cancelDrag === 'function') cancelDrag();
  } else {
    if (_isMusicOn()) {
      _bgMusic.play().catch(() => {});
    }
  }
});
window.updateBgMusic = updateBgMusic;

// İlk dokunuşta müziği başlat (sadece müzik açıksa)
document.addEventListener('pointerdown', () => {
  if (_isMusicOn()) setTimeout(startBgMusic, 100);
}, { once: true });

// === TAHTA OLUŞTUR ===

// ===== TAM OYUN SIFIRLAMA - Tekrar Oyna için =====
window.fullResetGame = function(mode, extra) {
  // 1. Tüm timer'ları durdur
  if (typeof stopTimer === 'function') stopTimer();
  if (typeof stopBgMusic === 'function') try { stopBgMusic(); } catch(e) {}

  // 2. Global state sıfırla
  score = 0;
  clearStreak = 0;
  isGameOver = false;
  clearLineMode = false;
  clearLineType = null;
  selectedPiece = null;
  selectedShape = null;
  selectedPieceColor = null;
  isDragging = false;
  lastGhostCell = null;
  _lastGhostX = -1;
  _lastGhostY = -1;
  undoStack = [];
  if (typeof scorePopupActive !== 'undefined') scorePopupActive = false;

  // 3. Board sıfırla
  if (typeof initBoard === 'function') initBoard();

  // 4. Powerup'ları yükle
  const saved = JSON.parse(localStorage.getItem('bp_powerups') || '{}');
  if (typeof clearRowCharges !== 'undefined') {
    clearRowCharges = saved.clearRowCharges ?? 1;
    rerollCharges   = saved.rerollCharges   ?? 1;
    undoCharges     = saved.undoCharges     ?? 1;
  }

  // 5. Skor güncelle
  if (typeof updateScore === 'function') updateScore();

  // 6. Board'u yeniden çiz
  if (typeof renderBoard === 'function') renderBoard();

  // 7. Tema yükle
  if (typeof loadTheme === 'function') loadTheme();

  // 8. Yeni parçalar üret
  if (typeof generatePieces === 'function') generatePieces();

  // 9. Powerup UI güncelle
  if (typeof setupPowerups === 'function') setupPowerups();

  // 10. startGame ile mode ayarla (UI göster, timer başlat vs)
  if (typeof window.startGame === 'function') {
    window.startGame(mode || 'normal', extra);
  }
};

function initBoard() {
  board = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      row.push(null);
    }
    board.push(row);
  }
  // DOM hücrelerini sıfırla — bir sonraki renderBoard'da yeniden oluşturulacak
  _boardCells = null;
}

// === TAHTAYI ÇİZ ===
// Board hücrelerini bir kez oluştur, sonra sadece güncelle
let _boardCells = null; // 2D array: _boardCells[y][x] = cellEl

function initBoardDOM() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  invalidateCellCache();
  _boardCells = [];

  for (let y = 0; y < BOARD_SIZE; y++) {
    _boardCells[y] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cellEl = document.createElement('div');
      cellEl.classList.add('board-cell');
      cellEl.dataset.x = x;
      cellEl.dataset.y = y;
      cellEl.dataset.row = y;
      cellEl.dataset.col = x;

      // Event listener'ları bir kez ekle
      cellEl.addEventListener('mouseenter', () => {
        if (clearLineMode && clearRowCharges > 0) {
          highlightLine(y, x, true);
        }
      });
      cellEl.addEventListener('mouseleave', () => {
        if (clearLineMode && clearRowCharges > 0) {
          highlightLine(y, x, false);
        }
      });
      cellEl.addEventListener('click', () => {
        if (isGameOver) return;
        if (clearLineMode && clearRowCharges > 0) {
          saveState();
          // clearLineType: null iken tıklanan hücre satır mı sütun mu seçiliyor
          // İlk tıkta seçim göster, ikinci tıkta ya da tooltip ile sil
          showLinePicker(y, x);
          return;
        }
        if (!selectedShape) return;
        tryPlacePiece(x, y);
      });

      boardEl.appendChild(cellEl);
      _boardCells[y][x] = cellEl;
    }
  }
}

function renderBoard() {
  // Board DOM yoksa oluştur
  if (!_boardCells) initBoardDOM();

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cellEl = _boardCells[y][x];
      const cell = board[y][x];

      if (cell !== null) {
        const type = cell.type || 'normal';
        const color = cell.color || getColorForType(type);
        cellEl.style.background = color;
        cellEl.dataset.type = type;
        cellEl.className = `board-cell type-${type}`;

        if (cell.justPlaced) {
          cellEl.classList.add('placed');
          cell.justPlaced = false;
          setTimeout(() => cellEl.classList.remove('placed'), 200);
        }
      } else {
        // Boş hücre
        cellEl.style.background = '';
        cellEl.style.opacity = '';
        cellEl.style.transform = '';
        cellEl.className = 'board-cell';
        cellEl.dataset.type = '';
      }
    }
  }

  // Cell cache'ini güncelle
  invalidateCellCache();
}

// === SCORE UNLOCK BİLDİRİM ===
let lastUnlockNotified = parseInt(localStorage.getItem('bp_last_unlock') || '0');

function checkScoreUnlocks() {
  const unlocks = [
    { score: 10000, msg: 'Dikdörtgen + Büyük L Şekilleri' },
    { score: 20000, msg: 'Büyük L & J Şekilleri (Tüm Yönler)' },
    { score: 30000, msg: 'Büyük J + 5\'li I Şekilleri' },
    { score: 40000, msg: 'Artı ve U Şekilleri' },
    { score: 50000, msg: '3x3 Kare + Dev T Şekli' },
  ];
  for (const u of unlocks) {
    if (score >= u.score && lastUnlockNotified < u.score) {
      lastUnlockNotified = u.score;
      localStorage.setItem('bp_last_unlock', u.score);
      showUnlockToast(u.score, u.msg);
      vibrate([50, 30, 50, 30, 80]);
      break;
    }
  }
}

function showUnlockToast(threshold, msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;top:80px;left:50%;transform:translateX(-50%);
    background:linear-gradient(135deg,#b04dff,#4d7cff);
    color:#fff;padding:12px 24px;border-radius:16px;
    font-size:14px;font-weight:700;z-index:9999;
    pointer-events:none;text-align:center;
    box-shadow:0 4px 20px rgba(176,77,255,0.4);
    animation:xpToastAnim 2.5s ease forwards;
    white-space:nowrap;
  `;
  toast.innerHTML = `🎉 Yeni Bloklar Açıldı!<br><span style="font-size:11px;opacity:0.85">${threshold.toLocaleString()} skor → ${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// === SKOR GÜNCELLE + HIGH SCORE ===
function updateScore() {
  window.currentScore = score; // game.html'den erişilebilsin

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
    setTimeout(() => { triggerNewRecord(); playSndNewRecord(); playSndHighScore(); }, 2200);
  }
  if (!isTimeMode && score > highScore) {
    highScore = score;
    localStorage.setItem('bb_high_score', highScore);
  }

  // Ekran mesajı hazırla (henüz gösterme)
  const modeLabel = isTimeMode ? '⏱ Zaman Modu' : '🎮 Klasik Mod';
  scoreText.innerHTML = `<span style="font-size:12px;opacity:0.5;display:block;margin-bottom:4px;">${modeLabel}</span>Score: ${score}`;

  // Skoru HEMEN gönder — animasyon callback'inden bağımsız
  window.currentScore = score;
  setTimeout(() => {
    if (typeof window.submitScoreToLeaderboard === 'function') {
      window.submitScoreToLeaderboard(score, window.currentGameMode || 'normal');
    }
    // Her 3 oyunda bir interstitial göster
    const goCount = (parseInt(localStorage.getItem('bp_go_count')||'0') + 1);
    localStorage.setItem('bp_go_count', goCount);
    if (goCount % 3 === 0 && typeof window.showAdMobInterstitial === 'function') {
      setTimeout(window.showAdMobInterstitial, 1500);
    }
  }, 300);

  // Dramatik game over animasyonu
  window._gameOverCancelled = false;

  // Önce board animasyonu, sonra ekran
  playGameOverSequence(() => {
    if (window._gameOverCancelled) return;
    if (!isGameOver) return;

    screen.style.visibility = "visible";
    screen.style.pointerEvents = "auto";
    screen.classList.add('active');
    if (typeof updateContinueButtons === 'function') updateContinueButtons();

    if (typeof window.onGameEnd === 'function')
      window.onGameEnd(isTimeMode ? Math.floor(score * 1.5) : score);
    if (typeof updateAchievementStats === 'function')
      updateAchievementStats(score, gameBlocksPlaced, gameLinesCleared, gameMaxCombo);
    if (typeof checkDailyChallenge === 'function')
      setTimeout(() => checkDailyChallenge(score, gameBlocksPlaced, gameLinesCleared, gameMaxCombo), 300);
  });
}

function playGameOverSequence(onDone) {
  const boardEl = document.getElementById('board');
  if (!boardEl) { onDone(); return; }
  const cells = getCells();

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

// Game over dramatik ses — gameover1.mp3 kullan
function playSndGameOverDrama() {
  playSndGameOver();
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
    clearLineMode: false,
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
  clearLineMode = lastState.clearLineMode ?? false;
  rerollCharges = lastState.rerollCharges;
  undoCharges = lastState.undoCharges;
  clearStreak = lastState.clearStreak;

  const piecesEl = document.getElementById('pieces');
  if (piecesEl) {
    piecesEl.innerHTML = '';
    selectedPiece = null;
    selectedShape = null;

    // Her zaman 3 slot oluştur — kayıp olanlar boş kalır
    const savedData = lastState.piecesData;
    for (let i = 0; i < 3; i++) {
      if (savedData[i] !== undefined) {
        piecesEl.appendChild(createPieceElement(savedData[i]));
      } else {
        const emptySlot = document.createElement('div');
        emptySlot.classList.add('piece-slot');
        emptySlot.style.pointerEvents = 'none';
        piecesEl.appendChild(emptySlot);
      }
    }
  }

  renderBoard();
  updateScore();
  updatePowerupUI();
}

// === POWER-UP SETUP ===
let powerupsInitialized = false;

function giveFirstLaunchGift() {
  if (localStorage.getItem('bp_first_gift_given')) return;
  localStorage.setItem('bp_first_gift_given', '1');
  // Sadece localStorage'a kaydet — memory'e değil (resetGame okuyacak)
  localStorage.setItem('bp_powerups', JSON.stringify({ clearRowCharges: 2, rerollCharges: 2, undoCharges: 2 }));
  setTimeout(() => {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,rgba(15,15,25,0.98),rgba(20,20,40,0.98));border:1px solid rgba(251,191,36,0.4);border-radius:18px;padding:16px 20px;display:flex;align-items:center;gap:12px;z-index:9999;pointer-events:none;box-shadow:0 8px 32px rgba(251,191,36,0.2);animation:achieveSlide 4s ease forwards;min-width:280px;';
    toast.innerHTML = '<div style="font-size:32px">🎁</div><div><div style="font-size:11px;font-weight:700;color:#fbbf24;letter-spacing:1px;text-transform:uppercase;">HOŞ GELDİN!</div><div style="font-size:14px;font-weight:900;color:#fff;font-family:Nunito,sans-serif;margin:3px 0">Başlangıç hediyeni aldın!</div><div style="font-size:12px;color:rgba(255,255,255,0.6);">🗑️×2 &nbsp; 🔄×2 &nbsp; ↩️×2 powerup</div></div>';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }, 1500);
}

function setupPowerups() {
  giveFirstLaunchGift();
  // LocalStorage'dan powerup değerlerini hemen yükle
  const _pu = JSON.parse(localStorage.getItem('bp_powerups') || '{}');
  clearRowCharges = _pu.clearRowCharges ?? 0;
  rerollCharges   = _pu.rerollCharges   ?? 0;
  undoCharges     = _pu.undoCharges     ?? 0;
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
      clearLineMode = !clearLineMode;
      clearLineType = null;
      if (clearLineMode && selectedPiece) {
        selectedPiece.classList.remove('selected');
        selectedPiece = null; selectedShape = null;
      }
      // Banner: clearLine modu açıkken gizle, kapanınca göster
      if (clearLineMode) {
        if (typeof window.hideAdMobBanner === 'function') window.hideAdMobBanner();
      } else {
        if (typeof window.showAdMobBanner === 'function') setTimeout(window.showAdMobBanner, 300);
      }
      renderBoard();
      playSndWhoosh();
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
      localStorage.setItem('bp_powerups', JSON.stringify({ clearRowCharges, rerollCharges, undoCharges }));
      playSndPowerup();
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
      localStorage.setItem('bp_powerups', JSON.stringify({ clearRowCharges, rerollCharges, undoCharges }));
      playSndPowerup();
      playSndWhoosh();
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
    const badge = btn.querySelector('.pu-badge');
    const lbl = btn.querySelector('.pu-label');
    if (isHard || isTimeMode) {
      btn.disabled = true;
      btn.classList.remove('active');
      if (badge) { badge.textContent = '—'; badge.classList.remove('hidden','buy-mode'); }
      if (lbl) { lbl.textContent = '—'; lbl.className = 'pu-label zero'; }
      return;
    }
    if (charges > 0 && !isGameOver) {
      btn.disabled = false;
      btn.classList.toggle('active', !!mode);
      btn.dataset.xpMode = 'false';
      if (badge) { badge.textContent = charges; badge.classList.remove('hidden','buy-mode'); }
      if (lbl) { lbl.textContent = '×' + charges; lbl.className = 'pu-label'; }
    } else if (!isGameOver) {
      btn.disabled = false;
      btn.classList.remove('active');
      btn.dataset.xpMode = 'true';
      btn.dataset.xpKey  = xpKey;
      if (badge) { badge.classList.add('hidden'); }
      if (lbl) { lbl.textContent = '💎 · 📺'; lbl.className = 'pu-label buy'; }
    } else {
      btn.disabled = true;
      btn.classList.remove('active');
      if (badge) { badge.classList.add('hidden'); }
      if (lbl) { lbl.textContent = '×0'; lbl.className = 'pu-label zero'; }
      btn.dataset.xpMode = 'false';
    }
  }

  setupPUBtn(btnClearRow, clearRowCharges, clearLineMode, null, 'clearRow', POWERUP_XP_COST.clearRow);
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
    if (isGameOver || clearLineMode) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // İki parmak fix: drag zaten aktifse YENİ drag başlatma
    if (isDragging) { e.preventDefault(); return; }
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
          const mode = window.currentGameMode || 'normal';
          const isEasy = mode === 'easy';

          // Kolay modda satır/sütun tamamlama çok daha değerli
          if (rowFilled === BOARD_SIZE - 1) score += isEasy ? 120 : 40;
          else if (rowFilled === BOARD_SIZE - 2) score += isEasy ? 50 : 15;
          else if (rowFilled === BOARD_SIZE - 3) score += isEasy ? 20 : 5;

          if (colFilled === BOARD_SIZE - 1) score += isEasy ? 120 : 40;
          else if (colFilled === BOARD_SIZE - 2) score += isEasy ? 50 : 15;
          else if (colFilled === BOARD_SIZE - 3) score += isEasy ? 20 : 5;

          // Kolay modda köşe/kenar bloklara yakın koyma bonusu
          if (isEasy) {
            const nearFilled =
              (board[gy]?.[gx-1] ? 1 : 0) +
              (board[gy]?.[gx+1] ? 1 : 0) +
              (board[gy-1]?.[gx] ? 1 : 0) +
              (board[gy+1]?.[gx] ? 1 : 0);
            score += nearFilled * 8; // komşu bloklara yapışma bonusu
          }

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
    const mode = window.currentGameMode || 'classic';
    if (mode === 'easy') {
      // Easy: 1-3 kare çok ağırlıklı, büyükler nadiren
      if (cells === 1) return 4.0;
      if (cells <= 3) return 3.5;
      if (cells <= 4) return 2.0;
      if (cells <= 6) return 0.8;
      return 0.3;
    } else if (mode === 'hard') {
      if (cells <= 2) return 0.5;
      if (cells <= 4) return 1.0;
      if (cells <= 6) return 1.5;
      return 2.2;
    } else if (mode === 'normal') {
      // Normal: küçük-orta ağırlıklı ama dengeli
      if (cells <= 2) return 2.8;
      if (cells <= 4) return 2.0;
      if (cells <= 6) return 1.2;
      return 0.7;
    } else {
      // timeattack vb
      if (cells <= 2) return 2.2;
      if (cells <= 4) return 1.6;
      if (cells <= 6) return 1.2;
      return 1.0;
    }
  }

  // Mod bazlı yardım oranı
  const mode = window.currentGameMode || 'classic';
  let smartChance;
  if (mode === 'easy')            smartChance = 1.00; // %100 — her zaman en uygun
  else if (mode === 'normal')     smartChance = 0.90; // %90 — çok yardımcı
  else if (mode === 'hard')       smartChance = 0.00; // %0 — tamamen rastgele
  else if (mode === 'timeattack') smartChance = 0.75;
  else                            smartChance = 0.85;

  // helpScore multiplier — easy çok yüksek, normal orta
  const helpMultiplier = mode === 'easy' ? 0.60 : mode === 'normal' ? 0.30 : 0.12;

  for (let k = 0; k < 3; k++) {
    let shapeIndex;
    if (Math.random() < smartChance && pool.length > 0) {
      const weights = pool.map(idx => 1.0 + Math.max(0, helpScore.get(idx) ?? 0) * helpMultiplier + sizeWeightFor(idx));
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

  // Direkt game over — powerup kullanımı game over ekranından yapılır
  const isTime = window.currentGameMode === 'timeattack';
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

  // clearCompletedLines kendi timeout'unda renderBoard çağırıyor.
  // Patlama yoksa (bonus=0) burada renderBoard çağır.
  if (!bonus) renderBoard();

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
  clearLineAt('row', rowY, 0);
}

function clearLineAt(type, rowY, colX) {
  const cells = getCells();
  let cleared = 0;

  if (type === 'row') {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[rowY][x] !== null) {
        const cell = cells[rowY * BOARD_SIZE + x];
        if (cell) cell.classList.add('clearing');
      }
    }
  } else {
    for (let y = 0; y < BOARD_SIZE; y++) {
      if (board[y][colX] !== null) {
        const cell = cells[y * BOARD_SIZE + colX];
        if (cell) cell.classList.add('clearing');
      }
    }
  }

  setTimeout(() => {
    if (type === 'row') {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (board[rowY][x] !== null) { board[rowY][x] = null; cleared++; }
      }
    } else {
      for (let y = 0; y < BOARD_SIZE; y++) {
        if (board[y][colX] !== null) { board[y][colX] = null; cleared++; }
      }
    }

    if (cleared > 0) {
      const bonus = cleared * 2;
      score += bonus;
      updateScore();
    }

    clearRowCharges--;
    localStorage.setItem('bp_powerups', JSON.stringify({ clearRowCharges, rerollCharges, undoCharges }));
    playSndPowerup();
    clearLineMode = false;
    clearLineType = null;

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

  const cells = getCells();
  let clearedCells = 0;
  let extraFromElements = 0;

    // === Patlayacak satır/sütun ön uyarı efekti ===
    // NOT: predict-clear sistemi drag sırasında zaten sarı gösteriyor.
    // clearLines içinde line-warning eklemiyoruz — hemen patlama başlıyor,
    // kaldırma zamanlaması zor, kullanıcıda kalıntı bırakıyor.

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (toClear[y][x] && board[y][x] !== null) {
        const cell = cells[y * BOARD_SIZE + x];
        if (cell) cell.classList.add('clearing');
        clearedCells++;
        if (!baseClear[y][x]) extraFromElements++;
      }
    }
  }

  // Toz efekti kaldırıldı (performans)

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
    // Combo streak yazısı — clearStreak bazlı
    showComboLabel(clearStreak, null);
    if (_animOn) { flashCombo(); shakeBoardBig(); spawnComboParticles(); }
  } else if (lineCount >= 3) {
    // Aynı hamlede 3+ satır/sütun — streak yok ama çoklu patlatma
    showComboLabel(null, lineCount);
    if (_animOn) { flashCombo(); shakeBoardBig(); spawnComboParticles(); }
  } else {
    if (_animOn) flashClear();
  }
  triggerScoreBounce();

  // Zaman modunda satır/sütun başına +3s
  if (typeof window.addTime === 'function') {
    window.addTime(lineCount * 3);
  }

  // Elmas oyun içinde verilmiyor — sadece oyun sonunda skor aralığına göre verilir

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

    // line-warning temizle
    {
      const _wc = getCells();
      for (let i = 0; i < _wc.length; i++) {
        if (_wc[i]) _wc[i].classList.remove('line-warning', 'pre-glow', 'line-flash', 'explode', 'clearing');
      }
    }

    // Canvas efekti — DOM'a dokunmadan patlama görselliği
    const clearList = [];
    for (let y = 0; y < BOARD_SIZE; y++)
      for (let x = 0; x < BOARD_SIZE; x++)
        if (toClear[y][x]) clearList.push({ y, x });

    spawnLineClearFlash(clearList, fullRows.length + fullCols.length);

    // Grid'i hemen güncelle — gecikme yok, boşluk yok
    renderBoard();
    boardEl.classList.remove("shake");

    // final-pulse kaldırıldı

    console.log(
    `Satır: ${fullRows.length}, Sütun: ${fullCols.length}, ` +
    `Temizlenen hücre: ${clearedCells}, Element ekstra: ${extraFromElements}, ` +
    `Streak: ${clearStreak}, Bonus Puan: ${bonusScore}`
    );

    return bonusScore;  
  }

  // === SATIR HIGHLIGHT ===
  function highlightRow(rowY, active) {
  const cells = getCells();
  for (let x = 0; x < BOARD_SIZE; x++) {
    const cell = cells[rowY * BOARD_SIZE + x];
    if (!cell) continue;
    if (active) cell.classList.add('row-target');
    else cell.classList.remove('row-target');
  }
}

function highlightLine(rowY, colX, active) {
  const cells = getCells();
  // Satır highlight
  for (let x = 0; x < BOARD_SIZE; x++) {
    const cell = cells[rowY * BOARD_SIZE + x];
    if (!cell) continue;
    if (active) cell.classList.add('line-hover-row');
    else cell.classList.remove('line-hover-row');
  }
  // Sütun highlight
  for (let y = 0; y < BOARD_SIZE; y++) {
    const cell = cells[y * BOARD_SIZE + colX];
    if (!cell) continue;
    if (active) cell.classList.add('line-hover-col');
    else cell.classList.remove('line-hover-col');
  }
}

function clearAllLineHighlights() {
  const cells = getCells();
  cells.forEach(c => {
    if (c) {
      c.classList.remove('line-hover-row','line-hover-col','row-target','col-target','line-warning');
    }
  });
}

function showLinePicker(rowY, colX) {
  // Mevcut picker varsa kaldır
  const existing = document.getElementById('line-picker');
  if (existing) existing.remove();

  // Banner'ı gizle — native view picker'ın üstüne çıkıyor
  if (typeof window.hideAdMobBanner === 'function') window.hideAdMobBanner();

  clearAllLineHighlights();

  // Satır + sütun highlight göster
  highlightLine(rowY, colX, true);

  // Mini picker UI oluştur
  const picker = document.createElement('div');
  picker.id = 'line-picker';
  // powerups'ın tam altına, ekran genişliğine göre ortala
  const puEl = document.getElementById('powerups');
  const puBottom = puEl ? puEl.getBoundingClientRect().bottom : window.innerHeight - 160;

  picker.style.cssText = `
    position:fixed;
    top:${puBottom + 10}px;
    left:0;
    right:0;
    margin:0 auto;
    width:fit-content;
    background:rgba(20,20,40,0.97);
    border:1px solid rgba(167,139,250,0.3);
    border-radius:16px; padding:8px 12px;
    display:flex; gap:8px; z-index:9999;
    white-space:nowrap;
    max-width:calc(100vw - 32px);
    box-sizing:border-box;
    animation:gameoverPop 0.2s cubic-bezier(0.2,1.3,0.4,1) both;
  `;

  const btnRow = document.createElement('button');
  btnRow.style.cssText = `
    padding:10px 20px; border-radius:10px; border:none;
    background:rgba(124,111,247,0.2); color:#a78bfa;
    font-size:13px; font-weight:800; cursor:pointer;
    font-family:'Nunito',sans-serif; border:1px solid rgba(124,111,247,0.4);
  `;
  const L = window.currentLang || 'tr';
  btnRow.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="margin-right:5px;vertical-align:middle"><rect x="0" y="5.5" width="14" height="3" rx="1.5" fill="currentColor"/></svg>${L==='en'?'Row':'Satır'}`;

  const btnCol = document.createElement('button');
  btnCol.style.cssText = `
    padding:10px 20px; border-radius:10px; border:none;
    background:rgba(124,111,247,0.2); color:#a78bfa;
    font-size:13px; font-weight:800; cursor:pointer;
    font-family:'Nunito',sans-serif; border:1px solid rgba(124,111,247,0.4);
  `;
  btnCol.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="margin-right:5px;vertical-align:middle"><rect x="5.5" y="0" width="3" height="14" rx="1.5" fill="currentColor"/></svg>${L==='en'?'Col':'Sütun'}`;

  const btnCancel = document.createElement('button');
  btnCancel.style.cssText = `
    padding:10px 14px; border-radius:10px; border:none;
    background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.4);
    font-size:13px; font-weight:800; cursor:pointer;
    font-family:'Nunito',sans-serif;
  `;
  btnCancel.textContent = '✕';

  btnRow.onclick = () => {
    picker.remove();
    clearAllLineHighlights();
    clearLineAt('row', rowY, colX);
    if (typeof window.showAdMobBanner === 'function') setTimeout(window.showAdMobBanner, 300);
  };
  btnCol.onclick = () => {
    picker.remove();
    clearAllLineHighlights();
    clearLineAt('col', rowY, colX);
    if (typeof window.showAdMobBanner === 'function') setTimeout(window.showAdMobBanner, 300);
  };
  btnCancel.onclick = () => {
    picker.remove();
    clearAllLineHighlights();
    clearLineMode = false;
    updatePowerupUI();
    if (typeof window.showAdMobBanner === 'function') setTimeout(window.showAdMobBanner, 300);
  };

  picker.appendChild(btnRow);
  picker.appendChild(btnCol);
  picker.appendChild(btnCancel);
  document.body.appendChild(picker);
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
    gameMode: window.currentGameMode || 'normal',
    timeLevel: window.currentTimeLevel || 1,
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

    // Mod bilgisini döndür
    return {
      gameMode: s.gameMode || 'normal',
      timeLevel: s.timeLevel || 1,
    };
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
// Devam et — game over'dan geri dön
function resumeFromGameOver() {
  isGameOver = false;
  window._gameOverCancelled = true;

  // Game over animasyonunu temizle — hücreler hâlâ opacity:0 olabilir
  const cells = getCells();
  cells.forEach(cell => {
    if (cell) {
      cell.style.animation = '';
      cell.style.opacity = '';
      cell.style.transform = '';
    }
  });

  generatePieces();
  renderBoard();
  updateScore();
  updatePowerupUI();
  if (window.currentGameMode === 'timeattack' && typeof startTimer === 'function') {
    startTimer();
  }
}
window.resumeFromGameOver = resumeFromGameOver;

function resetGame() {
  clearGameSave();
  lastUnlockNotified = 0;
  localStorage.removeItem('bp_last_unlock');
  window._adUsedThisGame = false; // Her yeni oyunda reklam hakkı sıfırla
  // Oyun istatistiklerini sıfırla
  gameBlocksPlaced = 0;
  gameLinesCleared = 0;
  gameMaxCombo = 0;
  isGameOver = false;
  score = 0;
  // Powerup'ları localStorage'dan yükle — her oyunda sıfırlanmaz
  const _pu = JSON.parse(localStorage.getItem('bp_powerups') || '{}');
  clearRowCharges = _pu.clearRowCharges ?? 0;
  rerollCharges   = _pu.rerollCharges   ?? 0;
  undoCharges     = _pu.undoCharges     ?? 0;
  clearLineMode = false; clearLineType = null;
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

// Grid boyutunda drag preview oluştur — slot klonu değil, gerçek grid hücresi boyutunda
function createGridSizedPreview(shape, colorName) {
  const boardEl = document.getElementById('board');
  const boardRect = boardEl.getBoundingClientRect();
  // CSS'ten gerçek değerleri oku
  const boardStyle = getComputedStyle(boardEl);
  const pad = parseFloat(boardStyle.paddingLeft) || 2;
  const gap = parseFloat(boardStyle.gap) || 2;
  const innerW = boardRect.width - pad * 2;
  const cellSize = (innerW - gap * (BOARD_SIZE - 1)) / BOARD_SIZE;

  const h = shape.length;
  const w = shape[0].length;
  const color = colorToHex(colorName) || '#7c6ff7';

  // %80 boyutunda preview
  const scale = 1.0;
  const previewCell = cellSize * scale;
  const previewGap  = gap * scale;

  // Container
  const el = document.createElement('div');
  el.className = 'bp-drag-preview'; // takılı kalırsa DOM'dan bulunup silinebilsin
  el.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.85;
    display: grid;
    grid-template-columns: repeat(${w}, ${previewCell}px);
    grid-template-rows: repeat(${h}, ${previewCell}px);
    gap: ${previewGap}px;
    will-change: transform;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
  `;

  // Her hücreyi ekle
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cell = document.createElement('div');
      if (shape[y][x] === 1) {
        cell.style.cssText = `
          width: ${previewCell}px;
          height: ${previewCell}px;
          background: ${color};
          border-radius: 6px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2);
        `;
      } else {
        cell.style.cssText = `
          width: ${previewCell}px;
          height: ${previewCell}px;
          background: transparent;
        `;
      }
      el.appendChild(cell);
    }
  }

  return el;
}

// === DRAG & DROP (POINTER EVENTS) ===
function startDragPiece(pieceEl, shape, event) {
  // İki parmak fix: sürükleme zaten devam ediyorsa yeni drag başlatma
  if (isDragging) return;
  isDragging = true;
  playSndPick(); // Blok alırken pop sesi
  dragShape = shape;
  dragPieceEl = pieceEl;
  dragPointerId = event.pointerId || null;

  // setPointerCapture: bu pointer'ı yakala, diğer elementlere gitmesin
  try { pieceEl.setPointerCapture(event.pointerId); } catch(e) {}

  // Lift: şeklin yüksekliğine göre dinamik — parmak şeklin alt merkezinde olsun
  const boardEl = document.getElementById('board');
  const bRect = boardEl.getBoundingClientRect();
  const _inner = bRect.width - 6 * 2;
  const _cell = (_inner - 3 * (BOARD_SIZE - 1)) / BOARD_SIZE;
  const _step = _cell + 3;
  if (event.pointerType === 'touch') {
    const shapeH = shape.length;
    // 3.5 hücre sabit lift - parmak parçayı kapatmasın
    dragLiftY = Math.round(_step * 3.5);
  } else {
    dragLiftY = 0;
  }

  document.querySelectorAll('.piece').forEach(p => p.classList.remove('selected'));
  pieceEl.classList.add('selected');
  selectedPiece = pieceEl;
  selectedShape = shape;
  selectedPieceColor = pieceEl.dataset.pieceColor || null;

  // Drag preview: slot klonu değil, GRID boyutunda gerçek şekil
  // Board metriklerini şimdi hesapla ve cache'le
  _cacheBoardMetrics();

  dragPreviewEl = createGridSizedPreview(shape, selectedPieceColor);
  document.body.appendChild(dragPreviewEl);

  // Orijinal parçayı gizle
  pieceEl.style.opacity = '0';

  _latestClientX = event.clientX;
  _latestClientY = event.clientY;
  updateDragPosition(event);
  updateGhostFromEvent(event);

  // RAF drag loop başlat
  if (_dragRafId) cancelAnimationFrame(_dragRafId);
  _dragRafId = requestAnimationFrame(_dragRafLoop);

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
}

let _rafPending = false;
let _lastE = null;

// Ghost only update - preview transform ayrıca yapılıyor
function _updateGhostOnly(e) {
  _updateAll(e, true);
}

// Tek birleşik update — önce grid pozisyonu hesapla, sonra preview ve ghost ikisini de ona göre yerleştir
function _updateAll(e, ghostOnly = false) {
  if (!isDragging || !selectedShape || !dragPreviewEl) return;

  const boardEl = document.getElementById('board');
  const rect = boardEl.getBoundingClientRect();
  // CSS'teki gerçek değerleri kullan: padding:2px, gap:2px
  const pad = _cachedBoardPad;
  const gap = _cachedBoardGap;
  const cellSize = _cachedCellSize || (rect.width - pad*2 - gap*(BOARD_SIZE-1)) / BOARD_SIZE;
  const step = _cachedStep || (cellSize + gap);
  const gridLeft = rect.left + pad;
  const gridTop  = rect.top  + pad;

  const h = selectedShape.length;
  const w = selectedShape[0].length;

  // Parmak şeklin tam merkezini göstersin
  const fingerX = e.clientX;
  const fingerY = e.clientY - dragLiftY;

  // 1. Şeklin merkezi parmak konumunda — sol-üst köşeyi hesapla
  const shapeCenterX = (w - 1) / 2;
  const shapeCenterY = (h - 1) / 2;
  
  const fx = (fingerX - gridLeft) / step;
  const fy = (fingerY - gridTop)  / step;

  // 2. Sol-üst köşe: merkez - yarı boyut, en yakın hücreye yuvarla
  let startX = Math.max(0, Math.min(BOARD_SIZE - w, Math.round(fx - shapeCenterX)));
  let startY = Math.max(0, Math.min(BOARD_SIZE - h, Math.round(fy - shapeCenterY)));

  // 3. Board üzerinde mi?
  const overBoard = fingerX >= rect.left - cellSize && fingerX <= rect.right + cellSize &&
                    fingerY >= rect.top  - cellSize && fingerY <= rect.bottom + cellSize;

  // 4. Fit kontrolü
  let fits = false;
  if (overBoard) {
    // Tam pozisyon + komşu yönleri arasından en yakın fit'i bul
    const fracX = fx - (w - 1) / 2 - Math.round(fx - (w - 1) / 2);
    const fracY = fy - (h - 1) / 2 - Math.round(fy - (h - 1) / 2);

    // Önce tam pozisyonu dene - kayma olmasın
    {
      let ok = true;
      for (let y = 0; y < h && ok; y++)
        for (let x = 0; x < w && ok; x++)
          if (selectedShape[y][x] === 1 && board[startY+y][startX+x] !== null) ok = false;
      if (ok) { fits = true; }
    }
    
    // Tam pozisyon doluysa sadece 1 hücre komşulara bak (parmak yönünde)
    if (!fits) {
      const fracX = fx - shapeCenterX - Math.round(fx - shapeCenterX);
      const fracY = fy - shapeCenterY - Math.round(fy - shapeCenterY);
      const candidates = Math.abs(fracX) >= Math.abs(fracY)
        ? [[fracX >= 0 ? 1 : -1, 0], [0, fracY >= 0 ? 1 : -1]]
        : [[0, fracY >= 0 ? 1 : -1], [fracX >= 0 ? 1 : -1, 0]];
      
      for (const [dx, dy] of candidates) {
        const sx = Math.max(0, Math.min(BOARD_SIZE - w, startX + dx));
        const sy = Math.max(0, Math.min(BOARD_SIZE - h, startY + dy));
        let ok = true;
        for (let y = 0; y < h && ok; y++)
          for (let x = 0; x < w && ok; x++)
            if (selectedShape[y][x] === 1 && board[sy+y][sx+x] !== null) ok = false;
        if (ok) { startX = sx; startY = sy; fits = true; break; }
      }
    }
  }

  // 5. PREVIEW: ghostOnly modunda skip (zaten onPointerMove'da yapıldı)
  if (!ghostOnly) {
    const previewW = (w * cellSize + (w-1) * gap);
    const previewH = (h * cellSize + (h-1) * gap);
    const tx = Math.round(fingerX - previewW / 2);
    const ty = Math.round(fingerY - previewH / 2);
    dragPreviewEl.style.transform = `translate3d(${tx}px,${ty}px,0)`;
    dragPreviewEl.style.opacity = '0.9';
  }

  // 6. GHOST: preview ile aynı hücre — ikisi zaten örtüşüyor
  if (fits) {
    if (startX === _lastGhostX && startY === _lastGhostY) return; // değişmediyse skip
    clearGhostPreview();
    clearPrediction();
    _lastGhostX = startX;
    _lastGhostY = startY;
    lastGhostCell = [startX, startY];

    const cells = getCells();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (selectedShape[y][x] !== 1) continue;
        const idx = (startY + y) * BOARD_SIZE + (startX + x);
        const cellEl = cells[idx];
        if (cellEl) { cellEl.classList.add('ghost-valid'); _activeGhostCells.push(cellEl); }
      }
    }

    const tempBoard = board.map(r => r.slice());
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (selectedShape[y][x] === 1) tempBoard[startY+y][startX+x] = { type:'normal' };
    showClearPrediction(tempBoard);

  } else {
    if (_lastGhostX !== -1 || _lastGhostY !== -1) {
      clearGhostPreview();
      clearPrediction();
      _lastGhostX = -1; _lastGhostY = -1;
      lastGhostCell = null;
    }
  }
}

// Son pointer koordinatları - RAF'ta kullanılacak
let _latestClientX = 0, _latestClientY = 0;
let _dragRafId = null;

function _dragRafLoop() {
  if (!isDragging) { _dragRafId = null; return; }

  // 1. Preview transform - RAF'ta yap, screen refresh ile sync
  if (dragPreviewEl && selectedShape) {
    const cellSize = _cachedCellSize;
    const gap = _cachedBoardGap;
    const h = selectedShape.length;
    const w = selectedShape[0].length;
    const previewW = w * cellSize + (w-1) * gap;
    const previewH = h * cellSize + (h-1) * gap;
    const tx = Math.round(_latestClientX - previewW / 2);
    const ty = Math.round(_latestClientY - dragLiftY - previewH / 2);
    dragPreviewEl.style.transform = `translate3d(${tx}px,${ty}px,0)`;

    // 2. Ghost: cached board rect kullan - getBoundingClientRect yok, reflow yok
    if (_cachedCellSize > 0 && _cachedBoardRect && selectedShape) {
      const bRect = _cachedBoardRect;
      const step = _cachedStep;
      const pad = _cachedBoardPad;
      // Preview sol-üst köşesi transform'dan hesaplanır
      const pLeft = tx;
      const pTop  = ty;
      const previewCellSize = previewW / w;

      let totalOffsetX = 0, totalOffsetY = 0, count = 0;
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          if (selectedShape[py][px] !== 1) continue;
          const cellCX = pLeft + (px + 0.5) * previewCellSize;
          const cellCY = pTop  + (py + 0.5) * previewCellSize;
          // Board grid koordinatı
          const gx = (cellCX - bRect.left - pad) / step - 0.5;
          const gy = (cellCY - bRect.top  - pad) / step - 0.5;
          // Bu hücrenin beklenen board hücresi: (px, py) offsetini çıkar
          totalOffsetX += gx - px;
          totalOffsetY += gy - py;
          count++;
        }
      }

      if (count > 0) {
        const avgOX = totalOffsetX / count;
        const avgOY = totalOffsetY / count;
        const sx = Math.max(0, Math.min(BOARD_SIZE - w, Math.round(avgOX)));
        const sy = Math.max(0, Math.min(BOARD_SIZE - h, Math.round(avgOY)));

        // Manyetizma: snap noktasına uzaklık yarım hücreden fazlaysa ghost gösterme
        const MAGNET_THRESHOLD = 0.65; // hücre cinsinden
        const distX = Math.abs(avgOX - sx);
        const distY = Math.abs(avgOY - sy);
        if (distX > MAGNET_THRESHOLD || distY > MAGNET_THRESHOLD) {
          // Çok uzak - ghost gizle
          if (_lastGhostX !== -1 || _lastGhostY !== -1) {
            clearGhostPreview();
            if (typeof clearPrediction === 'function') clearPrediction();
            _lastGhostX = -1; _lastGhostY = -1;
            lastGhostCell = null;
          }
        } else if (sx !== _lastGhostX || sy !== _lastGhostY) {
          clearGhostPreview();
          if (typeof clearPrediction === 'function') clearPrediction();

          let fits = true;
          for (let y = 0; y < h && fits; y++)
            for (let x = 0; x < w && fits; x++)
              if (selectedShape[y][x] === 1) {
                const by = sy+y, bx = sx+x;
                if (by < 0 || by >= BOARD_SIZE || bx < 0 || bx >= BOARD_SIZE || board[by][bx] !== null)
                  fits = false;
              }

          if (fits) {
            _lastGhostX = sx; _lastGhostY = sy;
            lastGhostCell = [sx, sy];
            const ghostHex = selectedPieceColor ? (colorToHex(selectedPieceColor) || '#7c6ff7') : '#7c6ff7';
            const ghostRgb = hexToRgb(ghostHex);
            const cells = getCells();
            for (let y = 0; y < h; y++)
              for (let x = 0; x < w; x++)
                if (selectedShape[y][x] === 1) {
                  const cellEl = cells[(sy+y)*BOARD_SIZE+(sx+x)];
                  if (cellEl) {
                    cellEl.classList.add('ghost-valid');
                    cellEl.style.setProperty('--ghost-color','rgba('+ghostRgb+',0.22)');
                    cellEl.style.setProperty('--ghost-border','rgba('+ghostRgb+',0.95)');
                    cellEl.style.setProperty('--ghost-glow','rgba('+ghostRgb+',0.5)');
                    _activeGhostCells.push(cellEl);
                  }
                }
            // Prediction - ghost konumuna göre hangi satır/sütun dolacak göster
            const tempBoard = board.map(r => r.slice());
            for (let y = 0; y < h; y++)
              for (let x = 0; x < w; x++)
                if (selectedShape[y][x] === 1)
                  tempBoard[sy+y][sx+x] = 'ghost';
            showClearPrediction(tempBoard);
          } else {
            _lastGhostX = -1; _lastGhostY = -1;
            lastGhostCell = null;
          }
        }
      }
    }
  }

  _lastE = null;
  _dragRafId = requestAnimationFrame(_dragRafLoop);
}

function onPointerMove(e) {
  if (!isDragging) return;
  if (dragPointerId !== null && e.pointerId !== dragPointerId) return;

  // Koordinatları kaydet - RAF loop çizecek
  _latestClientX = e.clientX;
  _latestClientY = e.clientY;
  _lastE = e;

  // RAF loop başlat (sadece bir tane çalışsın)
  if (!_dragRafId) {
    _dragRafId = requestAnimationFrame(_dragRafLoop);
  }
}

function updateGhostFromEvent(e) {
  _updateAll(e);
}

function cancelDrag() {
  if (!isDragging) {
    // isDragging false olsa bile takılı kalmış preview varsa temizle
    document.querySelectorAll('.bp-drag-preview').forEach(el => el.remove());
    return;
  }
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerUp);
  if (dragPreviewEl) { dragPreviewEl.remove(); dragPreviewEl = null; }
  if (dragPieceEl) { dragPieceEl.style.opacity = '1'; }
  if (_dragRafId) { cancelAnimationFrame(_dragRafId); _dragRafId = null; }
  isDragging = false;
  dragShape = null;
  dragPieceEl = null;
  dragPointerId = null;
  lastGhostCell = null;
  _lastGhostX = -1;
  _lastGhostY = -1;
  clearGhostPreview();
  clearPrediction();
  // Son güvenlik: DOM'da kalmış orphan preview'ları da temizle
  document.querySelectorAll('.bp-drag-preview').forEach(el => el.remove());
}

function onPointerUp(e) {
  if (!isDragging) return;
  // İki parmak fix: orijinal pointer dışında başka bir parmak kalkarsa da drag'i bitir
  if (dragPointerId !== null && e.pointerId !== dragPointerId) {
    cancelDrag();
    return;
  }

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


  // Önce lastGhostCell'i dene
  if (lastGhostCell && selectedShape) {
    const [startX, startY] = lastGhostCell;
    tryPlacePieceAt(startX, startY);
  } else if (selectedShape) {
    // lastGhostCell yoksa parmağın son pozisyonundan hesapla
    const snapped = trySnapToValid(e.clientX, e.clientY - dragLiftY);
    if (snapped) tryPlacePieceAt(snapped[0], snapped[1]);
  }

  isDragging = false;
  dragShape = null;
  dragPieceEl = null;
  dragPointerId = null;
  lastGhostCell = null;
  _lastGhostX = -1;
  _lastGhostY = -1;

  clearGhostPreview();
  clearPrediction();
}

// Board değerlerini cache'le - her drag move'da getComputedStyle çağırma
let _cachedBoardPad = 2, _cachedBoardGap = 2, _cachedCellSize = 0, _cachedStep = 0;
let _cachedBoardRect = null;
function _cacheBoardMetrics() {
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  const boardRect = boardEl.getBoundingClientRect();
  const boardStyle = getComputedStyle(boardEl);
  _cachedBoardPad = parseFloat(boardStyle.paddingLeft) || 2;
  // gap shorthand bazen "2px 2px" şeklinde gelir, ilk değeri al
  const rawGap = boardStyle.gap || boardStyle.columnGap || '2px';
  _cachedBoardGap = parseFloat(rawGap.split(' ')[0]) || 2;
  const innerW = boardRect.width - _cachedBoardPad * 2;
  // cellSize float - tutarlı hesaplama için sakla, yuvarlama
  _cachedCellSize = (innerW - _cachedBoardGap * (BOARD_SIZE - 1)) / BOARD_SIZE;
  // Step: hücre + gap (tam sayı değil, float kalsın - snap hesabında önemli)
  _cachedStep = _cachedCellSize + _cachedBoardGap;
  _cachedBoardRect = boardRect;
  console.log('[Board] pad:', _cachedBoardPad, 'gap:', _cachedBoardGap, 'cell:', _cachedCellSize.toFixed(2), 'step:', _cachedStep.toFixed(2));
}

function updateDragPosition(e) {
  if (!dragPreviewEl || !selectedShape) return;
  const boardEl = document.getElementById('board');
  const boardRect = boardEl.getBoundingClientRect();
  const pad = _cachedBoardPad;
  const gap = _cachedBoardGap;
  const cellSize = _cachedCellSize || (boardRect.width - pad * 2 - gap * (BOARD_SIZE - 1)) / BOARD_SIZE;

  const h = selectedShape.length;
  const w = selectedShape[0].length;

  const scale = 1.0;
  const previewW = (w * cellSize + (w - 1) * gap) * scale;
  const previewH = (h * cellSize + (h - 1) * gap) * scale;

  const previewCX = e.clientX;
  const previewCY = e.clientY - dragLiftY;

  // translate3d → GPU composite layer, left/top'tan çok daha smooth
  const tx = Math.round(previewCX - previewW / 2);
  const ty = Math.round(previewCY - previewH / 2);
  dragPreviewEl.style.transform = `translate3d(${tx}px,${ty}px,0)`;

  window._dragPreviewCX = previewCX;
  window._dragPreviewCY = previewCY;
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
// Aktif ghost hücreleri takip et
let _activeGhostCells = [];

function clearGhostPreview() {
  _activeGhostCells.forEach(c => {
    c.classList.remove('ghost-valid', 'ghost-invalid');
    c.style.removeProperty('--ghost-color');
    c.style.removeProperty('--ghost-border');
    c.style.removeProperty('--ghost-glow');
  });
  _activeGhostCells = [];
}

// Preview'ın merkezi board'da hangi grid pozisyonuna denk geliyor?
function trySnapToValid(clientX, clientY) {
  if (!selectedShape) return null;
  const boardEl = document.getElementById("board");
  const rect = boardEl.getBoundingClientRect();
  const h = selectedShape.length;
  const w = selectedShape[0].length;

  // Cache'lenmiş değerleri kullan - tutarlı hesaplama
  const pad = _cachedBoardPad;
  const gap = _cachedBoardGap;
  const cellSize = _cachedCellSize || (rect.width - pad*2 - gap*(BOARD_SIZE-1)) / BOARD_SIZE;
  const step = _cachedStep || (cellSize + gap);

  const gridLeft = rect.left + pad;
  const gridTop  = rect.top  + pad;

  // Board dışındaysa null
  if (clientX < rect.left - cellSize || clientX > rect.right + cellSize ||
      clientY < rect.top  - cellSize || clientY > rect.bottom + cellSize) return null;

  // Float pozisyon
  const fx = (clientX - gridLeft) / step;
  const fy = (clientY - gridTop)  / step;

  // Şeklin merkezi
  const { cx: shapeCX, cy: shapeCY } = getShapeCenter(selectedShape);

  // Parmağın float pozisyonundan şeklin merkezi çıkarılır, en yakın hücreye yuvarlanır
  const startX = Math.max(0, Math.min(BOARD_SIZE - w, Math.round(fx - (w - 1) / 2)));
  const startY = Math.max(0, Math.min(BOARD_SIZE - h, Math.round(fy - (h - 1) / 2)));

  // Çakışma kontrolü — tam pozisyon
  let fits = true;
  for (let y = 0; y < h && fits; y++)
    for (let x = 0; x < w && fits; x++)
      if (selectedShape[y][x] === 1 && board[startY+y][startX+x] !== null)
        fits = false;
  if (fits) return [startX, startY];

  // Tam fit etmiyorsa — parmağın fraksiyon yönüne göre sıralı 4 yön dene
  const fracX = (fx - shapeCX) - Math.floor(fx - shapeCX + 0.5);
  const fracY = (fy - shapeCY) - Math.floor(fy - shapeCY + 0.5);

  // Yatay mı dikey mi daha yakın?
  const offsets = Math.abs(fracX) >= Math.abs(fracY)
    ? [[fracX >= 0 ? 1 : -1, 0], [0, fracY >= 0 ? 1 : -1], [fracX >= 0 ? -1 : 1, 0], [0, fracY >= 0 ? -1 : 1]]
    : [[0, fracY >= 0 ? 1 : -1], [fracX >= 0 ? 1 : -1, 0], [0, fracY >= 0 ? -1 : 1], [fracX >= 0 ? -1 : 1, 0]];

  for (const [dx, dy] of offsets) {
    const sx = Math.max(0, Math.min(BOARD_SIZE - w, startX + dx));
    const sy = Math.max(0, Math.min(BOARD_SIZE - h, startY + dy));
    if (sx === startX && sy === startY) continue;
    let ok = true;
    for (let y = 0; y < h && ok; y++)
      for (let x = 0; x < w && ok; x++)
        if (selectedShape[y][x] === 1 && board[sy+y][sx+x] !== null) ok = false;
    if (ok) return [sx, sy];
  }

  return null;
}

let _lastGhostX = -1, _lastGhostY = -1, _ghostThrottleId = null;

function updateGhostPreview(clientX, clientY) {
  if (!isDragging || !selectedShape || isGameOver) {
    clearPrediction();
    clearGhostPreview();
    lastGhostCell = null;
    _lastGhostX = -1; _lastGhostY = -1;
    return;
  }

  const snapped = trySnapToValid(clientX, clientY);

  if (!snapped) {
    // Board dışında — sadece önceki ghost varsa temizle
    if (_lastGhostX !== -1 || _lastGhostY !== -1) {
      clearPrediction();
      clearGhostPreview();
      lastGhostCell = null;
      _lastGhostX = -1; _lastGhostY = -1;
    }
    return;
  }

  // Aynı hücredeyse hiçbir şeye dokunma — ghost zaten doğru yerde
  if (snapped[0] === _lastGhostX && snapped[1] === _lastGhostY) return;

  // Yeni hücre — eski ghost'u temizle, yenisini çiz
  clearPrediction();
  clearGhostPreview();
  _lastGhostX = snapped[0]; _lastGhostY = snapped[1];

  const [startX, startY] = snapped;
  const h = selectedShape.length;
  const w = selectedShape[0].length;

  lastGhostCell = [startX, startY];

  // Ghost çiz - aktif hücreleri kaydet
  // Ghost rengi — seçili parçanın rengi
  const ghostHex = selectedPieceColor ? (colorToHex(selectedPieceColor) || '#7c6ff7') : '#7c6ff7';
  const ghostRgb = hexToRgb(ghostHex);
  const ghostBg     = `rgba(${ghostRgb},0.22)`;
  const ghostBorder = `rgba(${ghostRgb},0.95)`;
  const ghostGlow   = `rgba(${ghostRgb},0.5)`;

  const cells = getCells();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (selectedShape[y][x] === 1) {
        const idx = (startY + y) * BOARD_SIZE + (startX + x);
        const cellEl = cells[idx];
        if (cellEl) {
          cellEl.classList.add('ghost-valid');
          cellEl.style.setProperty('--ghost-color', ghostBg);
          cellEl.style.setProperty('--ghost-border', ghostBorder);
          cellEl.style.setProperty('--ghost-glow', ghostGlow);
          _activeGhostCells.push(cellEl);
        }
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

// Predict-clear class'larını temizle
function clearPrediction() {
  document.querySelectorAll(".predict-clear").forEach(c => {
    c.classList.remove("predict-clear");
  });
}

// Yeni parlamaları zorla ekrana basar
function showClearPrediction(testBoard) {
  const cells = document.querySelectorAll('.board-cell');

  // SATIR KONTROLÜ
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

  // SÜTUN KONTROLÜ
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

// Çoklu satır yazı seviyeleri (aynı hamlede 3+)
const MULTILINE_LABELS = [
  null, null, null,
  { tr: 'TRIPLE!',    en: 'TRIPLE!',      color: '#34d399', size: '38px', shake: false },
  { tr: 'ULTRA!',     en: 'ULTRA!',       color: '#f59e0b', size: '44px', shake: true  },
  { tr: 'PERFECT!',   en: 'PERFECT!',     color: '#f97316', size: '48px', shake: true  },
  { tr: 'WONDERFUL!',   en: 'WONDERFUL!',     color: '#a78bfa', size: '52px', shake: true  },
];

// Combo yazı seviyeleri (streak bazlı)
const COMBO_LABELS = [
  null,
  null,
  { tr: 'GÜZEL!',       en: 'NICE!',          color: '#60a5fa', size: '26px', shake: false },
  { tr: 'HARİKA!',         en: 'GREAT!',         color: '#34d399', size: '30px', shake: false },
  { tr: 'ATEŞTE!',         en: 'ON FIRE!',        color: '#f59e0b', size: '34px', shake: true  },
  { tr: 'MUHTEŞEM!',       en: 'WONDERFUL!',       color: '#a78bfa', size: '36px', shake: true  },
  { tr: 'DURDURULAMAZ!',   en: 'UNSTOPPABLE!',   color: '#f97316', size: '30px', shake: true  },
  { tr: 'EFSANE!',         en: 'LEGENDARY!',     color: '#ff4ecd', size: '38px', shake: true  },
  { tr: 'EFSANE!',         en: 'LEGENDARY!',     color: '#ff4ecd', size: '38px', shake: true  },
];

// ===== PRELOADED COMBO ELEMENTS =====
// DOM createElement yerine önceden hazır elementleri reuse et
let _comboEl = null;
let _comboSubEl = null;
let _comboHideTimer = null;
let _comboSubHideTimer = null;

function _initComboElements() {
  if (_comboEl) return;

  _comboEl = document.createElement('div');
  _comboEl.id = '_combo_label';
  _comboEl.style.cssText = `
    position:fixed;
    top:32%;
    left:50%;
    transform:translateX(-50%) scale(0.5);
    font-weight:900;
    font-family:'Nunito',sans-serif;
    z-index:9998;
    pointer-events:none;
    white-space:nowrap;
    max-width:90vw;
    text-align:center;
    letter-spacing:-1px;
    display:none;
    will-change:transform,opacity;
  `;
  document.body.appendChild(_comboEl);

  _comboSubEl = document.createElement('div');
  _comboSubEl.id = '_combo_sub';
  _comboSubEl.style.cssText = `
    position:fixed;
    top:42%;
    left:50%;
    transform:translateX(-50%) translateY(10px);
    font-size:15px;
    font-weight:800;
    font-family:'Nunito',sans-serif;
    color:rgba(255,255,255,0.5);
    z-index:9996;
    pointer-events:none;
    white-space:nowrap;
    letter-spacing:1px;
    display:none;
    will-change:transform,opacity;
  `;
  document.body.appendChild(_comboSubEl);
}

function showComboLabel(clearStreak, lineCount) {
  _initComboElements();

  const fx = getSkinFX();
  const lang = window.currentLang || 'tr';

  let label = null;
  let subText = null;

  if (clearStreak !== null && clearStreak >= 2) {
    const idx = Math.min(clearStreak, COMBO_LABELS.length - 1);
    label = COMBO_LABELS[idx];
    subText = fx.comboPrefix + ' x' + clearStreak;
  } else if (lineCount !== null && lineCount >= 3) {
    const idx = Math.min(lineCount, MULTILINE_LABELS.length - 1);
    label = MULTILINE_LABELS[idx];
    subText = lineCount + (lang === 'en' ? ' LINES!' : ' SATIR!');
  }

  if (!label) return;

  // Önceki timer'ları temizle
  if (_comboHideTimer) clearTimeout(_comboHideTimer);
  if (_comboSubHideTimer) clearTimeout(_comboSubHideTimer);

  // Büyük yazı - sadece içerik ve stil güncelle, yeni element yaratma
  _comboEl.textContent = lang === 'en' ? label.en : label.tr;
  _comboEl.style.fontSize = label.size;
  _comboEl.style.color = label.color;
  _comboEl.style.textShadow = `
    0 0 30px ${label.color},
    0 0 60px ${label.color}66,
    0 3px 12px rgba(0,0,0,0.8),
    -1px -1px 0 rgba(0,0,0,0.5),
    1px 1px 0 rgba(0,0,0,0.5)`;
  _comboEl.style.display = 'block';

  // Animasyonu resetle - reflow yok
  _comboEl.style.animation = 'none';
  const _comboAnim = label.shake
    ? 'comboLabelPop 0.85s cubic-bezier(0.2,1.4,0.3,1) forwards, comboShake 0.3s 0.15s ease'
    : 'comboLabelPop 0.85s cubic-bezier(0.2,1.4,0.3,1) forwards';
  requestAnimationFrame(() => { _comboEl.style.animation = _comboAnim; });

  _comboHideTimer = setTimeout(() => {
    _comboEl.style.display = 'none';
    _comboEl.style.animation = 'none';
  }, 950);

  // Alt yazı
  if (subText) {
    _comboSubEl.textContent = subText;
    _comboSubEl.style.display = 'block';
    _comboSubEl.style.animation = 'none';
    requestAnimationFrame(() => { _comboSubEl.style.animation = 'comboLabelPop 0.9s cubic-bezier(0.2,1.3,0.4,1) 0.05s forwards'; });

    _comboSubHideTimer = setTimeout(() => {
      _comboSubEl.style.display = 'none';
      _comboSubEl.style.animation = 'none';
    }, 1000);
  } else {
    _comboSubEl.style.display = 'none';
  }
}

// Eski isim uyumluluğu için
function showComboPopup(count) { showComboLabel(count, null); }

// Toz/parçacık efekti — blok kırılınca hücrelerden duman çıkar
// Canvas tabanlı toz efekti — çok daha performanslı
let _dustCanvas = null;
let _dustCtx = null;
let _dustParticles = [];
let _dustAnimId = null;

function _initDustCanvas() {
  if (_dustCanvas) return;
  _dustCanvas = document.createElement('canvas');
  _dustCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9997;';
  _dustCanvas.width = window.innerWidth;
  _dustCanvas.height = window.innerHeight;
  document.body.appendChild(_dustCanvas);
  _dustCtx = _dustCanvas.getContext('2d');
}

function _dustLoop() {
  if (!_dustCtx || _dustParticles.length === 0) {
    _dustAnimId = null;
    if (_dustCtx) _dustCtx.clearRect(0, 0, _dustCanvas.width, _dustCanvas.height);
    return;
  }
  _dustCtx.clearRect(0, 0, _dustCanvas.width, _dustCanvas.height);
  _dustParticles = _dustParticles.filter(p => p.life > 0);
  for (const p of _dustParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3; // yerçekimi
    p.life -= 3;
    _dustCtx.globalAlpha = Math.max(0, p.life / 100);
    _dustCtx.fillStyle = p.color;
    _dustCtx.beginPath();
    _dustCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    _dustCtx.fill();
  }
  _dustCtx.globalAlpha = 1;
  _dustAnimId = requestAnimationFrame(_dustLoop);
}

// Satır/sütun patlama efekti — ekran titremesi + canvas flash + parçacıklar
let _flashAnimId = null;
let _flashCanvas = null;
let _flashCtx = null;
let _shakeRafId = null;

function _initFlashCanvas() {
  if (_flashCanvas) return;
  _flashCanvas = document.createElement('canvas');
  _flashCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998;';
  _flashCanvas.width = window.innerWidth;
  _flashCanvas.height = window.innerHeight;
  document.body.appendChild(_flashCanvas);
  _flashCtx = _flashCanvas.getContext('2d');
}

// Ekran titreme — sadece transform, layout reflow yok
function _shakeScreen(intensity, lineCount) {
  if (_shakeRafId) cancelAnimationFrame(_shakeRafId);
  const el = getBoardEl();
  if (!el) return;
  const mag = lineCount >= 2 ? Math.min(intensity + 2, 8) : Math.min(intensity, 5);
  el.style.willChange = 'transform'; // shake sırasında GPU'ya taşı
  const FRAMES = [
    [ mag,   0      ],
    [-mag,   mag*0.6],
    [ mag*0.7, -mag*0.7],
    [-mag*0.5,  mag*0.4],
    [ mag*0.2, -mag*0.3],
    [ 0,   0      ]
  ];
  let i = 0;
  function step() {
    if (i >= FRAMES.length) {
      el.style.transform = '';
      el.style.willChange = ''; // GPU katmanını serbest bırak
      _shakeRafId = null;
      return;
    }
    el.style.transform = `translate(${FRAMES[i][0]}px,${FRAMES[i][1]}px)`;
    i++;
    _shakeRafId = requestAnimationFrame(step);
  }
  _shakeRafId = requestAnimationFrame(step);
}

function spawnLineClearFlash(clearList, lineCount) {
  const _animOn = localStorage.getItem('tgl-anim') !== 'off';
  if (!_animOn || !clearList.length) return;

  _initFlashCanvas();

  // Ekran titret
  _shakeScreen(5, lineCount || 1);

  // Hücre rect'lerini al — sadece burada bir kez (RAF loop dışı)
  const rects = [];
  for (const { y, x } of clearList) {
    const cellEl = _boardCells && _boardCells[y] && _boardCells[y][x];
    if (!cellEl) continue;
    const r = cellEl.getBoundingClientRect();
    rects.push({ left: r.left, top: r.top, cx: r.left + r.width/2, cy: r.top + r.height/2, w: r.width, h: r.height });
  }
  if (!rects.length) return;

  // Patlayan alanın tüm merkezi
  const allCx = rects.reduce((s,r)=>s+r.cx,0)/rects.length;
  const allCy = rects.reduce((s,r)=>s+r.cy,0)/rects.length;

  // Canvas parçacıkları — her hücreden fırlasın
  _initDustCanvas();
  const colors = getCurrentThemeColors();
  for (const r of rects) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 5;
      _dustParticles.push({
        x: r.cx, y: r.cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 2,
        r: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)] || '#fff',
        life: 55 + Math.random() * 25,
      });
    }
  }
  if (!_dustAnimId) _dustAnimId = requestAnimationFrame(_dustLoop);

  // Flash animasyonu: hızlı parlak → yavaş söner
  const DURATION = 300;
  const startTime = performance.now();

  function flashLoop(now) {
    const t = Math.min((now - startTime) / DURATION, 1);
    const eased = 1 - t * t; // quad ease-out

    _flashCtx.clearRect(0, 0, _flashCanvas.width, _flashCanvas.height);

    // 1. Tüm patlayan alanı kaplayan büyük bir radial glow
    const spread = rects.length >= 8 ? 120 : 70;
    const grd = _flashCtx.createRadialGradient(allCx, allCy, 0, allCx, allCy, spread);
    grd.addColorStop(0, `rgba(255,255,180,${0.55 * eased})`);
    grd.addColorStop(0.4, `rgba(255,210,50,${0.3 * eased})`);
    grd.addColorStop(1, `rgba(255,160,0,0)`);
    _flashCtx.fillStyle = grd;
    _flashCtx.fillRect(allCx - spread, allCy - spread, spread*2, spread*2);

    // 2. Her hücre üzerine beyaz flash
    _flashCtx.fillStyle = `rgba(255,255,255,${0.75 * eased})`;
    for (const r of rects) {
      _flashCtx.fillRect(r.left, r.top, r.w, r.h);
    }

    // 3. İnce scan line — satır/sütun boyunca süpürme hissi
    if (rects.length >= 4) {
      const minX = Math.min(...rects.map(r=>r.left));
      const maxX = Math.max(...rects.map(r=>r.left+r.w));
      const minY = Math.min(...rects.map(r=>r.top));
      const maxY = Math.max(...rects.map(r=>r.top+r.h));
      const scanAlpha = Math.max(0, (0.5 - t) * 2) * 0.4; // sadece ilk yarıda görünür
      _flashCtx.fillStyle = `rgba(255,255,255,${scanAlpha})`;
      _flashCtx.fillRect(minX, minY, maxX-minX, maxY-minY);
    }

    _flashCtx.globalAlpha = 1;

    if (t < 1) {
      _flashAnimId = requestAnimationFrame(flashLoop);
    } else {
      _flashCtx.clearRect(0, 0, _flashCanvas.width, _flashCanvas.height);
      _flashAnimId = null;
    }
  }

  if (_flashAnimId) cancelAnimationFrame(_flashAnimId);
  _flashAnimId = requestAnimationFrame(flashLoop);
}

function spawnDustEffect(cells) {
  const _animOn = localStorage.getItem('tgl-anim') !== 'off';
  if (!_animOn) return;
  const colors = getCurrentThemeColors();

  // Sadece köşe hücrelerinden parçacık çıkar (max 8 hücre)
  const sample = cells.length > 8
    ? cells.filter((_, i) => i % Math.ceil(cells.length / 8) === 0)
    : cells;

  _initDustCanvas();

  for (const {row, col} of sample) {
    const cellEl = document.querySelector(`.board-cell[data-row="${row}"][data-col="${col}"]`);
    if (!cellEl) continue;
    const rect = cellEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // 3 parçacık yeterli
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 * i / 3) + Math.random() * 0.8;
      const speed = 2 + Math.random() * 3;
      _dustParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        r: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)] || '#fff',
        life: 80 + Math.random() * 20,
      });
    }
  }

  if (!_dustAnimId) _dustAnimId = requestAnimationFrame(_dustLoop);
}

function getCurrentThemeColors() {
  const theme = localStorage.getItem('bp_current_theme') || 'classic';
  const def = window.THEME_DEFS && window.THEME_DEFS[theme];
  return def ? def.colors : ['#ff4d4d','#4d7cff','#42d67a','#ffd24d'];
}

// Preloaded score popup
let _scorePopupEl = null;
let _scoreHideTimer = null;

function _initScorePopup() {
  if (_scorePopupEl) return;
  _scorePopupEl = document.createElement('div');
  _scorePopupEl.className = 'score-popup';
  _scorePopupEl.style.cssText = `
    position:fixed;
    left:50%;
    top:45%;
    display:none;
    will-change:transform,opacity;
  `;
  document.body.appendChild(_scorePopupEl);
}

function spawnFloatingScore(value) {
  if (scorePopupActive) return;
  scorePopupActive = true;
  _initScorePopup();

  if (_scoreHideTimer) clearTimeout(_scoreHideTimer);

  _scorePopupEl.textContent = '+' + value;
  _scorePopupEl.style.color = value >= 500 ? '#ff3d00' : value >= 200 ? '#ff9800' : '';
  _scorePopupEl.style.display = 'block';

  // Animasyonu resetle - reflow yok
  _scorePopupEl.style.animation = 'none';
  requestAnimationFrame(() => { _scorePopupEl.style.animation = ''; _scorePopupEl.className = 'score-popup'; });

  _scoreHideTimer = setTimeout(() => {
    _scorePopupEl.style.display = 'none';
    scorePopupActive = false;
  }, 900);
}

const SNAP_RANGE = 0.45; // hücre oranı

let lastMoveTime = 0;
const MOVE_COOLDOWN = 8; // ms – arcade hızı

function spawnComboParticles() {
  // Canvas ile hafif versiyon
  const boardEl = document.getElementById('board');
  const rect = boardEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = getCurrentThemeColors();

  _initDustCanvas();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i / 8) + Math.random() * 0.4;
    const speed = 4 + Math.random() * 4;
    _dustParticles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      r: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)] || '#fff',
      life: 100,
    });
  }
  if (!_dustAnimId) _dustAnimId = requestAnimationFrame(_dustLoop);
}

const SNAP_PULL = 0.92;

// restartBtn - game.html'deki addEventListener ile yönetiliyor
