const state={
  year:1900,q:1,cash:100000,influence:10,rep:70,selected:null,
  market:{Oil:82,Iron:54,Food:31},
  countries:[
    {id:"aurora",name:"Aurora",x:8,y:15,w:25,h:30,res:"Oil",gdp:420000,stability:78,stock:38},
    {id:"borealis",name:"Borealis",x:38,y:8,w:27,h:34,res:"Iron",gdp:310000,stability:64,stock:44},
    {id:"crown",name:"Crownland",x:68,y:18,w:25,h:31,res:"Food",gdp:510000,stability:82,stock:52},
    {id:"meridia",name:"Meridia",x:20,y:51,w:28,h:37,res:"Iron",gdp:270000,stability:58,stock:36},
    {id:"sundar",name:"Sundar",x:55,y:55,w:27,h:36,res:"Oil",gdp:390000,stability:71,stock:47}
  ],
  holdings:{}
};

const $=id=>document.getElementById(id);
const money=n=>"$"+Math.round(n).toLocaleString("en-US");

function log(t){$("log").insertAdjacentHTML("afterbegin",`<div>${t}</div>`)}

function renderMap(){
  $("map").innerHTML="";
  state.countries.forEach(c=>{
    const el=document.createElement("div");
    el.className="region"+(state.selected===c.id?" selected":"");
    el.style.left=c.x+"%";el.style.top=c.y+"%";el.style.width=c.w+"%";el.style.height=c.h+"%";
    el.innerHTML=`${c.name}<span class="tag">🏭 ${c.res} • Stability ${c.stability}%</span>`;
    el.onclick=()=>selectCountry(c.id);
    $("map").appendChild(el);
  });
}

function selectCountry(id){
  state.selected=id; const c=state.countries.find(x=>x.id===id);
  $("countryName").textContent=c.name;
  $("countryInfo").innerHTML=`GDP ${money(c.gdp)}<br>Resource utama: <b>${c.res}</b><br>Stability: ${c.stability}%<br>Your ownership: ${state.holdings[id]||0}%`;
  $("actions").innerHTML=`
    <button class="action" onclick="buyStock('${id}',10)">📈 Beli 10% saham — ${money(c.gdp*.08)}</button>
    <button class="action" onclick="buildFactory('${id}')">🏭 Bangun pabrik — $20,000</button>
    <button class="action" onclick="lobby('${id}')">🏛️ Lobby pemerintah — $8,000</button>`;
  renderMap();
}

function buyStock(id,pct){
  const c=state.countries.find(x=>x.id===id), cost=c.gdp*.08*(pct/10);
  if(state.cash<cost){log("❌ Modal tidak cukup.");return}
  state.cash-=cost; state.holdings[id]=(state.holdings[id]||0)+pct; state.influence+=pct;
  log(`📈 Kamu membeli ${pct}% saham ${c.name}.`);
  selectCountry(id); render();
}

function buildFactory(id){
  if(state.cash<20000){log("❌ Modal tidak cukup.");return}
  state.cash-=20000; state.influence+=2;
  const c=state.countries.find(x=>x.id===id); c.gdp+=30000;
  log(`🏭 Pabrik baru berdiri di ${c.name}. GDP naik.`);
  selectCountry(id);render();
}

function lobby(id){
  if(state.cash<8000){log("❌ Modal tidak cukup.");return}
  state.cash-=8000;state.influence+=5;state.rep-=1;
  const c=state.countries.find(x=>x.id===id);c.stability=Math.max(0,c.stability-2);
  log(`🏛️ Lobby berhasil di ${c.name}. Pengaruh +5.`);
  selectCountry(id);render();
}

function advanceQuarter(){
  state.q++;
  if(state.q>4){state.q=1;state.year++}
  let income=0;
  state.countries.forEach(c=>{
    const own=state.holdings[c.id]||0;
    income+=c.gdp*(own/100)*.012;
  });
  state.cash+=income;
  Object.keys(state.market).forEach(k=>{
    state.market[k]=Math.max(10,Math.round(state.market[k]*(.96+Math.random()*.10)));
  });
  const events=[
    "Pasar global bergerak normal.",
    "Bank menaikkan kredit industri.",
    "Permintaan komoditas meningkat.",
    "Investor asing masuk ke pasar.",
    "Serikat pekerja menuntut upah lebih tinggi."
  ];
  log(`📅 ${state.year} Q${state.q}: ${events[Math.floor(Math.random()*events.length)]}`);
  render();
}

function render(){
  $("clock").textContent=`Year ${state.year} • Q${state.q}`;
  $("cash").textContent=money(state.cash);
  let income=0;state.countries.forEach(c=>income+=c.gdp*((state.holdings[c.id]||0)/100)*.012);
  $("income").textContent=money(income)+"/q";
  $("influence").textContent=Math.round(state.influence);
  $("rep").textContent=Math.round(state.rep);
  $("market").innerHTML=Object.entries(state.market).map(([k,v])=>`<div class="marketrow"><span>${k}</span><b>$${v}</b></div>`).join("");
  renderMap();
}
log("Selamat datang, calon plutokrat. Klik wilayah untuk mulai berinvestasi.");
render();
setInterval(advanceQuarter,8000);
