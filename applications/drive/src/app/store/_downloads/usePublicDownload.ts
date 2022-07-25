import { querySharedURLFileRevision } from '@proton/shared/lib/api/drive/sharing';
import { DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import { SharedURLRevision } from '@proton/shared/lib/interfaces/drive/sharing';

import { usePublicSession } from '../_api';
import { DecryptedLink, useLink, usePublicLinksListing } from '../_links';
import initDownloadPure from './download/download';
import { DownloadControls, DownloadEventCallbacks, LinkDownload, Pagination } from './interface';

/**
 * usePublicDownload provides pure initDownload enhanced by retrieving
 * information about user's own folders and files from the app cache
 * similarly like useDownload for private app, but this one is for public
 * sessions.
 */
export default function usePublicDownload() {
    const { request } = usePublicSession();
    const { getLinkPrivateKey, getLinkSessionKey } = useLink();
    const { loadChildren, getCachedChildren } = usePublicLinksListing();

    const getChildren = async (abortSignal: AbortSignal, token: string, linkId: string): Promise<DecryptedLink[]> => {
        await loadChildren(abortSignal, token, linkId, false);
        const { links } = getCachedChildren(abortSignal, token, linkId);
        return links;
    };

    const getBlocks = async (
        abortSignal: AbortSignal,
        token: string,
        linkId: string,
        pagination: Pagination
    ): Promise<DriveFileBlock[]> => {
        const { Revision } = await request<{ Revision: SharedURLRevision }>(
            querySharedURLFileRevision(token, linkId, pagination),
            abortSignal
        );
        return Revision.Blocks;
    };

    const getKeys = async (abortSignal: AbortSignal, token: string, linkId: string) => {
        const [privateKey, sessionKeys] = await Promise.all([
            getLinkPrivateKey(abortSignal, token, linkId),
            getLinkSessionKey(abortSignal, token, linkId),
        ]);

        if (!sessionKeys) {
            throw new Error('Session key missing on file link');
        }

        return {
            privateKey,
            sessionKeys,
        };
    };

    const initDownload = (
        name: string,
        list: LinkDownload[],
        eventCallbacks: DownloadEventCallbacks
    ): DownloadControls => {
        return initDownloadPure(name, list, {
            getChildren,
            getBlocks,
            getKeys: (abortSignal: AbortSignal, link: LinkDownload) =>
                getKeys(
                    abortSignal,
                    link.shareId, // Token in this context.
                    link.linkId
                ),
            ...eventCallbacks,
            onSignatureIssue: undefined,
        });
    };

    return {
        initDownload,
    };
}
