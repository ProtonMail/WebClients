import { getThemeStyle } from '@proton/theme/ThemeProvider'
import { ThemeTypes } from '@proton/theme/constants'
import { useEditorTheme } from './Theme/EditorThemeProvider'

const THEME_ID = 'theme-root'

const defaultThemeStyles = getThemeStyle()
const darkThemeStyles = getThemeStyle(ThemeTypes.Carbon)

export const ThemeStyles = () => {
  const { theme } = useEditorTheme()

  return <style id={THEME_ID}>{theme === 'dark' ? darkThemeStyles : defaultThemeStyles}</style>
}
