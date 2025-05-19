import { c } from 'ttag'
import { ACCENT_COLORS_MAP } from '@proton/shared/lib/colors'
import tinycolor from 'tinycolor2'
import genAccentColorShades from '@proton/colors/gen-accent-shades'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '@proton/atoms'

const Colors = {
  black: {
    name: () => c('color').t`black`,
    base: '#0C0C14',
    intense: '#0C0C14',
  },
  gray: {
    name: () => c('color').t`gray`,
    base: '#8F8D8A',
    intense: '#5C5958',
  },
  purple: {
    name: ACCENT_COLORS_MAP.purple.getName,
    base: ACCENT_COLORS_MAP.purple.color,
  },
  pink: {
    name: ACCENT_COLORS_MAP.pink.getName,
    base: ACCENT_COLORS_MAP.pink.color,
  },
  red: {
    name: () => c('color').t`red`,
    base: '#DC3251',
    intense: '#B02841',
  },
  carrot: {
    name: ACCENT_COLORS_MAP.carrot.getName,
    base: ACCENT_COLORS_MAP.carrot.color,
  },
  slateblue: {
    name: ACCENT_COLORS_MAP.slateblue.getName,
    base: ACCENT_COLORS_MAP.slateblue.color,
    intense: genAccentColorShades(tinycolor(ACCENT_COLORS_MAP.enzian.color))[2].toRgbString(),
  },
  pacific: {
    name: ACCENT_COLORS_MAP.pacific.getName,
    base: ACCENT_COLORS_MAP.pacific.color,
  },
  reef: {
    name: ACCENT_COLORS_MAP.reef.getName,
    base: ACCENT_COLORS_MAP.reef.color,
  },
  olive: {
    name: ACCENT_COLORS_MAP.olive.getName,
    base: ACCENT_COLORS_MAP.olive.color,
  },
}

const ColorsWithShades = Object.entries(Colors).map(([key, value]) => {
  const [base, _, intense] = genAccentColorShades(tinycolor(value.base))

  return {
    name: value.name,
    base: base.toRgbString(),
    intense: 'intense' in value ? value.intense : intense.toRgbString(),
    lowOpacity: base.setAlpha(0.15).toRgbString(),
  }
})

const White = 'rgba(255, 255, 255, 1)'

type ColorCombination = {
  background: string | null
  text: string | null
}

function Color({
  color,
  label,
  onSelect,
  setPreviewColor,
  resetPreviewColor,
  name,
  type,
}: {
  color: ColorCombination
  label: string
  onSelect: (color: ColorCombination) => void
  setPreviewColor: (color: ColorCombination) => void
  resetPreviewColor: () => void
  name: string
  type: 'text' | 'highlight' | 'background'
}) {
  return (
    <button
      className="border-weak relative flex h-6 w-6 items-center justify-center rounded border text-xs font-semibold outline-1 hover:outline hover:outline-[#000]"
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
    </button>
  )
}

export function FontColorMenu({
  currentTextColor,
  onTextColorChange,
  currentBackgroundColor,
  onBackgroundColorChange,
}: {
  currentTextColor: string | null
  onTextColorChange: (color: string | null) => void
  currentBackgroundColor: string | null
  onBackgroundColorChange: (color: string | null) => void
}) {
  const defaultPreviewColor = useMemo(
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
    },
    [onBackgroundColorChange, onTextColorChange],
  )

  const clearColor = useCallback(() => {
    onBackgroundColorChange(null)
    onTextColorChange(null)
  }, [onBackgroundColorChange, onTextColorChange])

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
          {c('Label').t`Text and highlight color`}
        </div>
        <Button shape="solid" size="small" className="rounded text-xs" onClick={clearColor}>
          Clear
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {ColorsWithShades.map((color) => {
          const name = color.name()
          return (
            <Color
              key={name}
              name={name}
              type="text"
              color={{
                background: null,
                text: color.base,
              }}
              label={c('Label').t`${name} text color with no background`}
              onSelect={selectColor}
              setPreviewColor={setPreviewColor}
              resetPreviewColor={resetPreviewColor}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        {ColorsWithShades.map((color) => {
          const name = color.name()
          return (
            <Color
              key={name}
              name={name}
              type="highlight"
              color={{
                background: color.lowOpacity,
                text: color.intense,
              }}
              label={c('Label').t`${name} text color and highlight`}
              onSelect={selectColor}
              setPreviewColor={setPreviewColor}
              resetPreviewColor={resetPreviewColor}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        {ColorsWithShades.map((color) => {
          const name = color.name()
          return (
            <Color
              key={name}
              name={name}
              type="background"
              color={{
                background: color.base,
                text: White,
              }}
              label={c('Label').t`${name} background color and white text color`}
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
