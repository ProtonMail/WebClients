import { useAuthentication } from '@proton/components/hooks';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

export type DocumentAction =
    | {
          mode: 'open' | 'convert' | 'download' | 'history';
          linkId: string;
          volumeId: string;
          parentLinkId?: never;
          token?: never;
      }
    | {
          mode: 'create';
          parentLinkId: string;
          volumeId: string;
          linkId?: never;
          token?: never;
      }
    | {
          mode: 'open-url';
          linkId: string;
          token: string;
          parentLinkId?: never;
          volumeId?: never;
      };

export const useOpenDocument = () => {
    const { getLocalID } = useAuthentication();

    /**
     * Opens a document in a new window.
     *
     * In the Drive application, this should not be used directly, prefer `useDocumentActions`.
     */
    const openDocumentWindow = ({
        token,
        volumeId,
        linkId,
        parentLinkId,
        mode,
        window,
    }: DocumentAction & { window: Window }) => {
        const href = getAppHref(`/doc`, APPS.PROTONDOCS, getLocalID());
        const url = new URL(href);

        url.searchParams.append('mode', mode);

        if (volumeId) {
            url.searchParams.append('volumeId', volumeId);
        } else if (token) {
            url.searchParams.append('token', token);
        }

        if (linkId) {
            url.searchParams.append('linkId', linkId);
        } else if (parentLinkId) {
            url.searchParams.append('parentLinkId', parentLinkId);
        }

        window.location.assign(url);
    };

    return {
        openDocumentWindow,
    };
};
