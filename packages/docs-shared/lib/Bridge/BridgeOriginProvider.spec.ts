import { BridgeOriginProvider } from './BridgeOriginProvider'

describe('BridgeOriginProvider', () => {
  const setLocation = (hostname: string) => {
    Object.defineProperty(window, 'location', {
      value: {
        origin: `https://${hostname}`,
        hostname: hostname,
        protocol: 'https:',
        port: '',
      },
      writable: true,
    })
  }

  describe('GetSafeOrigin', () => {
    it('should return root origin', () => {
      setLocation('docs.proton.local')

      expect(BridgeOriginProvider.GetEditorOrigin()).toEqual('https://docs-editor.proton.local')
      expect(BridgeOriginProvider.GetClientOrigin()).toEqual('https://docs.proton.local')
    })

    it('should return safe origin with remote domain', () => {
      setLocation('docs.proton.me')

      expect(BridgeOriginProvider.GetEditorOrigin()).toEqual('https://docs-editor.proton.me')
      expect(BridgeOriginProvider.GetClientOrigin()).toEqual('https://docs.proton.me')
    })

    it('should return safe origin with nested domain', () => {
      setLocation('docs.darwin.proton.black')

      expect(BridgeOriginProvider.GetEditorOrigin()).toEqual('https://docs-editor.darwin.proton.black')
      expect(BridgeOriginProvider.GetClientOrigin()).toEqual('https://docs.darwin.proton.black')
    })
  })
})
