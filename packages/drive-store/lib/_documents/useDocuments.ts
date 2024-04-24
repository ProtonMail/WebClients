import { sha1 } from '@openpgp/noble-hashes/sha1';
import { c } from 'ttag';

import { queryCreateDocument } from '@proton/shared/lib/api/drive/documents';
import { CreateDocumentResult } from '@proton/shared/lib/interfaces/drive/documents';
import {
    encryptName,
    generateContentKeys,
    generateLookupHash,
    generateNodeKeys,
    sign,
} from '@proton/shared/lib/keys/driveKeys';

import { useDebouncedRequest } from '../../store/_api';
import { useLink } from '../../store/_links';
import { encryptExtendedAttributes } from '../../store/_links/extendedAttributes';
import { useShare } from '../../store/_shares';
import { useAbortSignal } from '../../store/_views/utils';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { DocumentShell } from './DocumentShell';

export const useDocuments = () => {
    const debouncedRequest = useDebouncedRequest();
    const abortSignal = useAbortSignal([]);
    const { getLinkPrivateKey, getLinkHashKey } = useLink();
    const { getShareCreatorKeys } = useShare();

    const createDocumentShell = async (
        shareId: string,
        parentLinkId: string,
        name?: string
    ): Promise<DocumentShell> => {
        const date = new Date().toLocaleString();
        // translator: Name of a new Proton Document
        const useName = name ?? c('Title').t`Untitled document ${date}`;

        const [parentPrivateKey, parentHashKey, { privateKey: addressKey, address }] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, parentLinkId),
            getLinkHashKey(abortSignal, shareId, parentLinkId),
            getShareCreatorKeys(abortSignal, shareId),
        ]);

        const [Hash, { NodeKey, NodePassphrase, privateKey, NodePassphraseSignature }, encryptedName] =
            await Promise.all([
                generateLookupHash(useName, parentHashKey).catch((e) =>
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
                encryptName(useName, parentPrivateKey, addressKey).catch((e) =>
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

        const { ContentKeyPacket, ContentKeyPacketSignature, sessionKey } = await generateContentKeys(privateKey);

        const content = '';
        const hasher = sha1.create();
        hasher.update(content);
        const manifest = hasher.digest();
        const ManifestSignature = await sign(manifest, addressKey);

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
                ManifestSignature, // why?
                XAttr: xattr,
            }),
            abortSignal
        );

        return {
            linkId: Document.ID,
            shareId,
            volumeId: Document.VolumeID,
            sessionKey,
        };
    };

    return {
        createDocumentShell,
    };
};

export default useDocuments;
