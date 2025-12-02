import { Button } from '@proton/atoms/Button/Button'
import clsx from '@proton/utils/clsx'
import type { ComponentPropsWithoutRef, ForwardedRef } from 'react'
import { forwardRef } from 'react'
import type { Color, ColorIndex } from '@rowsncolumns/spreadsheet'
import {
  colorKeys,
  colorTintsToDisplay,
  createColorShades,
  getStringifiedColor,
  STANDARD_COLORS,
} from '@rowsncolumns/spreadsheet'
import { HexColorPicker, EyeDropper } from '@rowsncolumns/ui'
import * as Ariakit from '@ariakit/react'
import { useUI } from '../../ui-store'
import { createStringifier } from '../../stringifier'
import { c } from 'ttag'

const { s } = createStringifier(strings)

export interface ColorSwatchProps extends Ariakit.ButtonProps {
  color: string
  isSelected: boolean
}
export const ColorSwatch = forwardRef(function ColorSwatch(
  { color, isSelected, ...props }: ColorSwatchProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <Ariakit.Button
      ref={ref}
      {...props}
      style={{ backgroundColor: color }}
      className={clsx(
        'relative h-4 w-4 rounded-full border border-[--border-weak]',
        isSelected &&
          'after:absolute after:left-1/2 after:top-1/2 after:h-5 after:w-5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border after:border-[--text-norm] after:bg-[transparent]',
      )}
    />
  )
})

export interface ColorPickerProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
  selectedColor: Color | undefined
  onChange: (color: Color | undefined) => void
}
export const ColorPicker = forwardRef(function ColorPicker(
  { className, selectedColor, onChange, ...props }: ColorPickerProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const theme = useUI((ui) => ui.legacy.theme)
  const colorString = getStringifiedColor(selectedColor, theme)?.toLowerCase()
  const themeColors = [...colorKeys.values()].slice(0, -1).map((value) => theme.themeColors[value]?.toLowerCase())

  const userDefinedColors = useUI((ui) => ui.legacy.userDefinedColors)
  const onAddUserDefinedColor = useUI.$.legacy.onAddUserDefinedColor

  return (
    <div ref={ref} {...props} className={clsx('flex flex-col gap-2', className)}>
      <Button className="w-full px-4 py-2 text-xs" size="small" onClick={() => onChange(undefined)}>
        {s('Reset')}
      </Button>
      <div className="py-1 text-xs text-[--text-weak]">
        {/* {c('sheets_2025:Color picker').t`Theme colors (${theme.name})`} */}
        {c('sheets_2025:Color picker').t`Theme colors`}
      </div>
      <div className="flex items-center gap-2">
        {themeColors.map((color) => (
          <ColorSwatch
            key={color}
            color={color}
            onClick={() =>
              onChange({
                theme: themeColors.indexOf(color) as ColorIndex,
              })
            }
            isSelected={colorString === color}
          />
        ))}
      </div>
      <div className="flex gap-2">
        {colorTintsToDisplay.map((tints, tintIndex) => {
          const colors = createColorShades(themeColors[tintIndex], tints)
          return (
            <div key={tintIndex} className="flex flex-col gap-2">
              {colors.map((color) => (
                <ColorSwatch
                  key={color}
                  color={color}
                  onClick={() => onChange({ theme: tintIndex as ColorIndex, tint: tints[colors.indexOf(color)] })}
                  isSelected={colorString === color}
                />
              ))}
            </div>
          )
        })}
      </div>
      <div className="py-1 text-xs text-[--text-weak]">{s('Standard colors')}</div>
      <div className="flex items-center gap-2">
        {STANDARD_COLORS.map((color) => {
          const lowerCaseColor = color.toLowerCase()
          return (
            <ColorSwatch
              key={lowerCaseColor}
              color={lowerCaseColor}
              onClick={() => onChange(lowerCaseColor)}
              isSelected={colorString === lowerCaseColor}
            />
          )
        })}
      </div>
      <div className="py-1 text-xs text-[--text-weak]">{s('Recent colors')}</div>
      <div className="grid grid-cols-[repeat(10,1rem)] items-center gap-2">
        {userDefinedColors.map((color) => {
          const lowerCaseColor = color.toLowerCase()
          return (
            <ColorSwatch
              key={lowerCaseColor}
              color={lowerCaseColor}
              onClick={() => onChange(lowerCaseColor)}
              isSelected={colorString === lowerCaseColor}
            />
          )
        })}
        <HexColorPicker
          value={colorString}
          onChange={(color) => {
            onChange(color)
            onAddUserDefinedColor(color)
          }}
        />
        <EyeDropper
          value={colorString}
          onChange={(color) => {
            onChange(color)
            onAddUserDefinedColor(color)
          }}
        />
      </div>
    </div>
  )
})

function strings() {
  return {
    Reset: c('sheets_2025:Color picker').t`Reset`,
    'Standard colors': c('sheets_2025:Color picker').t`Standard colors`,
    'Recent colors': c('sheets_2025:Color picker').t`Recent colors`,
  }
}
