import {
    createRandomKey,
    createRandomVaultKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '@proton/pass/lib/crypto/utils/testing';

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

        const openedInviteKeys = await openInviteKey({
            inviteKey,
            invitedPrivateKey: invitedKey.privateKey,
            inviterPublicKeys: inviterKeys.map((key) => key.publicKey),
        });

        expect(openedInviteKeys).toStrictEqual(vaultKey.raw);
    });
});
