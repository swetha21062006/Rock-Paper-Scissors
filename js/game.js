/**
 * CLASH!  ·  Rock Paper Scissors  ·  Task 2
 * Concepts: randomness, decision-making logic, DOM events
 */

"use strict";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */
const MOVES = ['rock', 'paper', 'scissors'];

const EMOJI = {
  rock:     '🪨',
  paper:    '📄',
  scissors: '✂️',
  idle_you: '🤜',
  idle_cpu: '🤛',
};

/** Decision table: BEATS[a][b] → true if a beats b */
const BEATS = {
  rock:     { scissors: true,  paper: false, rock: false },
  paper:    { rock:     true,  scissors: false, paper: false },
  scissors: { paper:    true,  rock: false, scissors: false },
};

const RESULTS = {
  win:  { label: '🏆  YOU WIN!',    cls: 'win',  icon: '✦', clashIcon: '💥' },
  lose: { label: '💀  CPU WINS!',   cls: 'lose', icon: '☠', clashIcon: '🔥' },
  tie:  { label: '🤝  IT\'S A TIE', cls: 'tie',  icon: '=', clashIcon: '⚡' },
};

/* ═══════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════ */
const state = {
  scoreYou: 0,
  scoreCpu: 0,
  ties:     0,
  round:    1,
  busy:     false,
  bestOf:   false,       // best-of-5 mode
  target:   3,           // wins needed in best-of-5
  history:  [],
};

/* ═══════════════════════════════════════════════
   DOM REFS
   ═══════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const moveBtns     = document.querySelectorAll('.move-btn');
const playerEmoji  = $('playerEmoji');
const cpuEmoji     = $('cpuEmoji');
const playerHand   = $('playerHand');
const cpuHand      = $('cpuHand');
const clashRing    = $('clashRing');
const clashIcon    = $('clashIcon');
const resultBanner = $('resultBanner');
const resultIcon   = $('resultIcon');
const resultText   = $('resultText');
const scoreYouEl   = $('scoreYou');
const scoreCpuEl   = $('scoreCpu');
const roundBadge   = $('roundBadge');
const historyStrip = $('historyStrip');
const pickerCue    = $('pickerCue');
const resetBtn     = $('resetBtn');
const first5Btn    = $('first5Btn');
const overlay      = $('overlay');
const playAgainBtn = $('playAgainBtn');

/* ═══════════════════════════════════════════════
   MOVE BUTTONS
   ═══════════════════════════════════════════════ */
moveBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.busy) return;
    const playerMove = btn.dataset.move;
    moveBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    playRound(playerMove);
  });
});

/* ═══════════════════════════════════════════════
   CORE GAME LOOP
   ═══════════════════════════════════════════════ */
function playRound(playerMove) {
  state.busy = true;
  lockButtons(true);
  hideResult();

  // Shake countdown animation
  pickerCue.textContent = 'Rock… Paper… Scissors…';
  playerEmoji.textContent = '✊';
  cpuEmoji.textContent    = '✊';
  playerHand.classList.add('shaking');
  cpuHand.classList.add('shaking');
  clashRing.className = 'clash-ring';
  clashIcon.textContent = '…';

  // ── After 1s shake → REVEAL ──
  setTimeout(() => {
    playerHand.classList.remove('shaking');
    cpuHand.classList.remove('shaking');

    // CPU picks randomly — core randomness concept
    const cpuMove = cpuPick();

    // Reveal emojis
    revealEmoji(playerEmoji, EMOJI[playerMove]);
    revealEmoji(cpuEmoji,    EMOJI[cpuMove]);

    // ── Determine winner — decision logic ──
    const outcome = judge(playerMove, cpuMove);

    // Update clash ring
    setTimeout(() => {
      showClash(outcome);
      showResult(outcome, playerMove, cpuMove);
      updateScore(outcome);
      addHistory(outcome, playerMove, cpuMove);
      state.round++;
      roundBadge.textContent = `RD ${state.round}`;

      // Check best-of-5 end condition
      if (state.bestOf) {
        if (state.scoreYou >= state.target) endBestOf('win');
        else if (state.scoreCpu >= state.target) endBestOf('lose');
        else if (state.scoreYou + state.scoreCpu + state.ties >= 5) endBestOf('tie');
      }

      state.busy = false;
      lockButtons(false);
      pickerCue.textContent = 'Choose your weapon';
    }, 400);

  }, 1050);
}

/* ═══════════════════════════════════════════════
   CPU RANDOM PICK
   ═══════════════════════════════════════════════ */
function cpuPick() {
  // Math.random() → randomness concept
  const idx = Math.floor(Math.random() * MOVES.length);
  return MOVES[idx];
}

/* ═══════════════════════════════════════════════
   JUDGE — decision-making logic
   ═══════════════════════════════════════════════ */
function judge(player, cpu) {
  if (player === cpu)           return 'tie';
  if (BEATS[player][cpu])       return 'win';
  return 'lose';
}

/* ═══════════════════════════════════════════════
   REVEAL EMOJI (animated)
   ═══════════════════════════════════════════════ */
function revealEmoji(el, emoji) {
  el.textContent = emoji;
  el.classList.remove('reveal-hand');
  void el.offsetWidth;
  el.classList.add('reveal-hand');
}

/* ═══════════════════════════════════════════════
   CLASH RING
   ═══════════════════════════════════════════════ */
function showClash(outcome) {
  clashRing.className = 'clash-ring ' + outcome;
  clashIcon.textContent = RESULTS[outcome].clashIcon;
}

/* ═══════════════════════════════════════════════
   RESULT BANNER
   ═══════════════════════════════════════════════ */
function showResult(outcome, playerMove, cpuMove) {
  const r = RESULTS[outcome];
  resultBanner.className = `result-banner ${r.cls}`;
  resultIcon.textContent = r.icon;

  const moveLabels = { rock: 'Rock', paper: 'Paper', scissors: 'Scissors' };
  const ruleText = {
    win:  `${moveLabels[playerMove]} beats ${moveLabels[cpuMove]}`,
    lose: `${moveLabels[cpuMove]} beats ${moveLabels[playerMove]}`,
    tie:  `Both chose ${moveLabels[playerMove]}`,
  };
  resultText.textContent = `${r.label}  ·  ${ruleText[outcome]}`;
}
function hideResult() {
  resultBanner.className = 'result-banner hidden';
}

/* ═══════════════════════════════════════════════
   SCORE
   ═══════════════════════════════════════════════ */
function updateScore(outcome) {
  if (outcome === 'win')  { state.scoreYou++; animatePop(scoreYouEl); }
  if (outcome === 'lose') { state.scoreCpu++; animatePop(scoreCpuEl); }
  if (outcome === 'tie')  { state.ties++; }
  scoreYouEl.textContent = state.scoreYou;
  scoreCpuEl.textContent = state.scoreCpu;
}
function animatePop(el) {
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
  el.addEventListener('transitionend', () => el.classList.remove('pop'), { once: true });
}

/* ═══════════════════════════════════════════════
   HISTORY STRIP
   ═══════════════════════════════════════════════ */
function addHistory(outcome, playerMove, cpuMove) {
  state.history.push({ outcome, playerMove, cpuMove });
  const chip = document.createElement('div');
  chip.className = `hist-chip ${outcome}`;
  const symbols = { win: '✦', lose: '✕', tie: '=' };
  chip.innerHTML = `${EMOJI[playerMove]} ${symbols[outcome]} ${EMOJI[cpuMove]}`;
  historyStrip.appendChild(chip);

  // Keep max 12 chips visible
  const chips = historyStrip.querySelectorAll('.hist-chip');
  if (chips.length > 12) chips[0].remove();
}

/* ═══════════════════════════════════════════════
   BEST OF 5 MODE
   ═══════════════════════════════════════════════ */
first5Btn.addEventListener('click', () => {
  state.bestOf = !state.bestOf;
  first5Btn.classList.toggle('active-mode', state.bestOf);
  first5Btn.textContent = state.bestOf ? '🏅 Best of 5 ON' : '🏅 Best of 5';
  resetGame();
});

function endBestOf(finalOutcome) {
  setTimeout(() => {
    const messages = {
      win:  ['🏆 CHAMPION!',    'You conquered the Best of 5!'],
      lose: ['💀 DEFEATED!',   'CPU took the Best of 5.'],
      tie:  ['🤝 STALEMATE!',  'Perfectly matched — no winner!'],
    };
    const [title, sub] = messages[finalOutcome];
    $('overlayEmoji').textContent  = finalOutcome === 'win' ? '🏆' : finalOutcome === 'lose' ? '💀' : '🤝';
    $('overlayTitle').textContent  = title;
    $('overlayTitle').className    = `overlay__title ${finalOutcome}`;
    $('overlaySub').textContent    = sub;
    $('oYou').textContent  = state.scoreYou;
    $('oCpu').textContent  = state.scoreCpu;
    $('oTies').textContent = state.ties;
    overlay.classList.remove('hidden');
    state.busy = true;
    lockButtons(true);
  }, 900);
}

playAgainBtn.addEventListener('click', () => {
  overlay.classList.add('hidden');
  resetGame();
});

/* ═══════════════════════════════════════════════
   RESET
   ═══════════════════════════════════════════════ */
resetBtn.addEventListener('click', resetGame);

function resetGame() {
  state.scoreYou = 0;
  state.scoreCpu = 0;
  state.ties     = 0;
  state.round    = 1;
  state.busy     = false;
  state.history  = [];

  scoreYouEl.textContent = '0';
  scoreCpuEl.textContent = '0';
  roundBadge.textContent = 'RD 1';
  historyStrip.innerHTML = '';
  hideResult();
  playerEmoji.textContent = EMOJI.idle_you;
  cpuEmoji.textContent    = EMOJI.idle_cpu;
  clashRing.className     = 'clash-ring';
  clashIcon.textContent   = '⚡';
  pickerCue.textContent   = 'Choose your weapon';
  moveBtns.forEach(b => b.classList.remove('selected'));
  lockButtons(false);
}

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */
function lockButtons(lock) {
  moveBtns.forEach(b => b.disabled = lock);
}

/* ── Keyboard support ── */
document.addEventListener('keydown', e => {
  if (state.busy) return;
  const map = { r: 'rock', p: 'paper', s: 'scissors',
                '1': 'rock', '2': 'paper', '3': 'scissors' };
  const move = map[e.key.toLowerCase()];
  if (move) {
    moveBtns.forEach(b => b.classList.remove('selected'));
    document.querySelector(`.move-btn[data-move="${move}"]`)?.classList.add('selected');
    playRound(move);
  }
});
