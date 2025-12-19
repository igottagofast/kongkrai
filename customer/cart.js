// load cart from local storage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const orderContainer = document.querySelector(".order-container");

//อัพเดตจำนวนตะกร้า
function updateCartCount() {
  const cartQty = document.querySelector(".cartQty");
  cartQty.innerText = cart.length;
}
updateCartCount();

//function อัพเดตตะกร้า
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// function to create one order card
function createMenuItem(item, index) {
  const div = document.createElement("div");
  div.classList.add("menu-container");
  div.dataset.index = index; // เก็บ index ของ cart

  div.innerHTML = `
            <div class="menu-number">
                <label>${index + 1}</label>
            </div>

            <div class="menu-detail">
                <div class="input-section">
                    <label>Menu</label>
                    <input class="main-menu" type="text" value="${item.name}">
                </div>

                <div class="input-section">
                    <label>Customize</label>
                    <textarea class="custom-menu">${
                      item.detail || ""
                    }</textarea>
                </div>
            </div>

            <div class="menu-option">

            <div class="quantity-ware-container">

                    <div class="quantity-button">
                        <div class="decrease">-</div>
                        <input class="quantity" type="text" value="${
                          item.quantity
                        }">
                        <div class="increase">+</div>
                    </div>

                    <div class="item-ware">
                        <label class="radio">
                            <input type="radio" name="ware-${index}" value="1" ${
    item.ware == 1 ? "checked" : ""
  }>
                            <span class="radio-custom"></span>
                            plate
                        </label>

                        <label class="radio">
                            <input type="radio" name="ware-${index}" value="2" ${
    item.ware == 2 ? "checked" : ""
  }>
                            <span class="radio-custom"></span>
                            box
                        </label>
                    </div>
            </div>


                <div class="delete-container">
                    <button class="delete-button">🗑️</button>
                </div>
            </div>

            <div class="delete-overlay" hidden>
                <div class="delete-box">
                    <p>Delete this item?</p>
                    <div class="confirm-delete-button-conatiner">
                        <button class="confirm-delete" id="no">No</button>
                        <button class="confirm-delete" id="yes">Yes</button>
                    </div>
                </div>
            </div>
                `;
  return div;
}

// =============== loop to add each menu card ===============
cart.forEach((item, index) => {
  const menuDom = createMenuItem(item, index);
  orderContainer.appendChild(menuDom);
});

// =============== function to add event in button ===============
function attachEvents() {
  document.querySelectorAll(".menu-container").forEach((box) => {
    const index = Number(box.dataset.index);

    const nameInput = box.querySelector(".main-menu");
    const detailInput = box.querySelector(".custom-menu");
    const qtyInput = box.querySelector(".quantity");
    const inc = box.querySelector(".increase");
    const dec = box.querySelector(".decrease");
    const itemWare = box.querySelector(".item-ware");

    // ---- update name ----
    nameInput.addEventListener("input", () => {
      cart[index].name = nameInput.value;
      saveCart();
    });

    // ---- update detail ----
    detailInput.addEventListener("input", () => {
      cart[index].detail = detailInput.value;
      saveCart();
    });

    // ---- update quantity ----
    qtyInput.addEventListener("change", () => {
      let value = Number(qtyInput.value);
      if (value <= 0 || isNaN(value)) value = 1;

      cart[index].quantity = Number(value);
      qtyInput.value = value;
      saveCart();
    });

    // ---- update item ware ----
    itemWare.addEventListener("change", () => {
      const selected = document.querySelector(
        `input[name="ware-${index}"]:checked`
      );

      cart[index].ware = Number(selected.value);
      saveCart();
    });

    // ---- increase quantity ----
    inc.addEventListener("click", () => {
      cart[index].quantity++;
      qtyInput.value = cart[index].quantity;
      saveCart();
    });
    // ---- decrease quantity ----
    dec.addEventListener("click", () => {
      if (cart[index].quantity > 1) {
        cart[index].quantity--;
        qtyInput.value = cart[index].quantity;
        saveCart();
      } else {
        confirmDelete(dec);
      }
    });
  });

  // delete button
  document.querySelectorAll(".delete-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      confirmDelete(btn);
    });
  });
}
attachEvents();

// =============== loop to add each menu card ===============
function confirmDelete(element) {
  const menuBox = element.closest(".menu-container");
  const overlay = menuBox.querySelector(".delete-overlay");
  const deleteBox = overlay.querySelector(".delete-box");

  deleteBox.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent bubbling to overlay
  });

  overlay.addEventListener("click", () => {
    overlay.style.display = "none";
    return false;
  });

  overlay.style.display = "flex";

  overlay.querySelector("#yes").onclick = () => {
    const index = Number(menuBox.dataset.index);

    cart.splice(index, 1); // ลบออกจาก array
    saveCart();

    menuBox.remove(); // ลบออกจาก DOM
    updateCartCount();

    return true;
  };

  overlay.querySelector("#no").onclick = () => {
    overlay.style.display = "none";
    return false;
  };
}

// =============== customer information card ===============
//order cancel confirm and text button
const orderButton = document.querySelector("#order-button");
const cancelButton = document.querySelector("#cancel-button");
const confirmButton = document.querySelector("#confirm-button");
const confirmText = document.querySelector("#confirm-text");

// ปุ่มเพิ่มเมนู
orderButton.addEventListener("click", () => {
  const cusName = document.querySelector(".customer-name");
  const cusTel = document.querySelector(".customer-phone");

  if (cusName.value == "" || cusTel.value == "") {
    console.log("nope");
    confirmText.textContent = "please enter your name and number!";
    confirmText.hidden = false;

    setTimeout(() => {
      confirmText.hidden = true;
    }, 4000);

    return;
  }

  confirmText.textContent = "confirm your order?";
  orderButton.hidden = true;
  cancelButton.hidden = false;
  confirmButton.hidden = false;
  confirmText.hidden = false;
});

// ปุ่มยกเลิกเพิ่มเมนู
cancelButton.addEventListener("click", () => {
  orderButton.hidden = false;
  cancelButton.hidden = true;
  confirmButton.hidden = true;
  confirmText.hidden = true;
});

// ปุ่ม คอนเฟิร์ม
confirmButton.addEventListener("click", async () => {
  const cusName = document.querySelector(".customer-name").value;
  const cusTel = document.querySelector(".customer-phone").value;

  // เตรียม items ให้ตรง API
  const items = cart.map((item) => ({
    menu_id: item.type === "custom" ? null : Number(item.id),
    name: item.name,
    detail: item.detail || "",
    ware: item.ware == 1 ? "plate" : "box",
    quantity: Number(item.quantity),
  }));

  // request body
  const body = {
    customer_name: cusName,
    customer_tel: cusTel,
    items: items,
  };

  try {
    const res = await fetch("http://localhost:3000/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log("ORDER RESULT:", data);

    // ล้างตะกร้าหลังสั่งเสร็จ
    localStorage.removeItem("cart");

    alert(`Order Success! Queue No: ${data.queue_no}`);
  } catch (err) {
    console.log("order error:", err);
  }
});

document.getElementById("AddOrder").addEventListener("click", function () {
  window.location.href = "menu.html";
});

document.getElementById("cart").addEventListener("click", function () {
  window.location.href = "cart.html";
});
document.querySelector(".feed").addEventListener("click", function () {
  window.location.href = "feed.html";
});
