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
    updateDoc,
    deleteDoc, // Sẽ dùng sau
    serverTimestamp // Sẽ dùng sau
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
// XÂY DỰNG GIAO DIỆN VÀ LOGIC AUTHENTICATION
// ============================================================

// Lấy tham chiếu đến các Element trong DOM
const authContainer = document.getElementById('auth-container');
const signinFormContainer = document.getElementById('signin-form-container');
const signupFormContainer = document.getElementById('signup-form-container');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const showSignupLink = document.getElementById('show-signup');
const showSigninLink = document.getElementById('show-signin');
const authErrorDiv = document.getElementById('auth-error');

const userInfoDiv = document.getElementById('user-info');
const userEmailDisplay = document.getElementById('user-email-display');
const signoutButton = document.getElementById('signout-button');
const notesContainer = document.getElementById('notes-container');

// --- Hàm chuyển đổi giữa form Đăng nhập và Đăng ký ---
showSignupLink.addEventListener('click', () => {
    signinFormContainer.style.display = 'none';
    signupFormContainer.style.display = 'block';
    authErrorDiv.textContent = ''; // Xóa lỗi cũ
    signinForm.reset(); // Xóa input form cũ
});

showSigninLink.addEventListener('click', () => {
    signupFormContainer.style.display = 'none';
    signinFormContainer.style.display = 'block';
    authErrorDiv.textContent = ''; // Xóa lỗi cũ
    signupForm.reset(); // Xóa input form cũ
});

// --- Xử lý Đăng Ký ---
signupForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Ngăn form gửi đi theo cách truyền thống
    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;
    authErrorDiv.textContent = ''; // Xóa lỗi cũ

    // Vô hiệu hóa nút submit để tránh click nhiều lần
    signupForm.querySelector('button[type="submit"]').disabled = true;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('Đăng ký thành công!', userCredential.user);
            signupForm.reset(); // Xóa nội dung form
            // onAuthStateChanged sẽ xử lý việc cập nhật UI, không cần làm gì thêm ở đây
        })
        .catch((error) => {
            console.error('Lỗi Đăng Ký:', error.code, error.message);
            // Cung cấp thông báo lỗi thân thiện hơn
            switch (error.code) {
                case 'auth/email-already-in-use':
                    authErrorDiv.textContent = 'Email này đã được sử dụng.';
                    break;
                case 'auth/weak-password':
                    authErrorDiv.textContent = 'Mật khẩu quá yếu. Vui lòng dùng ít nhất 6 ký tự.';
                    break;
                case 'auth/invalid-email':
                     authErrorDiv.textContent = 'Địa chỉ email không hợp lệ.';
                     break;
                default:
                    authErrorDiv.textContent = `Lỗi đăng ký: ${error.message}`;
            }
        })
        .finally(() => {
             // Kích hoạt lại nút submit dù thành công hay thất bại
             signupForm.querySelector('button[type="submit"]').disabled = false;
        });
});

// --- Xử lý Đăng Nhập ---
signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = signinForm['signin-email'].value;
    const password = signinForm['signin-password'].value;
    authErrorDiv.textContent = ''; // Xóa lỗi cũ

    // Vô hiệu hóa nút submit
    signinForm.querySelector('button[type="submit"]').disabled = true;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('Đăng nhập thành công!', userCredential.user);
            signinForm.reset();
            // onAuthStateChanged sẽ xử lý việc cập nhật UI
        })
        .catch((error) => {
            console.error('Lỗi Đăng Nhập:', error.code, error.message);
             // Cung cấp thông báo lỗi thân thiện hơn
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential': // Lỗi chung cho email/pass sai ở các SDK mới hơn
                    authErrorDiv.textContent = 'Email hoặc mật khẩu không đúng.';
                    break;
                 case 'auth/invalid-email':
                     authErrorDiv.textContent = 'Địa chỉ email không hợp lệ.';
                     break;
                case 'auth/too-many-requests':
                    authErrorDiv.textContent = 'Quá nhiều lần thử không thành công. Vui lòng thử lại sau.';
                    break;
                default:
                    authErrorDiv.textContent = `Lỗi đăng nhập: ${error.message}`;
            }
        })
         .finally(() => {
             // Kích hoạt lại nút submit
             signinForm.querySelector('button[type="submit"]').disabled = false;
        });
});

// --- Xử lý Đăng Xuất ---
signoutButton.addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log('Đăng xuất thành công!');
        // onAuthStateChanged sẽ xử lý việc cập nhật UI
    }).catch((error) => {
        console.error('Lỗi Đăng Xuất:', error);
        // Hiển thị lỗi nếu cần thiết, dù ít khi xảy ra
        alert(`Lỗi đăng xuất: ${error.message}`);
    });
});

// --- Lắng nghe thay đổi trạng thái Xác thực ---
// Hàm này chạy khi trang tải lần đầu và mỗi khi trạng thái đăng nhập thay đổi
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed. User:', user); // Log để debug
    if (user) {
        // Người dùng đã đăng nhập
        authContainer.style.display = 'none';   // Ẩn toàn bộ khu vực auth
        userInfoDiv.style.display = 'block';    // Hiện thông tin user
        notesContainer.style.display = 'block'; // Hiện khu vực notes
        userEmailDisplay.textContent = user.email; // Hiển thị email user

        // TODO: Gọi hàm để tải ghi chú của người dùng này (sẽ làm ở bước sau)
        // loadNotes(user.uid);

    } else {
        // Người dùng đã đăng xuất hoặc chưa đăng nhập
        authContainer.style.display = 'block';        // Hiện khu vực auth
        signinFormContainer.style.display = 'block';  // Mặc định hiện form signin
        signupFormContainer.style.display = 'none';   // Ẩn form signup
        userInfoDiv.style.display = 'none';           // Ẩn thông tin user
        notesContainer.style.display = 'none';        // Ẩn khu vực notes
        userEmailDisplay.textContent = '';            // Xóa email user
        authErrorDiv.textContent = '';                // Xóa lỗi cũ (nếu có)
        // Reset form để xóa input cũ khi logout
        signinForm.reset();
        signupForm.reset();


        // TODO: Xóa các ghi chú đang hiển thị trên giao diện (sẽ làm ở bước sau)
        // clearNotesUI();
    }
});

console.log("Authentication logic loaded and auth state listener attached!");

// ===============================================
//  PHẦN LOGIC QUẢN LÝ GHI CHÚ SẼ ĐƯỢC THÊM VÀO ĐÂY SAU
// ===============================================
