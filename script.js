/* ===================================================
   URZIKSTAN — Cold War Dictator Engine (1960 Edition)
   =================================================== */

const INITIAL_STATE = {
  year: 1960,
  treasury: 100000000, // $100M
  oilLevel: 1,
  nukeProgress: 0,
  coupThreat: 0,
  unSanctions: 0,
  
  // Cult & Loyalty Metrics
  cultOfPersonality: 10,
  loyaltyMilitary: 70,
  loyaltyPeople: 50,
  
  // Real World Superpowers
  relUSA: 50,  // 0-100
  relUSSR: 50, // 0-100

  activeEvent: null,
  lastUpdate: Date.now(),
  lastEventCheck: Date.now()
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

// --- Main Engine Loop ---
function gameLoop() {
  const now = Date.now();
  const elapsed = (now - game.lastUpdate) / 1000;
  game.lastUpdate = now;

  // Waktu Berjalan (1 Tahun = ~60 Detik)
  game.year += (elapsed / 60);

  // Pendapatan Minyak (Nol jika Kena Embargo PBB 100%)
  let oilRevenue = game.oilLevel * 10000000;
  if (game.unSanctions >= 100) {
    oilRevenue = 0; // Total Embargo!
  } else {
    oilRevenue *= (1 - (game.unSanctions / 100)); // Terpangkas Sanksi
  }
  game.treasury += oilRevenue * elapsed;

  // Akumulasi Ancaman Kudeta (Ditekan oleh Kultus Kepribadian)
  let threatGain = 0;
  if (game.loyaltyMilitary < 40) threatGain += 2.5;
  if (game.loyaltyPeople < 30) threatGain += 3.5;
  
  // Kultus Kepribadian meredam kemarahan rakyat
  threatGain -= (game.cultOfPersonality * 0.03);
  if (threatGain < 0) threatGain = 0;

  game.coupThreat += threatGain * elapsed;

  // Random Insurgency Event Trigger (Setiap 25-40 detik)
  if (now - game.lastEventCheck > 30000 && !game.activeEvent) {
    game.lastEventCheck = now;
    if (Math.random() < 0.6) {
      triggerRandomEvent();
    }
  }

  // Check Game Over Condition
  if (game.coupThreat >= 100) {
    triggerGameOver("REVOLUSI TOTAL! Militer & Pemberontak menggulingkan rezim Anda.");
    return;
  }

  updateUI();
}

// --- Random Event System (Milisi & Pemberontak) ---
const EVENTS = [
  {
    title: "⚠️ SERANGAN MILISI AL-QATALA!",
    desc: "Kelompok pemberontak merebut kilang minyak utama Urzikstan.",
    b1: "Kirim Pasukan Khusus ($20M)",
    b2: "Bayar Tebusan ($50M)",
    b3: "Abaikan Dulu",
    r1: () => {
      if (game.treasury >= 20000000) {
        game.treasury -= 20000000;
        game.loyaltyMilitary = Math.min(100, game.loyaltyMilitary + 5);
        showToast("⚔️ Milisi berhasil ditumpas!");
      } else { showToast("❌ Dana tidak cukup! Pemberontak makin kuat."); game.coupThreat += 15; }
    },
    r2: () => {
      if (game.treasury >= 50000000) {
        game.treasury -= 50000000;
        showToast("💰 Tebusan dibayar, kilang aman.");
      } else { showToast("❌ Uang tidak cukup!"); game.coupThreat += 15; }
    },
    r3: () => {
      game.coupThreat += 20;
      game.loyaltyPeople = Math.max(0, game.loyaltyPeople - 15);
      showToast("💥 Pemberontak meledakkan fasilitas minyak!");
    }
  },
  {
    title: "🕵️ SPIONASE PERANG DINGIN!",
    desc: "Agen CIA/KGB tertangkap mencoba menyusup ke istana Anda.",
    b1: "Eksekusi Publik (+Kultus, +Sanksi PBB)",
    b2: "Tukar Tahanan ($30M Cash)",
    b3: "Bebaskan Diam-Diam",
    r1: () => {
      game.cultOfPersonality = Math.min(100, game.cultOfPersonality + 15);
      game.unSanctions = Math.min(100, game.unSanctions + 15);
      showToast("🗿 Eksekusi meningkatkan ketakutan rakyat!");
    },
    r2: () => {
      game.treasury += 30000000;
      showToast("💰 Uang tebusan agen rahasia diterima.");
    },
    r3: () => {
      game.relUSA = Math.min(100, game.relUSA + 10);
      showToast("🤝 Hubungan diplomatik sedikit membaik.");
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

function resolveEvent(option) {
  if (!game.activeEvent) return;
  if (option === 1) game.activeEvent.r1();
  if (option === 2) game.activeEvent.r2();
  if (option === 3) game.activeEvent.r3();
  
  game.activeEvent = null;
  document.getElementById("event-modal").classList.add("hidden");
}

// --- Player Actions ---
function buildStatue() {
  if (game.treasury >= 80000000) {
    game.treasury -= 80000000;
    game.cultOfPersonality = Math.min(100, game.cultOfPersonality + 25);
    showToast("🗿 Patung emas raksasa berhasil berdiri di alun-alun!");
  } else { showToast("❌ Dana tidak cukup!"); }
}

function brainwashEducation() {
  if (game.treasury >= 50000000) {
    game.treasury -= 50000000;
    game.cultOfPersonality = Math.min(100, game.cultOfPersonality + 15);
    game.loyaltyPeople = Math.min(100, game.loyaltyPeople + 10);
    showToast("📚 Buku sekolah baru memuja rezim resmi diterbitkan!");
  } else { showToast("❌ Dana tidak cukup!"); }
}

function upgradeOil() {
  if (game.treasury >= 50000000) {
    game.treasury -= 50000000;
    game.oilLevel += 1;
    showToast("🛢️ Kilang minyak berhasil di-upgrade!");
  } else { showToast("❌ Dana tidak cukup!"); }
}

function issueDecree(type) {
  if (type === 'media' && game.treasury >= 20000000) {
    game.treasury -= 20000000;
    game.loyaltyMilitary = Math.min(100, game.loyaltyMilitary + 10);
    game.loyaltyPeople = Math.max(0, game.loyaltyPeople - 15);
    game.unSanctions = Math.min(100, game.unSanctions + 10);
    showToast("📜 Sensor media diberlakukan. PBB mengecam!");
  } else if (type === 'subsidy' && game.treasury >= 30000000) {
    game.treasury -= 30000000;
    game.loyaltyPeople = Math.min(100, game.loyaltyPeople + 20);
    showToast("🍞 Subsidi dibagikan.");
  } else if (type === 'purge' && game.treasury >= 50000000) {
    game.treasury -= 50000000;
    game.coupThreat = Math.max(0, game.coupThreat - 30);
    game.loyaltyMilitary = Math.max(0, game.loyaltyMilitary - 20);
    game.unSanctions = Math.min(100, game.unSanctions + 15);
    showToast("⚔️ Jenderal pembangkang dieksekusi!");
  } else { showToast("❌ Kas negara tidak mencukupi!"); }
}

function bribeUN() {
  if (game.treasury >= 60000000) {
    game.treasury -= 60000000;
    game.unSanctions = Math.max(0, game.unSanctions - 20);
    showToast("🤝 Diplomat PBB berhasil disuap!");
  } else { showToast("❌ Butuh $60M untuk menyuap PBB!"); }
}

function alignSuperpower(power) {
  if (game.treasury >= 40000000) {
    game.treasury -= 40000000;
    if (power === 'usa') {
      game.relUSA = Math.min(100, game.relUSA + 25);
      game.relUSSR = Math.max(0, game.relUSSR - 15);
      game.unSanctions = Math.max(0, game.unSanctions - 10);
      showToast("🇺🇸 Urzikstan makin dekat dengan Blok Barat!");
    } else {
      game.relUSSR = Math.min(100, game.relUSSR + 25);
      game.relUSA = Math.max(0, game.relUSA - 15);
      game.loyaltyMilitary = Math.min(100, game.loyaltyMilitary + 10);
      showToast("🛠️ Bantuan senjata dari Uni Soviet mendarat!");
    }
  } else { showToast("❌ Dana tidak cukup!"); }
}

function developNuke() {
  if (game.treasury >= 100000000) {
    game.treasury -= 100000000;
    game.nukeProgress += 25;
    game.unSanctions = Math.min(100, game.unSanctions + 25); // PBB Murka
    
    if (game.nukeProgress >= 100) {
      game.nukeProgress = 100;
      showToast("☢️ URZIKSTAN MENJADI KEKUATAN NUKLIR DUNIA!");
    } else {
      showToast("☢️ Uji coba nuklir sukses (+25% Progres, +25% Sanksi PBB)");
    }
  } else { showToast("❌ Butuh $100M untuk riset nuklir!"); }
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

// --- UI Sync Engine ---
function updateUI() {
  const currentYear = Math.floor(game.year);
  document.getElementById("top-year").innerText = `📅 TAHUN: ${currentYear}`;
  document.getElementById("palace-year").innerText = currentYear;

  document.getElementById("top-treasury").innerText = formatMoney(game.treasury);
  document.getElementById("top-sanctions").innerText = `${Math.floor(game.unSanctions)}%`;
  document.getElementById("top-threat").innerText = `${Math.floor(game.coupThreat)}%`;

  document.getElementById("bar-military").style.width = `${game.loyaltyMilitary}%`;
  document.getElementById("text-military").innerText = `${game.loyaltyMilitary}% Loyalitas`;

  document.getElementById("bar-people").style.width = `${game.loyaltyPeople}%`;
  document.getElementById("text-people").innerText = `${game.loyaltyPeople}% Dukungan`;

  document.getElementById("bar-cult").style.width = `${game.cultOfPersonality}%`;
  document.getElementById("text-cult").innerText = `${game.cultOfPersonality}% Cult Status`;

  document.getElementById("bar-sanctions").style.width = `${game.unSanctions}%`;
  document.getElementById("un-sanctions-val").innerText = `${Math.floor(game.unSanctions)}%`;

  document.getElementById("bar-nuke").style.width = `${game.nukeProgress}%`;
  document.getElementById("nuke-status").innerText = `${game.nukeProgress}%`;

  document.getElementById("rel-usa").innerText = game.relUSA > 60 ? "Sekutu" : (game.relUSA < 30 ? "Musuh" : "Netral");
  document.getElementById("rel-ussr").innerText = game.relUSSR > 60 ? "Sekutu" : (game.relUSSR < 30 ? "Musuh" : "Netral");

  // Status Ekspor Minyak
  if (game.unSanctions >= 100) {
    document.getElementById("oil-status-text").innerText = " Pendapatan: $0/dtk (TERKENA EMBARGO TOTAL PBB!)";
  } else {
    document.getElementById("oil-status-text").innerText = ` Pendapatan Bersih: +$${(game.oilLevel * 10 * (1 - game.unSanctions/100)).toFixed(1)}M/dtk`;
  }
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
