import { setLocation } from '@proton/jest-env/setLocation'

import { BridgeOriginProvider } from './BridgeOriginProvider'

describe('BridgeOriginProvider', () => {
  describe('GetSafeOrigin', () => {
    it('should return root origin', () => {
      setLocation('https://docs.proton.dev')

      expect(BridgeOriginProvider.GetEditorOrigin()).toEqual('https://docs-editor.proton.dev')
      expect(BridgeOriginProvider.GetClientOrigin()).toEqual('https://docs.proton.dev')
    })

    it('should return safe origin with remote domain', () => {
      setLocation('https://docs.proton.me')

      expect(BridgeOriginProvider.GetEditorOrigin()).toEqual('https://docs-editor.proton.me')
      expect(BridgeOriginProvider.GetClientOrigin()).toEqual('https://docs.proton.me')
    })

    it('should return safe origin with nested domain', () => {
      setLocation('https://docs.darwin.proton.black')

      expect(BridgeOriginProvider.GetEditorOrigin()).toEqual('https://docs-editor.darwin.proton.black')
      expect(BridgeOriginProvider.GetClientOrigin()).toEqual('https://docs.darwin.proton.black')
    })
  })
})
