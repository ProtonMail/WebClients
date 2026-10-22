import type { Result } from '@proton/docs-shared/Result'

export interface UseCaseInterface<T> {
  execute(...args: any[]): Promise<Result<T>>
}
