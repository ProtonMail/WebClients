import { usePreventLeave } from '@proton/components';
import { CryptoProxy } from '@proton/crypto/lib';
import { queryPublicCreateDocument } from '@proton/shared/lib/api/drive/documents';
import { queryPublicCreateFolder } from '@proton/shared/lib/api/drive/folder';
import { queryPublicRenameLink } from '@proton/shared/lib/api/drive/share';
import type { CreateDocumentResult } from '@proton/shared/lib/interfaces/drive/documents';
import {
    encryptName,
    generateContentKeys,
    generateLookupHash,
    generateNodeHashKey,
    generateNodeKeys,
    sign,
} from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import getRandomString from '@proton/utils/getRandomString';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { ValidationError } from '../../utils/errorHandling/ValidationError';
import { useAnonymousUploadAuthStore } from '../../zustand/upload/anonymous-auth.store';
import { usePublicSession } from '../_api';
import { useShare } from '../_shares';
import { encryptFolderExtendedAttributes } from './extendedAttributes';
import useLink from './useLink';
import { validateLinkName } from './validation';

/**
 * usePublicLinkActions provides actions for manipulating with individual link in a public context.
 */
export function usePublicLinkActions() {
    const { preventLeave } = usePreventLeave();
    const { getUploadToken, setUploadToken } = useAnonymousUploadAuthStore((state) => ({
        getUploadToken: state.getUploadToken,
        setUploadToken: state.setUploadToken,
    }));
    const { request: publicDebouncedRequest, getAddressKeyInfo } = usePublicSession();
    const { getLinkPrivateKey, getLinkHashKey, getLink } = useLink();
    const { getSharePrivateKey } = useShare();

    const getCreationData = async (
        abortSignal: AbortSignal,
        { name, token, parentLinkId, context }: { name: string; token: string; parentLinkId: string; context: string }
    ) => {
        const error = validateLinkName(name);
        if (error) {
            throw new ValidationError(error);
        }

        const [parentPrivateKey, parentHashKey, addressKeyInfo] = await Promise.all([
            getLinkPrivateKey(abortSignal, token, parentLinkId),
            getLinkHashKey(abortSignal, token, parentLinkId),
            getAddressKeyInfo(abortSignal),
        ]);

        const signingKeys = addressKeyInfo?.privateKey || parentPrivateKey;

        const [hash, nodeKeys, encryptedName] = await Promise.all([
            generateLookupHash(name, parentHashKey).catch((e) =>
                Promise.reject(
                    new EnrichedError(`Failed to generate ${context} link lookup hash during ${context} creation`, {
                        tags: {
                            token,
                            parentLinkId,
                        },
                        extra: { e },
                    })
                )
            ),
            generateNodeKeys(parentPrivateKey, signingKeys).catch((e) =>
                Promise.reject(
                    new EnrichedError(`Failed to generate ${context} link node keys during ${context} creation`, {
                        tags: {
                            token,
                            parentLinkId,
                        },
                        extra: { e },
                    })
                )
            ),
            encryptName(name, parentPrivateKey, signingKeys).catch((e) =>
                Promise.reject(
                    new EnrichedError(`Failed to encrypt ${context} link name during ${context} creation`, {
                        tags: {
                            token,
                            parentLinkId,
                        },
                        extra: { e },
                    })
                )
            ),
        ]);

        return {
            hash,
            signingKeys,
            addressKeyInfo,
            nodeKeys,
            encryptedName,
        };
    };

    const createFolder = async (
        abortSignal: AbortSignal,
        {
            token,
            parentLinkId,
            name,
            modificationTime,
            silence,
        }: { token: string; parentLinkId: string; name: string; modificationTime?: Date; silence?: number | number[] }
    ) => {
        const { hash, addressKeyInfo, nodeKeys, encryptedName } = await getCreationData(abortSignal, {
            name,
            token,
            parentLinkId,
            context: 'folder',
        });

        // We use private key instead of address key to sign the hash key
        // because its internal property of the folder. We use address key for
        // name or content to have option to trust some users more or less.
        const { NodeHashKey: nodeHashKey } = await generateNodeHashKey(nodeKeys.privateKey, nodeKeys.privateKey).catch(
            (e) =>
                Promise.reject(
                    new EnrichedError('Failed to encrypt node hash key during folder creation', {
                        tags: {
                            token,
                            parentLinkId,
                        },
                        extra: { e },
                    })
                )
        );

        const xattr = !modificationTime
            ? undefined
            : await encryptFolderExtendedAttributes(
                  modificationTime,
                  nodeKeys.privateKey,
                  addressKeyInfo ? addressKeyInfo.privateKey : nodeKeys.privateKey
              );

        const { Folder, AuthorizationToken } = await preventLeave(
            publicDebouncedRequest<{ Folder: { ID: string }; AuthorizationToken: string }>({
                ...queryPublicCreateFolder(token, {
                    Hash: hash,
                    NodeHashKey: nodeHashKey,
                    Name: encryptedName,
                    NodeKey: nodeKeys.NodeKey,
                    NodePassphrase: nodeKeys.NodePassphrase,
                    NodePassphraseSignature: nodeKeys.NodePassphraseSignature,
                    SignatureEmail: addressKeyInfo?.address.Email,
                    ParentLinkID: parentLinkId,
                    XAttr: xattr,
                }),
                silence,
            })
        );

        if (AuthorizationToken) {
            setUploadToken({ linkId: Folder.ID, authorizationToken: AuthorizationToken });
        }

        return Folder.ID;
    };

    const createDocument = async (
        abortSignal: AbortSignal,
        {
            token,
            parentLinkId,
            name,
            documentType = 'doc',
        }: { token: string; parentLinkId: string; name: string; documentType?: 'doc' | 'sheet' }
    ) => {
        const { hash, addressKeyInfo, nodeKeys, signingKeys, encryptedName } = await getCreationData(abortSignal, {
            name,
            token,
            parentLinkId,
            context: 'document',
        });

        const { ContentKeyPacket, ContentKeyPacketSignature } = await generateContentKeys(nodeKeys.privateKey);

        // Documents do not have any blocks, so we sign an empty array.
        const ManifestSignature = await sign(new Uint8Array([]), signingKeys);

        const { Document, AuthorizationToken } = await preventLeave(
            publicDebouncedRequest<CreateDocumentResult & { AuthorizationToken: string }>({
                ...queryPublicCreateDocument(token, {
                    Hash: hash,
                    Name: encryptedName,
                    NodeKey: nodeKeys.NodeKey,
                    NodePassphrase: nodeKeys.NodePassphrase,
                    NodePassphraseSignature: nodeKeys.NodePassphraseSignature,
                    ContentKeyPacket,
                    ContentKeyPacketSignature,
                    ManifestSignature,
                    SignatureEmail: addressKeyInfo?.address.Email,
                    ParentLinkID: parentLinkId,
                    DocumentType: documentType === 'doc' ? 1 : 2,
                }),
            })
        );

        if (AuthorizationToken) {
            setUploadToken({ linkId: Document.LinkID, authorizationToken: AuthorizationToken });
        }

        return Document.LinkID;
    };

    const renameLink = async (
        abortSignal: AbortSignal,
        { token, linkId, newName }: { token: string; linkId: string; newName: string }
    ) => {
        const error = validateLinkName(newName);
        if (error) {
            throw new ValidationError(error);
        }

        const [meta, addressKeyInfo] = await Promise.all([
            getLink(abortSignal, token, linkId),
            getAddressKeyInfo(abortSignal),
        ]);

        if (meta.corruptedLink) {
            throw new Error('Cannot rename corrupted file');
        }

        const [parentPrivateKey, parentHashKey] = await Promise.all([
            meta.parentLinkId
                ? getLinkPrivateKey(abortSignal, token, meta.parentLinkId)
                : getSharePrivateKey(abortSignal, token),
            meta.parentLinkId ? getLinkHashKey(abortSignal, token, meta.parentLinkId) : null,
        ]);

        const sessionKey = await getDecryptedSessionKey({
            data: meta.encryptedName,
            privateKeys: parentPrivateKey,
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to decrypt link name session key during rename', {
                    tags: {
                        token,
                        linkId,
                    },
                    extra: { e },
                })
            )
        );

        const signingKeys = addressKeyInfo?.privateKey || parentPrivateKey;
        const authorizationToken = !addressKeyInfo ? getUploadToken(linkId) : undefined;

        const [Hash, { message: encryptedName }] = await Promise.all([
            parentHashKey
                ? generateLookupHash(newName, parentHashKey).catch((e) =>
                      Promise.reject(
                          new EnrichedError('Failed to generate link lookup hash during rename', {
                              tags: {
                                  token,
                                  linkId,
                              },
                              extra: { e },
                          })
                      )
                  )
                : getRandomString(64),
            CryptoProxy.encryptMessage({
                textData: newName,
                stripTrailingSpaces: true,
                sessionKey,
                signingKeys,
            }).catch((e) =>
                Promise.reject(
                    new EnrichedError('Failed to encrypt link name during rename', {
                        tags: {
                            token,
                            linkId,
                        },
                        extra: { e },
                    })
                )
            ),
        ]);

        await preventLeave(
            publicDebouncedRequest(
                queryPublicRenameLink(token, linkId, {
                    Name: encryptedName,
                    NameSignatureEmail: addressKeyInfo?.address.Email,
                    Hash,
                    OriginalHash: meta.hash,
                    AuthorizationToken: authorizationToken,
                })
            )
        );
    };

    return {
        renameLink,
        createFolder,
        createDocument,
    };
}
