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
    collection, // Để tham chiếu đến collection
    addDoc,     // Để thêm ghi chú mới
    query,      // Để tạo truy vấn (ví dụ: lấy ghi chú của user)
    where,      // Để lọc theo điều kiện (ví dụ: theo userId, status)
    orderBy,    // Để sắp xếp ghi chú
    onSnapshot, // Để lắng nghe thay đổi thời gian thực
    doc,        // Để tham chiếu đến một ghi chú cụ thể
    updateDoc,  // Để cập nhật ghi chú (dùng cho soft delete)
    deleteDoc,  // (Sẽ dùng sau nếu cần xóa vĩnh viễn)
    serverTimestamp // Để lấy timestamp của server Firebase
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


// 2. Đặt cấu hình Firebase của bạn vào đây (ĐÃ LẤY TỪ BẠN)
const firebaseConfig = {
  apiKey: "AIzaSyAktPkkbYkv3klCN4ol78nXcreoUjb1OII", // Đây là API key bạn cung cấp
  authDomain: "ghichu-771982.firebaseapp.com",
  projectId: "ghichu-771982",
  storageBucket: "ghichu-771982.appspot.com", // Đảm bảo đúng tên bucket từ project settings của bạn
  messagingSenderId: "345155950827",
  appId: "1:345155950827:web:f1cfe2c89cb5d59d5686ae"
  // measurementId: "G-..." // Có thể thêm nếu bạn dùng Analytics
};

// 3. Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// 4. Lấy tham chiếu đến các dịch vụ Firebase
const auth = getAuth(app);       // Dịch vụ Xác thực
const db = getFirestore(app);    // Dịch vụ Firestore

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
let unsubscribeNotes = null; // Lưu hàm hủy lắng nghe Firestore


// ============================================================
// HÀM HỖ TRỢ CHO NOTES UI
// ============================================================

// --- Hàm hiển thị một ghi chú lên giao diện ---
const renderNote = (id, noteData) => {
    const card = document.createElement('div');
    card.classList.add('note-card');
    card.setAttribute('data-id', id); // Lưu ID vào thẻ để dùng sau

    // Tiêu đề (nếu có)
    const titleHTML = noteData.title ? `<h4>${escapeHTML(noteData.title)}</h4>` : ''; // Escape HTML

    // Nội dung (Escape HTML để tránh XSS)
    const contentHTML = `<p>${escapeHTML(noteData.content)}</p>`;

    // Timestamp (chuyển đổi và định dạng)
    let timestampHTML = '';
    if (noteData.createdAt && typeof noteData.createdAt.toDate === 'function') {
        try {
             timestampHTML = `<span class="timestamp">Tạo lúc: ${noteData.createdAt.toDate().toLocaleString('vi-VN')}</span>`; // Định dạng VN
        } catch (e) {
            console.error("Error formatting date:", e);
            timestampHTML = `<span class="timestamp">Tạo lúc: (lỗi ngày)</span>`;
        }
    } else {
         timestampHTML = `<span class="timestamp">Tạo lúc: (không có dữ liệu)</span>`;
    }
    // TODO: Thêm updatedAt sau khi có chức năng sửa

    // Nút Xóa
    const deleteButtonHTML = `<button class="note-delete-button" data-id="${id}" title="Xóa ghi chú (vào thùng rác)">X</button>`;

    card.innerHTML = `
        ${deleteButtonHTML}
        ${titleHTML}
        ${contentHTML}
        ${timestampHTML}
    `;

    // Thêm vào đầu danh sách thay vì cuối
    notesListDiv.prepend(card);
};

// --- Hàm xóa tất cả ghi chú khỏi giao diện ---
const clearNotesUI = () => {
    notesListDiv.innerHTML = ''; // Xóa sạch danh sách
};

// --- Hàm escape HTML để tránh XSS ---
// (Rất quan trọng khi hiển thị dữ liệu do người dùng nhập)
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}


// ============================================================
// LOGIC QUẢN LÝ GHI CHÚ (FIRESTORE CRUD)
// ============================================================

// --- Hàm tải và lắng nghe ghi chú từ Firestore ---
const loadNotes = (userId) => {
    console.log(`Attempting to load notes for user: ${userId}`);
    // Hiển thị thông báo đang tải
    clearNotesUI(); // Xóa UI cũ trước khi tải
    notesListDiv.innerHTML = '<p>Đang tải ghi chú...</p>';

    // Tạo query để lấy các ghi chú 'active' của user hiện tại, sắp xếp mới nhất trước
    const notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', userId),
        where('status', '==', 'active'), // Chỉ lấy ghi chú đang hoạt động
        orderBy('createdAt', 'desc')     // Sắp xếp theo ngày tạo giảm dần
    );

    // Hủy lắng nghe cũ nếu có
    if (unsubscribeNotes) {
        console.log("Unsubscribing previous notes listener before creating new one.");
        unsubscribeNotes();
        unsubscribeNotes = null; // Đặt lại thành null
    }

    // Lắng nghe thay đổi thời gian thực
    unsubscribeNotes = onSnapshot(notesQuery, (querySnapshot) => {
        console.log(`Firestore snapshot received: ${querySnapshot.size} active notes.`);
        clearNotesUI(); // Xóa danh sách hiện tại trước khi render lại

        if (querySnapshot.empty) {
            console.log("No active notes found.");
            notesListDiv.innerHTML = '<p>Bạn chưa có ghi chú nào đang hoạt động. Hãy tạo ghi chú mới!</p>';
        } else {
            console.log("Rendering notes...");
            querySnapshot.forEach((doc) => {
                // console.log(doc.id, " => ", doc.data());
                renderNote(doc.id, doc.data()); // Hiển thị từng ghi chú
            });
            console.log("Finished rendering notes.");
        }
    }, (error) => {
        // Xử lý lỗi khi lắng nghe
        console.error("Error listening to Firestore notes: ", error);
        clearNotesUI(); // Xóa thông báo đang tải
        notesListDiv.innerHTML = `<p style="color: red;">Lỗi tải ghi chú: ${error.message}. Vui lòng thử tải lại trang.</p>`;
        // Không hủy lắng nghe ở đây, Firebase có thể tự kết nối lại.
        // Nếu lỗi kéo dài, người dùng cần F5.
    });
    console.log("Firestore notes listener attached.");
};


// --- Xử lý thêm ghi chú mới ---
addNoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const user = auth.currentUser; // Lấy user object hiện tại

    if (!user) {
        authErrorDiv.textContent = "Lỗi: Bạn cần đăng nhập để thêm ghi chú."; // Hiển thị lỗi ở khu vực auth
        return;
    }
    const userId = user.uid;

    if (!content) {
        alert("Nội dung ghi chú không được để trống."); // Alert đơn giản cho validation này
        return;
    }

    const submitButton = addNoteForm.querySelector('button[type="submit"]');
    submitButton.disabled = true; // Vô hiệu hóa nút submit
    submitButton.textContent = 'Đang thêm...'; // Thay đổi text nút

    // Tạo object ghi chú mới
    const newNote = {
        userId: userId,
        title: title,
        content: content,
        status: 'active', // Trạng thái mặc định
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Các trường khác như tags, color, isPinned sẽ là null/false mặc định nếu không thêm ở đây
    };

    // Thêm vào Firestore
    addDoc(collection(db, 'notes'), newNote)
        .then((docRef) => {
            console.log("Ghi chú đã được thêm với ID: ", docRef.id);
            addNoteForm.reset(); // Xóa nội dung form sau khi thêm thành công
        })
        .catch((error) => {
            console.error("Lỗi khi thêm ghi chú: ", error);
            alert(`Đã xảy ra lỗi khi thêm ghi chú: ${error.message}`); // Thông báo lỗi
        })
        .finally(() => {
             // Kích hoạt lại nút submit và reset text
             submitButton.disabled = false;
             submitButton.textContent = 'Thêm Ghi Chú';
        });
});

// --- Xử lý xóa ghi chú (Soft Delete) ---
notesListDiv.addEventListener('click', (e) => {
    // Sử dụng closest để xử lý trường hợp click vào icon bên trong nút (nếu có)
    const deleteButton = e.target.closest('.note-delete-button');

    if (deleteButton) {
        const noteId = deleteButton.getAttribute('data-id');
        console.log(`Requesting delete for note ID: ${noteId}`);

        // Hỏi xác nhận trực quan hơn
        const card = deleteButton.closest('.note-card'); // Tìm thẻ cha
        if (card) card.style.opacity = '0.5'; // Làm mờ thẻ khi hỏi

        if (confirm("Chuyển ghi chú này vào thùng rác?")) {
            const noteRef = doc(db, 'notes', noteId);
            updateDoc(noteRef, {
                status: 'trashed', // Thay đổi trạng thái
                updatedAt: serverTimestamp()
            })
            .then(() => {
                console.log(`Note ${noteId} moved to trash.`);
                // Giao diện sẽ tự cập nhật nhờ onSnapshot, không cần làm gì thêm ở đây
                // Có thể thêm hiệu ứng xóa mờ dần nếu muốn, nhưng onSnapshot làm việc này rồi.
            })
            .catch((error) => {
                console.error("Lỗi khi chuyển ghi chú vào thùng rác: ", error);
                alert(`Lỗi khi xóa ghi chú: ${error.message}`);
                 if (card) card.style.opacity = '1'; // Khôi phục độ mờ nếu lỗi
            });
        } else {
            // Nếu người dùng hủy
             if (card) card.style.opacity = '1'; // Khôi phục độ mờ
        }
    }
});


// ============================================================
// LOGIC XỬ LÝ AUTHENTICATION (Đã có từ trước)
// ============================================================

// --- Hàm chuyển đổi giữa form Đăng nhập và Đăng ký ---
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

// --- Xử lý Đăng Ký ---
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;
    authErrorDiv.textContent = '';
    const submitButton = signupForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Đang đăng ký...';


    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('Đăng ký thành công!', userCredential.user);
            signupForm.reset();
        })
        .catch((error) => {
            console.error('Lỗi Đăng Ký:', error.code, error.message);
            switch (error.code) {
                case 'auth/email-already-in-use':
                    authErrorDiv.textContent = 'Email này đã được sử dụng.'; break;
                case 'auth/weak-password':
                    authErrorDiv.textContent = 'Mật khẩu quá yếu (cần ít nhất 6 ký tự).'; break;
                case 'auth/invalid-email':
                     authErrorDiv.textContent = 'Địa chỉ email không hợp lệ.'; break;
                default:
                    authErrorDiv.textContent = `Lỗi đăng ký: ${error.message}`;
            }
        })
        .finally(() => {
             submitButton.disabled = false;
             submitButton.textContent = 'Đăng Ký';
        });
});

// --- Xử lý Đăng Nhập ---
signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = signinForm['signin-email'].value;
    const password = signinForm['signin-password'].value;
    authErrorDiv.textContent = '';
    const submitButton = signinForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Đang đăng nhập...';


    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('Đăng nhập thành công!', userCredential.user);
            signinForm.reset();
        })
        .catch((error) => {
            console.error('Lỗi Đăng Nhập:', error.code, error.message);
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    authErrorDiv.textContent = 'Email hoặc mật khẩu không đúng.'; break;
                 case 'auth/invalid-email':
                     authErrorDiv.textContent = 'Địa chỉ email không hợp lệ.'; break;
                case 'auth/too-many-requests':
                    authErrorDiv.textContent = 'Quá nhiều lần thử. Vui lòng thử lại sau.'; break;
                default:
                    authErrorDiv.textContent = `Lỗi đăng nhập: ${error.message}`;
            }
        })
         .finally(() => {
             submitButton.disabled = false;
             submitButton.textContent = 'Đăng Nhập';
        });
});

// --- Xử lý Đăng Xuất ---
signoutButton.addEventListener('click', () => {
     console.log("Signing out...");
     // Hủy lắng nghe trước khi đăng xuất để tránh lỗi quyền
     if (unsubscribeNotes) {
         console.log("Unsubscribing notes listener before sign out.");
         unsubscribeNotes();
         unsubscribeNotes = null;
     }

    signOut(auth).then(() => {
        console.log('Đăng xuất thành công!');
        // onAuthStateChanged sẽ xử lý UI
    }).catch((error) => {
        console.error('Lỗi Đăng Xuất:', error);
        alert(`Lỗi đăng xuất: ${error.message}`);
    });
});

// ============================================================
// AUTH STATE LISTENER (QUAN TRỌNG NHẤT)
// ============================================================
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed. Current user:', user ? user.uid : 'None');
    if (user) {
        // ---- User Đã Đăng Nhập ----
        authContainer.style.display = 'none';
        userInfoDiv.style.display = 'block';    // Hiện info user
        notesContainer.style.display = 'block'; // Hiện khu vực notes
        userEmailDisplay.textContent = user.email;

        // Tải ghi chú của người dùng này
        // Hàm loadNotes đã bao gồm việc hủy listener cũ (nếu có) trước khi tạo cái mới
        loadNotes(user.uid);

    } else {
        // ---- User Đã Đăng Xuất hoặc Chưa Đăng Nhập ----
        authContainer.style.display = 'block'; // Hiện khu vực auth
        signinFormContainer.style.display = 'block'; // Mặc định hiện form signin
        signupFormContainer.style.display = 'none';  // Ẩn form signup
        userInfoDiv.style.display = 'none';          // Ẩn info user
        notesContainer.style.display = 'none';       // Ẩn khu vực notes
        userEmailDisplay.textContent = '';           // Xóa email user
        authErrorDiv.textContent = '';               // Xóa lỗi cũ
        signinForm.reset(); // Reset form
        signupForm.reset(); // Reset form

        // Xóa các ghi chú đang hiển thị trên giao diện
        clearNotesUI();

        // Hủy lắng nghe ghi chú (nếu đang lắng nghe)
        // Đảm bảo việc này được gọi cả khi trang tải lần đầu mà user chưa đăng nhập
        if (unsubscribeNotes) {
            console.log("Auth state changed to logged out. Unsubscribing notes listener.");
            unsubscribeNotes();
            unsubscribeNotes = null;
        } else {
             console.log("Auth state changed to logged out. No active notes listener to unsubscribe.");
        }
    }
});

console.log("App.js loaded. Authentication logic and Notes CRUD logic are ready.");
