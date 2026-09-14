import { clsx } from 'clsx'
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
  data: IconData
}
/** `Icon` props. */
export interface IconProps extends ComponentPropsWithoutRef<'svg'>, IconOptions {}
/**
 * Renders an icon as an SVG element.
 *
 * The icon's data, provided through the `data` prop, can be one of the following:
 * - A string representing the SVG path data.
 * - A React element containing SVG contents. It can be a React fragment to include multiple SVG child elements.
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon({ className, data, ...props }: IconProps, ref) {
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
    <svg
      ref={ref}
      viewBox="0 0 16 16"
      fill="currentColor"
      focusable="false"
      aria-hidden="true"
      {...props}
      className={clsx('[:where(&)]:h-4 [:where(&)]:w-4', className)}
    >
      {content}
    </svg>
  )
})
