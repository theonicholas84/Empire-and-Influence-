/* ===================================================
   URZIKSTAN — State Manager Engine (Victoria Mechanics)
   =================================================== */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

const ROAD_TIERS = [
  { name: "Jalan Tanah (Lvl 0)", bonus: 0, cost: 80000000 },
  { name: "Jalan Raya (Lvl 1)", bonus: 0.20, cost: 180000000 },
  { name: "Jalan Tol Strategis (Lvl 2)", bonus: 0.50, cost: 0 }
];

// 10 TEKNOLOGI BERDASARKAN JAMAN
const TECH_TREE = [
  { id: "tech_agri", name: "Pertanian Mekanis", cost: 100, yearReq: 1960, req: null, desc: "Meningkatkan hasil produksi pangan sebesar +50%.", unlocked: false },
  { id: "tech_oil", name: "Pengeboran Lepas Pantai", cost: 150, yearReq: 1962, req: "tech_agri", desc: "Meningkatkan hasil minyak bumi +30%.", unlocked: false },
  { id: "tech_med", name: "Layanan Kesehatan Modern", cost: 200, yearReq: 1965, req: "tech_oil", desc: "Menurunkan angka kematian populasi bulanan.", unlocked: false },
  { id: "tech_port", name: "Dermaga Kontainer Logistik", cost: 300, yearReq: 1968, req: "tech_med", desc: "Meningkatkan pendapatan ekspor dari Pelabuhan +40%.", unlocked: false },
  { id: "tech_edu", name: "Kurikulum Sains & Teknik", cost: 450, yearReq: 1970, req: "tech_port", desc: "Meningkatkan generasi Tech Point dari Universitas +50%.", unlocked: false },
  { id: "tech_power", name: "Jaringan Listrik Nasional", cost: 600, yearReq: 1973, req: "tech_edu", desc: "Meningkatkan produksi tambang & bank +25%.", unlocked: false },
  { id: "tech_comm", name: "Sistem Telekomunikasi RRI/TV", cost: 800, yearReq: 1976, req: "tech_power", desc: "Meningkatkan efektivitas Cult of Personality.", unlocked: false },
  { id: "tech_arms", name: "Industri Pertahanan Mandiri", cost: 1000, yearReq: 1980, req: "tech_comm", desc: "Menjaga loyalitas militer tetap stabil.", unlocked: false },
  { id: "tech_nuke_know", name: "Fisika Reaktor Nuklir", cost: 1500, yearReq: 1985, req: "tech_arms", desc: "Membuka efisiensi riset dan pemrosesan Uranium.", unlocked: false },
  { id: "tech_digital", name: "Otomasi & Era Digital", cost: 2500, yearReq: 1990, req: "tech_nuke_know", desc: "Bonus deviden bank & pajak nasional +50%.", unlocked: false }
];

const INITIAL_STATE = {
  day: 1,
  monthIndex: 0,
  year: 1960,
  
  // --- Demografi & Populasi Engine ---
  populationTotal: 4620000,
  popPolicy: "natural", 
  monthlyBirths: 0,
  monthlyDeaths: 0,
  monthlyNetGrowth: 0,

  // --- Resource Engine ---
  treasury: 100000000,    
  oilStock: 1000,         
  coalStock: 500,         
  uraniumStock: 0,        
  foodStock: 2000,        
  techPoints: 0,          // NEW: Tech Points

  oilLevel: 1,
  roadLevel: 0,           
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
    farms: 1,             
    banks: 0,
    schools: 0,
    universities: 0,      // NEW: Universitas
    ports: 0,             // NEW: Pelabuhan
    coalMines: 0,
    garrisons: 0
  },

  unlockedTechs: [],       // Array simpan ID teknologi yang sudah di-unlock

  // --- Anggaran & Kebijakan Subsidi ---
  subsidyRate: 10000000, 

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
  if (Math.abs(val) >= 1e9) return "$" + (val / 1e9).toFixed(2) + "B";
  if (Math.abs(val) >= 1e6) return "$" + (val / 1e6).toFixed(1) + "M";
  return "$" + Math.floor(val).toLocaleString();
}

function formatPop(val) {
  if (val >= 1e6) return (val / 1e6).toFixed(2) + "M";
  return Math.floor(val).toLocaleString();
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

function processMonthlyPopulation() {
  const pop = game.populationTotal;
  let birthRate = 0.0025; 
  let deathRate = 0.0015;

  if (game.unlockedTechs.includes("tech_med")) {
    deathRate -= 0.0004; // Medis modern menurunkan angka kematian
  }

  if (game.popPolicy === "encourage") birthRate += 0.0015; 
  if (game.popPolicy === "restrict") {
    birthRate -= 0.0008;
    deathRate -= 0.0002;
  }

  if (game.taxRateSetting === "low") birthRate += 0.0005;
  if (game.taxRateSetting === "high") deathRate += 0.0008;
  if (game.taxRateSetting === "extreme") deathRate += 0.0025;

  if (game.foodStock <= 0) {
    deathRate += 0.0050;
  }

  if (game.coupThreat > 50) {
    deathRate += 0.0010;
  }

  game.monthlyBirths = Math.floor(pop * birthRate);
  game.monthlyDeaths = Math.floor(pop * deathRate);
  game.monthlyNetGrowth = game.monthlyBirths - game.monthlyDeaths;

  game.populationTotal = Math.max(100000, game.populationTotal + game.monthlyNetGrowth);
}

// --- Game Loop Utama ---
function gameLoop() {
  const now = Date.now();
  const elapsed = (now - game.lastUpdate) / 1000;
  game.lastUpdate = now;

  // Kalender
  game.day += elapsed * 3;
  if (game.day >= 30) {
    game.day = 1;
    game.monthIndex++;
    processMonthlyPopulation();

    if (game.monthIndex >= 12) {
      game.monthIndex = 0;
      game.year++;
    }
  }

  // Generasi Tech Points dari Sekolah & Universitas (Mahal & Lambat)
  let eduTechMultiplier = game.unlockedTechs.includes("tech_edu") ? 1.5 : 1.0;
  let schoolTP = game.buildings.schools * 0.05 * elapsed; 
  let uniTP = game.buildings.universities * 0.25 * eduTechMultiplier * elapsed; 
  game.techPoints += (schoolTP + uniTP);

  const roadBonus = ROAD_TIERS[game.roadLevel].bonus;

  // Produksi Makanan & Komoditas
  let farmBonus = game.unlockedTechs.includes("tech_agri") ? 1.5 : 1.0;
  let oilBonus = game.unlockedTechs.includes("tech_oil") ? 1.3 : 1.0;
  
  const oilProducedPerSec = (game.oilLevel * 100) * (1 + roadBonus) * oilBonus;
  game.oilStock += oilProducedPerSec * elapsed;

  let mineBonus = game.unlockedTechs.includes("tech_power") ? 1.25 : 1.0;
  if (game.buildings.coalMines > 0) {
    game.coalStock += (game.buildings.coalMines * 10 * mineBonus) * elapsed;
  }

  const foodProduction = (game.buildings.farms * 150 * farmBonus) * elapsed; 
  const foodConsumption = (game.populationTotal / 50000) * elapsed; 
  game.foodStock = Math.max(0, game.foodStock + foodProduction - foodConsumption);

  let foodImpact = game.foodStock <= 0 ? -1.5 : 0;

  // Revenue (Pajak, Bank, Pelabuhan)
  let digitalBonus = game.unlockedTechs.includes("tech_digital") ? 1.5 : 1.0;
  let baseTax = (game.populationTotal / 4620000) * 2000000;
  let taxMultiplier = 1;
  let taxPublicImpact = 0;

  if (game.taxRateSetting === "low") { taxMultiplier = 0.5; taxPublicImpact = 0.2; }
  else if (game.taxRateSetting === "medium") { taxMultiplier = 1.0; taxPublicImpact = 0; }
  else if (game.taxRateSetting === "high") { taxMultiplier = 2.0; taxPublicImpact = -0.3; }
  else if (game.taxRateSetting === "extreme") { taxMultiplier = 3.8; taxPublicImpact = -0.8; }

  const bankDeviden = (game.buildings.banks * 2500000) * digitalBonus * mineBonus;
  
  // Bonus Devisa dari Pelabuhan
  let portBonus = game.unlockedTechs.includes("tech_port") ? 1.4 : 1.0;
  const portRevenue = (game.buildings.ports * 3500000) * portBonus;

  const monthlyTaxRevenue = (baseTax * taxMultiplier * digitalBonus) * (1 + roadBonus);

  let autoExportIncome = 0;
  if (game.exportActive && game.oilStock > 0) {
    let exportRate = Math.min(game.oilStock, 80 * elapsed);
    if (game.unSanctions < 100 || game.blackMarketActive) {
      const pricePenalty = game.blackMarketActive ? 0.5 : (1 - (game.unSanctions / 100));
      const revenue = exportRate * game.oilPricePerBarrel * pricePenalty * 1000;
      game.oilStock -= exportRate;
      autoExportIncome = revenue / elapsed;
    }
  }

  const totalRevenuePerSec = monthlyTaxRevenue + bankDeviden + portRevenue + autoExportIncome;

  // Operational Expenses
  let expSubsidy = game.subsidyRate;
  if (game.popPolicy === "encourage") expSubsidy += 5000000;

  const expSekolah = (game.buildings.schools * 3000000) + (game.buildings.universities * 8000000) + (game.buildings.garrisons * 5000000);
  const expMakananLogistik = (game.buildings.farms * 2000000) + (game.buildings.ports * 1500000); 
  
  const totalExpensesPerSec = expSubsidy + expSekolah + expMakananLogistik;

  const netBalancePerSec = totalRevenuePerSec - totalExpensesPerSec;
  game.treasury += netBalancePerSec * elapsed;

  // Stabilitas & Loyalitas
  let cultBonus = game.unlockedTechs.includes("tech_comm") ? 0.3 : 0.15;
  game.loyaltyPeople = Math.min(100, Math.max(0, game.loyaltyPeople + (taxPublicImpact * elapsed) + (game.buildings.farms * 0.2 * elapsed) + (foodImpact * elapsed)));
  game.cultOfPersonality = Math.min(100, Math.max(0, game.cultOfPersonality + (game.buildings.schools * cultBonus * elapsed)));
  
  let milBonusTech = game.unlockedTechs.includes("tech_arms") ? 0.1 : 0;
  game.loyaltyMilitary = Math.min(100, Math.max(0, game.loyaltyMilitary + ((game.buildings.garrisons * 0.3 + milBonusTech) * elapsed)));

  // Kudeta
  let threatGain = 0;
  if (game.loyaltyMilitary < 40) threatGain += 2.0;
  if (game.loyaltyPeople < 30) threatGain += 3.0;
  if (game.ministers.defense.loyalty < 40) threatGain += 2.5;
  if (game.taxRateSetting === "extreme") threatGain += 1.5;

  threatGain -= (game.cultOfPersonality * 0.02);
  threatGain -= (game.buildings.garrisons * 0.2);
  if (threatGain < 0) threatGain = 0;

  game.coupThreat += threatGain * elapsed;

  if (game.coupThreat >= 75) document.body.classList.add("emergency-mode");
  else document.body.classList.remove("emergency-mode");

  // DYNAMIC EVENT TRIGGER (Hanya Pemicu Insiden Keamanan Sosial Jika Kepuasan Rakyat Rendah < 40)
  if (now - game.lastEventCheck > 20000 && !game.activeEvent) {
    game.lastEventCheck = now;
    if (game.loyaltyPeople < 40 && Math.random() < 0.7) {
      triggerRandomEvent();
    }
  }

  if (game.coupThreat >= 100) {
    triggerGameOver("REVOLUSI TOTAL! Militer dan rakyat merebut Istana.");
    return;
  }

  updateUI(
    monthlyTaxRevenue, 
    bankDeviden, 
    portRevenue,
    autoExportIncome, 
    totalRevenuePerSec, 
    expSubsidy, 
    expSekolah, 
    expMakananLogistik, 
    totalExpensesPerSec, 
    netBalancePerSec, 
    oilProducedPerSec
  );
}

// --- Dynamic Events ---
const EVENTS = [
  {
    title: "⚠️ KERUSUHAN & INSIDEN KEAMANAN SOSIAL!",
    desc: "Kepuasan rakyat jatuh melorot! Gelombang demonstran dan milisi membakar fasilitas kilang.",
    b1: "Tumpas dengan Pasukan Khusus ($20M)",
    b2: "Bagi-Bagi Bantuan Sosial Darurat ($50M)",
    b3: "Biarkan Demonstran Beraksi",
    r1: () => {
      if (game.treasury >= 20000000) {
        game.treasury -= 20000000;
        game.loyaltyMilitary = Math.min(100, game.loyaltyMilitary + 5);
        game.loyaltyPeople = Math.max(0, game.loyaltyPeople - 10);
        showToast("⚔️ Demonstrasi ditumpas dengan kekerasan!");
      } else { showToast("❌ Dana tidak cukup!"); game.coupThreat += 15; }
    },
    r2: () => {
      if (game.treasury >= 50000000) {
        game.treasury -= 50000000;
        game.loyaltyPeople = Math.min(100, game.loyaltyPeople + 15);
        showToast("💰 Kerusuhan mereda setelah pembagian bansos.");
      } else { showToast("❌ Dana tidak cukup!"); game.coupThreat += 15; }
    },
    r3: () => {
      game.coupThreat += 20;
      game.oilStock = Math.max(0, game.oilStock - 500);
      showToast("💥 Tangki minyak meledak dibakar massa!");
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

function unlockTechnology(techId) {
  const tech = TECH_TREE.find(t => t.id === techId);
  if (!tech) return;

  if (game.unlockedTechs.includes(techId)) {
    showToast("⚠️ Teknologi ini sudah diteliti!");
    return;
  }

  if (game.year < tech.yearReq) {
    showToast(`❌ Belum mencapai tahun ${tech.yearReq}!`);
    return;
  }

  if (tech.req && !game.unlockedTechs.includes(tech.req)) {
    const parentTech = TECH_TREE.find(t => t.id === tech.req);
    showToast(`❌ Harus meneliti ${parentTech.name} terlebih dahulu!`);
    return;
  }

  if (game.techPoints < tech.cost) {
    showToast(`❌ Tech Points tidak cukup! Butuh ${tech.cost} TP.`);
    return;
  }

  game.techPoints -= tech.cost;
  game.unlockedTechs.push(techId);
  showToast(`💡 Teknologi Berhasil Dibuka: ${tech.name}!`);
  renderTechTreeUI();
}

function renderTechTreeUI() {
  const container = document.getElementById("tech-tree-list");
  if (!container) return;
  container.innerHTML = "";

  TECH_TREE.forEach(tech => {
    const isUnlocked = game.unlockedTechs.includes(tech.id);
    const parentTech = tech.req ? TECH_TREE.find(t => t.id === tech.req) : null;
    const parentUnlocked = !tech.req || game.unlockedTechs.includes(tech.req);
    const yearReached = game.year >= tech.yearReq;

    const card = document.createElement("div");
    card.className = `fm-card ${isUnlocked ? 'tech-unlocked' : ''}`;
    
    let reqText = tech.req ? `Syarat: ${parentTech.name}` : "Syarat: -";
    let statusBadge = isUnlocked ? `<span class="badge bg-green">Selesai</span>` : `<span class="badge bg-warning">${tech.cost} TP</span>`;

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h4>${tech.name}</h4>
        ${statusBadge}
      </div>
      <p class="text-muted mt-2">${tech.desc}</p>
      <div class="stat-row mt-2" style="font-size: 0.75rem;">
        <span>Tahun Min: <strong class="${yearReached ? 'text-success' : 'text-danger'}">${tech.yearReq}</strong></span>
        <span>${reqText}</span>
      </div>
      ${!isUnlocked ? `
        <button class="btn ${yearReached && parentUnlocked && game.techPoints >= tech.cost ? 'btn-primary' : 'btn-secondary'} btn-block mt-2" 
          onclick="unlockTechnology('${tech.id}')" ${!yearReached || !parentUnlocked ? 'disabled' : ''}>
          Riset (${tech.cost} TP)
        </button>
      ` : '<button class="btn btn-secondary btn-block mt-2" disabled>Sudah Ditentukan</button>'}
    `;

    container.appendChild(card);
  });
}

function setTaxRate(rate) {
  game.taxRateSetting = rate;
  let label = "Sedang (15%)";
  if (rate === "low") label = "Rendah (5%)";
  if (rate === "high") label = "Tinggi (30%)";
  if (rate === "extreme") label = "Ekstrem (50%)";
  showToast(`📜 Tarif pajak diubah ke: ${label}`);
}

function setPopPolicy(pol) {
  game.popPolicy = pol;
  let label = "Pertumbuhan Alami";
  if (pol === "encourage") label = "Program Insentif Kelahiran";
  if (pol === "restrict") label = "Pembatasan Imigrasi/Emigrasi";
  showToast(`👥 Kebijakan Populasi diubah ke: ${label}`);
}

function initEventListeners() {
  document.querySelectorAll(".fm-nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".fm-nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
      
      e.target.classList.add("active");
      const tabId = e.target.getAttribute("data-tab");
      document.getElementById(`tab-${tabId}`).classList.add("active");

      if (tabId === "techtree") renderTechTreeUI();
    });
  });

  document.getElementById("btn-upgrade-oil").onclick = () => {
    if (game.treasury >= 50000000) {
      game.treasury -= 50000000;
      game.oilLevel++;
      showToast("🛢️ Kapasitas produksi kilang naik!");
    } else showToast("❌ Dana tidak cukup!");
  };

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

  document.getElementById("btn-build-farm").onclick = () => {
    if (game.treasury >= 40000000) {
      game.treasury -= 40000000;
      game.buildings.farms++;
      showToast("🌾 Ladang pertanian dibuka! Suplai makanan bertambah.");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-buy-food").onclick = () => {
    if (game.treasury >= 20000000) {
      game.treasury -= 20000000;
      game.foodStock += 1000;
      showToast("🍞 Berhasil mengimpor 1.000 Ton Makanan!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-build-bank").onclick = () => {
    if (game.treasury >= 120000000) {
      game.treasury -= 120000000;
      game.buildings.banks++;
      showToast("🏦 Cabang BankSentral beroperasi!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-build-school").onclick = () => {
    if (game.treasury >= 60000000) {
      game.treasury -= 60000000;
      game.buildings.schools++;
      showToast("🏫 Sekolah didirikan! TP mulai dihasilkan secara perlahan.");
    } else showToast("❌ Dana tidak cukup!");
  };

  // BANGUNAN BARU: UNIVERSITAS
  document.getElementById("btn-build-uni").onclick = () => {
    if (game.treasury >= 200000000) {
      game.treasury -= 200000000;
      game.buildings.universities++;
      showToast("🎓 Universitas Riset didirikan! Generasi TP meningkat pesat.");
    } else showToast("❌ Dana tidak cukup!");
  };

  // BANGUNAN BARU: PELABUHAN
  document.getElementById("btn-build-port").onclick = () => {
    if (game.treasury >= 180000000) {
      game.treasury -= 180000000;
      game.buildings.ports++;
      showToast("⚓ Pelabuhan Internasional beroperasi! Pendapatan devisa bertambah.");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-build-coalmine").onclick = () => {
    if (game.treasury >= 70000000) {
      game.treasury -= 70000000;
      game.buildings.coalMines++;
      showToast("⛏️ Tambang Batubara beroperasi!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-build-garrison").onclick = () => {
    if (game.treasury >= 250000000) {
      game.treasury -= 250000000;
      game.buildings.garrisons++;
      showToast("🏰 Pangkalan militer berdiri!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-toggle-export").onclick = () => {
    game.exportActive = !game.exportActive;
    showToast(game.exportActive ? "🚢 Auto-Ekspor Minyak Diberlakukan" : "🛑 Auto-Ekspor Dihentikan");
  };

  document.getElementById("btn-manual-export").onclick = () => {
    if (game.oilStock > 0) {
      const revenue = (game.oilStock * game.oilPricePerBarrel) * 1000;
      game.treasury += revenue;
      showToast(`💰 Berhasil menjual ${Math.floor(game.oilStock)} Barel Minyak seharga ${formatMoney(revenue)}!`);
      game.oilStock = 0;
    } else showToast("❌ Stok minyak kosong!");
  };

  document.getElementById("btn-export-coal").onclick = () => {
    if (game.coalStock >= 500) {
      game.coalStock -= 500;
      game.treasury += 15000000;
      showToast("🚢 500 Ton Batubara diekspor (+ $15M)!");
    } else showToast("❌ Stok batubara tidak cukup!");
  };

  document.getElementById("btn-mine-uranium").onclick = () => {
    if (game.treasury >= 80000000) {
      game.treasury -= 80000000;
      game.uraniumStock += 25;
      showToast("☢️ Berhasil mengekstraksi 25 Ton Uranium!");
    } else showToast("❌ Dana tidak cukup!");
  };

  document.getElementById("btn-develop-nuke").onclick = () => {
    let reqUranium = game.unlockedTechs.includes("tech_nuke_know") ? 35 : 50;
    if (game.treasury >= 100000000 && game.uraniumStock >= reqUranium) {
      game.treasury -= 100000000;
      game.uraniumStock -= reqUranium;
      game.nukeProgress += 25;
      game.unSanctions = Math.min(100, game.unSanctions + 25);
      showToast("☢️ Riset uji coba nuklir berhasil!");
    } else showToast(`❌ Butuh $100M dan ${reqUranium} Ton Uranium!`);
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
  renderTechTreeUI();
}

// Sync UI Realtime
function updateUI(pajakRev=0, bankRev=0, portRev=0, minyakRev=0, totRev=0, expSub=0, expSek=0, expFood=0, totExp=0, netBal=0, oilRate=0) {
  document.getElementById("top-date").innerText = `${Math.floor(game.day)} ${MONTHS[game.monthIndex]} ${game.year}`;
  document.getElementById("top-population").innerText = formatPop(game.populationTotal);
  document.getElementById("top-treasury").innerText = formatMoney(game.treasury);
  document.getElementById("top-techpoints").innerText = `${Math.floor(game.techPoints)} TP`;
  document.getElementById("top-food").innerText = `${Math.floor(game.foodStock).toLocaleString()} Ton`;
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

  // Status Pops
  document.getElementById("pop-total-val").innerText = `${Math.floor(game.populationTotal).toLocaleString()} Jiwa`;
  
  const netGrowthEl = document.getElementById("pop-net-growth");
  netGrowthEl.innerText = `${game.monthlyNetGrowth >= 0 ? '+' : ''}${game.monthlyNetGrowth.toLocaleString()} Jiwa/bln`;
  netGrowthEl.className = game.monthlyNetGrowth >= 0 ? "text-success" : "text-danger";

  document.getElementById("pop-birth-rate").innerText = `+${game.monthlyBirths.toLocaleString()}`;
  document.getElementById("pop-death-rate").innerText = `-${game.monthlyDeaths.toLocaleString()}`;

  let polLabel = "Normal (Alami)";
  if (game.popPolicy === "encourage") polLabel = "Program Kelahiran";
  if (game.popPolicy === "restrict") polLabel = "Pembatasan Ketat";
  document.getElementById("pop-policy-label").innerText = polLabel;

  document.getElementById("pop-mil-count").innerText = formatPop(game.populationTotal * 0.025);
  document.getElementById("pop-peo-count").innerText = formatPop(game.populationTotal * 0.735);
  document.getElementById("pop-rel-count").innerText = formatPop(game.populationTotal * 0.24);

  document.getElementById("pop-mil-sat").innerText = `${Math.floor(game.loyaltyMilitary)}%`;
  document.getElementById("pop-peo-sat").innerText = `${Math.floor(game.loyaltyPeople)}%`;

  document.getElementById("oil-lvl-txt").innerText = `Level ${game.oilLevel}`;
  document.getElementById("oil-rate-txt").innerText = `+${Math.floor(oilRate)} Bbl / dtk`;
  document.getElementById("export-status-txt").innerText = game.exportActive ? (game.unSanctions >= 100 ? "Terembargo" : "Aktif") : "Diberhentikan";

  const roadInfo = ROAD_TIERS[game.roadLevel];
  document.getElementById("road-level-txt").innerText = roadInfo.name;
  document.getElementById("road-bonus-txt").innerText = `+${Math.floor(roadInfo.bonus * 100)}%`;

  // Bangunan
  document.getElementById("bld-farm-lvl").innerText = game.buildings.farms;
  document.getElementById("bld-bank-lvl").innerText = game.buildings.banks;
  document.getElementById("bld-school-lvl").innerText = game.buildings.schools;
  document.getElementById("bld-uni-lvl").innerText = game.buildings.universities;
  document.getElementById("bld-port-lvl").innerText = game.buildings.ports;
  document.getElementById("bld-coalmine-lvl").innerText = game.buildings.coalMines;
  document.getElementById("bld-garrison-lvl").innerText = game.buildings.garrisons;

  document.getElementById("bank-income-txt").innerText = `+$${((game.buildings.banks * 2.5)).toFixed(1)}M / dtk`;

  // Finansial Victoria Engine
  document.getElementById("vic-rev-pajak").innerText = formatMoney(pajakRev) + " / dtk";
  document.getElementById("vic-rev-bank").innerText = formatMoney(bankRev) + " / dtk";
  document.getElementById("vic-rev-port").innerText = formatMoney(portRev) + " / dtk";
  document.getElementById("vic-rev-minyak").innerText = formatMoney(minyakRev) + " / dtk";
  document.getElementById("vic-rev-total").innerText = formatMoney(totRev) + " / dtk";

  document.getElementById("vic-exp-subsidi").innerText = formatMoney(expSub) + " / dtk";
  document.getElementById("vic-exp-sekolah").innerText = formatMoney(expSek) + " / dtk";
  document.getElementById("vic-exp-makanan").innerText = formatMoney(expFood) + " / dtk";
  document.getElementById("vic-exp-total").innerText = formatMoney(totExp) + " / dtk";

  const netEl = document.getElementById("vic-net-balance");
  netEl.innerText = formatMoney(netBal) + " / dtk";
  netEl.className = netBal >= 0 ? "value text-success" : "value text-danger";

  let taxLabel = "Sedang (15%)";
  if (game.taxRateSetting === "low") taxLabel = "Rendah (5%)";
  if (game.taxRateSetting === "high") taxLabel = "Tinggi (30%)";
  if (game.taxRateSetting === "extreme") taxLabel = "Ekstrem (50%)";
  document.getElementById("tax-rate-label").innerText = taxLabel;

  document.getElementById("oil-stock-txt").innerText = `${Math.floor(game.oilStock).toLocaleString()} Barel`;

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
  renderTechTreeUI();
  setInterval(gameLoop, 1000);
};
