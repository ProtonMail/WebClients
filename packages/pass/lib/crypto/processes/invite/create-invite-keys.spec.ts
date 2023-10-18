import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { PassSignatureContext } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import {
    createRandomKey,
    createRandomVaultKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../utils/testing';
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
                const binaryMessage = base64StringToUint8Array(vaultKey.Key);

                return CryptoProxy.decryptMessage({
                    binaryMessage,
                    decryptionKeys: invitedKey.privateKey,
                    verificationKeys: inviterKey.publicKey,
                    format: 'binary',
                    context: {
                        value: PassSignatureContext.VaultInviteExistingUser,
                        required: true,
                    },
                });
            })
        );

        decryptedKeys.forEach(({ verified }) => expect(verified).toEqual(VERIFICATION_STATUS.SIGNED_AND_VALID));
        decryptedKeys.forEach(({ data }, i) => expect(data).toStrictEqual(vaultKeys[i].raw));
    });
});
