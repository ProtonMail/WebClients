import { c } from 'ttag'
import clsx from '@proton/utils/clsx'

export function FontColorMenu({
  currentTextColor,
  textColors,
  onTextColorChange,
  currentBackgroundColor,
  backgroundColors,
  onBackgroundColorChange,
}: {
  currentTextColor?: string
  textColors: [() => string, string][]
  onTextColorChange: (color: string) => void
  currentBackgroundColor?: string
  backgroundColors: [() => string, string | null][]
  onBackgroundColorChange: (color: string | null) => void
}) {
  return (
    <div
      className="flex-column max-w-custom flex gap-4 px-4 py-3 text-sm leading-none"
      style={{
        '--max-w-custom': '15rem',
      }}
    >
      <div>{c('Label').t`Text colour`}</div>
      <div className="flex items-center gap-3">
        {textColors.map(([name, color]) => (
          <button
            className={clsx(
              'border-weak flex h-8 w-8 items-center justify-center rounded-full border text-base hover:brightness-75',
              color === currentTextColor && 'outline outline-1 outline-offset-2 outline-[#000]',
            )}
            style={{
              color: color,
            }}
            onClick={() => onTextColorChange(color)}
            data-testid={`${name()}-text-color`}
            aria-label={name()}
          >
            <div aria-hidden="true">A</div>
          </button>
        ))}
      </div>
      <div>{c('Label').t`Background colour`}</div>
      <div className="flex items-center gap-3">
        {backgroundColors.map(([name, color]) => {
          const isSelected = color === currentBackgroundColor
          return (
            <button
              className={clsx(
                'text-norm flex h-8 w-8 items-center justify-center rounded-full border text-base hover:brightness-75',
                isSelected && 'outline outline-1 outline-offset-2 outline-[#000]',
              )}
              style={{
                backgroundColor: color,
                borderColor: isSelected ? 'transparent' : color || 'var(--border-weak)',
              }}
              onClick={() => onBackgroundColorChange(color)}
              data-testid={`${name()}-background-color`}
              aria-label={name()}
            >
              <div aria-hidden="true">A</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
