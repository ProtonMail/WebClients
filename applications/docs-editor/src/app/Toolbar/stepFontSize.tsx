import { FontSizes } from '../Shared/Fonts'

export const stepFontSize = (currentFontSize: string, step: number): string => {
  const currentFontIndex = FontSizes.indexOf(parseFloat(currentFontSize))
  const nextFontSize = FontSizes[currentFontIndex + step]

  return nextFontSize ? `${nextFontSize}px` : currentFontSize
}
