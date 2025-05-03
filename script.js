// =====================================================================
//  Firebase SDK Imports (Đảm bảo đã có trong HTML hoặc import nếu cần)
// =====================================================================
// Các hàm này được import trong thẻ <script type="module"> trong HTML
// và gán vào window để script này có thể dùng.
// Nếu script này cũng là module, bạn có thể import trực tiếp ở đây.
// Ví dụ: import { getAuth, ... } from "firebase/auth";

// Lấy các hàm và đối tượng Firebase từ window (do đã gán trong HTML)
const firebaseApp = window.firebaseApp;
const getAuth = window.getAuth;
// Các hàm auth khác sẽ import trực tiếp từ module SDK khi dùng
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js"; // Đảm bảo version khớp với HTML


// =====================================================================
//  Constants & State Variables
// =====================================================================
const NOTES_STORAGE_KEY = 'startNotesData_v2';
const TEMPLATES_STORAGE_KEY = 'startNoteTemplates';
const NOTEBOOKS_STORAGE_KEY = 'startNoteNotebooks';
const THEME_NAME_KEY = 'startNotesThemeName';
const ACCENT_COLOR_KEY = 'startNotesAccentColor';
const FONT_FAMILY_KEY = 'startNotesFontFamily';
const FONT_SIZE_SCALE_KEY = 'startNotesFontSizeScale';
const LAST_CUSTOM_THEME_KEY = 'startNotesLastCustomTheme';
const SUGGESTION_BOX_ID = 'tag-suggestion-box';
const MOVE_NOTE_MENU_ID = 'move-note-menu'; // ID for the move menu
const DEBOUNCE_DELAY = 1500;

let notes = [];
let templates = [];
let notebooks = [];
let isViewingArchived = false;
let isViewingTrash = false;
let currentNotebookId = 'all';
let sortableInstance = null;
let activeTagInputElement = null;
let activeMoveMenu = null; // Track the currently open move menu
let currentUser = null; // <<<--- Biến lưu thông tin người dùng Firebase

const DEFAULT_NOTEBOOK_ID = 'all';

const NOTE_COLORS = [
    { name: 'Default', value: null, hex: 'transparent' },
    { name: 'Yellow', value: 'note-color-yellow', hex: '#fff9c4' },
    { name: 'Blue', value: 'note-color-blue', hex: '#bbdefb' },
    { name: 'Green', value: 'note-color-green', hex: '#c8e6c9' },
    { name: 'Red', value: 'note-color-red', hex: '#ffcdd2' },
    { name: 'Purple', value: 'note-color-purple', hex: '#e1bee7' },
    { name: 'Grey', value: 'note-color-grey', hex: '#e0e0e0' },
];

const VALID_THEMES = [
    'light', 'dark', 'sepia',
    'solarized-light', 'solarized-dark',
    'nord', 'gruvbox-dark', 'gruvbox-light', 'dracula', 'monochrome'
];
const DEFAULT_THEME = 'light';
const DEFAULT_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const DEFAULT_FONT_SIZE_SCALE = 1;
const DEFAULT_ACCENT_COLOR = 'default';
const DARK_THEME_NAMES = [
    'dark', 'solarized-dark',
    'nord', 'gruvbox-dark', 'dracula'
];

// Khởi tạo Firebase Auth
const auth = getAuth(firebaseApp); // <<<--- Lấy đối tượng Auth

// =====================================================================
//  DOM References
// =====================================================================
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

// --- DOM References for Auth ---
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
//  Utility Functions
// =====================================================================
const parseTags = (tagString) => { if (!tagString) return []; return tagString.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== ''); };
const debounce = (func, delay) => { let timeoutId; return function(...args) { clearTimeout(timeoutId); timeoutId = setTimeout(() => { func.apply(this, args); }, delay); }; };
const escapeRegExp = (string) => { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
const formatTimestamp = (timestamp) => { if (!timestamp) return ''; return new Date(timestamp).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); }
const escapeHTML = (str) => { if (!str) return ''; const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return str.replace(/[&<>"']/g, m => map[m]); }

// =====================================================================
//  Theme & Appearance Management
// =====================================================================
// (Giữ nguyên các hàm quản lý theme như cũ)
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
//  Authentication Functions (NEW)
// =====================================================================

const displayAuthError = (formType, error) => {
    const errorDiv = formType === 'login' ? loginErrorDiv : signupErrorDiv;
    console.error(`${formType} Error:`, error.code, error.message);
    // Chuyển đổi mã lỗi Firebase thành thông báo thân thiện hơn (ví dụ)
    let message = 'Đã xảy ra lỗi. Vui lòng thử lại.';
    if (error.code) {
        switch (error.code) {
            case 'auth/invalid-email':
                message = 'Địa chỉ email không hợp lệ.';
                break;
            case 'auth/user-disabled':
                message = 'Tài khoản này đã bị vô hiệu hóa.';
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential': // For newer SDK versions
                 message = 'Email hoặc mật khẩu không đúng.';
                 break;
            case 'auth/email-already-in-use':
                message = 'Email này đã được sử dụng.';
                break;
            case 'auth/weak-password':
                message = 'Mật khẩu quá yếu (cần ít nhất 6 ký tự).';
                break;
            case 'auth/popup-closed-by-user':
                 message = 'Cửa sổ đăng nhập Google đã bị đóng.';
                 // Có thể không hiển thị lỗi này
                 errorDiv.classList.add('hidden');
                 return;
            case 'auth/cancelled-popup-request':
            case 'auth/popup-blocked':
                message = 'Không thể mở cửa sổ đăng nhập Google. Vui lòng cho phép pop-up.';
                break;
            default:
                // Giữ thông báo lỗi chung cho các trường hợp khác
                // message = error.message; // Hoặc có thể ẩn thông báo chi tiết
                break;
        }
    }
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
};

const clearAuthErrors = () => {
    if (loginErrorDiv) {
        loginErrorDiv.classList.add('hidden');
        loginErrorDiv.textContent = '';
    }
    if (signupErrorDiv) {
        signupErrorDiv.classList.add('hidden');
        signupErrorDiv.textContent = '';
    }
};

const handleSignUp = (event) => {
    event.preventDefault(); // Ngăn form submit theo cách truyền thống
    clearAuthErrors();
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    // Thêm kiểm tra mật khẩu trống hoặc độ dài nếu cần
    if (!email || !password) {
         displayAuthError('signup', { code: 'auth/internal-error', message: 'Vui lòng nhập email và mật khẩu.' });
         return;
     }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('Đăng ký thành công:', userCredential.user);
            // onAuthStateChanged sẽ tự động xử lý cập nhật UI
            signupForm.reset(); // Xóa form
            // Có thể ẩn form signup và hiện form login hoặc thông tin user luôn
            signupForm.classList.add('hidden');
            userInfoDiv.classList.remove('hidden'); // Hiển thị thông tin user ngay
        })
        .catch((error) => {
            displayAuthError('signup', error);
        });
};

const handleSignIn = (event) => {
    event.preventDefault();
    clearAuthErrors();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
     if (!email || !password) {
         displayAuthError('login', { code: 'auth/internal-error', message: 'Vui lòng nhập email và mật khẩu.' });
         return;
     }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('Đăng nhập thành công:', userCredential.user);
            // onAuthStateChanged sẽ tự động xử lý cập nhật UI
            loginForm.reset(); // Xóa form
            loginForm.classList.add('hidden'); // Ẩn form login
        })
        .catch((error) => {
            displayAuthError('login', error);
        });
};

const handleGoogleSignIn = () => {
    clearAuthErrors();
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log('Đăng nhập Google thành công:', result.user);
             loginForm.classList.add('hidden'); // Ẩn form login nếu đang hiện
             signupForm.classList.add('hidden'); // Ẩn form signup nếu đang hiện
            // const credential = GoogleAuthProvider.credentialFromResult(result);
            // const token = credential.accessToken; // Có thể dùng nếu cần
        })
        .catch((error) => {
             displayAuthError('login', error); // Hiển thị lỗi trên form login
        });
};


const handleSignOut = () => {
    signOut(auth).then(() => {
        console.log('Đăng xuất thành công');
        // onAuthStateChanged sẽ tự động xử lý cập nhật UI và xóa dữ liệu
    }).catch((error) => {
        console.error('Lỗi đăng xuất:', error);
        alert('Đã xảy ra lỗi khi đăng xuất.');
    });
};

// --- Cập nhật UI dựa trên trạng thái Auth ---
const updateUIBasedOnAuthState = (user) => {
    clearAuthErrors(); // Xóa lỗi cũ khi trạng thái thay đổi
    if (user) {
        // Người dùng đã đăng nhập
        currentUser = user; // Lưu thông tin người dùng hiện tại
        if (loginForm) loginForm.classList.add('hidden');
        if (signupForm) signupForm.classList.add('hidden');
        if (userInfoDiv) userInfoDiv.classList.remove('hidden');
        if (userEmailSpan) userEmailSpan.textContent = user.email || user.displayName || 'Người dùng'; // Hiển thị email hoặc tên

        // === QUAN TRỌNG: Bắt đầu tải/đồng bộ dữ liệu người dùng từ Firebase ===
        // === Chúng ta sẽ thay thế phần này ở bước tích hợp Database ===
        loadUserDataAndDisplayNotes(); // Hàm tạm thời hoặc hàm sẽ gọi Firebase

    } else {
        // Người dùng đã đăng xuất hoặc chưa đăng nhập
        currentUser = null;
        if (loginForm) loginForm.classList.remove('hidden'); // Hiển thị form đăng nhập mặc định
        if (signupForm) signupForm.classList.add('hidden');
        if (userInfoDiv) userInfoDiv.classList.add('hidden');
        if (userEmailSpan) userEmailSpan.textContent = '';

        // === QUAN TRỌNG: Xóa dữ liệu trên màn hình khi đăng xuất ===
        notes = []; // Xóa dữ liệu trong bộ nhớ
        templates = [];
        notebooks = [];
        currentNotebookId = 'all'; // Reset notebook về mặc định
        isViewingArchived = false;
        isViewingTrash = false;
        searchInput.value = ''; // Xóa ô tìm kiếm

        if (notesContainer) {
             notesContainer.innerHTML = '<p class="empty-state">Vui lòng đăng nhập để xem hoặc tạo ghi chú.</p>'; // Hiển thị thông báo
        }
        renderNotebookTabs(); // Render lại tab (chỉ có tab "All")
        populateTemplateDropdown(); // Xóa dropdown template

        if (sortableInstance) { // Hủy kéo thả nếu có
             sortableInstance.destroy();
             sortableInstance = null;
        }
        if (addNotePanel) addNotePanel.classList.add('hidden'); // Ẩn panel thêm note
        if (showAddPanelBtn) showAddPanelBtn.classList.add('hidden'); // Ẩn nút FAB
    }
     // Điều khiển nút FAB (hiện chỉ khi đăng nhập và không ở chế độ sửa)
     const canShowFab = !!user && !(addNotePanel && !addNotePanel.classList.contains('hidden')) && !(notesContainer && notesContainer.querySelector('.note .edit-input'));
     if(showAddPanelBtn) showAddPanelBtn.classList.toggle('hidden', !canShowFab);

     // Điều khiển các nút header khác (Ví dụ: chỉ cho Xuất/Nhập khi đăng nhập)
     const isLoggedIn = !!user;
     if (exportNotesBtn) exportNotesBtn.disabled = !isLoggedIn;
     if (importNotesBtn) importNotesBtn.disabled = !isLoggedIn;
     if (manageNotebooksBtn) manageNotebooksBtn.disabled = !isLoggedIn;
     if (manageTemplatesBtn) manageTemplatesBtn.disabled = !isLoggedIn;
     if (viewArchiveBtn) viewArchiveBtn.disabled = !isLoggedIn;
     if (viewTrashBtn) viewTrashBtn.disabled = !isLoggedIn;

};

// --- Hàm tạm thời để tải dữ liệu (SẼ THAY BẰNG FIREBASE SAU) ---
// Hiện tại nó vẫn đọc từ localStorage để giữ ứng dụng chạy được phần nào
const loadUserDataAndDisplayNotes = () => {
    if (!currentUser) {
        console.log("Người dùng chưa đăng nhập, không tải dữ liệu.");
        updateUIBasedOnAuthState(null); // Đảm bảo UI ở trạng thái đăng xuất
        return;
    }
    console.log(`Tải dữ liệu cho người dùng: ${currentUser.uid}`);
    console.warn("!!! CẢNH BÁO: loadUserDataAndDisplayNotes hiện vẫn đang dùng localStorage. Cần thay thế bằng logic Firebase Database !!!");

    // === PHẦN NÀY SẼ BỊ THAY THẾ HOÀN TOÀN ===
    loadNotes(); // Vẫn đọc localStorage
    loadTemplates(); // Vẫn đọc localStorage
    loadNotebooks(); // Vẫn đọc localStorage
    // =======================================

    isViewingArchived = false;
    isViewingTrash = false;
    currentNotebookId = DEFAULT_NOTEBOOK_ID;
    renderNotebookTabs();
    displayNotes(); // displayNotes bây giờ cần hoạt động đúng khi notes/templates/notebooks được cập nhật
    populateTemplateDropdown();
};


// =====================================================================
//  Notebook Data Management (Cần cập nhật sau)
// =====================================================================
// --- VẪN DÙNG LOCALSTORAGE --- SẼ THAY BẰNG FIREBASE DB ---
const saveNotebooks = () => {
    // !!! Cần thay bằng Firebase Write !!!
    if (!currentUser) return; // Thêm kiểm tra
    try { localStorage.setItem(NOTEBOOKS_STORAGE_KEY + `_${currentUser.uid}`, JSON.stringify(notebooks)); } // Tạm thêm UID vào key
    catch (e) { console.error("Lỗi lưu sổ tay vào localStorage:", e); alert("Đã xảy ra lỗi khi cố gắng lưu danh sách sổ tay."); }
};
const loadNotebooks = () => {
    // !!! Cần thay bằng Firebase Read (với listener) !!!
    if (!currentUser) { notebooks = []; return; } // Thêm kiểm tra
    const storedNotebooks = localStorage.getItem(NOTEBOOKS_STORAGE_KEY + `_${currentUser.uid}`); // Tạm thêm UID vào key
    if (storedNotebooks) { try { notebooks = JSON.parse(storedNotebooks).map(nb => ({ id: nb.id || Date.now(), name: nb.name || `Sổ tay ${nb.id || Date.now()}` })); } catch (e) { console.error("Lỗi đọc dữ liệu sổ tay từ localStorage:", e); notebooks = []; } } else { notebooks = []; }
};
const addOrUpdateNotebook = () => {
    if (!currentUser) { alert("Vui lòng đăng nhập để quản lý sổ tay."); return; } // << CHECK AUTH
    const name = notebookEditName.value.trim(); const id = notebookEditId.value ? parseInt(notebookEditId.value) : null; if (!name) { alert("Vui lòng nhập Tên Sổ tay!"); notebookEditName.focus(); return; } const existingNotebook = notebooks.find(nb => nb.name.toLowerCase() === name.toLowerCase() && nb.id !== id); if (existingNotebook) { alert(`Sổ tay với tên "${name}" đã tồn tại. Vui lòng chọn tên khác.`); notebookEditName.focus(); return; } if (id) { const index = notebooks.findIndex(nb => nb.id === id); if (index !== -1) { notebooks[index].name = name; } else { console.error("Không tìm thấy sổ tay để cập nhật với ID:", id); return; } } else { const newNotebook = { id: Date.now(), name: name }; notebooks.push(newNotebook); } saveNotebooks(); renderNotebookList(); renderNotebookTabs(); hideNotebookEditPanel();
};
const deleteNotebook = (id) => {
    if (!currentUser) { alert("Vui lòng đăng nhập để quản lý sổ tay."); return; } // << CHECK AUTH
    const index = notebooks.findIndex(nb => nb.id === id); if (index !== -1) { const notebookName = notebooks[index].name; const notesInNotebook = notes.filter(note => note.notebookId === id && !note.deleted && !note.archived).length; let confirmMessage = `Bạn chắc chắn muốn xóa sổ tay "${escapeHTML(notebookName)}"?`; if (notesInNotebook > 0) { confirmMessage += `\n\nCẢNH BÁO: Có ${notesInNotebook} ghi chú trong sổ tay này. Việc xóa sổ tay sẽ chuyển các ghi chú này về "Tất cả Ghi chú" (không thuộc sổ tay nào).`; } if (confirm(confirmMessage)) { notebooks.splice(index, 1); saveNotebooks(); let notesUpdated = false; notes.forEach(note => { if (note.notebookId === id) { note.notebookId = null; notesUpdated = true; } }); if (notesUpdated) { saveNotes(); } renderNotebookList(); renderNotebookTabs(); if (currentNotebookId === id) { currentNotebookId = DEFAULT_NOTEBOOK_ID; displayNotes(); } if (!notebookEditPanel.classList.contains('hidden') && parseInt(notebookEditId.value) === id) { hideNotebookEditPanel(); } } } else { console.error("Không tìm thấy sổ tay để xóa với ID:", id); }
};


// =====================================================================
//  Note Data Management (Cần cập nhật sau)
// =====================================================================
// --- VẪN DÙNG LOCALSTORAGE --- SẼ THAY BẰNG FIREBASE DB ---
const saveNotes = () => {
    // !!! Cần thay bằng Firebase Write !!!
    if (!currentUser) return; // Thêm kiểm tra
    try { const notesToSave = notes.map(note => ({ id: note.id, title: note.title || '', text: note.text || '', tags: note.tags || [], pinned: note.pinned || false, lastModified: note.lastModified || note.id, archived: note.archived || false, color: note.color || null, deleted: note.deleted || false, deletedTimestamp: note.deletedTimestamp || null, notebookId: note.notebookId || null })); localStorage.setItem(NOTES_STORAGE_KEY + `_${currentUser.uid}`, JSON.stringify(notesToSave)); } // Tạm thêm UID vào key
    catch (e) { console.error("Lỗi lưu ghi chú vào localStorage:", e); if (e.name === 'QuotaExceededError') { alert("Lỗi: Dung lượng lưu trữ cục bộ đã đầy. Không thể lưu ghi chú."); } else { alert("Đã xảy ra lỗi khi cố gắng lưu ghi chú."); } }
};
const loadNotes = () => {
    // !!! Cần thay bằng Firebase Read (với listener) !!!
     if (!currentUser) { notes = []; return; } // Thêm kiểm tra
    const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY + `_${currentUser.uid}`); // Tạm thêm UID vào key
    if (storedNotes) { try { notes = JSON.parse(storedNotes).map(note => ({ id: note.id, title: note.title || '', text: note.text || '', tags: note.tags || [], pinned: note.pinned || false, lastModified: note.lastModified || note.id, archived: note.archived || false, color: note.color || null, deleted: note.deleted || false, deletedTimestamp: note.deletedTimestamp || null, notebookId: note.notebookId || null })); } catch (e) { console.error("Lỗi đọc dữ liệu ghi chú từ localStorage:", e); notes = []; } } else { notes = []; /* Bỏ qua logic chuyển đổi cũ vì sẽ đọc từ Firebase */ }
};
const addNote = () => {
    if (!currentUser) { alert("Vui lòng đăng nhập để thêm ghi chú."); return; } // << CHECK AUTH
    const noteTitle = newNoteTitle.value.trim(); const noteText = newNoteText.value; const tagString = newNoteTags.value; if (noteText.trim() || noteTitle) { const tags = parseTags(tagString); const now = Date.now(); const assignedNotebookId = (currentNotebookId !== 'all' && !isViewingArchived && !isViewingTrash) ? parseInt(currentNotebookId) : null; const newNote = { /*userId: currentUser.uid,*/ // <<<--- SẼ THÊM KHI DÙNG FIREBASE DB
        id: now, title: noteTitle, text: noteText, tags: tags, pinned: false, lastModified: now, archived: false, color: null, deleted: false, deletedTimestamp: null, notebookId: assignedNotebookId }; notes.unshift(newNote); saveNotes(); if (isViewingArchived || isViewingTrash) { isViewingArchived = false; isViewingTrash = false; searchInput.value = ''; } renderNotebookTabs(); displayNotes(searchInput.value); hideAddPanel(); } else { alert("Vui lòng nhập Tiêu đề hoặc Nội dung cho ghi chú!"); newNoteText.focus(); }
};


// =====================================================================
//  Template Data Management (Cần cập nhật sau)
// =====================================================================
// --- VẪN DÙNG LOCALSTORAGE --- SẼ THAY BẰNG FIREBASE DB ---
const saveTemplates = () => {
     // !!! Cần thay bằng Firebase Write !!!
     if (!currentUser) return; // Thêm kiểm tra
    try { localStorage.setItem(TEMPLATES_STORAGE_KEY + `_${currentUser.uid}`, JSON.stringify(templates)); } // Tạm thêm UID vào key
    catch (e) { console.error("Lỗi lưu mẫu vào localStorage:", e); alert("Đã xảy ra lỗi khi cố gắng lưu các mẫu ghi chú."); }
};
const loadTemplates = () => {
    // !!! Cần thay bằng Firebase Read (với listener) !!!
    if (!currentUser) { templates = []; return; } // Thêm kiểm tra
    const storedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY + `_${currentUser.uid}`); // Tạm thêm UID vào key
    if (storedTemplates) { try { templates = JSON.parse(storedTemplates).map(t => ({ id: t.id || Date.now(), name: t.name || `Mẫu ${t.id || Date.now()}`, title: t.title || '', text: t.text || '', tags: Array.isArray(t.tags) ? t.tags.map(String).filter(tag => tag.trim() !== '') : [], })); } catch (e) { console.error("Lỗi đọc dữ liệu mẫu từ localStorage:", e); templates = []; } } else { templates = []; }
};
const addOrUpdateTemplate = () => {
    if (!currentUser) { alert("Vui lòng đăng nhập để quản lý mẫu."); return; } // << CHECK AUTH
    const name = templateEditName.value.trim(); const title = templateEditTitleInput.value.trim(); const text = templateEditText.value; const tags = parseTags(templateEditTags.value); const id = templateEditId.value ? parseInt(templateEditId.value) : null; if (!name) { alert("Vui lòng nhập Tên Mẫu!"); templateEditName.focus(); return; } if (id) { const index = templates.findIndex(t => t.id === id); if (index !== -1) { templates[index] = { ...templates[index], name, title, text, tags }; } else { console.error("Không tìm thấy mẫu để cập nhật với ID:", id); return; } } else { const newTemplate = { id: Date.now(), name, title, text, tags }; templates.push(newTemplate); } saveTemplates(); renderTemplateList(); populateTemplateDropdown(); hideTemplateEditPanel();
};
const deleteTemplate = (id) => {
    if (!currentUser) { alert("Vui lòng đăng nhập để quản lý mẫu."); return; } // << CHECK AUTH
    const index = templates.findIndex(t => t.id === id); if (index !== -1) { const templateName = templates[index].name; if (confirm(`Bạn chắc chắn muốn xóa mẫu "${escapeHTML(templateName)}"?`)) { templates.splice(index, 1); saveTemplates(); renderTemplateList(); populateTemplateDropdown(); if (!templateEditPanel.classList.contains('hidden') && parseInt(templateEditId.value) === id) { hideTemplateEditPanel(); } } } else { console.error("Không tìm thấy mẫu để xóa với ID:", id); }
};

// =====================================================================
//  Helper Functions & Event Handlers (Cập nhật các hàm cần check Auth)
// =====================================================================
const hideTagSuggestions = () => { /* ... (Giữ nguyên) ... */ };
const handleClickOutsideSuggestions = (event) => { /* ... (Giữ nguyên) ... */ };
const handleNotePin = (noteId, noteIndex) => {
    if (!currentUser) return; // << CHECK AUTH
    if (notes[noteIndex]) { notes[noteIndex].pinned = !notes[noteIndex].pinned; notes[noteIndex].lastModified = Date.now(); saveNotes(); displayNotes(searchInput.value); }
};
const handleNoteDelete = (noteId, noteIndex) => {
    if (!currentUser) return; // << CHECK AUTH
    if (notes[noteIndex]) { if (confirm('Bạn chắc chắn muốn chuyển ghi chú này vào thùng rác?')) { notes[noteIndex].deleted = true; notes[noteIndex].deletedTimestamp = Date.now(); notes[noteIndex].pinned = false; notes[noteIndex].archived = false; saveNotes(); displayNotes(searchInput.value); } }
};
const handleNoteRestore = (noteId, noteIndex) => {
    if (!currentUser) return; // << CHECK AUTH
    if (notes[noteIndex]) { notes[noteIndex].deleted = false; notes[noteIndex].deletedTimestamp = null; notes[noteIndex].lastModified = Date.now(); saveNotes(); displayNotes(searchInput.value); }
};
const handleNoteDeletePermanent = (noteId, noteIndex) => {
    if (!currentUser) return; // << CHECK AUTH
    if (notes[noteIndex]) { const noteTitle = notes[noteIndex].title || 'Ghi chú không tiêu đề'; if (confirm(`Bạn chắc chắn muốn xóa vĩnh viễn "${escapeHTML(noteTitle)}"? Hành động này không thể hoàn tác.`)) { notes.splice(noteIndex, 1); saveNotes(); displayNotes(searchInput.value); } }
};
const handleEmptyTrash = () => {
    if (!currentUser) return; // << CHECK AUTH
    const trashNotesCount = notes.filter(note => note.deleted).length; if (trashNotesCount === 0) { alert("Thùng rác đang trống."); return; } if (confirm(`Bạn chắc chắn muốn xóa vĩnh viễn ${trashNotesCount} ghi chú trong thùng rác? Hành động này không thể hoàn tác.`)) { notes = notes.filter(note => !note.deleted); saveNotes(); displayNotes(searchInput.value); }
};
const handleNoteArchive = (noteId, noteIndex) => {
    if (!currentUser) return; // << CHECK AUTH
    if (notes[noteIndex]) { notes[noteIndex].archived = true; notes[noteIndex].pinned = false; notes[noteIndex].lastModified = Date.now(); saveNotes(); displayNotes(searchInput.value); }
};
const handleNoteUnarchive = (noteId, noteIndex) => {
    if (!currentUser) return; // << CHECK AUTH
    if (notes[noteIndex]) { notes[noteIndex].archived = false; notes[noteIndex].lastModified = Date.now(); saveNotes(); displayNotes(searchInput.value); }
};
const updateNoteData = (noteIndex, newData) => {
    // Hàm này được gọi từ auto-save và save-edit, cần check auth ở hàm gọi nó
    if (noteIndex < 0 || noteIndex >= notes.length) return false;
    const note = notes[noteIndex];
    if (!note) return false;
    const { title, text, tags, color, notebookId } = newData;
    let changed = false;
    const cleanTitle = title?.trim() ?? '';
    const cleanText = text ?? '';
    const cleanColor = (color === '' || color === null || color === 'null' || color === 'default') ? null : color;
    const cleanTags = Array.isArray(tags) ? tags.map(t => t.trim().toLowerCase()).filter(t => t) : [];
    const cleanNotebookId = (notebookId === 'none' || notebookId === null || typeof notebookId === 'undefined') ? null : parseInt(notebookId);
    if (note.title !== cleanTitle) { note.title = cleanTitle; changed = true; }
    if (note.text !== cleanText) { note.text = cleanText; changed = true; }
    if (note.color !== cleanColor) { note.color = cleanColor; changed = true; }
    if (newData.hasOwnProperty('notebookId') && note.notebookId !== cleanNotebookId) { note.notebookId = cleanNotebookId; changed = true; }
    const currentTags = note.tags || [];
    const tagsChanged = !(currentTags.length === cleanTags.length && currentTags.slice().sort().every((value, index) => value === cleanTags.slice().sort()[index]));
    if (tagsChanged) { note.tags = cleanTags; changed = true; }
    if (changed) { note.lastModified = Date.now(); saveNotes(); return true; } // Vẫn save vào localStorage
    return false;
};
const debouncedAutoSave = debounce((noteElement, noteIndex) => {
    if (!currentUser) return; // << CHECK AUTH trước khi lưu
    const editTitleInputCheck = noteElement.querySelector('input.edit-title-input'); const editInputCheck = noteElement.querySelector('textarea.edit-input'); const editTagsInputCheck = noteElement.querySelector('input.edit-tags-input'); if (!editTitleInputCheck || !editInputCheck || !editTagsInputCheck || !noteElement.isConnected) { return; } const newTitle = editTitleInputCheck.value; const newText = editInputCheck.value; const newTagString = editTagsInputCheck.value; const newTags = parseTags(newTagString); const selectedColorValue = noteElement.dataset.selectedColor ?? notes[noteIndex]?.color; const newColor = selectedColorValue; const wasPreviouslyEmpty = !notes[noteIndex]?.title?.trim() && !notes[noteIndex]?.text?.trim(); const isNowEmpty = !newTitle.trim() && !newText.trim(); if (!wasPreviouslyEmpty && isNowEmpty) { return; } const saved = updateNoteData(noteIndex, { title: newTitle, text: newText, tags: newTags, color: newColor }); if (saved) { noteElement.classList.add('note-autosaved'); setTimeout(() => { noteElement?.classList.remove('note-autosaved'); }, 600); }
}, DEBOUNCE_DELAY);
const handleNoteEdit = (noteElement, noteId, noteIndex) => {
    if (!currentUser) return; // << CHECK AUTH
    if (isViewingArchived || isViewingTrash) return;
    // ... (Phần còn lại của hàm handleNoteEdit giữ nguyên) ...
    const currentlyEditing = notesContainer.querySelector('.note .edit-input'); if (currentlyEditing && currentlyEditing.closest('.note') !== noteElement) { alert("Vui lòng Lưu hoặc Hủy thay đổi ở ghi chú đang sửa trước khi sửa ghi chú khác."); currentlyEditing.closest('.note').querySelector('textarea.edit-input')?.focus(); return; } hideTagSuggestions(); if (sortableInstance) sortableInstance.option('disabled', true); showAddPanelBtn.classList.add('hidden'); const noteData = notes[noteIndex]; if (!noteData) return; const actionsElementOriginal = noteElement.querySelector('.note-actions'); let originalActionsHTML = ''; if (actionsElementOriginal) { originalActionsHTML = Array.from(actionsElementOriginal.children).filter(btn => !btn.classList.contains('save-edit-btn')).map(btn => btn.outerHTML).join(''); } const editTitleInput = document.createElement('input'); editTitleInput.type = 'text'; editTitleInput.classList.add('edit-title-input'); editTitleInput.placeholder = 'Tiêu đề...'; editTitleInput.value = noteData.title || ''; const editInput = document.createElement('textarea'); editInput.classList.add('edit-input'); editInput.value = noteData.text; editInput.rows = 5; const editTagsInput = document.createElement('input'); editTagsInput.type = 'text'; editTagsInput.classList.add('edit-tags-input'); editTagsInput.placeholder = 'Tags (cách nhau bằng dấu phẩy)...'; editTagsInput.value = (noteData.tags || []).join(', '); editTagsInput.autocomplete = 'off'; const colorSelectorContainer = document.createElement('div'); colorSelectorContainer.classList.add('color-selector-container'); colorSelectorContainer.setAttribute('role', 'radiogroup'); colorSelectorContainer.setAttribute('aria-label', 'Chọn màu ghi chú'); noteElement.dataset.selectedColor = noteData.color || ''; NOTE_COLORS.forEach(color => { const swatchBtn = document.createElement('button'); swatchBtn.type = 'button'; swatchBtn.classList.add('color-swatch-btn'); swatchBtn.dataset.colorValue = color.value || ''; swatchBtn.title = color.name; swatchBtn.setAttribute('role', 'radio'); const isCurrentColor = (noteData.color === color.value) || (!noteData.color && !color.value); swatchBtn.setAttribute('aria-checked', isCurrentColor ? 'true' : 'false'); if (isCurrentColor) swatchBtn.classList.add('selected'); if (color.value) { swatchBtn.style.backgroundColor = color.hex; } else { swatchBtn.classList.add('default-color-swatch'); swatchBtn.innerHTML = '&#x2715;'; swatchBtn.setAttribute('aria-label', 'Màu mặc định'); } swatchBtn.addEventListener('click', () => { const selectedValue = swatchBtn.dataset.colorValue; noteElement.dataset.selectedColor = selectedValue; colorSelectorContainer.querySelectorAll('.color-swatch-btn').forEach(btn => { const isSelected = btn === swatchBtn; btn.classList.toggle('selected', isSelected); btn.setAttribute('aria-checked', isSelected ? 'true' : 'false'); }); applyNoteColor(noteElement, { ...noteData, color: selectedValue }); debouncedAutoSave(noteElement, noteIndex); }); colorSelectorContainer.appendChild(swatchBtn); }); const saveBtn = document.createElement('button'); saveBtn.classList.add('save-edit-btn', 'modal-button', 'primary'); saveBtn.textContent = 'Lưu'; saveBtn.title = 'Lưu thay đổi (Ctrl+S)'; const bookmarkIcon = noteElement.querySelector('.pinned-bookmark-icon'); noteElement.innerHTML = ''; if (bookmarkIcon) { noteElement.appendChild(bookmarkIcon); bookmarkIcon.style.display = 'inline-block'; } noteElement.appendChild(editTitleInput); noteElement.appendChild(editInput); noteElement.appendChild(editTagsInput); noteElement.appendChild(colorSelectorContainer); const editActionsContainer = document.createElement('div'); editActionsContainer.classList.add('note-actions'); editActionsContainer.innerHTML = originalActionsHTML; editActionsContainer.appendChild(saveBtn); noteElement.appendChild(editActionsContainer); const triggerAutoSave = () => debouncedAutoSave(noteElement, noteIndex); editTitleInput.addEventListener('input', triggerAutoSave); editInput.addEventListener('input', triggerAutoSave); editTagsInput.addEventListener('input', (event) => { handleTagInput(event); triggerAutoSave(); }); editTagsInput.addEventListener('blur', handleTagInputBlur, true); editTagsInput.addEventListener('keydown', handleTagInputKeydown); editTitleInput.focus(); editTitleInput.setSelectionRange(editTitleInput.value.length, editTitleInput.value.length);
};
const handleNoteSaveEdit = (noteElement, noteId, noteIndex) => {
    if (!currentUser) return; // << CHECK AUTH
    // ... (Phần còn lại của hàm handleNoteSaveEdit giữ nguyên, nó gọi updateNoteData đã check auth ngầm) ...
    const editTitleInput = noteElement.querySelector('input.edit-title-input'); const editInput = noteElement.querySelector('textarea.edit-input'); const editTagsInput = noteElement.querySelector('input.edit-tags-input'); if (!editTitleInput || !editInput || !editTagsInput) { console.error("Lỗi lưu: Không tìm thấy các thành phần sửa ghi chú."); displayNotes(searchInput.value); return; } const newTitle = editTitleInput.value; const newText = editInput.value; const newTagString = editTagsInput.value; const newTags = parseTags(newTagString); const selectedColorValue = noteElement.dataset.selectedColor ?? notes[noteIndex]?.color; const newColor = selectedColorValue; const wasInitiallyEmpty = !notes[noteIndex]?.title?.trim() && !notes[noteIndex]?.text?.trim(); const isNowEmpty = !newTitle.trim() && !newText.trim(); if (!wasInitiallyEmpty && isNowEmpty) { if (!confirm("Ghi chú gần như trống. Bạn vẫn muốn lưu?")) { return; } } updateNoteData(noteIndex, { title: newTitle, text: newText, tags: newTags, color: newColor }); const updatedNoteData = notes[noteIndex]; const bookmarkIcon = noteElement.querySelector('.pinned-bookmark-icon'); noteElement.innerHTML = ''; if (bookmarkIcon) noteElement.appendChild(bookmarkIcon); applyNoteColor(noteElement, updatedNoteData); applyPinnedStatus(noteElement, updatedNoteData, isViewingArchived, isViewingTrash); const titleEl = createNoteTitleElement(updatedNoteData, searchInput.value); if(titleEl) noteElement.appendChild(titleEl); const contentEl = createNoteContentElement(updatedNoteData, searchInput.value, noteElement); if(contentEl) noteElement.appendChild(contentEl); const tagsEl = createNoteTagsElement(updatedNoteData); if(tagsEl) noteElement.appendChild(tagsEl); const timestampEl = createNoteTimestampElement(updatedNoteData); if(timestampEl) noteElement.appendChild(timestampEl); const actionsEl = createNoteActionsElement(updatedNoteData); if(actionsEl) noteElement.appendChild(actionsEl); delete noteElement.dataset.selectedColor; hideTagSuggestions(); if (sortableInstance) sortableInstance.option('disabled', false); if (addNotePanel.classList.contains('hidden')) showAddPanelBtn.classList.remove('hidden'); noteElement.classList.add('note-saved-flash'); setTimeout(() => { noteElement?.classList.remove('note-saved-flash'); }, 600);
};
const showFullNoteModal = (title, noteText) => { /* ... (Giữ nguyên) ... */ };

// =====================================================================
//  Note Element Rendering Helper Functions (Giữ nguyên)
// =====================================================================
function applyNoteColor(noteElement, note) { /* ... */ }
function applyPinnedStatus(noteElement, note, isViewingArchived, isViewingTrash) { /* ... */ }
function createNoteTitleElement(note, filter) { /* ... */ }
function createNoteContentElement(note, filter, noteElementForOverflowCheck) { /* ... */ }
function createNoteTagsElement(note) { /* ... */ }
function createNoteTimestampElement(note) { /* ... */ }
function createMainViewNoteActions(note) { /* ... */ }
function createArchiveViewNoteActions(note) { /* ... */ }
function createTrashViewNoteActions(note) { /* ... */ }
function createNoteActionsElement(note) { /* ... */ }
const renderNoteElement = (note) => { /* ... (Giữ nguyên) ... */ };


// =====================================================================
//  Drag & Drop (Cần cập nhật sau)
// =====================================================================
const handleDragEnd = (evt) => {
     if (!currentUser) return; // << CHECK AUTH
     // !!! Logic sắp xếp này cần được làm lại hoàn toàn khi dùng Firebase !!!
     // !!! Vì thứ tự sẽ được quản lý bởi server hoặc bằng một trường 'order' !!!
     console.warn("Chức năng kéo thả hiện tại hoạt động trên dữ liệu localStorage và sẽ cần làm lại cho Firebase.");
    if (isViewingArchived || isViewingTrash) return; const newOrderIds = Array.from(notesContainer.children) .map(el => el.classList.contains('note') ? parseInt(el.dataset.id) : null) .filter(id => id !== null); const currentViewNotes = notes.filter(note => !note.deleted && !note.archived && (currentNotebookId === 'all' || note.notebookId === parseInt(currentNotebookId)) ); const currentViewNoteMap = new Map(currentViewNotes.map(note => [note.id, note])); const reorderedCurrentViewNotes = newOrderIds .map(id => currentViewNoteMap.get(id)) .filter(Boolean); const otherNotes = notes.filter(note => note.deleted || note.archived || (currentNotebookId !== 'all' && note.notebookId !== parseInt(currentNotebookId)) ); notes = [...reorderedCurrentViewNotes, ...otherNotes]; saveNotes(); // Lưu thứ tự mới (vẫn vào localStorage)
};
const initSortable = () => {
    if (sortableInstance) { sortableInstance.destroy(); sortableInstance = null; }
    // Chỉ bật kéo thả khi đăng nhập và ở view chính
    const canInitSortable = currentUser && typeof Sortable === 'function' && notesContainer && notesContainer.children.length > 0 && !notesContainer.querySelector('.empty-state') && !isViewingArchived && !isViewingTrash;
    if (canInitSortable) { sortableInstance = new Sortable(notesContainer, { animation: 150, handle: '.note', filter: 'input, textarea, button, .tag-badge, .note-content a, .read-more-btn, .color-swatch-btn', preventOnFilter: true, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag', onEnd: handleDragEnd, delay: 50, delayOnTouchOnly: true }); } else if (typeof Sortable !== 'function' && !isViewingArchived && !isViewingTrash && notes.some(n => !n.archived && !n.deleted)) { console.warn("Thư viện Sortable.js chưa được tải."); }
};


// =====================================================================
//  Tag Handling (Giữ nguyên)
// =====================================================================
const getAllUniqueTags = () => { /* ... */ };
const showTagSuggestions = (inputElement, currentTagFragment, suggestions) => { /* ... */ };
const handleTagInput = (event) => { /* ... */ };
const handleTagInputBlur = (event) => { /* ... */ };
const handleTagInputKeydown = (event) => { /* ... */ };

// =====================================================================
//  Template UI Handlers (Cần check Auth)
// =====================================================================
const renderTemplateList = () => { /* ... (Giữ nguyên - chỉ hiển thị) ... */ };
const showTemplateEditPanel = (templateId = null) => {
    if (!currentUser) { alert("Vui lòng đăng nhập."); return; } // << CHECK AUTH
    /* ... (Phần còn lại giữ nguyên) ... */
};
const hideTemplateEditPanel = () => { /* ... (Giữ nguyên) ... */ };
const showTemplateModal = () => {
    if (!currentUser) { alert("Vui lòng đăng nhập để quản lý mẫu."); return; } // << CHECK AUTH
     renderTemplateList(); hideTemplateEditPanel(); templateModal.classList.add('visible'); templateModal.classList.remove('hidden'); showAddTemplatePanelBtn.focus();
};
const hideTemplateModal = () => { /* ... (Giữ nguyên) ... */ };
const populateTemplateDropdown = () => { /* ... (Giữ nguyên - chỉ hiển thị) ... */ };
const applyTemplate = () => {
     if (!currentUser) return; // << CHECK AUTH (không cần alert vì chỉ apply vào form)
    /* ... (Phần còn lại giữ nguyên) ... */
};

// =====================================================================
//  Notebook UI Handlers (Cần check Auth)
// =====================================================================
const renderNotebookList = () => { /* ... (Giữ nguyên - chỉ hiển thị) ... */ };
const showNotebookEditPanel = (notebookId = null) => {
    if (!currentUser) { alert("Vui lòng đăng nhập."); return; } // << CHECK AUTH
    /* ... (Phần còn lại giữ nguyên) ... */
};
const hideNotebookEditPanel = () => { /* ... (Giữ nguyên) ... */ };
const showNotebookModal = () => {
    if (!currentUser) { alert("Vui lòng đăng nhập để quản lý sổ tay."); return; } // << CHECK AUTH
     renderNotebookList(); hideNotebookEditPanel(); notebookModal.classList.add('visible'); notebookModal.classList.remove('hidden'); showAddNotebookPanelBtn.focus();
};
const hideNotebookModal = () => { /* ... (Giữ nguyên) ... */ };
const renderNotebookTabs = () => { /* ... (Giữ nguyên - chỉ hiển thị) ... */ };

// =====================================================================
//  Other Panel/Import/Export (Cần check Auth)
// =====================================================================
const showAddPanel = () => {
    if (!currentUser) { alert("Vui lòng đăng nhập để thêm ghi chú."); return; } // << CHECK AUTH
    const currentlyEditing = notesContainer.querySelector('.note .edit-input'); if (currentlyEditing) { alert("Vui lòng Lưu hoặc Hủy thay đổi ở ghi chú đang sửa trước khi thêm ghi chú mới."); currentlyEditing.closest('.note').querySelector('textarea.edit-input')?.focus(); return; } hideTagSuggestions(); addNotePanel.classList.remove('hidden'); showAddPanelBtn.classList.add('hidden'); templateSelect.value = ""; newNoteTitle.focus();
};
const hideAddPanel = () => { /* ... (Giữ nguyên) ... */ };
const exportNotes = () => {
    if (!currentUser) { alert("Vui lòng đăng nhập để xuất ghi chú."); return; } // << CHECK AUTH
    // !!! Dữ liệu xuất ra vẫn là từ biến notes/templates/notebooks hiện tại (đang là localStorage) !!!
    if (notes.length === 0 && templates.length === 0 && notebooks.length === 0) { alert("Không có ghi chú, mẫu, hoặc sổ tay nào để xuất."); return; } try { const dataToExport = { notes: notes.map(note => ({ /*...*/ })), templates: templates.map(template => ({ /*...*/ })), notebooks: notebooks.map(notebook => ({ /*...*/ })) }; const jsonData = JSON.stringify(dataToExport, null, 2); const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_'); a.download = `start-notes-backup-${timestamp}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } catch (error) { console.error("Lỗi xuất dữ liệu:", error); alert("Đã xảy ra lỗi khi xuất dữ liệu."); }
};
const importNotes = (file) => {
     if (!currentUser) { alert("Vui lòng đăng nhập để nhập ghi chú."); return; } // << CHECK AUTH
     // !!! Việc nhập sẽ ghi đè vào biến notes/templates/notebooks và LƯU VÀO LOCALSTORAGE TẠM THỜI !!!
    if (!file) { alert("Vui lòng chọn một file JSON hợp lệ."); return; } if (!confirm("CẢNH BÁO:\nThao tác này sẽ THAY THẾ TOÀN BỘ ghi chú, mẫu và sổ tay hiện tại trên trình duyệt này bằng nội dung từ file.\nDữ liệu cũ trên trình duyệt này sẽ bị mất (Dữ liệu trên cloud nếu có sẽ không bị ảnh hưởng trực tiếp bởi bước này).\n\nBạn chắc chắn muốn tiếp tục?")) { importFileInput.value = null; return; } const reader = new FileReader(); reader.onload = (event) => { let importedNotesCount = 0; let importedTemplatesCount = 0; let importedNotebooksCount = 0; try { const importedData = JSON.parse(event.target.result); if (typeof importedData !== 'object' || importedData === null) throw new Error("Dữ liệu trong file không phải là một đối tượng JSON."); let tempNotes = []; let tempTemplates = []; let tempNotebooks = []; if (importedData.notebooks && Array.isArray(importedData.notebooks)) { /* ... validation ... */ } const validNotebookIds = new Set(tempNotebooks.map(nb => nb.id)); if (importedData.notes && Array.isArray(importedData.notes)) { /* ... validation ... */ } if (importedData.templates && Array.isArray(importedData.templates)) { /* ... validation ... */ } if (importedNotesCount === 0 && importedTemplatesCount === 0 && importedNotebooksCount === 0 && Array.isArray(importedData)) { /* ... import old format ... */ } else if (importedNotesCount === 0 && importedTemplatesCount === 0 && importedNotebooksCount === 0) { throw new Error("File JSON không chứa key 'notes', 'templates', hoặc 'notebooks' hợp lệ, hoặc không phải là mảng dữ liệu cũ."); } notes = tempNotes; templates = tempTemplates; notebooks = tempNotebooks; saveNotes(); saveTemplates(); saveNotebooks(); isViewingArchived = false; isViewingTrash = false; currentNotebookId = DEFAULT_NOTEBOOK_ID; searchInput.value = ''; renderNotebookTabs(); displayNotes(); populateTemplateDropdown(); alert(`Đã nhập thành công ${importedNotesCount} ghi chú, ${importedTemplatesCount} mẫu, và ${importedNotebooksCount} sổ tay vào trình duyệt! (Cần đồng bộ lên cloud nếu muốn)`); } catch (error) { console.error("Lỗi nhập file:", error); alert(`Lỗi nhập file: ${error.message}`); } finally { importFileInput.value = null; } }; reader.onerror = (event) => { console.error("Lỗi đọc file:", event.target.error); alert("Không thể đọc được file đã chọn."); importFileInput.value = null; }; reader.readAsText(file);
};

// =====================================================================
//  Note Filtering and Sorting Logic (Giữ nguyên)
// =====================================================================
const getFilteredNotes = (allNotes, filter) => { /* ... */ };
const sortNotes = (filteredNotes) => { /* ... */ };

// =====================================================================
//  Core Display Function (Điều chỉnh để xử lý trạng thái đăng xuất)
// =====================================================================
const displayNotes = (filter = '') => {
    hideTagSuggestions();
    const scrollY = window.scrollY;
    if (!notesContainer) return; // Thêm kiểm tra phòng lỗi
    notesContainer.innerHTML = ''; // Xóa nội dung cũ

    // Nếu chưa đăng nhập, hiển thị thông báo và dừng
    if (!currentUser && !isViewingArchived && !isViewingTrash) { // Chỉ áp dụng cho view chính
         notesContainer.innerHTML = `<p class="empty-state">Vui lòng đăng nhập để xem hoặc tạo ghi chú.</p>`;
         // Reset các nút header liên quan
         if(viewArchiveBtn) viewArchiveBtn.classList.remove('viewing-archive');
         if(viewTrashBtn) viewTrashBtn.classList.remove('viewing-trash');
         if(archiveStatusIndicator) archiveStatusIndicator.classList.add('hidden');
         if(trashStatusIndicator) trashStatusIndicator.classList.add('hidden');
         if(emptyTrashBtn) emptyTrashBtn.classList.add('hidden');
         renderNotebookTabs(); // Có thể chỉ hiển thị tab "All" trống
         return; // Dừng hàm ở đây
    }

    // --- Phần còn lại giữ nguyên logic lọc và sắp xếp ---
    const filteredNotes = getFilteredNotes(notes, filter.toLowerCase().trim());
    const notesToDisplay = sortNotes(filteredNotes);

    if(viewArchiveBtn) viewArchiveBtn.classList.remove('viewing-archive');
    if(viewTrashBtn) viewTrashBtn.classList.remove('viewing-trash');
    if(viewArchiveBtn) viewArchiveBtn.textContent = 'Xem Lưu trữ';
    if(viewTrashBtn) viewTrashBtn.textContent = 'Xem Thùng rác';
    if(archiveStatusIndicator) archiveStatusIndicator.classList.add('hidden');
    if(trashStatusIndicator) trashStatusIndicator.classList.add('hidden');
    if(emptyTrashBtn) emptyTrashBtn.classList.add('hidden');

    if (isViewingTrash) {
        if(trashStatusIndicator) trashStatusIndicator.classList.remove('hidden');
        if(viewTrashBtn) viewTrashBtn.textContent = 'Xem Ghi chú';
        if(viewTrashBtn) viewTrashBtn.classList.add('viewing-trash');
        if(emptyTrashBtn && notesToDisplay.length > 0) { emptyTrashBtn.classList.remove('hidden'); }
        renderNotebookTabs(); // Render tab khi xem trash
    } else if (isViewingArchived) {
        if(archiveStatusIndicator) archiveStatusIndicator.classList.remove('hidden');
        if(viewArchiveBtn) viewArchiveBtn.textContent = 'Xem Ghi chú';
        if(viewArchiveBtn) viewArchiveBtn.classList.add('viewing-archive');
        renderNotebookTabs(); // Render tab khi xem archive
    } else {
        renderNotebookTabs(); // Render tab cho view chính
    }

    if (notesToDisplay.length === 0) {
        let emptyMessage = '';
        if (!currentUser) { // Double check (dù đã chặn ở trên)
            emptyMessage = 'Vui lòng đăng nhập.';
        } else if (isViewingTrash) { emptyMessage = filter ? 'Không tìm thấy ghi chú rác nào khớp.' : 'Thùng rác trống.'; }
        else if (isViewingArchived) { emptyMessage = filter ? 'Không tìm thấy ghi chú lưu trữ nào khớp.' : 'Lưu trữ trống.'; }
        else if (currentNotebookId === 'all') { emptyMessage = filter ? 'Không tìm thấy ghi chú nào khớp.' : 'Chưa có ghi chú nào. Nhấn "+" để thêm.'; }
        else { const currentNotebook = notebooks.find(nb => nb.id === parseInt(currentNotebookId)); const notebookName = currentNotebook ? escapeHTML(currentNotebook.name) : 'sổ tay này'; emptyMessage = filter ? `Không tìm thấy ghi chú nào khớp trong ${notebookName}.` : `Sổ tay "${notebookName}" trống. Nhấn "+" để thêm.`; }
        notesContainer.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
        if (sortableInstance) { sortableInstance.destroy(); sortableInstance = null; }
    } else {
        notesToDisplay.forEach(note => { const noteElement = renderNoteElement(note); notesContainer.appendChild(noteElement); });
        initSortable(); // Khởi tạo lại kéo thả nếu cần
    }
    window.scrollTo({ top: scrollY, behavior: 'instant' });
};


// =====================================================================
//  Modal Handling Functions (Giữ nguyên)
// =====================================================================
const showSettingsModal = () => { /* ... */ };
const hideSettingsModal = () => { /* ... */ };
const closeMoveNoteMenu = () => { /* ... */ };
const handleOutsideMoveMenuClick = (event) => { /* ... */ };
const handleMoveNote = (noteId, targetNotebookId) => {
    if (!currentUser) return; // << CHECK AUTH
    /* ... (Phần còn lại giữ nguyên, vẫn save vào localStorage) ... */
};
const showMoveNoteMenu = (noteId, moveBtnElement) => { /* ... (Giữ nguyên) ... */ };


// =====================================================================
//  Event Listener Setup Functions (Thêm setupAuthListeners)
// =====================================================================
const setupThemeAndAppearanceListeners = () => { /* ... (Giữ nguyên) ... */ };
const setupAddNotePanelListeners = () => { /* ... (Giữ nguyên) ... */ };
const setupHeaderActionListeners = () => { /* ... (Giữ nguyên) ... */ };
const setupSearchListener = () => { /* ... (Giữ nguyên) ... */ };
const setupNoteActionListeners = () => { /* ... (Giữ nguyên - các hàm con đã check auth) ... */ };
const setupTemplateModalListeners = () => { /* ... (Giữ nguyên - các hàm con đã check auth) ... */ };
const setupNotebookListeners = () => { /* ... (Giữ nguyên - các hàm con đã check auth) ... */ };
const setupTagInputListeners = () => { /* ... (Giữ nguyên) ... */ };
const setupGlobalListeners = () => { /* ... (Giữ nguyên) ... */ };
const setupGlobalKeydownListeners = () => {
     document.addEventListener('keydown', (event) => {
         // Thêm kiểm tra currentUser cho các phím tắt liên quan đến dữ liệu
         const activeElement = document.activeElement;
         const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') && activeElement !== searchInput;
         const isTemplateModalOpen = templateModal && templateModal.classList.contains('visible');
         const isNoteModalOpen = !!document.querySelector('.note-modal.visible');
         const isSettingsModalOpen = settingsModal && settingsModal.classList.contains('visible');
         const isNotebookModalOpen = notebookModal && notebookModal.classList.contains('visible');
         const isSuggestionBoxOpen = !!document.getElementById(SUGGESTION_BOX_ID);
         const isMoveMenuOpen = !!activeMoveMenu;
         const isEditingNote = activeElement?.closest('.note')?.querySelector('.edit-input, .edit-title-input, .edit-tags-input') === activeElement;
         const isEditingTemplate = templateEditPanel && templateEditPanel.contains(activeElement);
         const isEditingNotebook = notebookEditPanel && notebookEditPanel.contains(activeElement);

         if (event.key === 'Escape') { /* ... (Giữ nguyên logic Escape) ... */ }

         const isAnyModalOpen = isNoteModalOpen || isTemplateModalOpen || isSettingsModalOpen || isNotebookModalOpen;
         const allowSaveInModal = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's' && (isEditingTemplate || isEditingNotebook);

         if ((isAnyModalOpen && !allowSaveInModal) || isMoveMenuOpen) return;
         if (isTyping && !isEditingNote && !isEditingTemplate && !isEditingNotebook) return;

         const isCtrlOrCmd = event.metaKey || event.ctrlKey;
         if (isCtrlOrCmd && event.key.toLowerCase() === 'n') {
             event.preventDefault();
             // Chỉ mở panel add nếu đã đăng nhập
             if (currentUser && !isAnyModalOpen && addNotePanel.classList.contains('hidden') && !notesContainer.querySelector('.note .edit-input')) {
                 showAddPanel();
             }
         } else if (isCtrlOrCmd && event.key.toLowerCase() === 's') {
             // Chỉ cho phép lưu nếu đã đăng nhập
             if (currentUser) {
                 if (isEditingNote) { event.preventDefault(); activeElement.closest('.note')?.querySelector('.save-edit-btn')?.click(); }
                 else if (addNotePanel.contains(activeElement)) { event.preventDefault(); addNoteBtn.click(); }
                 else if (isEditingTemplate) { event.preventDefault(); saveTemplateBtn.click(); }
                 else if (isEditingNotebook) { event.preventDefault(); saveNotebookBtn.click(); }
             }
         } else if (isCtrlOrCmd && event.key.toLowerCase() === 'f') {
             event.preventDefault();
             searchInput.focus();
             searchInput.select();
         }
     });
 };

// --- NEW: Auth Listener Setup ---
const setupAuthListeners = () => {
    if (loginForm) loginForm.addEventListener('submit', handleSignIn);
    if (signupForm) signupForm.addEventListener('submit', handleSignUp);
    if (logoutBtn) logoutBtn.addEventListener('click', handleSignOut);
    if (googleSigninBtn) googleSigninBtn.addEventListener('click', handleGoogleSignIn);

    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', () => {
            clearAuthErrors();
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', () => {
            clearAuthErrors();
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
    }
};

// =====================================================================
//  Main Event Listener Setup Function
// =====================================================================
const setupEventListeners = () => {
    setupThemeAndAppearanceListeners();
    setupHeaderActionListeners(); // Giữ lại nhưng một số nút sẽ bị disable/enable bởi Auth
    setupAddNotePanelListeners();
    setupSearchListener();
    setupNoteActionListeners();
    setupTemplateModalListeners();
    setupNotebookListeners();
    setupTagInputListeners();
    setupGlobalListeners(); // setupGlobalKeydownListeners được gọi trong này
    setupAuthListeners(); // <<<--- Gọi hàm setup mới
};


// =====================================================================
//  Initial Load Function (Simplified)
// =====================================================================
const initializeApp = () => {
     // Tải và áp dụng cài đặt giao diện trước (từ localStorage)
     applyAllAppearanceSettings();
     // Thiết lập các event listeners ban đầu
     setupEventListeners();
     // Mọi thứ khác (tải dữ liệu, cập nhật UI auth) sẽ được xử lý bởi onAuthStateChanged
     console.log("Ứng dụng đã khởi tạo, chờ trạng thái xác thực...");
};

// =====================================================================
//  Auth State Listener - QUAN TRỌNG (Đặt gần cuối để các hàm đã được định nghĩa)
// =====================================================================
onAuthStateChanged(auth, (user) => {
    console.log("Trạng thái Auth thay đổi, user:", user ? user.uid : 'Đã đăng xuất');
    // Cập nhật UI và gọi tải dữ liệu (nếu đăng nhập) hoặc xóa dữ liệu (nếu đăng xuất)
    updateUIBasedOnAuthState(user);
});

// =====================================================================
//  Start the application
// =====================================================================
initializeApp(); // Gọi hàm khởi tạo mới
