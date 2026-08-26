import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { DocumentType } from './BasicTypes'

/**
 * When coming back from the account sign up or sign in, we are usually coming back after the user initiated the auth
 * by pressing Bookmark or Make Copy button. The `action` param in the URL will tell us where to pick back up once
 * we're back in Docs.
 */
export enum RedirectAction {
  Bookmark = 'bookmark',
  MakeCopy = 'make-copy',
}

export type DocumentAction = {
  type: DocumentType | ProtonDocumentType
} & (
  | {
      mode: 'open' | 'convert' | 'download' | 'history'
      linkId: string
      volumeId: string
    }
  | {
      mode: 'create'
      parentLinkId: string
      volumeId: string
    }
  | {
      mode: 'new'
    }
  | {
      mode: 'open-url'
      action?: RedirectAction
      /**
       * linkId can be optional when opening a public doc that has been shared directly since the Docs client can
       * fetch it using the token. This allows the Drive client to redirect to the Docs client much earlier and allows
       * Drive to not show a password page on their side.
       * It cannot be optional when opening a doc from a publicly shared folder since the linkId loaded from the token
       * will be of the folder and not of the doc.
       */
      linkId?: string
      token: string
      urlPassword: string
    }
  | {
      mode: 'open-url-download'
      action?: RedirectAction
      linkId?: string
      token: string
      urlPassword: string
    }
  | {
      /**
       * Reauth occurs when a user is first in a public context (viewing a public doc), then selects an option that
       * redirects them to sign up / sign in. Instead of redirecting back to the public context immediately on
       * sign up, we first need to redirect to the private docs context, so that the the user's session can be persisted.
       * Then we redirect back to the public context where the user can be correctly loaded.
       */
      mode: 'open-url-reauth'
      action?: RedirectAction
      linkId?: string
      token: string
    }
  | {
      /** Make a copy of a public document */
      mode: 'copy-public'
    }
)
