// ================= CONFIG =================
const ADMIN_EMAIL = "abdulwajidm0@gmail.com";

const auth = firebase.auth();

// ================= DOM ELEMENTS =================
const lostList = document.getElementById("lostItems");
const foundList = document.getElementById("foundItems");
const reportedList = document.getElementById("reportedItems");

// ================= AUTH STATE =================
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("logoutBtn").style.display = "inline-block";
    loadItems();
  } else {
    document.getElementById("loginBtn").style.display = "inline-block";
    document.getElementById("logoutBtn").style.display = "none";
  }
});

// ================= LOGIN =================
function login() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
}

// ================= LOGOUT =================
function logout() {
  auth.signOut();
}

// ================= ADD ITEM =================
async function addItem() {
  const user = auth.currentUser;
  if (!user) {
    alert("Please login first");
    return;
  }

  const data = {
    type: document.getElementById("type").value,
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    location: document.getElementById("location").value,
    date: document.getElementById("date").value,
    contact: document.getElementById("contact").value,
    photo: document.getElementById("photo").value,
    ownerId: user.uid,
    email: user.email,
    claimed: false,
    reported: false,
    created: new Date().toISOString()
  };

  await fetch("/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  document.getElementById("itemForm").reset();
  loadItems();
}

// ================= LOAD ITEMS =================
async function loadItems() {
  const res = await fetch("/items");
  const items = await res.json();
  const user = auth.currentUser;

  lostList.innerHTML = "";
  foundList.innerHTML = "";
  reportedList.innerHTML = "";

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";

    card.innerHTML = `
      <span class="tag ${item.type.toLowerCase()}">${item.type}</span>
      ${item.reported ? `<span class="tag reported">Reported</span>` : ""}
      <h4>${item.title}</h4>
      <p>${item.description}</p>
      <p><b>Location:</b> ${item.location} • <b>Date:</b> ${item.date}</p>
      <p><b>Contact:</b> ${item.contact}</p>

      <div class="actions">
        ${!item.claimed ? `<button onclick="markClaimed('${item.id}')">Mark Claimed</button>` : ""}
        ${!item.reported ? `<button onclick="reportItem('${item.id}')">Report</button>` : ""}
        ${
          user &&
          (user.email === ADMIN_EMAIL || user.uid === item.ownerId)
            ? `<button class="danger" onclick="deleteItem('${item.id}')">Delete</button>`
            : ""
        }
      </div>
    `;

    if (item.reported) {
      reportedList.appendChild(card);
    } else if (item.type === "Lost") {
      lostList.appendChild(card);
    } else {
      foundList.appendChild(card);
    }
  });
}

// ================= ACTIONS =================
async function markClaimed(id) {
  await fetch(`/items/${id}/claim`, { method: "PUT" });
  loadItems();
}

async function reportItem(id) {
  await fetch(`/items/${id}/report`, { method: "PUT" });
  loadItems();
}

async function deleteItem(id) {
  const user = auth.currentUser;
  if (!confirm("Are you sure you want to delete this item?")) return;

  await fetch(`/items/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.uid,
      email: user.email
    })
  });

  loadItems();
}
