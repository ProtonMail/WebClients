import { forwardRef } from 'react'
import * as Ariakit from '@ariakit/react'
import clsx from '@proton/utils/clsx'

export type MenubarItemProps = Ariakit.MenuItemProps

export const MenubarItem = forwardRef<HTMLDivElement, MenubarItemProps>(function MenubarItem(props, ref) {
  return <Ariakit.MenuItem ref={ref} {...props} className={clsx('TODO:', props.className)} />
})
