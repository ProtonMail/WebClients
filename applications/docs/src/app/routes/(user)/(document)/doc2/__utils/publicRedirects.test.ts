// Adapted from `applications/docs/src/app/components/document/public/utils.test.ts`, on /doc2's path
import { RedirectAction } from '@proton/docs-shared/DocumentAction'
import { getUrlWithReturnUrl } from '@proton/shared/lib/helpers/url'

import { redirectToAccountSwitcher, redirectToSignIn, redirectToSignUp } from './publicRedirects'

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
vi.mock('~/components/document/public/telemetry', async () => ({
  ...(await vi.importActual('~/components/document/public/telemetry')),
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
    it.each(['/doc2', '/doc'])('returns to %s', async (typePathname) => {
      window.history.pushState(null, '', `${typePathname}?mode=open-url&token=TOKEN&linkId=LINK#pw`)

      await redirect()

      expect(getReturnUrl().pathname).toBe(typePathname)
    })

    it('drops the local id prefix, since the private app adds its own', async () => {
      window.history.pushState(null, '', '/u/1/doc2?mode=open-url&token=TOKEN&linkId=LINK#pw')

      await redirect()

      expect(getReturnUrl().pathname).toBe('/doc2')
    })

    it('asks the private app to send the user back to the public link', async () => {
      window.history.pushState(null, '', '/doc2?mode=open-url&token=TOKEN&linkId=LINK#pw')

      await redirect()

      const { searchParams } = getReturnUrl()
      expect(searchParams.get('mode')).toBe('open-url-reauth')
      expect(searchParams.get('token')).toBe('TOKEN')
      expect(searchParams.get('linkId')).toBe('LINK')
    })
  })
})

describe('the redirect action', () => {
  beforeEach(() => vi.mocked(getUrlWithReturnUrl).mockClear())

  it.each([
    { name: 'sign in', redirect: redirectToSignIn },
    { name: 'sign up', redirect: redirectToSignUp },
  ])('$name keeps it in the return url, for the public page to resume', async ({ redirect }) => {
    window.history.pushState(null, '', '/doc2?mode=open-url&token=TOKEN&linkId=LINK#pw')

    await redirect({ ...params, action: RedirectAction.Bookmark, openInNewTab: false })

    expect(getReturnUrl().searchParams.get('action')).toBe('bookmark')
  })
})

function getReturnUrl() {
  const [, options] = vi.mocked(getUrlWithReturnUrl).mock.lastCall!
  return new URL(options!.returnUrl!, 'https://docs.proton.dev')
}
