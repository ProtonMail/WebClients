import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { PassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import type { KeyRotationKeyPair } from '@proton/pass/types';
import { PassSignatureContext } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

type OpenInviteKeyProcessParams = {
    inviteKey: KeyRotationKeyPair;
    invitedPrivateKey: PrivateKeyReference;
    inviterPublicKeys: PublicKeyReference[];
};

export const openInviteKey = async ({
    inviteKey,
    invitedPrivateKey,
    inviterPublicKeys,
}: OpenInviteKeyProcessParams): Promise<Uint8Array> => {
    const { data, verificationStatus } = await CryptoProxy.decryptMessage({
        binaryMessage: base64StringToUint8Array(inviteKey.Key),
        decryptionKeys: invitedPrivateKey,
        verificationKeys: inviterPublicKeys,
        format: 'binary',
        signatureContext: {
            value: PassSignatureContext.VaultInviteExistingUser,
            required: true,
        },
    });

    if (verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) throw new PassCryptoError('Invalid invite key');
    return data;
};
