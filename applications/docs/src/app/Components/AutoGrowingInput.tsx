import type { InputProps } from '@proton/atoms'
import { Input } from '@proton/atoms'
import clsx from '@proton/utils/clsx'
import type { ForwardedRef } from 'react'
import { forwardRef } from 'react'

export const AutoGrowingInput = forwardRef(function AutoGrowingInput(
  { value, className, inputClassName, ...rest }: InputProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  return (
    <div className={clsx('inline-grid', className)}>
      <Input className="[grid-area:1_/_2]" value={value} ref={ref} inputClassName={inputClassName} {...rest} />
      <div
        className={clsx('select-none whitespace-pre border opacity-0 [grid-area:1_/_2]', inputClassName)}
        aria-hidden
      >
        {value}
      </div>
    </div>
  )
})
