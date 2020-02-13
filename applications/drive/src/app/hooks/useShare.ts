import { useCallback } from 'react';
import { useApi } from 'react-components';
import { decryptPrivateKey, OpenPGPKey } from 'pmcrypto';
import {
    decryptUnsigned,
    generateNodeHashKey,
    generateNodeKeys,
    encryptUnsigned,
    generateLookupHash
} from 'proton-shared/lib/keys/driveKeys';
import { queryFolderChildren, queryGetFolder, queryCreateFolder } from '../api/folder';
import { FolderMeta, FolderMetaResult, FolderContentsResult } from '../interfaces/folder';
import useDrive from './useDrive';
import { DriveLink } from '../interfaces/link';
import { DriveFile } from '../interfaces/file';
import { decryptPassphrase } from 'proton-shared/lib/keys/calendarKeys';
import useDriveCrypto from './useDriveCrypto';
import useCachedResponse from './useCachedResponse';
import { FOLDER_PAGE_SIZE } from '../constants';

function useShare(shareId: string) {
    const api = useApi();
    const { cache, getCachedResponse } = useCachedResponse();
    const { getShareBootstrap } = useDrive();
    const { getVerificationKeys, getPrimaryAddressKey } = useDriveCrypto();

    const getFolderMeta = useCallback(
        (linkId: string): Promise<{ Folder: FolderMeta; privateKey: OpenPGPKey; hashKey: string }> =>
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

                const [Name, decryptedHashKey, privateKey] = await Promise.all([
                    Folder.Name && decryptUnsigned({ armoredMessage: Folder.Name, privateKey: parentKey }),
                    decryptUnsigned({
                        armoredMessage: Folder.HashKey,
                        privateKey: parentKey
                    }),
                    decryptPrivateKey(Folder.Key, decryptedFolderPassphrase)
                ]);

                return {
                    Folder: {
                        ...Folder,
                        Name
                    },
                    privateKey,
                    hashKey: decryptedHashKey
                };
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

    const createNewFolder = async (ParentLinkID: string, name: string) => {
        // Name Hash is generated from LC, for case-insensitive duplicate detection
        const lowerCaseName = name.toLowerCase();

        const [{ privateKey: parentKey, hashKey }, { privateKey: addressKey, address }] = await Promise.all([
            getFolderMeta(ParentLinkID),
            getPrimaryAddressKey()
        ]);

        const [
            Hash,
            { NodeHashKey: NodeHashKey },
            { NodeKey, NodePassphrase, signature: NodePassphraseSignature },
            encryptedName
        ] = await Promise.all([
            generateLookupHash(lowerCaseName, hashKey),
            generateNodeHashKey(parentKey),
            generateNodeKeys(parentKey, addressKey),
            encryptUnsigned({
                message: name,
                privateKey: parentKey
            })
        ]);

        await api(
            queryCreateFolder(shareId, {
                Hash,
                NodeHashKey,
                Name: encryptedName,
                NodeKey,
                NodePassphrase,
                NodePassphraseSignature,
                SignatureAddressID: address.ID,
                ParentLinkID
            })
        );

        // TODO: clear all cached pages after folder creation, or only last one
        clearFolderContentsCache(ParentLinkID, 0, FOLDER_PAGE_SIZE);
    };

    return { getFolderMeta, getFolderContents, decryptLink, createNewFolder, clearFolderContentsCache };
}

export default useShare;
