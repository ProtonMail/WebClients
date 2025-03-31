import clsx from '@proton/utils/clsx'
import type { ComponentPropsWithoutRef } from 'react'

export function ContentSheet(props: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx('bg-norm border-weak rounded-xl border', props.className)} />
}
