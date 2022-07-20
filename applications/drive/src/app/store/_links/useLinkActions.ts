import { CryptoProxy } from '@proton/crypto';
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

import { useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import { useDriveEventManager } from '../_events';
import { ValidationError } from '../_utils';
import useLink from './useLink';
import { ecryptFolderExtendedAttributes } from './extendedAttributes';
import { validateLinkName } from './validation';

/**
 * useLinkActions provides actions for manipulating with individual link.
 */
export default function useLinkActions() {
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const events = useDriveEventManager();
    const { getLink, getLinkPrivateKey, getLinkSessionKey, getLinkHashKey } = useLink();
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
                encryptName(name, parentPrivateKey, addressKey),
            ]);

        // We use private key instead of address key to sign the hash key
        // because its internal property of the folder. We use address key for
        // name or content to have option to trust some users more or less.
        const { NodeHashKey } = await generateNodeHashKey(privateKey, privateKey);

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

        const [Hash, { message: encryptedName }] = await Promise.all([
            generateLookupHash(newName, parentHashKey),
            CryptoProxy.encryptMessage({
                textData: newName,
                stripTrailingSpaces: true,
                sessionKey,
                signingKeys: addressKey,
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

    /**
     * checkLinkMetaSignatures checks for all signatures of various attributes:
     * passphrase, hash key, name or xattributes. It does not check content,
     * that is file blocks including thumbnail block.
     */
    const checkLinkMetaSignatures = async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
        const [link] = await Promise.all([
            // Decrypts name and xattributes.
            getLink(abortSignal, shareId, linkId),
            // Decrypts passphrase.
            getLinkPrivateKey(abortSignal, shareId, linkId),
        ]);
        if (link.isFile) {
            await getLinkSessionKey(abortSignal, shareId, linkId);
        } else {
            await getLinkHashKey(abortSignal, shareId, linkId);
        }
        // Get latest link with signature updates.
        return (await getLink(abortSignal, shareId, linkId)).signatureIssues;
    };

    return {
        createFolder,
        renameLink,
        checkLinkMetaSignatures,
    };
}
