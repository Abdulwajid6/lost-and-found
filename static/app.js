import {
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const auth = window.auth;
const provider = window.provider;
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
  if (user) loadItems();
});

// ================= ADD ITEM =================
itemForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!auth.currentUser) return alert("Login required");

  const item = {
    type: itemType.value,
    title: title.value,
    ownerId: auth.currentUser.uid,
    created: Date.now(),
    claimed: false,
    reported: false
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

  lostList.innerHTML = foundList.innerHTML = reportedList.innerHTML = "";

  const user = auth.currentUser;

  items.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.title}
      ${!item.claimed ? `<button class="claim">Claim</button>` : ""}
      <button class="report">Report</button>
      ${(user?.uid === item.ownerId || user?.email === "abdulwajidm0@gmail.com")
        ? `<button class="delete">Delete</button>` : ""}
    `;

    li.querySelector(".claim")?.onclick = async () => {
      await fetch(`${API}/${item.id}/claim`, { method: "PUT" });
      loadItems();
    };

    li.querySelector(".report")?.onclick = async () => {
      await fetch(`${API}/${item.id}/report`, { method: "PUT" });
      loadItems();
    };

    li.querySelector(".delete")?.onclick = async () => {
      await fetch(`${API}/${item.id}`, { method: "DELETE" });
      loadItems();
    };

    if (item.reported) reportedList.appendChild(li);
    else if (item.type === "lost") lostList.appendChild(li);
    else foundList.appendChild(li);
  });
}
