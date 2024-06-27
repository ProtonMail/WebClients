import { forwardRef } from 'react'

const Pill = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>((props, ref) => {
  return (
    <button
      ref={ref}
      className="bg-weak flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[--text-weak]"
      {...props}
    />
  )
})

export default Pill
