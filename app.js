// app.js — localStorage-powered Lost & Found demo
(function(){
const STORAGE_KEY = 'lh_items_v1';
let items = [];


const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);


const itemForm = qs('#itemForm');
const typeEl = qs('#type');
const titleEl = qs('#title');
const descEl = qs('#desc');
const locationEl = qs('#location');
const dateEl = qs('#date');
const contactEl = qs('#contact');
const photoEl = qs('#photo');
const clearFormBtn = qs('#clearForm');


const searchInput = qs('#searchInput');
const filterSelect = qs('#filterSelect');
const exportBtn = qs('#exportBtn');
const importBtn = qs('#importBtn');
const importFile = qs('#importFile');
const resetAllBtn = qs('#resetAll');


const lostList = qs('#lostList');
const foundList = qs('#foundList');


function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
function load(){ const raw = localStorage.getItem(STORAGE_KEY); items = raw ? JSON.parse(raw) : []; if(items.length===0) seedDemo(); }


function seedDemo(){
    items = [
{ id: uid(), type: 'Lost', title: 'Black Wallet', desc:'Leather wallet with student id', location:'Library', date: new Date().toISOString().slice(0,10), contact:'9876543210', photo:'', claimed:false, created:Date.now()},
{ id: uid(), type: 'Found', title: 'Silver Keychain', desc:'Small key with red ribbon', location:'Cafeteria', date: new Date().toISOString().slice(0,10), contact:'found@college.edu', photo:'', claimed:false, created:Date.now()}
];
save();
}


function addItem(item){ items.unshift(item); save(); renderLists(); }


function renderLists(){
const q = searchInput.value.trim().toLowerCase();
const filter = filterSelect.value;


lostList.innerHTML = '';
foundList.innerHTML = '';


const filtered = items.filter(it => {
if(filter==='all') return true;
if(filter==='claimed') return !!it.claimed;
return it.type === filter;
}).filter(it => {
if(!q) return true;
return (it.title+' '+it.desc+' '+it.location+' '+it.contact).toLowerCase().includes(q);
});


filtered.forEach(it => {
const li = document.createElement('li');
li.className = 'item';
li.innerHTML = `
<div class="item-main">
${it.photo ? `<img src="${it.photo}" alt="${it.title} photo" class="thumb">` : ''}
<div>
<strong>${escapeHtml(it.title)}</strong>
<div class="meta">${escapeHtml(it.location)} • ${escapeHtml(it.date || '')}</div>
<div class="desc">${escapeHtml(it.desc)}</div>
<div class="contact">Contact: ${escapeHtml(it.contact || '-')}</div>
</div>
</div>
<div class="item-actions">
${it.claimed ? '<span class="badge">Claimed</span>' : `<button data-id="${it.id}" class="btn tiny claimBtn">Mark Claimed</button>`}
<button data-id="${it.id}" class="btn tiny deleteBtn ghost">Delete</button>
</div>
`;


if(it.type === 'Lost') lostList.appendChild(li);
else foundList.appendChild(li);
});

qsa('.claimBtn').forEach(b => b.addEventListener('click', e => { const id = e.currentTarget.dataset.id; markClaimed(id); }));
qsa('.deleteBtn').forEach(b => b.addEventListener('click', e => { const id = e.currentTarget.dataset.id; if(confirm('Delete this item?')) deleteItem(id); }));
}


function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }


function markClaimed(id){ const it = items.find(x=>x.id===id); if(!it) return; it.claimed = true; save(); renderLists(); }
function deleteItem(id){ items = items.filter(x => x.id !== id); save(); renderLists(); }


itemForm.addEventListener('submit', e => {
e.preventDefault();
const item = {
id: uid(),
type: typeEl.value,
title: titleEl.value.trim(),
desc: descEl.value.trim(),
location: locationEl.value.trim(),
date: dateEl.value || new Date().toISOString().slice(0,10),
contact: contactEl.value.trim(),
photo: photoEl.value.trim(),
claimed: false,
created: Date.now()
};
if(!item.title){ alert('Please enter a title'); return; }
addItem(item);
itemForm.reset();
typeEl.focus();
});


clearFormBtn.addEventListener('click', ()=> itemForm.reset());
searchInput.addEventListener('input', renderLists);
filterSelect.addEventListener('change', renderLists);
exportBtn.addEventListener('click', ()=>{
const blob = new Blob([JSON.stringify(items, null, 2)], {type:'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = 'lost-found-export.json'; a.click(); URL.revokeObjectURL(url);
});


importBtn.addEventListener('click', ()=> importFile.click());
importFile.addEventListener('change', e => {
const f = e.target.files[0]; if(!f) return;
const reader = new FileReader();
reader.onload = ev => {
try{
const parsed = JSON.parse(ev.target.result);
if(!Array.isArray(parsed)) throw new Error('JSON must be an array');
const existingIds = new Set(items.map(i=>i.id));
parsed.forEach(p => { if(!existingIds.has(p.id)) items.push(p); });
save(); renderLists(); alert('Import finished. Merged items.');
}catch(err){ alert('Import failed: '+err.message); }
};
reader.readAsText(f);
importFile.value='';
});


resetAllBtn.addEventListener('click', ()=>{ if(confirm('Erase all saved items?')){ items=[]; save(); renderLists(); } });


// init
load();
renderLists();
})();