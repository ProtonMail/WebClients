import { type ReactElement, useCallback, useEffect, useState } from 'react'
import { c } from 'ttag'

import { Button } from '@proton/atoms/Button/Button'
import { ButtonLike } from '@proton/atoms/Button/ButtonLike'
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor'
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip'
import { ButtonGroup } from '@proton/components/components/button/ButtonGroup'
import Dropdown from '@proton/components/components/dropdown/Dropdown'
import DropdownButton from '@proton/components/components/dropdown/DropdownButton'
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu'
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton'
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown'
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils'
import Spotlight from '@proton/components/components/spotlight/Spotlight'
import { RedirectAction } from '@proton/docs-shared/DocumentAction'
import { useDocsUrlPublicToken } from '@proton/docs-shared/Hooks/useDocsUrlPublicToken'
import { TooltipKey, useTooltipOnce } from '@proton/docs-shared/Hooks/useTooltipOnce'
import { getPublicLinkUrlParams } from '@proton/docs-shared/URL/getPublicLinkUrlParams'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import useLoading from '@proton/hooks/useLoading'
import { IcChevronDownFilled } from '@proton/icons/icons/IcChevronDownFilled'
import { IcFolderArrowIn } from '@proton/icons/icons/IcFolderArrowIn'
import { IcSquares } from '@proton/icons/icons/IcSquares'
import { IcUser } from '@proton/icons/icons/IcUser'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS, DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants'
import { openNewTab } from '@proton/shared/lib/helpers/browser'
import { getInitials } from '@proton/shared/lib/helpers/string'
import type { UserModel } from '@proton/shared/lib/interfaces/User'

import '~/components/document/public/HeaderPublicOptions.scss'
import {
  needPublicRedirectSpotlight,
  publicRedirectSpotlightWasShown,
  setPublicRedirectSpotlightToShown,
} from '~/components/document/public/publicRedirectSpotlight'
import { useApplication } from '~/utils/application-context'
import { useDocsUrlBar } from '~/utils/docs-url-bar'

import type { DocumentRole } from '../__utils/getDocumentRole'
import type { PublicLinkHandoff } from '../__utils/publicLink'
import { redirectToAccountSwitcher, redirectToSignUp } from '../__utils/publicRedirects'
import { useDocsBookmarks } from '../__utils/useDocsBookmarks'
import { CommentsButton } from './CommentsButton'
import { DocumentActiveUsers, type DocumentActiveUsersProps } from './DocumentActiveUsers'
import type { useSignupFlowModal } from './SignupFlowModal'

// Adapted from `applications/docs/src/app/components/document/public/HeaderPublicOptions.tsx`, which reads docs-core's
// public document state, editor controller and link info: the visitor's role, the user, the link and the copy come in
// as props. The comments button is disabled with a tooltip, as a public session has no comments, and Create a copy is
// disabled until it is given a copy to make.

type UserInfoProps = {
  user: UserModel
}

// This is a partial copy of UserDropdownButton.
// We use this Component to show basic user info without the dropdown
function UserInfo({ user }: UserInfoProps) {
  const { Email, DisplayName, Name } = user || {}
  const nameToDisplay = DisplayName || Name || '' // nameToDisplay can be falsy for external account
  const initials = getInitials(nameToDisplay || Email || '')
  const { token, urlPassword, linkId } = useDocsUrlPublicToken()

  return (
    <Button
      onClick={() => {
        redirectToAccountSwitcher(token, linkId, urlPassword)
      }}
      className="user-info interactive-pseudo-protrude interactive--no-background relative ml-0 flex flex-nowrap items-center rounded border-none p-0"
      data-email={Email}
      data-testid="public-view-user-info"
    >
      <span className="user-initials relative my-auto flex shrink-0 rounded border p-1" aria-hidden="true">
        <span className="m-auto">{initials}</span>
      </span>
    </Button>
  )
}

function useSaveToDrive({
  onClick,
  isAlreadyBookmarked,
  urlPassword,
  showSignupFlowModal,
  user,
}: {
  onClick: () => Promise<void>
  isAlreadyBookmarked: boolean
  urlPassword: string
  showSignupFlowModal: ReturnType<typeof useSignupFlowModal>[1]
  user: UserModel | undefined
}) {
  const [isAdding, withAdding] = useLoading()
  const [showSpotlight, setShowSpotlight] = useState(needPublicRedirectSpotlight())

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

/**
 * The once-only spotlight on Create a copy, for a viewer. Mounted only when it can show, as the spotlight counts as shown
 * once mounted: a disabled Create a copy must not use it up.
 */
function MakeCopySpotlight({ show, children }: { show: boolean; children: ReactElement }) {
  return show ? <MakeCopySpotlightOnce>{children}</MakeCopySpotlightOnce> : children
}

function MakeCopySpotlightOnce({ children }: { children: ReactElement }) {
  const { shouldShowTooltip } = useTooltipOnce(TooltipKey.PublicDocsMakeCopy)
  return (
    <Spotlight
      show={shouldShowTooltip}
      content={c('Spotlight').t`To edit this document, create a copy that you can modify.`}
      originalPlacement="bottom-end"
    >
      {children}
    </Spotlight>
  )
}

export type PublicHeaderOptionsProps = Pick<DocumentActiveUsersProps, 'participants' | 'editorInvoker'> & {
  /** The visitor's role on the document */
  role: DocumentRole
  /** The signed-in visitor; undefined for an anonymous one */
  user: UserModel | undefined
  linkInfo: Pick<PublicLinkHandoff['linkInfo'], 'linkId' | 'isSharedUrlAFolder' | 'customPassword'>
  /**
   * Create a copy: the copy in the visitor's Drive, or for an anonymous visitor the sign-up modal first. Without it,
   * Create a copy is disabled.
   */
  onCreateCopy?: () => void
  /**
   * Offers the copy asked for before signing in, once there is one to make, for a click to make it: a window opened
   * without one is a blocked popup. Without it, the copy is made at once.
   */
  onResumeCopy?: () => void
  /** Opens the page's one sign-up modal, which an anonymous visitor's Save for later goes through */
  showSignupFlowModal: ReturnType<typeof useSignupFlowModal>[1]
}

/**
 * A share link visitor's side of the header, as /doc's public header: the active users, Create a copy, Save for later
 * (Open in Drive once saved, never for a link to a folder), Sign up for an anonymous visitor and the account switcher for
 * a signed-in one, and the comments button for an editor. An anonymous visitor's Create a copy and Save for later go
 * through the sign-up modal, and resume when the visitor comes back with the action in the address.
 */
export function PublicHeaderOptions({
  participants,
  editorInvoker,
  role,
  user,
  linkInfo,
  onCreateCopy,
  onResumeCopy,
  showSignupFlowModal,
}: PublicHeaderOptionsProps) {
  const { logger } = useApplication()
  const { removeActionFromUrl } = useDocsUrlBar()
  const { token, urlPassword } = getPublicLinkUrlParams(window.location)
  const { addBookmark, isAlreadyBookmarked, isLoading } = useDocsBookmarks({
    token,
    urlPassword,
    customPassword: linkInfo.customPassword,
    user,
  })

  const saveForLater = useCallback(async () => {
    void addBookmark()
  }, [addBookmark])

  // isSharedUrlAFolder is needed because a doc can be opened from a publicly shared Drive folder.
  // "Save for later" saves the shared URL, which would save the whole folder, not this doc.
  const canShowSaveForLaterOption = !isLoading && linkInfo.isSharedUrlAFolder === false

  // A copy asked for on the way back from sign-in waits for the editor to show the document, which Create a copy needs
  const [isCopyPending, setIsCopyPending] = useState(false)
  useEffect(() => {
    if (isCopyPending && onCreateCopy) {
      setIsCopyPending(false)
      const resume = onResumeCopy ?? onCreateCopy
      resume()
    }
  }, [isCopyPending, onCreateCopy, onResumeCopy])

  /**
   * Handle coming back from redirection and perform the appropriate action, such as bookmarking or making a copy.
   * Then reset the URL to ensure the action is not triggered again. Read from the address as it is now, not as the app
   * loaded it, so a retry of the document doesn't perform it again.
   */
  useEffectOnce(() => {
    const action = new URLSearchParams(window.location.search).get('action')
    if (!action) {
      return
    }

    logger.info('Performing action after redirect', { action })

    if (action === RedirectAction.MakeCopy) {
      if (user) {
        setIsCopyPending(true)
      }
    } else if (action === RedirectAction.Bookmark) {
      // Never for a link to a folder, which Save for later would save whole
      if (user && linkInfo.isSharedUrlAFolder === false) {
        void saveForLater()
      }
    }
    removeActionFromUrl()
  })

  const {
    isAdding,
    showSpotlight,
    handleClick: handleSaveToDriveClick,
  } = useSaveToDrive({
    onClick: saveForLater,
    isAlreadyBookmarked,
    urlPassword,
    showSignupFlowModal,
    user,
  })

  const saveToDriveButtonText = isAlreadyBookmarked
    ? c('drive:action').t`Open in ${DRIVE_SHORT_APP_NAME}`
    : c('drive:action').t`Save for later`

  const handleMakeCopyClick = () => onCreateCopy?.()

  const handleSignUpButtonClick = useCallback(() => {
    void redirectToSignUp({
      action: undefined,
      token,
      linkId: linkInfo.linkId,
      email: '',
      urlPassword,
      openInNewTab: true,
    })
  }, [linkInfo.linkId, token, urlPassword])

  const {
    anchorRef: mobileMenuAnchorRef,
    isOpen: isMobileMenuOpen,
    toggle: toggleMobileMenu,
    close: closeMobileMenu,
  } = usePopperAnchor<HTMLButtonElement>()

  return (
    <div className="flex flex-nowrap items-center gap-2">
      <DocumentActiveUsers className="mr-2 hidden md:flex" participants={participants} editorInvoker={editorInvoker} />

      <ButtonGroup className="!py-0 head-max-849:![display:none]">
        <MakeCopySpotlight show={!!onCreateCopy && role === 'Viewer'}>
          <Button
            color="weak"
            size="small"
            className="flex items-center gap-2 !border-0"
            data-testid="make-a-copy-button"
            disabled={!onCreateCopy}
            onClick={handleMakeCopyClick}
          >
            <IcSquares />
            <span>{c('Action').t`Create a copy`}</span>
          </Button>
        </MakeCopySpotlight>
        {canShowSaveForLaterOption && (
          <SimpleDropdown data-testid="public-options-dropdown-button">
            <Spotlight
              show={showSpotlight}
              content={c('Spotlight')
                .t`A link to this item has been saved in your drive. You can access it later in the 'Shared with me' section.`}
              originalPlacement="bottom-end"
            >
              <Tooltip
                title={
                  isAlreadyBookmarked
                    ? ''
                    : c('Tooltip').t`Add this shared file to your ${DRIVE_APP_NAME} for easy access later.`
                }
              >
                <ButtonLike
                  as={DropdownButton}
                  size="small"
                  loading={isLoading || isAdding}
                  className="!whitespace-normal !border-0 text-left head-max-849:!min-h-7"
                  onClick={handleSaveToDriveClick}
                  color="weak"
                  data-testid="save-in-drive-button"
                >
                  {!isAdding && <IcFolderArrowIn className="mr-2 align-text-bottom" />}
                  <span className="head-max-849:!sr-only">
                    {isAdding ? c('Info').t`Saving...` : saveToDriveButtonText}
                  </span>
                </ButtonLike>
              </Tooltip>
            </Spotlight>
          </SimpleDropdown>
        )}
      </ButtonGroup>

      {!user && (
        <ButtonLike
          className="flex head-max-849:![display:none]"
          onClick={handleSignUpButtonClick}
          color="norm"
          size="small"
          data-testid="public-view-sign-up-link"
        >{c('Action').t`Sign up`}</ButtonLike>
      )}

      {role !== 'Viewer' && (
        <Tooltip title={c('Info').t`Comments are not available yet`}>
          <span className="flex" data-testid="public-comments-button">
            <CommentsButton hasUnread={false} />
          </span>
        </Tooltip>
      )}

      {user && <UserInfo user={user} />}

      <DropdownButton
        ref={mobileMenuAnchorRef}
        isOpen={isMobileMenuOpen}
        onClick={toggleMobileMenu}
        shape="outline"
        size="small"
        className="[display:none] head-max-849:![display:inline-block]"
      >
        <IcChevronDownFilled />
        <span className="sr-only text-ellipsis">{c('Action').t`Show options`}</span>
      </DropdownButton>
      <Dropdown
        isOpen={isMobileMenuOpen}
        anchorRef={mobileMenuAnchorRef}
        onClose={closeMobileMenu}
        size={{
          width: DropdownSizeUnit.Static,
        }}
        originalPlacement="bottom-start"
      >
        <DropdownMenu>
          {canShowSaveForLaterOption && (
            <DropdownMenuButton className="flex items-center gap-2 text-left" onClick={handleSaveToDriveClick}>
              <IcFolderArrowIn />
              <span>{isAdding ? c('Info').t`Saving...` : saveToDriveButtonText}</span>
            </DropdownMenuButton>
          )}
          <DropdownMenuButton
            className="flex items-center gap-2 text-left"
            disabled={!onCreateCopy}
            onClick={handleMakeCopyClick}
          >
            <IcSquares />
            <span>{c('Action').t`Create a copy`}</span>
          </DropdownMenuButton>
          {!user && (
            <DropdownMenuButton className="flex items-center gap-2 text-left" onClick={handleSignUpButtonClick}>
              <IcUser />
              <span>{c('Action').t`Sign up`}</span>
            </DropdownMenuButton>
          )}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
