// ═══════════════════════════════════════════════════════
//  KINGDOM DEFENSE  —  game.js
// ═══════════════════════════════════════════════════════

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  initPositions();
});

// ── DOM refs ─────────────────────────────────────────
const menu           = document.getElementById("menu");
const playBtn        = document.getElementById("playBtn");
const howBtn         = document.getElementById("howBtn");
const howPanel       = document.getElementById("howPanel");
const closeHow       = document.getElementById("closeHow");
const gameOverScreen = document.getElementById("gameOver");
const restartBtn     = document.getElementById("restartBtn");
const victoryScreen  = document.getElementById("victory");
const victoryRestartBtn = document.getElementById("victoryRestartBtn");
const victoryContinueBtn = document.getElementById("victoryContinueBtn");
const victoryStats   = document.getElementById("victoryStats");
const hud            = document.getElementById("hud");
const hudMoney       = document.getElementById("hudMoney");
const hudTowers      = document.getElementById("hudTowers");
const hudHP          = document.getElementById("hudHP");
const hudMaxHP       = document.getElementById("hudMaxHP");
const hpBar          = document.getElementById("hpBar");
const dayLabel       = document.getElementById("dayLabel");
const goStats        = document.getElementById("goStats");
const pauseBtn          = document.getElementById("pauseBtn");
const pauseModal        = document.getElementById("pauseModal");
const closePauseBtn     = document.getElementById("closePauseBtn");
const resumeBtn         = document.getElementById("resumeBtn");
const tabVolumeBtn      = document.getElementById("tabVolumeBtn");
const tabControlsBtn    = document.getElementById("tabControlsBtn");
const tabVolume         = document.getElementById("tabVolume");
const tabControls       = document.getElementById("tabControls");
const keybindGrid       = document.getElementById("keybindGrid");
const resetKeybindsBtn  = document.getElementById("resetKeybindsBtn");
const musicVolSlider    = document.getElementById("musicVolSlider");
const unitVolSlider     = document.getElementById("unitVolSlider");
const sfxVolSlider      = document.getElementById("sfxVolSlider");
const musicVolVal       = document.getElementById("musicVolVal");
const unitVolVal        = document.getElementById("unitVolVal");
const sfxVolVal         = document.getElementById("sfxVolVal");
const buildBar       = document.getElementById("buildBar");
const techTreeBtn    = document.getElementById("techTreeBtn");
const techModal      = document.getElementById("techModal");
const closeTechBtn   = document.getElementById("closeTechBtn");
const upgradeBaseBtn = document.getElementById("upgradeBaseBtn");
const unlockWallBtn  = document.getElementById("unlockWallBtn");
const unlockSplashBtn= document.getElementById("unlockSplashBtn");
const toastEl = document.getElementById("toast");
const hudKillsEl = document.getElementById('hudKills');
const hudWaveEl  = document.getElementById('hudWave');
const towerInfoPanel   = document.getElementById("towerInfoPanel");
const towerInfoClose   = document.getElementById("towerInfoClose");
const towerInfoIcon    = document.getElementById("towerInfoIcon");
const towerInfoName    = document.getElementById("towerInfoName");
const towerInfoLevel   = document.getElementById("towerInfoLevel");
const towerInfoDmg     = document.getElementById("towerInfoDmg");
const towerInfoRange   = document.getElementById("towerInfoRange");
const towerInfoRate    = document.getElementById("towerInfoRate");
const towerInfoUpgradeBtn  = document.getElementById("towerInfoUpgradeBtn");
const towerInfoUpgradeWrap = document.getElementById("towerInfoUpgradeWrap");
const towerInfoMaxed   = document.getElementById("towerInfoMaxed");
const bgMusic           = document.getElementById("bgMusic");

// ── WORLD ────────────────────────────────────────────
const WORLD_WIDTH = 6667;
let   GROUND_Y    = canvas.height - 80;

// ── STAR FIELD (generated once, looks natural) ────────
const STARS = (() => {
  const arr = [];
  // Use a simple seeded pseudo-random so stars are deterministic
  let seed = 42;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < 200; i++) {
    arr.push({
      x:     rand() * WORLD_WIDTH,
      y:     rand() * 0.55,        // fraction of GROUND_Y
      size:  rand() < 0.15 ? 2.5 : rand() < 0.4 ? 1.8 : 1.2,
      phase: rand() * Math.PI * 2, // individual blink phase
      speed: 0.8 + rand() * 1.4,  // blink speed multiplier
    });
  }
  return arr;
})();

// ════════════════════════════════════════════════════
//  AUDIO ENGINE  (Web Audio API — no external files)
// ════════════════════════════════════════════════════
let audioCtx = null;
function initAudio() {
  if (audioCtx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
}

// ── Volume settings (0–1 each, persisted across pause/resume) ──
const audioSettings = {
  music:  0.35,   // background music track
  unit:   1.0,    // tower placement / shooting / combat hits
  sfx:    1.0,    // wave announcements / day chime / kill streak / wall break
};

// Which playSound() type belongs to which category slider
const SOUND_CATEGORY = {
  build:     'unit',
  arrowHit:  'unit',
  splash:    'unit',
  baseHit:   'unit',
  enemyDie:  'unit',
  wallBreak: 'unit',
  wave:      'sfx',
  day:       'sfx',
  streak:    'sfx',
};

// ════════════════════════════════════════════════════
//  KEYBINDS  (rebindable controls)
// ════════════════════════════════════════════════════
// Each action maps to a single rebindable key. Movement keeps a
// permanent secondary fallback (arrow keys) so players who rebind
// WASD-style still have arrows as a sane default — but the primary
// bind shown/edited in the UI is the one in KEYBINDS.
const DEFAULT_KEYBINDS = {
  moveLeft:   'a',
  moveRight:  'd',
  build:      'b',
  delete:     'x',
  slot1:      '1',
  slot2:      '2',
  slot3:      '3',
  slot4:      '4',
  upgrade:    'u',
  skipNight:  'n',
  pause:      'p',
};

const KEYBIND_LABELS = {
  moveLeft:  'Move Left',
  moveRight: 'Move Right',
  build:     'Build Selected Structure',
  delete:    'Demolish Nearest Building',
  slot1:     'Select Building 1',
  slot2:     'Select Building 2',
  slot3:     'Select Building 3',
  slot4:     'Select Building 4',
  upgrade:   'Upgrade Nearest Tower',
  skipNight: 'Skip to Night',
  pause:     'Pause',
};

// Order shown in the keybind list
const KEYBIND_ORDER = ['moveLeft','moveRight','build','delete','slot1','slot2','slot3','slot4','upgrade','skipNight','pause'];

let KEYBINDS = { ...DEFAULT_KEYBINDS };

function loadKeybinds() {
  try {
    const saved = JSON.parse(localStorage.getItem('kd_keybinds') || 'null');
    if (saved && typeof saved === 'object') {
      KEYBINDS = { ...DEFAULT_KEYBINDS, ...saved };
    }
  } catch (e) { /* ignore corrupt storage */ }
}
function saveKeybinds() {
  try { localStorage.setItem('kd_keybinds', JSON.stringify(KEYBINDS)); } catch (e) { /* ignore */ }
}

// Normalize a KeyboardEvent.key into the form we store/compare
// (single chars lowercased; special keys like 'ArrowLeft' kept as-is)
function normalizeKey(rawKey) {
  if (rawKey.length === 1) return rawKey.toLowerCase();
  return rawKey;
}

// Human-readable label for display on the keybind button
function displayKey(k) {
  const map = { ' ': 'Space', 'ArrowLeft': '←', 'ArrowRight': '→', 'ArrowUp': '↑', 'ArrowDown': '↓' };
  if (map[k]) return map[k];
  return k.length === 1 ? k.toUpperCase() : k;
}

// True if the given normalized key matches the action's bound key
// (movement also always accepts the arrow keys as a fixed fallback)
function keyMatches(action, normalizedKey) {
  if (normalizedKey === KEYBINDS[action]) return true;
  if (action === 'moveLeft'  && normalizedKey === 'ArrowLeft')  return true;
  if (action === 'moveRight' && normalizedKey === 'ArrowRight') return true;
  return false;
}

// Is the given action's key currently held down? (checks the `keys`
// state populated by the keydown/keyup listeners)
function isActionDown(action) {
  const bound = KEYBINDS[action];
  if (bound && keys[bound]) return true;
  if (action === 'moveLeft'  && keys['ArrowLeft'])  return true;
  if (action === 'moveRight' && keys['ArrowRight']) return true;
  return false;
}

// ── Background music ──────────────────────────────────
function startMusic() {
  if (!bgMusic) return;
  applyMusicVolume();
  // play() returns a promise that can reject if the browser blocks
  // autoplay before any user gesture — we're calling this from a
  // click handler so it should be allowed, but we guard anyway.
  const playPromise = bgMusic.play();
  if (playPromise !== undefined) {
    playPromise.catch(err => console.warn("Music playback blocked:", err));
  }
}
function applyMusicVolume() {
  if (!bgMusic) return;
  bgMusic.volume = audioSettings.music;
}
const VOL = { build:0.18, arrowHit:0.12, splash:0.22, baseHit:0.28, enemyDie:0.10, wave:0.20, day:0.16, wallBreak:0.20, streak:0.18 };
function playSound(type) {
  if (!audioCtx) return;
  const categoryVol = audioSettings[SOUND_CATEGORY[type]] ?? 1;
  if (categoryVol <= 0) return;
  const ac = audioCtx, now = ac.currentTime;
  function makeGain(vol, fadeEnd) {
    const g = ac.createGain();
    const scaledVol = vol * categoryVol;
    g.gain.setValueAtTime(scaledVol, now);
    g.gain.linearRampToValueAtTime(0, now + fadeEnd);
    g.connect(ac.destination); return g;
  }
  function osc(shape, freq, start, end, gn) {
    const o = ac.createOscillator();
    o.type = shape; o.frequency.setValueAtTime(freq, now + start);
    o.connect(gn); o.start(now + start); o.stop(now + end);
  }
  function noise(duration, gn) {
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf;
    src.connect(gn); src.start(now); src.stop(now + duration);
  }
  switch (type) {
    case 'build':     { const g1=makeGain(VOL.build,0.08); osc('square',420,0,0.04,g1); const g2=makeGain(VOL.build*1.4,0.18); osc('triangle',110,0.03,0.18,g2); break; }
    case 'arrowHit':  { const g=makeGain(VOL.arrowHit,0.12); osc('sawtooth',880,0,0.03,g); osc('square',440,0.02,0.10,g); break; }
    case 'splash':    { const g1=makeGain(VOL.splash,0.35); g1.gain.exponentialRampToValueAtTime(0.001,now+0.35); osc('sine',80,0,0.35,g1); const g2=makeGain(VOL.splash*0.6,0.25); noise(0.25,g2); break; }
    case 'baseHit':   { const g=makeGain(VOL.baseHit,0.4); g.gain.exponentialRampToValueAtTime(0.001,now+0.4); osc('sine',55,0,0.4,g); osc('triangle',90,0,0.2,g); const gn=makeGain(VOL.baseHit*0.5,0.15); noise(0.15,gn); break; }
    case 'enemyDie':  { const g=makeGain(VOL.enemyDie,0.15); const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(320,now); o.frequency.linearRampToValueAtTime(80,now+0.12); o.connect(g); o.start(now); o.stop(now+0.15); break; }
    case 'wave':      { const g=makeGain(VOL.wave,1.2); g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(VOL.wave,now+0.3); g.gain.linearRampToValueAtTime(0,now+1.2); osc('sawtooth',110,0,1.2,g); osc('sawtooth',165,0.3,1.2,g); break; }
    case 'day':       { [523,659,784].forEach((freq,i)=>{ const g=makeGain(0,0.5+i*0.12); g.gain.setValueAtTime(0,now+i*0.12); g.gain.linearRampToValueAtTime(VOL.day,now+i*0.12+0.02); g.gain.linearRampToValueAtTime(0,now+i*0.12+0.5); osc('sine',freq,i*0.12,i*0.12+0.5,g); }); break; }
    case 'wallBreak': { const g1=makeGain(VOL.wallBreak*0.8,0.3); noise(0.3,g1); const g2=makeGain(VOL.wallBreak,0.2); osc('square',160,0,0.2,g2); break; }
    case 'streak':    { [440,554,659].forEach((freq,i)=>{ const g=makeGain(0,i*0.08+0.35); g.gain.setValueAtTime(0,now+i*0.08); g.gain.linearRampToValueAtTime(VOL.streak,now+i*0.08+0.02); g.gain.linearRampToValueAtTime(0,now+i*0.08+0.35); osc('triangle',freq,i*0.08,i*0.08+0.35,g); }); break; }
  }
}

// ── GAME STATE ───────────────────────────────────────
let gameRunning    = false;
let gamePaused     = false;
let keys           = {};
let enemies        = [];
let buildings      = [];
let particles      = [];
let projectiles      = [];
let enemyProjectiles = [];   // Ranger stun bolts
let splashRings      = [];
let stuckArrows = [];    // arrows that missed and stuck in the ground
let groundCraters = [];  // splash bombs that missed and exploded on the ground
let floatingNums = [];
let money          = 10;
let time           = 0;
let isNight        = false;
let spawnTimer     = 0;
let dayCount       = 1;
let totalKills     = 0;
let buildCooldown = 0;
let menuAnimating = true;
let selectedTower = null; // the tower currently shown in the info panel

// ── SCREEN SHAKE ─────────────────────────────────────
let shakeFrames = 0;
let shakeMag    = 0;

// ── WAVE / KILL STREAK ───────────────────────────────
let waveNumber      = 0;
let waveActive      = false;
let waveAnnounce    = 0;
let killStreak      = 0;
let killStreakTimer  = 0;

// ── BOSS: THE BROKEN KING ─────────────────────────────
const BOSS_TRIGGER_WAVE = 15;     // the wave this final encounter replaces
const BOSS_MAX_HEALTH   = 460;
let boss             = null;      // the boss entity (separate from `enemies`)
let bossState         = 'none';   // 'none' | 'intro' | 'fight' | 'victory'
let bossTimer         = 0;
let bossDefeated      = false;
let endlessMode       = false;     // true after choosing "Continue On" post-boss
let endlessCycle      = 0;         // how many times the player has looped past the boss
let inBossFight        = false;    // true intro→victory; pauses normal waves & day/night
let corruption         = 0;        // 0..1 atmosphere intensity, drives the screen filter
let bossDropTimer      = 0;
let bossSmashTimer     = 0;
let bossGlitchTimer    = 0;
let bossTelegraph      = null;     // {x, life, maxLife, target} — tower about to be deleted
let dropTelegraphs     = [];       // [{x, life}] — rifts warning of a falling enemy
let glitchBands        = [];       // [{y, h, life, offset}] — screen-space datamosh strips

// ── TOUCH CONTROLS ───────────────────────────────────
const touch = { left: false, right: false, build: false, del: false };
// ── UNLOCKS ──────────────────────────────────────────
let wallUnlocked = false;
let splashUnlocked = false;
let mageUnlocked = false;

// ── SELECTED BUILDING SLOT (0=tower, 1=wall, 2=splash) 
let selectedSlot   = 0;

// ── CAMERA ───────────────────────────────────────────
const camera = { x: 0 };

// ── PLAYER ───────────────────────────────────────────
const player = { x: WORLD_WIDTH / 2, y: 0, width: 36, height: 70, speed: 4.5, facing: 1, walkTimer: 0, isMoving: false };

// ── BASE ─────────────────────────────────────────────
const base = { x: WORLD_WIDTH / 2 - 140, y: 0, width: 280, height: 180, health: 100, maxHealth: 100 };

// ── PORTALS ──────────────────────────────────────────
const leftPortal  = { x: 60,               y: 0, width: 60, height: 120 };
const rightPortal = { x: WORLD_WIDTH - 120, y: 0, width: 60, height: 120 };

function initPositions() {
  GROUND_Y         = canvas.height - 80;
  player.y         = GROUND_Y - player.height;
  base.y           = GROUND_Y - base.height;
  leftPortal.y     = GROUND_Y - leftPortal.height;
  rightPortal.y    = GROUND_Y - rightPortal.height;
}

// ═══════════════════════════════════════════════════
//  BUILDING DEFINITIONS
// ═══════════════════════════════════════════════════
const BUILDING_DEFS = [
  {
    id:        'tower',
    name:      'Arrow Tower',
    icon:      '🗼',
    key:       '1',
    cost:      10,
    unlocked:  () => true,
    lockMsg:   '',
    build:     buildArrowTower,
  },
  {
    id:        'wall',
    name:      'Stone Wall',
    icon:      '🧱',
    key:       '2',
    cost:      5,
    unlocked:  () => wallUnlocked,
    lockMsg:   'Unlock in Tech Tree',
    build:     buildWall,
  },
  {
    id: 'splash',
    name: 'Splash Tower',
    icon: '💥',
    key: '3',
    cost: 20,
    unlocked: () => splashUnlocked,
    lockMsg: 'Unlock in Tech Tree',
    build: buildSplashTower,
  },
  {
    id: 'mage',
    name: 'Mage Tower',
    icon: '🔮',
    key: '4',
    cost: 25,
    unlocked: () => mageUnlocked,
    lockMsg: 'Unlock in Tech Tree',
    build: buildMageTower,
  },
];

// ── BUILD BAR UI ─────────────────────────────────────
function renderBuildBar() {
  buildBar.innerHTML = '';
  BUILDING_DEFS.forEach((def, i) => {
    const unlocked = def.unlocked();
    const div = document.createElement('div');
    div.className = 'build-slot' + (i === selectedSlot ? ' selected' : '') + (unlocked ? '' : ' locked');
    div.innerHTML = `
      <span class="slot-key">${def.key}</span>
      <span class="slot-icon">${def.icon}</span>
      <span class="slot-name">${def.name}</span>
      <span class="slot-cost">${def.cost} 💰</span>
      ${!unlocked ? `<span class="lock-msg">${def.lockMsg}</span>` : ''}
    `;
    if (unlocked) {
      div.addEventListener('click', () => { selectedSlot = i; renderBuildBar(); });
    }
    buildBar.appendChild(div);
  });
}

// ── TOAST ────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// ── TECH TREE MODAL ───────────────────────────────────
function updateTechUI() {
  // Wall
  const wallCanAfford = money >= 15;
  const wallDayMet    = dayCount >= 2;
  unlockWallBtn.disabled = wallUnlocked || !wallCanAfford || !wallDayMet;
  unlockWallBtn.textContent = wallUnlocked ? '✔ Unlocked' : 'Unlock — 15 💰';
  document.getElementById('wallReqs').style.display = wallUnlocked ? 'none' : '';
  document.getElementById('card-wall').className = 'tech-card' + (wallUnlocked ? ' unlocked-card' : '');

  // Splash
  const splashCanAfford = money >= 40;
  const splashDayMet    = dayCount >= 4;
  unlockSplashBtn.disabled = splashUnlocked || !splashCanAfford || !splashDayMet;
  unlockSplashBtn.textContent = splashUnlocked ? '✔ Unlocked' : 'Unlock — 40 💰';
  document.getElementById('splashReqs').style.display = splashUnlocked ? 'none' : '';
  document.getElementById('card-splash').className = 'tech-card' + (splashUnlocked ? ' unlocked-card' : '');

  // Mage Tower
  const mageCanAfford = money >= 100;
  const mageDayMet = dayCount >= 6;
  unlockMageBtn.disabled = mageUnlocked || !mageCanAfford || !mageDayMet;
  unlockMageBtn.textContent = mageUnlocked ? '✔ Unlocked' : 'Unlock — 100 💰';
  document.getElementById('mageReqs').style.display = mageUnlocked ? 'none' : '';
  document.getElementById('card-mage').className = 'tech-card' + (mageUnlocked ? ' unlocked-card' : '');

  // Upgrade base always available
  upgradeBaseBtn.disabled = money < 20;
}

techTreeBtn.addEventListener('click', () => {
  updateTechUI();
  techModal.classList.add('open');
});
closeTechBtn.addEventListener('click', () => techModal.classList.remove('open'));
techModal.addEventListener('click', e => { if (e.target === techModal) techModal.classList.remove('open'); });

upgradeBaseBtn.addEventListener('click', () => {
  if (money < 20) return;
  money -= 20;
  base.maxHealth += 50;
  base.health    += 50;
  spawnParticles(base.x + base.width / 2, base.y, "#44ff88", 20);
  showToast('Base reinforced! +50 max HP');
  updateTechUI();
});

unlockWallBtn.addEventListener('click', () => {
  if (wallUnlocked || money < 15 || dayCount < 2) return;
  money -= 15;
  wallUnlocked = true;
  showToast('Stone Wall unlocked! Costs 5 💰 to place.');
  renderBuildBar();
  updateTechUI();
});

unlockSplashBtn.addEventListener('click', () => {
  if (splashUnlocked || money < 40 || dayCount < 4) return;
  money -= 40;
  splashUnlocked = true;
  showToast('Splash Tower unlocked! Costs 20 💰 to place.');
  renderBuildBar();
  updateTechUI();
});

unlockMageBtn.addEventListener('click', () => {
    if (mageUnlocked || money < 100 || dayCount < 6) return;
    money -= 100;
    mageUnlocked = true;
    showToast('⚡ Mage Tower unlocked! Costs 25 💰 to place.');
    renderBuildBar();
    updateTechUI();
});

// ── Pause / Settings wiring ───────────────────────────
function updateSliderFill(slider) {
  slider.style.setProperty('--fill', slider.value + '%');
}

function syncSettingsUI() {
  musicVolSlider.value = Math.round(audioSettings.music * 100);
  unitVolSlider.value  = Math.round(audioSettings.unit  * 100);
  sfxVolSlider.value   = Math.round(audioSettings.sfx   * 100);
  musicVolVal.textContent = musicVolSlider.value + '%';
  unitVolVal.textContent  = unitVolSlider.value  + '%';
  sfxVolVal.textContent   = sfxVolSlider.value   + '%';
  [musicVolSlider, unitVolSlider, sfxVolSlider].forEach(updateSliderFill);
  renderKeybindGrid();
}

function openPause() {
  if (!gameRunning) return;
  gamePaused = true;
  syncSettingsUI();
  pauseModal.classList.add('open');
  pauseBtn.classList.add('active');
  if (bgMusic) bgMusic.pause();
}

function closePause() {
  gamePaused = false;
  cancelRebindListening();
  pauseModal.classList.remove('open');
  pauseBtn.classList.remove('active');
  if (bgMusic) {
    const p = bgMusic.play();
    if (p !== undefined) p.catch(() => {});
  }
}

pauseBtn.addEventListener('click', () => { gamePaused ? closePause() : openPause(); });
closePauseBtn.addEventListener('click', closePause);
resumeBtn.addEventListener('click', closePause);
pauseModal.addEventListener('click', e => { if (e.target === pauseModal) closePause(); });

musicVolSlider.addEventListener('input', () => {
  audioSettings.music = musicVolSlider.value / 100;
  musicVolVal.textContent = musicVolSlider.value + '%';
  updateSliderFill(musicVolSlider);
  applyMusicVolume();
});
unitVolSlider.addEventListener('input', () => {
  audioSettings.unit = unitVolSlider.value / 100;
  unitVolVal.textContent = unitVolSlider.value + '%';
  updateSliderFill(unitVolSlider);
});
sfxVolSlider.addEventListener('input', () => {
  audioSettings.sfx = sfxVolSlider.value / 100;
  sfxVolVal.textContent = sfxVolSlider.value + '%';
  updateSliderFill(sfxVolSlider);
});

// ── Tab switching ──────────────────────────────────────
function switchPauseTab(tab) {
  cancelRebindListening();
  [tabVolumeBtn, tabControlsBtn].forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  tabVolume.classList.toggle('active', tab === 'volume');
  tabControls.classList.toggle('active', tab === 'controls');
}
tabVolumeBtn.addEventListener('click', () => switchPauseTab('volume'));
tabControlsBtn.addEventListener('click', () => switchPauseTab('controls'));

// ── Keybind rebinding ──────────────────────────────────
let listeningForRebind = null; // action name currently capturing, or null

function renderKeybindGrid() {
  keybindGrid.innerHTML = '';
  KEYBIND_ORDER.forEach(action => {
    const row = document.createElement('div');
    row.className = 'keybind-row';
    const isListening = listeningForRebind === action;
    row.innerHTML = `
      <span class="keybind-desc">${KEYBIND_LABELS[action]}</span>
      <button type="button" class="keybind-key${isListening ? ' listening' : ''}" data-action="${action}">
        ${isListening ? 'Press a key…' : displayKey(KEYBINDS[action])}
      </button>
    `;
    keybindGrid.appendChild(row);
  });
  keybindGrid.querySelectorAll('.keybind-key').forEach(btn => {
    btn.addEventListener('click', () => startRebindListening(btn.dataset.action));
  });
}

function startRebindListening(action) {
  listeningForRebind = action;
  renderKeybindGrid();
}

function cancelRebindListening() {
  if (!listeningForRebind) return;
  listeningForRebind = null;
  renderKeybindGrid();
}

// Captures the next keypress while a rebind row is "listening"
window.addEventListener('keydown', e => {
  if (!listeningForRebind) return;
  e.preventDefault();
  if (e.key === 'Escape') { cancelRebindListening(); return; }

  const nk = normalizeKey(e.key);
  // Prevent binding the same key to two different actions
  const clash = KEYBIND_ORDER.find(a => a !== listeningForRebind && KEYBINDS[a] === nk);
  if (clash) {
    showToast(`"${displayKey(nk)}" is already used for ${KEYBIND_LABELS[clash]}`);
    listeningForRebind = null;
    renderKeybindGrid();
    return;
  }

  KEYBINDS[listeningForRebind] = nk;
  saveKeybinds();
  listeningForRebind = null;
  renderKeybindGrid();
});

resetKeybindsBtn.addEventListener('click', () => {
  KEYBINDS = { ...DEFAULT_KEYBINDS };
  saveKeybinds();
  cancelRebindListening();
  renderKeybindGrid();
  showToast('Controls reset to defaults');
});

// ── Keyboard: pause toggle (Escape always works; bound key too) ──
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' || normalizeKey(e.key) === KEYBINDS.pause) {
    if (!gameRunning) return;
    if (listeningForRebind) return; // don't pause mid-rebind capture
    gamePaused ? closePause() : openPause();
  }
});

// ── Tower info panel wiring ───────────────────────────
towerInfoClose.addEventListener('click', closeTowerPanel);

towerInfoUpgradeBtn.addEventListener('click', () => {
    if (!selectedTower) return;
    const t = selectedTower;
    if (t.level >= 3) return;
    const cost = t.type === 'tower'  ? (t.level === 1 ? 20 : 30)
               : t.type === 'splash' ? (t.level === 1 ? 30 : 40)
               :                       (t.level === 1 ? 40 : 50);
    if (money < cost) { showToast(`Need ${cost} 💰 to upgrade!`); return; }
    money -= cost;
    t.level++;
    if (t.type === 'tower') {
      t.range = t.level === 2 ? 300 : 380;
    } else if (t.type === 'splash') {
      t.range = t.level === 2 ? 240 : 300;
    } else if (t.type === 'mage') {
      t.range = t.level === 2 ? 330 : 400;
    }
    spawnParticles(t.x, GROUND_Y - 90, "#f0d080", 20);
    showToast(`⬆ Tower upgraded to Level ${t.level}!`);
    refreshTowerPanel();
});

// ── Canvas click — open tower panel or close it ───────
canvas.addEventListener('click', e => {
    if (!gameRunning || gamePaused) return;
    // Convert screen click to world coordinates
    const worldX = e.clientX + camera.x;
    const worldY = e.clientY;
    // Find a tower within 30px of the click
    const clicked = buildings.find(b =>
    (b.type === 'tower' || b.type === 'splash' || b.type === 'mage') &&
    Math.abs(b.x - worldX) < 30 &&
    worldY > GROUND_Y - 110 && worldY < GROUND_Y
    );
    if (clicked) {
        openTowerPanel(clicked);
    } else {
        closeTowerPanel();
    }
});

// ── SKIP TO NIGHT ─────────────────────────────────────
function skipToNight() {
  if (!gameRunning) return;
  if (isNight) {
    showToast("It's already night!");
    return;
  }

  time = 0;
  isNight = true;
  spawnTimer = 0;
  waveActive = false;
  dayLabel.textContent = `NIGHT ${dayCount}`;
  document.getElementById("skipNightBtn").style.display = "none";
  showToast("Skipped to night! Defend your base!");
  spawnParticles(base.x + base.width / 2, base.y, "#8844ff", 25);
}

// ── INPUT ─────────────────────────────────────────────
window.addEventListener("keydown", e => {
    if (listeningForRebind) return; // capture handled separately for rebind mode
    const nk = normalizeKey(e.key);
    keys[nk] = true;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = true; // keep raw arrow fallback
    if (gamePaused) return;
    if (keyMatches('slot1', nk)) { selectedSlot = 0; renderBuildBar(); }
    if (keyMatches('slot2', nk)) { selectedSlot = 1; renderBuildBar(); }
    if (keyMatches('slot3', nk)) { selectedSlot = 2; renderBuildBar(); }
    if (keyMatches('slot4', nk)) { selectedSlot = 3; renderBuildBar(); }
    if (keyMatches('upgrade',   nk)) upgradeNearestTower();
    if (keyMatches('skipNight', nk)) skipToNight();
});
window.addEventListener("keyup", e => {
    const nk = normalizeKey(e.key);
    keys[nk] = false;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = false;
});

// ── TOUCH CONTROLS ────────────────────────────────────
function wireTouchBtn(id, onDown, onUp) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('touchstart',  e => { e.preventDefault(); onDown(); }, { passive: false });
  el.addEventListener('touchend',    e => { e.preventDefault(); onUp();   }, { passive: false });
  el.addEventListener('mousedown',   onDown);
  el.addEventListener('mouseup',     onUp);
  el.addEventListener('mouseleave',  onUp);
}
wireTouchBtn('tLeft',  () => touch.left  = true,  () => touch.left  = false);
wireTouchBtn('tRight', () => touch.right = true,  () => touch.right = false);
wireTouchBtn('tBuild', () => touch.build = true,  () => {});
wireTouchBtn('tDel',   () => touch.del   = true,  () => {});

// ── START / RESTART ───────────────────────────────────
playBtn.onclick = () => {
  menuAnimating = false;
  menu.style.display = "none";
  startMusic();
  startGame();
};
closeHow.onclick = () => howPanel.style.display = "none";
restartBtn.onclick = () => resetGame();
victoryRestartBtn.onclick = () => resetGame();
if (victoryContinueBtn) victoryContinueBtn.onclick = () => continueEndless();

function startGame() {
  initAudio();
  initPositions();
  canvas.style.display       = "block";
  hud.style.display          = "flex";
  dayLabel.style.display     = "block";
  pauseBtn.style.display     = "flex";
  document.getElementById('rightUI').style.display = "block";
  const tc = document.getElementById('touchControls');
  if (tc) tc.style.display = "flex";
  renderBuildBar();
  document.getElementById('skipNightBtn').style.display = 'block';
  gameRunning = true;
  gameLoop();
}

// ═══════════════════════════════════════════════════
//  ENEMY TYPES
// ═══════════════════════════════════════════════════
const ENEMY_TYPES = {
  grunt: {
    width: 38, height: 72,
    speedBase: 0.9, speedVar: 0.6,
    hpBase: 1, hpScale: 0.4,
    color: '#8a3030', colorNight: '#6a2020',
    reward: 2, size: 1,
  },
  scout: {
    width: 28, height: 58,
    speedBase: 2.0, speedVar: 0.8,
    hpBase: 1, hpScale: 0.2,
    color: '#c04020', colorNight: '#882010',
    reward: 3, size: 0.75,
  },
  brute: {
    width: 54, height: 90,
    speedBase: 0.4, speedVar: 0.2,
    hpBase: 4, hpScale: 1.2,
    color: '#5a2a8a', colorNight: '#3a1a5a',
    reward: 6, size: 1.4,
  },
  harpy: {
    width: 44, height: 50,
    speedBase: 1.4, speedVar: 0.8,
    hpBase: 2, hpScale: 0.5,
    color: '#b06090', colorNight: '#7a3060',
    reward: 5, size: 1.0,
    flying: true,          // ← key flag: this unit flies
    flyHeight: 140,        // px above GROUND_Y
    attackRange: 35,       // horizontal range to start hovering & firing
    attackRate: 90,
  },

  // NEW: Ranger - Ranged enemy that stuns towers and damages walls/base
  ranger: {
    width: 36, height: 68,
    speedBase: 0.7, speedVar: 0.3,
    hpBase: 2, hpScale: 0.5,
    color: '#3a5a8a', colorNight: '#2a3a5a',
    reward: 7, size: 1.0,
    ranged: true,
    attackRange: 280,
    attackRate: 110,
    stunDuration: 300,
    boltDamage: 6,
  },
};

function getEnemyPowerScale() {
  // Base scaling from day count, plus an extra multiplier after each endless loop
  const dayScale = 1 + dayCount * 0.04 + endlessCycle * 0.25;
  const waveScale = 1 + waveNumber * 0.03;
  return dayScale * waveScale;
}

function spawnEnemy(typeKey) {
    const fromLeft = Math.random() < 0.5;
    const t = ENEMY_TYPES[typeKey] || ENEMY_TYPES.grunt;
    const power = getEnemyPowerScale();
    const hp = Math.max(1, Math.floor((t.hpBase + dayCount * t.hpScale) * power));
    enemies.push({
        x: fromLeft ? leftPortal.x + leftPortal.width : rightPortal.x,
        width: t.width,
        height: t.height,
        speed: (t.speedBase + Math.random() * t.speedVar + dayCount * 0.04) * (1 + endlessCycle * 0.08),
        direction: fromLeft ? 1 : -1,
        health: hp,
        maxHealth: hp,
        attacking: false,
        attackTimer: 0,
        blocked: false,
        blockedBy: null,
        kind: typeKey,
        color: t.color,
        colorNight: t.colorNight,
        reward: t.reward + Math.floor(dayCount * 0.4) + endlessCycle * 2,
        size: t.size,
        // Flying properties (only set if the type is flying)
        flying: t.flying || false,
        flyHeight: t.flyHeight || 0,
        attackRange: t.attackRange || 30,
        attackRate: t.attackRate || 90,
        stunTimer: 0,   // used by mage tower stun
        wingTimer: 0,   // for wing-flap animation
        // Ranged enemy properties (only set if the type is ranged)
        ranged:        t.ranged        || false,
        boltDamage:    Math.floor((t.boltDamage    || 6) * (1 + endlessCycle * 0.2)),
        stunDuration:  t.stunDuration  || 120,
    });
}
function spawnWaveEnemies() {
  waveNumber++;
  waveActive   = true;
  waveAnnounce = 180; // 3 seconds at 60fps
  playSound('wave');

  const count      = 3 + waveNumber * 2 + endlessCycle * 3;
  const hasBrute   = waveNumber >= 3 || endlessCycle > 0;
  const hasScout   = waveNumber >= 2 || endlessCycle > 0;
  const hasHarpy   = waveNumber >= 3 || endlessCycle > 0;
  const hasRanger  = waveNumber >= 5 || endlessCycle > 0;

  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let kind = 'grunt';
    if (hasRanger && roll < 0.18)       kind = 'ranger';
    else if (hasBrute && roll < 0.30)   kind = 'brute';
    else if (hasHarpy && roll < 0.45)   kind = 'harpy';
    else if (hasScout && roll < 0.65)   kind = 'scout';
    // stagger spawns over a few seconds each
    setTimeout(() => { if (gameRunning) spawnEnemy(kind); }, i * 600);
  }

  // Extra brute on hard waves
  if ((waveNumber >= 5 || endlessCycle > 0) && Math.random() < 0.5) {
    setTimeout(() => { if (gameRunning) spawnEnemy('brute'); }, count * 600 + 400);
  }

  // Guaranteed ranger pair from wave 5 onward so the player always notices them
  if (waveNumber >= 5 || endlessCycle > 0) {
    setTimeout(() => { if (gameRunning) spawnEnemy('ranger'); }, count * 600 + 800);
    if (waveNumber >= 7 || endlessCycle > 0) {
      setTimeout(() => { if (gameRunning) spawnEnemy('ranger'); }, count * 600 + 1400);
    }
  }
}

// ═══════════════════════════════════════════════════
//  FINAL BOSS — THE BROKEN KING
//  A corrupted former ruler who fills the entire sky.
// ═══════════════════════════════════════════════════
function triggerBossArrival() {
  inBossFight    = true;
  bossState      = 'intro';
  bossTimer      = 0;
  waveNumber     = BOSS_TRIGGER_WAVE;
  waveActive     = true;     // keeps the normal spawner from also firing
  bossDropTimer  = 220;
  bossSmashTimer = 340;
  bossGlitchTimer= 120;
  bossTelegraph  = null;
  dropTelegraphs = [];
  glitchBands    = [];

  showToast('⚠ THE SKY IS TEARING OPEN ⚠');
  shakeFrames = 60; shakeMag = 18;
  playSound('day');

  // Corrupt-delete everything currently on the field
  enemies.forEach(e => spawnParticles(e.x, e.y + (e.height || 40) / 2, '#ffffff', 10));
  enemies = [];

  const targetW = Math.max(canvas.width * 1.7, 1800);
  const targetH = Math.max(canvas.height * 0.62, 460);

  boss = {
    x: camera.x + canvas.width / 2,
    y: -targetH * 0.6,
    width: 10, height: 10,
    targetWidth: targetW, targetHeight: targetH,
    targetY: Math.max(60, canvas.height * 0.09),
    health: BOSS_MAX_HEALTH, maxHealth: BOSS_MAX_HEALTH,
    bob: 0, sway: 0,
    flying: true,
    stunTimer: 0,
    invulnerable: true,
    fadeAlpha: 1,
  };
}

function spawnFallingEnemy(typeKey, worldX) {
  const t  = ENEMY_TYPES[typeKey] || ENEMY_TYPES.grunt;
  const power = getEnemyPowerScale();
  const hp = Math.max(1, Math.floor((t.hpBase + dayCount * t.hpScale) * 1.3 * power));
  const dir = worldX < base.x + base.width / 2 ? 1 : -1;
  enemies.push({
    x: worldX,
    width: t.width, height: t.height,
    speed: (t.speedBase + Math.random() * t.speedVar + dayCount * 0.04) * (1 + endlessCycle * 0.08),
    direction: dir,
    health: hp, maxHealth: hp,
    attacking: false, attackTimer: 0,
    blocked: false, blockedBy: null,
    kind: typeKey, color: t.color, colorNight: t.colorNight,
    reward: t.reward + Math.floor(dayCount * 0.4) + endlessCycle * 2,
    size: t.size,
    flying: t.flying || false,
    flyHeight: t.flyHeight || 0,
    attackRange: t.attackRange || 30,
    attackRate: t.attackRate || 90,
    stunTimer: 0, wingTimer: 0,
    ranged: t.ranged || false,
    boltDamage: Math.floor((t.boltDamage || 6) * (1 + endlessCycle * 0.2)),
    stunDuration: t.stunDuration || 120,
    // Sky-drop state — falls before joining the normal AI
    falling: true,
    fallSpeed: 1,
    y: -120,
    fallTargetY: t.flying ? (GROUND_Y - t.flyHeight - t.height) : (GROUND_Y - t.height),
  });
}

function updateBoss() {
  // Tick down ambient FX regardless of boss state
  glitchBands.forEach(g => g.life--);
  glitchBands = glitchBands.filter(g => g.life > 0);
  dropTelegraphs.forEach(d => d.life--);
  dropTelegraphs = dropTelegraphs.filter(d => d.life > 0);

  if (!boss) return;
  bossTimer++;

  if (bossState === 'intro') {
    const introLen = 220;
    const tt = Math.min(1, bossTimer / introLen);
    const ease = 1 - Math.pow(1 - tt, 3);
    boss.y      = -boss.targetHeight * 0.6 + (boss.targetY - (-boss.targetHeight * 0.6)) * ease;
    boss.width  = boss.targetWidth  * ease;
    boss.height = boss.targetHeight * ease;
    boss.x      = camera.x + canvas.width / 2;
    corruption  = Math.min(1, corruption + 0.011);
    if (bossTimer % 16 === 0) { shakeFrames = 16; shakeMag = 10; }
    if (tt >= 1) {
      bossState = 'fight';
      bossTimer = 0;
      boss.invulnerable = false;
      waveAnnounce = 0;
      showToast('👑 THE BROKEN KING HAS AWOKEN');
      playSound('wave');
    }
    return;
  }

  if (bossState === 'fight') {
    boss.bob    = Math.sin(bossTimer * 0.018) * 16;
    boss.sway   = Math.sin(bossTimer * 0.006) * 80;
    boss.x      = camera.x + canvas.width / 2 + boss.sway;
    boss.y      = boss.targetY + boss.bob;
    boss.width  = boss.targetWidth;
    boss.height = boss.targetHeight;

    // ── Sky drop: rifts open and corrupted enemies fall ──
    bossDropTimer--;
    if (bossDropTimer <= 0) {
      const dropX = camera.x + 80 + Math.random() * (canvas.width - 160);
      dropTelegraphs.push({ x: dropX, life: 50 });
      const pool = ['grunt', 'scout', 'brute', 'harpy'];
      const kind = pool[Math.floor(Math.random() * pool.length)];
      setTimeout(() => { if (gameRunning && bossState === 'fight') spawnFallingEnemy(kind, dropX); }, 800);
      bossDropTimer = 150 + Math.random() * 90;
    }

    // ── Tower smash: telegraph, then delete a tower ──────
    bossSmashTimer--;
    if (bossSmashTimer <= 0 && !bossTelegraph) {
      const candidates = buildings.filter(b => b.type === 'tower' || b.type === 'splash' || b.type === 'mage');
      if (candidates.length) {
        const t = candidates[Math.floor(Math.random() * candidates.length)];
        bossTelegraph = { x: t.x, life: 70, maxLife: 70, target: t };
      }
      bossSmashTimer = 260 + Math.random() * 140;
    }
    if (bossTelegraph) {
      bossTelegraph.life--;
      if (bossTelegraph.life <= 0) {
        const t = bossTelegraph.target;
        if (buildings.includes(t)) {
          spawnParticles(t.x, GROUND_Y - 60, '#ffffff', 22);
          spawnParticles(t.x, GROUND_Y - 60, '#ff2255', 16);
          buildings = buildings.filter(bd => bd !== t);
          shakeFrames = 26; shakeMag = 13;
          playSound('wallBreak');
          showToast('💥 A tower was deleted!');
        }
        bossTelegraph = null;
      }
    }

    // ── Screen glitch bands ───────────────────────────────
    bossGlitchTimer--;
    if (bossGlitchTimer <= 0) {
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        glitchBands.push({
          y: Math.random() * canvas.height,
          h: 10 + Math.random() * 44,
          life: 8 + Math.random() * 10,
          offset: (Math.random() < 0.5 ? -1 : 1) * (24 + Math.random() * 70),
        });
      }
      bossGlitchTimer = 70 + Math.random() * 100;
    }

    // ── Defeated? ─────────────────────────────────────────
    if (boss.health <= 0) {
      bossState = 'victory';
      bossTimer = 0;
      boss.invulnerable = true;
      bossDefeated = true;
      bossTelegraph = null;
      money += 80;
      shakeFrames = 32; shakeMag = 15;
      showToast('👑 THE BROKEN KING FALLS — +80💰');
      playSound('streak');
    }
    return;
  }

  if (bossState === 'victory') {
    boss.bob = Math.sin(bossTimer * 0.05) * 4;
    boss.fadeAlpha = Math.max(0, 1 - bossTimer / 140);
    corruption = Math.max(0.32, corruption - 0.006);
    if (bossTimer > 150) {
      boss = null;
      bossState = 'none';
      inBossFight = false;
      triggerVictory();
    }
    return;
  }
}

function triggerVictory() {
  gameRunning = false;
  gamePaused = false;
  canvas.style.display = "none";
  hud.style.display = "none";
  dayLabel.style.display = "none";
  pauseBtn.style.display = "none";
  document.getElementById('rightUI').style.display = "none";
  document.getElementById('skipNightBtn').style.display = "none";
  techModal.classList.remove('open');
  pauseModal.classList.remove('open');
  pauseBtn.classList.remove('active');
  listeningForRebind = null;
  victoryStats.textContent = `Survived ${dayCount} day${dayCount !== 1 ? "s" : ""} · ${totalKills} enemies slain · The Broken King defeated`;
  victoryScreen.style.display = "flex";
}

function continueEndless() {
  // Move into the next endless loop: keep base, buildings, money, day, kills
  endlessMode = true;
  endlessCycle++;
  waveNumber = BOSS_TRIGGER_WAVE; // resume counting from the boss wave
  bossDefeated = true;            // don't trigger the boss again
  bossState = 'none';
  inBossFight = false;
  boss = null;
  corruption = 0;
  canvas.style.filter = '';

  // Reset transient state
  enemies = [];
  projectiles = [];
  enemyProjectiles = [];
  splashRings = [];
  stuckArrows = [];
  groundCraters = [];
  particles = [];
  floatingNums = [];
  dropTelegraphs = [];
  glitchBands = [];
  bossTelegraph = null;
  waveActive = false;
  spawnTimer = 0;
  waveAnnounce = 0;
  killStreak = 0;
  killStreakTimer = 0;
  shakeFrames = 0;
  shakeMag = 0;

  // Heal the base a little as a reward for defeating the boss
  base.health = Math.min(base.maxHealth, base.health + 40);

  // Jump to the next day so the player gets a brief build phase
  isNight = false;
  time = 0;
  dayCount++;
  money += 25;

  victoryScreen.style.display = "none";
  canvas.style.display = "block";
  hud.style.display = "flex";
  dayLabel.style.display = "block";
  pauseBtn.style.display = "flex";
  document.getElementById('rightUI').style.display = "block";
  document.getElementById('skipNightBtn').style.display = 'block';

  showToast(`Endless Cycle ${endlessCycle} begins! Enemies grow stronger...`);
  playSound('day');
  renderBuildBar();

  gameRunning = true;
  gameLoop();
}

// ═══════════════════════════════════════════════════
//  BUILD FUNCTIONS
// ═══════════════════════════════════════════════════
function tooClose(x, minDist = 50) {
  return buildings.some(b => Math.abs(b.x - x) < minDist);
}

function buildArrowTower() {
    if (money < 10 || buildCooldown > 0) { showToast('Need 10 💰 to build Arrow Tower'); return; }
    if (tooClose(player.x)) { showToast('Too close to another building!'); return; }
    buildings.push({ type: 'tower', x: player.x, y: GROUND_Y - 80, cooldown: 0, range: 220, level: 1 });
    money -= 10;
    buildCooldown = 20;
    playSound('build');
    spawnParticles(player.x, player.y, "#c8a84b", 8);
}

function buildWall() {
  if (!wallUnlocked) { showToast('Unlock Stone Wall in the Tech Tree first!'); return; }
  if (money < 5 || buildCooldown > 0) { showToast('Need 5 💰 to build a Wall'); return; }
  if (tooClose(player.x, 30)) { showToast('Too close to another building!'); return; }
  buildings.push({ type: 'wall', x: player.x, y: GROUND_Y - 55, health: 30, maxHealth: 30 });
  money -= 5;
  buildCooldown = 15;
  playSound('build');
  spawnParticles(player.x, player.y, "#aaaaaa", 8);
}

function buildSplashTower() {
    if (!splashUnlocked) { showToast('Unlock Splash Tower in the Tech Tree first!'); return; }
    if (money < 20 || buildCooldown > 0) { showToast('Need 20 💰 to build Splash Tower'); return; }
    if (tooClose(player.x)) { showToast('Too close to another building!'); return; }
    buildings.push({ type: 'splash', x: player.x, y: GROUND_Y - 90, cooldown: 0, range: 180, level: 1 });
    money -= 20;
    buildCooldown = 20;
    playSound('build');
    spawnParticles(player.x, player.y, "#ff6644", 12);
}

function buildMageTower() {
    if (!mageUnlocked) { showToast('Unlock Mage Tower in the Tech Tree first!'); return; }
    if (money < 25 || buildCooldown > 0) { showToast('Need 25 💰 to build Mage Tower'); return; }
    if (tooClose(player.x)) { showToast('Too close to another building!'); return; }
    buildings.push({ type: 'mage', x: player.x, y: GROUND_Y - 95, cooldown: 0, range: 260, level: 1 });
    money -= 25;
    buildCooldown = 20;
    playSound('build');
    spawnParticles(player.x, player.y, "#aa66ff", 12);
}

// ── TOWER INFO PANEL ──────────────────────────────────
function openTowerPanel(tower) {
    selectedTower = tower;
    towerInfoPanel.style.display = 'block';
    // force reflow so the transition fires
    towerInfoPanel.getBoundingClientRect();
    towerInfoPanel.classList.add('open');
    refreshTowerPanel();
}

function closeTowerPanel() {
    selectedTower = null;
    towerInfoPanel.classList.remove('open');
    // hide after slide-out animation
    setTimeout(() => {
        if (!towerInfoPanel.classList.contains('open')) {
            towerInfoPanel.style.display = 'none';
        }
    }, 280);
}

function refreshTowerPanel() {
    if (!selectedTower) return;
    const t = selectedTower;
    const lvl = t.level || 1;
    const isTower = t.type === 'tower';
    const isSplash = t.type === 'splash';
    const isMage = t.type === 'mage';

    // Stats per level
    const dmgMap   = isMage ? [1, 2, 3]         : isTower ? [2, 3, 5]         : [3, 5, 7];
    const rangeMap = isMage ? [260, 330, 400]    : isTower ? [220, 300, 380]   : [180, 240, 300];
    const rateMap  = isMage ? [115, 90, 70]      : isTower ? [90, 70, 55]      : [130, 100, 80];
    const shotsPerSec = (60 / rateMap[lvl - 1]).toFixed(1);

    towerInfoIcon.textContent  = isMage ? '🔮' : isTower ? '🗼' : '💥';
    towerInfoName.textContent  = isMage ? 'Mage Tower' : isTower ? 'Arrow Tower' : 'Splash Tower';

    // ── Always write all stat labels so they stay current after upgrades ──
    towerInfoLevel.textContent = '⭐'.repeat(lvl);
    towerInfoDmg.textContent   = dmgMap[lvl - 1];
    towerInfoRange.textContent = rangeMap[lvl - 1];
    towerInfoRate.textContent  = shotsPerSec + '/s';

    // Upgrade button
    if (lvl >= 3) {
        towerInfoUpgradeWrap.style.display = 'none';
        towerInfoMaxed.style.display = 'block';
    } else {
        towerInfoUpgradeWrap.style.display = 'block';
        towerInfoMaxed.style.display = 'none';
        const cost = isTower  ? (lvl === 1 ? 20 : 30)
                   : isSplash ? (lvl === 1 ? 30 : 40)
                   :            (lvl === 1 ? 40 : 50);
        towerInfoUpgradeBtn.textContent = `⬆ Upgrade ${cost} 💰`;
        towerInfoUpgradeBtn.disabled = money < cost;
    }
}

// ── UPGRADE nearest tower ──────────────────────────────
function upgradeNearestTower() {
    // Find the nearest tower or splash tower within range
    let nearest = null, minDist = Infinity;
    buildings.forEach(b => {
    if (b.type !== 'tower' && b.type !== 'splash' && b.type !== 'mage') return;
    const d = Math.abs(b.x - player.x);
    if (d < minDist) { minDist = d; nearest = b; }
    });

    if (!nearest || minDist > 120) { showToast('No tower nearby to upgrade!'); return; }
    if (nearest.level >= 3) { showToast('Tower is already at max level!'); return; }

    const cost = nearest.type === 'tower'  ? (nearest.level === 1 ? 20 : 30)
               : nearest.type === 'splash' ? (nearest.level === 1 ? 30 : 40)
               :                             (nearest.level === 1 ? 40 : 50);
    if (money < cost) { showToast(`Need ${cost} 💰 to upgrade!`); return; }

    money -= cost;
    nearest.level++;

    // Apply stat boosts per level
    if (nearest.type === 'tower') {
      nearest.range = nearest.level === 2 ? 300 : 380;
    } else if (nearest.type === 'splash') {
      nearest.range = nearest.level === 2 ? 240 : 300;
    } else if (nearest.type === 'mage') {
      nearest.range = nearest.level === 2 ? 330 : 400;
    }

    spawnParticles(nearest.x, nearest.y - 40, "#f0d080", 20);
    showToast(`⬆ Tower upgraded to Level ${nearest.level}!`);
    if (selectedTower === nearest) refreshTowerPanel();
}

// ── DELETE nearest building ────────────────────────────
function deleteNearestBuilding() {
  if (buildings.length === 0) return;
  let nearest = null, minDist = Infinity;
  buildings.forEach(b => {
    const d = Math.abs(b.x - player.x);
    if (d < minDist) { minDist = d; nearest = b; }
  });
  if (nearest && minDist < 120) {
    buildings = buildings.filter(b => b !== nearest);
    const py = (nearest.y !== undefined) ? nearest.y + 20 : GROUND_Y - 40;
    spawnParticles(nearest.x, py, "#cc4444", 10);
    showToast('Building demolished.');
  } else {
    showToast('No building nearby to delete.');
  }
}

// ═══════════════════════════════════════════════════
//  PARTICLES
// ═══════════════════════════════════════════════════
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx:   (Math.random() - 0.5) * 5,
      vy:   -Math.random() * 4 - 1,
      life: 1,
      color,
    });
  }
}

// ═══════════════════════════════════════════════════
//  UPDATE
// ═══════════════════════════════════════════════════
function update() {
  if (buildCooldown > 0) buildCooldown--;
// Keep tower panel upgrade button enabled/disabled state fresh
if (selectedTower) {
    if (!buildings.includes(selectedTower)) {
        closeTowerPanel(); // tower was deleted while panel was open
    } else {
        const cost = selectedTower.type === 'tower'  ? (selectedTower.level === 1 ? 20 : 30)
                   : selectedTower.type === 'splash' ? (selectedTower.level === 1 ? 30 : 40)
                   :                                   (selectedTower.level === 1 ? 40 : 50);
        if (towerInfoUpgradeBtn) towerInfoUpgradeBtn.disabled = money < cost || selectedTower.level >= 3;
    }
}

  // Always snap world objects to current GROUND_Y
  base.y        = GROUND_Y - base.height;
  leftPortal.y  = GROUND_Y - leftPortal.height;
  rightPortal.y = GROUND_Y - rightPortal.height;

  // ── Screen shake tick ────────────────────────────
  if (shakeFrames > 0) shakeFrames--;

  // ── Player movement (keyboard + touch) ──────────
  if (isActionDown('moveLeft')  || touch.left)  { player.x -= player.speed; player.facing = -1; }
  if (isActionDown('moveRight') || touch.right) { player.x += player.speed; player.facing =  1; }
  player.x = Math.max(player.width / 2, Math.min(WORLD_WIDTH - player.width / 2, player.x));
  player.y = GROUND_Y - player.height;  // always snap to ground

  // ── Build ────────────────────────────────────────
  if (isActionDown('build') || touch.build) {
    const def = BUILDING_DEFS[selectedSlot];
    if (def.unlocked()) def.build();
    else showToast(def.lockMsg);
    keys[KEYBINDS.build] = false;
    touch.build = false;
  }

  // ── Delete ───────────────────────────────────────
  if (isActionDown('delete') || touch.del) {
    deleteNearestBuilding();
    keys[KEYBINDS.delete] = false;
    touch.del = false;
  }

  // ── Camera — dead zone so minor movement doesn't scroll ─
  const targetCamX = player.x - canvas.width / 2;
  const camDelta   = targetCamX - camera.x;
  if (Math.abs(camDelta) > 80) camera.x += (camDelta - Math.sign(camDelta) * 80) * 0.06;
  camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, camera.x));

  // Day / night cycle — frozen while the boss fight is underway
  if (!inBossFight) {
  time += 1 / (20 * 60);

  if (time >= 1) {
  time = 0;

  if (isNight) {
    dayCount++;
    money += 8;
    playSound('day');
    spawnParticles(base.x + base.width / 2, base.y, "#f0d080", 20);
    showToast(`Day ${dayCount} begins. +8`);
    renderBuildBar();
    isNight = false;
    document.getElementById("skipNightBtn").style.display = "block";
  } else {
    isNight = true;
    spawnTimer = 0;
    waveActive = false;
    document.getElementById("skipNightBtn").style.display = "none";
  }
}
}

dayLabel.textContent = inBossFight
  ? (bossState === 'intro' ? '⚡ ARRIVAL' : bossState === 'victory' ? '👑 FALLEN' : '💀 BOSS')
  : (isNight ? `NIGHT ${dayCount}` : `DAY ${dayCount}`);

  // ── Wave announcement countdown ───────────────────
  if (waveAnnounce > 0) waveAnnounce--;

  // ── Kill streak timer ─────────────────────────────
  if (killStreakTimer > 0) killStreakTimer--;
  else killStreak = 0;

  // ── Wave spawning (night only) ────────────────────
  if (isNight && !inBossFight) {
    if (!waveActive || enemies.length === 0) {
      spawnTimer++;
      const betweenWaves = waveActive ? 240 : 0; // pause between waves
      if (spawnTimer >= betweenWaves) {
        spawnTimer  = 0;
        waveActive  = false;
        if (!endlessMode && !bossDefeated && waveNumber >= BOSS_TRIGGER_WAVE - 1) {
          triggerBossArrival();
        } else {
          spawnWaveEnemies();
        }
      }
    }
  } else if (!inBossFight) {
    spawnTimer = 0;
  }

  // ── Boss update (sky drops, tower smashes, glitches) ──
  updateBoss();

  // ── Update enemies ────────────────────────────────
enemies.forEach(enemy => {
    const baseCenterX = base.x + base.width / 2;
    enemy.wingTimer = (enemy.wingTimer || 0) + 1;

    // ── Sky-dropped enemies free-fall before joining the fight ──
    if (enemy.falling) {
        enemy.fallSpeed = (enemy.fallSpeed || 1) + 0.25;
        enemy.y += enemy.fallSpeed;
        if (enemy.y >= enemy.fallTargetY) {
            enemy.y = enemy.fallTargetY;
            enemy.falling = false;
            shakeFrames = Math.max(shakeFrames, 10); shakeMag = Math.max(shakeMag, 4);
            spawnParticles(enemy.x, enemy.y + enemy.height, '#ff2266', 14);
            playSound('baseHit');
        }
        return;
    }

    // Tick down stun
    if (enemy.stunTimer > 0) {
        enemy.stunTimer--;
        // Snap Y even while stunned
        if (enemy.flying) {
            enemy.y = GROUND_Y - enemy.flyHeight - enemy.height;
        } else {
            enemy.y = GROUND_Y - enemy.height;
        }
        return; // skip all movement and attack while stunned
    }

    if (enemy.flying) {
        // ── FLYING enemy logic (harpies) ──────────────────
        enemy.y = GROUND_Y - enemy.flyHeight - enemy.height;

        // Walls don't block harpies — skip wall check
        enemy.blocked = false;
        enemy.blockedBy = null;

        if (Math.abs(enemy.x - baseCenterX) < enemy.attackRange) {
            // Hover in place and fire at base
            enemy.attacking = true;
            enemy.attackTimer++;
            if (enemy.attackTimer % enemy.attackRate === 0) {
                base.health = Math.max(0, base.health - 3);
                shakeFrames = 8; shakeMag = 3;
                playSound('baseHit');
                spawnParticles(base.x + base.width / 2, base.y, "#e05050", 4);
                // Shoot a visible talon projectile downward
                projectiles.push({
                    x: enemy.x, y: enemy.y + enemy.height,
                    vx: (baseCenterX - enemy.x) * 0.05,
                    vy: 3,
                    target: { x: baseCenterX, y: base.y },
                    hit: false,
                    type: 'talon',
                    damage: 3,
                    isFakeTarget: true,
                });
            }
        } else {
            enemy.attacking = false;
            enemy.attackTimer = 0;
            enemy.x += enemy.speed * enemy.direction;
            if (enemy.direction === 1 && enemy.x > baseCenterX) enemy.direction = -1;
            if (enemy.direction === -1 && enemy.x < baseCenterX) enemy.direction = 1;
        }

    } else if (enemy.ranged) {
        // ── RANGER logic: keeps walking, occasionally shoots at towers ────────
        enemy.y = GROUND_Y - enemy.height;

        // Wall check (rangers get blocked by walls)
        enemy.blocked = false;
        enemy.blockedBy = null;
        buildings.forEach(b => {
            if (b.type !== 'wall') return;
            if (Math.abs(enemy.x - b.x) < 32) {
                enemy.blocked = true;
                enemy.blockedBy = b;
            }
        });

        if (enemy.blocked && enemy.blockedBy) {
            // Stop and attack wall
            enemy.attacking = true;
            enemy.attackTimer++;
            if (enemy.attackTimer % 60 === 0) {
                enemy.blockedBy.health -= 5;
                spawnParticles(enemy.blockedBy.x, enemy.blockedBy.y, "#cc5533", 4);
            }
        } else if (Math.abs(enemy.x - baseCenterX) < 30) {
            // Attack base when close
            enemy.attacking = true;
            enemy.attackTimer++;
            if (enemy.attackTimer % 60 === 0) {
                base.health = Math.max(0, base.health - 4);
                shakeFrames = 6;
                shakeMag = 2;
                playSound('baseHit');
                spawnParticles(baseCenterX, base.y + 40, "#e05050", 5);
            }
        } else {
            // Keep walking toward base
            enemy.attacking = false;
            enemy.x += enemy.speed * enemy.direction;

            // Occasionally shoot at towers while moving
            const towerTarget = buildings.find(b =>
                (b.type === 'tower' || b.type === 'splash' || b.type === 'mage') &&
                Math.abs(enemy.x - b.x) < enemy.attackRange
            );

            if (towerTarget) {
                enemy.attackTimer++;
                if (enemy.attackTimer % enemy.attackRate === 0 && Math.random() < 0.45) {
                    enemyProjectiles.push({
                        x: enemy.x,
                        y: enemy.y + 20,
                        targetX: towerTarget.x,
                        targetY: GROUND_Y - 70,
                        targetTower: towerTarget,
                        life: 45,
                        speed: 5.5,
                        damage: enemy.boltDamage || 6,
                        stuns: true,
                        stunDuration: enemy.stunDuration || 120,
                        isArrow: true,
                    });
                    playSound('arrowHit');
                }
            } else {
                enemy.attackTimer = 0;
            }

            // Flip direction when passing the base
            if (enemy.direction === 1 && enemy.x > baseCenterX) enemy.direction = -1;
            if (enemy.direction === -1 && enemy.x < baseCenterX) enemy.direction = 1;
        }

    } else {
        // ── GROUND enemy logic ────────────────────────────
        enemy.y = GROUND_Y - enemy.height;

        enemy.blocked = false;
        enemy.blockedBy = null;
        buildings.forEach(b => {
            if (b.type !== 'wall') return;
            if (Math.abs(enemy.x - b.x) < 28) {
                enemy.blocked = true;
                enemy.blockedBy = b;
            }
        });

        if (enemy.blocked && enemy.blockedBy) {
            enemy.attacking = true;
            enemy.attackTimer++;
            if (enemy.attackTimer % 60 === 0) {
                enemy.blockedBy.health -= 4;
                spawnParticles(enemy.blockedBy.x, enemy.blockedBy.y, "#cc5533", 4);
            }
        } else if (Math.abs(enemy.x - baseCenterX) < 30) {
            enemy.attacking = true;
            enemy.attackTimer++;
            if (enemy.attackTimer % 60 === 0) {
                base.health = Math.max(0, base.health - 5);
                shakeFrames = 8; shakeMag = 3;
                playSound('baseHit');
                spawnParticles(base.x + base.width / 2, base.y + base.height / 2, "#e05050", 5);
            }
        } else {
            enemy.attacking = false;
            enemy.attackTimer = 0;
            enemy.x += enemy.speed * enemy.direction;
            if (enemy.direction === 1 && enemy.x > baseCenterX) enemy.direction = -1;
            if (enemy.direction === -1 && enemy.x < baseCenterX) enemy.direction = 1;
        }

    }
});

  // ── Buildings fire / react ────────────────────────
  buildings.forEach(b => {
    // Stunned towers can't fire — freeze their cooldown countdown too
    // so they don't "bank" progress while disabled.
    const isStunned = b.stunUntil && Date.now() < b.stunUntil;
    if (isStunned && (b.type === 'tower' || b.type === 'splash' || b.type === 'mage')) {
      return;
    }

    if (b.type === 'tower') {
    const by = GROUND_Y - 90;
    const lvl = b.level || 1;
    const fireRate = lvl === 3 ? 55 : lvl === 2 ? 70 : 90;
    const projSpeed = lvl === 3 ? 11 : lvl === 2 ? 9.5 : 8;
    const damage = lvl === 3 ? 5 : lvl === 2 ? 3 : 2;
    b.cooldown--;
      if (b.cooldown <= 0) {
        // Arrow tower can hit ALL enemies including flying
        // Prioritise ground enemies; fall back to flying; finally the boss
const target =
    enemies.find(e => !e.flying && Math.abs(e.x - b.x) < b.range) ||
    enemies.find(e =>  e.flying && Math.abs(e.x - b.x) < b.range) ||
    ((boss && !boss.invulnerable) ? boss : null);
if (target) {
    const dx = target.x - b.x;
    const gravityVal = target.flying ? 0.04 : 0.15;
    // Snapshot the torso centre RIGHT NOW as fixed numbers — never read target.y again
    const aimX = target.x;
    const aimY = target.y + target.height * 0.42; // upper torso
    const dy = aimY - (by + 20);
    const totalDist = Math.sqrt(dx * dx + dy * dy) || 1;
    // Compensate for gravity drop over the flight so the arc lands at torso height
    const travelTime = Math.abs(dx) / projSpeed;
    const gravityDrop = 0.5 * gravityVal * travelTime;
    projectiles.push({
        x: b.x, y: by + 20,
        vx: (dx / totalDist) * projSpeed,
        vy: (dy / totalDist) * projSpeed - gravityDrop,
        target,
        aimX, aimY,   // ← baked-in torso snapshot used by hitbox
        hit: false, type: 'arrow', damage,
        gravity: gravityVal,
    });
    b.cooldown = fireRate;
}
      }
    }

      if (b.type === 'splash') {
    const by = GROUND_Y - 100;
    const lvl = b.level || 1;
    const fireRate    = lvl === 3 ? 80 : lvl === 2 ? 100 : 130;
    const splashDmg   = lvl === 3 ? 7  : lvl === 2 ? 5   : 3;
    const splashRadius= lvl === 3 ? 140 : lvl === 2 ? 120 : 100;
    const projSpeedS  = lvl === 3 ? 8   : lvl === 2 ? 7   : 6;
    b.cooldown--;
      if (b.cooldown <= 0) {
        // Splash Tower can't hit flying enemies (harpies) — ground-only splash damage
        const target = enemies.find(e => !e.flying && Math.abs(e.x - b.x) < b.range);
        if (target) {
    const dx = target.x - b.x;
    const aimY = target.y + target.height * 0.4;
    const dy   = aimY - (by + 20);
    const totalDist = Math.sqrt(dx * dx + dy * dy) || 1;
    const gravityVal = 0.12;
    const travelTime = Math.abs(dx) / projSpeedS;
    const gravityCompensation = 0.5 * gravityVal * travelTime;
    projectiles.push({
        x: b.x, y: by + 20,
        vx: (dx / totalDist) * projSpeedS,
        vy: (dy / totalDist) * projSpeedS - gravityCompensation,
        target, hit: false, type: 'splash',
        splashDmg, splashRadius,
        gravity: gravityVal,
    });
    b.cooldown = fireRate;
        }
      }
    }

      if (b.type === 'mage') {
    const by = GROUND_Y - 110;
    const lvl = b.level || 1;
    const fireRate = lvl === 3 ? 70 : lvl === 2 ? 90 : 115;
    const damage    = lvl === 3 ? 3  : lvl === 2 ? 2  : 1;
    const maxChains = lvl === 3 ? 5  : lvl === 2 ? 4  : 3;
    const STUN_FRAMES = 18; // ~0.3s at 60fps
    b.cooldown--;
    if (b.cooldown <= 0) {
        // Mage tower can hit ALL enemies including flying — and the boss
        const firstTarget = enemies.find(e => Math.abs(e.x - b.x) < b.range && e.stunTimer <= 0)
            || ((boss && !boss.invulnerable) ? boss : null);
        if (firstTarget) {
            // Build the chain: collect up to maxChains unique targets
            const chainTargets = [firstTarget];
            let lastX = firstTarget.x, lastY = firstTarget.y;
            for (let c = 1; c < maxChains; c++) {
                const next = enemies.find(e =>
                    !chainTargets.includes(e) &&
                    Math.abs(e.x - lastX) < 180 &&
                    e.stunTimer <= 0
                );
                if (!next) break;
                chainTargets.push(next);
                lastX = next.x;
                lastY = next.y;
            }
            // Damage and stun all chained targets
            chainTargets.forEach(e => {
                e.health -= damage;
                e.stunTimer = STUN_FRAMES;
                spawnParticles(e.x, e.y, "#aa66ff", 6);
                floatingNums.push({ x: e.x, y: e.y - 20, val: '-' + damage, color: '#cc88ff', life: 1 });
            });
            // Store the chain for drawing the lightning arc
            projectiles.push({
                type: 'lightning',
                chainTargets,
                life: 12,   // visible for 12 frames then fades
                originX: b.x,
                originY: by,
                hit: true,  // already dealt damage, no collision needed
            });
            b.cooldown = fireRate;
        }
    }
}
  });

  
  // ── Projectiles ───────────────────────────────────
  projectiles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity ?? 0.15;
    if (!p.hit && p.type !== 'lightning') {
        const tw = p.target.width || 38;
        const th = p.target.height || 72;
        const tCX = p.target.x;
        const tCY = (p.aimY !== undefined) ? p.aimY : p.target.y + th * 0.5;
        const hitW = tw * 0.45 + 10;
        const hitH = th * 0.55 + 20;
        if (Math.abs(p.x - tCX) < hitW && Math.abs(p.y - tCY) < hitH) {
        p.hit = true;
        if (p.type === 'splash') {
          // Area damage
          const r = p.splashRadius;
          splashRings.push({ x: p.x, y: p.y, r: 0, maxR: r, life: 1 });
          playSound('splash');
          enemies.forEach(e => {
            const dx = e.x - p.x, dy = (e.y + e.height * (e.size||1) * 0.5) - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < r) {
                const dmg = p.splashDmg || 2;
                e.health -= dmg;
                spawnParticles(e.x, e.y, "#ff4400", 6);
                floatingNums.push({ x: e.x, y: e.y - 20, val: '-' + dmg, color: '#ff6633', life: 1 });
            }
          });
        } else {
          const dmg = p.damage || 1;
          p.target.health -= dmg;
          playSound('arrowHit');
          spawnParticles(p.target.x, p.target.y, "#ff6644", 5);
          floatingNums.push({ x: p.target.x, y: p.target.y - 20, val: '-' + dmg, color: '#ff8866', life: 1 });
        }
      }
    }
  });

  projectiles = projectiles.filter(p => {
    if (p.type === 'lightning') return p.life > 0;
    if (p.type === 'talon') return !p.hit && p.y < GROUND_Y + 100;

    // Arrow missed — stick it into the ground
    if (p.type === 'arrow' && !p.hit && p.y >= GROUND_Y) {
        stuckArrows.push({
            x: p.x,
            angle: Math.atan2(p.vy, p.vx),
            life: 1,           // fades over 3 seconds (180 frames at 60fps)
            decay: 1 / 180,
        });
        return false;
    }

    // Splash bomb missed — explode on the ground with area damage
    if (p.type === 'splash' && !p.hit && p.y >= GROUND_Y) {
        const r = p.splashRadius;
        groundCraters.push({ x: p.x, r: 0, maxR: r, life: 1 });
        splashRings.push({ x: p.x, y: GROUND_Y, r: 0, maxR: r, life: 1 });
        spawnParticles(p.x, GROUND_Y, '#ff4400', 18);
        // Deal area damage to nearby enemies just like a normal hit
        enemies.forEach(e => {
            if (Math.abs(e.x - p.x) < r) {
                const dmg = p.splashDmg || 2;
                e.health -= dmg;
                spawnParticles(e.x, e.y, '#ff4400', 6);
                floatingNums.push({ x: e.x, y: e.y - 20, val: '-' + dmg, color: '#ff6633', life: 1 });
            }
        });
        return false;
    }

    return !p.hit && p.y < GROUND_Y + 50;
});

// ── Enemy Ranger stun bolts (stun towers, damage walls + base) ─────
enemyProjectiles.forEach(p => {
  const dx = p.targetX - p.x;
  const dy = p.targetY - p.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  p.x += (dx / dist) * p.speed;
  p.y += (dy / dist) * p.speed;
  p.life--;

  // Hit tower → stun only
  if (p.targetTower && Math.abs(p.x - p.targetTower.x) < 28 && Math.abs(p.y - (GROUND_Y - 65)) < 35) {
    p.life = 0;

    if (p.targetTower && p.stuns) {
      p.targetTower.stunUntil = Date.now() + (p.stunDuration || 120) * 16.67;
      spawnParticles(p.targetTower.x, GROUND_Y - 65, "#aaffff", 14);
    }
  }

  // Damage walls
  buildings.forEach(b => {
    if (b.type === 'wall' && Math.abs(p.x - b.x) < 35) {
      const dmg = p.damage || 6;
      b.health = Math.max(0, b.health - dmg);
      spawnParticles(b.x, GROUND_Y - 40, "#ff6644", 6);
      p.life = 0;
    }
  });

  // Damage base
  const baseCenterX = base.x + base.width / 2;
  if (Math.abs(p.x - baseCenterX) < 50 && p.life > 0) {
    const dmg = Math.floor((p.damage || 6) * 0.8);
    base.health = Math.max(0, base.health - dmg);
    spawnParticles(baseCenterX, base.y + 40, "#e05050", 8);
    shakeFrames = 6;
    shakeMag = 2;
    p.life = 0;
  }
});

enemyProjectiles = enemyProjectiles.filter(p => p.life > 0);
  // ── Splash ring animations ────────────────────────
  splashRings.forEach(s => { s.r += 4; s.life -= 0.05; });
  splashRings = splashRings.filter(s => s.life > 0);

  // ── Stuck arrows (fade over 3 seconds) ───────────
  stuckArrows.forEach(a => { a.life -= a.decay; });
  stuckArrows = stuckArrows.filter(a => a.life > 0);

  // ── Ground craters (expand ring then fade) ────────
  groundCraters.forEach(c => { c.r = Math.min(c.r + 5, c.maxR); c.life -= 0.018; });
  groundCraters = groundCraters.filter(c => c.life > 0);

  // ── Remove dead enemies ───────────────────────────
  enemies = enemies.filter(e => {
    if (e.health <= 0) {
      const reward = e.reward || (2 + Math.floor(dayCount * 0.5));
      // Kill streak
      killStreak++;
      killStreakTimer = 90;
      let bonus = 0;
      if (killStreak > 0 && killStreak % 5 === 0) {
        bonus = 5;
        playSound('streak');
        showToast(`🔥 ${killStreak} kill streak! +5 bonus 💰`);
      }
      money += reward + bonus;
      totalKills++;
      playSound('enemyDie');
      spawnParticles(e.x, e.y, "#ff8844", 12);
      floatingNums.push({ x: e.x, y: e.y - 10, val: '+' + (reward + bonus) + '💰', color: '#f0d080', life: 1.2 });
      return false;
    }
    return true;
  });

  // ── Remove destroyed walls ────────────────────────
  buildings = buildings.filter(b => {
    if (b.type === 'wall' && b.health <= 0) {
      spawnParticles(b.x, b.y + 20, "#888888", 14);
      playSound('wallBreak');
      showToast('A wall was destroyed!');
      return false;
    }
    return true;
  });

  // ── Floating numbers ──────────────────────────────
  floatingNums.forEach(n => { n.y -= 0.8; n.life -= 0.022; });
  floatingNums = floatingNums.filter(n => n.life > 0);

  // ── Particles (main) ──────────────────────────────
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.04; });
  particles = particles.filter(p => p.life > 0);

  // ── HUD ───────────────────────────────────────────
  hudMoney.textContent  = money;
  hudTowers.textContent = buildings.length;
  hudHP.textContent     = Math.floor(base.health);
  hudMaxHP.textContent  = Math.floor(base.maxHealth);
  hpBar.style.width     = (base.health / base.maxHealth * 100) + "%";
  if (hudKillsEl) hudKillsEl.textContent = totalKills;
  if (hudWaveEl)  hudWaveEl.textContent  = waveNumber;

  // ── Game over ─────────────────────────────────────
  if (base.health <= 0) {
    gameRunning                  = false;
    gamePaused                   = false;
    canvas.style.display         = "none";
    hud.style.display            = "none";
    dayLabel.style.display       = "none";
    pauseBtn.style.display       = "none";
    document.getElementById('rightUI').style.display = "none";
    techModal.classList.remove('open');
    pauseModal.classList.remove('open');
    pauseBtn.classList.remove('active');
    listeningForRebind = null;
    goStats.textContent = `Survived ${dayCount} day${dayCount !== 1 ? "s" : ""} · ${totalKills} enemies slain`;
    gameOverScreen.style.display = "flex";
  }
}

// ═══════════════════════════════════════════════════
//  DRAW — six-layer pipeline
//
//  Layer 0  drawLayerSky()        Sky, stars, sun/moon
//  Layer 1  drawLayerMidground()  Trees at 60% parallax speed
//  Layer 2  drawLayerGround()     Ground strip
//  Layer 3  drawLayerWorld()      Portals, base, buildings
//  Layer 4  drawLayerEntities()   Enemies, projectiles, FX
//  Layer 5  drawLayerHUD()        Screen-space overlays (no camera transform)
// ═══════════════════════════════════════════════════
function draw() {
  // Corrupted atmosphere — intensifies as the boss takes hold of the sky
  if (corruption > 0.001) {
    canvas.style.filter = `contrast(${1 + corruption * 0.55}) saturate(${1 + corruption * 0.7}) hue-rotate(${corruption * 260}deg) brightness(${1 - corruption * 0.15})`;
  } else if (canvas.style.filter) {
    canvas.style.filter = '';
  }

  // Smooth sine-wave shake — avoids nauseating random jitter
  const shakeT = Date.now() / 30;
  const sx = shakeFrames > 0 ? Math.sin(shakeT * 2.3) * shakeMag * (shakeFrames / 12) : 0;
  const sy = shakeFrames > 0 ? Math.sin(shakeT * 1.7) * shakeMag * 0.5 * (shakeFrames / 12) : 0;

  // Layers 0–4 share the world-space transform
  ctx.save();
  ctx.translate(-camera.x + sx, sy);
  drawLayerSky();
  drawLayerBoss();
  drawLayerMidground();
  drawLayerGround();
  drawLayerWorld();
  drawLayerEntities();
  ctx.restore();

  // Layer 5 — screen space, no camera transform
  drawLayerHUD();

  // Layer 6 — screen-space glitch post-process (boss only)
  drawGlitchBands();
}

// ── Layer 0.5: Boss — a giant corrupted king filling the sky ─
function drawLayerBoss() {
  if (!boss) return;
  const b = boss;
  const alpha = b.fadeAlpha !== undefined ? b.fadeAlpha : 1;
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  const cx = b.x, cy = b.y;
  const w = b.width, h = b.height;

  // Ambient dark halo behind everything
  const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.6);
  haloGrad.addColorStop(0, 'rgba(80,0,55,0.72)');
  haloGrad.addColorStop(1, 'rgba(10,0,10,0)');
  ctx.fillStyle = haloGrad;
  ctx.fillRect(cx - w * 0.7, cy - h * 0.8, w * 1.4, h * 1.8);

  // Vignette overlay to push the sky background back and make the boss pop
  const vignette = ctx.createRadialGradient(cx, cy, h * 0.25, cx, cy, w * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vignette;
  ctx.fillRect(cx - w * 0.8, cy - h * 0.9, w * 1.6, h * 1.9);

  // Wings — two huge jagged shapes spanning the entire screen
  const wingSpan = w * 0.55;
  const flap = Math.sin(bossTimer * 0.025) * 0.08;
  [-1, 1].forEach(side => {
    ctx.save();
    ctx.translate(cx, cy + h * 0.05);
    ctx.scale(side, 1);
    ctx.rotate(flap);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(wingSpan * 0.30, -h * 0.30);
    ctx.lineTo(wingSpan * 0.55, -h * 0.10);
    ctx.lineTo(wingSpan * 0.85, -h * 0.34);
    ctx.lineTo(wingSpan * 0.62,  h * 0.02);
    ctx.lineTo(wingSpan * 0.95,  h * 0.20);
    ctx.lineTo(wingSpan * 0.50,  h * 0.16);
    ctx.lineTo(wingSpan * 0.34,  h * 0.32);
    ctx.lineTo(wingSpan * 0.12,  h * 0.10);
    ctx.closePath();
    const wingGrad = ctx.createLinearGradient(0, -h * 0.3, 0, h * 0.3);
    wingGrad.addColorStop(0, '#0f0514');
    wingGrad.addColorStop(0.5, '#2a0a35');
    wingGrad.addColorStop(1, '#4a1548');
    ctx.fillStyle = wingGrad;
    ctx.fill();

    // Wing edge highlight for silhouette separation
    ctx.strokeStyle = 'rgba(200,80,160,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glowing cracks along the wing membrane
    ctx.strokeStyle = '#ff66ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff44ff';
    ctx.shadowBlur = 18;
    ctx.globalAlpha = alpha * (0.5 + 0.5 * Math.sin(bossTimer * 0.05 + side));
    ctx.beginPath();
    ctx.moveTo(wingSpan * 0.10, -h * 0.05);
    ctx.lineTo(wingSpan * 0.40, -h * 0.20);
    ctx.lineTo(wingSpan * 0.30,  h * 0.05);
    ctx.lineTo(wingSpan * 0.60,  h * 0.15);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = alpha;
    ctx.restore();
  });

  // Crowned head, centered in the sky
  const headW = w * 0.16, headH = h * 0.32;
  ctx.fillStyle = '#1a0818';
  ctx.beginPath();
  ctx.ellipse(cx, cy, headW, headH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head rim light to separate from the sky
  ctx.strokeStyle = 'rgba(255,80,120,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, headW, headH, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Cracked crown
  ctx.fillStyle = '#e0c060';
  ctx.shadowColor = '#ffdd66'; ctx.shadowBlur = 20;
  const crownY = cy - headH * 0.9;
  ctx.beginPath();
  ctx.moveTo(cx - headW * 0.70, crownY);
  ctx.lineTo(cx - headW * 0.45, crownY - headH * 0.45);
  ctx.lineTo(cx - headW * 0.15, crownY - headH * 0.10);
  ctx.lineTo(cx,                crownY - headH * 0.60);
  ctx.lineTo(cx + headW * 0.15, crownY - headH * 0.10);
  ctx.lineTo(cx + headW * 0.45, crownY - headH * 0.45);
  ctx.lineTo(cx + headW * 0.70, crownY);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Glowing eyes
  const eyeY = cy - headH * 0.1;
  const eyePulse = 0.6 + 0.4 * Math.sin(bossTimer * 0.08);
  ctx.fillStyle = `rgba(255,30,80,${0.85 + 0.15 * eyePulse})`;
  ctx.shadowColor = '#ff2255'; ctx.shadowBlur = 28;
  [-1, 1].forEach(s => {
    ctx.beginPath();
    ctx.ellipse(cx + s * headW * 0.35, eyeY, headW * 0.12, headH * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // Cracked mouth
  ctx.strokeStyle = '#ff7799';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ff3355'; ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(cx - headW * 0.3, cy + headH * 0.35);
  ctx.lineTo(cx,               cy + headH * 0.50);
  ctx.lineTo(cx + headW * 0.3, cy + headH * 0.35);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();

  // Rift telegraphs — warn where an enemy is about to drop
  dropTelegraphs.forEach(dtg => {
    const a = Math.min(1, dtg.life / 50);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#ff66cc';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff44ff'; ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(dtg.x, 40, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  // Tower-smash telegraph — warning ring under the doomed tower
  if (bossTelegraph) {
    const t = bossTelegraph;
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t.life * 0.6);
    ctx.strokeStyle = '#ff2244';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(t.x, GROUND_Y - 40, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Layer 6: Glitch bands — screen-space datamosh post-process ─
function drawGlitchBands() {
  if (glitchBands.length === 0) return;
  glitchBands.forEach(g => {
    const a = Math.min(1, g.life / 10);
    ctx.save();
    ctx.globalAlpha = a;
    try {
      ctx.drawImage(canvas, 0, g.y, canvas.width, g.h, g.offset, g.y, canvas.width, g.h);
    } catch (err) { /* self-draw can fail on some browsers mid-resize; ignore */ }
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,40,120,0.18)' : 'rgba(40,220,255,0.14)';
    ctx.fillRect(0, g.y, canvas.width, g.h);
    ctx.restore();
  });
}

// ── Layer 0: Sky ─────────────────────────────────────
function drawLayerSky() {
  const skyTop  = isNight ? "#05050f" : "#87ceeb";
  const skyBot  = isNight ? "#0a0a20" : "#c9e8f8";
  const skyGrad = ctx.createLinearGradient(camera.x, 0, camera.x, GROUND_Y);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(camera.x, 0, canvas.width, GROUND_Y);

  // Stars (night only)
  if (isNight) {
    const now = Date.now() / 1000;
    STARS.forEach(s => {
      if (s.x < camera.x - 20 || s.x > camera.x + canvas.width + 20) return;
      const worldY = s.y * GROUND_Y;
      const blink  = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(now * s.speed + s.phase));
      ctx.globalAlpha = blink;
      if (s.size >= 2.2) {
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 0.6;
        ctx.globalAlpha = blink * 0.6;
        ctx.beginPath();
        ctx.moveTo(s.x - s.size * 1.8, worldY); ctx.lineTo(s.x + s.size * 1.8, worldY);
        ctx.moveTo(s.x, worldY - s.size * 1.8); ctx.lineTo(s.x, worldY + s.size * 1.8);
        ctx.stroke();
        ctx.globalAlpha = blink;
      }
      ctx.fillStyle = s.size >= 2 ? "#eef0ff" : "#ffffff";
      ctx.beginPath(); ctx.arc(s.x, worldY, s.size * 0.7, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Sun / Moon — travels across screen on a parabolic arc
  const bodyRadius = 28;
  const arcStartX  = camera.x - bodyRadius - 20;
  const arcEndX    = camera.x + canvas.width + bodyRadius + 20;
  const bodyX      = arcStartX + (arcEndX - arcStartX) * time;
  const bodyY      = 110 + (280 - 110) * Math.pow((time - 0.5) / 0.5, 2);
  ctx.beginPath(); ctx.arc(bodyX, bodyY, bodyRadius, 0, Math.PI * 2);
  if (isNight) {
    ctx.fillStyle = "#ddeeff"; ctx.shadowColor = "#aabbff"; ctx.shadowBlur = 30;
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(bodyX + 8, bodyY - 8, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#c5d5ee"; ctx.fill();
  } else {
    ctx.fillStyle = "#ffe566"; ctx.shadowColor = "#ffdd00"; ctx.shadowBlur = 50;
    ctx.fill(); ctx.shadowBlur = 0;
  }
}

// ── Layer 1: Midground — trees at 60% parallax speed ─
// Trees scroll slower than the foreground, giving depth.
// We shift the transform by 40% of camera.x so trees appear
// further away without a separate canvas.
function drawLayerMidground() {
  ctx.save();
  // Parallax offset: trees move at 60% of camera speed
  const parallaxX = camera.x * 0.4;
  ctx.translate(parallaxX, 0);
  drawTrees(parallaxX);
  ctx.restore();
}

// ── Layer 2: Ground strip ─────────────────────────────
function drawLayerGround() {
  const groundGrad = ctx.createLinearGradient(camera.x, GROUND_Y, camera.x, canvas.height);
  groundGrad.addColorStop(0,    isNight ? "#1a2a14" : "#3a7d2a");
  groundGrad.addColorStop(0.15, isNight ? "#0e1a0a" : "#2a5c1a");
  groundGrad.addColorStop(1,    "#0a0f07");
  ctx.fillStyle = groundGrad;
  ctx.fillRect(camera.x, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
  ctx.strokeStyle = isNight ? "#2a4020" : "#4a9030";
  ctx.lineWidth   = 3;
  ctx.beginPath();
  ctx.moveTo(camera.x, GROUND_Y); ctx.lineTo(camera.x + canvas.width, GROUND_Y);
  ctx.stroke();
}

// ── Layer 3: World objects ────────────────────────────
function drawLayerWorld() {
  drawPortal(leftPortal.x,  leftPortal.y,  leftPortal.width,  leftPortal.height,  "#9933ff");
  drawPortal(rightPortal.x, rightPortal.y, rightPortal.width, rightPortal.height, "#ff3399");
  drawBase();
  buildings.forEach(b => {
    if      (b.type === 'tower')  drawArrowTower(b);
    else if (b.type === 'wall')   drawWallBuilding(b);
    else if (b.type === 'splash') drawSplashTower(b);
    else if (b.type === 'mage')   drawMageTower(b);
  });
}

// ── Layer 4: Entities + FX ───────────────────────────
// ── Corrupted "PNG" overlay — enemies look like sloppily pasted images ─
function drawCorruptionFX(e) {
  const s  = e.size || 1;
  const ew = e.width * s, eh = e.height * s;
  const ex = e.x - ew / 2, ey = e.y;
  ctx.save();
  // Occasional chromatic-aberration flicker
  if (Math.random() < 0.06) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ff2244';
    ctx.fillRect(ex - 3, ey, ew, eh);
    ctx.fillStyle = '#22ddff';
    ctx.fillRect(ex + 3, ey, ew, eh);
    ctx.globalCompositeOperation = 'source-over';
  }
  // "Marching ants" selection border — looks freshly cut-and-pasted
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 3]);
  ctx.lineDashOffset = -(Date.now() / 35) % 14;
  ctx.strokeRect(ex - 3, ey - 3, ew + 6, eh + 6);
  ctx.restore();
}

function drawLayerEntities() {
  const corrupted = corruption > 0.05;
  enemies.forEach(e => {
    if (e.flying)       drawHarpy(e);
    else if (e.ranged)  drawRanger(e);
    else                drawEnemy(e);
    if (corrupted && !e.falling) drawCorruptionFX(e);
  });

  // ── Projectiles ───────────────────────────────────
  // Draw Ranger arrow bolts
  enemyProjectiles.forEach(p => {
    const dx = p.targetX - p.x, dy = p.targetY - p.y;
    const angle = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    // Glow tint hints at the stun effect without a laser line
    ctx.shadowColor = "#66ccff";
    ctx.shadowBlur = 6;
    // Shaft
    ctx.strokeStyle = "#3a5a8a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(6, 0); ctx.stroke();
    // Head
    ctx.fillStyle = "#aaffff";
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(4, -3); ctx.lineTo(4, 3); ctx.closePath(); ctx.fill();
    // Fletching
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#66ccff"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-6, -4); ctx.moveTo(-10, 0); ctx.lineTo(-6, 4); ctx.stroke();
    ctx.restore();
  });

  projectiles.forEach(p => {
    if (p.type === 'splash') {
      // Glowing orange ball
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fillStyle   = "#ff6622";
      ctx.shadowColor = "#ff4400";
      ctx.shadowBlur  = 16;
      ctx.fill();
      ctx.shadowBlur  = 0;
    } else if (p.type === 'talon') {
    // Small red claw thrown by harpies
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#cc3333';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  } else if (p.type === 'lightning') {
    // Chain lightning arc drawn between chained targets
    if (p.life > 0) {
        const alpha = Math.min(1, p.life / 8);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#cc88ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#aa44ff';
        ctx.shadowBlur = 12;
        // Draw from tower origin to first target, then between each chained target
        const points = [{ x: p.originX, y: p.originY }, ...p.chainTargets.map(e => ({ x: e.x, y: e.y - e.height / 2 }))];
        for (let i = 0; i < points.length - 1; i++) {
            const ax = points[i].x, ay = points[i].y;
            const bx = points[i + 1].x, by2 = points[i + 1].y;
            // Draw a jagged lightning bolt with 3 midpoints
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            const jag1x = (ax + bx) / 2 + (Math.random() - 0.5) * 30;
            const jag1y = (ay + by2) / 2 + (Math.random() - 0.5) * 30;
            ctx.lineTo(jag1x, jag1y);
            ctx.lineTo(bx, by2);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
        p.life--;
    }
  } else {
    // Arrow
    const angle = Math.atan2(p.vy, p.vx);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.strokeStyle = "#a0704a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(6, 0); ctx.stroke();
    ctx.fillStyle = "#c8c8d8";
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(4, -3); ctx.lineTo(4, 3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#cc4444"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-6, -4); ctx.moveTo(-10, 0); ctx.lineTo(-6, 4); ctx.stroke();
    ctx.restore();
  }
  });

  // Splash rings
  splashRings.forEach(s => {
    ctx.globalAlpha = s.life * 0.5;
    ctx.strokeStyle = "#ff6622"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // Ground craters
  groundCraters.forEach(c => {
    ctx.save(); ctx.globalAlpha = c.life * 0.55;
    const grad = ctx.createRadialGradient(c.x, GROUND_Y, 0, c.x, GROUND_Y, c.r);
    grad.addColorStop(0,   'rgba(255,80,0,0.55)');
    grad.addColorStop(0.5, 'rgba(120,30,0,0.3)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(c.x, GROUND_Y, c.r, c.r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff4400'; ctx.lineWidth = 2; ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.ellipse(c.x, GROUND_Y, c.r, c.r * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();
  });

  // Stuck arrows
  stuckArrows.forEach(a => {
    ctx.save(); ctx.globalAlpha = a.life;
    ctx.translate(a.x, GROUND_Y); ctx.rotate(a.angle);
    ctx.strokeStyle = '#a0704a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(6, 0); ctx.stroke();
    ctx.fillStyle = '#c8c8d8';
    ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(4,-3); ctx.lineTo(4,3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#cc4444'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(-6,-4); ctx.moveTo(-10,0); ctx.lineTo(-6,4); ctx.stroke();
    ctx.restore();
  });

  // Particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = p.color; ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Floating numbers
  ctx.textAlign = "center";
  floatingNums.forEach(n => {
    ctx.globalAlpha = Math.min(1, n.life * 2);
    ctx.font = "bold 15px Georgia"; ctx.fillStyle = n.color;
    ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 4;
    ctx.fillText(n.val, n.x, n.y); ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1; ctx.textAlign = "left";

  drawPlayer();
}

// ── Layer 5: Screen-space HUD overlays ───────────────
function drawLayerHUD() {
  // Boss health bar — THE BROKEN KING
  if (boss && bossState !== 'none') {
    const bw = Math.min(560, canvas.width * 0.62);
    const bx = canvas.width / 2 - bw / 2;
    const by = 24;
    ctx.save();
    ctx.globalAlpha = boss.fadeAlpha !== undefined ? boss.fadeAlpha : 1;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff5577"; ctx.font = "bold 18px Georgia";
    ctx.shadowColor = "#ff2255"; ctx.shadowBlur = 10;
    ctx.fillText("👑 THE BROKEN KING", canvas.width / 2, by - 6);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(bx, by, bw, 14);
    const pct = Math.max(0, boss.health / boss.maxHealth);
    const hpGrad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    hpGrad.addColorStop(0, "#ff2255"); hpGrad.addColorStop(1, "#cc33ff");
    ctx.fillStyle = hpGrad;
    ctx.fillRect(bx, by, bw * pct, 14);
    ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, 14);
    ctx.restore();
  }

  // Wave announcement banner
  if (waveAnnounce > 0) {
    const fade    = Math.min(1, waveAnnounce / 30) * Math.min(1, waveAnnounce / 15);
    const bannerY = canvas.height * 0.38;
    ctx.save();
    ctx.globalAlpha = fade * 0.88;
    ctx.fillStyle   = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, bannerY - 50, canvas.width, 100);
    ctx.globalAlpha = fade;
    ctx.strokeStyle = "#cc2233"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, bannerY-50); ctx.lineTo(canvas.width, bannerY-50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, bannerY+50); ctx.lineTo(canvas.width, bannerY+50); ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff3344"; ctx.font = "bold 28px Georgia";
    ctx.fillText("⚔  WAVE  " + waveNumber, canvas.width / 2, bannerY - 8);
    ctx.fillStyle = "#f0d080"; ctx.font = "13px Georgia";
    const hint = waveNumber >= 5 ? "Grunts · Scouts · Brutes · Harpies · Rangers incoming"
               : waveNumber >= 3 ? "Grunts · Scouts · Brutes incoming"
               : waveNumber >= 2 ? "Grunts · Scouts incoming"
               : "Grunts incoming";
    ctx.fillText(hint, canvas.width / 2, bannerY + 20);
    ctx.restore();
  }

  // Kill streak
  if (killStreak >= 3 && killStreakTimer > 0) {
    const fade = Math.min(1, killStreakTimer / 30);
    ctx.save();
    ctx.globalAlpha = fade; ctx.textAlign = "left";
    ctx.font = "bold 15px Georgia"; ctx.fillStyle = "#ff9933";
    ctx.shadowColor = "#cc5500"; ctx.shadowBlur = 12;
    ctx.fillText(`🔥 ${killStreak}x STREAK`, 18, canvas.height - 54);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawMinimap();
}

function drawMinimap() {
  const MW=93, MH=12;
  const MX=Math.round(canvas.width/2-MW/2);
  const MY=canvas.height-MH-10;
  const PAD=2;
  ctx.save();
  ctx.globalAlpha=0.82;
  ctx.fillStyle="rgba(0,0,0,0.75)"; ctx.strokeStyle="#c8a84b66"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.roundRect(MX,MY,MW,MH,2); ctx.fill(); ctx.stroke();
  ctx.globalAlpha=1;
  const toMX=wx=>MX+PAD+(wx/WORLD_WIDTH)*(MW-PAD*2);
  const groundLineY=MY+MH*0.72;
  ctx.strokeStyle=isNight?"#2a4020":"#4a9030"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(MX+PAD,groundLineY); ctx.lineTo(MX+MW-PAD,groundLineY); ctx.stroke();
  ctx.fillStyle="#c8a84b";
  ctx.fillRect(toMX(base.x),groundLineY-2,toMX(base.x+base.width)-toMX(base.x),2);
  buildings.forEach(b=>{
    ctx.fillStyle=b.type==='wall'?"#aaaaaa":b.type==='splash'?"#ff6633":b.type==='mage'?"#cc88ff":"#e8c84b";
    ctx.fillRect(toMX(b.x)-1,groundLineY-2,2,2);
  });
  enemies.forEach(e=>{
    ctx.fillStyle=e.kind==='brute'?"#cc44ff":e.kind==='scout'?"#ff8844":e.kind==='harpy'?"#ff88cc":"#ff3333";
    ctx.beginPath(); ctx.arc(toMX(e.x),groundLineY-1,1,0,Math.PI*2); ctx.fill();
  });
  const px=toMX(player.x);
  ctx.fillStyle="#ffffff";
  ctx.beginPath(); ctx.moveTo(px,groundLineY-3); ctx.lineTo(px+2,groundLineY-1); ctx.lineTo(px,groundLineY); ctx.lineTo(px-2,groundLineY-1); ctx.closePath(); ctx.fill();
  const vLeft=toMX(camera.x),vRight=toMX(camera.x+canvas.width);
  ctx.fillStyle="rgba(255,255,255,0.07)"; ctx.strokeStyle="rgba(255,255,255,0.28)"; ctx.lineWidth=1;
  ctx.fillRect(vLeft,MY+1,vRight-vLeft,MH-2); ctx.strokeRect(vLeft,MY+1,vRight-vLeft,MH-2);
  ctx.restore();
}


function drawMenuBackground() {
  ctx.save();
  ctx.translate(-camera.x, 0);

  // Only sky + stars + sun/moon
  const skyTop  = isNight ? "#05050f" : "#87ceeb";
  const skyBot  = isNight ? "#0a0a20" : "#c9e8f8";

  const skyGrad = ctx.createLinearGradient(camera.x, 0, camera.x, GROUND_Y);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBot);

  ctx.fillStyle = skyGrad;
  ctx.fillRect(camera.x, 0, canvas.width, GROUND_Y);

  // Stars
  if (isNight) {
    const now = Date.now() / 1000;
    STARS.forEach(s => {
      const worldX = s.x;
      if (worldX < camera.x || worldX > camera.x + canvas.width) return;
      const worldY = s.y * GROUND_Y;
      const blink  = 0.5 + 0.5 * Math.sin(now * s.speed + s.phase);

      ctx.globalAlpha = blink;
      ctx.beginPath();
      ctx.arc(worldX, worldY, s.size, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Sun / Moon
  const bodyRadius = 28;
  const arcStartX = camera.x - bodyRadius - 20;
  const arcEndX = camera.x + canvas.width + bodyRadius + 20;
  const tArc = time;
  const bodyX = arcStartX + (arcEndX - arcStartX) * tArc;

  // Parabolic arc: low at left/right, high in middle
  const arcPeakY = 110;
  const arcEdgeY = 280;
  const bodyY = arcPeakY + (arcEdgeY - arcPeakY) * Math.pow((tArc - 0.5) / 0.5, 2);

  ctx.beginPath();
  ctx.arc(bodyX, bodyY, bodyRadius, 0, Math.PI * 2);
  ctx.fillStyle = isNight ? "#ddeeff" : "#ffe566";
  ctx.fill();
  ctx.restore();
}

function drawTrees(parallaxOffset = 0) {
  // Cull against the effective visible range under the parallax shift
  const visLeft  = camera.x - parallaxOffset - 100;
  const visRight = camera.x - parallaxOffset + canvas.width + 100;
  const positions = [133,267,467,600,867,1067,1300,1533,1800,2067,2333,2533,2800,3067,3200,
    3467,3667,3933,4133,4400,4600,4833,5067,5333,5567,5800,6000,6200,6400,6533];
  positions.forEach(tx => {
    if (tx < visLeft || tx > visRight) return;
    const h = 80 + (tx % 60);
    const w = 24 + (tx % 20);
    ctx.fillStyle = isNight ? "#0a1a08" : "#2a5a18";
    ctx.fillRect(tx - 6, GROUND_Y - 30, 12, 30);
    ctx.beginPath();
    ctx.moveTo(tx,     GROUND_Y - 30 - h);
    ctx.lineTo(tx - w, GROUND_Y - 30);
    ctx.lineTo(tx + w, GROUND_Y - 30);
    ctx.closePath();
    ctx.fillStyle = isNight ? "#0d2210" : "#1e6b10";
    ctx.fill();
  });
}

function drawPortal(px, py, pw, ph, color) {
  const cx = px + pw / 2, cy = py + ph / 2;
  const t  = Date.now() / 600;
  const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, pw * 1.4);
  grad.addColorStop(0,   color + "cc");
  grad.addColorStop(0.5, color + "44");
  grad.addColorStop(1,   color + "00");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, pw * 1.4, ph * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur  = 30 + Math.sin(t) * 10;
  ctx.strokeStyle = color;
  ctx.lineWidth   = 4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, pw * 0.9, ph * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = t + i * Math.PI * 2 / 3;
    const ex = cx + Math.cos(a) * pw * 0.4;
    const ey = cy + Math.sin(a) * ph * 0.25;
    ctx.beginPath();
    ctx.arc(ex, ey, 5 + Math.sin(t + i) * 3, 0, Math.PI * 2);
    ctx.fillStyle = color + "dd";
    ctx.fill();
  }
  ctx.globalAlpha = 0.3 + Math.sin(t) * 0.1;
  ctx.fillStyle   = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, pw * 0.85, ph * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.fillStyle   = "#ffffff99";
  ctx.font        = "bold 11px Georgia";
  ctx.textAlign   = "center";
  ctx.fillText("PORTAL", cx, py + ph + 18);
  ctx.textAlign   = "left";
}

function drawBase() {
  const bx = base.x, by = base.y, bw = base.width, bh = base.height;
  const cx = bx + bw / 2;
  const gy = by + bh;
  const t  = Date.now() / 1000;
  const hpF = base.health / base.maxHealth;

  const stone     = isNight ? "#4a4555" : "#7a7288";
  const stoneDark = isNight ? "#332840" : "#5a5068";
  const stoneHi   = isNight ? "#5a5568" : "#9a93a8";

  // Drop shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(bx + 10, by + bh - 4, bw, 18);

  // Back wall
  ctx.fillStyle = stoneDark;
  ctx.fillRect(bx + 36, by + 50, bw - 72, bh - 50);
  ctx.strokeStyle = isNight ? "#2a2035" : "#4a4460"; ctx.lineWidth = 1;
  for (let row = 0; row < 7; row++) {
    const ry = by + 56 + row * 18;
    const cols = row % 2 === 0 ? 4 : 3;
    const brickW = (bw - 72) / cols;
    for (let col = 0; col < cols; col++) ctx.strokeRect(bx + 38 + col * brickW + 1, ry, brickW - 3, 14);
  }

  // Flanking towers
  drawTowerMini(bx,          by + 20, 46, bh - 20);
  drawTowerMini(bx + bw - 46, by + 20, 46, bh - 20);

  // Central gatehouse
  const gw = 80, gx = cx - 40, gy2 = by - 20;
  ctx.fillStyle = stone;
  ctx.fillRect(gx, gy2, gw, bh + 20);
  ctx.strokeStyle = isNight ? "#3a3050" : "#5a5070"; ctx.lineWidth = 1;
  for (let row = 0; row < 8; row++) {
    const ry = gy2 + 4 + row * 18;
    for (let col = 0; col < 2; col++) {
      const offset = row % 2 === 0 ? 2 : -2;
      ctx.strokeRect(gx + 4 + col * (gw / 2) + offset, ry, gw / 2 - 6, 14);
    }
  }
  // Battlements
  ctx.fillStyle = stoneHi;
  const merlonCount = 5, merlonW = gw / (merlonCount * 2 - 1);
  for (let i = 0; i < merlonCount; i++) ctx.fillRect(gx + i * merlonW * 2, gy2 - 16, merlonW, 16);
  // Spire
  ctx.fillStyle = isNight ? "#220a22" : "#4a1a3a";
  ctx.beginPath(); ctx.moveTo(cx, gy2 - 55); ctx.lineTo(gx - 6, gy2 - 16); ctx.lineTo(gx + gw + 6, gy2 - 16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = isNight ? "#440a44" : "#7a2a5a"; ctx.lineWidth = 2; ctx.stroke();

  // Portcullis arch
  const archW = 28, archH = 44, archX = cx - archW / 2, archY = by + bh - archH;
  ctx.fillStyle = "#0a0810";
  ctx.beginPath(); ctx.rect(archX, archY + archW / 2, archW, archH - archW / 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, archY + archW / 2, archW / 2, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = "#2a2030"; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(archX + 4 + i * 7, archY + archW / 2); ctx.lineTo(archX + 4 + i * 7, archY + archH); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(archX, archY + archW / 2 + 10); ctx.lineTo(archX + archW, archY + archW / 2 + 10); ctx.stroke();

  // Windows
  ctx.fillStyle = isNight ? "#ffcc6633" : "#87ceeb88";
  if (isNight) { ctx.shadowColor = "#ffcc44"; ctx.shadowBlur = 8; }
  ctx.fillRect(cx - 22, gy2 + 18, 10, 14);
  ctx.fillRect(cx + 12,  gy2 + 18, 10, 14);
  ctx.fillRect(cx - 6,   gy2 + 38, 12, 18);
  ctx.shadowBlur = 0;

  // Flag
  const flagX = cx, flagY = gy2 - 55;
  ctx.strokeStyle = "#888"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(flagX, flagY); ctx.lineTo(flagX, flagY - 28); ctx.stroke();
  const wave = Math.sin(t * 3) * 4;
  ctx.fillStyle = isNight ? "#aa0022" : "#dd1133";
  ctx.beginPath(); ctx.moveTo(flagX, flagY - 28); ctx.lineTo(flagX + 22 + wave, flagY - 22 + wave * 0.3); ctx.lineTo(flagX + 20 + wave, flagY - 16 + wave * 0.5); ctx.lineTo(flagX, flagY - 16); ctx.closePath(); ctx.fill();

  // Night torches
  if (isNight) {
    [gx - 8, gx + gw + 8].forEach(tx => {
      const flicker = 0.7 + 0.3 * Math.sin(t * 7 + tx);
      ctx.globalAlpha = flicker; ctx.fillStyle = "#ff9933";
      ctx.shadowColor = "#ff6600"; ctx.shadowBlur = 18;
      ctx.fillRect(tx - 3, gy2 + 28, 6, 10);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    });
  }

  // Crystal on pedestal inside castle
  drawCrystal(cx, gy, hpF, t);

  // HP bar
  const barW = bw, barX = bx;
  ctx.fillStyle = "#111"; ctx.fillRect(barX, by - 28, barW, 8);
  ctx.fillStyle = `hsl(${hpF * 100}, 75%, 45%)`; ctx.fillRect(barX, by - 28, barW * hpF, 8);
  ctx.strokeStyle = "#333"; ctx.lineWidth = 1; ctx.strokeRect(barX, by - 28, barW, 8);
  ctx.fillStyle = "#aaddff"; ctx.font = "bold 10px Georgia"; ctx.textAlign = "center";
  ctx.shadowColor = "#4488ff"; ctx.shadowBlur = 6;
  ctx.fillText("💎 CRYSTAL KEEP", cx, by - 32);
  ctx.shadowBlur = 0; ctx.textAlign = "left";
}

function drawTowerMini(x, y, w, h) {
  const stone   = isNight ? "#3e3848" : "#6a6378";
  const stoneHi = isNight ? "#524e60" : "#8a8398";
  const stoneD  = isNight ? "#2e2838" : "#504860";
  ctx.fillStyle = stone; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stoneD; ctx.lineWidth = 1;
  for (let row = 0; row < 6; row++) {
    const ry = y + 4 + row * 18;
    for (let col = 0; col < 2; col++) {
      const offset = row % 2 === 0 ? 1 : -1;
      ctx.strokeRect(x + 2 + col * (w / 2) + offset, ry, w / 2 - 4, 13);
    }
  }
  ctx.fillStyle = stoneHi; ctx.fillRect(x, y, 4, h);
  ctx.fillStyle = "#0a0810"; ctx.fillRect(x + w / 2 - 3, y + h * 0.4, 6, 16); ctx.fillRect(x + w / 2 - 1, y + h * 0.35, 2, 6);
  ctx.fillStyle = stoneHi;
  const slots = 3, mw = w / (slots * 2 - 1);
  for (let i = 0; i < slots; i++) ctx.fillRect(x + i * mw * 2, y - 14, mw, 14);
  ctx.fillStyle = isNight ? "#1a0a20" : "#3a1a30";
  ctx.beginPath(); ctx.moveTo(x + w / 2, y - 28); ctx.lineTo(x - 4, y - 14); ctx.lineTo(x + w + 4, y - 14); ctx.closePath(); ctx.fill();
}

function drawMassiveWall(wx,ww,gy,wh,stone,stoneDark,stoneHi,mortar,t,addFlag){
  const cx2=wx+ww/2;
  ctx.fillStyle=stone; ctx.fillRect(wx,gy-wh,ww,wh);
  ctx.strokeStyle=mortar; ctx.lineWidth=1;
  const brickH=18,brickCols=Math.max(2,Math.floor(ww/28));
  for(let row=0;row<Math.floor(wh/brickH);row++){
    const ry=gy-wh+row*brickH+2,offset=(row%2)*(ww/brickCols/2),bw2=ww/brickCols;
    for(let bc=0;bc<brickCols+1;bc++) ctx.strokeRect(wx+bc*bw2-offset+1,ry,bw2-2,brickH-2);
  }
  ctx.fillStyle=stoneHi; ctx.fillRect(wx,gy-wh,5,wh);
  ctx.fillStyle=stone; ctx.fillRect(wx-4,gy-wh-8,ww+8,10);
  const mW=Math.max(10,ww*0.22),mGap=Math.max(8,ww*0.14),mCount=Math.floor((ww+8)/(mW+mGap));
  const mTotal=mCount*(mW+mGap)-mGap,mStart=wx-4+((ww+8)-mTotal)/2;
  ctx.fillStyle=stoneHi;
  for(let m=0;m<mCount;m++) ctx.fillRect(mStart+m*(mW+mGap),gy-wh-24,mW,18);
  const slitCount=Math.max(1,Math.floor(ww/35));
  for(let s=0;s<slitCount;s++){
    const sx=wx+(s+0.5)*(ww/slitCount)-3,sy=gy-wh*0.55;
    ctx.fillStyle="#08060e"; ctx.fillRect(sx,sy,6,20); ctx.fillRect(sx-5,sy+7,16,6);
  }
  // Gate arch
  const archW=ww*0.45,archH=70,archX=cx2-archW/2,archY=gy-archH;
  ctx.fillStyle="#0a0810";
  ctx.beginPath(); ctx.rect(archX,archY+archW*0.5,archW,archH-archW*0.5); ctx.fill();
  ctx.beginPath(); ctx.arc(cx2,archY+archW*0.5,archW/2,Math.PI,0); ctx.fill();
  ctx.strokeStyle="#1e1c28"; ctx.lineWidth=3;
  for(let b=1;b<=4;b++){ctx.beginPath();ctx.moveTo(archX+b*(archW/5),archY+archW*0.5);ctx.lineTo(archX+b*(archW/5),gy);ctx.stroke();}
  ctx.lineWidth=2;
  for(let h2=0;h2<3;h2++){ctx.beginPath();ctx.moveTo(archX+2,archY+archW*0.5+12+h2*18);ctx.lineTo(archX+archW-2,archY+archW*0.5+12+h2*18);ctx.stroke();}
  ctx.strokeStyle=stoneHi; ctx.lineWidth=3;
  ctx.beginPath(); ctx.arc(cx2,archY+archW*0.5,archW/2,Math.PI,0); ctx.stroke();
  ctx.strokeStyle=stoneHi; ctx.lineWidth=2;
  ctx.strokeRect(archX-2,archY+archW*0.5,archW+4,archH-archW*0.5);
  // Keystone
  ctx.fillStyle=stoneHi;
  ctx.beginPath();
  ctx.moveTo(cx2-6,archY+archW*0.5-archW/2-2); ctx.lineTo(cx2+6,archY+archW*0.5-archW/2-2);
  ctx.lineTo(cx2+4,archY+archW*0.5-archW/2+10); ctx.lineTo(cx2-4,archY+archW*0.5-archW/2+10);
  ctx.closePath(); ctx.fill();
  if(addFlag){
    const flagX=cx2,flagY=gy-wh-24;
    ctx.strokeStyle="#888"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(flagX,flagY); ctx.lineTo(flagX,flagY-32); ctx.stroke();
    const wv=Math.sin(t*3)*4;
    ctx.fillStyle=isNight?"#aa0022":"#dd1133";
    ctx.beginPath(); ctx.moveTo(flagX,flagY-32); ctx.lineTo(flagX+22+wv,flagY-26+wv*0.3); ctx.lineTo(flagX+20+wv,flagY-20+wv*0.5); ctx.lineTo(flagX,flagY-20); ctx.closePath(); ctx.fill();
  }
  if(isNight){
    const tfl=0.65+0.35*Math.sin(t*8+wx*0.01);
    ctx.save(); ctx.globalAlpha=tfl; ctx.fillStyle="#ff9933";
    ctx.shadowColor="#ff6600"; ctx.shadowBlur=20;
    ctx.fillRect(wx+ww-8,gy-wh*0.3,6,12); ctx.shadowBlur=0; ctx.restore();
  }
}

function drawCrystal(cx,gy,hpF,t){
  const cW=32,cH=90,cBY=gy-12,cTY=gy-12-cH;
  const gR=Math.floor(30+(1-hpF)*220),gG=Math.floor(140-(1-hpF)*120),gB=255;
  const glowCol=`rgb(${gR},${gG},${gB})`;
  const glowSize=20+10*Math.sin(t*2.2)+(1-hpF)*25;
  ctx.save();
  ctx.shadowColor=glowCol; ctx.shadowBlur=glowSize;
  ctx.beginPath();
  ctx.moveTo(cx,cTY-14); ctx.lineTo(cx+cW,cTY+18); ctx.lineTo(cx+cW*0.85,cBY-16);
  ctx.lineTo(cx+cW*0.4,cBY); ctx.lineTo(cx-cW*0.4,cBY); ctx.lineTo(cx-cW*0.85,cBY-16);
  ctx.lineTo(cx-cW,cTY+18); ctx.closePath();
  const grad=ctx.createLinearGradient(cx-cW,cTY,cx+cW,cBY);
  if(hpF>0.5){grad.addColorStop(0,`rgba(${gR},${gG},${gB},0.9)`);grad.addColorStop(0.35,"#99eeff");grad.addColorStop(0.7,"#2255cc");grad.addColorStop(1,"#0a1466");}
  else{grad.addColorStop(0,"#ff5533");grad.addColorStop(0.4,"#ff9966");grad.addColorStop(1,"#771100");}
  ctx.fillStyle=grad; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx,cTY-10); ctx.lineTo(cx+cW*0.5,cTY+22); ctx.lineTo(cx,cBY-30); ctx.lineTo(cx-cW*0.5,cTY+22); ctx.closePath();
  ctx.fillStyle="rgba(255,255,255,0.16)"; ctx.fill();
  ctx.strokeStyle=hpF>0.5?"#88ccff":"#ff8855"; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(cx,cTY-14); ctx.lineTo(cx+cW,cTY+18); ctx.lineTo(cx+cW*0.85,cBY-16);
  ctx.lineTo(cx+cW*0.4,cBY); ctx.lineTo(cx-cW*0.4,cBY); ctx.lineTo(cx-cW*0.85,cBY-16);
  ctx.lineTo(cx-cW,cTY+18); ctx.closePath(); ctx.stroke();
  if(hpF<0.5){
    ctx.strokeStyle=`rgba(255,80,40,${(0.5-hpF)*2})`; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(cx-3,cTY+30); ctx.lineTo(cx+10,cTY+55); ctx.lineTo(cx+3,cTY+72); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+5,cTY+38); ctx.lineTo(cx-12,cTY+58); ctx.stroke();
  }
  for(let i=0;i<5;i++){
    const angle=t*1.6+i*(Math.PI*2/5),rx=38+8*Math.sin(t+i),ry2=18;
    const px2=cx+Math.cos(angle)*rx,py2=cBY-cH*0.45+Math.sin(angle)*ry2;
    ctx.globalAlpha=0.4+0.6*Math.abs(Math.sin(t*2.5+i));
    ctx.beginPath(); ctx.arc(px2,py2,2,0,Math.PI*2);
    ctx.fillStyle=hpF>0.5?"#66ddff":"#ff7744"; ctx.fill();
  }
  ctx.globalAlpha=1; ctx.shadowBlur=0; ctx.restore();
  ctx.fillStyle=isNight?"#28263a":"#46445a";
  ctx.beginPath(); ctx.moveTo(cx-40,cBY+2); ctx.lineTo(cx+40,cBY+2); ctx.lineTo(cx+28,cBY+14); ctx.lineTo(cx-28,cBY+14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle=isNight?"#3e3c54":"#6a6880"; ctx.lineWidth=1; ctx.stroke();
  ctx.save(); ctx.shadowColor=glowCol; ctx.shadowBlur=8;
  ctx.strokeStyle=hpF>0.5?"#4488ff":"#ff4422"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(cx-18,cBY+7); ctx.lineTo(cx-8,cBY+3); ctx.moveTo(cx+8,cBY+3); ctx.lineTo(cx+18,cBY+7); ctx.moveTo(cx-6,cBY+10); ctx.lineTo(cx+6,cBY+10); ctx.stroke();
  ctx.restore();
}

// ── Stun overlay — called at end of each tower draw ──
function drawTowerStun(t, tx, ty, tw, th) {
  if (!t.stunUntil || Date.now() > t.stunUntil) return;
  const now   = Date.now() / 1000;
  const frac  = Math.max(0, (t.stunUntil - Date.now()) / 2000); // fade as stun expires
  ctx.save();

  // Faint woozy tint over the whole tower (soft, not a harsh flash)
  ctx.globalAlpha = 0.14 * frac;
  ctx.fillStyle   = "#cc99ff";
  ctx.fillRect(tx, ty, tw, th);
  ctx.globalAlpha = 1;

  // Dizzy stars — orbiting in a tilted ellipse above the tower
  const orbitCX = t.x;
  const orbitCY = ty - 14;
  const orbitRX = tw * 0.65;
  const orbitRY = orbitRX * 0.4;
  const starCount = 3;
  for (let i = 0; i < starCount; i++) {
    const angle = now * 3.2 + i * (Math.PI * 2 / starCount);
    const sx = orbitCX + Math.cos(angle) * orbitRX;
    const sy = orbitCY + Math.sin(angle) * orbitRY;
    // Stars at the back of the orbit (sin > 0) draw behind/dimmer; front ones pop
    const depth = (Math.sin(angle) + 1) / 2; // 0 (back) .. 1 (front)
    const scale = 0.65 + depth * 0.5;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = (0.5 + depth * 0.5) * frac;
    ctx.fillStyle = "#ffe066";
    ctx.shadowColor = "#fff3b0";
    ctx.shadowBlur = 6;
    drawTinyStar(0, 0, 5);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Small 5-point star used by the dizzy stun effect
function drawTinyStar(cx, cy, r) {
  const spikes = 5, outerR = r, innerR = r * 0.45;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerR : innerR;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * radius;
    const py = cy + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawArrowTower(t) {
  const w = 38, h = 80, tx = t.x - w / 2;
  const ty = GROUND_Y - h;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(tx + 4, ty + h - 6, w, 10);
  ctx.fillStyle = isNight ? "#504858" : "#807888";
  ctx.fillRect(tx, ty + 18, w, h - 18);
  ctx.strokeStyle = isNight ? "#403848" : "#606068"; ctx.lineWidth = 1;
  for (let r = 0; r < 4; r++) ctx.strokeRect(tx + 3, ty + 22 + r * 14, w - 6, 10);
  ctx.fillStyle = isNight ? "#3a3040" : "#6a6070";
  ctx.fillRect(tx - 4, ty, w + 8, 22);
  ctx.fillStyle = isNight ? "#4a4050" : "#7a7080";
  for (let i = 0; i < 3; i++) ctx.fillRect(tx - 2 + i * ((w+8)/3) + 1, ty - 10, (w+8)/3 - 3, 11);
  ctx.fillStyle = "#111";
  ctx.fillRect(tx + w / 2 - 3, ty + 28, 6, 14);
  // Range indicator — filled tint + dashed border
  if (selectedTower === t) {
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#c8a84b";
    ctx.beginPath(); ctx.arc(t.x, ty + 40, t.range, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "rgba(200,168,75,0.55)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(t.x, ty + 40, t.range, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
    // Level badge
  if (t.level && t.level > 1) {
    const stars = t.level === 3 ? '★★' : '★';
    ctx.font = 'bold 11px Georgia';
    ctx.fillStyle = t.level === 3 ? '#ffdd44' : '#c8a84b';
    ctx.textAlign = 'center';
    ctx.fillText(stars, t.x, ty - 2);
    ctx.textAlign = 'left';
  }
  drawTowerStun(t, tx, ty, w, 80);
}

function drawWallBuilding(b) {
  const w = 24, h = 55;
  const wx = b.x - w / 2, wy = GROUND_Y - 55;
  const hpFrac = b.health / b.maxHealth;
  // Crumble tint
  const col = hpFrac > 0.5
    ? (isNight ? "#5a5060" : "#8a8090")
    : (isNight ? "#4a3040" : "#7a6070");
  ctx.fillStyle = col;
  ctx.fillRect(wx, wy, w, h);
  ctx.strokeStyle = isNight ? "#4a4050" : "#6a6070"; ctx.lineWidth = 1;
  ctx.strokeRect(wx + 2, wy + 4, w - 4, h - 8);
  // Battlements
  ctx.fillStyle = isNight ? "#6a6070" : "#9a9090";
  for (let i = 0; i < 2; i++) ctx.fillRect(wx + i * (w/2) + 1, wy - 9, w/2 - 3, 9);
  // HP bar
  ctx.fillStyle = "#222"; ctx.fillRect(wx - 2, wy - 18, w + 4, 6);
  ctx.fillStyle = `hsl(${hpFrac * 100}, 75%, 45%)`;
  ctx.fillRect(wx - 2, wy - 18, (w + 4) * hpFrac, 6);
  // Crack lines when low HP
  if (hpFrac < 0.5) {
    ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wx + w * 0.3, wy + 8); ctx.lineTo(wx + w * 0.6, wy + 22);
    ctx.moveTo(wx + w * 0.6, wy + 22); ctx.lineTo(wx + w * 0.4, wy + 36);
    ctx.stroke();
  }
}

function drawSplashTower(t) {
  const w = 42, h = 90, tx = t.x - w / 2;
  const ty = GROUND_Y - h;
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(tx + 4, ty + h - 6, w, 10);
  // Main body – darker, reddish stone
  ctx.fillStyle = isNight ? "#4a2830" : "#7a4848";
  ctx.fillRect(tx, ty + 20, w, h - 20);
  // Stone texture
  ctx.strokeStyle = isNight ? "#3a1820" : "#5a3838"; ctx.lineWidth = 1;
  for (let r = 0; r < 4; r++) ctx.strokeRect(tx + 3, ty + 24 + r * 14, w - 6, 10);
  // Cap
  ctx.fillStyle = isNight ? "#3a1020" : "#602030";
  ctx.fillRect(tx - 4, ty, w + 8, 24);
  // Battlements
  ctx.fillStyle = isNight ? "#4a1828" : "#702838";
  for (let i = 0; i < 3; i++) ctx.fillRect(tx - 2 + i * ((w+8)/3) + 1, ty - 10, (w+8)/3 - 3, 11);
  // Glow "cauldron" at top
  const glowT = Date.now() / 400;
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(glowT);
  ctx.fillStyle   = "#ff4400";
  ctx.shadowColor = "#ff6600";
  ctx.shadowBlur  = 14;
  ctx.beginPath();
  ctx.arc(t.x, ty + 12, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur  = 0;
  ctx.globalAlpha = 1;
  // Range indicator — filled tint + dashed border
  if (selectedTower === t) {
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = "#ff6422";
    ctx.beginPath(); ctx.arc(t.x, ty + 40, t.range, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "rgba(255,100,34,0.6)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(t.x, ty + 40, t.range, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Level badge
  if (t.level && t.level > 1) {
    const stars = t.level === 3 ? '★★' : '★';
    ctx.font = 'bold 11px Georgia';
    ctx.fillStyle = t.level === 3 ? '#ffdd44' : '#ffaa44';
    ctx.textAlign = 'center';
    ctx.fillText(stars, t.x, ty - 2);
    ctx.textAlign = 'left';
  }
  drawTowerStun(t, tx, ty, w, 90);
}

function drawMageTower(t) {
    const w = 40, h = 95, tx = t.x - w / 2;
    const ty = GROUND_Y - h;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(tx + 4, ty + h - 6, w, 10);

    // Body — deep blue-purple stone
    ctx.fillStyle = isNight ? '#2a1a4a' : '#4a3070';
    ctx.fillRect(tx, ty + 18, w, h - 18);

    // Stone texture
    ctx.strokeStyle = isNight ? '#1a0a2a' : '#3a2050';
    ctx.lineWidth = 1;
    for (let r = 0; r < 4; r++) {
        ctx.strokeRect(tx + 3, ty + 22 + r * 14, w - 6, 10);
    }

    // Cap
    ctx.fillStyle = isNight ? '#1a0a30' : '#3a1858';
    ctx.fillRect(tx - 4, ty, w + 8, 22);

    // Battlements
    ctx.fillStyle = isNight ? '#2a0a40' : '#5a2888';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(tx - 2 + i * (w / 3 + 1), ty - 10, w / 3 - 3, 11);
    }

    // Glowing orb
    const orbT = Date.now() / 500;
    const orbGlow = 0.6 + 0.4 * Math.sin(orbT);
    ctx.globalAlpha = orbGlow;
    ctx.fillStyle = '#cc66ff';
    ctx.shadowColor = '#aa44ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(t.x, ty + 10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Range indicator when selected
    if (selectedTower === t) {
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#aa66ff';
        ctx.beginPath();
        ctx.arc(t.x, ty + 40, t.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = 'rgba(170,100,255,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(t.x, ty + 40, t.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Level badge
    if (t.level && t.level > 1) {
        const stars = t.level === 3 ? '★★' : '★';
        ctx.font = 'bold 11px Georgia';
        ctx.fillStyle = t.level === 3 ? '#ffdd44' : '#cc88ff';
        ctx.textAlign = 'center';
        ctx.fillText(stars, t.x, ty - 2);
        ctx.textAlign = 'left';
    }
    drawTowerStun(t, tx, ty, w, 95);
}

function drawEnemy(e) {
  const s  = e.size || 1;
  const ex = e.x - (e.width * s) / 2;
  const ew = e.width  * s;
  const eh = e.height * s;
  const ey = GROUND_Y - eh;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(ex + 4, ey + eh - 6, ew, 10);

  const bodyCol = e.attacking
    ? (e.kind === 'brute' ? '#8833cc' : '#cc2222')
    : (isNight ? e.colorNight : e.color) || (isNight ? "#6a2020" : "#8a3030");

  // Body
  ctx.fillStyle = bodyCol;
  ctx.fillRect(ex + ew * 0.2, ey + eh * 0.38, ew * 0.6, eh * 0.62);
  // Head
  ctx.fillStyle = e.kind === 'brute'
    ? (isNight ? '#4a1a6a' : '#6a2a8a')
    : bodyCol;
  ctx.fillRect(ex + ew * 0.15, ey, ew * 0.7, eh * 0.39);

  // Eyes
  ctx.fillStyle = e.kind === 'scout' ? '#ffaa00' : '#ff4444';
  const eyeW = ew * 0.18, eyeH = eh * 0.09;
  ctx.fillRect(ex + ew * 0.22, ey + eh * 0.13, eyeW, eyeH);
  ctx.fillRect(ex + ew * 0.58, ey + eh * 0.13, eyeW, eyeH);

  // Brute horns
  if (e.kind === 'brute') {
    ctx.fillStyle = '#aa5533';
    ctx.beginPath();
    ctx.moveTo(ex + ew * 0.25, ey);
    ctx.lineTo(ex + ew * 0.15, ey - eh * 0.12);
    ctx.lineTo(ex + ew * 0.35, ey);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ex + ew * 0.65, ey);
    ctx.lineTo(ex + ew * 0.85, ey - eh * 0.12);
    ctx.lineTo(ex + ew * 0.75, ey);
    ctx.fill();
  }

  // Weapon
  const d = e.direction;
  ctx.strokeStyle = e.kind === 'brute' ? '#665544' : '#885533';
  ctx.lineWidth   = e.kind === 'brute' ? 5 : 3;
  ctx.beginPath();
  ctx.moveTo(e.x + d * ew * 0.2, ey + eh * 0.42);
  ctx.lineTo(e.x + d * ew * 0.8, ey + eh * 0.14);
  ctx.stroke();
  // Spearhead
  ctx.fillStyle = "#aaaaaa";
  const tx1 = e.x + d * ew * 0.8, ty1 = ey + eh * 0.14;
  ctx.beginPath();
  ctx.moveTo(tx1, ty1);
  ctx.lineTo(tx1 - d * 5, ty1 + 10);
  ctx.lineTo(tx1 + d * 9, ty1 + 6);
  ctx.fill();

  // HP bar (only when damaged)
  if (e.health < e.maxHealth) {
    const bw = ew + 4;
    ctx.fillStyle = "#222"; ctx.fillRect(ex - 2, ey - 14, bw, 7);
    ctx.fillStyle = `hsl(${(e.health / e.maxHealth) * 100}, 80%, 45%)`;
    ctx.fillRect(ex - 2, ey - 14, bw * (e.health / e.maxHealth), 7);
  }
}

function drawRanger(e) {
  const s  = e.size || 1;
  const ew = e.width  * s;
  const eh = e.height * s;
  const ex = e.x - ew / 2;
  const ey = GROUND_Y - eh;
  const d  = e.direction;
  const t  = Date.now() / 1000;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(ex + 3, ey + eh - 5, ew, 8);

  const cloakDark = isNight ? '#0e1a2a' : '#1a2e44';
  const cloakMid  = isNight ? '#1a2d40' : '#2a4a6a';
  const cloakHi   = isNight ? '#223550' : '#366088';
  const skinCol   = '#b8946a';

  // ── Flowing cloak (lower body, wider than torso to look layered) ──
  ctx.fillStyle = cloakDark;
  ctx.beginPath();
  ctx.moveTo(ex + ew * 0.05, ey + eh * 0.42);
  ctx.lineTo(ex + ew * 0.95, ey + eh * 0.42);
  ctx.lineTo(ex + ew * 1.05, ey + eh);         // cloak flares out at base
  ctx.lineTo(ex - ew * 0.05, ey + eh);
  ctx.closePath();
  ctx.fill();

  // Cloak highlight edge
  ctx.strokeStyle = cloakHi;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(ex + ew * 0.05, ey + eh * 0.42);
  ctx.lineTo(ex - ew * 0.05, ey + eh);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ex + ew * 0.95, ey + eh * 0.42);
  ctx.lineTo(ex + ew * 1.05, ey + eh);
  ctx.stroke();

  // ── Torso / chest armour ──────────────────────────
  ctx.fillStyle = cloakMid;
  ctx.fillRect(ex + ew * 0.18, ey + eh * 0.35, ew * 0.64, eh * 0.30);
  // Leather strap across chest
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(ex + ew * 0.2,  ey + eh * 0.38);
  ctx.lineTo(ex + ew * 0.75, ey + eh * 0.55);
  ctx.stroke();

  // ── Hood (pointed top) ───────────────────────────
  ctx.fillStyle = cloakDark;
  ctx.beginPath();
  ctx.moveTo(e.x,             ey - eh * 0.04);  // hood peak
  ctx.lineTo(ex + ew * 0.08, ey + eh * 0.18);
  ctx.lineTo(ex + ew * 0.92, ey + eh * 0.18);
  ctx.closePath();
  ctx.fill();
  // Hood body (oval)
  ctx.fillStyle = cloakDark;
  ctx.beginPath();
  ctx.ellipse(e.x, ey + eh * 0.14, ew * 0.38, eh * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Face in shadow (partially hidden by hood) ────
  ctx.fillStyle = skinCol;
  ctx.fillRect(ex + ew * 0.26, ey + eh * 0.09, ew * 0.48, eh * 0.17);

  // Glowing teal eyes — signature ranger look
  const eyeGlow = 0.7 + 0.3 * Math.sin(t * 4.5);
  ctx.save();
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur  = 10 * eyeGlow;
  ctx.fillStyle   = `rgba(0,220,180,${eyeGlow})`;
  ctx.fillRect(ex + ew * 0.28, ey + eh * 0.11, ew * 0.14, eh * 0.065);
  ctx.fillRect(ex + ew * 0.56, ey + eh * 0.11, ew * 0.14, eh * 0.065);
  ctx.shadowBlur  = 0;
  ctx.restore();

  // ── BOW — held in front, perpendicular to movement ──
  const bowCX = e.x + d * ew * 0.55;
  const bowCY = ey + eh * 0.30;
  ctx.save();
  ctx.translate(bowCX, bowCY);
  // Bow stave
  ctx.strokeStyle = '#6B3F1A';
  ctx.lineWidth   = 3;
  ctx.beginPath();
  ctx.arc(0, 0, ew * 0.30, -Math.PI * 0.55, Math.PI * 0.55);
  ctx.stroke();
  // Grip wrap
  ctx.strokeStyle = '#3a2010';
  ctx.lineWidth   = 5;
  ctx.beginPath();
  ctx.moveTo(0, -ew * 0.06);
  ctx.lineTo(0,  ew * 0.06);
  ctx.stroke();
  // Bowstring
  const sx1 = Math.cos(-Math.PI * 0.55) * ew * 0.30;
  const sy1 = Math.sin(-Math.PI * 0.55) * ew * 0.30;
  const sx2 = Math.cos( Math.PI * 0.55) * ew * 0.30;
  const sy2 = Math.sin( Math.PI * 0.55) * ew * 0.30;
  ctx.strokeStyle = '#d8d4bc';
  ctx.lineWidth   = 1.2;
  ctx.beginPath();
  ctx.moveTo(sx1, sy1);
  if (e.attacking) {
    // Drawn-back string when attacking
    ctx.quadraticCurveTo(ew * 0.12, 0, sx2, sy2);
  } else {
    ctx.lineTo(sx2, sy2);
  }
  ctx.stroke();
  // Arrow nocked on string
  ctx.strokeStyle = '#a0704a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-ew * 0.24, 0); ctx.lineTo(ew * 0.16, 0); ctx.stroke();
  ctx.fillStyle = '#c8c8d8';
  ctx.beginPath(); ctx.moveTo(ew*0.16,0); ctx.lineTo(ew*0.09,-3.5); ctx.lineTo(ew*0.09,3.5); ctx.fill();
  ctx.restore();

  // ── Quiver strapped to back ───────────────────────
  const qx = e.x - d * ew * 0.42;
  const qy = ey + eh * 0.20;
  // Quiver body
  ctx.fillStyle = '#4a2a0a';
  ctx.beginPath();
  ctx.roundRect(qx - 5, qy, 10, eh * 0.32, 2);
  ctx.fill();
  ctx.strokeStyle = '#7a5020';
  ctx.lineWidth = 1;
  ctx.strokeRect(qx - 5, qy, 10, eh * 0.32);
  // Arrow shafts
  ctx.strokeStyle = '#a0704a'; ctx.lineWidth = 1;
  [-3, 0, 3].forEach(ox => {
    ctx.beginPath();
    ctx.moveTo(qx + ox, qy + 2);
    ctx.lineTo(qx + ox, qy - eh * 0.14);
    ctx.stroke();
    // Fletching
    ctx.strokeStyle = '#cc4444'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(qx + ox, qy - eh * 0.13);
    ctx.lineTo(qx + ox - 3, qy - eh * 0.08);
    ctx.stroke();
    ctx.strokeStyle = '#a0704a';
  });

  // Stun flash
  if (e.stunTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#aaffff';
    ctx.fillRect(ex, ey, ew, eh);
    ctx.globalAlpha = 1;
  }

  // HP bar
  if (e.health < e.maxHealth) {
    const bw = ew + 4;
    ctx.fillStyle = "#222"; ctx.fillRect(ex - 2, ey - 14, bw, 7);
    ctx.fillStyle = `hsl(${(e.health / e.maxHealth) * 100}, 80%, 45%)`;
    ctx.fillRect(ex - 2, ey - 14, bw * (e.health / e.maxHealth), 7);
  }
}

function drawHarpy(e) {
    const s = e.size || 1;
    const ex = e.x - (e.width * s) / 2;
    const ew = e.width * s;
    const eh = e.height * s;
    const ey = e.y; // already set to fly height by update()

    // Wing flap: oscillate between -1 and 1
    const flapAngle = Math.sin(e.wingTimer * 0.18) * 0.6;

    ctx.save();
    ctx.translate(e.x, ey + eh * 0.4);

    // Stun flash
    if (e.stunTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Left wing
    ctx.save();
    ctx.rotate(-flapAngle - 0.3);
    ctx.fillStyle = isNight ? '#7a3060' : '#b06090';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-ew * 0.85, -eh * 0.35);
    ctx.lineTo(-ew * 0.5, eh * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Right wing
    ctx.save();
    ctx.rotate(flapAngle + 0.3);
    ctx.fillStyle = isNight ? '#7a3060' : '#b06090';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ew * 0.85, -eh * 0.35);
    ctx.lineTo(ew * 0.5, eh * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = e.attacking ? '#ff4488' : (isNight ? '#7a3060' : '#b06090');
    ctx.fillRect(-ew * 0.22, -eh * 0.25, ew * 0.44, eh * 0.55);

    // Head
    ctx.fillStyle = isNight ? '#8a3a70' : '#c870a0';
    ctx.beginPath();
    ctx.arc(0, -eh * 0.28, ew * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffdd00';
    ctx.fillRect(-ew * 0.12, -eh * 0.32, ew * 0.08, ew * 0.08);
    ctx.fillRect(ew * 0.04, -eh * 0.32, ew * 0.08, ew * 0.08);

    // Stun spark overlay
    if (e.stunTimer > 0) {
        ctx.strokeStyle = '#ffff44';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 8;
        for (let i = 0; i < 3; i++) {
            const sx = (Math.random() - 0.5) * ew * 0.6;
            const sy = (Math.random() - 0.5) * eh * 0.5;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + (Math.random() - 0.5) * 10, sy + (Math.random() - 0.5) * 10);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    // HP bar (only when damaged)
    if (e.health < e.maxHealth) {
        const bw = ew + 4;
        ctx.fillStyle = '#222';
        ctx.fillRect(ex - 2, ey - 14, bw, 7);
        ctx.fillStyle = `hsl(${(e.health / e.maxHealth) * 100}, 80%, 45%)`;
        ctx.fillRect(ex - 2, ey - 14, bw * (e.health / e.maxHealth), 7);
    }
}

function drawPlayer() {
  const px = player.x, py = player.y, f = player.facing;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(px - 16, py + player.height - 6, 32, 10);
  ctx.fillStyle = isNight ? "#3a2a5a" : "#4a3a6a";
  ctx.fillRect(px - 13, py + 28, 26, player.height - 28);
  ctx.fillStyle = isNight ? "#2a1a4a" : "#3a2a5a";
  ctx.fillRect(px - 10, py + 2, 20, 28);
  ctx.beginPath(); ctx.arc(px, py + 10, 12, Math.PI, 0); ctx.fill();
  ctx.fillStyle = "#c8a878"; ctx.fillRect(px - 6, py + 12, 12, 14);
  ctx.fillStyle = "#ffe088";
  ctx.fillRect(px + f - 4, py + 16, 4, 4);
  ctx.fillRect(px + f + 1, py + 16, 4, 4);
  ctx.strokeStyle = "#c8c8d8"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(px + f * 10, py + 35); ctx.lineTo(px + f * 28, py + 18); ctx.stroke();
  ctx.strokeStyle = "#c8a84b"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(px + f * 18, py + 28); ctx.lineTo(px + f * 12, py + 22); ctx.stroke();
  ctx.strokeStyle = "#8a6030"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(px + f * 8, py + 38); ctx.lineTo(px + f * 14, py + 30); ctx.stroke();
}

// ═══════════════════════════════════════════════════
//  GAME LOOP
// ═══════════════════════════════════════════════════
function menuLoop() {
  if (!menuAnimating) return;

  // Fake time progression for menu background
  time += 1 / (20 * 60);
  if (time >= 1) {
    time = 0;
    isNight = !isNight;
  }

  // Smooth camera pan across world
  camera.x += 0.2;
  if (camera.x > WORLD_WIDTH - canvas.width) {
    camera.x = 0;
  }

  drawMenuBackground(); // ONLY draw, no update()

  requestAnimationFrame(menuLoop);
}

function gameLoop() {
  if (!gameRunning) return;
  if (!gamePaused) {
    update();
    draw();
  }
  requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════
//  RESET
// ═══════════════════════════════════════════════════
function resetGame() {
  gameRunning    = false;
  gamePaused     = false;
  enemies        = [];
  buildings      = [];
  particles      = [];
  projectiles      = [];
  enemyProjectiles = [];
  splashRings      = [];
  stuckArrows    = [];
  groundCraters  = [];
  floatingNums   = [];
  money          = 10;
  time           = 0;
  isNight        = false;
  spawnTimer     = 0;
  dayCount       = 1;
  totalKills     = 0;
  buildCooldown  = 0;
  wallUnlocked   = false;
  splashUnlocked = false;
  mageUnlocked   = false;
  selectedSlot   = 0;
  shakeFrames    = 0;
  shakeMag       = 0;
  waveNumber     = 0;
  waveActive     = false;
  waveAnnounce   = 0;
  killStreak     = 0;
  killStreakTimer = 0;
  boss           = null;
  bossState      = 'none';
  bossTimer      = 0;
  bossDefeated   = false;
  endlessMode    = false;
  endlessCycle   = 0;
  inBossFight    = false;
  corruption     = 0;
  bossDropTimer  = 0;
  bossSmashTimer = 0;
  bossGlitchTimer = 0;
  bossTelegraph  = null;
  dropTelegraphs = [];
  glitchBands    = [];
  canvas.style.filter = '';

  initPositions();
  base.health = base.maxHealth = 100;
  player.x    = WORLD_WIDTH / 2;
  camera.x    = player.x - canvas.width / 2;

  gameOverScreen.style.display = "none";
  victoryScreen.style.display  = "none";
  canvas.style.display         = "block";
  hud.style.display            = "flex";
  dayLabel.style.display       = "block";
  pauseBtn.style.display       = "flex";
  document.getElementById('rightUI').style.display = "block";
  techModal.classList.remove('open');
  renderBuildBar();
  document.getElementById('skipNightBtn').style.display = 'block';
  startMusic();
  gameRunning = true;
  gameLoop();
}
loadKeybinds();
initPositions();
menuLoop();
