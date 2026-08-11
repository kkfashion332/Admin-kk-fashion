/* ═══════════════════════════════════════════════════════
   UNIQUE FASHION — admin.js (FIXED TABS & GMAIL LOGIN)
═══════════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBrIfQnPpM4lywZWIiSxaz_v0o1S9PfOqg",
    authDomain: "kkfashion-f51ff.firebaseapp.com",
    projectId: "kkfashion-f51ff",
    storageBucket: "kkfashion-f51ff.firebasestorage.app",
    messagingSenderId: "720286728954",
    appId: "1:720286728954:web:eebcf2a28f5ad696e87f43"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const $ = (id) => document.getElementById(id);
const genId = () => "id_" + Date.now() + Math.floor(Math.random() * 1000);
const finalPrice = (p) => Math.round(p.price - (p.price * (p.discount || 0)) / 100 + (p.extra || 0));

let mainCategories = [];
let products = [];
let shops = [];
let homeBanners = [];
let shortsData = [];
let couponsData = [];
let allFirebaseOrders = [];
let editingProductId = null;
let editingShopId = null;
let activeAdminOrderTab = "Recent";

// ════════════════════════════════════════════════
// 1. GMAIL LOGIN SYSTEM (SECURE AUTH)
// ════════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", () => {
    // Hide customer app UI
    if($("app")) $("app").style.display = "none";
    if($("bottom-nav")) $("bottom-nav").style.display = "none";
    if($("initLoader")) $("initLoader").style.display = "none";

    // Setup Login UI matching your theme
    const loginBox = $("adminPin");
    if(loginBox) {
        loginBox.innerHTML = `
            <div class="pin-box wide-box" style="box-shadow: 0 10px 30px rgba(201,168,76,0.3); border: 2px solid var(--primary);">
              <div class="lock" style="font-size:40px; margin-bottom:10px;">👑</div>
              <h2 style="color:var(--primary); font-family:var(--font-display);">Master Admin Portal</h2>
              <p style="color:var(--muted); font-size:13px; margin-bottom:20px;">Secured by Firebase</p>
              
              <!-- USER CAN NOW TYPE THEIR OWN EMAIL -->
              <input id="adminEmail" type="email" placeholder="Enter Admin Gmail ID" class="field" style="text-align:center; font-size:15px; font-weight:bold; margin-bottom:12px;"/>
              <input id="adminPass" type="password" placeholder="Enter Password" class="field" style="text-align:center; font-size:15px; font-weight:bold; margin-bottom:10px;" />
              
              <div id="loginError" class="error hidden" style="margin-bottom:10px; color:var(--destructive); font-size:13px; font-weight:bold;">❌ Incorrect Email or Password!</div>
              <button id="adminLoginBtn" class="btn-primary full auth-submit" style="font-size:16px; padding:12px;">Login Securely</button>
            </div>
        `;
        loginBox.classList.remove("hidden");

        $("adminLoginBtn").onclick = async () => {
            const email = $("adminEmail").value.trim();
            const pass = $("adminPass").value;
            
            if(!email || !pass) {
                alert("Kripya Email aur Password dono daalein!");
                return;
            }
            
            $("adminLoginBtn").textContent = "Verifying...";
            try {
                await signInWithEmailAndPassword(auth, email, pass);
            } catch(e) {
                $("loginError").classList.remove("hidden");
                $("adminLoginBtn").textContent = "Login Securely";
            }
        };
    }
});

// AUTH LISTENER
onAuthStateChanged(auth, (user) => {
    // Only allow specific admin email
    if (user && user.email === "monubhaipvr@gmail.com") {
        if($("adminPin")) $("adminPin").classList.add("hidden");
        $("adminPanel").classList.remove("hidden");
        // Super admin privileges ON
        $("tabShopsBtn").classList.remove("hidden");
        $("tabOrdersBtn").classList.remove("hidden");
        $("tabCatsBtn").classList.remove("hidden");
        $("tabShortsBtn").classList.remove("hidden");
        $("tabSettingsBtn").classList.remove("hidden");
        $("tabCouponsBtn").classList.remove("hidden");
        
        // Add Logout Button dynamically
        if(!$("logoutBtnAdmin")) {
            const logoutBtn = document.createElement("button");
            logoutBtn.id = "logoutBtnAdmin";
            logoutBtn.className = "btn-outline sm-btn";
            logoutBtn.style.marginLeft = "10px";
            logoutBtn.innerHTML = "Logout";
            logoutBtn.onclick = () => signOut(auth).then(() => window.location.reload());
            document.querySelector(".drawer-head").appendChild(logoutBtn);
        }

        fetchAllData();
    } else if (user) {
        // Intruder with wrong email -> Kick them out
        signOut(auth);
        alert("Access Denied! You are not the Master Admin.");
    }
});

// ════════════════════════════════════════════════
// 2. FETCH ALL DATA
// ════════════════════════════════════════════════
async function fetchAllData() {
    try {
        // Settings & Master Data
        const snap = await getDoc(doc(db, "settings", "storeData"));
        if(snap.exists()) {
            const data = snap.data();
            mainCategories = data.mainCategories || [];
            homeBanners = data.banners || [];
            shortsData = data.shorts || [];
            couponsData = data.coupons || [];
            if($("adminWaNumber")) $("adminWaNumber").value = data.waNumber || "";
            if($("adminYtLink")) $("adminYtLink").value = data.youtubeLink || "";
        }
        
        // Shops
        const shopsSnap = await getDocs(collection(db, "shops"));
        shops = []; shopsSnap.forEach(d => shops.push({ id: d.id, ...d.data() }));

        // Products
        const prodsSnap = await getDocs(collection(db, "products"));
        products = [];
        prodsSnap.forEach(d => {
            const p = d.data();
            products.push({ id: d.id, image: p.imageUrl, ...p });
        });

        // Orders
        const ordSnap = await getDocs(collection(db, "orders"));
        allFirebaseOrders = [];
        ordSnap.forEach(d => allFirebaseOrders.push({ id: d.id, ...d.data() }));
        allFirebaseOrders.sort((a,b) => b.timestamp - a.timestamp);

        renderAdmin();
    } catch(e) {
        console.error("Error loading admin data:", e);
    }
}

// ════════════════════════════════════════════════
// 3. ADMIN RENDER FUNCTIONS (TABS BUG FIXED)
// ════════════════════════════════════════════════
window.switchAdminTab = function(event, tabId) {
    // Removed active class from all tabs
    document.querySelectorAll('.am-tab').forEach(b => b.classList.remove('active'));
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    
    // Activate clicked tab
    event.target.classList.add('active');
    
    // Show target section (BUG FIXED: Using querySelector to correctly find the ID like '#amOrders')
    const targetSection = document.querySelector(tabId);
    if(targetSection) {
        targetSection.classList.remove('hidden');
    }
}

function syncAddProductDropdowns() {
    const pMainCat = $("pMainCat"); pMainCat.innerHTML = ""; 
    mainCategories.forEach((cat) => { const o = document.createElement("option"); o.value = cat.id; o.textContent = cat.name; pMainCat.appendChild(o); });
    
    const pShop = $("pShop"); const newCatShop = $("newCatShop");
    if(pShop) { pShop.innerHTML = '<option value="">Unique Fashion (Default Store)</option>'; shops.forEach(s => { const o = document.createElement("option"); o.value = s.id; o.textContent = s.name + " (" + (s.city || 'City') + ")"; pShop.appendChild(o); }); }
    if(newCatShop) { newCatShop.innerHTML = '<option value="GLOBAL">Global (All Shops)</option>'; shops.forEach(s => { const o = document.createElement("option"); o.value = s.id; o.textContent = s.name; newCatShop.appendChild(o); }); }
}

function renderAdmin() {
    syncAddProductDropdowns();

    // Render Categories in Product Filter
    if ($("adminFilterCat")) { 
        const sel = $("adminFilterCat"); sel.innerHTML = '<option value="ALL">All Categories</option>'; 
        mainCategories.forEach(cat => { const o = document.createElement("option"); o.value = cat.id; o.textContent = cat.name; sel.appendChild(o); }); 
    }

    // Render Coupons
    const cList = $("adminCouponsList");
    if(cList) {
        cList.innerHTML = "";
        couponsData.forEach(c => {
            const d = document.createElement("div"); d.className = "admin-prod";
            d.innerHTML = `<div class="ap-info"><div class="ap-name">${c.code} <span style="color:var(--primary);">(₹${c.discount} OFF)</span></div><div class="ap-sub">Min Order: ₹${c.minOrder}</div></div><div class="ap-actions"><button class="trash del-coupon">🗑️</button></div>`;
            d.querySelector('.del-coupon').onclick = async () => { if(confirm("Delete Coupon?")) { couponsData = couponsData.filter(x => x.id !== c.id); await setDoc(doc(db, "settings", "storeData"), { coupons: couponsData }, { merge: true }); renderAdmin(); } }
            cList.appendChild(d);
        });
    }

    // Render Banners
    const blist = $("adminBannersList");
    if(blist) { 
        blist.innerHTML = ""; 
        homeBanners.forEach(b => { 
            const d = document.createElement("div"); d.className = "admin-prod"; 
            d.innerHTML = `<img src="${b.image}" alt="Banner" style="width:80px; border-radius:4px; object-fit:cover;" /><div class="ap-info"><div class="ap-name" style="font-size:11px; color:var(--muted);">${b.link || 'No Link'}</div></div><div class="ap-actions"><button class="trash del-banner">🗑️</button></div>`; 
            d.querySelector('.del-banner').onclick = async () => { if(confirm("Delete Banner?")) { homeBanners = homeBanners.filter(x => x.id !== b.id); await setDoc(doc(db, "settings", "storeData"), { banners: homeBanners }, { merge: true }); renderAdmin(); } }; 
            blist.appendChild(d); 
        }); 
    }

    // Render Shorts
    const shortList = $("adminShortsList");
    if(shortList) { 
        shortList.innerHTML = ""; 
        shortsData.forEach(sh => { 
            const d = document.createElement("div"); d.className = "admin-prod"; 
            d.innerHTML = `<div class="ap-info"><div class="ap-name" style="font-size:12px;">URL: ${sh.url}</div><div class="ap-sub" style="color:var(--primary); font-size:10px;">Linked Product: ${sh.productId}</div></div><div class="ap-actions"><button class="trash del-short">🗑️</button></div>`; 
            d.querySelector('.del-short').onclick = async () => { if(confirm("Delete Short?")) { shortsData = shortsData.filter(x => x.id !== sh.id); await setDoc(doc(db, "settings", "storeData"), { shorts: shortsData }, { merge: true }); renderAdmin(); } }; 
            shortList.appendChild(d); 
        }); 
    }

    renderAdminProducts();
    renderAdminOrders();
    renderCategoriesMgmt();
}

function renderAdminProducts() {
    if(!$("adminProdTitle")) return;
    $("adminProdTitle").textContent = `Products (${products.length})`;
    const filterCat = $("adminFilterCat").value || "ALL"; const list = $("adminProducts"); list.innerHTML = "";
    const filtered = filterCat === "ALL" ? products : products.filter(p => p.mainCategoryId === filterCat);
    filtered.forEach(p => {
        const price = finalPrice(p); const inStock = p.inStock !== false; 
        const cat = mainCategories.find((c) => c.id === p.mainCategoryId); const catName = cat ? cat.name : "—";
        const mainImg = (Array.isArray(p.image) && p.image.length > 0) ? p.image[0] : "placeholder.jpg";
        
        const el = document.createElement("div"); el.className = "admin-prod";
        el.innerHTML = `
        <img src="${mainImg}" alt="${p.name}" />
        <div class="ap-info"><div class="ap-name">[ID: ${p.uniqueId || 'N/A'}] ${p.name}</div><div class="ap-sub">${catName}</div><div class="ap-price">₹${price} ${p.discount > 0 ? `(${p.discount}% off)` : ''} · <span style="color:${inStock ? '#4cc968' : '#e05555'}">${inStock ? 'In Stock' : 'Out of Stock'}</span></div></div>
        <div class="ap-actions"><button class="edit-btn">✏️</button><button class="trash">🗑️</button></div>`;
        
        el.querySelector(".edit-btn").onclick = () => openEditModal(p);
        el.querySelector(".trash").onclick = async () => { 
            if (!confirm("Delete this product?")) return; 
            await deleteDoc(doc(db, "products", p.id));
            products = products.filter(x => x.id !== p.id); 
            renderAdminProducts(); 
        };
        list.appendChild(el);
    });
}

function renderAdminOrders() {
    const list = $("adminOrdersList"); if (!list) return; list.innerHTML = "";
    const filteredOrders = allFirebaseOrders.filter(o => (o.status || 'Recent') === activeAdminOrderTab);
    if (filteredOrders.length === 0) { list.innerHTML = `<p class="empty" style="padding: 20px;">No ${activeAdminOrderTab} orders found.</p>`; return; }
    
    filteredOrders.forEach((o) => {
        const div = document.createElement("div"); div.className = "admin-order-card";
        let itemsHtml = (o.items || []).map(i => {
            const img = Array.isArray(i.product.image) ? i.product.image[0] : i.product.image;
            return `<div class="order-item-row" style="display:flex; align-items:center; gap:10px; margin-bottom:8px;"><img src="${img}" style="width:40px; height:40px; border-radius:6px; object-fit:cover; border:1px solid var(--border);"><div style="font-size:12px; color:var(--fg);">${i.product.name} <strong style="color:var(--primary);">(x${i.qty})</strong></div></div>`;
        }).join("");
        
        div.innerHTML = `
        <div class="order-head"><span>Name: ${o.name} (${o.mobile})</span><strong>₹${o.totalAmount}</strong></div>
        <div style="font-size:12px; color:var(--muted2); margin:8px 0; line-height:1.5;"><strong>Address:</strong> ${o.address}<br><strong>State:</strong> ${o.state} - ${o.pincode}</div>
        <div class="order-items" style="background:var(--card); padding:10px; border-radius:8px; margin-bottom:10px;">${itemsHtml}</div>
        <div class="order-actions" style="display:flex; justify-content: space-between; align-items: center; margin-top:10px; border-top:1px solid var(--border); padding-top:10px;">
            <select class="field small-field status-select" style="padding:6px; margin-bottom:0;">
                <option value="Recent" ${o.status === 'Recent' ? 'selected' : ''}>Recent</option>
                <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
            <button class="del-order-btn">🗑️ Delete Order</button>
        </div>`;
        
        div.querySelector(".status-select").onchange = async (e) => { 
            const newStatus = e.target.value; 
            await updateDoc(doc(db, "orders", o.id), { status: newStatus }); 
            o.status = newStatus; 
            renderAdminOrders(); 
        };
        div.querySelector(".del-order-btn").onclick = async () => { 
            if(confirm("Permanently delete this order?")) { 
                await deleteDoc(doc(db, "orders", o.id)); 
                allFirebaseOrders = allFirebaseOrders.filter(x => x.id !== o.id); 
                renderAdminOrders(); 
            } 
        };
        list.appendChild(div);
    });
}

function renderCategoriesMgmt() {
    const list = $("catMgmtList"); if(!list) return; list.innerHTML = "";
    mainCategories.forEach(cat => {
        const div = document.createElement("div"); div.className = "cat-mgmt-card";
        div.innerHTML = `<div class="cat-mgmt-head"><strong style="color:var(--primary); font-size:14px;">${cat.name}</strong><button class="trash del-cat">🗑️</button></div>`;
        div.querySelector(".del-cat").onclick = async () => {
            if(confirm("Delete Category?")) {
                mainCategories = mainCategories.filter(c => c.id !== cat.id);
                await setDoc(doc(db, "settings", "storeData"), { mainCategories }, { merge: true });
                renderAdmin();
            }
        };
        list.appendChild(div);
    });
}

// ════════════════════════════════════════════════
// 4. ACTION LISTENERS (Adding & Saving Data)
// ════════════════════════════════════════════════

// Add Product
if($("addProductBtn")) {
    $("addProductBtn").onclick = async () => {
        const pName = $("pName").value.trim();
        const rawImage = $("pImage").value.trim(); 
        const pPrice = $("pPrice").value;
        const pDisc = $("pDiscount").value;
        const pExtra = $("pExtra").value;
        const pCatId = $("pMainCat").value;
        const pShopId = $("pShop").value || "";
        const pInStock = $("pInStock").checked;
        const pFreeDelivery = $("pFreeDelivery").checked;
        const pUniqueId = $("pUniqueId") ? $("pUniqueId").value.trim() : "";

        let imgArray = rawImage.includes("|") ? rawImage.split("|").map(s => s.trim()).filter(Boolean) : rawImage.split(",").map(s => s.trim()).filter(Boolean);
        if (!pName || imgArray.length === 0 || !pPrice) return alert("Name, Image, and Price are required!");
        
        $("addProductBtn").textContent = "Listing...";
        const newProd = {
            name: pName, uniqueId: pUniqueId, imageUrl: imgArray, price: Number(pPrice), discount: Number(pDisc) || 0, extra: Number(pExtra) || 0,
            mainCategoryId: pCatId, shopId: pShopId, inStock: pInStock, freeDelivery: pFreeDelivery, timestamp: new Date()
        };

        try {
            const dRef = await addDoc(collection(db, "products"), newProd);
            products.unshift({ id: dRef.id, image: imgArray, ...newProd });
            alert("Product Listed Successfully!");
            ["pName","pImage","pImageFile","pPrice","pDiscount","pExtra","pUniqueId"].forEach(id => { if($(id)) $(id).value = ""; });
            renderAdminProducts();
        } catch(e) { alert("Error"); }
        $("addProductBtn").textContent = "Add Product to Collection";
    };
}

// Settings Update
if ($("saveWaBtn")) {
    $("saveWaBtn").onclick = async () => {
        const num = $("adminWaNumber").value.trim();
        await setDoc(doc(db, "settings", "storeData"), { waNumber: num }, { merge: true });
        alert("WhatsApp Saved!");
    };
}
if ($("saveYtBtn")) {
    $("saveYtBtn").onclick = async () => {
        const link = $("adminYtLink").value.trim();
        await setDoc(doc(db, "settings", "storeData"), { youtubeLink: link }, { merge: true });
        alert("YouTube Link Saved!");
    };
}

// Order Tabs Listener
document.querySelectorAll("#adminOrderTabs .admin-tab").forEach(btn => {
    btn.addEventListener("click", (e) => {
        document.querySelectorAll("#adminOrderTabs .admin-tab").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        activeAdminOrderTab = e.target.getAttribute("data-tab");
        renderAdminOrders();
    });
});

// Category, Shop, Coupon, Banner, Short Add listeners
if($("addCatBtn")) {
    $("addCatBtn").onclick = async () => {
        const n = $("newCatName").value.trim().toUpperCase();
        if(!n) return;
        mainCategories.push({ id: genId(), name: n, shopId: $("newCatShop") ? $("newCatShop").value : "GLOBAL" });
        await setDoc(doc(db, "settings", "storeData"), { mainCategories }, { merge: true });
        $("newCatName").value = ""; renderAdmin();
    };
}

// Edit Modal Functions
function openEditModal(p) {
    editingProductId = p.id; 
    $("editPName").textContent = p.name;
    let imgArray = Array.isArray(p.image) ? p.image : [p.image]; 
    $("editPImage").value = imgArray.join(" | "); 
    $("editPPrice").value = p.price; 
    $("editPDiscount").value = p.discount || 0; 
    $("editInStock").checked = p.inStock !== false;
    $("editModal").classList.remove("hidden");
}

if($("editClose")) $("editClose").onclick = () => $("editModal").classList.add("hidden");

if ($("saveEditBtn")) {
    $("saveEditBtn").onclick = async () => {
        if (!editingProductId) return;
        const newPrice = Number($("editPPrice").value); 
        const newDisc = Number($("editPDiscount").value) || 0; 
        const newInStock = $("editInStock").checked; 
        const rawImage = $("editPImage").value.trim(); 
        let newImgArray = rawImage.includes("|") ? rawImage.split("|").map(s => s.trim()).filter(Boolean) : rawImage.split(",").map(s => s.trim()).filter(Boolean);

        await updateDoc(doc(db, "products", editingProductId), { price: newPrice, discount: newDisc, inStock: newInStock, imageUrl: newImgArray });
        
        const idx = products.findIndex(p => p.id === editingProductId);
        if(idx > -1) { products[idx].price = newPrice; products[idx].discount = newDisc; products[idx].inStock = newInStock; products[idx].image = newImgArray; }
        
        $("editModal").classList.add("hidden"); 
        renderAdminProducts();
    };
}
