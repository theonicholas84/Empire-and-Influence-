/* ===================================================
   URZIKSTAN — State Manager Engine (Enhanced Edition)
   =================================================== */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

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

  // --- Fitur Tambahan & Kabinet ---
  blackMarketActive: false,
  ministers: {
    defense: { name: "Jend. Barkov", loyalty: 70 },
    intel: { name: "Komp. Karim", loyalty: 60 }
  },

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
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// --- Main Engine ---
function gameLoop() {
  const now = Date.now();
  const elapsed = (now - game.lastUpdate) / 1000;
  game.lastUpdate = now;

  // Kalender Style FM (1 detik = 3 hari)
  game.day += elapsed * 3;
  if (game.day >= 30) {
    game.day = 1;
    game.monthIndex++;
    if (game.monthIndex >= 12) {
      game.monthIndex = 0;
      game.year++;
    }
  }

  // Pendapatan Minyak & Pasar Gelap
  let oilIncome = 0;
  if (game.unSanctions >= 100) {
    if (game.blackMarketActive) {
      oilIncome = (game.oilLevel * 5000000); // 50% pendapatan via pasar gelap
      game.coupThreat += 0.2 * elapsed; // Risiko infiltrated meningkat
    } else {
      oilIncome = 0;
    }
  } else {
    oilIncome = (game.oilLevel * 10000000) * (1 - (game.unSanctions / 100));
  }
  game.treasury += oilIncome * elapsed;

  // Akumulasi Risiko Kudeta
  let threatGain = 0;
  if (game.loyaltyMilitary < 40) threatGain += 2.0;
  if (game.loyaltyPeople < 30) threatGain += 3.0;
  if (game.ministers.defense.loyalty < 40) threatGain += 2.5; // Ancaman menteri militer
  threatGain -= (game.cultOfPersonality * 0.02);
  if (threatGain < 0) threatGain = 0;

  game.coupThreat += threatGain * elapsed;

  // Visual Emergency Effect saat Kudeta Tinggi (>75%)
  if (game.coupThreat >= 75) {
    document.body.classList.add("emergency-mode");
  } else {
    document.body.classList.remove("emergency-mode");
  }

  // Random Events Trigger
  if (now - game.lastEventCheck > 20000 && !game.activeEvent) {
    game.lastEventCheck = now;
    if (Math.random() < 0.6) triggerRandomEvent();
  }

  // Game Over Check
  if (game.coupThreat >= 100) {
    triggerGameOver("REVOLUSI TOTAL! Militer dan kelompok oposisi merebut Istana.");
    return;
  }

  updateUI();
}

// --- Events Pool ---
const EVENTS = [
  {
    title: "⚠️ PEMBERONTAKAN MILISI AL-QATALA!",
    desc: "Kelompok milisi mengepung kawasan kilang minyak Al-Zubair.",
    b1: "Kirim Pasukan Khusus ($20M)",
    b2: "Bayar Tebusan ($50M)",
    b3: "Abaikan Dulu",
    r1: () => {
      if (game.treasury >= 20000000) {
        game.treasury -= 20000000;
        game.loyaltyMilitary = Math.min(100, game.loyaltyMilitary + 5);
        showToast("⚔️ Milisi ditumpas!");
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
      showToast("💥 Kilang minyak meledak!");
    }
  },
  {
    title: "🕵️ SPIONASE AGEN ASING (CIA/KGB)",
    desc: "Infiltrasi intelijen asing terdeteksi di ibu kota.",
    b1: "Operasi Perburuan ($30M)",
    b2: "Deportasi Diam-diam ($10M)",
    b3: "Biarkan Saja",
    r1: () => {
      if (game.treasury >= 30000000) {
        game.treasury -= 30000000;
        game.coupThreat = Math.max(0, game.coupThreat - 10);
        showToast("🛡️ Agen asing berhasil dilumpuhkan!");
      } else { showToast("❌ Dana tidak cukup!"); }
    },
    r2: () => {
      if (game.treasury >= 10000000) {
        game.treasury -= 10000000;
        showToast("✈️ Agen dipulangkan.");
      } else { showToast("❌ Dana tidak cukup!"); }
    },
    r3: () => {
      game.coupThreat += 10;
      showToast("⚠️ Rahasia negara bocor!");
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

// --- Action Listeners ---
function initEventListeners() {
  document.querySelectorAll(".fm-nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".fm-nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
      
      e.target.classList.add("active");
      const tabId = e.target.getAttribute("data-tab");
      document.getElementById(`tab-${tabId}`).classList.add("active");
    });
  });

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

  // Zero-Sum Foreign Relations Mechanic
  document.getElementById("btn-align-usa").onclick = () => {
    if (game.treasury >= 40000000) {
      game.treasury -= 40000000;
      game.relUSA = Math.min(100, game.relUSA + 20);
      game.relUSSR = Math.max(0, game.relUSSR - 15);
      showToast("🇺🇸 Aliansi AS diperkuat (USSR merenggang).");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-align-ussr").onclick = () => {
    if (game.treasury >= 40000000) {
      game.treasury -= 40000000;
      game.relUSSR = Math.min(100, game.relUSSR + 20);
      game.relUSA = Math.max(0, game.relUSA - 15);
      showToast("🛠️ Bantuan Soviet mendarat (AS merenggang).");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-black-market").onclick = () => {
    game.blackMarketActive = !game.blackMarketActive;
    showToast(game.blackMarketActive ? "⚠️ Pasar Gelap Aktif!" : "🛑 Pasar Gelap Ditutup.");
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

function bribeMinister(type) {
  if (game.treasury >= 15000000) {
    game.treasury -= 15000000;
    game.ministers[type].loyalty = Math.min(100, game.ministers[type].loyalty + 20);
    showToast(`💰 ${game.ministers[type].name} berhasil disuap!`);
  } else {
    showToast("❌ Dana tidak cukup!");
  }
}

function triggerGameOver(reason) {
  document.getElementById("go-reason").innerText = reason;
  document.getElementById("gameover-modal").classList.remove("hidden");
}

function resetGame() {
  game = JSON.parse(JSON.stringify(INITIAL_STATE));
  document.getElementById("gameover-modal").classList.add("hidden");
  updateUI();
}

// --- UI Sync ---
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
  
  // Rate kalkulasi pendapatan
  let incomeRate = 0;
  if (game.unSanctions >= 100) {
    incomeRate = game.blackMarketActive ? (game.oilLevel * 5) : 0;
  } else {
    incomeRate = (game.oilLevel * 10 * (1 - game.unSanctions/100));
  }
  document.getElementById("oil-income-txt").innerText = `+$${incomeRate.toFixed(1)}M / dtk`;

  document.getElementById("un-sanctions-text").innerText = `${Math.floor(game.unSanctions)}%`;
  document.getElementById("bar-sanctions").style.width = `${game.unSanctions}%`;

  document.getElementById("nuke-status-txt").innerText = `${game.nukeProgress}%`;
  document.getElementById("bar-nuke").style.width = `${game.nukeProgress}%`;

  document.getElementById("rel-usa").innerText = `${game.relUSA}% (${game.relUSA > 60 ? 'Sekutu' : 'Netral'})`;
  document.getElementById("rel-ussr").innerText = `${game.relUSSR}% (${game.relUSSR > 60 ? 'Sekutu' : 'Netral'})`;

  // Status Kabinet
  document.getElementById("min-def-loyalty").innerText = `${game.ministers.defense.loyalty}%`;
  document.getElementById("min-intel-loyalty").innerText = `${game.ministers.intel.loyalty}%`;

  // Status Tombol Pasar Gelap
  const bmBtn = document.getElementById("btn-black-market");
  if (bmBtn) {
    bmBtn.innerText = game.blackMarketActive ? "Matikan Pasar Gelap" : "Aktifkan Pasar Gelap";
    bmBtn.className = game.blackMarketActive ? "btn btn-danger btn-block mt-2" : "btn btn-secondary btn-block mt-2";
  }
}

window.onload = () => {
  initEventListeners();
  setInterval(gameLoop, 1000);
  updateUI();
};
