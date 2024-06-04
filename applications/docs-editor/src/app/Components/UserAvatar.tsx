import { useMemo } from 'react'
import clsx from '@proton/utils/clsx'

const UserAvatarHueCache = new Map<string, number>()

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  const hue = useMemo(() => {
    const cachedHue = UserAvatarHueCache.get(name)
    if (cachedHue) {
      return cachedHue
    }
    const hue = Math.floor(Math.random() * 360)
    UserAvatarHueCache.set(name, hue)
    return hue
  }, [name])

  const letter = useMemo(() => {
    return name.substring(0, 1).toUpperCase()
  }, [name])

  return (
    <div
      className={clsx('relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg', className)}
      style={{
        backgroundColor: `hsl(${hue}, 100%, 90%)`,
        color: `hsl(${hue}, 100%, 10%)`,
      }}
      aria-hidden={true}
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
}
