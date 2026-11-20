import { getUrlWithReturnUrl } from '@proton/shared/lib/helpers/url'

import { redirectToAccountSwitcher, redirectToSignIn, redirectToSignUp } from './utils'

vi.mock('@proton/shared/lib/helpers/url', async () => ({
  ...(await vi.importActual('@proton/shared/lib/helpers/url')),
  getUrlWithReturnUrl: vi.fn(() => 'https://account.proton.dev/'),
}))
vi.mock('@proton/shared/lib/helpers/browser', async () => ({
  ...(await vi.importActual('@proton/shared/lib/helpers/browser')),
  replaceUrl: vi.fn(),
}))
vi.mock('@proton/shared/lib/helpers/window', () => {
  const tab = { handle: { location: { assign: vi.fn() } } }
  return { getCurrentTab: () => tab, getNewWindow: () => tab }
})
vi.mock('./telemetry', async () => ({
  ...(await vi.importActual('./telemetry')),
  countActionWithTelemetry: vi.fn(),
  traceTelemetry: () => ({ start: vi.fn() }),
}))
vi.mock('@proton/docs-shared/URL/saveUrlPasswordForRedirection', () => ({
  saveUrlPasswordForRedirection: vi.fn(),
}))

const params = { action: undefined, token: 'TOKEN', email: 'user@proton.me', linkId: 'LINK', urlPassword: 'pw' }

const redirects = [
  { name: 'sign in', redirect: () => redirectToSignIn({ ...params, openInNewTab: false }) },
  { name: 'sign up', redirect: () => redirectToSignUp({ ...params, openInNewTab: false }) },
  { name: 'account switch', redirect: async () => redirectToAccountSwitcher('TOKEN', 'LINK', 'pw') },
]

describe('public redirect return urls', () => {
  beforeEach(() => vi.mocked(getUrlWithReturnUrl).mockClear())

  describe.each(redirects)('$name', ({ redirect }) => {
    it.each(['/doc', '/sheet'])('returns to %s', async (typePathname) => {
      window.history.pushState(null, '', `${typePathname}?mode=open-url&token=TOKEN&linkId=LINK#pw`)

      await redirect()

      expect(getReturnUrl().pathname).toBe(typePathname)
    })

    it('drops the local id prefix, since the private app adds its own', async () => {
      window.history.pushState(null, '', '/u/1/sheet?mode=open-url&token=TOKEN&linkId=LINK#pw')

      await redirect()

      expect(getReturnUrl().pathname).toBe('/sheet')
    })

    it('asks the private app to send the user back to the public link', async () => {
      window.history.pushState(null, '', '/sheet?mode=open-url&token=TOKEN&linkId=LINK#pw')

      await redirect()

      const { searchParams } = getReturnUrl()
      expect(searchParams.get('mode')).toBe('open-url-reauth')
      expect(searchParams.get('token')).toBe('TOKEN')
      expect(searchParams.get('linkId')).toBe('LINK')
    })
  })
})

function getReturnUrl() {
  const [, options] = vi.mocked(getUrlWithReturnUrl).mock.lastCall!
  return new URL(options!.returnUrl!, 'https://docs.proton.dev')
}
