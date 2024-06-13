import { useAuthentication } from '@proton/components/hooks';
import { queryCreateDocument } from '@proton/shared/lib/api/drive/documents';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { CreateDocumentResult } from '@proton/shared/lib/interfaces/drive/documents';
import { generateContentHash } from '@proton/shared/lib/keys/driveKeys';
import {
    encryptName,
    generateContentKeys,
    generateLookupHash,
    generateNodeKeys,
    sign,
} from '@proton/shared/lib/keys/driveKeys';

import { useActions } from '../../store/_actions';
import { useDebouncedRequest } from '../../store/_api';
import { useLink } from '../../store/_links';
import { encryptExtendedAttributes } from '../../store/_links/extendedAttributes';
import { useShare } from '../../store/_shares';
import { useAbortSignal } from '../../store/_views/utils';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { LegacyNodeMeta, NodeMeta } from '../interface';
import { DocumentKeys, DocumentManifest, DocumentNodeMeta, SignedData } from './interface';

export const useDocuments = () => {
    const debouncedRequest = useDebouncedRequest();
    const abortSignal = useAbortSignal([]);
    const { getLinkPrivateKey, getLinkHashKey, getLinkSessionKey } = useLink();
    const { getShareCreatorKeys } = useShare();
    const { renameLink } = useActions();
    const { getLocalID } = useAuthentication();

    const getDocumentSigningKeys = async (shareId: string) => {
        // getShareCreatorKeys gets the key from `share.addressId` which is always
        // corresponding to the member of a share. This function will be renamed in a refactor.
        return getShareCreatorKeys(abortSignal, shareId);
    };

    const createDocumentNode = async (
        { shareId, linkId: parentLinkId }: LegacyNodeMeta,
        name: string
    ): Promise<DocumentNodeMeta> => {
        const [parentPrivateKey, parentHashKey, { privateKey: addressKey, address }] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, parentLinkId),
            getLinkHashKey(abortSignal, shareId, parentLinkId),
            getDocumentSigningKeys(shareId),
        ]);

        const [Hash, { NodeKey, NodePassphrase, privateKey, NodePassphraseSignature }, encryptedName] =
            await Promise.all([
                generateLookupHash(name, parentHashKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to generate document link lookup hash during document creation', {
                            tags: {
                                shareId,
                                parentLinkId,
                            },
                            extra: { e },
                        })
                    )
                ),
                generateNodeKeys(parentPrivateKey, addressKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to generate document link node keys during document creation', {
                            tags: {
                                shareId,
                                parentLinkId,
                            },
                            extra: { e },
                        })
                    )
                ),
                encryptName(name, parentPrivateKey, addressKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to encrypt document link name during document creation', {
                            tags: {
                                shareId,
                                parentLinkId,
                            },
                            extra: { e },
                        })
                    )
                ),
            ]);

        const xattr = await encryptExtendedAttributes(
            {
                Common: {},
            },
            privateKey,
            addressKey
        );

        const {
            ContentKeyPacket,
            ContentKeyPacketSignature,
            sessionKey: contentKey,
        } = await generateContentKeys(privateKey);

        // Documents do not have any blocks, so we sign an empty array.
        const ManifestSignature = await sign(new Uint8Array([]), addressKey);

        const { Document } = await debouncedRequest<CreateDocumentResult>(
            queryCreateDocument(shareId, {
                Name: encryptedName,
                Hash,
                ParentLinkID: parentLinkId,
                NodePassphrase,
                NodePassphraseSignature,
                SignatureAddress: address.Email,
                NodeKey,
                ContentKeyPacket,
                ContentKeyPacketSignature,
                ManifestSignature,
                XAttr: xattr,
            }),
            abortSignal
        );

        return {
            linkId: Document.LinkID,
            volumeId: Document.VolumeID,
            keys: {
                documentContentKey: contentKey,
                userAddressPrivateKey: addressKey,
                userOwnAddress: address.Email,
            },
        };
    };

    const getDocumentKeys = async ({ shareId, linkId }: LegacyNodeMeta): Promise<DocumentKeys> => {
        const contentKey = await getLinkSessionKey(abortSignal, shareId, linkId);
        const { privateKey: addressKey, address } = await getDocumentSigningKeys(shareId);

        if (!contentKey || !addressKey || !address) {
            throw new EnrichedError('Could not find document keys', {
                tags: { shareId, linkId },
            });
        }

        return {
            documentContentKey: contentKey,
            userAddressPrivateKey: addressKey,
            userOwnAddress: address.Email,
        };
    };

    const renameDocument = async ({ shareId, linkId }: LegacyNodeMeta, newName: string): Promise<void> => {
        await renameLink(abortSignal, shareId, linkId, newName);
    };

    const getDocumentUrl = ({ volumeId, linkId }: NodeMeta): URL => {
        const href = getAppHref(`/doc`, APPS.PROTONDOCS, getLocalID());
        const url = new URL(href);

        url.searchParams.append('volumeId', volumeId);
        url.searchParams.append('linkId', linkId);

        return url;
    };

    const openDocumentSharingModal = ({ shareId, linkId }: LegacyNodeMeta): void => {
        const href = getAppHref(`/${shareId}/file/${linkId}?share`, APPS.PROTONDRIVE, getLocalID());

        window.open(href);
    };

    const signDocumentData = async ({ shareId }: LegacyNodeMeta, data: Uint8Array): Promise<SignedData> => {
        const { privateKey: addressKey, address } = await getDocumentSigningKeys(shareId);

        const { BlockHash } = await generateContentHash(data);
        const signature = await sign(data, addressKey);

        return {
            data,
            hash: BlockHash,
            signature,
            signatureAddress: address.Email,
        };
    };

    /**
     * Content passed assumes documents are only one block.
     */
    const signDocumentManifest = async (
        { shareId }: LegacyNodeMeta,
        content: Uint8Array
    ): Promise<DocumentManifest> => {
        const { privateKey: addressKey, address } = await getDocumentSigningKeys(shareId);

        const manifest = await generateContentHash(content);
        const manifestSignature = await sign(manifest.BlockHash, addressKey);

        return {
            manifest: manifest.BlockHash,
            manifestSignature,
            signatureAddress: address.Email,
        };
    };

    return {
        createDocumentNode,
        getDocumentKeys,
        renameDocument,
        getDocumentUrl,
        signDocumentManifest,
        signDocumentData,
        openDocumentSharingModal,
    };
};
