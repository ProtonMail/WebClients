import type { Commit } from '../Generated'
import { SquashCommit } from '../Generated'

export function CreateSquashCommit(dto: { lockId: string; commitId: string; commit: Commit }): SquashCommit {
  const commit = new SquashCommit(dto)

  return commit
}
