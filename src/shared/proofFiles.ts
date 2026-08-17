export interface ProofFile {
  name: string;
  url: string;
  path?: string;
  size?: number;
}

async function docsFlow(flowUrl: string, payload: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(flowUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flow ${res.status}: ${text.slice(0, 200)}`);
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export interface UploadExtra {
  collectionId?: string;
  collectionRef?: string;
}

/** Confirmed contract, from ref.html's onDocsSelected() (the Daily Collection
 * entry drawer's real upload code — the field is fileContentBase64, not
 * contentBase64, and the flow also expects the parent record's id/ref so it
 * can update cfm_proof on save). */
export async function uploadFileToFlow(
  flowUrl: string,
  folderName: string,
  file: File,
  extra: UploadExtra = {}
): Promise<void> {
  const fileContentBase64 = await fileToBase64(file);
  await docsFlow(flowUrl, {
    action: 'upload',
    folderName,
    fileName: file.name,
    fileContentBase64,
    ...(extra.collectionId ? { collectionId: extra.collectionId } : {}),
    ...(extra.collectionRef ? { collectionRef: extra.collectionRef } : {}),
  });
}

/** Confirmed contract, from ref.html's deleteDoc(). filePath must be the
 * `path` field the flow itself returned for that file in the 'list' response
 * (not the display url). */
export async function deleteFileFromFlow(flowUrl: string, folderName: string, filePath: string): Promise<void> {
  await docsFlow(flowUrl, { action: 'delete', folderName, filePath });
}

const NOT_FOUND_RE = /not\s*found|404|does not exist|itemnotfound|list not found|no\s*such/i;

/** Matches ref.html's openProofModal(): a "not found" flow error just means the
 * SharePoint folder hasn't been created yet (no files uploaded) — treat as empty. */
export async function fetchProofFilesFromFlow(flowUrl: string, folderName: string): Promise<ProofFile[]> {
  let res: unknown;
  try {
    res = await docsFlow(flowUrl, { action: 'list', folderName });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (NOT_FOUND_RE.test(message)) return [];
    throw err;
  }

  let files: unknown[] = [];
  if (Array.isArray(res)) files = res;
  else if (res && typeof res === 'object' && Array.isArray((res as { value?: unknown[] }).value)) {
    files = (res as { value: unknown[] }).value;
  } else if (res && typeof res === 'object' && Array.isArray((res as { files?: unknown[] }).files)) {
    files = (res as { files: unknown[] }).files;
  }

  return files.map((f) => {
    const rec = f as Record<string, unknown>;
    return {
      name: typeof rec.name === 'string' ? rec.name : 'file',
      url: typeof rec.url === 'string' ? rec.url : '#',
      path: typeof rec.path === 'string' ? rec.path : undefined,
      size: typeof rec.size === 'number' ? rec.size : undefined,
    };
  });
}

export function fileIconClass(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'heic'].includes(ext)) return 'img';
  if (['doc', 'docx', 'rtf', 'txt'].includes(ext)) return 'doc';
  if (['xls', 'xlsx', 'xlsb', 'csv'].includes(ext)) return 'xls';
  return '';
}

export function fileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'fa-file-pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'heic'].includes(ext)) return 'fa-file-image';
  if (['doc', 'docx', 'rtf', 'txt'].includes(ext)) return 'fa-file-word';
  if (['xls', 'xlsx', 'xlsb', 'csv'].includes(ext)) return 'fa-file-excel';
  if (['ppt', 'pptx'].includes(ext)) return 'fa-file-powerpoint';
  if (['zip', 'rar', '7z'].includes(ext)) return 'fa-file-zipper';
  return 'fa-file';
}

export function fileExt(fileName: string): string {
  return fileName.split('.').pop()?.toUpperCase() ?? '';
}
