import { isMacUserAgent } from './isMac'

const macUserAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15'
const windowsUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

describe('Docs keyboard shortcut platform detection', () => {
  it.each([
    {
      platform: 'macOS',
      userAgent: macUserAgent,
      expected: true,
    },
    {
      platform: 'Windows',
      userAgent: windowsUserAgent,
      expected: false,
    },
    {
      platform: 'iPadOS',
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
      expected: false,
    },
  ])('matches the existing shortcut behavior on $platform', ({ userAgent, expected }) => {
    expect(isMacUserAgent(userAgent)).toBe(expected)
  })

  it.each([
    { platform: 'macOS', userAgent: macUserAgent, key: 'z', shiftKey: true },
    { platform: 'Windows', userAgent: windowsUserAgent, key: 'y', shiftKey: false },
  ])('keeps the $platform redo shortcut', async ({ userAgent, key, shiftKey }) => {
    const originalUserAgent = navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: userAgent })
    jest.resetModules()

    try {
      const { DefaultKeyboardShortcuts } = await import('../Plugins/KeyboardShortcuts/DefaultKeyboardShortcuts')
      expect(DefaultKeyboardShortcuts.find(({ id }) => id === 'REDO_SHORTCUT')).toMatchObject({ key, shiftKey })
    } finally {
      Object.defineProperty(navigator, 'userAgent', { configurable: true, value: originalUserAgent })
      jest.resetModules()
    }
  })
})
