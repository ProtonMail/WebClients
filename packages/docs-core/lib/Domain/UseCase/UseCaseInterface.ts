import type { Result } from '@proton/docs-shared'

export interface UseCaseInterface<T> {
  execute(...args: any[]): Promise<Result<T>>
}
