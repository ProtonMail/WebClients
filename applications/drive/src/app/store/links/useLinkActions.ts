import { encryptMessage } from 'pmcrypto';

import { usePreventLeave } from '@proton/components';
import { queryRenameLink } from '@proton/shared/lib/api/drive/share';
import { queryCreateFolder } from '@proton/shared/lib/api/drive/folder';
import {
    generateNodeKeys,
    generateLookupHash,
    generateNodeHashKey,
    encryptName,
} from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';

import { useDebouncedRequest } from '../api';
import { useDriveCrypto } from '../crypto';
import { useDriveEventManager } from '../events';
import useLink from './useLink';
import { ecryptFolderExtendedAttributes } from './extendedAttributes';
import { validateLinkName, ValidationError } from './validation';

/**
 * useLinkActions provides actions for manipulating with individual link.
 */
export default function useLinkActions() {
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const events = useDriveEventManager();
    const { getLink, getLinkPrivateKey, getLinkHashKey } = useLink();
    const { getPrimaryAddressKey } = useDriveCrypto();

    const createFolder = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        name: string,
        modificationTime?: Date
    ) => {
        // Name Hash is generated from LC, for case-insensitive duplicate detection.
        const error = validateLinkName(name);
        if (error) {
            throw new ValidationError(error);
        }

        const [parentPrivateKey, parentHashKey, { privateKey: addressKey, address }] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, parentLinkId),
            getLinkHashKey(abortSignal, shareId, parentLinkId),
            getPrimaryAddressKey(),
        ]);

        const [Hash, { NodeKey, NodePassphrase, privateKey, NodePassphraseSignature }, encryptedName] =
            await Promise.all([
                generateLookupHash(name, parentHashKey),
                generateNodeKeys(parentPrivateKey, addressKey),
                encryptName(name, parentPrivateKey.toPublic(), addressKey),
            ]);

        const { NodeHashKey } = await generateNodeHashKey(privateKey.toPublic(), privateKey);

        const xattr = !modificationTime
            ? undefined
            : await ecryptFolderExtendedAttributes(modificationTime, privateKey, addressKey);

        const { Folder } = await preventLeave(
            debouncedRequest<{ Folder: { ID: string } }>(
                queryCreateFolder(shareId, {
                    Hash,
                    NodeHashKey,
                    Name: encryptedName,
                    NodeKey,
                    NodePassphrase,
                    NodePassphraseSignature,
                    SignatureAddress: address.Email,
                    ParentLinkID: parentLinkId,
                    XAttr: xattr,
                })
            )
        );
        await events.pollShare(shareId);
        return Folder.ID;
    };

    const renameLink = async (abortSignal: AbortSignal, shareId: string, linkId: string, newName: string) => {
        const error = validateLinkName(newName);
        if (error) {
            throw new ValidationError(error);
        }

        const meta = await getLink(abortSignal, shareId, linkId);

        const [parentPrivateKey, parentHashKey] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, meta.parentLinkId),
            getLinkHashKey(abortSignal, shareId, meta.parentLinkId),
        ]);

        const [sessionKey, { address, privateKey: addressKey }] = await Promise.all([
            getDecryptedSessionKey({
                data: meta.encryptedName,
                privateKeys: parentPrivateKey,
            }),
            getPrimaryAddressKey(),
        ]);

        const [Hash, { data: encryptedName }] = await Promise.all([
            generateLookupHash(newName, parentHashKey),
            encryptMessage({
                data: newName,
                sessionKey,
                privateKeys: addressKey,
            }),
        ]);

        await preventLeave(
            debouncedRequest(
                queryRenameLink(shareId, linkId, {
                    Name: encryptedName,
                    Hash,
                    SignatureAddress: address.Email,
                })
            )
        );
        await events.pollShare(shareId);
    };

    return {
        createFolder,
        renameLink,
    };
}
