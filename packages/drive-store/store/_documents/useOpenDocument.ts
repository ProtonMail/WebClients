import useAuthentication from '@proton/components/hooks/useAuthentication';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

export type DocumentAction =
    | {
          mode: 'open' | 'convert' | 'download' | 'history';
          linkId: string;
          volumeId: string;
          parentLinkId?: never;
      }
    | {
          mode: 'create';
          parentLinkId: string;
          volumeId: string;
          linkId?: never;
      };

export const useOpenDocument = () => {
    const { getLocalID } = useAuthentication();

    /**
     * Opens a document in a new window.
     *
     * In the Drive application, this should not be used directly, prefer `useDocumentActions`.
     */
    const openDocumentWindow = ({
        volumeId,
        linkId,
        parentLinkId,
        mode,
        window,
    }: DocumentAction & { window: Window }) => {
        const href = getAppHref(`/doc`, APPS.PROTONDOCS, getLocalID());
        const url = new URL(href);

        url.searchParams.append('mode', mode);

        url.searchParams.append('volumeId', volumeId);
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
