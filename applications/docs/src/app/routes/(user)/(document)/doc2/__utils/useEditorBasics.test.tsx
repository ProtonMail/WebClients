import { renderHook, waitFor } from '@testing-library/react'
import type { ContextType, ReactNode } from 'react'

import { ThemeContext } from '@proton/components/containers/themes/ThemeProvider'
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import type { EditorInvoker } from './EditorInvoker'
import { useEditorBasics, useIsEditorDarkMode } from './useEditorBasics'

let mockIsDarkThemeEnabled = true
jest.mock('~/utils/flags', () => ({ useIsDarkThemeEnabled: () => mockIsDarkThemeEnabled }))
const USER_SETTINGS = { Locale: 'fr_FR' } as UserSettings
jest.mock('@proton/account/userSettings/hooks', () => ({ useGetUserSettings: () => async () => USER_SETTINGS }))

function createInvoker() {
  return {
    setDarkMode: jest.fn(async () => {}),
    loadUserSettings: jest.fn(async () => {}),
    syncProperty: jest.fn(async () => {}),
  }
}

function renderBasics(
  invoker: ReturnType<typeof createInvoker> | undefined,
  { isDarkTheme = true, isPublicMode = false } = {},
) {
  const application = {
    isPublicMode,
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  } as unknown as ApplicationProviderProps['application']
  const theme = { information: { dark: isDarkTheme } } as unknown as ContextType<typeof ThemeContext>
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApplicationProvider application={application}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </ApplicationProvider>
  )
  return renderHook(
    () => {
      const isDarkMode = useIsEditorDarkMode()
      useEditorBasics(invoker as unknown as EditorInvoker | undefined, isDarkMode)
      return isDarkMode
    },
    { wrapper },
  )
}

describe('useEditorBasics', () => {
  beforeEach(() => {
    mockIsDarkThemeEnabled = true
  })

  test('does nothing before the editor is there', () => {
    expect(() => renderBasics(undefined)).not.toThrow()
  })

  test('hides Suggesting in the editor', () => {
    const invoker = createInvoker()

    renderBasics(invoker)

    expect(invoker.syncProperty).toHaveBeenCalledWith('suggestionsEnabled', false)
  })

  test.each<[boolean, boolean, boolean]>([
    [true, true, true],
    [true, false, false],
    [false, true, false],
  ])('with the dark theme flag %s and a dark app theme %s, dark mode is %s', (flag, isDarkTheme, isDarkMode) => {
    mockIsDarkThemeEnabled = flag
    const invoker = createInvoker()

    const { result } = renderBasics(invoker, { isDarkTheme })

    expect(result.current).toBe(isDarkMode)
    expect(invoker.setDarkMode).toHaveBeenCalledWith(isDarkMode)
  })

  test("gives the editor the user's settings in a private session", async () => {
    const invoker = createInvoker()

    renderBasics(invoker)

    await waitFor(() => expect(invoker.loadUserSettings).toHaveBeenCalledWith(USER_SETTINGS))
  })

  test('gives the editor no user settings in a public-link session', async () => {
    const invoker = createInvoker()

    renderBasics(invoker, { isPublicMode: true })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(invoker.loadUserSettings).not.toHaveBeenCalled()
  })
})
