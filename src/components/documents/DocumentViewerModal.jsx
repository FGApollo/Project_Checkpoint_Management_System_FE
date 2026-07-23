import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileArchive, FileText, LoaderCircle, X } from 'lucide-react';
import { downloadProjectDocument } from '../../services/documents.js';

const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.csv', '.json', '.xml', '.log',
  '.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.sql',
]);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

const getExtension = (fileName = '') => {
  const match = fileName.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] || '';
};

const formatBytes = (bytes = 0) => {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) return '';
  const megabytes = Number(bytes) / 1024 / 1024;
  return megabytes >= 0.1 ? `${megabytes.toFixed(2)} MB` : `${Math.ceil(Number(bytes) / 1024)} KB`;
};

const parsePreview = async (blob, extension) => {
  if (extension === '.pdf') return { kind: 'pdf' };
  if (IMAGE_EXTENSIONS.has(extension)) return { kind: 'image' };
  if (TEXT_EXTENSIONS.has(extension)) {
    return { kind: 'text', text: await blob.text() };
  }
  if (extension === '.docx') {
    return { kind: 'docx', blob };
  }
  if (extension === '.zip') {
    const { default: JSZip } = await import('jszip');
    const archive = await JSZip.loadAsync(await blob.arrayBuffer());
    const entries = Object.values(archive.files)
      .sort((left, right) => left.name.localeCompare(right.name, 'vi'))
      .slice(0, 500)
      .map((entry) => ({
        name: entry.name,
        isDirectory: entry.dir,
      }));
    return {
      kind: 'archive',
      entries,
      truncated: Object.keys(archive.files).length > entries.length,
    };
  }
  return { kind: 'unsupported' };
};

const DocxPreview = ({ blob, fileName }) => {
  const containerRef = useRef(null);
  const [renderError, setRenderError] = useState('');

  useEffect(() => {
    if (!blob || !containerRef.current) return undefined;
    let active = true;
    const container = containerRef.current;
    container.replaceChildren();
    setRenderError('');

    import('docx-preview')
      .then(({ renderAsync }) => renderAsync(blob, container, container, {
        className: 'docx-preview',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        useBase64URL: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
      }))
      .catch(() => {
        if (active) setRenderError('Không thể dựng bố cục DOCX. Bạn vẫn có thể tải file xuống.');
      });

    return () => {
      active = false;
      container.replaceChildren();
    };
  }, [blob]);

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '1rem', background: '#CBD5E1' }}>
      {renderError && <div role="alert" style={{ padding: '0.8rem', marginBottom: '0.75rem', borderRadius: '0.65rem', background: '#FEF2F2', color: '#B91C1C' }}>{renderError}</div>}
      <div ref={containerRef} aria-label={`Nội dung ${fileName}`} />
    </div>
  );
};

const PreviewBody = ({ preview, objectUrl, fileName }) => {
  if (preview.kind === 'loading') {
    return (
      <div style={{ minHeight: 320, display: 'grid', placeItems: 'center', color: '#475569' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700 }}>
          <LoaderCircle className="spin" size={20} /> Đang mở tài liệu...
        </span>
      </div>
    );
  }
  if (preview.kind === 'error') {
    return (
      <div role="alert" style={{ margin: '2rem', padding: '1rem', borderRadius: '0.75rem', background: '#FEF2F2', color: '#B91C1C' }}>
        {preview.message}
      </div>
    );
  }
  if (preview.kind === 'pdf') {
    return <iframe title={`Xem ${fileName}`} src={objectUrl} style={{ width: '100%', height: '100%', minHeight: 480, border: 0, background: '#F8FAFC' }} />;
  }
  if (preview.kind === 'image') {
    return (
      <div style={{ height: '100%', overflow: 'auto', display: 'grid', placeItems: 'center', padding: '1rem', background: '#F8FAFC' }}>
        <img src={objectUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
    );
  }
  if (preview.kind === 'docx') {
    return <DocxPreview blob={preview.blob} fileName={fileName} />;
  }
  if (preview.kind === 'text') {
    return (
      <div style={{ height: '100%', overflow: 'auto', padding: '1.25rem', background: '#F8FAFC' }}>
        {preview.note && <p style={{ margin: '0 0 0.75rem', color: '#92400E', fontSize: '0.8rem', fontWeight: 650 }}>{preview.note}</p>}
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: '#0F172A', font: '0.88rem/1.65 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>{preview.text}</pre>
      </div>
    );
  }
  if (preview.kind === 'archive') {
    return (
      <div style={{ height: '100%', overflow: 'auto', padding: '1.25rem', background: '#F8FAFC' }}>
        <p style={{ margin: '0 0 0.8rem', color: '#475569', fontSize: '0.85rem' }}>Danh sách nội dung trong file ZIP:</p>
        {preview.entries.length === 0
          ? <p style={{ color: '#64748B' }}>File ZIP không có nội dung.</p>
          : preview.entries.map((entry) => (
            <div key={entry.name} style={{ padding: '0.55rem 0.7rem', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
              {entry.isDirectory ? <FileArchive size={16} color="#D97706" /> : <FileText size={16} color="#4F46E5" />}
              <span style={{ overflowWrap: 'anywhere', fontSize: '0.85rem', color: '#0F172A' }}>{entry.name}</span>
            </div>
          ))}
        {preview.truncated && <p style={{ color: '#92400E', fontSize: '0.8rem' }}>Chỉ hiển thị 500 mục đầu tiên.</p>}
      </div>
    );
  }
  return (
    <div style={{ minHeight: 320, display: 'grid', placeItems: 'center', padding: '2rem', textAlign: 'center', color: '#475569' }}>
      <div>
        <FileText size={42} color="#94A3B8" />
        <p>Định dạng này chưa hỗ trợ xem trực tiếp. Bạn vẫn có thể tải file xuống.</p>
      </div>
    </div>
  );
};

const DocumentViewerModal = ({ document, onClose, aside = null }) => {
  const [objectUrl, setObjectUrl] = useState('');
  const [preview, setPreview] = useState({ kind: 'loading' });
  const extension = useMemo(() => getExtension(document?.fileName), [document?.fileName]);

  useEffect(() => {
    if (!document?.id) return undefined;
    let active = true;
    let nextObjectUrl = '';

    setPreview({ kind: 'loading' });
    setObjectUrl('');
    downloadProjectDocument(document.id)
      .then(async (response) => {
        const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
        nextObjectUrl = URL.createObjectURL(blob);
        const nextPreview = await parsePreview(blob, extension);
        if (!active) {
          URL.revokeObjectURL(nextObjectUrl);
          nextObjectUrl = '';
          return;
        }
        setObjectUrl(nextObjectUrl);
        setPreview(nextPreview);
      })
      .catch((error) => {
        if (!active) return;
        setPreview({
          kind: 'error',
          message: error.response?.data?.error || 'Không thể mở tài liệu này.',
        });
      });

    return () => {
      active = false;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [document?.id, extension]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!document) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Xem tài liệu ${document.fileName}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15, 23, 42, 0.72)', display: 'grid', placeItems: 'center', padding: '1rem' }}
    >
      <div style={{ width: 'min(1280px, 100%)', height: 'min(900px, 95vh)', background: '#FFFFFF', borderRadius: '1rem', overflow: 'hidden', display: 'grid', gridTemplateColumns: aside ? 'minmax(0, 1fr) minmax(300px, 360px)' : 'minmax(0, 1fr)', boxShadow: '0 24px 70px rgba(15, 23, 42, 0.35)' }}>
        <section style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <header style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ minWidth: 0 }}>
              <strong style={{ display: 'block', overflowWrap: 'anywhere', color: '#0F172A' }}>{document.fileName}</strong>
              <small style={{ color: '#64748B' }}>{formatBytes(document.fileSize)}</small>
            </span>
            <span style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <a
                className="btn btn-primary"
                href={objectUrl || undefined}
                download={document.fileName}
                aria-disabled={!objectUrl}
                onClick={(event) => {
                  if (!objectUrl) event.preventDefault();
                }}
              >
                <Download size={15} /> Tải xuống
              </a>
              <button type="button" className="btn btn-secondary" onClick={onClose} aria-label="Đóng trình xem tài liệu">
                <X size={16} /> Đóng
              </button>
            </span>
          </header>
          <div style={{ flex: 1, minHeight: 0 }}>
            <PreviewBody preview={preview} objectUrl={objectUrl} fileName={document.fileName} />
          </div>
        </section>
        {aside && <aside style={{ minWidth: 0, minHeight: 0, borderLeft: '1px solid #E2E8F0', overflow: 'hidden' }}>{aside}</aside>}
      </div>
    </div>
  );
};

export default DocumentViewerModal;
