import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto/lib';
import {
    createRandomKey,
    createRandomVaultKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '@proton/pass/lib/crypto/utils/testing';
import { PassSignatureContext } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { createNewUserSignature, createNewUserSignatureBody } from './create-new-user-signature';

describe('create new user invite signature', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should create valid detached signature payload', async () => {
        const shareKey = await createRandomVaultKey(0);
        const addressKey = await createRandomKey();
        const invitedEmail = 'test@proton.me';

        const signature = await createNewUserSignature({
            invitedEmail,
            inviterPrivateKey: addressKey.privateKey,
            shareKey,
        });

        const { verified } = await CryptoProxy.verifyMessage({
            binaryData: createNewUserSignatureBody({ invitedEmail, shareKey }),
            binarySignature: base64StringToUint8Array(signature),
            verificationKeys: [addressKey.publicKey],
            signatureContext: {
                value: PassSignatureContext.VaultInviteNewUser,
                required: true,
            },
        });

        expect(verified).toEqual(VERIFICATION_STATUS.SIGNED_AND_VALID);
    });
});
