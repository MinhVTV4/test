// =====================================================================
//  Firebase Service References (Lấy từ window)
// =====================================================================
const auth = window.firebaseAuth;
const db = window.firebaseDb; // Firestore instance

// =====================================================================
//  Constants & State Variables
// =====================================================================
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
let currentUser = null;
let currentUid = null;
let notesListener = null;
let templatesListener = null;
let notebooksListener = null;

let isViewingArchived = false;
let isViewingTrash = false;
let currentNotebookId = 'all';
let sortableInstance = null;
let activeTagInputElement = null;
let activeMoveMenu = null;

const DEFAULT_NOTEBOOK_ID = 'all';

const NOTE_COLORS = [ { name: 'Default', value: null, hex: 'transparent' }, { name: 'Yellow', value: 'note-color-yellow', hex: '#fff9c4' }, { name: 'Blue', value: 'note-color-blue', hex: '#bbdefb' }, { name: 'Green', value: 'note-color-green', hex: '#c8e6c9' }, { name: 'Red', value: 'note-color-red', hex: '#ffcdd2' }, { name: 'Purple', value: 'note-color-purple', hex: '#e1bee7' }, { name: 'Grey', value: 'note-color-grey', hex: '#e0e0e0' }, ];
const VALID_THEMES = [ 'light', 'dark', 'sepia', 'solarized-light', 'solarized-dark', 'nord', 'gruvbox-dark', 'gruvbox-light', 'dracula', 'monochrome' ];
const DEFAULT_THEME = 'light';
const DEFAULT_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const DEFAULT_FONT_SIZE_SCALE = 1;
const DEFAULT_ACCENT_COLOR = 'default';
const DARK_THEME_NAMES = [ 'dark', 'solarized-dark', 'nord', 'gruvbox-dark', 'dracula' ];

// =====================================================================
//  DOM References (Giữ nguyên)
// =====================================================================
const authContainer = document.getElementById('auth-container');
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const authErrorElement = document.getElementById('auth-error');
const authButton = document.getElementById('auth-button');
const userStatusElement = document.getElementById('user-status');
const userEmailSpan = document.getElementById('user-email');
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
const formatTimestamp = (timestamp) => { if (!timestamp) return ''; let date; if (typeof timestamp === 'object' && timestamp.seconds) { date = new Date(timestamp.seconds * 1000); } else if (typeof timestamp === 'number') { date = new Date(timestamp); } else { return ''; } return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); }
const escapeHTML = (str) => { if (!str) return ''; const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return str.replace(/[&<>"']/g, m => map[m]); }

// =====================================================================
//  Theme & Appearance Management (Giữ nguyên)
// =====================================================================
const getStoredPreference = (key, defaultValue) => { return localStorage.getItem(key) ?? defaultValue; };
const applyAllAppearanceSettings = () => { const savedTheme = getStoredPreference(THEME_NAME_KEY, DEFAULT_THEME); applyTheme(VALID_THEMES.includes(savedTheme) ? savedTheme : DEFAULT_THEME); const savedAccentColor = getStoredPreference(ACCENT_COLOR_KEY, DEFAULT_ACCENT_COLOR); applyAccentColor(savedAccentColor); const savedFontFamily = getStoredPreference(FONT_FAMILY_KEY, DEFAULT_FONT_FAMILY); applyFontFamily(savedFontFamily); const savedFontSizeScale = parseFloat(getStoredPreference(FONT_SIZE_SCALE_KEY, DEFAULT_FONT_SIZE_SCALE.toString())); applyFontSize(isNaN(savedFontSizeScale) ? DEFAULT_FONT_SIZE_SCALE : savedFontSizeScale); };
const applyTheme = (themeName) => { if (!VALID_THEMES.includes(themeName)) { console.warn(`Invalid theme name "${themeName}". Falling back to default.`); themeName = DEFAULT_THEME; } VALID_THEMES.forEach(theme => document.body.classList.remove(`theme-${theme}`)); document.body.classList.remove('dark-mode', 'light-mode'); if (themeName !== 'light') { document.body.classList.add(`theme-${themeName}`); } const isDark = DARK_THEME_NAMES.includes(themeName); document.body.classList.add(isDark ? 'dark-mode' : 'light-mode'); if (quickThemeToggleBtn) { if (isDark) { quickThemeToggleBtn.innerHTML = '☀️&nbsp;Sáng'; quickThemeToggleBtn.title = 'Chuyển sang chế độ Sáng'; } else { quickThemeToggleBtn.innerHTML = '🌙&nbsp;Tối'; quickThemeToggleBtn.title = 'Chuyển sang chế độ Tối'; } } updateThemeSelectionUI(themeName); const currentAccent = getStoredPreference(ACCENT_COLOR_KEY, DEFAULT_ACCENT_COLOR); applyAccentColor(currentAccent); };
const updateThemeSelectionUI = (selectedTheme) => { if (!themeOptionsContainer) return; themeOptionsContainer.querySelectorAll('.theme-option-btn').forEach(btn => { const isActive = btn.dataset.theme === selectedTheme; btn.classList.toggle('active', isActive); btn.setAttribute('aria-checked', isActive ? 'true' : 'false'); }); };
const applyAccentColor = (colorValue) => { const lightDefaultAccent = '#007bff'; const darkDefaultAccent = '#0d6efd'; const currentTheme = getStoredPreference(THEME_NAME_KEY, DEFAULT_THEME); const isDarkThemeActive = DARK_THEME_NAMES.includes(currentTheme); const actualDefaultColor = isDarkThemeActive ? darkDefaultAccent : lightDefaultAccent; const actualColor = (colorValue === DEFAULT_ACCENT_COLOR || !colorValue || !colorValue.startsWith('#')) ? actualDefaultColor : colorValue; document.documentElement.style.setProperty('--primary-color', actualColor); updateAccentColorSelectionUI(colorValue); };
const updateAccentColorSelectionUI = (selectedColorValue) => { if (!accentColorOptionsContainer) return; accentColorOptionsContainer.querySelectorAll('.accent-swatch').forEach(swatch => { const isSelected = swatch.dataset.color === selectedColorValue; swatch.classList.toggle('selected', isSelected); swatch.setAttribute('aria-checked', isSelected ? 'true' : 'false'); if(swatch.dataset.color === 'default'){ const lightDefaultAccent = '#007bff'; const darkDefaultAccent = '#0d6efd'; const currentTheme = getStoredPreference(THEME_NAME_KEY, DEFAULT_THEME); const isDarkThemeActive = DARK_THEME_NAMES.includes(currentTheme); const defaultColorForSwatch = isDarkThemeActive ? darkDefaultAccent : lightDefaultAccent; swatch.style.backgroundColor = defaultColorForSwatch; swatch.style.borderColor = isDarkThemeActive ? '#555' : '#ccc'; swatch.style.color = isDarkThemeActive ? '#fff' : '#333'; swatch.innerHTML = ''; } }); };
const applyFontFamily = (fontFamilyString) => { document.documentElement.style.setProperty('--content-font-family', fontFamilyString); updateFontFamilySelectionUI(fontFamilyString); };
const updateFontFamilySelectionUI = (selectedFontFamily) => { if (fontFamilySelect) { fontFamilySelect.value = selectedFontFamily; } };
const applyFontSize = (scale) => { const clampedScale = Math.max(0.8, Math.min(1.5, scale)); document.documentElement.style.setProperty('--font-size-scale', clampedScale); updateFontSizeUI(clampedScale); };
const updateFontSizeUI = (scale) => { if (fontSizeSlider) { fontSizeSlider.value = scale; } if (fontSizeValueSpan) { fontSizeValueSpan.textContent = `${Math.round(scale * 100)}%`; } };
const quickToggleTheme = () => { const currentTheme = getStoredPreference(THEME_NAME_KEY, DEFAULT_THEME); const lastCustomTheme = getStoredPreference(LAST_CUSTOM_THEME_KEY, null); let targetTheme; const isCurrentDark = DARK_THEME_NAMES.includes(currentTheme); if (isCurrentDark) { if (lastCustomTheme && !DARK_THEME_NAMES.includes(lastCustomTheme)) { targetTheme = lastCustomTheme; } else { targetTheme = 'light'; } } else { targetTheme = 'dark'; } applyTheme(targetTheme); localStorage.setItem(THEME_NAME_KEY, targetTheme); };

// =====================================================================
//  Firestore Data Management - Notebooks (Updated)
// =====================================================================
const loadNotebooks = async () => { if (!currentUser || !db) return; console.log("Attempting to load notebooks for user:", currentUid); if (notebooksListener) { console.log("Unsubscribing previous notebooks listener."); notebooksListener(); notebooksListener = null; } try { const { collection, query, orderBy, onSnapshot } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'); const notebooksColRef = collection(db, 'users', currentUid, 'notebooks'); const q = query(notebooksColRef, orderBy('name', 'asc')); notebooksListener = onSnapshot(q, (querySnapshot) => { console.log("Notebooks snapshot received:", querySnapshot.size, "docs"); const newNotebooks = []; querySnapshot.forEach((doc) => { newNotebooks.push({ id: doc.id, ...doc.data() }); }); notebooks = newNotebooks; console.log("Notebooks state updated:", notebooks); renderNotebookList(); renderNotebookTabs(); }, (error) => { console.error("Error listening to notebooks:", error); alert("Lỗi khi tải danh sách sổ tay."); notebooks = []; renderNotebookList(); renderNotebookTabs(); }); console.log("Notebooks listener attached."); } catch (error) { console.error("Error importing Firestore functions or setting up listener:", error); alert("Lỗi khi thiết lập kết nối đến dữ liệu sổ tay."); } };
const addOrUpdateNotebook = async () => { if (!currentUser || !db) { alert("Vui lòng đăng nhập để quản lý sổ tay."); return; } const name = notebookEditName.value.trim(); const notebookId = notebookEditId.value; if (!name) { alert("Vui lòng nhập Tên Sổ tay!"); notebookEditName.focus(); return; } saveNotebookBtn.disabled = true; saveNotebookBtn.textContent = 'Đang lưu...'; try { const { collection, addDoc, doc, setDoc, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'); const notebooksColRef = collection(db, 'users', currentUid, 'notebooks'); const lowerCaseName = name.toLowerCase(); const q = query(notebooksColRef, where('nameLower', '==', lowerCaseName)); const querySnapshot = await getDocs(q); let isDuplicate = false; querySnapshot.forEach((doc) => { if (doc.id !== notebookId) { isDuplicate = true; } }); if (isDuplicate) { alert(`Sổ tay với tên "${name}" đã tồn tại. Vui lòng chọn tên khác.`); notebookEditName.focus(); saveNotebookBtn.disabled = false; saveNotebookBtn.textContent = 'Lưu Sổ tay'; return; } if (notebookId) { console.log("Updating notebook:", notebookId); const notebookDocRef = doc(notebooksColRef, notebookId); await setDoc(notebookDocRef, { name: name, nameLower: lowerCaseName }, { merge: true }); console.log("Notebook updated successfully."); } else { console.log("Adding new notebook"); await addDoc(notebooksColRef, { name: name, nameLower: lowerCaseName }); console.log("Notebook added successfully."); } hideNotebookEditPanel(); } catch (error) { console.error("Error saving notebook:", error); alert("Lỗi khi lưu sổ tay. Vui lòng thử lại."); } finally { saveNotebookBtn.disabled = false; saveNotebookBtn.textContent = 'Lưu Sổ tay'; } };
const deleteNotebook = async (notebookId) => { if (!currentUser || !db || !notebookId) return; const notebookToDelete = notebooks.find(nb => nb.id === notebookId); if (!notebookToDelete) { console.error("Notebook to delete not found in state:", notebookId); return; } const notebookName = notebookToDelete.name; let confirmMessage = `Bạn chắc chắn muốn xóa sổ tay "${escapeHTML(notebookName)}"? \n\nCẢNH BÁO: Các ghi chú trong sổ tay này sẽ được chuyển về "Tất cả Ghi chú".`; if (!confirm(confirmMessage)) { return; } console.log("Deleting notebook:", notebookId); try { const { doc, deleteDoc, collection, query, where, writeBatch, getDocs } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'); const batch = writeBatch(db); const notesColRef = collection(db, 'users', currentUid, 'notes'); const notesQuery = query(notesColRef, where('notebookId', '==', notebookId)); const notesSnapshot = await getDocs(notesQuery); notesSnapshot.forEach((noteDoc) => { console.log("Updating note:", noteDoc.id, "to remove notebookId"); const noteDocRef = doc(notesColRef, noteDoc.id); batch.update(noteDocRef, { notebookId: null }); }); const notebookDocRef = doc(db, 'users', currentUid, 'notebooks', notebookId); batch.delete(notebookDocRef); await batch.commit(); console.log("Notebook deleted and associated notes updated successfully."); if (currentNotebookId === notebookId) { currentNotebookId = DEFAULT_NOTEBOOK_ID; displayNotes(searchInput.value); } if (!notebookEditPanel.classList.contains('hidden') && notebookEditId.value === notebookId) { hideNotebookEditPanel(); } } catch (error) { console.error("Error deleting notebook or updating notes:", error); alert("Lỗi khi xóa sổ tay. Vui lòng thử lại."); } };

// =====================================================================
//  Note Data Management (TODO: Firestore)
// =====================================================================
const saveNotes = async () => { /* TODO - Might be removed */ console.warn("saveNotes might be removed"); };
const loadNotes = async () => { /* TODO */ console.warn("loadNotes needs Firestore implementation"); notes = []; };
const addNote = async () => { /* TODO */ console.warn("addNote needs Firestore implementation"); };

// =====================================================================
//  Template Data Management (Updated for Firestore)
// =====================================================================
const loadTemplates = async () => { if (!currentUser || !db) return; console.log("Attempting to load templates for user:", currentUid); if (templatesListener) { console.log("Unsubscribing previous templates listener."); templatesListener(); templatesListener = null; } try { const { collection, query, orderBy, onSnapshot } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'); const templatesColRef = collection(db, 'users', currentUid, 'templates'); const q = query(templatesColRef, orderBy('name', 'asc')); templatesListener = onSnapshot(q, (querySnapshot) => { console.log("Templates snapshot received:", querySnapshot.size, "docs"); const newTemplates = []; querySnapshot.forEach((doc) => { newTemplates.push({ id: doc.id, ...doc.data() }); }); templates = newTemplates; console.log("Templates state updated:", templates); renderTemplateList(); populateTemplateDropdown(); }, (error) => { console.error("Error listening to templates:", error); alert("Lỗi khi tải danh sách mẫu."); templates = []; renderTemplateList(); populateTemplateDropdown(); }); console.log("Templates listener attached."); } catch (error) { console.error("Error importing Firestore functions or setting up template listener:", error); alert("Lỗi khi thiết lập kết nối đến dữ liệu mẫu."); } };
const addOrUpdateTemplate = async () => { if (!currentUser || !db) { alert("Vui lòng đăng nhập để quản lý mẫu."); return; } const name = templateEditName.value.trim(); const title = templateEditTitleInput.value.trim(); const text = templateEditText.value; const tags = parseTags(templateEditTags.value); const templateId = templateEditId.value; if (!name) { alert("Vui lòng nhập Tên Mẫu!"); templateEditName.focus(); return; } saveTemplateBtn.disabled = true; saveTemplateBtn.textContent = 'Đang lưu...'; const templateData = { name: name, nameLower: name.toLowerCase(), title: title, text: text, tags: tags }; try { const { collection, addDoc, doc, setDoc, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'); const templatesColRef = collection(db, 'users', currentUid, 'templates'); const lowerCaseName = name.toLowerCase(); const q = query(templatesColRef, where('nameLower', '==', lowerCaseName)); const querySnapshot = await getDocs(q); let isDuplicate = false; querySnapshot.forEach((doc) => { if (doc.id !== templateId) { isDuplicate = true; } }); if (isDuplicate) { alert(`Mẫu với tên "${name}" đã tồn tại. Vui lòng chọn tên khác.`); templateEditName.focus(); saveTemplateBtn.disabled = false; saveTemplateBtn.textContent = 'Lưu Mẫu'; return; } if (templateId) { console.log("Updating template:", templateId); const templateDocRef = doc(templatesColRef, templateId); await setDoc(templateDocRef, templateData, { merge: true }); console.log("Template updated successfully."); } else { console.log("Adding new template"); await addDoc(templatesColRef, templateData); console.log("Template added successfully."); } hideTemplateEditPanel(); } catch (error) { console.error("Error saving template:", error); alert("Lỗi khi lưu mẫu. Vui lòng thử lại."); } finally { saveTemplateBtn.disabled = false; saveTemplateBtn.textContent = 'Lưu Mẫu'; } };
const deleteTemplate = async (templateId) => { if (!currentUser || !db || !templateId) return; const templateToDelete = templates.find(t => t.id === templateId); if (!templateToDelete) { console.error("Template to delete not found in state:", templateId); return; } const templateName = templateToDelete.name; if (!confirm(`Bạn chắc chắn muốn xóa mẫu "${escapeHTML(templateName)}"?`)) { return; } console.log("Deleting template:", templateId); try { const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'); const templateDocRef = doc(db, 'users', currentUid, 'templates', templateId); await deleteDoc(templateDocRef); console.log("Template deleted successfully."); if (!templateEditPanel.classList.contains('hidden') && templateEditId.value === templateId) { hideTemplateEditPanel(); } } catch (error) { console.error("Error deleting template:", error); alert("Lỗi khi xóa mẫu. Vui lòng thử lại."); } };

// =====================================================================
//  Helper Functions & Event Handlers (TODO: Firestore Updates for Notes)
// =====================================================================
const hideTagSuggestions = () => { /* Logic giữ nguyên */ const suggestionBox = document.getElementById(SUGGESTION_BOX_ID); if (suggestionBox) { suggestionBox.remove(); } if(activeTagInputElement) { activeTagInputElement.removeAttribute('aria-activedescendant'); activeTagInputElement.removeAttribute('aria-controls'); } activeTagInputElement = null; document.removeEventListener('mousedown', handleClickOutsideSuggestions); };
const handleClickOutsideSuggestions = (event) => { /* Logic giữ nguyên */ const suggestionBox = document.getElementById(SUGGESTION_BOX_ID); if (suggestionBox && !suggestionBox.contains(event.target) && activeTagInputElement && !activeTagInputElement.contains(event.target)) { hideTagSuggestions(); } };
const handleNotePin = async (noteId) => { /* TODO */ console.warn("handleNotePin needs Firestore implementation"); };
const handleNoteDelete = async (noteId) => { /* TODO */ console.warn("handleNoteDelete needs Firestore implementation"); };
const handleNoteRestore = async (noteId) => { /* TODO */ console.warn("handleNoteRestore needs Firestore implementation"); };
const handleNoteDeletePermanent = async (noteId) => { /* TODO */ console.warn("handleNoteDeletePermanent needs Firestore implementation"); };
const handleEmptyTrash = async () => { /* TODO */ console.warn("handleEmptyTrash needs Firestore implementation"); };
const handleNoteArchive = async (noteId) => { /* TODO */ console.warn("handleNoteArchive needs Firestore implementation"); };
const handleNoteUnarchive = async (noteId) => { /* TODO */ console.warn("handleNoteUnarchive needs Firestore implementation"); };
const updateNoteData = async (noteId, newData) => { /* TODO */ console.warn("updateNoteData needs Firestore implementation"); return false; };
const debouncedAutoSave = debounce(async (noteElement, noteId) => { /* TODO */ console.warn("debouncedAutoSave needs Firestore implementation"); }, DEBOUNCE_DELAY);
const handleNoteEdit = (noteElement, noteId) => { /* Logic giữ nguyên */ console.warn("handleNoteEdit might need adjustments for Firestore data fetching"); if (!currentUser) { alert("Vui lòng đăng nhập để sửa ghi chú."); return; } if (isViewingArchived || isViewingTrash) return; const currentlyEditing = notesContainer.querySelector('.note .edit-input'); if (currentlyEditing && currentlyEditing.closest('.note') !== noteElement) { alert("Vui lòng Lưu hoặc Hủy thay đổi ở ghi chú đang sửa trước khi sửa ghi chú khác."); currentlyEditing.closest('.note').querySelector('textarea.edit-input')?.focus(); return; } hideTagSuggestions(); if (sortableInstance) sortableInstance.option('disabled', true); showAddPanelBtn.classList.add('hidden'); const noteData = notes.find(note => note.id === noteId); if (!noteData) { console.error("Không tìm thấy dữ liệu cho note ID:", noteId); return; } const actionsElementOriginal = noteElement.querySelector('.note-actions'); let originalActionsHTML = ''; if (actionsElementOriginal) { originalActionsHTML = Array.from(actionsElementOriginal.children).filter(btn => !btn.classList.contains('save-edit-btn')).map(btn => btn.outerHTML).join(''); } const editTitleInput = document.createElement('input'); editTitleInput.type = 'text'; editTitleInput.classList.add('edit-title-input'); editTitleInput.placeholder = 'Tiêu đề...'; editTitleInput.value = noteData.title || ''; const editInput = document.createElement('textarea'); editInput.classList.add('edit-input'); editInput.value = noteData.text; editInput.rows = 5; const editTagsInput = document.createElement('input'); editTagsInput.type = 'text'; editTagsInput.classList.add('edit-tags-input'); editTagsInput.placeholder = 'Tags (cách nhau bằng dấu phẩy)...'; editTagsInput.value = (noteData.tags || []).join(', '); editTagsInput.autocomplete = 'off'; const colorSelectorContainer = document.createElement('div'); colorSelectorContainer.classList.add('color-selector-container'); colorSelectorContainer.setAttribute('role', 'radiogroup'); colorSelectorContainer.setAttribute('aria-label', 'Chọn màu ghi chú'); noteElement.dataset.selectedColor = noteData.color || ''; NOTE_COLORS.forEach(color => { const swatchBtn = document.createElement('button'); swatchBtn.type = 'button'; swatchBtn.classList.add('color-swatch-btn'); swatchBtn.dataset.colorValue = color.value || ''; swatchBtn.title = color.name; swatchBtn.setAttribute('role', 'radio'); const isCurrentColor = (noteData.color === color.value) || (!noteData.color && !color.value); swatchBtn.setAttribute('aria-checked', isCurrentColor ? 'true' : 'false'); if (isCurrentColor) swatchBtn.classList.add('selected'); if (color.value) { swatchBtn.style.backgroundColor = color.hex; } else { swatchBtn.classList.add('default-color-swatch'); swatchBtn.innerHTML = '&#x2715;'; swatchBtn.setAttribute('aria-label', 'Màu mặc định'); } swatchBtn.addEventListener('click', () => { const selectedValue = swatchBtn.dataset.colorValue; noteElement.dataset.selectedColor = selectedValue; colorSelectorContainer.querySelectorAll('.color-swatch-btn').forEach(btn => { const isSelected = btn === swatchBtn; btn.classList.toggle('selected', isSelected); btn.setAttribute('aria-checked', isSelected ? 'true' : 'false'); }); applyNoteColor(noteElement, { ...noteData, color: selectedValue }); debouncedAutoSave(noteElement, noteId); }); colorSelectorContainer.appendChild(swatchBtn); }); const saveBtn = document.createElement('button'); saveBtn.classList.add('save-edit-btn', 'modal-button', 'primary'); saveBtn.textContent = 'Lưu'; saveBtn.title = 'Lưu thay đổi (Ctrl+S)'; const bookmarkIcon = noteElement.querySelector('.pinned-bookmark-icon'); noteElement.innerHTML = ''; if (bookmarkIcon) { noteElement.appendChild(bookmarkIcon); bookmarkIcon.style.display = 'inline-block'; } noteElement.appendChild(editTitleInput); noteElement.appendChild(editInput); noteElement.appendChild(editTagsInput); noteElement.appendChild(colorSelectorContainer); const editActionsContainer = document.createElement('div'); editActionsContainer.classList.add('note-actions'); editActionsContainer.innerHTML = originalActionsHTML; editActionsContainer.appendChild(saveBtn); noteElement.appendChild(editActionsContainer); const triggerAutoSave = () => debouncedAutoSave(noteElement, noteId); editTitleInput.addEventListener('input', triggerAutoSave); editInput.addEventListener('input', triggerAutoSave); editTagsInput.addEventListener('input', (event) => { handleTagInput(event); triggerAutoSave(); }); editTagsInput.addEventListener('blur', handleTagInputBlur, true); editTagsInput.addEventListener('keydown', handleTagInputKeydown); editTitleInput.focus(); editTitleInput.setSelectionRange(editTitleInput.value.length, editTitleInput.value.length); };
const handleNoteSaveEdit = async (noteElement, noteId) => { /* TODO */ console.warn("handleNoteSaveEdit needs Firestore implementation"); const editTitleInput = noteElement.querySelector('input.edit-title-input'); const editInput = noteElement.querySelector('textarea.edit-input'); const editTagsInput = noteElement.querySelector('input.edit-tags-input'); if (!editTitleInput || !editInput || !editTagsInput) { console.error("Lỗi lưu: Không tìm thấy các thành phần sửa ghi chú."); displayNotes(searchInput.value); return; } const newData = { title: editTitleInput.value, text: editInput.value, tags: parseTags(editTagsInput.value), color: noteElement.dataset.selectedColor ?? null }; const success = await updateNoteData(noteId, newData); if (success) { displayNotes(searchInput.value); if (sortableInstance) sortableInstance.option('disabled', false); if (addNotePanel.classList.contains('hidden') && currentUser) { showAddPanelBtn.classList.remove('hidden'); } } else { alert("Lưu ghi chú thất bại. Vui lòng thử lại."); displayNotes(searchInput.value); } hideTagSuggestions(); delete noteElement.dataset.selectedColor; };
const showFullNoteModal = (title, noteText) => { /* Logic giữ nguyên */ const existingModal = document.querySelector('.note-modal'); if (existingModal) { existingModal.remove(); } const modal = document.createElement('div'); modal.classList.add('note-modal', 'modal', 'hidden'); modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'note-modal-title'); const modalContent = document.createElement('div'); modalContent.classList.add('modal-content'); const modalHeader = document.createElement('div'); modalHeader.classList.add('modal-header'); const modalTitle = document.createElement('h2'); modalTitle.id = 'note-modal-title'; modalTitle.textContent = title || 'Ghi chú'; const closeModalBtn = document.createElement('button'); closeModalBtn.classList.add('close-modal-btn'); closeModalBtn.innerHTML = '&times;'; closeModalBtn.title = 'Đóng (Esc)'; closeModalBtn.setAttribute('aria-label', 'Đóng cửa sổ xem ghi chú'); modalHeader.appendChild(modalTitle); modalHeader.appendChild(closeModalBtn); const modalBody = document.createElement('div'); modalBody.classList.add('modal-body'); modalBody.textContent = noteText || ''; modalContent.appendChild(modalHeader); modalContent.appendChild(modalBody); modal.appendChild(modalContent); document.body.appendChild(modal); requestAnimationFrame(() => { modal.classList.add('visible'); modal.classList.remove('hidden'); }); closeModalBtn.focus(); const closeFunc = () => { modal.classList.remove('visible'); modal.addEventListener('transitionend', () => { modal.remove(); document.removeEventListener('keydown', handleThisModalKeyDown); }, { once: true }); }; const handleThisModalKeyDown = (event) => { if (!modal.classList.contains('visible')) { document.removeEventListener('keydown', handleThisModalKeyDown); return; } if (event.key === 'Escape') { closeFunc(); } if (event.key === 'Tab') { const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (focusableElements.length === 0) return; const firstElement = focusableElements[0]; const lastElement = focusableElements[focusableElements.length - 1]; if (event.shiftKey) { if (document.activeElement === firstElement) { lastElement.focus(); event.preventDefault(); } } else { if (document.activeElement === lastElement) { firstElement.focus(); event.preventDefault(); } } } }; closeModalBtn.addEventListener('click', closeFunc); modal.addEventListener('click', (event) => { if (event.target === modal) closeFunc(); }); document.addEventListener('keydown', handleThisModalKeyDown); };

// =====================================================================
//  Note Element Rendering Helper Functions (Giữ nguyên)
// =====================================================================
function applyNoteColor(noteElement, note) { /* Logic giữ nguyên */ NOTE_COLORS.forEach(color => { if (color.value) noteElement.classList.remove(color.value); }); const noteColor = note?.color; if (noteColor && NOTE_COLORS.some(c => c.value === noteColor)) { noteElement.classList.add(noteColor); } const colorData = NOTE_COLORS.find(c => c.value === noteColor); noteElement.style.borderLeftColor = colorData?.hex && colorData.value ? colorData.hex : 'transparent'; noteElement.style.borderColor = ''; }
function applyPinnedStatus(noteElement, note, isViewingArchived, isViewingTrash) { /* Logic giữ nguyên */ const isPinned = note?.pinned ?? false; const shouldShowPin = isPinned && !isViewingArchived && !isViewingTrash && currentNotebookId === 'all'; const existingBookmark = noteElement.querySelector('.pinned-bookmark-icon'); noteElement.classList.toggle('pinned-note', shouldShowPin); if (shouldShowPin) { if (!existingBookmark) { const bookmarkIcon = document.createElement('span'); bookmarkIcon.classList.add('pinned-bookmark-icon'); bookmarkIcon.innerHTML = '&#128278;'; bookmarkIcon.setAttribute('aria-hidden', 'true'); noteElement.insertBefore(bookmarkIcon, noteElement.firstChild); } else { existingBookmark.style.display = 'inline-block'; } } else { if (existingBookmark) { existingBookmark.style.display = 'none'; } } }
function createNoteTitleElement(note, filter) { /* Logic giữ nguyên */ const title = note?.title?.trim(); if (!title) return null; const titleElement = document.createElement('h3'); titleElement.classList.add('note-title'); let titleHTML = escapeHTML(title); const lowerCaseFilter = (filter || '').toLowerCase().trim(); const isTagSearch = lowerCaseFilter.startsWith('#'); if (!isTagSearch && lowerCaseFilter) { try { const highlightRegex = new RegExp(`(${escapeRegExp(lowerCaseFilter)})`, 'gi'); titleHTML = titleHTML.replace(highlightRegex, '<mark>$1</mark>'); } catch(e) { console.warn("Lỗi highlight tiêu đề:", e); } } titleElement.innerHTML = titleHTML; return titleElement; }
function createNoteContentElement(note, filter, noteElementForOverflowCheck) { /* Logic giữ nguyên */ const textContent = note?.text ?? ''; const contentElement = document.createElement('div'); contentElement.classList.add('note-content'); let displayHTML = escapeHTML(textContent); const lowerCaseFilter = (filter || '').toLowerCase().trim(); const isTagSearchContent = lowerCaseFilter.startsWith('#'); if (!isTagSearchContent && lowerCaseFilter) { try { const highlightRegexContent = new RegExp(`(${escapeRegExp(lowerCaseFilter)})`, 'gi'); displayHTML = displayHTML.replace(highlightRegexContent, '<mark>$1</mark>'); } catch (e) { console.warn("Lỗi highlight nội dung:", e); } } displayHTML = displayHTML.replace(/\n/g, '<br>'); contentElement.innerHTML = displayHTML; requestAnimationFrame(() => { if (!noteElementForOverflowCheck || !noteElementForOverflowCheck.isConnected) return; const currentContentEl = noteElementForOverflowCheck.querySelector('.note-content'); if (!currentContentEl) return; const existingBtn = noteElementForOverflowCheck.querySelector('.read-more-btn'); if (existingBtn) existingBtn.remove(); const hasOverflow = currentContentEl.scrollHeight > currentContentEl.clientHeight + 2; currentContentEl.classList.toggle('has-overflow', hasOverflow); if (hasOverflow) { const readMoreBtn = document.createElement('button'); readMoreBtn.textContent = 'Xem thêm'; readMoreBtn.classList.add('read-more-btn'); readMoreBtn.type = 'button'; readMoreBtn.title = 'Xem toàn bộ nội dung ghi chú'; readMoreBtn.addEventListener('click', (e) => { e.stopPropagation(); showFullNoteModal(note.title, note.text); }); noteElementForOverflowCheck.insertBefore(readMoreBtn, currentContentEl.nextSibling); } }); return contentElement; }
function createNoteTagsElement(note) { /* Logic giữ nguyên */ const tags = note?.tags; if (!tags || tags.length === 0) return null; const tagsElement = document.createElement('div'); tagsElement.classList.add('note-tags'); tags.forEach(tag => { const tagBadge = document.createElement('button'); tagBadge.classList.add('tag-badge'); tagBadge.textContent = `#${tag}`; tagBadge.dataset.tag = tag; tagBadge.type = 'button'; tagBadge.title = `Lọc theo tag: ${tag}`; tagsElement.appendChild(tagBadge); }); return tagsElement; }
function createNoteTimestampElement(note) { /* Logic giữ nguyên */ const timestampElement = document.createElement('small'); timestampElement.classList.add('note-timestamp'); const creationDate = formatTimestamp(note.createdAt || note.id); let timestampText = `Tạo: ${creationDate}`; if (note.lastModified && formatTimestamp(note.lastModified) !== creationDate) { const modifiedDate = formatTimestamp(note.lastModified); timestampText += ` (Sửa: ${modifiedDate})`; } if (isViewingTrash && note.deletedTimestamp) { const deletedDate = formatTimestamp(note.deletedTimestamp); timestampText += ` (Xóa: ${deletedDate})`; } timestampElement.textContent = timestampText; return timestampElement; }
function createMainViewNoteActions(note) { /* Logic giữ nguyên */ const fragment = document.createDocumentFragment(); const moveBtn = document.createElement('button'); moveBtn.classList.add('move-note-btn'); moveBtn.innerHTML = '&#128194;'; moveBtn.title = 'Di chuyển đến Sổ tay'; moveBtn.setAttribute('aria-label', 'Di chuyển ghi chú'); fragment.appendChild(moveBtn); const pinBtn = document.createElement('button'); pinBtn.classList.add('pin-btn'); pinBtn.innerHTML = '&#128204;'; pinBtn.title = note.pinned ? "Bỏ ghim" : "Ghim ghi chú"; pinBtn.setAttribute('aria-label', note.pinned ? "Bỏ ghim ghi chú" : "Ghim ghi chú"); pinBtn.setAttribute('aria-pressed', note.pinned ? 'true' : 'false'); if (note.pinned) pinBtn.classList.add('pinned'); if(currentNotebookId !== 'all') pinBtn.style.display = 'none'; fragment.appendChild(pinBtn); const editBtn = document.createElement('button'); editBtn.classList.add('edit-btn'); editBtn.textContent = 'Sửa'; editBtn.title = 'Sửa ghi chú'; editBtn.setAttribute('aria-label', 'Sửa ghi chú'); fragment.appendChild(editBtn); const archiveBtn = document.createElement('button'); archiveBtn.classList.add('archive-btn'); archiveBtn.innerHTML = '&#128451;'; archiveBtn.title = 'Lưu trữ ghi chú'; archiveBtn.setAttribute('aria-label', 'Lưu trữ ghi chú'); fragment.appendChild(archiveBtn); const deleteBtn = document.createElement('button'); deleteBtn.classList.add('delete-btn'); deleteBtn.textContent = 'Xóa'; deleteBtn.title = 'Chuyển vào thùng rác'; deleteBtn.setAttribute('aria-label', 'Chuyển vào thùng rác'); fragment.appendChild(deleteBtn); return fragment; }
function createArchiveViewNoteActions(note) { /* Logic giữ nguyên */ const fragment = document.createDocumentFragment(); const unarchiveBtn = document.createElement('button'); unarchiveBtn.classList.add('unarchive-btn'); unarchiveBtn.innerHTML = '&#x1F5C4;&#xFE0F;'; unarchiveBtn.title = 'Khôi phục từ Lưu trữ'; unarchiveBtn.setAttribute('aria-label', 'Khôi phục từ Lưu trữ'); fragment.appendChild(unarchiveBtn); const deleteBtn = document.createElement('button'); deleteBtn.classList.add('delete-btn'); deleteBtn.textContent = 'Xóa'; deleteBtn.title = 'Chuyển vào thùng rác'; deleteBtn.setAttribute('aria-label', 'Chuyển vào thùng rác'); fragment.appendChild(deleteBtn); return fragment; }
function createTrashViewNoteActions(note) { /* Logic giữ nguyên */ const fragment = document.createDocumentFragment(); const restoreBtn = document.createElement('button'); restoreBtn.classList.add('restore-btn'); restoreBtn.innerHTML = '&#x21A9;&#xFE0F;'; restoreBtn.title = 'Khôi phục ghi chú'; restoreBtn.setAttribute('aria-label', 'Khôi phục ghi chú'); fragment.appendChild(restoreBtn); const deletePermanentBtn = document.createElement('button'); deletePermanentBtn.classList.add('delete-permanent-btn'); deletePermanentBtn.textContent = 'Xóa VV'; deletePermanentBtn.title = 'Xóa ghi chú vĩnh viễn'; deletePermanentBtn.setAttribute('aria-label', 'Xóa ghi chú vĩnh viễn'); fragment.appendChild(deletePermanentBtn); return fragment; }
function createNoteActionsElement(note) { /* Logic giữ nguyên */ const actionsElement = document.createElement('div'); actionsElement.classList.add('note-actions'); let actionButtonsFragment; if (isViewingTrash) { actionButtonsFragment = createTrashViewNoteActions(note); } else if (isViewingArchived) { actionButtonsFragment = createArchiveViewNoteActions(note); } else { actionButtonsFragment = createMainViewNoteActions(note); } actionsElement.appendChild(actionButtonsFragment); return actionsElement; }

// =====================================================================
//  Core Note Rendering Function (Giữ nguyên)
// =====================================================================
const renderNoteElement = (note) => { const noteElement = document.createElement('div'); noteElement.classList.add('note'); noteElement.dataset.id = note.id; applyNoteColor(noteElement, note); applyPinnedStatus(noteElement, note, isViewingArchived, isViewingTrash); const titleEl = createNoteTitleElement(note, searchInput.value); if(titleEl) noteElement.appendChild(titleEl); const contentEl = createNoteContentElement(note, searchInput.value, noteElement); if(contentEl) noteElement.appendChild(contentEl); const tagsEl = createNoteTagsElement(note); if(tagsEl) noteElement.appendChild(tagsEl); const timestampEl = createNoteTimestampElement(note); if(timestampEl) noteElement.appendChild(timestampEl); const actionsEl = createNoteActionsElement(note); if(actionsEl) noteElement.appendChild(actionsEl); return noteElement; };

// =====================================================================
//  Drag & Drop (TODO: Firestore)
// =====================================================================
const handleDragEnd = async (evt) => { /* TODO */ console.warn("handleDragEnd needs Firestore implementation for saving order"); };
const initSortable = () => { /* Logic giữ nguyên */ if (sortableInstance) { sortableInstance.destroy(); sortableInstance = null; } const canInitSortable = typeof Sortable === 'function' && notesContainer && notesContainer.children.length > 0 && !notesContainer.querySelector('.empty-state') && !isViewingArchived && !isViewingTrash && currentUser; if (canInitSortable) { sortableInstance = new Sortable(notesContainer, { animation: 150, handle: '.note', filter: 'input, textarea, button, .tag-badge, .note-content a, .read-more-btn, .color-swatch-btn', preventOnFilter: true, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag', onEnd: handleDragEnd, delay: 50, delayOnTouchOnly: true }); } else if (typeof Sortable !== 'function' && !isViewingArchived && !isViewingTrash && notes.some(n => !n.archived && !n.deleted)) { console.warn("Thư viện Sortable.js chưa được tải."); } };

// =====================================================================
//  Tag Handling (Giữ nguyên)
// =====================================================================
const getAllUniqueTags = () => { const allTags = notes.reduce((acc, note) => { if (!note.deleted && !note.archived && note.tags && note.tags.length > 0) { const validTags = note.tags.map(t => t.trim()).filter(t => t); acc.push(...validTags); } return acc; }, []); return [...new Set(allTags)].sort((a, b) => a.localeCompare(b)); };
const showTagSuggestions = (inputElement, currentTagFragment, suggestions) => { /* Logic giữ nguyên */ hideTagSuggestions(); if (suggestions.length === 0 || !currentTagFragment) return; activeTagInputElement = inputElement; const suggestionBox = document.createElement('div'); suggestionBox.id = SUGGESTION_BOX_ID; suggestionBox.classList.add('tag-suggestions'); suggestionBox.setAttribute('role', 'listbox'); inputElement.setAttribute('aria-controls', SUGGESTION_BOX_ID); suggestions.forEach((tag, index) => { const item = document.createElement('div'); item.classList.add('suggestion-item'); item.textContent = tag; item.setAttribute('role', 'option'); item.id = `suggestion-${index}`; item.tabIndex = -1; item.addEventListener('mousedown', (e) => { e.preventDefault(); const currentValue = inputElement.value; const lastCommaIndex = currentValue.lastIndexOf(','); let baseValue = ''; if (lastCommaIndex !== -1) { baseValue = currentValue.substring(0, lastCommaIndex + 1).trimStart() + (currentValue[lastCommaIndex+1] === ' ' ? '' : ' '); } inputElement.value = baseValue + tag + ', '; hideTagSuggestions(); inputElement.focus(); inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length); inputElement.dispatchEvent(new Event('input', { bubbles: true })); }); suggestionBox.appendChild(item); }); const inputRect = inputElement.getBoundingClientRect(); document.body.appendChild(suggestionBox); suggestionBox.style.position = 'absolute'; suggestionBox.style.top = `${inputRect.bottom + window.scrollY}px`; suggestionBox.style.left = `${inputRect.left + window.scrollX}px`; suggestionBox.style.minWidth = `${inputRect.width}px`; suggestionBox.style.width = 'auto'; setTimeout(() => { document.addEventListener('mousedown', handleClickOutsideSuggestions); }, 0); };
const handleTagInput = (event) => { /* Logic giữ nguyên */ const inputElement = event.target; const value = inputElement.value; const cursorPosition = inputElement.selectionStart; const lastCommaIndexBeforeCursor = value.substring(0, cursorPosition).lastIndexOf(','); const currentTagFragment = value.substring(lastCommaIndexBeforeCursor + 1, cursorPosition).trim().toLowerCase(); if (currentTagFragment.length >= 1) { const allTags = getAllUniqueTags(); const precedingTagsString = value.substring(0, lastCommaIndexBeforeCursor + 1); const currentEnteredTags = parseTags(precedingTagsString); const filteredSuggestions = allTags.filter(tag => tag.toLowerCase().startsWith(currentTagFragment) && !currentEnteredTags.includes(tag) ); showTagSuggestions(inputElement, currentTagFragment, filteredSuggestions); } else { hideTagSuggestions(); } };
const handleTagInputBlur = (event) => { /* Logic giữ nguyên */ setTimeout(() => { const suggestionBox = document.getElementById(SUGGESTION_BOX_ID); if (event.relatedTarget && suggestionBox && suggestionBox.contains(event.relatedTarget)) { return; } hideTagSuggestions(); }, 150); };
const handleTagInputKeydown = (event) => { /* Logic giữ nguyên */ const suggestionBox = document.getElementById(SUGGESTION_BOX_ID); const inputElement = event.target; if (suggestionBox && suggestionBox.children.length > 0) { const items = Array.from(suggestionBox.children); let currentFocusIndex = items.findIndex(item => item === document.activeElement); switch (event.key) { case 'ArrowDown': event.preventDefault(); currentFocusIndex = (currentFocusIndex + 1) % items.length; items[currentFocusIndex].focus(); inputElement.setAttribute('aria-activedescendant', items[currentFocusIndex].id); break; case 'ArrowUp': event.preventDefault(); currentFocusIndex = (currentFocusIndex - 1 + items.length) % items.length; items[currentFocusIndex].focus(); inputElement.setAttribute('aria-activedescendant', items[currentFocusIndex].id); break; case 'Enter': if (document.activeElement?.classList.contains('suggestion-item')) { event.preventDefault(); document.activeElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); } else { hideTagSuggestions(); } break; case 'Escape': event.preventDefault(); hideTagSuggestions(); break; case 'Tab': if (document.activeElement?.classList.contains('suggestion-item')) { event.preventDefault(); document.activeElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); } else { hideTagSuggestions(); } break; } } };

// =====================================================================
//  Template UI Handlers (Updated for Firestore)
// =====================================================================
const renderTemplateList = () => { templateListContainer.innerHTML = ''; if (templates.length === 0) { templateListContainer.innerHTML = `<p class="empty-state">Chưa có mẫu nào.</p>`; return; } templates.sort((a, b) => a.name.localeCompare(b.name)).forEach(template => { const item = document.createElement('div'); item.classList.add('template-list-item'); item.dataset.id = template.id; item.innerHTML = ` <span>${escapeHTML(template.name)}</span> <div class="template-item-actions"> <button class="edit-template-btn modal-button secondary small-button" data-id="${template.id}" title="Sửa mẫu ${escapeHTML(template.name)}">Sửa</button> <button class="delete-template-btn modal-button danger small-button" data-id="${template.id}" title="Xóa mẫu ${escapeHTML(template.name)}">Xóa</button> </div> `; item.querySelector('.edit-template-btn').addEventListener('click', (e) => { e.stopPropagation(); showTemplateEditPanel(template.id); }); item.querySelector('.delete-template-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteTemplate(template.id); }); templateListContainer.appendChild(item); }); };
const showTemplateEditPanel = (templateId = null) => { /* Logic giữ nguyên */ templateListSection.classList.add('hidden'); templateEditPanel.classList.remove('hidden'); if (templateId !== null) { const template = templates.find(t => t.id === templateId); if (template) { templateEditTitle.textContent = "Sửa Mẫu"; templateEditId.value = template.id; templateEditName.value = template.name; templateEditTitleInput.value = template.title; templateEditText.value = template.text; templateEditTags.value = (template.tags || []).join(', '); } else { console.error("Không tìm thấy mẫu để sửa ID:", templateId); hideTemplateEditPanel(); return; } } else { templateEditTitle.textContent = "Tạo Mẫu Mới"; templateEditId.value = ''; templateEditName.value = ''; templateEditTitleInput.value = ''; templateEditText.value = ''; templateEditTags.value = ''; } templateEditName.focus(); };
const hideTemplateEditPanel = () => { /* Logic giữ nguyên */ templateEditPanel.classList.add('hidden'); templateListSection.classList.remove('hidden'); templateEditId.value = ''; templateEditName.value = ''; templateEditTitleInput.value = ''; templateEditText.value = ''; templateEditTags.value = ''; };
const showTemplateModal = () => { /* Logic giữ nguyên */ if (!currentUser) { alert("Vui lòng đăng nhập để quản lý mẫu."); return; } renderTemplateList(); hideTemplateEditPanel(); templateModal.classList.add('visible'); templateModal.classList.remove('hidden'); showAddTemplatePanelBtn.focus(); };
const hideTemplateModal = () => { /* Logic giữ nguyên */ templateModal.classList.remove('visible'); templateModal.addEventListener('transitionend', (e) => { if (e.target === templateModal) templateModal.classList.add('hidden'); }, { once: true }); };
const populateTemplateDropdown = () => { /* Logic giữ nguyên */ const currentSelection = templateSelect.value; templateSelect.innerHTML = '<option value="">-- Không dùng mẫu --</option>'; templates.sort((a, b) => a.name.localeCompare(b.name)).forEach(template => { const option = document.createElement('option'); option.value = template.id; option.textContent = escapeHTML(template.name); templateSelect.appendChild(option); }); if (templates.some(t => t.id === currentSelection)) { templateSelect.value = currentSelection; } else { templateSelect.value = ""; } };
const applyTemplate = () => { /* Logic giữ nguyên */ const selectedId = templateSelect.value; if (selectedId) { const template = templates.find(t => t.id === selectedId); if (template) { newNoteTitle.value = template.title; newNoteText.value = template.text; newNoteTags.value = (template.tags || []).join(', '); newNoteText.focus(); } } };

// =====================================================================
//  Notebook UI Handlers (Updated for Firestore)
// =====================================================================
const renderNotebookList = () => { notebookListContainer.innerHTML = ''; if (notebooks.length === 0) { notebookListContainer.innerHTML = `<p class="empty-state">Chưa có sổ tay nào.</p>`; return; } notebooks.sort((a, b) => a.name.localeCompare(b.name)).forEach(notebook => { const item = document.createElement('div'); item.classList.add('notebook-list-item'); item.dataset.id = notebook.id; item.innerHTML = ` <span>${escapeHTML(notebook.name)}</span> <div class="notebook-item-actions"> <button class="edit-notebook-btn modal-button secondary small-button" data-id="${notebook.id}" title="Sửa sổ tay ${escapeHTML(notebook.name)}">Sửa</button> <button class="delete-notebook-btn modal-button danger small-button" data-id="${notebook.id}" title="Xóa sổ tay ${escapeHTML(notebook.name)}">Xóa</button> </div> `; item.querySelector('.edit-notebook-btn').addEventListener('click', (e) => { e.stopPropagation(); showNotebookEditPanel(notebook.id); }); item.querySelector('.delete-notebook-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteNotebook(notebook.id); }); notebookListContainer.appendChild(item); }); };
const showNotebookEditPanel = (notebookId = null) => { /* Logic giữ nguyên */ notebookListSection.classList.add('hidden'); notebookEditPanel.classList.remove('hidden'); if (notebookId !== null) { const notebook = notebooks.find(nb => nb.id === notebookId); if (notebook) { notebookEditTitle.textContent = "Sửa Sổ tay"; notebookEditId.value = notebook.id; notebookEditName.value = notebook.name; } else { console.error("Không tìm thấy sổ tay để sửa ID:", notebookId); hideNotebookEditPanel(); return; } } else { notebookEditTitle.textContent = "Tạo Sổ tay Mới"; notebookEditId.value = ''; notebookEditName.value = ''; } notebookEditName.focus(); };
const hideNotebookEditPanel = () => { /* Logic giữ nguyên */ notebookEditPanel.classList.add('hidden'); notebookListSection.classList.remove('hidden'); notebookEditId.value = ''; notebookEditName.value = ''; };
const showNotebookModal = () => { /* Logic giữ nguyên */ if (!currentUser) { alert("Vui lòng đăng nhập để quản lý sổ tay."); return; } renderNotebookList(); hideNotebookEditPanel(); notebookModal.classList.add('visible'); notebookModal.classList.remove('hidden'); showAddNotebookPanelBtn.focus(); };
const hideNotebookModal = () => { /* Logic giữ nguyên */ notebookModal.classList.remove('visible'); notebookModal.addEventListener('transitionend', (e) => { if (e.target === notebookModal) notebookModal.classList.add('hidden'); }, { once: true }); };

// =====================================================================
//  Notebook Tab Rendering (Updated for Firestore state)
// =====================================================================
const renderNotebookTabs = () => { if (!notebookTabsContainer) return; const addButton = notebookTabsContainer.querySelector('#add-notebook-tab-btn'); notebookTabsContainer.innerHTML = ''; const allNotesTab = document.createElement('button'); allNotesTab.classList.add('tab-button'); allNotesTab.dataset.notebookId = 'all'; allNotesTab.textContent = 'Tất cả Ghi chú'; if (currentNotebookId === 'all' && !isViewingArchived && !isViewingTrash) { allNotesTab.classList.add('active'); } notebookTabsContainer.appendChild(allNotesTab); notebooks.sort((a, b) => a.name.localeCompare(b.name)).forEach(notebook => { const tab = document.createElement('button'); tab.classList.add('tab-button'); tab.dataset.notebookId = notebook.id; tab.textContent = escapeHTML(notebook.name); if (currentNotebookId === notebook.id && !isViewingArchived && !isViewingTrash) { tab.classList.add('active'); } notebookTabsContainer.appendChild(tab); }); const finalAddButton = addButton || document.createElement('button'); if (!addButton) { finalAddButton.id = 'add-notebook-tab-btn'; finalAddButton.classList.add('add-tab-button'); finalAddButton.title = 'Thêm Sổ tay mới'; finalAddButton.textContent = '+'; finalAddButton.addEventListener('click', () => { if (!currentUser) { alert("Vui lòng đăng nhập để thêm sổ tay."); return; } showNotebookModal(); showNotebookEditPanel(); }); } if(notebookTabsContainer.contains(finalAddButton)) { notebookTabsContainer.removeChild(finalAddButton); } notebookTabsContainer.appendChild(finalAddButton); };

// =====================================================================
//  Other Panel/Import/Export (TODO: Firestore)
// =====================================================================
const showAddPanel = () => { /* Logic giữ nguyên */ if (!currentUser) { alert("Vui lòng đăng nhập để thêm ghi chú."); return; } const currentlyEditing = notesContainer.querySelector('.note .edit-input'); if (currentlyEditing) { alert("Vui lòng Lưu hoặc Hủy thay đổi ở ghi chú đang sửa trước khi sửa ghi chú khác."); currentlyEditing.closest('.note').querySelector('textarea.edit-input')?.focus(); return; } hideTagSuggestions(); addNotePanel.classList.remove('hidden'); showAddPanelBtn.classList.add('hidden'); templateSelect.value = ""; newNoteTitle.focus(); };
const hideAddPanel = () => { /* Logic giữ nguyên */ hideTagSuggestions(); addNotePanel.classList.add('hidden'); if (!notesContainer.querySelector('.note .edit-input') && currentUser) { showAddPanelBtn.classList.remove('hidden'); } newNoteTitle.value = ''; newNoteText.value = ''; newNoteTags.value = ''; templateSelect.value = ""; };
const exportNotes = async () => { /* TODO */ console.warn("exportNotes needs Firestore implementation"); alert("Chức năng xuất dữ liệu đang được phát triển cho phiên bản đám mây."); };
const importNotes = async (file) => { /* TODO */ console.warn("importNotes needs Firestore implementation"); alert("Chức năng nhập dữ liệu đang được phát triển cho phiên bản đám mây."); if(importFileInput) importFileInput.value = null; };

// =====================================================================
//  Note Filtering and Sorting Logic (Giữ nguyên)
// =====================================================================
const getFilteredNotes = (allNotes, filter) => { let viewFilteredNotes = allNotes.filter(note => { if (isViewingTrash) { return note.deleted; } else if (isViewingArchived) { return note.archived && !note.deleted; } else { return !note.deleted && !note.archived && (currentNotebookId === 'all' || note.notebookId === currentNotebookId); } }); if (filter) { const lowerCaseFilter = filter.toLowerCase().trim(); const isTagSearch = lowerCaseFilter.startsWith('#'); const tagSearchTerm = isTagSearch ? lowerCaseFilter.substring(1) : null; viewFilteredNotes = viewFilteredNotes.filter(note => { if (isTagSearch) { if (!tagSearchTerm) return true; return note.tags && note.tags.some(tag => tag.toLowerCase() === tagSearchTerm); } else { const noteTitleLower = (note.title || '').toLowerCase(); const noteTextLower = (note.text || '').toLowerCase(); const titleMatch = noteTitleLower.includes(lowerCaseFilter); const textMatch = noteTextLower.includes(lowerCaseFilter); const tagMatch = note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerCaseFilter)); return titleMatch || textMatch || tagMatch; } }); } return viewFilteredNotes; };
const sortNotes = (filteredNotes) => { if (isViewingTrash) { return filteredNotes.sort((a, b) => (b.deletedTimestamp?.seconds || 0) - (a.deletedTimestamp?.seconds || 0)); } else if (isViewingArchived) { return filteredNotes.sort((a, b) => (b.lastModified?.seconds || 0) - (a.lastModified?.seconds || 0)); } else { return filteredNotes.sort((a, b) => { if (currentNotebookId === 'all' && a.pinned !== b.pinned) { return b.pinned - a.pinned; } const timeA = a.lastModified?.seconds ?? (a.createdAt?.seconds ?? 0); const timeB = b.lastModified?.seconds ?? (b.createdAt?.seconds ?? 0); return timeB - timeA; }); } };

// =====================================================================
//  Core Display Function (Giữ nguyên)
// =====================================================================
const displayNotes = (filter = '') => { if (!currentUser) { notesContainer.innerHTML = '<p class="empty-state">Vui lòng đăng nhập để xem ghi chú.</p>'; if (sortableInstance) { sortableInstance.destroy(); sortableInstance = null; } showAddPanelBtn.classList.add('hidden'); notebookTabsContainer.innerHTML = ''; manageNotebooksBtn.classList.add('hidden'); manageTemplatesBtn.classList.add('hidden'); viewArchiveBtn.classList.add('hidden'); viewTrashBtn.classList.add('hidden'); exportNotesBtn.classList.add('hidden'); importNotesBtn.classList.add('hidden'); searchInput.classList.add('hidden'); archiveStatusIndicator.classList.add('hidden'); trashStatusIndicator.classList.add('hidden'); emptyTrashBtn.classList.add('hidden'); return; } manageNotebooksBtn.classList.remove('hidden'); manageTemplatesBtn.classList.remove('hidden'); viewArchiveBtn.classList.remove('hidden'); viewTrashBtn.classList.remove('hidden'); exportNotesBtn.classList.remove('hidden'); importNotesBtn.classList.remove('hidden'); searchInput.classList.remove('hidden'); if (!addNotePanel.classList.contains('hidden') || !notesContainer.querySelector('.note .edit-input')) { showAddPanelBtn.classList.remove('hidden'); } hideTagSuggestions(); const scrollY = window.scrollY; notesContainer.innerHTML = ''; const filteredNotes = getFilteredNotes(notes, filter.toLowerCase().trim()); const notesToDisplay = sortNotes(filteredNotes); viewArchiveBtn.classList.remove('viewing-archive'); viewTrashBtn.classList.remove('viewing-trash'); viewArchiveBtn.textContent = 'Xem Lưu trữ'; viewTrashBtn.textContent = 'Xem Thùng rác'; archiveStatusIndicator.classList.add('hidden'); trashStatusIndicator.classList.add('hidden'); emptyTrashBtn.classList.add('hidden'); if (isViewingTrash) { trashStatusIndicator.classList.remove('hidden'); viewTrashBtn.textContent = 'Xem Ghi chú'; viewTrashBtn.classList.add('viewing-trash'); if(notesToDisplay.length > 0) { emptyTrashBtn.classList.remove('hidden'); } renderNotebookTabs(); } else if (isViewingArchived) { archiveStatusIndicator.classList.remove('hidden'); viewArchiveBtn.textContent = 'Xem Ghi chú'; viewArchiveBtn.classList.add('viewing-archive'); renderNotebookTabs(); } else { renderNotebookTabs(); } if (notesToDisplay.length === 0) { let emptyMessage = ''; if (isViewingTrash) { emptyMessage = filter ? 'Không tìm thấy ghi chú rác nào khớp.' : 'Thùng rác trống.'; } else if (isViewingArchived) { emptyMessage = filter ? 'Không tìm thấy ghi chú lưu trữ nào khớp.' : 'Lưu trữ trống.'; } else if (currentNotebookId === 'all') { emptyMessage = filter ? 'Không tìm thấy ghi chú nào khớp.' : 'Chưa có ghi chú nào. Nhấn "+" để thêm.'; } else { const currentNotebook = notebooks.find(nb => nb.id === currentNotebookId); const notebookName = currentNotebook ? escapeHTML(currentNotebook.name) : 'sổ tay này'; emptyMessage = filter ? `Không tìm thấy ghi chú nào khớp trong ${notebookName}.` : `Sổ tay "${notebookName}" trống. Nhấn "+" để thêm.`; } notesContainer.innerHTML = `<p class="empty-state">${emptyMessage}</p>`; if (sortableInstance) { sortableInstance.destroy(); sortableInstance = null; } } else { notesToDisplay.forEach(note => { const noteElement = renderNoteElement(note); notesContainer.appendChild(noteElement); }); initSortable(); } window.scrollTo({ top: scrollY, behavior: 'instant' }); };

// =====================================================================
//  Modal Handling Functions (Giữ nguyên)
// =====================================================================
const showSettingsModal = () => { /* Logic giữ nguyên */ applyAllAppearanceSettings(); settingsModal.classList.add('visible'); settingsModal.classList.remove('hidden'); closeSettingsModalBtn.focus(); };
const hideSettingsModal = () => { /* Logic giữ nguyên */ settingsModal.classList.remove('visible'); settingsModal.addEventListener('transitionend', (e) => { if (e.target === settingsModal) settingsModal.classList.add('hidden'); }, { once: true }); };

// --- Move Note Menu Functions (TODO: Firestore) ---
const closeMoveNoteMenu = () => { /* Logic giữ nguyên */ if (activeMoveMenu) { activeMoveMenu.remove(); activeMoveMenu = null; document.removeEventListener('click', handleOutsideMoveMenuClick, true); } };
const handleOutsideMoveMenuClick = (event) => { /* Logic giữ nguyên */ if (activeMoveMenu && !activeMoveMenu.contains(event.target) && !event.target.closest('.move-note-btn')) { closeMoveNoteMenu(); } };
const handleMoveNote = async (noteId, targetNotebookId) => { /* TODO */ console.warn("handleMoveNote needs Firestore implementation"); if (!currentUser) return; const newNotebookId = targetNotebookId === 'none' ? null : targetNotebookId; const note = notes.find(n => n.id === noteId); if (note && note.notebookId !== newNotebookId) { const success = await updateNoteData(noteId, { notebookId: newNotebookId }); if (!success) { alert("Lỗi khi di chuyển ghi chú. Vui lòng thử lại."); } } closeMoveNoteMenu(); };
const showMoveNoteMenu = (noteId, moveBtnElement) => { /* Logic giữ nguyên */ closeMoveNoteMenu(); const note = notes.find(n => n.id === noteId); if (!note || !currentUser) return; const menu = document.createElement('div'); menu.id = MOVE_NOTE_MENU_ID; menu.classList.add('move-note-menu'); const noNotebookBtn = document.createElement('button'); noNotebookBtn.textContent = '-- Không thuộc sổ tay nào --'; noNotebookBtn.dataset.targetNotebookId = 'none'; if (note.notebookId === null) { noNotebookBtn.classList.add('current-notebook'); noNotebookBtn.disabled = true; } noNotebookBtn.addEventListener('click', () => handleMoveNote(noteId, 'none')); menu.appendChild(noNotebookBtn); if (notebooks.length > 0) { menu.appendChild(document.createElement('hr')); } notebooks.sort((a, b) => a.name.localeCompare(b.name)).forEach(notebook => { const notebookBtn = document.createElement('button'); notebookBtn.textContent = escapeHTML(notebook.name); notebookBtn.dataset.targetNotebookId = notebook.id; if (note.notebookId === notebook.id) { notebookBtn.classList.add('current-notebook'); notebookBtn.disabled = true; } notebookBtn.addEventListener('click', () => handleMoveNote(noteId, notebook.id)); menu.appendChild(notebookBtn); }); document.body.appendChild(menu); activeMoveMenu = menu; const btnRect = moveBtnElement.getBoundingClientRect(); menu.style.position = 'absolute'; requestAnimationFrame(() => { const finalMenuHeight = menu.offsetHeight; const spaceAbove = btnRect.top; const spaceBelow = window.innerHeight - btnRect.bottom; if (spaceBelow >= finalMenuHeight + 10 || spaceBelow >= spaceAbove) { menu.style.top = `${btnRect.bottom + window.scrollY + 5}px`; } else { menu.style.top = `${btnRect.top + window.scrollY - finalMenuHeight - 5}px`; } menu.style.left = `${btnRect.left + window.scrollX}px`; if (btnRect.left + menu.offsetWidth > window.innerWidth - 10) { menu.style.left = `${window.innerWidth - menu.offsetWidth - 10 + window.scrollX}px`; } }); setTimeout(() => { document.addEventListener('click', handleOutsideMoveMenuClick, true); }, 0); };

// =====================================================================
//  Authentication Logic & UI Handlers (Giữ nguyên)
// =====================================================================
const displayAuthError = (message) => { authErrorElement.textContent = message; authErrorElement.classList.remove('hidden'); };
const clearAuthError = () => { authErrorElement.textContent = ''; authErrorElement.classList.add('hidden'); };
const showAuthForm = () => { hideAddPanel(); hideSettingsModal(); hideTemplateModal(); hideNotebookModal(); authContainer.classList.remove('hidden'); authButton.classList.add('hidden'); authEmailInput.focus(); clearAuthError(); };
const hideAuthForm = () => { authContainer.classList.add('hidden'); if (currentUser) { authButton.classList.remove('hidden'); } else { authButton.textContent = 'Đăng nhập'; authButton.classList.remove('logout'); authButton.classList.remove('hidden'); } authEmailInput.value = ''; authPasswordInput.value = ''; clearAuthError(); };
const handleLogin = async () => { if (!auth) return; const email = authEmailInput.value.trim(); const password = authPasswordInput.value.trim(); clearAuthError(); if (!email || !password) { displayAuthError("Vui lòng nhập email và mật khẩu."); return; } loginBtn.disabled = true; registerBtn.disabled = true; loginBtn.textContent = 'Đang đăng nhập...'; try { const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'); await signInWithEmailAndPassword(auth, email, password); console.log("Login successful"); } catch (error) { console.error("Login Error:", error); let message = "Đăng nhập thất bại. Vui lòng thử lại."; if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') { message = "Email hoặc mật khẩu không đúng."; } else if (error.code === 'auth/invalid-email') { message = "Địa chỉ email không hợp lệ."; } displayAuthError(message); } finally { loginBtn.disabled = false; registerBtn.disabled = false; loginBtn.textContent = 'Đăng nhập'; } };
const handleRegister = async () => { if (!auth) return; const email = authEmailInput.value.trim(); const password = authPasswordInput.value.trim(); clearAuthError(); if (!email || !password) { displayAuthError("Vui lòng nhập email và mật khẩu."); return; } if (password.length < 6) { displayAuthError("Mật khẩu phải có ít nhất 6 ký tự."); return; } loginBtn.disabled = true; registerBtn.disabled = true; registerBtn.textContent = 'Đang đăng ký...'; try { const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'); await createUserWithEmailAndPassword(auth, email, password); console.log("Registration successful"); } catch (error) { console.error("Registration Error:", error); let message = "Đăng ký thất bại. Vui lòng thử lại."; if (error.code === 'auth/email-already-in-use') { message = "Địa chỉ email này đã được sử dụng."; } else if (error.code === 'auth/invalid-email') { message = "Địa chỉ email không hợp lệ."; } else if (error.code === 'auth/weak-password') { message = "Mật khẩu quá yếu."; } displayAuthError(message); } finally { loginBtn.disabled = false; registerBtn.disabled = false; registerBtn.textContent = 'Đăng ký'; } };
const handleLogout = async () => { if (!auth) return; authButton.disabled = true; authButton.textContent = 'Đang đăng xuất...'; try { const { signOut } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'); await signOut(auth); console.log("Logout successful"); } catch (error) { console.error("Logout Error:", error); alert("Đăng xuất thất bại. Vui lòng thử lại."); } finally { authButton.disabled = false; } };
const setupAuthListeners = () => { if (authButton) { authButton.addEventListener('click', () => { if (currentUser) { handleLogout(); } else { showAuthForm(); } }); } if (loginBtn) { loginBtn.addEventListener('click', handleLogin); } if (registerBtn) { registerBtn.addEventListener('click', handleRegister); } };

// =====================================================================
//  Firestore Listener Management (Updated)
// =====================================================================
const unsubscribeListeners = () => {
    if (notebooksListener) {
        console.log("Unsubscribing notebooks listener.");
        notebooksListener();
        notebooksListener = null;
    }
    if (templatesListener) {
        console.log("Unsubscribing templates listener.");
        templatesListener();
        templatesListener = null;
    }
    if (notesListener) {
        console.log("Unsubscribing notes listener.");
        notesListener();
        notesListener = null;
    }
};
const loadUserDataFromFirestore = () => {
    if (!currentUser) return;
    console.log("Loading user data from Firestore...");
    unsubscribeListeners();
    loadNotebooks();
    loadTemplates();
    // loadNotes(); // TODO: Implement in next step
};

// =====================================================================
//  Authentication State Change Handler (Updated)
// =====================================================================
const handleAuthStateChanged = (user) => {
    if (user) {
        console.log("Auth State Changed: Signed In -", user.uid);
        if (currentUser?.uid === user.uid) { console.log("Auth state unchanged."); return; }
        currentUser = user;
        currentUid = user.uid;
        userEmailSpan.textContent = user.email;
        userStatusElement.classList.remove('hidden');
        authButton.textContent = 'Đăng xuất';
        authButton.classList.add('logout');
        authButton.classList.remove('hidden');
        hideAuthForm();
        loadUserDataFromFirestore();
        notesContainer.innerHTML = '<p class="empty-state">Đang tải dữ liệu...</p>';
        searchInput.classList.remove('hidden');
    } else {
        console.log("Auth State Changed: Signed Out");
        if (!currentUser) { console.log("Auth state unchanged."); return; }
        unsubscribeListeners();
        currentUser = null;
        currentUid = null;
        notes = [];
        templates = [];
        notebooks = [];
        userStatusElement.classList.add('hidden');
        authButton.textContent = 'Đăng nhập';
        authButton.classList.remove('logout');
        authButton.classList.remove('hidden');
        hideAuthForm();
        displayNotes();
        searchInput.classList.add('hidden');
        renderNotebookTabs();
        renderNotebookList();
        renderTemplateList();
        populateTemplateDropdown();
    }
};

// =====================================================================
//  Event Listener Setup Functions (Updated)
// =====================================================================
const setupEventListeners = () => {
    setupThemeAndAppearanceListeners(); // Sửa lỗi typo ở đây
    setupHeaderActionListeners();
    setupAddNotePanelListeners();
    setupSearchListener();
    setupNoteActionListeners();
    setupTemplateModalListeners();
    setupNotebookListeners();
    setupTagInputListeners();
    setupGlobalListeners();
    setupAuthListeners();
};

// =====================================================================
//  Start the application (Giữ nguyên)
// =====================================================================
const initializeAppWithAuth = async () => {
    applyAllAppearanceSettings();
    setupEventListeners(); // Setup listener trước khi lắng nghe auth state

    if (!auth) {
        console.error("Firebase Auth is not initialized!");
        notesContainer.innerHTML = '<p class="empty-state error">Lỗi khởi tạo hệ thống xác thực.</p>';
        authButton.classList.add('hidden');
        return;
    }

    try {
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
        onAuthStateChanged(auth, handleAuthStateChanged);
    } catch (error) {
        console.error("Error setting up Auth listener:", error);
        notesContainer.innerHTML = '<p class="empty-state error">Lỗi theo dõi trạng thái đăng nhập.</p>';
        authButton.classList.add('hidden');
    }
};

initializeAppWithAuth(); // Bắt đầu ứng dụng

