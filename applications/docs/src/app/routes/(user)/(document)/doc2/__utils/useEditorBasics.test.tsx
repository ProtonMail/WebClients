import type { Mock } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ContextType, ReactNode } from 'react'

import { ThemeContext } from '@proton/components/containers/themes/ThemeProvider'
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings'
import type { LoggerInterface } from '@proton/shared/lib/logs'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { sendEditorBasics, useEditorBasicsInSync, useIsEditorDarkMode, useUserName } from './useEditorBasics'

let mockIsDarkThemeEnabled = true
vi.mock('~/utils/flags', () => ({ useIsDarkThemeEnabled: () => mockIsDarkThemeEnabled }))
let mockUser = { DisplayName: 'Alice A.', Name: 'alice', Email: 'alice@example.com' }
vi.mock('@proton/account/user/hooks', () => ({ useUser: () => [mockUser] }))

const USER_SETTINGS = { Locale: 'fr_FR' } as UserSettings
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as LoggerInterface & {
  warn: Mock
}

function createInvoker() {
  return {
    setDarkMode: vi.fn(async () => {}),
    loadUserSettings: vi.fn(async () => {}),
    syncProperty: vi.fn(async () => {}),
  }
}

function wrapperFor({ isDarkTheme = true } = {}) {
  const application = { logger } as unknown as ApplicationProviderProps['application']
  const theme = { information: { dark: isDarkTheme } } as unknown as ContextType<typeof ThemeContext>
  return ({ children }: { children: ReactNode }) => (
    <ApplicationProvider application={application}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </ApplicationProvider>
  )
}

describe('sendEditorBasics', () => {
  afterEach(() => vi.clearAllMocks())

  test.each([true, false])(
    "gives the editor dark mode, the user's settings and name, and Suggesting %s",
    async (suggestionsEnabled) => {
      const invoker = createInvoker()

      sendEditorBasics(
        invoker,
        { isDarkMode: true, userName: 'Alice', suggestionsEnabled, getUserSettings: async () => USER_SETTINGS },
        logger,
      )

      expect(invoker.setDarkMode).toHaveBeenCalledWith(true)
      expect(invoker.syncProperty).toHaveBeenCalledWith('suggestionsEnabled', suggestionsEnabled)
      expect(invoker.syncProperty).toHaveBeenCalledWith('userName', 'Alice')
      await waitFor(() => expect(invoker.loadUserSettings).toHaveBeenCalledWith(USER_SETTINGS))
    },
  )

  test('gives the editor no user settings in a public-link session, which has none', async () => {
    const invoker = createInvoker()

    sendEditorBasics(invoker, { isDarkMode: false, userName: 'Alice', suggestionsEnabled: false }, logger)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(invoker.loadUserSettings).not.toHaveBeenCalled()
  })

  test('only logs a call the editor fails', async () => {
    const invoker = createInvoker()
    invoker.setDarkMode.mockRejectedValue(new Error('No answer'))

    sendEditorBasics(invoker, { isDarkMode: true, userName: 'Alice', suggestionsEnabled: false }, logger)

    await waitFor(() => expect(logger.warn).toHaveBeenCalledWith('Failed to set the editor theme', expect.any(Error)))
  })
})

describe('useUserName', () => {
  test.each([
    [{ DisplayName: 'Alice A.', Name: 'alice', Email: 'alice@example.com' }, 'Alice A.'],
    [{ DisplayName: '', Name: 'alice', Email: 'alice@example.com' }, 'alice'],
    [{ DisplayName: '', Name: '', Email: 'alice@example.com' }, 'alice@example.com'],
  ])("is the user's name for presence from %j: %s", (user, userName) => {
    mockUser = user

    const { result } = renderHook(() => useUserName())

    expect(result.current).toBe(userName)
  })
})

describe('useIsEditorDarkMode', () => {
  test.each<[boolean, boolean, boolean]>([
    [true, true, true],
    [true, false, false],
    [false, true, false],
  ])('with the dark theme flag %s and a dark app theme %s, dark mode is %s', (flag, isDarkTheme, isDarkMode) => {
    mockIsDarkThemeEnabled = flag

    const { result } = renderHook(() => useIsEditorDarkMode(), { wrapper: wrapperFor({ isDarkTheme }) })

    expect(result.current).toBe(isDarkMode)
  })
})

describe('useEditorBasicsInSync', () => {
  test('does nothing before the editor is open', () => {
    expect(() =>
      renderHook(
        () => useEditorBasicsInSync(undefined, { isDarkMode: true, userName: 'Alice', suggestionsEnabled: true }),
        {
          wrapper: wrapperFor(),
        },
      ),
    ).not.toThrow()
  })

  test('gives an open editor the theme, the user name and Suggesting each time they change', () => {
    const invoker = createInvoker()
    const { rerender } = renderHook((basics) => useEditorBasicsInSync(invoker, basics), {
      wrapper: wrapperFor(),
      initialProps: { isDarkMode: false, userName: 'Alice', suggestionsEnabled: true },
    })

    rerender({ isDarkMode: true, userName: 'Alice', suggestionsEnabled: true })
    rerender({ isDarkMode: true, userName: 'Alice B.', suggestionsEnabled: true })
    rerender({ isDarkMode: true, userName: 'Alice B.', suggestionsEnabled: false })

    expect(invoker.setDarkMode.mock.calls).toEqual([[false], [true]])
    expect(invoker.syncProperty.mock.calls).toEqual([
      ['userName', 'Alice'],
      ['suggestionsEnabled', true],
      ['userName', 'Alice B.'],
      ['suggestionsEnabled', false],
    ])
  })
})
