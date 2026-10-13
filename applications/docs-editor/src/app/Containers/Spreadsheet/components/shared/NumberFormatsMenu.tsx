import { useSheetsMessages, useSheetsDependencies } from '../../SheetsDependenciesProvider'
import * as Ariakit from '@ariakit/react'
import { type ReactElement, useState } from 'react'

import { CURRENCY } from '../../constants'

import * as UI from '../ui'
import { useUI } from '../../ui-store'

const NUMBER_FORMAT_NEW_BADGE_STORAGE_KEY_PREFIX = 'sheets:number-format-new-badge-dismissed:'

type NumberFormatNewBadgeItem = 'custom-currency' | 'custom-number' | 'custom-date-and-time'

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

type NumberFormatsMenuPopoverProps = {
  /** @default false */
  asSubmenu?: boolean
}

function NumberFormatsMenuPopover({ asSubmenu = false }: NumberFormatsMenuPopoverProps) {
  const messages = useSheetsMessages()

  const menu = Ariakit.useMenuContext()
  const values = Ariakit.useStoreState(menu, 'values')
  const { featureFlags } = useSheetsDependencies()
  const currencySubMenu = Ariakit.useMenuStore({ values, focusLoop: true })
  const currencyMounted = Ariakit.useStoreState(currencySubMenu, 'mounted')
  const Menu = asSubmenu ? UI.SubMenu : UI.Menu
  const customCurrencyFormatDialogStore = useUI((ui) => ui.view.customCurrencyFormatDialog.store)
  const customNumberFormatDialogStore = useUI((ui) => ui.view.customNumberFormatDialog.store)
  const customDateAndTimeFormatDialogStore = useUI((ui) => ui.view.customDateAndTimeFormatDialog.store)
  const customCurrencyNewBadge = useNumberFormatNewBadge('custom-currency')
  const customNumberNewBadge = useNumberFormatNewBadge('custom-number')
  const customDateAndTimeNewBadge = useNumberFormatNewBadge('custom-date-and-time')

  return (
    <Menu>
      <UI.MenuItemCheckbox
        name="pattern"
        value="GENERAL"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.general.set)}
      >
        {messages.numberFormatsMenu.General}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="PLAIN_TEXT"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.plainText.set)}
      >
        {messages.numberFormatsMenu['Plain text']}
      </UI.MenuItemCheckbox>
      <UI.MenuSeparator />
      <UI.MenuItemCheckbox
        name="pattern"
        value="NUMBER"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.number.set)}
        hintSlot={useUI((ui) => ui.format.pattern.number.example)}
      >
        {messages.numberFormatsMenu.Number}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="PERCENT"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.percent.set)}
        hintSlot={useUI((ui) => ui.format.pattern.percent.example)}
      >
        {messages.numberFormatsMenu.Percent}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="SCIENTIFIC"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.scientific.set)}
        hintSlot={useUI((ui) => ui.format.pattern.scientific.example)}
      >
        {messages.numberFormatsMenu.Scientific}
      </UI.MenuItemCheckbox>
      <UI.MenuSeparator />
      <UI.MenuItemCheckbox
        name="pattern"
        value="ACCOUNTING"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.accounting.set)}
        hintSlot={useUI((ui) => ui.format.pattern.accounting.example)}
      >
        {messages.numberFormatsMenu.Accounting}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="FINANCIAL"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.financial.set)}
        hintSlot={useUI((ui) => ui.format.pattern.financial.example)}
      >
        {messages.numberFormatsMenu.Financial}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="CURRENCY"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.default.set)}
        hintSlot={useUI((ui) => ui.format.pattern.currency.default.example)}
      >
        {messages.numberFormatsMenu.Currency}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="CURRENCY_ROUNDED"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.defaultRounded.set)}
        hintSlot={useUI((ui) => ui.format.pattern.currency.defaultRounded.example)}
      >
        {messages.numberFormatsMenu['Currency rounded']}
      </UI.MenuItemCheckbox>
      <Ariakit.MenuProvider store={currencySubMenu} focusLoop>
        <UI.SubMenuButton leadingIndent>{messages.numberFormatsMenu['More currency']}</UI.SubMenuButton>
        {currencyMounted && <CurrencySubMenuPopover />}
      </Ariakit.MenuProvider>
      <UI.MenuSeparator />
      <UI.MenuItemCheckbox
        name="pattern"
        value="DATE"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.date.set)}
        hintSlot={useUI((ui) => ui.format.pattern.date.example)}
      >
        {messages.numberFormatsMenu.Date}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="LONG_DATE"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.longDate.set)}
        hintSlot={useUI((ui) => ui.format.pattern.longDate.example)}
      >
        {messages.numberFormatsMenu['Long date']}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="TIME"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.time.set)}
        hintSlot={useUI((ui) => ui.format.pattern.time.example)}
      >
        {messages.numberFormatsMenu.Time}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="DATE_TIME"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.dateTime.set)}
        hintSlot={useUI((ui) => ui.format.pattern.dateTime.example)}
      >
        {messages.numberFormatsMenu['Date time']}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="DURATION"
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.duration.set)}
        hintSlot={useUI((ui) => ui.format.pattern.duration.example)}
      >
        {messages.numberFormatsMenu.Duration}
      </UI.MenuItemCheckbox>
      <UI.MenuSeparator />
      <UI.MenuItem
        leadingIndent
        onClick={() => {
          customCurrencyNewBadge.dismiss()
          customCurrencyFormatDialogStore.show()
        }}
        hintSlot={customCurrencyNewBadge.hintSlot}
      >
        {messages.numberFormatsMenu['Custom currency']}
      </UI.MenuItem>
      {featureFlags.SheetsCustomNumberFormatEnabled && (
        <UI.MenuItem
          leadingIndent
          onClick={() => {
            customNumberNewBadge.dismiss()
            customNumberFormatDialogStore.show()
          }}
          hintSlot={customNumberNewBadge.hintSlot}
        >
          {messages.numberFormatsMenu['Custom number']}
        </UI.MenuItem>
      )}
      {featureFlags.SheetsCustomDateTimeFormatEnabled && (
        <UI.MenuItem
          leadingIndent
          onClick={() => {
            customDateAndTimeNewBadge.dismiss()
            customDateAndTimeFormatDialogStore.show()
          }}
          hintSlot={customDateAndTimeNewBadge.hintSlot}
        >
          {messages.numberFormatsMenu['Custom date and time']}
        </UI.MenuItem>
      )}
    </Menu>
  )
}

function CurrencySubMenuPopover() {
  const messages = useSheetsMessages()

  return (
    <UI.SubMenu>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('USD')}
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.usd.set)}
      >
        {messages.numberFormatsMenu['$ US Dollar']}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('EUR')}
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.eur.set)}
      >
        {messages.numberFormatsMenu['€ Euro']}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('GBP')}
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.gbp.set)}
      >
        {messages.numberFormatsMenu['£ Pound']}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('JPY')}
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.jpy.set)}
      >
        {messages.numberFormatsMenu['¥ Yen']}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('CNY')}
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.cny.set)}
      >
        {messages.numberFormatsMenu['CN¥ Chinese Yuan']}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('INR')}
        onClick={useUI.$.withFocusGrid(useUI.$.format.pattern.currency.inr.set)}
      >
        {messages.numberFormatsMenu['₹ Rupee']}
      </UI.MenuItemCheckbox>
    </UI.SubMenu>
  )
}

function NewBadge() {
  const messages = useSheetsMessages()

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center self-center rounded bg-[#F4F1FF] px-1 text-xs font-semibold leading-4 text-[#6D4AFF]"
    >
      {messages.numberFormatsMenu.New}
    </span>
  )
}

function useNumberFormatNewBadge(item: NumberFormatNewBadgeItem) {
  const storageKey = `${NUMBER_FORMAT_NEW_BADGE_STORAGE_KEY_PREFIX}${item}`
  const [isDismissed, setIsDismissed] = useState(() => getNumberFormatNewBadgeDismissed(storageKey))

  return {
    hintSlot: isDismissed ? undefined : <NewBadge />,
    dismiss: () => {
      setIsDismissed(true)
      setNumberFormatNewBadgeDismissed(storageKey)
    },
  }
}

function getNumberFormatNewBadgeDismissed(storageKey: string) {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(storageKey) === 'true'
  } catch {
    return false
  }
}

function setNumberFormatNewBadgeDismissed(storageKey: string) {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    window.localStorage.setItem(storageKey, 'true')
  } catch {
    return undefined
  }
}

function getCurrencyItemValue(name: string) {
  return CURRENCY === name ? 'CURRENCY' : name
}

export const numberFormatsMenuMessages = {
  numberFormatsMenu: {
    General: `General`,
    'Plain text': `Plain text`,
    Number: `Number`,
    Percent: `Percent`,
    Scientific: `Scientific`,
    Accounting: `Accounting`,
    Financial: `Financial`,
    Currency: `Currency`,
    'Currency rounded': `Currency rounded`,
    'More currency': `More currency`,
    '$ US Dollar': `$ US Dollar`,
    '€ Euro': `€ Euro`,
    '£ Pound': `£ Pound`,
    '¥ Yen': `¥ Yen`,
    'CN¥ Chinese Yuan': `CN¥ Chinese Yuan`,
    '₹ Rupee': `₹ Rupee`,
    Date: `Date`,
    'Long date': `Long date`,
    Time: `Time`,
    'Date time': `Date time`,
    Duration: `Duration`,
    'Custom currency': `Custom currency`,
    'Custom number': `Custom number`,
    'Custom date and time': `Custom date and time`,
    New: `New`,
  },
}
