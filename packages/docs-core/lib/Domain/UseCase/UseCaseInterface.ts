import { Result } from '../Result/Result'

export interface UseCaseInterface<T> {
  execute(...args: any[]): Promise<Result<T>>
}
