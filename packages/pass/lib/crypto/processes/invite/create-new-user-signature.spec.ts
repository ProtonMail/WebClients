import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto/lib';
import { createPassCoreProxy } from '@proton/pass/lib/core/core.proxy';
import type { PassCoreProxy } from '@proton/pass/lib/core/core.types';
import {
    createRandomKey,
    createRandomVaultKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '@proton/pass/lib/crypto/utils/testing';
import { PassSignatureContext } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { createNewUserSignatureFactory } from './create-new-user-signature';

describe('create new user invite signature', () => {
    let core: PassCoreProxy;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        core = createPassCoreProxy({} as any);
    });

    afterAll(async () => releaseCryptoProxy());

    test('should create valid detached signature payload', async () => {
        const shareKey = await createRandomVaultKey(0);
        const addressKey = await createRandomKey();
        const invitedEmail = 'test@proton.me';
        const signatureBody = await core.create_new_user_invite_signature_body(invitedEmail, shareKey.raw) as Uint8Array<ArrayBuffer>;

        const signature = await createNewUserSignatureFactory(core)({
            invitedEmail,
            inviterPrivateKey: addressKey.privateKey,
            shareKey,
        });

        const { verificationStatus } = await CryptoProxy.verifyMessage({
            binaryData: signatureBody,
            binarySignature: base64StringToUint8Array(signature),
            verificationKeys: [addressKey.publicKey],
            signatureContext: {
                value: PassSignatureContext.VaultInviteNewUser,
                required: true,
            },
        });

        expect(verificationStatus).toEqual(VERIFICATION_STATUS.SIGNED_AND_VALID);
    });
});
