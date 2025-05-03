// app.js

// 1. Import các hàm cần thiết từ Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    getFirestore,
    collection, addDoc, query, where, orderBy, onSnapshot,
    doc, updateDoc, deleteDoc, // deleteDoc sẽ dùng cho xóa vĩnh viễn
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


// 2. Đặt cấu hình Firebase của bạn vào đây
const firebaseConfig = {
  apiKey: "AIzaSyAktPkkbYkv3klCN4ol78nXcreoUjb1OII",
  authDomain: "ghichu-771982.firebaseapp.com",
  projectId: "ghichu-771982",
  storageBucket: "ghichu-771982.appspot.com",
  messagingSenderId: "345155950827",
  appId: "1:345155950827:web:f1cfe2c89cb5d59d5686ae"
};

// 3. Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// 4. Lấy tham chiếu đến các dịch vụ Firebase
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase Initialized and Configured!");


// ============================================================
// DOM ELEMENTS
// ============================================================
// Auth Elements
const authContainer = document.getElementById('auth-container');
const signinFormContainer = document.getElementById('signin-form-container');
const signupFormContainer = document.getElementById('signup-form-container');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const showSignupLink = document.getElementById('show-signup');
const showSigninLink = document.getElementById('show-signin');
const authErrorDiv = document.getElementById('auth-error');
// User Info Area Elements
const userInfoDiv = document.getElementById('user-info');
const userEmailDisplay = document.getElementById('user-email-display');
const signoutButton = document.getElementById('signout-button');
// View Toggle Elements
const viewToggleContainer = document.getElementById('view-toggle-container');
const showActiveNotesButton = document.getElementById('show-active-notes-button');
const showTrashButton = document.getElementById('show-trash-button');
// Notes Area Elements
const notesContainer = document.getElementById('notes-container');
const notesAreaTitle = document.getElementById('notes-area-title');
const addNoteFormContainer = document.getElementById('add-note-form-container'); // Cần để ẩn/hiện
const addNoteForm = document.getElementById('add-note-form');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const notesListDiv = document.getElementById('notes-list');

// ============================================================
// BIẾN TRẠNG THÁI VÀ HỦY LẮNG NGHE
// ============================================================
let currentUserId = null; // Lưu ID người dùng đang đăng nhập
let currentView = 'active'; // 'active' hoặc 'trash'
let unsubscribeActiveNotes = null; // Hủy lắng nghe ghi chú hoạt động
let unsubscribeTrashedNotes = null; // Hủy lắng nghe ghi chú trong thùng rác

// ============================================================
// HÀM HỖ TRỢ CHO NOTES UI
// ============================================================

// --- Hàm escape HTML ---
function escapeHTML(str) { /* ... giữ nguyên hàm này ... */ }
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}


// --- Hàm hiển thị một ghi chú lên giao diện (Cập nhật cho Thùng rác) ---
const renderNote = (id, noteData) => {
    const card = document.createElement('div');
    card.classList.add('note-card');
    card.setAttribute('data-id', id);
    card.setAttribute('data-status', noteData.status); // Thêm trạng thái vào thẻ

    // ---- Phần hiển thị tĩnh ----
    const titleDisplayHTML = `<h4 class="note-title-display">${escapeHTML(noteData.title)}</h4>`;
    const finalTitleDisplayHTML = noteData.title ? titleDisplayHTML : '';
    const contentDisplayHTML = `<p class="note-content-display">${escapeHTML(noteData.content)}</p>`;

    // ---- Phần input ẩn để chỉnh sửa (Chỉ thêm nếu là ghi chú active) ----
    let inputsHTML = '';
    if (noteData.status === 'active') {
        inputsHTML = `
            <input type="text" class="note-title-input" value="${escapeHTML(noteData.title)}" placeholder="Tiêu đề">
            <textarea class="note-content-input" rows="4" placeholder="Nội dung">${escapeHTML(noteData.content)}</textarea>
        `;
    }

    // ---- Timestamp ----
    let timestampHTML = '';
    const timestampToShow = noteData.status === 'trashed' ? noteData.updatedAt : noteData.createdAt; // Hiện updatedAt cho trash
    const label = noteData.status === 'trashed' ? 'Xóa lúc' : 'Tạo lúc';
    if (timestampToShow && typeof timestampToShow.toDate === 'function') {
        try {
             timestampHTML = `<span class="timestamp">${label}: ${timestampToShow.toDate().toLocaleString('vi-VN')}</span>`;
        } catch (e) { timestampHTML = `<span class="timestamp">${label}: (lỗi ngày)</span>`; }
    } else { timestampHTML = `<span class="timestamp">${label}: (không có dữ liệu)</span>`; }

    // ---- Các nút hành động (Tùy theo trạng thái) ----
    const deleteButtonHTML = `<button class="note-delete-button" data-id="${id}" title="Xóa ghi chú (vào thùng rác)">X</button>`; // Nút xóa mềm luôn ở góc
    let actionsHTML = '';
    if (noteData.status === 'active') {
        actionsHTML = `
            <div class="note-actions">
                <button class="note-edit-button card-button" data-id="${id}">Sửa</button>
                <button class="note-save-button card-button" data-id="${id}">Lưu</button>
                <button class="note-cancel-button card-button" data-id="${id}">Hủy</button>
            </div>
        `;
    } else if (noteData.status === 'trashed') {
        actionsHTML = `
            <div class="note-actions">
                <button class="note-restore-button card-button" data-id="${id}">Khôi phục</button>
                <button class="note-delete-perm-button card-button" data-id="${id}">Xóa vĩnh viễn</button>
            </div>
        `;
    }

    // ---- Kết hợp tất cả ----
    card.innerHTML = `
        ${noteData.status === 'active' ? deleteButtonHTML : ''} ${finalTitleDisplayHTML}
        ${contentDisplayHTML}
        ${inputsHTML} ${timestampHTML}
        ${actionsHTML} `;

    notesListDiv.prepend(card); // Thêm vào đầu danh sách
};

// --- Hàm xóa tất cả ghi chú khỏi giao diện ---
const clearNotesUI = () => { /* ... giữ nguyên hàm này ... */ };
const clearNotesUI = () => {
    notesListDiv.innerHTML = '';
};


// ============================================================
// LOGIC TẢI GHI CHÚ (Active & Trashed)
// ============================================================

// --- Hàm tải và lắng nghe ghi chú HOẠT ĐỘNG ---
const loadNotes = (userId) => {
    console.log(`Attempting to load ACTIVE notes for user: ${userId}`);
    clearNotesUI();
    notesListDiv.innerHTML = '<p>Đang tải ghi chú hoạt động...</p>';
    const notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', userId),
        where('status', '==', 'active'), // LỌC ACTIVE
        orderBy('createdAt', 'desc')
    );
    // Hủy lắng nghe cũ (của view này) nếu có
    if (unsubscribeActiveNotes) {
        console.log("Unsubscribing previous ACTIVE notes listener.");
        unsubscribeActiveNotes();
    }
    unsubscribeActiveNotes = onSnapshot(notesQuery, (querySnapshot) => {
        console.log(`Firestore snapshot received: ${querySnapshot.size} active notes.`);
        clearNotesUI();
        if (querySnapshot.empty) {
            notesListDiv.innerHTML = '<p>Bạn chưa có ghi chú nào đang hoạt động.</p>';
        } else {
            querySnapshot.forEach((doc) => { renderNote(doc.id, doc.data()); });
        }
    }, (error) => {
        console.error("Error listening to ACTIVE Firestore notes: ", error);
        clearNotesUI();
        notesListDiv.innerHTML = `<p style="color: red;">Lỗi tải ghi chú hoạt động: ${error.message}.</p>`;
    });
    console.log("ACTIVE notes listener attached.");
};

// --- Hàm tải và lắng nghe ghi chú TRONG THÙNG RÁC ---
const loadTrashedNotes = (userId) => {
    console.log(`Attempting to load TRASHED notes for user: ${userId}`);
    clearNotesUI();
    notesListDiv.innerHTML = '<p>Đang tải ghi chú trong thùng rác...</p>';
    const trashQuery = query(
        collection(db, 'notes'),
        where('userId', '==', userId),
        where('status', '==', 'trashed'), // LỌC TRASHED
        orderBy('updatedAt', 'desc')     // Sắp xếp theo ngày xóa (updatedAt khi chuyển status)
    );
    // Hủy lắng nghe cũ (của view này) nếu có
    if (unsubscribeTrashedNotes) {
        console.log("Unsubscribing previous TRASHED notes listener.");
        unsubscribeTrashedNotes();
    }
    unsubscribeTrashedNotes = onSnapshot(trashQuery, (querySnapshot) => {
        console.log(`Firestore snapshot received: ${querySnapshot.size} trashed notes.`);
        clearNotesUI();
        if (querySnapshot.empty) {
            notesListDiv.innerHTML = '<p>Thùng rác trống.</p>';
        } else {
            querySnapshot.forEach((doc) => { renderNote(doc.id, doc.data()); });
        }
    }, (error) => {
        console.error("Error listening to TRASHED Firestore notes: ", error);
        clearNotesUI();
        notesListDiv.innerHTML = `<p style="color: red;">Lỗi tải thùng rác: ${error.message}.</p>`;
    });
    console.log("TRASHED notes listener attached.");
};

// --- Hàm hủy tất cả các listener ---
const unsubscribeAllNotes = () => {
    if (unsubscribeActiveNotes) {
        console.log("Unsubscribing ACTIVE notes listener.");
        unsubscribeActiveNotes();
        unsubscribeActiveNotes = null;
    }
    if (unsubscribeTrashedNotes) {
        console.log("Unsubscribing TRASHED notes listener.");
        unsubscribeTrashedNotes();
        unsubscribeTrashedNotes = null;
    }
};


// ============================================================
// XỬ LÝ HÀNH ĐỘNG (Thêm, Sửa, Lưu, Hủy, Xóa mềm, Khôi phục, Xóa hẳn)
// ============================================================

// --- Xử lý thêm ghi chú mới (Không đổi) ---
addNoteForm.addEventListener('submit', (e) => { /* ... giữ nguyên hàm này ... */ });
addNoteForm.addEventListener('submit', (e) => {
    e.preventDefault(); const title = noteTitleInput.value.trim(); const content = noteContentInput.value.trim(); const user = auth.currentUser;
    if (!user) { authErrorDiv.textContent = "Lỗi: Bạn cần đăng nhập để thêm ghi chú."; return; } if (!content) { alert("Nội dung ghi chú không được để trống."); return; }
    const submitButton = addNoteForm.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'Đang thêm...';
    const newNote = { userId: user.uid, title: title, content: content, status: 'active', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    addDoc(collection(db, 'notes'), newNote)
        .then(() => { console.log("Ghi chú đã được thêm"); addNoteForm.reset(); })
        .catch((error) => { console.error("Lỗi khi thêm ghi chú: ", error); alert(`Lỗi thêm ghi chú: ${error.message}`); })
        .finally(() => { submitButton.disabled = false; submitButton.textContent = 'Thêm Ghi Chú'; });
});


// --- Listener chính cho danh sách ghi chú (Cập nhật cho các nút mới) ---
notesListDiv.addEventListener('click', (e) => {
    const target = e.target;
    const card = target.closest('.note-card');
    if (!card) return;
    const noteId = card.getAttribute('data-id');

    // --- Sửa ---
    if (target.classList.contains('note-edit-button')) {
        const titleInput = card.querySelector('.note-title-input');
        const contentInput = card.querySelector('.note-content-input');
        const currentTitle = card.querySelector('.note-title-display')?.textContent || '';
        const currentContent = card.querySelector('.note-content-display')?.textContent || '';
        if(titleInput) titleInput.value = currentTitle;
        if(contentInput) contentInput.value = currentContent;
        card.classList.add('is-editing');
        if(contentInput) contentInput.focus();
    }
    // --- Lưu ---
    else if (target.classList.contains('note-save-button')) {
        const titleInput = card.querySelector('.note-title-input');
        const contentInput = card.querySelector('.note-content-input');
        const newTitle = titleInput ? titleInput.value.trim() : '';
        const newContent = contentInput ? contentInput.value.trim() : '';
        if (!newContent) { alert("Nội dung không được trống."); return; }
        target.disabled = true; target.textContent = 'Đang lưu...';
        const noteRef = doc(db, 'notes', noteId);
        updateDoc(noteRef, { title: newTitle, content: newContent, updatedAt: serverTimestamp() })
            .then(() => { console.log(`Note ${noteId} updated.`); card.classList.remove('is-editing'); })
            .catch((error) => { console.error("Lỗi cập nhật: ", error); alert(`Lỗi lưu: ${error.message}`); target.disabled = false; target.textContent = 'Lưu'; });
    }
    // --- Hủy ---
    else if (target.classList.contains('note-cancel-button')) {
        card.classList.remove('is-editing');
    }
    // --- Xóa mềm (Nút X góc trên) ---
    else if (target.classList.contains('note-delete-button')) {
         if (card) card.style.opacity = '0.5';
        if (confirm("Chuyển ghi chú này vào thùng rác?")) {
            const noteRef = doc(db, 'notes', noteId);
            updateDoc(noteRef, { status: 'trashed', updatedAt: serverTimestamp() })
                .then(() => { console.log(`Note ${noteId} moved to trash.`); }) // UI tự cập nhật
                .catch((error) => { console.error("Lỗi xóa mềm: ", error); alert(`Lỗi xóa: ${error.message}`); if (card) card.style.opacity = '1'; });
        } else { if (card) card.style.opacity = '1'; }
    }
    // --- Khôi phục ---
    else if (target.classList.contains('note-restore-button')) {
        console.log(`Restoring note: ${noteId}`);
        target.disabled = true; // Vô hiệu hóa nút
        const noteRef = doc(db, 'notes', noteId);
        updateDoc(noteRef, {
            status: 'active', // Đổi status về active
            updatedAt: serverTimestamp()
        })
        .then(() => { console.log(`Note ${noteId} restored.`); }) // UI tự cập nhật
        .catch((error) => {
            console.error("Lỗi khôi phục: ", error);
            alert(`Lỗi khôi phục: ${error.message}`);
            target.disabled = false; // Bật lại nút nếu lỗi
        });
    }
    // --- Xóa Vĩnh Viễn ---
    else if (target.classList.contains('note-delete-perm-button')) {
         if (card) card.style.opacity = '0.5';
        if (confirm("!!! BẠN CÓ CHẮC MUỐN XÓA VĨNH VIỄN GHI CHÚ NÀY?\nHành động này không thể hoàn tác.")) {
            console.log(`Permanently deleting note: ${noteId}`);
            target.disabled = true; // Vô hiệu hóa nút
            const noteRef = doc(db, 'notes', noteId);
            deleteDoc(noteRef) // Gọi hàm xóa của Firestore
                .then(() => { console.log(`Note ${noteId} permanently deleted.`); }) // UI tự cập nhật
                .catch((error) => {
                    console.error("Lỗi xóa vĩnh viễn: ", error);
                    alert(`Lỗi xóa vĩnh viễn: ${error.message}`);
                    target.disabled = false; // Bật lại nút nếu lỗi
                     if (card) card.style.opacity = '1';
                });
        } else {
             if (card) card.style.opacity = '1';
        }
    }
});

// ============================================================
// XỬ LÝ CHUYỂN ĐỔI VIEW (Active/Trash)
// ============================================================

const handleSwitchView = (targetView) => {
    if (targetView === currentView || !currentUserId) {
        console.log(`Already in view '${targetView}' or no user logged in.`);
        return; // Không làm gì nếu đã ở view đó hoặc chưa đăng nhập
    }
     console.log(`Switching view to: ${targetView}`);
    currentView = targetView; // Cập nhật trạng thái view hiện tại

    // Cập nhật trạng thái active của nút
    showActiveNotesButton.classList.toggle('active', currentView === 'active');
    showTrashButton.classList.toggle('active', currentView === 'trash');

    // Cập nhật tiêu đề khu vực
    notesAreaTitle.textContent = (currentView === 'active') ? 'Ghi chú của bạn' : 'Thùng rác';

    // Ẩn/hiện form thêm ghi chú
    addNoteFormContainer.style.display = (currentView === 'active') ? 'block' : 'none';

    // Hủy listener của view CŨ và tải dữ liệu cho view MỚI
    if (currentView === 'active') {
        unsubscribeAllNotes(); // Hủy cả 2 cho chắc trước khi gọi load mới
        loadNotes(currentUserId);
    } else { // currentView === 'trash'
        unsubscribeAllNotes();
        loadTrashedNotes(currentUserId);
    }
};

// Gắn listener cho các nút chuyển view
showActiveNotesButton.addEventListener('click', () => handleSwitchView('active'));
showTrashButton.addEventListener('click', () => handleSwitchView('trash'));


// ============================================================
// LOGIC XỬ LÝ AUTHENTICATION (Giữ nguyên phần xử lý form)
// ============================================================
showSignupLink.addEventListener('click', () => { /*...*/ });
showSigninLink.addEventListener('click', () => { /*...*/ });
signupForm.addEventListener('submit', (e) => { /*...*/ });
signinForm.addEventListener('submit', (e) => { /*...*/ });
// --- Xử lý Đăng Xuất (Cập nhật để hủy listener) ---
signoutButton.addEventListener('click', () => {
     console.log("Signing out...");
     unsubscribeAllNotes(); // *** Hủy tất cả listener trước khi đăng xuất ***
     currentUserId = null; // Reset userId
     currentView = 'active'; // Reset view về mặc định
    signOut(auth).then(() => { console.log('Đăng xuất thành công!'); })
                 .catch((error) => { console.error('Lỗi Đăng Xuất:', error); alert(`Lỗi đăng xuất: ${error.message}`); });
});


// ============================================================
// AUTH STATE LISTENER (Cập nhật để quản lý view và user)
// ============================================================
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed. User:', user ? user.uid : 'None');
    unsubscribeAllNotes(); // Luôn hủy listener cũ khi auth state thay đổi

    if (user) {
        // ---- User Đã Đăng Nhập ----
        currentUserId = user.uid; // Lưu lại userId
        currentView = 'active';   // Đặt view mặc định là active
        authContainer.style.display = 'none';
        userInfoDiv.style.display = 'block';
        viewToggleContainer.style.display = 'block'; // Hiện nút chuyển view
        notesContainer.style.display = 'block';
        userEmailDisplay.textContent = user.email;

        // Reset UI về trạng thái xem active notes
        showActiveNotesButton.classList.add('active');
        showTrashButton.classList.remove('active');
        notesAreaTitle.textContent = 'Ghi chú của bạn';
        addNoteFormContainer.style.display = 'block';

        loadNotes(currentUserId); // Tải ghi chú hoạt động

    } else {
        // ---- User Đã Đăng Xuất hoặc Chưa Đăng Nhập ----
        currentUserId = null; // Xóa userId
        authContainer.style.display = 'block';
        signinFormContainer.style.display = 'block';
        signupFormContainer.style.display = 'none';
        userInfoDiv.style.display = 'none';
        viewToggleContainer.style.display = 'none'; // Ẩn nút chuyển view
        notesContainer.style.display = 'none';
        userEmailDisplay.textContent = '';
        authErrorDiv.textContent = '';
        signinForm.reset();
        signupForm.reset();
        clearNotesUI(); // Xóa UI notes (unsubscribe đã gọi ở đầu hàm)
    }
});

console.log("App.js loaded. Trash bin logic included.");
// --- Bản sao đầy đủ của các hàm xử lý form Auth (Để đảm bảo không thiếu) ---
showSignupLink.addEventListener('click', () => { signinFormContainer.style.display = 'none'; signupFormContainer.style.display = 'block'; authErrorDiv.textContent = ''; signinForm.reset(); });
showSigninLink.addEventListener('click', () => { signupFormContainer.style.display = 'none'; signinFormContainer.style.display = 'block'; authErrorDiv.textContent = ''; signupForm.reset(); });
signupForm.addEventListener('submit', (e) => { e.preventDefault(); const email = signupForm['signup-email'].value; const password = signupForm['signup-password'].value; authErrorDiv.textContent = ''; const submitButton = signupForm.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'Đang đăng ký...'; createUserWithEmailAndPassword(auth, email, password).then((userCredential) => { console.log('Đăng ký thành công!', userCredential.user); signupForm.reset(); }).catch((error) => { console.error('Lỗi Đăng Ký:', error.code, error.message); switch (error.code) { case 'auth/email-already-in-use': authErrorDiv.textContent = 'Email này đã được sử dụng.'; break; case 'auth/weak-password': authErrorDiv.textContent = 'Mật khẩu quá yếu (cần ít nhất 6 ký tự).'; break; case 'auth/invalid-email': authErrorDiv.textContent = 'Địa chỉ email không hợp lệ.'; break; default: authErrorDiv.textContent = `Lỗi đăng ký: ${error.message}`; } }).finally(() => { submitButton.disabled = false; submitButton.textContent = 'Đăng Ký'; }); });
signinForm.addEventListener('submit', (e) => { e.preventDefault(); const email = signinForm['signin-email'].value; const password = signinForm['signin-password'].value; authErrorDiv.textContent = ''; const submitButton = signinForm.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'Đang đăng nhập...'; signInWithEmailAndPassword(auth, email, password).then((userCredential) => { console.log('Đăng nhập thành công!', userCredential.user); signinForm.reset(); }).catch((error) => { console.error('Lỗi Đăng Nhập:', error.code, error.message); switch (error.code) { case 'auth/user-not-found': case 'auth/wrong-password': case 'auth/invalid-credential': authErrorDiv.textContent = 'Email hoặc mật khẩu không đúng.'; break; case 'auth/invalid-email': authErrorDiv.textContent = 'Địa chỉ email không hợp lệ.'; break; case 'auth/too-many-requests': authErrorDiv.textContent = 'Quá nhiều lần thử. Vui lòng thử lại sau.'; break; default: authErrorDiv.textContent = `Lỗi đăng nhập: ${error.message}`; } }).finally(() => { submitButton.disabled = false; submitButton.textContent = 'Đăng Nhập'; }); });

