import type { ShareResult } from '@proton/drive'

import { replaceAddress } from './useChangeAddressWhenPubliclyShared'

const urlAccess = { url: 'https://drive.proton.dev/urls/TOKEN#urlPassword' } as ShareResult['urlAccess']
const getLocalID = () => undefined

describe('replaceAddress', () => {
  let replaceState: jest.SpyInstance

  beforeEach(() => {
    replaceState = jest.spyOn(window.history, 'replaceState')
  })

  afterEach(() => replaceState.mockRestore())

  describe.each(['/doc', '/sheet'])('on %s', (typePathname) => {
    it('keeps the type segment when the document becomes public', () => {
      window.history.pushState(null, '', `${typePathname}?mode=open&volumeId=VOLUME&linkId=LINK`)

      replaceAddress({ getLocalID, urlAccess, volumeId: 'VOLUME', nodeId: 'LINK' })

      expect(getReplacedUrl()).toEqual({
        pathname: typePathname,
        search: '?mode=open-url&linkId=LINK&token=TOKEN',
        hash: '#urlPassword',
      })
    })

    it('keeps the type segment when the document stops being public', () => {
      window.history.pushState(null, '', `${typePathname}?mode=open-url&linkId=LINK&token=TOKEN#urlPassword`)

      replaceAddress({ getLocalID, urlAccess: undefined, volumeId: 'VOLUME', nodeId: 'LINK' })

      expect(getReplacedUrl()).toEqual({
        pathname: typePathname,
        search: '?mode=open&volumeId=VOLUME&linkId=LINK',
        hash: '',
      })
    })

    it('drops the local id prefix, so the public link is not tied to an account', () => {
      window.history.pushState(null, '', `/u/1${typePathname}?mode=open&volumeId=VOLUME&linkId=LINK`)

      replaceAddress({ getLocalID, urlAccess, volumeId: 'VOLUME', nodeId: 'LINK' })

      expect(getReplacedUrl().pathname).toBe(typePathname)
    })
  })

  function getReplacedUrl() {
    const { pathname, search, hash } = new URL(replaceState.mock.lastCall[2])
    return { pathname, search, hash }
  }
})
