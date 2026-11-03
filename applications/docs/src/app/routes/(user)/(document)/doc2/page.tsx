import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import { getUrlPassword } from '@proton/docs-shared/URL/getUrlPassword'
import { MimeProtonDoc } from '@proton/file-icons/icons/MimeProtonDoc'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { version as realtimeSdkVersion } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'
import { parseOpenAction, useDocsUrlBar } from '~/utils/docs-url-bar'
import { OpenActionError } from './__components/OpenActionError'
import { resolveOpenAction } from './__utils/resolveOpenAction'

export default function DocumentPageV2() {
  const application = useApplication()
  const { navigateToAction } = useDocsUrlBar()

  // Not useDocsUrlBar().openAction: that is parsed once, from the first URL the app loaded.
  const { pathname, search } = useLocation()
  const openAction = useMemo(() => parseOpenAction(new URLSearchParams(search), pathname), [pathname, search])
  const resolution = useMemo(() => resolveOpenAction(openAction, search), [openAction, search])

  useEffectOnce(() => {
    application.logger.info('Document page v2 on realtime SDK', { realtimeSdkVersion })
  })

  useEffect(() => {
    application.logger.info('Resolved open action', { resolution })
  }, [application.logger, resolution])

  useEffect(() => {
    if (resolution.kind === 'redirect' && openAction?.mode === 'open-url-reauth') {
      navigateToAction({ ...openAction, mode: 'open-url', urlPassword: getUrlPassword() }, 'public')
    }
  }, [navigateToAction, openAction, resolution.kind])

  if (resolution.kind === 'error') {
    return <OpenActionError reason={resolution.reason} />
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8">
      <MimeProtonDoc size={9} className="shrink-0" />
      <CircleLoader size="medium" />
    </div>
  )
}
