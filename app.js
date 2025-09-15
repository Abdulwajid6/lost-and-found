// app.js — Lost & Found with Report Feature
(function(){
  const STORAGE_KEY = 'lh_items_v1';
  const REPORT_KEY = 'lh_reports_v1';
  let items = [];
  let reports = [];

  const qs = s => document.querySelector(s);
  const qsa = s => document.querySelectorAll(s);

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

  // Utils
  function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  function saveReports(){ localStorage.setItem(REPORT_KEY, JSON.stringify(reports)); }
  function load(){
    items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    reports = JSON.parse(localStorage.getItem(REPORT_KEY)) || [];
    if(items.length===0) seedDemo();
  }
  function seedDemo(){
    items = [
      { id: uid(), type: 'Lost', title: 'Black Wallet', desc:'Leather wallet with student id', location:'Library', date: new Date().toISOString().slice(0,10), contact:'9876543210', photo:'', claimed:false, created:Date.now() },
      { id: uid(), type: 'Found', title: 'Silver Keychain', desc:'Small key with red ribbon', location:'Cafeteria', date: new Date().toISOString().slice(0,10), contact:'found@college.edu', photo:'', claimed:false, created:Date.now() }
    ];
    save();
  }

  function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  function addItem(item){ items.unshift(item); save(); renderLists(); }
  function markClaimed(id){ const it = items.find(x=>x.id===id); if(it){ it.claimed=true; save(); renderLists(); } }
  function deleteItem(id){ items = items.filter(x=>x.id!==id); save(); renderLists(); }
  function reportItem(id){
    const it = items.find(x=>x.id===id);
    if(!it) return;
    reports.unshift({ ...it, reportedAt: new Date().toISOString() });
    saveReports();
    renderReports();
    alert("Item reported!");
  }

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
      const li = document.createElement('li');
      li.className = 'item-card';
      li.innerHTML = `
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
      if(it.type==='Lost') lostList.appendChild(li);
      else foundList.appendChild(li);
    });

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

  // Form submit
  itemForm.addEventListener('submit', e=>{
    e.preventDefault();
    const item={
      id: uid(),
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
    addItem(item);
    itemForm.reset();
  });

  clearFormBtn.addEventListener('click', ()=>itemForm.reset());
  searchInput.addEventListener('input', renderLists);
  filterSelect.addEventListener('change', renderLists);
  exportBtn.addEventListener('click', ()=>{
    const blob=new Blob([JSON.stringify(items,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download='lost-found-export.json'; a.click(); URL.revokeObjectURL(url);
  });
  importBtn.addEventListener('click', ()=>importFile.click());
  importFile.addEventListener('change', e=>{
    const f=e.target.files[0]; if(!f) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const parsed=JSON.parse(ev.target.result);
        if(!Array.isArray(parsed)) throw new Error('Invalid JSON');
        const existingIds=new Set(items.map(i=>i.id));
        parsed.forEach(p=>{ if(!existingIds.has(p.id)) items.push(p); });
        save(); renderLists(); alert('Import done.');
      }catch(err){ alert('Import failed: '+err.message); }
    };
    reader.readAsText(f); importFile.value='';
  });
  resetAllBtn.addEventListener('click', ()=>{
    if(confirm('Erase all data?')){ 
      items=[]; reports=[]; 
      save(); saveReports(); 
      renderLists(); renderReports(); 
    }
  });

  // Init
  load();
  renderLists();
  renderReports();
})();

