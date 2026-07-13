# Luồng API review checkpoint

Ngày đối chiếu: **2026-07-13**  
Backend: <https://swd-capstone.onrender.com>  
OpenAPI: <https://swd-capstone.onrender.com/swagger/v1/swagger.json>

## Luồng nghiệp vụ cơ bản

1. Moderator tạo đợt review và chuyển `Draft -> Open`.
2. Đại diện nhóm sinh viên chọn đúng 5 trong 30 ô (6 ngày, 5 slot/ngày) và lưu một lần bằng API transactional.
3. Giảng viên chọn các slot có thể tham gia và nộp availability theo đợt.
4. Moderator chuyển `Open -> Closed`, chạy Auto-Match và kiểm tra không quá 3 nhóm trên cùng `(dayOfWeek, slot)`.
5. Moderator publish lịch. Sinh viên và giảng viên xem lịch được phân công trên tài khoản của mình.
6. Trong buổi review, giảng viên điểm danh, ghi nhận xét, lưu/nộp phiếu review và hoàn tất review của nhóm.
7. Sinh viên xem trạng thái `Completed`, nhận xét, kết luận và tải phiếu review.

## Contract FE đang sử dụng

| Nghiệp vụ | Endpoint |
|---|---|
| Danh sách đợt cho sinh viên | `GET /api/student-review/rounds?semesterId={id}` |
| Lưới và 5 slot của nhóm | `GET /api/student-review/slots?roundId={id}` |
| Lưu đúng 5 slot | `PUT /api/student-review/slots` với `{ roundId, slots }` |
| Lịch sinh viên | `GET /api/student-review/schedule` |
| Availability giảng viên | `GET/PUT /api/review-availability/week?roundId={id}` |
| Nộp availability | `POST /api/review-availability/week/submit?roundId={id}` |
| Đóng đăng ký | `PATCH /api/review-scheduling/rounds/{id}/status` với `{ status: "Closed" }` |
| Ghép lịch | `POST /api/review-scheduling/random-assign` |
| Publish | `POST /api/review-schedules/publish` với field nội dung `message` |
| Lịch giảng viên | `GET /api/review-sessions/my` |
| Điểm danh | `GET/POST /api/review-attendance/{sessionId}`; POST gồm `{ groupId, entries }` |
| Nhận xét | `GET/POST /api/review-attendance/{sessionId}/comments`; POST gồm `{ groupId, content }` |
| Lưu phiếu | `PUT /api/review-submissions/{submissionId}/draft` |
| Nộp phiếu | `POST /api/review-submissions/{submissionId}/submit` |
| Hoàn tất nhóm | `POST /api/review-attendance/{sessionId}/groups/{groupId}/complete` |
| Kết quả của sinh viên | `GET /api/review-submissions/my` |

## Ràng buộc FE

- Chỉ trạng thái `Open` cho phép sinh viên và giảng viên sửa availability.
- Sinh viên phải chọn đúng 5 slot khác nhau; mỗi `dayOfWeek` thuộc `1..6`, mỗi `slot` thuộc `1..5`.
- Sau khi lưu, FE đọc lại `myAvailability` và chỉ báo thành công khi đủ 5 slot khớp.
- FE chặn publish nếu dữ liệu board có hơn 3 nhóm trên cùng một ngày/slot. Backend vẫn là nguồn kiểm tra cuối cùng cho invariant này.
- Token và refresh token chỉ nằm trong local storage; không đưa credential vào biến `VITE_*` hoặc tài liệu.
