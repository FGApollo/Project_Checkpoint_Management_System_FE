import api from './api';

const getFileName = (contentDisposition, submissionId) => {
  const utf8Match = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const fileNameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return fileNameMatch?.[1] || `review-submission-${submissionId}.xlsx`;
};

export const downloadReviewReport = async (submissionId) => {
  if (!Number.isInteger(Number(submissionId)) || Number(submissionId) <= 0) {
    throw new Error('Mã phiếu đánh giá không hợp lệ.');
  }

  const response = await api.get(`/review-submissions/${submissionId}/export.xlsx`, {
    responseType: 'blob',
  });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');

  try {
    link.href = objectUrl;
    link.download = getFileName(response.headers['content-disposition'], submissionId);
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }
};
