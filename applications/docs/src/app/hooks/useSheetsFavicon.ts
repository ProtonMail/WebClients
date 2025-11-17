import { useLocation } from 'react-router-dom'
import { useDynamicFavicon } from '@proton/components'
import sheetsFavicon from './sheets-favicon.svg'

/**
 * Sets the Proton Sheets favicon for the '/sheet' pathname.
 */
export const useSheetsFavicon = () => {
  const location = useLocation()
  const shouldUseSheetsFavicon = typeof window !== 'undefined' && location.pathname.startsWith('/sheet')
  useDynamicFavicon(shouldUseSheetsFavicon ? sheetsFavicon : '')
}
