// ---------- State ----------
const STORAGE_KEY = "personalExpenseTrackerTransactions";
let transactions = loadTransactions();

// ---------- DOM references ----------
const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const clearBtn = document.getElementById("clearBtn");
const filterSelect = document.getElementById("filter");
const searchInput = document.getElementById("search");
const tableBody = document.getElementById("transactionBody");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");
const currentBalanceEl = document.getElementById("currentBalance");

// ---------- Local storage ----------
function loadTransactions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// ---------- Helpers ----------
function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function formatLKR(value) {
  return "LKR " + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ---------- Validation ----------
function setError(input, errorId, message) {
  document.getElementById(errorId).textContent = message;
  input.classList.toggle("invalid", Boolean(message));
}

function clearErrors() {
  setError(descriptionInput, "descriptionError", "");
  setError(amountInput, "amountError", "");
  setError(categoryInput, "categoryError", "");
  setError(dateInput, "dateError", "");
}

function validateForm() {
  clearErrors();
  let valid = true;

  if (descriptionInput.value.trim() === "") {
    setError(descriptionInput, "descriptionError", "Description is required.");
    valid = false;
  }

  const amount = parseFloat(amountInput.value);
  if (amountInput.value.trim() === "" || isNaN(amount)) {
    setError(amountInput, "amountError", "Amount is required.");
    valid = false;
  } else if (amount <= 0) {
    setError(amountInput, "amountError", "Amount must be greater than zero.");
    valid = false;
  }

  if (categoryInput.value === "") {
    setError(categoryInput, "categoryError", "Please select a category.");
    valid = false;
  }

  if (dateInput.value === "") {
    setError(dateInput, "dateError", "Date is required.");
    valid = false;
  }

  return valid;
}

// ---------- Core features ----------
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;      // pitch in Hz
    gain.gain.value = 0.2;                 // volume (0 to 1)

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.25); // beep lasts 0.25 seconds
  } catch (err) {
    // If audio isn't supported, fail silently
  }
}

function addTransaction(event) {
  event.preventDefault();

  if (!validateForm()) return;

  const transaction = {
    id: Date.now(),
    type: typeInput.value,
    description: descriptionInput.value.trim(),
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value
  };

  transactions.push(transaction);
  saveTransactions();
  render();
  resetForm();
  playBeep();   
  alert("Transaction added successfully!");
}

function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  render();
}

function resetForm() {
  form.reset();
  dateInput.value = todayString();
  clearErrors();
}

function calculateTotals() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return { income, expenses, balance: income - expenses };
}

function getVisibleTransactions() {
  const filter = filterSelect.value;
  const query = searchInput.value.trim().toLowerCase();

  return transactions.filter(t => {
    const matchesType = filter === "all" || t.type === filter;
    const matchesSearch =
      query === "" ||
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });
}

// ---------- Rendering ----------
function renderSummary() {
  const { income, expenses, balance } = calculateTotals();
  totalIncomeEl.textContent = formatLKR(income);
  totalExpensesEl.textContent = formatLKR(expenses);
  currentBalanceEl.textContent = formatLKR(balance);
  currentBalanceEl.classList.toggle("negative", balance < 0);
}

function renderTable() {
  const visible = getVisibleTransactions();

  if (visible.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="empty">No transactions found.</td></tr>';
    return;
  }

  tableBody.innerHTML = visible.map(t => {
    const sign = t.type === "income" ? "+" : "\u2212";
    return `
      <tr>
        <td>${escapeHTML(t.date)}</td>
        <td>${escapeHTML(t.description)}</td>
        <td><span class="badge badge-${t.type}">${t.type}</span></td>
        <td>${escapeHTML(t.category)}</td>
        <td class="right amount-${t.type}">${sign} ${formatLKR(t.amount)}</td>
        <td><button class="btn-delete" data-id="${t.id}">Delete</button></td>
      </tr>`;
  }).join("");
}

function render() {
  renderSummary();
  renderTable();
}

// ---------- Event listeners ----------
form.addEventListener("submit", addTransaction);
clearBtn.addEventListener("click", resetForm);
filterSelect.addEventListener("change", renderTable);
searchInput.addEventListener("input", renderTable);

tableBody.addEventListener("click", event => {
  const btn = event.target.closest(".btn-delete");
  if (btn) deleteTransaction(Number(btn.dataset.id));
});

// ---------- Init ----------
dateInput.value = todayString();
render();