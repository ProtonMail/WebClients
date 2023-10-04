import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import {
    createRandomKey,
    createRandomVaultKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../utils/testing';
import { createVaultInvite } from './create-vault-invite';

describe('createVaultInvite crypto process', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should re-encrypt & sign all vaultKeys', async () => {
        const vaultKeys = await Promise.all(
            Array.from({ length: 4 }).map((_, rotation) => createRandomVaultKey(rotation))
        );

        const inviteeKey = await createRandomKey();
        const inviterKey = await createRandomKey();

        const inviteKeys = await createVaultInvite({
            vaultKeys,
            inviteePublicKey: inviteeKey.publicKey,
            inviterPrivateKey: inviterKey.privateKey,
        });

        const decryptedKeys = await Promise.all(
            inviteKeys.map(async (vaultKey) => {
                const binaryMessage = base64StringToUint8Array(vaultKey.Key);

                return CryptoProxy.decryptMessage({
                    binaryMessage,
                    decryptionKeys: inviteeKey.privateKey,
                    verificationKeys: inviterKey.publicKey,
                    format: 'binary',
                });
            })
        );

        decryptedKeys.forEach(({ verified }) => expect(verified).toEqual(VERIFICATION_STATUS.SIGNED_AND_VALID));
        decryptedKeys.forEach(({ data }, i) => expect(data).toStrictEqual(vaultKeys[i].raw));
    });
});
