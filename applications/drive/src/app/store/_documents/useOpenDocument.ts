import { useAuthentication } from '@proton/components';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

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
          linkId: string;
          token: string;
          urlPassword: string;
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
