// Copy of drive/docs/realtime's packages/sheets-editor/src/components/CircleLoader/CircleLoader.tsx,
// with its label from ttag, as Proton's is, and its SVG id from useId, as Proton's useSvgId gives it.
// Dropped what the homepage doesn't use: the tiny and medium sizes and `srLabelHidden`.

import { type ComponentPropsWithoutRef, useId } from 'react'
import { c } from 'ttag'
import { clsx } from '../utils/clsx'
import './CircleLoader.css'

export interface CircleLoaderProps extends ComponentPropsWithoutRef<'svg'> {
  /** 1em by default. */
  size?: 'large'
}

export function CircleLoader({ size, className, ...rest }: CircleLoaderProps) {
  // `<use href>` takes the id as a URL fragment, so drop useId's colons.
  const circleId = `homepage-circle-loader-${useId().replace(/:/g, '')}`

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={clsx('homepage-circle-loader', size && `homepage-circle-loader--${size}`, className)}
        viewBox="0 0 16 16"
        data-testid="circle-loader"
        {...rest}
      >
        <defs>
          <circle id={circleId} cx="8" cy="8" r="7" />
        </defs>
        <use href={`#${circleId}`} className="homepage-circle-loader__track" />
        <use href={`#${circleId}`} className="homepage-circle-loader__circle" />
      </svg>
      <span className="sr-only">{c('Info').t`Loading`}</span>
    </>
  )
}
