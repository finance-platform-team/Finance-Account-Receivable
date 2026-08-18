import { deleteFileFromFlow, fetchProofFilesFromFlow, uploadFileToFlow } from '../../shared/proofFiles';
import type { ProofFile } from '../../shared/proofFiles';
import type { ProofFilesTarget } from '../../shared/components/ProofFilesDrawer';

/**
 * Same Power Automate flow AR Verification calls (see "AR Verification/proofFiles.ts")
 * — reused here per instruction, since disputes are assumed to land in the same
 * flow/SharePoint setup.
 */
const DOCS_FLOW_URL =
  'https://9ce6fb095b63e9f49185b707b4b342.5e.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/30/workflows/f925d853a7c944ca88f9e886f1290e45/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XnsQ8q4II-APCA1K7gBM--Zd0E_2kcqxV5fnaVVDlDU';

export function fetchDisputeProofFiles(docsFolder: string): Promise<ProofFile[]> {
  return fetchProofFilesFromFlow(DOCS_FLOW_URL, docsFolder);
}

// TODO CONFIRM: the flow's upload action also updates a record identified by
// collectionId/collectionRef — per ref.html's comment, that write targets
// cfm_dailycollections specifically ("GUID → flow updates the Daily
// Collection record"). A dispute's id/code aren't Daily Collection records,
// so they're deliberately NOT sent here — sending them could make the flow
// try (and fail, or worse write to the wrong record) to patch a Daily
// Collection row that doesn't exist. The SharePoint upload itself should
// still work; only that side-effect write is skipped for disputes.
export function uploadDisputeProofFile(target: ProofFilesTarget, file: File): Promise<void> {
  return uploadFileToFlow(DOCS_FLOW_URL, target.folder, file);
}

export function deleteDisputeProofFile(target: ProofFilesTarget, file: ProofFile): Promise<void> {
  if (!file.path) return Promise.reject(new Error('This file has no path from the flow — cannot delete.'));
  return deleteFileFromFlow(DOCS_FLOW_URL, target.folder, file.path);
}
