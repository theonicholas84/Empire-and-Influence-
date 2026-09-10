/* ===================================================
   URZIKSTAN — State Manager Engine (Expanded Resources & Roads)
   =================================================== */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

const ROAD_TIERS = [
  { name: "Jalan Tanah (Lvl 0)", bonus: 0, cost: 80000000 },
  { name: "Jalan Raya (Lvl 1)", bonus: 0.20, cost: 180000000 },
  { name: "Jalan Tol Strategis (Lvl 2)", bonus: 0.50, cost: 0 }
];

const INITIAL_STATE = {
  day: 1,
  monthIndex: 0,
  year: 1960,
  
  // --- Resource Engine ---
  treasury: 100000000,    // Dollar ($)
  oilStock: 1000,         // Minyak Mentah (Barel)
  coalStock: 500,         // Batubara (Ton)
  uraniumStock: 0,        // Uranium (Ton)

  oilLevel: 1,
  roadLevel: 0,           // 0: Tanah, 1: Raya, 2: Tol
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

  taxRateSetting: "medium",

  // --- Bangunan & Infrastruktur ---
  buildings: {
    farms: 0,
    banks: 0,
    schools: 0,
    coalMines: 0,
    garrisons: 0
  },

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

// --- Game Loop Utama ---
function gameLoop() {
  const now = Date.now();
  const elapsed = (now - game.lastUpdate) / 1000;
  game.lastUpdate = now;

  // Kalender (1 detik = 3 hari)
  game.day += elapsed * 3;
  if (game.day >= 30) {
    game.day = 1;
    game.monthIndex++;
    if (game.monthIndex >= 12) {
      game.monthIndex = 0;
      game.year++;
    }
  }

  // 1. Logistik & Bonus Jalan
  const roadBonus = ROAD_TIERS[game.roadLevel].bonus;

  // 2. Produksi Komoditas
  const oilProducedPerSec = (game.oilLevel * 100) * (1 + roadBonus);
  game.oilStock += oilProducedPerSec * elapsed;

  if (game.buildings.coalMines > 0) {
    game.coalStock += (game.buildings.coalMines * 10) * elapsed;
  }

  // 3. Kalkulasi Pajak & Deviden Bank
  let baseTax = 2000000;
  let taxMultiplier = 1;
  let taxPublicImpact = 0;

  if (game.taxRateSetting === "low") {
    taxMultiplier = 0.5;
    taxPublicImpact = 0.1;
  } else if (game.taxRateSetting === "medium") {
    taxMultiplier = 1.0;
    taxPublicImpact = 0;
  } else if (game.taxRateSetting === "high") {
    taxMultiplier = 2.0;
    taxPublicImpact = -0.3;
  } else if (game.taxRateSetting === "extreme") {
    taxMultiplier = 3.8;
    taxPublicImpact = -0.8;
  }

  const bankDeviden = game.buildings.banks * 2500000;
  const totalTaxIncome = ((baseTax * taxMultiplier) + bankDeviden) * (1 + roadBonus);

  // 4. Sistem Ekspor Minyak Mentah (Minyak -> Dollar)
  let autoExportIncome = 0;
  if (game.exportActive && game.oilStock > 0) {
    let exportRate = Math.min(game.oilStock, 80 * elapsed); // Max ekspor per dtk
    if (game.unSanctions < 100 || game.blackMarketActive) {
      const pricePenalty = game.blackMarketActive ? 0.5 : (1 - (game.unSanctions / 100));
      const revenue = exportRate * game.oilPricePerBarrel * pricePenalty * 1000;
      
      game.oilStock -= exportRate;
      autoExportIncome = revenue;
    }
  }

  // Tambahkan devisa Dollar ke Kas
  game.treasury += (totalTaxIncome + autoExportIncome) * elapsed;

  // 5. Efek Bangunan Pertanian, Sekolah, dan Militer
  game.loyaltyPeople = Math.min(100, Math.max(0, game.loyaltyPeople + (taxPublicImpact * elapsed) + (game.buildings.farms * 0.3 * elapsed)));
  game.cultOfPersonality = Math.min(100, Math.max(0, game.cultOfPersonality + (game.buildings.schools * 0.15 * elapsed)));
  game.loyaltyMilitary = Math.min(100, Math.max(0, game.loyaltyMilitary + (game.buildings.garrisons * 0.3 * elapsed)));

  // 6. Resiko Kudeta
  let threatGain = 0;
  if (game.loyaltyMilitary < 40) threatGain += 2.0;
  if (game.loyaltyPeople < 30) threatGain += 3.0;
  if (game.ministers.defense.loyalty < 40) threatGain += 2.5;
  if (game.taxRateSetting === "extreme") threatGain += 1.5;

  threatGain -= (game.cultOfPersonality * 0.02);
  threatGain -= (game.buildings.garrisons * 0.2);
  if (threatGain < 0) threatGain = 0;

  game.coupThreat += threatGain * elapsed;

  if (game.coupThreat >= 75) {
    document.body.classList.add("emergency-mode");
  } else {
    document.body.classList.remove("emergency-mode");
  }

  // Dynamic Event Trigger
  if (now - game.lastEventCheck > 20000 && !game.activeEvent) {
    game.lastEventCheck = now;
    if (Math.random() < 0.6) triggerRandomEvent();
  }

  if (game.coupThreat >= 100) {
    triggerGameOver("REVOLUSI TOTAL! Militer dan kelompok oposisi merebut Istana.");
    return;
  }

  updateUI(totalTaxIncome, autoExportIncome, oilProducedPerSec);
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
      game.oilStock = Math.max(0, game.oilStock - 500);
      showToast("💥 Tangki minyak meledak!");
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

  // Upgrade Kilang
  document.getElementById("btn-upgrade-oil").onclick = () => {
    if (game.treasury >= 50000000) {
      game.treasury -= 50000000;
      game.oilLevel++;
      showToast("🛢️ Kapasitas produksi kilang naik!");
    } else showToast("❌ Dana tidak cukup!");
  };

  // Upgrade Jalan
  document.getElementById("btn-upgrade-road").onclick = () => {
    if (game.roadLevel < 2) {
      const cost = ROAD_TIERS[game.roadLevel].cost;
      if (game.treasury >= cost) {
        game.treasury -= cost;
        game.roadLevel++;
        showToast(`🛣️ Transportasi ditingkatkan ke ${ROAD_TIERS[game.roadLevel].name}!`);
      } else showToast("❌ Dana tidak cukup!");
    } else showToast("⚠️ Jalan sudah mencapai tingkat Jalan Tol maksimum!");
  };

  // Bangun Farm
  document.getElementById("btn-build-farm").onclick = () => {
    if (game.treasury >= 40000000) {
      game.treasury -= 40000000;
      game.buildings.farms++;
      showToast("🌾 Ladang pertanian dibuka!");
    } else showToast("❌ Dana tidak cukup!");
  };

  // Bangun Bank
  document.getElementById("btn-build-bank").onclick = () => {
    if (game.treasury >= 120000000) {
      game.treasury -= 120000000;
      game.buildings.banks++;
      showToast("🏦 Cabang BankSentral beroperasi!");
    } else showToast("❌ Dana tidak cukup!");
  };

  // Bangun Sekolah
  document.getElementById("btn-build-school").onclick = () => {
    if (game.treasury >= 60000000) {
      game.treasury -= 60000000;
      game.buildings.schools++;
      showToast("🏫 Sekolah doktrin dibuka!");
    } else showToast("❌ Dana tidak cukup!");
  };

  // Tambang Batubara
  document.getElementById("btn-build-coalmine").onclick = () => {
    if (game.treasury >= 70000000) {
      game.treasury -= 70000000;
      game.buildings.coalMines++;
      showToast("⛏️ Tambang Batubara beroperasi!");
    } else showToast("❌ Dana tidak cukup!");
  };

  // Pangkalan Militer
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
    showToast(game.exportActive ? "🚢 Auto-Ekspor Minyak Diberlakukan" : "🛑 Auto-Ekspor Dihentikan");
  };

  // Manual Ekspor Minyak
  document.getElementById("btn-manual-export").onclick = () => {
    if (game.oilStock > 0) {
      const revenue = (game.oilStock * game.oilPricePerBarrel) * 1000;
      game.treasury += revenue;
      showToast(`💰 Berhasil menjual ${Math.floor(game.oilStock)} Barel Minyak seharga ${formatMoney(revenue)}!`);
      game.oilStock = 0;
    } else showToast("❌ Stok minyak kosong!");
  };

  // Ekspor Batubara
  document.getElementById("btn-export-coal").onclick = () => {
    if (game.coalStock >= 500) {
      game.coalStock -= 500;
      game.treasury += 15000000;
      showToast("🚢 500 Ton Batubara diekspor (+ $15M)!");
    } else showToast("❌ Stok batubara tidak cukup!");
  };

  // Tambang Uranium
  document.getElementById("btn-mine-uranium").onclick = () => {
    if (game.treasury >= 80000000) {
      game.treasury -= 80000000;
      game.uraniumStock += 25;
      showToast("☢️ Berhasil mengekstraksi 25 Ton Uranium!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-develop-nuke").onclick = () => {
    if (game.treasury >= 100000000 && game.uraniumStock >= 50) {
      game.treasury -= 100000000;
      game.uraniumStock -= 50;
      game.nukeProgress += 25;
      game.unSanctions = Math.min(100, game.unSanctions + 25);
      showToast("☢️ Riset uji coba nuklir berhasil!");
    } else showToast("❌ Butuh $100M dan 50 Ton Uranium!");
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
  updateUI(0, 0, 0);
}

// Sync UI Realtime
function updateUI(calculatedTax = 0, autoExportIncome = 0, oilRate = 0) {
  document.getElementById("top-date").innerText = `${Math.floor(game.day)} ${MONTHS[game.monthIndex]} ${game.year}`;
  document.getElementById("top-treasury").innerText = formatMoney(game.treasury);
  document.getElementById("top-oil").innerText = `${Math.floor(game.oilStock).toLocaleString()} Bbl`;
  document.getElementById("top-coal").innerText = `${Math.floor(game.coalStock).toLocaleString()} Ton`;
  document.getElementById("top-uranium").innerText = `${Math.floor(game.uraniumStock).toLocaleString()} Ton`;
  document.getElementById("top-threat").innerText = `${Math.floor(game.coupThreat)}%`;

  document.getElementById("val-military").innerText = `${Math.floor(game.loyaltyMilitary)}%`;
  document.getElementById("bar-military").style.width = `${game.loyaltyMilitary}%`;

  document.getElementById("val-people").innerText = `${Math.floor(game.loyaltyPeople)}%`;
  document.getElementById("bar-people").style.width = `${game.loyaltyPeople}%`;

  document.getElementById("val-cult").innerText = `${Math.floor(game.cultOfPersonality)}%`;
  document.getElementById("bar-cult").style.width = `${game.cultOfPersonality}%`;

  document.getElementById("pop-mil-sat").innerText = `${Math.floor(game.loyaltyMilitary)}%`;
  document.getElementById("pop-peo-sat").innerText = `${Math.floor(game.loyaltyPeople)}%`;

  // Status Kilang & Jalan
  document.getElementById("oil-lvl-txt").innerText = `Level ${game.oilLevel}`;
  document.getElementById("oil-rate-txt").innerText = `+${Math.floor(oilRate)} Bbl / dtk`;
  document.getElementById("export-status-txt").innerText = game.exportActive ? (game.unSanctions >= 100 ? "Terembargo" : "Aktif") : "Diberhentikan";

  const roadInfo = ROAD_TIERS[game.roadLevel];
  document.getElementById("road-level-txt").innerText = roadInfo.name;
  document.getElementById("road-bonus-txt").innerText = `+${Math.floor(roadInfo.bonus * 100)}%`;

  // Updates Bangunan
  document.getElementById("bld-farm-lvl").innerText = game.buildings.farms;
  document.getElementById("bld-bank-lvl").innerText = game.buildings.banks;
  document.getElementById("bld-school-lvl").innerText = game.buildings.schools;
  document.getElementById("bld-coalmine-lvl").innerText = game.buildings.coalMines;
  document.getElementById("bld-garrison-lvl").innerText = game.buildings.garrisons;
  document.getElementById("bank-income-txt").innerText = `+$${((game.buildings.banks * 2.5)).toFixed(1)}M / dtk`;

  // Updates Ekonomi & Ekspor
  let taxLabel = "Sedang (15%)";
  if (game.taxRateSetting === "low") taxLabel = "Rendah (5%)";
  if (game.taxRateSetting === "high") taxLabel = "Tinggi (30%)";
  if (game.taxRateSetting === "extreme") taxLabel = "Ekstrem (50%)";
  document.getElementById("tax-rate-label").innerText = taxLabel;
  document.getElementById("tax-income-txt").innerText = `+$${(calculatedTax / 1e6).toFixed(1)}M / dtk`;

  document.getElementById("oil-stock-txt").innerText = `${Math.floor(game.oilStock).toLocaleString()} Barel`;
  document.getElementById("export-revenue-txt").innerText = `+$${(autoExportIncome / 1e6).toFixed(1)}M / dtk`;

  document.getElementById("un-sanctions-text").innerText = `${Math.floor(game.unSanctions)}%`;
  document.getElementById("bar-sanctions").style.width = `${game.unSanctions}%`;

  document.getElementById("uranium-stock-txt").innerText = `${Math.floor(game.uraniumStock)} Ton`;
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
  updateUI(0, 0, 0);
};
