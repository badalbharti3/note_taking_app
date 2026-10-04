// ============================================================
// NOTEFLOW - FRONTEND APPLICATION
// ============================================================

// IMPORTANT:
// Replace this with your deployed Spring Boot backend URL.
//
// Example:
// const API_BASE_URL = "https://noteflow-api.onrender.com";
//
// DO NOT put /api at the end.
const API_BASE_URL = "https://takenotewithnoteflow.netlify.app/";

const NOTES_API = `${API_BASE_URL}/api/notes`;
const AUTH_API = `${API_BASE_URL}/api/auth`;

// ============================================================
// STORAGE KEYS
// ============================================================

const TOKEN_KEY = "noteflow_token";
const USER_KEY = "noteflow_user";

const DEFAULT_THEME = "violet";

// ============================================================
// DOM ELEMENTS
// ============================================================

const authPage = document.getElementById("authPage");
const notesDashboard = document.getElementById("notesDashboard");
const editorPage = document.getElementById("editorPage");

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");

const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");

const welcomeUserName = document.getElementById("welcomeUserName");

const logoutButton = document.getElementById("logoutButton");

const notesGrid = document.getElementById("notesGrid");

const searchInput = document.getElementById("searchInput");

const filterButton = document.getElementById("filterButton");

const sortSelect = document.getElementById("sortSelect");

const pagination = document.getElementById("pagination");

const newNoteButton = document.getElementById("newNoteButton");

const backToNotesButton = document.getElementById("backToNotesButton");

const noteForm = document.getElementById("noteForm");

const noteTitle = document.getElementById("noteTitle");

const noteCategory = document.getElementById("noteCategory");

const noteTags = document.getElementById("noteTags");

const noteContent = document.getElementById("noteContent");

const saveNoteButton = document.getElementById("saveNoteButton");

const deleteNoteModal = document.getElementById("deleteNoteModal");

const confirmDeleteButton = document.getElementById("confirmDeleteButton");

const cancelDeleteButton = document.getElementById("cancelDeleteButton");

const logoutModal = document.getElementById("logoutModal");

const confirmLogoutButton = document.getElementById("confirmLogoutButton");

const cancelLogoutButton = document.getElementById("cancelLogoutButton");

const toastContainer = document.getElementById("toastContainer");

const themeButton = document.getElementById("themeButton");

const themeMenu = document.getElementById("themeMenu");

const themeOptions = document.querySelectorAll(".theme-option");

// ============================================================
// APPLICATION STATE
// ============================================================

let notes = [];

let currentPage = 1;

const NOTES_PER_PAGE = 9;

let editingNoteId = null;

let noteIdToDelete = null;

let currentFilter = "all";

let currentSort = "newest";

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initializeApplication();
});

function initializeApplication() {
  setupEventListeners();

  const token = getToken();

  const user = getUser();

  if (token && user) {
    loadUserTheme(user);

    showDashboard();

    updateUserInterface(user);

    loadNotes();
  } else {
    showAuthPage();
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
  // -------------------------------
  // AUTH TABS
  // -------------------------------

  if (loginTab) {
    loginTab.addEventListener("click", () => {
      showLoginForm();
    });
  }

  if (signupTab) {
    signupTab.addEventListener("click", () => {
      showSignupForm();
    });
  }

  // -------------------------------
  // AUTH FORMS
  // -------------------------------

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }

  // -------------------------------
  // LOGOUT
  // -------------------------------

  if (logoutButton) {
    logoutButton.addEventListener("click", openLogoutModal);
  }

  if (confirmLogoutButton) {
    confirmLogoutButton.addEventListener("click", logout);
  }

  if (cancelLogoutButton) {
    cancelLogoutButton.addEventListener("click", closeLogoutModal);
  }

  // -------------------------------
  // NEW NOTE
  // -------------------------------

  if (newNoteButton) {
    newNoteButton.addEventListener("click", openNewNoteEditor);
  }

  // -------------------------------
  // BACK TO NOTES
  // -------------------------------

  if (backToNotesButton) {
    backToNotesButton.addEventListener("click", () => {
      showDashboard();

      loadNotes();
    });
  }

  // -------------------------------
  // NOTE FORM
  // -------------------------------

  if (noteForm) {
    noteForm.addEventListener("submit", handleNoteSubmit);
  }

  // -------------------------------
  // SEARCH
  // -------------------------------

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentPage = 1;

      renderNotes();
    });
  }

  // -------------------------------
  // SORT
  // -------------------------------

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      currentSort = sortSelect.value;

      currentPage = 1;

      renderNotes();
    });
  }

  // -------------------------------
  // FILTER
  // -------------------------------

  if (filterButton) {
    filterButton.addEventListener("click", toggleFilter);
  }

  // -------------------------------
  // DELETE MODAL
  // -------------------------------

  if (confirmDeleteButton) {
    confirmDeleteButton.addEventListener("click", confirmDelete);
  }

  if (cancelDeleteButton) {
    cancelDeleteButton.addEventListener("click", closeDeleteModal);
  }

  // -------------------------------
  // THEME
  // -------------------------------

  if (themeButton) {
    themeButton.addEventListener("click", toggleThemeMenu);
  }

  themeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const theme = option.dataset.theme;

      const user = getUser();

      applyTheme(theme, user);

      closeThemeMenu();
    });
  });

  document.addEventListener("click", (event) => {
    if (
      themeMenu &&
      themeButton &&
      !themeMenu.contains(event.target) &&
      !themeButton.contains(event.target)
    ) {
      closeThemeMenu();
    }
  });

  // -------------------------------
  // KEYBOARD SHORTCUT
  // -------------------------------

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      if (editorPage && !editorPage.classList.contains("hidden")) {
        if (noteForm) {
          noteForm.requestSubmit();
        }
      }
    }
  });
}

// ============================================================
// AUTHENTICATION
// ============================================================

async function handleSignup(event) {
  event.preventDefault();

  const name = signupName.value.trim();

  const email = signupEmail.value.trim();

  const password = signupPassword.value;

  if (!name || !email || !password) {
    showToast("Please fill in all fields", "error");

    return;
  }

  try {
    setButtonLoading(signupForm.querySelector('button[type="submit"]'), true);

    const response = await fetch(`${AUTH_API}/signup`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "Signup failed");
    }

    saveAuthentication(data);

    showToast("Account created successfully", "success");

    showDashboard();

    updateUserInterface(getUser());

    loadNotes();
  } catch (error) {
    console.error("Signup error:", error);

    showToast(error.message || "Unable to create account", "error");
  } finally {
    setButtonLoading(signupForm.querySelector('button[type="submit"]'), false);
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = loginEmail.value.trim();

  const password = loginPassword.value;

  if (!email || !password) {
    showToast("Please enter email and password", "error");

    return;
  }

  try {
    setButtonLoading(loginForm.querySelector('button[type="submit"]'), true);

    const response = await fetch(`${AUTH_API}/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "Invalid email or password");
    }

    saveAuthentication(data);

    showToast("Login successful", "success");

    showDashboard();

    updateUserInterface(getUser());

    loadNotes();
  } catch (error) {
    console.error("Login error:", error);

    showToast(error.message || "Unable to login", "error");
  } finally {
    setButtonLoading(loginForm.querySelector('button[type="submit"]'), false);
  }
}

// ============================================================
// AUTH STORAGE
// ============================================================

function saveAuthentication(data) {
  localStorage.setItem(TOKEN_KEY, data.token);

  const user = {
    userId: data.userId,

    name: data.name,

    email: data.email,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  loadUserTheme(user);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  const user = localStorage.getItem(USER_KEY);

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

function clearAuthentication() {
  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(USER_KEY);
}

// ============================================================
// LOGOUT
// ============================================================

function openLogoutModal() {
  if (!logoutModal) {
    logout();

    return;
  }

  logoutModal.classList.remove("hidden");
}

function closeLogoutModal() {
  if (logoutModal) {
    logoutModal.classList.add("hidden");
  }
}

function logout() {
  clearAuthentication();

  notes = [];

  editingNoteId = null;

  currentPage = 1;

  closeLogoutModal();

  showAuthPage();

  showToast("Logged out successfully", "success");
}

// ============================================================
// PAGE NAVIGATION
// ============================================================

function showAuthPage() {
  hideElement(notesDashboard);

  hideElement(editorPage);

  showElement(authPage);
}

function showDashboard() {
  hideElement(authPage);

  hideElement(editorPage);

  showElement(notesDashboard);
}

function showEditor() {
  hideElement(authPage);

  hideElement(notesDashboard);

  showElement(editorPage);
}

function hideElement(element) {
  if (!element) {
    return;
  }

  element.classList.add("hidden");
}

function showElement(element) {
  if (!element) {
    return;
  }

  element.classList.remove("hidden");
}

// ============================================================
// AUTH FORM TABS
// ============================================================

function showLoginForm() {
  loginTab?.classList.add("active");

  signupTab?.classList.remove("active");

  loginForm?.classList.remove("hidden");

  signupForm?.classList.add("hidden");
}

function showSignupForm() {
  signupTab?.classList.add("active");

  loginTab?.classList.remove("active");

  signupForm?.classList.remove("hidden");

  loginForm?.classList.add("hidden");
}

// ============================================================
// USER INTERFACE
// ============================================================

function updateUserInterface(user) {
  if (!user) {
    return;
  }

  if (userName) {
    userName.textContent = user.name;
  }

  if (userEmail) {
    userEmail.textContent = user.email;
  }

  if (welcomeUserName) {
    welcomeUserName.textContent = user.name;
  }

  if (userAvatar) {
    userAvatar.textContent = getInitials(user.name);
  }
}

function getInitials(name) {
  if (!name) {
    return "U";
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ============================================================
// API REQUEST HELPER
// ============================================================

async function apiRequest(url, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),

    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthentication();

    showAuthPage();

    showToast("Your session has expired. Please login again.", "error");

    throw new Error("Unauthorized");
  }

  return response;
}

// ============================================================
// RESPONSE PARSER
// ============================================================

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

// ============================================================
// LOAD NOTES
// ============================================================

async function loadNotes() {
  try {
    const response = await apiRequest(NOTES_API, {
      method: "GET",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "Unable to load notes");
    }

    if (Array.isArray(data)) {
      notes = data;
    } else if (Array.isArray(data.notes)) {
      notes = data.notes;
    } else if (Array.isArray(data.content)) {
      notes = data.content;
    } else {
      notes = [];
    }

    currentPage = 1;

    renderNotes();
  } catch (error) {
    console.error("Load notes error:", error);

    if (error.message !== "Unauthorized") {
      showToast(error.message || "Unable to load notes", "error");
    }
  }
}

// ============================================================
// NEW NOTE
// ============================================================

function openNewNoteEditor() {
  editingNoteId = null;

  clearEditor();

  showEditor();

  if (noteTitle) {
    noteTitle.focus();
  }
}

// ============================================================
// EDIT NOTE
// ============================================================

function openEditNote(note) {
  editingNoteId = note.id || note._id;

  if (noteTitle) {
    noteTitle.value = note.title || "";
  }

  if (noteCategory) {
    noteCategory.value = note.category || "";
  }

  if (noteTags) {
    noteTags.value = Array.isArray(note.tags)
      ? note.tags.join(", ")
      : note.tags || "";
  }

  if (noteContent) {
    noteContent.innerHTML = note.content || "";
  }

  showEditor();

  if (noteTitle) {
    noteTitle.focus();
  }
}

// ============================================================
// CLEAR EDITOR
// ============================================================

function clearEditor() {
  if (noteTitle) {
    noteTitle.value = "";
  }

  if (noteCategory) {
    noteCategory.value = "";
  }

  if (noteTags) {
    noteTags.value = "";
  }

  if (noteContent) {
    noteContent.innerHTML = "";
  }
}

// ============================================================
// SAVE / UPDATE NOTE
// ============================================================

async function handleNoteSubmit(event) {
  event.preventDefault();

  const title = noteTitle?.value.trim() || "";

  const category = noteCategory?.value.trim() || "";

  const content = noteContent?.innerHTML.trim() || "";

  const tags = parseTags(noteTags?.value || "");

  if (!title) {
    showToast("Please enter a note title", "error");

    return;
  }

  if (!content) {
    showToast("Please enter some note content", "error");

    return;
  }

  const isEditing = Boolean(editingNoteId);

  const payload = {
    title,

    category,

    tags,

    content,
  };

  try {
    setButtonLoading(saveNoteButton, true);

    let response;

    if (isEditing) {
      response = await apiRequest(`${NOTES_API}/${editingNoteId}`, {
        method: "PUT",

        body: JSON.stringify(payload),
      });
    } else {
      response = await apiRequest(NOTES_API, {
        method: "POST",

        body: JSON.stringify(payload),
      });
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "Unable to save note");
    }

    showToast(
      isEditing ? "Note updated successfully" : "Note created successfully",
      "success",
    );

    editingNoteId = null;

    showDashboard();

    await loadNotes();
  } catch (error) {
    console.error("Save note error:", error);

    if (error.message !== "Unauthorized") {
      showToast(error.message || "Unable to save note", "error");
    }
  } finally {
    setButtonLoading(saveNoteButton, false);
  }
}

// ============================================================
// DELETE NOTE
// ============================================================

function openDeleteModal(noteId) {
  noteIdToDelete = noteId;

  if (deleteNoteModal) {
    deleteNoteModal.classList.remove("hidden");
  }
}

function closeDeleteModal() {
  noteIdToDelete = null;

  if (deleteNoteModal) {
    deleteNoteModal.classList.add("hidden");
  }
}

async function confirmDelete() {
  if (!noteIdToDelete) {
    return;
  }

  try {
    const response = await apiRequest(`${NOTES_API}/${noteIdToDelete}`, {
      method: "DELETE",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "Unable to delete note");
    }

    closeDeleteModal();

    showToast("Note deleted successfully", "success");

    await loadNotes();
  } catch (error) {
    console.error("Delete note error:", error);

    if (error.message !== "Unauthorized") {
      showToast(error.message || "Unable to delete note", "error");
    }
  }
}

// ============================================================
// NOTE ACTIONS
// ============================================================

async function toggleNoteProperty(note, property, value) {
  const noteId = note.id || note._id;

  try {
    const payload = {
      title: note.title || "",

      category: note.category || "",

      tags: Array.isArray(note.tags) ? note.tags : [],

      content: note.content || "",

      [property]: value,
    };

    const response = await apiRequest(`${NOTES_API}/${noteId}`, {
      method: "PUT",

      body: JSON.stringify(payload),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "Unable to update note");
    }

    await loadNotes();
  } catch (error) {
    console.error("Update note error:", error);

    showToast(error.message || "Unable to update note", "error");
  }
}

// ============================================================
// RENDER NOTES
// ============================================================

function renderNotes() {
  if (!notesGrid) {
    return;
  }

  let filteredNotes = [...notes];

  // -------------------------------
  // SEARCH
  // -------------------------------

  const searchTerm = searchInput?.value.trim().toLowerCase() || "";

  if (searchTerm) {
    filteredNotes = filteredNotes.filter((note) => {
      const title = note.title || "";

      const content = stripHtml(note.content || "");

      const category = note.category || "";

      const tags = Array.isArray(note.tags)
        ? note.tags.join(" ")
        : note.tags || "";

      return (
        title.toLowerCase().includes(searchTerm) ||
        content.toLowerCase().includes(searchTerm) ||
        category.toLowerCase().includes(searchTerm) ||
        tags.toLowerCase().includes(searchTerm)
      );
    });
  }

  // -------------------------------
  // FILTER
  // -------------------------------

  if (currentFilter === "pinned") {
    filteredNotes = filteredNotes.filter((note) => note.pinned === true);
  }

  if (currentFilter === "favorite") {
    filteredNotes = filteredNotes.filter((note) => note.favorite === true);
  }

  if (currentFilter === "archived") {
    filteredNotes = filteredNotes.filter((note) => note.archived === true);
  }

  if (currentFilter === "active") {
    filteredNotes = filteredNotes.filter((note) => note.archived !== true);
  }

  // -------------------------------
  // SORT
  // -------------------------------

  filteredNotes = sortNotes(filteredNotes);

  // -------------------------------
  // PAGINATION
  // -------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotes.length / NOTES_PER_PAGE),
  );

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const startIndex = (currentPage - 1) * NOTES_PER_PAGE;

  const pageNotes = filteredNotes.slice(
    startIndex,
    startIndex + NOTES_PER_PAGE,
  );

  notesGrid.innerHTML = "";

  if (pageNotes.length === 0) {
    notesGrid.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    📝
                </div>

                <h3>No notes found</h3>

                <p>
                    Create a new note or
                    change your search/filter.
                </p>

            </div>

        `;
  } else {
    pageNotes.forEach((note) => {
      notesGrid.appendChild(createNoteCard(note));
    });
  }

  renderPagination(totalPages);
}

// ============================================================
// SORT NOTES
// ============================================================

function sortNotes(noteList) {
  return noteList.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();

    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();

    if (currentSort === "oldest") {
      return dateA - dateB;
    }

    if (currentSort === "title") {
      return (a.title || "").localeCompare(b.title || "");
    }

    if (currentSort === "pinned") {
      return Number(b.pinned === true) - Number(a.pinned === true);
    }

    return dateB - dateA;
  });
}

// ============================================================
// NOTE CARD
// ============================================================

function createNoteCard(note) {
  const card = document.createElement("article");

  card.className = "note-card";

  if (note.pinned) {
    card.classList.add("is-pinned");
  }

  const noteId = note.id || note._id;

  const title = escapeHtml(note.title || "Untitled");

  const category = escapeHtml(note.category || "");

  const content = sanitizePreview(note.content || "");

  const date = formatDate(note.updatedAt || note.createdAt);

  const tags = Array.isArray(note.tags) ? note.tags : [];

  const tagsHtml = tags.length
    ? `
                <div class="note-tags">
                    ${tags
                      .map(
                        (tag) =>
                          `<span class="tag">
                                    ${escapeHtml(tag)}
                                </span>`,
                      )
                      .join("")}
                </div>
            `
    : "";

  card.innerHTML = `

        <div class="note-card-header">

            <div class="note-card-title-wrap">

                ${
                  note.pinned
                    ? `
                            <span
                                class="note-pin"
                                title="Pinned"
                            >
                                📌
                            </span>
                        `
                    : ""
                }

                <h3>
                    ${title}
                </h3>

            </div>

            <div class="note-actions">

                <button
                    class="icon-button"
                    data-action="pin"
                    title="Pin"
                >
                    ${note.pinned ? "📌" : "📍"}
                </button>

                <button
                    class="icon-button"
                    data-action="favorite"
                    title="Favorite"
                >
                    ${note.favorite ? "★" : "☆"}
                </button>

                <button
                    class="icon-button"
                    data-action="archive"
                    title="Archive"
                >
                    ${note.archived ? "📦" : "🗃️"}
                </button>

                <button
                    class="icon-button"
                    data-action="delete"
                    title="Delete"
                >
                    🗑️
                </button>

            </div>

        </div>


        ${
          category
            ? `
                    <div class="note-category">
                        ${category}
                    </div>
                `
            : ""
        }


        <div class="note-preview">

            ${content}

        </div>


        ${tagsHtml}


        <div class="note-card-footer">

            <span>
                ${date}
            </span>

            <button
                class="note-edit-button"
                data-action="edit"
            >
                Open
            </button>

        </div>

    `;

  card.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");

    if (!actionButton) {
      return;
    }

    event.stopPropagation();

    const action = actionButton.dataset.action;

    if (action === "edit") {
      openEditNote(note);

      return;
    }

    if (action === "delete") {
      openDeleteModal(noteId);

      return;
    }

    if (action === "pin") {
      toggleNoteProperty(note, "pinned", !note.pinned);

      return;
    }

    if (action === "favorite") {
      toggleNoteProperty(note, "favorite", !note.favorite);

      return;
    }

    if (action === "archive") {
      toggleNoteProperty(note, "archived", !note.archived);
    }
  });

  card.addEventListener("dblclick", () => {
    openEditNote(note);
  });

  return card;
}

// ============================================================
// PAGINATION
// ============================================================

function renderPagination(totalPages) {
  if (!pagination) {
    return;
  }

  pagination.innerHTML = "";

  if (totalPages <= 1) {
    return;
  }

  const previousButton = document.createElement("button");

  previousButton.textContent = "Previous";

  previousButton.disabled = currentPage === 1;

  previousButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;

      renderNotes();
    }
  });

  pagination.appendChild(previousButton);

  for (let page = 1; page <= totalPages; page++) {
    const button = document.createElement("button");

    button.textContent = page;

    if (page === currentPage) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      currentPage = page;

      renderNotes();
    });

    pagination.appendChild(button);
  }

  const nextButton = document.createElement("button");

  nextButton.textContent = "Next";

  nextButton.disabled = currentPage === totalPages;

  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;

      renderNotes();
    }
  });

  pagination.appendChild(nextButton);
}

// ============================================================
// FILTER
// ============================================================

function toggleFilter() {
  const filters = ["all", "active", "pinned", "favorite", "archived"];

  const currentIndex = filters.indexOf(currentFilter);

  currentFilter = filters[(currentIndex + 1) % filters.length];

  currentPage = 1;

  renderNotes();
}

// ============================================================
// THEMES
// ============================================================

function getThemeStorageKey(user) {
  if (!user || !user.userId) {
    return "noteflow_theme_guest";
  }

  return `noteflow_theme_${user.userId}`;
}

function applyTheme(theme, user) {
  const validThemes = ["violet", "ocean", "emerald", "sunset"];

  if (!validThemes.includes(theme)) {
    theme = DEFAULT_THEME;
  }

  document.body.classList.remove(
    "theme-violet",
    "theme-ocean",
    "theme-emerald",
    "theme-sunset",
  );

  document.body.classList.add(`theme-${theme}`);

  localStorage.setItem(
    getThemeStorageKey(user),

    theme,
  );

  updateThemeSelection(theme);
}

function loadUserTheme(user) {
  const savedTheme = localStorage.getItem(getThemeStorageKey(user));

  applyTheme(
    savedTheme || DEFAULT_THEME,

    user,
  );
}

function updateThemeSelection(selectedTheme) {
  themeOptions.forEach((option) => {
    const check = option.querySelector(".theme-check");

    if (option.dataset.theme === selectedTheme) {
      option.classList.add("active");

      if (check) {
        check.textContent = "✓";
      }
    } else {
      option.classList.remove("active");

      if (check) {
        check.textContent = "";
      }
    }
  });
}

function toggleThemeMenu() {
  if (!themeMenu) {
    return;
  }

  themeMenu.classList.toggle("hidden");
}

function closeThemeMenu() {
  if (themeMenu) {
    themeMenu.classList.add("hidden");
  }
}

// ============================================================
// TAGS
// ============================================================

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ============================================================
// HTML / SECURITY HELPERS
// ============================================================

function stripHtml(html) {
  const temporaryElement = document.createElement("div");

  temporaryElement.innerHTML = html;

  return temporaryElement.textContent || temporaryElement.innerText || "";
}

function sanitizePreview(html) {
  const text = stripHtml(html);

  const escaped = escapeHtml(text);

  if (escaped.length <= 180) {
    return escaped;
  }

  return escaped.substring(0, 180) + "...";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ============================================================
// BUTTON LOADING
// ============================================================

function setButtonLoading(button, loading) {
  if (!button) {
    return;
  }

  if (loading) {
    button.dataset.originalText = button.textContent;

    button.disabled = true;

    button.textContent = "Please wait...";
  } else {
    button.disabled = false;

    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }
}

// ============================================================
// TOAST
// ============================================================

function showToast(message, type = "success") {
  if (!toastContainer) {
    alert(message);

    return;
  }

  const toast = document.createElement("div");

  toast.className = `toast toast-${type}`;

  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// ============================================================
// END
// ============================================================
