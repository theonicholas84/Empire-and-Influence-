/* ===================================================
   URZIKSTAN — State Manager Engine (FM & Victoria Style)
   =================================================== */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

// --- 1. DATA BANGUNAN ---
const BUILDINGS = {
  bank: {
    name: "Bank Nasional Urzikstan",
    icon: "🏦",
    desc: "Menghasilkan pendapatan pasif dari bunga kas negara.",
    category: "Ekonomi",
    level: 0,
    maxLevel: 10,
    baseCost: 30000000,     // $30M
    costMultiplier: 1.5,
    baseIncome: 500000,      // +$0.5M/dtk
    incomeMultiplier: 0.45
  },
  factory: {
    name: "Kompleks Industri Militer",
    icon: "🏭",
    desc: "Memproduksi alutsista & meningkatkan loyalitas militer.",
    category: "Produksi",
    level: 0,
    maxLevel: 10,
    baseCost: 40000000,     // $40M
    costMultiplier: 1.4,
    baseIncome: 300000,      // +$0.3M/dtk
    incomeMultiplier: 0.40
  },
  palace: {
    name: "Istana Kepresidenan Megah",
    icon: "🏰",
    desc: "Meningkatkan Kultus Individu secara signifikan.",
    category: "Buff",
    level: 0,
    maxLevel: 10,
    baseCost: 50000000,     // $50M
    costMultiplier: 1.6,
    baseIncome: 200000,      // +$0.2M/dtk
    incomeMultiplier: 0.35
  }
};

// --- 2. DATA EVENT DUNIA BERBASIS TANGGAL ---
const WORLD_EVENTS = [
  {
    month: 4, // MEI (Index 4)
    day: 1,
    name: "Hari Buruh Internasional",
    desc: "Gelombang aksi buruh menuntut subsidi pangan tambahan.",
    type: "PEOPLE_DISCONTENT",
    applied: false
  },
  {
    month: 7, // AGUSTUS (Index 7)
    day: 15,
    name: "KTT Non-Blok",
    desc: "Kesempatan diplomasi global! Sanksi PBB diringankan.",
    type: "SANCTION_DROP",
    applied: false
  },
  {
    month: 11, // DESEMBER (Index 11)
    day: 25,
    name: "Lonjakan Harga Minyak Dunia",
    desc: "Permintaan energi global meroket tajam di musim dingin!",
    type: "OIL_BOOM",
    applied: false
  }
];

const INITIAL_STATE = {
  day: 1,
  monthIndex: 0,
  year: 1960,
  
  treasury: 100000000,
  oilLevel: 1,
  nukeProgress: 0,
  coupThreat: 0,
  unSanctions: 0,
  
  cultOfPersonality: 10,
  loyaltyMilitary: 70,
  loyaltyPeople: 50,
  
  relUSA: 50,
  relUSSR: 50,

  buildings: JSON.parse(JSON.stringify(BUILDINGS)),
  activeWorldEvent: null,
  activeWorldEventTicks: 0,

  activeEvent: null,
  lastUpdate: Date.now(),
  lastEventCheck: Date.now()
};

let game = JSON.parse(JSON.stringify(INITIAL_STATE));

function formatMoney(val) {
  if (val >= 1e9) return "$" + (val / 1e9).toFixed(2) + "B";
  if (val >= 1e6) return "$" + (val / 1e6).toFixed(1) + "M";
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

// --- Helper Rumus Matematika Bangunan ---
function getBuildingCost(b) {
  return Math.floor(b.baseCost * Math.pow(b.costMultiplier, b.level));
}

function getBuildingIncome(b) {
  if (b.level === 0) return 0;
  return b.baseIncome * (1 + (b.level - 1) * b.incomeMultiplier);
}

function getTotalBuildingIncomePerSec() {
  let total = 0;
  for (let key in game.buildings) {
    total += getBuildingIncome(game.buildings[key]);
  }
  return total;
}

// --- Main Engine ---
function gameLoop() {
  const now = Date.now();
  const elapsed = (now - game.lastUpdate) / 1000;
  game.lastUpdate = now;

  // Kalender Style FM (1 dtk = 3 hari)
  const prevMonth = game.monthIndex;
  game.day += elapsed * 3;
  if (game.day >= 30) {
    game.day = 1;
    game.monthIndex++;
    if (game.monthIndex >= 12) {
      game.monthIndex = 0;
      game.year++;
      // Reset event tahunan
      WORLD_EVENTS.forEach(ev => ev.applied = false);
    }
  }

  // --- Cek Trigger Event Dunia Berbasis Tanggal ---
  checkWorldEvents();

  // Multiplier Ekonomi dari Event Dunia
  let eventOilMultiplier = 1.0;
  if (game.activeWorldEvent && game.activeWorldEvent.type === "OIL_BOOM") {
    eventOilMultiplier = 2.0; // Hasil minyak 2x lipat saat Oil Boom
  }

  // Finansial & Minyak
  let oilIncome = game.oilLevel * 10000000 * eventOilMultiplier;
  if (game.unSanctions >= 100) {
    oilIncome = 0;
  } else {
    oilIncome *= (1 - (game.unSanctions / 100));
  }

  // Pendapatan Pasif dari Bangunan
  const buildingIncome = getTotalBuildingIncomePerSec();

  // Total Tambahan Kas
  game.treasury += (oilIncome + buildingIncome) * elapsed;

  // Akumulasi Kudeta & Effect Bangunan
  let threatGain = 0;
  if (game.loyaltyMilitary < 40) threatGain += 2.0;
  if (game.loyaltyPeople < 30) threatGain += 3.0;
  
  // Buff dari Istana Kepresidenan
  const palaceLvl = game.buildings.palace.level;
  const cultBonus = game.cultOfPersonality + (palaceLvl * 5);
  
  threatGain -= (cultBonus * 0.02);
  if (threatGain < 0) threatGain = 0;

  game.coupThreat += threatGain * elapsed;

  // Random Events Insiden
  if (now - game.lastEventCheck > 25000 && !game.activeEvent) {
    game.lastEventCheck = now;
    if (Math.random() < 0.5) triggerRandomEvent();
  }

  // Check Game Over
  if (game.coupThreat >= 100) {
    triggerGameOver("REVOLUSI TOTAL! Militer dan kelompok oposisi merebut Istana.");
    return;
  }

  updateUI();
}

// --- Logic Event Dunia Berbasis Tanggal ---
function checkWorldEvents() {
  const currentDay = Math.floor(game.day);
  
  WORLD_EVENTS.forEach(ev => {
    if (!ev.applied && game.monthIndex === ev.month && currentDay >= ev.day) {
      ev.applied = true;
      triggerWorldEvent(ev);
    }
  });

  // Durasi Event Dunia aktif selama 15 hari game
  if (game.activeWorldEvent) {
    game.activeWorldEventTicks += 1;
    if (game.activeWorldEventTicks > 5) { // Selesai dalam ~5 siklus update
      showToast(`📢 Event Selesai: ${game.activeWorldEvent.name}`);
      game.activeWorldEvent = null;
    }
  }
}

function triggerWorldEvent(ev) {
  game.activeWorldEvent = ev;
  game.activeWorldEventTicks = 0;
  showToast(`🌍 EVENT DUNIA: ${ev.name}!`);

  if (ev.type === "PEOPLE_DISCONTENT") {
    game.loyaltyPeople = Math.max(0, game.loyaltyPeople - 10);
  } else if (ev.type === "SANCTION_DROP") {
    game.unSanctions = Math.max(0, game.unSanctions - 15);
  }
}

// --- Random Incident Events ---
const EVENTS = [
  {
    title: "⚠️ PEMBERONTAKAN MILISI AL-QATALA!",
    desc: "Kelompok milisi merebut ladang minyak Al-Zubair.",
    b1: "Kirim Pasukan Khusus ($20M)",
    b2: "Bayar Tebusan ($50M)",
    b3: "Abaikan Dulu",
    r1: () => {
      if (game.treasury >= 20000000) {
        game.treasury -= 20000000;
        game.loyaltyMilitary = Math.min(100, game.loyaltyMilitary + 5);
        showToast("⚔️ Milisi ditumpas.");
      } else { showToast("❌ Dana tidak cukup!"); game.coupThreat += 15; }
    },
    r2: () => {
      if (game.treasury >= 50000000) {
        game.treasury -= 50000000;
        showToast("💰 Tebusan terbayar.");
      } else { showToast("❌ Dana tidak cukup!"); game.coupThreat += 15; }
    },
    r3: () => {
      game.coupThreat += 20;
      game.loyaltyPeople = Math.max(0, game.loyaltyPeople - 15);
      showToast("💥 Ladang minyak meledak!");
    }
  }
];

function triggerRandomEvent() {
  const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  game.activeEvent = ev;
  document.getElementById("ev-title").innerText = ev.title;
  document.getElementById("ev-desc").innerText = ev.desc;
  document.getElementById("ev-btn1").innerText = ev.b1;
  document.getElementById("ev-btn2").innerText = ev.b2;
  document.getElementById("ev-btn3").innerText = ev.b3;
  document.getElementById("event-modal").classList.remove("hidden");
}

function resolveEvent(opt) {
  if (!game.activeEvent) return;
  if (opt === 1) game.activeEvent.r1();
  if (opt === 2) game.activeEvent.r2();
  if (opt === 3) game.activeEvent.r3();
  game.activeEvent = null;
  document.getElementById("event-modal").classList.add("hidden");
}

// --- Aksi Upgrade Bangunan ---
function buyBuildingUpgrade(key) {
  const b = game.buildings[key];
  if (b.level >= b.maxLevel) {
    showToast("⚠️ Bangunan sudah mencapai Level Maksimum!");
    return;
  }
  
  const cost = getBuildingCost(b);
  if (game.treasury >= cost) {
    game.treasury -= cost;
    b.level++;
    
    // Perbaikan langsung ke statistik
    if (key === "factory") game.loyaltyMilitary = Math.min(100, game.loyaltyMilitary + 5);
    if (key === "palace") game.cultOfPersonality = Math.min(100, game.cultOfPersonality + 10);

    showToast(`🏗️ ${b.name} naik ke Level ${b.level}!`);
    renderBuildingsUI();
  } else {
    showToast("❌ Dana negara tidak mencukupi!");
  }
}

// --- Render Dinamis Tab Bangunan ---
function renderBuildingsUI() {
  const container = document.getElementById("building-list-container");
  if (!container) return;

  container.innerHTML = "";

  for (let key in game.buildings) {
    const b = game.buildings[key];
    const cost = getBuildingCost(b);
    const currentIncome = getBuildingIncome(b);
    const isMax = b.level >= b.maxLevel;

    const card = document.createElement("div");
    card.className = "fm-card";
    card.innerHTML = `
      <h4>${b.icon} ${b.name}</h4>
      <p class="text-muted">${b.desc}</p>
      <div class="stat-row mt-2">
        <span>Level:</span>
        <span class="text-primary">${b.level} / ${b.maxLevel}</span>
      </div>
      <div class="stat-row">
        <span>Pasif Income:</span>
        <span class="text-success">+${formatMoney(currentIncome)}/dtk</span>
      </div>
      <button class="btn btn-primary btn-block mt-2" ${isMax ? "disabled" : ""} onclick="buyBuildingUpgrade('${key}')">
        ${isMax ? "LEVEL MAX" : `Upgrade Level (${formatMoney(cost)})`}
      </button>
    `;
    container.appendChild(card);
  }
}

// --- Action Binding Event Listeners ---
function initEventListeners() {
  // Tab Switchers
  document.querySelectorAll(".fm-nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".fm-nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
      
      e.target.classList.add("active");
      const tabId = e.target.getAttribute("data-tab");
      document.getElementById(`tab-${tabId}`).classList.add("active");
    });
  });

  // Actions
  document.getElementById("btn-upgrade-oil").onclick = () => {
    if (game.treasury >= 50000000) {
      game.treasury -= 50000000;
      game.oilLevel++;
      showToast("🛢️ Kilang di-upgrade!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-statue").onclick = () => {
    if (game.treasury >= 80000000) {
      game.treasury -= 80000000;
      game.cultOfPersonality = Math.min(100, game.cultOfPersonality + 25);
      showToast("🗿 Patung emas berdiri!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-education").onclick = () => {
    if (game.treasury >= 50000000) {
      game.treasury -= 50000000;
      game.cultOfPersonality = Math.min(100, game.cultOfPersonality + 15);
      showToast("📚 Doktrin pendidikan diterapkan!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-decree-media").onclick = () => {
    if (game.treasury >= 20000000) {
      game.treasury -= 20000000;
      game.loyaltyMilitary = Math.min(100, game.loyaltyMilitary + 10);
      game.loyaltyPeople = Math.max(0, game.loyaltyPeople - 15);
      game.unSanctions = Math.min(100, game.unSanctions + 10);
      showToast("📜 Sensor pers berlaku!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-decree-subsidy").onclick = () => {
    if (game.treasury >= 30000000) {
      game.treasury -= 30000000;
      game.loyaltyPeople = Math.min(100, game.loyaltyPeople + 20);
      showToast("🍞 Subsidi pangan dibagikan!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-decree-purge").onclick = () => {
    if (game.treasury >= 50000000) {
      game.treasury -= 50000000;
      game.coupThreat = Math.max(0, game.coupThreat - 30);
      game.loyaltyMilitary = Math.max(0, game.loyaltyMilitary - 20);
      showToast("⚔️ Pembersihan internal dilakukan!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-bribe-un").onclick = () => {
    if (game.treasury >= 60000000) {
      game.treasury -= 60000000;
      game.unSanctions = Math.max(0, game.unSanctions - 20);
      showToast("🤝 Diplomat PBB disuap!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-align-usa").onclick = () => {
    if (game.treasury >= 40000000) {
      game.treasury -= 40000000;
      game.relUSA = Math.min(100, game.relUSA + 25);
      showToast("🇺🇸 Aliansi AS diperkuat.");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-align-ussr").onclick = () => {
    if (game.treasury >= 40000000) {
      game.treasury -= 40000000;
      game.relUSSR = Math.min(100, game.relUSSR + 25);
      showToast("🛠️ Bantuan senjata Soviet mendarat.");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-develop-nuke").onclick = () => {
    if (game.treasury >= 100000000) {
      game.treasury -= 100000000;
      game.nukeProgress += 25;
      game.unSanctions = Math.min(100, game.unSanctions + 25);
      showToast("☢️ Riset nuklir maju!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("ev-btn1").onclick = () => resolveEvent(1);
  document.getElementById("ev-btn2").onclick = () => resolveEvent(2);
  document.getElementById("ev-btn3").onclick = () => resolveEvent(3);
  document.getElementById("btn-reset-go").onclick = resetGame;
  document.getElementById("btn-hard-reset").onclick = resetGame;
}

function triggerGameOver(reason) {
  document.getElementById("go-reason").innerText = reason;
  document.getElementById("gameover-modal").classList.remove("hidden");
}

function resetGame() {
  game = JSON.parse(JSON.stringify(INITIAL_STATE));
  document.getElementById("gameover-modal").classList.add("hidden");
  renderBuildingsUI();
  updateUI();
}

// --- Sync UI ---
function updateUI() {
  document.getElementById("top-date").innerText = `${Math.floor(game.day)} ${MONTHS[game.monthIndex]} ${game.year}`;
  document.getElementById("top-treasury").innerText = formatMoney(game.treasury);
  document.getElementById("top-sanctions").innerText = `${Math.floor(game.unSanctions)}%`;
  document.getElementById("top-threat").innerText = `${Math.floor(game.coupThreat)}%`;

  document.getElementById("val-military").innerText = `${game.loyaltyMilitary}%`;
  document.getElementById("bar-military").style.width = `${game.loyaltyMilitary}%`;

  document.getElementById("val-people").innerText = `${game.loyaltyPeople}%`;
  document.getElementById("bar-people").style.width = `${game.loyaltyPeople}%`;

  document.getElementById("val-cult").innerText = `${game.cultOfPersonality}%`;
  document.getElementById("bar-cult").style.width = `${game.cultOfPersonality}%`;

  document.getElementById("pop-mil-sat").innerText = `${game.loyaltyMilitary}%`;
  document.getElementById("pop-peo-sat").innerText = `${game.loyaltyPeople}%`;

  document.getElementById("oil-lvl-txt").innerText = `Level ${game.oilLevel}`;
  
  // Hitung total laju kas (Minyak + Bangunan)
  let eventOilMultiplier = (game.activeWorldEvent && game.activeWorldEvent.type === "OIL_BOOM") ? 2.0 : 1.0;
  const oilIncome = game.unSanctions >= 100 ? 0 : (game.oilLevel * 10 * eventOilMultiplier * (1 - game.unSanctions/100));
  const bIncomeInM = getTotalBuildingIncomePerSec() / 1e6;
  
  document.getElementById("oil-income-txt").innerText = `+$${(oilIncome + bIncomeInM).toFixed(1)}M / dtk`;

  document.getElementById("un-sanctions-text").innerText = `${Math.floor(game.unSanctions)}%`;
  document.getElementById("bar-sanctions").style.width = `${game.unSanctions}%`;

  document.getElementById("nuke-status-txt").innerText = `${game.nukeProgress}%`;
  document.getElementById("bar-nuke").style.width = `${game.nukeProgress}%`;

  document.getElementById("rel-usa").innerText = game.relUSA > 60 ? "Sekutu" : "Netral";
  document.getElementById("rel-ussr").innerText = game.relUSSR > 60 ? "Sekutu" : "Netral";

  // Banner Status Event Dunia Aktif
  const banner = document.getElementById("world-event-banner");
  if (game.activeWorldEvent) {
    banner.classList.remove("hidden");
    document.getElementById("world-event-title").innerText = game.activeWorldEvent.name;
    document.getElementById("world-event-desc").innerText = game.activeWorldEvent.desc;
  } else {
    banner.classList.add("hidden");
  }
}

window.onload = () => {
  initEventListeners();
  renderBuildingsUI();
  setInterval(gameLoop, 1000);
  updateUI();
};
