/* ============================================================
   TiWear – script.js
   Handles: Mobile nav, Cart, Toast, Shop filter/sort,
            Newsletter, Contact form, FAQ accordion, Checkout
   ============================================================ */

/* ── Mobile Nav ────────────────────────────────────────────── */
const bar  = document.getElementById("bar");
const nav  = document.getElementById("navbar");

if (bar && nav) {
    bar.addEventListener("click", () => {
        nav.classList.toggle("active");
        bar.classList.toggle("fa-bars");
        bar.classList.toggle("fa-times");
    });

    // Close nav when a link is clicked
    nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            nav.classList.remove("active");
            bar.classList.add("fa-bars");
            bar.classList.remove("fa-times");
        });
    });

    // Close nav when clicking outside
    document.addEventListener("click", (e) => {
        if (!nav.contains(e.target) && e.target !== bar) {
            nav.classList.remove("active");
            bar.classList.add("fa-bars");
            bar.classList.remove("fa-times");
        }
    });
}


/* ── Toast Notification ─────────────────────────────────────── */
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => { toast.className = "toast"; }, 3000);
}


/* ── Cart (localStorage) ─────────────────────────────────────── */
function getCart() {
    return JSON.parse(localStorage.getItem("tiwear-cart") || "[]");
}

function saveCart(cart) {
    localStorage.setItem("tiwear-cart", JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const cart  = getCart();
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll(".cart-count, #cart-count, #cart-count-mobile")
        .forEach(el => { el.textContent = total; });
}

function addToCart(name, price, img) {
    const cart  = getCart();
    const index = cart.findIndex(i => i.name === name);
    if (index > -1) {
        cart[index].qty += 1;
    } else {
        cart.push({ name, price: Number(price), img, qty: 1 });
    }
    saveCart(cart);
    showToast(`"${name}" added to cart!`);
}

// Attach add-to-cart listeners to all product cards
document.querySelectorAll(".add-to-cart-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        const pro   = btn.closest(".pro");
        const name  = pro.dataset.name;
        const price = pro.dataset.price;
        const img   = pro.dataset.img;
        addToCart(name, price, img);
    });
});

// Run on page load
updateCartBadge();


/* ── Cart Page ───────────────────────────────────────────────── */
const cartTableBody = document.getElementById("cart-table-body");
const cartEmpty     = document.getElementById("cart-empty");
const cartContent   = document.getElementById("cart-content");

let discountPercent = 0;

function renderCart() {
    if (!cartTableBody) return;

    const cart = getCart();

    if (cart.length === 0) {
        if (cartEmpty)   cartEmpty.style.display   = "flex";
        if (cartContent) cartContent.style.display = "none";
        return;
    }

    if (cartEmpty)   cartEmpty.style.display   = "none";
    if (cartContent) cartContent.style.display = "block";

    cartTableBody.innerHTML = cart.map((item, i) => `
        <tr>
            <td><button class="remove-btn" data-index="${i}"><i class="fas fa-times"></i></button></td>
            <td><img src="${item.img}" alt="${item.name}" class="cart-thumb"></td>
            <td>${item.name}</td>
            <td>R${item.price}</td>
            <td>
                <div class="qty-controls">
                    <button class="qty-btn" data-index="${i}" data-action="dec">−</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" data-index="${i}" data-action="inc">+</button>
                </div>
            </td>
            <td>R${item.price * item.qty}</td>
        </tr>
    `).join("");

    // Remove buttons
    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const cart = getCart();
            cart.splice(Number(btn.dataset.index), 1);
            saveCart(cart);
            renderCart();
            updateTotals();
        });
    });

    // Qty buttons
    document.querySelectorAll(".qty-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const cart   = getCart();
            const idx    = Number(btn.dataset.index);
            const action = btn.dataset.action;
            if (action === "inc") {
                cart[idx].qty += 1;
            } else if (action === "dec" && cart[idx].qty > 1) {
                cart[idx].qty -= 1;
            } else if (action === "dec" && cart[idx].qty === 1) {
                cart.splice(idx, 1);
            }
            saveCart(cart);
            renderCart();
            updateTotals();
        });
    });

    updateTotals();
}

function updateTotals() {
    const cart     = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = Math.round(subtotal * discountPercent / 100);
    const total    = subtotal - discount;

    const sub  = document.getElementById("subtotal-display");
    const disc = document.getElementById("discount-display");
    const tot  = document.getElementById("total-display");
    const mTot = document.getElementById("modal-total");

    if (sub)  sub.textContent  = `R${subtotal}`;
    if (disc) disc.textContent = `−R${discount}`;
    if (tot)  tot.innerHTML    = `<strong>R${total}</strong>`;
    if (mTot) mTot.textContent = `R${total}`;
}

// Coupon logic
const applyCouponBtn = document.getElementById("apply-coupon-btn");
const couponInput    = document.getElementById("coupon-input");
const couponMsg      = document.getElementById("coupon-msg");

const COUPONS = { "TIWEAR10": 10, "SAVE20": 20 };

if (applyCouponBtn) {
    applyCouponBtn.addEventListener("click", () => {
        const code = couponInput.value.trim().toUpperCase();
        if (COUPONS[code]) {
            discountPercent = COUPONS[code];
            couponMsg.textContent = `✓ Coupon applied! ${discountPercent}% off.`;
            couponMsg.style.color = "#088178";
            updateTotals();
        } else {
            couponMsg.textContent = "✗ Invalid coupon code.";
            couponMsg.style.color = "#e74c3c";
        }
    });
}

// Checkout button → open modal
const checkoutBtn     = document.getElementById("checkout-btn");
const checkoutModal   = document.getElementById("checkout-modal");
const modalClose      = document.getElementById("modal-close");
const placeOrderBtn   = document.getElementById("place-order-btn");
const successModal    = document.getElementById("success-modal");

if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        const cart = getCart();
        if (cart.length === 0) { showToast("Your cart is empty!", "error"); return; }
        updateTotals();
        checkoutModal.style.display = "flex";
    });
}

if (modalClose) {
    modalClose.addEventListener("click", () => {
        checkoutModal.style.display = "none";
    });
}

if (checkoutModal) {
    checkoutModal.addEventListener("click", (e) => {
        if (e.target === checkoutModal) checkoutModal.style.display = "none";
    });
}

if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", () => {
        const fname   = document.getElementById("co-fname").value.trim();
        const email   = document.getElementById("co-email").value.trim();
        const address = document.getElementById("co-address").value.trim();
        const payment = document.getElementById("co-payment").value;

        if (!fname || !email || !address || !payment) {
            showToast("Please fill in all required fields.", "error");
            return;
        }

        // Clear cart and show success
        localStorage.removeItem("tiwear-cart");
        updateCartBadge();
        checkoutModal.style.display = "none";
        successModal.style.display  = "flex";
        renderCart();
    });
}


/* ── Shop Page: Filter & Sort ───────────────────────────────── */
const categoryFilter = document.getElementById("category-filter");
const sortFilter     = document.getElementById("sort-filter");
const shopProducts   = document.getElementById("shop-products");
const noResults      = document.getElementById("no-results");
const resultsCount   = document.getElementById("results-count");

function filterAndSort() {
    if (!shopProducts) return;

    const category = categoryFilter ? categoryFilter.value : "all";
    const sort     = sortFilter ? sortFilter.value : "default";

    let products = Array.from(shopProducts.querySelectorAll(".pro"));

    // Filter
    products.forEach(p => {
        const cat = p.dataset.category || "";
        p.style.display = (category === "all" || cat === category) ? "block" : "none";
    });

    // Visible products for sorting
    const visible = products.filter(p => p.style.display !== "none");

    // Sort
    visible.sort((a, b) => {
        const priceA = Number(a.dataset.price);
        const priceB = Number(b.dataset.price);
        const nameA  = a.dataset.name.toLowerCase();
        const nameB  = b.dataset.name.toLowerCase();

        if (sort === "price-asc")  return priceA - priceB;
        if (sort === "price-desc") return priceB - priceA;
        if (sort === "name-asc")   return nameA.localeCompare(nameB);
        return 0;
    });

    // Re-insert in sorted order
    visible.forEach(p => shopProducts.appendChild(p));

    // No results message
    if (noResults) noResults.style.display = visible.length === 0 ? "flex" : "none";

    // Results count
    if (resultsCount) {
        const label = category === "all" ? "all products" : category;
        resultsCount.textContent = `Showing ${visible.length} product${visible.length !== 1 ? "s" : ""} in "${label}"`;
    }
}

if (categoryFilter) categoryFilter.addEventListener("change", filterAndSort);
if (sortFilter)     sortFilter.addEventListener("change", filterAndSort);
if (shopProducts)   filterAndSort(); // init


/* ── Newsletter ─────────────────────────────────────────────── */
const newsletterBtn = document.getElementById("newsletter-btn");

if (newsletterBtn) {
    newsletterBtn.addEventListener("click", () => {
        const emailInput = document.getElementById("newsletter-email");
        if (!emailInput) return;
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showToast("Please enter a valid email address.", "error");
            return;
        }
        showToast("Thanks for subscribing! 🎉");
        emailInput.value = "";
    });
}


/* ── Contact Form ───────────────────────────────────────────── */
const contactSubmitBtn = document.getElementById("contact-submit-btn");
const contactFeedback  = document.getElementById("contact-feedback");

if (contactSubmitBtn) {
    contactSubmitBtn.addEventListener("click", () => {
        const name    = document.getElementById("contact-name").value.trim();
        const email   = document.getElementById("contact-email").value.trim();
        const subject = document.getElementById("contact-subject").value.trim();
        const message = document.getElementById("contact-message").value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!name || !email || !subject || !message) {
            showToast("Please fill in all fields.", "error");
            return;
        }
        if (!emailRegex.test(email)) {
            showToast("Please enter a valid email address.", "error");
            return;
        }

        // Simulate sending
        contactSubmitBtn.textContent = "Sending...";
        contactSubmitBtn.disabled = true;

        setTimeout(() => {
            if (contactFeedback) {
                contactFeedback.textContent = "✓ Message sent! We'll get back to you soon.";
                contactFeedback.style.color = "#088178";
            }
            contactSubmitBtn.textContent = "Send Message";
            contactSubmitBtn.disabled = false;

            document.getElementById("contact-name").value    = "";
            document.getElementById("contact-email").value   = "";
            document.getElementById("contact-subject").value = "";
            document.getElementById("contact-message").value = "";

            showToast("Message sent successfully!");
        }, 1500);
    });
}


/* ── FAQ Accordion ──────────────────────────────────────────── */
document.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
        const item     = btn.closest(".faq-item");
        const answer   = item.querySelector(".faq-answer");
        const isOpen   = item.classList.contains("open");
        const icon     = btn.querySelector("i");

        // Close all
        document.querySelectorAll(".faq-item").forEach(fi => {
            fi.classList.remove("open");
            fi.querySelector(".faq-answer").style.maxHeight = null;
            const ic = fi.querySelector(".faq-question i");
            if (ic) ic.style.transform = "rotate(0deg)";
        });

        // Toggle clicked
        if (!isOpen) {
            item.classList.add("open");
            answer.style.maxHeight = answer.scrollHeight + "px";
            if (icon) icon.style.transform = "rotate(180deg)";
        }
    });
});


/* ── Hero button cursor fix ─────────────────────────────────── */
const heroBtns = document.querySelectorAll("#hero button");
heroBtns.forEach(btn => { btn.style.cursor = "pointer"; });
