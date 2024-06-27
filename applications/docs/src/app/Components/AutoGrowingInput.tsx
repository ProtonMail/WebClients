import { Input, InputProps } from '@proton/atoms/Input'
import clsx from '@proton/utils/clsx'
import { ForwardedRef, forwardRef } from 'react'

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
