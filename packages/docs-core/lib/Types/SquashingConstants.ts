import { isDevOrBlack } from '../Util/isDevOrBlack'

/** Number of DUs in a commit before we need to squash */
export function GetCommitDULimit() {
  if (isDevOrBlack()) {
    return 100
  } else {
    return 50_000
  }
}

/** What fraction of SQUASH_THRESHOLD should be kept after a squash */
export const SQUASH_FACTOR = 0.5
