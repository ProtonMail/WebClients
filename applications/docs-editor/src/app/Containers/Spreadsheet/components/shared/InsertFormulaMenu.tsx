import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import * as UI from '../ui'
import { useUI } from '../../ui-store'
import { FUNCTION_DESCRIPTIONS } from '../../constants'

const PINNED_FUNCTIONS = ['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN'] as const

type FunctionDescription = (typeof FUNCTION_DESCRIPTIONS)[number]

const functionMapByTitle = new Map<string, FunctionDescription>()
const functionsByCategory = new Map<string, Set<FunctionDescription>>()

function getOrCreateCategorySet(category: string): Set<FunctionDescription> {
  let set = functionsByCategory.get(category)
  if (!set) {
    set = new Set<FunctionDescription>()
    functionsByCategory.set(category, set)
  }
  return set
}

for (const fn of FUNCTION_DESCRIPTIONS) {
  functionMapByTitle.set(fn.title, fn)
  getOrCreateCategorySet(fn.datatype).add(fn)
}

const functionCategories = Array.from(functionsByCategory.keys()).sort()

export interface InsertFormulaMenuProps extends Ariakit.MenuProviderProps {
  asSubmenu?: boolean
  renderMenuButton?: ReactElement
}

export function InsertFormulaMenu({ asSubmenu = false, renderMenuButton, children, ...props }: InsertFormulaMenuProps) {
  const menu = Ariakit.useMenuStore({ focusLoop: true })
  const mounted = Ariakit.useStoreState(menu, 'mounted')
  const disabled = useUI((ui) => ui.info.isReadonly)
  return (
    <Ariakit.MenuProvider store={menu} {...props}>
      {asSubmenu ? children : <Ariakit.MenuButton render={renderMenuButton} disabled={disabled} />}
      {mounted && <InsertFormulaMenuPopover asSubmenu={asSubmenu} />}
    </Ariakit.MenuProvider>
  )
}

type InsertFormulaMenuPopoverProps = {
  asSubmenu?: boolean
}

function InsertFormulaMenuPopover({ asSubmenu = false }: InsertFormulaMenuPopoverProps) {
  const insertFormula = useUI.$.insert.formula
  const Menu = asSubmenu ? UI.SubMenu : UI.Menu
  const isReadonly = useUI((ui) => ui.info.isReadonly)
  return (
    <Menu>
      {PINNED_FUNCTIONS.map((title) => {
        const fn = functionMapByTitle.get(title)
        return fn ? <FormulaItem key={fn.title} fn={fn} insertFormula={insertFormula} isReadonly={isReadonly} /> : null
      })}
      <UI.MenuSeparator />
      {functionCategories.map((category) => (
        <Ariakit.MenuProvider key={category}>
          <UI.SubMenuButton disabled={isReadonly}>{category}</UI.SubMenuButton>
          <CategorySubMenuPopover category={category} isReadonly={isReadonly} />
        </Ariakit.MenuProvider>
      ))}
    </Menu>
  )
}

type CategorySubMenuPopoverProps = {
  category: string
  isReadonly: boolean
}

function CategorySubMenuPopover({ category, isReadonly }: CategorySubMenuPopoverProps) {
  const insertFormula = useUI.$.insert.formula
  const functionsSet = functionsByCategory.get(category)
  const functions = functionsSet ? Array.from(functionsSet) : []
  return (
    <UI.SubMenu unmountOnHide>
      {functions.map((fn) => (
        <FormulaItem key={fn.title} fn={fn} insertFormula={insertFormula} isReadonly={isReadonly} />
      ))}
    </UI.SubMenu>
  )
}

type FormulaItemProps = {
  fn: FunctionDescription
  insertFormula: (name: string) => void
  isReadonly: boolean
}

function FormulaItem({ fn, insertFormula, isReadonly }: FormulaItemProps) {
  return (
    <Ariakit.TooltipProvider placement="right" timeout={0}>
      <Ariakit.TooltipAnchor
        render={
          <UI.MenuItem key={fn.title} onClick={() => insertFormula(fn.title)} disabled={isReadonly}>
            {fn.title}
          </UI.MenuItem>
        }
      />
      <UI.Tooltip>{fn.description}</UI.Tooltip>
    </Ariakit.TooltipProvider>
  )
}
