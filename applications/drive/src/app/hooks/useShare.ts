import { useCallback } from 'react';
import { useApi } from 'react-components';
import { decryptPrivateKey, OpenPGPKey, SessionKey } from 'pmcrypto';
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
import { queryRenameLink } from '../api/share';
import { lookup } from 'mime-types';

const folderChildrenCacheKey = (shareId: string, linkId: string, Page: number, PageSize: number) =>
    `drive/shares/${shareId}/folder/${linkId}/children?${Page}&${PageSize}`;
const folderMetaCacheKey = (shareId: string, linkId: string) => `drive/shares/${shareId}/folder/${linkId}`;

function useShare(shareId: string) {
    const api = useApi();
    const { cache, getCachedResponse, updateCachedResponse } = useCachedResponse();
    const { getShareBootstrap } = useDrive();
    const { getVerificationKeys, getPrimaryAddressKey } = useDriveCrypto();

    const getFolderMeta = useCallback(
        (linkId: string): Promise<{ Folder: FolderMeta; privateKey: OpenPGPKey; hashKey: string }> =>
            getCachedResponse(folderMetaCacheKey(shareId, linkId), async () => {
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

                const [Name, privateKey] = await Promise.all([
                    Folder.Name && decryptUnsigned({ armoredMessage: Folder.Name, privateKey: parentKey }),
                    decryptPrivateKey(Folder.Key, decryptedFolderPassphrase)
                ]);

                const decryptedHashKey = await decryptUnsigned({
                    armoredMessage: Folder.HashKey,
                    privateKey
                });

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
            cache.delete(folderChildrenCacheKey(shareId, linkId, Page, PageSize));
        },
        [shareId]
    );

    const getFolderContents = useCallback(
        async (linkId: string, Page: number, PageSize: number): Promise<DriveLink[]> =>
            getCachedResponse(folderChildrenCacheKey(shareId, linkId, Page, PageSize), async () => {
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
            { NodeKey, NodePassphrase, privateKey, signature: NodePassphraseSignature },
            encryptedName
        ] = await Promise.all([
            generateLookupHash(lowerCaseName, hashKey),
            generateNodeKeys(parentKey, addressKey),
            encryptUnsigned({
                message: name,
                privateKey: parentKey
            })
        ]);

        const { NodeHashKey: NodeHashKey } = await generateNodeHashKey(privateKey);

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

    const renameLink = async (linkId: string, newName: string, parentLinkID: string) => {
        const lowerCaseName = newName.toLowerCase();
        const MimeType = lookup(newName) || 'application/octet-stream';

        const { privateKey: parentKey, hashKey } = await getFolderMeta(parentLinkID);
        const [Hash, encryptedName] = await Promise.all([
            generateLookupHash(lowerCaseName, hashKey),
            encryptUnsigned({
                message: newName,
                privateKey: parentKey
            })
        ]);

        await api(
            queryRenameLink(shareId, linkId, {
                Name: encryptedName,
                MimeType,
                Hash
            })
        );

        // Update file meta
        updateCachedResponse(
            `drive/shares/${shareId}/file/${linkId}`,
            (value: { File: DriveFile; sessionKeys?: SessionKey; privateKey: OpenPGPKey }) => {
                return { ...value, File: { ...value.File, Hash, MimeType, Name: newName } };
            }
        );

        // Update folder meta
        updateCachedResponse(
            folderMetaCacheKey(shareId, linkId),
            (value: { Folder: FolderMeta; hashKey: string; privateKey: OpenPGPKey }) => {
                return { ...value, Folder: { ...value.Folder, Hash, Name: newName } };
            }
        );

        // Update folder children
        // TODO: mutate cache for same page that the folder is in
        updateCachedResponse(
            folderChildrenCacheKey(shareId, parentLinkID, 0, FOLDER_PAGE_SIZE),
            (value: DriveLink[]) => {
                const index = value.findIndex((link) => link.LinkID === linkId);
                if (index !== -1) {
                    return [
                        ...value.slice(0, index),
                        { ...value[index], Hash, Name: newName },
                        ...value.slice(index + 1)
                    ];
                }
                return value;
            }
        );
    };

    return { getFolderMeta, getFolderContents, decryptLink, createNewFolder, clearFolderContentsCache, renameLink };
}

export default useShare;
