import { useCallback } from 'react';
import { getPromiseValue } from 'react-components/hooks/useCachedModelResult';
import { useCache, useApi } from 'react-components';
import { decryptPrivateKey } from 'pmcrypto';
import { decryptUnsigned } from 'proton-shared/lib/keys/driveKeys';
import { queryFolderChildren, queryGetFolder } from '../api/folder';
import { FolderMeta, FolderMetaResult, FolderContentsResult } from '../interfaces/folder';
import useDrive from './useDrive';
import { DriveLink } from '../interfaces/link';
import { DriveFile } from '../interfaces/file';

function useShare(shareId: string) {
    const api = useApi();
    const cache = useCache();
    const { getShareBootstrap } = useDrive();

    const getFolderMeta = useCallback(
        async (linkId: string): Promise<{ Folder: FolderMeta; privateKey: any }> =>
            getPromiseValue(cache, `drive/shares/${shareId}/folder/${linkId}`, async () => {
                const { Folder }: FolderMetaResult = await api(queryGetFolder(shareId, linkId));

                const { privateKey: parentKey } = Folder.ParentLinkID
                    ? await getFolderMeta(Folder.ParentLinkID)
                    : await getShareBootstrap(shareId);

                const decryptedFolderPassphrase = await decryptUnsigned({
                    armoredMessage: Folder.Passphrase,
                    privateKey: parentKey
                });
                const privateKey = await decryptPrivateKey(Folder.Key, decryptedFolderPassphrase);
                return { Folder, privateKey };
            }),
        [shareId]
    );

    const decryptLink = async <T extends DriveLink | DriveFile>({ Name, ParentLinkID, ...rest }: T) => {
        const { privateKey } = await getFolderMeta(ParentLinkID);
        return {
            ...rest,
            ParentLinkID,
            Name: await decryptUnsigned({ armoredMessage: Name, privateKey })
        };
    };

    const clearFolderContentsCache = useCallback(
        (linkId: string, Page: number, PageSize: number) => {
            cache.delete(`drive/shares/${shareId}/folder/${linkId}/children?${Page}&${PageSize}`);
        },
        [shareId]
    );

    const getFolderContents = useCallback(
        async (linkId: string, Page: number, PageSize: number): Promise<DriveLink[]> =>
            getPromiseValue(
                cache,
                `drive/shares/${shareId}/folder/${linkId}/children?${Page}&${PageSize}`,
                async () => {
                    const { Links }: FolderContentsResult = await api(
                        queryFolderChildren(shareId, linkId, { Page, PageSize })
                    );

                    return await Promise.all(Links.map(decryptLink));
                }
            ),
        [shareId]
    );

    return { getFolderMeta, getFolderContents, decryptLink, clearFolderContentsCache };
}

export default useShare;
