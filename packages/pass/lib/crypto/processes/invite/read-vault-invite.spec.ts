import { encryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import {
    createRandomKey,
    createRandomVaultKey,
    randomContents,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '@proton/pass/lib/crypto/utils/testing';
import { PassEncryptionTag } from '@proton/pass/types';

import { createInviteKeys } from './create-invite-keys';
import { readVaultInviteContent } from './read-vault-invite';

describe('read vault invite content', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should decrypt encrypted vault content correctly', async () => {
        const invitedKey = await createRandomKey();
        const inviterKeys = await Promise.all(Array.from({ length: 4 }).map(() => createRandomKey()));

        const vaultKey = await createRandomVaultKey(0);
        const vaultContent = randomContents();
        const encryptedVaultContent = await encryptData(vaultKey.key, vaultContent, PassEncryptionTag.VaultContent);

        const [inviteKey] = await createInviteKeys({
            targetKeys: [vaultKey],
            invitedPublicKey: invitedKey.publicKey,
            inviterPrivateKey: inviterKeys[0].privateKey,
        });

        const decryptedVaultContent = await readVaultInviteContent({
            inviteKey,
            encryptedVaultContent: encryptedVaultContent.toBase64(),
            invitedPrivateKey: invitedKey.privateKey,
            inviterPublicKeys: inviterKeys.map((key) => key.publicKey),
        });

        expect(decryptedVaultContent).toStrictEqual(vaultContent);
    });
});
