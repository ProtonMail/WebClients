import * as Ariakit from '@ariakit/react'
import { createComponent } from '../utils'
import * as UI from '../ui'
import * as Atoms from '../atoms'
import clsx from '@proton/utils/clsx'
import { BORDER_LINE_STYLES, BORDER_LOCATIONS, type BorderLocation } from '../Sidebar/borderData'
import {
  getStringifiedColor,
  type Borders,
  type BorderStyle,
  type Color,
  type ColorSelector,
  type SpreadsheetTheme,
} from '@rowsncolumns/spreadsheet'
import { MdLineStyle } from '@rowsncolumns/icons'
import { useCallback, useState, type ComponentProps } from 'react'
import chunk from 'lodash/chunk'
import { Button } from '../Sidebar/shared'
import { Icon } from '../ui'
import * as Icons from '../icons'
import { ColorPicker } from './ColorPicker'

const BORDER_LOCATION_COLUMN_COUNT = 5
const BORDER_LOCATION_ROWS = chunk(BORDER_LOCATIONS, BORDER_LOCATION_COLUMN_COUNT)

interface BorderLocationButtonProps extends Ariakit.CompositeItemProps {
  title: string
  tooltipPlacement?: Ariakit.TooltipProviderProps['placement']
}

const BorderLocationButton = createComponent(function BorderLocationButton({
  title,
  tooltipPlacement,
  className,
  ...props
}: BorderLocationButtonProps) {
  return (
    <Ariakit.TooltipProvider placement={tooltipPlacement ?? 'bottom'}>
      <Ariakit.TooltipAnchor
        render={<Ariakit.CompositeItem {...props} />}
        className={clsx(
          'flex size-8 items-center justify-center rounded-lg',
          'border border-[transparent]',
          'focus-visible:border-[#6D4AFF] focus-visible:ring-[3px] focus-visible:ring-[#6D4AFF33]',
          className,
        )}
      />
      <UI.Tooltip>{title}</UI.Tooltip>
    </Ariakit.TooltipProvider>
  )
})

const SubmenuButton = createComponent(function SubmenuButton(props: Ariakit.ButtonProps) {
  return (
    <Button {...props} className={clsx('flex gap-0.5 rounded-lg px-1 py-1', props.className)}>
      {props.children}
      <Icon className="shrink-0" legacyName="chevron-down-filled" />
    </Button>
  )
})

interface BorderLineStyleButtonProps extends Omit<Ariakit.ButtonProps, 'title'> {
  title: string
}

const BorderLineStyleButton = createComponent(function BorderLineStyleButton({
  title,
  className,
  ...props
}: BorderLineStyleButtonProps) {
  return (
    <Ariakit.TooltipProvider placement="left">
      <Ariakit.TooltipAnchor
        render={<Button {...props} />}
        className={clsx(
          'flex h-[20px] items-center justify-center rounded px-2.5 data-[active-item]:bg-[#C2C0BE59]',
          className,
        )}
      />
      <UI.Tooltip>{title}</UI.Tooltip>
    </Ariakit.TooltipProvider>
  )
})

type BorderSelectorProps = {
  isDarkMode?: boolean
  disabledBorderLocations?: BorderLocation[]
  onChange?(location: BorderLocation, color: Color | undefined, style: BorderStyle | undefined): void
  borders?: Borders | null
  theme: SpreadsheetTheme
} & Pick<ComponentProps<typeof ColorSelector>, 'userDefinedColors' | 'onAddUserDefinedColor'>

export function BorderSelectorContent({
  isDarkMode,
  theme,
  onChange,
  userDefinedColors,
  onAddUserDefinedColor,
  disabledBorderLocations,
}: BorderSelectorProps) {
  const [color, setColorState] = useState<Color | undefined>(undefined)
  const [style, setStyleState] = useState<BorderStyle>('solid')
  const [borderLocation, setBorderLocationState] = useState<BorderLocation>()
  const getDefaultBorderColor = useCallback(() => {
    return { theme: 1, tint: isDarkMode ? 1 : 0 } as Color
  }, [isDarkMode])

  const colorString = getStringifiedColor(color, theme)

  const setColor = useCallback(
    (col: Color | undefined) => {
      setColorState(col)

      // Upstream change
      if (borderLocation) {
        onChange?.(borderLocation, col ?? getDefaultBorderColor(), style)
      }
    },
    [getDefaultBorderColor, borderLocation, style, onChange],
  )

  const setStyle = useCallback(
    (styl: BorderStyle) => {
      setStyleState(styl)

      // Upstream change
      if (borderLocation) {
        onChange?.(borderLocation, color ?? getDefaultBorderColor(), styl)
      }
    },
    [getDefaultBorderColor, color, borderLocation, onChange],
  )

  const setBorderLocation = useCallback(
    (location: BorderLocation | undefined) => {
      setBorderLocationState(location)

      // Upstream change
      if (location) {
        onChange?.(location, color ?? getDefaultBorderColor(), style)
      }
    },
    [getDefaultBorderColor, color, style, onChange],
  )

  // Remove all borders
  const clearBorder = () => {
    // Remove border location
    setBorderLocationState(undefined)

    // Upstream
    onChange?.('all', undefined, undefined)
  }

  return (
    <div className="flex items-center">
      <Ariakit.CompositeProvider focusShift focusWrap focusLoop>
        <Ariakit.Composite>
          {BORDER_LOCATION_ROWS.map((row, rowIndex) => {
            const isFirstRow = rowIndex === 0

            return (
              <Ariakit.CompositeRow key={rowIndex} className="flex *:shrink-0">
                {row.map(({ location, icon, title }) => {
                  return (
                    <BorderLocationButton
                      // If the button is in the first row, we want the tooltip to appear on top, otherwise on bottom
                      // This is to prevent the tooltip from the first from covering the buttons below and vice versa
                      disabled={Boolean(location && disabledBorderLocations?.includes(location))}
                      tooltipPlacement={isFirstRow ? 'top' : 'bottom'}
                      title={title}
                      key={location}
                      onClick={() => {
                        if (location) {
                          setBorderLocation(location)
                        } else {
                          clearBorder()
                        }
                      }}
                    >
                      {icon}
                    </BorderLocationButton>
                  )
                })}
              </Ariakit.CompositeRow>
            )
          })}
        </Ariakit.Composite>
      </Ariakit.CompositeProvider>

      <div className="mx-4 w-px shrink-0 self-stretch bg-[#D1CFCD]" />

      <div className="flex flex-col gap-2">
        <Ariakit.PopoverProvider>
          <Ariakit.PopoverDisclosure render={<SubmenuButton />} style={{ '--selected-color': colorString }}>
            <Icon data={Icons.pencilColor} />
          </Ariakit.PopoverDisclosure>

          <Atoms.DropdownPopover
            {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
            className="p-2"
            render={<Ariakit.Popover unmountOnHide />}
          >
            <ColorPicker selectedColor={color ?? getDefaultBorderColor()} onChange={setColor} />
          </Atoms.DropdownPopover>
        </Ariakit.PopoverProvider>

        <Ariakit.PopoverProvider>
          <Ariakit.PopoverDisclosure render={<SubmenuButton />}>
            <MdLineStyle />
          </Ariakit.PopoverDisclosure>

          <Atoms.DropdownPopover
            {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
            className="p-2"
            render={<Ariakit.Popover unmountOnHide />}
          >
            {BORDER_LINE_STYLES.map(({ icon, style, title }) => {
              return (
                <BorderLineStyleButton
                  key={style}
                  title={title}
                  onClick={() => {
                    setStyle(style)
                  }}
                >
                  {icon}
                </BorderLineStyleButton>
              )
            })}
          </Atoms.DropdownPopover>
        </Ariakit.PopoverProvider>
      </div>
    </div>
  )
}
