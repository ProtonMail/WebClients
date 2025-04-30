/* eslint-disable jsx-a11y/prefer-tag-over-role */
import clsx from '@proton/utils/clsx'
import { type ComponentPropsWithoutRef, type ReactNode } from 'react'

const POSITIONAL_CELL_CLASSES = [
  '[&:nth-child(1)]:grow [&:nth-child(1)]:px-5 [&:nth-child(1)]:basis-0',
  '[&:nth-child(2)]:w-[9rem] xlarge:[&:nth-child(2)]:w-[12rem] xxlarge:[&:nth-child(2)]:w-[18rem] [&:nth-child(2)]:px-2',
  '[&:nth-child(3)]:w-[14rem] large:[&:nth-child(3)]:w-[16rem] xlarge:[&:nth-child(3)]:w-[20rem] xxlarge:[&:nth-child(3)]:w-[26rem] [&:nth-child(3)]:px-2',
  '[&:nth-child(4)]:w-[13rem] large:[&:nth-child(4)]:w-[14rem] xlarge:[&:nth-child(4)]:w-[16rem] xxlarge:[&:nth-child(4)]:w-[22rem] [&:nth-child(4)]:pe-2 [&:nth-child(4)]:ps-2',
]

type Target = 'all' | 'medium' | 'large'
const TARGET_CLASSES: Record<Target, string | undefined> = {
  all: undefined,
  medium: 'hidden medium:!flex',
  large: 'hidden large:!flex',
}

export interface TableProps extends ComponentPropsWithoutRef<'div'> {}

export function Table(props: TableProps) {
  return <div role="table" {...props} className={clsx('text-[14px]', props.className)} />
}

export interface TitleProps extends ComponentPropsWithoutRef<'div'> {}

export function Title(props: TitleProps) {
  return (
    <div
      {...props}
      className={clsx(
        'border-weak sticky top-0 hidden h-11 items-center justify-between border-b pe-2 ps-5 text-[1rem] font-semibold before:absolute before:inset-0 before:z-[-1] before:rounded-xl before:bg-[#fff] small:!flex',
        props.className,
      )}
    />
  )
}

export interface HeadProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode
  secondarySticky?: boolean
}

export function Head({ children, secondarySticky, ...props }: HeadProps) {
  return (
    <div
      role="rowgroup"
      {...props}
      className={clsx('sticky left-0 top-0', secondarySticky && 'small:!top-11', props.className)}
    >
      <div role="row" className="flex h-[2.75rem] items-center text-left">
        {children}
      </div>
    </div>
  )
}

export interface HeaderProps extends ComponentPropsWithoutRef<'div'> {
  target?: Target
  isTitle?: boolean
}

export function Header({ target = 'all', isTitle, ...props }: HeaderProps) {
  return (
    <div
      role="columnheader"
      {...props}
      className={clsx(
        'relative flex h-full items-center whitespace-nowrap font-semibold before:absolute before:inset-0 before:z-[-1] before:rounded-xl before:bg-[#fff]',
        isTitle && '[&:nth-child(1)]:text-[1rem]',
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
