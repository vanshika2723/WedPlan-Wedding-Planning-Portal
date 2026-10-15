/* =====================================================
   WedPlan — Wedding Planning Portal
   Features:
   Budget Planner, Vendors, Guest List, Checklist,
   Countdown, Timeline, Message Board, Dark Mode,
   Demo Login/Register and LocalStorage
===================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const STORAGE_KEY = "wedplan_data_v1";
  const THEME_KEY = "wedplan_theme";

  const defaultData = {
    wedding: {
      partnerOne: "",
      partnerTwo: "",
      date: "",
      location: ""
    },
    budget: 500000,
    expenses: [],
    guests: [],
    tasks: [
      { id: 1, name: "Set the wedding budget", category: "Planning", completed: false },
      { id: 2, name: "Choose your wedding venue", category: "Venue", completed: false },
      { id: 3, name: "Prepare the guest list", category: "Guests", completed: false },
      { id: 4, name: "Book a wedding photographer", category: "Planning", completed: false },
      { id: 5, name: "Select wedding outfits", category: "Shopping", completed: false },
      { id: 6, name: "Finalize decorations", category: "Ceremony", completed: false },
      { id: 7, name: "Confirm catering arrangements", category: "Planning", completed: false },
      { id: 8, name: "Send wedding invitations", category: "Guests", completed: false }
    ],
    savedVendors: [],
    timeline: [
      { id: 1, time: "09:00", event: "Getting Ready", location: "Bridal Suite" },
      { id: 2, time: "12:00", event: "Wedding Ceremony", location: "Main Venue" },
      { id: 3, time: "14:00", event: "Wedding Photography", location: "Garden" },
      { id: 4, time: "18:00", event: "Reception & Celebration", location: "Reception Hall" }
    ],
    messages: [],
    users: [],
    currentUser: null,
    newsletterEmails: []
  };

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(defaultData));
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return cloneDefaults();

      const parsed = JSON.parse(saved);
      const defaults = cloneDefaults();

      return {
        ...defaults,
        ...parsed,
        wedding: { ...defaults.wedding, ...(parsed.wedding || {}) },
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        guests: Array.isArray(parsed.guests) ? parsed.guests : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : defaults.tasks,
        savedVendors: Array.isArray(parsed.savedVendors) ? parsed.savedVendors : [],
        timeline: Array.isArray(parsed.timeline) ? parsed.timeline : defaults.timeline,
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        newsletterEmails: Array.isArray(parsed.newsletterEmails)
          ? parsed.newsletterEmails
          : []
      };
    } catch (error) {
      console.error("Could not load WedPlan data:", error);
      return cloneDefaults();
    }
  }

  let data = loadData();
  let activeTaskFilter = "all";
  let authMode = "login";
  let toastTimer;

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Could not save WedPlan data:", error);
      showToast("Unable to save. Browser storage may be full.");
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);
  }

  function formatDate(dateValue) {
    if (!dateValue) return "Choose your wedding date";

    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "Choose your wedding date";

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function createId() {
    return Date.now() + Math.floor(Math.random() * 10000);
  }

  function showToast(message) {
    const toast = $("#appToast");
    const toastMessage = $("#toastMessage");

    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function showModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    const firstInput = modal.querySelector("input");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50);
    }
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.add("hidden");

    if (!$(".modal-overlay:not(.hidden)")) {
      document.body.style.overflow = "";
    }
  }

  function setFormVisibility(form, visible) {
    if (!form) return;
    form.classList.toggle("hidden", !visible);
  }

  /* =====================================================
     Mobile Navigation
  ===================================================== */

  const menuToggle = $("#menuToggle");
  const mainNav = $("#mainNav");

  menuToggle?.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));

    menuToggle.innerHTML = isOpen
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars"></i>';
  });

  $$(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav?.classList.remove("open");
      menuToggle?.setAttribute("aria-expanded", "false");

      if (menuToggle) {
        menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
      }
    });
  });

  /* =====================================================
     Active Navigation on Scroll
  ===================================================== */

  const navigationSections = $$(".section[id]");

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        $$(".nav-link").forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${entry.target.id}`
          );
        });
      });
    }, {
      rootMargin: "-25% 0px -60% 0px"
    });

    navigationSections.forEach((section) => sectionObserver.observe(section));
  }

  /* =====================================================
     Dark Mode
  ===================================================== */

  const themeToggle = $("#themeToggle");

  function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");

    if (themeToggle) {
      themeToggle.innerHTML = theme === "dark"
        ? '<i class="fa-regular fa-sun"></i>'
        : '<i class="fa-regular fa-moon"></i>';
    }
  }

  let savedTheme = "light";

  try {
    savedTheme = localStorage.getItem(THEME_KEY) || "light";
  } catch (error) {
    console.warn("Theme preference is unavailable.");
  }

  applyTheme(savedTheme);

  themeToggle?.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark-mode")
      ? "light"
      : "dark";

    applyTheme(nextTheme);

    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (error) {
      console.warn("Could not save theme preference.");
    }

    showToast(`${nextTheme === "dark" ? "Dark" : "Light"} mode enabled`);
  });

  /* =====================================================
     Wedding Details and Countdown
  ===================================================== */

  const weddingModal = $("#weddingModal");
  const weddingDetailsForm = $("#weddingDetailsForm");
  const editWeddingButton = $("#editWeddingButton");
  const weddingDateInput = $("#weddingDate");

  function renderWeddingDetails() {
    const wedding = data.wedding;
    const names = [wedding.partnerOne, wedding.partnerTwo]
      .filter(Boolean)
      .join(" & ");

    $("#coupleNames").textContent = names || "Your Love Story";
    $("#weddingLocation").textContent = wedding.location || "Your dream destination";
    $("#dashboardWeddingDate").textContent = formatDate(wedding.date);
    $("#heroWeddingDate").textContent = wedding.date
      ? formatDate(wedding.date)
      : "Set your date";

    if (weddingDateInput) {
      weddingDateInput.value = wedding.date || "";
      weddingDateInput.min = new Date().toLocaleDateString("en-CA");
    }

    $("#partnerOne").value = wedding.partnerOne || "";
    $("#partnerTwo").value = wedding.partnerTwo || "";
    $("#weddingCity").value = wedding.location || "";

    renderCountdown();
  }

  function renderCountdown() {
    const dateValue = data.wedding.date;

    if (!dateValue) {
      $("#countDays").textContent = "000";
      $("#countHours").textContent = "00";
      $("#countMinutes").textContent = "00";
      $("#countSeconds").textContent = "00";
      return;
    }

    const target = new Date(`${dateValue}T00:00:00`).getTime();
    const difference = target - Date.now();

    if (Number.isNaN(target) || difference <= 0) {
      $("#countDays").textContent = "000";
      $("#countHours").textContent = "00";
      $("#countMinutes").textContent = "00";
      $("#countSeconds").textContent = "00";
      return;
    }

    const days = Math.floor(difference / 86400000);
    const hours = Math.floor((difference % 86400000) / 3600000);
    const minutes = Math.floor((difference % 3600000) / 60000);
    const seconds = Math.floor((difference % 60000) / 1000);

    $("#countDays").textContent = String(days).padStart(3, "0");
    $("#countHours").textContent = String(hours).padStart(2, "0");
    $("#countMinutes").textContent = String(minutes).padStart(2, "0");
    $("#countSeconds").textContent = String(seconds).padStart(2, "0");
  }

  editWeddingButton?.addEventListener("click", () => {
    renderWeddingDetails();
    showModal("weddingModal");
  });

  weddingDetailsForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const chosenDate = weddingDateInput.value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (chosenDate && new Date(`${chosenDate}T00:00:00`) < today) {
      showToast("Please select today or a future wedding date.");
      return;
    }

    data.wedding = {
      partnerOne: $("#partnerOne").value.trim(),
      partnerTwo: $("#partnerTwo").value.trim(),
      date: chosenDate,
      location: $("#weddingCity").value.trim()
    };

    saveData();
    renderWeddingDetails();
    closeModal("weddingModal");
    showToast("Wedding details saved!");
  });

  setInterval(renderCountdown, 1000);

  /* =====================================================
     Budget Planner
  ===================================================== */

  const totalBudgetInput = $("#totalBudget");
  const expenseForm = $("#expenseForm");

  totalBudgetInput.value = data.budget;

  function renderBudget() {
    const budget = Math.max(0, Number(data.budget) || 0);
    const expenses = data.expenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );

    const remaining = budget - expenses;
    const percentage = budget > 0 ? Math.min((expenses / budget) * 100, 100) : 0;

    $("#totalExpenses").textContent = formatCurrency(expenses);
    $("#remainingBudget").textContent = formatCurrency(remaining);
    $("#remainingBudget").style.color = remaining < 0
      ? "var(--danger)"
      : "var(--success)";

    $("#budgetProgressFill").style.width = `${percentage}%`;
    $("#budgetUsedPercent").textContent =
      `${budget > 0 ? Math.round((expenses / budget) * 100) : 0}%`;

    $("#dashboardBudget").textContent = formatCurrency(budget);

    const body = $("#expenseTableBody");

    if (!data.expenses.length) {
      body.innerHTML = `
        <tr class="empty-row">
          <td colspan="4">No expenses yet. Add your first expense!</td>
        </tr>`;
      return;
    }

    body.innerHTML = data.expenses.map((expense) => `
      <tr>
        <td>${escapeHTML(expense.name)}</td>
        <td>${escapeHTML(expense.category)}</td>
        <td><strong>${formatCurrency(expense.amount)}</strong></td>
        <td>
          <button class="table-action" data-delete-expense="${expense.id}"
            aria-label="Delete ${escapeHTML(expense.name)}" title="Delete expense">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }

  totalBudgetInput?.addEventListener("change", () => {
    const value = Number(totalBudgetInput.value);

    if (!Number.isFinite(value) || value < 0) {
      showToast("Enter a valid non-negative budget.");
      totalBudgetInput.value = data.budget;
      return;
    }

    data.budget = value;
    saveData();
    renderBudget();
    showToast("Budget updated!");
  });

  $("#addExpenseButton")?.addEventListener("click", () => {
    setFormVisibility(expenseForm, true);
    $("#expenseName").focus();
  });

  $("#cancelExpenseButton")?.addEventListener("click", () => {
    expenseForm.reset();
    setFormVisibility(expenseForm, false);
  });

  expenseForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("#expenseName").value.trim();
    const amount = Number($("#expenseAmount").value);
    const category = $("#expenseCategory").value;

    if (!name || !Number.isFinite(amount) || amount <= 0) {
      showToast("Enter a valid expense name and amount.");
      return;
    }

    data.expenses.push({
      id: createId(),
      name,
      amount,
      category
    });

    saveData();
    renderBudget();
    expenseForm.reset();
    setFormVisibility(expenseForm, false);
    showToast("Expense added successfully!");
  });

  $("#expenseTableBody")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-expense]");
    if (!button) return;

    const id = Number(button.dataset.deleteExpense);
    data.expenses = data.expenses.filter((expense) => expense.id !== id);

    saveData();
    renderBudget();
    showToast("Expense deleted.");
  });

  /* =====================================================
     Vendor Directory
  ===================================================== */

  const vendors = [
    {
      id: "v1",
      name: "Royal Garden Palace",
      category: "Venue",
      location: "Jaipur, Rajasthan",
      price: 150000,
      rating: 4.9,
      reviews: 128,
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
      description: "A beautiful celebration venue with elegant spaces for memorable wedding ceremonies."
    },
    {
      id: "v2",
      name: "Golden Hour Photography",
      category: "Photography",
      location: "Delhi, India",
      price: 45000,
      rating: 4.8,
      reviews: 96,
      image: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80",
      description: "Capture your candid moments, beautiful portraits and timeless wedding memories."
    },
    {
      id: "v3",
      name: "Blush & Bloom Decor",
      category: "Decoration",
      location: "Alwar, Rajasthan",
      price: 65000,
      rating: 4.7,
      reviews: 74,
      image: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=900&q=80",
      description: "Romantic floral arrangements, stage styling and personalized wedding decoration."
    },
    {
      id: "v4",
      name: "The Royal Platter",
      category: "Catering",
      location: "Jaipur, Rajasthan",
      price: 1200,
      rating: 4.8,
      reviews: 105,
      image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=80",
      description: "Thoughtful menus and delicious dining experiences for your wedding guests."
    },
    {
      id: "v5",
      name: "Glow Bridal Studio",
      category: "Makeup",
      location: "Gurugram, India",
      price: 18000,
      rating: 4.6,
      reviews: 62,
      image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80",
      description: "Bridal makeup and styling to help you feel confident on your special day."
    },
    {
      id: "v6",
      name: "Evergreen Celebrations",
      category: "Music",
      location: "Delhi, India",
      price: 25000,
      rating: 4.7,
      reviews: 51,
      image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80",
      description: "Live music and entertainment for a joyful celebration with family and friends."
    }
  ];

  let showAllVendors = false;

  function renderVendors() {
    const search = ($("#vendorSearch").value || "").trim().toLowerCase();
    const category = $("#vendorCategoryFilter").value;
    const sort = $("#vendorSort").value;

    let filtered = vendors.filter((vendor) => {
      const matchesSearch =
        `${vendor.name} ${vendor.category} ${vendor.location} ${vendor.description}`
          .toLowerCase().includes(search);

      const matchesCategory = category === "all" || vendor.category === category;

      return matchesSearch && matchesCategory;
    });

    if (sort === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sort === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    }

    const visibleVendors = showAllVendors ? filtered : filtered.slice(0, 6);
    const grid = $("#vendorGrid");

    $("#vendorEmpty").classList.toggle("hidden", filtered.length > 0);

    grid.innerHTML = visibleVendors.map((vendor) => {
      const isSaved = data.savedVendors.includes(vendor.id);

      return `
        <article class="vendor-card">
          <div class="vendor-image">
            <img src="${escapeHTML(vendor.image)}"
              alt="${escapeHTML(vendor.name)}" loading="lazy">
            <span class="vendor-category">${escapeHTML(vendor.category)}</span>
            <button class="vendor-favorite ${isSaved ? "saved" : ""}"
              data-favorite-vendor="${vendor.id}"
              aria-label="${isSaved ? "Remove" : "Save"} ${escapeHTML(vendor.name)}"
              title="${isSaved ? "Remove from favorites" : "Save to favorites"}">
              <i class="${isSaved ? "fa-solid" : "fa-regular"} fa-heart"></i>
            </button>
          </div>
          <div class="vendor-content">
            <h3>${escapeHTML(vendor.name)}</h3>
            <p class="vendor-location"><i class="fa-solid fa-location-dot"></i> ${escapeHTML(vendor.location)}</p>
            <p class="vendor-description">${escapeHTML(vendor.description)}</p>
            <div class="vendor-bottom">
              <div class="vendor-price">
                ${formatCurrency(vendor.price)}
                <small>${vendor.category === "Catering" ? "per plate (sample)" : "starting price (sample)"}</small>
              </div>
              <div class="vendor-rating">
                <i class="fa-solid fa-star"></i> ${vendor.rating}
                <span>(${vendor.reviews})</span>
              </div>
            </div>
            <button class="btn btn-outline btn-full" style="margin-top:15px"
              data-view-vendor="${vendor.id}">View Details <i class="fa-solid fa-arrow-right"></i></button>
          </div>
        </article>
      `;
    }).join("");

    $("#dashboardVendors").textContent = data.savedVendors.length;
  }

  $("#vendorSearch")?.addEventListener("input", renderVendors);
  $("#vendorCategoryFilter")?.addEventListener("change", renderVendors);
  $("#vendorSort")?.addEventListener("change", renderVendors);

  $("#showAllVendorsButton")?.addEventListener("click", () => {
    showAllVendors = !showAllVendors;
    $("#showAllVendorsButton").innerHTML = showAllVendors
      ? 'Show Featured <i class="fa-solid fa-arrow-up"></i>'
      : 'View All Vendors <i class="fa-solid fa-arrow-right"></i>';

    renderVendors();
  });

  $("#vendorGrid")?.addEventListener("click", (event) => {
    const favoriteButton = event.target.closest("[data-favorite-vendor]");
    const detailButton = event.target.closest("[data-view-vendor]");

    if (favoriteButton) {
      const id = favoriteButton.dataset.favoriteVendor;

      if (data.savedVendors.includes(id)) {
        data.savedVendors = data.savedVendors.filter((savedId) => savedId !== id);
        showToast("Vendor removed from favorites.");
      } else {
        data.savedVendors.push(id);
        showToast("Vendor saved to favorites!");
      }

      saveData();
      renderVendors();
      return;
    }

    if (detailButton) {
      const vendor = vendors.find((item) => item.id === detailButton.dataset.viewVendor);
      if (!vendor) return;

      $("#vendorDetailContent").innerHTML = `
        <div class="vendor-detail-content">
          <img src="${escapeHTML(vendor.image)}" alt="${escapeHTML(vendor.name)}">
          <div>
            <span class="eyebrow">${escapeHTML(vendor.category)}</span>
            <h3>${escapeHTML(vendor.name)}</h3>
            <p><i class="fa-solid fa-location-dot"></i> ${escapeHTML(vendor.location)}</p>
            <p><i class="fa-solid fa-star" style="color:var(--warning)"></i> ${vendor.rating} / 5 · ${vendor.reviews} sample reviews</p>
            <p>${escapeHTML(vendor.description)}</p>
            <p><strong>${formatCurrency(vendor.price)}</strong> <span style="color:var(--text-light)">sample starting price</span></p>
            <button class="btn btn-primary" data-detail-favorite="${vendor.id}">
              <i class="fa-solid fa-heart"></i>
              ${data.savedVendors.includes(vendor.id) ? "Remove Favorite" : "Save Favorite"}
            </button>
          </div>
        </div>
      `;

      $("#vendorDetailPanel").classList.remove("hidden");
      $("#vendorDetailPanel").scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  $("#vendorDetailContent")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-detail-favorite]");
    if (!button) return;

    const id = button.dataset.detailFavorite;

    if (data.savedVendors.includes(id)) {
      data.savedVendors = data.savedVendors.filter((savedId) => savedId !== id);
      showToast("Vendor removed from favorites.");
    } else {
      data.savedVendors.push(id);
      showToast("Vendor saved to favorites!");
    }

    saveData();
    renderVendors();

    const vendor = vendors.find((item) => item.id === id);
    if (vendor) {
      button.innerHTML = `
        <i class="fa-solid fa-heart"></i>
        ${data.savedVendors.includes(id) ? "Remove Favorite" : "Save Favorite"}
      `;
    }
  });

  $("#closeVendorDetail")?.addEventListener("click", () => {
    $("#vendorDetailPanel").classList.add("hidden");
  });

  /* =====================================================
     Guest Management
  ===================================================== */

  const guestForm = $("#guestForm");

  function renderGuests() {
    const search = ($("#guestSearch").value || "").trim().toLowerCase();
    const filter = $("#guestRSVPFilter").value;

    const confirmed = data.guests.filter((guest) => guest.rsvp === "Confirmed").length;
    const declined = data.guests.filter((guest) => guest.rsvp === "Declined").length;
    const pending = data.guests.filter((guest) => guest.rsvp === "Pending").length;

    $("#guestTotal").textContent = data.guests.length;
    $("#guestConfirmed").textContent = confirmed;
    $("#guestPending").textContent = pending;
    $("#guestDeclined").textContent = declined;
    $("#dashboardGuests").textContent = data.guests.length;

    const filtered = data.guests.filter((guest) => {
      const matchesSearch = `${guest.name} ${guest.email || ""}`
        .toLowerCase().includes(search);

      const matchesStatus = filter === "all" || guest.rsvp === filter;

      return matchesSearch && matchesStatus;
    });

    const body = $("#guestTableBody");

    if (!filtered.length) {
      body.innerHTML = `
        <tr class="empty-row">
          <td colspan="5">${data.guests.length ? "No matching guests found." : "No guests added yet. Start your guest list!"}</td>
        </tr>`;
      return;
    }

    body.innerHTML = filtered.map((guest) => `
      <tr>
        <td>
          <strong>${escapeHTML(guest.name)}</strong>
          ${guest.email ? `<br><small style="color:var(--text-light)">${escapeHTML(guest.email)}</small>` : ""}
        </td>
        <td>${escapeHTML(guest.side)}</td>
        <td><span class="rsvp-badge rsvp-${guest.rsvp.toLowerCase()}">${escapeHTML(guest.rsvp)}</span></td>
        <td>${escapeHTML(guest.table || "Not assigned")}</td>
        <td>
          <button class="table-action" data-delete-guest="${guest.id}"
            aria-label="Delete ${escapeHTML(guest.name)}" title="Delete guest">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }

  $("#addGuestButton")?.addEventListener("click", () => {
    setFormVisibility(guestForm, true);
    $("#guestName").focus();
  });

  $("#cancelGuestButton")?.addEventListener("click", () => {
    guestForm.reset();
    setFormVisibility(guestForm, false);
  });

  guestForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("#guestName").value.trim();
    const email = $("#guestEmail").value.trim();

    if (!name) {
      showToast("Please enter the guest's name.");
      return;
    }

    data.guests.push({
      id: createId(),
      name,
      email,
      side: $("#guestSide").value,
      rsvp: $("#guestRSVP").value,
      table: $("#guestTable").value.trim()
    });

    saveData();
    renderGuests();
    guestForm.reset();
    setFormVisibility(guestForm, false);
    showToast("Guest added successfully!");
  });

  $("#guestSearch")?.addEventListener("input", renderGuests);
  $("#guestRSVPFilter")?.addEventListener("change", renderGuests);

  $("#guestTableBody")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-guest]");
    if (!button) return;

    const id = Number(button.dataset.deleteGuest);
    data.guests = data.guests.filter((guest) => guest.id !== id);

    saveData();
    renderGuests();
    showToast("Guest removed.");
  });

  /* =====================================================
     Wedding Checklist
  ===================================================== */

  const taskForm = $("#taskForm");

  function renderTasks() {
    const total = data.tasks.length;
    const completed = data.tasks.filter((task) => task.completed).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    $("#dashboardTasks").textContent = `${completed} / ${total}`;
    $("#dashboardTaskMessage").textContent = total
      ? `${percent}% of your tasks completed`
      : "Add your first wedding task";

    $("#checklistProgressText").textContent = `${percent}% completed`;
    $("#checklistProgressNumber").textContent = `${percent}%`;
    $("#checklistProgressFill").style.width = `${percent}%`;
    $("#checklistProgressCircle").style.background =
      `conic-gradient(var(--gold) ${percent}%, var(--cream-dark) ${percent}%)`;

    const filtered = data.tasks.filter((task) => {
      if (activeTaskFilter === "pending") return !task.completed;
      if (activeTaskFilter === "completed") return task.completed;
      return true;
    });

    const list = $("#taskList");

    if (!filtered.length) {
      list.innerHTML = `<div class="empty-tasks">No tasks in this category.</div>`;
      return;
    }

    list.innerHTML = filtered.map((task) => `
      <div class="task-item ${task.completed ? "completed" : ""}">
        <input type="checkbox" class="task-checkbox"
          data-toggle-task="${task.id}"
          aria-label="Mark ${escapeHTML(task.name)} as completed"
          ${task.completed ? "checked" : ""}>
        <div class="task-copy">
          <strong>${escapeHTML(task.name)}</strong>
          <span>${escapeHTML(task.category)}</span>
        </div>
        <button class="task-delete" data-delete-task="${task.id}"
          aria-label="Delete task" title="Delete task">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `).join("");
  }

  $("#addTaskButton")?.addEventListener("click", () => {
    setFormVisibility(taskForm, true);
    $("#taskName").focus();
  });

  $("#cancelTaskButton")?.addEventListener("click", () => {
    taskForm.reset();
    setFormVisibility(taskForm, false);
  });

  taskForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("#taskName").value.trim();
    if (!name) return;

    data.tasks.push({
      id: createId(),
      name,
      category: $("#taskCategory").value,
      completed: false
    });

    saveData();
    renderTasks();
    taskForm.reset();
    setFormVisibility(taskForm, false);
    showToast("Task added successfully!");
  });

  $$(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      activeTaskFilter = button.dataset.taskFilter;

      $$(".filter-chip").forEach((chip) => {
        chip.classList.toggle("active", chip === button);
      });

      renderTasks();
    });
  });

  $("#taskList")?.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-toggle-task]");
    if (!checkbox) return;

    const id = Number(checkbox.dataset.toggleTask);
    const task = data.tasks.find((item) => item.id === id);

    if (!task) return;

    task.completed = checkbox.checked;

    saveData();
    renderTasks();
    showToast(task.completed ? "Task completed!" : "Task marked as pending.");
  });

  $("#taskList")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-task]");
    if (!button) return;

    const id = Number(button.dataset.deleteTask);
    data.tasks = data.tasks.filter((task) => task.id !== id);

    saveData();
    renderTasks();
    showToast("Task deleted.");
  });

  /* =====================================================
     Wedding Timeline
  ===================================================== */

  const timelineForm = $("#timelineForm");

  function renderTimeline() {
    const timeline = [...data.timeline].sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    const list = $("#timelineList");

    if (!timeline.length) {
      list.innerHTML = `
        <div class="empty-tasks">Your wedding timeline is empty. Add an event to begin.</div>`;
      return;
    }

    list.innerHTML = timeline.map((item) => `
      <div class="timeline-entry">
        <div class="timeline-time">${escapeHTML(item.time)}</div>
        <div class="timeline-marker"><i class="fa-solid fa-heart"></i></div>
        <div class="timeline-event">
          <h4>${escapeHTML(item.event)}</h4>
          <p><i class="fa-solid fa-location-dot"></i> ${escapeHTML(item.location || "Location to be decided")}</p>
        </div>
        <button class="timeline-delete" data-delete-timeline="${item.id}"
          aria-label="Delete ${escapeHTML(item.event)}" title="Delete event">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `).join("");
  }

  $("#addTimelineButton")?.addEventListener("click", () => {
    setFormVisibility(timelineForm, true);
    $("#timelineTime").focus();
  });

  $("#cancelTimelineButton")?.addEventListener("click", () => {
    timelineForm.reset();
    setFormVisibility(timelineForm, false);
  });

  timelineForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const time = $("#timelineTime").value;
    const name = $("#timelineEvent").value.trim();

    if (!time || !name) {
      showToast("Please enter the event time and name.");
      return;
    }

    data.timeline.push({
      id: createId(),
      time,
      event: name,
      location: $("#timelineLocation").value.trim()
    });

    saveData();
    renderTimeline();
    timelineForm.reset();
    setFormVisibility(timelineForm, false);
    showToast("Timeline event added!");
  });

  $("#timelineList")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-timeline]");
    if (!button) return;

    const id = Number(button.dataset.deleteTimeline);
    data.timeline = data.timeline.filter((item) => item.id !== id);

    saveData();
    renderTimeline();
    showToast("Timeline event removed.");
  });

  /* =====================================================
     Message Board
  ===================================================== */

  const messageForm = $("#messageForm");

  function renderMessages() {
    const board = $("#messageBoard");

    if (!data.messages.length) {
      board.innerHTML = `
        <div class="empty-messages">
          <i class="fa-regular fa-heart"></i>
          <p>Your inspiration board is ready for its first note.</p>
        </div>`;
      return;
    }

    board.innerHTML = [...data.messages].reverse().map((message) => `
      <article class="message-card">
        <button class="message-delete" data-delete-message="${message.id}"
          aria-label="Delete note" title="Delete note">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <h4>${escapeHTML(message.title)}</h4>
        <p>${escapeHTML(message.text).replace(/\n/g, "<br>")}</p>
        <small><i class="fa-regular fa-calendar"></i> ${escapeHTML(message.date)}</small>
      </article>
    `).join("");
  }

  messageForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = $("#messageTitle").value.trim();
    const text = $("#messageText").value.trim();

    if (!title || !text) {
      showToast("Please complete both note fields.");
      return;
    }

    data.messages.push({
      id: createId(),
      title,
      text,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    });

    saveData();
    renderMessages();
    messageForm.reset();
    showToast("Your note has been saved!");
  });

  $("#messageBoard")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-message]");
    if (!button) return;

    const id = Number(button.dataset.deleteMessage);
    data.messages = data.messages.filter((message) => message.id !== id);

    saveData();
    renderMessages();
    showToast("Note deleted.");
  });

  /* =====================================================
     Demo Login / Register
     Note: This is frontend-only demonstration logic.
  ===================================================== */

  const authForm = $("#authForm");

  function updateAuthUI() {
    const title = $("#authTitle");
    const subtitle = $("#authSubtitle");
    const submitButton = $("#authSubmitButton");
    const nameGroup = $("#authNameGroup");

    if (authMode === "register") {
      title.textContent = "Create Your Account";
      subtitle.textContent = "Begin your wedding planning journey.";
      submitButton.textContent = "Create Account";
      nameGroup.classList.remove("hidden");
      $("#authName").required = true;
    } else {
      title.textContent = "Welcome to WedPlan";
      subtitle.textContent = "Sign in to keep your wedding plans close.";
      submitButton.textContent = "Sign In";
      nameGroup.classList.add("hidden");
      $("#authName").required = false;
    }

    $$(".auth-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.authTab === authMode);
    });

    $("#authMessage").textContent = "";
  }

  $("#loginButton")?.addEventListener("click", () => {
    authMode = "login";
    updateAuthUI();
    showModal("authModal");
  });

  $$(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      authMode = tab.dataset.authTab;
      updateAuthUI();
    });
  });

  authForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = $("#authEmail").value.trim().toLowerCase();
    const password = $("#authPassword").value;
    const message = $("#authMessage");

    if (!email || password.length < 6) {
      message.textContent = "Enter a valid email and a password of at least 6 characters.";
      return;
    }

    if (authMode === "register") {
      const name = $("#authName").value.trim();

      if (!name) {
        message.textContent = "Please enter your name.";
        return;
      }

      if (data.users.some((user) => user.email === email)) {
        message.textContent = "An account with this email already exists.";
        return;
      }

      // Demo only: do not use this pattern for production authentication.
      data.users.push({ name, email, password });
      data.currentUser = { name, email };

      saveData();
      message.textContent = "Demo account created successfully!";

      setTimeout(() => {
        closeModal("authModal");
        $("#loginButton").innerHTML =
          `<i class="fa-regular fa-user"></i> ${escapeHTML(name.split(" ")[0])}`;
        showToast("Welcome to WedPlan!");
      }, 700);

      return;
    }

    const user = data.users.find(
      (item) => item.email === email && item.password === password
    );

    if (!user) {
      message.textContent = "Account not found or password is incorrect. Try creating a demo account.";
      return;
    }

    data.currentUser = { name: user.name, email: user.email };
    saveData();

    message.textContent = "Signed in successfully!";

    setTimeout(() => {
      closeModal("authModal");
      $("#loginButton").innerHTML =
        `<i class="fa-regular fa-user"></i> ${escapeHTML(user.name.split(" ")[0])}`;
      showToast(`Welcome back, ${user.name}!`);
    }, 700);
  });

  if (data.currentUser?.name) {
    $("#loginButton").innerHTML =
      `<i class="fa-regular fa-user"></i> ${escapeHTML(data.currentUser.name.split(" ")[0])}`;
  }

  /* =====================================================
     Modal Closing
  ===================================================== */

  $$("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      closeModal(button.dataset.closeModal);
    });
  });

  $$(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(modal.id);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      $$(".modal-overlay:not(.hidden)").forEach((modal) => closeModal(modal.id));
    }
  });

  /* =====================================================
     Newsletter Demo
  ===================================================== */

  $("#newsletterForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const input = $("#newsletterEmail");
    const email = input.value.trim().toLowerCase();

    if (!email) return;

    if (data.newsletterEmails.includes(email)) {
      $("#newsletterMessage").textContent = "You're already on the list!";
      return;
    }

    data.newsletterEmails.push(email);
    saveData();

    $("#newsletterMessage").textContent = "Thank you! Your demo subscription is saved.";
    input.value = "";
  });

  /* =====================================================
     Footer Year
  ===================================================== */

  $("#currentYear").textContent = new Date().getFullYear();

  /* =====================================================
     Initial Render
  ===================================================== */

  function initializeApp() {
    renderWeddingDetails();
    renderBudget();
    renderVendors();
    renderGuests();
    renderTasks();
    renderTimeline();
    renderMessages();
    updateAuthUI();
  }

  initializeApp();
});