import { useCallback } from 'react';
import { useApi } from 'react-components';
import { decryptPrivateKey, OpenPGPKey } from 'pmcrypto';
import { decryptUnsigned } from 'proton-shared/lib/keys/driveKeys';
import { queryFolderChildren, queryGetFolder } from '../api/folder';
import { FolderMeta, FolderMetaResult, FolderContentsResult } from '../interfaces/folder';
import useDrive from './useDrive';
import { DriveLink } from '../interfaces/link';
import { DriveFile } from '../interfaces/file';
import { decryptPassphrase } from 'proton-shared/lib/keys/calendarKeys';
import useDriveCrypto from './useDriveCrypto';
import useCachedResponse from './useCachedResponse';

function useShare(shareId: string) {
    const api = useApi();
    const { cache, getCachedResponse } = useCachedResponse();
    const { getShareBootstrap } = useDrive();
    const { getVerificationKeys } = useDriveCrypto();

    const getFolderMeta = useCallback(
        (linkId: string): Promise<{ Folder: FolderMeta; privateKey: OpenPGPKey }> =>
            getCachedResponse(`drive/shares/${shareId}/folder/${linkId}`, async () => {
                const { Folder } = await api<FolderMetaResult>(queryGetFolder(shareId, linkId));

                const { privateKey: parentKey } = Folder.ParentLinkID
                    ? await getFolderMeta(Folder.ParentLinkID)
                    : await getShareBootstrap(shareId);

                const { publicKeys } = await getVerificationKeys(Folder.SignatureAddressID);

                const decryptedFolderPassphrase = await decryptPassphrase({
                    armoredPassphrase: Folder.Passphrase,
                    armoredSignature: Folder.PassphraseSignature,
                    privateKeys: [parentKey],
                    publicKeys
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
            getCachedResponse(`drive/shares/${shareId}/folder/${linkId}/children?${Page}&${PageSize}`, async () => {
                const { Links } = await api<FolderContentsResult>(
                    queryFolderChildren(shareId, linkId, { Page, PageSize })
                );

                return await Promise.all(Links.map(decryptLink));
            }),
        [shareId]
    );

    return { getFolderMeta, getFolderContents, decryptLink, clearFolderContentsCache };
}

export default useShare;
