// Firestore imports
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Auth imports
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const db = window.db;
const auth = window.auth;
const itemsRef = collection(db, "items");

// =========================
// LOGIN / LOGOUT
// =========================
const loginScreen = document.getElementById("loginScreen");
const mainContent = document.getElementById("mainContent");

const loginBtn = document.getElementById("loginBtnBig"); // BIG login button on login screen
const logoutBtn = document.getElementById("logoutBtn");  // navbar logout
const userInfo = document.getElementById("userInfo");

loginBtn.addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    console.log("Login success:", result.user);
  } catch (err) {
    console.error("Login failed:", err);
    alert("Login failed: " + err.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appContent").style.display = "block";
    document.getElementById("userInfo").textContent = `Hello, ${user.displayName}`;
    document.getElementById("logoutBtn").style.display = "inline-block";
  } else {
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("appContent").style.display = "none";
    document.getElementById("userInfo").textContent = "";
    document.getElementById("logoutBtn").style.display = "none";
  }
});


// =========================
// RENDER ITEM
// =========================
function renderItem(itemData, id) {
  const li = document.createElement("li");
  li.className = "item-card";

  const user = auth.currentUser;
  const isOwner = user && user.uid === itemData.ownerId;
  const isAdmin = user && user.email === "abdulwajidm0@gmail.com"; // 🔑 change admin email

  li.innerHTML = `
    <span class="badge ${itemData.type}">${itemData.type}</span>
    ${itemData.claimed ? '<span class="badge claimed">Claimed</span>' : ""}
    ${itemData.reported ? '<span class="badge reported">Reported</span>' : ""}
    <h3>${itemData.title}</h3>
    <p>${itemData.desc || ""}</p>
    <p><strong>Location:</strong> ${itemData.location || ""} • <strong>Date:</strong> ${itemData.date || ""}</p>
    <p><strong>Contact:</strong> ${itemData.contact || ""}</p>
    ${itemData.photo ? `<img src="${itemData.photo}" width="120">` : ""}
    <div class="item-actions">
      ${!itemData.claimed ? `<button class="claimBtn">Mark Claimed</button>` : ""}
      <button class="reportBtn">Report</button>
      ${isOwner || isAdmin ? `<button class="deleteBtn">Delete</button>` : ""}
    </div>
  `;

  // Claim
  const claimBtn = li.querySelector(".claimBtn");
  if (claimBtn) {
    claimBtn.addEventListener("click", async () => {
      await updateDoc(doc(db, "items", id), { claimed: true });
      alert("Item marked as claimed!");
    });
  }

  // Delete
  const deleteBtn = li.querySelector(".deleteBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (confirm("Delete this item?")) {
        await deleteDoc(doc(db, "items", id));
        alert("Item deleted.");
      }
    });
  }

  // Report
  const reportBtn = li.querySelector(".reportBtn");
  if (reportBtn) {
    reportBtn.addEventListener("click", async () => {
      await updateDoc(doc(db, "items", id), { reported: true });
      alert("Item reported!");
    });
  }

  return li;
}

// =========================
// FORM HANDLING
// =========================
document.getElementById("itemForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    alert("Please login to add items.");
    return;
  }

  const newItem = {
    type: document.getElementById("itemType").value,
    title: document.getElementById("title").value.trim(),
    desc: document.getElementById("description").value.trim(),
    location: document.getElementById("location").value.trim(),
    date: document.getElementById("date").value || new Date().toISOString().slice(0, 10),
    contact: document.getElementById("contact").value.trim(),
    photo: document.getElementById("photo").value.trim(),
    claimed: false,
    reported: false,
    created: Date.now(),
    ownerId: user.uid
  };

  if (!newItem.title) {
    alert("Please enter a title.");
    return;
  }

  await addDoc(itemsRef, newItem);
  e.target.reset();
});

// =========================
// LIVE UPDATES
// =========================
onSnapshot(query(itemsRef, orderBy("created", "desc")), (snapshot) => {
  document.getElementById("lostList").innerHTML = "";
  document.getElementById("foundList").innerHTML = "";
  document.getElementById("reportedList").innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const li = renderItem(data, docSnap.id);

    if (data.reported) {
      document.getElementById("reportedList").appendChild(li);
    } else if (data.type === "lost") {
      document.getElementById("lostList").appendChild(li);
    } else if (data.type === "found") {
      document.getElementById("foundList").appendChild(li);
    }
  });
});

// =========================
// RESET ALL (Admin only)
// =========================
document.getElementById("resetAll").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user || user.email !== "abdulwajidm0@gmail.com") {
    alert("Only admin can reset all data.");
    return;
  }

  if (confirm("Erase all data?")) {
    const snapshot = await getDocs(itemsRef);
    snapshot.forEach(async (docSnap) => {
      await deleteDoc(doc(db, "items", docSnap.id));
    });
    alert("All items deleted.");
  }
});

