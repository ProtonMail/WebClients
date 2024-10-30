import { useState, useEffect } from 'react'

export enum TooltipKey {
  PublicDocsMakeCopy = 'tooltip-public-docs-make-copy',
}

/**
 * Hook to manage showing a tooltip once for new users
 * @param key A unique key for the tooltip status in local storage
 * @returns An object with `showTooltip` boolean state and `setTooltipShown` function
 */
export const useTooltipOnce = (key: TooltipKey) => {
  const [shouldShowTooltip, setShouldShowTooltip] = useState(false)

  useEffect(() => {
    try {
      const tooltipStatus = localStorage.getItem(key)
      if (tooltipStatus == null) {
        setShouldShowTooltip(true)
        localStorage.setItem(key, 'shown')
      }
    } catch (e) {
      console.warn(`localStorage was not available to get key ${key}`)
    }
  }, [key])

  return { shouldShowTooltip }
}
