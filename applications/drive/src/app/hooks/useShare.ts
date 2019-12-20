import { getPromiseValue } from 'react-components/hooks/useCachedModelResult';
import { useCache, useApi } from 'react-components';
import { decryptUnsigned } from 'proton-shared/lib/keys/driveKeys';
import { decryptPrivateKeyArmored } from 'proton-shared/lib/keys/keys';
import { queryFolderChildren, queryGetFolder } from '../api/folder';
import { DriveLink, FolderMeta, FolderMetaResult, FolderContentsResult } from '../interfaces/folder';
import useDrive from './useDrive';
import { DriveFile, DriveFileResult } from '../interfaces/file';
import { queryFile } from '../api/files';
import { useCallback } from 'react';

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
                const privateKey = await decryptPrivateKeyArmored(Folder.Key, decryptedFolderPassphrase);
                return { Folder, privateKey };
            }),
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

                    return await Promise.all(
                        Links.map(async ({ Name, ParentLinkID, ...rest }: DriveLink) => {
                            const { privateKey } = await getFolderMeta(ParentLinkID);
                            return {
                                ...rest,
                                ParentLinkID,
                                Name: await decryptUnsigned({ armoredMessage: Name, privateKey })
                            };
                        })
                    );
                }
            ),
        [shareId]
    );

    const getFileMeta = async (linkId: string): Promise<{ File: DriveFile; privateKey: any }> =>
        getPromiseValue(cache, `drive/shares/${shareId}/file/${linkId}`, async () => {
            const { File }: DriveFileResult = await api(queryFile(shareId, linkId));
            const { privateKey: parentKey } = await getFolderMeta(File.ParentLinkID);
            const decryptedFilePassphrase = await decryptUnsigned({
                armoredMessage: File.Passphrase,
                privateKey: parentKey
            });
            const privateKey = await decryptPrivateKeyArmored(File.Key, decryptedFilePassphrase);
            return {
                File,
                privateKey
            };
        });

    return { getFolderMeta, getFolderContents, getFileMeta };
}

export default useShare;
