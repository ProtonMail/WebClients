import { useCallback, useMemo, useState } from 'react'
import { MenuItem } from '@ariakit/react'
import tinycolor from 'tinycolor2'
import { useDocsMessages } from '../DocsDependenciesProvider'
import type { DocsMessages } from '../messages/DocsMessages'
import { accentColors, genShades } from './colorPalette'
import { Button } from './ui'

const Colors = {
  black: {
    name: (messages: DocsMessages) => messages.colorMenu.colorNames.black,
    base: '#0C0C14',
    intense: '#0C0C14',
  },
  gray: {
    name: (messages: DocsMessages) => messages.colorMenu.colorNames.gray,
    base: '#8F8D8A',
    intense: '#5C5958',
  },
  purple: {
    name: (messages: DocsMessages) => messages.colorMenu.colorNames.purple,
    base: accentColors.purple,
  },
  pink: {
    name: (messages: DocsMessages) => messages.colorMenu.colorNames.pink,
    base: accentColors.pink,
  },
  red: {
    name: (messages: DocsMessages) => messages.colorMenu.colorNames.red,
    base: '#DC3251',
    intense: '#B02841',
  },
  carrot: {
    name: (messages: DocsMessages) => messages.colorMenu.colorNames.carrot,
    base: accentColors.carrot,
  },
  slateblue: {
    name: (messages: DocsMessages) => messages.colorMenu.colorNames.slateblue,
    base: accentColors.slateblue,
    intense: genShades(accentColors.enzian).intense,
  },
  pacific: {
    name: (messages: DocsMessages) => messages.colorMenu.colorNames.pacific,
    base: accentColors.pacific,
  },
  reef: {
    name: (messages: DocsMessages) => messages.colorMenu.colorNames.reef,
    base: accentColors.reef,
  },
  olive: {
    name: (messages: DocsMessages) => messages.colorMenu.colorNames.olive,
    base: accentColors.olive,
  },
}

const ColorsWithShades = Object.values(Colors).map((value) => {
  const { base, intense, lowOpacity } = genShades(value.base)

  return {
    name: value.name,
    base,
    intense: 'intense' in value ? value.intense : intense,
    lowOpacity,
  }
})

const White = 'rgba(255, 255, 255, 1)'

type ColorCombination = {
  background: string | null
  marker: string | null
  text: string | null
}

type ColorPreview = Pick<ColorCombination, 'background' | 'text'>

type ColorProps = {
  color: ColorCombination
  currentColor: ColorPreview
  label: string
  onSelect: (color: ColorCombination) => void
  setPreviewColor: (color: ColorPreview) => void
  resetPreviewColor: () => void
  name: string
  type: 'text' | 'highlight' | 'background'
}

// Stored styles keep whatever CSS notation wrote them (pasted or imported text often uses hex),
// so compare the parsed colors rather than the strings. tinycolor parses invalid strings as black, hence the
// isValid checks.
function isSameColor(first: string | null, second: string | null) {
  if (!first || !second) {
    return !first && !second
  }
  const firstColor = tinycolor(first)
  const secondColor = tinycolor(second)
  return firstColor.isValid() && secondColor.isValid() && firstColor.toRgbString() === secondColor.toRgbString()
}

function Color({
  color,
  currentColor,
  label,
  onSelect,
  setPreviewColor,
  resetPreviewColor,
  name,
  type,
}: ColorProps) {
  const isCurrent =
    isSameColor(color.text, currentColor.text) && isSameColor(color.background, currentColor.background)

  return (
    <MenuItem
      render={<button type="button" aria-label={label} />}
      role="menuitemradio"
      aria-checked={isCurrent}
      className="border-weak relative flex h-6 w-6 items-center justify-center rounded border text-xs font-semibold outline-1 hover:outline hover:outline-[#000] focus-visible:outline focus-visible:outline-[#000]"
      style={{
        backgroundColor: color.background,
        color: color.text,
      }}
      aria-label={label}
      onPointerEnter={() => {
        setPreviewColor(color)
      }}
      onPointerLeave={() => {
        resetPreviewColor()
      }}
      onClick={() => {
        onSelect(color)
      }}
      data-testid={`${name}-${type}-color`}
    >
      <div aria-hidden="true">A</div>
    </MenuItem>
  )
}

export type FontColorMenuProps = {
  currentTextColor: string | null
  onTextColorChange: (color: string | null) => void
  currentBackgroundColor: string | null
  onBackgroundColorChange: (color: string | null) => void
  onMarkerColorChange?: (color: string | null) => void
}

export function FontColorMenu({
  currentTextColor,
  onTextColorChange,
  currentBackgroundColor,
  onBackgroundColorChange,
  onMarkerColorChange,
}: FontColorMenuProps) {
  const messages = useDocsMessages()
  const { colorMenu } = messages
  const defaultPreviewColor = useMemo<ColorPreview>(
    () => ({
      background: currentBackgroundColor,
      text: currentTextColor,
    }),
    [currentBackgroundColor, currentTextColor],
  )

  const [previewColor, setPreviewColor] = useState(defaultPreviewColor)
  const resetPreviewColor = useCallback(() => {
    setPreviewColor(defaultPreviewColor)
  }, [defaultPreviewColor])

  const selectColor = useCallback(
    (color: ColorCombination) => {
      onBackgroundColorChange(color.background)
      onTextColorChange(color.text)
      onMarkerColorChange?.(color.marker)
    },
    [onBackgroundColorChange, onMarkerColorChange, onTextColorChange],
  )

  const clearColor = useCallback(() => {
    onBackgroundColorChange(null)
    onTextColorChange(null)
    onMarkerColorChange?.(null)
  }, [onBackgroundColorChange, onMarkerColorChange, onTextColorChange])

  return (
    <div className="space-y-2 px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        <div
          className="text-sm"
          style={{
            backgroundColor: previewColor.background,
            color: previewColor.text,
          }}
        >
          {colorMenu.textAndHighlightColor}
        </div>
        <MenuItem render={<Button shape="solid" size="small" className="rounded text-xs" />} onClick={clearColor}>
          Clear
        </MenuItem>
      </div>
      <div className="flex items-center gap-2">
        {ColorsWithShades.map((color) => {
          const name = color.name(messages)
          return (
            <Color
              key={name}
              name={name}
              type="text"
              currentColor={defaultPreviewColor}
              color={{
                background: null,
                marker: color.base,
                text: color.base,
              }}
              label={colorMenu.textColorWithNoBackground(name)}
              onSelect={selectColor}
              setPreviewColor={setPreviewColor}
              resetPreviewColor={resetPreviewColor}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        {ColorsWithShades.map((color) => {
          const name = color.name(messages)
          return (
            <Color
              key={name}
              name={name}
              type="highlight"
              currentColor={defaultPreviewColor}
              color={{
                background: color.lowOpacity,
                marker: color.intense,
                text: color.intense,
              }}
              label={colorMenu.textColorAndHighlight(name)}
              onSelect={selectColor}
              setPreviewColor={setPreviewColor}
              resetPreviewColor={resetPreviewColor}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        {ColorsWithShades.map((color) => {
          const name = color.name(messages)
          return (
            <Color
              key={name}
              name={name}
              type="background"
              currentColor={defaultPreviewColor}
              color={{
                background: color.base,
                marker: color.base,
                text: White,
              }}
              label={colorMenu.backgroundColorAndWhiteTextColor(name)}
              onSelect={selectColor}
              setPreviewColor={setPreviewColor}
              resetPreviewColor={resetPreviewColor}
            />
          )
        })}
      </div>
    </div>
  )
}

export const colorMenuMessages = {
  colorMenu: {
    textAndHighlightColor: 'Text and highlight color',
    textColorWithNoBackground: (name: string) => `${name} text color with no background`,
    textColorAndHighlight: (name: string) => `${name} text color and highlight`,
    backgroundColorAndWhiteTextColor: (name: string) => `${name} background color and white text color`,
    colorNames: {
      black: 'black',
      gray: 'gray',
      purple: 'purple',
      pink: 'pink',
      red: 'red',
      carrot: 'carrot',
      slateblue: 'slateblue',
      pacific: 'pacific',
      reef: 'reef',
      olive: 'olive',
    },
  },
}
