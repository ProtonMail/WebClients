import { useCallback } from 'react'
import { Button, ButtonLike } from '@proton/atoms'
import { c } from 'ttag'
import { useDocsContext } from '../../../Containers/ContextProvider'
import { useDocsBookmarks } from '@proton/drive-store/lib/_views/useDocsBookmarks'
import { usePublicDocumentCopying } from '../Hooks/usePublicDocumentCopying'
import { UserInfo } from './UserInfo'
import { DOCS_SIGNUP_FREE } from '@proton/shared/lib/docs/urls'
import { useDocsUrlBar } from '../../../Containers/useDocsUrlBar'
import { RedirectAction } from '@proton/drive-store/store/_documents'
import { useApplication } from '../../../Containers/ApplicationProvider'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import type { EditorControllerInterface } from '@proton/docs-core'
import type { PublicDocumentState } from '@proton/docs-core'
import { useSaveToDrive } from './useSaveToDrive'
import {
  Spotlight,
  Tooltip,
  Icon,
  DropdownButton,
  usePopperAnchor,
  Dropdown,
  DropdownSizeUnit,
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuLink,
} from '@proton/components'
import { DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants'
import { useSignupFlowModal } from '../SignupFlowModal/SignupFlowModal'
import { TooltipKey, useTooltipOnce } from '@proton/docs-shared'
import { DocumentActiveUsers } from '../../../Components/DocumentActiveUsers'

export const HeaderPublicOptions = ({
  editorController,
  documentState,
}: {
  editorController: EditorControllerInterface
  documentState: PublicDocumentState
}) => {
  const { surePublicContext } = useDocsContext()
  const { removeActionFromUrl } = useDocsUrlBar()
  const application = useApplication()
  const role = documentState.getProperty('userRole')

  const { customPassword, token, urlPassword } = surePublicContext.compat
  const { addBookmark, isAlreadyBookmarked, isLoading } = useDocsBookmarks({ token, urlPassword, customPassword })
  const { createCopy } = usePublicDocumentCopying({
    context: surePublicContext,
    editorController,
    documentState,
  })
  const { user, openParams } = surePublicContext

  const saveForLater = useCallback(async () => {
    void addBookmark()
  }, [addBookmark])

  /**
   * Handle coming back from redirection and perform the appropriate action, such as bookmarking or making a copy.
   * Then reset the URL to ensure the action is not triggered again.
   */
  useEffectOnce(() => {
    if (openParams.mode !== 'open-url') {
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
      showSignupFlowModal({ urlPassword, redirectAction: RedirectAction.MakeCopy })
    } else {
      createCopy()
    }
  }, [createCopy, showSignupFlowModal, urlPassword, user])

  const {
    anchorRef: mobileMenuAnchorRef,
    isOpen: isMobileMenuOpen,
    toggle: toggleMobileMenu,
    close: closeMobileMenu,
  } = usePopperAnchor<HTMLButtonElement>()

  return (
    <div className="flex flex-nowrap items-center gap-2">
      <DocumentActiveUsers className="mr-2 hidden md:flex" />

      {!user && (
        <ButtonLike
          className="flex head-max-849:![display:none]"
          as="a"
          href={DOCS_SIGNUP_FREE}
          target="_blank"
          color="weak"
          size="small"
          data-testid="public-view-sign-up-link"
        >{c('Action').t`Sign up`}</ButtonLike>
      )}

      {!isLoading && (
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
            <Button
              size="small"
              loading={isLoading || isAdding}
              className="flex items-center gap-2 head-max-849:!min-h-7"
              onClick={handleSaveToDriveClick}
              color="weak"
              data-testid="save-in-drive-button"
            >
              {!isAdding && <Icon name="folder-arrow-in" />}
              <span className="head-max-849:!sr-only">{isAdding ? c('Info').t`Saving...` : saveToDriveButtonText}</span>
            </Button>
          </Tooltip>
        </Spotlight>
      )}

      <Spotlight
        show={shouldShowMakeCopyTooltip && role.isPublicViewer()}
        content={c('Spotlight').t`To edit this document, create a copy that you can modify.`}
        originalPlacement="bottom-end"
      >
        <Button
          color={user ? 'weak' : 'norm'}
          size="small"
          className="flex items-center gap-2 head-max-849:![display:none]"
          data-testid="make-a-copy-button"
          onClick={handleMakeCopyClick}
        >
          <Icon name="squares" />
          <span>{c('Action').t`Create a copy`}</span>
        </Button>
      </Spotlight>

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
          <DropdownMenuButton className="flex items-center gap-2 text-left" onClick={handleSaveToDriveClick}>
            <Icon name="folder-arrow-in" />
            <span>{isAdding ? c('Info').t`Saving...` : saveToDriveButtonText}</span>
          </DropdownMenuButton>
          <DropdownMenuButton className="flex items-center gap-2 text-left" onClick={handleMakeCopyClick}>
            <Icon name="squares" />
            <span>{c('Action').t`Create a copy`}</span>
          </DropdownMenuButton>
          {!user && (
            <DropdownMenuLink className="flex items-center gap-2 text-left" href={DOCS_SIGNUP_FREE} target="_blank">
              <Icon name="user" />
              <span>{c('Action').t`Sign up`}</span>
            </DropdownMenuLink>
          )}
        </DropdownMenu>
      </Dropdown>

      {signupFlowModal}
    </div>
  )
}
