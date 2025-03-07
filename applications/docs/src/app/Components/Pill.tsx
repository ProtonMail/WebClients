import { forwardRef } from 'react'

// TODO: remove forwardRef once we upgrade to React 19
export const Pill = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(function Pill(props, ref) {
  return (
    <button
      ref={ref}
      className="bg-weak flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-[--text-weak]"
      {...props}
    />
  )
})
