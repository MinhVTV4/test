// Đảm bảo mã chỉ chạy sau khi toàn bộ cấu trúc HTML đã được tải xong
document.addEventListener('DOMContentLoaded', () => {

    // === Lấy tham chiếu đến các phần tử HTML ===
    const noteContentInput = document.getElementById('note-content');
    const addNoteBtn = document.getElementById('add-note-btn');
    const notesListContainer = document.getElementById('notes-list');
    const noNotesMsg = document.getElementById('no-notes-msg');

    // === Khóa để lưu dữ liệu trong localStorage ===
    // Sử dụng một khóa cụ thể để tránh trùng lặp với các ứng dụng khác
    const STORAGE_KEY = 'myPersonalNotesApp_v1';

    // === Hàm: Tải ghi chú từ localStorage ===
    function loadNotesFromStorage() {
        const notesJson = localStorage.getItem(STORAGE_KEY);
        try {
            // Nếu có dữ liệu trong localStorage, chuyển đổi từ JSON sang mảng
            // Nếu không có hoặc dữ liệu lỗi, trả về mảng rỗng
            return notesJson ? JSON.parse(notesJson) : [];
        } catch (error) {
            console.error("Lỗi khi đọc dữ liệu từ localStorage:", error);
            // Nếu có lỗi phân tích JSON (dữ liệu bị hỏng), trả về mảng rỗng
            return [];
        }
    }

    // === Hàm: Lưu ghi chú vào localStorage ===
    function saveNotesToStorage(notesArray) {
        // Chuyển đổi mảng ghi chú thành chuỗi JSON trước khi lưu
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notesArray));
    }

    // === Hàm: Hiển thị danh sách ghi chú lên giao diện ===
    function renderNotesUI(notesArray) {
        // Xóa sạch danh sách hiện tại trên UI trước khi vẽ lại
        notesListContainer.innerHTML = '';

        // Kiểm tra xem có ghi chú nào không
        if (notesArray.length === 0) {
            // Nếu không có, hiển thị thông báo "Chưa có ghi chú"
            noNotesMsg.classList.remove('hidden');
        } else {
            // Nếu có, ẩn thông báo "Chưa có ghi chú"
            noNotesMsg.classList.add('hidden');

            // Sắp xếp ghi chú: mới nhất lên đầu (dựa vào timestamp)
            notesArray.sort((a, b) => b.timestamp - a.timestamp);

            // Lặp qua từng ghi chú trong mảng và tạo phần tử HTML tương ứng
            notesArray.forEach(note => {
                // Tạo thẻ <li> cho mỗi ghi chú
                const listItem = document.createElement('li');

                // Tạo thẻ <span> để chứa nội dung ghi chú
                const noteTextSpan = document.createElement('span');
                noteTextSpan.textContent = note.content; // Gán nội dung

                // Tạo nút "Xóa"
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Xóa';
                deleteButton.classList.add('delete-btn'); // Thêm class để CSS và JS nhận diện
                // Lưu trữ ID của ghi chú vào thuộc tính data-id của nút xóa
                // Điều này giúp biết cần xóa ghi chú nào khi nút được nhấn
                deleteButton.setAttribute('data-id', note.id);

                // Gắn nội dung và nút xóa vào thẻ <li>
                listItem.appendChild(noteTextSpan);
                listItem.appendChild(deleteButton);

                // Gắn thẻ <li> vào danh sách <ul> trên trang
                notesListContainer.appendChild(listItem);
            });
        }
    }

    // === Hàm: Xử lý việc thêm ghi chú mới ===
    function handleAddNote() {
        // Lấy nội dung từ ô textarea và loại bỏ khoảng trắng thừa ở đầu/cuối
        const content = noteContentInput.value.trim();

        // Kiểm tra xem nội dung có rỗng không
        if (content === '') {
            alert('Bạn chưa nhập nội dung cho ghi chú!');
            return; // Dừng hàm nếu nội dung rỗng
        }

        // Tạo đối tượng ghi chú mới
        const newNote = {
            id: Date.now().toString(), // Sử dụng timestamp làm ID đơn giản và duy nhất
            content: content,
            timestamp: Date.now() // Lưu thời điểm tạo
        };

        // Tải danh sách ghi chú hiện tại từ localStorage
        const currentNotes = loadNotesFromStorage();
        // Thêm ghi chú mới vào đầu mảng
        currentNotes.unshift(newNote);
        // Lưu lại mảng đã cập nhật vào localStorage
        saveNotesToStorage(currentNotes);
        // Vẽ lại danh sách ghi chú trên giao diện
        renderNotesUI(currentNotes);

        // Xóa nội dung trong ô textarea sau khi thêm thành công
        noteContentInput.value = '';
        noteContentInput.focus(); // Tùy chọn: đưa con trỏ về ô nhập liệu
    }

    // === Hàm: Xử lý việc xóa ghi chú ===
    function handleDeleteNote(noteIdToDelete) {
        // Hỏi xác nhận trước khi xóa (an toàn hơn)
        if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này không?')) {
            return; // Người dùng nhấn "Cancel", không làm gì cả
        }

        // Tải danh sách ghi chú hiện tại
        let currentNotes = loadNotesFromStorage();
        // Tạo một mảng mới chỉ chứa những ghi chú KHÔNG có ID trùng với ID cần xóa
        currentNotes = currentNotes.filter(note => note.id !== noteIdToDelete);
        // Lưu lại mảng đã được lọc vào localStorage
        saveNotesToStorage(currentNotes);
        // Vẽ lại danh sách ghi chú trên giao diện
        renderNotesUI(currentNotes);
    }


    // === Gắn các trình xử lý sự kiện ===

    // 1. Sự kiện click nút "Thêm Ghi Chú"
    addNoteBtn.addEventListener('click', handleAddNote);

    // 2. Sự kiện nhấn phím Enter trong textarea (tùy chọn, thêm cho tiện)
    noteContentInput.addEventListener('keypress', (event) => {
        // Kiểm tra nếu nhấn Enter (và không nhấn Shift cùng lúc)
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Ngăn hành vi mặc định của Enter (xuống dòng)
            handleAddNote(); // Gọi hàm thêm ghi chú
        }
    });


    // 3. Sự kiện click vào danh sách ghi chú (để xử lý nút xóa)
    // Sử dụng kỹ thuật "Event Delegation": gắn sự kiện cho thẻ cha (ul)
    // thay vì từng nút xóa riêng lẻ, hiệu quả hơn khi danh sách dài.
    notesListContainer.addEventListener('click', (event) => {
        // Kiểm tra xem phần tử được click có phải là nút xóa không
        if (event.target.classList.contains('delete-btn')) {
            // Lấy ID của ghi chú từ thuộc tính data-id của nút xóa được click
            const noteId = event.target.getAttribute('data-id');
            // Gọi hàm xử lý xóa ghi chú
            handleDeleteNote(noteId);
        }
    });

    // === Khởi chạy ứng dụng ===
    // Ngay khi trang tải xong, tải danh sách ghi chú từ localStorage và hiển thị lên giao diện
    const initialNotes = loadNotesFromStorage();
    renderNotesUI(initialNotes);

}); // Kết thúc sự kiện DOMContentLoaded
