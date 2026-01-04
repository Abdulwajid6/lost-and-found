import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const auth = window.auth;
const provider = new GoogleAuthProvider();
const API = "/items";

// ================= LOGIN =================
loginBtnBig.onclick = () => {
  signInWithRedirect(auth, provider);
};

getRedirectResult(auth).catch(console.error);

// ================= LOGOUT =================
logoutBtn.onclick = async () => {
  await signOut(auth);
};

// ================= AUTH STATE =================
onAuthStateChanged(auth, (user) => {
  loginScreen.style.display = user ? "none" : "flex";
  appContent.style.display = user ? "block" : "none";
  userInfo.textContent = user ? `Hello, ${user.displayName}` : "";
  loadItems();
});

// ================= ADD ITEM =================
itemForm.onsubmit = async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return alert("Login required");

  const item = {
    type: itemType.value,
    title: title.value,
    desc: description.value,
    location: location.value,
    date: date.value,
    contact: contact.value,
    photo: photo.value,
    claimed: false,
    reported: false,
    ownerId: user.uid,
    created: Date.now()
  };

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  });

  itemForm.reset();
  loadItems();
};

// ================= LOAD ITEMS =================
async function loadItems() {
  const res = await fetch(API);
  const items = await res.json();

  lostList.innerHTML = "";
  foundList.innerHTML = "";
  reportedList.innerHTML = "";

  const user = auth.currentUser;

  items.forEach(item => {
    const li = document.createElement("li");
    li.className = "item-card";

    const isOwner = user && user.uid === item.ownerId;
    const isAdmin = user && user.email === "abdulwajidm0@gmail.com";

    li.innerHTML = `
      <span class="badge ${item.type}">${item.type}</span>
      ${item.claimed ? `<span class="badge claimed">Claimed</span>` : ""}
      ${item.reported ? `<span class="badge reported">Reported</span>` : ""}
      <h3>${item.title}</h3>
      <p>${item.desc || ""}</p>

      <div class="item-actions">
        ${!item.claimed ? `<button class="claimBtn">Mark Claimed</button>` : ""}
        <button class="reportBtn">Report</button>
        ${(isOwner || isAdmin) ? `<button class="deleteBtn">Delete</button>` : ""}
      </div>
    `;

    // ===== CLAIM =====
    li.querySelector(".claimBtn")?.addEventListener("click", async () => {
      await fetch(`${API}/${item.id}/claim`, { method: "PUT" });
      loadItems();
    });

    // ===== REPORT =====
    li.querySelector(".reportBtn")?.addEventListener("click", async () => {
      await fetch(`${API}/${item.id}/report`, { method: "PUT" });
      loadItems();
    });

    // ===== DELETE (FIXED) =====
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

    if (item.reported) reportedList.appendChild(li);
    else if (item.type === "lost") lostList.appendChild(li);
    else foundList.appendChild(li);
  });
}

loadItems();
