import { c } from 'ttag'

export function FontColorMenu({
  textColors,
  onTextColorChange,
  backgroundColors,
  onBackgroundColorChange,
}: {
  textColors: string[]
  onTextColorChange: (color: string) => void
  backgroundColors: (string | null)[]
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
        {textColors.map((color) => (
          // eslint-disable-next-line jsx-a11y/control-has-associated-label
          <button
            className="border-weak flex h-8 w-8 items-center justify-center rounded-full border text-base hover:brightness-75"
            style={{
              color: color,
            }}
            onClick={() => onTextColorChange(color)}
          >
            <div aria-hidden="true">A</div>
          </button>
        ))}
      </div>
      <div>{c('Label').t`Background colour`}</div>
      <div className="flex items-center gap-3">
        {backgroundColors.map((color) => {
          // eslint-disable-next-line jsx-a11y/control-has-associated-label
          return (
            <button
              className="text-norm flex h-8 w-8 items-center justify-center rounded-full border text-base hover:brightness-75"
              style={{
                backgroundColor: color,
                borderColor: color || 'var(--border-weak)',
              }}
              onClick={() => onBackgroundColorChange(color)}
            >
              <div aria-hidden="true">A</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
