import type { ComponentPropsWithoutRef } from 'react'
import { clsx } from 'clsx'
import { c } from 'ttag'

import './CircleLoader.css'

export enum CircleLoaderSizeEnum {
  Large = 'large',
  Medium = 'medium',
  Small = 'small',
  Tiny = 'tiny',
}

export type CircleLoaderSize = `${CircleLoaderSizeEnum}`

export interface CircleLoaderProps extends ComponentPropsWithoutRef<'svg'> {
  size?: CircleLoaderSize
  srLabelHidden?: boolean
}

let currentCircleLoaderId = 0

const generateCircleLoaderId = () => `sheets-circle-loader-${currentCircleLoaderId++}`

export const CircleLoader = ({ size, className, srLabelHidden, ...rest }: CircleLoaderProps) => {
  const circleId = generateCircleLoaderId()

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={clsx('sheets-circle-loader', size && `sheets-circle-loader--${size}`, className)}
        viewBox="0 0 16 16"
        data-testid="circle-loader"
        {...rest}
      >
        <defs>
          <circle id={circleId} cx="8" cy="8" r="7" />
        </defs>
        <use href={`#${circleId}`} className="sheets-circle-loader__track" />
        <use href={`#${circleId}`} className="sheets-circle-loader__circle" />
      </svg>
      {!srLabelHidden ? <span className="sr-only">{c('Info').t`Loading`}</span> : null}
    </>
  )
}
