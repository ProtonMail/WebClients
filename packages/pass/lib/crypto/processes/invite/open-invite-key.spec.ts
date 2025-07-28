import { CryptoProxy } from '@proton/crypto/lib/proxy';
import {
    createRandomKey,
    createRandomVaultKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '@proton/pass/lib/crypto/utils/testing';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { createInviteKeys } from './create-invite-keys';
import { openInviteKey } from './open-invite-key';

describe('open invite keys', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should decrypt target keys correctly', async () => {
        const vaultKey = await createRandomVaultKey(0);
        const invitedKey = await createRandomKey();
        const inviterKeys = await Promise.all(Array.from({ length: 4 }).map(() => createRandomKey()));

        const [inviteKey] = await createInviteKeys({
            targetKeys: [vaultKey],
            invitedPublicKey: invitedKey.publicKey,
            inviterPrivateKey: inviterKeys[2].privateKey,
        });

        const openedInviteKey = await openInviteKey({
            inviteKey,
            invitedPrivateKey: invitedKey.privateKey,
            inviterPublicKeys: inviterKeys.map((key) => key.publicKey),
        });

        expect(openedInviteKey).toStrictEqual(vaultKey.raw);
    });

    test('should throw if signature context cannot be verified', async () => {
        const vaultKey = await createRandomVaultKey(0);
        const invitedKey = await createRandomKey();
        const inviterKey = await createRandomKey();

        const inviteKey = {
            Key: uint8ArrayToBase64String(
                (
                    await CryptoProxy.encryptMessage({
                        binaryData: vaultKey.raw,
                        encryptionKeys: [invitedKey.publicKey],
                        signingKeys: [inviterKey.privateKey],
                        format: 'binary',
                        signatureContext: { value: 'WRONG_SIGNATURE_CONTEXT', critical: true },
                    })
                ).message
            ),
            KeyRotation: vaultKey.rotation,
        };

        await expect(() =>
            openInviteKey({
                inviteKey,
                invitedPrivateKey: invitedKey.privateKey,
                inviterPublicKeys: [inviterKey.publicKey],
            })
        ).rejects.toThrow();
    });
});
