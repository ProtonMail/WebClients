import { getThemeStyle } from '@proton/components/containers/themes/ThemeProvider'
import { ThemeTypes } from '@proton/shared/lib/themes/constants'
import { useEditorTheme } from './Theme/EditorThemeProvider'

export const THEME_ID = 'theme-root'

const defaultThemeStyles = getThemeStyle()
const darkThemeStyles = getThemeStyle(ThemeTypes.Carbon)

export const ThemeStyles = () => {
  const { theme } = useEditorTheme()

  return <style id={THEME_ID}>{theme === 'dark' ? darkThemeStyles : defaultThemeStyles}</style>
}
