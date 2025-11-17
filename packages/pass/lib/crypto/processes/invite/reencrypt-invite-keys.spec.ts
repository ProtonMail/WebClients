import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import {
    createRandomKey,
    createRandomVaultKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '@proton/pass/lib/crypto/utils/testing';

import { createInviteKeys } from './create-invite-keys';
import { reencryptInviteKeys } from './reencrypt-invite-keys';

describe('acceptVaultInvite crypto process', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should decrypt, re-encrypt & sign all vaultKeys with userKey', async () => {
        const vaultKeys = await Promise.all(
            Array.from({ length: 4 }).map((_, rotation) => createRandomVaultKey(rotation))
        );

        const userKey = await createRandomKey();
        const invitedKey = await createRandomKey();
        const inviterKeys = await Promise.all(Array.from({ length: 4 }).map(() => createRandomKey()));

        const inviteKeys = await createInviteKeys({
            targetKeys: vaultKeys,
            invitedPublicKey: invitedKey.publicKey,
            inviterPrivateKey: inviterKeys[2].privateKey,
        });

        const reencryptedKeys = await reencryptInviteKeys({
            inviteKeys,
            invitedPrivateKey: invitedKey.privateKey,
            inviterPublicKeys: inviterKeys.map((key) => key.privateKey),
            userKey: userKey,
        });

        const decryptedKeys = await Promise.all(
            reencryptedKeys.map(async (vaultKey) => {
                const binaryMessage = Uint8Array.fromBase64(vaultKey.Key);

                return CryptoProxy.decryptMessage({
                    binaryMessage,
                    decryptionKeys: userKey.privateKey,
                    verificationKeys: userKey.privateKey,
                    format: 'binary',
                });
            })
        );

        decryptedKeys.forEach(({ verificationStatus }) => expect(verificationStatus).toEqual(VERIFICATION_STATUS.SIGNED_AND_VALID));
        decryptedKeys.forEach(({ data }, i) => expect(data).toStrictEqual(vaultKeys[i].raw));
    });
});
