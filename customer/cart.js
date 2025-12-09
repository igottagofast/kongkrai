const orderButton = document.querySelector("#order-button");
const cancelButton = document.querySelector("#cancel-button");
const confirmButton = document.querySelector("#confirm-button");
const confirmText = document.querySelector("#confirm-text");

// for order section
orderButton.addEventListener("click", () => {
  orderButton.hidden = true;
  cancelButton.hidden = false;
  confirmButton.hidden = false;
  confirmText.hidden = false;
});

cancelButton.addEventListener("click", () => {
  orderButton.hidden = false;
  cancelButton.hidden = true;
  confirmButton.hidden = true;
  confirmText.hidden = true;
});

confirmButton.addEventListener("click", () => {
  window.location.href = "index.html";
});

// assign function to quantity button
document.querySelectorAll(".quantity-button").forEach((box) => {
  const input = box.querySelector(".quantity");
  const inc = box.querySelector(".increase");
  const dec = box.querySelector(".decrease");

  //check if input = 0
  input.addEventListener("change", () => {
    if (input.value == 0) {
      if (!confirmDelete(input)) {
        input.value = 1;
      }
    }
  });

  inc.addEventListener("click", () => {
    input.value = Number(input.value) + 1;
  });

  dec.addEventListener("click", () => {
    if (input.value > 1) {
      input.value = Number(input.value) - 1;
    } else if (input.value == 1) {
      confirmDelete(dec);
    }
  });
});

// assign function to
document.querySelectorAll(".delete-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    confirmDelete(btn);
  });
});

//confirm delete
function confirmDelete(element) {
  const menuBox = element.closest(".menu-container");
  const overlay = menuBox.querySelector(".delete-overlay");
  const deleteBox = overlay.querySelector(".delete-box");

  //กันกดลั่นตรง overlaybox
  deleteBox.addEventListener("click", (e) => {
    e.stopPropagation();
  });
  //click overlay แล้วยกเลิกได้
  overlay.addEventListener("click", () => {
    overlay.style.display = "none";
    return false;
  });

  overlay.style.display = "flex";

  overlay.querySelector("#yes").onclick = () => {
    menuBox.remove();
  };

  overlay.querySelector("#no").onclick = () => {
    overlay.style.display = "none";
    return false;
  };
}
