import * as Ariakit from '@ariakit/react'
import type { Sheet } from '@rowsncolumns/spreadsheet'
import { c } from 'ttag'
import { SheetSwitcherButton } from './primitives'
import { Icon } from '../ui'

interface SheetSwitcherProps {
  sheets: Sheet[]
  activeSheetId: number
  onChangeActiveSheet: (sheetId: number) => void
  onShowSheet: (sheetId: number) => void
}

export function SheetSwitcher({ sheets, activeSheetId, onChangeActiveSheet, onShowSheet }: SheetSwitcherProps) {
  const hiddenSheets = sheets.filter((sheet) => sheet.hidden)
  const visibleSheets = sheets.filter((sheet) => !sheet.hidden)
  const menuStore = Ariakit.useMenuStore()

  return (
    <Ariakit.MenuProvider store={menuStore}>
      <Ariakit.MenuButton render={<SheetSwitcherButton hasHiddenSheets={hiddenSheets.length > 0} />} />

      <Ariakit.Menu className="z-50 max-h-[400px] min-w-[250px] overflow-y-auto rounded-lg border border-[#D1CFCD] bg-[#FFFFFF] shadow-lg">
        {visibleSheets.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-[#8F8D8A]">
              {c('sheets_2025:Sheet switcher').t`Visible sheets`}
            </div>
            {visibleSheets.map((sheet) => (
              <Ariakit.MenuItem
                key={sheet.sheetId}
                className="flex items-center gap-2 rounded px-4 py-2 text-sm hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none"
                onClick={() => {
                  onChangeActiveSheet(sheet.sheetId)
                  menuStore.hide()
                }}
              >
                {sheet.tabColor && typeof sheet.tabColor === 'object' && 'hexValue' in sheet.tabColor && (
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sheet.tabColor.hexValue }} />
                )}
                <span className="flex-1">{sheet.title}</span>
                {sheet.sheetId === activeSheetId && <Icon legacyName="checkmark" className="h-4 w-4 text-[#4695F3]" />}
              </Ariakit.MenuItem>
            ))}
          </>
        )}

        {hiddenSheets.length > 0 && (
          <>
            {visibleSheets.length > 0 && <Ariakit.MenuSeparator className="my-1 border-t border-[#EDEDED]" />}
            <div className="px-3 py-2 text-xs font-medium text-[#8F8D8A]">
              {c('sheets_2025:Sheet switcher').t`Hidden sheets`}
            </div>
            {hiddenSheets.map((sheet) => (
              <Ariakit.MenuItem
                key={sheet.sheetId}
                className="flex items-center gap-2 rounded px-4 py-2 text-sm hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none"
                onClick={() => {
                  onShowSheet(sheet.sheetId)
                  onChangeActiveSheet(sheet.sheetId)
                  menuStore.hide()
                }}
              >
                <Icon legacyName="eye-slash" className="h-4 w-4 text-[#8F8D8A]" />
                {sheet.tabColor && typeof sheet.tabColor === 'object' && 'hexValue' in sheet.tabColor && (
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sheet.tabColor.hexValue }} />
                )}
                <span className="flex-1 text-[#8F8D8A]">{sheet.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onShowSheet(sheet.sheetId)
                  }}
                  className="text-xs text-[#4695F3] hover:underline"
                >
                  {c('sheets_2025:Sheet switcher').t`Show`}
                </button>
              </Ariakit.MenuItem>
            ))}
          </>
        )}

        {sheets.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-[#8F8D8A]">
            {c('sheets_2025:Sheet switcher').t`No sheets available`}
          </div>
        )}
      </Ariakit.Menu>
    </Ariakit.MenuProvider>
  )
}
