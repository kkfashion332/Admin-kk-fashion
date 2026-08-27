// Import Firebase Web SDK (v12.14.0 Modular CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { 
    getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, serverTimestamp, query 
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// =====================================================================
// 🔥 YOUR PUBLIC FIREBASE CONFIG
// =====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBrIfQnPpM4lywZWIiSxaz_v0o1S9PfOqg",
  authDomain: "kkfashion-f51ff.firebaseapp.com",
  databaseURL: "https://kkfashion-f51ff-default-rtdb.firebaseio.com",
  projectId: "kkfashion-f51ff",
  storageBucket: "kkfashion-f51ff.firebasestorage.app",
  messagingSenderId: "720286728954",
  appId: "1:720286728954:web:eebcf2a28f5ad696e87f43"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// State Variables
let storeSettings = { mainCategories: [], banners: [] };

// =====================================================
// UI & LOGIN LOGIC
// =====================================================
function checkLogin() {
    if (localStorage.getItem('kk_admin_logged_in') === 'true') {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');
        loadAllData();
    }
}
checkLogin();

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    if (email === "monubhaipvr@gmail.com" && pass === "monu@pvr") {
        localStorage.setItem('kk_admin_logged_in', 'true');
        location.reload();
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('kk_admin_logged_in');
    location.reload();
});

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('border-yellow-500', 'text-yellow-500');
        el.classList.add('border-transparent', 'text-gray-500');
    });
    const activeBtn = document.getElementById('btn-' + tabId);
    activeBtn.classList.remove('border-transparent', 'text-gray-500');
    activeBtn.classList.add('border-yellow-500', 'text-yellow-500');
};

// =====================================================
// DATA LOADING
// =====================================================
async function loadAllData() {
    await fetchSettings();
    fetchOrders();
    fetchProducts();
}

// =====================================================
// ORDERS LOGIC
// =====================================================
async function fetchOrders() {
    const list = document.getElementById('ordersList');
    try {
        const q = query(collection(db, "orders"));
        const snapshot = await getDocs(q);
        let orders = [];
        snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
        
        // Sort Recent First 
        orders.sort((a, b) => {
            const timeA = a.savedAt || 0;
            const timeB = b.savedAt || 0;
            return timeB - timeA;
        });

        if (orders.length === 0) {
            list.innerHTML = '<p class="text-gray-500 italic">No orders found.</p>';
            return;
        }

        let html = '';
        orders.forEach(o => {
            let productImg = 'placeholder.jpg';
            if (o.items && o.items.length > 0 && o.items[0].product && o.items[0].product.image) {
                const pImg = o.items[0].product.image;
                productImg = Array.isArray(pImg) ? pImg[0] : pImg;
            }

            html += `
            <div class="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-yellow-500/40 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="flex gap-4 w-full md:w-auto">
                    <img src="${productImg}" alt="Order Item" class="w-20 h-20 object-cover rounded-lg border border-gray-600 shrink-0">
                    <div>
                        <h4 class="font-bold text-lg text-yellow-500">${o.name || 'Unknown'} <span class="text-gray-400 text-sm font-normal">(${o.mobile || 'N/A'})</span></h4>
                        <p class="text-sm text-gray-300 mt-1"><strong>Address:</strong> ${o.address || 'N/A'}</p>
                        <p class="text-sm font-bold text-green-400 mt-2">Total: ₹${o.totalAmount || 0} <span class="text-xs text-gray-400 ml-2">(${o.paymentMethod || 'COD'})</span></p>
                    </div>
                </div>
                <div class="flex items-center gap-3 w-full md:w-auto mt-3 md:mt-0">
                    <select onchange="window.updateOrderStatus('${o.id}', this.value)" class="p-2 border border-gray-600 rounded bg-gray-700 text-gray-200 focus:outline-none focus:border-yellow-500 font-semibold cursor-pointer transition-colors">
                        <option value="Recent" ${o.status === 'Recent' ? 'selected' : ''}>Recent</option>
                        <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                    <button onclick="window.deleteOrder('${o.id}')" class="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-all duration-300">🗑️ Delete</button>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    } catch (e) {
        console.error("Error fetching orders:", e);
        list.innerHTML = '<p class="text-red-500">Error loading orders. Database rules check karein.</p>';
    }
}

window.updateOrderStatus = async function(oid, status) {
    try {
        await updateDoc(doc(db, "orders", oid), { status: status });
        alert("Status updated!");
    } catch(e) { alert("Error updating status."); }
}
window.deleteOrder = async function(oid) {
    if(confirm("Permanently delete this order?")) {
        await deleteDoc(doc(db, "orders", oid));
        fetchOrders();
    }
}

// =====================================================
// PRODUCTS LOGIC
// =====================================================
async function fetchProducts() {
    const list = document.getElementById('productsList');
    try {
        const q = query(collection(db, "products"));
        const snapshot = await getDocs(q);
        let products = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            products.push({ 
                id: doc.id, 
                ...data,
                sortTime: data.timestamp ? (data.timestamp.seconds || 0) : 0 
            });
        });
        
        // Sorting by Timeline (Newest first)
        products.sort((a, b) => b.sortTime - a.sortTime);

        if (products.length === 0) {
            list.innerHTML = '<p class="text-gray-500 italic col-span-full">No products found.</p>';
            return;
        }

        let html = '';
        products.forEach(p => {
            let img = Array.isArray(p.imageUrl) ? p.imageUrl[0] : (p.imageUrl || 'placeholder.jpg');
            const sizesSafe = p.sizesIn || '';
            const encodedName = encodeURIComponent(p.name || ''); // 🔥 FIX FOR QUOTES IN NAME
            
            html += `
            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg relative group hover:-translate-y-1 hover:border-yellow-500/50 transition-all duration-300 overflow-hidden flex flex-col">
                <img src="${img}" class="w-full h-48 object-cover rounded-lg mb-3 opacity-90 group-hover:opacity-100 transition-opacity">
                <h4 class="font-bold text-sm truncate text-gray-200">${p.name}</h4>
                <div class="flex justify-between items-center mt-1">
                    <p class="text-yellow-500 font-extrabold text-lg">₹${p.price}</p>
                    <span class="text-xs font-bold px-2 py-1 rounded bg-gray-700 ${p.inStock ? 'text-green-400' : 'text-red-400'}">${p.inStock ? 'In Stock' : 'Out of Stock'}</span>
                </div>
                ${p.source === 'Flipkart' ? `<span class="text-[10px] bg-blue-600 text-white px-2 py-1 rounded mt-2 self-start font-bold">By Flipkart</span>` : ''}
                
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                    <button onclick="window.openEditModal('${p.id}', '${encodedName}', '${p.price}', '${p.discount || 0}', '${p.source}', '${p.inStock}', '${sizesSafe}', '${p.mainCategoryId || ''}')" class="bg-gray-900 text-yellow-500 p-2 rounded-full shadow-lg border border-yellow-500/30 hover:bg-yellow-500 hover:text-gray-900">✏️</button>
                    <button onclick="window.deleteProduct('${p.id}')" class="bg-gray-900 text-red-500 p-2 rounded-full shadow-lg border border-red-500/30 hover:bg-red-500 hover:text-white">🗑️</button>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    } catch (e) {
        console.error("Error fetching products:", e);
    }
}

document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('addProdBtn');
    btn.textContent = "Adding..."; btn.disabled = true;

    let rawImg = document.getElementById('addProdImage').value;
    let imgList = rawImg.includes('|') ? rawImg.split('|').map(u=>u.trim()) : rawImg.split(',').map(u=>u.trim());

    const newProd = {
        name: document.getElementById('addProdName').value,
        imageUrl: imgList,
        mainCategoryId: document.getElementById('addProdCategory').value,
        source: document.getElementById('addProdSource').value,
        sizesIn: document.getElementById('addProdSizes').value, 
        price: parseFloat(document.getElementById('addProdPrice').value),
        discount: parseFloat(document.getElementById('addProdDiscount').value || 0),
        inStock: document.getElementById('addProdInStock').checked,
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "products"), newProd);
        document.getElementById('addProductForm').reset();
        fetchProducts();
    } catch(err) { alert("Error adding product! Firebase Rules check karein."); }
    btn.textContent = "➕ Add Product"; btn.disabled = false;
});

window.deleteProduct = async function(pid) {
    if(confirm("Delete product?")) {
        await deleteDoc(doc(db, "products", pid));
        fetchProducts();
    }
}

window.openEditModal = function(id, encodedName, price, discount, source, inStock, sizesIn, catId) {
    document.getElementById('editProdId').value = id;
    document.getElementById('editName').value = decodeURIComponent(encodedName);
    document.getElementById('editPrice').value = price;
    document.getElementById('editDiscount').value = discount;
    document.getElementById('editSource').value = source || 'Unique Fashion';
    document.getElementById('editSizes').value = sizesIn || ''; 
    document.getElementById('editCategorySelect').value = catId || '';
    document.getElementById('editInStock').checked = (inStock === 'true' || inStock === true);
    document.getElementById('editModal').style.display = 'flex';
}

window.closeEditModal = function() {
    document.getElementById('editModal').style.display = 'none';
}

document.getElementById('editProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pid = document.getElementById('editProdId').value;
    const btn = document.getElementById('saveEditBtn');
    btn.textContent = "Saving..."; btn.disabled = true;
    try {
        await updateDoc(doc(db, "products", pid), {
            name: document.getElementById('editName').value,
            price: parseFloat(document.getElementById('editPrice').value),
            discount: parseFloat(document.getElementById('editDiscount').value || 0),
            source: document.getElementById('editSource').value,
            sizesIn: document.getElementById('editSizes').value, 
            mainCategoryId: document.getElementById('editCategorySelect').value, // 🔥 UPDATE CATEGORY
            inStock: document.getElementById('editInStock').checked
        });
        window.closeEditModal();
        fetchProducts();
    } catch(err) { alert("Error updating product!"); }
    btn.textContent = "💾 Save Changes"; btn.disabled = false;
});

// =====================================================
// SETTINGS, CATEGORIES, BANNERS
// =====================================================
async function fetchSettings() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "storeData"));
        if (docSnap.exists()) {
            storeSettings = docSnap.data();
            if(!storeSettings.mainCategories) storeSettings.mainCategories = [];
            if(!storeSettings.banners) storeSettings.banners = [];
            
            // Populate Inputs
            document.getElementById('setUpi').value = storeSettings.upiId || '';
            document.getElementById('setQr').value = storeSettings.qrCodeUrl || '';
            document.getElementById('setWa').value = storeSettings.waNumber || '';
            document.getElementById('setBrightTheme').checked = storeSettings.brightThemeEnabled || false;
            
            populateCategoryDropdowns();
            renderCategories();
            renderBanners();
        }
    } catch(e) { console.error("Error fetching settings:", e); }
}

function populateCategoryDropdowns() {
    const addSelect = document.getElementById('addProdCategory');
    const editSelect = document.getElementById('editCategorySelect');
    
    let options = '<option value="">Select Category</option>';
    storeSettings.mainCategories.forEach(cat => {
        options += `<option value="${cat.id}">${cat.name}</option>`;
    });
    
    addSelect.innerHTML = options;
    if(editSelect) editSelect.innerHTML = options;
}

async function saveSettingsData(newData) {
    try {
        await setDoc(doc(db, "settings", "storeData"), newData, { merge: true });
        fetchSettings(); // Refresh to update dropdowns and lists
    } catch(e) { alert("Error saving to database. Firebase Rules Check Karein."); }
}

// =====================================================
// CATEGORIES LOGIC (With Edit Modal functionality)
// =====================================================
document.getElementById('addCategoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newCat = {
        id: "cat_" + Date.now(),
        name: document.getElementById('addCatName').value,
        image: document.getElementById('addCatImage').value,
        shopId: 'GLOBAL'
    };
    storeSettings.mainCategories.push(newCat);
    await saveSettingsData({ mainCategories: storeSettings.mainCategories });
    document.getElementById('addCategoryForm').reset();
});

function renderCategories() {
    const list = document.getElementById('categoriesList');
    if(storeSettings.mainCategories.length === 0) { list.innerHTML = '<p class="text-gray-500 italic col-span-full">No categories.</p>'; return; }
    let html = '';
    storeSettings.mainCategories.forEach(cat => {
        // 🔥 FIX: Encode name to prevent quote bugs in onclick
        const encodedCatName = encodeURIComponent(cat.name || '');
        
        html += `
        <div class="bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col items-center text-center border-t-4 border-yellow-500 relative group">
            <img src="${cat.image || 'https://via.placeholder.com/150'}" class="w-16 h-16 rounded-full object-cover border-2 border-gray-600 mb-3">
            <span class="font-bold text-gray-200 text-sm">${cat.name}</span>
            <div class="flex gap-2 mt-3">
                <button onclick="window.openEditCategoryModal('${cat.id}', '${encodedCatName}', '${cat.image}')" class="text-xs bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-gray-900 px-3 py-1 rounded transition-colors">Edit</button>
                <button onclick="window.deleteCategory('${cat.id}')" class="text-xs bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded transition-colors">Delete</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

window.deleteCategory = async function(cid) {
    if(confirm("Are you sure you want to delete this category?")) {
        storeSettings.mainCategories = storeSettings.mainCategories.filter(c => c.id !== cid);
        await saveSettingsData({ mainCategories: storeSettings.mainCategories });
    }
}

// 🔥 FIX: Decode the category name when opening modal 🔥
window.openEditCategoryModal = function(id, encodedName, image) {
    document.getElementById('editCatId').value = id;
    document.getElementById('editCatNameInput').value = decodeURIComponent(encodedName);
    document.getElementById('editCatImageInput').value = image;
    document.getElementById('editCategoryModal').style.display = 'flex';
}

window.closeEditCategoryModal = function() {
    document.getElementById('editCategoryModal').style.display = 'none';
}

document.getElementById('editCategoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cid = document.getElementById('editCatId').value;
    const btn = document.getElementById('saveCatEditBtn');
    btn.textContent = "Saving..."; btn.disabled = true;
    
    const catIndex = storeSettings.mainCategories.findIndex(c => c.id === cid);
    if(catIndex > -1) {
        storeSettings.mainCategories[catIndex].name = document.getElementById('editCatNameInput').value;
        storeSettings.mainCategories[catIndex].image = document.getElementById('editCatImageInput').value;
        await saveSettingsData({ mainCategories: storeSettings.mainCategories });
        window.closeEditCategoryModal();
    } else {
        alert("Category not found!");
    }
    btn.textContent = "💾 Save Category"; btn.disabled = false;
});

// Banners
document.getElementById('addBannerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newBan = {
        id: "ban_" + Date.now(),
        image: document.getElementById('addBanImage').value,
        link: document.getElementById('addBanLink').value
    };
    storeSettings.banners.push(newBan);
    await saveSettingsData({ banners: storeSettings.banners });
    document.getElementById('addBannerForm').reset();
});

function renderBanners() {
    const list = document.getElementById('bannersList');
    if(storeSettings.banners.length === 0) { list.innerHTML = '<p class="text-gray-500 italic col-span-full">No banners.</p>'; return; }
    let html = '';
    storeSettings.banners.forEach(b => {
        html += `
        <div class="bg-gray-800 p-4 rounded-xl shadow-lg flex items-center gap-4 border border-gray-700">
            <img src="${b.image}" class="w-32 h-20 object-cover rounded shadow-md border border-gray-700">
            <div class="flex-grow text-xs text-yellow-500 font-mono truncate bg-gray-900 p-2 rounded">${b.link || 'No Redirect Link'}</div>
            <button onclick="window.deleteBanner('${b.id}')" class="bg-gray-900 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white">🗑️</button>
        </div>`;
    });
    list.innerHTML = html;
}
window.deleteBanner = async function(bid) {
    storeSettings.banners = storeSettings.banners.filter(b => b.id !== bid);
    await saveSettingsData({ banners: storeSettings.banners });
}

// Store Settings
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveSettingsBtn');
    btn.textContent = "SAVING..."; btn.disabled = true;
    await saveSettingsData({
        upiId: document.getElementById('setUpi').value,
        qrCodeUrl: document.getElementById('setQr').value,
        waNumber: document.getElementById('setWa').value,
        brightThemeEnabled: document.getElementById('setBrightTheme').checked
    });
    btn.textContent = "SAVE CONFIGURATION"; btn.disabled = false;
    alert("Settings Saved Successfully!");
});
