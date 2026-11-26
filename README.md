# Kakikomi

Luyện viết tiếng Nhật: tự viết, AI (DeepSeek) sửa cho đúng và tự nhiên nhưng giữ văn phong của mình. Có bản web và iOS (Expo).

- Câu hỏi gợi ý, nhật ký, mô tả ảnh, viết tiếp chuỗi, note ý tưởng
- Phỏng vấn thử: AI làm 面接官, hỏi theo CV và trang công ty, lưu nhiều cuộc như lịch sử chat
- Sửa một câu hoặc cả đoạn, tự sửa sau khi gửi, bút dạ tô chữ
- Ghi âm nói tiếng Nhật thành chữ (whisper.cpp chạy local), đọc lại bằng giọng máy, streak

## Chạy

```bash
npm install
cp .env.example .env   # điền DEEPSEEK_API_KEY
npx expo start --web --port 8090
```

Ghi âm cần whisper.cpp server ở `http://127.0.0.1:8081/inference` (đổi bằng `WHISPER_URL`).
