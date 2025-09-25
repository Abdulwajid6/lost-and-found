// ✅ Firebase Firestore imports
import {
  collection, addDoc, getDocs, onSnapshot,
  updateDoc, deleteDoc, doc, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const db = window.db; // from index.html
const itemsRef = collection(db, "items");
const reportsRef = collection(db, "reports");

// Local arrays (synced with Firestore)
let items = [];
let reports = [];

// Helpers
const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);
function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

// Elements
const itemForm = qs('#itemForm');
const typeEl = qs('#itemType');
const titleEl = qs('#title');
const descEl = qs('#description');
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
const reportedList = qs('#reportedList');

// ================= CRUD =================
async function addItem(item){
  await addDoc(itemsRef, item);
}

async function markClaimed(id){
  try {
    const d = doc(db,"items",id);
    await updateDoc(d,{ claimed:true });
    alert("Item marked as claimed!");
  } catch(err) {
    console.error("Error marking claimed:", err);
  }
}

async function deleteItem(id){
  try {
    const d = doc(db,"items",id);
    await deleteDoc(d);
    alert("Item deleted.");
  } catch(err) {
    console.error("Error deleting item:", err);
  }
}

async function reportItem(id){
  try {
    const it = items.find(x=>x.id===id);
    if(!it) return;
    await addDoc(reportsRef,{ 
      ...it, 
      reportedItemId: id, 
      reportedAt: new Date().toISOString() 
    });
    alert("Item reported!");
  } catch(err){
    console.error("Error reporting item:", err);
  }
}

// ================= RENDER =================
function renderLists(){
  const q = searchInput.value.trim().toLowerCase();
  const filter = filterSelect.value;
  lostList.innerHTML = '';
  foundList.innerHTML = '';

  const filtered = items.filter(it=>{
    if(filter==='all') return true;
    if(filter==='claimed') return !!it.claimed;
    return it.type===filter;
  }).filter(it=>{
    if(!q) return true;
    return (it.title+' '+it.desc+' '+it.location+' '+it.contact).toLowerCase().includes(q);
  });

  filtered.forEach(it=>{
    const li=document.createElement('li');
    li.className='item-card';
    li.innerHTML=`
      <span class="badge ${it.type.toLowerCase()}">${it.type}</span>
      ${it.claimed ? '<span class="badge claimed">Claimed</span>' : ''}
      <h3>${escapeHtml(it.title)}</h3>
      <p>${escapeHtml(it.desc)}</p>
      <p><strong>Location:</strong> ${escapeHtml(it.location)} • <strong>Date:</strong> ${escapeHtml(it.date||'')}</p>
      <p><strong>Contact:</strong> ${escapeHtml(it.contact||'-')}</p>
      ${it.photo ? `<img src="${escapeHtml(it.photo)}" alt="${escapeHtml(it.title)}" width="120">` : ""}
      <div>
        ${!it.claimed ? `<button data-id="${it.id}" class="claimBtn">Mark Claimed</button>` : ""}
        <button data-id="${it.id}" class="reportBtn">Report</button>
        <button data-id="${it.id}" class="deleteBtn delete">Delete</button>
      </div>
    `;
    if(it.type==='lost') lostList.appendChild(li);
    else foundList.appendChild(li);
  });

  // ✅ Attach event listeners using Firestore IDs
  qsa('.claimBtn').forEach(b=>b.onclick=()=>markClaimed(b.dataset.id));
  qsa('.deleteBtn').forEach(b=>b.onclick=()=>{ if(confirm('Delete item?')) deleteItem(b.dataset.id); });
  qsa('.reportBtn').forEach(b=>b.onclick=()=>reportItem(b.dataset.id));
}

function renderReports(){
  reportedList.innerHTML='';
  if(reports.length===0){
    reportedList.innerHTML='<li>No reports yet.</li>';
    return;
  }
  reports.forEach(r=>{
    const li=document.createElement('li');
    li.className='item-card';
    li.innerHTML=`
      <span class="badge reported">Reported</span>
      <h3>${escapeHtml(r.title)}</h3>
      <p>${escapeHtml(r.desc)}</p>
      <p><strong>Location:</strong> ${escapeHtml(r.location)} • <strong>Date:</strong> ${escapeHtml(r.date||'')}</p>
      <p><strong>Reported At:</strong> ${escapeHtml(r.reportedAt)}</p>
    `;
    reportedList.appendChild(li);
  });
}

// ================= FORM =================
itemForm.addEventListener('submit', async e=>{
  e.preventDefault();
  const item={
    type: typeEl.value,
    title: titleEl.value.trim(),
    desc: descEl.value.trim(),
    location: locationEl.value.trim(),
    date: dateEl.value||new Date().toISOString().slice(0,10),
    contact: contactEl.value.trim(),
    photo: photoEl.value.trim(),
    claimed:false,
    created:Date.now()
  };
  if(!item.title){ alert('Please enter a title'); return; }
  await addItem(item);
  itemForm.reset();
});
clearFormBtn.addEventListener('click',()=>itemForm.reset());

// ================= SEARCH & FILTER =================
searchInput.addEventListener('input',renderLists);
filterSelect.addEventListener('change',renderLists);

// ================= EXPORT / IMPORT =================
exportBtn.addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(items,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='lost-found-export.json'; a.click(); URL.revokeObjectURL(url);
});
importBtn.addEventListener('click',()=>importFile.click());
importFile.addEventListener('change',async e=>{
  const f=e.target.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload=async ev=>{
    try{
      const parsed=JSON.parse(ev.target.result);
      if(!Array.isArray(parsed)) throw new Error('Invalid JSON');
      for(const p of parsed){ await addItem(p); }
      alert('Import done.');
    }catch(err){ alert('Import failed: '+err.message); }
  };
  reader.readAsText(f); importFile.value='';
});
resetAllBtn.addEventListener('click',async()=>{
  if(confirm('Erase all data?')){
    try {
      for(const it of items){
        await deleteItem(it.id);
      }
      for(const r of reports){
        await deleteDoc(doc(db,"reports",r.id));
      }
      alert("All data erased.");
    } catch(err) {
      console.error("Reset failed:", err);
    }
  }
});

// ================= REAL-TIME SYNC =================
onSnapshot(query(itemsRef,orderBy("created","desc")),snap=>{
  items=snap.docs.map(d=>({id:d.id,...d.data()})); // ✅ keep Firestore ID
  renderLists();
});
onSnapshot(query(reportsRef,orderBy("reportedAt","desc")),snap=>{
  reports=snap.docs.map(d=>({id:d.id,...d.data()}));
  renderReports();
});





