/* ===================================================
   URZIKSTAN — State Manager Engine (Expanded Economy & Global Politics)
   =================================================== */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

// --- 1. DATA SEKTOR & BANGUNAN EKONOMI ---
const ECONOMIC_SECTORS = {
  agriculture: {
    name: "Pertanian & Pangan",
    icon: "🌾",
    level: 1,
    maxLevel: 10,
    baseCost: 20000000,
    costMultiplier: 1.4,
    baseIncome: 400000,
    outputType: "food",
    outputBase: 100 // Produce 100 Food/sec base
  },
  manufacturing: {
    name: "Manufaktur & Baja",
    icon: "🏭",
    level: 1,
    maxLevel: 10,
    baseCost: 40000000,
    costMultiplier: 1.5,
    baseIncome: 800000,
    outputType: "steel",
    outputBase: 50 // Produce 50 Steel/sec base
  },
  services: {
    name: "Jasa & Perdagangan",
    icon: "🛳️",
    level: 1,
    maxLevel: 10,
    baseCost: 35000000,
    costMultiplier: 1.45,
    baseIncome: 600000,
    outputType: "trade_value",
    outputBase: 200
  }
};

// --- 2. DATA POPS EKONOMI (Victoria 3 Style) ---
const POPS_DATA = {
  military: {
    name: "💂 Jenderal & Perwira Militer",
    count: 120000,
    satisfaction: 70,
    politicalPower: 45,
    incomeTier: 4, // Tier 1-5
    wagePerPop: 150, // Total Wage multiplier
    unrestLevel: 0, // 1-5
    demands: [
      { id: "d_arm", text: "Anggaran Alat Utama", met: true },
      { id: "d_press", text: "Pembersihan Oposisi", met: false },
      { id: "d_wage", text: "Kenaikan Gaji Militer", met: true }
    ]
  },
  laborers: {
    name: "🌾 Buruh & Petani",
    count: 3400000,
    satisfaction: 50,
    politicalPower: 35,
    incomeTier: 2,
    wagePerPop: 30,
    unrestLevel: 1,
    demands: [
      { id: "d_sub", text: "Subsidi Pangan Murah", met: true },
      { id: "d_work", text: "Jam Kerja 8 Jam", met: false },
      { id: "d_tax", text: "Penurunan Pajak Hasil Bumi", met: false }
    ]
  },
  clergy: {
    name: "🕌 Faksi Keagamaan",
    count: 1100000,
    satisfaction: 40,
    politicalPower: 20,
    incomeTier: 3,
    wagePerPop: 60,
    unrestLevel: 2,
    demands: [
      { id: "d_moral", text: "Penerapan Hukum Moral", met: false },
      { id: "d_media", text: "Sensor Media Barat", met: true },
      { id: "d_site", text: "Restorasi Situs Suci", met: false }
    ]
  }
};

// --- 3. DATA 13 NEGARA RIVAL & DIPLOMASI ---
const COUNTRIES = {
  usa: { name: "Amerika Serikat", flag: "🇺🇸", status: "Netral", pact: "None", relation: 50, favor: 0, power: "Superpower", unVeto: true },
  ussr: { name: "Uni Soviet", flag: "🛠️", status: "Netral", pact: "None", relation: 50, favor: 0, power: "Superpower", unVeto: true },
  uk: { name: "Inggris", flag: "🇬🇧", status: "Netral", pact: "None", relation: 45, favor: 0, power: "Major", unVeto: true },
  france: { name: "Prancis", flag: "🇫🇷", status: "Netral", pact: "None", relation: 45, favor: 0, power: "Major", unVeto: true },
  china: { name: "China", flag: "🇨🇳", status: "Netral", pact: "None", relation: 40, favor: 0, power: "Major", unVeto: true },
  germany: { name: "Jerman Barat", flag: "🇩🇪", status: "Netral", pact: "None", relation: 50, favor: 0, power: "Regional", unVeto: false },
  turkey: { name: "Turki", flag: "🇹🇷", status: "Netral", pact: "None", relation: 55, favor: 0, power: "Regional", unVeto: false },
  saudi: { name: "Arab Saudi", flag: "🇸🇦", status: "Persahabatan", pact: "Trade Agreement", relation: 65, favor: 1, power: "Regional", unVeto: false },
  azerbaijan: { name: "Azerbaijan", flag: "🇦🇿", status: "Persahabatan", pact: "Trade Agreement", relation: 60, favor: 0, power: "Minor", unVeto: false },
  armenia: { name: "Armenia", flag: "🇦🇲", status: "Musuh", pact: "None", relation: 20, favor: 0, power: "Minor", unVeto: false },
  iran: { name: "Iran", flag: "🇮🇷", status: "Netral", pact: "None", relation: 50, favor: 0, power: "Regional", unVeto: false },
  iraq: { name: "Irak", flag: "🇮🇶", status: "Persahabatan", pact: "Non-Aggression", relation: 70, favor: 2, power: "Regional", unVeto: false },
  syria: { name: "Suriah", flag: "🇸🇾", status: "Persahabatan", pact: "Non-Aggression", relation: 75, favor: 1, power: "Minor", unVeto: false }
};

// --- STATE UTAMA ---
const INITIAL_STATE = {
  day: 1,
  monthIndex: 0,
  year: 1960,
  
  treasury: 150000000,
  oilLevel: 1,
  nukeProgress: 0,
  coupThreat: 0,
  unSanctions: 0,
  cultOfPersonality: 10,
  
  // Stok Sumber Daya (Resource Stocks)
  resources: {
    oil: 500,
    steel: 200,
    food: 1000
  },

  // Trade Routes Active
  tradeRoutes: [
    { id: 1, partner: "saudi", exportItem: "oil", importItem: "food", rate: 50 }
  ],

  sectors: JSON.parse(JSON.stringify(ECONOMIC_SECTORS)),
  pops: JSON.parse(JSON.stringify(POPS_DATA)),
  countries: JSON.parse(JSON.stringify(COUNTRIES)),

  historyOutput: [10, 12, 15, 14, 18, 22, 25], // Untuk grafik sederhana

  activeEvent: null,
  lastUpdate: Date.now(),
  lastMonthCheck: Date.now()
};

let game = JSON.parse(JSON.stringify(INITIAL_STATE));

// --- HELPER FORMATTING ---
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

// --- RUMUS SEKTOR EKONOMI ---
function getSectorCost(s) {
  return Math.floor(s.baseCost * Math.pow(s.costMultiplier, s.level));
}

function getSectorIncome(s) {
  return s.baseIncome * s.level;
}

function getTotalWages() {
  let totalWage = 0;
  for (let key in game.pops) {
    const pop = game.pops[key];
    totalWage += (pop.count / 1000) * pop.wagePerPop * pop.incomeTier;
  }
  return totalWage;
}

// --- MAIN ENGINE LOOP ---
function gameLoop() {
  const now = Date.now();
  const elapsed = (now - game.lastUpdate) / 1000;
  game.lastUpdate = now;

  // Kalender
  const prevMonth = game.monthIndex;
  game.day += elapsed * 3;
  if (game.day >= 30) {
    game.day = 1;
    game.monthIndex++;
    if (game.monthIndex >= 12) {
      game.monthIndex = 0;
      game.year++;
    }
  }

  // Update Bulanan untuk Pops & Ekonomi
  if (prevMonth !== game.monthIndex) {
    monthlyEconomyUpdate();
  }

  // Akumulasi Finansial
  let agriInc = getSectorIncome(game.sectors.agriculture);
  let manufInc = getSectorIncome(game.sectors.manufacturing);
  let servInc = getSectorIncome(game.sectors.services);
  let oilInc = game.oilLevel * 10000000 * (1 - (game.unSanctions / 100));

  let totalGrossIncome = agriInc + manufInc + servInc + oilInc;
  let totalWages = getTotalWages();
  let netCashflow = totalGrossIncome - totalWages;

  game.treasury += netCashflow * elapsed;

  // Produksi Resource Goods (Per Dtk)
  game.resources.food += (game.sectors.agriculture.outputBase * game.sectors.agriculture.level) * elapsed * 0.1;
  game.resources.steel += (game.sectors.manufacturing.outputBase * game.sectors.manufacturing.level) * elapsed * 0.1;
  game.resources.oil += (game.oilLevel * 20) * elapsed * 0.1;

  // Resource Trade Route Processing
  processTradeRoutes(elapsed);

  // Threat & Stability calculation
  let avgSatisfaction = (game.pops.military.satisfaction + game.pops.laborers.satisfaction + game.pops.clergy.satisfaction) / 3;
  if (avgSatisfaction < 40) game.coupThreat += 0.5 * elapsed;

  if (game.coupThreat >= 100) {
    triggerGameOver("REVOLUSI SOSIAL! Unrest Pops meruntuhkan pemerintah.");
    return;
  }

  updateUI();
}

// --- BULANAN: UPDATE POPS & KEBUTUHAN ---
function monthlyEconomyUpdate() {
  // Update Unrest & Satisfaction berdasarkan Pemenuhan Tuntutan
  for (let key in game.pops) {
    const pop = game.pops[key];
    let metCount = pop.demands.filter(d => d.met).length;
    let totalDemands = pop.demands.length;

    if (metCount === totalDemands) {
      pop.satisfaction = Math.min(100, pop.satisfaction + 4);
      pop.unrestLevel = Math.max(0, pop.unrestLevel - 1);
    } else {
      pop.satisfaction = Math.max(0, pop.satisfaction - 5);
      if (pop.satisfaction < 30) pop.unrestLevel = Math.min(5, pop.unrestLevel + 1);
    }
  }

  // Push data ke grafik sederhana
  const totalNetOutput = (getSectorIncome(game.sectors.agriculture) + getSectorIncome(game.sectors.manufacturing) + getSectorIncome(game.sectors.services)) / 1e6;
  game.historyOutput.push(Math.round(totalNetOutput));
  if (game.historyOutput.length > 10) game.historyOutput.shift();

  renderGraph();
  showToast("📅 Laporan Bulanan Ekonomi & Pops Diperbarui.");
}

// --- RESOURCE CONVERSION & TRADE ROUTES ---
function processTradeRoutes(elapsed) {
  game.tradeRoutes.forEach(tr => {
    // Kurangi Barang Ekspor, Tambah Barang Impor
    if (game.resources[tr.exportItem] >= tr.rate * elapsed) {
      game.resources[tr.exportItem] -= tr.rate * elapsed;
      game.resources[tr.importItem] += (tr.rate * 0.8) * elapsed; // 20% loss/tariff
    }
  });
}

function convertResource(fromItem, toItem, amount) {
  if (game.resources[fromItem] >= amount) {
    game.resources[fromItem] -= amount;
    let ratio = (fromItem === 'oil' && toItem === 'steel') ? 0.5 : 1.2;
    game.resources[toItem] += amount * ratio;
    showToast(`🔄 Konversi berhasil: ${amount} ${fromItem} -> ${(amount * ratio).toFixed(0)} ${toItem}`);
  } else {
    showToast("❌ Stok barang tidak mencukupi!");
  }
}

// --- UPGRADE SEKTOR ---
function upgradeSector(sectorKey) {
  const sec = game.sectors[sectorKey];
  if (sec.level >= sec.maxLevel) {
    showToast("⚠️ Sektor sudah mencapai Level Maksimum!");
    return;
  }

  const cost = getSectorCost(sec);
  if (game.treasury >= cost) {
    game.treasury -= cost;
    sec.level++;
    showToast(`🏗️ ${sec.name} ditingkatkan ke Level ${sec.level}!`);
    renderSectorsUI();
  } else {
    showToast("❌ Kas negara tidak mencukupi!");
  }
}

// --- DIPLOMASI & RIVAL MECHANICS ---
function actionDiplomacy(countryKey, actionType) {
  const c = game.countries[countryKey];
  
  if (actionType === 'bribe') {
    if (game.treasury >= 30000000) {
      game.treasury -= 30000000;
      c.relation = Math.min(100, c.relation + 15);
      c.favor += 1;
      showToast(`💰 Diplomasi suap ke ${c.name} berhasil (+1 Favor).`);
    } else showToast("❌ Dana tidak cukup ($30M)!");
  } 
  else if (actionType === 'alliance') {
    if (game.treasury >= 50000000 && c.relation >= 70) {
      game.treasury -= 50000000;
      c.status = "Persahabatan";
      c.pact = "Military Alliance";
      showToast(`⚔️ Aliansi Militer resmi dibentuk bersama ${c.name}!`);
    } else showToast("❌ Butuh $50M & Relasi minimal 70.");
  }
  else if (actionType === 'espionage') {
    if (game.treasury >= 20000000) {
      game.treasury -= 20000000;
      let success = Math.random() > 0.3;
      if (success) {
        showToast(`🕵️ Intel Intelijen: ${c.name} memprediksi stabilitas Anda.`);
      } else {
        c.relation = Math.max(0, c.relation - 10);
        showToast(`⚠️ Agen Intelijen tertangkap di ${c.name}! Relasi memburuk.`);
      }
    } else showToast("❌ Dana tidak cukup ($20M)!");
  }
}

function callUNSession() {
  if (game.treasury < 50000000) {
    showToast("❌ Butuh $50M untuk menggelar Sidang Darurat PBB!");
    return;
  }
  game.treasury -= 50000000;

  // Cek bantuan Veto dari Superpower dengan Favor > 0
  let vetoSecured = false;
  for (let key in game.countries) {
    if (game.countries[key].unVeto && game.countries[key].favor > 0) {
      vetoSecured = true;
      game.countries[key].favor--;
      break;
    }
  }

  if (vetoSecured) {
    game.unSanctions = Math.max(0, game.unSanctions - 40);
    showToast("🇺🇳 VETO DIPERGUNAKAN! Sanksi PBB dipotong 40%.");
  } else {
    game.unSanctions = Math.max(0, game.unSanctions - 15);
    showToast("🇺🇳 Sidang PBB selesai. Sanksi berkurang 15%.");
  }
}

// --- RENDER UI DYNAMIC SECTIONS ---
function renderSectorsUI() {
  const container = document.getElementById("sector-list-container");
  if (!container) return;

  container.innerHTML = "";
  for (let key in game.sectors) {
    const s = game.sectors[key];
    const cost = getSectorCost(s);
    const inc = getSectorIncome(s);

    const card = document.createElement("div");
    card.className = "fm-card";
    card.innerHTML = `
      <h4>${s.icon} ${s.name}</h4>
      <div class="stat-row mt-2">
        <span>Tingkat Sektor:</span>
        <span class="text-primary">Lvl ${s.level} / ${s.maxLevel}</span>
      </div>
      <div class="stat-row">
        <span>Hasil Finansial:</span>
        <span class="text-success">+${formatMoney(inc)}/dtk</span>
      </div>
      <button class="btn btn-primary btn-block mt-2" onclick="upgradeSector('${key}')">
        Ekspansi Sektor (${formatMoney(cost)})
      </button>
    `;
    container.appendChild(card);
  }
}

function renderPopsUI() {
  const tbody = document.getElementById("pops-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  for (let key in game.pops) {
    const p = game.pops[key];
    
    let demandsHTML = p.demands.map(d => 
      `<span class="badge ${d.met ? 'bg-green' : 'bg-red'}">${d.text}</span>`
    ).join(" ");

    let metCount = p.demands.filter(d => d.met).length;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${p.name}</strong></td>
      <td>${(p.count / 1000).toLocaleString()}K</td>
      <td>Tier ${p.incomeTier}</td>
      <td class="${p.satisfaction < 40 ? 'text-danger' : 'text-success'}">${p.satisfaction}%</td>
      <td><span class="badge bg-warning">Level ${p.unrestLevel}</span></td>
      <td>${demandsHTML}</td>
      <td><strong>${metCount}/${p.demands.length} Terpenuhi</strong></td>
    `;
    tbody.appendChild(tr);
  }
}

function renderDiplomacyUI() {
  const tbody = document.getElementById("diplomacy-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  for (let key in game.countries) {
    const c = game.countries[key];

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.flag} <strong>${c.name}</strong> ${c.unVeto ? '🏛️' : ''}</td>
      <td><span class="badge ${c.status === 'Musuh' ? 'bg-red' : 'bg-blue'}">${c.status}</span></td>
      <td>${c.pact}</td>
      <td>${c.relation}/100</td>
      <td>${c.favor} Favor</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="actionDiplomacy('${key}', 'bribe')">Suap ($30M)</button>
        <button class="btn btn-primary btn-sm" onclick="actionDiplomacy('${key}', 'alliance')">Aliansi</button>
        <button class="btn btn-danger btn-sm" onclick="actionDiplomacy('${key}', 'espionage')">Intel</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

function renderGraph() {
  const canvas = document.getElementById("economy-graph");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#10B981";
  ctx.lineWidth = 3;
  ctx.beginPath();

  const data = game.historyOutput;
  const step = canvas.width / (data.length - 1);
  const maxVal = Math.max(...data, 50);

  data.forEach((val, i) => {
    const x = i * step;
    const y = canvas.height - (val / maxVal * (canvas.height - 20)) - 10;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// --- INIT LISTENERS & SYNC ---
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

  document.getElementById("btn-call-un").onclick = callUNSession;
  document.getElementById("btn-convert-oil").onclick = () => convertResource('oil', 'steel', 100);
}

function triggerGameOver(reason) {
  document.getElementById("go-reason").innerText = reason;
  document.getElementById("gameover-modal").classList.remove("hidden");
}

function updateUI() {
  document.getElementById("top-date").innerText = `${Math.floor(game.day)} ${MONTHS[game.monthIndex]} ${game.year}`;
  document.getElementById("top-treasury").innerText = formatMoney(game.treasury);
  document.getElementById("top-sanctions").innerText = `${Math.floor(game.unSanctions)}%`;
  document.getElementById("top-threat").innerText = `${Math.floor(game.coupThreat)}%`;

  // Resources
  document.getElementById("res-oil").innerText = `${Math.floor(game.resources.oil)} Barrel`;
  document.getElementById("res-steel").innerText = `${Math.floor(game.resources.steel)} Ton`;
  document.getElementById("res-food").innerText = `${Math.floor(game.resources.food)} Ton`;

  renderPopsUI();
  renderDiplomacyUI();
}

window.onload = () => {
  initEventListeners();
  renderSectorsUI();
  renderPopsUI();
  renderDiplomacyUI();
  setInterval(gameLoop, 1000);
  updateUI();
};
