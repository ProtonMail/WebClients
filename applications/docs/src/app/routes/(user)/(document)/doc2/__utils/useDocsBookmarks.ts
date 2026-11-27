import { useApi } from '@proton/app-context/useApi'
import { useNotifications } from '@proton/app-context/useNotifications'
import { getPublicLinkUrl } from '@proton/docs-shared/URL/getPublicLinkUrl'
import { getDrive, type MaybeBookmark } from '@proton/drive/sdk'
import useLoading from '@proton/hooks/useLoading'
import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry'
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics'
import type { Api } from '@proton/shared/lib/interfaces/Api'
import type { UserModel } from '@proton/shared/lib/interfaces/User'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { c } from 'ttag'

import { traceErrorSDK } from './usePublicLinkV2'

interface Props {
  token: string
  urlPassword: string
  customPassword?: string
  user?: UserModel
}

/**
 * The visitor's Drive bookmarks, and Save for later, which bookmarks the share URL. Adapted from
 * `applications/docs/src/app/components/document/public/useDocsBookmarks.ts`, which imports docs-core's
 * `traceErrorSDK`: doc2's copy of it is used instead. The hooks list their stable `createNotification` and
 * `withLoading` too, as doc2's lint asks, and the loaded list adds to the bookmarks rather than replacing them, so a
 * Save for later resumed after sign-in, which runs while the list loads, still reads Open in Drive.
 */
export const useDocsBookmarks = ({ token, urlPassword, customPassword, user }: Props) => {
  const api = useApi()
  const { createNotification } = useNotifications()
  const [bookmarksTokens, setBookmarksTokens] = useState<Set<string>>(new Set())
  const [isLoading, withLoading] = useLoading(false)

  useEffect(() => {
    if (!user) {
      return
    }

    const abortController = new AbortController()
    const loadBookmarks = async () => {
      let loaded: Set<string>
      try {
        loaded = await loadBookmarkTokens(abortController.signal)
      } catch (error) {
        if (!abortController.signal.aborted) {
          traceErrorSDK(error, 'DocsDriveCompatSDK')
          createNotification({ type: 'error', text: c('Notification').t`Failed to load saved items` })
        }
        return
      }
      // Merged, so a bookmark added while the list loads isn't dropped by it
      setBookmarksTokens((prevState) => new Set([...prevState, ...loaded]))
    }
    void withLoading(loadBookmarks())
    return () => {
      abortController.abort()
    }
  }, [createNotification, user, withLoading])

  const isAlreadyBookmarked = useMemo(() => {
    return bookmarksTokens.has(token)
  }, [bookmarksTokens, token])

  const handleAddBookmark = useCallback(async () => {
    try {
      await addBookmark(api, token, urlPassword, customPassword)
    } catch (error) {
      traceErrorSDK(error, 'DocsDriveCompatSDK')
      createNotification({ type: 'error', text: c('Notification').t`Failed to save for later` })
      return
    }
    setBookmarksTokens((prevState) => new Set([...prevState, token]))
  }, [api, createNotification, token, urlPassword, customPassword])

  return {
    isLoading,
    addBookmark: handleAddBookmark,
    isAlreadyBookmarked,
  }
}

async function loadBookmarkTokens(signal: AbortSignal) {
  const tokens = new Set<string>()
  for await (const maybeBookmark of getDrive().iterateBookmarks(signal)) {
    tokens.add(getBookmarkToken(maybeBookmark))
  }
  return tokens
}

async function addBookmark(api: Api, token: string, urlPassword: string, customPassword?: string) {
  await getDrive().createBookmark(getPublicLinkUrl(token, urlPassword), customPassword)
  reportBookmarkAdded(api)
}

function reportBookmarkAdded(api: Api) {
  void sendTelemetryReport({
    api,
    measurementGroup: TelemetryMeasurementGroups.driveWebActions,
    event: TelemetryDriveWebFeature.actions,
    values: { count: 1 },
    dimensions: { name: 'addToBookmark' },
    delay: false,
  })
}

// Bookmark uid is the share URL token
function getBookmarkToken(maybeBookmark: MaybeBookmark) {
  return maybeBookmark.ok ? maybeBookmark.value.uid : maybeBookmark.error.uid
}
