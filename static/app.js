import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const auth = window.auth;
const provider = window.provider;
const API = "/items";
const ADMIN_EMAIL = "abdulwajidm0@gmail.com";

/* ================= DOM ================= */
const loginScreen = document.getElementById("loginScreen");
const appContent = document.getElementById("appContent");
const loginBtn = document.getElementById("loginBtnBig");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");

const itemForm = document.getElementById("itemForm");
const lostList = document.getElementById("lostList");
const foundList = document.getElementById("foundList");
const reportedList = document.getElementById("reportedList");
const resetAllBtn = document.getElementById("resetAll");

/* ================= AUTH ================= */
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert(e.message);
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginScreen.style.display = "none";
    appContent.style.display = "block";
    userInfo.textContent = `Hello, ${user.displayName}`;
  } else {
    loginScreen.style.display = "flex";
    appContent.style.display = "none";
    userInfo.textContent = "";
  }
});

/* ================= LOAD ITEMS ================= */
async function loadItems() {
  const res = await fetch(API);
  const items = await res.json();

  lostList.innerHTML = "";
  foundList.innerHTML = "";
  reportedList.innerHTML = "";

  items.forEach(item => {
    const li = renderItem(item);

    if (item.reported) {
      reportedList.appendChild(li);
    } else if (item.type === "lost") {
      lostList.appendChild(li);
    } else {
      foundList.appendChild(li);
    }
  });
}

/* ================= RENDER ITEM ================= */
function renderItem(item) {
  const li = document.createElement("li");
  li.className = "item-card";

  const user = auth.currentUser;
  const isOwner = user && user.uid === item.ownerId;
  const isAdmin = user && user.email === ADMIN_EMAIL;

  li.innerHTML = `
    <span class="badge ${item.type}">${item.type}</span>
    ${item.claimed ? `<span class="badge claimed">Claimed</span>` : ""}
    ${item.reported ? `<span class="badge reported">Reported</span>` : ""}
    <h3>${item.title}</h3>
    <p>${item.desc || ""}</p>
    <p><b>Location:</b> ${item.location || ""} • <b>Date:</b> ${item.date || ""}</p>
    <p><b>Contact:</b> ${item.contact || ""}</p>
    ${item.photo ? `<img src="${item.photo}" width="120">` : ""}
    <div class="item-actions">
      ${!item.claimed ? `<button class="claimBtn">Mark Claimed</button>` : ""}
      <button class="reportBtn">Report</button>
      ${(isOwner || isAdmin) ? `<button class="deleteBtn">Delete</button>` : ""}
    </div>
  `;

  /* CLAIM */
  li.querySelector(".claimBtn")?.addEventListener("click", async () => {
    await fetch(`${API}/${item.id}/claim`, { method: "PUT" });
    loadItems();
  });

  /* REPORT */
  li.querySelector(".reportBtn")?.addEventListener("click", async () => {
    await fetch(`${API}/${item.id}/report`, { method: "PUT" });
    loadItems();
  });

  /* DELETE */
  li.querySelector(".deleteBtn")?.addEventListener("click", async () => {
    if (!confirm("Delete this item?")) return;

    await fetch(`${API}/${item.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: auth.currentUser.uid,
        email: auth.currentUser.email
      })
    });

    loadItems();
  });

  return li;
}

/* ================= ADD ITEM ================= */
itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!auth.currentUser) {
    alert("Login required");
    return;
  }

  const newItem = {
    type: itemType.value,
    title: title.value.trim(),
    desc: description.value.trim(),
    location: location.value.trim(),
    date: date.value || new Date().toISOString().slice(0, 10),
    contact: contact.value.trim(),
    photo: photo.value.trim(),
    claimed: false,
    reported: false,
    created: Date.now(),
    ownerId: auth.currentUser.uid
  };

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newItem)
  });

  itemForm.reset();
  loadItems();
});

/* ================= RESET ALL (ADMIN) ================= */
resetAllBtn?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) {
    alert("Only admin can reset");
    return;
  }

  if (!confirm("Delete ALL items?")) return;

  const res = await fetch(API);
  const items = await res.json();

  for (const item of items) {
    await fetch(`${API}/${item.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.uid,
        email: user.email
      })
    });
  }

  loadItems();
});

/* ================= INITIAL LOAD ================= */
loadItems();
