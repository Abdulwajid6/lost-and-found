// ✅ Firebase Firestore imports
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

const db = window.db; // from index.html
const itemsRef = collection(db, "items");

// =========================
// RENDER ITEM
// =========================
function renderItem(itemData, id) {
  const li = document.createElement("li");
  li.className = "item-card";

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
      <button class="deleteBtn">Delete</button>
      <button class="reportBtn">Report</button>
    </div>
  `;

  // ✅ Claim button
  const claimBtn = li.querySelector(".claimBtn");
  if (claimBtn) {
    claimBtn.addEventListener("click", async () => {
      await updateDoc(doc(db, "items", id), { claimed: true });
      alert("Item marked as claimed!");
    });
  }

  // ✅ Delete button
  li.querySelector(".deleteBtn").addEventListener("click", async () => {
    if (confirm("Delete this item?")) {
      await deleteDoc(doc(db, "items", id));
      alert("Item deleted.");
    }
  });

  // ✅ Report button
  li.querySelector(".reportBtn").addEventListener("click", async () => {
    await updateDoc(doc(db, "items", id), { reported: true });
    alert("Item reported!");
  });

  return li;
}

// =========================
// FORM HANDLING
// =========================
document.getElementById("itemForm").addEventListener("submit", async (e) => {
  e.preventDefault();

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
// RESET ALL
// =========================
document.getElementById("resetAll").addEventListener("click", async () => {
  if (confirm("Erase all data?")) {
    const snapshot = await getDocs(itemsRef);
    snapshot.forEach(async (docSnap) => {
      await deleteDoc(doc(db, "items", docSnap.id));
    });
    alert("All items deleted.");
  }
});

