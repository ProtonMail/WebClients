import { CryptoProxy, type PrivateKeyReference } from '@proton/crypto/lib';
import type { PassCoreProxy } from '@proton/pass/lib/core/core.types';
import { PassSignatureContext, type VaultShareKey } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

type CreateNewUserSignatureProcessParams = {
    invitedEmail: string;
    inviterPrivateKey: PrivateKeyReference;
    shareKey: VaultShareKey;
};

export const createNewUserSignatureFactory =
    (core: PassCoreProxy) =>
    async (params: CreateNewUserSignatureProcessParams): Promise<string> => {
        const signatureBody = await core.create_new_user_invite_signature_body(
            params.invitedEmail,
            params.shareKey.raw
        );

        const signature = await CryptoProxy.signMessage({
            binaryData: signatureBody,
            signingKeys: [params.inviterPrivateKey],
            format: 'binary',
            detached: true,
            signatureContext: {
                value: PassSignatureContext.VaultInviteNewUser,
                critical: true,
            },
        });

        return uint8ArrayToBase64String(signature);
    };
