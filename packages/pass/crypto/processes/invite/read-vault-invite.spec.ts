import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { PassEncryptionTag } from '../../../types';
import { encryptData } from '../../utils';
import {
    createRandomKey,
    createRandomVaultKey,
    randomContents,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../utils/testing';
import { createInviteKeys } from './create-invite-keys';
import { readVaultInviteContent } from './read-vault-invite';

describe('read vault invite content', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should decrypt encrypted vault content correctly', async () => {
        const inviteeKey = await createRandomKey();
        const inviterKeys = await Promise.all(Array.from({ length: 4 }).map(() => createRandomKey()));

        const vaultKey = await createRandomVaultKey(0);
        const vaultContent = randomContents();
        const encryptedVaultContent = await encryptData(vaultKey.key, vaultContent, PassEncryptionTag.VaultContent);

        const [inviteKey] = await createInviteKeys({
            targetKeys: [vaultKey],
            inviteePublicKey: inviteeKey.publicKey,
            inviterPrivateKey: inviterKeys[0].privateKey,
        });

        const decryptedVaultContent = await readVaultInviteContent({
            inviteKey,
            encryptedVaultContent: uint8ArrayToBase64String(encryptedVaultContent),
            inviteePrivateKey: inviteeKey.privateKey,
            inviterPublicKeys: inviterKeys.map((key) => key.publicKey),
        });

        expect(decryptedVaultContent).toStrictEqual(vaultContent);
    });
});
