import type { ReactNode } from 'react'

import { getThemeStyle } from '@proton/components'
import type { APP_NAMES } from '@proton/shared/lib/constants'

export const THEME_ID = 'theme-root'

const defaultThemeStyles = getThemeStyle()

export const DocsThemeProvider = ({ children }: { children: ReactNode; appName: APP_NAMES }) => {
  return (
    <>
      <style id={THEME_ID}>{defaultThemeStyles}</style>
      {children}
    </>
  )
}
