import { CryptoProxy, type PrivateKeyReference } from '@protontech/crypto';

import { PassSignatureContext, type VaultShareKey } from '../../../../types';
import type { PassCoreProxy } from '../../../core/core.types';

type CreateNewUserSignatureProcessParams = {
    invitedEmail: string;
    inviterPrivateKey: PrivateKeyReference;
    shareKey: VaultShareKey;
};

export const createNewUserSignatureFactory =
    (core: PassCoreProxy) =>
    async (params: CreateNewUserSignatureProcessParams): Promise<string> => {
        const signatureBody = (await core.create_new_user_invite_signature_body(
            params.invitedEmail,
            params.shareKey.raw
        )) as Uint8Array<ArrayBuffer>;

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

        return signature.toBase64();
    };
