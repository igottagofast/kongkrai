// load cart from local storage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const orderContainer = document.querySelector(".order-container");

//อัพเดตจำนวนตะกร้า
function updateCartCount() {
  const cartQty = document.querySelector(".cartQty");
  cartQty.innerText = cart.length;
}
updateCartCount();

const params = new URLSearchParams(location.search);
const queueNo = params.get("queue");

const menuList = document.querySelector(".menu-list");
const queueDisplay = document.querySelector(".queue-display");

queueDisplay.textContent = "A" + queueNo;

let orderItems = [];
let originalCustomer = {};

//
fetch(`http://localhost:3000/order-items/${queueNo}`)
  .then((res) => res.json())
  .then((data) => {
    orderItems = data;
    renderItems();
    loadCustomerInfo(data);
  });

/* =========================================
            2) โหลดข้อมูลลูกค้า
        ========================================== */
function loadCustomerInfo(data) {
  // front-end ไม่มี customer info ต้องดึงจาก queue API
  fetch("http://localhost:3000/queues")
    .then((res) => res.json())
    .then((list) => {
      const q = list.find((x) => x.queue_no == queueNo);
      if (q) {
        originalCustomer = q;
      }
    });
}
/* =========================================
           3) Render รายการอาหารในหน้า edit
        ========================================== */
function renderItems() {
  menuList.innerHTML = "";

  orderItems.forEach((item, index) => {
    const div = document.createElement("section");
    div.className = "menu";
    div.dataset.itemId = item.item_id;

    div.innerHTML = `
                    <div class="menu-num">${index + 1}</div>

                    <div class="menu-detail">
                        <div class="input-section">
                            <label>Menu</label>
                            <input type="text" class="main-menu" value="${
                              item.item_name
                            }">
                        </div>

                        <div class="input-section">
                            <label>Customize</label>
                            <textarea class="custom-menu">${
                              item.item_detail || ""
                            }</textarea>
                        </div>
                    </div>

                    <div class="menu-option">

                        <div class="quantity-button">
                            <div class="decrease">-</div>
                            <input class="quantity" type="text" value="${
                              item.item_quantity
                            }">
                            <div class="increase">+</div>
                        </div>

                        <div class="item-ware">
                            <label class="radio">
                                <input type="radio" name="ware-${index}" value="plate" ${
      item.item_ware === "plate" ? "checked" : ""
    }>
                                <span class="radio-custom"></span>
                                Plate
                            </label>

                            <label class="radio">
                                <input type="radio" name="ware-${index}" value="box" ${
      item.item_ware === "box" ? "checked" : ""
    }>
                                <span class="radio-custom"></span>
                                Box
                            </label>
                        </div>
                    </div>
                    

                <div class="delete-container">
                    <button class="delete-button">🗑️</button>
                </div>        
                
                `;

    /* --- Add quantity events --- */
    const quantityInput = div.querySelector(".quantity");
    div.querySelector(".increase").onclick = () => {
      quantityInput.value = Number(quantityInput.value) + 1;
    };
    div.querySelector(".decrease").onclick = () => {
      if (quantityInput.value > 1)
        quantityInput.value = Number(quantityInput.value) - 1;
    };

    /* --- Delete item --- */
    const deleteBtn = div.querySelector(".delete-button");
    deleteBtn.addEventListener("click", () => {
      const inputName = document.querySelector(".customer-name").value.trim();
      const inputTel = document.querySelector(".customer-tel").value.trim();

      const realName = originalCustomer.customer_name;
      const realTel = originalCustomer.customer_tel;

      // ========== ตรวจสอบก่อนลบ ==========
      if (inputName !== realName || inputTel !== realTel) {
        alert("Name or Tel does not match. Cannot delete this item.");
        return;
      }

      // ========== เด้ง confirm() แทน overlay ==========
      const ok = confirm("Are you sure you want to delete this item?");
      if (!ok) return;

      // ลบรายการจริง
      deleteItem(item.item_id, div);
    });

    menuList.appendChild(div);
  });
}

function confirmDelete(element, itemId, container) {
  const menuBox = container; // div .menu ที่ส่งเข้ามา
  const overlay = menuBox.querySelector(".delete-overlay");
  const btnNo = overlay.querySelector(".btn-no");
  const btnYes = overlay.querySelector(".btn-yes");

  // เปิด overlay
  overlay.hidden = false;

  // ห้ามปิด overlay ถ้าคลิกข้างในกล่อง
  overlay.querySelector(".delete-box").addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // คลิกนอกกล่อง → ปิด overlay
  overlay.addEventListener("click", () => {
    overlay.hidden = true;
  });

  // ปุ่ม No → ปิด overlay
  btnNo.onclick = () => {
    overlay.hidden = true;
  };

  // ปุ่ม Yes → ลบจริง
  btnYes.onclick = () => {
    deleteItem(itemId, menuBox); // ← ลบจาก backend + DOM
  };
}

function deleteItem(itemId, element) {
  fetch(`http://localhost:3000/order-item/${itemId}`, {
    method: "DELETE",
  })
    .then((res) => res.json())
    .then((result) => {
      console.log("Deleted:", result);
      element.remove();
    });
}

/* =========================================
           5) Save changes to backend
        ========================================== */
document.querySelector(".save-btn").addEventListener("click", () => {
  const inputName = document.querySelector(".customer-name").value.trim();
  const inputTel = document.querySelector(".customer-tel").value.trim();

  const realName = originalCustomer.customer_name;
  const realTel = originalCustomer.customer_tel;

  // ===========================
  // Validate ก่อนบันทึก
  // ===========================
  if (inputName !== realName || inputTel !== realTel) {
    alert("Name or Tel is incorrect! Please try again.");
    return; // ❌ หยุด ไม่ให้ save
  }

  // ===========================
  // ถ้าชื่อ-เบอร์ถูก → save items
  // ===========================
  const updatedItems = [...document.querySelectorAll(".menu")].map((div) => ({
    item_id: div.dataset.itemId,
    name: div.querySelector(".main-menu").value,
    detail: div.querySelector(".custom-menu").value,
    quantity: div.querySelector(".quantity").value,
    ware: div.querySelector("input[type='radio']:checked").value,
  }));

  fetch("http://localhost:3000/update-order-items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      queueNo,
      items: updatedItems,
    }),
  })
    .then((res) => res.json())
    .then((result) => {
      alert("Updated Successfully!");
      console.log(result);
      window.location.href = `feed.html`;
    });
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

document.getElementById("AddOrder").addEventListener("click", function () {
  window.location.href = "menu.html";
});

document.getElementById("cart").addEventListener("click", function () {
  window.location.href = "cart.html";
});
document.querySelector(".feed").addEventListener("click", function () {
  window.location.href = "feed.html";
});
