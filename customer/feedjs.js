document.addEventListener("DOMContentLoaded", function () {
  // load cart from local storage
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const orderContainer = document.querySelector(".order-container");

  //อัพเดตจำนวนตะกร้า
  function updateCartCount() {
    const cartQty = document.querySelector(".cartQty");
    cartQty.innerText = cart.length;
  }
  updateCartCount();
  // ======================================================
  // 1) โหลดข้อมูลคิวจาก backend
  // ======================================================

  fetch("http://localhost:3000/queues")
    .then((res) => res.json())
    .then((data) => {
      displayQueues(data);
      updateQueueCount();
      attachQueueClickEvents(); // ต้องเรียกหลัง render เสมอ
    });

  // 2) Update จำนวน queue บน navbar

  function updateQueueCount() {
    const queueCountElement = document.querySelector("#total-order");

    fetch("http://localhost:3000/active-orders-count")
      .then((res) => res.json())
      .then((data) => {
        const activeOrders = data.active_orders;

        // ⭐ แสดงผลบน navbar ตรงนี้!
        queueCountElement.textContent = activeOrders;

        console.log("Active Orders =", activeOrders);
      })
      .catch((err) => console.error("Error:", err));
  }

  // (ฟังก์ชั่นทำเบอร์โทรสี่ตัวท้าย)
  function maskTel(tel) {
    if (!tel) return "";
    const last4 = tel.slice(-4);
    return "x".repeat(tel.length - 4) + last4;
  }

  // 3) แสดงคิวหลัก
  function displayQueues(data) {
    const container = document.querySelector(".queue-container");

    data.forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "queue-wrapper";

      const statusClass = {
        pending: ["pending", "pending-dot"],
        cooking: ["cooking", "cooking-dot"],
        done: ["done", "done-dot"],
        cancel: ["canceled", "canceled-dot"],
      }[item.order_status] || ["pending", "pending-dot"];

      wrapper.innerHTML = `
          <div class="queue-item">
            <div class="queue-info">
              <span class="queue-number">A${item.queue_no}</span>
              <span class="queue-name">${item.customer_name}</span>
              <span class="queue-phone">${maskTel(item.customer_tel)}</span>
            </div>
            <div class="queue-status">
              <span class="status-text ${
                statusClass[0]
              }">${item.order_status.toUpperCase()}</span>
              <span class="status-dot ${statusClass[1]}"></span>
            </div>
          </div>
        `;

      container.appendChild(wrapper);
    });
  }

  // 4) แสดง order items ในคิว
  function attachQueueClickEvents() {
    const queueItems = document.querySelectorAll(".queue-item");
    let currentOpenQueue = null;

    queueItems.forEach((item) => {
      const wrapper = item.parentNode;

      // ถ้าคิวนี้เป็น canceled ให้ข้ามไป
      const statusText = item
        .querySelector(".status-text")
        .textContent.toLowerCase();
      if (statusText === "cancel" || statusText === "canceled") {
        item.style.opacity = "0.5";
        item.style.pointerEvents = "none";
        return;
      }

      item.addEventListener("click", function () {
        const queueNumber = this.querySelector(".queue-number").textContent;

        // ปิด panel เก่าก่อน
        document.querySelectorAll(".detail-panel").forEach((p) => p.remove());
        document.querySelectorAll(".queue-item").forEach((qi) => {
          qi.classList.remove("active");
          qi.style.borderBottomLeftRadius = "25px";
          qi.style.borderBottomRightRadius = "25px";
        });

        // ถ้ากดซ้ำก็ปิดแล้วออก
        if (currentOpenQueue === this) {
          currentOpenQueue = null;
          return;
        }

        // mark active
        this.classList.add("active");

        currentOpenQueue = this;

        // ----------------------------
        // โหลดข้อมูลจริงจาก backend
        // ----------------------------
        const queueNo = queueNumber.replace("A", "");

        fetch(`http://localhost:3000/order-items/${queueNo}`)
          .then((res) => res.json())
          .then((items) => {
            // สร้าง panel จริง
            const detailPanel = document.createElement("div");
            detailPanel.className = "detail-panel";

            // ใส่ข้อมูลอาหารจริง
            items.forEach((food, index) => {
              const foodItem = document.createElement("div");
              foodItem.className = "food-item";
              foodItem.dataset.itemId = food.item_id;

              const status = food.order_status; // ดึงสถานะจาก backend

              switch (status) {
                case "pending":
                  foodItem.innerHTML = `
                                  <div class="item-number">
                                      <span class="food-number">${
                                        index + 1
                                      }</span>
                                  </div>
                                  <div class="item-detail">
                                      <input type="text" value="${
                                        food.item_name
                                      }" readonly>
                                      <textarea name="" id="" readonly>${
                                        food.item_detail || "-"
                                      }</textarea>
                                  </div>
                                  <div class="item-quantity-ware">
                                      <div class="quantity-button">
                                          <div class="decrease">-</div>
                                          <input class="quantity" type="text" value="${
                                            food.item_quantity
                                          }" readonly>
                                          <div class="increase">+</div>
                                      </div>

                                      <div class="item-ware">
                                          <label class="radio">
                                              <input type="radio" name="ware-${index}" value="1" ${
                    food.item_ware == "plate" ? "checked" : ""
                  } disabled>
                                              <span class="radio-custom"></span>
                                              plate
                                          </label>

                                          <label class="radio">
                                              <input type="radio" name="ware-${index}" value="2" ${
                    food.item_ware == "box" ? "checked" : ""
                  } disabled>
                                              <span class="radio-custom"></span>
                                              box
                                          </label>
                                      </div>
                                  </div>
                                  <div class="edit-container">
                                    <button class="edit-button">edit</button>
                                  </div>
                                  <div class="item-delete">
                                      <span class="delete-btn">🗑</span>
                                      <div class="delete-overlay" hidden>
                                          <div class="delete-box">
                                              <p>Delete this item "${
                                                food.item_name
                                              }"?</p>
                                              <div class="confirm-delete-name-tel">
                                                  <label for=""> name
                                                      <input type="text" class="confirm-name">
                                                  </label>
                                                  <label for=""> tel
                                                      <input type="text" class="confirm-tel">
                                                  </label>
                                              </div>
                                              <p id="confirm-text" hidden></p>
                                              <div class="confirm-delete-button-conatiner">
                                                  <button class="confirm-delete" id="no">No</button>
                                                  <button class="confirm-delete" id="yes">Yes</button>
                                              </div>
                                          </div>
                                      </div>
                                  </div>


                              `;
                  break;

                case "cooking":
                  foodItem.innerHTML = `
                                  <div class="item-number">
                                      <span class="food-number">${
                                        index + 1
                                      }</span>
                                  </div>
                                  <div class="item-detail">
                                      <input type="text" class="cooking" value="${
                                        food.item_name
                                      }" readonly>
                                      <textarea name="" id="" class="cooking" readonly>${
                                        food.item_detail || "-"
                                      }</textarea>
                                  </div>
                                  <div class="item-quantity-ware">
                                      <div class="quantity-button">
                                          <div class="decrease cooking">-</div>
                                          <input class="quantity cooking" type="text" value="${
                                            food.item_quantity
                                          }" readonly>
                                          <div class="increase cooking">+</div>
                                      </div>

                                      <div class="item-ware">
                                          <label class="radio cooking" >
                                              <input type="radio" name="ware-${index}" value="1" ${
                    food.item_ware == "plate" ? "checked" : ""
                  } disabled>
                                              <span class="radio-custom" readonly></span>
                                              plate
                                          </label>

                                          <label class="radio cooking" >
                                              <input type="radio" name="ware-${index}" value="2" ${
                    food.item_ware == "box" ? "checked" : ""
                  } disabled>
                                              <span class="radio-custom"></span>
                                              box
                                          </label>
                                      </div>
                                  </div>
                          `;
                  break;

                case "done":
                  foodItem.innerHTML = `
                                  <div class="item-number">
                                      <span class="food-number">${
                                        index + 1
                                      }</span>
                                  </div>
                                  <div class="item-detail">
                                      <input type="text" class="done" value="${
                                        food.item_name
                                      }" readonly>
                                      <textarea name="" id="" class="done" readonly>${
                                        food.item_detail || "-"
                                      }</textarea>
                                  </div>
                                  <div class="item-quantity-ware">
                                      <div class="quantity-button">
                                          <div class="decrease done">-</div>
                                          <input class="quantity done" type="text" value="${
                                            food.item_quantity
                                          }" readonly>
                                          <div class="increase done">+</div>
                                      </div>

                                      <div class="item-ware">
                                          <label class="radio done" >
                                              <input type="radio" name="ware-${index}" value="1" ${
                    food.item_ware == "plate" ? "checked" : ""
                  } disabled>
                                              <span class="radio-custom" readonly></span>
                                              plate
                                          </label>

                                          <label class="radio done" >
                                              <input type="radio" name="ware-${index}" value="2" ${
                    food.item_ware == "box" ? "checked" : ""
                  } disabled>
                                              <span class="radio-custom"></span>
                                              box
                                          </label>
                                      </div>
                                  </div>
                            `;
                  break;

                case "cancel":
                  break;

                default:
                  foodItem.innerHTML = `
                                  <div class="item-number">
                                      <span class="food-number">${
                                        index + 1
                                      }</span>
                                  </div>
                                  <div class="item-detail">
                                      <input type="text" value="${
                                        food.item_name
                                      }">
                                      <textarea name="" id="">${
                                        food.item_detail || "-"
                                      }</textarea>
                                  </div>
                                  <div class="item-quantity-ware">
                                      <div class="quantity-button">
                                          <div class="decrease">-</div>
                                          <input class="quantity" type="text" value="${
                                            food.item_quantity
                                          }">
                                          <div class="increase">+</div>
                                      </div>

                                      <div class="item-ware">
                                          <label class="radio">
                                              <input type="radio" name="ware-${index}" value="1" ${
                    food.item_ware == "plate" ? "checked" : ""
                  }>
                                              <span class="radio-custom"></span>
                                              plate
                                          </label>

                                          <label class="radio">
                                              <input type="radio" name="ware-${index}" value="2" ${
                    food.item_ware == "box" ? "checked" : ""
                  }>
                                              <span class="radio-custom"></span>
                                              box
                                          </label>
                                      </div>
                                  </div>
                                  <div class="item-delete">
                                      <span class="delete-btn">🗑</span>
                                  </div>
                          `;
              }
              // เพิิ่ม order item
              detailPanel.appendChild(foodItem);

              // ===== ปุ่ม Edit เฉพาะสถานะ pending =====
              const editBtn = foodItem.querySelector(".edit-button");
              if (editBtn) {
                editBtn.addEventListener("click", (e) => {
                  e.stopPropagation(); // กันคลิกไปปิด panel

                  const queueNo = item
                    .querySelector(".queue-number")
                    .textContent.replace("A", "");

                  window.location.href = `edit2.html?queue=${queueNo}`;
                });
              }

              const customerName =
                item.querySelector(".queue-name").textContent;
              const customerTel =
                item.querySelector(".queue-phone").textContent;

              setupDeleteOverlay(foodItem, food, {
                customerName,
                customerTel,
              });
            });

            wrapper.appendChild(detailPanel);

            setTimeout(() => detailPanel.classList.add("show"), 10);
          });
      });
    });
  }
});

// addevent delete to delete btn
function setupDeleteOverlay(foodItem, food, customerInfo) {
  const deleteBtn = foodItem.querySelector(".delete-btn");
  const overlay = foodItem.querySelector(".delete-overlay");
  const deleteBox = foodItem.querySelector(".delete-box");

  // ถ้าไม่มี overlay หรือไม่มีปุ่มลบ (เช่น cooking, done) → ไม่ต้องทำอะไร
  if (!deleteBtn || !overlay) return;

  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    overlay.hidden = false;
    overlay.style.display = "flex";
  });

  deleteBox.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent bubbling to overlay
  });

  overlay.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  // ปุ่ม NO
  overlay.querySelector("#no").addEventListener("click", (e) => {
    e.stopPropagation();
    overlay.hidden = true;
    overlay.style.display = "none";
  });

  // ปุ่ม YES
  overlay.querySelector("#yes").addEventListener("click", (e) => {
    e.stopPropagation();

    const realName = customerInfo.customerName;
    const realTel = customerInfo.customerTel;

    const confirmName = overlay.querySelector(".confirm-name").value.trim();
    const confirmTel = overlay.querySelector(".confirm-tel").value.trim();
    const confirmText = overlay.querySelector("#confirm-text");

    if (confirmName === realName && confirmTel === realTel) {
      const itemId = foodItem.dataset.itemId;

      fetch(`http://localhost:3000/order-item/${itemId}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((result) => {
          console.log("Deleted:", result);

          // 🔥 ลบ DOM
          foodItem.remove();

          // 🔥 ปิด overlay
          overlay.style.display = "none";
          overlay.hidden = true;
        });

      return;
    }

    // ❌ ถ้าชื่อหรือเบอร์ผิด
    confirmText.hidden = false;
    confirmText.textContent = "wrong name or tel!";
    confirmText.style.color = "red";

    setTimeout(() => {
      confirmText.hidden = true;
    }, 3000);
  });
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
