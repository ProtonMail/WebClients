import { useLocation } from 'react-router-dom'
import { useDynamicFavicon } from '@proton/components'
import sheetsFavicon from './sheets-favicon.svg'

function isSheetsPath(pathname: string) {
  // Match /sheet and /u/{localID}/sheet
  return /^(\/u\/\d+)?\/sheet/.test(pathname)
}

/**
 * Sets the Proton Sheets favicon for the '/sheet' pathname.
 */
export const useSheetsFavicon = () => {
  const location = useLocation()
  const shouldUseSheetsFavicon = typeof window !== 'undefined' && isSheetsPath(location.pathname)
  useDynamicFavicon(shouldUseSheetsFavicon ? sheetsFavicon : '')
}
