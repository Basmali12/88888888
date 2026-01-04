// متغيرات عامة
let cart = [];
let user = null;
let deferredPrompt;
// === رقم خدمة العملاء (غيّره هنا) ===
let adminPhoneNumber = "9647700000000"; 

// 1. إعدادات Firebase (التي أرسلتها)
const firebaseConfig = {
    apiKey: "AIzaSyDX0esBRiQ4MuyvWH_s2UZ2kJpA9GryDgE",
    authDomain: "tttttt-48c2e.firebaseapp.com",
    databaseURL: "https://tttttt-48c2e-default-rtdb.firebaseio.com",
    projectId: "tttttt-48c2e",
    storageBucket: "tttttt-48c2e.firebasestorage.app",
    messagingSenderId: "982883301644",
    appId: "1:982883301644:web:7b1676215cb4f0fe7c7129",
    measurementId: "G-QLCYC16T20"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const productsRef = db.ref('products');

document.addEventListener('DOMContentLoaded', () => {
    // إخفاء شاشة التحميل
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 500);
        }
        if(!localStorage.getItem('visited')) {
            showPage('login-page');
            localStorage.setItem('visited', 'true');
        }
    }, 2000);

    // تثبيت التطبيق PWA
    const installBanner = document.getElementById('install-banner');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if(installBanner) installBanner.style.display = 'flex';
    });

    const installBtn = document.getElementById('install-btn');
    if(installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    installBanner.style.display = 'none';
                }
                deferredPrompt = null;
            }
        });
    }

    const closeInstall = document.getElementById('close-install');
    if(closeInstall) closeInstall.addEventListener('click', () => installBanner.style.display = 'none');

    // جلب المنتجات من Firebase
    productsRef.on('value', (snapshot) => {
        const container = document.getElementById('products-container');
        if(!container) return;
        
        container.innerHTML = "";
        const data = snapshot.val();
        
        if (!data) {
            container.innerHTML = "<p style='width:200%; text-align:center;'>لا توجد منتجات حتى الآن</p>";
            return;
        }

        const products = Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse();

        products.forEach(prod => {
            // معالجة النصوص
            const safeTitle = prod.title ? prod.title.replace(/'/g, "&apos;") : "بدون عنوان";
            const safeDesc = prod.description ? prod.description.replace(/'/g, "&apos;").replace(/\n/g, "<br>") : "";
            
            const card = `
            <div class="product-card" data-category="${prod.category || 'other'}" onclick="openProductPage('${prod.id}', '${safeTitle}', ${prod.price}, '${prod.image}', '${safeDesc}')">
                <span class="discount-badge">جديد</span>
                <div class="wishlist-btn"><i class="fa-regular fa-heart"></i></div>
                <img src="${prod.image}" class="prod-img" loading="lazy">
                <div class="prod-details">
                    <div class="prod-title">${prod.title}</div>
                    <div class="price-row">
                        <span class="price">${Number(prod.price).toLocaleString()} د.ع</span>
                        <button class="add-cart-btn"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
            </div>`;
            container.innerHTML += card;
        });
    });
});

// التنقل
window.showPage = function(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active-page'));
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active-page');
    window.scrollTo(0,0);
    
    // تحديث القائمة السفلية
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if(pageId === 'home-page') document.querySelector('.nav-item:nth-child(1)').classList.add('active');
    if(pageId === 'cart-page') document.querySelector('.nav-item:nth-child(2)').classList.add('active');
    if(pageId === 'profile-page') document.querySelector('.nav-item:nth-child(3)').classList.add('active');
}

window.goBack = function() { showPage('home-page'); }

// تفاصيل المنتج
window.openProductPage = function(id, title, price, img, desc) {
    document.getElementById('detail-title').innerText = title;
    document.getElementById('detail-price').innerText = Number(price).toLocaleString() + " د.ع";
    document.getElementById('detail-img').src = img;
    const descEl = document.querySelector('.detail-desc p');
    if(descEl) descEl.innerHTML = desc || "لا يوجد وصف";
    showPage('product-page');
}

// السلة
window.addToCartFromDetail = function() {
    const title = document.getElementById('detail-title').innerText;
    const priceTxt = document.getElementById('detail-price').innerText;
    const price = parseInt(priceTxt.replace(/[^0-9]/g, ''));
    const img = document.getElementById('detail-img').src;
    addToCart(title, price, img);
    goBack();
}

window.addToCart = function(title, price, img) {
    if(!title) return;
    cart.push({ title, price, img });
    updateCartUI();
    showToast("تمت الإضافة للسلة!");
};

function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.length;
    const container = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-price');
    
    if(cart.length === 0) {
        container.innerHTML = '<div class="empty-cart-msg">السلة فارغة</div>';
        totalEl.innerText = "0 د.ع";
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        html += `
        <div class="cart-item">
            <img src="${item.img}">
            <div class="cart-info"><h4>${item.title}</h4><div class="item-price">${item.price.toLocaleString()} د.ع</div></div>
            <button class="delete-btn" onclick="removeFromCart(${index})"><i class="fa-solid fa-trash"></i></button>
        </div>`;
    });
    container.innerHTML = html;
    totalEl.innerText = total.toLocaleString() + " د.ع";
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
}
window.clearCart = function() { cart = []; updateCartUI(); }

// الدفع
window.processCheckout = function() {
    if(cart.length === 0) { showToast("السلة فارغة!"); return; }
    showToast("تم استلام الطلب!");
    clearCart();
    setTimeout(() => showPage('home-page'), 2000);
}

// المستخدم والخدمة
window.handleGoogleLogin = function() {
    showToast("جاري الاتصال...");
    setTimeout(() => {
        user = { name: "مستخدم جديد", email: "user@gmail.com", avatar: "https://via.placeholder.com/80/ff9900/fff?text=U" };
        updateProfileUI();
        showPage('home-page');
        showToast("تم الدخول!");
    }, 1500);
}

function updateProfileUI() {
    if(user) {
        document.getElementById('profile-name').innerText = user.name;
        document.getElementById('profile-email').innerText = user.email;
        document.getElementById('profile-img').src = user.avatar;
        document.getElementById('sidebar-user-info').style.display = 'flex';
        document.getElementById('sidebar-username').innerText = user.name;
        document.getElementById('sidebar-email').innerText = user.email;
    }
}

window.logout = function() {
    user = null;
    document.getElementById('profile-name').innerText = "ضيف";
    document.getElementById('profile-email').innerText = "غير مسجل";
    document.getElementById('sidebar-user-info').style.display = 'none';
    showPage('login-page');
}

window.openWhatsAppSupport = function() {
    if (adminPhoneNumber) window.open(`https://wa.me/${adminPhoneNumber}`, '_blank');
}

// Sidebar Toggles
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
window.toggleSidebar = function() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}
document.getElementById('menu-btn').addEventListener('click', toggleSidebar);
document.getElementById('close-sidebar').addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

// Toast
function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    toast.innerText = msg;
    toast.classList.add('show-toast');
    setTimeout(() => toast.classList.remove('show-toast'), 2000);
}

// Filter
window.filterProducts = function(cat) {
    const cards = document.querySelectorAll('.product-card');
    document.querySelectorAll('.cat-box').forEach(b => b.classList.remove('active'));
    event.currentTarget.querySelector('.cat-box').classList.add('active');
    cards.forEach(card => {
        if(cat === 'all' || card.dataset.category === cat) card.style.display = 'flex';
        else card.style.display = 'none';
    });
}
