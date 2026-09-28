import clsx from '@proton/utils/clsx'

export function ToolbarSeparator({ className }: { className?: string }) {
  return <hr className={clsx('mx-1.5 my-0 h-7 min-w-px bg-[--border-norm]', className)} />
}
