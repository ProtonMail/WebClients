import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import { MimeProtonDoc } from '@proton/file-icons/icons/MimeProtonDoc'
import clsx from '@proton/utils/clsx'

export type DocumentLoaderProps = { className?: string }

export function DocumentLoader({ className }: DocumentLoaderProps) {
  return (
    <div className={clsx('flex h-full w-full flex-col items-center justify-center gap-8', className)}>
      <MimeProtonDoc size={9} className="shrink-0" />
      <CircleLoader size="medium" />
    </div>
  )
}
