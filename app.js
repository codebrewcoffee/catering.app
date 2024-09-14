document.addEventListener("DOMContentLoaded", () => {
  const menuElement = document.getElementById("menu");
  const orderItemsElement = document.getElementById("order-items");
  const totalCostElement = document.getElementById("total-cost");
  const submitButton = document.getElementById("submit-order");

  let order = [];
  let totalCost = 0;

  // Function to sanitize item names for use in IDs
  function sanitizeId(name) {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^\w-]/g, ""); // Remove non-alphanumeric characters except hyphens
  }

  // Fetch the menu from the server
  fetch("http://localhost:3000/api/menu")
    .then((response) => response.json())
    .then((menu) => {
      menu.forEach((item) => {
        const itemId = sanitizeId(item.name);
        const itemElement = document.createElement("div");
        itemElement.innerHTML = `
          <p><strong>${item.name}</strong> - $${item.price.toFixed(2)}</p>
          <button data-item="${item.name}" data-price="${
          item.price
        }">Add to Order</button>
          ${
            item.sauces
              ? `<select id="sauce-${itemId}" data-item="${item.name}">
                  <option value="">Select a sauce</option>
                  ${item.sauces
                    .map(
                      (sauce) =>
                        `<option value="${sauce}">${
                          sauce.charAt(0).toUpperCase() + sauce.slice(1)
                        }</option>`
                    )
                    .join("")}
                </select>`
              : ""
          }
        `;
        menuElement.appendChild(itemElement);
      });
    })
    .catch((error) => console.error("Error fetching menu:", error));

  // Add item to the order
  menuElement.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const itemName = e.target.getAttribute("data-item");
      const itemPrice = parseFloat(e.target.getAttribute("data-price"));
      const itemId = sanitizeId(itemName);
      const sauceSelect = document.querySelector(`#sauce-${itemId}`);
      const selectedSauce = sauceSelect ? sauceSelect.value : "";
      order.push({ name: itemName, price: itemPrice, sauce: selectedSauce });
      totalCost += itemPrice;
      updateOrderList();
    }
  });

  // Update the order list display and total cost
  function updateOrderList() {
    orderItemsElement.innerHTML = order
      .map(
        (item, index) => `
        <p>
          ${item.name} - $${item.price.toFixed(2)} 
          ${item.sauce ? `with ${item.sauce}` : ""}
          <button data-index="${index}">Remove</button>
        </p>
      `
      )
      .join("");
    totalCostElement.innerText = totalCost.toFixed(2); // Update the displayed total cost
  }

  // Remove item from the order
  orderItemsElement.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const itemIndex = parseInt(e.target.getAttribute("data-index"));
      const itemPrice = order[itemIndex].price;

      // Remove the item from the order array
      order.splice(itemIndex, 1);

      // Update the total cost
      totalCost -= itemPrice;
      updateOrderList();
    }
  });

  // Submit the order
  submitButton.addEventListener("click", () => {
    const phone = document.getElementById("phone").value;
    if (!phone) {
      alert("Please enter your phone number");
      return;
    }

    const orderData = {
      order: order.map((item) => ({ name: item.name, sauce: item.sauce })), // Send item names and sauces
      totalCost, // Send total cost
      phone,
    };

    // Send order to the server
    fetch("http://localhost:3000/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        order = []; // Clear the order
        totalCost = 0; // Reset the total cost
        updateOrderList();
      })
      .catch((err) => {
        console.error(err);
        alert("There was a problem submitting your order");
      });
  });
});
