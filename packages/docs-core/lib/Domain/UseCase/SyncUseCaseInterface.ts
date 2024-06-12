import { Result } from '../Result/Result'

export interface SyncUseCaseInterface<T> {
  execute(...args: any[]): Result<T>
}
