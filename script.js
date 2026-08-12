/* ---------------- DATA ---------------- */
const MENU = [
  {id:1, name:"Nasi Goreng Spesial", cat:"berat", price:12000, icon:"🍳", rekomendasi:true},
  {id:2, name:"Mie Ayam Bakso", cat:"berat", price:11000, icon:"🍜"},
  {id:3, name:"Nasi Padang", cat:"berat", price:15000, icon:"🍛"},
  {id:4, name:"Soto Ayam", cat:"berat", price:10000, icon:"🥣"},
  {id:5, name:"Sate Ayam", cat:"berat", price:13000, icon:"🍢", rekomendasi:true},
  {id:6, name:"Pisang Goreng", cat:"cemilan", price:5000, icon:"🍌"},
  {id:7, name:"Gorengan Campur", cat:"cemilan", price:4000, icon:"🥟"},
  {id:8, name:"Risoles", cat:"cemilan", price:4500, icon:"🥐"},
  {id:9, name:"Es Teh Manis", cat:"minuman", price:4000, icon:"🧋"},
  {id:10, name:"Es Jeruk", cat:"minuman", price:5000, icon:"🍊"},
  {id:11, name:"Teh Botol", cat:"minuman", price:5000, icon:"🥤"},
  {id:12, name:"Air Mineral", cat:"minuman", price:3000, icon:"💧"},
];
const CATS = [
  {id:"semua", label:"Semua"},
  {id:"berat", label:"Makanan Berat"},
  {id:"cemilan", label:"Cemilan"},
  {id:"minuman", label:"Minuman"},
];

let state = {
  cart: {},        // id -> qty
  activeCat: "semua",
  nama: "",
  kelas: "",
  orderId: "",
  countdownTimer: null,
};

/* ---------------- HELPERS ---------------- */
function rupiah(n){ return "Rp" + n.toLocaleString("id-ID"); }
function cartItems(){
  return Object.entries(state.cart)
    .filter(([id,qty]) => qty > 0)
    .map(([id,qty]) => ({...MENU.find(m=>m.id==id), qty}));
}
function cartTotal(){ return cartItems().reduce((s,i)=>s+i.price*i.qty,0); }
function cartCount(){ return cartItems().reduce((s,i)=>s+i.qty,0); }
function genOrderId(){
  const n = Math.floor(1000+Math.random()*9000);
  return "KTN-" + n + "-" + new Date().getDate().toString().padStart(2,"0");
}

/* ---------------- RENDER: RECOMMENDATION ---------------- */
function renderRekom(){
  const items = MENU.filter(m=>m.rekomendasi);
  if(!items.length){ document.getElementById('rekomWrap').innerHTML=""; return; }
  const it = items[0];
  document.getElementById('rekomWrap').innerHTML = `
    <div class="rekom-card">
      <div class="rekom-eyebrow">Rekomendasi hari ini</div>
      <div class="rekom-name">${it.icon} ${it.name}</div>
      <div class="rekom-price">${rupiah(it.price)}</div>
      <button class="rekom-add" onclick="addItem(${it.id})">+ Tambah</button>
    </div>`;
}

/* ---------------- RENDER: TABS + MENU ---------------- */
function renderTabs(){
  document.getElementById('tabs').innerHTML = CATS.map(c => `
    <button class="tab ${state.activeCat===c.id?'active':''}" onclick="setCat('${c.id}')">${c.label}</button>
  `).join("");
}
function setCat(id){ state.activeCat = id; renderTabs(); renderMenu(); }

function renderMenu(){
  const list = MENU.filter(m => state.activeCat==="semua" || m.cat===state.activeCat);
  document.getElementById('menuGrid').innerHTML = list.map(m => {
    const qty = state.cart[m.id] || 0;
    return `
    <div class="menu-card">
      <div class="menu-icon">${m.icon}</div>
      <div class="menu-name">${m.name}</div>
      <div class="menu-cat">${CATS.find(c=>c.id===m.cat).label}</div>
      <div class="menu-price">${rupiah(m.price)}</div>
      <div class="menu-footer">
        ${qty === 0
          ? `<button class="add-btn" onclick="addItem(${m.id})">+ Tambah</button>`
          : `<div class="qty-stepper">
               <button onclick="changeQty(${m.id},-1)">−</button>
               <span>${qty}</span>
               <button onclick="changeQty(${m.id},1)">+</button>
             </div>`
        }
      </div>
    </div>`;
  }).join("");
}

function addItem(id){ state.cart[id] = (state.cart[id]||0)+1; renderMenu(); renderFloatCart(); renderCartBadge(); }
function changeQty(id, delta){
  state.cart[id] = Math.max(0, (state.cart[id]||0)+delta);
  renderMenu(); renderFloatCart(); renderCartBadge();
}

function renderFloatCart(){
  const el = document.getElementById('floatCart');
  const count = cartCount();
  if(count>0 && document.getElementById('screen-dashboard').classList.contains('active')){
    el.classList.add('show');
    document.getElementById('fcTotal').textContent = rupiah(cartTotal());
    document.getElementById('fcCount').textContent = count + " item di keranjang";
  } else {
    el.classList.remove('show');
  }
}
function renderCartBadge(){
  const badge = document.getElementById('cartBadge');
  const count = cartCount();
  if(count>0){ badge.style.display='flex'; badge.textContent = count; }
  else { badge.style.display='none'; }
}

/* ---------------- RENDER: TICKET (cart / checkout) ---------------- */
function ticketHtml(editable, eyebrow){
  const items = cartItems();
  if(items.length===0){
    return `<div class="ticket"><div class="ticket-body" style="text-align:center;padding:30px 18px;color:var(--steel);font-size:13px;">
      Keranjang masih kosong. Yuk pilih menu dulu.
    </div></div>`;
  }
  const rows = items.map(i => `
    <div class="ticket-row">
      <div>
        <div class="item-name">${i.icon} ${i.name}</div>
        <div class="item-sub">${i.qty} × ${rupiah(i.price)}</div>
        ${editable ? `<button class="item-remove" onclick="changeQty(${i.id},-${i.qty})">Hapus</button>` : ``}
      </div>
      <div class="mono" style="font-weight:700;font-size:13px;">${rupiah(i.price*i.qty)}</div>
    </div>
  `).join("");
  return `
    <div class="ticket">
      <div class="ticket-head"><span class="ticket-eyebrow">${eyebrow}</span></div>
      <div class="ticket-body">${rows}</div>
      <div class="ticket-total"><span>Total</span><b>${rupiah(cartTotal())}</b></div>
      <div class="notch left"></div><div class="notch right"></div>
    </div>`;
}

function renderCartScreen(){
  document.getElementById('cartTicket').innerHTML = ticketHtml(true, "Struk sementara");
  document.getElementById('toFormBtn').disabled = cartCount()===0;
  document.getElementById('toFormBtn').style.opacity = cartCount()===0 ? 0.45 : 1;
}
function renderCheckoutScreen(){
  let html = ticketHtml(false, "Ringkasan pesanan");
  html += `<div class="ticket" style="margin-top:12px;"><div class="ticket-body">
    <div class="ticket-row"><span class="item-name" style="font-weight:600;">Nama</span><span>${state.nama}</span></div>
    <div class="ticket-row"><span class="item-name" style="font-weight:600;">Kelas</span><span>${state.kelas}</span></div>
  </div></div>`;
  document.getElementById('checkoutTicket').innerHTML = html;
}

/* ---------------- NAV ---------------- */
function goTo(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  document.getElementById('rekomWrap').style.display = name==='dashboard' ? 'block' : 'none';
  if(name==='cart') renderCartScreen();
  if(name==='dashboard'){ renderMenu(); }
  renderFloatCart();
  window.scrollTo({top:0,behavior:'smooth'});
}

function goToForm(){
  if(cartCount()===0) return;
  goTo('form');
}

function submitForm(){
  const nama = document.getElementById('inputNama').value.trim();
  const kelas = document.getElementById('inputKelas').value.trim();
  let ok = true;
  document.getElementById('fieldNama').classList.toggle('err', !nama);
  document.getElementById('fieldKelas').classList.toggle('err', !kelas);
  if(!nama || !kelas) ok = false;
  if(!ok) return;
  state.nama = nama; state.kelas = kelas;
  renderCheckoutScreen();
  goTo('checkout');
}

/* ---------------- QR (visual simulation) ---------------- */
function drawFakeQr(seedStr){
  let seed = 0;
  for(let i=0;i<seedStr.length;i++) seed = (seed*31 + seedStr.charCodeAt(i)) >>> 0;
  function rand(){ seed = (seed*1103515245+12345) >>> 0; return (seed/4294967295); }
  const size = 15, cell = 9;
  let rects = "";
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const inFinder = (x<4&&y<4)||(x>size-5&&y<4)||(x<4&&y>size-5);
      if(inFinder) continue;
      if(rand()>0.55) rects += `<rect x="${x*cell}" y="${y*cell}" width="${cell}" height="${cell}" fill="#232019"/>`;
    }
  }
  function finder(fx,fy){
    return `<rect x="${fx}" y="${fy}" width="${4*cell}" height="${4*cell}" fill="#232019"/>
            <rect x="${fx+cell}" y="${fy+cell}" width="${2*cell}" height="${2*cell}" fill="#FBF6EA"/>`;
  }
  const svg = `<svg width="${size*cell}" height="${size*cell}" viewBox="0 0 ${size*cell} ${size*cell}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#fff"/>
    ${rects}
    ${finder(0,0)}${finder((size-4)*cell,0)}${finder(0,(size-4)*cell)}
  </svg>`;
  document.getElementById('qrFrame').innerHTML = svg;
}

function startCountdown(){
  clearInterval(state.countdownTimer);
  let secs = 15*60;
  const el = document.getElementById('countdown');
  function tick(){
    const m = Math.floor(secs/60).toString().padStart(2,'0');
    const s = (secs%60).toString().padStart(2,'0');
    el.textContent = `${m}:${s}`;
    if(secs<=0){ clearInterval(state.countdownTimer); }
    secs--;
  }
  tick();
  state.countdownTimer = setInterval(tick, 1000);
}

/* override goTo to prep qris screen */
const _goTo = goTo;
goTo = function(name){
  _goTo(name);
  if(name==='qris'){
    if(!state.orderId) state.orderId = genOrderId();
    document.getElementById('qrisTotal').textContent = rupiah(cartTotal());
    document.getElementById('qrisOrderId').textContent = state.orderId;
    drawFakeQr(state.orderId + cartTotal());
    startCountdown();
  }
};

/* ---------------- VERIFY / RESULT ---------------- */
function verify(success){
  clearInterval(state.countdownTimer);
  goTo('verify');
  setTimeout(()=>{
    if(success){
      goTo('processing');
      setTimeout(()=>{
        document.getElementById('successOrderId').textContent = state.orderId;
        document.getElementById('successSub').textContent =
          `Terima kasih, ${state.nama} (${state.kelas}). Tunjukkan kode ini ke petugas kantin saat mengambil pesanan.`;
        goTo('success');
        showToast(true, "Pembayaran berhasil diverifikasi");
      }, 1400);
    } else {
      goTo('failed');
      showToast(false, "Pembayaran gagal diverifikasi");
    }
  }, 1600);
}

function showToast(ok, msg){
  const t = document.getElementById('toast');
  t.className = 'toast ' + (ok ? 'ok' : 'bad') + ' show';
  t.textContent = (ok ? '✓ ' : '✕ ') + msg;
  setTimeout(()=>t.classList.remove('show'), 2600);
}

function resetApp(){
  state.cart = {};
  state.nama = ""; state.kelas = ""; state.orderId = "";
  document.getElementById('inputNama').value = "";
  document.getElementById('inputKelas').value = "";
  document.getElementById('fieldNama').classList.remove('err');
  document.getElementById('fieldKelas').classList.remove('err');
  renderCartBadge();
  goTo('dashboard');
}

/* ---------------- INIT ---------------- */
renderRekom();
renderTabs();
renderMenu();
renderFloatCart();
