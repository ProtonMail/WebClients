import clsx from '@proton/utils/clsx'
import type { ComponentPropsWithoutRef } from 'react'

export type ContentSheetProps = ComponentPropsWithoutRef<'div'> & {
  isBottom?: boolean
}

export function ContentSheet({ isBottom, ...props }: ContentSheetProps) {
  return (
    <div
      {...props}
      className={clsx(
        'bg-norm border-weak rounded-xl border',
        isBottom && '!rounded-b-none !border-b-0',
        props.className,
      )}
    />
  )
}
