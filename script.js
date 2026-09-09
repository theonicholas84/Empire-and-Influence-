/* ===================================================
   URZIKSTAN — State Manager Engine (Expanded Edition)
   =================================================== */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

const INITIAL_STATE = {
  day: 1,
  monthIndex: 0,
  year: 1960,
  
  treasury: 100000000,
  oilLevel: 1,
  exportActive: true,
  oilPricePerBarrel: 80,
  
  nukeProgress: 0,
  coupThreat: 0,
  unSanctions: 0,
  
  cultOfPersonality: 10,
  loyaltyMilitary: 70,
  loyaltyPeople: 50,
  
  relUSA: 50,
  relUSSR: 50,

  // --- Kebijakan Pajak ---
  taxRateSetting: "medium", // 'low', 'medium', 'high', 'extreme'

  // --- Bangunan & Infrastruktur ---
  buildings: {
    infrastructure: 0,
    hospitals: 0,
    industry: 0,
    garrisons: 0
  },

  // --- Kabinet ---
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

  // 1. Kalkulasi Bonus Bangunan Infrastruktur
  const infraMultiplier = 1 + (game.buildings.infrastructure * 0.15); // +15% per infra

  // 2. Kalkulasi Pendapatan Pajak
  let baseTax = 2000000; // $2M dasar
  let taxMultiplier = 1;
  let taxPublicImpact = 0; // Efek ke dukungan rakyat per detik

  if (game.taxRateSetting === "low") {
    taxMultiplier = 0.5;
    taxPublicImpact = 0.1; // Rakyat makin senang
  } else if (game.taxRateSetting === "medium") {
    taxMultiplier = 1.0;
    taxPublicImpact = 0;
  } else if (game.taxRateSetting === "high") {
    taxMultiplier = 2.0;
    taxPublicImpact = -0.3; // Rakyat tidak gembira
  } else if (game.taxRateSetting === "extreme") {
    taxMultiplier = 3.8;
    taxPublicImpact = -0.8; // Amarah publik melonjak
  }

  // Tambahan dari Pabrik Industri
  const industryIncome = game.buildings.industry * 3000000;
  const totalTaxIncome = ((baseTax * taxMultiplier) + industryIncome) * infraMultiplier;

  // 3. Kalkulasi Ekspor Minyak & Pasar Gelap
  let oilIncome = 0;
  if (game.exportActive) {
    if (game.unSanctions >= 100) {
      if (game.blackMarketActive) {
        oilIncome = (game.oilLevel * 5000000) * infraMultiplier; // Pasar gelap 50%
        game.coupThreat += 0.2 * elapsed;
      } else {
        oilIncome = 0; // Terembargo total
      }
    } else {
      const baseOil = (game.oilLevel * 10000000);
      const sanctionsPenalty = (1 - (game.unSanctions / 100));
      oilIncome = baseOil * sanctionsPenalty * infraMultiplier;
    }
  }

  // Tambah Pendapatan Total ke Kas Negara
  const totalIncomePerSec = totalTaxIncome + oilIncome;
  game.treasury += totalIncomePerSec * elapsed;

  // 4. Efek Bangunan terhadap Stabilitas & Loyalitas
  game.loyaltyPeople = Math.min(100, Math.max(0, game.loyaltyPeople + (taxPublicImpact * elapsed) + (game.buildings.hospitals * 0.2 * elapsed)));
  game.loyaltyMilitary = Math.min(100, Math.max(0, game.loyaltyMilitary + (game.buildings.garrisons * 0.3 * elapsed)));

  // 5. Akumulasi Risiko Kudeta
  let threatGain = 0;
  if (game.loyaltyMilitary < 40) threatGain += 2.0;
  if (game.loyaltyPeople < 30) threatGain += 3.0;
  if (game.ministers.defense.loyalty < 40) threatGain += 2.5;
  if (game.taxRateSetting === "extreme") threatGain += 1.5;

  threatGain -= (game.cultOfPersonality * 0.02);
  threatGain -= (game.buildings.garrisons * 0.2); // Pangkalan menekan kudeta
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

  updateUI(totalTaxIncome, oilIncome);
}

// --- Dynamic Events ---
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

function setTaxRate(rate) {
  game.taxRateSetting = rate;
  let label = "Sedang (15%)";
  if (rate === "low") label = "Rendah (5%)";
  if (rate === "high") label = "Tinggi (30%)";
  if (rate === "extreme") label = "Ekstrem (50%)";
  showToast(`📜 Tarif pajak diubah ke: ${label}`);
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

  // Fitur Upgrade Kilang
  document.getElementById("btn-upgrade-oil").onclick = () => {
    if (game.treasury >= 50000000) {
      game.treasury -= 50000000;
      game.oilLevel++;
      showToast("🛢️ Kilang di-upgrade!");
    } else showToast("❌ Dana tidak cukup!");
  };

  // Fitur Bangunan Infrastruktur
  document.getElementById("btn-build-infra").onclick = () => {
    if (game.treasury >= 100000000) {
      game.treasury -= 100000000;
      game.buildings.infrastructure++;
      showToast("🛣️ Infrastruktur logistik selesai dibangun!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-build-hospital").onclick = () => {
    if (game.treasury >= 150000000) {
      game.treasury -= 150000000;
      game.buildings.hospitals++;
      showToast("🏥 Rumah sakit publik beroperasi!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-build-industry").onclick = () => {
    if (game.treasury >= 200000000) {
      game.treasury -= 200000000;
      game.buildings.industry++;
      showToast("🏭 Kawasan industri dibuka!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-build-garrison").onclick = () => {
    if (game.treasury >= 250000000) {
      game.treasury -= 250000000;
      game.buildings.garrisons++;
      showToast("🏰 Pangkalan militer berdiri!");
    } else showToast("❌ Dana tidak cukup!");
  };

  // Toggle Ekspor
  document.getElementById("btn-toggle-export").onclick = () => {
    game.exportActive = !game.exportActive;
    showToast(game.exportActive ? "🚢 Ekspor Minyak Diberlakukan" : "🛑 Ekspor Minyak Dihentikan");
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
      game.relUSA = Math.min(100, game.relUSA + 20);
      game.relUSSR = Math.max(0, game.relUSSR - 15);
      showToast("🇺🇸 Aliansi AS diperkuat.");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-align-ussr").onclick = () => {
    if (game.treasury >= 40000000) {
      game.treasury -= 40000000;
      game.relUSSR = Math.min(100, game.relUSSR + 20);
      game.relUSA = Math.max(0, game.relUSA - 15);
      showToast("🛠️ Bantuan Soviet mendarat.");
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
  updateUI(0, 0);
}

// --- UI Sync ---
function updateUI(calculatedTax = 0, calculatedOil = 0) {
  document.getElementById("top-date").innerText = `${Math.floor(game.day)} ${MONTHS[game.monthIndex]} ${game.year}`;
  document.getElementById("top-treasury").innerText = formatMoney(game.treasury);
  document.getElementById("top-sanctions").innerText = `${Math.floor(game.unSanctions)}%`;
  document.getElementById("top-threat").innerText = `${Math.floor(game.coupThreat)}%`;

  document.getElementById("val-military").innerText = `${Math.floor(game.loyaltyMilitary)}%`;
  document.getElementById("bar-military").style.width = `${game.loyaltyMilitary}%`;

  document.getElementById("val-people").innerText = `${Math.floor(game.loyaltyPeople)}%`;
  document.getElementById("bar-people").style.width = `${game.loyaltyPeople}%`;

  document.getElementById("val-cult").innerText = `${Math.floor(game.cultOfPersonality)}%`;
  document.getElementById("bar-cult").style.width = `${game.cultOfPersonality}%`;

  document.getElementById("pop-mil-sat").innerText = `${Math.floor(game.loyaltyMilitary)}%`;
  document.getElementById("pop-peo-sat").innerText = `${Math.floor(game.loyaltyPeople)}%`;

  document.getElementById("oil-lvl-txt").innerText = `Level ${game.oilLevel}`;
  document.getElementById("oil-income-txt").innerText = `+$${(calculatedOil / 1e6).toFixed(1)}M / dtk`;
  document.getElementById("export-status-txt").innerText = game.exportActive ? (game.unSanctions >= 100 ? "Terembargo" : "Aktif") : "Diberhentikan";

  // Updates Bangunan
  document.getElementById("bld-infra-lvl").innerText = game.buildings.infrastructure;
  document.getElementById("bld-hospital-lvl").innerText = game.buildings.hospitals;
  document.getElementById("bld-industry-lvl").innerText = game.buildings.industry;
  document.getElementById("bld-garrison-lvl").innerText = game.buildings.garrisons;

  // Updates Pajak & Ekonomi
  let taxLabel = "Sedang (15%)";
  if (game.taxRateSetting === "low") taxLabel = "Rendah (5%)";
  if (game.taxRateSetting === "high") taxLabel = "Tinggi (30%)";
  if (game.taxRateSetting === "extreme") taxLabel = "Ekstrem (50%)";
  document.getElementById("tax-rate-label").innerText = taxLabel;
  document.getElementById("tax-income-txt").innerText = `+$${(calculatedTax / 1e6).toFixed(1)}M / dtk`;

  document.getElementById("export-revenue-txt").innerText = `+$${(calculatedOil / 1e6).toFixed(1)}M / dtk`;
  document.getElementById("export-cap-txt").innerText = `${(game.oilLevel * 100000).toLocaleString()} Barel/Hari`;

  document.getElementById("un-sanctions-text").innerText = `${Math.floor(game.unSanctions)}%`;
  document.getElementById("bar-sanctions").style.width = `${game.unSanctions}%`;

  document.getElementById("nuke-status-txt").innerText = `${game.nukeProgress}%`;
  document.getElementById("bar-nuke").style.width = `${game.nukeProgress}%`;

  document.getElementById("rel-usa").innerText = `${game.relUSA}% (${game.relUSA > 60 ? 'Sekutu' : 'Netral'})`;
  document.getElementById("rel-ussr").innerText = `${game.relUSSR}% (${game.relUSSR > 60 ? 'Sekutu' : 'Netral'})`;

  document.getElementById("min-def-loyalty").innerText = `${game.ministers.defense.loyalty}%`;
  document.getElementById("min-intel-loyalty").innerText = `${game.ministers.intel.loyalty}%`;

  const bmBtn = document.getElementById("btn-black-market");
  if (bmBtn) {
    bmBtn.innerText = game.blackMarketActive ? "Matikan Pasar Gelap" : "Aktifkan Pasar Gelap";
    bmBtn.className = game.blackMarketActive ? "btn btn-danger btn-block mt-2" : "btn btn-secondary btn-block mt-2";
  }
}

window.onload = () => {
  initEventListeners();
  setInterval(gameLoop, 1000);
  updateUI(0, 0);
};
