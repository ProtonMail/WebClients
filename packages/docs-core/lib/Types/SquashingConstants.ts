import { isDevOrBlack } from '@proton/docs-shared'
import type { DocumentType } from '@proton/drive-store/store/_documents'

/** Number of DUs in a commit before we need to squash */
export function GetCommitDULimit(documentType: DocumentType) {
  if (isDevOrBlack()) {
    return 50
  } else if (documentType === 'sheet') {
    return 250
  } else {
    return 500
  }
}

/** What fraction of SQUASH_THRESHOLD should be kept after a squash */
export const SQUASH_FACTOR = 0.5
