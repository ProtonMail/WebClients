import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useDynamicFavicon } from '@proton/components'
import sheetsFavicon from './sheets-favicon.svg'

/**
 * Custom hook that automatically sets the sheets favicon when the current route contains '/sheets'
 */
export const useSheetsFavicon = () => {
  const location = useLocation()

  // Dynamic favicon for sheets
  const shouldUseSheetsFavicon = useMemo(() => {
    return typeof window !== 'undefined' && location.pathname.includes('/sheet')
  }, [location.pathname])

  useDynamicFavicon(shouldUseSheetsFavicon ? sheetsFavicon : '')
}
