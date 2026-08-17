import { deleteFileFromFlow, fetchProofFilesFromFlow, uploadFileToFlow } from '../../shared/proofFiles';
import type { ProofFile } from '../../shared/proofFiles';
import type { ProofFilesTarget } from '../../shared/components/ProofFilesDrawer';

/**
 * Same Power Automate flow the reference web resource calls for both the
 * Daily Collection entry drawer's real upload code and AR Verification's
 * "View files" list — SETTINGS.docsFlowUrl in ref.html. list/upload/delete
 * all match the confirmed contract from ref.html's docsFlow() call sites.
 */
const DOCS_FLOW_URL =
  'https://9ce6fb095b63e9f49185b707b4b342.5e.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/30/workflows/f925d853a7c944ca88f9e886f1290e45/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XnsQ8q4II-APCA1K7gBM--Zd0E_2kcqxV5fnaVVDlDU';

export function fetchProofFiles(docsFolder: string): Promise<ProofFile[]> {
  return fetchProofFilesFromFlow(DOCS_FLOW_URL, docsFolder);
}

export function uploadProofFile(target: ProofFilesTarget, file: File): Promise<void> {
  return uploadFileToFlow(DOCS_FLOW_URL, target.folder, file, {
    collectionId: target.recordId,
    collectionRef: target.recordRef,
  });
}

export function deleteProofFile(target: ProofFilesTarget, file: ProofFile): Promise<void> {
  if (!file.path) return Promise.reject(new Error('This file has no path from the flow — cannot delete.'));
  return deleteFileFromFlow(DOCS_FLOW_URL, target.folder, file.path);
}
