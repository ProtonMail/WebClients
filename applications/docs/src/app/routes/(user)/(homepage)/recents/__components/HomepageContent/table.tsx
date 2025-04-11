import clsx from '@proton/utils/clsx'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

const POSITIONAL_CELL_CLASSES = [
  '[&:nth-child(1)]:w-full [&:nth-child(1)]:px-6',
  '[&:nth-child(2)]:w-[9rem] xlarge:[&:nth-child(2)]:w-[12rem] xxlarge:[&:nth-child(2)]:w-[18rem] [&:nth-child(2)]:px-2',
  '[&:nth-child(3)]:w-[14rem] large:[&:nth-child(3)]:w-[16rem] xlarge:[&:nth-child(3)]:w-[20rem] xxlarge:[&:nth-child(3)]:w-[26rem] [&:nth-child(3)]:px-2',
  '[&:nth-child(4)]:w-[13rem] large:[&:nth-child(4)]:w-[14rem] xlarge:[&:nth-child(4)]:w-[16rem] xxlarge:[&:nth-child(4)]:w-[22rem] [&:nth-child(4)]:pe-5 [&:nth-child(4)]:ps-2',
]

type Target = 'all' | 'medium' | 'large'
const TARGET_CLASSES: Record<Target, string | undefined> = {
  all: undefined,
  medium: 'hidden medium:!table-cell',
  large: 'hidden large:!table-cell',
}

export type HeaderProps = ComponentPropsWithoutRef<'th'> & { target?: Target }

export function Header({ target = 'all', ...props }: HeaderProps) {
  return (
    <th
      {...props}
      className={clsx(
        'whitespace-nowrap font-semibold before:absolute before:inset-0 before:z-[-1] before:rounded-xl before:bg-[#fff] [&:nth-child(1)]:text-[1rem]',
        ...POSITIONAL_CELL_CLASSES,
        TARGET_CLASSES[target],
        props.className,
      )}
    />
  )
}

export type HeadProps = ComponentPropsWithoutRef<'thead'> & { children: ReactNode }

export function Head({ children, ...props }: HeadProps) {
  return (
    <thead {...props} className={clsx('sticky left-0 top-0 h-[3.75rem]', props.className)}>
      <tr className="text-left">{children}</tr>
    </thead>
  )
}

export type DataCellProps = ComponentPropsWithoutRef<'td'> & { target?: Target }

export function DataCell({ target = 'all', ...props }: DataCellProps) {
  return <td {...props} className={clsx(...POSITIONAL_CELL_CLASSES, TARGET_CLASSES[target], props.className)} />
}

export type RowProps = ComponentPropsWithoutRef<'tr'> & { children: ReactNode }

export function Row({ children, ...props }: RowProps) {
  return (
    <tr {...props} className={clsx('h-[3.375rem]', props.className)}>
      {children}
    </tr>
  )
}
