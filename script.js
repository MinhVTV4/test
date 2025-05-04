// =====================================================================
//  Firebase Service References (Lấy từ window)
// =====================================================================
// Các biến này sẽ được khởi tạo trong index.html
const auth = window.firebaseAuth;
const db = window.firebaseDb;

// Import các hàm Firebase cần thiết (sẽ dùng ở các bước sau)
// Chúng ta sẽ import trực tiếp khi cần dùng trong các hàm async
// Ví dụ: const { collection, addDoc, ... } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
// Hoặc nếu dùng bundler thì import ở đầu file.
// Vì script này không phải module, ta sẽ dùng cách import động hoặc truy cập qua window.firebase...

// =====================================================================
//  Constants & State Variables
// =====================================================================
// Bỏ các key lưu trữ localStorage cũ
// const NOTES_STORAGE_KEY = 'startNotesData_v2';
// const TEMPLATES_STORAGE_KEY = 'startNoteTemplates';
// const NOTEBOOKS_STORAGE_KEY = 'startNoteNotebooks';
const THEME_NAME_KEY = 'startNotesThemeName';
const ACCENT_COLOR_KEY = 'startNotesAccentColor';
const FONT_FAMILY_KEY = 'startNotesFontFamily';
const FONT_SIZE_SCALE_KEY = 'startNotesFontSizeScale';
const LAST_CUSTOM_THEME_KEY = 'startNotesLastCustomTheme';
const SUGGESTION_BOX_ID = 'tag-suggestion-box';
const MOVE_NOTE_MENU_ID = 'move-note-menu'; // ID for the move menu
const DEBOUNCE_DELAY = 1500;

let notes = []; // Dữ liệu sẽ được load từ Firestore
let templates = []; // Dữ liệu sẽ được load từ Firestore
let notebooks = []; // Dữ liệu sẽ được load từ Firestore
let currentUser = null; // Lưu thông tin người dùng đang đăng nhập
let currentUid = null; // Lưu UID của người dùng đang đăng nhập
let notesListener = null; // Firestore listener cho notes
let templatesListener = null; // Firestore listener cho templates
let notebooksListener = null; // Firestore listener cho notebooks

let isViewingArchived = false;
let isViewingTrash = false;
let currentNotebookId = 'all';
let sortableInstance = null;
let activeTagInputElement = null;
let activeMoveMenu = null; // Track the currently open move menu

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

// =====================================================================
//  DOM References
// =====================================================================
// Thêm các tham chiếu cho UI Auth mới
const authContainer = document.getElementById('auth-container');
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const authErrorElement = document.getElementById('auth-error');
const authButton = document.getElementById('auth-button'); // Nút Đăng nhập/Xuất chính
const userStatusElement = document.getElementById('user-status');
const userEmailSpan = document.getElementById('user-email');

// Các tham chiếu DOM cũ giữ nguyên
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


// =====================================================================
//  Utility Functions (Giữ nguyên)
// =====================================================================
const parseTags = (tagString) => { if (!tagString) return []; return tagString.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== ''); };
const debounce = (func, delay) => { let timeoutId; return function(...args) { clearTimeout(timeoutId); timeoutId = setTimeout(() => { func.apply(this, args); }, delay); }; };
const escapeRegExp = (string) => { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
const formatTimestamp = (timestamp) => {
    // Firestore timestamp có thể là object { seconds, nanoseconds } hoặc number (Date.now())
    if (!timestamp) return '';
    let date;
    if (typeof timestamp === 'object' && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else {
        return ''; // Không xác định được định dạng
    }
    return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
const escapeHTML = (str) => { if (!str) return ''; const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return str.replace(/[&<>"']/g, m => map[m]); }

// =====================================================================
//  Theme & Appearance Management (Giữ nguyên logic, chỉ bỏ localStorage)
// =====================================================================
const getStoredPreference = (key, defaultValue) => {
    // Tạm thời vẫn dùng localStorage cho cài đặt giao diện
    // TODO: Có thể lưu cài đặt giao diện vào Firestore cho từng user ở bước sau
    return localStorage.getItem(key) ?? defaultValue;
};
const applyAllAppearanceSettings = () => {
    // Logic giữ nguyên
    const savedTheme = getStoredPreference(THEME_NAME_KEY, DEFAULT_THEME);
    applyTheme(VALID_THEMES.includes(savedTheme) ? savedTheme : DEFAULT_THEME);
    const savedAccentColor = getStoredPreference(ACCENT_COLOR_KEY, DEFAULT_ACCENT_COLOR);
    applyAccentColor(savedAccentColor);
    const savedFontFamily = getStoredPreference(FONT_FAMILY_KEY, DEFAULT_FONT_FAMILY);
    applyFontFamily(savedFontFamily);
    const savedFontSizeScale = parseFloat(getStoredPreference(FONT_SIZE_SCALE_KEY, DEFAULT_FONT_SIZE_SCALE.toString()));
    applyFontSize(isNaN(savedFontSizeScale) ? DEFAULT_FONT_SIZE_SCALE : savedFontSizeScale);
};
const applyTheme = (themeName) => {
    // Logic giữ nguyên
    if (!VALID_THEMES.includes(themeName)) { console.warn(`Invalid theme name "${themeName}". Falling back to default.`); themeName = DEFAULT_THEME; }
    const root = document.documentElement;
    VALID_THEMES.forEach(theme => document.body.classList.remove(`theme-${theme}`));
    document.body.classList.remove('dark-mode', 'light-mode');
    if (themeName !== 'light') { document.body.classList.add(`theme-${themeName}`); }
    const isDark = DARK_THEME_NAMES.includes(themeName);
    document.body.classList.add(isDark ? 'dark-mode' : 'light-mode');
    if (quickThemeToggleBtn) {
        if (isDark) { quickThemeToggleBtn.innerHTML = '☀️&nbsp;Sáng'; quickThemeToggleBtn.title = 'Chuyển sang chế độ Sáng'; }
        else { quickThemeToggleBtn.innerHTML = '🌙&nbsp;Tối'; quickThemeToggleBtn.title = 'Chuyển sang chế độ Tối'; }
    }
    updateThemeSelectionUI(themeName);
    const currentAccent = getStoredPreference(ACCENT_COLOR_KEY, DEFAULT_ACCENT_COLOR);
    applyAccentColor(currentAccent); // Apply accent color again as default might change
};
const updateThemeSelectionUI = (selectedTheme) => {
    // Logic giữ nguyên
    if (!themeOptionsContainer) return;
    themeOptionsContainer.querySelectorAll('.theme-option-btn').forEach(btn => {
        const isActive = btn.dataset.theme === selectedTheme;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
};
const applyAccentColor = (colorValue) => {
    // Logic giữ nguyên
    const lightDefaultAccent = '#007bff';
    const darkDefaultAccent = '#0d6efd';
    const currentTheme = getStoredPreference(THEME_NAME_KEY, DEFAULT_THEME);
    const isDarkThemeActive = DARK_THEME_NAMES.includes(currentTheme);
    const actualDefaultColor = isDarkThemeActive ? darkDefaultAccent : lightDefaultAccent;
    const actualColor = (colorValue === DEFAULT_ACCENT_COLOR || !colorValue || !colorValue.startsWith('#')) ? actualDefaultColor : colorValue;
    document.documentElement.style.setProperty('--primary-color', actualColor);
    updateAccentColorSelectionUI(colorValue);
};
const updateAccentColorSelectionUI = (selectedColorValue) => {
    // Logic giữ nguyên
    if (!accentColorOptionsContainer) return;
    accentColorOptionsContainer.querySelectorAll('.accent-swatch').forEach(swatch => {
        const isSelected = swatch.dataset.color === selectedColorValue;
        swatch.classList.toggle('selected', isSelected);
        swatch.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        if(swatch.dataset.color === 'default'){
            const lightDefaultAccent = '#007bff';
            const darkDefaultAccent = '#0d6efd';
            const currentTheme = getStoredPreference(THEME_NAME_KEY, DEFAULT_THEME);
            const isDarkThemeActive = DARK_THEME_NAMES.includes(currentTheme);
            const defaultColorForSwatch = isDarkThemeActive ? darkDefaultAccent : lightDefaultAccent;
            swatch.style.backgroundColor = defaultColorForSwatch;
            // Cập nhật border và text color nếu cần để dễ nhìn
            swatch.style.borderColor = isDarkThemeActive ? '#555' : '#ccc'; // Ví dụ
            swatch.style.color = isDarkThemeActive ? '#fff' : '#333'; // Ví dụ
            swatch.innerHTML = ''; // Xóa text cũ nếu có
        }
    });
};
const applyFontFamily = (fontFamilyString) => {
    // Logic giữ nguyên
    document.documentElement.style.setProperty('--content-font-family', fontFamilyString);
    updateFontFamilySelectionUI(fontFamilyString);
};
const updateFontFamilySelectionUI = (selectedFontFamily) => {
    // Logic giữ nguyên
    if (fontFamilySelect) { fontFamilySelect.value = selectedFontFamily; }
};
const applyFontSize = (scale) => {
    // Logic giữ nguyên
    const clampedScale = Math.max(0.8, Math.min(1.5, scale));
    document.documentElement.style.setProperty('--font-size-scale', clampedScale);
    updateFontSizeUI(clampedScale);
};
const updateFontSizeUI = (scale) => {
    // Logic giữ nguyên
    if (fontSizeSlider) { fontSizeSlider.value = scale; }
    if (fontSizeValueSpan) { fontSizeValueSpan.textContent = `${Math.round(scale * 100)}%`; }
};
const quickToggleTheme = () => {
    // Logic giữ nguyên
    const currentTheme = getStoredPreference(THEME_NAME_KEY, DEFAULT_THEME);
    const lastCustomTheme = getStoredPreference(LAST_CUSTOM_THEME_KEY, null);
    let targetTheme;
    const isCurrentDark = DARK_THEME_NAMES.includes(currentTheme);
    if (isCurrentDark) {
        if (lastCustomTheme && !DARK_THEME_NAMES.includes(lastCustomTheme)) { targetTheme = lastCustomTheme; }
        else { targetTheme = 'light'; }
    } else { targetTheme = 'dark'; }
    applyTheme(targetTheme);
    localStorage.setItem(THEME_NAME_KEY, targetTheme); // Vẫn lưu vào localStorage
};

// =====================================================================
//  Notebook Data Management (Sẽ được viết lại hoàn toàn để dùng Firestore)
// =====================================================================
const saveNotebooks = async () => { /* TODO: Implement Firestore save */ console.warn("saveNotebooks needs Firestore implementation"); };
const loadNotebooks = async () => { /* TODO: Implement Firestore load */ console.warn("loadNotebooks needs Firestore implementation"); notebooks = []; }; // Reset để tránh lỗi
const addOrUpdateNotebook = async () => { /* TODO: Implement Firestore add/update */ console.warn("addOrUpdateNotebook needs Firestore implementation"); };
const deleteNotebook = async (id) => { /* TODO: Implement Firestore delete */ console.warn("deleteNotebook needs Firestore implementation"); };

// =====================================================================
//  Note Data Management (Sẽ được viết lại hoàn toàn để dùng Firestore)
// =====================================================================
const saveNotes = async () => { /* TODO: Implement Firestore save */ console.warn("saveNotes needs Firestore implementation - this function might be removed or changed"); };
const loadNotes = async () => { /* TODO: Implement Firestore load */ console.warn("loadNotes needs Firestore implementation"); notes = []; }; // Reset để tránh lỗi
const addNote = async () => { /* TODO: Implement Firestore add */ console.warn("addNote needs Firestore implementation"); };

// =====================================================================
//  Template Data Management (Sẽ được viết lại hoàn toàn để dùng Firestore)
// =====================================================================
const saveTemplates = async () => { /* TODO: Implement Firestore save */ console.warn("saveTemplates needs Firestore implementation"); };
const loadTemplates = async () => { /* TODO: Implement Firestore load */ console.warn("loadTemplates needs Firestore implementation"); templates = []; }; // Reset để tránh lỗi
const addOrUpdateTemplate = async () => { /* TODO: Implement Firestore add/update */ console.warn("addOrUpdateTemplate needs Firestore implementation"); };
const deleteTemplate = async (id) => { /* TODO: Implement Firestore delete */ console.warn("deleteTemplate needs Firestore implementation"); };

// =====================================================================
//  Helper Functions & Event Handlers (Một số sẽ cần chỉnh sửa)
// =====================================================================
const hideTagSuggestions = () => { /* Logic giữ nguyên */ const suggestionBox = document.getElementById(SUGGESTION_BOX_ID); if (suggestionBox) { suggestionBox.remove(); } if(activeTagInputElement) { activeTagInputElement.removeAttribute('aria-activedescendant'); activeTagInputElement.removeAttribute('aria-controls'); } activeTagInputElement = null; document.removeEventListener('mousedown', handleClickOutsideSuggestions); };
const handleClickOutsideSuggestions = (event) => { /* Logic giữ nguyên */ const suggestionBox = document.getElementById(SUGGESTION_BOX_ID); if (suggestionBox && !suggestionBox.contains(event.target) && activeTagInputElement && !activeTagInputElement.contains(event.target)) { hideTagSuggestions(); } };
const handleNotePin = async (noteId) => { /* TODO: Implement Firestore update */ console.warn("handleNotePin needs Firestore implementation"); };
const handleNoteDelete = async (noteId) => { /* TODO: Implement Firestore update (set deleted=true) */ console.warn("handleNoteDelete needs Firestore implementation"); };
const handleNoteRestore = async (noteId) => { /* TODO: Implement Firestore update (set deleted=false) */ console.warn("handleNoteRestore needs Firestore implementation"); };
const handleNoteDeletePermanent = async (noteId) => { /* TODO: Implement Firestore delete */ console.warn("handleNoteDeletePermanent needs Firestore implementation"); };
const handleEmptyTrash = async () => { /* TODO: Implement Firestore batch delete */ console.warn("handleEmptyTrash needs Firestore implementation"); };
const handleNoteArchive = async (noteId) => { /* TODO: Implement Firestore update (set archived=true) */ console.warn("handleNoteArchive needs Firestore implementation"); };
const handleNoteUnarchive = async (noteId) => { /* TODO: Implement Firestore update (set archived=false) */ console.warn("handleNoteUnarchive needs Firestore implementation"); };

const updateNoteData = async (noteId, newData) => {
    /* TODO: Implement Firestore update */
    console.warn("updateNoteData needs Firestore implementation");
    // Hàm này sẽ trực tiếp cập nhật document trên Firestore
    // thay vì cập nhật mảng `notes` và gọi saveNotes()
    return false; // Tạm thời trả về false
};

// Debounced AutoSave cần viết lại hoàn toàn để gọi updateNoteData (phiên bản Firestore)
const debouncedAutoSave = debounce(async (noteElement, noteId) => {
    console.warn("debouncedAutoSave needs Firestore implementation");
    const editTitleInputCheck = noteElement.querySelector('input.edit-title-input');
    const editInputCheck = noteElement.querySelector('textarea.edit-input');
    const editTagsInputCheck = noteElement.querySelector('input.edit-tags-input');
    if (!editTitleInputCheck || !editInputCheck || !editTagsInputCheck || !noteElement.isConnected) {
        return;
    }
    const noteDataFromDOM = { // Lấy dữ liệu từ DOM như cũ
        title: editTitleInputCheck.value,
        text: editInputCheck.value,
        tags: parseTags(editTagsInputCheck.value),
        color: noteElement.dataset.selectedColor ?? null // Lấy màu đã chọn
    };

    // TODO: Lấy note gốc từ Firestore hoặc từ state nếu dùng real-time listener
    // const originalNote = ...

    // TODO: So sánh noteDataFromDOM với originalNote để xem có thay đổi không
    // const changed = ...

    // TODO: Nếu có thay đổi và không phải là xóa trắng note đã có nội dung
    // const wasPreviouslyEmpty = ...
    // const isNowEmpty = ...
    // if (changed && !( !wasPreviouslyEmpty && isNowEmpty )) {
    //     const saved = await updateNoteData(noteId, noteDataFromDOM); // Gọi hàm update Firestore
    //     if (saved) {
    //         noteElement.classList.add('note-autosaved');
    //         setTimeout(() => { noteElement?.classList.remove('note-autosaved'); }, 600);
    //     }
    // }

}, DEBOUNCE_DELAY);

const handleNoteEdit = (noteElement, noteId) => {
    // Logic để hiển thị form edit giữ nguyên phần lớn
    // Chỉ cần đảm bảo nó lấy đúng dữ liệu note (có thể từ Firestore hoặc state)
    // và gọi debouncedAutoSave phiên bản mới
    console.warn("handleNoteEdit might need adjustments for Firestore data fetching");
    if (!currentUser) { alert("Vui lòng đăng nhập để sửa ghi chú."); return; }
    if (isViewingArchived || isViewingTrash) return;

    const currentlyEditing = notesContainer.querySelector('.note .edit-input');
    if (currentlyEditing && currentlyEditing.closest('.note') !== noteElement) {
        alert("Vui lòng Lưu hoặc Hủy thay đổi ở ghi chú đang sửa trước khi sửa ghi chú khác.");
        currentlyEditing.closest('.note').querySelector('textarea.edit-input')?.focus();
        return;
    }
    hideTagSuggestions();
    if (sortableInstance) sortableInstance.option('disabled', true);
    showAddPanelBtn.classList.add('hidden');

    // Tìm note data (hiện tại từ mảng `notes`, sau này có thể khác)
    const noteData = notes.find(note => note.id === noteId);
    if (!noteData) {
        console.error("Không tìm thấy dữ liệu cho note ID:", noteId);
        // Có thể cần fetch lại từ Firestore nếu không có trong state
        return;
    }

    const actionsElementOriginal = noteElement.querySelector('.note-actions');
    let originalActionsHTML = '';
    if (actionsElementOriginal) {
        originalActionsHTML = Array.from(actionsElementOriginal.children)
            .filter(btn => !btn.classList.contains('save-edit-btn')) // Bỏ nút save nếu có sót lại
            .map(btn => btn.outerHTML).join('');
    }

    // Tạo các input elements như cũ
    const editTitleInput = document.createElement('input');
    editTitleInput.type = 'text';
    editTitleInput.classList.add('edit-title-input');
    editTitleInput.placeholder = 'Tiêu đề...';
    editTitleInput.value = noteData.title || '';

    const editInput = document.createElement('textarea');
    editInput.classList.add('edit-input');
    editInput.value = noteData.text;
    editInput.rows = 5; // Có thể điều chỉnh

    const editTagsInput = document.createElement('input');
    editTagsInput.type = 'text';
    editTagsInput.classList.add('edit-tags-input');
    editTagsInput.placeholder = 'Tags (cách nhau bằng dấu phẩy)...';
    editTagsInput.value = (noteData.tags || []).join(', ');
    editTagsInput.autocomplete = 'off';

    // Tạo color selector như cũ
    const colorSelectorContainer = document.createElement('div');
    colorSelectorContainer.classList.add('color-selector-container');
    colorSelectorContainer.setAttribute('role', 'radiogroup');
    colorSelectorContainer.setAttribute('aria-label', 'Chọn màu ghi chú');
    noteElement.dataset.selectedColor = noteData.color || ''; // Lưu màu đang chọn vào dataset

    NOTE_COLORS.forEach(color => {
        const swatchBtn = document.createElement('button');
        swatchBtn.type = 'button';
        swatchBtn.classList.add('color-swatch-btn');
        swatchBtn.dataset.colorValue = color.value || ''; // Lưu class màu hoặc ''
        swatchBtn.title = color.name;
        swatchBtn.setAttribute('role', 'radio');
        const isCurrentColor = (noteData.color === color.value) || (!noteData.color && !color.value);
        swatchBtn.setAttribute('aria-checked', isCurrentColor ? 'true' : 'false');
        if (isCurrentColor) swatchBtn.classList.add('selected');

        if (color.value) {
            swatchBtn.style.backgroundColor = color.hex;
        } else {
            swatchBtn.classList.add('default-color-swatch');
            swatchBtn.innerHTML = '&#x2715;'; // Dấu X cho màu default
            swatchBtn.setAttribute('aria-label', 'Màu mặc định');
        }

        swatchBtn.addEventListener('click', () => {
            const selectedValue = swatchBtn.dataset.colorValue;
            noteElement.dataset.selectedColor = selectedValue; // Cập nhật màu đã chọn vào dataset
            // Cập nhật UI của color selector
            colorSelectorContainer.querySelectorAll('.color-swatch-btn').forEach(btn => {
                const isSelected = btn === swatchBtn;
                btn.classList.toggle('selected', isSelected);
                btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            });
            // Áp dụng màu ngay lập tức cho note element (chỉ UI)
            applyNoteColor(noteElement, { ...noteData, color: selectedValue });
            // Trigger auto-save (phiên bản Firestore)
            debouncedAutoSave(noteElement, noteId);
        });
        colorSelectorContainer.appendChild(swatchBtn);
    });

    // Tạo nút Save
    const saveBtn = document.createElement('button');
    saveBtn.classList.add('save-edit-btn', 'modal-button', 'primary');
    saveBtn.textContent = 'Lưu';
    saveBtn.title = 'Lưu thay đổi (Ctrl+S)';

    // Xóa nội dung cũ và thêm các element mới
    const bookmarkIcon = noteElement.querySelector('.pinned-bookmark-icon'); // Giữ lại icon ghim nếu có
    noteElement.innerHTML = ''; // Xóa hết nội dung cũ
    if (bookmarkIcon) {
        noteElement.appendChild(bookmarkIcon);
        bookmarkIcon.style.display = 'inline-block'; // Đảm bảo nó hiển thị
    }
    noteElement.appendChild(editTitleInput);
    noteElement.appendChild(editInput);
    noteElement.appendChild(editTagsInput);
    noteElement.appendChild(colorSelectorContainer); // Thêm color selector

    // Tạo lại container cho actions và thêm nút Save
    const editActionsContainer = document.createElement('div');
    editActionsContainer.classList.add('note-actions');
    editActionsContainer.innerHTML = originalActionsHTML; // Thêm lại các nút cũ (pin, archive, delete...)
    editActionsContainer.appendChild(saveBtn); // Thêm nút Save mới
    noteElement.appendChild(editActionsContainer);

    // Gắn listener cho auto-save và tag input
    const triggerAutoSave = () => debouncedAutoSave(noteElement, noteId);
    editTitleInput.addEventListener('input', triggerAutoSave);
    editInput.addEventListener('input', triggerAutoSave);
    editTagsInput.addEventListener('input', (event) => {
        handleTagInput(event); // Xử lý gợi ý tag
        triggerAutoSave(); // Trigger auto-save
    });
    editTagsInput.addEventListener('blur', handleTagInputBlur, true); // Listener cho blur
    editTagsInput.addEventListener('keydown', handleTagInputKeydown); // Listener cho keydown (arrows, enter, esc)

    // Focus vào tiêu đề
    editTitleInput.focus();
    editTitleInput.setSelectionRange(editTitleInput.value.length, editTitleInput.value.length); // Di chuyển con trỏ về cuối
};

const handleNoteSaveEdit = async (noteElement, noteId) => {
    // Hàm này sẽ gọi updateNoteData (phiên bản Firestore)
    // và sau đó render lại note element đó hoặc toàn bộ list (tùy cách xử lý state)
    console.warn("handleNoteSaveEdit needs Firestore implementation");
    const editTitleInput = noteElement.querySelector('input.edit-title-input');
    const editInput = noteElement.querySelector('textarea.edit-input');
    const editTagsInput = noteElement.querySelector('input.edit-tags-input');

    if (!editTitleInput || !editInput || !editTagsInput) {
        console.error("Lỗi lưu: Không tìm thấy các thành phần sửa ghi chú.");
        displayNotes(searchInput.value); // Render lại list để đảm bảo đồng bộ
        return;
    }

    const newData = {
        title: editTitleInput.value,
        text: editInput.value,
        tags: parseTags(editTagsInput.value),
        color: noteElement.dataset.selectedColor ?? null
    };

    // TODO: Lấy note gốc để kiểm tra xem có phải xóa trắng không
    // const originalNote = ...
    // const wasInitiallyEmpty = ...
    // const isNowEmpty = !newData.title.trim() && !newData.text.trim();
    // if (!wasInitiallyEmpty && isNowEmpty) {
    //     if (!confirm("Ghi chú gần như trống. Bạn vẫn muốn lưu?")) {
    //         return; // Không lưu
    //     }
    // }

    // Gọi hàm cập nhật Firestore
    const success = await updateNoteData(noteId, newData); // Hàm này cần trả về true/false

    if (success) {
        // Nếu không dùng real-time listener, cần render lại note này hoặc cả list
        // Ví dụ: Render lại cả list
        displayNotes(searchInput.value);

        // Hiệu ứng flash (có thể thêm lại nếu displayNotes không làm mất nó)
        // const savedElement = notesContainer.querySelector(`.note[data-id="${noteId}"]`);
        // if (savedElement) {
        //     savedElement.classList.add('note-saved-flash');
        //     setTimeout(() => { savedElement.classList.remove('note-saved-flash'); }, 600);
        // }

        // Bật lại Sortable và nút FAB
        if (sortableInstance) sortableInstance.option('disabled', false);
        if (addNotePanel.classList.contains('hidden') && currentUser) { // Chỉ hiện FAB nếu đã đăng nhập
             showAddPanelBtn.classList.remove('hidden');
        }
    } else {
        alert("Lưu ghi chú thất bại. Vui lòng thử lại.");
        // Có thể giữ nguyên trạng thái chỉnh sửa hoặc render lại list
        displayNotes(searchInput.value);
    }
    hideTagSuggestions(); // Luôn ẩn suggestions sau khi lưu
    delete noteElement.dataset.selectedColor; // Xóa dataset màu tạm
};

const showFullNoteModal = (title, noteText) => { /* Logic giữ nguyên */ const existingModal = document.querySelector('.note-modal'); if (existingModal) { existingModal.remove(); } const modal = document.createElement('div'); modal.classList.add('note-modal', 'modal', 'hidden'); modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'note-modal-title'); const modalContent = document.createElement('div'); modalContent.classList.add('modal-content'); const modalHeader = document.createElement('div'); modalHeader.classList.add('modal-header'); const modalTitle = document.createElement('h2'); modalTitle.id = 'note-modal-title'; modalTitle.textContent = title || 'Ghi chú'; const closeModalBtn = document.createElement('button'); closeModalBtn.classList.add('close-modal-btn'); closeModalBtn.innerHTML = '&times;'; closeModalBtn.title = 'Đóng (Esc)'; closeModalBtn.setAttribute('aria-label', 'Đóng cửa sổ xem ghi chú'); modalHeader.appendChild(modalTitle); modalHeader.appendChild(closeModalBtn); const modalBody = document.createElement('div'); modalBody.classList.add('modal-body'); modalBody.textContent = noteText || ''; modalContent.appendChild(modalHeader); modalContent.appendChild(modalBody); modal.appendChild(modalContent); document.body.appendChild(modal); requestAnimationFrame(() => { modal.classList.add('visible'); modal.classList.remove('hidden'); }); closeModalBtn.focus(); const closeFunc = () => { modal.classList.remove('visible'); modal.addEventListener('transitionend', () => { modal.remove(); document.removeEventListener('keydown', handleThisModalKeyDown); }, { once: true }); }; const handleThisModalKeyDown = (event) => { if (!modal.classList.contains('visible')) { document.removeEventListener('keydown', handleThisModalKeyDown); return; } if (event.key === 'Escape') { closeFunc(); } if (event.key === 'Tab') { const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (focusableElements.length === 0) return; const firstElement = focusableElements[0]; const lastElement = focusableElements[focusableElements.length - 1]; if (event.shiftKey) { if (document.activeElement === firstElement) { lastElement.focus(); event.preventDefault(); } } else { if (document.activeElement === lastElement) { firstElement.focus(); event.preventDefault(); } } } }; closeModalBtn.addEventListener('click', closeFunc); modal.addEventListener('click', (event) => { if (event.target === modal) closeFunc(); }); document.addEventListener('keydown', handleThisModalKeyDown); };

// =====================================================================
//  Note Element Rendering Helper Functions (Cần chỉnh sửa để lấy noteId)
// =====================================================================
function applyNoteColor(noteElement, note) { /* Logic giữ nguyên */ NOTE_COLORS.forEach(color => { if (color.value) noteElement.classList.remove(color.value); }); const noteColor = note?.color; if (noteColor && NOTE_COLORS.some(c => c.value === noteColor)) { noteElement.classList.add(noteColor); } const colorData = NOTE_COLORS.find(c => c.value === noteColor); noteElement.style.borderLeftColor = colorData?.hex && colorData.value ? colorData.hex : 'transparent'; noteElement.style.borderColor = ''; }
function applyPinnedStatus(noteElement, note, isViewingArchived, isViewingTrash) { /* Logic giữ nguyên */ const isPinned = note?.pinned ?? false; const shouldShowPin = isPinned && !isViewingArchived && !isViewingTrash && currentNotebookId === 'all'; const existingBookmark = noteElement.querySelector('.pinned-bookmark-icon'); noteElement.classList.toggle('pinned-note', shouldShowPin); if (shouldShowPin) { if (!existingBookmark) { const bookmarkIcon = document.createElement('span'); bookmarkIcon.classList.add('pinned-bookmark-icon'); bookmarkIcon.innerHTML = '&#128278;'; bookmarkIcon.setAttribute('aria-hidden', 'true'); noteElement.insertBefore(bookmarkIcon, noteElement.firstChild); } else { existingBookmark.style.display = 'inline-block'; } } else { if (existingBookmark) { existingBookmark.style.display = 'none'; } } }
function createNoteTitleElement(note, filter) { /* Logic giữ nguyên */ const title = note?.title?.trim(); if (!title) return null; const titleElement = document.createElement('h3'); titleElement.classList.add('note-title'); let titleHTML = escapeHTML(title); const lowerCaseFilter = (filter || '').toLowerCase().trim(); const isTagSearch = lowerCaseFilter.startsWith('#'); if (!isTagSearch && lowerCaseFilter) { try { const highlightRegex = new RegExp(`(${escapeRegExp(lowerCaseFilter)})`, 'gi'); titleHTML = titleHTML.replace(highlightRegex, '<mark>$1</mark>'); } catch(e) { console.warn("Lỗi highlight tiêu đề:", e); } } titleElement.innerHTML = titleHTML; return titleElement; }
function createNoteContentElement(note, filter, noteElementForOverflowCheck) { /* Logic giữ nguyên, chỉ cần đảm bảo note.text đúng */ const textContent = note?.text ?? ''; const contentElement = document.createElement('div'); contentElement.classList.add('note-content'); let displayHTML = escapeHTML(textContent); const lowerCaseFilter = (filter || '').toLowerCase().trim(); const isTagSearchContent = lowerCaseFilter.startsWith('#'); if (!isTagSearchContent && lowerCaseFilter) { try { const highlightRegexContent = new RegExp(`(${escapeRegExp(lowerCaseFilter)})`, 'gi'); displayHTML = displayHTML.replace(highlightRegexContent, '<mark>$1</mark>'); } catch (e) { console.warn("Lỗi highlight nội dung:", e); } } displayHTML = displayHTML.replace(/\n/g, '<br>'); contentElement.innerHTML = displayHTML; requestAnimationFrame(() => { if (!noteElementForOverflowCheck || !noteElementForOverflowCheck.isConnected) return; const currentContentEl = noteElementForOverflowCheck.querySelector('.note-content'); if (!currentContentEl) return; const existingBtn = noteElementForOverflowCheck.querySelector('.read-more-btn'); if (existingBtn) existingBtn.remove(); const hasOverflow = currentContentEl.scrollHeight > currentContentEl.clientHeight + 2; currentContentEl.classList.toggle('has-overflow', hasOverflow); if (hasOverflow) { const readMoreBtn = document.createElement('button'); readMoreBtn.textContent = 'Xem thêm'; readMoreBtn.classList.add('read-more-btn'); readMoreBtn.type = 'button'; readMoreBtn.title = 'Xem toàn bộ nội dung ghi chú'; readMoreBtn.addEventListener('click', (e) => { e.stopPropagation(); showFullNoteModal(note.title, note.text); }); noteElementForOverflowCheck.insertBefore(readMoreBtn, currentContentEl.nextSibling); } }); return contentElement; }
function createNoteTagsElement(note) { /* Logic giữ nguyên */ const tags = note?.tags; if (!tags || tags.length === 0) return null; const tagsElement = document.createElement('div'); tagsElement.classList.add('note-tags'); tags.forEach(tag => { const tagBadge = document.createElement('button'); tagBadge.classList.add('tag-badge'); tagBadge.textContent = `#${tag}`; tagBadge.dataset.tag = tag; tagBadge.type = 'button'; tagBadge.title = `Lọc theo tag: ${tag}`; tagsElement.appendChild(tagBadge); }); return tagsElement; }
function createNoteTimestampElement(note) { /* Logic giữ nguyên, chỉ cần đảm bảo note.createdAt/lastModified đúng */
    const timestampElement = document.createElement('small');
    timestampElement.classList.add('note-timestamp');
    // Sử dụng createdAt nếu có từ Firestore, nếu không dùng id (timestamp cũ)
    const creationDate = formatTimestamp(note.createdAt || note.id);
    let timestampText = `Tạo: ${creationDate}`;
    // lastModified từ Firestore
    if (note.lastModified && formatTimestamp(note.lastModified) !== creationDate) {
        const modifiedDate = formatTimestamp(note.lastModified);
        timestampText += ` (Sửa: ${modifiedDate})`;
    }
    if (isViewingTrash && note.deletedTimestamp) {
        const deletedDate = formatTimestamp(note.deletedTimestamp);
        timestampText += ` (Xóa: ${deletedDate})`;
    }
    timestampElement.textContent = timestampText;
    return timestampElement;
}

// Các hàm tạo actions cần được giữ nguyên cấu trúc,
// chỉ cần đảm bảo chúng nhận đúng dữ liệu `note`
function createMainViewNoteActions(note) { /* Logic giữ nguyên */ const fragment = document.createDocumentFragment(); const moveBtn = document.createElement('button'); moveBtn.classList.add('move-note-btn'); moveBtn.innerHTML = '&#128194;'; moveBtn.title = 'Di chuyển đến Sổ tay'; moveBtn.setAttribute('aria-label', 'Di chuyển ghi chú'); fragment.appendChild(moveBtn); const pinBtn = document.createElement('button'); pinBtn.classList.add('pin-btn'); pinBtn.innerHTML = '&#128204;'; pinBtn.title = note.pinned ? "Bỏ ghim" : "Ghim ghi chú"; pinBtn.setAttribute('aria-label', note.pinned ? "Bỏ ghim ghi chú" : "Ghim ghi chú"); pinBtn.setAttribute('aria-pressed', note.pinned ? 'true' : 'false'); if (note.pinned) pinBtn.classList.add('pinned'); if(currentNotebookId !== 'all') pinBtn.style.display = 'none'; fragment.appendChild(pinBtn); const editBtn = document.createElement('button'); editBtn.classList.add('edit-btn'); editBtn.textContent = 'Sửa'; editBtn.title = 'Sửa ghi chú'; editBtn.setAttribute('aria-label', 'Sửa ghi chú'); fragment.appendChild(editBtn); const archiveBtn = document.createElement('button'); archiveBtn.classList.add('archive-btn'); archiveBtn.innerHTML = '&#128451;'; archiveBtn.title = 'Lưu trữ ghi chú'; archiveBtn.setAttribute('aria-label', 'Lưu trữ ghi chú'); fragment.appendChild(archiveBtn); const deleteBtn = document.createElement('button'); deleteBtn.classList.add('delete-btn'); deleteBtn.textContent = 'Xóa'; deleteBtn.title = 'Chuyển vào thùng rác'; deleteBtn.setAttribute('aria-label', 'Chuyển vào thùng rác'); fragment.appendChild(deleteBtn); return fragment; }
function createArchiveViewNoteActions(note) { /* Logic giữ nguyên */ const fragment = document.createDocumentFragment(); const unarchiveBtn = document.createElement('button'); unarchiveBtn.classList.add('unarchive-btn'); unarchiveBtn.innerHTML = '&#x1F5C4;&#xFE0F;'; unarchiveBtn.title = 'Khôi phục từ Lưu trữ'; unarchiveBtn.setAttribute('aria-label', 'Khôi phục từ Lưu trữ'); fragment.appendChild(unarchiveBtn); const deleteBtn = document.createElement('button'); deleteBtn.classList.add('delete-btn'); deleteBtn.textContent = 'Xóa'; deleteBtn.title = 'Chuyển vào thùng rác'; deleteBtn.setAttribute('aria-label', 'Chuyển vào thùng rác'); fragment.appendChild(deleteBtn); return fragment; }
function createTrashViewNoteActions(note) { /* Logic giữ nguyên */ const fragment = document.createDocumentFragment(); const restoreBtn = document.createElement('button'); restoreBtn.classList.add('restore-btn'); restoreBtn.innerHTML = '&#x21A9;&#xFE0F;'; restoreBtn.title = 'Khôi phục ghi chú'; restoreBtn.setAttribute('aria-label', 'Khôi phục ghi chú'); fragment.appendChild(restoreBtn); const deletePermanentBtn = document.createElement('button'); deletePermanentBtn.classList.add('delete-permanent-btn'); deletePermanentBtn.textContent = 'Xóa VV'; deletePermanentBtn.title = 'Xóa ghi chú vĩnh viễn'; deletePermanentBtn.setAttribute('aria-label', 'Xóa ghi chú vĩnh viễn'); fragment.appendChild(deletePermanentBtn); return fragment; }
function createNoteActionsElement(note) { /* Logic giữ nguyên */ const actionsElement = document.createElement('div'); actionsElement.classList.add('note-actions'); let actionButtonsFragment; if (isViewingTrash) { actionButtonsFragment = createTrashViewNoteActions(note); } else if (isViewingArchived) { actionButtonsFragment = createArchiveViewNoteActions(note); } else { actionButtonsFragment = createMainViewNoteActions(note); } actionsElement.appendChild(actionButtonsFragment); return actionsElement; }

// =====================================================================
//  Core Note Rendering Function (Cần chỉnh sửa để dùng noteId từ Firestore)
// =====================================================================
const renderNoteElement = (note) => {
    // Hàm này giờ nhận note object đã có id từ Firestore
    const noteElement = document.createElement('div');
    noteElement.classList.add('note');
    noteElement.dataset.id = note.id; // Sử dụng id từ Firestore
    applyNoteColor(noteElement, note);
    applyPinnedStatus(noteElement, note, isViewingArchived, isViewingTrash);
    const titleEl = createNoteTitleElement(note, searchInput.value);
    if(titleEl) noteElement.appendChild(titleEl);
    const contentEl = createNoteContentElement(note, searchInput.value, noteElement);
    if(contentEl) noteElement.appendChild(contentEl);
    const tagsEl = createNoteTagsElement(note);
    if(tagsEl) noteElement.appendChild(tagsEl);
    const timestampEl = createNoteTimestampElement(note);
    if(timestampEl) noteElement.appendChild(timestampEl);
    const actionsEl = createNoteActionsElement(note);
    if(actionsEl) noteElement.appendChild(actionsEl);
    return noteElement;
};

// =====================================================================
//  Drag & Drop (Cần viết lại để cập nhật thứ tự trên Firestore)
// =====================================================================
const handleDragEnd = async (evt) => {
    console.warn("handleDragEnd needs Firestore implementation for saving order");
    if (!currentUser || isViewingArchived || isViewingTrash) return;

    const newOrderIds = Array.from(notesContainer.children)
        .map(el => el.classList.contains('note') ? el.dataset.id : null) // Lấy Firestore ID (string)
        .filter(id => id !== null);

    // TODO: Cập nhật trường 'order' hoặc 'lastModified' trên Firestore
    // Cách 1: Thêm trường 'order' (number) vào mỗi note. Khi kéo thả,
    // cập nhật lại trường 'order' cho các note bị ảnh hưởng dựa trên newOrderIds.
    // Cách 2: Cập nhật 'lastModified' của các note theo thứ tự mới.
    // Cách 2 đơn giản hơn nhưng có thể không hoàn toàn chính xác nếu có nhiều
    // thao tác xảy ra cùng lúc. Cách 1 đáng tin cậy hơn cho việc sắp xếp.

    // Ví dụ (đơn giản hóa, chỉ cập nhật lastModified):
    // const { writeBatch, doc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
    // const batch = writeBatch(db);
    // const notesRef = collection(db, 'users', currentUid, 'notes');
    // newOrderIds.forEach((noteId, index) => {
    //     // Tính toán timestamp giảm dần để đảm bảo thứ tự mới
    //     const newTimestamp = Date.now() - index * 10; // Giảm 10ms cho mỗi note
    //     const noteDocRef = doc(notesRef, noteId);
    //     batch.update(noteDocRef, { lastModified: newTimestamp }); // Hoặc dùng serverTimestamp() nếu không cần thứ tự chính xác tuyệt đối
    // });
    // try {
    //     await batch.commit();
    //     // Nếu không dùng real-time listener, cần sắp xếp lại mảng `notes` trong state
    //     // và render lại hoặc chỉ cần sắp xếp lại DOM (nếu SortableJS đã làm)
    //     console.log("Note order updated (using timestamp method).");
    // } catch (error) {
    //     console.error("Error updating note order:", error);
    //     alert("Lỗi cập nhật thứ tự ghi chú.");
    //     // Có thể cần render lại để quay về trạng thái cũ
    //     displayNotes(searchInput.value);
    // }

};
const initSortable = () => { /* Logic giữ nguyên */ if (sortableInstance) { sortableInstance.destroy(); sortableInstance = null; } const canInitSortable = typeof Sortable === 'function' && notesContainer && notesContainer.children.length > 0 && !notesContainer.querySelector('.empty-state') && !isViewingArchived && !isViewingTrash && currentUser; if (canInitSortable) { sortableInstance = new Sortable(notesContainer, { animation: 150, handle: '.note', filter: 'input, textarea, button, .tag-badge, .note-content a, .read-more-btn, .color-swatch-btn', preventOnFilter: true, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag', onEnd: handleDragEnd, delay: 50, delayOnTouchOnly: true }); } else if (typeof Sortable !== 'function' && !isViewingArchived && !isViewingTrash && notes.some(n => !n.archived && !n.deleted)) { console.warn("Thư viện Sortable.js chưa được tải."); } };

// =====================================================================
//  Tag Handling (Logic gợi ý giữ nguyên, getAllUniqueTags sẽ lấy từ state)
// =====================================================================
const getAllUniqueTags = () => {
    // Lấy tag từ mảng `notes` hiện tại trong state (đã được load từ Firestore)
    const allTags = notes.reduce((acc, note) => {
        if (!note.deleted && !note.archived && note.tags && note.tags.length > 0) {
            const validTags = note.tags.map(t => t.trim()).filter(t => t);
            acc.push(...validTags);
        }
        return acc;
    }, []);
    return [...new Set(allTags)].sort((a, b) => a.localeCompare(b));
};
const showTagSuggestions = (inputElement, currentTagFragment, suggestions) => { /* Logic giữ nguyên */ hideTagSuggestions(); if (suggestions.length === 0 || !currentTagFragment) return; activeTagInputElement = inputElement; const suggestionBox = document.createElement('div'); suggestionBox.id = SUGGESTION_BOX_ID; suggestionBox.classList.add('tag-suggestions'); suggestionBox.setAttribute('role', 'listbox'); inputElement.setAttribute('aria-controls', SUGGESTION_BOX_ID); suggestions.forEach((tag, index) => { const item = document.createElement('div'); item.classList.add('suggestion-item'); item.textContent = tag; item.setAttribute('role', 'option'); item.id = `suggestion-${index}`; item.tabIndex = -1; item.addEventListener('mousedown', (e) => { e.preventDefault(); const currentValue = inputElement.value; const lastCommaIndex = currentValue.lastIndexOf(','); let baseValue = ''; if (lastCommaIndex !== -1) { baseValue = currentValue.substring(0, lastCommaIndex + 1).trimStart() + (currentValue[lastCommaIndex+1] === ' ' ? '' : ' '); } inputElement.value = baseValue + tag + ', '; hideTagSuggestions(); inputElement.focus(); inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length); inputElement.dispatchEvent(new Event('input', { bubbles: true })); }); suggestionBox.appendChild(item); }); const inputRect = inputElement.getBoundingClientRect(); document.body.appendChild(suggestionBox); suggestionBox.style.position = 'absolute'; suggestionBox.style.top = `${inputRect.bottom + window.scrollY}px`; suggestionBox.style.left = `${inputRect.left + window.scrollX}px`; suggestionBox.style.minWidth = `${inputRect.width}px`; suggestionBox.style.width = 'auto'; setTimeout(() => { document.addEventListener('mousedown', handleClickOutsideSuggestions); }, 0); };
const handleTagInput = (event) => { /* Logic giữ nguyên */ const inputElement = event.target; const value = inputElement.value; const cursorPosition = inputElement.selectionStart; const lastCommaIndexBeforeCursor = value.substring(0, cursorPosition).lastIndexOf(','); const currentTagFragment = value.substring(lastCommaIndexBeforeCursor + 1, cursorPosition).trim().toLowerCase(); if (currentTagFragment.length >= 1) { const allTags = getAllUniqueTags(); const precedingTagsString = value.substring(0, lastCommaIndexBeforeCursor + 1); const currentEnteredTags = parseTags(precedingTagsString); const filteredSuggestions = allTags.filter(tag => tag.toLowerCase().startsWith(currentTagFragment) && !currentEnteredTags.includes(tag) ); showTagSuggestions(inputElement, currentTagFragment, filteredSuggestions); } else { hideTagSuggestions(); } };
const handleTagInputBlur = (event) => { /* Logic giữ nguyên */ setTimeout(() => { const suggestionBox = document.getElementById(SUGGESTION_BOX_ID); if (event.relatedTarget && suggestionBox && suggestionBox.contains(event.relatedTarget)) { return; } hideTagSuggestions(); }, 150); };
const handleTagInputKeydown = (event) => { /* Logic giữ nguyên */ const suggestionBox = document.getElementById(SUGGESTION_BOX_ID); const inputElement = event.target; if (suggestionBox && suggestionBox.children.length > 0) { const items = Array.from(suggestionBox.children); let currentFocusIndex = items.findIndex(item => item === document.activeElement); switch (event.key) { case 'ArrowDown': event.preventDefault(); currentFocusIndex = (currentFocusIndex + 1) % items.length; items[currentFocusIndex].focus(); inputElement.setAttribute('aria-activedescendant', items[currentFocusIndex].id); break; case 'ArrowUp': event.preventDefault(); currentFocusIndex = (currentFocusIndex - 1 + items.length) % items.length; items[currentFocusIndex].focus(); inputElement.setAttribute('aria-activedescendant', items[currentFocusIndex].id); break; case 'Enter': if (document.activeElement?.classList.contains('suggestion-item')) { event.preventDefault(); document.activeElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); } else { hideTagSuggestions(); } break; case 'Escape': event.preventDefault(); hideTagSuggestions(); break; case 'Tab': if (document.activeElement?.classList.contains('suggestion-item')) { event.preventDefault(); document.activeElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); } else { hideTagSuggestions(); } break; } } };

// =====================================================================
//  Template UI Handlers (Cần chỉnh sửa để dùng Firestore)
// =====================================================================
const renderTemplateList = () => { /* TODO: Implement UI render from state */ console.warn("renderTemplateList needs implementation using 'templates' state array"); templateListContainer.innerHTML = ''; if (templates.length === 0) { templateListContainer.innerHTML = `<p class="empty-state">Chưa có mẫu nào.</p>`; return; } templates.sort((a, b) => a.name.localeCompare(b.name)).forEach(template => { const item = document.createElement('div'); item.classList.add('template-list-item'); item.dataset.id = template.id; // Thêm ID vào dataset item.innerHTML = `<span>${escapeHTML(template.name)}</span><div class="template-item-actions"><button class="edit-template-btn modal-button secondary small-button" data-id="${template.id}" title="Sửa mẫu ${escapeHTML(template.name)}">Sửa</button><button class="delete-template-btn modal-button danger small-button" data-id="${template.id}" title="Xóa mẫu ${escapeHTML(template.name)}">Xóa</button></div>`; item.querySelector('.edit-template-btn').addEventListener('click', () => showTemplateEditPanel(template.id)); item.querySelector('.delete-template-btn').addEventListener('click', () => deleteTemplate(template.id)); templateListContainer.appendChild(item); }); };
const showTemplateEditPanel = (templateId = null) => { /* Logic giữ nguyên, chỉ cần đảm bảo lấy đúng template từ state */ templateListSection.classList.add('hidden'); templateEditPanel.classList.remove('hidden'); if (templateId !== null) { const template = templates.find(t => t.id === templateId); if (template) { templateEditTitle.textContent = "Sửa Mẫu"; templateEditId.value = template.id; templateEditName.value = template.name; templateEditTitleInput.value = template.title; templateEditText.value = template.text; templateEditTags.value = (template.tags || []).join(', '); } else { console.error("Không tìm thấy mẫu để sửa ID:", templateId); hideTemplateEditPanel(); return; } } else { templateEditTitle.textContent = "Tạo Mẫu Mới"; templateEditId.value = ''; templateEditName.value = ''; templateEditTitleInput.value = ''; templateEditText.value = ''; templateEditTags.value = ''; } templateEditName.focus(); };
const hideTemplateEditPanel = () => { /* Logic giữ nguyên */ templateEditPanel.classList.add('hidden'); templateListSection.classList.remove('hidden'); templateEditId.value = ''; templateEditName.value = ''; templateEditTitleInput.value = ''; templateEditText.value = ''; templateEditTags.value = ''; };
const showTemplateModal = () => { /* Logic giữ nguyên */ if (!currentUser) { alert("Vui lòng đăng nhập để quản lý mẫu."); return; } renderTemplateList(); hideTemplateEditPanel(); templateModal.classList.add('visible'); templateModal.classList.remove('hidden'); showAddTemplatePanelBtn.focus(); };
const hideTemplateModal = () => { /* Logic giữ nguyên */ templateModal.classList.remove('visible'); templateModal.addEventListener('transitionend', (e) => { if (e.target === templateModal) templateModal.classList.add('hidden'); }, { once: true }); };
const populateTemplateDropdown = () => { /* Logic giữ nguyên, dùng state `templates` */ const currentSelection = templateSelect.value; templateSelect.innerHTML = '<option value="">-- Không dùng mẫu --</option>'; templates.sort((a, b) => a.name.localeCompare(b.name)).forEach(template => { const option = document.createElement('option'); option.value = template.id; option.textContent = escapeHTML(template.name); templateSelect.appendChild(option); }); // Khôi phục lựa chọn cũ nếu template đó còn tồn tại if (templates.some(t => t.id === currentSelection)) { // So sánh ID (string) templateSelect.value = currentSelection; } else { templateSelect.value = ""; } };
const applyTemplate = () => { /* Logic giữ nguyên, dùng state `templates` */ const selectedId = templateSelect.value; // ID giờ là string if (selectedId) { const template = templates.find(t => t.id === selectedId); if (template) { newNoteTitle.value = template.title; newNoteText.value = template.text; newNoteTags.value = (template.tags || []).join(', '); newNoteText.focus(); } } };

// =====================================================================
//  Notebook UI Handlers (Cần chỉnh sửa để dùng Firestore)
// =====================================================================
const renderNotebookList = () => { /* TODO: Implement UI render from state */ console.warn("renderNotebookList needs implementation using 'notebooks' state array"); notebookListContainer.innerHTML = ''; if (notebooks.length === 0) { notebookListContainer.innerHTML = `<p class="empty-state">Chưa có sổ tay nào.</p>`; return; } notebooks.sort((a, b) => a.name.localeCompare(b.name)).forEach(notebook => { const item = document.createElement('div'); item.classList.add('notebook-list-item'); item.dataset.id = notebook.id; // Thêm ID item.innerHTML = ` <span>${escapeHTML(notebook.name)}</span> <div class="notebook-item-actions"> <button class="edit-notebook-btn modal-button secondary small-button" data-id="${notebook.id}" title="Sửa sổ tay ${escapeHTML(notebook.name)}">Sửa</button> <button class="delete-notebook-btn modal-button danger small-button" data-id="${notebook.id}" title="Xóa sổ tay ${escapeHTML(notebook.name)}">Xóa</button> </div> `; item.querySelector('.edit-notebook-btn').addEventListener('click', () => showNotebookEditPanel(notebook.id)); item.querySelector('.delete-notebook-btn').addEventListener('click', () => deleteNotebook(notebook.id)); notebookListContainer.appendChild(item); }); };
const showNotebookEditPanel = (notebookId = null) => { /* Logic giữ nguyên, dùng state `notebooks` */ notebookListSection.classList.add('hidden'); notebookEditPanel.classList.remove('hidden'); if (notebookId !== null) { const notebook = notebooks.find(nb => nb.id === notebookId); if (notebook) { notebookEditTitle.textContent = "Sửa Sổ tay"; notebookEditId.value = notebook.id; notebookEditName.value = notebook.name; } else { console.error("Không tìm thấy sổ tay để sửa ID:", notebookId); hideNotebookEditPanel(); return; } } else { notebookEditTitle.textContent = "Tạo Sổ tay Mới"; notebookEditId.value = ''; notebookEditName.value = ''; } notebookEditName.focus(); };
const hideNotebookEditPanel = () => { /* Logic giữ nguyên */ notebookEditPanel.classList.add('hidden'); notebookListSection.classList.remove('hidden'); notebookEditId.value = ''; notebookEditName.value = ''; };
const showNotebookModal = () => { /* Logic giữ nguyên */ if (!currentUser) { alert("Vui lòng đăng nhập để quản lý sổ tay."); return; } renderNotebookList(); hideNotebookEditPanel(); notebookModal.classList.add('visible'); notebookModal.classList.remove('hidden'); showAddNotebookPanelBtn.focus(); };
const hideNotebookModal = () => { /* Logic giữ nguyên */ notebookModal.classList.remove('visible'); notebookModal.addEventListener('transitionend', (e) => { if (e.target === notebookModal) notebookModal.classList.add('hidden'); }, { once: true }); };

// =====================================================================
//  Notebook Tab Rendering (Cần chỉnh sửa để dùng Firestore state)
// =====================================================================
const renderNotebookTabs = () => {
    // Dùng state `notebooks`
    if (!notebookTabsContainer) return;
    const addButton = notebookTabsContainer.querySelector('#add-notebook-tab-btn');
    notebookTabsContainer.innerHTML = ''; // Xóa tab cũ

    // Tab "Tất cả Ghi chú"
    const allNotesTab = document.createElement('button');
    allNotesTab.classList.add('tab-button');
    allNotesTab.dataset.notebookId = 'all';
    allNotesTab.textContent = 'Tất cả Ghi chú';
    if (currentNotebookId === 'all' && !isViewingArchived && !isViewingTrash) {
        allNotesTab.classList.add('active');
    }
    notebookTabsContainer.appendChild(allNotesTab);

    // Render các tab sổ tay từ state
    notebooks.sort((a, b) => a.name.localeCompare(b.name)).forEach(notebook => {
        const tab = document.createElement('button');
        tab.classList.add('tab-button');
        tab.dataset.notebookId = notebook.id; // ID từ Firestore (string)
        tab.textContent = escapeHTML(notebook.name);
        // So sánh ID (string)
        if (currentNotebookId === notebook.id && !isViewingArchived && !isViewingTrash) {
            tab.classList.add('active');
        }
        notebookTabsContainer.appendChild(tab);
    });

    // Thêm lại nút "+"
    const finalAddButton = addButton || document.createElement('button');
    if (!addButton) { // Nếu nút chưa tồn tại thì tạo mới
        finalAddButton.id = 'add-notebook-tab-btn';
        finalAddButton.classList.add('add-tab-button');
        finalAddButton.title = 'Thêm Sổ tay mới';
        finalAddButton.textContent = '+';
        finalAddButton.addEventListener('click', () => {
             if (!currentUser) { alert("Vui lòng đăng nhập để thêm sổ tay."); return; }
             showNotebookModal();
             showNotebookEditPanel(); // Mở thẳng panel tạo mới
        });
    }
    notebookTabsContainer.appendChild(finalAddButton);
};

// =====================================================================
//  Other Panel/Import/Export (Import/Export cần viết lại)
// =====================================================================
const showAddPanel = () => { /* Logic giữ nguyên, thêm kiểm tra đăng nhập */ if (!currentUser) { alert("Vui lòng đăng nhập để thêm ghi chú."); return; } const currentlyEditing = notesContainer.querySelector('.note .edit-input'); if (currentlyEditing) { alert("Vui lòng Lưu hoặc Hủy thay đổi ở ghi chú đang sửa trước khi thêm ghi chú mới."); currentlyEditing.closest('.note').querySelector('textarea.edit-input')?.focus(); return; } hideTagSuggestions(); addNotePanel.classList.remove('hidden'); showAddPanelBtn.classList.add('hidden'); templateSelect.value = ""; newNoteTitle.focus(); };
const hideAddPanel = () => { /* Logic giữ nguyên */ hideTagSuggestions(); addNotePanel.classList.add('hidden'); if (!notesContainer.querySelector('.note .edit-input') && currentUser) { // Chỉ hiện lại FAB nếu đã đăng nhập showAddPanelBtn.classList.remove('hidden'); } newNoteTitle.value = ''; newNoteText.value = ''; newNoteTags.value = ''; templateSelect.value = ""; };
const exportNotes = async () => { /* TODO: Implement Firestore export (maybe via Cloud Function) */ console.warn("exportNotes needs Firestore implementation"); alert("Chức năng xuất dữ liệu đang được phát triển cho phiên bản đám mây."); };
const importNotes = async (file) => { /* TODO: Implement Firestore import (maybe via Cloud Function) */ console.warn("importNotes needs Firestore implementation"); alert("Chức năng nhập dữ liệu đang được phát triển cho phiên bản đám mây."); if(importFileInput) importFileInput.value = null; };

// =====================================================================
//  Note Filtering and Sorting Logic (Cần chỉnh sửa để dùng Firestore state)
// =====================================================================
const getFilteredNotes = (allNotes, filter) => {
    // Lọc dựa trên state `notes` đã được load/update từ Firestore
    let viewFilteredNotes = allNotes.filter(note => {
        if (isViewingTrash) {
            return note.deleted;
        } else if (isViewingArchived) {
            return note.archived && !note.deleted;
        } else {
            // So sánh ID (string)
            return !note.deleted && !note.archived && (currentNotebookId === 'all' || note.notebookId === currentNotebookId);
        }
    });

    if (filter) {
        const lowerCaseFilter = filter.toLowerCase().trim();
        const isTagSearch = lowerCaseFilter.startsWith('#');
        const tagSearchTerm = isTagSearch ? lowerCaseFilter.substring(1) : null;

        viewFilteredNotes = viewFilteredNotes.filter(note => {
            if (isTagSearch) {
                if (!tagSearchTerm) return true; // Nếu chỉ có # thì hiển thị hết
                return note.tags && note.tags.some(tag => tag.toLowerCase() === tagSearchTerm);
            } else {
                const noteTitleLower = (note.title || '').toLowerCase();
                const noteTextLower = (note.text || '').toLowerCase();
                const titleMatch = noteTitleLower.includes(lowerCaseFilter);
                const textMatch = noteTextLower.includes(lowerCaseFilter);
                // Tìm trong tag không phân biệt hoa thường
                const tagMatch = note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerCaseFilter));
                return titleMatch || textMatch || tagMatch;
            }
        });
    }
    return viewFilteredNotes;
};
const sortNotes = (filteredNotes) => {
    // Sắp xếp dựa trên state `notes`
    if (isViewingTrash) {
        // Sắp xếp theo thời gian xóa (mới nhất lên đầu)
        return filteredNotes.sort((a, b) => (b.deletedTimestamp?.seconds || 0) - (a.deletedTimestamp?.seconds || 0));
    } else if (isViewingArchived) {
        // Sắp xếp theo thời gian sửa đổi (mới nhất lên đầu)
        return filteredNotes.sort((a, b) => (b.lastModified?.seconds || 0) - (a.lastModified?.seconds || 0));
    } else {
        // Ưu tiên ghim, sau đó là thời gian sửa đổi (mới nhất lên đầu)
        return filteredNotes.sort((a, b) => {
            if (currentNotebookId === 'all' && a.pinned !== b.pinned) {
                return b.pinned - a.pinned; // true (1) > false (0)
            }
            // Sắp xếp theo lastModified (Firestore timestamp object)
            const timeA = a.lastModified?.seconds ?? (a.createdAt?.seconds ?? 0);
            const timeB = b.lastModified?.seconds ?? (b.createdAt?.seconds ?? 0);
            return timeB - timeA;
        });
    }
};

// =====================================================================
//  Core Display Function (Cần chỉnh sửa để dùng Firestore state)
// =====================================================================
const displayNotes = (filter = '') => {
    if (!currentUser) {
        notesContainer.innerHTML = '<p class="empty-state">Vui lòng đăng nhập để xem ghi chú.</p>';
        if (sortableInstance) { sortableInstance.destroy(); sortableInstance = null; }
        showAddPanelBtn.classList.add('hidden'); // Ẩn FAB nếu chưa đăng nhập
        notebookTabsContainer.innerHTML = ''; // Xóa các tab sổ tay
        // Có thể ẩn các nút quản lý khác
        manageNotebooksBtn.classList.add('hidden');
        manageTemplatesBtn.classList.add('hidden');
        viewArchiveBtn.classList.add('hidden');
        viewTrashBtn.classList.add('hidden');
        exportNotesBtn.classList.add('hidden');
        importNotesBtn.classList.add('hidden');
        searchInput.classList.add('hidden');

        return;
    }

     // Hiện lại các nút nếu đã đăng nhập
     manageNotebooksBtn.classList.remove('hidden');
     manageTemplatesBtn.classList.remove('hidden');
     viewArchiveBtn.classList.remove('hidden');
     viewTrashBtn.classList.remove('hidden');
     exportNotesBtn.classList.remove('hidden');
     importNotesBtn.classList.remove('hidden');
     searchInput.classList.remove('hidden');
     if (!addNotePanel.classList.contains('hidden') || !notesContainer.querySelector('.note .edit-input')) {
        showAddPanelBtn.classList.remove('hidden');
     }


    hideTagSuggestions();
    const scrollY = window.scrollY;
    notesContainer.innerHTML = ''; // Xóa notes cũ

    // Lọc và sắp xếp từ state `notes` hiện tại
    const filteredNotes = getFilteredNotes(notes, filter.toLowerCase().trim());
    const notesToDisplay = sortNotes(filteredNotes);

    // Cập nhật UI trạng thái xem (Archive/Trash)
    viewArchiveBtn.classList.remove('viewing-archive');
    viewTrashBtn.classList.remove('viewing-trash');
    viewArchiveBtn.textContent = 'Xem Lưu trữ';
    viewTrashBtn.textContent = 'Xem Thùng rác';
    archiveStatusIndicator.classList.add('hidden');
    trashStatusIndicator.classList.add('hidden');
    emptyTrashBtn.classList.add('hidden');

    if (isViewingTrash) {
        trashStatusIndicator.classList.remove('hidden');
        viewTrashBtn.textContent = 'Xem Ghi chú';
        viewTrashBtn.classList.add('viewing-trash');
        if(notesToDisplay.length > 0) {
            emptyTrashBtn.classList.remove('hidden');
        }
        renderNotebookTabs(); // Render lại tabs (để bỏ active)
    } else if (isViewingArchived) {
        archiveStatusIndicator.classList.remove('hidden');
        viewArchiveBtn.textContent = 'Xem Ghi chú';
        viewArchiveBtn.classList.add('viewing-archive');
        renderNotebookTabs(); // Render lại tabs (để bỏ active)
    } else {
        renderNotebookTabs(); // Render lại tabs (để set active đúng)
    }

    // Hiển thị notes hoặc thông báo trống
    if (notesToDisplay.length === 0) {
        let emptyMessage = '';
        if (isViewingTrash) {
            emptyMessage = filter ? 'Không tìm thấy ghi chú rác nào khớp.' : 'Thùng rác trống.';
        } else if (isViewingArchived) {
            emptyMessage = filter ? 'Không tìm thấy ghi chú lưu trữ nào khớp.' : 'Lưu trữ trống.';
        } else if (currentNotebookId === 'all') {
            emptyMessage = filter ? 'Không tìm thấy ghi chú nào khớp.' : 'Chưa có ghi chú nào. Nhấn "+" để thêm.';
        } else {
            const currentNotebook = notebooks.find(nb => nb.id === currentNotebookId); // So sánh ID (string)
            const notebookName = currentNotebook ? escapeHTML(currentNotebook.name) : 'sổ tay này';
            emptyMessage = filter ? `Không tìm thấy ghi chú nào khớp trong ${notebookName}.` : `Sổ tay "${notebookName}" trống. Nhấn "+" để thêm.`;
        }
        notesContainer.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
        if (sortableInstance) { // Hủy sortable nếu không có note
            sortableInstance.destroy();
            sortableInstance = null;
        }
    } else {
        notesToDisplay.forEach(note => {
            const noteElement = renderNoteElement(note); // Render từng note
            notesContainer.appendChild(noteElement);
        });
        initSortable(); // Khởi tạo lại sortable
    }
    window.scrollTo({ top: scrollY, behavior: 'instant' }); // Khôi phục vị trí cuộn
};

// =====================================================================
//  Modal Handling Functions (Giữ nguyên)
// =====================================================================
const showSettingsModal = () => { /* Logic giữ nguyên */ applyAllAppearanceSettings(); settingsModal.classList.add('visible'); settingsModal.classList.remove('hidden'); closeSettingsModalBtn.focus(); };
const hideSettingsModal = () => { /* Logic giữ nguyên */ settingsModal.classList.remove('visible'); settingsModal.addEventListener('transitionend', (e) => { if (e.target === settingsModal) settingsModal.classList.add('hidden'); }, { once: true }); };

// --- Move Note Menu Functions (Cần chỉnh sửa để dùng Firestore) ---
const closeMoveNoteMenu = () => { /* Logic giữ nguyên */ if (activeMoveMenu) { activeMoveMenu.remove(); activeMoveMenu = null; document.removeEventListener('click', handleOutsideMoveMenuClick, true); } };
const handleOutsideMoveMenuClick = (event) => { /* Logic giữ nguyên */ if (activeMoveMenu && !activeMoveMenu.contains(event.target) && !event.target.closest('.move-note-btn')) { closeMoveNoteMenu(); } };
const handleMoveNote = async (noteId, targetNotebookId) => {
    /* TODO: Implement Firestore update */
    console.warn("handleMoveNote needs Firestore implementation");
    if (!currentUser) return;

    const newNotebookId = targetNotebookId === 'none' ? null : targetNotebookId; // targetNotebookId đã là string ID hoặc 'none'

    // Tìm note trong state hiện tại để kiểm tra xem có cần cập nhật không
    const note = notes.find(n => n.id === noteId);
    if (note && note.notebookId !== newNotebookId) {
        // Gọi hàm cập nhật Firestore
        const success = await updateNoteData(noteId, { notebookId: newNotebookId });
        if (!success) {
            alert("Lỗi khi di chuyển ghi chú. Vui lòng thử lại.");
        }
        // Nếu không dùng real-time listener, cần cập nhật state và render lại
        // Nếu dùng real-time listener, Firestore sẽ tự cập nhật state và UI
    }
    closeMoveNoteMenu(); // Luôn đóng menu
};
const showMoveNoteMenu = (noteId, moveBtnElement) => {
    // Logic hiển thị menu giữ nguyên, chỉ cần đảm bảo lấy đúng state `notebooks`
    closeMoveNoteMenu();
    const note = notes.find(n => n.id === noteId); // Lấy note từ state
    if (!note || !currentUser) return;

    const menu = document.createElement('div');
    menu.id = MOVE_NOTE_MENU_ID;
    menu.classList.add('move-note-menu');

    // Nút "Không thuộc sổ tay nào"
    const noNotebookBtn = document.createElement('button');
    noNotebookBtn.textContent = '-- Không thuộc sổ tay nào --';
    noNotebookBtn.dataset.targetNotebookId = 'none';
    if (note.notebookId === null) { // Kiểm tra null
        noNotebookBtn.classList.add('current-notebook');
        noNotebookBtn.disabled = true;
    }
    noNotebookBtn.addEventListener('click', () => handleMoveNote(noteId, 'none'));
    menu.appendChild(noNotebookBtn);

    if (notebooks.length > 0) {
        menu.appendChild(document.createElement('hr'));
    }

    // Các sổ tay khác
    notebooks.sort((a, b) => a.name.localeCompare(b.name)).forEach(notebook => {
        const notebookBtn = document.createElement('button');
        notebookBtn.textContent = escapeHTML(notebook.name);
        notebookBtn.dataset.targetNotebookId = notebook.id; // ID là string
        if (note.notebookId === notebook.id) { // So sánh ID (string)
            notebookBtn.classList.add('current-notebook');
            notebookBtn.disabled = true;
        }
        notebookBtn.addEventListener('click', () => handleMoveNote(noteId, notebook.id));
        menu.appendChild(notebookBtn);
    });

    document.body.appendChild(menu);
    activeMoveMenu = menu;

    // Tính toán vị trí menu (giữ nguyên)
    const btnRect = moveBtnElement.getBoundingClientRect();
    menu.style.position = 'absolute';
    requestAnimationFrame(() => {
        const finalMenuHeight = menu.offsetHeight;
        const spaceAbove = btnRect.top;
        const spaceBelow = window.innerHeight - btnRect.bottom;
        if (spaceBelow >= finalMenuHeight + 10 || spaceBelow >= spaceAbove) {
            menu.style.top = `${btnRect.bottom + window.scrollY + 5}px`;
        } else {
            menu.style.top = `${btnRect.top + window.scrollY - finalMenuHeight - 5}px`;
        }
        menu.style.left = `${btnRect.left + window.scrollX}px`;
        if (btnRect.left + menu.offsetWidth > window.innerWidth - 10) {
            menu.style.left = `${window.innerWidth - menu.offsetWidth - 10 + window.scrollX}px`;
        }
    });

    setTimeout(() => { document.addEventListener('click', handleOutsideMoveMenuClick, true); }, 0);
};

// =====================================================================
//  Event Listener Setup Functions (Cần thêm listener cho Auth)
// =====================================================================
const setupThemeAndAppearanceListeners = () => { /* Logic giữ nguyên */ quickThemeToggleBtn.addEventListener('click', quickToggleTheme); settingsBtn.addEventListener('click', showSettingsModal); closeSettingsModalBtn.addEventListener('click', hideSettingsModal); settingsModal.addEventListener('click', (event) => { if (event.target === settingsModal) hideSettingsModal(); }); if (themeOptionsContainer) { themeOptionsContainer.addEventListener('click', (event) => { const targetButton = event.target.closest('.theme-option-btn'); if (targetButton?.dataset.theme) { const selectedTheme = targetButton.dataset.theme; if (VALID_THEMES.includes(selectedTheme)) { applyTheme(selectedTheme); localStorage.setItem(THEME_NAME_KEY, selectedTheme); if (selectedTheme !== 'light' && selectedTheme !== 'dark') { localStorage.setItem(LAST_CUSTOM_THEME_KEY, selectedTheme); } } else { console.warn(`Attempted to apply invalid theme: ${selectedTheme}`); } } }); } if (accentColorOptionsContainer) { accentColorOptionsContainer.addEventListener('click', (event) => { const targetSwatch = event.target.closest('.accent-swatch'); if (targetSwatch?.dataset.color) { const selectedColor = targetSwatch.dataset.color; applyAccentColor(selectedColor); localStorage.setItem(ACCENT_COLOR_KEY, selectedColor); } }); } if (fontFamilySelect) { fontFamilySelect.addEventListener('change', (event) => { const selectedFont = event.target.value; applyFontFamily(selectedFont); localStorage.setItem(FONT_FAMILY_KEY, selectedFont); }); } const debouncedSaveFontSize = debounce((scale) => { localStorage.setItem(FONT_SIZE_SCALE_KEY, scale.toString()); }, 500); if (fontSizeSlider) { fontSizeSlider.addEventListener('input', (event) => { const scale = parseFloat(event.target.value); if (!isNaN(scale)) { applyFontSize(scale); debouncedSaveFontSize(scale); } }); } if (resetFontSizeBtn) { resetFontSizeBtn.addEventListener('click', () => { const defaultScale = DEFAULT_FONT_SIZE_SCALE; applyFontSize(defaultScale); localStorage.setItem(FONT_SIZE_SCALE_KEY, defaultScale.toString()); if (fontSizeSlider) fontSizeSlider.value = defaultScale; }); } };
const setupAddNotePanelListeners = () => { /* Logic giữ nguyên */ addNoteBtn.addEventListener('click', addNote); showAddPanelBtn.addEventListener('click', showAddPanel); closeAddPanelBtn.addEventListener('click', hideAddPanel); newNoteTitle.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (newNoteText.value.trim() === '' && newNoteTitle.value.trim() !== '') { addNoteBtn.click(); } else { newNoteText.focus(); } } }); };
const setupHeaderActionListeners = () => { /* Logic giữ nguyên, import/export sẽ báo lỗi */ exportNotesBtn.addEventListener('click', exportNotes); importNotesBtn.addEventListener('click', () => importFileInput.click()); importFileInput.addEventListener('change', (e) => { if(e.target.files && e.target.files[0]) { importNotes(e.target.files[0]); } e.target.value = null; }); viewArchiveBtn.addEventListener('click', () => { if (!currentUser) { alert("Vui lòng đăng nhập."); return; } isViewingArchived = true; isViewingTrash = false; currentNotebookId = 'archive'; searchInput.value = ''; displayNotes(); }); viewTrashBtn.addEventListener('click', () => { if (!currentUser) { alert("Vui lòng đăng nhập."); return; } isViewingTrash = true; isViewingArchived = false; currentNotebookId = 'trash'; searchInput.value = ''; displayNotes(); }); emptyTrashBtn.addEventListener('click', handleEmptyTrash); };
const setupSearchListener = () => { /* Logic giữ nguyên */ const debouncedDisplayNotes = debounce((filterVal) => displayNotes(filterVal), 300); searchInput.addEventListener('input', (e) => debouncedDisplayNotes(e.target.value)); };
const setupNoteActionListeners = () => { // Cần đảm bảo noteId lấy đúng từ dataset
    notesContainer.addEventListener('click', (event) => {
        const target = event.target;
        const noteElement = target.closest('.note');
        if (!noteElement || !currentUser) return; // Phải đăng nhập mới tương tác được

        const noteId = noteElement.dataset.id; // ID từ Firestore (string)
        if (!noteId) {
            console.error("Không tìm thấy note ID trong dataset.");
            return;
        }

        // Logic xử lý tag click giữ nguyên
        const tagButton = target.closest('.tag-badge');
        if (tagButton?.dataset.tag) {
            event.preventDefault();
            event.stopPropagation();
            searchInput.value = `#${tagButton.dataset.tag}`;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Logic xử lý read more giữ nguyên
        const readMoreButton = target.closest('.read-more-btn');
        if (readMoreButton) {
            event.stopPropagation();
            const note = notes.find(n => n.id === noteId); // Tìm note trong state
            if (note) showFullNoteModal(note.title, note.text);
            return;
        }

        const isEditingThisNote = noteElement.querySelector('textarea.edit-input');

        // Xử lý nút trong chế độ edit
        if (isEditingThisNote) {
             if (target.closest('.save-edit-btn')) {
                 handleNoteSaveEdit(noteElement, noteId); // Gọi hàm save mới
             } else if (target.closest('.pin-btn') && currentNotebookId === 'all') {
                 handleNotePin(noteId); // Gọi hàm pin mới
                 // Cập nhật UI nút pin (cần lấy trạng thái mới sau khi update)
                 // TODO: Cập nhật UI nút pin sau khi handleNotePin thành công
             }
             // Không xử lý các nút khác khi đang edit (trừ save và pin)
             return;
        }

        // Xử lý các nút khác khi không edit
        const moveButton = target.closest('.move-note-btn');
        if (moveButton && !isViewingArchived && !isViewingTrash) {
            event.stopPropagation();
            showMoveNoteMenu(noteId, moveButton); // Gọi hàm show menu mới
            return;
        }

        if (target.closest('.pin-btn') && !isViewingArchived && !isViewingTrash && currentNotebookId === 'all') handleNotePin(noteId);
        else if (target.closest('.delete-btn')) handleNoteDelete(noteId);
        else if (target.closest('.archive-btn') && !isViewingTrash && !isViewingArchived) handleNoteArchive(noteId);
        else if (target.closest('.unarchive-btn') && isViewingArchived) handleNoteUnarchive(noteId);
        else if (target.closest('.restore-btn') && isViewingTrash) handleNoteRestore(noteId);
        else if (target.closest('.delete-permanent-btn') && isViewingTrash) handleNoteDeletePermanent(noteId);
        else if (target.closest('.edit-btn') && !isViewingArchived && !isViewingTrash) handleNoteEdit(noteElement, noteId);
    });
};
const setupTemplateModalListeners = () => { /* Logic giữ nguyên, chỉ cần đảm bảo gọi đúng hàm Firestore */ if(manageTemplatesBtn) manageTemplatesBtn.addEventListener('click', showTemplateModal); closeTemplateModalBtn.addEventListener('click', hideTemplateModal); templateModal.addEventListener('click', (event) => { if (event.target === templateModal && templateEditPanel.classList.contains('hidden')) { hideTemplateModal(); } }); showAddTemplatePanelBtn.addEventListener('click', () => showTemplateEditPanel()); cancelEditTemplateBtn.addEventListener('click', hideTemplateEditPanel); saveTemplateBtn.addEventListener('click', addOrUpdateTemplate); templateSelect.addEventListener('change', applyTemplate); };
const setupNotebookListeners = () => { /* Logic giữ nguyên, chỉ cần đảm bảo gọi đúng hàm Firestore */ if(manageNotebooksBtn) manageNotebooksBtn.addEventListener('click', showNotebookModal); closeNotebookModalBtn.addEventListener('click', hideNotebookModal); notebookModal.addEventListener('click', (event) => { if (event.target === notebookModal && notebookEditPanel.classList.contains('hidden')) { hideNotebookModal(); } }); showAddNotebookPanelBtn.addEventListener('click', () => showNotebookEditPanel()); cancelEditNotebookBtn.addEventListener('click', hideNotebookEditPanel); saveNotebookBtn.addEventListener('click', addOrUpdateNotebook); if (notebookTabsContainer) { notebookTabsContainer.addEventListener('click', (event) => { const target = event.target; if (target.matches('.tab-button') && target.dataset.notebookId) { const selectedNotebookId = target.dataset.notebookId; // ID là string if (selectedNotebookId === currentNotebookId && !isViewingArchived && !isViewingTrash) return; currentNotebookId = selectedNotebookId; isViewingArchived = false; isViewingTrash = false; searchInput.value = ''; displayNotes(); } else if (target.matches('#add-notebook-tab-btn')) { if (!currentUser) { alert("Vui lòng đăng nhập để thêm sổ tay."); return; } showNotebookModal(); showNotebookEditPanel(); } }); } };
const setupTagInputListeners = () => { /* Logic giữ nguyên */ newNoteTags.addEventListener('input', handleTagInput); newNoteTags.addEventListener('blur', handleTagInputBlur, true); newNoteTags.addEventListener('keydown', handleTagInputKeydown); notesContainer.addEventListener('input', (e) => { if (e.target.matches('.edit-tags-input')) handleTagInput(e); }); notesContainer.addEventListener('blur', (e) => { if (e.target.matches('.edit-tags-input')) handleTagInputBlur(e); }, true); notesContainer.addEventListener('keydown', (e) => { if (e.target.matches('.edit-tags-input')) handleTagInputKeydown(e); }); };
const setupGlobalListeners = () => { /* Logic giữ nguyên */ document.addEventListener('mousedown', (event) => { if (activeMoveMenu && !activeMoveMenu.contains(event.target) && !event.target.closest('.move-note-btn')) { closeMoveNoteMenu(); } const suggestionBox = document.getElementById(SUGGESTION_BOX_ID); if (suggestionBox && !suggestionBox.contains(event.target) && activeTagInputElement && !activeTagInputElement.contains(event.target)) { hideTagSuggestions(); } }, true); setupGlobalKeydownListeners(); };
const setupGlobalKeydownListeners = () => { /* Logic giữ nguyên, có thể thêm kiểm tra currentUser */ document.addEventListener('keydown', (event) => { const activeElement = document.activeElement; const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') && activeElement !== searchInput; const isTemplateModalOpen = templateModal.classList.contains('visible'); const isNoteModalOpen = !!document.querySelector('.note-modal.visible'); const isSettingsModalOpen = settingsModal.classList.contains('visible'); const isNotebookModalOpen = notebookModal.classList.contains('visible'); const isSuggestionBoxOpen = !!document.getElementById(SUGGESTION_BOX_ID); const isMoveMenuOpen = !!activeMoveMenu; const isEditingNote = activeElement?.closest('.note')?.querySelector('.edit-input, .edit-title-input, .edit-tags-input') === activeElement; const isEditingTemplate = templateEditPanel.contains(activeElement); const isEditingNotebook = notebookEditPanel.contains(activeElement); const isAuthFormActive = authContainer.contains(activeElement); if (event.key === 'Escape') { if (isMoveMenuOpen) closeMoveNoteMenu(); else if (isSuggestionBoxOpen) hideTagSuggestions(); else if (isSettingsModalOpen) hideSettingsModal(); else if (isNoteModalOpen) document.querySelector('.note-modal.visible .close-modal-btn')?.click(); else if (isTemplateModalOpen) { if (!templateEditPanel.classList.contains('hidden')) hideTemplateEditPanel(); else hideTemplateModal(); } else if (isNotebookModalOpen) { if (!notebookEditPanel.classList.contains('hidden')) hideNotebookEditPanel(); else hideNotebookModal(); } else if (!addNotePanel.classList.contains('hidden')) hideAddPanel(); else if (isEditingNote && currentUser) { const editingNoteElement = activeElement.closest('.note'); if (editingNoteElement && confirm("Bạn có muốn hủy bỏ các thay đổi và đóng chỉnh sửa ghi chú không?")) { displayNotes(searchInput.value); if (addNotePanel.classList.contains('hidden')) showAddPanelBtn.classList.remove('hidden'); if (sortableInstance) sortableInstance.option('disabled', false); } } else if (activeElement === searchInput && searchInput.value !== '') { searchInput.value = ''; displayNotes(); } else if (!authContainer.classList.contains('hidden')) { // Thoát form auth authContainer.classList.add('hidden'); authButton.classList.remove('hidden'); } event.preventDefault(); event.stopPropagation(); return; } const isAnyModalOpen = isNoteModalOpen || isTemplateModalOpen || isSettingsModalOpen || isNotebookModalOpen || !authContainer.classList.contains('hidden'); const allowSaveInModal = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's' && (isEditingTemplate || isEditingNotebook); if ((isAnyModalOpen && !allowSaveInModal && !isAuthFormActive) || isMoveMenuOpen) return; // Chặn shortcut nếu modal đang mở (trừ save template/notebook và form auth) if (isTyping && !isEditingNote && !isEditingTemplate && !isEditingNotebook && !isAuthFormActive) return; // Cho phép gõ trong form auth const isCtrlOrCmd = event.metaKey || event.ctrlKey; if (isCtrlOrCmd && event.key.toLowerCase() === 'n') { if (currentUser && !isAnyModalOpen && addNotePanel.classList.contains('hidden') && !notesContainer.querySelector('.note .edit-input')) { event.preventDefault(); showAddPanel(); } } else if (isCtrlOrCmd && event.key.toLowerCase() === 's') { if (isEditingNote && currentUser) { event.preventDefault(); activeElement.closest('.note')?.querySelector('.save-edit-btn')?.click(); } else if (addNotePanel.contains(activeElement) && currentUser) { event.preventDefault(); addNoteBtn.click(); } else if (isEditingTemplate && currentUser) { event.preventDefault(); saveTemplateBtn.click(); } else if (isEditingNotebook && currentUser) { event.preventDefault(); saveNotebookBtn.click(); } } else if (isCtrlOrCmd && event.key.toLowerCase() === 'f') { if (currentUser && !isAnyModalOpen) { // Chỉ cho tìm kiếm khi đã đăng nhập và không có modal event.preventDefault(); searchInput.focus(); searchInput.select(); } } else if (event.key === 'Enter' && isAuthFormActive) { event.preventDefault(); loginBtn.click(); // Mặc định là login khi Enter } }); };

// =====================================================================
//  Authentication Logic (Sẽ thêm ở bước sau)
// =====================================================================
const setupAuthListeners = () => { /* TODO: Implement Auth listeners */ };
const handleAuthStateChanged = (user) => { /* TODO: Implement Auth state change handler */ };
const showAuthForm = () => { /* TODO: Implement show auth form */ };
const hideAuthForm = () => { /* TODO: Implement hide auth form */ };
const handleLogin = async () => { /* TODO: Implement login */ };
const handleRegister = async () => { /* TODO: Implement register */ };
const handleLogout = async () => { /* TODO: Implement logout */ };

// =====================================================================
//  Main Event Listener Setup Function (Gọi thêm setupAuthListeners)
// =====================================================================
const setupEventListeners = () => {
    setupThemeAndAppearanceListeners();
    setupHeaderActionListeners();
    setupAddNotePanelListeners();
    setupSearchListener();
    setupNoteActionListeners();
    setupTemplateModalListeners();
    setupNotebookListeners();
    setupTagInputListeners();
    setupGlobalListeners();
    setupAuthListeners(); // Thêm listener cho Auth
};

// =====================================================================
//  Initial Load Function (Sẽ được thay thế bằng Auth state listener)
// =====================================================================
const loadNotesAndInit_OLD = () => {
     // Hàm này không còn dùng nữa, thay bằng onAuthStateChanged
     console.log("loadNotesAndInit_OLD called - should be replaced by Auth listener");
     // loadNotes(); // Bỏ load từ localStorage
     // loadTemplates(); // Bỏ load từ localStorage
     // loadNotebooks(); // Bỏ load từ localStorage
     applyAllAppearanceSettings();
     isViewingArchived = false;
     isViewingTrash = false;
     currentNotebookId = DEFAULT_NOTEBOOK_ID;
     // renderNotebookTabs(); // Sẽ render khi có dữ liệu
     displayNotes(); // Hiển thị trạng thái "Vui lòng đăng nhập" ban đầu
     // populateTemplateDropdown(); // Sẽ populate khi có dữ liệu
     setupEventListeners();
};

// =====================================================================
//  Start the application (Thay bằng lắng nghe trạng thái Auth)
// =====================================================================
// loadNotesAndInit_OLD(); // Bỏ lệnh gọi cũ

// --- Khởi tạo ứng dụng bằng cách lắng nghe trạng thái Auth ---
const initializeAppWithAuth = async () => {
    applyAllAppearanceSettings(); // Áp dụng cài đặt giao diện trước
    setupEventListeners(); // Setup các listener chung trước

    if (!auth) {
        console.error("Firebase Auth is not initialized!");
        notesContainer.innerHTML = '<p class="empty-state error">Lỗi khởi tạo hệ thống xác thực.</p>';
        return;
    }

    try {
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');

        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in
                console.log("User signed in:", user.uid, user.email);
                currentUser = user;
                currentUid = user.uid;
                userEmailSpan.textContent = user.email;
                userStatusElement.classList.remove('hidden');
                authButton.textContent = 'Đăng xuất';
                authButton.classList.remove('hidden');
                hideAuthForm(); // Ẩn form đăng nhập/đăng ký
                // TODO: Load data for the signed-in user from Firestore
                // loadUserDataFromFirestore();
                notesContainer.innerHTML = '<p class="empty-state">Đang tải dữ liệu...</p>'; // Thông báo đang tải
                displayNotes(); // Gọi displayNotes để hiện các nút quản lý...
            } else {
                // User is signed out
                console.log("User signed out.");
                currentUser = null;
                currentUid = null;
                notes = []; // Xóa dữ liệu cũ
                templates = [];
                notebooks = [];
                userStatusElement.classList.add('hidden');
                authButton.textContent = 'Đăng nhập';
                authButton.classList.remove('hidden');
                // TODO: Unsubscribe from Firestore listeners if they exist
                // unsubscribeListeners();
                displayNotes(); // Hiển thị trạng thái yêu cầu đăng nhập
                // Không cần hiển thị form auth ngay, chờ user click nút Đăng nhập
            }
        });
    } catch (error) {
        console.error("Error setting up Auth listener:", error);
        notesContainer.innerHTML = '<p class="empty-state error">Lỗi theo dõi trạng thái đăng nhập.</p>';
    }
};

initializeAppWithAuth(); // Bắt đầu ứng dụng
