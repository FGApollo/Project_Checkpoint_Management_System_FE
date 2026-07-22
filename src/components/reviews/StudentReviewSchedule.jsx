import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { getReviewSlotLabel } from '../../features/reviews/reviewSlots.js';
import {
  filterReviewSessions,
  getReviewReminder,
  REVIEW_TIME_ZONE,
} from '../../features/reviews/reviewSessionDates.js';

const FILTERS = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'all', label: 'Tất cả' },
];

const formatReviewDate = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: REVIEW_TIME_ZONE,
  }).format(new Date(value))
  : 'Chưa xác định';

const StudentReviewSchedule = ({ schedules = [], groupCode }) => {
  const [activeFilter, setActiveFilter] = useState('today');
  const todaySchedules = filterReviewSessions(schedules, 'today');
  const upcomingSchedules = filterReviewSessions(schedules, 'upcoming');
  const filteredSchedules = filterReviewSessions(schedules, activeFilter);

  useEffect(() => {
    const today = filterReviewSessions(schedules, 'today');
    const upcoming = filterReviewSessions(schedules, 'upcoming');
    if (today.length > 0) setActiveFilter('today');
    else if (upcoming.length > 0) setActiveFilter('upcoming');
    else setActiveFilter('all');
  }, [schedules]);

  if (schedules.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', lineHeight: 1.6, fontWeight: 500 }}>
        Nhóm chưa có lịch review chính thức nào được công bố. Vui lòng chờ Phòng Đào tạo xếp lịch và thông báo.
      </div>
    );
  }

  const filterCounts = {
    today: todaySchedules.length,
    upcoming: upcomingSchedules.length,
    all: schedules.length,
  };

  return (
    <div>
      <div role="tablist" aria-label="Lọc lịch review của sinh viên theo ngày" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFilter(filter.key)}
              style={{
                border: `1px solid ${isActive ? '#F26522' : '#CBD5E1'}`,
                borderRadius: '999px',
                padding: '0.5rem 0.85rem',
                background: isActive ? '#FFF7ED' : '#FFFFFF',
                color: isActive ? '#C2410C' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {filter.label} ({filterCounts[filter.key]})
            </button>
          );
        })}
      </div>

      {filteredSchedules.length === 0 ? (
        <div role="tabpanel" style={{ padding: '2rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
          {activeFilter === 'today' ? 'Hôm nay nhóm chưa có lịch review.' : 'Không có lịch review sắp tới.'}
        </div>
      ) : (
        <div role="tabpanel" className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã nhóm</th>
                <th>Ngày review</th>
                <th>Ca & khung giờ</th>
                <th>Phòng</th>
                <th>Vòng Review</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule) => {
                const reminder = getReviewReminder(schedule.sessionDate);
                return (
                  <tr key={schedule.sessionId ?? schedule.id ?? `${schedule.groupId}-${schedule.sessionDate}-${schedule.slot}`}>
                    <td>
                      <span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontWeight: 800 }}>
                        {schedule.groupCode || groupCode || `Nhóm #${schedule.groupId}`}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', textTransform: 'capitalize' }}>
                        <CalendarDays size={15} color="#F26522" />
                        {formatReviewDate(schedule.sessionDate)}
                        {reminder && (
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '999px', background: reminder === 'Hôm nay' ? '#F26522' : '#FFEDD5', color: reminder === 'Hôm nay' ? '#FFFFFF' : '#C2410C', fontSize: '0.7rem', fontWeight: 800 }}>
                            {reminder}
                          </span>
                        )}
                      </span>
                    </td>
                    <td style={{ color: '#334155', fontWeight: 700 }}>{getReviewSlotLabel(schedule.slot)}</td>
                    <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#047857', fontWeight: 800 }}>{schedule.room || 'Chưa xếp phòng'}</span></td>
                    <td style={{ color: '#475569', fontWeight: 600 }}>{schedule.type || 'Review Checkpoint'}</td>
                    <td><span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0369A1', fontWeight: 800 }}>{schedule.status || schedule.groupStatus || 'Đã công bố'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentReviewSchedule;
