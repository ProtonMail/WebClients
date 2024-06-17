export function isLocalEnvironment() {
  return window.location.host.includes('proton.local')
}

export function isDevOrBlack() {
  return isLocalEnvironment() || window.location.host.endsWith('proton.black')
}
