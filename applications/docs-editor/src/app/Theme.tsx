import { getThemeStyle } from '@proton/components/containers/themes/ThemeProvider'

export const THEME_ID = 'theme-root'

const defaultThemeStyles = getThemeStyle()

export const ThemeStyles = () => {
  return <style id={THEME_ID}>{defaultThemeStyles}</style>
}
