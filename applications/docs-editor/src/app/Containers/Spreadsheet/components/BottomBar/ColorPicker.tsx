import * as Ariakit from '@ariakit/react'
import { c } from 'ttag'
import { Icon } from '../ui'

interface ColorPickerProps {
  sheetId: number
  currentColor?: string | null
  onChangeSheetTabColor: (sheetId: number, color: any) => void
  onClose: () => void
}

const THEME_COLORS = [
  // Row 1 - Base colors
  ['#FFFFFF', '#000000', '#E7E6E6', '#44546A', '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'],
  // Row 2 - Tint 80%
  ['#F2F2F2', '#7F7F7F', '#D0CECE', '#D6DCE4', '#D9E1F2', '#FCE4D6', '#EDEDED', '#FFF2CC', '#DEEBF6', '#E2EFDA'],
  // Row 3 - Tint 60%
  ['#D8D8D8', '#595959', '#AEABAB', '#ADB9CA', '#B3C6E7', '#F8CBAD', '#DBDBDB', '#FFE599', '#BDD7EE', '#C6E0B4'],
  // Row 4 - Tint 40%
  ['#BFBFBF', '#3F3F3F', '#8C8989', '#8496B0', '#8CAAE6', '#F4B083', '#C9C9C9', '#FFD966', '#9BC2E6', '#A9D08E'],
  // Row 5 - Shade 25%
  ['#A5A5A5', '#262626', '#6B6868', '#323B4C', '#2F5496', '#C65911', '#7B7B7B', '#BF8F00', '#2F75B5', '#538135'],
  // Row 6 - Shade 50%
  ['#7F7F7F', '#0C0C0C', '#494848', '#222A35', '#1F3864', '#833C0C', '#525252', '#7F6000', '#1F4E78', '#375623'],
]

const STANDARD_COLORS = [
  '#C00000', // Dark Red
  '#FF0000', // Red
  '#FFC000', // Orange
  '#FFFF00', // Yellow
  '#92D050', // Light Green
  '#00B050', // Green
  '#00B0F0', // Light Blue
  '#0070C0', // Blue
  '#002060', // Dark Blue
  '#7030A0', // Purple
]

const ColorCircle = ({
  color,
  onClick,
  selected = false,
  ...props
}: {
  color: string | null
  onClick: () => void
  selected?: boolean
  [key: string]: any
}) => (
  <Ariakit.CompositeItem
    onClick={onClick}
    className={`border-gray-300 hover:border-gray-400 relative h-6 w-6 cursor-pointer rounded-full border transition-all duration-150 hover:scale-110 focus:outline-none ${
      selected
        ? 'ring-black focus:ring-black ring-2 ring-offset-2 focus:ring-2 focus:ring-offset-2'
        : 'focus:ring-blue-500 focus:ring-2 focus:ring-offset-2'
    }`}
    style={{ backgroundColor: color || 'transparent' }}
    aria-checked={selected}
    {...props}
  >
    {!color && (
      <span className="absolute inset-0 flex items-center justify-center">
        <Icon legacyName="circle-slash" className="text-gray-500 h-4 w-4" />
      </span>
    )}
  </Ariakit.CompositeItem>
)

export function ColorPicker({ sheetId, currentColor, onChangeSheetTabColor, onClose }: ColorPickerProps) {
  const handleColorSelect = (color: string | null) => {
    onChangeSheetTabColor(sheetId, color)
    onClose()
  }

  return (
    <Ariakit.CompositeProvider>
      <Ariakit.Composite className="w-[320px] p-4">
        {/* Reset button - rowId "reset" for linear navigation */}
        <Ariakit.CompositeItem
          onClick={() => handleColorSelect(null)}
          autoFocus
          rowId="reset"
          className={`border-gray-300 hover:bg-gray-50 hover:border-gray-400 mb-4 w-full cursor-pointer rounded-md border px-4 py-2 text-sm font-medium transition-all duration-150 ease-out focus:outline-none ${
            currentColor === null
              ? 'ring-black focus:ring-black ring-2 ring-offset-2 focus:ring-2 focus:ring-offset-2'
              : 'focus:ring-blue-500 focus:ring-2 focus:ring-offset-2'
          } `}
        >
          {c('sheets_2025:Color picker').t`Reset`}
        </Ariakit.CompositeItem>

        {/* Theme colors section */}
        <div className="mb-4">
          <div className="text-gray-600 mb-2 text-xs font-medium">
            {c('sheets_2025:Color picker').t`Theme colors (Office)`}
          </div>
          <div className="grid grid-cols-10 gap-1" aria-label="Theme colors">
            {THEME_COLORS.map((row, rowIndex) =>
              row.map((color, colIndex) => (
                <ColorCircle
                  key={`theme-${rowIndex}-${colIndex}`}
                  color={color}
                  selected={currentColor === color}
                  onClick={() => handleColorSelect(color)}
                  aria-label={`Theme color ${color}`}
                  rowId={`theme-${rowIndex}`}
                />
              )),
            )}
          </div>
        </div>

        {/* Standard colors section */}
        <div className="mb-4">
          <div className="text-gray-600 mb-2 text-xs font-medium">
            {c('sheets_2025:Color picker').t`Standard colors`}
          </div>
          <div className="grid grid-cols-10 gap-1" aria-label="Standard colors">
            {STANDARD_COLORS.map((color, index) => (
              <ColorCircle
                key={`standard-${index}`}
                color={color}
                selected={currentColor === color}
                onClick={() => handleColorSelect(color)}
                aria-label={`Standard color ${color}`}
                rowId="standard"
              />
            ))}
          </div>
        </div>

        {/* Recent colors section */}
        <div className="mb-4">
          <div className="text-gray-600 mb-2 text-xs font-medium">{c('sheets_2025:Color picker').t`Recent colors`}</div>
          <div className="text-gray-400 text-xs">{c('sheets_2025:Color picker').t`No recent colors`}</div>
        </div>

        {/* Bottom tools */}
        <div className="flex gap-2 border-t pt-2">
          <Ariakit.CompositeItem
            className="hover:bg-gray-100 focus:ring-blue-500 cursor-pointer rounded p-2 transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label={c('sheets_2025:Color picker').t`Add custom color`}
            rowId="tools"
          >
            <Icon legacyName="plus-circle" className="h-4 w-4" />
          </Ariakit.CompositeItem>
          <Ariakit.CompositeItem
            className="hover:bg-gray-100 focus:ring-blue-500 cursor-pointer rounded p-2 transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label={c('sheets_2025:Color picker').t`Color picker tool`}
            rowId="tools"
          >
            <Icon legacyName="palette" className="h-4 w-4" />
          </Ariakit.CompositeItem>
        </div>
      </Ariakit.Composite>
    </Ariakit.CompositeProvider>
  )
}
