import type { Result } from '@proton/docs-shared'

export interface SyncUseCaseInterface<T> {
  execute(...args: any[]): Result<T>
}
