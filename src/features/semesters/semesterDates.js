const toLocalIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalToday = () => toLocalIsoDate(new Date());

export const isDateWithinSemester = (semester, date = getLocalToday()) => Boolean(
  semester?.startDate && semester?.endDate && date >= semester.startDate && date <= semester.endDate
);

export const getActivationBlockedMessage = (semester, date = getLocalToday()) =>
  `Không thể mở kỳ ${semester.code}. Ngày hiện tại ${date} không nằm trong thời gian ${semester.startDate} - ${semester.endDate}.`;
