import { useCallback, useEffect, useState } from 'react'

import useLoading from '@proton/hooks/useLoading'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { openNewTab } from '@proton/shared/lib/helpers/browser'
import type { useSignupFlowModal } from '../SignupFlowModal/SignupFlowModal'
import { usePublicSessionUser } from '@proton/drive-store/store'
import {
  needPublicRedirectSpotlight,
  publicRedirectSpotlightWasShown,
  setPublicRedirectSpotlightToShown,
} from '@proton/drive-store/utils/publicRedirectSpotlight'
import { RedirectAction } from '@proton/drive-store/store/_documents'

export function useSaveToDrive({
  onClick,
  isAlreadyBookmarked,
  urlPassword,
  showSignupFlowModal,
}: {
  onClick: () => Promise<void>
  isAlreadyBookmarked: boolean
  urlPassword: string
  showSignupFlowModal: ReturnType<typeof useSignupFlowModal>[1]
}) {
  const [isAdding, withAdding] = useLoading()
  const [showSpotlight, setShowSpotlight] = useState(needPublicRedirectSpotlight())
  const { user } = usePublicSessionUser()

  useEffect(() => {
    if (showSpotlight) {
      setPublicRedirectSpotlightToShown()
    }
  }, [showSpotlight])

  const handleClick = useCallback(async () => {
    if (!user) {
      showSignupFlowModal({ urlPassword, redirectAction: RedirectAction.Bookmark, openInNewTab: false })
    } else if (isAlreadyBookmarked) {
      openNewTab(getAppHref('/shared-with-me', APPS.PROTONDRIVE))
    } else {
      await withAdding(onClick)
      if (!publicRedirectSpotlightWasShown()) {
        setShowSpotlight(true)
        setPublicRedirectSpotlightToShown()
      }
    }
  }, [isAlreadyBookmarked, onClick, showSignupFlowModal, urlPassword, user, withAdding])

  return {
    isAdding,
    showSpotlight,
    handleClick,
  }
}
