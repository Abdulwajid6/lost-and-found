const loginScreen = document.getElementById("loginScreen");
const appContent = document.getElementById("appContent");
const loginBtn = document.getElementById("loginBtnBig");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const itemsList = document.getElementById("itemsList");

let currentUser = null;

/* ---------------- LOGIN (TEMP SIMPLE LOGIN) ---------------- */
loginBtn.onclick = () => {
  currentUser = { name: "Demo User", email: "demo@gmail.com" };
  loginScreen.style.display = "none";
  appContent.style.display = "block";
  userInfo.textContent = "Hello, " + currentUser.name;
};

logoutBtn.onclick = () => {
  currentUser = null;
  loginScreen.style.display = "flex";
  appContent.style.display = "none";
};

/* ---------------- ADD ITEM ---------------- */
document.getElementById("itemForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const item = {
    type: itemType.value,
    title: title.value,
    description: description.value,
    location: location.value,
    contact: contact.value
  };

  const res = await fetch("/add-item", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  });

  const data = await res.json();
  alert(data.message);
  e.target.reset();
  loadItems();
});

/* ---------------- LOAD ITEMS ---------------- */
async function loadItems() {
  const res = await fetch("/items");
  const items = await res.json();

  itemsList.innerHTML = "";
  items.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${item.title}</strong> - ${item.type}`;
    itemsList.appendChild(li);
  });
}

loadItems();
