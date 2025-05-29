import { useCallback, useEffect, useState } from 'react'
import { Button, ButtonLike, Tooltip } from '@proton/atoms'
import { c } from 'ttag'
import { useDocsContext } from '../context'
import { useDocsBookmarks } from '@proton/drive-store/lib/_views/useDocsBookmarks'
import { useDocsUrlBar } from '~/utils/docs-url-bar'
import { RedirectAction } from '@proton/drive-store/store/_documents'
import { useApplication } from '~/utils/application-context'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import type { EditorControllerInterface } from '@proton/docs-core'
import type { PublicDocumentState } from '@proton/docs-core'
import {
  Spotlight,
  Icon,
  DropdownButton,
  usePopperAnchor,
  Dropdown,
  DropdownSizeUnit,
  DropdownMenu,
  DropdownMenuButton,
  ButtonGroup,
  SimpleDropdown,
} from '@proton/components'
import { DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants'
import { useSignupFlowModal } from './SignupFlowModal'
import { TooltipKey, useTooltipOnce } from '@proton/docs-shared'
import { DocumentActiveUsers } from '../DocumentLayout/DocumentHeader/DocumentActiveUsers'
import { CommentsButton } from '../DocumentLayout/DocumentHeader/CommentsButton'
import { redirectToAccountSwitcher, redirectToSignUp, usePublicDocumentCopying } from './utils'
import type { UserModel } from '@proton/shared/lib/interfaces'
import { getInitials } from '@proton/shared/lib/helpers/string'
import { useDocsUrlPublicToken } from '@proton/drive-store'
import useLoading from '@proton/hooks/useLoading'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { openNewTab } from '@proton/shared/lib/helpers/browser'
import { usePublicSessionUser } from '@proton/drive-store/store'
import {
  needPublicRedirectSpotlight,
  publicRedirectSpotlightWasShown,
  setPublicRedirectSpotlightToShown,
} from '@proton/drive-store/utils/publicRedirectSpotlight'
import './HeaderPublicOptions.scss'

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

export type HeaderPublicOptionsProps = {
  editorController: EditorControllerInterface
  documentState: PublicDocumentState
}

export function HeaderPublicOptions({ editorController, documentState }: HeaderPublicOptionsProps) {
  const { surePublicContext } = useDocsContext()
  const { removeActionFromUrl } = useDocsUrlBar()
  const application = useApplication()
  const role = documentState.getProperty('userRole')

  const { customPassword, token, linkId, urlPassword } = surePublicContext.compat
  const { addBookmark, isAlreadyBookmarked, isLoading } = useDocsBookmarks({ token, urlPassword, customPassword })
  const { createCopy } = usePublicDocumentCopying({
    context: surePublicContext,
    editorController,
    documentState,
  })
  const { user, openParams, compat } = surePublicContext
  const { isSharedUrlAFolder } = compat

  const saveForLater = useCallback(async () => {
    void addBookmark()
  }, [addBookmark])

  const canShowSaveForLaterOption = !isLoading && isSharedUrlAFolder === false

  /**
   * Handle coming back from redirection and perform the appropriate action, such as bookmarking or making a copy.
   * Then reset the URL to ensure the action is not triggered again.
   */
  useEffectOnce(() => {
    if (openParams.mode !== 'open-url' && openParams.mode !== 'open-url-download') {
      return
    }

    if (openParams.action) {
      application.logger.info('Performing action after redirect', {
        action: openParams.action,
      })

      if (openParams.action === RedirectAction.MakeCopy) {
        if (user) {
          createCopy()
        }
      } else if (openParams.action === RedirectAction.Bookmark) {
        if (user) {
          void saveForLater()
        }
      }
      removeActionFromUrl()
    }
  }, [application.logger, createCopy, openParams, removeActionFromUrl, saveForLater, user])

  const [signupFlowModal, showSignupFlowModal] = useSignupFlowModal()

  const {
    isAdding,
    showSpotlight,
    handleClick: handleSaveToDriveClick,
  } = useSaveToDrive({
    onClick: saveForLater,
    isAlreadyBookmarked,
    urlPassword,
    showSignupFlowModal,
  })

  const saveToDriveButtonText = isAlreadyBookmarked
    ? c('drive:action').t`Open in ${DRIVE_SHORT_APP_NAME}`
    : c('drive:action').t`Save for later`

  const { shouldShowTooltip: shouldShowMakeCopyTooltip } = useTooltipOnce(TooltipKey.PublicDocsMakeCopy)
  const handleMakeCopyClick = useCallback(() => {
    if (!user) {
      showSignupFlowModal({ urlPassword, redirectAction: RedirectAction.MakeCopy, openInNewTab: true })
    } else {
      createCopy()
    }
  }, [createCopy, showSignupFlowModal, urlPassword, user])

  const handleSignUpButtonClick = useCallback(() => {
    void redirectToSignUp({
      action: undefined,
      token,
      linkId,
      email: '',
      urlPassword,
      openInNewTab: true,
    })
  }, [linkId, token, urlPassword])

  const {
    anchorRef: mobileMenuAnchorRef,
    isOpen: isMobileMenuOpen,
    toggle: toggleMobileMenu,
    close: closeMobileMenu,
  } = usePopperAnchor<HTMLButtonElement>()

  return (
    <div className="flex flex-nowrap items-center gap-2">
      <DocumentActiveUsers className="mr-2 hidden md:flex" />

      <ButtonGroup className="!py-0 head-max-849:![display:none]">
        <Spotlight
          show={shouldShowMakeCopyTooltip && role.isPublicViewer()}
          content={c('Spotlight').t`To edit this document, create a copy that you can modify.`}
          originalPlacement="bottom-end"
        >
          <Button
            color="weak"
            size="small"
            className="flex items-center gap-2 !border-0"
            data-testid="make-a-copy-button"
            onClick={handleMakeCopyClick}
          >
            <Icon name="squares" />
            <span>{c('Action').t`Create a copy`}</span>
          </Button>
        </Spotlight>
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
                  className="flex items-center gap-2 !border-0 head-max-849:!min-h-7"
                  onClick={handleSaveToDriveClick}
                  color="weak"
                  data-testid="save-in-drive-button"
                >
                  {!isAdding && <Icon name="folder-arrow-in" />}
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

      {documentState.getProperty('userRole').canComment() && <CommentsButton editorController={editorController} />}

      {user && (
        <>
          <UserInfo user={user} />
        </>
      )}

      <DropdownButton
        ref={mobileMenuAnchorRef}
        isOpen={isMobileMenuOpen}
        onClick={toggleMobileMenu}
        shape="outline"
        size="small"
        className="[display:none] head-max-849:![display:inline-block]"
      >
        <Icon name="chevron-down-filled" />
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
              <Icon name="folder-arrow-in" />
              <span>{isAdding ? c('Info').t`Saving...` : saveToDriveButtonText}</span>
            </DropdownMenuButton>
          )}
          <DropdownMenuButton className="flex items-center gap-2 text-left" onClick={handleMakeCopyClick}>
            <Icon name="squares" />
            <span>{c('Action').t`Create a copy`}</span>
          </DropdownMenuButton>
          {!user && (
            <DropdownMenuButton className="flex items-center gap-2 text-left" onClick={handleSignUpButtonClick}>
              <Icon name="user" />
              <span>{c('Action').t`Sign up`}</span>
            </DropdownMenuButton>
          )}
        </DropdownMenu>
      </Dropdown>

      {signupFlowModal}
    </div>
  )
}
