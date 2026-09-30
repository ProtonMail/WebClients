import type { ComponentPropsWithoutRef, ReactElement } from 'react'
import { forwardRef, isValidElement } from 'react'

export type IconData = string | ReactElement

export interface IconProps extends Omit<ComponentPropsWithoutRef<'svg'>, 'size'> {
  data: IconData
  size?: number
  alt?: string
  title?: string
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { data, size = 4, className = '', viewBox = '0 0 16 16', alt, title, ...rest },
  ref,
) {
  const content = typeof data === 'string' ? <path d={data} /> : data
  if (typeof data !== 'string' && !isValidElement(data)) {
    throw new Error('Icon: data must be SVG path data or a React element')
  }

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
      <svg
        ref={ref}
        viewBox={viewBox}
        className={`icon-size-${size} ${className}`}
        role="img"
        focusable="false"
        aria-hidden="true"
        {...rest}
      >
        {title ? <title>{title}</title> : null}
        {content}
      </svg>
      {alt ? <span className="sr-only">{alt}</span> : null}
    </>
  )
})
