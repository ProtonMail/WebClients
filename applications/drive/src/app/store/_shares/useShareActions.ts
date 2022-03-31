import { usePreventLeave } from '@proton/components';
import { queryCreateShare, queryDeleteShare } from '@proton/shared/lib/api/drive/share';
import { getEncryptedSessionKey } from '@proton/shared/lib/calendar/encrypt';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import { generateNodeKeys } from '@proton/shared/lib/keys/driveKeys';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import { useLink } from '../_links';

/**
 * useShareActions provides actions for manipulating with individual share.
 */
export default function useShareActions() {
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const { getPrimaryAddressKey } = useDriveCrypto();
    const { getLink, getLinkPassphraseAndSessionKey, getLinkPrivateKey } = useLink();

    const createShare = async (abortSignal: AbortSignal, shareId: string, volumeId: string, linkId: string) => {
        const [{ address, privateKey: addressPrivateKey }, { passphraseSessionKey }, link] = await Promise.all([
            getPrimaryAddressKey(),
            getLinkPassphraseAndSessionKey(abortSignal, shareId, linkId),
            getLink(abortSignal, shareId, linkId),
        ]);

        const [parentPrivateKey, keyInfo] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, link.parentLinkId),
            generateNodeKeys(addressPrivateKey),
        ]);

        const {
            NodeKey: ShareKey,
            NodePassphrase: SharePassphrase,
            privateKey: sharePrivateKey,
            NodePassphraseSignature: SharePassphraseSignature,
        } = keyInfo;

        const nameSessionKey = await getDecryptedSessionKey({
            data: link.encryptedName,
            privateKeys: parentPrivateKey,
        });

        if (!nameSessionKey) {
            throw new Error('Could not get name session key');
        }

        const [PassphraseKeyPacket, NameKeyPacket] = await Promise.all([
            getEncryptedSessionKey(passphraseSessionKey, sharePrivateKey).then(uint8ArrayToBase64String),
            getEncryptedSessionKey(nameSessionKey, sharePrivateKey).then(uint8ArrayToBase64String),
        ]);

        const { Share } = await preventLeave(
            debouncedRequest<{ Share: { ID: string } }>(
                queryCreateShare(volumeId, {
                    Type: 1, // Not used, but required.
                    PermissionsMask: 0,
                    AddressID: address.ID,
                    RootLinkID: linkId,
                    Name: 'New Share',
                    ShareKey,
                    SharePassphrase,
                    SharePassphraseSignature,
                    PassphraseKeyPacket,
                    NameKeyPacket,
                })
            )
        );

        return {
            shareId: Share.ID,
            sessionKey: keyInfo.sessionKey,
        };
    };

    const deleteShare = async (shareId: string): Promise<void> => {
        await preventLeave(debouncedRequest(queryDeleteShare(shareId)));
    };

    return {
        createShare,
        deleteShare,
    };
}
