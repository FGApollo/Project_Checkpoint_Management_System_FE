import React from 'react';
import './Skeleton.css';

export const SkeletonBlock = ({ width = '100%', height = '1rem', radius = '8px', style = {} }) => (
  <span className="skeleton-block" aria-hidden="true" style={{ width, height, borderRadius: radius, ...style }} />
);

export const SkeletonText = ({ lines = 3, widths = ['100%', '88%', '64%'] }) => (
  <div className="skeleton-stack" aria-hidden="true">
    {Array.from({ length: lines }, (_, index) => (
      <SkeletonBlock key={index} width={widths[index % widths.length]} height="0.8rem" />
    ))}
  </div>
);

export const SkeletonCardGrid = ({ cards = 3 }) => (
  <div className="skeleton-card-grid" aria-hidden="true">
    {Array.from({ length: cards }, (_, index) => (
      <div className="skeleton-card" key={index}>
        <div className="skeleton-card-heading">
          <SkeletonBlock width="42px" height="42px" radius="12px" />
          <div className="skeleton-stack" style={{ flex: 1 }}>
            <SkeletonBlock width="42%" height="1.35rem" />
            <SkeletonBlock width="66%" height="0.75rem" />
          </div>
        </div>
        <SkeletonText lines={2} widths={['92%', '70%']} />
      </div>
    ))}
  </div>
);

export const TableSkeletonRows = ({ rows = 5, columns = 6 }) => (
  <>
    {Array.from({ length: rows }, (_, rowIndex) => (
      <tr className="skeleton-table-row" key={rowIndex} aria-hidden="true">
        {Array.from({ length: columns }, (_, columnIndex) => (
          <td key={columnIndex}>
            <SkeletonBlock width={columnIndex === 0 ? '54%' : columnIndex === columns - 1 ? '68%' : '86%'} height={columnIndex === 0 ? '0.9rem' : '0.78rem'} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const PanelSkeleton = ({ rows = 4 }) => (
  <div className="skeleton-panel" role="status" aria-label="Đang tải dữ liệu">
    <span className="sr-only">Đang tải dữ liệu...</span>
    <SkeletonBlock width="34%" height="1.25rem" />
    <SkeletonText lines={rows} widths={['100%', '94%', '88%', '72%']} />
  </div>
);

export const PageSkeleton = ({ cards = 3, rows = 5 }) => (
  <div className="page-container skeleton-page" role="status" aria-label="Đang tải nội dung trang">
    <span className="sr-only">Đang tải nội dung trang...</span>
    <div className="skeleton-page-header" aria-hidden="true">
      <div className="skeleton-stack" style={{ width: 'min(520px, 75%)' }}>
        <SkeletonBlock width="48%" height="2rem" />
        <SkeletonBlock width="84%" height="0.85rem" />
      </div>
      <SkeletonBlock width="128px" height="42px" radius="10px" />
    </div>
    <SkeletonCardGrid cards={cards} />
    <div className="skeleton-table-card" aria-hidden="true">
      <SkeletonBlock width="28%" height="1.3rem" style={{ marginBottom: '1.25rem' }} />
      <div className="skeleton-stack">
        {Array.from({ length: rows }, (_, index) => (
          <SkeletonBlock key={index} height="3rem" radius="6px" />
        ))}
      </div>
    </div>
  </div>
);
