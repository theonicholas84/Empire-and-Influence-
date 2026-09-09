/* ===================================================
   URZIKSTAN — Game Engine (Fixed & Fully Interactive)
   =================================================== */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

// --- 1. DATA SEKTOR EKONOMI ---
const ECONOMIC_SECTORS = {
  agriculture: {
    name: "Pertanian & Pangan",
    icon: "🌾",
    level: 1,
    maxLevel: 10,
    baseCost: 20000000,
    costMultiplier: 1.4,
    baseIncome: 400000,
    outputBase: 100
  },
  manufacturing: {
    name: "Manufaktur & Baja",
    icon: "🏭",
    level: 1,
    maxLevel: 10,
    baseCost: 40000000,
    costMultiplier: 1.5,
    baseIncome: 800000,
    outputBase: 50
  },
  services: {
    name: "Jasa & Perdagangan",
    icon: "🛳️",
    level: 1,
    maxLevel: 10,
    baseCost: 35000000,
    costMultiplier: 1.45,
    baseIncome: 600000,
    outputBase: 200
  }
};

// --- 2. DATA POPS EKONOMI ---
const POPS_DATA = {
  military: {
    name: "💂 Jenderal & Perwira Militer",
    count: 120000,
    satisfaction: 70,
    politicalPower: 45,
    incomeTier: 4,
    wagePerPop: 150,
    unrestLevel: 0,
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
  usa: { name: "Amerika Serikat", flag: "🇺🇸", status: "Netral", pact: "None", relation: 50, favor: 0, unVeto: true },
  ussr: { name: "Uni Soviet", flag: "🛠️", status: "Netral", pact: "None", relation: 50, favor: 0, unVeto: true },
  uk: { name: "Inggris", flag: "🇬🇧", status: "Netral", pact: "None", relation: 45, favor: 0, unVeto: true },
  france: { name: "Prancis", flag: "🇫🇷", status: "Netral", pact: "None", relation: 45, favor: 0, unVeto: true },
  china: { name: "China", flag: "🇨🇳", status: "Netral", pact: "None", relation: 40, favor: 0, unVeto: true },
  germany: { name: "Jerman Barat", flag: "🇩🇪", status: "Netral", pact: "None", relation: 50, favor: 0, unVeto: false },
  turkey: { name: "Turki", flag: "🇹🇷", status: "Netral", pact: "None", relation: 55, favor: 0, unVeto: false },
  saudi: { name: "Arab Saudi", flag: "🇸🇦", status: "Persahabatan", pact: "Trade Agreement", relation: 65, favor: 1, unVeto: false },
  azerbaijan: { name: "Azerbaijan", flag: "🇦🇿", status: "Persahabatan", pact: "Trade Agreement", relation: 60, favor: 0, unVeto: false },
  armenia: { name: "Armenia", flag: "🇦🇲", status: "Musuh", pact: "None", relation: 20, favor: 0, unVeto: false },
  iran: { name: "Iran", flag: "🇮🇷", status: "Netral", pact: "None", relation: 50, favor: 0, unVeto: false },
  iraq: { name: "Irak", flag: "🇮🇶", status: "Persahabatan", pact: "Non-Aggression", relation: 70, favor: 2, unVeto: false },
  syria: { name: "Suriah", flag: "🇸🇾", status: "Persahabatan", pact: "Non-Aggression", relation: 75, favor: 1, unVeto: false }
};

// --- STATE GAME ---
let game = {
  day: 1,
  monthIndex: 0,
  year: 1960,
  treasury: 150000000,
  oilLevel: 1,
  coupThreat: 0,
  unSanctions: 0,
  resources: { oil: 500, steel: 200, food: 1000 },
  sectors: JSON.parse(JSON.stringify(ECONOMIC_SECTORS)),
  pops: JSON.parse(JSON.stringify(POPS_DATA)),
  countries: JSON.parse(JSON.stringify(COUNTRIES)),
  historyOutput: [10, 12, 15, 14, 18, 22, 25],
  lastUpdate: Date.now()
};

// --- HELPER FORMAT & TOAST ---
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

// --- RUMUS SEKTOR EKONOMI ---
function getSectorCost(s) { return Math.floor(s.baseCost * Math.pow(s.costMultiplier, s.level)); }
function getSectorIncome(s) { return s.baseIncome * s.level; }

function getTotalWages() {
  let totalWage = 0;
  for (let key in game.pops) {
    const pop = game.pops[key];
    totalWage += (pop.count / 1000) * pop.wagePerPop * pop.incomeTier;
  }
  return totalWage;
}

// --- MAIN GAME LOOP ---
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

  // Update Bulanan
  if (prevMonth !== game.monthIndex) {
    monthlyEconomyUpdate();
  }

  // Finansial Kas
  let totalIncome = getSectorIncome(game.sectors.agriculture) + 
                    getSectorIncome(game.sectors.manufacturing) + 
                    getSectorIncome(game.sectors.services) + 
                    (game.oilLevel * 10000000 * (1 - (game.unSanctions / 100)));

  let netCashflow = totalIncome - getTotalWages();
  game.treasury += netCashflow * elapsed;

  // Produksi Barang Pasif
  game.resources.food += (game.sectors.agriculture.outputBase * game.sectors.agriculture.level) * elapsed * 0.1;
  game.resources.steel += (game.sectors.manufacturing.outputBase * game.sectors.manufacturing.level) * elapsed * 0.1;
  game.resources.oil += (game.oilLevel * 20) * elapsed * 0.1;

  // Check Game Over
  if (game.coupThreat >= 100) {
    document.getElementById("go-reason").innerText = "REVOLUSI TOTAL! Unrest Pops meruntuhkan pimpinan negara.";
    document.getElementById("gameover-modal").classList.remove("hidden");
    return;
  }

  updateUI();
}

function monthlyEconomyUpdate() {
  // Push grafik
  const totalNetOutput = (getSectorIncome(game.sectors.agriculture) + getSectorIncome(game.sectors.manufacturing) + getSectorIncome(game.sectors.services)) / 1e6;
  game.historyOutput.push(Math.round(totalNetOutput));
  if (game.historyOutput.length > 10) game.historyOutput.shift();

  renderGraph();
  showToast("📅 Laporan Bulanan Ekonomi & Pops Diperbarui.");
}

// --- AKSI & KLIK INTERAKTIF ---
window.upgradeSector = function(sectorKey) {
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
};

window.actionDiplomacy = function(countryKey, actionType) {
  const c = game.countries[countryKey];
  
  if (actionType === 'bribe') {
    if (game.treasury >= 30000000) {
      game.treasury -= 30000000;
      c.relation = Math.min(100, c.relation + 15);
      c.favor += 1;
      showToast(`💰 Suap ke ${c.name} berhasil (+1 Favor).`);
    } else showToast("❌ Butuh $30M!");
  } 
  else if (actionType === 'alliance') {
    if (game.treasury >= 50000000 && c.relation >= 60) {
      game.treasury -= 50000000;
      c.status = "Persahabatan";
      c.pact = "Military Alliance";
      showToast(`⚔️ Aliansi Militer dibentuk bersama ${c.name}!`);
    } else showToast("❌ Butuh $50M & Relasi minimal 60!");
  }
  else if (actionType === 'espionage') {
    if (game.treasury >= 20000000) {
      game.treasury -= 20000000;
      if (Math.random() > 0.4) {
        showToast(`🕵️ Intel Operasi di ${c.name} Sukses!`);
      } else {
        c.relation = Math.max(0, c.relation - 15);
        showToast(`⚠️ Agen tertangkap di ${c.name}! Relasi memburuk.`);
      }
    } else showToast("❌ Butuh $20M!");
  }
  renderDiplomacyUI();
};

function convertResource() {
  if (game.resources.oil >= 100) {
    game.resources.oil -= 100;
    game.resources.steel += 50;
    showToast("🔄 Konversi berhasil: 100 Minyak ➔ 50 Steel.");
  } else {
    showToast("❌ Stok Minyak tidak mencukupi!");
  }
}

function callUNSession() {
  if (game.treasury < 50000000) {
    showToast("❌ Butuh $50M untuk menggelar Sidang PBB!");
    return;
  }
  game.treasury -= 50000000;

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
    showToast("🇺🇳 Sidang PBB Selesai. Sanksi berkurang 15%.");
  }
}

// --- RENDERERS ---
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
      <div class="card-title">${s.icon} ${s.name}</div>
      <div class="stat-row mt-2">
        <span>Tingkat Sektor:</span>
        <span class="text-primary">Lvl ${s.level} / ${s.maxLevel}</span>
      </div>
      <div class="stat-row">
        <span>Hasil Pasif:</span>
        <span class="text-success">+${formatMoney(inc)}/dtk</span>
      </div>
      <button class="btn btn-primary btn-block mt-2" onclick="window.upgradeSector('${key}')">
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
    let demandsHTML = p.demands.map(d => `<span class="badge ${d.met ? 'bg-green' : 'bg-red'}">${d.text}</span>`).join(" ");
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
        <button class="btn btn-secondary btn-sm" onclick="window.actionDiplomacy('${key}', 'bribe')">Suap ($30M)</button>
        <button class="btn btn-primary btn-sm" onclick="window.actionDiplomacy('${key}', 'alliance')">Aliansi</button>
        <button class="btn btn-danger btn-sm" onclick="window.actionDiplomacy('${key}', 'espionage')">Intel</button>
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
  ctx.strokeStyle = "#00B069";
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

function updateUI() {
  document.getElementById("top-date").innerText = `${Math.floor(game.day)} ${MONTHS[game.monthIndex]} ${game.year}`;
  document.getElementById("top-treasury").innerText = formatMoney(game.treasury);
  document.getElementById("top-sanctions").innerText = `${Math.floor(game.unSanctions)}%`;
  document.getElementById("top-threat").innerText = `${Math.floor(game.coupThreat)}%`;

  document.getElementById("res-oil").innerText = `${Math.floor(game.resources.oil)} Barrel`;
  document.getElementById("res-steel").innerText = `${Math.floor(game.resources.steel)} Ton`;
  document.getElementById("res-food").innerText = `${Math.floor(game.resources.food)} Ton`;
}

// --- SETUP EVENT LISTENERS & INITIALIZATION ---
function init() {
  // Navigasi Tab FM Style
  document.querySelectorAll(".fm-nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".fm-nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
      
      const targetBtn = e.target;
      targetBtn.classList.add("active");
      const tabId = targetBtn.getAttribute("data-tab");
      document.getElementById(`tab-${tabId}`).classList.add("active");
    });
  });

  // Action Buttons
  document.getElementById("btn-convert-oil").onclick = convertResource;
  document.getElementById("btn-call-un").onclick = callUNSession;

  renderSectorsUI();
  renderPopsUI();
  renderDiplomacyUI();
  renderGraph();

  setInterval(gameLoop, 1000);
}

window.onload = init;
