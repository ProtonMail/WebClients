import { isDevOrBlack } from '@proton/docs-shared'

/** Number of DUs in a commit before we need to squash */
export function GetCommitDULimit() {
  if (isDevOrBlack()) {
    return 30
  } else {
    return 500
  }
}

/** What fraction of SQUASH_THRESHOLD should be kept after a squash */
export const SQUASH_FACTOR = 0.5
