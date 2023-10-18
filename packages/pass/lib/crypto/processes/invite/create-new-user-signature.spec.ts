import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto/lib';
import { PassSignatureContext } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import {
    createRandomKey,
    createRandomVaultKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../utils/testing';
import { createNewUserSignature, createNewUserSignatureBody } from './create-new-user-signature';

describe('create new user invite signature', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should create valid detached signature payload', async () => {
        const vaultKey = await createRandomVaultKey(0);
        const addressKey = await createRandomKey();
        const invitedEmail = 'test@proton.me';

        const signature = await createNewUserSignature({
            invitedEmail,
            inviterPrivateKey: addressKey.privateKey,
            vaultKey,
        });

        const { verified } = await CryptoProxy.verifyMessage({
            binaryData: createNewUserSignatureBody({ invitedEmail, vaultKey }),
            binarySignature: base64StringToUint8Array(signature),
            verificationKeys: [addressKey.publicKey],
            context: {
                value: PassSignatureContext.VaultInviteNewUser,
                required: true,
            },
        });

        expect(verified).toEqual(VERIFICATION_STATUS.SIGNED_AND_VALID);
    });
});
