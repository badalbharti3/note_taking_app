const API_BASE_URL = "https://notetakingapp-production-233a.up.railway.app";

/* =========================================================
   STATE
========================================================= */

let authToken = localStorage.getItem("authToken");
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

let notes = [];
let currentNote = null;

let currentPage = 1;
let pageSize = 6;

let currentFilter = "all";
let currentSort = "newest";
let currentSearch = "";

let deleteNoteId = null;

/* =========================================================
   DOM ELEMENTS
========================================================= */

const authPage = document.getElementById("authPage");

const notesDashboard = document.getElementById("notesDashboard");

const editorPage = document.getElementById("editorPage");

/* Auth */

const loginTab = document.getElementById("loginTab");

const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");

const signupForm = document.getElementById("signupForm");

/* User */

const userAvatar = document.getElementById("userAvatar");

const userName = document.getElementById("userName");

const userEmail = document.getElementById("userEmail");

const welcomeUserName = document.getElementById("welcomeUserName");

/* Dashboard */

const logoutBtn = document.getElementById("logoutBtn");

const newNoteBtn = document.getElementById("newNoteBtn");

const emptyCreateBtn = document.getElementById("emptyCreateBtn");

const searchInput = document.getElementById("searchInput");

const filterSelect = document.getElementById("filterSelect");

const sortSelect = document.getElementById("sortSelect");

const notesContainer = document.getElementById("notesContainer");

const emptyState = document.getElementById("emptyState");

const pagination = document.getElementById("pagination");

const previousPageBtn = document.getElementById("previousPageBtn");

const nextPageBtn = document.getElementById("nextPageBtn");

/* Editor */

const backToNotesBtn = document.getElementById("backToNotesBtn");

const editorModeLabel = document.getElementById("editorModeLabel");

const saveStatus = document.getElementById("saveStatus");

const editorDeleteBtn = document.getElementById("editorDeleteBtn");

const editorSaveBtn = document.getElementById("editorSaveBtn");

const noteTitle = document.getElementById("noteTitle");

const noteCategory = document.getElementById("noteCategory");

const noteTags = document.getElementById("noteTags");

const noteContent = document.getElementById("noteContent");

const notePinned = document.getElementById("notePinned");

const noteFavorite = document.getElementById("noteFavorite");

const noteArchived = document.getElementById("noteArchived");

const noteMetadata = document.getElementById("noteMetadata");

/* Theme */

const themeButton = document.getElementById("themeButton");

const themeMenu = document.getElementById("themeMenu");

/* Modals */

const deleteModal = document.getElementById("deleteModal");

const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const logoutModal = document.getElementById("logoutModal");

const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");

const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

/* Toast */

const toast = document.getElementById("toast");

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeApplication();

  setupEventListeners();

  initializeTheme();
});

function initializeApplication() {
  if (authToken && currentUser) {
    showDashboard();

    loadNotes();
  } else {
    showAuthPage();
  }
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {
  /* -----------------------------------------
       AUTH TABS
    ----------------------------------------- */

  if (loginTab) {
    loginTab.addEventListener("click", () => {
      switchAuthTab("login");
    });
  }

  if (signupTab) {
    signupTab.addEventListener("click", () => {
      switchAuthTab("signup");
    });
  }

  /* -----------------------------------------
       AUTH FORMS
    ----------------------------------------- */

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }

  /* -----------------------------------------
       LOGOUT
    ----------------------------------------- */

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      openLogoutModal();
    });
  }

  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener("click", () => {
      closeLogoutModal();
    });
  }

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener("click", () => {
      logout();
    });
  }

  /* -----------------------------------------
       NEW NOTE
    ----------------------------------------- */

  if (newNoteBtn) {
    newNoteBtn.addEventListener("click", () => {
      openNewNoteEditor();
    });
  }

  if (emptyCreateBtn) {
    emptyCreateBtn.addEventListener("click", () => {
      openNewNoteEditor();
    });
  }

  /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      debounce(() => {
        currentSearch = searchInput.value.trim().toLowerCase();

        currentPage = 1;

        renderNotes();
      }, 250),
    );
  }

  /* -----------------------------------------
       FILTER
    ----------------------------------------- */

  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      currentFilter = filterSelect.value;

      currentPage = 1;

      renderNotes();
    });
  }

  /* -----------------------------------------
       SORT
    ----------------------------------------- */

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      currentSort = sortSelect.value;

      currentPage = 1;

      renderNotes();
    });
  }

  /* -----------------------------------------
       BACK TO NOTES
    ----------------------------------------- */

  if (backToNotesBtn) {
    backToNotesBtn.addEventListener("click", () => {
      showDashboard();

      loadNotes();
    });
  }

  /* -----------------------------------------
       SAVE NOTE
    ----------------------------------------- */

  if (editorSaveBtn) {
    editorSaveBtn.addEventListener("click", handleNoteSubmit);
  }

  /* -----------------------------------------
       DELETE FROM EDITOR
    ----------------------------------------- */

  if (editorDeleteBtn) {
    editorDeleteBtn.addEventListener("click", () => {
      if (currentNote && currentNote.id) {
        openDeleteModal(currentNote.id);
      }
    });
  }

  /* -----------------------------------------
       DELETE MODAL
    ----------------------------------------- */

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", () => {
      closeDeleteModal();
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", () => {
      if (deleteNoteId) {
        deleteNote(deleteNoteId);
      }
    });
  }

  /* -----------------------------------------
       THEME
    ----------------------------------------- */

  if (themeButton) {
    themeButton.addEventListener("click", (event) => {
      event.stopPropagation();

      toggleThemeMenu();
    });
  }

  document.querySelectorAll(".theme-option").forEach((option) => {
    option.addEventListener("click", () => {
      const theme = option.dataset.theme;

      if (theme) {
        applyTheme(theme);
      }

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

  /* -----------------------------------------
       KEYBOARD SHORTCUT
    ----------------------------------------- */

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      if (
        editorPage &&
        !editorPage.classList.contains("hidden") &&
        editorSaveBtn
      ) {
        event.preventDefault();

        editorSaveBtn.click();
      }
    }

    if (event.key === "Escape") {
      closeDeleteModal();

      closeLogoutModal();

      closeThemeMenu();
    }
  });
}

/* =========================================================
   AUTH
========================================================= */

function switchAuthTab(tab) {
  if (tab === "login") {
    loginTab?.classList.add("active");

    signupTab?.classList.remove("active");

    loginForm?.classList.remove("hidden");

    signupForm?.classList.add("hidden");
  } else {
    signupTab?.classList.add("active");

    loginTab?.classList.remove("active");

    signupForm?.classList.remove("hidden");

    loginForm?.classList.add("hidden");
  }
}

async function handleSignup(event) {
  event.preventDefault();

  const formData = new FormData(signupForm);

  const name = formData.get("name")?.trim();

  const email = formData.get("email")?.trim();

  const password = formData.get("password");

  if (!name || !email || !password) {
    showToast("Please fill all fields", "error");

    return;
  }

  try {
    setButtonLoading(signupForm.querySelector('button[type="submit"]'), true);

    const response = await apiRequest("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    saveAuthentication(response);

    showToast("Account created successfully", "success");

    signupForm.reset();

    showDashboard();

    await loadNotes();
  } catch (error) {
    showToast(error.message || "Signup failed", "error");
  } finally {
    setButtonLoading(signupForm.querySelector('button[type="submit"]'), false);
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(loginForm);

  const email = formData.get("email")?.trim();

  const password = formData.get("password");

  if (!email || !password) {
    showToast("Please enter email and password", "error");

    return;
  }

  try {
    setButtonLoading(loginForm.querySelector('button[type="submit"]'), true);

    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    saveAuthentication(response);

    showToast("Login successful", "success");

    loginForm.reset();

    showDashboard();

    await loadNotes();
  } catch (error) {
    showToast(error.message || "Login failed", "error");
  } finally {
    setButtonLoading(loginForm.querySelector('button[type="submit"]'), false);
  }
}

function saveAuthentication(response) {
  authToken = response.token;

  currentUser = {
    userId: response.userId,

    name: response.name,

    email: response.email,
  };

  localStorage.setItem("authToken", authToken);

  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

/* =========================================================
   LOGOUT
========================================================= */

function openLogoutModal() {
  logoutModal?.classList.remove("hidden");
}

function closeLogoutModal() {
  logoutModal?.classList.add("hidden");
}

function logout() {
  authToken = null;

  currentUser = null;

  notes = [];

  currentNote = null;

  localStorage.removeItem("authToken");

  localStorage.removeItem("currentUser");

  closeLogoutModal();

  showAuthPage();

  showToast("Logged out successfully", "success");
}

/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showAuthPage() {
  authPage?.classList.remove("hidden");

  notesDashboard?.classList.add("hidden");

  editorPage?.classList.add("hidden");
}

function showDashboard() {
  authPage?.classList.add("hidden");

  notesDashboard?.classList.remove("hidden");

  editorPage?.classList.add("hidden");

  updateUserUI();
}

function showEditor() {
  authPage?.classList.add("hidden");

  notesDashboard?.classList.add("hidden");

  editorPage?.classList.remove("hidden");
}

function updateUserUI() {
  if (!currentUser) {
    return;
  }

  if (userName) {
    userName.textContent = currentUser.name || "User";
  }

  if (userEmail) {
    userEmail.textContent = currentUser.email || "";
  }

  if (welcomeUserName) {
    welcomeUserName.textContent = currentUser.name || "User";
  }

  if (userAvatar) {
    const name = currentUser.name || "U";

    userAvatar.textContent = name.charAt(0).toUpperCase();
  }
}

/* =========================================================
   NOTES API
========================================================= */

async function loadNotes() {
  if (!authToken) {
    return;
  }

  try {
    const response = await apiRequest("/api/notes", {
      method: "GET",
    });

    if (Array.isArray(response)) {
      notes = response;
    } else if (response && Array.isArray(response.content)) {
      notes = response.content;
    } else if (response && Array.isArray(response.notes)) {
      notes = response.notes;
    } else {
      notes = [];
    }

    currentPage = 1;

    renderNotes();
  } catch (error) {
    console.error("Failed to load notes:", error);

    if (error.status === 401 || error.status === 403) {
      logout();

      return;
    }

    showToast(error.message || "Failed to load notes", "error");
  }
}

/* =========================================================
   RENDER NOTES
========================================================= */

function renderNotes() {
  if (!notesContainer) {
    return;
  }

  let filteredNotes = [...notes];

  /* -----------------------------------------
       FILTER
    ----------------------------------------- */

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

  /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

  if (currentSearch) {
    filteredNotes = filteredNotes.filter((note) => {
      const title = String(note.title || "").toLowerCase();

      const content = String(note.content || "").toLowerCase();

      const category = String(note.category || "").toLowerCase();

      const tags = String(note.tags || "").toLowerCase();

      return (
        title.includes(currentSearch) ||
        content.includes(currentSearch) ||
        category.includes(currentSearch) ||
        tags.includes(currentSearch)
      );
    });
  }

  /* -----------------------------------------
       SORT
    ----------------------------------------- */

  filteredNotes.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();

    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();

    if (currentSort === "oldest") {
      return dateA - dateB;
    }

    if (currentSort === "title") {
      return String(a.title || "").localeCompare(String(b.title || ""));
    }

    if (currentSort === "pinned") {
      return Number(b.pinned === true) - Number(a.pinned === true);
    }

    return dateB - dateA;
  });

  /* -----------------------------------------
       EMPTY
    ----------------------------------------- */

  if (filteredNotes.length === 0) {
    notesContainer.innerHTML = "";

    emptyState?.classList.remove("hidden");

    if (pagination) {
      pagination.innerHTML = "";
    }

    return;
  }

  emptyState?.classList.add("hidden");

  /* -----------------------------------------
       PAGINATION
    ----------------------------------------- */

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / pageSize));

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * pageSize;

  const end = start + pageSize;

  const pageNotes = filteredNotes.slice(start, end);

  notesContainer.innerHTML = pageNotes
    .map((note) => createNoteCard(note))
    .join("");

  setupNoteCardListeners();

  renderPagination(totalPages);
}

/* =========================================================
   NOTE CARD
========================================================= */

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
              (tag) => `
                <span class="tag">
                  ${escapeHtml(tag)}
                </span>
              `,
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
            ? '<span class="note-pin" title="Pinned">📌</span>'
            : ""
        }
        <h3>${title}</h3>
      </div>

      <div class="note-actions">
        <button class="icon-button" data-action="pin" title="Pin" type="button">
          ${note.pinned ? "📌" : "📍"}
        </button>
        <button class="icon-button" data-action="favorite" title="Favorite" type="button">
          ${note.favorite ? "★" : "☆"}
        </button>
        <button class="icon-button" data-action="archive" title="Archive" type="button">
          ${note.archived ? "📦" : "🗃️"}
        </button>
        <button class="icon-button" data-action="delete" title="Delete" type="button">
          🗑️
        </button>
      </div>
    </div>

    <div class="note-card-content" data-note-id="${escapeAttribute(noteId)}">
      ${category ? `<div class="note-category">${category}</div>` : ""}
      <div class="note-preview">${content}</div>
      ${tagsHtml}
    </div>

    <div class="note-card-footer">
      <span>${date}</span>
      ${note.favorite ? '<span class="note-status">★ Favorite</span>' : ""}
      ${note.archived ? '<span class="note-status">📦 Archived</span>' : ""}
    </div>
  `;

  const contentArea = card.querySelector(".note-card-content");

  if (contentArea) {
    contentArea.addEventListener("click", () => {
      openEditNote(noteId);
    });
  }

  const actionButtons = card.querySelectorAll(".icon-button");

  actionButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();

      const action = button.dataset.action;

      if (action === "pin") {
        await updateNote(
          noteId,
          { ...note, pinned: !Boolean(note.pinned) },
          true,
        );
      }

      if (action === "favorite") {
        await updateNote(
          noteId,
          { ...note, favorite: !Boolean(note.favorite) },
          true,
        );
      }

      if (action === "archive") {
        await updateNote(
          noteId,
          { ...note, archived: !Boolean(note.archived) },
          true,
        );
      }

      if (action === "delete") {
        openDeleteModal(noteId);
      }
    });
  });

  return card;
}

/* =========================================================
   NOTE CARD LISTENERS
========================================================= */

function setupNoteCardListeners() {
  document.querySelectorAll(".note-card-body").forEach((element) => {
    element.addEventListener("click", () => {
      const id = element.dataset.id;

      openEditNote(id);
    });
  });

  document.querySelectorAll(".pin-note-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();

      const id = button.dataset.id;

      const note = findNoteById(id);

      if (!note) {
        return;
      }

      await updateNote(
        id,
        {
          ...note,
          pinned: !Boolean(note.pinned),
        },
        true,
      );
    });
  });

  document.querySelectorAll(".favorite-note-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();

      const id = button.dataset.id;

      const note = findNoteById(id);

      if (!note) {
        return;
      }

      await updateNote(
        id,
        {
          ...note,
          favorite: !Boolean(note.favorite),
        },
        true,
      );
    });
  });

  document.querySelectorAll(".delete-note-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();

      openDeleteModal(button.dataset.id);
    });
  });
}

/* =========================================================
   NEW NOTE
========================================================= */

function openNewNoteEditor() {
  currentNote = null;

  if (editorModeLabel) {
    editorModeLabel.textContent = "Create New Note";
  }

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

    if (noteContent.tagName === "TEXTAREA" || noteContent.tagName === "INPUT") {
      noteContent.value = "";
    }
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

  if (noteMetadata) {
    noteMetadata.textContent = "";
  }

  if (editorDeleteBtn) {
    editorDeleteBtn.classList.add("hidden");
  }

  if (saveStatus) {
    saveStatus.textContent = "New note";
  }

  showEditor();
}

/* =========================================================
   EDIT NOTE
========================================================= */

function openEditNote(id) {
  const note = findNoteById(id);

  if (!note) {
    showToast("Note not found", "error");

    return;
  }

  currentNote = note;

  if (editorModeLabel) {
    editorModeLabel.textContent = "Edit Note";
  }

  if (noteTitle) {
    noteTitle.value = note.title || "";
  }

  if (noteCategory) {
    noteCategory.value = note.category || "";
  }

  if (noteTags) {
    noteTags.value = normalizeTags(note.tags).join(", ");
  }

  if (noteContent) {
    if (noteContent.tagName === "TEXTAREA" || noteContent.tagName === "INPUT") {
      noteContent.value = note.content || "";
    } else {
      noteContent.innerHTML = note.content || "";
    }
  }

  if (notePinned) {
    notePinned.checked = Boolean(note.pinned);
  }

  if (noteFavorite) {
    noteFavorite.checked = Boolean(note.favorite);
  }

  if (noteArchived) {
    noteArchived.checked = Boolean(note.archived);
  }

  if (noteMetadata) {
    noteMetadata.textContent = `Created: ${formatDate(note.createdAt)}`;
  }

  if (editorDeleteBtn) {
    editorDeleteBtn.classList.remove("hidden");
  }

  if (saveStatus) {
    saveStatus.textContent = "Editing note";
  }

  showEditor();
}

/* =========================================================
   SAVE NOTE
========================================================= */

async function handleNoteSubmit(event) {
  if (event) {
    event.preventDefault();
  }

  const title = noteTitle?.value.trim() || "";

  let content = "";

  if (noteContent) {
    if (noteContent.tagName === "TEXTAREA" || noteContent.tagName === "INPUT") {
      content = noteContent.value.trim();
    } else {
      content = noteContent.innerHTML.trim();
    }
  }

  const category = noteCategory?.value.trim() || "";

  const tags = normalizeTags(noteTags?.value || "");

  const pinned = Boolean(notePinned?.checked);

  const favorite = Boolean(noteFavorite?.checked);

  const archived = Boolean(noteArchived?.checked);

  if (!title) {
    showToast("Please enter a note title", "error");

    noteTitle?.focus();

    return;
  }

  if (!content) {
    showToast("Please enter some note content", "error");

    noteContent?.focus();

    return;
  }

  const noteData = {
    title,

    content,

    category,

    tags,

    pinned,

    favorite,

    archived,
  };

  try {
    setButtonLoading(editorSaveBtn, true);

    if (currentNote && getNoteId(currentNote)) {
      await updateNote(getNoteId(currentNote), noteData, false);

      showToast("Note updated successfully", "success");
    } else {
      await createNote(noteData);

      showToast("Note created successfully", "success");
    }

    showDashboard();

    await loadNotes();
  } catch (error) {
    showToast(error.message || "Unable to save note", "error");
  } finally {
    setButtonLoading(editorSaveBtn, false);
  }
}

/* =========================================================
   CREATE NOTE
========================================================= */

async function createNote(noteData) {
  const response = await apiRequest("/api/notes", {
    method: "POST",
    body: JSON.stringify(noteData),
  });

  if (response) {
    const created = response.note || response;

    if (created) {
      notes.unshift(created);
    }
  }

  return response;
}

/* =========================================================
   UPDATE NOTE
========================================================= */

async function updateNote(id, noteData, refresh) {
  try {
    const response = await apiRequest(`/api/notes/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(noteData),
    });

    const updated = response?.note || response;

    const index = notes.findIndex((note) => getNoteId(note) === String(id));

    if (index !== -1 && updated) {
      notes[index] = updated;
    }

    if (refresh) {
      await loadNotes();
    }

    return response;
  } catch (error) {
    showToast(error.message || "Failed to update note", "error");

    throw error;
  }
}

/* =========================================================
   DELETE NOTE
========================================================= */

async function deleteNote(id) {
  try {
    setButtonLoading(confirmDeleteBtn, true);

    await apiRequest(`/api/notes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    notes = notes.filter((note) => getNoteId(note) !== String(id));

    closeDeleteModal();

    if (currentNote && getNoteId(currentNote) === String(id)) {
      currentNote = null;

      showDashboard();
    }

    renderNotes();

    showToast("Note deleted successfully", "success");
  } catch (error) {
    showToast(error.message || "Failed to delete note", "error");
  } finally {
    setButtonLoading(confirmDeleteBtn, false);
  }
}

/* =========================================================
   DELETE MODAL
========================================================= */

function openDeleteModal(id) {
  deleteNoteId = String(id);

  deleteModal?.classList.remove("hidden");
}

function closeDeleteModal() {
  deleteNoteId = null;

  deleteModal?.classList.add("hidden");
}

/* =========================================================
   PAGINATION
========================================================= */

function renderPagination(totalPages) {
  if (!pagination) {
    return;
  }

  if (totalPages <= 1) {
    pagination.innerHTML = "";

    return;
  }

  pagination.innerHTML = `

        <button
            type="button"
            class="pagination-btn"
            id="generatedPreviousPageBtn"
            ${currentPage <= 1 ? "disabled" : ""}
        >
            Previous
        </button>

        <span class="pagination-info">
            Page ${currentPage} of ${totalPages}
        </span>

        <button
            type="button"
            class="pagination-btn"
            id="generatedNextPageBtn"
            ${currentPage >= totalPages ? "disabled" : ""}
        >
            Next
        </button>

    `;

  document
    .getElementById("generatedPreviousPageBtn")
    ?.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;

        renderNotes();
      }
    });

  document
    .getElementById("generatedNextPageBtn")
    ?.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;

        renderNotes();
      }
    });
}

/* =========================================================
   THEME
========================================================= */

const DEFAULT_THEME = "violet";

const themeOptions = document.querySelectorAll(".theme-option");

function getThemeStorageKey(user) {
  if (!user || !user.userId) {
    return "noteflow_theme_guest";
  }

  return `noteflow_theme_${user.userId}`;
}

function applyTheme(theme, user = currentUser) {
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

  localStorage.setItem(getThemeStorageKey(user), theme);

  updateThemeSelection(theme);
}

function loadUserTheme(user = currentUser) {
  const savedTheme = localStorage.getItem(getThemeStorageKey(user));

  applyTheme(savedTheme || DEFAULT_THEME, user);
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
  if (!themeMenu) {
    return;
  }

  themeMenu.classList.add("hidden");
}

if (themeButton) {
  themeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleThemeMenu();
  });
}

themeOptions.forEach((option) => {
  option.addEventListener("click", (event) => {
    event.stopPropagation();

    const selectedTheme = option.dataset.theme;

    if (!selectedTheme) {
      return;
    }

    applyTheme(selectedTheme, currentUser);
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

function initializeTheme() {
  loadUserTheme(currentUser);
}

/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",

    ...(options.headers || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error || `Request failed (${response.status})`,
    );

    error.status = response.status;

    throw error;
  }

  return data;
}

/* =========================================================
   HELPERS
========================================================= */

function findNoteById(id) {
  return notes.find((note) => getNoteId(note) === String(id));
}

function getNoteId(note) {
  if (!note) {
    return "";
  }

  return String(note.id || note._id || "");
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function stripHtml(html) {
  const div = document.createElement("div");

  div.innerHTML = html || "";

  return div.textContent || div.innerText || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

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

function debounce(callback, delay) {
  let timeout;

  return function (...args) {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
}

function setButtonLoading(button, loading) {
  if (!button) {
    return;
  }

  if (loading) {
    button.dataset.originalText = button.innerHTML;

    button.disabled = true;

    button.innerHTML = "Please wait...";
  } else {
    button.disabled = false;

    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }
}

/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "info") {
  if (!toast) {
    alert(message);

    return;
  }

  /*
       Support both:
       1. #toast as a container
       2. #toast as a single toast element
    */

  const toastElement = document.createElement("div");

  toastElement.className = `toast-message ${type}`;

  toastElement.textContent = message;

  toast.appendChild(toastElement);

  setTimeout(() => {
    toastElement.classList.add("hide");

    setTimeout(() => {
      toastElement.remove();
    }, 300);
  }, 3000);
}

/* =========================================================
   EXPORT FOR DEBUGGING
========================================================= */

window.NoteFlow = {
  loadNotes,

  renderNotes,

  openNewNoteEditor,

  openEditNote,

  createNote,

  updateNote,

  deleteNote,

  logout,
};
