const NOTES_API = "/api/notes";
const AUTH_API = "/api/auth";

const TOKEN_KEY = "noteflow_token";
const USER_KEY = "noteflow_user";

const DEFAULT_THEME = "violet";

/* ============================================================
   STATE
   ============================================================ */

let currentPage = 0;
let currentSize = 10;

let currentSortBy = "createdAt";
let currentDirection = "desc";

let currentFilter = "all";
let currentKeyword = "";

let totalPages = 0;

let editingNoteId = null;
let deletingNoteId = null;

let searchTimeout = null;
let toastTimeout = null;

/* ============================================================
   DOM ELEMENTS
   ============================================================ */

/* AUTH */

const authPage = document.getElementById("authPage");

const loginTab = document.getElementById("loginTab");

const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");

const signupForm = document.getElementById("signupForm");

/* DASHBOARD */

const notesDashboard = document.getElementById("notesDashboard");

const logoutBtn = document.getElementById("logoutBtn");

const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");

const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

const logoutModal = document.getElementById("logoutModal");

const userName = document.getElementById("userName");

const userEmail = document.getElementById("userEmail");

const userAvatar = document.getElementById("userAvatar");

const welcomeUserName = document.getElementById("welcomeUserName");

const newNoteBtn = document.getElementById("newNoteBtn");

const emptyCreateBtn = document.getElementById("emptyCreateBtn");

const searchInput = document.getElementById("searchInput");

const filterSelect = document.getElementById("filterSelect");

const sortSelect = document.getElementById("sortSelect");

const notesContainer = document.getElementById("notesContainer");

const emptyState = document.getElementById("emptyState");

const emptyTitle = document.getElementById("emptyTitle");

const emptyDescription = document.getElementById("emptyDescription");

const pagination = document.getElementById("pagination");

const previousPageBtn = document.getElementById("previousPageBtn");

const nextPageBtn = document.getElementById("nextPageBtn");

const pageInfo = document.getElementById("pageInfo");

/* THEME */

const themeButton = document.getElementById("themeButton");

const themeMenu = document.getElementById("themeMenu");

const themeOptions = document.querySelectorAll(".theme-option");

/* EDITOR */

const editorPage = document.getElementById("editorPage");

const backToNotesBtn = document.getElementById("backToNotesBtn");

const editorModeLabel = document.getElementById("editorModeLabel");

const saveStatus = document.getElementById("saveStatus");

const editorSaveBtn = document.getElementById("editorSaveBtn");

const editorDeleteBtn = document.getElementById("editorDeleteBtn");

const noteTitle = document.getElementById("noteTitle");

const noteContent = document.getElementById("noteContent");

const fontSizeSelect = document.getElementById("fontSizeSelect");

const noteCategory = document.getElementById("noteCategory");

const noteTags = document.getElementById("noteTags");

const notePinned = document.getElementById("notePinned");

const noteFavorite = document.getElementById("noteFavorite");

const noteArchived = document.getElementById("noteArchived");

const noteMetadata = document.getElementById("noteMetadata");

const createdAt = document.getElementById("createdAt");

const updatedAt = document.getElementById("updatedAt");

/* MODALS */

const deleteModal = document.getElementById("deleteModal");

const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

/* TOAST */

const toast = document.getElementById("toast");

/* ============================================================
   INITIALIZATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  setupAuthEvents();

  setupDashboardEvents();

  setupEditorEvents();

  setupFormattingEvents();

  setupThemeEvents();

  checkAuthentication();
}

/* ============================================================
   AUTHENTICATION
   ============================================================ */

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser() {
  const user = localStorage.getItem(USER_KEY);

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    return null;
  }
}

function saveAuthentication(authResponse) {
  localStorage.setItem(TOKEN_KEY, authResponse.token);

  const user = {
    userId: authResponse.userId,

    name: authResponse.name,

    email: authResponse.email,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuthentication() {
  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(USER_KEY);
}

function checkAuthentication() {
  const token = getToken();

  const user = getStoredUser();

  if (token && user) {
    showDashboard(user);
  } else {
    showAuthPage();
  }
}

/* ============================================================
   API FETCH
   ============================================================ */

async function apiFetch(url, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthentication();

    showAuthPage();

    showToast("Session expired. Please login again.", "error");

    throw new Error("Authentication required");
  }

  return response;
}

/* ============================================================
   AUTH EVENTS
   ============================================================ */

function setupAuthEvents() {
  loginTab.addEventListener("click", showLoginForm);

  signupTab.addEventListener("click", showSignupForm);

  loginForm.addEventListener("submit", handleLogin);

  signupForm.addEventListener("submit", handleSignup);

  logoutBtn.addEventListener("click", openLogoutModal);

  cancelLogoutBtn.addEventListener("click", closeLogoutModal);

  confirmLogoutBtn.addEventListener("click", handleLogout);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !logoutModal.classList.contains("hidden")) {
      closeLogoutModal();
    }

    if (event.key === "Escape" && !deleteModal.classList.contains("hidden")) {
      closeDeleteModal();
    }
  });
}

/* ============================================================
   LOGIN
   ============================================================ */

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();

  const password = document.getElementById("loginPassword").value;

  try {
    setAuthButtonLoading(loginForm, true);

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
      throw new Error(getErrorMessage(data));
    }

    saveAuthentication(data);

    loginForm.reset();

    const user = {
      userId: data.userId,

      name: data.name,

      email: data.email,
    };

    showDashboard(user);

    showToast(`Welcome back, ${data.name}!`, "success");
  } catch (error) {
    showToast(error.message || "Login failed", "error");
  } finally {
    setAuthButtonLoading(loginForm, false);
  }
}

/* ============================================================
   SIGNUP
   ============================================================ */

async function handleSignup(event) {
  event.preventDefault();

  const name = document.getElementById("signupName").value.trim();

  const email = document.getElementById("signupEmail").value.trim();

  const password = document.getElementById("signupPassword").value;

  try {
    setAuthButtonLoading(signupForm, true);

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
      throw new Error(getErrorMessage(data));
    }

    saveAuthentication(data);

    signupForm.reset();

    const user = {
      userId: data.userId,

      name: data.name,

      email: data.email,
    };

    showDashboard(user);

    showToast(`Welcome to NoteFlow, ${data.name}!`, "success");
  } catch (error) {
    showToast(error.message || "Signup failed", "error");
  } finally {
    setAuthButtonLoading(signupForm, false);
  }
}

/* ============================================================
   LOGOUT
   ============================================================ */

function openLogoutModal() {
  logoutModal.classList.remove("hidden");
}

function closeLogoutModal() {
  logoutModal.classList.add("hidden");
}

function handleLogout() {
  closeLogoutModal();

  clearAuthentication();

  resetApplicationState();

  showAuthPage();

  showToast("You have been logged out", "success");
}

/* ============================================================
   SHOW / HIDE PAGES
   ============================================================ */

function showAuthPage() {
  authPage.classList.remove("hidden");

  notesDashboard.classList.add("hidden");

  editorPage.classList.add("hidden");

  document.body.classList.remove(
    "theme-violet",
    "theme-ocean",
    "theme-emerald",
    "theme-sunset",
  );

  document.body.classList.add("theme-violet");

  showLoginForm();
}

function showDashboard(user) {
  authPage.classList.add("hidden");

  editorPage.classList.add("hidden");

  notesDashboard.classList.remove("hidden");

  updateUserInformation(user);

  loadUserTheme(user);

  resetNotesState();

  loadNotes();
}

function showEditorPage() {
  notesDashboard.classList.add("hidden");

  editorPage.classList.remove("hidden");
}

/* ============================================================
   AUTH FORMS
   ============================================================ */

function showLoginForm() {
  loginTab.classList.add("active");

  signupTab.classList.remove("active");

  loginForm.classList.remove("hidden");

  signupForm.classList.add("hidden");
}

function showSignupForm() {
  signupTab.classList.add("active");

  loginTab.classList.remove("active");

  signupForm.classList.remove("hidden");

  loginForm.classList.add("hidden");
}

/* ============================================================
   USER INFORMATION
   ============================================================ */

function updateUserInformation(user) {
  if (!user) {
    return;
  }

  const name = user.name || "User";

  userName.textContent = name;

  userEmail.textContent = user.email || "";

  userAvatar.textContent = getInitial(name);

  welcomeUserName.textContent = name;
}

function getInitial(name) {
  if (!name) {
    return "U";
  }

  return name.trim().charAt(0).toUpperCase();
}

/* ============================================================
   THEME SYSTEM
   ============================================================ */

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
    const theme = option.dataset.theme;

    option.classList.toggle(
      "selected",

      theme === selectedTheme,
    );
  });
}

function setupThemeEvents() {
  if (!themeButton) {
    return;
  }

  themeButton.addEventListener("click", (event) => {
    event.stopPropagation();

    themeMenu.classList.toggle("hidden");
  });

  themeOptions.forEach((option) => {
    option.addEventListener("click", (event) => {
      const theme = event.currentTarget.dataset.theme;

      const user = getStoredUser();

      applyTheme(theme, user);

      themeMenu.classList.add("hidden");

      showToast(`${capitalize(theme)} theme applied`, "success");
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".theme-selector")) {
      themeMenu.classList.add("hidden");
    }
  });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* ============================================================
   DASHBOARD EVENTS
   ============================================================ */

function setupDashboardEvents() {
  newNoteBtn.addEventListener("click", openCreateEditor);

  emptyCreateBtn.addEventListener("click", openCreateEditor);

  searchInput.addEventListener("input", handleSearch);

  filterSelect.addEventListener("change", () => {
    currentFilter = filterSelect.value;

    currentPage = 0;

    loadNotes();
  });

  sortSelect.addEventListener("change", () => {
    const [sortBy, direction] = sortSelect.value.split("-");

    currentSortBy = sortBy;

    currentDirection = direction;

    currentPage = 0;

    loadNotes();
  });

  previousPageBtn.addEventListener("click", () => {
    if (currentPage > 0) {
      currentPage--;

      loadNotes();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages - 1) {
      currentPage++;

      loadNotes();
    }
  });
}

/* ============================================================
   LOAD NOTES
   ============================================================ */

async function loadNotes() {
  try {
    let url;

    const params = new URLSearchParams();

    params.set("page", currentPage);

    params.set("size", currentSize);

    params.set("sortBy", currentSortBy);

    params.set("direction", currentDirection);

    if (currentKeyword) {
      params.set("keyword", currentKeyword);

      url = `${NOTES_API}/search?${params.toString()}`;
    } else if (currentFilter === "pinned") {
      url = `${NOTES_API}/pinned?${params.toString()}`;
    } else if (currentFilter === "favorite") {
      url = `${NOTES_API}/favorites?${params.toString()}`;
    } else {
      url = `${NOTES_API}?${params.toString()}`;
    }

    const response = await apiFetch(url);

    if (!response.ok) {
      const data = await parseResponse(response);

      throw new Error(getErrorMessage(data));
    }

    const data = await response.json();

    renderNotes(data.content || []);

    totalPages = data.totalPages || 0;

    updatePagination(data);
  } catch (error) {
    if (error.message === "Authentication required") {
      return;
    }

    console.error("Failed to load notes:", error);

    showToast("Failed to load notes", "error");
  }
}

/* ============================================================
   RENDER NOTES
   ============================================================ */

function renderNotes(notes) {
  notesContainer.innerHTML = "";

  if (!notes.length) {
    notesContainer.classList.add("hidden");

    emptyState.classList.remove("hidden");

    if (currentKeyword) {
      emptyTitle.textContent = "No matching notes";

      emptyDescription.textContent = "Try another search keyword.";
    } else if (currentFilter !== "all") {
      emptyTitle.textContent = "Nothing here yet";

      emptyDescription.textContent = "No notes match this filter.";
    } else {
      emptyTitle.textContent = "No notes yet";

      emptyDescription.textContent = "Create your first note to get started.";
    }

    pagination.classList.add("hidden");

    return;
  }

  notesContainer.classList.remove("hidden");

  emptyState.classList.add("hidden");

  pagination.classList.remove("hidden");

  notes.forEach((note) => {
    notesContainer.appendChild(createNoteCard(note));
  });
}

/* ============================================================
   CREATE NOTE CARD
   ============================================================ */

function createNoteCard(note) {
  const card = document.createElement("article");

  card.className = "note-card glass-card";

  const preview = sanitizePreview(note.content);

  const tags = Array.isArray(note.tags) ? note.tags : [];

  card.innerHTML = `

        <div class="note-card-top">

            <div class="note-card-icons">

                ${note.pinned ? `<span title="Pinned">📌</span>` : ""}

                ${note.favorite ? `<span title="Favorite">★</span>` : ""}

                ${note.archived ? `<span title="Archived">Archive</span>` : ""}

            </div>


            <div class="note-card-menu">

                <button
                        class="icon-button"
                        data-action="edit"
                        title="Edit"
                        type="button"
                >
                    ⋮
                </button>

            </div>

        </div>


        <div
                class="note-card-body"
                data-action="edit"
        >

            <h3>
                ${escapeHtml(note.title || "Untitled Note")}
            </h3>

            <div class="note-preview">
                ${preview}
            </div>

        </div>


        <div class="note-card-footer">

            <div class="note-tags">

                ${
                  note.category
                    ? `
                            <span class="category-badge">
                                ${escapeHtml(note.category)}
                            </span>
                          `
                    : ""
                }


                ${tags
                  .slice(0, 3)
                  .map(
                    (tag) =>
                      `
                                <span class="tag-badge">
                                    #${escapeHtml(tag)}
                                </span>
                                `,
                  )
                  .join("")}

            </div>


            <span class="note-date">
                ${formatDate(note.updatedAt || note.createdAt)}
            </span>

        </div>
    `;

  card.querySelectorAll('[data-action="edit"]').forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();

      openEditEditor(note.id);
    });
  });

  return card;
}

/* ============================================================
   CREATE NOTE
   ============================================================ */

function openCreateEditor() {
  editingNoteId = null;

  clearEditor();

  editorModeLabel.textContent = "New Note";

  saveStatus.textContent = "Unsaved";

  editorDeleteBtn.classList.add("hidden");

  noteMetadata.classList.add("hidden");

  showEditorPage();

  noteTitle.focus();
}

/* ============================================================
   OPEN EDITOR
   ============================================================ */

async function openEditEditor(id) {
  try {
    const response = await apiFetch(`${NOTES_API}/${id}`);

    if (!response.ok) {
      const data = await parseResponse(response);

      throw new Error(getErrorMessage(data));
    }

    const note = await response.json();

    editingNoteId = note.id;

    noteTitle.value = note.title || "";

    noteContent.innerHTML = note.content || "";

    noteCategory.value = note.category || "";

    noteTags.value = Array.isArray(note.tags) ? note.tags.join(", ") : "";

    notePinned.checked = Boolean(note.pinned);

    noteFavorite.checked = Boolean(note.favorite);

    noteArchived.checked = Boolean(note.archived);

    editorModeLabel.textContent = "Edit Note";

    saveStatus.textContent = "Saved";

    editorDeleteBtn.classList.remove("hidden");

    noteMetadata.classList.remove("hidden");

    createdAt.textContent = formatDateTime(note.createdAt);

    updatedAt.textContent = formatDateTime(note.updatedAt);

    showEditorPage();

    noteTitle.focus();
  } catch (error) {
    if (error.message === "Authentication required") {
      return;
    }

    showToast(error.message || "Failed to open note", "error");
  }
}

/* ============================================================
   EDITOR EVENTS
   ============================================================ */

function setupEditorEvents() {
  backToNotesBtn.addEventListener("click", closeEditorPage);

  editorSaveBtn.addEventListener("click", handleNoteSubmit);

  editorDeleteBtn.addEventListener("click", () => {
    if (editingNoteId) {
      openDeleteModal(editingNoteId);
    }
  });

  noteTitle.addEventListener("input", markEditorUnsaved);

  noteContent.addEventListener("input", markEditorUnsaved);

  noteCategory.addEventListener("input", markEditorUnsaved);

  noteTags.addEventListener("input", markEditorUnsaved);

  notePinned.addEventListener("change", markEditorUnsaved);

  noteFavorite.addEventListener("change", markEditorUnsaved);

  noteArchived.addEventListener("change", markEditorUnsaved);

  document.addEventListener("keydown", (event) => {
    if (
      event.ctrlKey &&
      event.key === "Enter" &&
      !editorPage.classList.contains("hidden")
    ) {
      event.preventDefault();

      handleNoteSubmit();
    }
  });
}

/* ============================================================
   SAVE NOTE
   ============================================================ */

async function handleNoteSubmit() {
  const title = noteTitle.value.trim();

  const content = noteContent.innerHTML.trim();

  if (!title) {
    showToast("Title is required", "error");

    noteTitle.focus();

    return;
  }

  if (!content) {
    showToast("Content is required", "error");

    noteContent.focus();

    return;
  }

  const isEditing = Boolean(editingNoteId);

  const tags = noteTags.value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  const noteData = {
    title,

    content,

    category: noteCategory.value.trim(),

    tags,

    pinned: notePinned.checked,

    favorite: noteFavorite.checked,

    archived: noteArchived.checked,
  };

  try {
    editorSaveBtn.disabled = true;

    saveStatus.textContent = "Saving...";

    const url = isEditing ? `${NOTES_API}/${editingNoteId}` : NOTES_API;

    const method = isEditing ? "PUT" : "POST";

    const response = await apiFetch(url, {
      method,

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(noteData),
    });

    if (!response.ok) {
      const data = await parseResponse(response);

      throw new Error(getErrorMessage(data));
    }

    const savedNote = await response.json();

    editingNoteId = savedNote.id;

    editorModeLabel.textContent = "Edit Note";

    saveStatus.textContent = "Saved";

    editorDeleteBtn.classList.remove("hidden");

    noteMetadata.classList.remove("hidden");

    createdAt.textContent = formatDateTime(savedNote.createdAt);

    updatedAt.textContent = formatDateTime(savedNote.updatedAt);

    showToast(
      isEditing ? "Note updated successfully" : "Note created successfully",
      "success",
    );

    await loadNotes();
  } catch (error) {
    if (error.message === "Authentication required") {
      return;
    }

    saveStatus.textContent = "Save failed";

    showToast(error.message || "Failed to save note", "error");
  } finally {
    editorSaveBtn.disabled = false;
  }
}

/* ============================================================
   CLOSE EDITOR
   ============================================================ */

function closeEditorPage() {
  editorPage.classList.add("hidden");

  notesDashboard.classList.remove("hidden");

  clearEditor();

  editingNoteId = null;

  loadNotes();
}

/* ============================================================
   CLEAR EDITOR
   ============================================================ */

function clearEditor() {
  noteTitle.value = "";

  noteContent.innerHTML = "";

  noteCategory.value = "";

  noteTags.value = "";

  notePinned.checked = false;

  noteFavorite.checked = false;

  noteArchived.checked = false;

  createdAt.textContent = "-";

  updatedAt.textContent = "-";

  fontSizeSelect.value = "3";

  saveStatus.textContent = "Unsaved";

  editorModeLabel.textContent = "New Note";

  noteMetadata.classList.add("hidden");

  editorDeleteBtn.classList.add("hidden");
}

/* ============================================================
   SEARCH
   ============================================================ */

function handleSearch() {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    currentKeyword = searchInput.value.trim();

    currentPage = 0;

    loadNotes();
  }, 350);
}

/* ============================================================
   PAGINATION
   ============================================================ */

function updatePagination(data) {
  const current = (data.number || 0) + 1;

  const total = data.totalPages || 0;

  pageInfo.textContent = total > 0 ? `Page ${current} of ${total}` : "Page 1";

  previousPageBtn.disabled = currentPage <= 0;

  nextPageBtn.disabled = currentPage >= total - 1;

  if (total <= 1) {
    pagination.classList.add("hidden");
  } else {
    pagination.classList.remove("hidden");
  }
}

/* ============================================================
   FORMATTING
   ============================================================ */

function setupFormattingEvents() {
  document
    .querySelectorAll(".editor-toolbar [data-command]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const command = button.dataset.command;

        document.execCommand(command, false, null);

        noteContent.focus();

        markEditorUnsaved();
      });
    });

  fontSizeSelect.addEventListener("change", () => {
    document.execCommand("fontSize", false, fontSizeSelect.value);

    noteContent.focus();

    markEditorUnsaved();
  });
}

/* ============================================================
   UNSAVED STATE
   ============================================================ */

function markEditorUnsaved() {
  if (!editorPage.classList.contains("hidden")) {
    saveStatus.textContent = "Unsaved changes";
  }
}

/* ============================================================
   DELETE NOTE
   ============================================================ */

function openDeleteModal(id) {
  deletingNoteId = id;

  deleteModal.classList.remove("hidden");
}

function closeDeleteModal() {
  deletingNoteId = null;

  deleteModal.classList.add("hidden");
}

cancelDeleteBtn.addEventListener("click", closeDeleteModal);

confirmDeleteBtn.addEventListener("click", handleDelete);

async function handleDelete() {
  if (!deletingNoteId) {
    return;
  }

  try {
    confirmDeleteBtn.disabled = true;

    const response = await apiFetch(`${NOTES_API}/${deletingNoteId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await parseResponse(response);

      throw new Error(getErrorMessage(data));
    }

    const deletedFromEditor = editingNoteId === deletingNoteId;

    closeDeleteModal();

    if (deletedFromEditor) {
      closeEditorPage();
    } else {
      await loadNotes();
    }

    showToast("Note deleted successfully", "success");
  } catch (error) {
    if (error.message === "Authentication required") {
      return;
    }

    showToast(error.message || "Failed to delete note", "error");
  } finally {
    confirmDeleteBtn.disabled = false;
  }
}

/* ============================================================
   RESET NOTES STATE
   ============================================================ */

function resetNotesState() {
  currentPage = 0;

  currentSize = 10;

  currentSortBy = "createdAt";

  currentDirection = "desc";

  currentFilter = "all";

  currentKeyword = "";

  totalPages = 0;

  searchInput.value = "";

  filterSelect.value = "all";

  sortSelect.value = "createdAt-desc";
}

function resetApplicationState() {
  resetNotesState();

  editingNoteId = null;

  deletingNoteId = null;

  clearEditor();

  notesContainer.innerHTML = "";

  emptyState.classList.add("hidden");
}

/* ============================================================
   RESPONSE HELPERS
   ============================================================ */

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      message: text,
    };
  }
}

function getErrorMessage(data) {
  if (data && data.errors) {
    const errors = Object.values(data.errors);

    if (errors.length) {
      return errors[0];
    }
  }

  return data?.message || "Something went wrong";
}

/* ============================================================
   AUTH BUTTON LOADING
   ============================================================ */

function setAuthButtonLoading(form, loading) {
  const button = form.querySelector(".auth-submit");

  if (!button) {
    return;
  }

  if (loading) {
    button.disabled = true;

    button.dataset.originalText = button.textContent;

    button.textContent = "Please wait...";
  } else {
    button.disabled = false;

    button.textContent = button.dataset.originalText || button.textContent;
  }
}

/* ============================================================
   HTML HELPERS
   ============================================================ */

function escapeHtml(value) {
  const div = document.createElement("div");

  div.textContent = value ?? "";

  return div.innerHTML;
}

function sanitizePreview(html) {
  if (!html) {
    return "No content";
  }

  const temp = document.createElement("div");

  temp.innerHTML = html;

  temp.querySelectorAll("script, style").forEach((element) => element.remove());

  const text = temp.textContent || temp.innerText || "";

  const cleanText = text.trim();

  if (!cleanText) {
    return "No content";
  }

  return escapeHtml(
    cleanText.length > 180 ? cleanText.substring(0, 180) + "..." : cleanText,
  );
}

/* ============================================================
   DATE HELPERS
   ============================================================ */

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* ============================================================
   TOAST
   ============================================================ */

function showToast(message, type = "success") {
  toast.textContent = message;

  toast.className = `toast ${type} show`;

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
