import LegacyIcon from '@proton/components/components/icon/Icon'
import type { IconName } from '@proton/icons/types'
import type { ReactElement } from 'react'
import { type ComponentPropsWithoutRef, forwardRef, isValidElement } from 'react'

/**
 * Represents the data for an icon, which can be one of the following:
 * - A string representing the SVG path data.
 * - A React element containing SVG contents. It can be a React fragment to include multiple SVG child elements.
 */
export type IconData = string | ReactElement
/** `Icon` options. */
export type IconOptions = {
  /**
   * The icon's data, which can be one of the following:
   * - A string representing the SVG path data.
   * - A React element containing SVG contents. It can be a React fragment to include multiple SVG child elements.
   */
  data?: IconData
  /**
   * If provided, the icon will be rendered using the `Icon` component from `@proton/components`.
   * @deprecated Use `data` instead.
   */
  legacyName?: IconName
}
/** `Icon` props. */
export interface IconProps extends ComponentPropsWithoutRef<'svg'>, IconOptions {}
/**
 * Renders an icon as an SVG element.
 *
 * The icon's data, provided through the `data` prop, can be one of the following:
 * - A string representing the SVG path data.
 * - A React element containing SVG contents. It can be a React fragment to include multiple SVG child elements.
 *
 * Legacy icons (referenced by their name) can be used by providing the `legacyName` prop.
 * This will render the icon using the `Icon` component from `@proton/components`.
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon({ legacyName, data, ...props }: IconProps, ref) {
  if (legacyName) {
    return (
      <LegacyIcon ref={ref} {...props} name={legacyName} rotate={props.rotate ? Number(props.rotate) : undefined} />
    )
  }
  if (!data) {
    throw new Error('Icon component: either `data` or `legacyName` must be provided')
  }
  let content: ReactElement
  if (typeof data === 'string') {
    content = <path fill="currentColor" d={data} />
  } else if (isValidElement(data)) {
    content = data
  } else {
    throw new Error('Icon component: `data` must be a string or a valid ReactElement with SVG content')
  }
  return (
    // TODO: if extracted into a CSS layer, no need for :where, probably
    // biome-ignore lint/a11y/noSvgWithoutTitle: visual icons only.
    <svg ref={ref} viewBox="0 0 16 16" {...props} className="[:where(&)]:h-4 [:where(&)]:w-4">
      {content}
    </svg>
  )
})
