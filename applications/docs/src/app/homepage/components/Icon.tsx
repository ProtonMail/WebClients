// Copy of drive/docs/realtime's packages/docs-editor/src/Components/Icon.tsx.

import { forwardRef, isValidElement, type ComponentPropsWithoutRef, type ReactElement } from 'react'
import { clsx } from '../utils/clsx'

/** SVG path data for a 16×16 viewBox, or a React element (a fragment of `<path>`s) for icons that need more. */
export type IconData = string | ReactElement

// Literal class names, so Tailwind generates them. `:where()` lets a caller's size classes win.
const iconSizeClassNames = {
  3: '[:where(&)]:h-3 [:where(&)]:w-3',
  3.5: '[:where(&)]:h-3.5 [:where(&)]:w-3.5',
  4: '[:where(&)]:h-4 [:where(&)]:w-4',
  4.5: '[:where(&)]:h-[1.125rem] [:where(&)]:w-[1.125rem]',
  5: '[:where(&)]:h-5 [:where(&)]:w-5',
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
  if (typeof data !== 'string' && !isValidElement(data)) {
    throw new Error('Icon: data must be SVG path data or a React element')
  }
  const content = typeof data === 'string' ? <path d={data} /> : data

  return (
    <>
      <svg
        ref={ref}
        viewBox={viewBox}
        fill="currentColor"
        // `inline-block` stays a plain class: Tailwind's preflight `svg { display: block }` beats `:where()`.
        className={clsx('inline-block', iconSizeClassNames[size], className)}
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- an icon is an `<svg>`; `aria-hidden` hides it anyway
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
