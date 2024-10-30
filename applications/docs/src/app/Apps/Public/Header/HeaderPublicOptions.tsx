import { useCallback } from 'react'
import { ButtonLike } from '@proton/atoms'
import { c } from 'ttag'
import type { AnyDocControllerInterface } from '@proton/docs-core/lib/Controller/Document/AnyDocControllerInterface'
import { useDocsContext } from '../../../Containers/ContextProvider'
import { useDocsBookmarks } from '@proton/drive-store/lib/_views/useDocsBookmarks'
import { SaveToDriveButton } from './SaveToDriveButton'
import { usePublicDocumentCopying } from '../Hooks/usePublicDocumentCopying'
import { UserInfo } from './UserInfo'
import { DOCS_SIGNUP_FREE } from '@proton/shared/lib/docs/urls'
import { MakeCopyButton } from './MakeCopyButton'
import { useDocsUrlBar } from '../../../Containers/useDocsUrlBar'
import { RedirectAction } from '@proton/drive-store/store/_documents'
import { useApplication } from '../../../Containers/ApplicationProvider'
import useEffectOnce from '@proton/hooks/useEffectOnce'

export const HeaderPublicOptions = ({ controller }: { controller: AnyDocControllerInterface }) => {
  const { surePublicContext } = useDocsContext()
  const { removeActionFromUrl } = useDocsUrlBar()
  const application = useApplication()

  const { customPassword, token, urlPassword } = surePublicContext.compat
  const { addBookmark, isAlreadyBookmarked, isLoading } = useDocsBookmarks({ token, urlPassword, customPassword })
  const { createCopy } = usePublicDocumentCopying({ context: surePublicContext, controller })
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

  return (
    <div className="flex items-center gap-2">
      {!user && (
        <ButtonLike as="a" href={DOCS_SIGNUP_FREE} target="_blank" color="weak" size="small">{c('Action')
          .t`Sign up`}</ButtonLike>
      )}

      {!isLoading && (
        <SaveToDriveButton
          alreadyBookmarked={isAlreadyBookmarked}
          onClick={saveForLater}
          urlPassword={urlPassword}
          loading={isLoading}
        />
      )}

      <MakeCopyButton onClick={createCopy} urlPassword={urlPassword} />

      {user && (
        <>
          <UserInfo user={user} />
        </>
      )}
    </div>
  )
}
