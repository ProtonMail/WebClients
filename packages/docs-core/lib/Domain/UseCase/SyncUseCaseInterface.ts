import type { Result } from '@proton/docs-shared/Result'

export interface SyncUseCaseInterface<T> {
  execute(...args: any[]): Result<T>
}
