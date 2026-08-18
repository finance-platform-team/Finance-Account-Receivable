import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { fileExt, fileIcon, fileIconClass } from '../proofFiles';
import type { ProofFile } from '../proofFiles';

export interface ProofFilesTarget {
  title: string;
  folder: string;
  proofUrl: string;
  recordId?: string;
  recordRef?: string;
}

interface ProofFilesDrawerProps {
  target: ProofFilesTarget | null;
  onClose: () => void;
  fetchFiles: (folder: string) => Promise<ProofFile[]>;
  uploadFile?: (target: ProofFilesTarget, file: File) => Promise<void>;
  deleteFile?: (target: ProofFilesTarget, file: ProofFile) => Promise<void>;
}

/** Maps proofFiles.ts's icon-class names onto this app's tinted tokens. */
function fileTone(fileName: string): { bg: string; color: string } {
  switch (fileIconClass(fileName)) {
    case 'pdf':
      return { bg: 'var(--badbg)', color: 'var(--bad)' };
    case 'img':
      return { bg: 'var(--okbg)', color: 'var(--ok)' };
    case 'doc':
      return { bg: 'var(--infobg)', color: 'var(--info)' };
    case 'xls':
      return { bg: 'var(--okbg)', color: 'var(--ok)' };
    default:
      return { bg: 'var(--goldbg)', color: 'var(--brown)' };
  }
}

export function ProofFilesDrawer({ target, onClose, fetchFiles, uploadFile, deleteFile }: ProofFilesDrawerProps) {
  const [files, setFiles] = useState<ProofFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [displayTarget, setDisplayTarget] = useState<ProofFilesTarget | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Bumped whenever `target` changes, so an in-flight upload/delete poll (see
  // pollUntil below) from a previous target can tell it's stale and stop.
  const generationRef = useRef(0);

  const open = target !== null;
  // Same "never conditionally unmount" idiom as PaymentTermFormModal — keep the
  // last-loaded target's title visible while the drawer slides shut.
  const active = target ?? displayTarget;

  useEffect(() => {
    generationRef.current += 1;
    if (!target) return;
    const current = target;
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayTarget(current);

    async function load() {
      setLoading(true);
      setError(null);
      setActionError(null);
      setFiles([]);
      try {
        const result = await fetchFiles(current.folder);
        if (!cancelled) setFiles(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load files.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, [target, fetchFiles]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const looksLikeTimeout = (message: string) => /502|no response|timeout|gateway/i.test(message);

  /** After a flow call errors with what looks like a gateway timeout, the flow
   * itself is often still running server-side and finishes moments later — a
   * single immediate refetch is usually too early to see that. Poll a few
   * times over ~15s instead of giving up (or clearing the error) after one try. */
  const pollUntil = async (folder: string, isResolved: (files: ProofFile[]) => boolean, generation: number) => {
    const attempts = [0, 3000, 4000, 4000, 4000]; // ~15s total, first check immediate
    for (const delay of attempts) {
      if (delay) await sleep(delay);
      if (generationRef.current !== generation) return; // drawer moved to a different record
      try {
        const result = await fetchFiles(folder);
        if (generationRef.current !== generation) return;
        setFiles(result);
        if (isResolved(result)) {
          setActionError(null);
          return;
        }
      } catch {
        // Keep polling — a transient list failure shouldn't stop the retry loop.
      }
    }
    if (generationRef.current === generation) {
      setActionError('Still not confirmed after 15s — click Upload/Delete again once you\'ve checked, or reopen this drawer later.');
    }
  };

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !active || !uploadFile) return;
    const generation = generationRef.current;
    // Compare COUNT, not the exact uploaded name — SharePoint renames on a
    // filename collision (e.g. "Report.pdf" → "Report 2.pdf"), so waiting for
    // the original name to show up would never resolve for a renamed file
    // even though the upload succeeded.
    const countBefore = files.length;
    setUploading(true);
    setActionError(null);
    try {
      await uploadFile(active, file);
      const result = await fetchFiles(active.folder);
      setFiles(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload file.';
      // A gateway timeout doesn't mean it failed — the flow is usually still
      // running. Stay quiet and keep checking; only surface an error if it
      // genuinely never resolves.
      if (looksLikeTimeout(message)) {
        await pollUntil(active.folder, (result) => result.length > countBefore, generation);
      } else {
        setActionError(message);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: ProofFile) => {
    if (!active || !deleteFile || !file.path) return;
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    const generation = generationRef.current;
    setDeletingPath(file.path);
    setActionError(null);
    try {
      await deleteFile(active, file);
      const result = await fetchFiles(active.folder);
      setFiles(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete file.';
      if (looksLikeTimeout(message)) {
        await pollUntil(active.folder, (files) => !files.some((f) => f.path === file.path), generation);
      } else {
        setActionError(message);
      }
    } finally {
      setDeletingPath(null);
    }
  };

  return (
    <>
      <div className={`acc-scrim${open ? ' on' : ''}`} onClick={onClose} />
      <aside className={`acc-drawer${open ? ' on' : ''}`} role="dialog">
        <div className="acc-dhead">
          <h2>
            <i className="fa-solid fa-folder-open" style={{ color: 'var(--gold)', fontSize: 16 }} />
            {active?.title}
          </h2>
          <button className="acc-dclose" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="acc-dbody">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--brown)',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <i className="fa-solid fa-paperclip" style={{ color: 'var(--gold)' }} />
              Documents {!loading && !error && `(${files.length})`}
            </div>
            {uploadFile && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileSelected}
                />
                <button
                  className="acc-btn"
                  style={{ padding: '5px 12px', fontSize: 11.5 }}
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-upload'}`} />{' '}
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </>
            )}
          </div>

          {actionError && <div className="acc-err on">{actionError}</div>}

          {loading ? (
            <div className="acc-state">
              <i className="fa-solid fa-spinner fa-spin" />
              Loading files…
            </div>
          ) : error ? (
            <div className="acc-state">
              <i className="fa-solid fa-circle-exclamation" />
              {error}
              {active?.proofUrl && (
                <div style={{ marginTop: 10 }}>
                  <a href={active.proofUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                    Open in SharePoint
                  </a>
                </div>
              )}
            </div>
          ) : files.length === 0 ? (
            <div className="acc-state">
              <i className="fa-solid fa-folder-open" />
              No files found in this folder yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {files.map((f) => {
                const tone = fileTone(f.name);
                return (
                  <div
                    key={f.url}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      border: '1px solid var(--line)',
                      borderRadius: 9,
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: tone.bg,
                        color: tone.color,
                      }}
                    >
                      <i className={`fa-solid ${fileIcon(f.name)}`} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontWeight: 600,
                          fontSize: 13,
                          color: 'var(--ink)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {f.name}
                      </span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                        {fileExt(f.name)}
                        {f.size != null ? ` · ${Math.round(f.size / 1024)} KB` : ''}
                      </span>
                    </span>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="acc-btn"
                      style={{ padding: '6px 9px' }}
                      title="Open"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square" />
                    </a>
                    {deleteFile && (
                      <button
                        className="acc-btn"
                        style={{ padding: '6px 9px' }}
                        disabled={!f.path || deletingPath === f.path}
                        title={f.path ? 'Delete' : 'This file has no path from the flow — cannot delete.'}
                        onClick={() => handleDelete(f)}
                      >
                        <i className={`fa-solid ${deletingPath === f.path ? 'fa-spinner fa-spin' : 'fa-trash'}`} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="acc-hint" style={{ marginTop: 12 }}>
            Any file type. Stored on SharePoint, not in Dataverse.
          </div>
        </div>
      </aside>
    </>
  );
}
