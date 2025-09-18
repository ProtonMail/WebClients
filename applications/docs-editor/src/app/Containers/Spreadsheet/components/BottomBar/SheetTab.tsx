import * as Ariakit from '@ariakit/react'
import type { Sheet, ProtectedRange } from '@rowsncolumns/spreadsheet'
import { useState, useRef, type DragEvent } from 'react'
import { c } from 'ttag'
import { IcChevronDown, IcChevronUp, IcLock, IcChevronRight } from '@proton/icons'
import { TabItem } from './primitives'
import { ColorPicker } from './ColorPicker'

interface SheetTabProps {
  sheet: Sheet
  active: boolean
  isReadonly: boolean
  protectedRanges: ProtectedRange[]
  position: number
  canMoveLeft: boolean
  canMoveRight: boolean
  onChangeActiveSheet: (sheetId: number) => void
  onRenameSheet: (sheetId: number, name: string, oldName: string) => void
  onChangeSheetTabColor: (sheetId: number, color: any) => void
  onDeleteSheet: (sheetId: number) => void
  onHideSheet: (sheetId: number) => void
  onMoveSheet: (sheetId: number, currentPosition: number, newPosition: number) => void
  onProtectSheet: (sheetId: number) => void
  onUnProtectSheet: (sheetId: number) => void
  onDuplicateSheet: (sheetId: number) => void
}

export function SheetTab({
  sheet,
  active,
  isReadonly,
  protectedRanges,
  position,
  canMoveLeft,
  canMoveRight,
  onChangeActiveSheet,
  onRenameSheet,
  onChangeSheetTabColor,
  onDeleteSheet,
  onHideSheet,
  onMoveSheet,
  onProtectSheet,
  onUnProtectSheet,
  onDuplicateSheet,
}: SheetTabProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameName, setRenameName] = useState(sheet.title)
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuStore = Ariakit.useMenuStore()
  const colorSubmenuStore = Ariakit.useMenuStore()
  const isMenuOpen = menuStore.useState().open

  // Check if sheet has isProtected property, otherwise check protectedRanges
  const isProtected =
    (sheet as any).isProtected ||
    protectedRanges.some((range) => {
      const rangeSheetId = range.range?.sheetId
      // Sheet-level protection is identified by having no specific cell range bounds
      const isSheetLevelProtection =
        range.range &&
        range.range.startRowIndex === undefined &&
        range.range.endRowIndex === undefined &&
        range.range.startColumnIndex === undefined &&
        range.range.endColumnIndex === undefined
      return rangeSheetId === sheet.sheetId && isSheetLevelProtection
    })

  const handleRenameStart = () => {
    setIsRenaming(true)
    setRenameName(sheet.title)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleRenameSubmit = () => {
    const trimmedName = renameName.trim()
    if (trimmedName && trimmedName !== sheet.title && trimmedName.length <= 50) {
      onRenameSheet(sheet.sheetId, trimmedName, sheet.title)
    }
    setIsRenaming(false)
  }

  const handleRenameCancel = () => {
    setRenameName(sheet.title)
    setIsRenaming(false)
  }

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (isReadonly) {
      return
    }

    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        sheetId: sheet.sheetId,
        position: position,
      }),
    )
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setIsDragOver(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (isReadonly) {
      return
    }

    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (isReadonly) {
      return
    }

    e.preventDefault()
    setIsDragOver(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      const draggedSheetId = data.sheetId
      const draggedPosition = data.position

      // Don't do anything if dropping on the same position
      if (draggedPosition === position) {
        return
      }

      // Move the dragged sheet to the current position
      onMoveSheet(draggedSheetId, draggedPosition, position)
    } catch (error) {
      console.error('Error handling drop:', error)
    }
  }

  if (isRenaming) {
    const isOverLimit = renameName.length > 50
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={renameName}
          maxLength={50}
          onChange={(e) => setRenameName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleRenameSubmit()
            } else if (e.key === 'Escape') {
              handleRenameCancel()
            }
          }}
          className={`bg-white h-[26px] rounded-[6px] border px-2 text-[.875rem] outline-none ${
            isOverLimit ? 'border-red-500' : 'border-[#4695F3]'
          }`}
          autoFocus
        />
        {renameName.length >= 45 && (
          <span className={`absolute -bottom-5 left-0 text-xs ${isOverLimit ? 'text-red-500' : 'text-[#8F8D8A]'}`}>
            {renameName.length}/50
          </span>
        )}
      </div>
    )
  }

  return (
    <>
      <Ariakit.MenuProvider store={menuStore}>
        <TabItem
          active={active}
          onClick={() => onChangeActiveSheet(sheet.sheetId)}
          onDoubleClick={!isReadonly ? handleRenameStart : undefined}
          color={(() => {
            if (sheet.tabColor && typeof sheet.tabColor === 'object' && 'hexValue' in sheet.tabColor) {
              return (sheet.tabColor as any).hexValue
            }
            if (typeof sheet.tabColor === 'string') {
              return sheet.tabColor
            }
            return undefined
          })()}
          draggable={!isReadonly}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'ring-2 ring-[#4695F3]' : ''}`}
          style={{
            cursor: (() => {
              if (!isReadonly && isDragging) {
                return 'grabbing'
              }
              if (!isReadonly) {
                return 'grab'
              }
              return 'default'
            })(),
          }}
        >
          {isProtected && (
            <IcLock
              className={`absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 ${active ? 'text-[#4695F3]' : 'text-[#5D5D5D]'}`}
            />
          )}
          <span className={active ? 'text-[#4695F3]' : 'text-[#5D5D5D]'}>{sheet.title}</span>
          <Ariakit.MenuButton
            className={`absolute right-2 top-1/2 flex h-4 w-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[#D1CFCD] hover:text-[#3A7FD5] ${active ? 'text-[#4695F3]' : 'text-[#5D5D5D]'}`}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {isMenuOpen ? <IcChevronUp className="h-4 w-4" /> : <IcChevronDown className="h-4 w-4" />}
          </Ariakit.MenuButton>
        </TabItem>

        <Ariakit.Menu className="z-50 w-[150px] rounded-lg border border-[#D1CFCD] bg-[#FFFFFF] py-2 shadow-lg">
          {!isReadonly && (
            <>
              <Ariakit.MenuItem
                className="flex cursor-pointer items-center rounded px-4 py-2 text-sm hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none"
                onClick={() => {
                  menuStore.hide()
                  onDeleteSheet(sheet.sheetId)
                }}
              >
                {c('sheets_2025:Sheet context menu').t`Delete`}
              </Ariakit.MenuItem>

              <Ariakit.MenuItem
                className="flex cursor-pointer items-center rounded px-4 py-2 text-sm hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none"
                onClick={() => {
                  menuStore.hide()
                  onDuplicateSheet(sheet.sheetId)
                }}
              >
                {c('sheets_2025:Sheet context menu').t`Duplicate`}
              </Ariakit.MenuItem>

              <Ariakit.MenuItem
                className="flex cursor-pointer items-center rounded px-4 py-2 text-sm hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none"
                onClick={() => {
                  menuStore.hide()
                  handleRenameStart()
                }}
              >
                {c('sheets_2025:Sheet context menu').t`Rename`}
              </Ariakit.MenuItem>

              <Ariakit.MenuProvider store={colorSubmenuStore}>
                <Ariakit.MenuItem
                  className="flex w-full cursor-pointer items-center justify-between rounded px-4 py-2 text-left text-sm hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none"
                  render={<Ariakit.MenuButton />}
                >
                  {c('sheets_2025:Sheet context menu').t`Change color`}
                  <IcChevronRight className="h-4 w-4" />
                </Ariakit.MenuItem>

                <Ariakit.Menu
                  store={colorSubmenuStore}
                  className="z-50 rounded-lg border border-[#D1CFCD] bg-[#FFFFFF] shadow-lg"
                  gutter={4}
                  shift={-8}
                >
                  <ColorPicker
                    sheetId={sheet.sheetId}
                    currentColor={(() => {
                      if (sheet.tabColor && typeof sheet.tabColor === 'object' && 'hexValue' in sheet.tabColor) {
                        return (sheet.tabColor as any).hexValue
                      }
                      if (typeof sheet.tabColor === 'string') {
                        return sheet.tabColor
                      }
                      return null
                    })()}
                    onChangeSheetTabColor={onChangeSheetTabColor}
                    onClose={() => {
                      menuStore.hide()
                      colorSubmenuStore.hide()
                    }}
                  />
                </Ariakit.Menu>
              </Ariakit.MenuProvider>

              {isProtected ? (
                <Ariakit.MenuItem
                  className="flex cursor-pointer items-center rounded px-4 py-2 text-sm hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none"
                  onClick={() => {
                    menuStore.hide()
                    onUnProtectSheet(sheet.sheetId)
                  }}
                >
                  {c('sheets_2025:Sheet context menu').t`Unlock sheet`}
                </Ariakit.MenuItem>
              ) : (
                <Ariakit.MenuItem
                  className="flex cursor-pointer items-center rounded px-4 py-2 text-sm hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none"
                  onClick={() => {
                    menuStore.hide()
                    onProtectSheet(sheet.sheetId)
                  }}
                >
                  {c('sheets_2025:Sheet context menu').t`Lock sheet`}
                </Ariakit.MenuItem>
              )}

              <Ariakit.MenuItem
                className="flex cursor-pointer items-center rounded px-4 py-2 text-sm hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none"
                onClick={() => {
                  menuStore.hide()
                  onHideSheet(sheet.sheetId)
                }}
              >
                {c('sheets_2025:Sheet context menu').t`Hide sheet`}
              </Ariakit.MenuItem>

              <Ariakit.MenuSeparator className="border-weak my-[.4375rem] h-px border-t" />

              {canMoveRight && (
                <Ariakit.MenuItem
                  className="flex cursor-pointer items-center rounded px-4 py-2 text-sm hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none"
                  onClick={() => {
                    menuStore.hide()
                    // Move to the right in the actual sheets array
                    onMoveSheet(sheet.sheetId, position, position + 1)
                  }}
                >
                  {c('sheets_2025:Sheet context menu').t`Move right`}
                </Ariakit.MenuItem>
              )}

              {canMoveLeft && (
                <Ariakit.MenuItem
                  className="flex cursor-pointer items-center rounded px-4 py-2 text-sm hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none"
                  onClick={() => {
                    menuStore.hide()
                    // Move to the left in the actual sheets array
                    onMoveSheet(sheet.sheetId, position, position - 1)
                  }}
                >
                  {c('sheets_2025:Sheet context menu').t`Move left`}
                </Ariakit.MenuItem>
              )}
            </>
          )}
        </Ariakit.Menu>
      </Ariakit.MenuProvider>
    </>
  )
}
