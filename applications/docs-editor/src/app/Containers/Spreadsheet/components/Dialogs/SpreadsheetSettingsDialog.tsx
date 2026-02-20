import * as Ariakit from '@ariakit/react'
import clsx from '@proton/utils/clsx'
import { type ComponentProps, useMemo } from 'react'
import { c } from 'ttag'
import { createComponent } from '../utils'
import { SelectFallbackLabel, SelectPopover } from '../Sidebar/shared'
import { Icon } from '../ui'
import { getLocaleRegionLabel, LOCALE_BROWSER_LIST, LOCALE_SUPPORTED_LIST } from '../../locale'
import { useUI } from '../../ui-store'
import { createStringifier } from '../../stringifier'

const { s } = createStringifier(strings)

const REST_LOCALES = LOCALE_SUPPORTED_LIST.filter((locale) => !LOCALE_BROWSER_LIST.includes(locale))

const FormGroup = createComponent(function (props: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={clsx(
        'flex min-w-0 flex-col items-start gap-3 border-b border-[#D1CFCD] py-3 last:border-0',
        props.className,
      )}
    />
  )
})

const SelectGroup = createComponent(function (props: Ariakit.SelectGroupProps) {
  return <Ariakit.SelectGroup {...props} className={clsx('border-b border-[#D1CFCD] last:border-0', props.className)} />
})

const FormLabel = createComponent(function (props: Ariakit.RoleProps<'label'>) {
  return <Ariakit.Role.label {...props} className={clsx('text-sm font-semibold', props.className)} />
})

const FormDescription = createComponent(function (props: ComponentProps<'p'>) {
  return <p {...props} className={clsx('text-sm text-[#8F8D8A]', props.className)} />
})

export const Select = createComponent(function ({ children, ...props }: Ariakit.SelectProps) {
  return (
    <Ariakit.Select
      {...props}
      className={clsx(
        'flex h-[36px] min-w-0 items-center gap-2 rounded-lg border border-[#EAE7E4] pl-3 text-left text-sm !outline-none',
        'transition focus-visible:border-[#6D4AFF] focus-visible:ring-[3px] focus-visible:ring-[#6D4AFF33]',
        props.className,
      )}
    >
      {children ?? <SelectFallbackLabel />}
      <span className="pointer-events-none ml-auto flex shrink-0 items-center pr-2">
        <Icon className="shrink-0" legacyName="chevron-down-filled" />
      </span>
    </Ariakit.Select>
  )
})

export const SelectItem = createComponent(function SelectItem(props: Ariakit.SelectItemProps) {
  return (
    <Ariakit.SelectItem
      {...props}
      className={clsx(
        'flex h-[36px] cursor-pointer items-center gap-2 px-4 text-sm text-[#281D1B] !outline-none data-[active-item]:bg-[black]/5',
        props.className,
      )}
    />
  )
})

export function SpreadsheetSettingsDialog() {
  const store = useUI((ui) => ui.view.spreadsheetSettingsDialog.store)

  const localeAuto = useUI((ui) => ui.locale.auto)
  const accountLocale = useUI((ui) => ui.locale.account)
  const restLocalesWithLabels = useMemo(
    () =>
      REST_LOCALES.map((locale) => ({
        value: locale,
        label: getLocaleRegionLabel(locale, accountLocale),
      })).sort((a, b) => a.label.localeCompare(b.label)),
    [accountLocale],
  )
  const value = useUI((ui) => ui.locale.value ?? 'auto')
  const setLocale = useUI.$.locale.set

  return (
    <Ariakit.DialogProvider store={store}>
      <Ariakit.Dialog
        portal={false}
        backdrop={false}
        modal={false}
        unmountOnHide
        className={clsx(
          'fixed inset-4 z-10 m-auto h-fit w-full max-w-[32rem] bg-[white]',
          'rounded-xl p-6',
          'border border-[#D1CFCD] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)] outline-none',
        )}
      >
        <div className="flex flex-col gap-3">
          <div>
            <Ariakit.DialogHeading className="text-lg font-bold">
              {s('Settings for this spreadsheet')}
            </Ariakit.DialogHeading>
          </div>

          <div>
            <FormGroup>
              <FormLabel htmlFor="locale">{s('Locale')}</FormLabel>
              <Ariakit.SelectProvider
                value={value}
                setValue={(value) => setLocale(value === 'auto' ? undefined : value)}
              >
                <Select id="locale" />
                <SelectPopover>
                  <SelectGroup>
                    <SelectItem value="auto">
                      {s('Auto')} ({getLocaleRegionLabel(localeAuto, accountLocale)})
                    </SelectItem>
                    {LOCALE_BROWSER_LIST.length > 0
                      ? LOCALE_BROWSER_LIST.map((locale) => (
                          <SelectItem key={locale} value={locale}>
                            {getLocaleRegionLabel(locale, accountLocale)}
                          </SelectItem>
                        ))
                      : null}
                  </SelectGroup>

                  <SelectGroup>
                    {restLocalesWithLabels.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectPopover>
              </Ariakit.SelectProvider>
              <FormDescription>
                {s('This affects formatting details such as functions, dates and currency')}
              </FormDescription>
            </FormGroup>
          </div>
        </div>
      </Ariakit.Dialog>
    </Ariakit.DialogProvider>
  )
}

function strings() {
  return {
    'Settings for this spreadsheet': c('sheets_2025:Spreadsheet editor spreadsheet settings dialog')
      .t`Settings for this spreadsheet`,
    'This affects formatting details such as functions, dates and currency': c(
      'sheets_2025:Spreadsheet editor spreadsheet settings dialog',
    ).t`This affects formatting details such as functions, dates and currency`,
    Locale: c('sheets_2025:Spreadsheet editor spreadsheet settings dialog').t`Locale`,
    // translator: This is the "automatic" option in the locale selection input, and is followed by the locale that will be applied if selected, e.g. "Auto (American English)"
    Auto: c('sheets_2025:Spreadsheet editor spreadsheet settings dialog').t`Auto`,
    Cancel: c('sheets_2025:Spreadsheet editor spreadsheet settings dialog').t`Cancel`,
    'Save and reload': c('sheets_2025:Spreadsheet editor spreadsheet settings dialog').t`Save and reload`,
  }
}
