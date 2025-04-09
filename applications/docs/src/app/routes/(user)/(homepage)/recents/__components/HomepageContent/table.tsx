import clsx from '@proton/utils/clsx'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

const POSITIONAL_CELL_CLASSES = [
  '[&:nth-child(1)]:w-full [&:nth-child(1)]:px-6',
  '[&:nth-child(2)]:w-[8rem] [&:nth-child(2)]:px-2',
  '[&:nth-child(3)]:w-[10rem] [&:nth-child(3)]:px-2',
  '[&:nth-child(4)]:w-[10rem] [&:nth-child(4)]:pe-5 [&:nth-child(4)]:ps-2',
]

export type HeaderProps = ComponentPropsWithoutRef<'th'> & { hideOnSmallDevices?: boolean }

export function Header({ hideOnSmallDevices, ...props }: HeaderProps) {
  return (
    <th
      {...props}
      className={clsx(
        'whitespace-nowrap font-semibold [&:nth-child(1)]:text-[1rem]',
        ...POSITIONAL_CELL_CLASSES,
        hideOnSmallDevices && 'hidden medium:!table-cell',
        props.className,
      )}
    />
  )
}

export type HeadProps = ComponentPropsWithoutRef<'thead'> & { children: ReactNode }

export function Head({ children, ...props }: HeadProps) {
  return (
    <thead {...props} className={clsx('sticky left-0 top-0 h-[3.75rem] bg-[#fff]', props.className)}>
      <tr className="text-left">{children}</tr>
    </thead>
  )
}

export type DataCellProps = ComponentPropsWithoutRef<'td'> & { hideOnSmallDevices?: boolean }

export function DataCell({ hideOnSmallDevices, ...props }: DataCellProps) {
  return (
    <td
      {...props}
      className={clsx(...POSITIONAL_CELL_CLASSES, hideOnSmallDevices && 'hidden medium:!table-cell', props.className)}
    />
  )
}

export type RowProps = ComponentPropsWithoutRef<'tr'> & { children: ReactNode }

export function Row({ children, ...props }: RowProps) {
  return (
    <tr {...props} className={clsx('h-[4.25rem]', props.className)}>
      {children}
    </tr>
  )
}
