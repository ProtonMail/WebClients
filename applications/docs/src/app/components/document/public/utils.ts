import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants'
import { replaceUrl } from '@proton/shared/lib/helpers/browser'
import { getUrlWithReturnUrl } from '@proton/shared/lib/helpers/url'
import { PLANS } from '@proton/payments'
import { Actions, countActionWithTelemetry, traceTelemetry } from '@proton/drive-store/utils/telemetry'
import { getCurrentTab, getNewWindow } from '@proton/shared/lib/helpers/window'
import { DOCS_SIGNIN, DOCS_SIGNUP } from '@proton/shared/lib/docs/urls'
import {
  RedirectionReason,
  drivePublicRedirectionReasonKey,
} from '@proton/drive-store/hooks/util/useRedirectToPublicPage'
import { saveUrlPasswordForRedirection } from '@proton/drive-store/utils/url/password'
import type { DocumentType } from '@proton/drive-store/store/_documents/useOpenDocument'
import { useOpenDocument, type RedirectAction } from '@proton/drive-store/store/_documents/useOpenDocument'
import type { PublicContextValue } from '../context'
import type { EditorControllerInterface, PublicDocumentState } from '@proton/docs-core'
import { useCallback } from 'react'
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'

function openUrl(url: string, openInNewTab: boolean) {
  const tab = openInNewTab ? getNewWindow() : getCurrentTab()
  tab.handle.location.assign(url)
}

export function redirectToAccountSwitcher(token: string, linkId: string | undefined, urlPassword: string) {
  const accountSwitchUrl = new URL(getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT))
  accountSwitchUrl.searchParams.append('product', 'docs')

  const returnUrlSearchParams = new URLSearchParams()
  returnUrlSearchParams.append('mode', 'open-url-reauth')
  returnUrlSearchParams.append('token', token)
  if (linkId) {
    returnUrlSearchParams.append('linkId', linkId)
  }

  // We need to pass by the private app to set latest active session, then be redirected to public page.
  // This will be done in MainContainer.tsx on page loading
  returnUrlSearchParams.append(drivePublicRedirectionReasonKey, RedirectionReason.ACCOUNT_SWITCH)
  const returnUrl = `/?`.concat(returnUrlSearchParams.toString())
  const urlWithReturnUrl = getUrlWithReturnUrl(accountSwitchUrl.toString(), {
    returnUrl: returnUrl,
    context: 'private',
  })

  // Save password before going to account switch page
  saveUrlPasswordForRedirection(urlPassword)

  // We replace the url to prevent any bad action from the user,
  // like returning back into the history after signout all sessions
  replaceUrl(urlWithReturnUrl)
}

export async function redirectToSignUp({
  action,
  token,
  email,
  linkId,
  urlPassword,
  openInNewTab,
}: {
  action: RedirectAction | undefined
  token: string
  email: string
  linkId: string | undefined
  urlPassword: string
  openInNewTab: boolean
}) {
  await Promise.all([
    countActionWithTelemetry(Actions.SignUpFlowModal),
    traceTelemetry(Actions.SignUpFlowAndRedirectCompleted).start(),
  ])

  const returnUrlSearchParams = new URLSearchParams()
  returnUrlSearchParams.append('mode', 'open-url-reauth')
  if (action) {
    returnUrlSearchParams.append('action', action)
  }
  returnUrlSearchParams.append('token', token)
  if (linkId) {
    returnUrlSearchParams.append('linkId', linkId)
  }

  const returnUrl = `/?`.concat(returnUrlSearchParams.toString())
  const urlWithReturnUrl = new URL(
    getUrlWithReturnUrl(DOCS_SIGNUP, {
      returnUrl: returnUrl,
      context: 'private',
    }),
  )

  // This autofills the sign-up email input
  urlWithReturnUrl.searchParams.append('email', email)
  urlWithReturnUrl.searchParams.append('plan', PLANS.FREE)

  // Save password before going to auth. This way we can load the hash param into the url when we come back from redirection
  saveUrlPasswordForRedirection(urlPassword)

  openUrl(urlWithReturnUrl.toString(), openInNewTab)
}

export async function redirectToSignIn({
  action,
  token,
  email,
  linkId,
  urlPassword,
  openInNewTab,
}: {
  action: RedirectAction | undefined
  token: string
  email: string
  linkId: string | undefined
  urlPassword: string
  openInNewTab: boolean
}) {
  void countActionWithTelemetry(Actions.SignInFlowModal)

  const returnUrlSearchParams = new URLSearchParams()
  returnUrlSearchParams.append('mode', 'open-url-reauth')
  if (action) {
    returnUrlSearchParams.append('action', action)
  }
  returnUrlSearchParams.append('token', token)
  if (linkId) {
    returnUrlSearchParams.append('linkId', linkId)
  }

  const returnUrl = `/?`.concat(returnUrlSearchParams.toString())
  const urlWithReturnUrl = new URL(
    getUrlWithReturnUrl(DOCS_SIGNIN, {
      returnUrl: returnUrl,
      context: 'private',
    }),
  )

  // This autofills the sign-in email input
  urlWithReturnUrl.searchParams.append('username', email)

  // Save password before going to auth. This way we can load the hash param into the url when we come back from redirection
  saveUrlPasswordForRedirection(urlPassword)

  openUrl(urlWithReturnUrl.toString(), openInNewTab)
}

/**
 * To copy a public document, the public context (the opener) will open a new window (the child/copier) to
 * something like docs.proton.x/?mode=copy. Once the child is ready to receive data from the opener, it will
 * post a CopierReady event. The opener will listen for this event and respond back with DataForCopying.
 *
 * The copier will receive this data and create a new document with this data.
 *
 * The reason we need to open a new tab to create a copy is that the opening tab is a public context app which
 * doesn't have access to the private API. So to create a copy, we need to open a new tab to the private context.
 * Then, we give the private context the data to create a copy.
 */
export type PublicDocumentPostMessageEvent = 'public-copier-ready' | 'data-for-copying'

export type PublicDocumentPostMessageDataForCopying = {
  name: string
  yjsData: Uint8Array<ArrayBuffer>
}

export type PublicDocumentCopyingOptions = {
  context: PublicContextValue
  editorController: EditorControllerInterface
  documentState: PublicDocumentState
  documentType: DocumentType | ProtonDocumentType
}

export function usePublicDocumentCopying({
  context,
  editorController,
  documentState,
  documentType,
}: PublicDocumentCopyingOptions) {
  const { openDocumentWindow } = useOpenDocument()
  const { user } = context

  const handleCopierReady = useCallback(
    async (childWindow: Window) => {
      const editorData = await editorController.exportData('yjs')
      const messageData: PublicDocumentPostMessageDataForCopying = {
        yjsData: editorData,
        name: documentState.getProperty('documentName'),
      }
      childWindow.postMessage(
        {
          type: 'data-for-copying' satisfies PublicDocumentPostMessageEvent,
          doc: messageData,
        },
        getAppHref('/', APPS.PROTONDOCS),
      )
    },
    [editorController, documentState],
  )

  const handleCopierMessage = useCallback(
    async (event: MessageEvent) => {
      if (event.data.type === ('public-copier-ready' satisfies PublicDocumentPostMessageEvent)) {
        await handleCopierReady(event.source as Window)

        window.removeEventListener('message', handleCopierMessage)
      }
    },
    [handleCopierReady],
  )

  function createCopy() {
    if (!user) {
      throw new Error('Attempted to create a copy without a user')
    }

    const w = getNewWindow()
    window.addEventListener('message', handleCopierMessage)

    openDocumentWindow({
      type: documentType,
      mode: 'copy-public',
      window: w.handle,
    })
  }

  return { createCopy }
}
