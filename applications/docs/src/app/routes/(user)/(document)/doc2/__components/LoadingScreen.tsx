import { Button } from '@proton/atoms/Button/Button'
import { MimeProtonDoc } from '@proton/file-icons/icons/MimeProtonDoc'
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle'
import { IcLockFilled } from '@proton/icons/icons/IcLockFilled'
import { DOCS_APP_NAME } from '@proton/shared/lib/constants'
import clsx from '@proton/utils/clsx'
import { c } from 'ttag'

import type { LoadingScreenStatus } from '../__utils/loadingScreen'

export type LoadingScreenProps = {
  status: LoadingScreenStatus
  /** Offered beside Can't connect, for a stop the session can retry */
  onRetry?: () => void
}

const TRACK_CLASS = 'bg-strong h-[0.1875rem] w-72 rounded-lg'
// Under reduced motion, from the system or the app's own setting, the bar stops sliding and a partial bar pulses in
// place. `!`: app.scss's `.animate-loading-bar-*` rules come after Tailwind's utilities.
const REDUCED_MOTION_STILL = 'motion-reduce:!animate-none [.feature-animations-off_&]:!animate-none'
const REDUCED_MOTION_PULSE =
  'motion-reduce:!animate-pulse motion-reduce:scale-x-[0.4] [.feature-animations-off_&]:!animate-pulse [.feature-animations-off_&]:scale-x-[0.4]'

const statusMessages: Record<LoadingScreenStatus, () => string> = {
  opening: () => c('Info').t`Opening document…`,
  decrypting: () => c('Info').t`Decrypting document…`,
  syncing: () => c('Info').t`Syncing latest changes…`,
  preparingEditor: () => c('Info').t`Preparing editor…`,
  cantConnect: () => c('Info').t`Can't connect`,
  creating: () => c('Info').t`Creating new document…`,
  redirecting: () => c('Info').t`Redirecting…`,
}

/**
 * Adapted from `applications/docs/src/app/components/document/DocumentViewer/DocumentViewer.tsx`, its `Loader` and
 * `LoadingBar`. Covers the whole viewport, over the page that loads under it and under modals, on the page's
 * background, until the page lifts it. Takes no focus. Its status is a polite live region, and its bar an
 * indeterminate progress bar, which pulses in place under reduced motion. A stopped load shows
 * no bar.
 */
export function LoadingScreen({ status, onRetry }: LoadingScreenProps) {
  const stopped = status === 'cantConnect'
  const StatusIcon = stopped ? IcExclamationCircle : IcLockFilled

  return (
    <div
      // z-[899]: the modals' z-index − 1, so the screen covers the page, header and drawer included, and modals stay
      // above it
      className="ui-standard bg-norm fixed inset-0 z-[899] flex flex-col items-center justify-center"
      data-testid="loading-screen"
    >
      <MimeProtonDoc size={9} className="shrink-0" />
      <div className="mb-4 mt-12">{stopped ? <div className={TRACK_CLASS} /> : <LoadingBar />}</div>
      <span className="mb-2 text-center text-xl font-bold">{DOCS_APP_NAME}</span>
      <span className="flex items-center gap-1.5">
        <StatusIcon />
        <output className="text-center text-sm font-semibold">{statusMessages[status]()}</output>
      </span>
      {stopped && onRetry && (
        <Button className="mt-4" size="small" onClick={onRetry}>{c('Action').t`Try again`}</Button>
      )}
    </div>
  )
}

function LoadingBar() {
  return (
    <div
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- a <progress> draws no children, and they are the bar
      role="progressbar"
      aria-label={c('Label').t`Loading`}
      className={clsx('overflow-hidden', TRACK_CLASS)}
    >
      <div className={clsx('animate-loading-bar-move h-full w-full', REDUCED_MOTION_STILL)}>
        {/* keep-motion: the shared reduce-motion rule would freeze it full width, so under reduced motion it pulses instead */}
        <div
          className={clsx(
            'animate-loading-bar-stretch keep-motion bg-primary h-full w-full rounded-lg',
            REDUCED_MOTION_PULSE,
          )}
        />
      </div>
    </div>
  )
}
