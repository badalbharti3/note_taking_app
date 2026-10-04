// ============================================================
// NOTEFLOW - FRONTEND APPLICATION
// ============================================================

// IMPORTANT:
// Replace this with your deployed Spring Boot backend URL if it changes.
// Do NOT add /api at the end.
const API_BASE_URL = "https://notetakingapp-production-233a.up.railway.app";

const NOTES_API = `${API_BASE_URL}/api/notes`;
const AUTH_API = `${API_BASE_URL}/api/auth`;

// ============================================================
// STORAGE KEYS
// ============================================================

const TOKEN_KEY = "noteflow_token";
const USER_KEY = "noteflow_user";
const DEFAULT_THEME = "violet";
const VALID_THEMES = ["violet", "ocean", "emerald", "sunset"];

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
const logoutButton = document.getElementById("logoutBtn");

// IMPORTANT:
// HTML uses notesContainer, not notesGrid.
const notesContainer = document.getElementById("notesContainer");

const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyDescription = document.getElementById("emptyDescription");
const emptyCreateButton = document.getElementById("emptyCreateBtn");

const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const sortSelect = document.getElementById("sortSelect");

const pagination = document.getElementById("pagination");
const previousPageButton = document.getElementById("previousPageBtn");
const nextPageButton = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");

const newNoteButton = document.getElementById("newNoteBtn");

const backToNotesButton = document.getElementById("backToNotesBtn");

const editorModeLabel = document.getElementById("editorModeLabel");

const saveStatus = document.getElementById("saveStatus");

const editorDeleteButton = document.getElementById("editorDeleteBtn");

const saveNoteButton = document.getElementById("editorSaveBtn");

const noteTitle = document.getElementById("noteTitle");

const noteCategory = document.getElementById("noteCategory");

const noteTags = document.getElementById("noteTags");

const noteContent = document.getElementById("noteContent");

const notePinned = document.getElementById("notePinned");

const noteFavorite = document.getElementById("noteFavorite");

const noteArchived = document.getElementById("noteArchived");

const noteMetadata = document.getElementById("noteMetadata");

const createdAtElement = document.getElementById("createdAt");

const updatedAtElement = document.getElementById("updatedAt");

const fontSizeSelect = document.getElementById("fontSizeSelect");

const deleteNoteModal = document.getElementById("deleteModal");

const confirmDeleteButton = document.getElementById("confirmDeleteBtn");

const cancelDeleteButton = document.getElementById("cancelDeleteBtn");

const logoutModal = document.getElementById("logoutModal");

const confirmLogoutButton = document.getElementById("confirmLogoutBtn");

const cancelLogoutButton = document.getElementById("cancelLogoutBtn");

const toastContainer = document.getElementById("toast");

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

let currentSort = "createdAt-desc";

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", initializeApplication);

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
    loadUserTheme(null);

    showAuthPage();

    showLoginForm();
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
  // -------------------------------
  // AUTH TABS / FORMS
  // -------------------------------

  loginTab?.addEventListener("click", showLoginForm);

  signupTab?.addEventListener("click", showSignupForm);

  loginForm?.addEventListener("submit", handleLogin);

  signupForm?.addEventListener("submit", handleSignup);

  // -------------------------------
  // LOGOUT
  // -------------------------------

  logoutButton?.addEventListener("click", openLogoutModal);

  confirmLogoutButton?.addEventListener("click", logout);

  cancelLogoutButton?.addEventListener("click", closeLogoutModal);

  // -------------------------------
  // DASHBOARD
  // -------------------------------

  newNoteButton?.addEventListener("click", openNewNoteEditor);

  emptyCreateButton?.addEventListener("click", openNewNoteEditor);

  searchInput?.addEventListener("input", () => {
    currentPage = 1;

    renderNotes();
  });

  filterSelect?.addEventListener("change", () => {
    currentFilter = filterSelect.value || "all";

    currentPage = 1;

    renderNotes();
  });

  sortSelect?.addEventListener("change", () => {
    currentSort = sortSelect.value || "createdAt-desc";

    currentPage = 1;

    renderNotes();
  });

  previousPageButton?.addEventListener("click", goToPreviousPage);

  nextPageButton?.addEventListener("click", goToNextPage);

  // -------------------------------
  // EDITOR
  // -------------------------------

  backToNotesButton?.addEventListener("click", () => {
    showDashboard();

    loadNotes();
  });

  saveNoteButton?.addEventListener("click", handleNoteSubmit);

  editorDeleteButton?.addEventListener("click", () => {
    if (editingNoteId) {
      openDeleteModal(editingNoteId);
    }
  });

  // -------------------------------
  // RICH TEXT EDITOR
  // -------------------------------

  document.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.dataset.command;

      if (!command || !noteContent) {
        return;
      }

      noteContent.focus();

      try {
        document.execCommand(command, false, null);
      } catch (error) {
        console.warn("Editor command failed:", command, error);
      }

      markEditorDirty();
    });
  });

  fontSizeSelect?.addEventListener("change", () => {
    if (!noteContent) {
      return;
    }

    noteContent.focus();

    try {
      document.execCommand("fontSize", false, fontSizeSelect.value);
    } catch (error) {
      console.warn("Font size command failed:", error);
    }

    markEditorDirty();
  });

  noteTitle?.addEventListener("input", markEditorDirty);

  noteCategory?.addEventListener("input", markEditorDirty);

  noteTags?.addEventListener("input", markEditorDirty);

  noteContent?.addEventListener("input", markEditorDirty);

  notePinned?.addEventListener("change", markEditorDirty);

  noteFavorite?.addEventListener("change", markEditorDirty);

  noteArchived?.addEventListener("change", markEditorDirty);

  // -------------------------------
  // DELETE MODAL
  // -------------------------------

  confirmDeleteButton?.addEventListener("click", confirmDelete);

  cancelDeleteButton?.addEventListener("click", closeDeleteModal);

  // -------------------------------
  // THEME
  // -------------------------------

  themeButton?.addEventListener("click", (event) => {
    event.stopPropagation();

    toggleThemeMenu();
  });

  themeOptions.forEach((option) => {
    option.addEventListener("click", (event) => {
      event.stopPropagation();

      const theme = option.dataset.theme;

      applyTheme(theme, getUser());

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
  // KEYBOARD SHORTCUTS
  // -------------------------------

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      if (editorPage && !editorPage.classList.contains("hidden")) {
        event.preventDefault();

        saveNoteButton?.click();
      }
    }

    if (event.key === "Escape") {
      closeThemeMenu();

      closeDeleteModal();

      closeLogoutModal();
    }
  });
}

// ============================================================
// AUTHENTICATION
// ============================================================

async function handleSignup(event) {
  event.preventDefault();

  const name = signupName?.value.trim() || "";

  const email = signupEmail?.value.trim() || "";

  const password = signupPassword?.value || "";

  if (!name || !email || !password) {
    showToast("Please fill in all fields", "error");

    return;
  }

  const submitButton = signupForm?.querySelector('button[type="submit"]');

  try {
    setButtonLoading(submitButton, true);

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

    await loadNotes();
  } catch (error) {
    console.error("Signup error:", error);

    showToast(error.message || "Unable to create account", "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = loginEmail?.value.trim() || "";

  const password = loginPassword?.value || "";

  if (!email || !password) {
    showToast("Please enter email and password", "error");

    return;
  }

  const submitButton = loginForm?.querySelector('button[type="submit"]');

  try {
    setButtonLoading(submitButton, true);

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

    await loadNotes();
  } catch (error) {
    console.error("Login error:", error);

    showToast(error.message || "Unable to login", "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
}

// ============================================================
// AUTH STORAGE
// ============================================================

function saveAuthentication(data) {
  if (!data?.token || !data?.userId) {
    throw new Error("Invalid authentication response from server");
  }

  localStorage.setItem(TOKEN_KEY, data.token);

  const user = {
    userId: data.userId,

    name: data.name || "User",

    email: data.email || "",
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  loadUserTheme(user);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.warn("Invalid stored user. Clearing it.", error);

    localStorage.removeItem(USER_KEY);

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
  logoutModal?.classList.add("hidden");
}

function logout() {
  clearAuthentication();

  notes = [];

  editingNoteId = null;

  noteIdToDelete = null;

  currentPage = 1;

  currentFilter = "all";

  currentSort = "createdAt-desc";

  closeLogoutModal();

  closeDeleteModal();

  closeThemeMenu();

  clearEditor();

  showAuthPage();

  showLoginForm();

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

  closeThemeMenu();
}

function showEditor() {
  hideElement(authPage);

  hideElement(notesDashboard);

  showElement(editorPage);

  closeThemeMenu();
}

function hideElement(element) {
  element?.classList.add("hidden");
}

function showElement(element) {
  element?.classList.remove("hidden");
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
    userName.textContent = user.name || "User";
  }

  if (userEmail) {
    userEmail.textContent = user.email || "";
  }

  if (welcomeUserName) {
    welcomeUserName.textContent = user.name || "User";
  }

  if (userAvatar) {
    userAvatar.textContent = getInitials(user.name);
  }
}

function getInitials(name) {
  if (!name) {
    return "U";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

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
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      "Unable to connect to the NoteFlow server. Please check your internet connection.",
    );
  }

  if (response.status === 401) {
    clearAuthentication();

    notes = [];

    showAuthPage();

    showLoginForm();

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
  if (!getToken()) {
    return;
  }

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

      renderNotes();
    }
  }
}

// ============================================================
// NEW NOTE
// ============================================================

function openNewNoteEditor() {
  editingNoteId = null;

  clearEditor();

  if (editorModeLabel) {
    editorModeLabel.textContent = "New Note";
  }

  if (saveStatus) {
    saveStatus.textContent = "Unsaved";
  }

  if (editorDeleteButton) {
    editorDeleteButton.classList.add("hidden");
  }

  if (noteMetadata) {
    noteMetadata.classList.add("hidden");
  }

  showEditor();

  noteTitle?.focus();
}

// ============================================================
// EDIT NOTE
// ============================================================

function openEditNote(note) {
  const noteId = getNoteId(note);

  if (!noteId) {
    showToast("This note has an invalid ID", "error");

    return;
  }

  editingNoteId = noteId;

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
    noteContent.innerHTML = sanitizeRichHtml(note.content || "");
  }

  if (notePinned) {
    notePinned.checked = note.pinned === true;
  }

  if (noteFavorite) {
    noteFavorite.checked = note.favorite === true;
  }

  if (noteArchived) {
    noteArchived.checked = note.archived === true;
  }

  if (editorModeLabel) {
    editorModeLabel.textContent = "Edit Note";
  }

  if (saveStatus) {
    saveStatus.textContent = "Saved";
  }

  if (editorDeleteButton) {
    editorDeleteButton.classList.remove("hidden");
  }

  if (noteMetadata) {
    noteMetadata.classList.remove("hidden");
  }

  if (createdAtElement) {
    createdAtElement.textContent = formatDateTime(
      note.createdAt || note.created_at,
    );
  }

  if (updatedAtElement) {
    updatedAtElement.textContent = formatDateTime(
      note.updatedAt || note.updated_at,
    );
  }

  showEditor();

  noteTitle?.focus();
}

function getNoteId(note) {
  if (!note) {
    return null;
  }

  return note.id || note._id || note.noteId || null;
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

  if (notePinned) {
    notePinned.checked = false;
  }

  if (noteFavorite) {
    noteFavorite.checked = false;
  }

  if (noteArchived) {
    noteArchived.checked = false;
  }

  if (editorModeLabel) {
    editorModeLabel.textContent = "New Note";
  }

  if (saveStatus) {
    saveStatus.textContent = "Unsaved";
  }

  if (editorDeleteButton) {
    editorDeleteButton.classList.add("hidden");
  }

  if (noteMetadata) {
    noteMetadata.classList.add("hidden");
  }

  if (createdAtElement) {
    createdAtElement.textContent = "-";
  }

  if (updatedAtElement) {
    updatedAtElement.textContent = "-";
  }
}

function markEditorDirty() {
  if (editorPage && !editorPage.classList.contains("hidden")) {
    if (saveStatus) {
      saveStatus.textContent = "Unsaved changes";
    }
  }
}

// ============================================================
// SAVE / UPDATE NOTE
// ============================================================

async function handleNoteSubmit(event) {
  if (event?.preventDefault) {
    event.preventDefault();
  }

  const title = noteTitle?.value.trim() || "";

  const category = noteCategory?.value.trim() || "";

  const content = noteContent?.innerHTML.trim() || "";

  const tags = parseTags(noteTags?.value || "");

  const pinned = notePinned?.checked === true;

  const favorite = noteFavorite?.checked === true;

  const archived = noteArchived?.checked === true;

  if (!title) {
    showToast("Please enter a note title", "error");

    noteTitle?.focus();

    return;
  }

  if (!stripHtml(content).trim()) {
    showToast("Please enter some note content", "error");

    noteContent?.focus();

    return;
  }

  const isEditing = Boolean(editingNoteId);

  const payload = {
    title,

    category,

    tags,

    content,

    pinned,

    favorite,

    archived,
  };

  try {
    setButtonLoading(saveNoteButton, true);

    if (saveStatus) {
      saveStatus.textContent = "Saving...";
    }

    let response;

    if (isEditing) {
      response = await apiRequest(
        `${NOTES_API}/${encodeURIComponent(editingNoteId)}`,
        {
          method: "PUT",

          body: JSON.stringify(payload),
        },
      );
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

    clearEditor();

    showDashboard();

    await loadNotes();
  } catch (error) {
    console.error("Save note error:", error);

    if (error.message !== "Unauthorized") {
      if (saveStatus) {
        saveStatus.textContent = "Save failed";
      }

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
  if (!noteId) {
    showToast("Unable to identify this note", "error");

    return;
  }

  noteIdToDelete = noteId;

  deleteNoteModal?.classList.remove("hidden");
}

function closeDeleteModal() {
  noteIdToDelete = null;

  deleteNoteModal?.classList.add("hidden");
}

async function confirmDelete() {
  if (!noteIdToDelete) {
    return;
  }

  const id = noteIdToDelete;

  try {
    setButtonLoading(confirmDeleteButton, true);

    const response = await apiRequest(
      `${NOTES_API}/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "Unable to delete note");
    }

    closeDeleteModal();

    showToast("Note deleted successfully", "success");

    if (editingNoteId === id) {
      editingNoteId = null;

      clearEditor();

      showDashboard();
    }

    await loadNotes();
  } catch (error) {
    console.error("Delete note error:", error);

    if (error.message !== "Unauthorized") {
      showToast(error.message || "Unable to delete note", "error");
    }
  } finally {
    setButtonLoading(confirmDeleteButton, false);
  }
}

// ============================================================
// NOTE ACTIONS
// ============================================================

async function toggleNoteProperty(note, property, value) {
  const noteId = getNoteId(note);

  if (!noteId) {
    showToast("This note has an invalid ID", "error");

    return;
  }

  try {
    const payload = {
      title: note.title || "",

      category: note.category || "",

      tags: Array.isArray(note.tags) ? note.tags : parseTags(note.tags || ""),

      content: note.content || "",

      pinned: note.pinned === true,

      favorite: note.favorite === true,

      archived: note.archived === true,
    };

    payload[property] = value;

    const response = await apiRequest(
      `${NOTES_API}/${encodeURIComponent(noteId)}`,
      {
        method: "PUT",

        body: JSON.stringify(payload),
      },
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "Unable to update note");
    }

    await loadNotes();
  } catch (error) {
    console.error("Update note error:", error);

    if (error.message !== "Unauthorized") {
      showToast(error.message || "Unable to update note", "error");
    }
  }
}

// ============================================================
// RENDER NOTES
// ============================================================

function renderNotes() {
  if (!notesContainer) {
    console.error("NoteFlow: #notesContainer was not found in HTML.");

    return;
  }

  let filteredNotes = [...notes];

  const searchTerm = searchInput?.value.trim().toLowerCase() || "";

  // -------------------------------
  // SEARCH
  // -------------------------------

  if (searchTerm) {
    filteredNotes = filteredNotes.filter((note) => {
      const title = String(note.title || "").toLowerCase();

      const content = stripHtml(note.content || "").toLowerCase();

      const category = String(note.category || "").toLowerCase();

      const tags = Array.isArray(note.tags)
        ? note.tags.join(" ").toLowerCase()
        : String(note.tags || "").toLowerCase();

      return (
        title.includes(searchTerm) ||
        content.includes(searchTerm) ||
        category.includes(searchTerm) ||
        tags.includes(searchTerm)
      );
    });
  }

  // -------------------------------
  // FILTER
  // -------------------------------

  if (currentFilter === "pinned") {
    filteredNotes = filteredNotes.filter((note) => note.pinned === true);
  } else if (currentFilter === "favorite") {
    filteredNotes = filteredNotes.filter((note) => note.favorite === true);
  } else if (currentFilter === "archived") {
    filteredNotes = filteredNotes.filter((note) => note.archived === true);
  } else if (currentFilter === "active") {
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

  // IMPORTANT:
  // Only clear the actual notes grid.
  notesContainer.innerHTML = "";

  if (pageNotes.length === 0) {
    updateEmptyState(
      searchTerm,
      filteredNotes.length === 0 && notes.length === 0,
    );

    renderPagination(totalPages);

    return;
  }

  hideElement(emptyState);

  pageNotes.forEach((note) => {
    const card = createNoteCard(note);

    if (card) {
      notesContainer.appendChild(card);
    }
  });

  renderPagination(totalPages);
}

function updateEmptyState(searching, noNotesAtAll) {
  if (!emptyState) {
    return;
  }

  if (searching || (!noNotesAtAll && currentFilter !== "all")) {
    if (emptyTitle) {
      emptyTitle.textContent = "No notes found";
    }

    if (emptyDescription) {
      emptyDescription.textContent =
        "Try a different search or change the selected filter.";
    }
  } else {
    if (emptyTitle) {
      emptyTitle.textContent = "No notes yet";
    }

    if (emptyDescription) {
      emptyDescription.textContent = "Create your first note to get started.";
    }
  }

  showElement(emptyState);
}

// ============================================================
// SORT NOTES
// ============================================================

function sortNotes(noteList) {
  return [...noteList].sort((a, b) => {
    const createdA = getTimestamp(a.createdAt || a.created_at);

    const createdB = getTimestamp(b.createdAt || b.created_at);

    const updatedA = getTimestamp(a.updatedAt || a.updated_at);

    const updatedB = getTimestamp(b.updatedAt || b.updated_at);

    switch (currentSort) {
      case "createdAt-asc":
        return createdA - createdB;

      case "updatedAt-desc":
        return updatedB - updatedA;

      case "title-asc":
        return String(a.title || "").localeCompare(
          String(b.title || ""),
          undefined,
          {
            sensitivity: "base",
          },
        );

      case "title-desc":
        return String(b.title || "").localeCompare(
          String(a.title || ""),
          undefined,
          {
            sensitivity: "base",
          },
        );

      case "createdAt-desc":

      default:
        return createdB - createdA;
    }
  });
}

function getTimestamp(value) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

// ============================================================
// NOTE CARD
// ============================================================

function createNoteCard(note) {
  const noteId = getNoteId(note);

  if (!noteId) {
    console.warn("Skipping note without ID:", note);

    return null;
  }

  const card = document.createElement("article");

  card.className = "note-card";

  if (note.pinned === true) {
    card.classList.add("is-pinned");
  }

  const title = escapeHtml(note.title || "Untitled");

  const category = escapeHtml(note.category || "");

  const content = sanitizePreview(note.content || "");

  const date = formatDate(note.updatedAt || note.createdAt);

  const tags = Array.isArray(note.tags)
    ? note.tags
    : parseTags(note.tags || "");

  const tagsHtml = tags.length
    ? `
                <div class="note-tags">
                    ${tags
                      .map(
                        (tag) => `<span class="tag">${escapeHtml(tag)}</span>`,
                      )
                      .join("")}
                </div>
            `
    : "";

  card.innerHTML = `

        <div class="note-card-header">

            <div class="note-card-title-wrap">

                ${
                  note.pinned === true
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
                    type="button"
                    title="${note.pinned ? "Unpin" : "Pin"}"
                >
                    ${note.pinned ? "📌" : "📍"}
                </button>

                <button
                    class="icon-button"
                    data-action="favorite"
                    type="button"
                    title="${note.favorite ? "Remove favorite" : "Favorite"}"
                >
                    ${note.favorite ? "★" : "☆"}
                </button>

                <button
                    class="icon-button"
                    data-action="archive"
                    type="button"
                    title="${note.archived ? "Unarchive" : "Archive"}"
                >
                    ${note.archived ? "📦" : "🗃️"}
                </button>

                <button
                    class="icon-button"
                    data-action="delete"
                    type="button"
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
            ${content || "No content"}
        </div>

        ${tagsHtml}

        <div class="note-card-footer">

            <span>
                ${date}
            </span>

            <button
                class="note-edit-button"
                data-action="edit"
                type="button"
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
      toggleNoteProperty(note, "pinned", note.pinned !== true);

      return;
    }

    if (action === "favorite") {
      toggleNoteProperty(note, "favorite", note.favorite !== true);

      return;
    }

    if (action === "archive") {
      toggleNoteProperty(note, "archived", note.archived !== true);
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

  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  if (previousPageButton) {
    previousPageButton.disabled = currentPage <= 1 || totalPages <= 1;
  }

  if (nextPageButton) {
    nextPageButton.disabled = currentPage >= totalPages || totalPages <= 1;
  }

  // IMPORTANT:
  // Do not replace pagination.innerHTML.
  //
  // Your HTML already contains:
  // previousPageBtn
  // pageInfo
  // nextPageBtn
}

function goToPreviousPage() {
  if (currentPage <= 1) {
    return;
  }

  currentPage -= 1;

  renderNotes();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function goToNextPage() {
  const totalPages = getVisibleTotalPages();

  if (currentPage >= totalPages) {
    return;
  }

  currentPage += 1;

  renderNotes();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function getVisibleTotalPages() {
  let filteredNotes = [...notes];

  const searchTerm = searchInput?.value.trim().toLowerCase() || "";

  if (searchTerm) {
    filteredNotes = filteredNotes.filter((note) => {
      const title = String(note.title || "").toLowerCase();

      const content = stripHtml(note.content || "").toLowerCase();

      const category = String(note.category || "").toLowerCase();

      const tags = Array.isArray(note.tags)
        ? note.tags.join(" ").toLowerCase()
        : String(note.tags || "").toLowerCase();

      return (
        title.includes(searchTerm) ||
        content.includes(searchTerm) ||
        category.includes(searchTerm) ||
        tags.includes(searchTerm)
      );
    });
  }

  if (currentFilter === "pinned") {
    filteredNotes = filteredNotes.filter((note) => note.pinned === true);
  } else if (currentFilter === "favorite") {
    filteredNotes = filteredNotes.filter((note) => note.favorite === true);
  } else if (currentFilter === "archived") {
    filteredNotes = filteredNotes.filter((note) => note.archived === true);
  } else if (currentFilter === "active") {
    filteredNotes = filteredNotes.filter((note) => note.archived !== true);
  }

  return Math.max(1, Math.ceil(filteredNotes.length / NOTES_PER_PAGE));
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
  if (!VALID_THEMES.includes(theme)) {
    theme = DEFAULT_THEME;
  }

  document.body.classList.remove(
    "theme-violet",

    "theme-ocean",

    "theme-emerald",

    "theme-sunset",
  );

  document.body.classList.add(`theme-${theme}`);

  localStorage.setItem(getThemeStorageKey(user), theme);

  updateThemeSelection(theme);
}

function loadUserTheme(user) {
  const savedTheme = localStorage.getItem(getThemeStorageKey(user));

  applyTheme(savedTheme || DEFAULT_THEME, user);
}

function updateThemeSelection(selectedTheme) {
  themeOptions.forEach((option) => {
    const check = option.querySelector(".theme-check");

    const isSelected = option.dataset.theme === selectedTheme;

    option.classList.toggle("active", isSelected);

    if (check) {
      check.textContent = isSelected ? "✓" : "";
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
  themeMenu?.classList.add("hidden");
}

// ============================================================
// TAGS
// ============================================================

function parseTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, array) => array.indexOf(tag) === index);
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

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// HTML / SECURITY HELPERS
// ============================================================

function stripHtml(html) {
  const temporaryElement = document.createElement("div");

  temporaryElement.innerHTML = String(html || "");

  return temporaryElement.textContent || temporaryElement.innerText || "";
}

function sanitizePreview(html) {
  const text = stripHtml(html).replace(/\s+/g, " ").trim();

  const escaped = escapeHtml(text);

  if (escaped.length <= 180) {
    return escaped;
  }

  return escaped.substring(0, 180) + "...";
}

function sanitizeRichHtml(html) {
  const wrapper = document.createElement("div");

  wrapper.innerHTML = String(html || "");

  // Remove dangerous elements.
  wrapper
    .querySelectorAll("script, iframe, object, embed, style, link, meta")
    .forEach((element) => element.remove());

  // Remove inline event handlers
  // and javascript URLs.
  wrapper.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();

      const value = attribute.value || "";

      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);

        return;
      }

      if (
        (name === "href" || name === "src" || name === "xlink:href") &&
        /^\s*javascript:/i.test(value)
      ) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return wrapper.innerHTML;
}

function escapeHtml(value) {
  return String(value ?? "")
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
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }

    button.disabled = true;

    button.textContent = "Please wait...";
  } else {
    button.disabled = false;

    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;

      delete button.dataset.originalText;
    }
  }
}

// ============================================================
// TOAST
// ============================================================

function showToast(message, type = "success") {
  if (!toastContainer) {
    console[type === "error" ? "error" : "log"](message);

    return;
  }

  const toast = document.createElement("div");

  toast.className = `toast toast-${type}`;

  toast.textContent = message;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

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
