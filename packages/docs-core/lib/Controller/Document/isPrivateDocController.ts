import type { AnyDocControllerInterface } from './AnyDocControllerInterface'
import { DocController } from './DocController'
import type { DocControllerInterface } from './DocControllerInterface'
import type { PublicDocControllerInterface } from './PublicDocControllerInterface'

export function isPrivateDocController(
  docController: DocControllerInterface | PublicDocControllerInterface | AnyDocControllerInterface,
): docController is DocControllerInterface {
  return docController instanceof DocController
}
