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
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc, // Quan trọng cho cả sửa và xóa mềm
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


// 2. Đặt cấu hình Firebase của bạn vào đây (ĐÃ LẤY TỪ BẠN)
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
// DOM ELEMENTS CHO AUTH & NOTES
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
// User Info & Notes Area Elements
const userInfoDiv = document.getElementById('user-info');
const userEmailDisplay = document.getElementById('user-email-display');
const signoutButton = document.getElementById('signout-button');
const notesContainer = document.getElementById('notes-container');
// Note Management Elements
const addNoteForm = document.getElementById('add-note-form');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const notesListDiv = document.getElementById('notes-list');

// ============================================================
// BIẾN TRẠNG THÁI VÀ HỦY LẮNG NGHE
// ============================================================
let unsubscribeNotes = null;


// ============================================================
// HÀM HỖ TRỢ CHO NOTES UI
// ============================================================

// --- Hàm escape HTML để tránh XSS ---
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || '')); // Handle null/undefined
  return div.innerHTML;
}

// --- Hàm hiển thị một ghi chú lên giao diện (Cập nhật cho Inline Editing) ---
const renderNote = (id, noteData) => {
    const card = document.createElement('div');
    card.classList.add('note-card');
    card.setAttribute('data-id', id);

    // ---- Phần hiển thị tĩnh ----
    const titleDisplayHTML = `<h4 class="note-title-display">${escapeHTML(noteData.title)}</h4>`;
    // Nếu không có tiêu đề, không hiển thị thẻ h4 trống
    const finalTitleDisplayHTML = noteData.title ? titleDisplayHTML : '';
    const contentDisplayHTML = `<p class="note-content-display">${escapeHTML(noteData.content)}</p>`;

    // ---- Phần input ẩn để chỉnh sửa ----
    const titleInputHTML = `<input type="text" class="note-title-input" value="${escapeHTML(noteData.title)}" placeholder="Tiêu đề">`;
    const contentInputHTML = `<textarea class="note-content-input" rows="4" placeholder="Nội dung">${escapeHTML(noteData.content)}</textarea>`;

    // ---- Timestamp ----
    let timestampHTML = '';
    if (noteData.createdAt && typeof noteData.createdAt.toDate === 'function') {
        try {
             timestampHTML = `<span class="timestamp">Tạo lúc: ${noteData.createdAt.toDate().toLocaleString('vi-VN')}</span>`;
             // TODO: Hiển thị cả updatedAt nếu nó khác createdAt đáng kể
        } catch (e) { timestampHTML = `<span class="timestamp">Tạo lúc: (lỗi ngày)</span>`; }
    } else { timestampHTML = `<span class="timestamp">Tạo lúc: (không có dữ liệu)</span>`; }

    // ---- Các nút hành động ----
    const deleteButtonHTML = `<button class="note-delete-button" data-id="${id}" title="Xóa ghi chú (vào thùng rác)">X</button>`;
    // Khu vực nút Sửa/Lưu/Hủy ở dưới
    const actionsHTML = `
        <div class="note-actions">
            <button class="note-edit-button card-button" data-id="${id}">Sửa</button>
            <button class="note-save-button card-button" data-id="${id}">Lưu</button>
            <button class="note-cancel-button card-button" data-id="${id}">Hủy</button>
        </div>
    `;

    // ---- Kết hợp tất cả ----
    card.innerHTML = `
        ${deleteButtonHTML}
        ${finalTitleDisplayHTML}
        ${contentDisplayHTML}
        ${titleInputHTML}
        ${contentInputHTML}
        ${timestampHTML}
        ${actionsHTML}
    `;

    notesListDiv.prepend(card); // Thêm vào đầu danh sách
};

// --- Hàm xóa tất cả ghi chú khỏi giao diện ---
const clearNotesUI = () => {
    notesListDiv.innerHTML = '';
};


// ============================================================
// LOGIC QUẢN LÝ GHI CHÚ (FIRESTORE CRUD - Cập nhật Listener)
// ============================================================

// --- Hàm tải và lắng nghe ghi chú từ Firestore (Không đổi) ---
const loadNotes = (userId) => {
    console.log(`Attempting to load notes for user: ${userId}`);
    clearNotesUI();
    notesListDiv.innerHTML = '<p>Đang tải ghi chú...</p>';
    const notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', userId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
    );
    if (unsubscribeNotes) {
        console.log("Unsubscribing previous notes listener before creating new one.");
        unsubscribeNotes();
        unsubscribeNotes = null;
    }
    unsubscribeNotes = onSnapshot(notesQuery, (querySnapshot) => {
        console.log(`Firestore snapshot received: ${querySnapshot.size} active notes.`);
        clearNotesUI();
        if (querySnapshot.empty) {
            console.log("No active notes found.");
            notesListDiv.innerHTML = '<p>Bạn chưa có ghi chú nào đang hoạt động. Hãy tạo ghi chú mới!</p>';
        } else {
            console.log("Rendering notes...");
            querySnapshot.forEach((doc) => { renderNote(doc.id, doc.data()); });
            console.log("Finished rendering notes.");
        }
    }, (error) => {
        console.error("Error listening to Firestore notes: ", error);
        clearNotesUI();
        notesListDiv.innerHTML = `<p style="color: red;">Lỗi tải ghi chú: ${error.message}. Vui lòng thử tải lại trang.</p>`;
    });
    console.log("Firestore notes listener attached.");
};

// --- Xử lý thêm ghi chú mới (Không đổi) ---
addNoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const user = auth.currentUser;
    if (!user) { authErrorDiv.textContent = "Lỗi: Bạn cần đăng nhập để thêm ghi chú."; return; }
    if (!content) { alert("Nội dung ghi chú không được để trống."); return; }

    const submitButton = addNoteForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Đang thêm...';
    const newNote = {
        userId: user.uid, title: title, content: content, status: 'active',
        createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    };
    addDoc(collection(db, 'notes'), newNote)
        .then(() => { console.log("Ghi chú đã được thêm"); addNoteForm.reset(); })
        .catch((error) => { console.error("Lỗi khi thêm ghi chú: ", error); alert(`Lỗi thêm ghi chú: ${error.message}`); })
        .finally(() => { submitButton.disabled = false; submitButton.textContent = 'Thêm Ghi Chú'; });
});

// --- Listener chính cho danh sách ghi chú (Xử lý Sửa, Lưu, Hủy, Xóa) ---
notesListDiv.addEventListener('click', (e) => {
    const target = e.target; // Phần tử được click
    const card = target.closest('.note-card'); // Tìm thẻ ghi chú cha gần nhất
    if (!card) return; // Nếu click không phải trong thẻ nào thì bỏ qua

    const noteId = card.getAttribute('data-id');

    // --- Xử lý nút Sửa ---
    if (target.classList.contains('note-edit-button')) {
        console.log(`Editing note: ${noteId}`);
        // Lấy các element input/textarea bên trong thẻ card này
        const titleInput = card.querySelector('.note-title-input');
        const contentInput = card.querySelector('.note-content-input');
        // Lấy text hiện tại từ các thẻ hiển thị tĩnh (để đảm bảo lấy giá trị mới nhất)
        const currentTitle = card.querySelector('.note-title-display')?.textContent || '';
        const currentContent = card.querySelector('.note-content-display')?.textContent || '';

        // Gán giá trị hiện tại vào input/textarea
        if(titleInput) titleInput.value = currentTitle;
        if(contentInput) contentInput.value = currentContent;

        // Thêm class để kích hoạt chế độ sửa (CSS sẽ lo việc ẩn/hiện)
        card.classList.add('is-editing');
        if(contentInput) contentInput.focus(); // Tự động focus vào nội dung khi sửa
    }

    // --- Xử lý nút Lưu ---
    else if (target.classList.contains('note-save-button')) {
        console.log(`Saving note: ${noteId}`);
        const titleInput = card.querySelector('.note-title-input');
        const contentInput = card.querySelector('.note-content-input');

        const newTitle = titleInput ? titleInput.value.trim() : ''; // Lấy giá trị mới
        const newContent = contentInput ? contentInput.value.trim() : '';

        if (!newContent) {
            alert("Nội dung ghi chú không được để trống.");
            return;
        }

        // Vô hiệu hóa nút lưu tạm thời
        target.disabled = true;
        target.textContent = 'Đang lưu...';

        const noteRef = doc(db, 'notes', noteId);
        updateDoc(noteRef, {
            title: newTitle,
            content: newContent,
            updatedAt: serverTimestamp()
        })
        .then(() => {
            console.log(`Note ${noteId} updated.`);
            card.classList.remove('is-editing'); // Thoát chế độ sửa
            // onSnapshot sẽ tự cập nhật giao diện với dữ liệu mới nhất
        })
        .catch((error) => {
            console.error("Lỗi khi cập nhật ghi chú: ", error);
            alert(`Lỗi lưu ghi chú: ${error.message}`);
             target.disabled = false; // Bật lại nút nếu lỗi
             target.textContent = 'Lưu';
        });
        // Không cần bật lại nút ở finally vì khi thành công, nút này sẽ bị ẩn đi bởi CSS
    }

    // --- Xử lý nút Hủy ---
    else if (target.classList.contains('note-cancel-button')) {
        console.log(`Canceling edit for note: ${noteId}`);
        card.classList.remove('is-editing'); // Chỉ cần thoát chế độ sửa, không làm gì khác
        // Các input sẽ bị ẩn, các thẻ tĩnh sẽ hiện lại với nội dung cũ (từ lần render cuối)
    }

    // --- Xử lý nút Xóa (Giữ nguyên logic cũ) ---
    else if (target.classList.contains('note-delete-button')) {
        console.log(`Requesting delete for note ID: ${noteId}`);
        if (card) card.style.opacity = '0.5';
        if (confirm("Chuyển ghi chú này vào thùng rác?")) {
            const noteRef = doc(db, 'notes', noteId);
            updateDoc(noteRef, { status: 'trashed', updatedAt: serverTimestamp() })
            .then(() => { console.log(`Note ${noteId} moved to trash.`); })
            .catch((error) => {
                console.error("Lỗi khi chuyển ghi chú vào thùng rác: ", error);
                alert(`Lỗi khi xóa ghi chú: ${error.message}`);
                if (card) card.style.opacity = '1';
            });
        } else {
            if (card) card.style.opacity = '1';
        }
    }
});

// ============================================================
// LOGIC XỬ LÝ AUTHENTICATION (Giữ nguyên)
// ============================================================
// (Copy toàn bộ phần xử lý Auth từ file app.js trước đó vào đây)
// --- Hàm chuyển đổi giữa form Đăng nhập và Đăng ký ---
showSignupLink.addEventListener('click', () => { /*...*/ });
showSigninLink.addEventListener('click', () => { /*...*/ });
// --- Xử lý Đăng Ký ---
signupForm.addEventListener('submit', (e) => { /*...*/ });
// --- Xử lý Đăng Nhập ---
signinForm.addEventListener('submit', (e) => { /*...*/ });
// --- Xử lý Đăng Xuất ---
signoutButton.addEventListener('click', () => { /*...*/ });

// ============================================================
// AUTH STATE LISTENER (Giữ nguyên)
// ============================================================
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed. Current user:', user ? user.uid : 'None');
    if (user) {
        // ---- User Đã Đăng Nhập ----
        authContainer.style.display = 'none';
        userInfoDiv.style.display = 'block';
        notesContainer.style.display = 'block';
        userEmailDisplay.textContent = user.email;
        loadNotes(user.uid); // Tải ghi chú
    } else {
        // ---- User Đã Đăng Xuất hoặc Chưa Đăng Nhập ----
        authContainer.style.display = 'block';
        signinFormContainer.style.display = 'block';
        signupFormContainer.style.display = 'none';
        userInfoDiv.style.display = 'none';
        notesContainer.style.display = 'none';
        userEmailDisplay.textContent = '';
        authErrorDiv.textContent = '';
        signinForm.reset();
        signupForm.reset();
        clearNotesUI(); // Xóa UI notes
        if (unsubscribeNotes) { // Hủy lắng nghe notes
            console.log("Auth state changed to logged out. Unsubscribing notes listener.");
            unsubscribeNotes();
            unsubscribeNotes = null;
        } else {
             console.log("Auth state changed to logged out. No active notes listener to unsubscribe.");
        }
    }
});

console.log("App.js loaded. Inline editing logic included.");
// --- Bản sao đầy đủ của các hàm xử lý Auth ---
// (Đảm bảo bạn đã copy đủ các hàm này từ phiên bản trước)
showSignupLink.addEventListener('click', () => {
    signinFormContainer.style.display = 'none';
    signupFormContainer.style.display = 'block';
    authErrorDiv.textContent = '';
    signinForm.reset();
});
showSigninLink.addEventListener('click', () => {
    signupFormContainer.style.display = 'none';
    signinFormContainer.style.display = 'block';
    authErrorDiv.textContent = '';
    signupForm.reset();
});
signupForm.addEventListener('submit', (e) => {
    e.preventDefault(); const email = signupForm['signup-email'].value; const password = signupForm['signup-password'].value; authErrorDiv.textContent = '';
    const submitButton = signupForm.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'Đang đăng ký...';
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => { console.log('Đăng ký thành công!', userCredential.user); signupForm.reset(); })
        .catch((error) => { console.error('Lỗi Đăng Ký:', error.code, error.message);
            switch (error.code) { case 'auth/email-already-in-use': authErrorDiv.textContent = 'Email này đã được sử dụng.'; break; case 'auth/weak-password': authErrorDiv.textContent = 'Mật khẩu quá yếu (cần ít nhất 6 ký tự).'; break; case 'auth/invalid-email': authErrorDiv.textContent = 'Địa chỉ email không hợp lệ.'; break; default: authErrorDiv.textContent = `Lỗi đăng ký: ${error.message}`; }
        })
        .finally(() => { submitButton.disabled = false; submitButton.textContent = 'Đăng Ký'; });
});
signinForm.addEventListener('submit', (e) => {
    e.preventDefault(); const email = signinForm['signin-email'].value; const password = signinForm['signin-password'].value; authErrorDiv.textContent = '';
    const submitButton = signinForm.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'Đang đăng nhập...';
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => { console.log('Đăng nhập thành công!', userCredential.user); signinForm.reset(); })
        .catch((error) => { console.error('Lỗi Đăng Nhập:', error.code, error.message);
            switch (error.code) { case 'auth/user-not-found': case 'auth/wrong-password': case 'auth/invalid-credential': authErrorDiv.textContent = 'Email hoặc mật khẩu không đúng.'; break; case 'auth/invalid-email': authErrorDiv.textContent = 'Địa chỉ email không hợp lệ.'; break; case 'auth/too-many-requests': authErrorDiv.textContent = 'Quá nhiều lần thử. Vui lòng thử lại sau.'; break; default: authErrorDiv.textContent = `Lỗi đăng nhập: ${error.message}`; }
        })
         .finally(() => { submitButton.disabled = false; submitButton.textContent = 'Đăng Nhập'; });
});
signoutButton.addEventListener('click', () => {
     console.log("Signing out...");
     if (unsubscribeNotes) { console.log("Unsubscribing notes listener before sign out."); unsubscribeNotes(); unsubscribeNotes = null; }
    signOut(auth).then(() => { console.log('Đăng xuất thành công!'); }).catch((error) => { console.error('Lỗi Đăng Xuất:', error); alert(`Lỗi đăng xuất: ${error.message}`); });
});


