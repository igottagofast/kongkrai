fetch("http://localhost:3000/menus")
  .then((res) => res.json())
  .then((data) => {
    displayMenusByCategory(data);
  });

function displayMenusByCategory(data) {
  const container = document.querySelector(".fixed-menu");

  // 1) จัดกลุ่มตาม category
  const groups = {};
  data.forEach((item) => {
    if (!groups[item.menu_category]) {
      groups[item.menu_category] = [];
    }
    groups[item.menu_category].push(item);
  });

  // 2) วนสร้าง HTML ตามหมวดหมู่
  for (const category in groups) {
    // กล่องหมวดหมู่
    const section = document.createElement("div");
    section.classList.add("menu-category");

    // หัวข้อหมวดหมู่
    const header = document.createElement("h3");
    header.textContent = category;
    section.appendChild(header);

    // list เมนูในหมู่
    const list = document.createElement("ol");
    list.classList.add("menu-list");

    groups[category].forEach((menu) => {
      const li = document.createElement("li");
      li.classList.add("menu-item");
      li.dataset.id = menu.menu_id;
      li.dataset.category = menu.menu_category;

      const span = document.createElement("span");
      span.classList.add("menu-name");
      span.textContent = menu.menu_name;

      // สร้างกล่องใหญ่
      const quantityControl = document.createElement("div");
      quantityControl.classList.add("quantity-control");

      // ปุ่ม +
      const addBtn = document.createElement("button");
      addBtn.classList.add("li-add-btn");
      addBtn.textContent = "+";

      // ปุ่มลด (ซ่อนอยู่)
      const decreaseDiv = document.createElement("div");
      decreaseDiv.classList.add("li-decrease");
      decreaseDiv.hidden = true;
      decreaseDiv.textContent = "-";

      // input จำนวน (ซ่อนอยู่)
      const qtyInput = document.createElement("input");
      qtyInput.classList.add("li-quantity");
      qtyInput.type = "text";
      qtyInput.value = "1";
      qtyInput.hidden = true;

      // ปุ่มเพิ่ม (ซ่อนอยู่)
      const increaseDiv = document.createElement("div");
      increaseDiv.classList.add("li-increase");
      increaseDiv.hidden = true;
      increaseDiv.textContent = "+";

      // เอาทุกอย่างใส่ใน quantity-control
      quantityControl.appendChild(addBtn);
      quantityControl.appendChild(decreaseDiv);
      quantityControl.appendChild(qtyInput);
      quantityControl.appendChild(increaseDiv);

      li.appendChild(span);
      li.appendChild(quantityControl);
      list.appendChild(li);
    });

    section.appendChild(list);
    container.appendChild(section);
  }

  // ======================= custom card =======================
  // =========== cart create ===========
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  // เพิ่มเมนูปกติลง cart
  function addNormalMenuToCart(menuId, menuName, menuCategory) {
    let found = cart.find(
      (item) => item.id === menuId && item.type === "normal"
    );

    if (!found) {
      cart.push({
        id: menuId,
        name: menuName,
        detail: null,
        quantity: 1,
        ware: 1, // default ถ้าเมนูปกติ
        type: "normal",
        category: menuCategory,
      });
    }
    saveCart();
  }

  // อัปเดตจำนวนเมนูปกติ
  function updateNormalMenu(id, qty) {
    let found = cart.find((item) => item.id === id && item.type === "normal");

    if (found) {
      found.quantity = qty;
      saveCart();
    }
  }
  // ลบเมนูปกติออกจาก cart
  function removeNormalMenu(id) {
    cart = cart.filter((item) => !(item.id === id && item.type === "normal"));
    saveCart();
  }
  // อัปเดตตะกร้า
  function updateCartCount() {
    const cartQty = document.querySelector(".cartQty");
    cartQty.innerText = cart.length;
  }

  // ======= quantity control =========
  const customQtyInc = document.querySelector(".increase");
  const customQtyDec = document.querySelector(".decrease");
  const customQty = document.querySelector(".quantity");

  //ตรงเลข
  customQty.addEventListener("change", () => {
    let check = Number(customQty.value);

    if (check <= 0 || isNaN(check)) {
      customQty.value = 1;
    }
  });
  // inc ตรง custom
  customQtyInc.addEventListener("click", () => {
    customQty.value = Number(customQty.value) + 1;
  });
  // dec ตรง custom
  customQtyDec.addEventListener("click", () => {
    if (customQty.value == 1) {
      return;
    }
    customQty.value = Number(customQty.value) - 1;
  });

  // ======= add order =========
  const addOrderBtn = document.querySelector(".add-order-btn");

  // add custom menu
  addOrderBtn.addEventListener("click", () => {
    const menu = document.querySelector(".custom-menu");
    const detail = document.querySelector(".detail");
    const quantity = document.querySelector(".quantity");
    const ware = document.querySelector("input[name='ware']:checked")?.value;

    // check menu
    if (menu.value == "") {
      console.log("nope");
      return;
    }
    // check ware if were check
    if (!ware) {
      console.log("please choose ware");
      return;
    }

    const item = {
      id: null,
      name: menu.value,
      detail: detail.value,
      quantity: quantity.value,
      ware: Number(ware),
      type: "custom",
      category: null,
    };
    cart.push(item);
    saveCart();
    updateCartCount();

    // clean custom order card
    menu.value = "";
    detail.value = "";
    quantity.value = 1;
    const wareRadios = document.querySelectorAll("input[name='ware']");
    wareRadios.forEach((r) => (r.checked = false));
  });

  //======================= quantity ตรง li =======================
  document.querySelectorAll(".menu-item").forEach((li) => {
    const liAddBtn = li.querySelector(".li-add-btn");
    const liQtyInc = li.querySelector(".li-increase");
    const liQtyDec = li.querySelector(".li-decrease");
    const liQty = li.querySelector(".li-quantity");
    const menuId = li.dataset.id;
    const menuCategory = li.dataset.category;
    const menuName = li.querySelector(".menu-name").innerText;

    liAddBtn.addEventListener("click", () => {
      liAddBtn.hidden = true;
      liQtyInc.hidden = false;
      liQtyDec.hidden = false;
      liQty.hidden = false;
      liQty.style.display = "flex";

      liQty.value = 1;

      addNormalMenuToCart(menuId, menuName, menuCategory);
      updateCartCount();
    });

    function hideQuantity() {
      liAddBtn.hidden = false;
      liQtyInc.hidden = true;
      liQtyDec.hidden = true;
      liQty.hidden = true;
      liQty.style.display = "none";
    }

    // qty input
    liQty.addEventListener("change", () => {
      let check = Number(liQty.value);
      if (check <= 0 || isNaN(check)) {
        hideQuantity();
        liQty.value = 1;
        removeNormalMenu(menuId);
        updateCartCount();
        return;
      }
      // อัพเดตจำนวนเมนูใน cart
      updateNormalMenu(menuId, check);
      updateCartCount();
    });
    // inc ตรง custom
    liQtyInc.addEventListener("click", () => {
      let newQty = Number(liQty.value) + 1;
      // อัพเดตจำนวนเมนูใน cart
      liQty.value = newQty;

      updateNormalMenu(menuId, newQty);
      updateCartCount();
    });
    // dec ตรง custom
    liQtyDec.addEventListener("click", () => {
      if (liQty.value == 1) {
        hideQuantity();
        // ลบเมนูนี้ใน cart
        removeNormalMenu(menuId);
        updateCartCount();
        return;
      }
      let newQty = Number(liQty.value) - 1;
      liQty.value = newQty;

      updateNormalMenu(menuId, newQty);
      updateCartCount();
    });
  });
  updateCartCount();
}

document.getElementById("AddOrder").addEventListener("click", function () {
  window.location.href = "menu.html";
});

document.getElementById("cart").addEventListener("click", function () {
  window.location.href = "cart.html";
});
document.querySelector(".feed").addEventListener("click", function () {
  window.location.href = "feed.html";
});
