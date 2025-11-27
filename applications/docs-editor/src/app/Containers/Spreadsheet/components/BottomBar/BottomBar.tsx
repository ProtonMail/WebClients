import type { MouseEvent, ComponentPropsWithoutRef, Ref } from 'react'
import { memo, useCallback, useEffect, useState } from 'react'
import { Icon } from '../ui'
import * as Ariakit from '@ariakit/react'
import * as UI from '../ui'
import type { IconName } from '@proton/icons/types'
import clsx from '@proton/utils/clsx'
import { createStringifier } from '../../stringifier'
import { c } from 'ttag'
import { createComponent, useEvent } from '../utils'
import { useUI } from '../../ui-store'
import type { ProtonSheetsUIState } from '../../ui-state'
import type { DragEndEvent } from '@dnd-kit/core'
import { closestCenter, DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getStringifiedColor } from '@rowsncolumns/spreadsheet'
import { ColorPicker } from '../shared/ColorPicker'

const { s } = createStringifier(strings)

interface IconButtonProps extends Ariakit.ButtonProps {
  ref?: Ref<HTMLButtonElement>
  legacyIconName?: IconName
  children?: string
}
const IconButton = createComponent(function Item({ legacyIconName, children, ...props }: IconButtonProps) {
  const outputProps = {
    ...props,
    className: clsx(
      'flex shrink-0 items-center justify-center gap-[.375rem] rounded-[.25rem] text-[#0C0C14] focus:outline-none aria-disabled:text-[#8F8D8A]',
      'aria-expanded:bg-[#C2C1C0]/20',
      'p-2.5',
      // TODO: "hocus" type tw variant
      'hover:bg-[#C2C1C0]/20 focus-visible:bg-[#C2C1C0]/20 data-[focus-visible]:bg-[#C2C1C0]/20',
      // TODO: "active" tw variant
      // TODO: see hack for specificity, otherwise active styles are overridden by data-[focus-visible] :(
      'active:active:bg-[#C2C0BE]/35 data-[active]:bg-[#C2C0BE]/35',
      'aria-pressed:aria-pressed:bg-[#C2C0BE]/35',
      props.className,
    ),
  }

  const content = (
    <Ariakit.Button aria-label={children} accessibleWhenDisabled>
      {legacyIconName && <Icon className="shrink-0" legacyName={legacyIconName} />}
    </Ariakit.Button>
  )

  return (
    <Ariakit.TooltipProvider placement="top">
      {/* @ts-expect-error - fix typings */}
      <Ariakit.TooltipAnchor {...outputProps} render={content} />
      <UI.Tooltip gutter={4}>{children}</UI.Tooltip>
    </Ariakit.TooltipProvider>
  )
})

const SheetSwitcherMenu = memo(function SheetSwitcherMenu() {
  const setActiveId = useUI.$.sheets.setActiveId
  return (
    <UI.Menu>
      {useUI((ui) => ui.sheets.list).map((sheet) => (
        <UI.MenuItemCheckbox
          name="sheet"
          value={sheet.id}
          key={sheet.id}
          onClick={() => {
            setActiveId(sheet.id)
          }}
        >
          {sheet.name}
        </UI.MenuItemCheckbox>
      ))}
    </UI.Menu>
  )
})

const SheetSwitcher = memo(function SheetSwitcher() {
  const activeId = useUI((ui) => ui.sheets.activeId)

  const menu = Ariakit.useMenuStore({
    values: {
      sheet: [activeId],
    },
  })
  const mounted = Ariakit.useStoreState(menu, 'mounted')

  return (
    <div className="py-0.5">
      <Ariakit.MenuProvider store={menu}>
        <Ariakit.MenuButton render={<IconButton legacyIconName="hamburger">{s('All sheets')}</IconButton>} />
        {mounted && <SheetSwitcherMenu />}
      </Ariakit.MenuProvider>
    </div>
  )
})

interface SheetOptionsProps extends Ariakit.MenuButtonProps {
  sheet: ProtonSheetsUIState['sheets']['list'][number]
  rename: () => void
  index: number
}
function SheetOptions({ sheet, rename, index, ...props }: SheetOptionsProps) {
  const openDeleteSheetDialog = useUI.$.view.deleteSheetConfirmation.open
  const duplicateSheet = useUI.$.sheets.duplicate
  const moveInDirection = useUI.$.sheets.moveInDirection
  const changeTabColor = useUI.$.sheets.changeTabColor

  const canMoveLeft = index > 0
  const canMoveRight = index < useUI((ui) => ui.sheets.visible.length) - 1

  const colorPickerStore = Ariakit.useMenuStore()

  return (
    <Ariakit.MenuProvider>
      <Ariakit.MenuButton {...props} onClick={(e: MouseEvent) => e.stopPropagation()}>
        <Icon legacyName="chevron-down" />
      </Ariakit.MenuButton>
      <UI.Menu>
        <UI.MenuItem onClick={() => openDeleteSheetDialog(sheet.id)}>{s('Delete')}</UI.MenuItem>
        <UI.MenuItem onClick={() => duplicateSheet(sheet.id)}>{s('Duplicate')}</UI.MenuItem>
        <UI.MenuItem
          onClick={() => {
            setTimeout(() => rename())
          }}
        >
          {s('Rename')}
        </UI.MenuItem>
        <Ariakit.MenuProvider store={colorPickerStore}>
          <UI.SubMenuButton>{s('Change color')}</UI.SubMenuButton>
          <UI.SubMenu>
            <ColorPicker
              className="px-4 py-2"
              selectedColor={sheet.tabColor}
              onChange={(color) => {
                changeTabColor(sheet.id, color)
                colorPickerStore.hide()
              }}
            />
          </UI.SubMenu>
        </Ariakit.MenuProvider>
        <UI.MenuSeparator />
        <UI.MenuItem disabled={!canMoveLeft} onClick={() => moveInDirection(sheet.id, 'left')}>
          {s('Move left')}
        </UI.MenuItem>
        <UI.MenuItem disabled={!canMoveRight} onClick={() => moveInDirection(sheet.id, 'right')}>
          {s('Move right')}
        </UI.MenuItem>
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

interface SheetTabProps {
  sheet: ProtonSheetsUIState['sheets']['list'][number]
  isActive: boolean
  index: number
}
function SheetTab({ sheet, index, isActive }: SheetTabProps) {
  const isReadonly = useUI((ui) => ui.info.isReadonly)
  const setActiveId = useUI.$.sheets.setActiveId
  const rename = useUI.$.sheets.rename

  const [isRenaming, setIsRenaming] = useState(false)
  const [title, setTitle] = useState(sheet.name)
  useEffect(() => {
    setTitle(sheet.name)
  }, [sheet.name])

  const focusInputOnMount = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      input.focus()
      input.select()
    }
  }, [])

  const confirmRename = useCallback(() => {
    if (title === sheet.name) {
      setIsRenaming(false)
      return
    }
    rename(sheet.id, title)
    setIsRenaming(false)
  }, [rename, sheet.id, sheet.name, title])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sheet.id })

  const tabColor = getStringifiedColor(
    sheet.tabColor,
    useUI((ui) => ui.legacy.theme),
  )

  return (
    <div
      className="relative flex h-full shrink-0 items-center"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: transform
          ? CSS.Translate.toString({
              ...transform,
              y: 0,
            })
          : undefined,
        transition,
        zIndex: isDragging ? 1 : 0,
      }}
    >
      <Ariakit.Role.button
        render={<div />}
        className={clsx(
          'relative flex items-center rounded-[.375rem] px-8 py-0.5 text-sm',
          isActive && 'bg-[#1EA885]/10',
          isActive && !isRenaming && 'text-[#1EA885]',
          !isRenaming && 'select-none',
          'hover:bg-[#1EA885]/10',
        )}
        style={{
          backgroundColor: isDragging ? '#E7F4F2' : undefined,
        }}
        onClick={() => setActiveId(sheet.id)}
      >
        <div
          onDoubleClick={() => {
            if (!isReadonly) {
              setIsRenaming(true)
            }
          }}
        >
          <div className="relative inline-grid items-center">
            {isRenaming && (
              <input
                className="w-auto max-w-full rounded-[.25rem] border border-[transparent] px-1 [field-sizing:content] [grid-area:1_/_2] focus:border-[#6D4AFF] focus:outline-none"
                ref={focusInputOnMount}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={confirmRename}
                size={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmRename()
                  } else if (e.key === 'Escape') {
                    setIsRenaming(false)
                    setTitle(sheet.name)
                  }
                }}
              />
            )}
            <div
              className={clsx(
                isRenaming && 'w-auto select-none overflow-hidden whitespace-pre [visibility:hidden]',
                'border border-[transparent] px-1 [grid-area:1_/_2]',
              )}
              aria-hidden={isRenaming}
            >
              {title}
            </div>
          </div>
        </div>
        {!isRenaming && !isReadonly && (
          <SheetOptions
            sheet={sheet}
            index={index}
            rename={() => setIsRenaming(true)}
            className="absolute right-1 top-1/2 flex -translate-y-1/2"
          />
        )}
      </Ariakit.Role.button>
      {sheet.tabColor && (
        <div className="absolute bottom-0 left-1/2 h-1 w-1/3 -translate-x-1/2" style={{ backgroundColor: tabColor }} />
      )}
    </div>
  )
}

interface SheetTabsProps extends ComponentPropsWithoutRef<'div'> {}
const SheetTabs = memo(function SheetTabs(props: SheetTabsProps) {
  const activeId = useUI((ui) => ui.sheets.activeId)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  )

  const sheets = useUI((ui) => ui.sheets.list)
  const moveSheet = useUI.$.sheets.move
  const handleDragEnd = useEvent((event: DragEndEvent) => {
    const { active, over } = event
    if (active.id && over?.id && active.id !== over.id) {
      const currentPosition = sheets.findIndex((sheet) => sheet.id === active.id)
      const newPosition = sheets.findIndex((sheet) => sheet.id === over.id)
      moveSheet(Number(active.id), currentPosition, newPosition)
    }
  })

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToParentElement, restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={useUI((ui) => ui.sheets.visible).map((sheet) => sheet.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div {...props} className="flex h-full items-center gap-2.5 overflow-x-auto">
          {useUI((ui) => ui.sheets.visible).map((sheet, index) => (
            <SheetTab key={sheet.id} sheet={sheet} index={index} isActive={sheet.id === activeId} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
})

const NewSheetButton = memo(function NewSheetButton() {
  const isReadonly = useUI((ui) => ui.info.isReadonly)
  const isRevisionMode = useUI((ui) => ui.info.isRevisionMode)
  if (isReadonly || isRevisionMode) {
    return null
  }
  return (
    <IconButton legacyIconName="plus" onClick={useUI.$.insert.sheet} disabled={isReadonly}>
      {s('New sheet')}
    </IconButton>
  )
})

export interface BottomBarProps extends ComponentPropsWithoutRef<'div'> {}

export const BottomBar = memo(function BottomBar(props: BottomBarProps) {
  return (
    <div {...props} className="flex items-center gap-2.5 border-t border-[#DEDEDE] bg-[#F9FCFA] pl-3 print:hidden">
      <SheetSwitcher />
      <SheetTabs />
      <div className="shrink-0 py-0.5 pl-2.5 pr-[3.125rem]">
        <NewSheetButton />
      </div>
    </div>
  )
})

function strings() {
  return {
    'New sheet': c('sheets_2025:Bottom bar').t`New sheet`,
    'All sheets': c('sheets_2025:Bottom bar').t`All sheets`,
    Delete: c('sheets_2025:Sheet tab options').t`Delete`,
    Duplicate: c('sheets_2025:Sheet tab options').t`Duplicate`,
    Rename: c('sheets_2025:Sheet tab options').t`Rename`,
    'Change color': c('sheets_2025:Sheet tab options').t`Change color`,
    'Move left': c('sheets_2025:Sheet tab options').t`Move left`,
    'Move right': c('sheets_2025:Sheet tab options').t`Move right`,
  }
}
