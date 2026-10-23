import { clsx } from 'clsx'
import type { ComponentPropsWithoutRef, ReactElement } from 'react'
import { forwardRef, isValidElement } from 'react'

export type IconData = string | ReactElement

// Literal class names, so Tailwind generates them. `:where()` lets a caller's size classes win.
const iconSizeClassNames = {
  3: '[:where(&)]:h-3 [:where(&)]:w-3',
  3.5: '[:where(&)]:h-3.5 [:where(&)]:w-3.5',
  4: '[:where(&)]:h-4 [:where(&)]:w-4',
  4.5: '[:where(&)]:h-[1.125rem] [:where(&)]:w-[1.125rem]',
  6: '[:where(&)]:h-6 [:where(&)]:w-6',
}

export interface IconProps extends Omit<ComponentPropsWithoutRef<'svg'>, 'size'> {
  data: IconData
  size?: keyof typeof iconSizeClassNames
  alt?: string
  title?: string
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { data, size = 4, className, viewBox = '0 0 16 16', alt, title, ...rest },
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
        fill="currentColor"
        // `inline-block` stays a plain class: Tailwind's preflight `svg { display: block }` beats `:where()`.
        className={clsx('inline-block', iconSizeClassNames[size], className)}
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
