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
import { queryFolderChildren, queryCreateFolder } from '../api/folder';
import { ResourceType, LinkShortMeta } from '../interfaces/link';
import { LinkChildrenResult } from '../interfaces/link';
import useDrive from './useDrive';
import { LinkMeta, LinkMetaResult, FolderLinkMeta, FileLinkMeta, isFolderLinkMeta } from '../interfaces/link';
import { decryptPassphrase } from 'proton-shared/lib/keys/calendarKeys';
import useDriveCrypto from './useDriveCrypto';
import useCachedResponse from './useCachedResponse';
import { FOLDER_PAGE_SIZE } from '../constants';
import { queryRenameLink } from '../api/share';
import { lookup } from 'mime-types';
import { queryGetLink } from '../api/link';
import { deserializeUint8Array } from 'proton-shared/lib/helpers/serialization';
import { getDecryptedSessionKey } from 'proton-shared/lib/calendar/decrypt';
import { validateLinkName, ValidationError } from '../utils/validation';

export const folderChildrenCacheKey = (shareId: string, linkId: string, Page: number, PageSize: number) =>
    `drive/shares/${shareId}/folder/${linkId}/children?${Page}&${PageSize}`;
const linkMetaCacheKey = (shareId: string, linkId: string) => `drive/shares/${shareId}/folder/${linkId}`;

interface FolderLinkMetaResult {
    Link: FolderLinkMeta;
    keys: {
        privateKey: OpenPGPKey;
        hashKey: string;
    };
}

export interface FileLinkMetaResult {
    Link: FileLinkMeta;
    keys: {
        privateKey: OpenPGPKey;
        sessionKeys?: SessionKey;
    };
}

function useShare(shareId: string) {
    const api = useApi();
    const { cache, getCachedResponse, updateCachedResponse } = useCachedResponse();
    const { fetchShareMeta } = useDrive();
    const { getVerificationKeys, getPrimaryAddressKey } = useDriveCrypto();

    const getLinkMeta = useCallback(
        (linkId: string): Promise<FolderLinkMetaResult | FileLinkMetaResult> =>
            getCachedResponse(linkMetaCacheKey(shareId, linkId), async () => {
                const { Link } = await api<LinkMetaResult>(queryGetLink(shareId, linkId));

                const [{ keys: parentKeys }, { publicKeys }] = await Promise.all([
                    Link.ParentLinkID ? await getLinkMeta(Link.ParentLinkID) : await fetchShareMeta(shareId),
                    getVerificationKeys(Link.SignatureAddressID)
                ]);

                const decryptedLinkPassphrase = await decryptPassphrase({
                    armoredPassphrase: Link.NodePassphrase,
                    armoredSignature: Link.NodePassphraseSignature,
                    privateKeys: [parentKeys.privateKey],
                    publicKeys
                });

                const [Name, privateKey] = await Promise.all([
                    decryptUnsigned({ armoredMessage: Link.Name, privateKey: parentKeys.privateKey }),
                    decryptPrivateKey(Link.NodeKey, decryptedLinkPassphrase)
                ]);

                const meta = {
                    ...Link,
                    Name
                };

                if (isFolderLinkMeta(meta)) {
                    const decryptedHashKey = await decryptUnsigned({
                        armoredMessage: meta.FolderProperties.NodeHashKey,
                        privateKey
                    });

                    return {
                        Link: meta,
                        keys: {
                            privateKey,
                            hashKey: decryptedHashKey
                        }
                    };
                }

                const blockKeys = deserializeUint8Array(meta.FileProperties.ContentKeyPacket);
                const sessionKeys = await getDecryptedSessionKey(blockKeys, privateKey);

                return {
                    Link: meta,
                    keys: {
                        privateKey,
                        sessionKeys
                    }
                };
            }),
        [shareId, api, getCachedResponse, getVerificationKeys, fetchShareMeta]
    );

    const getFolderMeta = useCallback(
        async (linkId: string) => {
            const result = await getLinkMeta(linkId);

            if (!isFolderLinkMeta(result.Link)) {
                throw new Error(
                    `Invalid link metadata, expected Folder (${ResourceType.FOLDER}), got ${result.Link.Type}`
                );
            }

            return result as FolderLinkMetaResult;
        },
        [getLinkMeta]
    );

    const decryptLink = useCallback(
        async <T extends LinkMeta>({ Name, ParentLinkID, ...rest }: T) => {
            const { keys } = await getFolderMeta(ParentLinkID);
            return {
                ...rest,
                ParentLinkID,
                Name: await decryptUnsigned({ armoredMessage: Name, privateKey: keys.privateKey })
            } as T;
        },
        [getFolderMeta]
    );

    const clearFolderContentsCache = useCallback(
        (linkId: string, Page: number, PageSize: number) => {
            cache.delete(folderChildrenCacheKey(shareId, linkId, Page, PageSize));
        },
        [cache, shareId]
    );

    const getFolderContents = useCallback(
        async (linkId: string, Page: number, PageSize: number): Promise<LinkShortMeta[]> =>
            getCachedResponse(folderChildrenCacheKey(shareId, linkId, Page, PageSize), async () => {
                const { Links } = await api<LinkChildrenResult>(
                    queryFolderChildren(shareId, linkId, { Page, PageSize })
                );

                return await Promise.all(Links.map(decryptLink));
            }),
        [api, shareId, getCachedResponse, decryptLink]
    );

    const createNewFolder = useCallback(
        async (ParentLinkID: string, name: string) => {
            // Name Hash is generated from LC, for case-insensitive duplicate detection
            const lowerCaseName = name.toLowerCase();
            const error = validateLinkName(lowerCaseName);

            if (error) {
                throw new ValidationError(error);
            }

            const [{ keys: parentKeys }, { privateKey: addressKey, address }] = await Promise.all([
                getFolderMeta(ParentLinkID),
                getPrimaryAddressKey()
            ]);

            const [
                Hash,
                { NodeKey, NodePassphrase, privateKey, signature: NodePassphraseSignature },
                encryptedName
            ] = await Promise.all([
                generateLookupHash(lowerCaseName, parentKeys.hashKey),
                generateNodeKeys(parentKeys.privateKey, addressKey),
                encryptUnsigned({
                    message: name,
                    publicKey: parentKeys.privateKey.toPublic()
                })
            ]);

            const { NodeHashKey: NodeHashKey } = await generateNodeHashKey(privateKey.toPublic());

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
        },
        [shareId, api, clearFolderContentsCache, getFolderMeta, getPrimaryAddressKey]
    );

    const renameLink = useCallback(
        async (linkId: string, newName: string, parentLinkID: string) => {
            const error = validateLinkName(newName);

            if (error) {
                throw new ValidationError(error);
            }

            const lowerCaseName = newName.toLowerCase();
            const MimeType = lookup(newName) || 'application/octet-stream';

            const { keys: parentKeys } = await getFolderMeta(parentLinkID);
            const [Hash, encryptedName] = await Promise.all([
                generateLookupHash(lowerCaseName, parentKeys.hashKey),
                encryptUnsigned({
                    message: newName,
                    publicKey: parentKeys.privateKey.toPublic()
                })
            ]);

            await api(
                queryRenameLink(shareId, linkId, {
                    Name: encryptedName,
                    MimeType,
                    Hash
                })
            );

            // Update folder and file meta
            updateCachedResponse(linkMetaCacheKey(shareId, linkId), (value: FolderLinkMetaResult) => {
                return { ...value, Link: { ...value.Link, Hash, MimeType, Name: newName } };
            });

            // Update folder children
            // TODO: mutate cache for same page that the folder is in
            updateCachedResponse(
                folderChildrenCacheKey(shareId, parentLinkID, 0, FOLDER_PAGE_SIZE),
                (value: LinkMeta[]) => {
                    const index = value.findIndex((link) => link.LinkID === linkId);
                    if (index !== -1) {
                        return [
                            ...value.slice(0, index),
                            { ...value[index], Hash, MimeType, Name: newName },
                            ...value.slice(index + 1)
                        ];
                    }
                    return value;
                }
            );
        },
        [shareId, api, getFolderMeta, updateCachedResponse]
    );

    return {
        getFolderMeta,
        getLinkMeta,
        getFolderContents,
        decryptLink,
        createNewFolder,
        clearFolderContentsCache,
        renameLink
    };
}

export default useShare;
