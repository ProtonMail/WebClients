import { useState, useEffect } from 'react'
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage'
import { isPast } from 'date-fns'

export enum TooltipKey {
  PublicDocsMakeCopy = 'tooltip-public-docs-make-copy',
  DocsSuggestionModeSpotlight = 'tooltip-docs-suggestion-mode',
}

/**
 * Hook to manage showing a tooltip once for new users
 * @param key A unique key for the tooltip status in local storage
 * @returns Whether tooltip should be shown
 */
export const useTooltipOnce = (key: TooltipKey, endDate?: Date) => {
  const [wasShown] = useState<boolean>(Boolean(getItem(key, 'false')))
  const hasEnded = endDate && isPast(endDate)

  useEffect(() => {
    if (hasEnded) {
      removeItem(key)
    } else {
      setItem(key, 'true')
    }
  }, [hasEnded, key])

  return {
    shouldShowTooltip: !wasShown && !hasEnded,
  }
}
