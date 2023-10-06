import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { type KeyRotationKeyPair, PassSignatureContext } from '../../../types';

type OpenInviteKeyProcessParams = {
    inviteKey: KeyRotationKeyPair;
    inviteePrivateKey: PrivateKeyReference;
    inviterPublicKeys: PublicKeyReference[];
};

export const openInviteKey = async ({
    inviteKey,
    inviteePrivateKey,
    inviterPublicKeys,
}: OpenInviteKeyProcessParams): Promise<Uint8Array> =>
    (
        await CryptoProxy.decryptMessage({
            binaryMessage: base64StringToUint8Array(inviteKey.Key),
            decryptionKeys: inviteePrivateKey,
            verificationKeys: inviterPublicKeys,
            format: 'binary',
            context: {
                value: PassSignatureContext.VaultInviteInternal,
                required: true,
            },
        })
    ).data;
