import { APPS } from '@proton/shared/lib/constants'
import { getAppHref } from '@proton/shared/lib/apps/helper'

export class BridgeOriginProvider {
  static GetClientOrigin(): string {
    return getAppHref('/', APPS.PROTONDOCS)
  }

  static GetEditorOrigin(): string {
    return getAppHref('/', APPS.PROTONDOCSEDITOR)
  }
}
