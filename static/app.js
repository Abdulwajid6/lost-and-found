import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const auth = window.auth;
const provider = window.provider;
const API = "/items";

/* DOM ELEMENTS */
const loginBtnBig = document.getElementById("loginBtnBig");
const logoutBtn = document.getElementById("logoutBtn");
const loginScreen = document.getElementById("loginScreen");
const appContent = document.getElementById("appContent");
const userInfo = document.getElementById("userInfo");
const itemForm = document.getElementById("itemForm");
const itemType = document.getElementById("itemType");
const title = document.getElementById("title");

/* ✅ LOGIN */
loginBtnBig.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

/* ✅ LOGOUT */
logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

/* ✅ AUTH STATE HANDLER */
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

/* ✅ ADD ITEM */
itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!auth.currentUser) {
    alert("Please login first");
    return;
  }

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: itemType.value,
      title: title.value,
      ownerId: auth.currentUser.uid,
      created: Date.now(),
      claimed: false,
      reported: false
    })
  });

  itemForm.reset();
});
