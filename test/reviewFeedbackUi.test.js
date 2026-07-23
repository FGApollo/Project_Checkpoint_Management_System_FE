import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

test('review feedback UI does not expose scores or pass/fail verdicts', async () => {
  const [studentPage, studentDashboard, studentSchedule, lecturerPage, trackingPage, lecturerDashboard] = await Promise.all([
    readSource('../src/pages/student/ReviewResultsPage.jsx'),
    readSource('../src/pages/student/StudentDashboard.jsx'),
    readSource('../src/components/reviews/StudentReviewSchedule.jsx'),
    readSource('../src/pages/lecturer/ReviewScoringPage.jsx'),
    readSource('../src/pages/admin/ReviewTrackingPage.jsx'),
    readSource('../src/pages/lecturer/LecturerDashboard.jsx'),
  ]);

  assert.doesNotMatch(studentPage, /sub\.score|selectedSubmission\.result|getResultBadge/);
  assert.doesNotMatch(studentPage, /Điểm:\s*<strong>|KẾT QUẢ REVIEW|ĐẠT YÊU CẦU|KHÔNG ĐẠT/);
  assert.match(studentPage, /entry\.fullName \|\| entry\.studentName/);
  assert.doesNotMatch(lecturerPage, /evalResult|resultText:\s*evalResult|Nộp Điểm|Chấm điểm|Phiếu Chấm|ChamBaoVe|ChamNguoi|0\.0 đến 10\.0/i);
  assert.match(lecturerPage, /Phòng Bảo vệ Trực tiếp/);
  assert.match(lecturerPage, /const \[activeTab, setActiveTab\] = useState\('evaluation'\)/);
  assert.match(lecturerPage, /onClick=\{\(\) => setActiveTab\('attendance'\)\}/);
  assert.match(lecturerPage, /Nhận xét sau Phiên Bảo vệ/);
  assert.doesNotMatch(lecturerPage, /SignalR Live Room|Live Room|Đang dùng dữ liệu API/i);
  assert.doesNotMatch(trackingPage, /scoringStatus|reviewer1Result|reviewer2Result|item\.result|Đạt yêu cầu \(Pass\)|Không đạt \(Fail\)|chấm điểm/i);
  assert.match(trackingPage, /item\.groupStatus === 'Completed'/);
  assert.match(trackingPage, /FEEDBACK_RECEIVED/);
  assert.match(trackingPage, /item\.reviewerFeedback/);
  assert.match(trackingPage, /feedback\.reviewerName/);
  assert.match(trackingPage, /feedback\.comment/);
  assert.doesNotMatch(trackingPage, /comments: item\.notes/);
  assert.doesNotMatch(lecturerDashboard, /Chấm điểm Review/);
  assert.doesNotMatch(studentDashboard, /Kết quả Chấm|Nhóm #\$\{sc\.groupId\}/);
  assert.match(studentSchedule, /schedule\.sessionId \?\? schedule\.id/);
  assert.match(studentDashboard, /groupInfo\?\.groupCode/);
});

test('publishing a review schedule reports real email delivery counts', async () => {
  const managementPage = await readSource('../src/pages/admin/ReviewManagementPage.jsx');

  assert.match(managementPage, /queuedEmailCount/);
  assert.match(managementPage, /sentEmailCount/);
  assert.match(managementPage, /failedEmailCount/);
  assert.doesNotMatch(managementPage, /messageBody:/);
});

test('Google sign-in is wired from the login page through the auth context', async () => {
  const [loginPage, authContext] = await Promise.all([
    readSource('../src/pages/auth/LoginPage.jsx'),
    readSource('../src/context/AuthContext.jsx'),
  ]);

  assert.match(loginPage, /accounts\.google\.com\/gsi\/client/);
  assert.match(loginPage, /google\.accounts\.id\.initialize/);
  assert.match(authContext, /api\.post\('\/auth\/google'/);
});

test('lecturer can request AI review suggestions without score fields', async () => {
  const lecturerPage = await readSource('../src/pages/lecturer/ReviewScoringPage.jsx');
  assert.match(lecturerPage, /project-suggestions\/summary/);
  assert.match(lecturerPage, /Tạo gợi ý nhận xét bằng AI/);
  assert.match(lecturerPage, /contentSummary/);
  assert.match(lecturerPage, /improvementSummary/);
  assert.doesNotMatch(lecturerPage, /scoreValue|evalResult|resultText:\s*evalResult/);
});

test('students upload project documents and assigned lecturers can view them', async () => {
  const [studentPage, lecturerPage, documentService] = await Promise.all([
    readSource('../src/pages/student/StudentDashboard.jsx'),
    readSource('../src/pages/lecturer/ReviewScoringPage.jsx'),
    readSource('../src/services/documents.js'),
  ]);
  assert.match(studentPage, /uploadProjectDocument/);
  assert.match(studentPage, /\.pdf,\.docx,\.zip,\.txt/);
  assert.match(studentPage, /Lịch sử tải lên/);
  assert.match(lecturerPage, /Lịch sử tài liệu của nhóm/);
  assert.match(studentPage, /uploadedByName/);
  assert.match(lecturerPage, /uploadedByName/);
  assert.doesNotMatch(studentPage, /<select[^>]*documentType|docType} · phiên bản/);
  assert.match(documentService, /FormData/);
  assert.match(documentService, /\/documents\/group\//);
  assert.match(documentService, /responseType: 'blob'/);
  assert.match(documentService, /documents\/\$\{id\}\/suggestions/);
  assert.match(lecturerPage, /generateProjectDocumentSuggestions/);
  assert.match(lecturerPage, /listDocumentComments/);
  assert.match(lecturerPage, /reference: commentReference/);
  assert.match(studentPage, /listDocumentComments/);
  assert.match(lecturerPage, /AI phân tích/);
});

test('lecturer review uses the deployed session contract and completes the group workflow', async () => {
  const lecturerPage = await readSource('../src/pages/lecturer/ReviewScoringPage.jsx');
  assert.match(lecturerPage, /id: item\.sessionId \?\? item\.id/);
  assert.match(lecturerPage, /params: \{ groupId: sess\.groupId \}/);
  assert.match(lecturerPage, /review-attendance\/\$\{selectedSession\.id\}\/groups\/\$\{selectedSession\.groupId\}\/complete/);
  assert.doesNotMatch(lecturerPage, /listProjectDocuments\(sess\.groupId\)/);
});

test('progress comments use a scoped realtime channel and an optimistic conversation UI', async () => {
  const [lecturerPage, realtimeService, environment] = await Promise.all([
    readSource('../src/pages/lecturer/ReviewScoringPage.jsx'),
    readSource('../src/services/reviewProgress.js'),
    readSource('../src/config/environment.js'),
  ]);

  assert.match(environment, /REVIEW_PROGRESS_HUB_URL/);
  assert.match(realtimeService, /withAutomaticReconnect/);
  assert.match(realtimeService, /JoinReviewProgress/);
  assert.match(realtimeService, /reviewProgressCommentAdded/);
  assert.match(lecturerPage, /reviewProgressService\.join/);
  assert.match(lecturerPage, /mergeProgressComment\(response\.data\)/);
  assert.match(lecturerPage, /Đang cập nhật trực tiếp/);
  assert.match(lecturerPage, /aria-live="polite"/);
  assert.match(lecturerPage, /width: '100%', boxSizing: 'border-box', minHeight: 104/);
  assert.match(lecturerPage, /disabled=\{!canSendComment\}/);
  assert.match(lecturerPage, /id="rev-comment-shortcut"/);
});

test('lecturer attendance is integrated into the direct defense room', async () => {
  const [app, sidebar, lecturerPage] = await Promise.all([
    readSource('../src/App.jsx'),
    readSource('../src/components/common/Sidebar.jsx'),
    readSource('../src/pages/lecturer/ReviewScoringPage.jsx'),
  ]);

  assert.doesNotMatch(app, /DefenseRoomPage|\/lecturer\/defenses/);
  assert.match(sidebar, /to="\/lecturer\/reviews"/);
  assert.match(sidebar, /Phòng Bảo vệ Trực tiếp/);
  assert.match(app, /path="\/lecturer\/attendance"/);
  assert.match(app, /<Navigate to="\/lecturer\/reviews" replace \/>/);
  assert.doesNotMatch(sidebar, /to="\/lecturer\/attendance"/);
  assert.match(app, /path="\/lecturer\/reviews"/);
  assert.match(app, /<ReviewScoringPage \/>/);
  assert.match(lecturerPage, /setActiveTab\('attendance'\)/);
  assert.match(lecturerPage, /<span>Điểm danh Sinh viên<\/span>/);
  assert.doesNotMatch(lecturerPage, /attendanceOnly/);
  assert.doesNotMatch(sidebar, /SignalR Live Room|Live Room|\/lecturer\/defenses/);
});

test('training department access codes gate the lecturer review room', async () => {
  const [managementPage, lecturerPage, accessService] = await Promise.all([
    readSource('../src/pages/admin/ReviewManagementPage.jsx'),
    readSource('../src/pages/lecturer/ReviewScoringPage.jsx'),
    readSource('../src/services/reviewSessionAccess.js'),
  ]);

  assert.match(accessService, /review-sessions\/\$\{sessionId\}\/access-code/);
  assert.match(accessService, /review-sessions\/\$\{sessionId\}\/access-code\/verify/);
  assert.match(managementPage, /generateReviewSessionAccessCode/);
  assert.match(managementPage, /Tạo mã theo ca/);
  assert.match(managementPage, /user\?\.role === 'TrainingDepartment'/);
  assert.match(managementPage, /chỉ hiển thị trong lần tạo này/i);
  assert.match(lecturerPage, /verifyReviewSessionAccessCode/);
  assert.match(lecturerPage, /selectedSession\?\.isAccessVerified === true/);
  assert.match(lecturerPage, /if \(!selectedSession\.isAccessVerified\)/);
  assert.match(lecturerPage, /if \(!selectedSession\?\.isAccessVerified\) return undefined/);
  assert.match(lecturerPage, /Nhập mã để mở ca review/);
  assert.match(lecturerPage, /Điểm danh Sinh viên/);
});

test('training department creates one shared code for every group in a selected slot', async () => {
  const managementPage = await readSource('../src/pages/admin/ReviewManagementPage.jsx');
  const panelIndex = managementPage.indexOf('Tạo mã theo ca');
  const stepperIndex = managementPage.indexOf('{/* Stepper */}');

  assert.ok(panelIndex > 0, 'The standalone access-code selector must be rendered.');
  assert.ok(panelIndex < stepperIndex, 'The selector must be available before the Publish stepper.');
  assert.match(managementPage, /selectedAccessCodeSlotKey/);
  assert.match(managementPage, /reviewAccessCodeSlots/);
  assert.match(managementPage, /affectedSessionIds/);
  assert.match(managementPage, /một mã chung cho/);
  assert.match(managementPage, /getReviewSlotTime/);
  assert.match(managementPage, /Chọn ca review/);
});

test('review submissions support multiple official comments per lecturer', async () => {
  const [lecturerPage, reviewManagementPage] = await Promise.all([
    readSource('../src/pages/lecturer/ReviewScoringPage.jsx'),
    readSource('../src/pages/admin/ReviewManagementPage.jsx'),
  ]);

  assert.match(lecturerPage, /const \[evalComments, setEvalComments\] = useState\(\[''\]\)/);
  assert.match(lecturerPage, /reviewerComments: normalizedEvalComments/);
  assert.match(lecturerPage, /evalComments\.map\(\(comment, index\)/);
  assert.match(lecturerPage, /Thêm nhận xét/);
  assert.match(lecturerPage, /removeEvaluationComment\(index\)/);
  assert.match(lecturerPage, /Hội đồng: \$\{selectedSession\.reviewerCount\} giảng viên/);
  assert.match(reviewManagementPage, /MAX_REVIEWERS_PER_SLOT = 4/);
  assert.match(reviewManagementPage, /reviewersPerSession: MIN_REVIEWERS_PER_SESSION/);
  assert.doesNotMatch(reviewManagementPage, /setReviewersPerSession/);
});

test('lecturer review room shows official feedback from previous review rounds', async () => {
  const lecturerPage = await readSource('../src/pages/lecturer/ReviewScoringPage.jsx');

  assert.match(lecturerPage, /review-submissions\/\$\{encodeURIComponent\(String\(submissionId\)\)\}\/previous/);
  assert.match(lecturerPage, /Nhận xét từ các đợt Review trước/);
  assert.match(lecturerPage, /feedback\.reviewerComments/);
  assert.match(lecturerPage, /feedback\.reviewerName/);
});

test('admin can inspect semester groups and export all review reports', async () => {
  const [semesterPage, trackingPage, reviewManagementPage] = await Promise.all([
    readSource('../src/pages/admin/SemesterManagementPage.jsx'),
    readSource('../src/pages/admin/ReviewTrackingPage.jsx'),
    readSource('../src/pages/admin/ReviewManagementPage.jsx'),
  ]);
  assert.match(semesterPage, /semesters\/\$\{semester\.id\}\/groups/);
  assert.match(trackingPage, /review-submissions\/export\.zip/);
  assert.match(reviewManagementPage, /review-scheduling\/student-registrations/);
});

test('review detail opens at the top and lets admin download submitted documents', async () => {
  const trackingPage = await readSource('../src/pages/admin/ReviewTrackingPage.jsx');

  assert.match(trackingPage, /groupId: item\.groupId/);
  assert.match(trackingPage, /listProjectDocuments\(selectedItem\.groupId\)/);
  assert.match(trackingPage, /studentSubmitted: documents\.length > 0/);
  assert.match(trackingPage, /documentCount: documents\.length/);
  assert.doesNotMatch(trackingPage, /studentSubmitted: item\.status !== 'Scheduled'/);
  assert.match(trackingPage, /downloadProjectDocument\(projectDocument\.id\)/);
  assert.match(trackingPage, /createPortal\(\(/);
  assert.match(trackingPage, /\), document\.body\)/);
  assert.match(trackingPage, /alignItems: 'flex-start'/);
  assert.match(trackingPage, /TẢI VỀ|Tải về/);
  assert.match(trackingPage, /A corrupt\/missing legacy document must not hide the whole review board/);
});
