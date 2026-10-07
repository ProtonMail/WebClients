import { getAuthHeaders, getUIDHeaders } from '@proton/shared/lib/fetch/headers'
import { getPublicDrive } from './getPublicDrive'

export function getPublicAuthHeaders() {
  const { uid, accessToken } = getPublicDrive().experimental.getSessionInfo()
  // SDK returns access token only for newly created session, logged-in user re-uses own session.
  // Unlike legacy, which always sends the public session access token.
  return accessToken ? getAuthHeaders(uid, accessToken) : getUIDHeaders(uid)
}
