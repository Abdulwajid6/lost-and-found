import {
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const auth = window.auth;
const provider = window.provider;
const API = "/items";

// DOM ELEMENTS (CRITICAL FIX)
const loginBtnBig = document.getElementById("loginBtnBig");
const logoutBtn = document.getElementById("logoutBtn");
const loginScreen = document.getElementById("loginScreen");
const appContent = document.getElementById("appContent");
const userInfo = document.getElementById("userInfo");
const itemForm = document.getElementById("itemForm");
const itemType = document.getElementById("itemType");
const title = document.getElementById("title");
const lostList = document.getElementById("lostList");
const foundList = document.getElementById("foundList");
const reportedList = document.getElementById("reportedList");

// ✅ LOGIN
loginBtnBig.onclick = () => {
  signInWithRedirect(auth, provider);
};

// Handle redirect result
getRedirectResult(auth).catch(console.error);

// ✅ LOGOUT
logoutBtn.onclick = () => signOut(auth);

// ✅ AUTH STATE
onAuthStateChanged(auth, (user) => {
  loginScreen.style.display = user ? "none" : "flex";
  appContent.style.display = user ? "block" : "none";
  userInfo.textContent = user ? `Hello, ${user.displayName}` : "";
});

// ✅ ADD ITEM
itemForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!auth.currentUser) return alert("Login required");

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
};
