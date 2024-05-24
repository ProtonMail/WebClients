import { Commit, SquashCommit } from '../Generated'

export function CreateSquashCommit(dto: {
  lockId: string
  commitId: string
  commit: Commit
  manifestSignature: Uint8Array
  signatureAddress: string
  encSignature: Uint8Array
  contentHash: Uint8Array
}): SquashCommit {
  const commit = new SquashCommit(dto)

  return commit
}
