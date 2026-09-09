/* ===================================================
   URZIKSTAN — Dictator & Regime Simulator Core
   =================================================== */

const INITIAL_STATE = {
  treasury: 100000000, // $100M
  oilLevel: 1,
  nukeProgress: 0,
  coupThreat: 0,
  
  // Faction Loyalty Bars (0-100)
  loyaltyMilitary: 70,
  loyaltyPeople: 50,
  loyaltyReligion: 40,
  
  lastUpdate: Date.now()
};

let game = JSON.parse(JSON.stringify(INITIAL_STATE));

function formatMoney(val) {
  if (val >= 1e9) return "$" + (val / 1e9).toFixed(2) + "B";
  if (val >= 1e6) return "$" + (val / 1e6).toFixed(0) + "M";
  return "$" + Math.floor(val).toLocaleString();
}

function showToast(msg) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// --- Main Game Engine ---
function gameLoop() {
  const now = Date.now();
  const elapsed = (now - game.lastUpdate) / 1000;
  game.lastUpdate = now;

  // Passive Income dari Minyak
  const oilIncome = game.oilLevel * 10000000; // $10M per level
  game.treasury += oilIncome * elapsed;

  // Hitung Ancaman Kudeta berdasarkan Loyalitas Rendah
  let threatGain = 0;
  if (game.loyaltyMilitary < 40) threatGain += 2;
  if (game.loyaltyPeople < 30) threatGain += 3;
  if (game.loyaltyReligion < 20) threatGain += 1;

  game.coupThreat += threatGain * elapsed;
  if (game.coupThreat > 100) game.coupThreat = 100;

  // Check Game Over
  if (game.coupThreat >= 100) {
    triggerGameOver("REVOLUSI & KUDETA! Militer dan Rakyat merebut Istana.");
    return;
  }

  updateUI();
}

function triggerGameOver(reason) {
  document.getElementById("go-reason").innerText = reason;
  document.getElementById("gameover-modal").classList.remove("hidden");
}

function resetGame() {
  localStorage.removeItem("URZIKSTAN_SAVE");
  game = JSON.parse(JSON.stringify(INITIAL_STATE));
  document.getElementById("gameover-modal").classList.add("hidden");
  updateUI();
}

// --- Dictator Actions ---
function upgradeOil() {
  const cost = game.oilLevel * 50000000;
  if (game.treasury >= cost) {
    game.treasury -= cost;
    game.oilLevel += 1;
    showToast("🛢️ Sumur minyak berhasil diperluas!");
  } else {
    showToast("❌ Kas negara tidak cukup!");
  }
}

function issueDecree(type) {
  if (type === 'media' && game.treasury >= 20000000) {
    game.treasury -= 20000000;
    game.loyaltyMilitary = Math.min(100, game.loyaltyMilitary + 10);
    game.loyaltyPeople = Math.max(0, game.loyaltyPeople - 15);
    showToast("📜 Sensor total media diberlakukan.");
  } else if (type === 'subsidy' && game.treasury >= 30000000) {
    game.treasury -= 30000000;
    game.loyaltyPeople = Math.min(100, game.loyaltyPeople + 20);
    showToast("🍞 Subsidi minyak dibagikan ke rakyat.");
  } else if (type === 'purge' && game.treasury >= 50000000) {
    game.treasury -= 50000000;
    game.coupThreat = Math.max(0, game.coupThreat - 30);
    game.loyaltyMilitary = Math.max(0, game.loyaltyMilitary - 20);
    showToast("⚔️ Jenderal rival berhasil dieksekusi!");
  } else {
    showToast("❌ Dana tidak mencukupi!");
  }
}

function developNuke() {
  if (game.treasury >= 100000000) {
    game.treasury -= 100000000;
    game.nukeProgress += 20;
    if (game.nukeProgress >= 100) {
      game.nukeProgress = 100;
      showToast("☢️ URZIKSTAN RESMI MENJADI NEGARA NUKLIR!");
    } else {
      showToast("☢️ Program nuklir berprogres +20%");
    }
  } else {
    showToast("❌ Butuh $100M untuk riset nuklir!");
  }
}

function bribeCIA() {
  if (game.treasury >= 40000000) {
    game.treasury -= 40000000;
    game.coupThreat = Math.max(0, game.coupThreat - 15);
    showToast("🕵️ Agen asing berhasil disuap.");
  } else {
    showToast("❌ Dana suap kurang!");
  }
}

function sellBlackOil() {
  game.treasury += 15000000;
  game.loyaltyPeople = Math.max(0, game.loyaltyPeople - 5);
  showToast("💰 Pasokan minyak gelap dijual ke pasar gelap.");
}

// --- UI Engine & Navigation ---
function updateUI() {
  document.getElementById("top-treasury").innerText = formatMoney(game.treasury);
  document.getElementById("top-oil").innerText = `${game.oilLevel * 10}k bbl/d`;
  document.getElementById("top-threat").innerText = `${Math.floor(game.coupThreat)}%`;

  document.getElementById("bar-military").style.width = `${game.loyaltyMilitary}%`;
  document.getElementById("text-military").innerText = `${game.loyaltyMilitary}% Loyalitas`;

  document.getElementById("bar-people").style.width = `${game.loyaltyPeople}%`;
  document.getElementById("text-people").innerText = `${game.loyaltyPeople}% Dukungan`;

  document.getElementById("bar-religion").style.width = `${game.loyaltyReligion}%`;
  document.getElementById("text-religion").innerText = `${game.loyaltyReligion}% Pengaruh`;

  document.getElementById("oil-lvl").innerText = game.oilLevel;
  document.getElementById("bar-nuke").style.width = `${game.nukeProgress}%`;
  document.getElementById("nuke-status").innerText = `Progress Senjata Nuklir: ${game.nukeProgress}%`;
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-links li, .nav-item").forEach(el => el.classList.remove("active"));

  document.getElementById(`tab-${tabId}`).classList.add("active");
}

window.onload = () => {
  setInterval(gameLoop, 1000);
  updateUI();
};
