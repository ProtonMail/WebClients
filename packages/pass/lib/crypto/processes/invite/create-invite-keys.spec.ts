import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import {
    createRandomKey,
    createRandomVaultKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '@proton/pass/lib/crypto/utils/testing';
import { PassSignatureContext } from '@proton/pass/types';

import { createInviteKeys } from './create-invite-keys';

describe('create invite keys crypto process', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should re-encrypt & sign all vaultKeys', async () => {
        const vaultKeys = await Promise.all(
            Array.from({ length: 4 }).map((_, rotation) => createRandomVaultKey(rotation))
        );

        const invitedKey = await createRandomKey();
        const inviterKey = await createRandomKey();

        const inviteKeys = await createInviteKeys({
            targetKeys: vaultKeys,
            invitedPublicKey: invitedKey.publicKey,
            inviterPrivateKey: inviterKey.privateKey,
        });

        const decryptedKeys = await Promise.all(
            inviteKeys.map(async (vaultKey) => {
                const binaryMessage = Uint8Array.fromBase64(vaultKey.Key);

                return CryptoProxy.decryptMessage({
                    binaryMessage,
                    decryptionKeys: invitedKey.privateKey,
                    verificationKeys: inviterKey.publicKey,
                    format: 'binary',
                    signatureContext: {
                        value: PassSignatureContext.VaultInviteExistingUser,
                        required: true,
                    },
                });
            })
        );

        decryptedKeys.forEach(({ verificationStatus }) => expect(verificationStatus).toEqual(VERIFICATION_STATUS.SIGNED_AND_VALID));
        decryptedKeys.forEach(({ data }, i) => expect(data).toStrictEqual(vaultKeys[i].raw));
    });
});
