import type { HeadingNode } from '@lexical/rich-text'

export const getFontSizeForHeading = (heading: HeadingNode) => {
  const MinimumHeadingFontSize = 13
  const MaxHeadingLevel = 6
  const level = parseInt(heading.getTag().slice(1))
  const multiplier = (MaxHeadingLevel - level) * 2

  return MinimumHeadingFontSize + multiplier
}
