import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('student and lecturer use the shared authenticated document viewer', async () => {
  const [studentPage, lecturerPage, viewer] = await Promise.all([
    readSource('../src/pages/student/StudentDashboard.jsx'),
    readSource('../src/pages/lecturer/ReviewScoringPage.jsx'),
    readSource('../src/components/documents/DocumentViewerModal.jsx'),
  ]);

  assert.match(studentPage, /DocumentViewerModal/);
  assert.match(lecturerPage, /DocumentViewerModal/);
  assert.match(viewer, /downloadProjectDocument/);
  assert.match(viewer, /download=/);
  assert.match(viewer, /Tải xuống/);
});

test('document viewer previews the upload formats instead of forcing a download', async () => {
  const viewer = await readSource('../src/components/documents/DocumentViewerModal.jsx');

  assert.match(viewer, /\.pdf/);
  assert.match(viewer, /\.docx/);
  assert.match(viewer, /\.txt/);
  assert.match(viewer, /\.zip/);
  assert.match(viewer, /extractRawText/);
  assert.match(viewer, /JSZip/);
});
