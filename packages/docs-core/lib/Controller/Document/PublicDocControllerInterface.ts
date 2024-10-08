import type { Result } from '../../Domain/Result/Result'
import type { AnyDocControllerInterface } from './AnyDocControllerInterface'
import type { PublicDocLoadSuccessResult } from './DocLoadSuccessResult'

export interface PublicDocControllerInterface extends AnyDocControllerInterface {
  initialize(): Promise<Result<PublicDocLoadSuccessResult>>
}
