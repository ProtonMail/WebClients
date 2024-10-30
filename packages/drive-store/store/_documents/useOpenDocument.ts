import { useAuthentication } from '@proton/components';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

/**
 * When coming back from the account sign up or sign in, we are usually coming back after the user initiated the auth
 * by pressing Bookmark or Make Copy button. The `action` param in the URL will tell us where to pick back up once
 * we're back in Docs.
 */
export enum RedirectAction {
    Bookmark = 'bookmark',
    MakeCopy = 'make-copy',
}

export type DocumentAction =
    | {
          mode: 'open' | 'convert' | 'download' | 'history';
          linkId: string;
          volumeId: string;
      }
    | {
          mode: 'create';
          parentLinkId: string;
          volumeId: string;
      }
    | {
          mode: 'open-url';
          action?: RedirectAction;
          linkId: string;
          token: string;
          urlPassword: string;
      }
    | {
          /**
           * Reauth occurs when a user is first in a public context (viewing a public doc), then selects an option that
           * redirects them to sign up / sign in. Instead of redirecting back to the public context immediately on
           * sign up, we first need to redirect to the private docs context, so that the the user's session can be persisted.
           * Then we redirect back to the public context where the user can be correctly loaded.
           */
          mode: 'open-url-reauth';
          action?: RedirectAction;
          linkId: string;
          token: string;
      }
    | {
          /** Make a copy of a public document */
          mode: 'copy-public';
      };

export const useOpenDocument = () => {
    const { getLocalID } = useAuthentication();

    /**
     * Opens a document in a new window.
     *
     * In the Drive application, this should not be used directly, prefer `useDocumentActions`.
     */
    const openDocumentWindow = (action: DocumentAction & { window: Window }) => {
        const { mode, window } = action;

        const href = getAppHref(`/doc`, APPS.PROTONDOCS, getLocalID());
        const url = new URL(href);

        url.searchParams.append('mode', mode);

        if ('volumeId' in action && action.volumeId) {
            url.searchParams.append('volumeId', action.volumeId);
        } else if ('token' in action && action.token) {
            url.searchParams.append('token', action.token);
        }

        if ('linkId' in action && action.linkId) {
            url.searchParams.append('linkId', action.linkId);
        } else if ('parentLinkId' in action && action.parentLinkId) {
            url.searchParams.append('parentLinkId', action.parentLinkId);
        }

        if ('urlPassword' in action && action.urlPassword) {
            url.hash = action.urlPassword;
        }

        window.location.assign(url);
    };

    return {
        openDocumentWindow,
    };
};
