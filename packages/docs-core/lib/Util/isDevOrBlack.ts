export function isDevOrBlack() {
  return window.location.host.endsWith('proton.local') || window.location.host.endsWith('proton.black')
}

export function isDev() {
  return window.location.host.endsWith('proton.local')
}
