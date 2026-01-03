const auth = window.auth;
const API = "/items";

// LOGIN
loginBtnBig.onclick = async () => {
  const res = await signInWithPopup(auth, provider);
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  loginScreen.style.display = user ? "none" : "flex";
  appContent.style.display = user ? "block" : "none";
  userInfo.textContent = user ? `Hello, ${user.displayName}` : "";
});

// ADD ITEM
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

// LOAD ITEMS
async function loadItems() {
  const res = await fetch(API);
  const items = await res.json();

  lostList.innerHTML = foundList.innerHTML = reportedList.innerHTML = "";

  items.forEach(item => {
    const li = document.createElement("li");
    li.className = "item-card";
    li.innerHTML = `<span class="badge ${item.type}">${item.type}</span>
      <h3>${item.title}</h3><p>${item.desc || ""}</p>`;

    if (item.reported) reportedList.appendChild(li);
    else if (item.type === "lost") lostList.appendChild(li);
    else foundList.appendChild(li);
  });
}

loadItems();
