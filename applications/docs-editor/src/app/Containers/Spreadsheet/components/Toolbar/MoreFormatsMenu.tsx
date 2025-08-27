import * as Ariakit from '@ariakit/react'
import type { ReactElement, ReactNode } from 'react'
import { c } from 'ttag'
import { CURRENCY } from '../../constants'
import { useStringifier } from '../../stringifier'
import type { ProtonSheetsUIState } from '../../ui-state'
import * as UI from '../ui'

export interface MoreFormatsMenuProps extends Ariakit.MenuProviderProps {
  ui: ProtonSheetsUIState
  renderMenuButton: ReactElement
}

export function MoreFormatsMenu({ ui, renderMenuButton, ...props }: MoreFormatsMenuProps) {
  const values = { pattern: ui.format.pattern.current ? [ui.format.pattern.current] : [] }
  const menu = Ariakit.useMenuStore({ values, focusLoop: true })
  const mounted = Ariakit.useStoreState(menu, 'mounted')
  return (
    <Ariakit.MenuProvider store={menu} {...props}>
      <Ariakit.MenuButton render={renderMenuButton} />
      {mounted && <Menu ui={ui} />}
    </Ariakit.MenuProvider>
  )
}

type MenuProps = {
  ui: ProtonSheetsUIState
}

function Menu({ ui }: MenuProps) {
  const s = useStrings()
  const menu = Ariakit.useMenuContext()
  const values = Ariakit.useStoreState(menu, 'values')
  const currencySubMenu = Ariakit.useMenuStore({ values, focusLoop: true })
  const currencyMounted = Ariakit.useStoreState(currencySubMenu, 'mounted')
  return (
    <UI.Menu>
      <UI.MenuItemCheckbox name="pattern" value="GENERAL" onClick={ui.withFocusGrid(ui.format.pattern.general.set)}>
        {s('General')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="PLAIN_TEXT"
        onClick={ui.withFocusGrid(ui.format.pattern.plainText.set)}
      >
        {s('Plain text')}
      </UI.MenuItemCheckbox>
      <UI.MenuSeparator />
      <UI.MenuItemCheckbox name="pattern" value="NUMBER" onClick={ui.withFocusGrid(ui.format.pattern.number.set)}>
        <WithExample example={ui.format.pattern.number.example}>{s('Number')}</WithExample>
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox name="pattern" value="PERCENT" onClick={ui.withFocusGrid(ui.format.pattern.percent.set)}>
        <WithExample example={ui.format.pattern.percent.example}>{s('Percent')}</WithExample>
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="SCIENTIFIC"
        onClick={ui.withFocusGrid(ui.format.pattern.scientific.set)}
      >
        <WithExample example={ui.format.pattern.scientific.example}>{s('Scientific')}</WithExample>
      </UI.MenuItemCheckbox>
      <UI.MenuSeparator />
      <UI.MenuItemCheckbox
        name="pattern"
        value="ACCOUNTING"
        onClick={ui.withFocusGrid(ui.format.pattern.accounting.set)}
      >
        <WithExample example={ui.format.pattern.accounting.example}>{s('Accounting')}</WithExample>
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox name="pattern" value="FINANCIAL" onClick={ui.withFocusGrid(ui.format.pattern.financial.set)}>
        <WithExample example={ui.format.pattern.financial.example}>{s('Financial')}</WithExample>
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="CURRENCY"
        onClick={ui.withFocusGrid(ui.format.pattern.currency.default.set)}
      >
        <WithExample example={ui.format.pattern.currency.default.example}>{s('Currency')}</WithExample>
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value="CURRENCY_ROUNDED"
        onClick={ui.withFocusGrid(ui.format.pattern.currency.defaultRounded.set)}
      >
        <WithExample example={ui.format.pattern.currency.defaultRounded.example}>{s('Currency rounded')}</WithExample>
      </UI.MenuItemCheckbox>
      <Ariakit.MenuProvider values={values} focusLoop>
        <UI.SubMenuButton leadingIndent>{s('More currency')}</UI.SubMenuButton>
        {currencyMounted && <CurrencySubMenu ui={ui} />}
      </Ariakit.MenuProvider>
      <UI.MenuSeparator />
      <UI.MenuItemCheckbox name="pattern" value="DATE" onClick={ui.withFocusGrid(ui.format.pattern.date.set)}>
        <WithExample example={ui.format.pattern.date.example}>{s('Date')}</WithExample>
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox name="pattern" value="LONG_DATE" onClick={ui.withFocusGrid(ui.format.pattern.longDate.set)}>
        <WithExample example={ui.format.pattern.longDate.example}>{s('Long date')}</WithExample>
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox name="pattern" value="TIME" onClick={ui.withFocusGrid(ui.format.pattern.time.set)}>
        <WithExample example={ui.format.pattern.time.example}>{s('Time')}</WithExample>
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox name="pattern" value="DATE_TIME" onClick={ui.withFocusGrid(ui.format.pattern.dateTime.set)}>
        <WithExample example={ui.format.pattern.dateTime.example}>{s('Date time')}</WithExample>
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox name="pattern" value="DURATION" onClick={ui.withFocusGrid(ui.format.pattern.duration.set)}>
        <WithExample example={ui.format.pattern.duration.example}>{s('Duration')}</WithExample>
      </UI.MenuItemCheckbox>
    </UI.Menu>
  )
}

type CurrencySubMenuProps = {
  ui: ProtonSheetsUIState
}

function CurrencySubMenu({ ui }: CurrencySubMenuProps) {
  const s = useStrings()
  return (
    <UI.SubMenu>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('USD')}
        onClick={ui.withFocusGrid(ui.format.pattern.currency.usd.set)}
      >
        {s('$ US Dollar')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('EUR')}
        onClick={ui.withFocusGrid(ui.format.pattern.currency.eur.set)}
      >
        {s('€ Euro')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('GBP')}
        onClick={ui.withFocusGrid(ui.format.pattern.currency.gbp.set)}
      >
        {s('£ Pound')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('JPY')}
        onClick={ui.withFocusGrid(ui.format.pattern.currency.jpy.set)}
      >
        {s('¥ Yen')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('CNY')}
        onClick={ui.withFocusGrid(ui.format.pattern.currency.cny.set)}
      >
        {s('CN¥ Chinese Yuan')}
      </UI.MenuItemCheckbox>
      <UI.MenuItemCheckbox
        name="pattern"
        value={getCurrencyItemValue('INR')}
        onClick={ui.withFocusGrid(ui.format.pattern.currency.inr.set)}
      >
        {s('₹ Rupee')}
      </UI.MenuItemCheckbox>
    </UI.SubMenu>
  )
}

function getCurrencyItemValue(name: string) {
  return CURRENCY === name ? 'CURRENCY' : name
}

type WithExampleProps = { children?: ReactNode; example: string }

function WithExample({ children, example }: WithExampleProps) {
  return (
    <span className="flex grow justify-between gap-4">
      <span className="grow">{children}</span>
      <span className="text-[#8F8D8A]">{example}</span>
    </span>
  )
}

function useStrings() {
  return useStringifier(() => ({
    General: c('sheets_2025:Spreadsheet editor more formats menu').t`General`,
    'Plain text': c('sheets_2025:Spreadsheet editor more formats menu').t`Plain text`,
    Number: c('sheets_2025:Spreadsheet editor more formats menu').t`Number`,
    Percent: c('sheets_2025:Spreadsheet editor more formats menu').t`Percent`,
    Scientific: c('sheets_2025:Spreadsheet editor more formats menu').t`Scientific`,
    Accounting: c('sheets_2025:Spreadsheet editor more formats menu').t`Accounting`,
    Financial: c('sheets_2025:Spreadsheet editor more formats menu').t`Financial`,
    Currency: c('sheets_2025:Spreadsheet editor more formats menu').t`Currency`,
    'Currency rounded': c('sheets_2025:Spreadsheet editor more formats menu').t`Currency rounded`,
    'More currency': c('sheets_2025:Spreadsheet editor more formats menu').t`More currency`,
    '$ US Dollar': c('sheets_2025:Spreadsheet editor more formats menu').t`$ US Dollar`,
    '€ Euro': c('sheets_2025:Spreadsheet editor more formats menu').t`€ Euro`,
    '£ Pound': c('sheets_2025:Spreadsheet editor more formats menu').t`£ Pound`,
    '¥ Yen': c('sheets_2025:Spreadsheet editor more formats menu').t`¥ Yen`,
    'CN¥ Chinese Yuan': c('sheets_2025:Spreadsheet editor more formats menu').t`CN¥ Chinese Yuan`,
    '₹ Rupee': c('sheets_2025:Spreadsheet editor more formats menu').t`₹ Rupee`,
    Date: c('sheets_2025:Spreadsheet editor more formats menu').t`Date`,
    'Long date': c('sheets_2025:Spreadsheet editor more formats menu').t`Long date`,
    Time: c('sheets_2025:Spreadsheet editor more formats menu').t`Time`,
    'Date time': c('sheets_2025:Spreadsheet editor more formats menu').t`Date time`,
    Duration: c('sheets_2025:Spreadsheet editor more formats menu').t`Duration`,
  }))
}
