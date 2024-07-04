const WebSocketServerSubdomain = 'docs-rts'

export const getWebSocketServerURL = () => {
  const url = new URL(window.location.href)
  const hostnameParts = url.hostname.split('.')

  if (hostnameParts.length === 2) {
    hostnameParts.unshift(WebSocketServerSubdomain)
  } else {
    hostnameParts[0] = WebSocketServerSubdomain
  }

  const newHostname = hostnameParts.join('.')
  return `wss://${newHostname}/websockets`
}
