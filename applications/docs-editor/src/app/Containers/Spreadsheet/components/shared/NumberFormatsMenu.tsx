import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import { CURRENCY } from '../../constants'
import { createStringifier } from '../../stringifier'
import * as UI from '../ui'
import { useUI } from '../../ui-store'

const { s } = createStringifier(strings)

/**
 * If `asSubmenu` is `false` (default), use `renderMenuButton`. If `true`, pass
 * a menu button as children.
 */
export interface NumberFormatsMenuProps extends Ariakit.MenuProviderProps {
  /** @default false */
  asSubmenu?: boolean
  renderMenuButton?: ReactElement
}

export function NumberFormatsMenu({ asSubmenu = false, renderMenuButton, children, ...props }: NumberFormatsMenuProps) {
  const currentPattern = useUI((ui) => ui.format.pattern.current)
  const values = { pattern: currentPattern ? [currentPattern] : [] }
  const menu = Ariakit.useMenuStore({ values, focusLoop: true })
  const mounted = Ariakit.useStoreState(menu, 'mounted')
  const disabled = useUI((ui) => ui.info.isReadonly)
  return (
    <Ariakit.MenuProvider store={menu} {...props}>
      {asSubmenu ? children : <Ariakit.MenuButton render={renderMenuButton} disabled={disabled} />}
      {mounted && <NumberFormatsMenuPopover asSubmenu={asSubmenu} />}
    </Ariakit.MenuProvider>
  )
}

export type NumberFormatsMenuPopoverProps = {
  /** @default false */
  asSubmenu?: boolean
}

function NumberFormatsMenuPopover({ asSubmenu = false }: NumberFormatsMenuPopoverProps) {
  const menu = Ariakit.useMenuContext()
  const values = Ariakit.useStoreState(menu, 'values')
  const currencySubMenu = Ariakit.useMenuStore({ values, focusLoop: true })
  const currencyMounted = Ariakit.useStoreState(currencySubMenu, 'mounted')
  const Menu = asSubmenu ? UI.SubMenu : UI.Menu
  const customCurrencyFormatDialogStore = useUI((ui) => ui.view.customCurrencyFormatDialog.store)
  // const customNumberFormatDialogStore = useUI((ui) => ui.view.customNumberFormatDialog.store)

  return (
    <Menu>
      <UI.MenuItemCheckbox
        name="pattern"
        value="GENERAL"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.general.set)}
      >
        {s('General')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="PLAIN_TEXT"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.plainText.set)}
      >
        {s('Plain text')}
      </UI.MenuItemCheckbox>
      <UI.MenuSeparator />
      <UI.MenuItemCheckbox
        name="pattern"
        value="NUMBER"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.number.set)}
        hintSlot={useUI((ui) => ui.format.pattern.number.example)}
      >
        {s('Number')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="PERCENT"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.percent.set)}
        hintSlot={useUI((ui) => ui.format.pattern.percent.example)}
      >
        {s('Percent')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="SCIENTIFIC"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.scientific.set)}
        hintSlot={useUI((ui) => ui.format.pattern.scientific.example)}
      >
        {s('Scientific')}
      </UI.MenuItemCheckbox>
      <UI.MenuSeparator />
      <UI.MenuItemCheckbox
        name="pattern"
        value="ACCOUNTING"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.accounting.set)}
        hintSlot={useUI((ui) => ui.format.pattern.accounting.example)}
      >
        {s('Accounting')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="FINANCIAL"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.financial.set)}
        hintSlot={useUI((ui) => ui.format.pattern.financial.example)}
      >
        {s('Financial')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="CURRENCY"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.default.set)}
        hintSlot={useUI((ui) => ui.format.pattern.currency.default.example)}
      >
        {s('Currency')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="CURRENCY_ROUNDED"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.defaultRounded.set)}
        hintSlot={useUI((ui) => ui.format.pattern.currency.defaultRounded.example)}
      >
        {s('Currency rounded')}
      </UI.MenuItemCheckbox>
      <Ariakit.MenuProvider store={currencySubMenu} focusLoop>
        <UI.SubMenuButton leadingIndent>{s('More currency')}</UI.SubMenuButton>
        {currencyMounted && <CurrencySubMenuPopover />}
      </Ariakit.MenuProvider>
      <UI.MenuSeparator />
      <UI.MenuItemCheckbox
        name="pattern"
        value="DATE"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.date.set)}
        hintSlot={useUI((ui) => ui.format.pattern.date.example)}
      >
        {s('Date')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="LONG_DATE"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.longDate.set)}
        hintSlot={useUI((ui) => ui.format.pattern.longDate.example)}
      >
        {s('Long date')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="TIME"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.time.set)}
        hintSlot={useUI((ui) => ui.format.pattern.time.example)}
      >
        {s('Time')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="DATE_TIME"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.dateTime.set)}
        hintSlot={useUI((ui) => ui.format.pattern.dateTime.example)}
      >
        {s('Date time')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="DURATION"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.duration.set)}
        hintSlot={useUI((ui) => ui.format.pattern.duration.example)}
      >
        {s('Duration')}
      </UI.MenuItemCheckbox>
      <UI.MenuSeparator />
      <UI.MenuItem leadingIndent onClick={customCurrencyFormatDialogStore.show}>
        {s('Custom currency')}
      </UI.MenuItem>
      {/* <UI.MenuItem onClick={customNumberFormatDialogStore.show}>{s('Custom number format')}</UI.MenuItem> */}
    </Menu>
  )
}

function CurrencySubMenuPopover() {
  return (
    <UI.SubMenu>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('USD')}
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.usd.set)}
      >
        {s('$ US Dollar')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('EUR')}
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.eur.set)}
      >
        {s('€ Euro')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('GBP')}
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.gbp.set)}
      >
        {s('£ Pound')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('JPY')}
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.jpy.set)}
      >
        {s('¥ Yen')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('CNY')}
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.cny.set)}
      >
        {s('CN¥ Chinese Yuan')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('INR')}
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.inr.set)}
      >
        {s('₹ Rupee')}
      </UI.MenuItemCheckbox>
    </UI.SubMenu>
  )
}

function getCurrencyItemValue(name: string) {
  return CURRENCY === name ? 'CURRENCY' : name
}

function strings() {
  return {
    General: c('sheets_2025:Spreadsheet editor number formats menu').t`General`,
    'Plain text': c('sheets_2025:Spreadsheet editor number formats menu').t`Plain text`,
    Number: c('sheets_2025:Spreadsheet editor number formats menu').t`Number`,
    Percent: c('sheets_2025:Spreadsheet editor number formats menu').t`Percent`,
    Scientific: c('sheets_2025:Spreadsheet editor number formats menu').t`Scientific`,
    Accounting: c('sheets_2025:Spreadsheet editor number formats menu').t`Accounting`,
    Financial: c('sheets_2025:Spreadsheet editor number formats menu').t`Financial`,
    Currency: c('sheets_2025:Spreadsheet editor number formats menu').t`Currency`,
    'Currency rounded': c('sheets_2025:Spreadsheet editor number formats menu').t`Currency rounded`,
    'More currency': c('sheets_2025:Spreadsheet editor number formats menu').t`More currency`,
    '$ US Dollar': c('sheets_2025:Spreadsheet editor number formats menu').t`$ US Dollar`,
    '€ Euro': c('sheets_2025:Spreadsheet editor number formats menu').t`€ Euro`,
    '£ Pound': c('sheets_2025:Spreadsheet editor number formats menu').t`£ Pound`,
    '¥ Yen': c('sheets_2025:Spreadsheet editor number formats menu').t`¥ Yen`,
    'CN¥ Chinese Yuan': c('sheets_2025:Spreadsheet editor number formats menu').t`CN¥ Chinese Yuan`,
    '₹ Rupee': c('sheets_2025:Spreadsheet editor number formats menu').t`₹ Rupee`,
    Date: c('sheets_2025:Spreadsheet editor number formats menu').t`Date`,
    'Long date': c('sheets_2025:Spreadsheet editor number formats menu').t`Long date`,
    Time: c('sheets_2025:Spreadsheet editor number formats menu').t`Time`,
    'Date time': c('sheets_2025:Spreadsheet editor number formats menu').t`Date time`,
    Duration: c('sheets_2025:Spreadsheet editor number formats menu').t`Duration`,
    'Custom currency': c('sheets_2025:Spreadsheet editor number formats menu').t`Custom currency`,
    'Custom number format': c('sheets_2025:Spreadsheet editor number formats menu').t`Custom number format`,
  }
}
