import React from 'react';
import { Check, Users } from 'lucide-react';
import { isSlotRegistrationDisabled } from '../../features/reviews/slotRegistrationCapacity.js';

const paletteByTone = {
  lecturer: {
    primary: '#4F46E5',
    selectedBackground: '#EEF2FF',
    availableBackground: '#FFFFFF',
    badgeBackground: '#E0E7FF',
    badgeColor: '#3730A3',
  },
  student: {
    primary: '#F26522',
    selectedBackground: '#FFF7ED',
    availableBackground: '#FFFFFF',
    badgeBackground: '#FFEDD5',
    badgeColor: '#C2410C',
  },
};

const SlotCapacityCell = ({
  selected,
  registeredCount,
  registeredByCurrentUser = false,
  capacity,
  disabled,
  onClick,
  tone = 'lecturer',
  participantLabel,
}) => {
  const palette = paletteByTone[tone] || paletteByTone.lecturer;
  const safeCount = Math.max(0, Number(registeredCount) || 0);
  const safeCapacity = Math.max(1, Number(capacity) || 1);
  const displayCount = Math.min(safeCount, safeCapacity);
  const remaining = Math.max(0, safeCapacity - safeCount);
  const isFull = safeCount >= safeCapacity;
  const cannotSelect = isSlotRegistrationDisabled({
    selected,
    registeredByCurrentUser,
    registeredCount: safeCount,
    capacity: safeCapacity,
    disabled,
  });
  const statusLabel = isFull ? 'Đã đủ' : `Còn ${remaining} chỗ`;
  const accessibleLabel = `${participantLabel}: ${displayCount}/${safeCapacity}, ${statusLabel}${selected ? ', đang chọn' : ''}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cannotSelect}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      style={{
        width: '100%',
        minHeight: '70px',
        padding: '0.55rem 0.6rem',
        borderRadius: '12px',
        border: selected
          ? `2px solid ${palette.primary}`
          : isFull
            ? '1px solid #CBD5E1'
            : '1px solid #E2E8F0',
        background: selected
          ? palette.selectedBackground
          : isFull
            ? '#F8FAFC'
            : palette.availableBackground,
        cursor: cannotSelect ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.35rem',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
        boxShadow: selected ? `0 3px 10px ${palette.primary}24` : 'none',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: selected ? palette.primary : '#334155', fontWeight: 850, fontSize: '0.82rem' }}>
        {selected ? <Check size={16} strokeWidth={3} /> : <Users size={15} />}
        <span>{displayCount}/{safeCapacity}</span>
      </span>
      <span style={{
        padding: '0.18rem 0.48rem',
        borderRadius: '999px',
        background: isFull ? '#E2E8F0' : palette.badgeBackground,
        color: isFull ? '#475569' : palette.badgeColor,
        fontWeight: 750,
        fontSize: '0.7rem',
        whiteSpace: 'nowrap',
      }}>
        {selected ? 'Đang chọn' : statusLabel}
      </span>
    </button>
  );
};

export default SlotCapacityCell;
