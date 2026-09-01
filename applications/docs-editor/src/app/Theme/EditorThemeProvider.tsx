import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type EditorTheme = 'light' | 'dark'

type EditorThemeContextValue = {
  theme: EditorTheme
  setTheme: (theme: EditorTheme) => void
}

const EditorThemeContext = createContext<EditorThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
})

export function EditorThemeProvider({ children, initialTheme }: { children: ReactNode; initialTheme: EditorTheme }) {
  const [theme, setTheme] = useState(initialTheme)
  const value = useMemo(() => ({ theme, setTheme }), [theme])

  useLayoutEffect(() => {
    document.documentElement.dataset.themeMode = theme
    document.documentElement.classList.toggle('rnc-dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  return <EditorThemeContext.Provider value={value}>{children}</EditorThemeContext.Provider>
}

export function useEditorTheme() {
  return useContext(EditorThemeContext)
}
