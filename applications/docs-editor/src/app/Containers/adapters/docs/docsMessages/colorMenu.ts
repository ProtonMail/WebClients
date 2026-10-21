import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

// The label parameters stay `name` because ttag builds the existing msgids from it.
export function createColorMenuMessages(): Pick<DocsMessages, 'colorMenu'> {
  return {
    colorMenu: {
      textAndHighlightColor: c('Label').t`Text and highlight color`,
      textColorWithNoBackground: (name: string) => c('Label').t`${name} text color with no background`,
      textColorAndHighlight: (name: string) => c('Label').t`${name} text color and highlight`,
      backgroundColorAndWhiteTextColor: (name: string) => c('Label').t`${name} background color and white text color`,
      colorNames: {
        black: c('color').t`black`,
        gray: c('color').t`gray`,
        purple: c('color').t`purple`,
        pink: c('color').t`pink`,
        red: c('color').t`red`,
        carrot: c('color').t`carrot`,
        slateblue: c('color').t`slateblue`,
        pacific: c('color').t`pacific`,
        reef: c('color').t`reef`,
        olive: c('color').t`olive`,
      },
    },
  }
}
