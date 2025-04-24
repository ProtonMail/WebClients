/* eslint-disable jsx-a11y/prefer-tag-over-role */
import clsx from '@proton/utils/clsx'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

const POSITIONAL_CELL_CLASSES = [
  '[&:nth-child(1)]:grow [&:nth-child(1)]:px-6 [&:nth-child(1)]:basis-0',
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

export interface TableProps extends ComponentPropsWithoutRef<'div'> {}

export function Table(props: TableProps) {
  return <div role="table" {...props} className={clsx('text-[14px]', props.className)} />
}

export interface HeadProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode
}

export function Head({ children, ...props }: HeadProps) {
  return (
    <div role="rowgroup" {...props} className={clsx('sticky left-0 top-0', props.className)}>
      <div role="row" className="flex h-[3.75rem] items-center text-left">
        {children}
      </div>
    </div>
  )
}

export interface HeaderProps extends ComponentPropsWithoutRef<'div'> {
  target?: Target
}

export function Header({ target = 'all', ...props }: HeaderProps) {
  return (
    <div
      role="columnheader"
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

export interface BodyProps extends ComponentPropsWithoutRef<'div'> {}

export function Body(props: BodyProps) {
  return <div role="rowgroup" {...props} />
}

export interface RowProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode
}

export function Row({ children, ...props }: RowProps) {
  return (
    <div role="row" {...props} className={clsx('flex h-[3.375rem] flex-nowrap items-center', props.className)}>
      {children}
    </div>
  )
}

export interface DataCellProps extends ComponentPropsWithoutRef<'div'> {
  target?: Target
}

export function DataCell({ target = 'all', ...props }: DataCellProps) {
  return (
    <div
      role="cell"
      {...props}
      className={clsx('min-w-0', ...POSITIONAL_CELL_CLASSES, TARGET_CLASSES[target], props.className)}
    />
  )
}
