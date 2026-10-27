import { useApi } from '@proton/app-context/useApi'
import { useNotifications } from '@proton/app-context/useNotifications'
import { traceErrorSDK } from '@proton/docs-core/DriveSDK/traceErrorSDK'
import { getPublicLinkUrl } from '@proton/docs-shared/URL/getPublicLinkUrl'
import { getDrive, type MaybeBookmark } from '@proton/drive/sdk'
import useLoading from '@proton/hooks/useLoading'
import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry'
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics'
import type { Api } from '@proton/shared/lib/interfaces/Api'
import type { UserModel } from '@proton/shared/lib/interfaces/User'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { c } from 'ttag'

interface Props {
  token: string
  urlPassword: string
  customPassword?: string
  user?: UserModel
}

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
    void withLoading(
      loadBookmarkTokens(abortController.signal).then(setBookmarksTokens, (error) => {
        if (!abortController.signal.aborted) {
          traceErrorSDK(error, 'DocsDriveCompatSDK')
          createNotification({ type: 'error', text: c('Notification').t`Failed to load saved items` })
        }
      }),
    )
    return () => {
      abortController.abort()
    }
  }, [user])

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
  }, [api, token, urlPassword, customPassword])

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
