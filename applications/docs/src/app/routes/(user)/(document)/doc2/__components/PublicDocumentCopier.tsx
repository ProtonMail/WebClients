import { useRef, useState } from 'react'
import { c } from 'ttag'

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import useAuthentication from '@proton/components/hooks/useAuthentication'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { assignUrl } from '@proton/shared/lib/helpers/location'

import { useApplication } from '~/utils/application-context'

import { duplicateWithState, getDocumentHref } from '../__utils/documentFileActions'
import {
  type PublicDocumentPostMessageDataForCopying,
  type PublicDocumentPostMessageEvent,
  getDocsOrigin,
} from '../__utils/publicDocumentCopying'
import { useRealtimeClient } from '../__utils/useRealtimeClient'
import { OpenActionError } from './OpenActionError'

export type PublicDocumentCopierProps = { driveCompat: DriveCompat }

/**
 * `/doc2?mode=copy-public`, the window a public page opens for Create a copy: it asks its opener for the document, makes
 * the copy in My files, seeds it with the document's state (ADR-0013) and opens it in doc2. Adapted from
 * `applications/docs/src/app/routes/(user)/(document)/doc/__components/PublicDocumentCopier.tsx`, which duplicates
 * through docs-core: doc2's copy-and-seed makes the copy, and a window with no opener or a failed copy shows /doc's
 * error.
 */
export function PublicDocumentCopier({ driveCompat }: PublicDocumentCopierProps) {
  const { logger } = useApplication()
  const client = useRealtimeClient()
  const { getLocalID } = useAuthentication()
  const [failed, setFailed] = useState(false)
  // One copy per window, whatever the opener sends
  const copyingRef = useRef(false)

  // Once per window: the user app hands a new driveCompat on each render
  useEffectOnce(() => {
    const opener = window.opener as Window | null
    if (!opener) {
      logger.error('The copy window has no opener to copy from')
      setFailed(true)
      return
    }

    const performCopy = ({ name, yjsData }: PublicDocumentPostMessageDataForCopying) => {
      duplicateWithState(yjsData, name, { driveCompat, client }).then(
        (copy) => assignUrl(getDocumentHref(copy, getLocalID())),
        (error) => {
          logger.error('Failed to copy the public document', error)
          setFailed(true)
        },
      )
    }

    const handleMessage = (event: MessageEvent) => {
      // Only the opener, from the Docs app
      if (event.origin !== getDocsOrigin() || event.source !== opener) {
        logger.warn('Ignored a message from another window or origin', { origin: event.origin })
        return
      }
      if (event.data?.type !== ('data-for-copying' satisfies PublicDocumentPostMessageEvent) || copyingRef.current) {
        return
      }
      copyingRef.current = true
      const doc = event.data.doc as Partial<PublicDocumentPostMessageDataForCopying> | undefined
      if (!(doc?.yjsData instanceof Uint8Array) || typeof doc.name !== 'string' || !doc.name) {
        logger.error('The opener sent no document to copy')
        setFailed(true)
        return
      }
      performCopy({ name: doc.name, yjsData: doc.yjsData })
    }

    window.addEventListener('message', handleMessage)
    opener.postMessage(
      { type: 'public-copier-ready' satisfies PublicDocumentPostMessageEvent },
      getAppHref('/', APPS.PROTONDOCS),
    )
    return () => window.removeEventListener('message', handleMessage)
  })

  if (failed) {
    return <OpenActionError reason="copyFailed" />
  }

  return (
    <div className="bg-norm flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center gap-4">
      <CircleLoader size="large" />
      <div className="text-center">{c('Info').t`Making a copy...`}</div>
    </div>
  )
}
