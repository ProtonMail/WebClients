import { useMemo, forwardRef, ForwardedRef, ComponentPropsWithoutRef } from 'react'
import clsx from '@proton/utils/clsx'

function parseHueFromHSLstring(hsl: string): number | undefined {
  const NumberRegex = /(\d+)/
  const numberMatch = hsl.match(NumberRegex)?.[0]
  return numberMatch ? parseInt(numberMatch) : undefined
}

/** A number between 0 to 360 */
type HueValue = number

const UserAvatarHueCache = new Map<string, number>()

interface UserAvatarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'color'> {
  name: string
  className?: string
  color?: { hue: HueValue } | { hsl: string }
}

export const UserAvatar = forwardRef(function UserAvatar(
  { name, className, color, ...rest }: UserAvatarProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  if (!name) {
    throw new Error('UserAvatar requires a name prop')
  }

  const hue = useMemo(() => {
    if (color) {
      if ('hsl' in color) {
        if (color.hsl) {
          const parsed = parseHueFromHSLstring(color.hsl)
          if (parsed && !isNaN(parsed)) {
            return parsed
          }
        }
      } else if (!isNaN(color.hue)) {
        return color.hue
      }
    }

    const cachedHue = UserAvatarHueCache.get(name)
    if (cachedHue) {
      return cachedHue
    }

    const hue = Math.floor(Math.random() * 360)
    UserAvatarHueCache.set(name, hue)
    return hue
  }, [color, name])

  const letter = useMemo(() => {
    return name.substring(0, 1).toUpperCase()
  }, [name])

  return (
    <div
      ref={ref}
      className={clsx(
        'h-custom w-custom relative flex items-center justify-center overflow-hidden rounded-lg',
        className,
      )}
      style={{
        backgroundColor: `hsl(${hue}, 100%, 90%)`,
        color: `hsl(${hue}, 100%, 10%)`,
        userSelect: 'none',
        '--h-custom': '1.75rem',
        '--w-custom': '1.75rem',
      }}
      {...rest}
    >
      <div
        style={{
          zIndex: 1,
        }}
      >
        {letter}
      </div>
      <div
        className="absolute h-full w-full rounded"
        style={{
          bottom: '16.5%',
          left: '16.5%',
          zIndex: 0,
          backgroundColor: `hsl(${hue}, 80%, 80%)`,
        }}
      />
    </div>
  )
})
