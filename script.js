// =====================================================================
//  Firebase SDK Imports
// =====================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
// --- NEW: Import Firestore functions ---
import {
    getFirestore,
    collection,
    query,
    where,
    orderBy, // Sẽ dùng để sắp xếp sau này nếu cần
    onSnapshot, // Để lắng nghe real-time
    addDoc, // Sẽ dùng để thêm dữ liệu
    doc,    // Sẽ dùng để tham chiếu document cụ thể
    updateDoc, // Sẽ dùng để cập nhật
    deleteDoc, // Sẽ dùng để xóa
    writeBatch // Sẽ dùng cho thao tác hàng loạt (vd: empty trash)
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";


// =====================================================================
//  Firebase Configuration & Initialization
// =====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyACnduJi50_PdPHHoaa-rMK1xvzgZJi7uI",
  authDomain: "ghichu-7782.firebaseapp.com",
  projectId: "ghichu-7782",
  storageBucket: "ghichu-7782.firebasestorage.app",
  messagingSenderId: "1082788318638",
  appId: "1:1082788318638:web:ed2b1026ea8a512e58cc3f"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp); // <<<--- Khởi tạo Firestore

// =====================================================================
//  Constants & State Variables
// =====================================================================
// Bỏ các key localStorage không cần nữa
// const NOTES_STORAGE_KEY = 'startNotesData_v2';
// const TEMPLATES_STORAGE_KEY = 'startNoteTemplates';
// const NOTEBOOKS_STORAGE_KEY = 'startNoteNotebooks';
const THEME_NAME_KEY = 'startNotesThemeName';
const ACCENT_COLOR_KEY = 'startNotesAccentColor';
const FONT_FAMILY_KEY = 'startNotesFontFamily';
const FONT_SIZE_SCALE_KEY = 'startNotesFontSizeScale';
const LAST_CUSTOM_THEME_KEY = 'startNotesLastCustomTheme';
const SUGGESTION_BOX_ID = 'tag-suggestion-box';
const MOVE_NOTE_MENU_ID = 'move-note-menu';
const DEBOUNCE_DELAY = 1500;

let notes = [];
let templates = [];
let notebooks = [];
let isViewingArchived = false;
let isViewingTrash = false;
let currentNotebookId = 'all';
let sortableInstance = null;
let activeTagInputElement = null;
let activeMoveMenu = null;
let currentUser = null;

// --- NEW: Biến lưu các hàm unsubscribe của Firestore listeners ---
let unsubscribeNotes = null;
let unsubscribeTemplates = null;
let unsubscribeNotebooks = null;

const DEFAULT_NOTEBOOK_ID = 'all';
// ... (NOTE_COLORS, VALID_THEMES, etc. giữ nguyên) ...
const NOTE_COLORS = [ /* ... */ ];
const VALID_THEMES = [ /* ... */ ];
const DEFAULT_THEME = 'light';
const DEFAULT_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const DEFAULT_FONT_SIZE_SCALE = 1;
const DEFAULT_ACCENT_COLOR = 'default';
const DARK_THEME_NAMES = [ /* ... */ ];

// =====================================================================
//  DOM References
// =====================================================================
// ... (Giữ nguyên tất cả DOM references cũ và Auth references) ...
const quickThemeToggleBtn = document.getElementById('theme-toggle-btn');
const settingsBtn = document.getElementById('settings-btn');
const searchInput = document.getElementById('search-input');
const exportNotesBtn = document.getElementById('export-notes-btn');
const importNotesBtn = document.getElementById('import-notes-btn');
const importFileInput = document.getElementById('import-file-input');
const viewArchiveBtn = document.getElementById('view-archive-btn');
const archiveStatusIndicator = document.getElementById('archive-status-indicator');
const viewTrashBtn = document.getElementById('view-trash-btn');
const trashStatusIndicator = document.getElementById('trash-status-indicator');
const emptyTrashBtn = document.getElementById('empty-trash-btn');
const notebookTabsContainer = document.getElementById('notebook-tabs-container');
const addNotebookTabBtn = document.getElementById('add-notebook-tab-btn');
const addNotePanel = document.getElementById('add-note-panel');
const newNoteTitle = document.getElementById('new-note-title');
const newNoteText = document.getElementById('new-note-text');
const newNoteTags = document.getElementById('new-note-tags');
const templateSelect = document.getElementById('template-select');
const addNoteBtn = document.getElementById('add-note-btn');
const closeAddPanelBtn = document.getElementById('close-add-panel-btn');
const showAddPanelBtn = document.getElementById('show-add-panel-btn');
const notesContainer = document.getElementById('notes-container');
const manageTemplatesBtn = document.getElementById('manage-templates-btn');
const templateModal = document.getElementById('template-modal');
const closeTemplateModalBtn = document.getElementById('close-template-modal-btn');
const templateListContainer = document.getElementById('template-list-container');
const templateListSection = document.getElementById('template-list-section');
const showAddTemplatePanelBtn = document.getElementById('show-add-template-panel-btn');
const templateEditPanel = document.getElementById('template-edit-panel');
const templateEditTitle = document.getElementById('template-edit-title');
const templateEditId = document.getElementById('template-edit-id');
const templateEditName = document.getElementById('template-edit-name');
const templateEditTitleInput = document.getElementById('template-edit-title-input');
const templateEditText = document.getElementById('template-edit-text');
const templateEditTags = document.getElementById('template-edit-tags');
const saveTemplateBtn = document.getElementById('save-template-btn');
const cancelEditTemplateBtn = document.getElementById('cancel-edit-template-btn');
const manageNotebooksBtn = document.getElementById('manage-notebooks-btn');
const notebookModal = document.getElementById('notebook-modal');
const closeNotebookModalBtn = document.getElementById('close-notebook-modal-btn');
const notebookListContainer = document.getElementById('notebook-list-container');
const notebookListSection = document.getElementById('notebook-list-section');
const showAddNotebookPanelBtn = document.getElementById('show-add-notebook-panel-btn');
const notebookEditPanel = document.getElementById('notebook-edit-panel');
const notebookEditTitle = document.getElementById('notebook-edit-title');
const notebookEditId = document.getElementById('notebook-edit-id');
const notebookEditName = document.getElementById('notebook-edit-name');
const saveNotebookBtn = document.getElementById('save-notebook-btn');
const cancelEditNotebookBtn = document.getElementById('cancel-edit-notebook-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsModalBtn = document.getElementById('close-settings-modal-btn');
const themeOptionsContainer = settingsModal.querySelector('.theme-options');
const accentColorOptionsContainer = settingsModal.querySelector('.accent-color-options');
const fontFamilySelect = document.getElementById('font-family-select');
const fontSizeSlider = document.getElementById('font-size-slider');
const fontSizeValueSpan = document.getElementById('font-size-value');
const resetFontSizeBtn = document.getElementById('reset-font-size-btn');
// --- Auth DOM References ---
const authContainer = document.getElementById('auth-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const showSignupBtn = document.getElementById('show-signup-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const googleSigninBtn = document.getElementById('google-signin-btn');
const userInfoDiv = document.getElementById('user-info');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const loginErrorDiv = document.getElementById('login-error');
const signupErrorDiv = document.getElementById('signup-error');

// =====================================================================
//  Utility Functions (Giữ nguyên)
// =====================================================================
/* ... parseTags, debounce, escapeRegExp, formatTimestamp, escapeHTML ... */
const parseTags = (tagString) => { if (!tagString) return []; return tagString.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== ''); };
const debounce = (func, delay) => { let timeoutId; return function(...args) { clearTimeout(timeoutId); timeoutId = setTimeout(() => { func.apply(this, args); }, delay); }; };
const escapeRegExp = (string) => { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
const formatTimestamp = (timestamp) => { if (!timestamp) return ''; return new Date(timestamp).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); }
const escapeHTML = (str) => { if (!str) return ''; const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return str.replace(/[&<>"']/g, m => map[m]); }

// =====================================================================
//  Theme & Appearance Management (Giữ nguyên)
// =====================================================================
/* ... getStoredPreference, applyAllAppearanceSettings, applyTheme, etc. ... */
const getStoredPreference = (key, defaultValue) => { return localStorage.getItem(key) ?? defaultValue; };
const applyAllAppearanceSettings = () => { const savedTheme = getStoredPreference(THEME_NAME_KEY, DEFAULT_THEME); applyTheme(VALID_THEMES.includes(savedTheme) ? savedTheme : DEFAULT_THEME); const savedAccentColor = getStoredPreference(ACCENT_COLOR_KEY, DEFAULT_ACCENT_COLOR); applyAccentColor(savedAccentColor); const savedFontFamily = getStoredPreference(FONT_FAMILY_KEY, DEFAULT_FONT_FAMILY); applyFontFamily(savedFontFamily); const savedFontSizeScale = parseFloat(getStoredPreference(FONT_SIZE_SCALE_KEY, DEFAULT_FONT_SIZE_SCALE.toString())); applyFontSize(isNaN(savedFontSizeScale) ? DEFAULT_FONT_SIZE_SCALE : savedFontSizeScale); };
const applyTheme = (themeName) => { if (!VALID_THEMES.includes(themeName)) { console.warn(`Invalid theme name "${themeName}". Falling back to default.`); themeName = DEFAULT_THEME; } const root = document.documentElement; VALID_THEMES.forEach(theme => document.body.classList.remove(`theme-${theme}`)); document.body.classList.remove('dark-mode', 'light-mode'); if (themeName !== 'light') { document.body.classList.add(`theme-${themeName}`); } const isDark = DARK_THEME_NAMES.includes(themeName); document.body.classList.add(isDark ? 'dark-mode' : 'light-mode'); if (quickThemeToggleBtn) { if (isDark) { quickThemeToggleBtn.innerHTML = '☀️&nbsp;Sáng'; quickThemeToggleBtn.title = 'Chuyển sang chế độ Sáng'; } else { quickThemeToggleBtn.innerHTML = '🌙&nbsp;Tối'; quickThemeToggleBtn.title = 'Chuyển sang chế độ Tối'; } } updateThemeSelectionUI(themeName); const currentAccent = getStoredPreference(ACCENT_COLOR_KEY, DEFAULT_ACCENT_COLOR); applyAccentColor(currentAccent); };
const updateThemeSelectionUI = (selectedTheme) => { if (!themeOptionsContainer) return; themeOptionsContainer.querySelectorAll('.theme-option-btn').forEach(btn => { const isActive = btn.dataset.theme === selectedTheme; btn.classList.toggle('active', isActive); btn.setAttribute('aria-checked', isActive ? 'true' : 'false'); }); };
const applyAccentColor = (colorValue) => { const lightDefaultAccent = '#007bff'; const darkDefaultAccent = '#0d6efd'; const currentTheme = getStoredPreference(THEME_NAME_KEY, DEFAULT_THEME); const isDarkThemeActive = DARK_THEME_NAMES.includes(currentTheme); const actualDefaultColor = isDarkThemeActive ? darkDefaultAccent : lightDefaultAccent; const actualColor = (colorValue === DEFAULT_ACCENT_COLOR || !colorValue.startsWith('#')) ? actualDefaultColor : colorValue; document.documentElement.style.setProperty('--primary-color', actualColor); updateAccentColorSelectionUI(colorValue); };
const updateAccentColorSelectionUI = (selectedColorValue) => { if (!accentColorOptionsContainer) return; accentColorOptionsContainer.querySelectorAll('.accent-swatch').forEach(swatch => { const isSelected = swatch.dataset.color === selectedColorValue; swatch.classList.toggle('selected', isSelected); swatch.setAttribute('aria-checked', isSelected ? 'true' : 'false'); if(swatch.dataset.color === 'default'){ const lightDefaultAccent = '#007bff'; const darkDefaultAccent = '#0d6efd'; const currentTheme = getStoredPreference(THEME_NAME_KEY, DEFAULT_THEME); const isDarkThemeActive = DARK_THEME_NAMES.includes(currentTheme); swatch.style.backgroundColor = isDarkThemeActive ? darkDefaultAccent : lightDefaultAccent; swatch.style.borderColor = isDarkThemeActive ? darkDefaultAccent : lightDefaultAccent; swatch.style.color = '#fff'; swatch.innerHTML = ''; } }); };
const applyFontFamily = (fontFamilyString) => { document.documentElement.style.setProperty('--content-font-family', fontFamilyString); updateFontFamilySelectionUI(fontFamilyString); };
const updateFontFamilySelectionUI = (selectedFontFamily) => { if (fontFamilySelect) { fontFamilySelect.value = selectedFontFamily; } };
const applyFontSize = (scale) => { const clampedScale = Math.max(0.8, Math.min(1.5, scale)); document.documentElement.style.setProperty('--font-size-scale', clampedScale); updateFontSizeUI(clampedScale); };
const updateFontSizeUI = (scale) => { if (fontSizeSlider) { fontSizeSlider.value = scale; } if (fontSizeValueSpan) { fontSizeValueSpan.textContent = `${Math.round(scale * 100)}%`; } };
const quickToggleTheme = () => { const currentTheme = getStoredPreference(THEME_NAME_KEY, DEFAULT_THEME); const lastCustomTheme = getStoredPreference(LAST_CUSTOM_THEME_KEY, null); let targetTheme; const isCurrentDark = DARK_THEME_NAMES.includes(currentTheme); if (isCurrentDark) { if (lastCustomTheme && !DARK_THEME_NAMES.includes(lastCustomTheme)) { targetTheme = lastCustomTheme; } else { targetTheme = 'light'; } } else { targetTheme = 'dark'; } applyTheme(targetTheme); localStorage.setItem(THEME_NAME_KEY, targetTheme); };

// =====================================================================
//  Authentication Functions (Giữ nguyên)
// =====================================================================
/* ... displayAuthError, clearAuthErrors, handleSignUp, handleSignIn, handleGoogleSignIn, handleSignOut ... */
const displayAuthError = (formType, error) => { /* ... */ };
const clearAuthErrors = () => { /* ... */ };
const handleSignUp = (event) => { /* ... */ };
const handleSignIn = (event) => { /* ... */ };
const handleGoogleSignIn = () => { /* ... */ };
const handleSignOut = () => {
    // --- NEW: Hủy các listeners của Firestore trước khi đăng xuất ---
    if (unsubscribeNotes) {
        console.log("Unsubscribing notes listener");
        unsubscribeNotes();
        unsubscribeNotes = null;
    }
    if (unsubscribeTemplates) {
        console.log("Unsubscribing templates listener");
        unsubscribeTemplates();
        unsubscribeTemplates = null;
    }
    if (unsubscribeNotebooks) {
        console.log("Unsubscribing notebooks listener");
        unsubscribeNotebooks();
        unsubscribeNotebooks = null;
    }

    signOut(auth).then(() => {
        console.log('Đăng xuất thành công');
        // onAuthStateChanged sẽ tự động xử lý cập nhật UI và xóa dữ liệu local
    }).catch((error) => {
        console.error('Lỗi đăng xuất:', error);
        alert('Đã xảy ra lỗi khi đăng xuất.');
    });
};

// =====================================================================
//  Data Loading Function (REWRITTEN FOR FIRESTORE)
// =====================================================================
const loadUserDataAndDisplayNotes = () => {
    if (!currentUser) {
        console.log("Người dùng chưa đăng nhập, không tải dữ liệu.");
        updateUIBasedOnAuthState(null); // Đảm bảo UI ở trạng thái đăng xuất
        return;
    }
    console.log(`Bắt đầu tải dữ liệu Firestore cho người dùng: ${currentUser.uid}`);

    // Hủy listeners cũ nếu có (phòng trường hợp gọi lại khi chưa logout hẳn)
    if (unsubscribeNotes) unsubscribeNotes();
    if (unsubscribeTemplates) unsubscribeTemplates();
    if (unsubscribeNotebooks) unsubscribeNotebooks();

    // --- Fetch Notes ---
    const notesColRef = collection(db, "notes");
    const qNotes = query(notesColRef, where("userId", "==", currentUser.uid)); // Lọc theo userId

    unsubscribeNotes = onSnapshot(qNotes, (querySnapshot) => {
        console.log("Nhận snapshot notes mới");
        const fetchedNotes = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Map dữ liệu Firestore về cấu trúc object note quen thuộc
            fetchedNotes.push({
                id: doc.id, // <<< Dùng ID của Firestore document
                title: data.title || '',
                text: data.text || '',
                tags: data.tags || [], // Đảm bảo tags là mảng
                pinned: data.pinned || false,
                // Chuyển đổi Timestamp của Firestore về milliseconds nếu cần
                lastModified: data.lastModified?.toMillis ? data.lastModified.toMillis() : (data.lastModified || Date.now()),
                // id dùng làm creation time nếu không có trường createdAt
                createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.id || Date.now()),
                archived: data.archived || false,
                color: data.color || null,
                deleted: data.deleted || false,
                deletedTimestamp: data.deletedTimestamp?.toMillis ? data.deletedTimestamp.toMillis() : (data.deletedTimestamp || null),
                notebookId: data.notebookId || null,
                userId: data.userId // Giữ lại userId để tham khảo
                // Thêm trường order nếu bạn quản lý thứ tự kéo thả bằng Firestore
                // order: data.order || 0
            });
        });
        notes = fetchedNotes; // Cập nhật mảng notes toàn cục
        console.log("Notes đã được cập nhật:", notes.length);
        displayNotes(searchInput.value); // Hiển thị lại notes với dữ liệu mới
    }, (error) => {
        console.error("Lỗi lắng nghe notes:", error);
        alert("Không thể tải danh sách ghi chú. Vui lòng thử lại.");
        // Có thể xử lý lỗi tốt hơn, ví dụ: hiển thị thông báo lỗi trên UI
    });

    // --- Fetch Templates ---
    const templatesColRef = collection(db, "templates");
    const qTemplates = query(templatesColRef, where("userId", "==", currentUser.uid));

    unsubscribeTemplates = onSnapshot(qTemplates, (querySnapshot) => {
        console.log("Nhận snapshot templates mới");
        const fetchedTemplates = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedTemplates.push({
                id: doc.id,
                name: data.name || `Mẫu ${doc.id}`,
                title: data.title || '',
                text: data.text || '',
                tags: data.tags || [],
                userId: data.userId
            });
        });
        templates = fetchedTemplates; // Cập nhật mảng templates
        console.log("Templates đã được cập nhật:", templates.length);
        populateTemplateDropdown(); // Cập nhật dropdown
    }, (error) => {
        console.error("Lỗi lắng nghe templates:", error);
        // Không cần alert vì ít quan trọng hơn notes
    });

    // --- Fetch Notebooks ---
    const notebooksColRef = collection(db, "notebooks");
    const qNotebooks = query(notebooksColRef, where("userId", "==", currentUser.uid));

    unsubscribeNotebooks = onSnapshot(qNotebooks, (querySnapshot) => {
        console.log("Nhận snapshot notebooks mới");
        const fetchedNotebooks = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedNotebooks.push({
                id: doc.id, // Dùng ID của Firestore
                name: data.name || `Sổ tay ${doc.id}`,
                userId: data.userId
            });
        });
        notebooks = fetchedNotebooks; // Cập nhật mảng notebooks
        console.log("Notebooks đã được cập nhật:", notebooks.length);
        renderNotebookTabs(); // Render lại tabs
        // Không cần gọi displayNotes ở đây vì listener của notes sẽ làm việc đó
    }, (error) => {
        console.error("Lỗi lắng nghe notebooks:", error);
        // Không cần alert
    });

    // Sau khi thiết lập listeners, đảm bảo trạng thái view đúng
    isViewingArchived = false;
    isViewingTrash = false;
    currentNotebookId = DEFAULT_NOTEBOOK_ID;
    // Không cần gọi displayNotes ở đây nữa vì onSnapshot của notes sẽ làm
};

// --- Cập nhật UI dựa trên trạng thái Auth (Thêm logic hủy listener) ---
const updateUIBasedOnAuthState = (user) => {
    clearAuthErrors();
    if (user) {
        currentUser = user;
        if (loginForm) loginForm.classList.add('hidden');
        if (signupForm) signupForm.classList.add('hidden');
        if (userInfoDiv) userInfoDiv.classList.remove('hidden');
        if (userEmailSpan) userEmailSpan.textContent = user.email || user.displayName || 'Người dùng';

        // Tải dữ liệu từ Firestore
        loadUserDataAndDisplayNotes();

    } else {
        currentUser = null;
        // --- Hủy các listeners của Firestore ---
        if (unsubscribeNotes) { console.log("Unsubscribing notes listener on logout"); unsubscribeNotes(); unsubscribeNotes = null; }
        if (unsubscribeTemplates) { console.log("Unsubscribing templates listener on logout"); unsubscribeTemplates(); unsubscribeTemplates = null; }
        if (unsubscribeNotebooks) { console.log("Unsubscribing notebooks listener on logout"); unsubscribeNotebooks(); unsubscribeNotebooks = null; }

        // Reset UI về trạng thái đăng xuất
        if (loginForm) loginForm.classList.remove('hidden');
        if (signupForm) signupForm.classList.add('hidden');
        if (userInfoDiv) userInfoDiv.classList.add('hidden');
        if (userEmailSpan) userEmailSpan.textContent = '';

        notes = []; templates = []; notebooks = [];
        currentNotebookId = 'all'; isViewingArchived = false; isViewingTrash = false;
        searchInput.value = '';

        if (notesContainer) notesContainer.innerHTML = '<p class="empty-state">Vui lòng đăng nhập để xem hoặc tạo ghi chú.</p>';
        renderNotebookTabs();
        populateTemplateDropdown();
        if (sortableInstance) { sortableInstance.destroy(); sortableInstance = null; }
        if (addNotePanel) addNotePanel.classList.add('hidden');

    }
    // Điều khiển nút FAB và các nút header
    const canShowFab = !!user && !(addNotePanel && !addNotePanel.classList.contains('hidden')) && !(notesContainer && notesContainer.querySelector('.note .edit-input'));
    if(showAddPanelBtn) showAddPanelBtn.classList.toggle('hidden', !canShowFab);
    const isLoggedIn = !!user;
    if (exportNotesBtn) exportNotesBtn.disabled = !isLoggedIn;
    if (importNotesBtn) importNotesBtn.disabled = !isLoggedIn; // Tạm thời disable import
    if (manageNotebooksBtn) manageNotebooksBtn.disabled = !isLoggedIn;
    if (manageTemplatesBtn) manageTemplatesBtn.disabled = !isLoggedIn;
    if (viewArchiveBtn) viewArchiveBtn.disabled = !isLoggedIn;
    if (viewTrashBtn) viewTrashBtn.disabled = !isLoggedIn;
};

// =====================================================================
//  Notebook Data Management (!!! CẦN VIẾT LẠI ĐỂ DÙNG FIRESTORE !!!)
// =====================================================================
const saveNotebooks = () => { console.warn("Hàm saveNotebooks chưa được cập nhật cho Firestore!"); };
const loadNotebooks = () => { console.warn("Hàm loadNotebooks không còn sử dụng, thay bằng listener trong loadUserDataAndDisplayNotes"); };
const addOrUpdateNotebook = async () => { // Chuyển sang async
    if (!currentUser) { alert("Vui lòng đăng nhập."); return; }
    const name = notebookEditName.value.trim();
    const id = notebookEditId.value; // Firestore ID là string

    if (!name) { alert("Vui lòng nhập Tên Sổ tay!"); notebookEditName.focus(); return; }
    // Kiểm tra trùng tên (cần query Firestore - phức tạp hơn, tạm bỏ qua hoặc làm sau)
    // const existingNotebook = notebooks.find(nb => nb.name.toLowerCase() === name.toLowerCase() && nb.id !== id);
    // if (existingNotebook) { alert(`Sổ tay với tên "${name}" đã tồn tại.`); return; }

    hideNotebookEditPanel(); // Đóng panel trước khi thực hiện thao tác async
    try {
        if (id) {
            // Cập nhật notebook
            const notebookRef = doc(db, "notebooks", id);
            console.log(`Đang cập nhật notebook: ${id}`);
            await updateDoc(notebookRef, { name: name }); // Chỉ cập nhật tên
            console.log("Cập nhật notebook thành công");
            // Dữ liệu sẽ tự cập nhật trên UI nhờ onSnapshot
        } else {
            // Thêm notebook mới
            console.log("Đang thêm notebook mới");
            const newNotebookData = {
                name: name,
                userId: currentUser.uid // <<<--- Quan trọng: Gắn userId
            };
            const docRef = await addDoc(collection(db, "notebooks"), newNotebookData);
            console.log("Thêm notebook thành công với ID:", docRef.id);
            // Dữ liệu sẽ tự cập nhật trên UI nhờ onSnapshot
        }
        // Không cần gọi renderNotebookList, renderNotebookTabs ở đây nữa
    } catch (error) {
        console.error("Lỗi khi lưu sổ tay:", error);
        alert("Đã xảy ra lỗi khi lưu sổ tay.");
        showNotebookEditPanel(id); // Mở lại panel nếu lỗi
    }
};
const deleteNotebook = async (id) => { // Chuyển sang async
    if (!currentUser) { alert("Vui lòng đăng nhập."); return; }
    const notebookToDelete = notebooks.find(nb => nb.id === id);
    if (!notebookToDelete) { console.error("Không tìm thấy notebook để xóa ID:", id); return; }

    const notebookName = notebookToDelete.name;
    // Đếm số ghi chú thuộc về notebook này (cần query Firestore - tạm bỏ qua)
    // const notesInNotebook = notes.filter(note => note.notebookId === id && !note.deleted && !note.archived).length;
    let confirmMessage = `Bạn chắc chắn muốn xóa sổ tay "${escapeHTML(notebookName)}"?`;
    // if (notesInNotebook > 0) { confirmMessage += `\n\nCẢNH BÁO: Ghi chú trong sổ tay này cần được chuyển sang sổ khác hoặc bỏ trống notebookId (Logic này cần được thêm!)`; }

    if (confirm(confirmMessage)) {
        try {
            // 1. Xóa document của notebook
            console.log(`Đang xóa notebook: ${id}`);
            await deleteDoc(doc(db, "notebooks", id));
            console.log("Xóa notebook thành công.");

            // 2. !!! QUAN TRỌNG: Cập nhật các notes đang thuộc notebook này !!!
            // Đây là thao tác phức tạp hơn, cần query và update batch.
            // Tạm thời bỏ qua, ghi chú sẽ vẫn giữ notebookId cũ (không hợp lệ)
            // Cần query tất cả notes có notebookId === id và userId === currentUser.uid
            // Sau đó dùng writeBatch để update notebookId = null cho các notes đó.
            console.warn(`Cần cập nhật các notes thuộc notebook ${id} thành notebookId=null`);

            // Dữ liệu notebooks list sẽ tự cập nhật nhờ onSnapshot
            // Reset view nếu đang xem notebook vừa xóa
            if (currentNotebookId === id) {
                 currentNotebookId = DEFAULT_NOTEBOOK_ID;
                 displayNotes();
            }
            // Đóng panel edit nếu đang mở notebook này
             if (!notebookEditPanel.classList.contains('hidden') && notebookEditId.value === id) {
                 hideNotebookEditPanel();
            }

        } catch (error) {
            console.error("Lỗi khi xóa sổ tay:", error);
            alert("Đã xảy ra lỗi khi xóa sổ tay.");
        }
    }
};


// =====================================================================
//  Note Data Management (!!! CẦN VIẾT LẠI ĐỂ DÙNG FIRESTORE !!!)
// =====================================================================
const saveNotes = () => { console.warn("Hàm saveNotes không còn sử dụng, thay bằng các lệnh Firestore trực tiếp."); };
const loadNotes = () => { console.warn("Hàm loadNotes không còn sử dụng, thay bằng listener trong loadUserDataAndDisplayNotes"); };
const addNote = async () => { // Chuyển sang async
    if (!currentUser) { alert("Vui lòng đăng nhập để thêm ghi chú."); return; }
    const noteTitle = newNoteTitle.value.trim();
    const noteText = newNoteText.value;
    const tagString = newNoteTags.value;

    if (!noteText.trim() && !noteTitle) {
        alert("Vui lòng nhập Tiêu đề hoặc Nội dung cho ghi chú!");
        newNoteText.focus();
        return;
    }

    hideAddPanel(); // Đóng panel trước khi thao tác async

    const tags = parseTags(tagString);
    const assignedNotebookId = (currentNotebookId !== 'all' && !isViewingArchived && !isViewingTrash)
                                ? currentNotebookId // Firestore ID là string
                                : null;
    const now = Date.now(); // Dùng làm timestamp nếu cần

    const newNoteData = {
        title: noteTitle,
        text: noteText,
        tags: tags,
        pinned: false, // Mặc định không ghim
        archived: false,
        deleted: false,
        color: null,
        notebookId: assignedNotebookId,
        userId: currentUser.uid, // <<<--- Quan trọng: Gắn userId
        createdAt: new Date(), // Timestamp tạo (Firestore tự xử lý tốt)
        lastModified: new Date() // Timestamp sửa đổi
        // Có thể thêm trường 'order' nếu muốn quản lý thứ tự
    };

    try {
        console.log("Đang thêm ghi chú mới vào Firestore");
        const docRef = await addDoc(collection(db, "notes"), newNoteData);
        console.log("Thêm ghi chú thành công với ID:", docRef.id);
        // UI sẽ tự cập nhật nhờ onSnapshot
        // Reset trạng thái view nếu đang xem Archive/Trash
        if (isViewingArchived || isViewingTrash) {
             isViewingArchived = false;
             isViewingTrash = false;
             currentNotebookId = 'all'; // Chuyển về view chính
             // onSnapshot sẽ tự gọi displayNotes()
        }
    } catch (error) {
        console.error("Lỗi khi thêm ghi chú:", error);
        alert("Đã xảy ra lỗi khi thêm ghi chú mới.");
        showAddPanel(); // Mở lại panel nếu lỗi
    }
};

// =====================================================================
//  Template Data Management (!!! CẦN VIẾT LẠI ĐỂ DÙNG FIRESTORE !!!)
// =====================================================================
const saveTemplates = () => { console.warn("Hàm saveTemplates chưa được cập nhật cho Firestore!"); };
const loadTemplates = () => { console.warn("Hàm loadTemplates không còn sử dụng, thay bằng listener trong loadUserDataAndDisplayNotes"); };
const addOrUpdateTemplate = async () => { /* ... Tương tự addOrUpdateNotebook ... */ };
const deleteTemplate = async (id) => { /* ... Tương tự deleteNotebook ... */ };


// =====================================================================
//  Helper Functions & Event Handlers (Cập nhật hàm cần ghi dữ liệu)
// =====================================================================
/* ... hideTagSuggestions, handleClickOutsideSuggestions ... */
const handleNotePin = async (noteId, noteIndex) => { /* ... Cần dùng updateDoc ... */ };
const handleNoteDelete = async (noteId, noteIndex) => { /* ... Cần dùng updateDoc để set deleted=true, deletedTimestamp ... */ };
const handleNoteRestore = async (noteId, noteIndex) => { /* ... Cần dùng updateDoc để set deleted=false ... */ };
const handleNoteDeletePermanent = async (noteId, noteIndex) => { /* ... Cần dùng deleteDoc ... */ };
const handleEmptyTrash = async () => { /* ... Cần query và dùng writeBatch để deleteDoc nhiều notes ... */ };
const handleNoteArchive = async (noteId, noteIndex) => { /* ... Cần dùng updateDoc để set archived=true ... */ };
const handleNoteUnarchive = async (noteId, noteIndex) => { /* ... Cần dùng updateDoc để set archived=false ... */ };
const updateNoteData = async (noteIndex, newData) => { /* ... Cần tìm noteId và dùng updateDoc ... */ return false; /* Tạm thời trả về false */ };
const debouncedAutoSave = debounce(async (noteElement, noteIndex) => { // Chuyển sang async
    if (!currentUser) return;
    const noteId = notes[noteIndex]?.id; // Lấy ID từ note hiện tại (do listener cập nhật)
    if (!noteId) {
        console.error("Không tìm thấy note ID để auto-save");
        return;
    }
    const editTitleInputCheck = noteElement.querySelector('input.edit-title-input');
    /* ... (lấy dữ liệu mới như cũ) ... */
    const newTitle = editTitleInputCheck.value;
    /* ... */
    const newTags = parseTags(newTagString);
    const newColor = selectedColorValue;

    const updateData = {
        title: newTitle,
        text: newText,
        tags: newTags,
        color: newColor,
        lastModified: new Date() // Cập nhật timestamp
    };

    // Chỉ update nếu có thay đổi thực sự (có thể thêm logic so sánh sâu hơn)
    const currentNote = notes[noteIndex];
    if (currentNote && currentNote.title === newTitle && currentNote.text === newText && /* ... so sánh tags và color ... */) {
         console.log("Auto-save: Không có thay đổi.");
         return;
     }


    try {
        console.log(`Auto-saving note: ${noteId}`);
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, updateData);
        console.log(`Auto-save thành công note: ${noteId}`);
        // Không cần thêm class nữa vì UI tự cập nhật
        // noteElement.classList.add('note-autosaved');
        // setTimeout(() => { noteElement?.classList.remove('note-autosaved'); }, 600);
    } catch (error) {
        console.error(`Lỗi auto-save note ${noteId}:`, error);
        // Có thể hiển thị lỗi tinh tế hơn
    }

}, DEBOUNCE_DELAY);
const handleNoteEdit = (noteElement, noteId, noteIndex) => { /* ... Giữ nguyên logic hiển thị form sửa ... */ };
const handleNoteSaveEdit = async (noteElement, noteId, noteIndex) => { // Chuyển sang async
    if (!currentUser) return;
     const noteRef = doc(db, "notes", noteId);
     const editTitleInput = noteElement.querySelector('input.edit-title-input');
     /* ... (lấy dữ liệu mới như cũ) ... */
     const newTitle = editTitleInput.value;
     /* ... */
     const newTags = parseTags(newTagString);
     const newColor = selectedColorValue;

     const updateData = {
         title: newTitle,
         text: newText,
         tags: newTags,
         color: newColor,
         lastModified: new Date()
     };

     try {
         console.log(`Saving manual edit for note: ${noteId}`);
         await updateDoc(noteRef, updateData);
         console.log(`Save edit success for note: ${noteId}`);
         // Không cần render lại note thủ công nữa, onSnapshot sẽ làm
         // Chỉ cần đóng trạng thái edit
         displayNotes(searchInput.value); // Tạm gọi lại displayNotes để đóng edit form
         if (sortableInstance) sortableInstance.option('disabled', false);
         if (addNotePanel.classList.contains('hidden') && currentUser) { // Check current user
             showAddPanelBtn.classList.remove('hidden');
         }
     } catch (error) {
         console.error(`Error saving edit for note ${noteId}:`, error);
         alert("Lỗi khi lưu ghi chú.");
     }
};
/* ... showFullNoteModal ... */

// =====================================================================
//  Note Element Rendering Helper Functions (Giữ nguyên)
// =====================================================================
/* ... applyNoteColor, applyPinnedStatus, createNote...Element, renderNoteElement ... */

// =====================================================================
//  Drag & Drop (Tạm thời vô hiệu hóa hoặc giữ nguyên - Cần làm lại)
// =====================================================================
const handleDragEnd = (evt) => {
    console.warn("Chức năng kéo thả cần được viết lại để cập nhật thứ tự trên Firestore.");
    /* ... (Logic cũ với localStorage - không còn đúng) ... */
};
const initSortable = () => {
    /* ... (Giữ nguyên logic kiểm tra và khởi tạo, nhưng handleDragEnd cần sửa) ... */
};

// =====================================================================
//  Tag Handling (Giữ nguyên)
// =====================================================================
/* ... getAllUniqueTags, showTagSuggestions, handleTagInput, etc. ... */

// =====================================================================
//  Template UI Handlers (Các hàm ghi/xóa cần sửa)
// =====================================================================
/* ... renderTemplateList, showTemplateEditPanel, hideTemplateEditPanel, showTemplateModal, hideTemplateModal, populateTemplateDropdown, applyTemplate ... */

// =====================================================================
//  Notebook UI Handlers (Các hàm ghi/xóa cần sửa)
// =====================================================================
/* ... renderNotebookList, showNotebookEditPanel, hideNotebookEditPanel, showNotebookModal, hideNotebookModal, renderNotebookTabs ... */

// =====================================================================
//  Other Panel/Import/Export (Import/Export cần viết lại)
// =====================================================================
/* ... showAddPanel, hideAddPanel ... */
const exportNotes = () => {
    if (!currentUser) { alert("Vui lòng đăng nhập để xuất ghi chú."); return; }
    console.warn("Chức năng Xuất đang xuất dữ liệu từ biến cục bộ (đã fetch từ Firestore).");
    // Logic xuất giữ nguyên, nhưng dữ liệu `notes`, `templates`, `notebooks` là dữ liệu đã fetch
    /* ... */
};
const importNotes = (file) => {
    if (!currentUser) { alert("Vui lòng đăng nhập để nhập ghi chú."); return; }
    alert("Chức năng Nhập chưa được cập nhật để ghi vào Firestore. Dữ liệu chỉ được load tạm vào trình duyệt.");
    console.error("Chức năng Nhập cần được viết lại hoàn toàn để ghi dữ liệu vào Firestore cho người dùng hiện tại.");
    // Tạm thời không làm gì cả hoặc chỉ đọc file và log ra console
    importFileInput.value = null;
};

// =====================================================================
//  Note Filtering and Sorting Logic (Giữ nguyên)
// =====================================================================
/* ... getFilteredNotes, sortNotes ... */

// =====================================================================
//  Core Display Function (Đã cập nhật)
// =====================================================================
/* ... displayNotes ... */ // (Đã sửa ở trên)

// =====================================================================
//  Modal Handling Functions (handleMoveNote cần sửa)
// =====================================================================
/* ... showSettingsModal, hideSettingsModal, closeMoveNoteMenu, handleOutsideMoveMenuClick, showMoveNoteMenu ... */
const handleMoveNote = async (noteId, targetNotebookId) => { // Chuyển sang async
    if (!currentUser) return;
    const newNotebookId = targetNotebookId === 'none' ? null : targetNotebookId; // Firestore ID là string hoặc null

    // Kiểm tra xem notebookId có thực sự thay đổi không
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex !== -1 && notes[noteIndex].notebookId !== newNotebookId) {
        const noteRef = doc(db, "notes", noteId);
        try {
            console.log(`Moving note ${noteId} to notebook ${newNotebookId}`);
            await updateDoc(noteRef, {
                notebookId: newNotebookId,
                lastModified: new Date()
            });
            console.log("Move note success.");
            // UI tự cập nhật nhờ onSnapshot
        } catch (error) {
            console.error(`Error moving note ${noteId}:`, error);
            alert("Lỗi khi di chuyển ghi chú.");
        }
    } else if (noteIndex === -1) {
         console.error("Không tìm thấy ghi chú để di chuyển:", noteId);
     }
    closeMoveNoteMenu();
};


// =====================================================================
//  Event Listener Setup Functions (Giữ nguyên)
// =====================================================================
/* ... setupThemeAndAppearanceListeners, setupAddNotePanelListeners, etc. ... */
/* ... setupAuthListeners (Đã thêm ở bước trước) ... */
const setupEventListeners = () => { /* ... Gọi tất cả hàm setup ... */ };

// =====================================================================
//  Initial Load Function (Đã cập nhật)
// =====================================================================
/* ... initializeApp ... */ // (Đã sửa ở trên)

// =====================================================================
//  Auth State Listener (Đã cập nhật)
// =====================================================================
/* ... onAuthStateChanged(auth, ...) ... */ // (Đã sửa ở trên)

// =====================================================================
//  Start the application
// =====================================================================
initializeApp();

