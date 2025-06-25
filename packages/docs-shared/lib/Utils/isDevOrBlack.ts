import { PROTON_LOCAL_DOMAIN } from '@proton/shared/lib/localDev'

export function isLocalEnvironment() {
  return window.location.host.includes(PROTON_LOCAL_DOMAIN)
}

export function isDevOrBlack() {
  return isLocalEnvironment() || window.location.host.endsWith('proton.black')
}
