
const STORAGE_KEY = "stockwise_inventory";

let products = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "null"
) || [
    {
        id: 1,
        name: "Wireless Mouse",
        sku: "ACC-001",
        category: "Accessories",
        price: 450,
        quantity: 20,
        reorder: 5
    },
    {
        id: 2,
        name: "Keyboard",
        sku: "ACC-002",
        category: "Accessories",
        price: 850,
        quantity: 4,
        reorder: 5
    },
    {
        id: 3,
        name: "Notebook",
        sku: "STA-001",
        category: "Stationery",
        price: 80,
        quantity: 0,
        reorder: 10
    }
];

let activities = JSON.parse(
    localStorage.getItem("stockwise_activity") || "[]"
);

function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(products)
    );

    localStorage.setItem(
        "stockwise_activity",
        JSON.stringify(activities)
    );
}

function logActivity(message) {
    activities.unshift(
        new Date().toLocaleString() + " - " + message
    );

    activities = activities.slice(0, 10);
    saveData();
    renderActivity();
}

function getStatus(product) {
    if (product.quantity === 0) return "out";

    if (product.quantity <= product.reorder) {
        return "low";
    }

    return "in";
}

function renderDashboard() {
    const totalProducts = products.length;

    const totalUnits = products.reduce(
        (sum, p) => sum + p.quantity, 0
    );

    const inventoryValue = products.reduce(
        (sum, p) => sum + p.price * p.quantity, 0
    );

    const lowStock = products.filter(
        p => getStatus(p) !== "in"
    ).length;

    document.getElementById("totalProducts").textContent =
        totalProducts;

    document.getElementById("totalUnits").textContent =
        totalUnits;

    document.getElementById("inventoryValue").textContent =
        "₱" + inventoryValue.toLocaleString("en-PH", {
            minimumFractionDigits: 2
        });

    document.getElementById("lowStock").textContent =
        lowStock;
}

function renderProducts() {
    const table = document.getElementById("productTable");

    const search = document.getElementById("search")
        .value.toLowerCase();

    const filter = document.getElementById("stockFilter").value;

    table.innerHTML = "";

    const filtered = products.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(search) ||
            p.sku.toLowerCase().includes(search) ||
            p.category.toLowerCase().includes(search);

        const matchesFilter =
            filter === "all" || getStatus(p) === filter;

        return matchesSearch && matchesFilter;
    });

    filtered.forEach(p => {
        const status = getStatus(p);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(p.name)}</td>
            <td>${escapeHTML(p.sku)}</td>
            <td>${escapeHTML(p.category)}</td>
            <td>₱${Number(p.price).toFixed(2)}</td>
            <td>${p.quantity}</td>
            <td>
                <span class="status ${status}">
                    ${status === "in" ? "In Stock" :
                      status === "low" ? "Low Stock" :
                      "Out of Stock"}
                </span>
            </td>
            <td>
                <button class="action-btn"
                    onclick="editProduct(${p.id})">
                    Edit
                </button>

                <button class="action-btn delete-btn"
                    onclick="deleteProduct(${p.id})">
                    Delete
                </button>
            </td>
        `;

        table.appendChild(row);
    });

    if (filtered.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7">No products found.</td>
            </tr>
        `;
    }

    renderDashboard();
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function openModal() {
    document.getElementById("productForm").reset();
    document.getElementById("productId").value = "";
    document.getElementById("modalTitle").textContent =
        "Add Product";

    document.getElementById("productModal").style.display =
        "flex";
}

function closeModal() {
    document.getElementById("productModal").style.display =
        "none";
}

document.getElementById("productForm")
    .addEventListener("submit", function(e) {
        e.preventDefault();

        const id = document.getElementById("productId").value;

        const product = {
            id: id ? Number(id) : Date.now(),
            name: document.getElementById("name").value.trim(),
            sku: document.getElementById("sku").value.trim(),
            category: document.getElementById("category").value.trim(),
            price: Number(document.getElementById("price").value),
            quantity: Number(document.getElementById("quantity").value),
            reorder: Number(document.getElementById("reorder").value)
        };

        if (products.some(p =>
            p.sku.toLowerCase() === product.sku.toLowerCase() &&
            p.id !== product.id
        )) {
            alert("SKU already exists!");
            return;
        }

        if (id) {
            products = products.map(p =>
                p.id === product.id ? product : p
            );

            logActivity("Updated product: " + product.name);
        } else {
            products.push(product);

            logActivity("Added product: " + product.name);
        }

        saveData();
        renderProducts();
        closeModal();
    });

function editProduct(id) {
    const p = products.find(item => item.id === id);

    if (!p) return;

    document.getElementById("productId").value = p.id;
    document.getElementById("name").value = p.name;
    document.getElementById("sku").value = p.sku;
    document.getElementById("category").value = p.category;
    document.getElementById("price").value = p.price;
    document.getElementById("quantity").value = p.quantity;
    document.getElementById("reorder").value = p.reorder;

    document.getElementById("modalTitle").textContent =
        "Edit Product";

    document.getElementById("productModal").style.display =
        "flex";
}

function deleteProduct(id) {
    const product = products.find(p => p.id === id);

    if (!product) return;

    if (confirm("Delete " + product.name + "?")) {
        products = products.filter(p => p.id !== id);

        logActivity("Deleted product: " + product.name);

        saveData();
        renderProducts();
    }
}

function renderActivity() {
    document.getElementById("activityList").innerHTML =
        activities.length
        ? activities.map(a =>
            `<li>${escapeHTML(a)}</li>`
          ).join("")
        : "<li>No recent activity.</li>";
}

function exportCSV() {
    const headers = [
        "Product", "SKU", "Category",
        "Price", "Quantity", "Reorder Level"
    ];

    const rows = products.map(p => [
        p.name, p.sku, p.category,
        p.price, p.quantity, p.reorder
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(","))
        .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "inventory-report.csv";
    link.click();

    URL.revokeObjectURL(link.href);
}

document.getElementById("search")
    .addEventListener("input", renderProducts);

document.getElementById("stockFilter")
    .addEventListener("change", renderProducts);

renderProducts();
renderActivity();
